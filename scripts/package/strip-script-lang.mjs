import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Remove `lang="ts"` from the packaged components.
 *
 * The library is written in TypeScript and ships JavaScript. `svelte-package` runs the
 * preprocessor declared in `svelte.config.js`, so by the time a component reaches `dist`
 * its script body is already plain JS — but the opening tag still says `lang="ts"`, and
 * `svelte-package` does not take it off.
 *
 * That attribute is a claim about the file rather than a description of it, and a wrong
 * one: it tells every consumer's toolchain to expect TypeScript in a file that no longer
 * holds any. ADR 0002's promise is that installing this library adds no build step.
 *
 * This comment used to name gate C6 as the layer that refuses the attribute, and that was
 * the circularity measured on 2026-09-18: C6 walked `dist` for `lang="ts"`, and the build
 * script runs this file immediately before it, so the gate searched for a string this step
 * had just deleted. It could not fail. C6 now asserts from the source side that this step
 * is still in the build script, and `pnpm smoke` — which compiles the packaged components
 * in a consumer — is what actually refuses TypeScript that survives packaging.
 *
 * Rewriting built output is not something to do often. It is done here because the step
 * that should do it does not, and because the alternative — writing the library's
 * components in JavaScript with JSDoc types so the attribute never appears — would trade
 * every component's readability for one line of packaging.
 */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DIST = join(ROOT, 'packages', 'winui-svelte', 'dist');

// Only on an opening `<script …>` tag, and only the whole attribute: a `lang="ts"` inside
// a component's own markup or a comment is text, not a claim about the file.
const LANG = /(<script\b[^>]*?)\s+lang=["'](?:ts|typescript)["']/g;

async function* svelteFiles(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* svelteFiles(path);
		else if (entry.name.endsWith('.svelte')) yield path;
	}
}

let rewritten = 0;
for await (const path of svelteFiles(DIST)) {
	const source = await readFile(path, 'utf8');
	const stripped = source.replace(LANG, '$1');
	if (stripped === source) continue;
	await writeFile(path, stripped);
	rewritten++;
}

console.log(`stripped lang="ts" from ${rewritten} packaged component(s)`);
