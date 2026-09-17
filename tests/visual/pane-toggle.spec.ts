import { expect, test } from './fixtures';

// The defect this covers: the toggle used to be rendered inside the pane, so a minimal pane
// that is closed had no way to be opened from the control. NavigationView.xaml:180 anchors
// PaneToggleButtonGrid to RootGrid, where nothing about the pane's visibility reaches it.
const minimal = '.root[data-pane-display-mode="leftMinimal"]';

test('a closed minimal pane can be opened from the control itself', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const root = page.locator(minimal).first();
	await expect(root).toHaveAttribute('data-pane-open', 'false');
	await expect(root.locator('.pane')).toHaveCount(0);

	const toggle = root.locator('.pane-toggle');
	await expect(toggle).toBeVisible();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');

	await toggle.click();

	await expect(root).toHaveAttribute('data-pane-open', 'true');
	await expect(root).toHaveAttribute('data-overlay', 'true');
	await expect(root.locator('.pane')).toBeVisible();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');

	// And back, rather than being stuck the other way.
	await toggle.click();
	await expect(root).toHaveAttribute('data-pane-open', 'false');
	await expect(root.locator('.pane')).toHaveCount(0);
});

test('the top display mode has no pane toggle', async ({ page }) => {
	await page.goto('/dev/navigation-view');
	const top = page.locator('.root[data-pane-display-mode="top"]').first();
	await expect(top.locator('.pane-toggle')).toHaveCount(0);
});
