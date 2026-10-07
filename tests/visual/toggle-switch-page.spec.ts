/**
 * The ToggleSwitch page runs the original's bindings. Example 1's switch is named through
 * `AutomationProperties.Name` (ToggleSwitchPage.xaml:23). Example 2's ring is active while its
 * switch is on (:34), and the switch's `IsOn` is written by two substitutions, `isOn` enabled
 * while on and `isOff` while off (:38-45).
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

test.beforeEach(async ({ page }) => {
	await page.goto('/basicinput/toggleswitch');
});

test('the simple switch carries its automation name', async ({ page }) => {
	await expect(page.getByRole('switch', { name: 'simple ToggleSwitch' })).toBeVisible();
});

test('the custom switch drives the ring and writes IsOn', async ({ page }) => {
	const toggle = page.getByRole('switch', { name: /Toggle work/ });
	const ring = page.locator('[data-item-page] [data-ring-state]');
	const xaml = await code(page, 1);
	await expect(toggle).toBeChecked();
	await expect(ring).toHaveAttribute('data-ring-state', 'active');
	await expect(xaml).toContainText('IsOn="True"');
	await toggle.focus();
	await page.keyboard.press('Space');
	await expect(toggle).not.toBeChecked();
	await expect(ring).toHaveAttribute('data-ring-state', 'inactive');
	await expect(xaml).toContainText('IsOn="False"');
});
