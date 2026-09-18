import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fail, pass, read, ROOT, styleBlocks, walk } from './lib.mjs';

/**
 * ADR 0002 promises that installing this library adds no build step. This gate used to
 * check that promise by walking the built `dist` for four marker families. What follows was
 * measured on 2026-09-18, each failure planted on its own with the tree restored between.
 *
 * **Its script arm could not fire.** `package.json`'s build script runs
 * `scripts/package/strip-script-lang.mjs` immediately after `svelte-package`, in the same
 * `&&` chain, and that step deletes `lang="ts"` from every packaged component. The gate
 * then walked the output looking for the string the previous command had just removed.
 * Removing `preprocess` from `svelte.config.js` and rebuilding produced a `dist` whose
 * components open `<script module>` over `export interface` and `import type` — raw
 * TypeScript, shipped, with no `lang` attribute anywhere for the gate to find. `pnpm build`
 * exited 0, `publint` said "All good", and `pnpm conform` reported 10 passing, 0 failing.
 * `pnpm smoke` refused the same tarball with 95 compile errors, naming the first file and
 * line. The plan's own rule is that a gate is not trusted until it has been seen to fail;
 * this arm had only ever passed, because it could not do anything else.
 *
 * **The Tailwind arm fires and the consumer build does not see it.** An `@apply` planted in
 * a component's `<style>` reached `dist` untouched — preprocessing does not expand it and
 * no consumer expands it either — and `pnpm smoke` installed, built and rendered green
 * while shipping a rule the browser drops. That is the class this gate must keep.
 *
 * So the subject moved from `dist` to the source the package is built from, and the arms
 * are now what a static read can establish. **`pnpm smoke` is the layer that answers**
 * whether a consumer can install and build this package: it packs the tarball, installs it
 * outside the workspace, mounts ten exports in a bare Vite + Svelte app, builds for the
 * browser and for SSR, and refuses a build importing a name the package does not export.
 * It also refuses a packed manifest carrying any runtime dependency, which is the other way
 * a styling tool could arrive. What is below is the cheap layer that runs without a build.
 *
 * **What it does not reach.** It reads the working tree rather than git, so an uncommitted
 * file counts and a committed one that has been deleted on disk does not. And its patterns
 * are text, not a parsed stylesheet: a comment between the at-rule and its argument,
 * `@import/**\/"tailwindcss"`, and the CSS escape `@\61 pply` are the same rules to a parser
 * and different strings to these. Both were named in cold review and left, because a regex
 * cannot win that argument and pretending otherwise is how a gate's reader stops checking.
 * The floor is that the ordinary way in is refused and has to be argued for.
 */
export const id = 'C6';
export const title =
	"the library's styles need no build tool, and the packaging strip is still declared";

const SRC = 'packages/winui-svelte/src';
const PACKAGE = 'packages/winui-svelte';
const CONFIG = `${PACKAGE}/svelte.config.js`;
const MANIFEST = `${PACKAGE}/package.json`;

/**
 * Tailwind 4's at-rules, which only Tailwind resolves. `\b` alone lets `@import` through on
 * a neighbouring name, so the entry point tests for a quote, a `/` or a `)` after the package
 * name: `@import "tailwindcss/preflight"` is Tailwind and `@import "tailwindcss-notes.css"` is
 * a file someone named badly. `url(...)` is the same import to a parser and was missed until
 * cold review, as was the case: at-rule names are ASCII case-insensitive, so `@Apply` is the
 * same rule too and was not the same string to this gate until 2026-09-18.
 */
const TAILWIND = [
	[/@import\s+(?:url\(\s*)?["']?tailwindcss(?=["'/)\s;])/i, 'Tailwind 4 entry point'],
	[
		/@(tailwind|apply|config|plugin|source|theme|utility|variant|custom-variant|reference|screen)\b/i,
		'Tailwind directive'
	]
];

/**
 * A `<style>` the consumer's bundler cannot read on its own. Unquoted and spaced forms are
 * the same attribute to an HTML parser: `<style lang=scss>` and `<style lang = "scss">`
 * both evaded this until cold review found them.
 */
const STYLE_PREPROCESSOR = /<style\b[^>]*\blang\s*=\s*["']?(scss|sass|less|stylus|postcss|pcss)\b/i;

/** Extensions no bundler compiles without a plugin. Their existence is the violation. */
const PREPROCESSOR_SOURCE = /\.(scss|sass|less|styl|stylus|pcss|postcss)$/i;

/** A config file here means the package expects a tool to run over it. */
const TOOL_CONFIG = /^(tailwind|postcss)\.config\.[cm]?[jt]s$/i;

/**
 * The library is written in TypeScript and ships JavaScript, so it does depend on a build
 * tool — its own, at packaging time. These are the declarations that apply it, and the order
 * they have to be in: stripping before `svelte-package` strips an old `dist` that the next
 * command then recreates unstripped.
 *
 * None of this says the stripping worked, which is why the title says declared rather than
 * done. `vitePreprocess({ script: false })` satisfies the declaration, so does `{}`, and a
 * build script reading `svelte-package && echo strip-script-lang.mjs` satisfies the other:
 * the gate reads a string, not a shell. Only a consumer compiling the packaged components
 * reads the result, and that is `pnpm smoke`. These fail on the way it actually breaks,
 * which is one of them being edited away or reordered.
 */
async function packagingStillStrips() {
	const sites = [];

	try {
		const config = (await import(new URL(`../../${CONFIG}`, import.meta.url).href)).default;
		const declared = Array.isArray(config?.preprocess)
			? config.preprocess.length > 0
			: Boolean(config?.preprocess);
		if (!declared)
			sites.push(
				`${CONFIG}  declares no \`preprocess\`, so \`svelte-package\` copies TypeScript out`
			);
	} catch (error) {
		// Reported, not returned: the manifest below is readable whether or not this
		// package's dependencies are installed, and a gate that checks one of two things
		// when it is unlucky is a gate whose pass means two different things.
		sites.push(`${CONFIG}  cannot be imported: ${error.message}`);
	}

	const build = JSON.parse(await read(MANIFEST)).scripts?.build ?? '';
	const at = (step) => build.indexOf(step);
	for (const step of ['svelte-package', 'strip-script-lang.mjs'])
		if (at(step) < 0) sites.push(`${MANIFEST}  the build script no longer runs \`${step}\``);
	if (at('svelte-package') >= 0 && at('strip-script-lang.mjs') >= 0)
		if (at('strip-script-lang.mjs') < at('svelte-package'))
			sites.push(
				`${MANIFEST}  the build script strips before \`svelte-package\`, which then writes it back`
			);

	return sites;
}

/**
 * Where a Tailwind at-rule would have to live to mean anything: a stylesheet, with its
 * comments blanked. A sentence explaining why `@apply` is refused is prose wherever it is
 * written, and the first two forms of this gate failed on their own explanation.
 */
function stylesheets(file, source) {
	const uncommented = (css) => css.replace(/\/\*[\s\S]*?\*\//g, ' ');
	if (file.endsWith('.svelte')) return styleBlocks(source).map((b) => uncommented(b.body));
	return file.endsWith('.css') ? [uncommented(source)] : [];
}

export async function run() {
	// Every file, not an extension set: the extension check below is about which files
	// exist at all, and an allow-list would have been the thing deciding that a `.scss` is
	// absent by never looking for one.
	const files = await walk(SRC, () => true);

	// `pending` would be a lie here: the gate is due, it simply cannot see its subject. An
	// unreadable source tree is a broken checkout, not a clean one.
	if (files.length === 0) return fail(`${SRC} holds no source files — this is not a checkout`);

	const sites = [];
	for (const file of files) {
		if (PREPROCESSOR_SOURCE.test(file)) {
			sites.push(`${file}  a stylesheet only a preprocessor can compile`);
			continue;
		}
		if (!/\.(svelte|css)$/.test(file)) continue;

		const source = await read(file);
		const tag = source.match(STYLE_PREPROCESSOR);
		if (tag) sites.push(`${file}  CSS preprocessor: ${tag[0]}`);

		// Scanned per `<style>` block rather than per file, so that a component's own prose
		// about Tailwind is prose. Every earlier form of this gate failed on the sentence
		// describing why the directive is refused.
		for (const css of stylesheets(file, source))
			for (const [pattern, what] of TAILWIND) {
				const m = css.match(pattern);
				if (m) sites.push(`${file}  ${what}: ${m[0]}`);
			}
	}

	for (const name of await readdir(join(ROOT, PACKAGE)))
		if (TOOL_CONFIG.test(name)) sites.push(`${PACKAGE}/${name}  a build tool's configuration`);

	sites.push(...(await packagingStillStrips()));

	return sites.length
		? fail("ADR 0002's no-build-tooling promise is not held", sites)
		: pass(`${files.length} source file(s) clean, both packaging declarations in place`);
}
