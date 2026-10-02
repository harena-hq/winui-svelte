import { declarations, fail, pass, read, styleBlocks, walk } from './lib.mjs';

export const id = 'C18';
export const title = 'every content declaration that draws something states its alternative text';

// Generated content is part of the accessible name computed from an element's contents, so a
// glyph drawn with `content` was read aloud as part of the control's name. Measured on this
// repository's dev pages: a checked CheckBox labelled "Checked" is announced as "U+E73E
// Checked", an Expander header button as "This text is in the header U+E70D", and a TreeView
// item as "U+E76C Work Documents".
//
// `content: X / ''` paints X and gives the name nothing. Measured in Chromium 151, Firefox 153
// and WebKit 26.5, the glyph still paints and the name loses it, and the same holds when X is
// a `var()`.
//
// An engine which does not parse the slash form drops the whole declaration and draws no
// glyph. The three engines above all parse it.
//
// What this gate does not reach is markup. A glyph written as a text node in a template — the
// library's CalendarView, SelectorBar and NavigationViewItem icons among them — is not a
// `content` declaration, and nothing answers that class yet: the dev-page names in
// `tests/visual/generated-content-alt.spec.ts` cover glyphs drawn by `content` alone, and those
// text-node icons are still read as part of their names.
//
// Any alternative text passes, not only `''`. A glyph that means something may say so.
//
// A declaration draws nothing when its value, once a trailing `!important` is removed, is
// exactly `''`, `""`, `none`, `normal` or a CSS-wide keyword, which names no glyph of its own.
// Anything else draws, and it passes when that value holds a `/` outside a quoted string and
// outside parentheses. A `/` inside either is not alternative text. A custom property is not
// `content` and is ignored, and so is any file that is neither a component nor a stylesheet.

const SOURCES = ['packages/winui-svelte/src/lib', 'apps/gallery/src'];

/** @param {string} value */
const withoutImportant = (value) => value.replace(/\s*!\s*important\s*$/i, '').trim();

/** @param {string} value */
const drawsNothing = (value) =>
	value === "''" ||
	value === '""' ||
	/^(?:none|normal|initial|inherit|unset|revert|revert-layer)$/i.test(value);

/**
 * A `/` counts only at the top level: not inside a quoted string, and not inside parentheses.
 * Inside a string a backslash escapes the next character, so an escaped quote does not end it.
 *
 * @param {string} value
 */
function hasTopLevelSlash(value) {
	let quote = '';
	let depth = 0;
	for (let i = 0; i < value.length; i++) {
		const char = value[i];
		if (quote) {
			if (char === '\\') {
				i += 1;
				continue;
			}
			if (char === quote) quote = '';
			continue;
		}
		if (char === "'" || char === '"') {
			quote = char;
			continue;
		}
		if (char === '(') {
			depth += 1;
			continue;
		}
		if (char === ')' && depth > 0) {
			depth -= 1;
			continue;
		}
		if (char === '/' && depth === 0) return true;
	}
	return false;
}

/** @param {string} path @param {string} text */
const blocks = (path, text) =>
	path.endsWith('.svelte') ? styleBlocks(text) : [{ body: text, line: 1 }];

/**
 * The rule over text. `sources` is `{ path, text }`. `sites` are the failures in the order
 * found, `drawing` counts `content` declarations that draw something, and `holding` is the
 * files that contained at least one of those.
 *
 * @param {{ path: string, text: string }[]} sources
 * @returns {{ sites: string[], drawing: number, holding: Set<string> }}
 */
export function sitesIn(sources) {
	/** @type {string[]} */
	const sites = [];
	let drawing = 0;
	const holding = new Set();

	for (const { path, text } of sources) {
		if (!path.endsWith('.svelte') && !path.endsWith('.css')) continue;
		for (const block of blocks(path, text)) {
			for (const declaration of declarations(block.body, block.line)) {
				if (declaration.prop !== 'content') continue;
				const value = withoutImportant(declaration.value);
				if (drawsNothing(value)) continue;
				drawing += 1;
				holding.add(path);
				if (hasTopLevelSlash(value)) continue;
				sites.push(
					`${path}:${declaration.line}  content: ${value.replace(/\s+/g, ' ')} states no alternative text`
				);
			}
		}
	}

	return { sites, drawing, holding };
}

export async function run() {
	/** @type {{ path: string, text: string }[]} */
	const sources = [];
	for (const root of SOURCES)
		for (const path of await walk(root, (name) => /\.(svelte|css)$/.test(name)))
			sources.push({ path, text: await read(path) });

	const { sites, drawing, holding } = sitesIn(sources);

	if (drawing === 0)
		return fail(
			'no content declaration that draws anything was found; is the scan reading the sources?'
		);

	return sites.length
		? fail(
				'a glyph drawn by generated content without alternative text is read as part of the ' +
					'accessible name of the element that contains it',
				sites
			)
		: pass(
				`${drawing} drawing content declaration(s) in ${holding.size} file(s) state alternative text`
			);
}
