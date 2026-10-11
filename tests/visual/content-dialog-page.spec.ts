/**
 * The ContentDialog page runs the original's code-behind. Each example's button opens its dialog,
 * and the close writes one of three lines beside the button: the primary's, the secondary's, or
 * the cancelled one, which `ShowAsync` reports for the close button and Escape alike
 * (ContentDialogPage.xaml.cs:26-60, :62-96). The first dialog's default button is `Save`, so Enter
 * on its content saves; the second has none, so Enter does nothing. Pressed on the reference on
 * 2026-10-11: Escape left "User cancelled the dialog" with focus back on the button, and `Keep`
 * left "User kept the file".
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const EXAMPLES = [
	{
		launch: 'Show dialog',
		primary: ['Save', 'User saved their work'],
		secondary: ["Don't Save", 'User did not save their work']
	},
	{
		launch: 'Show dialog without default button',
		primary: ['Replace', 'User replaced the file'],
		secondary: ['Keep', 'User kept the file']
	}
] as const;

const CANCELLED = 'User cancelled the dialog';

const dialog = (page: Page) => page.getByRole('dialog');
const launcher = (page: Page, index: number) =>
	page.getByRole('button', { name: EXAMPLES[index].launch, exact: true });
const result = (page: Page, index: number) =>
	page.locator('[data-item-page] [data-dialog-result]').nth(index);

async function open(page: Page, index: number) {
	await launcher(page, index).click();
	await expect(dialog(page)).toBeVisible();
	// The dialog's own first step puts focus on the content's CheckBox.
	await expect(dialog(page).getByRole('checkbox')).toBeFocused();
}

test.beforeEach(async ({ page }) => {
	await page.goto('/dialogsandflyouts/contentdialog');
});

for (const [index, example] of EXAMPLES.entries()) {
	test.describe(example.launch, () => {
		for (const [button, line] of [example.primary, example.secondary, ['Cancel', CANCELLED]]) {
			test(`${button} writes "${line}"`, async ({ page }) => {
				await expect(result(page, index)).toHaveText('');
				await open(page, index);
				await dialog(page).getByRole('button', { name: button, exact: true }).click();
				await expect(dialog(page)).toHaveCount(0);
				await expect(result(page, index)).toHaveText(line);
				// The other example's line is its own.
				await expect(result(page, 1 - index)).toHaveText('');
			});
		}

		test('Escape after an earlier button is a cancel, with focus back on the button', async ({
			page
		}) => {
			await open(page, index);
			await dialog(page).getByRole('button', { name: example.primary[0], exact: true }).click();
			await expect(result(page, index)).toHaveText(example.primary[1]);
			await open(page, index);
			await page.keyboard.press('Escape');
			await expect(dialog(page)).toHaveCount(0);
			await expect(result(page, index)).toHaveText(CANCELLED);
			await expect(launcher(page, index)).toBeFocused();
		});
	});
}

test('Enter on the first dialog clicks its default button, Save', async ({ page }) => {
	await open(page, 0);
	await page.keyboard.press('Enter');
	await expect(dialog(page)).toHaveCount(0);
	await expect(result(page, 0)).toHaveText('User saved their work');
});

test('Enter on the second dialog does nothing, having no default button', async ({ page }) => {
	await open(page, 1);
	await page.keyboard.press('Enter');
	await expect(dialog(page)).toBeVisible();
	await expect(result(page, 1)).toHaveText('');
	// A later event only a dialog still open can take, with a line no Enter path writes: had
	// Enter closed it by any button, Keep would not be there to click.
	await dialog(page).getByRole('button', { name: 'Keep', exact: true }).click();
	await expect(result(page, 1)).toHaveText('User kept the file');
});

test('each show builds fresh content, so the CheckBox starts unchecked', async ({ page }) => {
	// The original constructs a new ContentDialogContent per show (ContentDialogPage.xaml.cs:38).
	await open(page, 0);
	// The input takes no pointer events (CheckBox.svelte's `.input` rule), so it is checked from
	// the keyboard; `open` left focus on it.
	await page.keyboard.press('Space');
	await expect(dialog(page).getByRole('checkbox')).toBeChecked();
	await page.keyboard.press('Escape');
	await expect(dialog(page)).toHaveCount(0);
	await open(page, 0);
	await expect(dialog(page).getByRole('checkbox')).not.toBeChecked();
});

test('the result line is a polite live region', async ({ page }) => {
	for (const index of [0, 1]) {
		await expect(result(page, index)).toHaveAttribute('aria-live', 'polite');
	}
});

test("each example's source pane has its C# tab", async ({ page }) => {
	for (const [index, title] of [
		[0, 'Save your work?'],
		[1, 'Replace file?']
	] as const) {
		const source = page.getByRole('button', { name: 'Source code' }).nth(index + 1);
		await source.click();
		const card = source.locator('xpath=ancestor::*[contains(@class,"card")][1]');
		await card.getByRole('option', { name: 'C#' }).click();
		await expect(card.locator('pre')).toContainText(`dialog.Title = "${title}";`);
	}
});
