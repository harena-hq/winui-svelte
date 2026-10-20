import { expect, test } from './fixtures';

type Page = import('@playwright/test').Page;
type Locator = import('@playwright/test').Locator;

/**
 * Where a non-editable ComboBox's list opens.
 *
 * Upstream lays the selected item — the middle one when nothing is selected — on the box and adds
 * items above and below it within the window (`GetNonPannablePopupLayout`,
 * ComboBox_Partial.cpp:4767-4911), at most nine in all and, the centre counted, four on the side
 * it fills first (ComboBox_Partial.h:572-573). The arithmetic each test states is that
 * function's, for the case it builds, over the item heights the page measures.
 */

interface Geometry {
	box: { top: number; bottom: number; height: number };
	popup: { top: number; bottom: number; height: number };
	/** Each item's top, less its margin, and its height, with its margins. */
	items: { label: string; top: number; height: number }[];
	contentMargin: { top: number; bottom: number };
	/** The popup's border and padding, top and bottom together. */
	chrome: number;
	scrollTop: number;
	window: number;
	ratio: number;
}

async function geometry(page: Page, trigger: Locator): Promise<Geometry> {
	return trigger.evaluate((el) => {
		const popup = document.querySelector<HTMLElement>('.select-popup')!;
		const list = popup.querySelector<HTMLElement>('.list')!;
		const px = (value: string) => parseFloat(value) || 0;
		const box = el.getBoundingClientRect();
		const own = popup.getBoundingClientRect();
		const style = getComputedStyle(popup);
		const listStyle = getComputedStyle(list);
		return {
			box: { top: box.top, bottom: box.bottom, height: box.height },
			popup: { top: own.top, bottom: own.bottom, height: own.height },
			items: Array.from(list.children).map((item) => {
				const rect = item.getBoundingClientRect();
				const itemStyle = getComputedStyle(item);
				return {
					label: item.textContent!.trim(),
					top: rect.top - px(itemStyle.marginTop),
					height: rect.height + px(itemStyle.marginTop) + px(itemStyle.marginBottom)
				};
			}),
			contentMargin: { top: px(listStyle.marginTop), bottom: px(listStyle.marginBottom) },
			chrome:
				px(style.borderTopWidth) +
				px(style.borderBottomWidth) +
				px(style.paddingTop) +
				px(style.paddingBottom),
			scrollTop: list.scrollTop,
			window: document.documentElement.clientHeight,
			ratio: window.devicePixelRatio
		};
	});
}

async function open(page: Page, trigger: Locator) {
	await trigger.click();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect(page.locator('.select-popup')).toBeVisible();
	return geometry(page, trigger);
}

const sum = (heights: number[]) => heights.reduce((total, height) => total + height, 0);

/** Where the list's top goes when `above` items lie over the centre one, unclamped and rounded
 * to device pixels. */
function topOver(g: Geometry, center: number, above: number) {
	const heights = g.items.map((item) => item.height);
	const popupY =
		g.box.top +
		g.box.height / 2 -
		heights[center] / 2 -
		g.contentMargin.top -
		sum(heights.slice(center - above, center));
	return Math.round(popupY * g.ratio) / g.ratio;
}

test.describe('the Gallery page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/basicinput/combobox');
	});

	test('the colours open over the box with the middle item on it, nothing being selected', async ({
		page
	}) => {
		const trigger = page.locator('button.trigger').nth(0);
		const g = await open(page, trigger);
		expect(g.items.map((item) => item.label)).toEqual(['Blue', 'Green', 'Red', 'Yellow']);
		// Four items: the centre is 4/2 = 2, Red, with Green and Blue above it and Yellow below.
		expect(g.popup.top).toBeCloseTo(topOver(g, 2, 2), 3);
		const heights = g.items.map((item) => item.height);
		expect(g.popup.height).toBeCloseTo(
			sum(heights) + g.contentMargin.top + g.contentMargin.bottom + g.chrome,
			1
		);
		expect(g.popup.top, 'the list does not reach above the box').toBeLessThan(g.box.top);
		expect(g.popup.bottom, 'the list does not reach below the box').toBeGreaterThan(g.box.bottom);
	});

	test('the fonts open with the selected Courier New on the box', async ({ page }) => {
		const trigger = page.locator('button.trigger').nth(1);
		await expect(trigger).toContainText('Courier New');
		const g = await open(page, trigger);
		expect(g.items[2].label).toBe('Courier New');
		expect(g.popup.top).toBeCloseTo(topOver(g, 2, 2), 3);
	});
});

test.describe('the placement harness', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/dev/combo-box-placement');
	});

	test('a list of twelve shows nine, six above the selected tenth, and scrolls to the first', async ({
		page
	}) => {
		const trigger = page.locator('#long button.trigger');
		const g = await open(page, trigger);
		const heights = g.items.map((item) => item.height);
		// Item 9 is the centre, where 12/2 would be 6. The count on one side includes it, so the
		// four-a-side limit stops the first pass above at three (`totalItemsLayed <
		// maxNumberOfItemsAllowedOnOneSide`, :4829-4831, the count starting at 1); items 10 and
		// 11 go below; and the fill pass (:4865-4904) takes three more from above to make nine.
		expect(g.popup.top).toBeCloseTo(topOver(g, 9, 6), 3);
		expect(g.popup.height).toBeCloseTo(
			sum(heights.slice(3, 12)) + g.contentMargin.top + g.contentMargin.bottom + g.chrome,
			1
		);
		// Scrolled so that item 3, the first laid out, is the first shown (:5538-5545).
		expect(g.scrollTop).toBeGreaterThan(0);
		expect(Math.abs(g.scrollTop - (g.items[3].top - g.items[0].top))).toBeLessThanOrEqual(1);
		const middle = g.items[9].top + g.items[9].height / 2;
		expect(Math.abs(middle - (g.box.top + g.box.height / 2))).toBeLessThan(g.items[9].height / 2);
	});

	test('a box at the window’s bottom opens a list that ends at that edge', async ({ page }) => {
		// A window short enough that the box starts below it, scrolled up to sit four pixels above
		// the window's bottom.
		await page.setViewportSize({ width: 1280, height: 480 });
		const trigger = page.locator('#short button.trigger');
		await trigger.evaluate((el) => {
			const scroller = el.closest('.dev') ?? document.scrollingElement!;
			const gap = document.documentElement.clientHeight - el.getBoundingClientRect().bottom;
			scroller.scrollTop -= gap - 4;
		});
		const g = await open(page, trigger);
		expect(Math.abs(g.window - g.box.bottom - 4)).toBeLessThanOrEqual(1);
		// Yellow, below the centre, does not fit under the box, so the fill takes its room from
		// above (:4887-4894): the list grows upward by at least its height, and the clamp after
		// (:5418-5426) ends it at the window's bottom.
		const heights = g.items.map((item) => item.height);
		expect(Math.abs(g.popup.bottom - g.window)).toBeLessThanOrEqual(0.5);
		expect(g.popup.top).toBeLessThanOrEqual(topOver(g, 2, 2) - heights[3]);
		// All four are shown, Yellow inside the list and nothing scrolled.
		expect(g.scrollTop).toBe(0);
		expect(g.items[3].label).toBe('Yellow');
		expect(g.items[3].top + g.items[3].height).toBeLessThanOrEqual(g.popup.bottom);
	});

	test('the list stays on the box when the page under it scrolls', async ({ page }) => {
		const trigger = page.locator('#short button.trigger');
		const before = await open(page, trigger);
		await trigger.evaluate((el) => {
			const scroller = el.closest('.dev') ?? document.scrollingElement!;
			scroller.scrollTop += 30;
		});
		await expect
			.poll(async () => (await geometry(page, trigger)).box.top)
			.toBeCloseTo(before.box.top - 30, 0);
		const after = await geometry(page, trigger);
		expect(after.popup.top - after.box.top).toBeCloseTo(before.popup.top - before.box.top, 0);
	});
});
