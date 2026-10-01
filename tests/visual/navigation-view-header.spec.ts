import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

/**
 * The header — `HeaderContent` (`NavigationView.xaml:404`), set in
 * `NavigationViewTitleHeaderContentControlTextStyle` (`NavigationView_themeresources.xaml:1087`).
 *
 * The style's margin is `NavigationViewHeaderMargin`, 56,44, and only the left pane's two minimal
 * states replace it (`NavigationView.xaml:18`, `:34`); a top pane keeps it. Measured on the
 * reference on 2026-10-01: the Gallery's left sample draws "Sample Page 1" with its ink 58 from
 * the content's inner edge, and its top sample "This is Header Text" 57 — the 56 and each first
 * glyph's own side bearing. Each box is read against the content grid's padding box.
 */

async function header(page: Page, frame: string) {
	return page.locator(`#${frame} .content-grid`).evaluate((grid) => {
		const style = getComputedStyle(grid);
		const g = grid.getBoundingClientRect();
		const h = grid.querySelector<HTMLElement>('.header-content')!;
		const b = h.getBoundingClientRect();
		const own = getComputedStyle(h);
		return {
			left: b.left - g.left - parseFloat(style.borderLeftWidth),
			top: b.top - g.top - parseFloat(style.borderTopWidth),
			height: b.height,
			fontFamily: own.fontFamily,
			fontSize: own.fontSize,
			fontWeight: own.fontWeight,
			minHeight: own.minHeight
		};
	});
}

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/navigation-view-header');
});

test('a left pane and a top pane both set the header 56 in and 44 down', async ({ page }) => {
	for (const frame of ['left', 'top']) {
		const box = await header(page, frame);
		expect(box.left, frame).toBe(56);
		expect(box.top, frame).toBe(44);
	}
});

// The minimal margin is -24,44, and `ContentLeftPadding` in front of it holds the toggle's 40 and
// the back button's 40, so the header lands where the other two put theirs.
test('a minimal pane takes its own margin, which the buttons beside it make 56 too', async ({
	page
}) => {
	const box = await header(page, 'minimal');
	expect(box.left).toBe(56);
	expect(box.top).toBe(44);
	await expect(page.locator('#minimal .header-content')).toHaveCSS('margin-left', '-24px');
	await expect(page.locator('#top .header-content')).toHaveCSS('margin-left', '56px');
});

test('the header is set SemiBold at 28, and is never shorter than the toggle', async ({ page }) => {
	for (const frame of ['left', 'top', 'minimal']) {
		const box = await header(page, frame);
		expect(box.fontFamily, frame).toMatch(/^"Segoe UI Variable Display"/);
		expect(box.fontSize, frame).toBe('28px');
		expect(box.fontWeight, frame).toBe('600');
		expect(box.minHeight, frame).toBe('36px');
	}
	// The floor shows only under a header shorter than it: the last frame's is set at 12. A
	// 28-pixel line clears 36 or not depending on which face the lane has, so it is not asserted.
	const short = await header(page, 'short');
	expect(short.height).toBe(36);
});
