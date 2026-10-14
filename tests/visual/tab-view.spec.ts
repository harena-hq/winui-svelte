import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('TabView in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'TabView', '/dev/tab-view');
});

/**
 * The strip's arrow order runs through the add-tab button and wraps, and Tab re-enters on the tab
 * focus last visited.
 *
 * Pressed on the original (`docs/keyboard.md`, the `TabView` observation): Right from a tab
 * reaches its close button, then the next tab, and from the last close button the add-tab button,
 * and from there the first tab; Left runs the same ring backward, so from the first tab it reaches
 * the add button. No arrow changes the selection. With one tab selected and focus arrowed to
 * another, Tab out to the add button and Shift+Tab back lands on the one arrowed to. The pin's
 * comment states the same order (`TabView.cpp:1439`).
 *
 * The route's first strip, the Gallery's own: three documents, `Document 0` selected.
 */
test('the arrows ring through the add button, and re-entry is the tab last focused', async ({
	page
}) => {
	await page.goto('/dev/tab-view');
	const strip = page.locator('.root:has([role=tablist])').first();
	const tab = (n: number) => strip.getByRole('tab', { name: `Document ${n}` });
	const close = (n: number) => tab(n).getByRole('button', { name: 'Close' });
	const add = strip.getByRole('button', { name: 'Add New Tab' });
	const selected = () => strip.locator('[role=tab][aria-selected=true] .label').innerText();

	await tab(0).focus();
	const ring = [close(0), tab(1), close(1), tab(2), close(2), add, tab(0)];
	for (const [i, next] of ring.entries()) {
		await page.keyboard.press('ArrowRight');
		await expect(next, `Right ${i + 1} from Document 0`).toBeFocused();
	}
	await page.keyboard.press('ArrowLeft');
	await expect(add, 'Left from the first tab').toBeFocused();
	await page.keyboard.press('ArrowLeft');
	await expect(close(2), 'Left from the add button').toBeFocused();
	expect((await selected()).trim(), 'an arrow changed the selection').toBe('Document 0');

	await tab(1).click();
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await expect(tab(2)).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(add, 'Tab from the strip').toBeFocused();
	await page.keyboard.press('Shift+Tab');
	await expect(tab(2), 'Shift+Tab back into the strip').toBeFocused();
	expect((await selected()).trim()).toBe('Document 1');
});

/**
 * The strip's header and footer span its whole height. `TabViewHeaderPadding`'s 8 on top is the
 * TabView's Padding (`TabView.xaml:6`), passed to the list (`:39`) and by the list's template to
 * its `ItemsPresenter` (`:115`), and the header and footer presenters span the row (`:38`, `:43`).
 * What they hold places itself: the harness's two texts are the Gallery's TabStripHeader sample
 * (`TabViewPage.xaml:187-201`), each `VerticalAlignment="Center"`. Measured on the reference in
 * that sample: the header and footer text's ink from 441, the tab labels' from 446, in a strip
 * from 425 to 465.
 */
test("the strip's header and footer span its whole height, the tabs below its padding", async ({
	page
}) => {
	await page.goto('/dev/tab-view');
	const boxes = await page
		.locator('.strip-header-text')
		.first()
		.evaluate((text) => {
			const strip = text.closest('.strip')!.getBoundingClientRect();
			const r = (e: Element) => e.getBoundingClientRect();
			const footer = text.closest('.strip')!.querySelector('.strip-footer-text')!;
			const tab = text.closest('.strip')!.querySelector('[role=tab]')!;
			return {
				strip: [strip.top, strip.bottom],
				headerBox: [r(text.parentElement!).top, r(text.parentElement!).bottom],
				footerBox: [r(footer.parentElement!).top, r(footer.parentElement!).bottom],
				header: (r(text).top + r(text).bottom) / 2,
				footer: (r(footer).top + r(footer).bottom) / 2,
				tabTop: r(tab).top
			};
		});
	expect(boxes.strip[1] - boxes.strip[0]).toBeCloseTo(40, 0);
	for (const box of [boxes.headerBox, boxes.footerBox]) {
		expect(box[0]).toBeCloseTo(boxes.strip[0], 1);
		expect(box[1]).toBeCloseTo(boxes.strip[1], 1);
	}
	const middle = (boxes.strip[0] + boxes.strip[1]) / 2;
	expect(boxes.header).toBeCloseTo(middle, 0);
	expect(boxes.footer).toBeCloseTo(middle, 0);
	// The tab starts the 8 the list's padding adds below the strip's top.
	expect(boxes.tabTop - boxes.strip[0]).toBeCloseTo(8, 0);
});
