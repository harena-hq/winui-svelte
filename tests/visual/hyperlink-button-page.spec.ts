/**
 * The HyperlinkButton page runs the original's bindings and code-behind. Example 1's button is
 * disabled while its CheckBox is checked, and the `IsEnabled` substitution writes
 * `IsEnabled="False"` only then (HyperlinkButtonPage.xaml:24-40). Example 2's click opens the
 * ToggleButton item in the Gallery's own frame (HyperlinkButtonPage.xaml.cs:17-20).
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

/** Opens the `index`th example's source pane and returns its code. The page header's own
 *  "Source code" button comes first. */
async function code(page: Page, index: number) {
	const source = page.getByRole('button', { name: 'Source code' }).nth(index + 1);
	await source.click();
	return source.locator('xpath=ancestor::*[contains(@class,"card")][1]').locator('pre');
}

const homePage = (page: Page) =>
	page.locator('[data-item-page] .example').getByText('Microsoft home page', { exact: true });

test.beforeEach(async ({ page }) => {
	await page.goto('/basicinput/hyperlinkbutton');
});

test('the first button links its URI into a new tab', async ({ page }) => {
	const link = homePage(page);
	await expect(link).toHaveAttribute('href', 'https://www.microsoft.com');
	await expect(link).toHaveAttribute('target', '_blank');
	await expect(link).toHaveAttribute('rel', 'noreferrer');
	await expect(link).not.toHaveAttribute('aria-disabled', /.*/);
});

test('the CheckBox disables the button and writes IsEnabled', async ({ page }) => {
	const xaml = await code(page, 0);
	const box = page.getByRole('checkbox', { name: 'Disable hyperlink button' });
	await expect(xaml).toContainText('NavigateUri="https://www.microsoft.com" />');
	await expect(xaml).not.toContainText('IsEnabled');
	// The role-located input takes no pointer events (CheckBox.svelte's `.input`), so it is
	// driven from the keyboard.
	await box.focus();
	await page.keyboard.press('Space');
	await expect(box).toBeChecked();
	await expect(homePage(page)).not.toHaveAttribute('href', /.*/);
	await expect(homePage(page)).toHaveAttribute('aria-disabled', 'true');
	await expect(xaml).toContainText('NavigateUri="https://www.microsoft.com" IsEnabled="False" />');
	await page.keyboard.press('Space');
	await expect(box).not.toBeChecked();
	await expect(homePage(page)).toHaveAttribute('href', 'https://www.microsoft.com');
	await expect(xaml).not.toContainText('IsEnabled');
});

test('the second button opens the ToggleButton item, and Back returns', async ({ page }) => {
	await page.getByRole('button', { name: 'Go to ToggleButton', exact: true }).click();
	await expect(page).toHaveURL(/\/basicinput\/togglebutton$/);
	await expect(page.getByRole('treeitem', { name: 'ToggleButton', exact: true })).toHaveAttribute(
		'aria-selected',
		'true'
	);
	await page.goBack();
	await expect(page).toHaveURL(/\/basicinput\/hyperlinkbutton$/);
	await expect(homePage(page)).toBeVisible();
	await expect(
		page.getByRole('treeitem', { name: 'HyperlinkButton', exact: true })
	).toHaveAttribute('aria-selected', 'true');
});
