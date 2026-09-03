import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Deliberately bare. Passing options to `sveltekit()` here makes `svelte-package` ignore
// `svelte.config.js` — it says so on every run — and the packaging step is the one that
// has to know about the preprocessor, so the configuration lives there instead.
export default defineConfig({
	plugins: [sveltekit()]
});
