import { expect, type Page } from '@playwright/test';
import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('RadioButton in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'RadioButton', '/dev/radio-button');
});

/**
 * The `<input>` is what the accessibility tree and a form read, so after a click every radio's
 * input has to hold the selection the roots show — the clicked one's and the sibling's it
 * unchecked. The clicks are the user's, for the reason `check-box.spec.ts` gives: a script's
 * `element.click()` runs its microtasks only after the whole dispatch.
 */
// The input takes no pointer events; a press lands on the content, inside the label.
const press = (page: Page, name: string) => page.getByText(name, { exact: true }).click();
const radio = (page: Page, name: string) =>
	page.locator('label', { has: page.getByText(name, { exact: true }) }).locator('input');

// Each named radio as `[checked, selected]`: the input's property and the root's attribute.
async function selection(page: Page, names: string[]) {
	return Promise.all(
		names.map((name) =>
			radio(page, name).evaluate((input: HTMLInputElement) => [
				input.checked,
				input.closest('.root')!.hasAttribute('data-checked')
			])
		)
	);
}

test.describe('the input holds the selection', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/dev/radio-button');
	});

	test('of a radio without a group, after a click', async ({ page }) => {
		await press(page, 'Unselected');
		expect(await selection(page, ['Unselected'])).toEqual([[true, true]]);
	});

	test('of a group, after a click and after an arrow key', async ({ page }) => {
		const fruit = ['Apple', 'Pear', 'Plum'];
		await press(page, 'Apple');
		expect(await selection(page, fruit)).toEqual([
			[true, true],
			[false, false],
			[false, false]
		]);
		await page.keyboard.press('ArrowDown');
		expect(await selection(page, fruit)).toEqual([
			[false, false],
			[true, true],
			[false, false]
		]);
	});
});

// `/dev/checked-input`: the clicks whose props end where they started, so that nothing but the
// canceled click puts back the input the browser checked and the sibling it unchecked; and two
// whose parent moves the selection elsewhere or clears it, which the click must not restore
// over, and where Svelte has nothing to write to the clicked input. `#log` shows that a click
// reached the component at all.
test.describe('the input holds the selection the props end in', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/dev/checked-input');
	});

	test('when the parent puts `group` back', async ({ page }) => {
		const stays = ['Stays first', 'Never second'];
		await press(page, 'Never second');
		await expect(page.locator('#log')).toHaveText('group:second');
		expect(await selection(page, stays)).toEqual([
			[true, true],
			[false, false]
		]);
		// An arrow key selects through the same click.
		await radio(page, 'Stays first').focus();
		await page.keyboard.press('ArrowDown');
		await expect(page.locator('#log')).toHaveText('group:second group:second');
		expect(await selection(page, stays)).toEqual([
			[true, true],
			[false, false]
		]);
	});

	test('when the radio has no `value` to put in `group`', async ({ page }) => {
		await press(page, 'Has no value');
		// Nothing logs for this row; focus is what shows the click reached the input.
		await expect(radio(page, 'Has no value')).toBeFocused();
		expect(await selection(page, ['Has a value', 'Has no value'])).toEqual([
			[true, true],
			[false, false]
		]);
	});

	test('when the parent puts `checked` back', async ({ page }) => {
		await press(page, 'Stays clear');
		await expect(page.locator('#log')).toHaveText('radio:true');
		expect(await selection(page, ['Stays clear'])).toEqual([[false, false]]);
	});

	test('when the parent moves `group` elsewhere', async ({ page }) => {
		await press(page, 'Moves on');
		await expect(page.locator('#log')).toHaveText('moves:clicked');
		expect(await selection(page, ['Start', 'Moves on', 'Third'])).toEqual([
			[false, false],
			[false, false],
			[true, true]
		]);
	});

	test('when the parent clears `group`', async ({ page }) => {
		await press(page, 'Clears the group');
		await expect(page.locator('#log')).toHaveText('clears:clearing');
		expect(await selection(page, ['Kept', 'Clears the group'])).toEqual([
			[false, false],
			[false, false]
		]);
	});
});
