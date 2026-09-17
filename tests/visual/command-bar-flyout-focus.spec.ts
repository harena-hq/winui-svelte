import { expect, hydrated, test } from './fixtures';

// `CommandBarFlyoutCommandBar.cpp:49` and `:62` focus a command with `FocusState::Programmatic`,
// which draws no visual; `:1183` and `:1278`, the Tab paths, pass `FocusState::Keyboard`, which
// do.
//
// Every one of these pages mounts its flyouts open at once, which is a harness state and not one
// WinUI has: each focus scope settles in mount order and the last one keeps focus. So each route
// can assert exactly one specimen — its last — and the routes were ordered to put a different
// branch last on each. Reading `document.activeElement` once straight after `goto` reads it before
// any scope has run; two consecutive runs of an earlier version of this file failed a different
// three of five that way, which is what the polling below is for.

function focused(page: import('@playwright/test').Page) {
	return page.evaluate(() => {
		const active = document.activeElement as HTMLElement | null;
		if (!active) return null;
		return {
			tag: active.tagName.toLowerCase(),
			className: active.className,
			label: active.getAttribute('aria-label'),
			// The test id is on `.bar`, and a focused secondary command is in `.overflow`, which is
			// `.bar`'s sibling — so `closest('[data-testid]')` is `null` for a focused secondary command.
			// Resolve through `.surface`, which contains both.
			specimen:
				active.closest('.surface')?.querySelector('[data-testid]')?.getAttribute('data-testid') ??
				null,
			focusVisible: active.matches(':focus-visible')
		};
	});
}

function settlesOn(page: import('@playwright/test').Page, specimen: string) {
	return expect.poll(async () => (await focused(page))?.specimen ?? null).toBe(specimen);
}

test('an opening flyout focuses its first command and lights nothing', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	await hydrated(page);
	await settlesOn(page, 'bar-toggles-labels');
	const state = await focused(page);
	expect(state!.tag).toBe('button');
	expect(state!.className).toContain('root');
	expect(state!.label).toBe('Bold');
	expect(state!.focusVisible).toBe(false);
});

test('a disabled first command is skipped', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	await hydrated(page);
	await settlesOn(page, 'disabled-command');
	const state = await focused(page);
	// `Save` is first in the markup and disabled; the walk at `:1381` takes `Share`.
	expect(state!.label).toBe('Share');
	expect(state!.focusVisible).toBe(false);
});

test('a bar with no primary commands focuses its first secondary one', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	await hydrated(page);
	await settlesOn(page, 'secondary-only');
	const state = await focused(page);
	// `:34` — no primary commands, so the secondary collection is what gets focused. The bar of
	// this specimen is 2px tall at zero opacity, so focusing it instead would be focusing nothing.
	expect(state!.className).toContain('root');
	expect(state!.focusVisible).toBe(false);
	// Measured: the first secondary command of this specimen.
	expect(state!.label).toBe('Select all');
	const insideOverflow = await page.evaluate(() => !!document.activeElement?.closest('.overflow'));
	expect(insideOverflow).toBe(true);
});

test('Tab still lights the command it moves to', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	await hydrated(page);
	await settlesOn(page, 'bar-toggles-labels');
	await page.keyboard.press('Tab');
	await expect.poll(async () => (await focused(page))?.focusVisible ?? null).toBe(true);
	// Tab must move within the flyout, not out of it: a fix that suppressed the visual with CSS
	// would pass the line above and fail this one.
	expect((await focused(page))!.specimen).toBe('bar-toggles-labels');
});
