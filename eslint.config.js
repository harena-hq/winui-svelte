import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

// No `svelteConfig` is passed to the Svelte parser: SvelteKit 2.63 moved its
// configuration into vite.config.ts, so there is no svelte.config.js to hand it.
// Nothing here preprocesses, so the parser does not need one.
export default ts.config(
	// `.private/` is untracked and unpublished — measurement scripts, dispatch logs, captures.
	// It is not this project's code and linting it only means a throwaway probe can turn
	// `pnpm verify` red, which is what happened.
	{
		ignores: [
			'**/node_modules/',
			'**/.svelte-kit/',
			'**/dist/',
			'**/build/',
			'.private/',
			'.pnpm-store/'
		]
	},
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
	},
	// `svelte/no-navigation-without-resolve` asks that every `href` go through SvelteKit's
	// `resolve()`, so an app served under a base path still links correctly. That is right for
	// the Gallery and inapplicable to the library, which is not a SvelteKit app and must not
	// import from `$app/*`. No gate reads that specifier: C3 refuses an import that reaches
	// `apps/gallery`, C6 refuses build tooling, and neither is this rule.
	// Every `href` a library component renders arrives as a prop, and resolving it is the
	// consumer's job; there is nothing here for the rule to protect.
	//
	// Scoped to the package rather than disabled in the one file that tripped it. A per-file
	// comment reads as "this component is an exception", and it is not: no component in this
	// package can satisfy the rule, and `HyperlinkButton` only avoids it by rendering its anchor
	// through `<svelte:element>`, which the rule does not inspect.
	{
		files: ['packages/winui-svelte/**/*.svelte'],
		rules: { 'svelte/no-navigation-without-resolve': 'off' }
	}
);
