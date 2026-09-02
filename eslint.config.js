import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

// No `svelteConfig` is passed to the Svelte parser: SvelteKit 2.63 moved its
// configuration into vite.config.ts, so there is no svelte.config.js to hand it.
// Nothing here preprocesses, so the parser does not need one.
export default ts.config(
	{ ignores: ['**/node_modules/', '**/.svelte-kit/', '**/dist/', '**/build/'] },
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	}
);
