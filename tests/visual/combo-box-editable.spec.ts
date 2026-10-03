import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

const ROUTE = '/dev/combo-box-editable';
const font = (page: Page) => page.getByRole('combobox', { name: 'Font Size' });
const rowInput = (page: Page, row: string) => page.getByTestId(row).getByRole('combobox');
const overlay = (page: Page) => page.getByTestId('font-size').locator('.overlay');
const size = (page: Page, n: number) =>
	expect(page.getByTestId('font-size-output')).toHaveCSS('font-size', `${n}px`);
async function selection(input: Locator, start: number, end: number) {
	await expect
		.poll(() => input.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd]))
		.toEqual([start, end]);
}
async function type(page: Page, input: Locator, text: string) {
	await input.focus();
	await page.keyboard.press('Control+a');
	await page.keyboard.type(text);
}
async function closed(page: Page) {
	await expect(font(page)).toHaveAttribute('aria-expanded', 'false');
	await expect(page.getByRole('option')).toHaveCount(0);
}
async function boxFocused(page: Page) {
	await expect
		.poll(() =>
			page
				.getByTestId('font-size')
				.evaluate((el) => document.activeElement === el.querySelector('.box'))
		)
		.toBe(true);
}
async function neutral(page: Page) {
	await page.getByRole('heading', { name: 'ComboBox editable', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
	await page.goto(ROUTE);
});

test('an unfocused text press selects all without opening', async ({ page }) => {
	const input = font(page);
	await input.click();
	await expect(input).toBeFocused();
	await selection(input, 0, 2);
	await closed(page);
});

test('typing completes a prefix and backspace searches exact text', async ({ page }) => {
	const input = font(page);
	await input.focus();
	await page.keyboard.type('2');
	await expect(input).toHaveValue('20');
	await selection(input, 1, 2);
	await page.keyboard.type('4');
	await expect(input).toHaveValue('24');
	await selection(input, 2, 2);
	await page.keyboard.press('Backspace');
	await expect(input).toHaveValue('2');
	await page.keyboard.type('7');
	await expect(input).toHaveValue('27');
	await closed(page);
});

test('Enter submits a custom font size', async ({ page }) => {
	await font(page).focus();
	await page.keyboard.type('2');
	await page.keyboard.type('7');
	await page.keyboard.press('Enter');
	await size(page, 27);
	await expect(page.getByTestId('font-size-rejected').getByRole('listitem')).toHaveCount(0);
	await closed(page);
	await expect(font(page)).toBeFocused();
});

test('Enter commits the completed item', async ({ page }) => {
	await type(page, font(page), '3');
	await expect(font(page)).toHaveValue('36');
	await page.keyboard.press('Enter');
	await size(page, 36);
});

test('Escape closed restores the committed text', async ({ page }) => {
	await type(page, font(page), '3');
	await expect(font(page)).toHaveValue('36');
	await page.keyboard.press('Escape');
	await expect(font(page)).toHaveValue('10');
	await selection(font(page), 0, 2);
	await size(page, 10);
	await expect(font(page)).toBeFocused();
});

test('Tab closed commits and moves focus', async ({ page }) => {
	await type(page, font(page), '2');
	await page.keyboard.press('Tab');
	await size(page, 20);
	await expect(font(page)).not.toBeFocused();
});

test('blur submits and the handler can rewrite the text before matching', async ({ page }) => {
	await type(page, font(page), '2815');
	await expect(font(page)).toHaveValue('2815');
	await neutral(page);
	await expect(page.getByTestId('font-size-rejected').getByRole('listitem')).toHaveText(['2815']);
	await size(page, 10);
	await expect(font(page)).toHaveValue('10');
});

test('ArrowDown closed opens without moving selection', async ({ page }) => {
	await font(page).focus();
	await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(font(page)).toHaveValue('10');
	await size(page, 10);
});

test('open arrows write text and expose the shown row to accessibility', async ({ page }) => {
	await font(page).focus();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveValue('12');
	await selection(font(page), 0, 2);
	const item = page.getByRole('option', { name: '12', exact: true });
	await expect(item).toHaveAttribute('data-selected', '');
	for (const option of await page.getByRole('option').all()) {
		if ((await option.getAttribute('id')) !== (await item.getAttribute('id')))
			await expect(option).not.toHaveAttribute('data-selected');
	}
	await expect(font(page)).toHaveAttribute(
		'aria-activedescendant',
		(await item.getAttribute('id'))!
	);
	await page.keyboard.press('Enter');
	await size(page, 12);
	await closed(page);
});

test('arrows clamp at both ends', async ({ page }) => {
	await type(page, font(page), '8');
	await page.keyboard.press('Enter');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('ArrowUp');
	await expect(font(page)).toHaveValue('8');
	await expect(page.getByRole('option', { name: '8', exact: true })).toHaveAttribute(
		'data-selected',
		''
	);
	for (let i = 0; i < 14; i++) await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveValue('72');
	await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveValue('72');
	await expect(page.getByRole('option', { name: '72', exact: true })).toHaveAttribute(
		'data-selected',
		''
	);
	await expect(font(page)).toHaveAttribute('aria-expanded', 'true');
});

// The reference, typed "2" over "10" and opened with Alt+Down, keeps "2[0]" with only the
// completed digit selected: the text box already had focus, so opening selects nothing.
test('opening from the keyboard mid-completion keeps the completed remainder selected', async ({
	page
}) => {
	await font(page).focus();
	await page.keyboard.type('2');
	await selection(font(page), 1, 2);
	await page.keyboard.press('Alt+ArrowDown');
	await expect(font(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(font(page)).toHaveValue('20');
	await selection(font(page), 1, 2);
});

test('Alt+ArrowDown open moves without closing', async ({ page }) => {
	await overlay(page).click();
	await page.keyboard.press('Alt+ArrowDown');
	await expect(font(page)).toHaveValue('11');
	await expect(font(page)).toHaveAttribute('aria-expanded', 'true');
});

test('Alt+ArrowUp open moves without closing', async ({ page }) => {
	await overlay(page).click();
	await page.keyboard.press('Alt+ArrowUp');
	await expect(font(page)).toHaveValue('9');
	await expect(font(page)).toHaveAttribute('aria-expanded', 'true');
});

test('Escape open cancels and box arrows restore input focus', async ({ page }) => {
	await overlay(page).click();
	await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveValue('11');
	await page.keyboard.press('Escape');
	await closed(page);
	await expect(font(page)).toHaveValue('10');
	await size(page, 10);
	await boxFocused(page);
	expect(await page.locator('[data-testid="font-size"] .box:focus-visible').count()).toBe(1);
	await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(font(page)).toBeFocused();
});

// The reference's own outside press lands on an area that takes no focus, so the text box keeps
// it; the pad stands in for that, so the cancel seen here is the dismissal's and not a blur's.
test('an outside press that takes no focus cancels and keeps focus in the text', async ({
	page
}) => {
	await overlay(page).click();
	await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveValue('11');
	await page.getByTestId('inert-pad').click({ delay: 100 });
	await closed(page);
	await expect(font(page)).toHaveValue('10');
	await expect(font(page)).toBeFocused();
});

test('outside press cancels the open search', async ({ page }) => {
	await overlay(page).click();
	await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveValue('11');
	await neutral(page);
	await closed(page);
	await expect(font(page)).toHaveValue('10');
	await size(page, 10);
});

test('overlay toggles and commits to box focus', async ({ page }) => {
	await overlay(page).click();
	await expect(font(page)).toBeFocused();
	await selection(font(page), 0, 2);
	await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveValue('11');
	// A held press, as a person's is: bits-ui reports the overlay as outside 10 ms after the
	// press goes down, which a fast synthetic click never lasts long enough to reach.
	await overlay(page).click({ delay: 100 });
	await size(page, 11);
	await closed(page);
	await boxFocused(page);
	expect(await page.locator('[data-testid="font-size"] .box:focus-visible').count()).toBe(0);
});

test('item click writes its text before the close commits', async ({ page }) => {
	await overlay(page).click();
	await page.getByRole('option', { name: '14', exact: true }).click();
	await size(page, 14);
	await expect(font(page)).toHaveValue('14');
	await closed(page);
});

test('clicking the current item restores its text before closing', async ({ page }) => {
	await overlay(page).click();
	await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveValue('11');
	await page.getByRole('option', { name: '10', exact: true }).click();
	await size(page, 10);
	await expect(font(page)).toHaveValue('10');
	await closed(page);
});

test('Tab open commits and a second Tab moves focus', async ({ page }) => {
	await overlay(page).click();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Tab');
	await size(page, 11);
	await closed(page);
	await expect(font(page)).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(font(page)).not.toBeFocused();
});

test('the same custom colour submits once ignoring case', async ({ page }) => {
	const input = rowInput(page, 'colours');
	await type(page, input, 'Purple');
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('colours-submitted').getByRole('listitem')).toHaveText(['Purple']);
	await expect(page.getByTestId('colours-value')).toHaveText('Purple');
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('colours-submitted').getByRole('listitem')).toHaveText(['Purple']);
	await type(page, input, 'PURPLE');
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('colours-submitted').getByRole('listitem')).toHaveText(['Purple']);
	// Text that differs from the held value only by case is not rewritten.
	await expect(input).toHaveValue('PURPLE');
});

test('backspace searches whole text, so the shortened text submits', async ({ page }) => {
	await font(page).focus();
	await page.keyboard.type('2');
	await expect(font(page)).toHaveValue('20');
	await page.keyboard.press('Backspace');
	await expect(font(page)).toHaveValue('2');
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('font-size-rejected').getByRole('listitem')).toHaveText(['2']);
	await size(page, 10);
});

test('a press in the text while open leaves the list open', async ({ page }) => {
	await overlay(page).click();
	await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveValue('11');
	await font(page).click({ position: { x: 20, y: 10 } });
	await expect(font(page)).toHaveAttribute('aria-expanded', 'true');
	await expect(font(page)).toHaveValue('11');
	await expect(font(page)).toBeFocused();
});

test('a completed label commits the item value', async ({ page }) => {
	const input = rowInput(page, 'colours');
	await type(page, input, 'bl');
	await expect(input).toHaveValue('Blue');
	await selection(input, 2, 4);
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('colours-value')).toHaveText('blue');
	await expect(page.getByTestId('colours-submitted').getByRole('listitem')).toHaveCount(0);
});

// `ResetSearch` clears the result and not the string, so the item's own text, committed again,
// finds no search result and goes to `TextSubmitted` — upstream's behaviour, read in the pin.
test('committing an item text again raises TextSubmitted for it', async ({ page }) => {
	const input = rowInput(page, 'colours');
	await type(page, input, 'bl');
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('colours-value')).toHaveText('blue');
	await expect(page.getByTestId('colours-submitted').getByRole('listitem')).toHaveCount(0);
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('colours-submitted').getByRole('listitem')).toHaveText(['Blue']);
	await expect(page.getByTestId('colours-value')).toHaveText('blue');
});

test('whitespace commits nothing', async ({ page }) => {
	await type(page, rowInput(page, 'colours'), '   ');
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('colours-submitted').getByRole('listitem')).toHaveCount(0);
	await expect(page.getByTestId('colours-value')).toHaveText('');
});

test('handled submission retains the item and restores its label', async ({ page }) => {
	const input = rowInput(page, 'handled');
	await type(page, input, 'Purple');
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('handled-submitted').getByRole('listitem')).toHaveText(['Purple']);
	await expect(page.getByTestId('handled-value')).toHaveText('green');
	await expect(input).toHaveValue('Green');
});

test('disabled input and overlay cannot open', async ({ page }) => {
	const input = rowInput(page, 'disabled');
	await expect(input).toBeDisabled();
	await page.getByTestId('disabled').locator('.overlay').click();
	await expect(input).toHaveAttribute('aria-expanded', 'false');
	await expect(page.getByRole('option')).toHaveCount(0);
});

test('popup meets the box and squares only the facing corners', async ({ page }) => {
	await overlay(page).click();
	const popup = page.locator('.popup');
	await expect(popup).toBeVisible();
	const box = await page
		.getByTestId('font-size')
		.evaluate((el) => el.querySelector('.box')!.getBoundingClientRect().toJSON());
	const popupBox = (await popup.boundingBox())!;
	expect(Math.abs(popupBox.y - box.bottom)).toBeLessThanOrEqual(1);
	const radii = (el: Element) => {
		const s = getComputedStyle(el);
		return [
			s.borderTopLeftRadius,
			s.borderTopRightRadius,
			s.borderBottomLeftRadius,
			s.borderBottomRightRadius
		];
	};
	const boxRadii = await page.getByTestId('font-size').evaluate((el) => {
		const s = getComputedStyle(el.querySelector('.box')!);
		return [
			s.borderTopLeftRadius,
			s.borderTopRightRadius,
			s.borderBottomLeftRadius,
			s.borderBottomRightRadius
		];
	});
	expect(boxRadii.slice(2)).toEqual(['0px', '0px']);
	for (const radius of boxRadii.slice(0, 2)) expect(radius).not.toBe('0px');
	const popupRadii = await popup.evaluate(radii);
	expect(popupRadii.slice(0, 2)).toEqual(['0px', '0px']);
	for (const radius of popupRadii.slice(2)) expect(radius).not.toBe('0px');
	await overlay(page).click();
	await expect
		.poll(() =>
			page.getByTestId('font-size').evaluate((el) => {
				const s = getComputedStyle(el.querySelector('.box')!);
				const token = s.getPropertyValue('--winui-ControlCornerRadius').trim();
				return [
					s.borderTopLeftRadius,
					s.borderTopRightRadius,
					s.borderBottomLeftRadius,
					s.borderBottomRightRadius
				].every((r) => r === token);
			})
		)
		.toBe(true);
});

test('the box is the minimum height, and focus does not grow it', async ({ page }) => {
	const height = () =>
		page.getByTestId('font-size').evaluate((el) => {
			const box = el.querySelector('.box') as HTMLElement;
			return [
				box.getBoundingClientRect().height,
				parseFloat(getComputedStyle(box).getPropertyValue('--winui-ComboBoxMinHeight'))
			];
		});
	const [rest, min] = await height();
	expect(rest).toBe(min);
	await font(page).click();
	await expect(font(page)).toBeFocused();
	expect((await height())[0]).toBe(min);
});

// `OnGotFocus` reconciles text written while the box was not focused (:2349-2351), so the
// completion shows as focus arrives, before anything is committed.
test('focus completes text the consumer wrote while unfocused', async ({ page }) => {
	await page.getByTestId('colours-set-text').click();
	const input = rowInput(page, 'colours');
	await expect(input).toHaveValue('gr');
	await input.click({ position: { x: 10, y: 10 } });
	await expect(input).toHaveValue('Green');
	await expect(page.getByTestId('colours-value')).toHaveText('');
});

// Tab commits as it is pressed (:3056-3063) and focus leaving commits again (:2386-2392); by
// then the search string is the item's text, so the second commit raises TextSubmitted for it.
// Read in the pin; the reference Gallery's handler accepts the text silently, so it cannot show.
test('Tab out after completing an item raises TextSubmitted from the blur commit', async ({
	page
}) => {
	const input = rowInput(page, 'colours');
	await type(page, input, 'bl');
	await page.keyboard.press('Tab');
	await expect(page.getByTestId('colours-value')).toHaveText('blue');
	await expect(page.getByTestId('colours-submitted').getByRole('listitem')).toHaveText(['Blue']);
});
