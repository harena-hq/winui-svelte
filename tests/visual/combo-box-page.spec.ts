/**
 * The ComboBox page runs the original's code-behind. Example 1's selection fills the Rectangle
 * under it with the named colour (ComboBoxPage.xaml.cs:39-61); example 2's sets the font of the
 * text under it, starting at index 2 (ComboBoxPage.xaml:48-64); example 3's editable box starts
 * at index 2 and takes a listed size or one strictly between 8 and 100, rejecting anything else
 * with a dialog and reverting its text (ComboBoxPage.xaml.cs:63-100).
 */
import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

const examples = (page: Page) => page.locator('[data-item-page] .example');
const swatch = (page: Page) => page.locator('[data-item-page] [data-color-output]');
const fontOutput = (page: Page) => page.locator('[data-item-page] [data-font-output]');
const sizeOutput = (page: Page) => page.locator('[data-item-page] [data-font-size-output]');
const sizeBox = (page: Page) => examples(page).nth(2).locator('input');

async function pick(page: Page, index: number, option: string) {
	await examples(page).nth(index).locator('button.trigger').click();
	await page.getByRole('option', { name: option, exact: true }).click();
}

async function submit(page: Page, text: string) {
	await sizeBox(page).fill(text);
	await sizeBox(page).press('Enter');
}

const css = (locator: Locator, property: string) =>
	locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

test.beforeEach(async ({ page }) => {
	await page.goto('/basicinput/combobox');
});

test('a colour fills the rectangle, centred under the ComboBox', async ({ page }) => {
	expect(await css(swatch(page), 'background-color')).toBe('rgba(0, 0, 0, 0)');
	const fills = {
		Blue: 'rgb(0, 0, 255)',
		Green: 'rgb(0, 128, 0)',
		Red: 'rgb(255, 0, 0)',
		Yellow: 'rgb(255, 255, 0)'
	};
	for (const [name, rgb] of Object.entries(fills)) {
		await pick(page, 0, name);
		await expect.poll(() => css(swatch(page), 'background-color')).toBe(rgb);
	}
	const rect = await swatch(page).boundingBox();
	const combo = await examples(page).nth(0).locator('button.trigger').boundingBox();
	if (rect === null || combo === null) throw new Error('no box');
	expect(rect.width).toBe(100);
	expect(rect.height).toBe(30);
	// Stretch with a fixed width centres it in the panel, which the 200-wide ComboBox sizes.
	expect(rect.x + rect.width / 2).toBeCloseTo(combo.x + combo.width / 2, 0);
});

test('the font starts at Courier New and follows the selection', async ({ page }) => {
	await expect(examples(page).nth(1).locator('button.trigger')).toHaveText('Courier New');
	expect(await css(fontOutput(page), 'font-family')).toBe('"Courier New"');
	await pick(page, 1, 'Times New Roman');
	await expect.poll(() => css(fontOutput(page), 'font-family')).toBe('"Times New Roman"');
});

test('the editable size starts at 10 and takes a listed or in-range size', async ({ page }) => {
	await expect(sizeBox(page)).toHaveValue('10');
	expect(await css(sizeOutput(page), 'font-size')).toBe('10px');
	// Listed, so the ComboBox's own search selects it and the handler is not raised.
	await submit(page, '14');
	await expect.poll(() => css(sizeOutput(page), 'font-size')).toBe('14px');
	// Matching no item's text, so the handler parses it: the listed 16 rather than a custom
	// "16.0", and likewise the lower bound's own 8, which is listed.
	await submit(page, '16.0');
	await expect(sizeBox(page)).toHaveValue('16');
	await expect.poll(() => css(sizeOutput(page), 'font-size')).toBe('16px');
	await submit(page, '8.0');
	await expect(sizeBox(page)).toHaveValue('8');
	await expect.poll(() => css(sizeOutput(page), 'font-size')).toBe('8px');
	// Not listed, but between 8 and 100.
	await submit(page, '99.5');
	await expect(sizeBox(page)).toHaveValue('99.5');
	await expect.poll(() => css(sizeOutput(page), 'font-size')).toBe('99.5px');
	await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('the box keeps the focus visual a key closes the list with, and not a pressed row', async ({
	page
}) => {
	const trigger = examples(page).nth(0).locator('button.trigger');
	const close = async (open: () => Promise<void>, how: () => Promise<void>, drawn: boolean) => {
		await open();
		await expect(page.getByRole('listbox')).toBeVisible();
		await how();
		await expect(page.getByRole('listbox')).toHaveCount(0);
		await expect(trigger).toBeFocused();
		expect(await trigger.evaluate((node) => node.matches(':focus-visible'))).toBe(drawn);
	};
	const commit = async () => {
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
	};
	// As on the reference guest: a press opens the list and a key closes it, and the box has the
	// visual, by Enter or by Escape; a key opens it and a pressed row closes it, and the box has
	// none; a press on the box the keyboard had focused, and a key to close, draws it again.
	await close(() => trigger.click(), commit, true);
	await close(
		() => trigger.click(),
		() => page.keyboard.press('Escape'),
		true
	);
	await close(
		() => page.keyboard.press('Enter'),
		() => page.getByRole('option', { name: 'Yellow', exact: true }).click(),
		false
	);
	await page.keyboard.press('Shift+Tab');
	await page.keyboard.press('Tab');
	await expect(trigger).toBeFocused();
	expect(await trigger.evaluate((node) => node.matches(':focus-visible'))).toBe(true);
	await close(() => trigger.click(), commit, true);
	// The box has the visual and a press opens the list: a pressed row closes it with none, and a
	// key that closes it after that draws it again, both as on the guest.
	await close(
		() => trigger.click(),
		() => page.getByRole('option', { name: 'Red', exact: true }).click(),
		false
	);
	await close(() => trigger.click(), commit, true);
});

test('an out-of-range size is rejected with a dialog and the text reverts', async ({ page }) => {
	await submit(page, '50');
	await expect.poll(() => css(sizeOutput(page), 'font-size')).toBe('50px');
	// The upper bound is excluded, and so is anything under the lower one and what does not
	// parse, including a listed size behind an ideographic space, which .NET's parser does not
	// count as white space.
	for (const text of ['100', '7.9', 'abc', '\u300014']) {
		await submit(page, text);
		const dialog = page.getByRole('dialog');
		await expect(dialog).toContainText('The font size must be a number between 8 and 100.');
		// No title, as the code-behind sets none.
		await expect(dialog.locator('.title')).toHaveCount(0);
		await expect(sizeBox(page)).toHaveValue('50');
		expect(await css(sizeOutput(page), 'font-size')).toBe('50px');
		// Close is the default button: drawn as the accent, it takes focus and Enter closes.
		const close = dialog.getByRole('button', { name: 'Close' });
		await expect(close).toHaveAttribute('data-variant', 'accent');
		await expect(close).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(dialog).toHaveCount(0);
	}
});
