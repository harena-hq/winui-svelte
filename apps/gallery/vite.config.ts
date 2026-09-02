import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
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
