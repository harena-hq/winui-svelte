import { DRAWN_GLYPHS } from '../icons/fallback.mjs';
import { fail, pass, read, walk } from './lib.mjs';

export const id = 'C19';
export const title = 'every glyph a component draws for itself is a DRAWN row of the fallback face';

// ADR 0018 builds a face for where Segoe Fluent Icons is absent, and its table is the whole of
// what that face draws: a code point with no row draws whatever the browser substitutes, if
// anything. The table's `DRAWN` rows are meant to be every point a component in the package
// writes for itself, `Symbol` names or not, and nothing read the components to say so. The
// release's eighteen were listed by hand, and the owner's pass found what that missed off
// Windows: the CheckBox's check, a MenuFlyout's sub-item chevron and every
// MediaTransportControls command drew nothing, and the Gallery's copy button grew taller, its
// hidden success glyph laid out in a substitute face.
//
// So a component's points are read from its source, with comments removed so that a point a
// comment cites as an example is not counted: an escape written in script (`'\uE711'`) or
// markup (`&#xE711;`), a CSS escape (`'\e711'`), a number (`0xe711`), and a quoted upper-case
// hex string (`'E711'`), the form the package's `glyph` props take. A token's value counts too,
// a custom property in the generated stylesheet whose value is one escaped character, for each
// component that reads it with `var()`, since the source shows only the name. Of those, a point in
// the private use area, U+E000 to U+F8FF, where Segoe's glyphs are, has to be a `DRAWN` row,
// and every `DRAWN` row has to be one of those points. `symbol.ts` is not read: `Symbol`'s
// points are what the table's other rows hold, and `scripts/icons/font.mjs` fails the build on
// a member without one.
//
// What it cannot see. A point built at run time from parts, or handed in by a consumer, is not
// in the source. A hex string in lower case, or quoted with backticks, is not read as a point,
// and neither is a token a component reaches only through another token. The Gallery is not
// read, as it is not the package: its copy button's success glyph, U+E73E, has a row because
// preview components draw it too, and a row no component draws any more fails here even if the
// Gallery still draws it. And the comment
// removal is textual, taking whichever comment opens first: a `//` that opens a string's content
// after whitespace hides the rest of that line, and a `/*` in a string hides everything to the
// next `*/`.

const SOURCES = 'packages/winui-svelte/src/lib';
const TOKENS = 'packages/winui-svelte/src/lib/tokens/tokens.css';

const POINT = [
	/\\u(?:\{0*([0-9a-fA-F]{4})\}|([0-9a-fA-F]{4}))/g,
	/&#x([0-9a-fA-F]{4});/g,
	/\\0*([0-9a-fA-F]{4})(?![0-9a-fA-F])/g,
	/\b0x([0-9a-fA-F]{4})\b/g,
	/(['"])([EF][0-9A-F]{3})\1/g
];

const TOKEN = /^\s*--winui-([\w-]+):\s*(['"])\\0*([0-9a-fA-F]{4})\2/gm;

/** @param {string} hex */
const privateUse = (hex) => {
	const point = parseInt(hex, 16);
	return point >= 0xe000 && point <= 0xf8ff;
};

/**
 * `text` with its comments removed: block comments, markup comments, and a `//` comment that
 * opens a line or follows whitespace. One pass, so the comment that opens first is the one
 * removed, and a `/*` inside a `//` comment opens nothing.
 *
 * @param {string} text
 */
const withoutComments = (text) =>
	text.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|(^|\s)\/\/.*$/gm, (_, space) => space ?? '');

/**
 * The rule over text. `sources` are component, script and stylesheet files as `{ path, text }`,
 * `tokens` the generated stylesheet's text and `drawn` the table's `DRAWN` code points. `points`
 * maps each point found to the files it was found in.
 *
 * @param {{ path: string, text: string }[]} sources
 * @param {string} tokens
 * @param {Set<string>} drawn
 * @returns {{ sites: string[], points: Map<string, Set<string>> }}
 */
export function sitesIn(sources, tokens, drawn) {
	/** @type {Map<string, Set<string>>} */
	const points = new Map();
	const found = (/** @type {string} */ hex, /** @type {string} */ path) => {
		const point = hex.toUpperCase();
		if (!privateUse(point)) return;
		const paths = points.get(point) ?? new Set();
		paths.add(path);
		points.set(point, paths);
	};

	const code = sources.map(({ path, text }) => ({ path, code: withoutComments(text) }));
	for (const { path, code: text } of code)
		for (const pattern of POINT)
			for (const match of text.matchAll(pattern))
				found(match.slice(1).findLast((group) => group !== undefined) ?? '', path);
	for (const [, name, , hex] of tokens.matchAll(TOKEN)) {
		const reads = new RegExp(`var\\(\\s*--winui-${name}\\s*[,)]`);
		for (const { path, code: text } of code) if (reads.test(text)) found(hex, path);
	}

	/** @type {string[]} */
	const sites = [];
	for (const [point, paths] of [...points].sort(([a], [b]) => (a < b ? -1 : 1)))
		if (!drawn.has(point))
			sites.push(`U+${point}  has no DRAWN row, drawn by ${[...paths].sort().join(', ')}`);
	for (const point of [...drawn].sort())
		if (!points.has(point)) sites.push(`U+${point}  is a DRAWN row and no component draws it`);
	return { sites, points };
}

export async function run() {
	/** @type {{ path: string, text: string }[]} */
	const sources = [];
	for (const path of await walk(
		SOURCES,
		(name) => /\.(svelte|ts|js|css)$/.test(name) && name !== 'symbol.ts' && name !== 'tokens.css'
	))
		sources.push({ path, text: await read(path) });

	const drawn = new Set(DRAWN_GLYPHS.map((row) => row.point));
	const { sites, points } = sitesIn(sources, await read(TOKENS), drawn);

	if (points.size === 0)
		return fail('no private-use code point was found; is the scan reading the sources?');

	return sites.length
		? fail(
				'off Windows, a glyph with no row draws whatever the browser substitutes, and the ' +
					'DRAWN rows are to be exactly the points the components draw',
				sites
			)
		: pass(`${points.size} code point(s) the components draw, each a DRAWN row`);
}
