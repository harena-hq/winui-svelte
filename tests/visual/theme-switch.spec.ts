import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Behavioural, not visual — the one gap `snapshotAllThemes` cannot close by construction.
// A snapshot sets `dataset.theme` by hand and asks whether the page renders correctly in
// that state; it never asks whether the control that is supposed to put the page into
// that state actually works. The two questions are independent, and the second one had a
// real answer of "no": the theme select silently reverted every choice to System because
// its persistence effect read its own previous write back on every re-run.

// `hydrated` is why this test stopped being intermittent. The `<select>` is in the
// server-rendered HTML before any of its Svelte code has run, so a `selectOption` that lands
// first changes the DOM value, fires no handler, and leaves the rest of the test measuring a page
// that never heard the choice — a failure at the line below, blaming the thing that works. It got
// likelier as the app grew: adding six routes was enough to take it from never seen to every
// other full-suite run, while running this file alone still passed every time.
//
// The wait is a real signal rather than a timeout. The root layout's apply-and-persist effect
// writes `winui-svelte:theme` on mount whatever the value is, including the empty string for
// System (`apps/gallery/src/routes/+layout.svelte:25`), and nothing writes that key server-side.
// The key existing therefore means that effect has run, which means the handlers are attached.
const hydrated = (page: Page) =>
	expect.poll(() => page.evaluate(() => localStorage.getItem('winui-svelte:theme'))).not.toBeNull();

test('choosing a theme from the control actually changes and persists it', async ({ page }) => {
	await page.goto('/settings');
	await expect(page.locator('html')).not.toHaveAttribute('data-theme');
	await hydrated(page);

	await page.selectOption('select', 'dark');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

	// The failure mode this guards was exactly this reload: the effect's read of its own
	// write raced the user's selection, so the value that survived a re-render was
	// whichever one happened to sit in storage from a previous run — never the fresh pick.
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await expect(page.locator('select')).toHaveValue('dark');

	await hydrated(page);
	await page.selectOption('select', '');
	await expect(page.locator('html')).not.toHaveAttribute('data-theme');
});
