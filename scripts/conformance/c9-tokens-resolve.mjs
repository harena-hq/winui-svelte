import { fail, pass, read, walk } from './lib.mjs';

export const id = 'C9';
export const title = 'every token a component reads is one the layer emits';

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
const READS = /var\(\s*(--winui-[A-Za-z0-9_]+)/g;
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
	let scanned = 0;
	for (const root of SOURCES) {
		const files = await walk(root, (n) => /\.(svelte|css|ts|js)$/.test(n));
		for (const file of files) {
			// The generated layer is where these are defined; reading itself is not a site.
			if (TOKEN_LAYER.includes(file)) continue;
			scanned++;
			(await read(file)).split('\n').forEach((line, i) => {
				for (const m of line.matchAll(READS)) {
					if (!defined.has(m[1])) sites.push(`${file}:${i + 1}  reads ${m[1]}`);
				}
			});
		}
	}

	return sites.length
		? fail('a component reads a token the layer does not emit', sites)
		: pass(`${scanned} file(s) resolve against ${defined.size} emitted token(s)`);
}
