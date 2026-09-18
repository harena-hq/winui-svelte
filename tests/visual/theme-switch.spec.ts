import { expect, test } from './fixtures';

// Behavioural, not visual — the one gap `snapshotAllThemes` cannot close by construction.
// A snapshot sets `dataset.theme` by hand and asks whether the page renders correctly in
// that state; it never asks whether the control that is supposed to put the page into
// that state actually works. The two questions are independent, and the second one had a
// real answer of "no": the theme select silently reverted every choice to System because
// its persistence effect read its own previous write back on every re-run.

test('choosing a theme from the control actually changes and persists it', async ({ page }) => {
	await page.goto('/settings');
	await expect(page.locator('html')).not.toHaveAttribute('data-theme');

	await page.selectOption('select', 'dark');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

	// The failure mode this guards was exactly this reload: the effect's read of its own
	// write raced the user's selection, so the value that survived a re-render was
	// whichever one happened to sit in storage from a previous run — never the fresh pick.
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await expect(page.locator('select')).toHaveValue('dark');

	await page.selectOption('select', '');
	await expect(page.locator('html')).not.toHaveAttribute('data-theme');
});
