import type { Page } from '@playwright/test';
import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

const ROUTE = '/dev/teaching-tip';

test('TeachingTip in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'TeachingTip', ROUTE);
});

/** The card of the tip whose title is `title` and nothing else. */
const titleOnly = (page: Page) =>
	page.locator('.card').filter({ hasText: 'This is the title' }).filter({ hasNotText: 'subtitle' });

// TeachingTip.xaml:282 and :297 put `MinWidth="{ThemeResource TeachingTipMinWidth}"` on the
// two grids whose outer columns are the 8px tail tracks, so the narrowest card is 320 less 16.
// The harness lowers the resource the way the Gallery's App.xaml does; taken back off, a tip
// with a short title stops at that floor rather than at its text.
test("a tip is no narrower than TeachingTipMinWidth less the tail's two tracks", async ({
	page
}) => {
	await page.goto(ROUTE);
	const card = titleOnly(page);
	await expect(card).toHaveCount(1);
	const lowered = (await card.boundingBox())!.width;
	expect(lowered).toBeLessThan(304);

	const floor = await page.evaluate(() => {
		const root = getComputedStyle(document.documentElement);
		const value = root.getPropertyValue('--winui-TeachingTipMinWidth').trim();
		document.body.style.setProperty('--winui-TeachingTipMinWidth', value);
		return value;
	});
	expect(floor).toBe('320px');
	await expect.poll(async () => (await card.boundingBox())!.width).toBe(304);
});

// The `Content` state's 12px (TeachingTip_themeresources.xaml:78) is entered only by
// `OnContentChanged`, never by `OnApplyTemplate`, so content a tip is declared with sits
// directly under the subtitle (WD-017).
test('content a tip is declared with sits directly under the subtitle', async ({ page }) => {
	await page.goto(ROUTE);
	const main = page.locator('.card .main').filter({ hasText: 'Description can go here' });
	await expect(main).toHaveCount(1);
	// Measured as the reference measured it: the hero example's description sits 16 below the
	// header, which is the Gallery `TextBlock`'s own `Margin="0,16,0,0"` and nothing of the
	// tip's. Measured on the description rather than read off a margin property, so a 12 that
	// arrived as padding, a gap or the header's own margin would show here as 28.
	const gap = () =>
		main.evaluate(
			(el) =>
				(el.firstElementChild as HTMLElement).getBoundingClientRect().top -
				(el.previousElementSibling as HTMLElement).getBoundingClientRect().bottom
		);
	expect(await gap()).toBe(16);
	// CSS collapses a margin on the slot into the description's own 16, where XAML would add
	// the two; content with no margin of its own is what shows a 12 that arrived that way.
	await main.evaluate((el) => ((el.firstElementChild as HTMLElement).style.margin = '0'));
	await expect.poll(gap).toBe(0);
});
