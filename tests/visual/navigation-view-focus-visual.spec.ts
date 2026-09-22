import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Where a left-pane row draws its focus visual, and what that leaves room for.
//
// The focused element is the `NavigationViewItem`, and its own template hands the focus visual
// to the `NavigationViewItemPresenter` — `Control.IsTemplateFocusTarget="True"`,
// `NavigationView.xaml:462`. The presenter is the whole row; the fill is the `LayoutRoot`
// inside it, inset by `NavigationViewItemButtonMargin` (`NavigationView_themeresources.xaml:451`,
// the Thickness `4,2` at `:228`). Both strokes are drawn inside the target's bounds
// (`CFocusRectManager::ConfigureFocusElement`, `FocusRectManager.cpp:434-455`), so the band
// lands in that margin and the selection
// indicator, which starts at the fill's left edge, is clear of it.
//
// Measured on the reference on 2026-09-22, light theme, from a keyboard-focused row in the
// NavigationView page's own sample: the band's outer edge at x=370 with the fill at x=374 and
// the indicator at 374..376; primary 2px at 370-371, secondary 1px at 372, and x=373 left
// alone. The row is 40 tall against the fill's 36, and the next row begins immediately after
// it, which puts 4px between two fills.
const PAGE = '/dev/navigation-view-ring';

/** The selected row of `#selected-mid`, which is `design` — a **top-level** row.
 *
 * A child row would answer the indicator question wrongly: its indicator is pushed right by
 * `c_itemIndentation`, so it clears the strokes whatever the band is drawn on, and the test
 * would pass against the defect it exists for. */
const selectedRow = (page: Page) =>
	page.locator('#selected-mid').locator('.item[data-selected="true"]');

const presenterOf = (row: Locator) => row.locator('xpath=..');

/** The columns of one screenshot's horizontal midline, classified. */
async function midline(page: Page, shot: Buffer) {
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
			const accent: number[] = [];
			for (let x = 0; x < Math.min(16, image.naturalWidth); x++) {
				const [r, g, b] = context.getImageData(x, y, 1, 1).data;
				// Four things can appear in these columns, and every threshold below is one of
				// their measured light-theme values rather than a guess. The accent is tested
				// first, and that is not an ordering preference: `AccentFillColorDefault` is
				// rgb(0, 103, 192), which sums to 295 and reads as "near-black" to a luminance
				// floor of 300. Blue-dominance separates the two.
				//
				// The secondary stroke is the one a test can miss, and the first version of
				// this file did: `SystemControlFocusVisualSecondaryBrush` is white at 0.7, so
				// over the pane it renders 251 where the pane itself is 243 and the selected
				// row's fill is 234. A classifier with no class for it cannot see the stroke the
				// indicator has to clear, and every assertion about that clearance is then
				// really an assertion about the primary.
				if (b > r + 60) accent.push(x);
				else if (r + g + b < 300) stroke.push(x);
				else if (r > 246 && g > 246 && b > 246) secondary.push(x);
			}
			return {
				stroke,
				secondary,
				accent,
				width: image.naturalWidth,
				height: image.naturalHeight
			};
		},
		`data:image/png;base64,${shot.toString('base64')}`
	);
}

test('the row is the fill plus the button margin on every side', async ({ page }) => {
	await page.goto(PAGE);
	const row = selectedRow(page);
	const fill = (await row.boundingBox())!;
	const box = (await presenterOf(row).boundingBox())!;

	expect(fill.x - box.x).toBe(4);
	expect(box.x + box.width - (fill.x + fill.width)).toBe(4);
	expect(fill.y - box.y).toBe(2);
	expect(box.height - fill.height).toBe(4);
});

test('two rows sit 40 apart, with 4 between their fills', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');
	const rows = frame.locator('.item-presenter');
	const first = (await rows.nth(0).boundingBox())!;
	const second = (await rows.nth(1).boundingBox())!;
	// `NavigationViewItemMargin` is `0` (`NavigationView_themeresources.xaml:245`), so nothing
	// separates one row from the next and the pitch is the row's own height.
	expect(second.y - first.y).toBe(40);
	expect(first.height).toBe(40);

	const firstFill = (await frame.locator('.item').nth(0).boundingBox())!;
	const secondFill = (await frame.locator('.item').nth(1).boundingBox())!;
	expect(secondFill.y - (firstFill.y + firstFill.height)).toBe(4);
});

test('the focus visual is drawn on the presenter, never on the fill', async ({ page }) => {
	await page.goto(PAGE);
	const row = selectedRow(page);
	await row.focus();

	const bandOn = (locator: Locator) =>
		locator.evaluate((element) => getComputedStyle(element, '::before').boxShadow);

	expect(await bandOn(presenterOf(row))).not.toBe('none');
	expect(await bandOn(row)).toBe('none');
});

test('the strokes sit at the row edge and leave the indicator a column of its own', async ({
	page
}) => {
	await page.goto(PAGE);
	const row = selectedRow(page);
	const presenter = presenterOf(row);

	// Unfocused first, so the dark columns below are the band and not something the row draws
	// anyway. `focus()` from script and nothing else: a click would take `:focus-visible` away.
	const quiet = await midline(page, await presenter.screenshot());
	expect(quiet.stroke).toEqual([]);
	expect(quiet.secondary).toEqual([]);
	expect(quiet.accent.length).toBeGreaterThan(0);

	await row.focus();
	const focused = await midline(page, await presenter.screenshot());

	// Every column is pinned, because each one is a measurement and two of them are measurements
	// of something owed. Reading left to right from the row's own left edge:
	//
	//   0  cut. The band's outer edge belongs here; `.pane` clips at its padding box while
	//      `NavigationViewPaneContentGridMargin` pulls the menu a pixel outside it, so the
	//      outermost pixel of every row is lost. **This unit is what made that visible** — the
	//      band used to be drawn 4px in, where nothing was clipped. The original loses nothing:
	//      measured 2026-09-22, its band's outer edge is at x=370 with the pane's own background
	//      starting at x=371. When that is fixed this becomes `[0, 1]`.
	//   1  primary. 2px wide upstream, and the first of the two is the column above.
	//   2  secondary, 1px.
	//   3  untouched — the pixel of clearance the margin leaves.
	//   4  the fill's left edge.
	//   5  the indicator, which upstream starts at 4, flush with the fill. Ours is a column in
	//      because `.item` draws a 1px border the presenter's template never reads; also owed.
	//
	// Both owed defects are in `.private/NEXT.md`. A bound rather than an equality here would
	// notice neither the day it is fixed nor the day it gets worse.
	expect(focused.stroke).toEqual([1]);
	expect(focused.secondary).toEqual([2]);
	expect(focused.accent).toEqual([5, 6, 7]);
	// And the claim the unit is for, stated once in its own terms: the indicator clears the
	// **secondary** stroke — the inner one, the one nearest it — with a column to spare.
	expect(Math.min(...focused.accent) - Math.max(...focused.secondary)).toBeGreaterThanOrEqual(2);
});
