import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACCENT_COLORS, EXCLUDED, SOURCE_FILES, SYSTEM_COLORS } from './manifest.mjs';

/**
 * The v1 token CSS, generated from the committed extraction.
 *
 * `generate()` returns file contents rather than writing them, so C2 can ask what the
 * output should be without a disk write of its own — a parity gate that had to write
 * first would be reporting on its own side effect.
 *
 * Everything this file cannot convert is a stop. A generator that guesses produces a
 * stylesheet that looks complete and is wrong somewhere nobody is looking, which is
 * the one failure mode a token layer cannot afford: a dropped declaration is invisible
 * until a control is built on top of it.
 */

// `new URL(...).pathname` is a URL component — percent-encoded, and on Windows
// `file:///C:/repo` yields `/C:/repo`, which no `readFile` can open. D6 puts a Windows
// runner in the plan, so this is not hypothetical.
const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '');

const RECORD = 'data/winui-tokens.json';
const OUTPUT = 'packages/winui-svelte/src/lib/tokens/tokens.css';

const fail = (message) => {
	throw new Error(message);
};

/** Where a record came from, for a failure message that can be acted on. */
const at = (record) => `${record.key} (${record.file}:${record.line})`;

// `Default` is the dark theme, not a neutral fallback: WinUI's fallback dictionary
// holds the dark values, and every file carrying a `Default` also carries an explicit
// `Light`. ADR 0005.
const DARK = 'Default';
const LIGHT = 'Light';
const HIGH_CONTRAST = 'HighContrast';
const THEMED = [DARK, LIGHT, HIGH_CONTRAST];

// `{ThemeResource X}` and `{StaticResource X}` differ only in when XAML re-evaluates
// the lookup, and `var()` re-evaluates unconditionally — so both become `var(--winui-X)`
// and the distinction has nowhere to go.
const REFERENCE = /^\{(?:Theme|Static)Resource\s+([^}]+)\}$/;

// The colors XAML spells by name. An allowlist rather than a passthrough: a XAML color
// name CSS does not share would otherwise become a declaration the browser drops, which
// is indistinguishable from a token nobody defined.
const NAMED_COLORS = new Set(['transparent', 'white', 'black', 'lightgray']);

// Prettier formats this file like every other tracked one, so the generator has to emit
// what Prettier would. It measures a tab as `tabWidth`.
const PRINT_WIDTH = 100;
const TAB_WIDTH = 2;

/* -------------------------------------------------------------------------- value conversion */

function color(raw, where) {
	const value = raw.trim();

	if (!value.startsWith('#')) {
		if (!NAMED_COLORS.has(value.toLowerCase())) fail(`${where}: unknown color name \`${value}\``);
		return value.toLowerCase();
	}

	const digits = value.slice(1);
	if (!/^[0-9a-fA-F]{6}$/.test(digits) && !/^[0-9a-fA-F]{8}$/.test(digits))
		fail(`${where}: \`${value}\` is not a 6- or 8-digit hex color`);

	// WinUI writes `#AARRGGBB`, alpha first; CSS 8-digit hex is `#RRGGBBAA`, alpha last.
	// The conversion is a reordering — no channel is recomputed, so the alpha-composited
	// model ADR 0001 exists to preserve arrives intact.
	//
	// Lower case because Prettier lower-cases hex. Emitting upper case would make
	// `pnpm format` rewrite the file and C2 then report the generator as stale.
	const hex = digits.toLowerCase();
	return digits.length === 6 ? `#${hex}` : `#${hex.slice(2)}${hex.slice(0, 2)}`;
}

function percent(opacity, where) {
	const value = Number(opacity);
	if (!Number.isFinite(value) || value < 0 || value > 1)
		fail(`${where}: opacity \`${opacity}\` is not a number between 0 and 1`);

	// `0.9 * 100` is `90.00000000000001` in binary floating point. Six decimals is exact
	// for any opacity a stylesheet can express, and `Number` then drops the zeros.
	return `${Number((value * 100).toFixed(6))}%`;
}

// The eight `SystemColor*ColorBrush` keys, each mapped to the system color it names.
// Derived from the manifest rather than matched by shape, because the rule is these eight
// keys and nothing else: a name that merely looks like one of them is not one.
const SYSTEM_COLOR_BRUSHES = new Map(Object.keys(SYSTEM_COLORS).map((key) => [`${key}Brush`, key]));

// The light-and-dark half of WinUI's tripwire pair. Evidence, never the rule — see below.
const MAGENTA = '#FF00FF';

/**
 * One of the eight system-color brushes, always as an alias to a system color.
 *
 * Under `HighContrast` the source already writes that alias and this returns what it
 * writes, so nothing there changes. Under `Default` and `Light` it writes `#FF00FF`.
 */
function systemColorBrush(record, reference, where) {
	// WD-001: `#FF00FF` is what a system color is worth in the two dictionaries that never
	// read one, exactly as `#FF0000` is what a palette color is worth in the one that never
	// reads those — so these eight alias what HighContrast already binds them to, and light
	// and dark stop disagreeing with it; see docs/divergences.md.
	const referenced = reference?.[1].trim();
	if (referenced && referenced in SYSTEM_COLORS) return `var(--winui-${referenced})`;

	// Keyed on the resource name, and only then checked against the tripwire value. Were it
	// the other way round, an upstream change of the literal would quietly turn these eight
	// back into magenta rather than stopping here.
	if (record.color.trim().toUpperCase() !== MAGENTA)
		fail(
			`${where}: a system-color brush whose color is \`${record.color.trim()}\` — neither ` +
				'the tripwire nor a reference to a system color. Upstream may have given it a real ' +
				'value; decide what it means before aliasing it away.'
		);

	return `var(--winui-${SYSTEM_COLOR_BRUSHES.get(record.key)})`;
}

function brush(record) {
	const where = at(record);
	if (record.color === undefined) fail(`${where}: brush with no Color`);

	const reference = REFERENCE.exec(record.color.trim());
	let base;
	if (SYSTEM_COLOR_BRUSHES.has(record.key)) base = systemColorBrush(record, reference, where);
	else if (reference) base = `var(--winui-${reference[1].trim()})`;
	else base = color(record.color, where);
	if (record.opacity === undefined) return base;

	// `color-mix` interpolates premultiplied by default, so mixing towards `transparent`
	// scales alpha without shifting hue — which is what XAML's `Opacity` does to a brush.
	return `color-mix(in srgb, ${base} ${percent(record.opacity, where)}, transparent)`;
}

const number = (text, where) => {
	if (!/^-?\d+(?:\.\d+)?$/.test(text)) fail(`${where}: \`${text}\` is not a number`);
	return text;
};

/**
 * A one- or four-part XAML length list as a CSS shorthand, `order` mapping the four
 * parts into CSS order.
 *
 * Two- and three-part forms fail rather than being guessed at. XAML's two-part
 * Thickness is (horizontal, vertical) and CSS's is (vertical, horizontal), so the value
 * that looks most convertible is exactly the one worth stopping on.
 */
function lengths(value, where, order) {
	const parts = value.split(',').map((part) => number(part.trim(), where));
	if (parts.length === 1) return `${parts[0]}px`;
	if (parts.length !== 4) fail(`${where}: \`${value}\` has ${parts.length} parts, not 1 or 4`);
	if (parts.every((part) => part === parts[0])) return `${parts[0]}px`;
	return order(parts)
		.map((part) => `${part}px`)
		.join(' ');
}

/** `hh:mm:ss.fff` — a XAML TimeSpan — in milliseconds. */
function duration(value, where) {
	const parts = /^(\d+):(\d+):(\d+)(?:\.(\d+))?$/.exec(value);
	if (!parts) fail(`${where}: \`${value}\` is not an hh:mm:ss.fff duration`);

	const [, hours, minutes, seconds, fraction] = parts;
	const ms =
		((Number(hours) * 60 + Number(minutes)) * 60 + Number(seconds)) * 1000 +
		Number(`0.${fraction ?? 0}`) * 1000;
	// `0.083 * 1000` is `83.00000000000001`; the same rounding as `percent`, for the
	// same reason.
	return `${Number(ms.toFixed(4))}ms`;
}

/** `x1,y1,x2,y2` as the CSS timing function with the same control points. */
function keySpline(value, where) {
	const parts = value.split(',').map((part) => part.trim());
	if (parts.length !== 4) fail(`${where}: \`${value}\` is not a four-part key spline`);
	return `cubic-bezier(${parts.map((part) => number(part, where)).join(', ')})`;
}

function scalar(record) {
	const where = at(record);
	const value = record.value.trim();

	switch (record.type) {
		case 'x:Double':
			// Only the seven `*FontSize` keys are doubles in this selection. A length unit
			// is not right for every double — an opacity, a ratio and a line count are all
			// spelled the same way — so the next one to appear gets read rather than
			// assumed.
			if (!record.key.endsWith('FontSize'))
				fail(`${where}: x:Double outside the type ramp; decide its unit before emitting it`);
			return `${number(value, where)}px`;

		case 'CornerRadius':
			// WinUI writes TopLeft,TopRight,BottomRight,BottomLeft, and so does CSS
			// `border-radius`. Here the orders agree and this is only a unit suffix.
			return lengths(value, where, (parts) => parts);

		case 'Thickness':
			// WinUI writes Left,Top,Right,Bottom; the CSS shorthand is Top,Right,Bottom,Left.
			// The two agree on nothing except the uniform case, which is what makes an
			// unpermuted four-part value look plausible in review.
			return lengths(value, where, ([left, top, right, bottom]) => [top, right, bottom, left]);

		case 'x:String':
			if (record.key.endsWith('Duration')) return duration(value, where);
			if (record.key.endsWith('KeySpline')) return keySpline(value, where);
			return fail(`${where}: x:String that is neither a Duration nor a KeySpline`);

		default:
			return fail(`${where}: no conversion for the scalar type \`${record.type}\``);
	}
}

/**
 * The high-contrast value of a palette color, which the dictionary does not carry.
 *
 * `siblings` is the HighContrast dictionary keyed by resource name.
 */
function highContrastColor(record, siblings) {
	// WD-001: HighContrast defines all 83 palette colors as `#FF0000`, a tripwire its own
	// brushes never read, so each one is resolved through the brush that does have a value.
	// `systemColorBrush` is the same substitution in the other direction; see
	// docs/divergences.md.
	const sibling = siblings.get(`${record.key}Brush`);
	if (sibling?.kind === 'brush' && sibling.color !== undefined) {
		const reference = REFERENCE.exec(sibling.color.trim());
		return reference ? `var(--winui-${reference[1].trim()})` : color(sibling.color, at(sibling));
	}

	// `SolidBackgroundFillColorTransparent` is the one poisoned key with no sibling brush
	// to ask. Its light and dark values are `#00F3F3F3` and `#00202020`, both zero-alpha,
	// so nothing is being invented here.
	if (record.key === 'SolidBackgroundFillColorTransparent') return 'transparent';

	return fail(`${at(record)}: high-contrast tripwire with no sibling brush to resolve it`);
}

const POISON = '#FF0000';

function convert(record, siblings) {
	switch (record.kind) {
		case 'color':
			return record.theme === HIGH_CONTRAST && record.value.trim().toUpperCase() === POISON
				? highContrastColor(record, siblings)
				: color(record.value, at(record));

		case 'brush':
			return brush(record);

		case 'alias':
			return `var(--winui-${record.to})`;

		case 'scalar':
			return scalar(record);

		default:
			return fail(`${at(record)}: no conversion for a \`${record.kind}\` resource`);
	}
}

/* ------------------------------------------------------------------------------- selection */

/** The keys a record refers to: an alias's target, and any `{…Resource X}` color. */
function references(record) {
	const out = [];
	const reference = (raw) => {
		const found = raw === undefined ? null : REFERENCE.exec(raw.trim());
		if (found) out.push(found[1].trim());
	};

	if (record.kind === 'alias') out.push(record.to);
	if (record.kind === 'brush') reference(record.color);
	if (record.kind === 'gradient') for (const stop of record.stops ?? []) reference(stop.color);
	return out;
}

/**
 * The v1 selection: every record defined in the four base files, indexed by key and
 * theme, with the invariants the rest of this file relies on already asserted.
 */
function select(resources) {
	const files = new Set(SOURCE_FILES);
	const records = resources.filter((record) => files.has(record.file));
	if (records.length === 0) fail(`${RECORD} holds no records from any of the base files`);

	const byKey = new Map();
	for (const record of records) {
		const themes = byKey.get(record.key) ?? new Map();
		// The extractor merges nothing, so two definitions of one key in one theme arrive
		// as two records. Keeping the last would be a precedence decision made silently,
		// in the one place nobody would think to look for it.
		if (themes.has(record.theme))
			fail(`${at(record)}: defined twice in the ${record.theme ?? 'theme-independent'} scope`);
		themes.set(record.theme, record);
		byKey.set(record.key, themes);
	}

	// The transitive closure. A reference that resolves to nothing has to be one of the
	// names the OS supplies; anything else means the four base files no longer close over
	// themselves, and emitting a `var()` nobody defines would hide that inside a
	// declaration the browser silently drops.
	const external = new Set([...Object.keys(SYSTEM_COLORS), ...Object.keys(ACCENT_COLORS)]);
	const reached = new Set();
	const queue = [...byKey.keys()];
	while (queue.length) {
		const key = queue.pop();
		if (reached.has(key)) continue;
		reached.add(key);
		for (const record of (byKey.get(key) ?? new Map()).values()) {
			for (const target of references(record)) {
				if (!byKey.has(target) && !external.has(target))
					fail(`${at(record)} references \`${target}\`, which nothing in the selection defines`);
				if (!reached.has(target)) queue.push(target);
			}
		}
	}

	// Measured, and asserted rather than trusted: no key in this selection is themed in
	// part. A partially themed key would resolve to another theme's value on the themes
	// it is missing from, which reads as a design decision rather than as a hole.
	for (const [key, themes] of byKey) {
		const names = [...themes.keys()];
		const independent = names.length === 1 && names[0] === null;
		const complete = names.length === THEMED.length && THEMED.every((name) => themes.has(name));
		if (!independent && !complete)
			fail(
				`${key} is defined in ${names.map((name) => name ?? 'no theme').join(', ')} only; ` +
					'every key must be theme-independent or defined in all three themes'
			);
	}

	for (const key of Object.keys(EXCLUDED))
		if (!byKey.has(key)) fail(`EXCLUDED lists \`${key}\`, which this selection does not contain`);

	return { records, byKey, external: reached.size - byKey.size };
}

/* --------------------------------------------------------------------------------- emission */

/**
 * One custom-property declaration, as the lines Prettier would print it on.
 *
 * A generator that emits a line Prettier would rewrite puts `pnpm format` and C2 in a
 * fight C2 loses every time: the format pass edits the committed file, and the gate then
 * reports the generator as stale. Prettier breaks a function value at its top-level
 * commas once the line passes `printWidth`.
 */
function declaration(name, value, depth) {
	const indent = '\t'.repeat(depth);
	const text = `--winui-${name}: ${value};`;
	if (depth * TAB_WIDTH + text.length <= PRINT_WIDTH) return [`${indent}${text}`];

	// Only `var()` and `color-mix()` values are long enough to wrap, and both are a
	// single call. A long value of another shape means this has stopped describing
	// Prettier, and guessing at the rest of its algorithm is how that goes unnoticed.
	const call = /^([\w-]+)\((.*)\)$/s.exec(value);
	if (!call) fail(`--winui-${name}: value is too long for one line and is not a function call`);

	const parts = topLevelParts(call[2]);
	return [
		`${indent}--winui-${name}: ${call[1]}(`,
		...parts.map((part, i) => `${indent}\t${part}${i === parts.length - 1 ? '' : ','}`),
		`${indent});`
	];
}

/**
 * How many declarations a run of emitted lines holds.
 *
 * Counted from the printed lines rather than tracked alongside them, so the summary
 * describes the file that was written instead of the intention behind it. A wrapped
 * declaration's continuation lines carry no colon and are not counted twice.
 */
const declared = (lines) => lines.filter((line) => /^\t+--winui-\w+:/.test(line)).length;

/** `args` split at its top-level commas. */
function topLevelParts(args) {
	const parts = [];
	let depth = 0;
	let current = '';
	for (const char of args) {
		if (char === '(') depth++;
		else if (char === ')') depth--;
		else if (char === ',' && depth === 0) {
			parts.push(current.trim());
			current = '';
			continue;
		}
		current += char;
	}
	parts.push(current.trim());
	return parts;
}

function stylesheet(doc) {
	const { records, byKey, external } = select(doc.resources);

	// The HighContrast dictionary, keyed by resource name, for the palette resolution
	// WD-001 describes.
	const siblings = new Map(
		records.filter((record) => record.theme === HIGH_CONTRAST).map((record) => [record.key, record])
	);

	const emitted = new Set();
	const forThemes = (themes, depth) => {
		const out = [];
		for (const record of records) {
			if (record.key in EXCLUDED || !themes.includes(record.theme)) continue;
			emitted.add(record.key);
			out.push(...declaration(record.key, convert(record, siblings), depth));
		}
		return out;
	};

	const systemColors = (depth, of) =>
		Object.entries(SYSTEM_COLORS).flatMap(([key, entry]) =>
			declaration(key, of(entry, key), depth)
		);
	const literal = (entry, key) => color(entry.value, `SYSTEM_COLORS.${key} in manifest.mjs`);

	// Light is the default theme, so it and the theme-independent keys are the `:root`
	// block. Records keep the order the extractor read them in, which is source order.
	const light = [
		'\tcolor-scheme: light;',
		'',
		'\t/* Supplied by Windows rather than by the XAML — see scripts/tokens/manifest.mjs. */',
		'\t/* Nothing in light or dark reads a system color, but a token that references */',
		'\t/* one still has to resolve here, or an unresolved var() reads as a theme bug. */',
		...systemColors(1, literal),
		...Object.entries(ACCENT_COLORS).flatMap(([key, value]) =>
			declaration(key, color(value, `ACCENT_COLORS.${key} in manifest.mjs`), 1)
		),
		'',
		...forThemes([LIGHT, null], 1)
	];

	// The dark values are emitted twice, under the explicit selector and under the
	// preference query. The two can never disagree — they are the same array — and
	// generated duplication costs bytes rather than maintenance.
	const dark = (depth) => [
		`${'\t'.repeat(depth)}color-scheme: dark;`,
		'',
		...systemColors(depth, literal),
		'',
		...forThemes([DARK], depth)
	];

	const highContrast = [...systemColors(1, literal), '', ...forThemes([HIGH_CONTRAST], 1)];

	const forcedColors = systemColors(2, (entry) => entry.keyword);

	// Built before the completeness check below, so that every block has had its say
	// about which keys it emitted. A lazily built block would make the check pass by
	// never having run.
	const darkRoot = dark(1);
	const darkQuery = dark(2);

	for (const key of byKey.keys()) {
		if (emitted.has(key) || key in EXCLUDED) continue;
		fail(`${key} is selected but neither emitted nor excluded; give it a reason in manifest.mjs`);
	}

	const lines = [
		'/*',
		' * WinUI 3 design tokens, generated by scripts/tokens/generate.mjs from',
		` * ${RECORD} — microsoft/microsoft-ui-xaml @ ${doc.source.commit}.`,
		' *',
		' * Generated file — do not edit. Run `pnpm tokens:build`.',
		' */',
		'',
		':root {',
		...light,
		'}',
		'',
		":root[data-theme='dark'] {",
		...darkRoot,
		'}',
		'',
		'@media (prefers-color-scheme: dark) {',
		"\t:root:not([data-theme='light']):not([data-theme='high-contrast']) {",
		...darkQuery,
		'\t}',
		'}',
		'',
		'/* High contrast is a remapping onto the eight system colors, not a third palette */',
		'/* of values — ADR 0005. */',
		":root[data-theme='high-contrast'] {",
		...highContrast,
		'}',
		'',
		'/* In forced-colors mode the browser fills the same eight from the actual Windows */',
		'/* theme, which is the one place these values are measured rather than ours. */',
		'@media (forced-colors: active) {',
		'\t:root {',
		...forcedColors,
		'\t}',
		'}'
	];

	return {
		css: `${lines.join('\n')}\n`,
		stats: {
			selected: byKey.size,
			emitted: emitted.size,
			excluded: Object.keys(EXCLUDED).length,
			external,
			light: declared(light),
			dark: declared(darkRoot),
			highContrast: declared(highContrast),
			forcedColors: declared(forcedColors),
			lines: lines.length
		}
	};
}

async function build() {
	const doc = JSON.parse(await readFile(join(ROOT, RECORD), 'utf8'));
	const { css, stats } = stylesheet(doc);
	return { files: { [OUTPUT]: css }, stats };
}

/** Repo-relative path to file content, for the caller to write or to compare. */
export async function generate() {
	return (await build()).files;
}

async function main() {
	const { files, stats } = await build();
	for (const [path, content] of Object.entries(files)) {
		await mkdir(dirname(join(ROOT, path)), { recursive: true });
		await writeFile(join(ROOT, path), content);
	}

	console.log(
		[
			`source            ${RECORD}, ${SOURCE_FILES.length} base files`,
			`selection         ${stats.selected} keys, closing over ${stats.external} OS-supplied names`,
			`emitted           ${stats.emitted} keys`,
			`excluded          ${stats.excluded} keys`,
			`declarations      light ${stats.light}, dark ${stats.dark}, high contrast ${stats.highContrast}, forced-colors ${stats.forcedColors}`,
			`written           ${OUTPUT} (${stats.lines} lines)`
		].join('\n')
	);
}

// Only when run as a CLI: importing this module must not write anything, because C2
// imports it to ask what the output should be.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	try {
		await main();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
