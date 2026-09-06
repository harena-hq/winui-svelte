import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// `vite dev` answered 500 on every page reaching a bits-ui primitive until this line,
	// and it took two rounds because the failure has two layers.
	//
	// bits-ui ships uncompiled `.svelte` files. Vite externalises the package from the SSR
	// pipeline, so Node's own ESM loader is asked for a `.svelte` extension it has no loader
	// for: `ERR_UNKNOWN_FILE_EXTENSION`. Naming `bits-ui` here keeps it inside Vite's
	// transform, where the Svelte plugin compiles it.
	//
	// That alone moves the error rather than fixing it. The next one is `rune_outside_svelte`
	// from `svelte-toolbelt`'s `box-extras.svelte.js`, which is bits-ui's dependency and was
	// still external — a `.svelte.js` module that Vite does not transform is a module whose
	// `$derived` never becomes anything. So the list is the transitive set of rune-using
	// packages, not the one this app imports: `runed` is here for the same reason, ahead of
	// the first page that reaches it.
	//
	// The production build never hit either, because `vite build` bundles what `vite dev`
	// externalises. A dev server nobody could start is what made the driving step in
	// docs/plan.md a rebuild each time.
	ssr: { noExternal: ['bits-ui', 'svelte-toolbelt', 'runed'] },

	plugins: [
		sveltekit({
			// Runes everywhere in our own source; leave dependencies alone.
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// The Gallery is a static showcase: every page is prerendered, so the
			// build is identical wherever it runs and the snapshot suite can serve
			// it from disk.
			adapter: adapter()
		})
	]
});
