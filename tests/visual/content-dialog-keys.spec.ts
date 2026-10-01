import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

/**
 * Enter and Escape in a `ContentDialog` — `ProcessLayoutRootKey` (`ContentDialog_Partial.cpp:1736`),
 * a handler on the layout root rather than on any button.
 *
 * Pressed on the reference on 2026-10-01, on the Gallery's two dialogs: with focus on the content's
 * CheckBox, where the dialog opens it, Enter clicked the default button and the page read "User
 * saved their work"; with focus moved to `Cancel`, Enter clicked `Cancel` instead; with no default
 * button Enter did nothing and the dialog stayed; and Escape closed both. Escape runs
 * `ExecuteCloseAction` (`:2063`), which clicks the close button when there is one, so its callback
 * runs, and otherwise only hides the dialog.
 */

const log = (page: Page) => page.locator('#log');
const dialog = (page: Page) => page.getByRole('dialog');

async function open(page: Page, which: string) {
	await page.locator(`#open-${which}`).click();
	await expect(dialog(page)).toBeVisible();
	// The dialog's own first step: focus on the content's CheckBox (`:1997`).
	await expect(dialog(page).getByRole('checkbox')).toBeFocused();
}

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/content-dialog-keys');
});

test('Enter on the content clicks the default button', async ({ page }) => {
	await open(page, 'default');
	await page.keyboard.press('Enter');
	await expect(dialog(page)).toHaveCount(0);
	await expect(log(page)).toHaveText('primary open:false');
});

test('Enter on a command button is that button, not the default', async ({ page }) => {
	await open(page, 'default');
	await dialog(page).getByRole('button', { name: 'Cancel' }).focus();
	await page.keyboard.press('Enter');
	await expect(dialog(page)).toHaveCount(0);
	await expect(log(page)).toHaveText('close open:false');
});

test('Enter does nothing without a default button, or with a disabled one', async ({ page }) => {
	for (const which of ['no-default', 'disabled-default']) {
		await open(page, which);
		await page.keyboard.press('Enter');
		await expect(dialog(page), which).toBeVisible();
		await expect(log(page), which).toHaveText('');
		await page.keyboard.press('Escape');
		await expect(dialog(page), which).toHaveCount(0);
	}
});

test('Escape clicks the close button, so its callback runs', async ({ page }) => {
	await open(page, 'default');
	await page.keyboard.press('Escape');
	await expect(dialog(page)).toHaveCount(0);
	await expect(log(page)).toHaveText('close open:false');
});

// The old code passed this too — the primitive's Escape hid the dialog and said `open:false`. It
// is here for the new code: Escape now runs `executeCloseAction`, and with no close button to
// click it has to hide the dialog once, not leave it open and not report the close twice.
test('Escape without a close button only hides the dialog', async ({ page }) => {
	await open(page, 'no-close');
	await page.keyboard.press('Escape');
	await expect(dialog(page)).toHaveCount(0);
	await expect(log(page)).toHaveText('open:false');
});

test('An Enter that commits an IME composition is not a press', async ({ page }) => {
	await page.locator('#open-fields').click();
	const field = dialog(page).locator('#field-text input');
	await field.focus();
	await field.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
	await expect(dialog(page)).toBeVisible();
	await expect(log(page)).toHaveText('');
	// Where the commit is reported without `isComposing`, the key code is the input method's.
	await field.dispatchEvent('keydown', { key: 'Enter', keyCode: 229 });
	await expect(dialog(page)).toBeVisible();
	await expect(log(page)).toHaveText('');
	// The same event without the composition is a press, so the one above was heard and ignored.
	await field.dispatchEvent('keydown', { key: 'Enter' });
	await expect(dialog(page)).toHaveCount(0);
	await expect(log(page)).toHaveText('primary open:false');
});

test("Enter in an AutoSuggestBox is the box's query, not the dialog's default", async ({
	page
}) => {
	await page.locator('#open-fields').click();
	await dialog(page).locator('#field-query input').focus();
	await page.keyboard.press('Enter');
	await expect(log(page)).toHaveText('query');
	await expect(dialog(page)).toBeVisible();
});
