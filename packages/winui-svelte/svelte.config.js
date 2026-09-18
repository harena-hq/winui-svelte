import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * The library's own build, and `svelte-package` reads it.
 *
 * Vite applies `vitePreprocess` on its own during a dev or app build, which is why the
 * Gallery compiles `lang="ts"` without naming it. `svelte-package` runs outside Vite: with
 * no preprocessor declared it copies the components out with their TypeScript intact, and
 * a consumer on bare Vite plus Svelte cannot compile them. That is build tooling imposed
 * on whoever installs the package.
 *
 * Gate C6 asserts that this declaration exists, which is the way it actually gets broken;
 * it cannot tell whether the preprocessor did its work, because `vitePreprocess({ script:
 * false })` would satisfy it and ship TypeScript anyway. `pnpm smoke` is the layer that
 * reads the result: with this line deleted on 2026-09-18 the build exited 0, `publint` was
 * green and every conformance gate passed, and the smoke consumer failed with 95 compile
 * errors.
 */
export default {
	// `script: true` explicitly: the option's default has moved between major versions of
	// the plugin, and a preprocessor that silently handles only `<style>` leaves exactly
	// the TypeScript this file exists to remove.
	preprocess: vitePreprocess({ script: true }),

	compilerOptions: {
		// Runes everywhere in our own source; leave dependencies alone.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	}
};
