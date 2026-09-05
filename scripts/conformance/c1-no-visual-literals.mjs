import { declarations, fail, pass, pending, read, styleBlocks, walk } from './lib.mjs';

export const id = 'C1';
export const title = 'no raw visual literals in the library or the Gallery';

/**
 * Both trees, because the token cascade is judged in both.
 *
 * The library is the obvious subject. The Gallery is the less obvious one and the more
 * urgent: its Design pages exist to show what the tokens are worth, so a color hard-coded
 * there does not merely fail to follow a theme switch — it makes the acceptance surface
 * agree with the original for a reason that has nothing to do with the token layer, which
 * is the one confusion this whole arrangement is built to prevent.
 */
const SUBJECTS = ['packages/winui-svelte/src', 'apps/gallery/src'];

// Scope: the value families that carry the theme. A literal here is a value that will
// not follow a light/dark/high-contrast switch, which is the whole reason the token
// cascade exists. Layout arithmetic — width, margin, grid, flex, z-index, transforms —
// is per-component and deliberately out of scope; it does not change with the theme.

const COLOUR_PROPS =
	/^(color|background|background-color|background-image|border|border-(top|right|bottom|left|block|inline)(-(start|end))?(-color)?|border-color|outline|outline-color|box-shadow|text-shadow|fill|stroke|stop-color|caret-color|column-rule|column-rule-color|text-decoration|text-decoration-color|accent-color|scrollbar-color)$/;

const SIZED_PROPS =
	/^(border-radius|border-(top|bottom)-(left|right)-radius|border-(start|end)-(start|end)-radius|border-width|border-(top|right|bottom|left)(-width)?|border|outline|outline-width|outline-offset|font-size|letter-spacing|word-spacing|box-shadow|text-shadow|stroke-width|transition|transition-duration|animation|animation-duration)$/;

const TOKEN_ONLY_PROPS = /^(font-family|font-weight|line-height|font)$/;

// Identifiers a colour-bearing value may contain that are not themselves colours.
// An allowlist, because enumerating every named CSS colour is the version of this
// check that silently misses `rebeccapurple`.
//
// `calc` and its siblings earn their place the hard way. `dropVars` removes the `var()`
// calls and leaves the arithmetic behind, so `calc(var(a) + var(b))` reduces to `calc( + )`
// and `calc` reads as a colour nobody wrote. The focus-visual unit hit that on five
// declarations and its first fix was five `c1-allow` comments — which would have exempted
// five real `box-shadow`s from the gate to satisfy a false positive in it.
const NON_COLOUR_WORDS = new Set(
	`transparent currentcolor inherit initial unset revert none auto
	 solid dashed dotted double groove ridge inset outset hidden thin medium thick
	 to at from in circle ellipse closest-side closest-corner farthest-side farthest-corner
	 top bottom left right center space repeat no-repeat repeat-x repeat-y round
	 cover contain border-box padding-box content-box fixed scroll local
	 linear-gradient radial-gradient conic-gradient url image-set
	 repeating-linear-gradient repeating-radial-gradient repeating-conic-gradient
	 underline overline line-through wavy
	 calc min max clamp`.split(/\s+/)
);

const COLOUR_FN = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|device-cmyk)\s*\(/i;
const HEX = /#[0-9a-f]{3,8}\b/i;
// A known hole, stated rather than left to be rediscovered: the trailing `\b` never matches
// after `%`, because a percent sign and the `;` or `)` that follows it are both non-word
// characters. `border-radius: 50%` and `font-size: 120%` are therefore not flagged. The first
// is fine and arguably right — `50%` on a circle means "circle", not a design value anyone
// would tokenise — and the second is a real miss. Left alone because closing it newly flags
// declarations across the tree, which is its own unit rather than a line changed in passing.
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

	// `bare` is the value with every `var()` removed, so an empty one means the value was
	// nothing but tokens — which is the thing this rule demands. Without that first clause
	// the check inverts: `font-family: var(--winui-SymbolThemeFontFamily)` was rejected for
	// not coming from a token, and the only way past a rule asking for a token was to stop
	// using one. Anything left over is a literal sharing the declaration with a token, and
	// still fails: a fallback face belongs inside the token, not after it.
	if (
		TOKEN_ONLY_PROPS.test(prop) &&
		bare.trim() &&
		!/^(inherit|initial|unset|revert|normal)$/i.test(bare.trim())
	) {
		return `\`${prop}\` must come from a token`;
	}

	return null;
}

export async function run() {
	const files = (
		await Promise.all(
			SUBJECTS.map((dir) => walk(dir, (n) => n.endsWith('.svelte') || n.endsWith('.css')))
		)
	).flat();
	const subject = files.filter((f) => !isTokenLayer(f));
	// Tested against the subject, not against every file found: the token layer is
	// exempt, so a repository holding only `tokens.css` has nothing for this gate to
	// read. Keyed to `files` instead, C1 reports `ok — 0 file(s) clean` the moment the
	// token layer lands, which is a gate that has gone quiet wearing a pass.
	if (subject.length === 0) return pending('v1', 'neither tree has any styles yet');

	const sites = [];
	for (const file of subject) {
		const source = await read(file);

		// The escape hatch has to state a reason, so it surfaces in review rather than
		// becoming a silent habit. It exempts one declaration, not a file and not a rule.
		//
		// Accepted on the declaration's own line or on the line directly above it. Only the
		// same line worked at first, which meant the form everyone reaches for — a comment
		// above, the way `eslint-disable-next-line` reads — failed with a message about the
		// declaration and nothing about placement. A hatch nobody can find is a rule with no
		// way out, and the way out is the reason the rule can afford to be absolute.
		const exempt = new Set();
		const lines = source.split('\n');
		lines.forEach((text, i) => {
			// The lookahead is what makes the reason mandatory. `\S` alone is satisfied by the
			// comment's own terminator, so `/* c1-allow: */` — an exemption stating nothing —
			// was accepted by the check that exists to stop exactly that.
			const css = /\/\*\s*c1-allow:\s*(?!\*\/)\S/.test(text);
			const markup = /<!--\s*c1-allow:\s*(?!-->)\S/.test(text);
			if (!css && !markup) return;

			// The exemption runs to the line after the comment CLOSES, not to the line after
			// the `c1-allow:` token. Only the opening line matches the pattern above, so a
			// reason long enough to wrap used to leave its own declaration unexempted — and
			// the failure names the declaration and says nothing about the comment, which is
			// the shape of message that sends an author looking in the wrong place. It cost a
			// round trip in v3's last unit, and it had quietly made every multi-line
			// `c1-allow:` already in the tree inert.
			const closer = css ? '*/' : '-->';
			let end = i;
			while (end < lines.length && !lines[end].includes(closer)) end++;
			// An unterminated comment is a syntax error the parser will report on its own
			// terms; exempting to the end of the file on the way there is not this gate's
			// business.
			if (end === lines.length) end = i;
			for (let line = i + 1; line <= end + 2; line++) exempt.add(line);
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
		: pass(`${subject.length} file(s) clean across ${SUBJECTS.length} tree(s)`);
}
