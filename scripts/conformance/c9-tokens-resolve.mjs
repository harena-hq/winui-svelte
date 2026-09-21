import { fail, pass, read, walk } from './lib.mjs';

export const id = 'C9';
export const title = 'every token read, by a component or by the layer itself, is emitted';

// C1's opposite direction, and the one nothing was checking. C1 fails a value written
// without a token; this fails a token written without a value.
//
// A browser drops a declaration whose custom property is undefined — silently, with no
// console message and no build error — so the rule is simply absent at runtime and the
// element falls back to whatever it inherited. `background: var(--winui-Typo)` is a
// component that renders and is wrong. Four such references existed across two components
// when this gate was written, and every other gate was green.
//
// Scoped to `--winui-` names on purpose: a component's own local custom property is its
// business, and `--bits-…` comes from a primitive at runtime and is not ours to emit.
//
// **The layer reads itself, and this checks the artefact where the generator checks the
// model.** A token's value is often a bare `var()` naming another token, and a component
// reading the outer name resolves to nothing when the inner one is missing — the same silent
// drop, one step further away. `scripts/tokens/generate.mjs` already walks a transitive
// closure over the *records* and refuses to write a reference that resolves to nothing, so
// the manifest cannot produce one: removing `ControlContentThemeFontSize` from the selection
// and regenerating leaves it emitted, pulled back in by the closure.
//
// **The region this uniquely covers is narrow and worth stating exactly**, because a first
// draft of this paragraph claimed the whole emission step. C2 compares the file on disk with
// what `generate()` returns, so anything that goes wrong *after* `generate()` returns is C2's
// — a fault injected into the write path trips it. What is left is the inside of `generate()`
// itself, after the closure has validated the records: a fault there is carried by a fresh run
// and by the committed file alike, C2 finds them equal, and this is the check that does not.
// Measured in both placements before it was written down.
//
// **It would not have caught the defect that named this hole.** Three `font-size` declarations
// were invalid at computed-value time for four versions, rendering at the right size by
// inheriting it — and those were *components* reading a name the layer did not emit, which is
// the half below and was already this gate's. The hole here is the other direction, and it is
// a guard rather than a cure: it was manufactured to fail before it was believed.
//
// A dangling name is failed whether or not the reference carries a fallback, and that is a
// policy rather than an oversight. `var(--winui-Nope, 4px)` is valid CSS and renders the 4px,
// so this is a rule about where a default is written rather than about what the browser does:
// no `var(--winui-…, …)` exists anywhere in the layer or in any component, and the layer is the
// one place this project spells a default. (An earlier version of this sentence leaned on
// ADR 0006 for it. That ADR fixes a token's *name* as the WinUI key verbatim and decides
// nothing about defaults, so the citation is gone rather than swapped.) **What would reverse
// it** is the first reference that genuinely wants a fallback — a token only some themes
// define, say — and the fail text would have to change with it, since "resolves to one the
// layer does not emit" is literally false at a site that carries a value of its own.
//
// **Matched against the whole file rather than line by line, and that is not a tidy-up.** The
// name is separated from its `var(` by `\\s*`, and a formatter wraps a long value so that the
// two land on different lines. A per-line scan matched neither half. Measured: the layer has
// 4961 references and 790 of them wrap, and the components have 2753 of which 59 wrap — so the
// gate was reading 84% of the layer and was already missing 59 component references before
// this change, which makes the fix a repair of the half that was here rather than only a
// condition of the half being added. The line number comes from counting newlines before the
// match instead — the offset is the `var(`, so the line reported is the declaration's rather
// than the wrapped name's, which is the one a reader wants to open.
const READS = /var\(\s*(--winui-[A-Za-z0-9_]+)/g;

/** 1-based line of a match offset, for a report that points at something. */
const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const DEFINES = /^\s*(--winui-[A-Za-z0-9_]+)\s*:/gm;

const TOKEN_LAYER = [
	'packages/winui-svelte/src/lib/tokens/tokens.css',
	'packages/winui-svelte/src/lib/tokens/type-ramp.css'
];

// The Gallery is in scope for the same reason C1 covers it: its Design pages are where the
// token layer is judged, and a dangling reference there is as invisible as one in a control.
const SOURCES = ['packages/winui-svelte/src/lib', 'apps/gallery/src'];

export async function run() {
	const defined = new Set();
	for (const file of TOKEN_LAYER) {
		for (const m of (await read(file)).matchAll(DEFINES)) defined.add(m[1]);
	}
	if (defined.size === 0) return fail('the token layer defines nothing; has it been generated?');

	const sites = [];

	// The layer against itself, first. One pass covers every depth: a token's value can name a
	// token whose value names another, and all of them are defined in these two files, so
	// requiring every name read here to be in `defined` resolves the whole chain without
	// walking it.
	let internal = 0;
	for (const file of TOKEN_LAYER) {
		const text = await read(file);
		for (const m of text.matchAll(READS)) {
			internal++;
			if (!defined.has(m[1]))
				sites.push(`${file}:${lineOf(text, m.index)}  resolves to ${m[1]}, unemitted`);
		}
	}

	let scanned = 0;
	let componentReads = 0;
	for (const root of SOURCES) {
		const files = await walk(root, (n) => /\.(svelte|css|ts|js)$/.test(n));
		for (const file of files) {
			// The generated layer is where these are defined; reading itself is not a site.
			if (TOKEN_LAYER.includes(file)) continue;
			scanned++;
			const text = await read(file);
			for (const m of text.matchAll(READS)) {
				componentReads++;
				if (!defined.has(m[1])) sites.push(`${file}:${lineOf(text, m.index)}  reads ${m[1]}`);
			}
		}
	}

	return sites.length
		? fail('a token read here resolves to one the layer does not emit', sites)
		: pass(
				`${componentReads} reference(s) in ${scanned} file(s) and ${internal} in the layer ` +
					`itself resolve against ${defined.size} emitted token(s)`
			);
}
