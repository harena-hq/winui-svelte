import { expect, test } from './fixtures';
import { growViewportToContent } from './themes';

type Page = import('@playwright/test').Page;

/**
 * Where the trigger puts its text and its chevron, and how big that makes it.
 *
 * Upstream's row 1 holds the `Background` Border, the `ContentPresenter` and the
 * `DropDownGlyph` side by side (ComboBox_themeresources.xaml:571, :577, :582) over two columns,
 * `*` and `Width="38"` (:566, :567): the Border spans both, the presenter is in the first and
 * the glyph in the second. The Border draws the stroke; the other two are its siblings, so their
 * margins are measured from their cells, whose outer edges are the Border's, and the stroke
 * takes none of the room. The presenter stops where column 1 starts, and the glyph is centred
 * on the whole row, which the padding does not reach.
 *
 * Until 2026-09-25 this reproduction put the padding inside the trigger's own border and let
 * the text run on to the chevron, and five figures were wrong for it. Three were one border
 * each: the text started at 13 rather than 12, the chevron sat 15 from the right rather than
 * 14, and on the reference browser the control was 33 tall rather than 32. One was the column:
 * the text stopped 27 from the right rather than 38, so an auto-width control was 10 narrower
 * than upstream's — 11, less the pixel the first figure started it late. And one was the
 * padding's asymmetry: the chevron was centred on the content box, which `ComboBoxPadding`
 * puts a pixel above the box's own centre in both densities, two more pixels below than above.
 *
 * Every token-backed figure is read from the tokens rather than written here; the two template
 * literals, 38 and 14, are named below. Every test runs in both densities. What this lane
 * cannot see is said where it matters: its 14-pixel text is 16 tall where the reference
 * browser's is 19, and at 16 the border fits inside `ComboBoxMinHeight`, so the height is also
 * measured with a line forced tall enough that the minimum stops hiding it.
 */

const ROUTE = '/dev/combo-box';

/** `Width="38"` on the chevron's `ColumnDefinition` at ComboBox_themeresources.xaml:567. */
const CHEVRON_COLUMN = 38;

/** `Margin="0,0,14,0"` on the `DropDownGlyph` at :582. */
const CHEVRON_RIGHT = 14;

const COUNT = 8;

/** The only row whose root is not its trigger: a header above, a description below. */
const HEADERED = 2;

const DENSITIES = ['standard', 'compact'] as const;
type Density = (typeof DENSITIES)[number];

/** Puts every row in one density — the attribute on the route's container, as a page would. */
const setDensity = (page: Page, density: Density) =>
	page.evaluate((density) => {
		const container = document.querySelector('.trigger')!.closest('.root')!.parentElement!
			.parentElement!;
		if (density === 'compact') container.setAttribute('data-density', 'compact');
		else container.removeAttribute('data-density');
	}, density);

type Tokens = {
	top: number;
	right: number;
	bottom: number;
	left: number;
	minHeight: number;
	minWidth: number;
};

/** `ComboBoxPadding`, `ComboBoxMinHeight` and `ComboBoxThemeMinWidth` as the trigger resolves them. */
const tokensOf = (page: Page, index: number): Promise<Tokens> =>
	page.evaluate((index) => {
		const trigger = document.querySelectorAll('.trigger')[index];
		const style = getComputedStyle(trigger);
		const px = (name: string) =>
			style
				.getPropertyValue(name)
				.trim()
				.split(/\s+/)
				.map((part) => Number(part.replace('px', '')));
		const [top, right, bottom, left] = px('--winui-ComboBoxPadding');
		return {
			top,
			right,
			bottom,
			left,
			minHeight: px('--winui-ComboBoxMinHeight')[0],
			minWidth: px('--winui-ComboBoxThemeMinWidth')[0]
		};
	}, index);

/** The trigger, its text and its chevron, as border boxes relative to the trigger's. */
const geometryOf = (page: Page, index: number) =>
	page.evaluate((index) => {
		const trigger = document.querySelectorAll('.trigger')[index];
		const t = trigger.getBoundingClientRect();
		const value = trigger.querySelector('.value')!;
		const v = value.getBoundingClientRect();
		const c = trigger.querySelector('.chevron')!.getBoundingClientRect();
		const range = document.createRange();
		range.selectNodeContents(value);
		return {
			width: t.width,
			height: t.height,
			text: {
				left: v.left - t.left,
				right: t.right - v.right,
				top: v.top - t.top,
				height: v.height,
				ink: range.getBoundingClientRect().width,
				clipped: value.scrollWidth > value.clientWidth
			},
			chevron: {
				right: t.right - c.right,
				centre: c.top + c.height / 2 - (t.top + t.height / 2)
			}
		};
	}, index);

test.beforeEach(async ({ page }) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	expect(await page.locator('.trigger').count(), 'the route changed its rows').toBe(COUNT);
});

for (const density of DENSITIES) {
	test.describe(`${density} density`, () => {
		test.beforeEach(async ({ page }) => {
			await setDensity(page, density);
			// The attribute has to reach the token layer's `[data-density='compact']` block, or the
			// compact half of this file silently repeats the standard half. 32 and 24 are the two
			// `ComboBoxMinHeight` values that layer emits.
			const { minHeight } = await tokensOf(page, 0);
			expect(minHeight, 'the density did not take').toBe(density === 'compact' ? 24 : 32);
		});

		test('the text starts at the padding from the outer edge, not one border further in', async ({
			page
		}) => {
			for (let index = 0; index < COUNT; index++) {
				const { left } = await tokensOf(page, index);
				const { text } = await geometryOf(page, index);
				expect(text.left, `row ${index}`).toBe(left);
			}
		});

		test('the text stops at the chevron’s column, not at the chevron', async ({ page }) => {
			// The presenter ends where column 1 begins, less its own right padding. The chevron is
			// 12 wide and 14 in, so a text box that ran on to it stopped 26 from the edge — 27
			// under the old chevron's one-border error.
			for (let index = 0; index < COUNT; index++) {
				const { right } = await tokensOf(page, index);
				const { text } = await geometryOf(page, index);
				expect(text.right, `row ${index}`).toBe(CHEVRON_COLUMN + right);
			}
			// And that edge is where an overlong label is cut, not merely where an empty box ends.
			await page.evaluate(() => {
				document.querySelector('.trigger .value')!.textContent = 'A label far too long '.repeat(8);
			});
			const { right } = await tokensOf(page, 0);
			const { text } = await geometryOf(page, 0);
			expect(text.clipped, 'the forced label was not long enough to be cut').toBe(true);
			expect(text.right, 'an overlong label').toBe(CHEVRON_COLUMN + right);
		});

		test('the chevron is 14 from the outer edge and centred on the whole box', async ({ page }) => {
			for (let index = 0; index < COUNT; index++) {
				const { chevron } = await geometryOf(page, index);
				expect(chevron.right, `row ${index} right`).toBe(CHEVRON_RIGHT);
				expect(chevron.centre, `row ${index} centre`).toBe(0);
			}
		});

		test('an auto-width trigger is the padding, the text and the column', async ({ page }) => {
			// Upstream measures `*` to the presenter's desired width, so the control is the left
			// padding, the text, the right padding and 38, or `ComboBoxThemeMinWidth` on the
			// `Background` Border (:571) when that is wider. The route stretches its rows to 320;
			// shrinking each row to its content is what a caller's auto-width layout does.
			await page.evaluate(() => {
				for (const trigger of document.querySelectorAll('.trigger'))
					(trigger.closest('.root')!.parentElement as HTMLElement).style.width = 'max-content';
			});
			for (let index = 0; index < COUNT; index++) {
				if (index === HEADERED) continue;
				const { left, right, minWidth } = await tokensOf(page, index);
				const { width, text } = await geometryOf(page, index);
				expect(width, `row ${index}`).toBeCloseTo(
					Math.max(minWidth, left + text.ink + right + CHEVRON_COLUMN),
					2
				);
			}
		});

		test('the border takes no room from the height', async ({ page }) => {
			const { top, bottom, minHeight } = await tokensOf(page, 0);

			// Row 0, with its text forced to a line taller than `ComboBoxMinHeight` leaves room
			// for, so the height is the padding plus the text and nothing else. Upstream's row is
			// the larger of that and the glyph's `MinHeight`, and the stroke is drawn over it.
			await page.evaluate(() => {
				(document.querySelector('.trigger .value') as HTMLElement).style.lineHeight = '40px';
			});
			const tall = await geometryOf(page, 0);
			expect(tall.text.height, 'the forced line').toBe(40);
			expect(tall.height, 'tall text').toBe(top + 40 + bottom);
			expect(tall.text.top, 'tall text starts at the top padding').toBe(top);

			// At the text's own height the row is the larger of the two, and the text is centred in
			// what the padding leaves of it. Both expectations are built from the tokens and the
			// text alone — never from the measured height, which carries the defect. The top is
			// the layout's, unrounded: on the reference browser that is 5.5 in the standard
			// density and 1.5 in the compact one, where upstream's arrange rounds them to 6 and
			// 2, and which row it paints on is WD-097. On this lane
			// neither can disagree with a border in the height, since 16-pixel text leaves room
			// for it; on the reference browser both do.
			await page.evaluate(() => {
				(document.querySelector('.trigger .value') as HTMLElement).style.lineHeight = '';
			});
			const own = await geometryOf(page, 0);
			const height = Math.max(minHeight, top + own.text.height + bottom);
			expect(own.height, 'resting height').toBe(height);
			expect(own.text.top, 'resting text centred in the slot').toBe(
				top + (height - top - bottom - own.text.height) / 2
			);
		});
	});
}
