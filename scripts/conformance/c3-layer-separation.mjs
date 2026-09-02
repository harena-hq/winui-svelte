import { fail, pass, read, walk } from './lib.mjs';

export const id = 'C3';
export const title = 'the library does not import from the Gallery';

// The Gallery depends on the library, never the reverse. One import the wrong way
// makes the library unpublishable and nothing notices until `pnpm pack`.
//
// Every specifier form, not just the relative one: a bare workspace specifier, a
// side-effect-only import, a dynamic import, and `require` all reach the Gallery
// just as effectively as `../../apps/gallery`.
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*|\brequire\s*)\(?\s*['"`]([^'"`]+)['"`]/g;

const REACHES_GALLERY = /(^|\/)apps\/gallery(\/|$)|^(@[\w-]+\/)?gallery(\/|$)/i;

// A backslash path in a JS specifier is written escaped — `'..\\apps\\gallery'` — so a
// character class matching one separator consumes half a pair and the rest slips by.
// Normalise any run of backslashes to a single forward slash before testing.
const normalise = (specifier) => specifier.replace(/\\+/g, '/');

const LIBRARY_MANIFEST = 'packages/winui-svelte/package.json';
const SRC = 'packages/winui-svelte/src';

export async function run() {
	const files = await walk(SRC, (n) => /\.(svelte|svelte\.ts|svelte\.js|ts|js|mjs|css)$/.test(n));

	// The library always has source. Zero files means the tree moved or the walk is
	// broken, and reporting "clean" would be reporting on nothing.
	if (files.length === 0) return fail(`no source found under ${SRC}`);

	const sites = [];
	for (const file of files) {
		const source = await read(file);
		source.split('\n').forEach((line, i) => {
			for (const m of line.matchAll(SPECIFIER)) {
				if (REACHES_GALLERY.test(normalise(m[1]))) sites.push(`${file}:${i + 1}  imports ${m[1]}`);
			}
		});
	}

	// A manifest dependency is the same violation written somewhere the source scan
	// cannot see — and it is the form that actually breaks `pnpm pack`.
	const manifest = JSON.parse(await read(LIBRARY_MANIFEST));
	for (const field of ['dependencies', 'peerDependencies', 'devDependencies']) {
		for (const name of Object.keys(manifest[field] ?? {})) {
			if (REACHES_GALLERY.test(normalise(name)))
				sites.push(`${LIBRARY_MANIFEST}  ${field}.${name}`);
		}
	}

	return sites.length
		? fail('the library reaches into the Gallery', sites)
		: pass(`${files.length} file(s) and the manifest clean`);
}
