import type { Locator } from '@playwright/test';
import { expect, CDP_ENDPOINT, hydrated, test } from './fixtures';
import { snapshotAllThemes } from './themes';

function overflow(bar: Locator) {
	return bar.locator('..').locator('.overflow');
}

test('CommandBarFlyout overflow in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'CommandBarFlyoutOverflow', '/dev/command-bar-flyout-overflow');
});

test('the bar and the overflow are the same width', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	const specimen = page.getByTestId('expand-down');
	const bar = await specimen.boundingBox();
	const overflowBox = await overflow(specimen).boundingBox();
	expect(bar).not.toBeNull();
	expect(overflowBox).not.toBeNull();
	expect(Math.abs(bar!.width - overflowBox!.width)).toBeLessThanOrEqual(1);
	expect(Math.abs(bar!.x - overflowBox!.x)).toBeLessThanOrEqual(1);
});

test('the wider box sets the width', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	const wide = page.getByTestId('wide-overflow');
	const wideBar = await wide.boundingBox();
	const wideOverflow = await overflow(wide).boundingBox();
	const collapsed = await page.getByTestId('collapsed').boundingBox();
	expect(wideBar).not.toBeNull();
	expect(wideOverflow).not.toBeNull();
	expect(collapsed).not.toBeNull();
	expect(Math.abs(wideBar!.width - wideOverflow!.width)).toBeLessThanOrEqual(1);
	expect(wideBar!.width).toBeGreaterThan(collapsed!.width);
});

test('expanding up puts the overflow above the row', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	const up = page.getByTestId('expand-up');
	const down = page.getByTestId('expand-down');
	// The scroll and the resize are not ceremony. `FLYOUT_PLACEMENTS` keeps collision avoidance
	// on for every placement, so a specimen below the fold of a 720-tall viewport has no room on
	// the side it asked for and is legitimately flipped. `snapshotAllThemes` grows the viewport
	// to the page's own height before it captures, so the baseline sees every specimen placed as
	// written; these assertions have to reach the same state, and scrolling the specimen into
	// view and letting the floating layer recompute is how. Measured at the capture viewport,
	// `expand-up` reports `data-side="top"` with its overflow ending at the bar's top edge.
	await up.scrollIntoViewIfNeeded();
	await page.evaluate(() => window.dispatchEvent(new Event('resize')));
	await expect(up).toHaveAttribute('data-side', 'top');
	const upBar = await up.boundingBox();
	const upOverflow = await overflow(up).boundingBox();
	expect(upOverflow!.y + upOverflow!.height).toBeLessThanOrEqual(upBar!.y + 1);
	await down.scrollIntoViewIfNeeded();
	await page.evaluate(() => window.dispatchEvent(new Event('resize')));
	await expect(down).toHaveAttribute('data-side', 'bottom');
	const downBar = await down.boundingBox();
	const downOverflow = await overflow(down).boundingBox();
	expect(downOverflow!.y).toBeGreaterThanOrEqual(downBar!.y + downBar!.height - 1);
});

test('the seam is drawn once', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	// CommandBarFlyout_themeresources.xaml:966 and :975.
	const upBar = page.getByTestId('expand-up');
	const downBar = page.getByTestId('expand-down');
	await upBar.scrollIntoViewIfNeeded();
	await page.evaluate(() => window.dispatchEvent(new Event('resize')));
	await expect(upBar).toHaveAttribute('data-side', 'top');
	const up = overflow(upBar);
	await expect(up).toHaveCSS('border-bottom-width', '0px');
	await expect(up).toHaveCSS('border-top-width', '1px');
	await downBar.scrollIntoViewIfNeeded();
	await page.evaluate(() => window.dispatchEvent(new Event('resize')));
	await expect(downBar).toHaveAttribute('data-side', 'bottom');
	const down = overflow(downBar);
	await expect(down).toHaveCSS('border-top-width', '0px');
	await expect(down).toHaveCSS('border-bottom-width', '1px');
});

test('the corners meet square at the seam', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	const up = page.getByTestId('expand-up');
	await up.scrollIntoViewIfNeeded();
	await page.evaluate(() => window.dispatchEvent(new Event('resize')));
	await expect(up).toHaveAttribute('data-side', 'top');
	await expect(up).toHaveCSS('border-top-left-radius', '0px');
	await expect(up).not.toHaveCSS('border-bottom-left-radius', '0px');
	await expect(overflow(up)).toHaveCSS('border-bottom-left-radius', '0px');
	await expect(overflow(up)).not.toHaveCSS('border-top-left-radius', '0px');
});

test('a bar with no secondary commands has no ellipsis', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	// CommandBarFlyout_themeresources.xaml:1050.
	await expect(page.getByTestId('default').locator('.more')).toHaveCount(0);
	await page.goto('/dev/command-bar-flyout-overflow');
	const specimen = page.getByTestId('collapsed');
	const more = specimen.locator('.more');
	await expect(more).toHaveCount(1);
	// CommandBarFlyout_themeresources.xaml:568. Adjacent `*` and `Auto` columns share an edge.
	await expect(more).toHaveCSS('width', '44px');
	const moreBox = await more.boundingBox();
	const lastCommand = await specimen.locator('.primary > button').last().boundingBox();
	expect(moreBox).not.toBeNull();
	expect(lastCommand).not.toBeNull();
	expect(moreBox!.x).toBeGreaterThanOrEqual(lastCommand!.x + lastCommand!.width);
	expect(Math.abs(moreBox!.y - lastCommand!.y)).toBeLessThanOrEqual(1);
});

test("the overflow command shows its chevron and the bar's does not", async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	const specimen = page.getByTestId('chevron');
	// CommandBarFlyout_themeresources.xaml:552 and :649.
	await expect(overflow(specimen).locator('.overflow-chevron')).toBeVisible();
	await expect(specimen.locator('.primary .chevron-panel')).toHaveCount(0);
});

test('the overflow is painted, not see-through', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	// WD-002. `:528` points the presenter at `CommandBarFlyoutButtonBackground`, which is
	// `transparent` in light and dark because the real fill is the overflow popup's own
	// `SystemBackdrop`. Measured before the composite rule landed: `rgba(0, 0, 0, 0)` and a
	// `background-image` of `none`, with the page visible through the command rows.
	// The claim is about the fill, so it is read off `background-color`. The composite's own
	// first layer is a `linear-gradient` of the control's brush, which *is* transparent here —
	// asserting on `background-image` alone would pass while the menu stayed see-through.
	const surface = overflow(page.getByTestId('expand-down'));
	const fill = await surface.evaluate((node) => getComputedStyle(node).backgroundColor);
	expect(fill).not.toBe('rgba(0, 0, 0, 0)');
	expect(fill).not.toBe('transparent');
});

test('clicking the ellipsis opens and closes the overflow', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	await hydrated(page);
	const specimen = page.getByTestId('collapsed');
	await specimen.locator('.more').click();
	await expect(overflow(specimen)).toBeVisible();
	await specimen.locator('.more').click();
	await expect(overflow(specimen)).toHaveCount(0);
});
