/**
 * The TextBox page's code-behind only initializes it (TextBoxPage.xaml.cs:8-14); its four
 * examples are what TextBoxPage.xaml declares (:22-47), each checked here for what it sets.
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const examples = (page: Page) => page.locator('[data-item-page] .example');

test.beforeEach(async ({ page }) => {
	await page.goto('/text/textbox');
});

test('the simple TextBox is named and takes text', async ({ page }) => {
	const box = examples(page).nth(0).getByRole('textbox', { name: 'simple TextBox', exact: true });
	await expect(box).toBeEditable();
	await box.fill('hello');
	await expect(box).toHaveValue('hello');
});

test('the header names its TextBox, whose placeholder is Name', async ({ page }) => {
	const box = examples(page).nth(1).getByRole('textbox', { name: 'Enter your name:' });
	await expect(box).toHaveAttribute('placeholder', 'Name');
	await expect(examples(page).nth(1).getByText('Enter your name:', { exact: true })).toBeVisible();
});

test('the read-only TextBox carries the page font, spacing and colour, and takes no text', async ({
	page
}) => {
	const box = examples(page).nth(2).getByRole('textbox', { name: 'customized TextBox' });
	await expect(box).toHaveValue('I am super excited to be here!');
	await expect(box).not.toBeEditable();
	const style = await box.evaluate((el) => {
		const s = getComputedStyle(el);
		return {
			family: s.fontFamily,
			size: s.fontSize,
			style: s.fontStyle,
			spacing: s.letterSpacing,
			color: s.color
		};
	});
	// FontFamily="Arial" FontSize="24" FontStyle="Italic", CharacterSpacing="200" thousandths
	// of an em, Foreground="#5178BE" (TextBoxPage.xaml:32-36).
	expect(style).toEqual({
		family: 'Arial',
		size: '24px',
		style: 'italic',
		spacing: '4.8px',
		color: 'rgb(81, 120, 190)'
	});
});

test('the multi-line TextBox takes returns, checks spelling, is 400 wide and selects green', async ({
	page
}) => {
	const box = examples(page).nth(3).getByRole('textbox', { name: 'multi-line TextBox' });
	await expect(box).toHaveJSProperty('tagName', 'TEXTAREA');
	// IsSpellCheckEnabled (:45): set on the control and inherited by its field, as HTML's
	// spellcheck is.
	await expect(box).toHaveJSProperty('spellcheck', true);
	await expect(box.locator('xpath=ancestor::*[@spellcheck="true"]')).toHaveCount(1);
	await box.click();
	await page.keyboard.type('one');
	await page.keyboard.press('Enter');
	await page.keyboard.type('two');
	await expect(box).toHaveValue('one\ntwo');
	// MinWidth="400" (TextBoxPage.xaml:42), on the control's border box.
	const border = box.locator(
		'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " box ")][1]'
	);
	expect((await border.boundingBox())!.width).toBe(400);
	// TextWrapping="Wrap" (:47): a line longer than the box wraps inside it.
	await page.keyboard.press('Enter');
	await page.keyboard.type(
		'a much longer third line that runs past the four hundred pixel minimum width'
	);
	// A guard against a content-sized width, which reached 1277 when it was tried (WD-100).
	expect((await border.boundingBox())!.width).toBe(400);
	// Wrapped: no horizontal overflow, and the long line takes more rows than are left.
	expect(await box.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
	expect(await box.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
	// SelectionHighlightColor="Green" (:46).
	expect(await box.evaluate((el) => getComputedStyle(el, '::selection').backgroundColor)).toBe(
		'rgb(0, 128, 0)'
	);
});
