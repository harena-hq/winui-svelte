import { declarations, fail, pass, pending, read, styleBlocks, walk } from './lib.mjs';

export const id = 'C1';
export const title = 'no raw visual literals in component styles';

// Scope: the value families that carry the theme. A literal here is a value that will
// not follow a light/dark/high-contrast switch, which is the whole reason the token
// cascade exists. Layout arithmetic — width, margin, grid, flex, z-index, transforms —
// is per-component and deliberately out of scope; it does not change with the theme.

const COLOUR_PROPS =
	/^(color|background|background-color|background-image|border|border-(top|right|bottom|left|block|inline)(-(start|end))?(-color)?|border-color|outline|outline-color|box-shadow|text-shadow|fill|stroke|stop-color|caret-color|column-rule|column-rule-color|text-decoration|text-decoration-color|accent-color|scrollbar-color)$/;

const SIZED_PROPS =
	/^(border-radius|border-(top|bottom)-(left|right)-radius|border-(start|end)-(start|end)-radius|border-width|border-(top|right|bottom|left)-width|border|outline|outline-width|outline-offset|font-size|letter-spacing|word-spacing|box-shadow|text-shadow|stroke-width|transition|transition-duration|animation|animation-duration)$/;

const TOKEN_ONLY_PROPS = /^(font-family|font-weight|line-height|font)$/;

// Identifiers a colour-bearing value may contain that are not themselves colours.
// An allowlist, because enumerating every named CSS colour is the version of this
// check that silently misses `rebeccapurple`.
const NON_COLOUR_WORDS = new Set(
	`transparent currentcolor inherit initial unset revert none auto
	 solid dashed dotted double groove ridge inset outset hidden thin medium thick
	 to at from in circle ellipse closest-side closest-corner farthest-side farthest-corner
	 top bottom left right center space repeat no-repeat repeat-x repeat-y round
	 cover contain border-box padding-box content-box fixed scroll local
	 linear-gradient radial-gradient conic-gradient url image-set
	 repeating-linear-gradient repeating-radial-gradient repeating-conic-gradient
	 underline overline line-through wavy`.split(/\s+/)
);

const COLOUR_FN = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|device-cmyk)\s*\(/i;
const HEX = /#[0-9a-f]{3,8}\b/i;
const SIZE =
	/(?<![\w.-])-?\d*\.?\d+\s*(px|rem|em|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax|q|%|s|ms)\b/i;
const ZERO = /^-?0*\.?0+\s*[a-z%]*$/i;

const dropVars = (value) =>
	value.replace(/var\(\s*--[\w-]+\s*(?:,[^()]*(?:\([^()]*\)[^()]*)*)?\)/gi, ' ');

/** The one place literals belong: the generated token layer. */
const isTokenLayer = (file) => /(^|\/)src\/lib\/tokens\//.test(file.replace(/\\/g, '/'));

function violation({ prop, value }) {
	const bare = dropVars(value);

	// A component reaching out of its own scope to bake a literal into a token —
	// `:global(:root) { --winui-accent-light-1: #0078d4 }` — is the worst violation
	// there is, and the one a naive "skip lines mentioning a token" rule exempts.
	// Aliasing one token to another stays fine.
	if (prop.startsWith('--')) {
		return bare.trim() ? `token \`${prop}\` defined outside the token layer` : null;
	}

	if (COLOUR_PROPS.test(prop)) {
		if (HEX.test(bare)) return `hard-coded colour in \`${prop}\``;
		if (COLOUR_FN.test(bare)) return `colour function in \`${prop}\``;
		// Numbers go first, or `1px` in `border: 1px solid red` is read as a colour
		// named `px` and the message points at the wrong half of the declaration.
		const words = bare.toLowerCase().replace(/[\d.]+[a-z%]*/g, ' ');
		for (const word of words.match(/[a-z][a-z-]*/g) ?? []) {
			if (!NON_COLOUR_WORDS.has(word)) return `named colour \`${word}\` in \`${prop}\``;
		}
	}

	if (SIZED_PROPS.test(prop)) {
		const size = bare.match(SIZE);
		if (size && !ZERO.test(size[0])) return `hard-coded \`${size[0].trim()}\` in \`${prop}\``;
	}

	if (
		TOKEN_ONLY_PROPS.test(prop) &&
		!/^(inherit|initial|unset|revert|normal)$/i.test(bare.trim())
	) {
		return `\`${prop}\` must come from a token`;
	}

	return null;
}

export async function run() {
	const files = await walk(
		'packages/winui-svelte/src',
		(n) => n.endsWith('.svelte') || n.endsWith('.css')
	);
	const subject = files.filter((f) => !isTokenLayer(f));
	if (files.length === 0) return pending('v1', 'the library has no styles yet');

	const sites = [];
	for (const file of subject) {
		const source = await read(file);

		// The escape hatch has to state a reason, so it surfaces in review rather than
		// becoming a silent habit. It exempts one line, not a file and not a rule.
		const exempt = new Set();
		source.split('\n').forEach((text, i) => {
			if (/\/\*\s*c1-allow:\s*\S/.test(text) || /<!--\s*c1-allow:\s*\S/.test(text))
				exempt.add(i + 1);
		});

		const blocks = file.endsWith('.css') ? [{ body: source, line: 1 }] : styleBlocks(source);

		for (const block of blocks) {
			for (const decl of declarations(block.body, block.line)) {
				const why = violation(decl);
				if (why && !exempt.has(decl.line)) sites.push(`${file}:${decl.line}  ${why}`);
			}
		}

		if (file.endsWith('.css')) continue;

		// Markup is where a value gets hard-coded when a `<style>` block would have felt
		// like too much ceremony: inline styles, `style:` directives, and the SVG
		// presentation attributes an icon is drawn with.
		const markup = source.replace(/<style\b[\s\S]*?<\/style>/gi, (m) => m.replace(/[^\n]/g, ' '));
		markup.split('\n').forEach((text, i) => {
			const line = i + 1;
			if (exempt.has(line)) return;

			for (const m of text.matchAll(/\bstyle\s*=\s*"([^"]*)"/g)) {
				for (const decl of declarations(`x{${m[1]}}`)) {
					const why = violation(decl);
					if (why) sites.push(`${file}:${line}  ${why} (inline style)`);
				}
			}
			for (const m of text.matchAll(
				/\b(fill|stroke|stop-color|stroke-width|font-size|font-weight)\s*=\s*"([^"]*)"/gi
			)) {
				const why = violation({ prop: m[1].toLowerCase(), value: m[2] });
				if (why) sites.push(`${file}:${line}  ${why} (presentation attribute)`);
			}
			for (const m of text.matchAll(
				/\bstyle:([\w-]+)\s*=\s*(?:"([^"]*)"|\{[^}]*'([^']*)'|\{[^}]*"([^"]*)")/g
			)) {
				const literal = m[2] ?? m[3] ?? m[4];
				if (literal === undefined) continue;
				const why = violation({ prop: m[1].toLowerCase(), value: literal });
				if (why) sites.push(`${file}:${line}  ${why} (style: directive)`);
			}
		});
	}

	return sites.length
		? fail(`${sites.length} literal(s) outside the token layer`, sites)
		: pass(`${subject.length} file(s) clean`);
}
