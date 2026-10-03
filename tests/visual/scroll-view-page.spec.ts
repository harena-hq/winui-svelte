/**
 * The ScrollView page's Examples 2 and 3 run the original's code-behind on ScrollView's
 * programmatic scroll. On the reference Gallery a velocity of 30 sits still; one press of the
 * velocity box's increase button, 30 to 40, scrolls the images down at 40 pixels a second, and
 * a press of decrease from 40 stops the scroll with the box reading −30. The animation button
 * scrolls to four fifths of the scrollable height in 1.5 seconds and the next press back to
 * one fifth. Example 3's source pane has a C# tab from the start, the Default sample with the
 * duration box's value written into it.
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

/** Pauses Playwright's clock at an instant read from the page (see scroll-view-scroll.spec.ts). */
async function freeze(page: Page) {
	const now = await page.evaluate(() => Date.now());
	await page.clock.install({ time: now });
	await page.clock.pauseAt(now + 10_000);
}

/** The scroll position of the page's `index`th example ScrollView (0, 1, 2 for Examples 1–3).
 * The shell contributes two more `.scroll-view` viewports ahead of the examples, so the
 * locator is scoped to the item page. */
async function offset(page: Page, index: number) {
	return page
		.locator('[data-item-page] .scroll-view .viewport')
		.nth(index)
		.evaluate((element) => element.scrollTop);
}

/** The third example ScrollView's scrollable height. */
async function scrollable(page: Page) {
	return page
		.locator('[data-item-page] .scroll-view .viewport')
		.nth(2)
		.evaluate((element) => element.scrollHeight - element.clientHeight);
}

const animationButton = (page: Page) => page.getByRole('button', { name: 'Scroll with animation' });
// The animation ComboBox trigger is a button named for its current value. The only
// combobox on the page is the shell's search field.
const animationCombo = (page: Page) =>
	page.locator('.animation-options').getByRole('button').first();
// The spin buttons expose Zag's names, "increment value" and "decrease value".
const velocityIncrease = (page: Page) =>
	page.getByRole('button', { name: 'increment value' }).nth(1);
const velocityDecrease = (page: Page) =>
	page.getByRole('button', { name: 'Decrease value' }).nth(1);
const velocityInput = (page: Page) => page.getByRole('spinbutton').nth(1);

async function openPage(page: Page) {
	await page.goto('/scrolling/scrollview');
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await freeze(page);
}

async function chooseAnimation(page: Page, name: string) {
	await animationCombo(page).click();
	await page.getByRole('option', { name }).click();
	await expect(animationCombo(page)).toHaveText(new RegExp(name));
}

test.describe('the ScrollView page runs its examples', () => {
	test('a velocity over 30 scrolls Example 2, and back to 30 stops it at -30', async ({ page }) => {
		await openPage(page);
		await velocityIncrease(page).click();
		await expect(velocityInput(page)).toHaveValue('40');
		await page.clock.runFor(1000);
		const moved = await offset(page, 1);
		expect(moved).toBeGreaterThanOrEqual(36);
		expect(moved).toBeLessThanOrEqual(44);
		await velocityDecrease(page).click();
		await expect(velocityInput(page)).toHaveValue('-30');
		const stopped = await offset(page, 1);
		await page.clock.runFor(1000);
		expect(await offset(page, 1)).toBe(stopped);
	});

	test('the animation button scrolls Example 3 to four fifths, then back to one fifth', async ({
		page
	}) => {
		await openPage(page);
		const s = await scrollable(page);
		await animationButton(page).click();
		await page.clock.runFor(1100);
		expect(await offset(page, 2)).toBeLessThan(Math.round(0.8 * s) - 10);
		await page.clock.runFor(500);
		expect(Math.abs((await offset(page, 2)) - 0.8 * s)).toBeLessThanOrEqual(1);
		await animationButton(page).click();
		await page.clock.runFor(1600);
		expect(Math.abs((await offset(page, 2)) - 0.2 * s)).toBeLessThanOrEqual(1);
	});

	test('Accordion overshoots by a tenth at three fifths of the way', async ({ page }) => {
		await openPage(page);
		await chooseAnimation(page, 'Accordion');
		const s = await scrollable(page);
		await animationButton(page).click();
		await page.clock.runFor(900);
		expect(Math.abs((await offset(page, 2)) - 1.1 * 0.8 * s)).toBeLessThanOrEqual(3);
		await page.clock.runFor(700);
		expect(Math.abs((await offset(page, 2)) - 0.8 * s)).toBeLessThanOrEqual(1);
	});

	test('Teleportation jumps at the half', async ({ page }) => {
		await openPage(page);
		await chooseAnimation(page, 'Teleportation');
		const s = await scrollable(page);
		await animationButton(page).click();
		// The first key frame eases in on (1, 0), (1, 0): just past a quarter of the way through,
		// the view has barely left.
		await page.clock.runFor(400);
		expect(await offset(page, 2)).toBeLessThanOrEqual(0.02 * s);
		await page.clock.runFor(300);
		expect(await offset(page, 2)).toBeLessThanOrEqual(0.08 * s + 1);
		await page.clock.runFor(100);
		expect(await offset(page, 2)).toBeGreaterThanOrEqual(0.72 * s - 1);
		await page.clock.runFor(800);
		expect(Math.abs((await offset(page, 2)) - 0.8 * s)).toBeLessThanOrEqual(1);
	});

	test("the C# tab shows the chosen animation's sample with the duration in it", async ({
		page
	}) => {
		await openPage(page);
		// The page header is also a "Source code" button, so the third example is the fourth.
		const source = page.getByRole('button', { name: 'Source code' }).nth(3);
		await source.click();
		// Opening runs a 333ms transition. The paused clock holds it at its start, where the
		// pane is translated over the sample and a click lands on the image, so the clock
		// advances until that transition has finished. SelectorBar items are options.
		await page.clock.runFor(400);
		const example = source.locator('xpath=ancestor::*[contains(@class,"card")][1]');
		await example.getByRole('option', { name: 'C#' }).click();
		const code = example.locator('pre');
		await expect(code).toContainText('TimeSpan.FromMilliseconds(1500)');
		await expect(code).toContainText('Default Animation');
		await chooseAnimation(page, 'Accordion');
		await expect(code).toContainText('Accordion');
		await expect(code).toContainText('1500');
		// The duration box's increase button: the boxes are ZoomFactor, velocity, duration.
		await page.getByRole('button', { name: 'increment value' }).nth(2).click();
		await expect(code).toContainText('TimeSpan.FromMilliseconds(2000)');
	});
});
