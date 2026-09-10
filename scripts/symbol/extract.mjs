/**
 * Extracts WinUI's Symbol table from the control pin into a committed record.
 *
 * The pin states the table three times in independent grammars, so each is parsed rather than
 * trusting a single convenient source. Their cross-check makes an incorrect pair a failed
 * extraction instead of a glyph that merely looks plausible.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
// The token layer was the first consumer of this checkout, so its fetcher owns the shared pin
// locator rather than creating a second place that could re-pin the same source differently.
import { CHECKOUT, ROOT, UPSTREAM, head } from '../tokens/fetch.mjs';

const ICON = 'dxaml/xcp/core/core/elements/icon.cpp';
const ENUM = 'dxaml/xcp/components/metadata/inc/EnumDefs.g.h';
const NOTE = 'docs/design-notes/symbol-enum-spec.md';
const FILES = [ICON, ENUM, NOTE];
const OUTPUT = join(ROOT, 'data', 'winui-symbol.json');

const lines = (path) => readFileSync(join(CHECKOUT, path), 'utf8').split('\n');
const clean = (line) => line.replace(/\r$/, '');

function region(source, path, start, label) {
	const at = source.findIndex((line) => start.test(clean(line)));
	if (at === -1) throw new Error(`${path}: cannot find ${label}`);
	return at;
}

function parseIcon() {
	const source = lines(ICON);
	const signature = region(
		source,
		ICON,
		/WCHAR CSymbolIcon::ConvertSymbolValueToGlyph\(const UINT32 symbolValue\)/,
		'CSymbolIcon::ConvertSymbolValueToGlyph'
	);
	const switchAt = source.findIndex(
		(line, index) => index > signature && /switch \(symbolValue\)/.test(clean(line))
	);
	if (switchAt === -1) throw new Error(`${ICON}: cannot find switch (symbolValue)`);
	const open = source.findIndex((line, index) => index > switchAt && clean(line).trim() === '{');
	if (open === -1) throw new Error(`${ICON}: cannot find switch opening brace`);
	const close = source.findIndex((line, index) => index > open && clean(line).trim() === '};');
	if (close === -1) throw new Error(`${ICON}: cannot find switch closing brace`);

	const rows = [];
	for (let index = open + 1; index < close; index += 1) {
		const line = clean(source[index]);
		if (!line.trim()) continue;
		const match =
			/^\s*case 0x([0-9A-Fa-f]{4}): return static_cast<WCHAR>\(0x([0-9A-Fa-f]{4})\); \/\/ (\w+)$/.exec(
				line
			);
		if (!match) throw new Error(`${ICON}:${index + 1}: cannot parse ${line}`);
		rows.push({ name: match[3], legacy: match[1].toUpperCase(), glyph: match[2].toUpperCase() });
	}
	return rows;
}

function parseEnum() {
	const source = lines(ENUM);
	const declaration = region(source, ENUM, /^\s*enum class Symbol\s*$/, 'enum class Symbol');
	const open = source.findIndex((line, index) => index > declaration && clean(line).trim() === '{');
	if (open === -1) throw new Error(`${ENUM}: cannot find enum opening brace`);
	const close = source.findIndex((line, index) => index > open && clean(line).trim() === '};');
	if (close === -1) throw new Error(`${ENUM}: cannot find enum closing brace`);

	const rows = [];
	for (let index = open + 1; index < close; index += 1) {
		const line = clean(source[index]);
		if (!line.trim()) continue;
		const match = /^\s*(\w+)\s*=\s*(\d+),?$/.exec(line);
		if (!match) throw new Error(`${ENUM}:${index + 1}: cannot parse ${line}`);
		rows.push({
			name: match[1],
			legacy: Number(match[2]).toString(16).toUpperCase().padStart(4, '0')
		});
	}
	return rows;
}

function parseNote() {
	const source = lines(NOTE);
	const header = region(source, NOTE, /^\| Icon Name/, 'table header');
	const separator = header + 1;
	if (separator >= source.length || !clean(source[separator]).startsWith('|'))
		throw new Error(`${NOTE}:${separator + 1}: cannot parse table separator`);

	const rows = [];
	for (
		let index = separator + 1;
		index < source.length && clean(source[index]).startsWith('|');
		index += 1
	) {
		const line = clean(source[index]);
		const match = /^\|\s*(\w+)\s*\|\s*([0-9A-Fa-f]{4})\s*\|\s*([0-9A-Fa-f]{4})\s*\|\s*$/.exec(line);
		if (!match) throw new Error(`${NOTE}:${index + 1}: cannot parse ${line}`);
		rows.push({ name: match[1], legacy: match[2].toUpperCase(), glyph: match[3].toUpperCase() });
	}
	return rows;
}

function duplicateRows(rows, key, path) {
	const grouped = new Map();
	for (const row of rows) grouped.set(row[key], [...(grouped.get(row[key]) ?? []), row.name]);
	return [...grouped]
		.filter(([, names]) => names.length > 1)
		.map(([value, names]) => `${path}: duplicate ${key} ${value} (${names.join(', ')})`);
}

function pairDifferences(authority, witness, fields, path) {
	const byName = new Map(witness.map((row) => [row.name, row]));
	const differences = [];
	for (const row of authority) {
		const found = byName.get(row.name);
		if (!found) {
			differences.push(`${path}: missing ${row.name}`);
			continue;
		}
		for (const field of fields) {
			if (row[field] !== found[field])
				differences.push(
					`${path}: ${row.name} ${field} is ${found[field]}, expected ${row[field]}`
				);
		}
	}
	const authorityNames = new Set(authority.map((row) => row.name));
	for (const row of witness) {
		if (!authorityNames.has(row.name)) differences.push(`${path}: unexpected ${row.name}`);
	}
	return differences;
}

function corroborate(icon, enumeration, note) {
	const disagreements = [
		...duplicateRows(icon, 'name', ICON),
		...duplicateRows(enumeration, 'name', ENUM),
		...duplicateRows(note, 'name', NOTE),
		...duplicateRows(icon, 'legacy', ICON),
		...duplicateRows(enumeration, 'legacy', ENUM),
		...duplicateRows(note, 'legacy', NOTE)
	];
	for (const [path, rows] of [
		[ENUM, enumeration],
		[NOTE, note]
	]) {
		if (rows.length !== icon.length)
			disagreements.push(`${path}: ${rows.length} rows, ${ICON} has ${icon.length}`);
	}
	// The enum is value-ordered while the switch and note are alphabetical, so order is not a
	// correctness condition. Compare the name-keyed pairs instead.
	disagreements.push(...pairDifferences(icon, enumeration, ['legacy'], ENUM));
	disagreements.push(...pairDifferences(icon, note, ['legacy', 'glyph'], NOTE));
	if (disagreements.length)
		throw new Error(`Symbol source cross-check failed:\n${disagreements.join('\n')}`);
}

export function record() {
	const symbols = parseIcon();
	const enumeration = parseEnum();
	const note = parseNote();
	corroborate(symbols, enumeration, note);
	const glyphUses = new Map();
	for (const symbol of symbols) glyphUses.set(symbol.glyph, (glyphUses.get(symbol.glyph) ?? 0) + 1);
	return {
		source: {
			repo: UPSTREAM.url,
			commit: UPSTREAM.commit,
			files: FILES,
			fileCount: FILES.length,
			extractedAt: new Date().toISOString().slice(0, 10)
		},
		census: {
			symbols: symbols.length,
			remapped: symbols.filter((symbol) => symbol.legacy !== symbol.glyph).length,
			unchanged: symbols.filter((symbol) => symbol.legacy === symbol.glyph).length,
			sharedGlyphs: [...glyphUses.values()].filter((uses) => uses > 1).length
		},
		symbols
	};
}

export const census = (doc) =>
	[
		`source            ${doc.source.repo} ${doc.source.commit}`,
		`symbols           ${doc.census.symbols}`,
		`remapped          ${doc.census.remapped}`,
		`unchanged         ${doc.census.unchanged}`,
		`shared glyphs     ${doc.census.sharedGlyphs}`
	].join('\n');

function main(argv) {
	const at = head();
	if (at !== UPSTREAM.commit) {
		const state = at === null ? 'is missing' : `is at ${at}`;
		throw new Error(
			`.upstream/microsoft-ui-xaml ${state}, not ${UPSTREAM.commit}. Run \`pnpm tokens:fetch\`.`
		);
	}
	const doc = record();
	if (argv.includes('--check')) {
		if (!existsSync(OUTPUT)) throw new Error(`${relative(ROOT, OUTPUT)} does not exist.`);
		const committed = JSON.parse(readFileSync(OUTPUT, 'utf8'));
		const strip = (candidate) => {
			const source = { ...candidate.source };
			delete source.extractedAt;
			return { ...candidate, source };
		};
		if (JSON.stringify(strip(committed)) !== JSON.stringify(strip(doc)))
			throw new Error(`${relative(ROOT, OUTPUT)} differs from the extractor.`);
		console.log(`${relative(ROOT, OUTPUT)} matches the extractor (${doc.census.symbols} symbols).`);
		return;
	}
	mkdirSync(dirname(OUTPUT), { recursive: true });
	writeFileSync(OUTPUT, `${JSON.stringify(doc, null, '\t')}\n`);
	console.log(census(doc));
	console.log(`written           ${relative(ROOT, OUTPUT)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	try {
		main(process.argv.slice(2));
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
