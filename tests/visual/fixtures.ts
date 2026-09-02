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
