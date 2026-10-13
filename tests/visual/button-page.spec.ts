/**
 * The Button page runs the original's code-behind: each of the first two buttons' Click writes
 * "You clicked: " and its own name into its own output (ButtonPage.xaml.cs:16-33), and the
 * first is disabled by its CheckBox (ButtonPage.xaml:28 and :34-42). The other two examples are
 * layout: the two built-in styles side by side, and buttons stretched or wrapping
 * (ButtonPage.xaml:76-112).
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const examples = (page: Page) => page.locator('[data-item-page] .example');
const outputs = (page: Page) => page.locator('[data-item-page] .output');
/** The output TextBlock itself, after the frame's "Output:" label. */
const output = (page: Page, index: number) =>
	outputs(page).nth(index).locator(':scope > :nth-child(2)');

/** Opens the `index`th example's source pane and returns its card. The page header's own
 *  "Source code" button comes first. */
async function source(page: Page, index: number) {
	const button = page.getByRole('button', { name: 'Source code' }).nth(index + 1);
	await button.click();
	return button.locator('xpath=ancestor::*[contains(@class,"card")][1]');
}

test.beforeEach(async ({ page }) => {
	await page.goto('/basicinput/button');
});

test('each button writes its own name into its own output', async ({ page }) => {
	await expect(output(page, 0)).toHaveText('');
	await expect(output(page, 1)).toHaveText('');
	await page.getByRole('button', { name: 'Standard XAML', exact: true }).click();
	await expect(output(page, 0)).toHaveText('You clicked: Button1');
	await expect(output(page, 1)).toHaveText('');
	await page.getByRole('button', { name: 'Pie', exact: true }).click();
	await expect(output(page, 1)).toHaveText('You clicked: Button2');
	await expect(output(page, 0)).toHaveText('You clicked: Button1');
});

test('each output holds a line before its first click, and the cards do not move', async ({
	page
}) => {
	// An empty TextBlock is still one line (TextBlock.cpp:1655-1661); measured on the original,
	// both example cards end on the same rows before a click as after.
	const cards = [0, 1].map((index) => examples(page).nth(index));
	const before = await Promise.all(cards.map(async (card) => (await card.boundingBox())!.height));
	expect((await output(page, 0).boundingBox())!.height).toBe(17);
	const empty = (await output(page, 1).boundingBox())!.height;
	expect(empty).toBeGreaterThan(0);
	await page.getByRole('button', { name: 'Standard XAML', exact: true }).click();
	await page.getByRole('button', { name: 'Pie', exact: true }).click();
	await expect(output(page, 1)).toHaveText('You clicked: Button2');
	const after = await Promise.all(cards.map(async (card) => (await card.boundingBox())!.height));
	expect(after).toEqual(before);
	expect((await output(page, 1).boundingBox())!.height).toBe(empty);
});

test('the first output line is a box of 17, its ink lifted a row', async ({ page }) => {
	// "Global User Interface" (ButtonPage.xaml:31): the same glyphs as the label, a shorter line,
	// both as measured on the original.
	const line = output(page, 0);
	expect(await line.evaluate((el) => getComputedStyle(el).lineHeight)).toBe('17px');
	// The lift measured, not read back: the line's box starts a row inside the label's.
	const label = (await outputs(page).nth(0).locator(':scope > :nth-child(1)').boundingBox())!;
	const box = (await line.boundingBox())!;
	expect(box.y - (label.y + label.height)).toBeCloseTo(-1, 1);
	expect(await output(page, 1).evaluate((el) => getComputedStyle(el).lineHeight)).toBe('normal');
});

test('the CheckBox disables the first button and writes IsEnabled', async ({ page }) => {
	const button = page.getByRole('button', { name: 'Standard XAML', exact: true });
	const card = await source(page, 0);
	const pre = card.locator('pre');
	await expect(pre).toHaveText('<Button Content="Standard XAML button" Click="Button_Click" />');
	await page.getByRole('checkbox', { name: 'Disable button' }).focus();
	await page.keyboard.press('Space');
	await expect(button).toBeDisabled();
	await expect(pre).toHaveText(
		'<Button Content="Standard XAML button" Click="Button_Click" IsEnabled="False" />'
	);
	// A disabled button raises no Click.
	await button.click({ force: true });
	await expect(output(page, 0)).toHaveText('');
	await page.getByRole('checkbox', { name: 'Disable button' }).focus();
	await page.keyboard.press('Space');
	await expect(button).toBeEnabled();
	await card.getByRole('option', { name: 'C#' }).click();
	await expect(pre).toContainText('private void Button_Click(object sender, RoutedEventArgs e)');
});

test('the image button is 50 square, its Slice fitted inside its padding', async ({ page }) => {
	const button = page.getByRole('button', { name: 'Pie', exact: true });
	const box = (await button.boundingBox())!;
	expect(box.width).toBe(50);
	expect(box.height).toBe(50);
	const image = button.getByRole('img', { name: 'Slice' });
	await expect(image).toHaveAttribute('src', '/Slices.png');
	// An Image's default Stretch, Uniform, in the content box: 50 less the padding's 11 and 11
	// and the border's 1 and 1 across, 50 less 5 and 6 and 1 and 1 down.
	await expect(image).toHaveAttribute('data-stretch', 'uniform');
	const contentBox = (await image.boundingBox())!;
	expect(contentBox.width).toBe(26);
	expect(contentBox.height).toBe(37);
});

test('the built-in styles stand 16 apart', async ({ page }) => {
	const accent = page.getByRole('button', { name: 'Accent style', exact: true });
	const subtle = page.getByRole('button', { name: 'Subtle style', exact: true });
	await expect(accent).toHaveAttribute('data-variant', 'accent');
	await expect(subtle).toHaveAttribute('data-variant', 'subtle');
	await expect(accent).toHaveText('Accent style button');
	await expect(subtle).toHaveText('Subtle style button');
	const a = (await accent.boundingBox())!;
	const b = (await subtle.boundingBox())!;
	expect(b.x - (a.x + a.width)).toBeCloseTo(16, 0);
});

test('stretched buttons span the widest text, and wrapped ones stop at 240', async ({ page }) => {
	const example = examples(page).nth(3);
	// The widest line of text, measured on its text run rather than on its paragraph, which spans
	// the column whatever its text measures.
	const widest = await example
		.getByText('One option to mitigate clipped content', { exact: false })
		.evaluate((p) => {
			const range = document.createRange();
			range.selectNodeContents(p);
			const rect = range.getBoundingClientRect();
			return { x: rect.x, width: rect.width };
		});
	for (const name of [
		'This is some text that is too long and will get cut off',
		'This is another text that would result in being cut off'
	]) {
		const box = (await example.getByRole('button', { name, exact: true }).boundingBox())!;
		expect(box.x).toBeCloseTo(widest.x, 0);
		expect(box.width).toBeCloseTo(widest.width, 0);
	}
	const first = example.getByRole('button', {
		name: 'This is some text that is too long and will get cut off without wrapping'
	});
	const second = example.getByRole('button', {
		name: 'This is another text that would result in being cut off without wrapping'
	});
	const f = (await first.boundingBox())!;
	const s = (await second.boundingBox())!;
	expect(f.width).toBe(240);
	expect(s.width).toBe(240);
	// Wrapped, not clipped: more than one line tall.
	expect(f.height).toBeGreaterThan(40);
	// Margin="0,0,8,0", and the pair centred in the stack.
	expect(s.x - (f.x + f.width)).toBeCloseTo(8, 0);
	const centre = (f.x + s.x + s.width) / 2;
	expect(centre).toBeCloseTo(widest.x + widest.width / 2, 0);
});
