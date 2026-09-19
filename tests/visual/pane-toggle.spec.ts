import type { Locator, Page } from '@playwright/test';

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

// The harness's second minimal frame is opened from the page after mount, because the control
// closes its own pane on entering minimal and that is the state the first frame photographs.
// This is what holds the ordering that rests on: a child's `onMount` runs before its parent's,
// so the page's write lands after the control's. If that ever reverses, the frame renders a
// closed pane, the visual baseline it exists for photographs nothing, and only the reference
// lane would notice — and that lane is skipped on every browser but the guest's.
test('the harness opens its second minimal pane, and it stays open', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const root = page.locator(minimal).nth(1);
	await expect(root).toHaveAttribute('data-pane-open', 'true');
	await expect(root).toHaveAttribute('data-overlay', 'true');
	await expect(root.locator('.pane')).toBeVisible();
});

/**
 * Click a point inside a control's content area, the way a finger does.
 *
 * `locator.click()` is the wrong instrument for exactly this test. Playwright checks that the
 * element it was given is the one that receives a pointer event at that point, and when the
 * dismiss layer is doing its job it is not — so the call waits for an actionability that will
 * never arrive and the test hangs rather than failing. That is worth writing down, because the
 * hang is the first evidence the layer works: it intercepts the pointer. `page.mouse` makes no
 * such check, which is what a real click is.
 */
async function clickContent(page: Page, root: Locator) {
	// `page.mouse` takes viewport coordinates and does none of the work `locator.click()` does
	// first, scrolling included. This harness is about 4,700px tall inside a window that is
	// `100vh` and clips (D16), so a frame below the fold has a box the mouse cannot reach — and
	// a click at coordinates nothing occupies is silent, not an error.
	await root.scrollIntoViewIfNeeded();
	const box = await root.locator('.content-grid').boundingBox();
	if (!box) throw new Error('the content grid has no box to click in');
	await page.mouse.click(box.x + box.width - 40, box.y + 40);
}

// `LightDismissLayer` (SplitView_themeresources.xaml:723) is transparent, so no capture can ask
// whether it is there; only driving it can. The second minimal frame renders an open overlaying
// pane at rest, so this is one click and not a toggle followed by one.
test('a click outside an overlaying pane closes it', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const root = page.locator(minimal).nth(1);
	await expect(root).toHaveAttribute('data-overlay', 'true');

	// Far from the pane and far from the toggle button: both sit above the layer and close the
	// pane through their own handlers, so hitting either would pass with no layer at all.
	await clickContent(page, root);

	await expect(root).toHaveAttribute('data-pane-open', 'false');
	await expect(root.locator('.pane')).toHaveCount(0);
});

// The expanded pane is not light-dismissible — `NavigationView::IsLightDismissible`
// (NavigationView.cpp:1842) is false while the SplitView is `Inline` — so the same click on the
// first frame, whose pane sits beside the content, must leave it open. Without this the layer
// could be rendered unconditionally and the test above would not notice.
test('a click on the content leaves a pane that is not overlaying alone', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const root = page.locator('.root[data-pane-display-mode="auto"]').first();
	await expect(root).toHaveAttribute('data-overlay', 'false');

	await clickContent(page, root);

	await expect(root).toHaveAttribute('data-pane-open', 'true');
});

// `OpenCompactOverlayLeft` (SplitView_themeresources.xaml:635) keeps `ColumnDefinition1` at
// `CompactPaneGridLength` and moves `ContentRoot` into the second column, so a rail that opens
// over the content leaves the content exactly where it was. No capture can ask this: both
// arrangements are a pane over content, and the difference is where the content's box starts.
test('opening a compact rail does not move or resize the content', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const root = page.locator('.root[data-pane-display-mode="leftCompact"]').first();
	const content = root.locator('.content-grid');
	await expect(root).toHaveAttribute('data-pane-open', 'false');

	const before = await content.boundingBox();
	if (!before) throw new Error('the content grid has no box before the pane opens');

	await root.locator('.pane-toggle').click();
	await expect(root).toHaveAttribute('data-overlay', 'true');

	const after = await content.boundingBox();
	if (!after) throw new Error('the content grid has no box after the pane opens');

	// Width and left edge both, because reserving nothing moves one and widens the other.
	expect(after.width).toBe(before.width);
	expect(after.x).toBe(before.x);
});

test('the top display mode has no pane toggle', async ({ page }) => {
	await page.goto('/dev/navigation-view');
	const top = page.locator('.root[data-pane-display-mode="top"]').first();
	await expect(top.locator('.pane-toggle')).toHaveCount(0);
});
