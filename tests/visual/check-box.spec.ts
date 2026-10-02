import { expect, type Page } from '@playwright/test';
import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('CheckBox in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'CheckBox', '/dev/check-box');
});

/**
 * The `<input>` is what the accessibility tree and a form read, so after a click it has to hold
 * the state the component's root shows. The clicks here are the user's — a mouse press and a
 * key — because a script's `element.click()` runs its microtasks only after the whole dispatch,
 * and passed while every real click left the property one state behind.
 */
// Found by its content rather than by role and name: a checked box's glyph is generated content,
// and the accessibility tree reads it into the name.
const box = (page: Page, name: string) =>
	page.locator('label', { has: page.getByText(name, { exact: true }) }).locator('input');
// The input takes no pointer events; a press lands on the content, inside the label.
const press = (page: Page, name: string) => page.getByText(name, { exact: true }).click();

async function element(page: Page, name: string) {
	return box(page, name).evaluate((input: HTMLInputElement) => ({
		state: input.closest('.root')!.getAttribute('data-state'),
		checked: input.checked,
		indeterminate: input.indeterminate
	}));
}

test.describe('the input holds the state', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/dev/check-box');
	});

	test('after a click and after Space', async ({ page }) => {
		await press(page, 'Unchecked');
		expect(await element(page, 'Unchecked')).toEqual({
			state: 'checked',
			checked: true,
			indeterminate: false
		});
		await expect(box(page, 'Unchecked')).toBeChecked();
		await page.keyboard.press('Space');
		expect(await element(page, 'Unchecked')).toEqual({
			state: 'unchecked',
			checked: false,
			indeterminate: false
		});
		await expect(box(page, 'Unchecked')).not.toBeChecked();
	});

	test('through the three-state cycle', async ({ page }) => {
		const cycle = [
			{ state: 'checked', checked: true, indeterminate: false },
			{ state: 'indeterminate', checked: false, indeterminate: true },
			// The props' `checked` is false before and after this step, so nothing but the
			// click handler writes the property the click itself turned on.
			{ state: 'unchecked', checked: false, indeterminate: false }
		];
		for (const expected of cycle) {
			await press(page, 'Three-state');
			expect(await element(page, 'Three-state')).toEqual(expected);
		}
	});

	test('leaving a checked indeterminate box', async ({ page }) => {
		await press(page, 'Indeterminate');
		expect(await element(page, 'Indeterminate')).toEqual({
			state: 'unchecked',
			checked: false,
			indeterminate: false
		});
	});

	test('in the form it submits', async ({ page }) => {
		await press(page, 'Agree');
		const submitted = await page
			.locator('form')
			.evaluate((form: HTMLFormElement) => [...new FormData(form)]);
		expect(submitted).toEqual([['agree', 'yes']]);
	});
});

// `/dev/checked-input`: the cases where the click's own flip of `checked` is wrong and the props'
// update writes nothing, because the props end where they started or `checked` does not change.
// For the rows whose props end where they started, `#log` shows that the click reached the
// component at all.
test.describe('the input holds the state the props end in', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/dev/checked-input');
	});

	test('leaving an unchecked indeterminate box', async ({ page }) => {
		await press(page, 'Unchecked and indeterminate');
		expect(await element(page, 'Unchecked and indeterminate')).toEqual({
			state: 'unchecked',
			checked: false,
			indeterminate: false
		});
	});

	test('when the parent puts `checked` back', async ({ page }) => {
		await press(page, 'Stays unchecked');
		await expect(page.locator('#log')).toHaveText('checked:true');
		expect(await element(page, 'Stays unchecked')).toEqual({
			state: 'unchecked',
			checked: false,
			indeterminate: false
		});
	});

	test('when the parent puts `indeterminate` back', async ({ page }) => {
		await press(page, 'Stays indeterminate');
		await expect(page.locator('#log')).toHaveText('indeterminate:false');
		expect(await element(page, 'Stays indeterminate')).toEqual({
			state: 'indeterminate',
			checked: false,
			indeterminate: true
		});
	});
});
