import type { Locator } from '@playwright/test';
import { expect, CDP_ENDPOINT, hydrated, test } from './fixtures';
import { growViewportToContent, snapshotAllThemes } from './themes';

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
	// Centres, not tops. CommandBarFlyout_themeresources.xaml:573 stretches the button to the
	// bar's interior where :1043 insets the command row by three, so the two boxes deliberately
	// no longer start at the same y; what the template makes equal is where their contents sit.
	expect(
		Math.abs(moreBox!.y + moreBox!.height / 2 - (lastCommand!.y + lastCommand!.height / 2))
	).toBeLessThanOrEqual(1);
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

test("the overflow rows wear the flyout's command brushes", async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	const row = overflow(page.getByTestId('expand-down')).locator('.root').first();
	const margins = await row.evaluate((element) => {
		const computed = getComputedStyle(element);
		return {
			actual: computed.getPropertyValue('--winui-AppBarButtonInnerBorderOverflowMargin').trim(),
			expected: computed
				.getPropertyValue('--winui-CommandBarFlyoutAppBarButtonInnerBorderMargin')
				.trim()
		};
	});
	expect(margins.actual).toBe(margins.expected);
});

test('clicking the ellipsis opens and closes the overflow', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	await hydrated(page);
	const specimen = page.getByTestId('collapsed');
	// This specimen was the fifth of five and is the fifth of eight since the states below were
	// added, which put it below the fold: Playwright scrolls a trigger into view before clicking
	// it, that moves the anchor, and the popover correctly closes before the expanded state can be
	// inspected. Nothing about this control changed; the page grew under it.
	await growViewportToContent(page);
	await page.evaluate(() => window.dispatchEvent(new Event('resize')));
	await specimen.locator('.more').click();
	await expect(overflow(specimen)).toBeVisible();
	await specimen.locator('.more').click();
	await expect(overflow(specimen)).toHaveCount(0);
});

test('a bar with no primary commands is hidden, not collapsed', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	const bar = page.getByTestId('secondary-only');
	// CommandBarFlyout_themeresources.xaml:866-:874, and :868's comment for why it is hidden
	// rather than collapsed: the overflow popup is anchored to this element.
	await expect(bar.locator('..')).toHaveAttribute('data-view-state', 'secondary-commands-only');
	// `:872`'s zero, read back through `box-sizing: border-box`: the declaration sizes the border
	// box, which cannot go below the borders, so the content box is zero and the computed height
	// is the two one-pixel edges. Chromium resolves `height` in the element's own box-sizing —
	// the same reading that makes the empty bar next door 48 and not 46.
	await expect(bar).toHaveCSS('height', '2px');
	await expect(bar).toHaveCSS('opacity', '0');
	await expect(bar).toHaveCSS('pointer-events', 'none');
	// The menu the hidden bar anchors is still there and still drawn.
	const menu = await overflow(bar).boundingBox();
	expect(menu).not.toBeNull();
	expect(menu!.height).toBeGreaterThan(40);
});

test('without primary commands the overflow keeps all four corners', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	// At the default viewport collision avoidance legitimately flips the lower specimen upward, so
	// it would not be in the down state this test names.
	await growViewportToContent(page);
	// CommandBarFlyout_themeresources.xaml:984 and :993 are one shape, not two: both restate the
	// unfiltered corner radius and the uniform border thickness, which is what the two
	// `WithPrimaryCommands` states at :966 and :975 filter for the seam. So the up specimen and
	// the down specimen must measure the same.
	for (const [id, side] of [
		['secondary-only-up', 'top'],
		['secondary-only', 'bottom']
	]) {
		const bar = page.getByTestId(id);
		// Same reason the other placement tests scroll and resize: `FLYOUT_PLACEMENTS` keeps
		// collision avoidance on, so a specimen below the fold is legitimately flipped and would
		// not be in the state its name claims.
		await bar.scrollIntoViewIfNeeded();
		await page.evaluate(() => window.dispatchEvent(new Event('resize')));
		await expect(bar).toHaveAttribute('data-side', side);
		const menu = overflow(bar);
		const measured = await menu.evaluate((node) => {
			const computed = getComputedStyle(node);
			return {
				radii: [
					computed.borderTopLeftRadius,
					computed.borderTopRightRadius,
					computed.borderBottomRightRadius,
					computed.borderBottomLeftRadius
				],
				widths: [
					computed.borderTopWidth,
					computed.borderRightWidth,
					computed.borderBottomWidth,
					computed.borderLeftWidth
				]
			};
		});
		expect(new Set(measured.radii).size).toBe(1);
		expect(measured.radii[0]).not.toBe('0px');
		// CommandBarFlyoutBorderThemeThickness, against the Up and Down thicknesses that zero one
		// edge apiece.
		expect(measured.widths).toEqual(['1px', '1px', '1px', '1px']);
	}
});

test('an ellipsis with nothing behind it opens no overflow', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-overflow');
	const bar = page.getByTestId('primary-only-forced');
	// `OverflowButtonVisibility="Visible"` (`:1050`) puts the button on the bar; :863 collapses
	// `OverflowContentRoot` all the same, because `PrimaryCommandsOnly` is about the commands and
	// not about the button.
	await expect(bar.locator('..')).toHaveAttribute('data-view-state', 'primary-commands-only');
	await expect(bar.locator('.more')).toHaveCount(1);
	await expect(overflow(bar)).toHaveCount(0);
});
