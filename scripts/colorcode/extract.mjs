import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	CHECKOUT as COLORCODE_CHECKOUT,
	head as colorcodeHead,
	ROOT,
	UPSTREAM as COLORCODE_UPSTREAM
} from './fetch.mjs';
import {
	CHECKOUT as GALLERY_CHECKOUT,
	head as galleryHead,
	UPSTREAM as GALLERY_UPSTREAM
} from '../gallery/fetch.mjs';

const OUTPUT = join(ROOT, 'data', 'colorcode.json');

// Named, never indexed out of a list. Each read below wants one specific file, and a
// positional index is only ever the right file by an accident of ordering — the same
// reason `scripts/gallery/extract.mjs` names its non-section sources.
const SCOPE_NAMES = 'ColorCode.Core/Common/ScopeName.cs';
const LANGUAGE_IDS = 'ColorCode.Core/Common/LanguageId.cs';
const COLOR_CONSTANTS = 'ColorCode.Core/Styling/StyleDictionary.cs';
const LIGHT_STYLES = 'ColorCode.Core/Styling/StyleDictionary.DefaultLight.cs';
const DARK_STYLES = 'ColorCode.Core/Styling/StyleDictionary.DefaultDark.cs';
const XML_LANGUAGE = 'ColorCode.Core/Compilation/Languages/Xml.cs';
const CSHARP_LANGUAGE = 'ColorCode.Core/Compilation/Languages/CSharp.cs';

// The provenance list is the read list. `LanguageId.cs` is on it because a language's `Id`
// is a constant defined there and nowhere else: a record that hashes every file but the one
// its two language ids come from vouches for less than it reports.
const COLORCODE_FILES = [
	SCOPE_NAMES,
	LANGUAGE_IDS,
	COLOR_CONSTANTS,
	LIGHT_STYLES,
	DARK_STYLES,
	XML_LANGUAGE,
	CSHARP_LANGUAGE
];
const SAMPLE_CODE_PRESENTER = 'WinUIGallery/Controls/SampleCodePresenter.xaml.cs';
const GALLERY_FILES = [SAMPLE_CODE_PRESENTER];

const readColorCode = (path) => readFileSync(join(COLORCODE_CHECKOUT, path), 'utf8');
const readGallery = (path) => readFileSync(join(GALLERY_CHECKOUT, path), 'utf8');

function requireCheckout(at, checkout, commit, command) {
	if (at === commit) return;
	const state = at === null ? 'is missing' : `is at ${at || 'no commit'}`;
	throw new Error(`${checkout} ${state}, not ${commit}. Run \`${command}\`.`);
}

function parseNormalString(source, start) {
	if (source[start] !== '"') throw new Error(`expected a C# string at offset ${start}`);
	let value = '';
	for (let i = start + 1; i < source.length; i++) {
		const char = source[i];
		if (char === '"') return { value, end: i + 1 };
		if (char !== '\\') {
			value += char;
			continue;
		}
		const escaped = source[++i];
		const escapes = { 0: '\0', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v' };
		value += escapes[escaped] ?? escaped;
	}
	throw new Error(`unterminated C# string at offset ${start}`);
}

function parseVerbatimString(source, start) {
	if (source.slice(start, start + 2) !== '@"') {
		throw new Error(`expected a C# verbatim string at offset ${start}`);
	}
	let value = '';
	for (let i = start + 2; i < source.length; i++) {
		if (source[i] !== '"') {
			value += source[i];
			continue;
		}
		if (source[i + 1] === '"') {
			value += '"';
			i++;
			continue;
		}
		return { value, end: i + 1 };
	}
	throw new Error(`unterminated C# verbatim string at offset ${start}`);
}

function findMatchingBrace(source, open) {
	let depth = 0;
	for (let i = open; i < source.length; i++) {
		if (source[i] === '@' && source[i + 1] === '"') {
			i = parseVerbatimString(source, i).end - 1;
			continue;
		}
		if (source[i] === '"') {
			i = parseNormalString(source, i).end - 1;
			continue;
		}
		if (source[i] === "'") {
			i++;
			continue;
		}
		if (source[i] === '/' && source[i + 1] === '/') {
			i = source.indexOf('\n', i + 2);
			if (i < 0) return source.length - 1;
			continue;
		}
		if (source[i] === '/' && source[i + 1] === '*') {
			i = source.indexOf('*/', i + 2);
			if (i < 0) throw new Error('unterminated C# block comment');
			i++;
			continue;
		}
		if (source[i] === '{') depth++;
		if (source[i] === '}' && --depth === 0) return i;
	}
	throw new Error(`unterminated brace at offset ${open}`);
}

function parseConstants(source, visibility) {
	const constants = {};
	const pattern = new RegExp(
		`\\b${visibility}\\s+const\\s+string\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*"`,
		'g'
	);
	for (const match of source.matchAll(pattern)) {
		const { value } = parseNormalString(source, match.index + match[0].length - 1);
		constants[match[1]] = value;
	}
	return constants;
}

function resolveValue(raw, constants, what) {
	const value = raw.trim();
	if (value.startsWith('"')) return parseNormalString(value, 0).value;
	if (value in constants) return constants[value];
	throw new Error(`${what} refers to unknown value ${value}`);
}

function parseStyles(source, constants, scopeNames) {
	const styles = [];
	const pattern = /new\s+Style\s*\(\s*ScopeName\.([A-Za-z_][A-Za-z0-9_]*)\s*\)/g;
	for (const match of source.matchAll(pattern)) {
		const open = source.indexOf('{', match.index + match[0].length);
		if (open < 0) throw new Error(`style ${match[1]} has no initializer`);
		const close = findMatchingBrace(source, open);
		const body = source.slice(open + 1, close);
		const properties = {};
		for (const property of ['Foreground', 'Background', 'ReferenceName', 'Italic', 'Bold']) {
			const propertyMatch = body.match(new RegExp(`\\b${property}\\s*=\\s*([^,\\r\\n}]+)`));
			if (!propertyMatch) continue;
			const raw = propertyMatch[1].trim();
			properties[property] = raw === 'true' || raw === 'false' ? raw === 'true' : raw;
		}
		if (!(match[1] in scopeNames)) throw new Error(`style refers to unknown scope ${match[1]}`);
		styles.push({
			scope: scopeNames[match[1]],
			foreground:
				properties.Foreground === undefined
					? null
					: resolveValue(properties.Foreground, constants, `style ${match[1]} foreground`),
			background:
				properties.Background === undefined
					? null
					: resolveValue(properties.Background, constants, `style ${match[1]} background`),
			referenceName:
				properties.ReferenceName === undefined
					? null
					: resolveValue(properties.ReferenceName, {}, `style ${match[1]} reference name`),
			italic: properties.Italic ?? false,
			bold: properties.Bold ?? false
		});
	}
	return styles;
}

function maskComments(source) {
	const chars = source.split('');
	for (let i = 0; i < source.length; i++) {
		if (source[i] === '@' && source[i + 1] === '"') {
			i = parseVerbatimString(source, i).end - 1;
			continue;
		}
		if (source[i] === '"') {
			i = parseNormalString(source, i).end - 1;
			continue;
		}
		if (source[i] === '/' && source[i + 1] === '/') {
			for (let j = i; j < source.length && source[j] !== '\n'; j++) chars[j] = ' ';
			continue;
		}
		if (source[i] === '/' && source[i + 1] === '*') {
			const end = source.indexOf('*/', i + 2);
			if (end < 0) throw new Error('unterminated C# block comment');
			for (let j = i; j < end + 2; j++) {
				if (source[j] !== '\n' && source[j] !== '\r') chars[j] = ' ';
			}
			i = end + 1;
		}
	}
	return chars.join('');
}

function propertyReturn(source, property, what) {
	const match = source.match(
		new RegExp(`public\\s+string\\s+${property}\\b[\\s\\S]*?return\\s+([^;]+);`)
	);
	if (!match) throw new Error(`${what} has no ${property} return`);
	const raw = match[1].trim();
	if (raw.startsWith('"')) return parseNormalString(raw, 0).value;
	return raw;
}

function parseLanguage(source, languageIds, scopeNames) {
	const code = maskComments(source);
	const classMatch = source.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s*:/);
	if (!classMatch) throw new Error('language class not found');
	const className = classMatch[1];
	const idReference = propertyReturn(source, 'Id', className);
	const idName = idReference.match(/^LanguageId\.([A-Za-z_][A-Za-z0-9_]*)$/)?.[1];
	if (!idName || !(idName in languageIds))
		throw new Error(`${className} has unknown language id ${idReference}`);
	const rules = [];
	for (const match of code.matchAll(/new\s+LanguageRule\s*\(/g)) {
		let cursor = match.index + match[0].length;
		while (/\s/.test(code[cursor])) cursor++;
		const pattern = parseVerbatimString(source, cursor);
		const dictionary = code.indexOf('new Dictionary<int, string>', pattern.end);
		if (dictionary < 0) throw new Error(`${className} rule has no capture dictionary`);
		const open = code.indexOf('{', dictionary);
		if (open < 0) throw new Error(`${className} rule has no capture dictionary body`);
		const close = findMatchingBrace(source, open);
		const captures = {};
		for (const capture of code
			.slice(open + 1, close)
			.matchAll(/\{\s*(\d+)\s*,\s*ScopeName\.([A-Za-z_][A-Za-z0-9_]*)\s*\}/g)) {
			if (!(capture[2] in scopeNames))
				throw new Error(`${className} rule refers to unknown scope ${capture[2]}`);
			captures[capture[1]] = scopeNames[capture[2]];
		}
		rules.push({ pattern: pattern.value, captures });
	}
	const aliasesStart = source.indexOf('public bool HasAlias');
	const aliasesEnd = source.indexOf('public override', aliasesStart);
	if (aliasesStart < 0 || aliasesEnd < 0) throw new Error(`${className} has no HasAlias method`);
	const aliases = [...source.slice(aliasesStart, aliasesEnd).matchAll(/case\s+"([^"]+)"\s*:/g)].map(
		(match) => match[1]
	);
	return {
		id: languageIds[idName],
		name: propertyReturn(source, 'Name', className),
		cssClassName: propertyReturn(source, 'CssClassName', className),
		aliases,
		rules
	};
}

function parseGalleryOverrides(source, scopeNames) {
	const start = source.indexOf('private void UpdateFormatterDarkThemeColors');
	if (start < 0) throw new Error('UpdateFormatterDarkThemeColors is missing');
	const end = source.indexOf('\n    }', start);
	if (end < 0) throw new Error('UpdateFormatterDarkThemeColors has no closing brace');
	const body = source.slice(start, end);
	const removed = [
		...body.matchAll(
			/formatter\.Styles\.Remove\(formatter\.Styles\[ScopeName\.([A-Za-z_][A-Za-z0-9_]*)\]\)/g
		)
	].map((match) => scopeNames[match[1]]);
	const added = [];
	for (const match of body.matchAll(
		/new\s+ColorCode\.Styling\.Style\(ScopeName\.([A-Za-z_][A-Za-z0-9_]*)\)\s*\{([\s\S]*?)\}/g
	)) {
		const foreground = match[2].match(/Foreground\s*=\s*"([^"]*)"/)?.[1] ?? null;
		const referenceName = match[2].match(/ReferenceName\s*=\s*"([^"]*)"/)?.[1] ?? null;
		added.push({ scope: scopeNames[match[1]], foreground, referenceName });
	}
	if (
		removed.some((scope) => scope === undefined) ||
		added.some((style) => style.scope === undefined)
	) {
		throw new Error('Gallery override refers to an unknown scope');
	}
	return { removed, added };
}

function fileProvenance(checkout, files) {
	return files.map((path) => ({
		path,
		sha256: createHash('sha256')
			.update(readFileSync(join(checkout, path)))
			.digest('hex')
	}));
}

function validateReachableForegrounds(record) {
	const reachable = new Set(['Plain Text']);
	for (const language of record.languages) {
		for (const rule of language.rules) {
			for (const scope of Object.values(rule.captures)) reachable.add(scope);
		}
	}
	const light = new Map(record.palette.light.map((style) => [style.scope, style]));
	const dark = new Map(record.palette.dark.map((style) => [style.scope, style]));
	for (const scope of record.palette.galleryDark.removed) dark.delete(scope);
	for (const style of record.palette.galleryDark.added) dark.set(style.scope, style);
	const valid = /^#[0-9A-Fa-f]{8}$/;
	for (const scope of reachable) {
		for (const [theme, styles] of [
			['light', light],
			['dark', dark]
		]) {
			const foreground = styles.get(scope)?.foreground ?? null;
			if (foreground !== null && !valid.test(foreground)) {
				throw new Error(
					`reachable scope ${JSON.stringify(scope)} has malformed ${theme} foreground ${JSON.stringify(foreground)}`
				);
			}
		}
	}
	return reachable.size;
}

export function record() {
	requireCheckout(
		colorcodeHead(),
		COLORCODE_CHECKOUT,
		COLORCODE_UPSTREAM.commit,
		'pnpm colorcode:fetch'
	);
	requireCheckout(galleryHead(), GALLERY_CHECKOUT, GALLERY_UPSTREAM.commit, 'pnpm gallery:fetch');
	const scopeNames = parseConstants(readColorCode(SCOPE_NAMES), 'public');
	const colorConstants = parseConstants(readColorCode(COLOR_CONSTANTS), 'public');
	// The dark dictionary keeps its own private constants beside the shared public ones, and
	// a style there may name either.
	const darkConstants = parseConstants(readColorCode(DARK_STYLES), 'private');
	const styles = { ...colorConstants, ...darkConstants };
	const light = parseStyles(readColorCode(LIGHT_STYLES), styles, scopeNames);
	const dark = parseStyles(readColorCode(DARK_STYLES), styles, scopeNames);
	const languageIds = parseConstants(readColorCode(LANGUAGE_IDS), 'public');
	const languages = [
		parseLanguage(readColorCode(XML_LANGUAGE), languageIds, scopeNames),
		parseLanguage(readColorCode(CSHARP_LANGUAGE), languageIds, scopeNames)
	];
	const galleryDark = parseGalleryOverrides(readGallery(SAMPLE_CODE_PRESENTER), scopeNames);
	const result = {
		source: {
			repository: 'CommunityToolkit/ColorCode-Universal',
			url: COLORCODE_UPSTREAM.url,
			ref: COLORCODE_UPSTREAM.ref,
			commit: COLORCODE_UPSTREAM.commit,
			extractedAt: new Date().toISOString().slice(0, 10),
			fileCount: COLORCODE_FILES.length,
			files: fileProvenance(COLORCODE_CHECKOUT, COLORCODE_FILES)
		},
		gallery: {
			repository: 'microsoft/WinUI-Gallery',
			commit: GALLERY_UPSTREAM.commit,
			fileCount: GALLERY_FILES.length,
			files: fileProvenance(GALLERY_CHECKOUT, GALLERY_FILES)
		},
		census: {
			scopeNames: Object.keys(scopeNames).length,
			colorConstants: Object.keys(colorConstants).length,
			lightStyles: light.length,
			darkStyles: dark.length,
			overridesRemoved: galleryDark.removed.length,
			overridesAdded: galleryDark.added.length,
			languages: languages.length,
			rules: { xml: languages[0].rules.length, csharp: languages[1].rules.length },
			reachableScopes: 0
		},
		scopeNames,
		colorConstants,
		palette: { light, dark, galleryDark },
		languages
	};
	result.census.reachableScopes = validateReachableForegrounds(result);
	return result;
}

function censusLine(doc) {
	const c = doc.census;
	return [
		`scope names       ${c.scopeNames}`,
		`colour constants  ${c.colorConstants}`,
		`light styles      ${c.lightStyles}`,
		`dark styles       ${c.darkStyles}`,
		`dark overrides    ${c.overridesRemoved} removed, ${c.overridesAdded} added`,
		`languages         ${c.languages}`,
		`rules             XML ${c.rules.xml}, C# ${c.rules.csharp}`,
		`reachable scopes  ${c.reachableScopes}`
	].join('\n');
}

function difference(a, b, path = '') {
	const at = path || '(root)';
	if (a === b) return null;
	if (
		Array.isArray(a) !== Array.isArray(b) ||
		typeof a !== typeof b ||
		(a === null) !== (b === null)
	)
		return `${at}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`;
	if (Array.isArray(a)) {
		for (let i = 0; i < Math.max(a.length, b.length); i++) {
			const found = difference(a[i], b[i], `${path}[${i}]`);
			if (found) return found;
		}
		return null;
	}
	if (a !== null && typeof a === 'object') {
		for (const key of [...new Set([...Object.keys(a), ...Object.keys(b)])]) {
			const found = difference(a[key], b[key], path ? `${path}.${key}` : key);
			if (found) return found;
		}
		return null;
	}
	return `${at}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`;
}

function withoutExtractedAt(value) {
	const source = { ...value.source };
	delete source.extractedAt;
	return { ...value, source };
}

function main(argv) {
	const fresh = record();
	if (argv.includes('--check')) {
		if (!existsSync(OUTPUT)) throw new Error(`${relative(ROOT, OUTPUT)} does not exist.`);
		const committed = JSON.parse(readFileSync(OUTPUT, 'utf8'));
		const found = difference(withoutExtractedAt(committed), withoutExtractedAt(fresh));
		if (found) throw new Error(`${relative(ROOT, OUTPUT)} differs from the extractor: ${found}`);
		console.log(`${relative(ROOT, OUTPUT)} matches the extractor.`);
		return;
	}
	mkdirSync(dirname(OUTPUT), { recursive: true });
	writeFileSync(OUTPUT, `${JSON.stringify(fresh, null, '\t')}\n`);
	console.log(censusLine(fresh));
	console.log(`written           ${relative(ROOT, OUTPUT)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	try {
		main(process.argv.slice(2));
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
