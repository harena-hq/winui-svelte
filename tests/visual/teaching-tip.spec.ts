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

// UntargetedTipFarPlacementOffset (TeachingTip.h:274) puts the bottom of TailOcclusionGrid
// PlacementMargin plus s_untargetedTipWindowEdgeMargin, 24 (TeachingTip.h:310), above the
// window's bottom, and the card stops that grid's last row, its 8px tail track, above that
// (TeachingTip.xaml:310 and :312). Measured on the reference guest with the Gallery's
// PlacementMargin="20": the card's bottom edge 52 above the window's.
test("an untargeted tip's card sits PlacementMargin, 24 and the tail track above the window's bottom", async ({
	page
}) => {
	await page.goto(ROUTE);
	const card = page
		.locator('.card')
		.filter({ hasText: 'And this is the subtitle' })
		.filter({ has: page.getByRole('button', { name: 'Close button' }) });
	await expect(card).toHaveCount(1);
	// Until Floating UI places it, bits-ui parks the wrapper at `translate(0, -200%)`
	// (use-floating-layer.svelte.js:135), which has a real box; the read waits for two
	// consecutive boxes that agree, as tool-tip.spec.ts's `placed()` does.
	let last: { x: number; y: number; width: number; height: number } | null = null;
	await expect
		.poll(async () => {
			const now = await card.boundingBox();
			const settled = !!now && now.y >= 0 && !!last && now.x === last.x && now.y === last.y;
			last = now;
			return settled;
		})
		.toBe(true);
	const box: { x: number; y: number; width: number; height: number } = last!;
	// Floating UI rounds the wrapper's position to the device pixel (`roundByDPR`), so a card of
	// fractional size lands up to half a pixel off either way. The anchor is fixed to the bottom
	// of the layout viewport, which `clientHeight` measures.
	const { width, height } = await page.evaluate(() => ({
		width: document.documentElement.clientWidth,
		height: document.documentElement.clientHeight
	}));
	expect(Math.abs(height - (box.y + box.height) - (20 + 24 + 8))).toBeLessThanOrEqual(0.5);
	// Centred: UntargetedTipCenterPlacementOffset with equal near and far margins.
	expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThanOrEqual(0.5);
});

/** The harness's light-dismiss tip, alone: the primitive dismisses only from the layer it holds
 *  responsible, the last registered, and the tips declared after this one register later; all
 *  the others are closed, as they also overlap. Also a button outside every tip that counts the
 *  clicks it gets, and calls `preventDefault` on its pointerdown when `prevented` is set. */
async function lightDismissAlone(page: Page, prevented = false) {
	await page.goto(ROUTE);
	// The harness's tips overlap one another, so they are closed by their buttons' own click:
	// every header close button, and the footer one of the tip that has no header one.
	await page.evaluate(() => {
		for (const button of document.querySelectorAll<HTMLElement>(
			'[data-popover-content] button[aria-label="Close"]'
		))
			button.click();
		for (const card of document.querySelectorAll('[data-popover-content]'))
			if (card.textContent?.includes('One close command'))
				[...card.querySelectorAll<HTMLElement>('button')]
					.find((button) => button.textContent?.trim() === 'Close button')
					?.click();
	});
	const tip = page.locator('[data-popover-content]');
	await expect(tip).toHaveCount(1);
	await expect(tip).toHaveAttribute('data-light-dismiss', '');
	await page.evaluate((prevented) => {
		const button = document.createElement('button');
		button.id = 'counter';
		button.textContent = 'counter';
		button.style.cssText = 'position: fixed; left: 8px; top: 8px';
		button.dataset.clicks = '0';
		button.onclick = () => (button.dataset.clicks = String(Number(button.dataset.clicks) + 1));
		if (prevented) button.onpointerdown = (event) => event.preventDefault();
		document.body.append(button);
	}, prevented);
	return { tip, counter: page.locator('#counter') };
}

// Upstream's light-dismiss layer takes the press that dismisses the tip, and what was under the
// pointer gets no Click; on the reference guest a press on the Gallery's own Show button
// dismissed its tip without reopening it. A press held as a hand holds one outlasts the
// primitive's 10ms debounce.
test('the click of a press that light-dismisses a tip never reaches its target', async ({
	page
}) => {
	const { tip, counter } = await lightDismissAlone(page);
	await counter.hover();
	await page.mouse.down();
	await page.waitForTimeout(100);
	await page.mouse.up();
	await expect(tip).toHaveCount(0);
	await page.waitForTimeout(100);
	await expect(counter).toHaveAttribute('data-clicks', '0');
	// Only that press: a keyboard click after it, and the next press, both land.
	await counter.focus();
	await page.keyboard.press('Enter');
	await expect(counter).toHaveAttribute('data-clicks', '1');
	await counter.click();
	await expect(counter).toHaveAttribute('data-clicks', '2');
});

// A pointerdown its target default-prevents reaches the primitive's callback rewrapped, with a
// timestamp of its own (use-dismissable-layer.svelte.js:132-134), so whether the press is still
// down is not read off it. Released quickly or not, nothing is left to take the keyboard click
// that follows: a quick press has clicked before the tip is dismissed, a held one has ended.
test('a default-prevented press leaves the next keyboard click alone', async ({ page }) => {
	const { tip, counter } = await lightDismissAlone(page, true);
	await counter.click();
	await expect(tip).toHaveCount(0);
	await page.waitForTimeout(100);
	const before = Number(await counter.getAttribute('data-clicks'));
	await counter.focus();
	await page.keyboard.press('Enter');
	await expect(counter).toHaveAttribute('data-clicks', String(before + 1));
});

// A press the browser cancels has no click, and nothing is left armed by it.
test('a cancelled dismissing press leaves the next keyboard click alone', async ({ page }) => {
	const { tip, counter } = await lightDismissAlone(page);
	await counter.hover();
	await page.mouse.down();
	await page.waitForTimeout(100);
	await expect(tip).toHaveCount(0);
	await page.evaluate(() =>
		document
			.getElementById('counter')!
			.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerType: 'mouse' }))
	);
	await counter.focus();
	await page.keyboard.press('Enter');
	await expect(counter).toHaveAttribute('data-clicks', '1');
	await page.mouse.up();
});
