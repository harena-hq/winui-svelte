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

/** The columns of one screenshot's horizontal midline, classified.
 *
 * `side` says which edge to count from and `span` how far in to read. Neither window may reach
 * the row's content, whose glyphs are as dark as a focus stroke — and on the right the content
 * is not even the nearest hazard: the pane's `ScrollView` puts a scrollbar thumb four columns
 * in, which is grey enough to classify as a stroke under a darker theme and which is there at
 * all only because this page holds enough rows to overflow. So the right-hand window is four,
 * a number with a reason: the band is `FocusVisualPrimaryThickness` plus
 * `FocusVisualSecondaryThickness` wide — three — and the fourth column is its clearance. That
 * bound is flush: the thumb was measured at right index 4, the column after the last one read,
 * so a scrollbar a pixel wider or a `ScrollViewScrollBarsMargin` a pixel narrower puts it back
 * inside. This test is downstream of the scrollbar's geometry, and nothing else says so.
 *
 * The left-hand window is sixteen because the selection indicator has to be inside it. What
 * makes that safe is weaker than a bound and is worth saying plainly: the assertions below are
 * equalities over the classified sets, so anything that wanders in **and classifies** breaks
 * one. Something that wanders in and classifies as nothing — which is exactly what the thumb
 * does at `129,129,129` — would hide here as readily as on the right. */
async function midline(page: Page, shot: Buffer, side: 'left' | 'right' = 'left', span = 16) {
	return page.evaluate(
		async ({ url, side, span }) => {
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
			const width = Math.min(span, image.naturalWidth);
			for (let n = 0; n < width; n++) {
				const x = side === 'left' ? n : image.naturalWidth - 1 - n;
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
				if (b > r + 60) accent.push(n);
				else if (r + g + b < 300) stroke.push(n);
				else if (r > 246 && g > 246 && b > 246) secondary.push(n);
			}
			return {
				stroke,
				secondary,
				accent,
				width: image.naturalWidth,
				height: image.naturalHeight
			};
		},
		{ url: `data:image/png;base64,${shot.toString('base64')}`, side, span }
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
	//   0  primary, the outer of its two columns. It is here only since the pane's clip was
	//      moved to its border box, where `PaneClipRectangle` puts it; until then CSS cut this
	//      column at the padding box and the band rendered two columns wide against the
	//      original's three.
	//   1  primary, the inner column. 2px wide upstream.
	//   2  secondary, 1px.
	//   3  untouched — the pixel of clearance the margin leaves.
	//   4  the fill's left edge.
	//   5  the indicator, which upstream starts at 4, flush with the fill. Ours is a column in
	//      because `.item` draws a 1px border the presenter's template never reads; owed, and
	//      recorded in `.private/NEXT.md`. When that is fixed these become `[4, 5, 6]`.
	//
	// A bound rather than an equality here would notice neither the day it is fixed nor the day
	// it gets worse.
	expect(focused.stroke).toEqual([0, 1]);
	expect(focused.secondary).toEqual([2]);
	expect(focused.accent).toEqual([5, 6, 7]);
	// And the claim the unit is for, stated once in its own terms: the indicator clears the
	// **secondary** stroke — the inner one, the one nearest it — with a column to spare.
	expect(Math.min(...focused.accent) - Math.max(...focused.secondary)).toBeGreaterThanOrEqual(2);
});

test("the band reaches the row's far end too, because the clip is the border box", async ({
	page
}) => {
	await page.goto(PAGE);
	const row = selectedRow(page);
	const presenter = presenterOf(row);

	// `NavigationViewPaneContentGridMargin` is the Thickness `-1,3`, whose two values are
	// left/right and top/bottom — so the menu hangs a pixel past the pane's box at **both**
	// ends, and both are inside `PaneClipRectangle`, which is `PaneRoot`'s border box
	// (`SplitView.cpp:166-170`). The test above owns the left end and pins it column by column;
	// this one owns the right, because a clip that came back on one side only would pass that
	// test and leave half the defect standing.
	//
	// Unfocused first, for the reason that test gives: without it the assertions below would
	// still pass on the day something else starts drawing in these columns.
	const quiet = await midline(page, await presenter.screenshot(), 'right', 4);
	expect(quiet.stroke).toEqual([]);
	expect(quiet.secondary).toEqual([]);

	await row.focus();
	const right = await midline(page, await presenter.screenshot(), 'right', 4);

	// Counting inward from the right edge, the same three columns as the left end, and no
	// selection indicator after them — that one is drawn at the row's start.
	expect(right.stroke).toEqual([0, 1]);
	expect(right.secondary).toEqual([2]);
	expect(right.accent).toEqual([]);
});
