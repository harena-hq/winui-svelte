import type { Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';

/**
 * Where the pixels are produced.
 *
 * With `WINUI_CDP_ENDPOINT` set, the browser runs on a Windows host and this process
 * only drives it. That is the arrangement the tracked baselines come from: Segoe UI
 * Variable and Segoe Fluent Icons resolve there and nowhere else, and nothing of
 * Playwright's has to be installed on the machine being measured.
 *
 * Without it, the browser is local. Useful while writing a spec; its baselines are not
 * tracked, because a Linux box renders a substitute face.
 */
export const CDP_ENDPOINT = process.env.WINUI_CDP_ENDPOINT;

// `browser` is a built-in worker fixture; this overrides it rather than declaring a new
// one, so the generics stay off.
export const test = base.extend({
	browser: [
		async ({ playwright, browserName }, use) => {
			const browser = CDP_ENDPOINT
				? await playwright.chromium.connectOverCDP(CDP_ENDPOINT)
				: await playwright[browserName].launch();
			await use(browser);
			await browser.close();
		},
		{ scope: 'worker' }
	]
});

export { expect };

/**
 * Resolves once the page's own JavaScript has run.
 *
 * Every test that drives a control with input needs this, and two have now been caught without
 * it: the theme select in `theme-switch.spec.ts` (sealed in `45f2026`) and the touch pull in
 * `refresh-gesture.spec.ts`. Server-rendered markup is present and interactive-looking before any
 * handler is attached, so input that lands first changes the DOM, runs no Svelte code, and leaves
 * the rest of the test measuring a page that never heard it. Nothing about it is random except
 * the arrival order, which is why a single-file run never loses and a full suite does.
 *
 * The signal is the client's own write, not a timeout. The root layout's apply-and-persist effect
 * sets `winui-svelte:theme` on mount whatever the theme is, including the empty string for System
 * (`apps/gallery/src/routes/+layout.svelte:25`), and nothing writes that key server-side — so the
 * key existing is exactly "that effect has run", which is exactly "the handlers are attached".
 */
export function hydrated(page: Page) {
	return expect
		.poll(() => page.evaluate(() => localStorage.getItem('winui-svelte:theme')))
		.not.toBeNull();
}
