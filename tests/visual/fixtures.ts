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

/** The key the Gallery's root layout writes on mount, and nothing writes server-side. */
const THEME_KEY = 'winui-svelte:theme';

/** Where the init script below records that this document has written it. */
const SIGNAL = '__winuiHydrated';

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
	],

	/**
	 * Every navigation waits for the page's own JavaScript before a test reads or drives it.
	 *
	 * `hydrated()` below says why that wait is needed. This fixture exists because saying so
	 * was not enough: four of the 109 spec files called the helper, ten times in all, against
	 * the 156 `page.goto` calls those files contain. The suite then failed a single test on
	 * about one run in four, a different one each time, and every one of them passed when its
	 * own spec was run alone.
	 *
	 * That pattern reads as contention, and contention is not sufficient to produce it: at
	 * ninety-six workers — six times the contention the capped configuration ever allowed — the
	 * suite is green with this wait in place and loses more than twenty tests a run without it
	 * (measured 2026-09-18; the numbers are in `docs/plan.md`, "Verification"). What the suite
	 * was racing is the page's own startup. Server-rendered markup is present and
	 * interactive-looking before the client has run: a keypress that lands first is delivered to
	 * a document with no handler and is gone, and **a poll cannot recover a keypress the page
	 * never heard**. A read that lands first sees markup the client has not finished with — a
	 * `ColorSpectrum`'s canvas is painted from an effect, and a flyout's surface is portalled by
	 * one. The worker count moves only how often that is lost.
	 *
	 * `goto` and `reload` are wrapped because they are the two calls in this suite that start a
	 * document over *and load this app*. An in-app SvelteKit navigation — `pane-expansion.spec.ts`
	 * drives one by clicking a shell row — does not: the client is already running and renders
	 * the new route itself, so there is nothing here to wait for. No spec calls `goBack` or
	 * `newPage`. One calls `setContent`: `gradient-in-colour-property.spec.ts` writes a bare
	 * document to ask the renderer which CSS properties refuse a gradient. That does start a
	 * document over, and it is not an omission from the two wrapped here — the page it writes
	 * carries no client, so there is no first write to wait for. A `setContent` that loaded this
	 * app would belong in the wrapper with the other two.
	 */
	page: async ({ page }, use) => {
		// The signal has to be **this document's**, and the obvious reading of the key is not.
		// `localStorage` outlives a navigation, so a poll that only asks whether the key is set
		// passes instantly on every navigation after the first in a context — on the reload in
		// color-picker-slider.spec.ts's Ctrl+Arrow alpha test above all, which is followed
		// immediately by a keypress. Recording the write in `window` instead is per-document by
		// construction, because the object is. Found by a cold review, after the vacuous version
		// had passed the whole battery.
		await page.addInitScript(
			([key, signal]) => {
				const write = Storage.prototype.setItem;
				// `Storage.prototype` is shared with `sessionStorage`, and a write that throws is
				// not a write, so the signal is narrowed to the one this is about: the key, in
				// local storage, having actually been stored.
				Storage.prototype.setItem = function (this: Storage, name: string, value: string) {
					write.call(this, name, value);
					if (name === key && this === window.localStorage) {
						(window as unknown as Record<string, boolean>)[signal] = true;
					}
				};
			},
			[THEME_KEY, SIGNAL] as const
		);

		const navigate = page.goto.bind(page);
		const reload = page.reload.bind(page);
		page.goto = async (url, options) => {
			const response = await navigate(url, options);
			await hydrated(page);
			return response;
		};
		page.reload = async (options) => {
			const response = await reload(options);
			await hydrated(page);
			return response;
		};
		await use(page);
	}
});

export { expect };

/**
 * How long a document is given to run its own JavaScript.
 *
 * Sized from the measurement rather than from the default: hydration of `/dev/color-picker`,
 * the heaviest route in the suite, is 6.6s cold on an idle host and longer under load.
 *
 * It is a ceiling and not a guarantee. Playwright spends it from whatever is left of the test's
 * own budget, which is 30s unless the file says otherwise, so a page that never runs at all
 * reports this wait's sentence when the wait is what expired and reports `Test timeout of
 * 30000ms exceeded` when the budget is. The number is under 30s so that the first is the usual
 * one; it is not under every test's remaining budget, and no number would be.
 */
const HYDRATION_TIMEOUT = 20_000;

/**
 * Resolves once the current document's own JavaScript has run.
 *
 * Every test that drives a control with input needs this, and two were caught without it: the
 * theme select in `theme-switch.spec.ts` (sealed in `73c7083`) and the touch pull in
 * `refresh-gesture.spec.ts`. Server-rendered markup is present and interactive-looking before any
 * handler is attached, so input that lands first changes the DOM, runs no Svelte code, and leaves
 * the rest of the test measuring a page that never heard it. Nothing about it is random except
 * the arrival order, which is why a single-file run never loses and a full suite does.
 *
 * The signal is the client's own write, not a timeout. The root layout's apply-and-persist effect
 * sets `winui-svelte:theme` on mount whatever the theme is, including the empty string for System
 * (the theme `$effect` in `apps/gallery/src/routes/+layout.svelte`). Nothing writes that key
 * server-side, and nothing in this suite writes it into a document ahead of that document's own
 * scripts — the theme writes in `themes.ts` and `color-picker.spec.ts` both land after this wait
 * has returned — so the write is that effect having run.
 *
 * That is the root layout's effect and not the control's, which is a weaker claim than it looks
 * only if the two can be separated. In `svelte@5.57.0`, a template's own handlers are delegated
 * from listeners installed during the mount itself (`src/internal/client/render.js:257` calls
 * `event_handle`, which attaches at `:248`), while a component's `$effect` is queued during the
 * mount and run afterwards, in a batch processed in a microtask
 * (`src/internal/client/reactivity/batch.js:819`). So the handlers are up before any of those
 * effects; and the effects of one batch run synchronously, which a `waitForFunction` polling
 * from outside the page cannot observe the middle of. What this does not cover is work deferred
 * to a *later* batch than the root layout's, or to a later frame: SelectorBar sets `data-applied`
 * two animation frames after it mounts, and a test about its load reads that attribute itself.
 */
async function hydrated(page: Page) {
	try {
		await page.waitForFunction(
			(signal) => (window as unknown as Record<string, boolean>)[signal] === true,
			SIGNAL,
			{ timeout: HYDRATION_TIMEOUT }
		);
	} catch (cause) {
		// Said here because the raw failure is a predicate that stayed false, which is equally
		// true of a page that is merely slow and of one whose script threw on load.
		throw new Error(
			`the page never ran its own JavaScript: nothing wrote ${THEME_KEY} within ${HYDRATION_TIMEOUT}ms of ${page.url()}`,
			{ cause }
		);
	}
}
