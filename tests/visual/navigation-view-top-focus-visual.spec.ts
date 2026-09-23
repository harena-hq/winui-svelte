import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Where a top-pane row draws its focus visual, and what the settings button does differently.
//
// The answer is the same as the left pane's and the mechanism is the same one: the item's
// template marks the `NavigationViewItemPresenter` `Control.IsTemplateFocusTarget`
// (`NavigationView.xaml:462`), that mark registers with the nearest `Control` ancestor — the
// item, because the presenter is `IsTabStop="false"` — and both strokes are drawn inside the
// bounds handed to `CFocusRectManager::ConfigureFocusElement` (`FocusRectManager.cpp:434-455`).
// So the band is the presenter's box and `NavigationViewItemButtonMargin` is inside it.
//
// Measured on the reference on 2026-09-23, light theme, keyboard focus moved with an arrow key
// on the NavigationView page's own top-pane sample:
//
//   a row        fill x 630-728 y 301-344,  band x 626-732 y 299-346   — 4 out, 2 out
//   settings     fill 36 by 36,             band 40 by 48             — 2 out, 6 out
//
// The settings button's numbers are not a second rule. It renders through the presenter's
// `IconOnly` state, whose `LayoutRoot` is 36 square with `Margin="2"`
// (`NavigationView_themeresources.xaml:791-800`), so its presenter is 40 wide and the row's
// full 48 tall. `MUX_NavigationViewSettingsItemStyleWhenOnTopPane` would have made it a real
// exception — a `NavigationViewItem` style with no presenter at all — and the reference says
// the Gallery does not use it.
const PAGE = '/dev/navigation-view';

test('a top-pane row is its fill plus the button margin, and the band is on that box', async ({
	page
}) => {
	await page.goto(PAGE);
	const presenter = page.locator('#top-content .item-presenter[data-placement="primary"]').first();
	const fill = presenter.locator('.item');

	const box = (await presenter.boundingBox())!;
	const inner = (await fill.boundingBox())!;
	expect(inner.x - box.x).toBe(4);
	expect(box.x + box.width - (inner.x + inner.width)).toBe(4);
	expect(inner.y - box.y).toBe(2);
	expect(box.height - inner.height).toBe(4);
	// The row is `NavigationViewTopPaneHeight`, and the fill is that less the margin.
	expect(box.height).toBe(48);
	expect(inner.height).toBe(44);

	await fill.focus();
	const bandOn = (locator: typeof presenter) =>
		locator.evaluate((element) => getComputedStyle(element, '::before').boxShadow);
	expect(await bandOn(presenter)).not.toBe('none');
	expect(await bandOn(fill)).toBe('none');
});

test('the top settings button is 36 in a 40 by 48 box, which is the IconOnly state', async ({
	page
}) => {
	await page.goto(PAGE);
	const presenter = page.locator('#top-content .item-presenter[data-icons="iconOnly"]').first();
	const fill = presenter.locator('.item');

	const box = (await presenter.boundingBox())!;
	const inner = (await fill.boundingBox())!;
	expect([box.width, box.height]).toEqual([40, 48]);
	expect([inner.width, inner.height]).toEqual([36, 36]);
	// Two out horizontally from `Margin="2"`, and six out vertically because the 36 is centred
	// in the row rather than sitting at the top of it — the margin is 2 and the row is 48.
	expect(inner.x - box.x).toBe(2);
	expect(inner.y - box.y).toBe(6);
});

test("the band's strokes sit at the row's edge, not at the fill's", async ({ page }) => {
	await page.goto(PAGE);
	const presenter = page.locator('#top-content .item-presenter[data-placement="primary"]').first();
	const fill = presenter.locator('.item');

	// Unfocused first, so the dark columns below are the band and not something the row draws
	// anyway. `focus()` from script and nothing else: a click would take `:focus-visible` away.
	const quiet = await columns(page, await presenter.screenshot());
	expect(quiet.stroke).toEqual([]);
	expect(quiet.secondary).toEqual([]);

	await fill.focus();
	const focused = await columns(page, await presenter.screenshot());

	// Reading in from the row's own left edge: two columns of primary, one of secondary, and
	// then the margin's fourth pixel, which is the clearance. A bound rather than these
	// equalities would not notice the band moving back onto the fill by four.
	expect(focused.stroke).toEqual([0, 1]);
	expect(focused.secondary).toEqual([2]);
});

/** The classified columns of a screenshot's horizontal midline, read in from the left edge.
 *
 * Four columns only, and that is a bound rather than a measurement: the band is
 * `FocusVisualPrimaryThickness` plus `FocusVisualSecondaryThickness` wide — three — and the
 * fourth is the clearance the margin leaves. Nothing else can be in the window. */
async function columns(page: Page, shot: Buffer) {
	return page.evaluate(
		async (url) => {
			const image = new Image();
			image.src = url;
			await image.decode();
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext('2d')!;
			context.drawImage(image, 0, 0);
			const y = Math.floor(image.naturalHeight / 2);
			const stroke: number[] = [];
			const secondary: number[] = [];
			for (let x = 0; x < Math.min(4, image.naturalWidth); x++) {
				const [r, g, b] = context.getImageData(x, y, 1, 1).data;
				// `SystemControlFocusVisualPrimaryBrush` is near-black, measured 27, and the
				// secondary is white at 0.7, measured 252 against the 243 beside it. What that
				// 0.7 is over is **not** the pane: `NavigationViewTopPaneBackground` is
				// transparent — `rgba(243, 243, 243, 0)`, measured — so the 243 belongs to the
				// harness page behind it. Which makes the 246 floor a fact about this page as
				// much as about the control: a page whose background moved toward white would
				// move it with nothing about the band changed.
				if (r + g + b < 300) stroke.push(x);
				else if (r > 246 && g > 246 && b > 246) secondary.push(x);
			}
			return { stroke, secondary };
		},
		`data:image/png;base64,${shot.toString('base64')}`
	);
}

test('an overflowed row takes the presenter radius, which its own fill does not have', async ({
	page
}) => {
	await page.goto(PAGE);
	await page.locator('#top-narrow .overflow-button').click();
	const presenter = page
		.locator('.overflow-list .item-presenter[data-placement="overflow"]')
		.first();
	const fill = presenter.locator('.item');

	// The one placement where the two boxes coincide and the two **radii** do not, which is why
	// moving the band here was not a no-op. `CFocusRectManager` picks the corner radius off the
	// focus target by type — `Control_CornerRadius` for a `Control`
	// (`FocusRectManager.cpp:191-199`) — and the focus target is the presenter, which takes
	// `ControlCornerRadius` from the `NavigationViewItem` style through the template binding
	// (`NavigationView.xaml:432` and `:462`). `MUX_NavigationViewItemPresenterStyleWhenOnTopPaneOverflow`
	// (`:912-916`) sets no `CornerRadius` and its `LayoutRoot` carries none, so the fill is
	// square under a rounded band. Drawn on the fill, as this file drew it until the band moved,
	// the band was square too.
	const radii = async (locator: typeof presenter) =>
		locator.evaluate((element) => getComputedStyle(element).borderTopLeftRadius);
	expect(await radii(presenter)).toBe('4px');
	expect(await radii(fill)).toBe('0px');

	// And the boxes really do coincide, which is the half the message got right.
	const box = (await presenter.boundingBox())!;
	const inner = (await fill.boundingBox())!;
	expect([inner.x - box.x, inner.y - box.y]).toEqual([0, 0]);
	expect([inner.width, inner.height]).toEqual([box.width, box.height]);
});
