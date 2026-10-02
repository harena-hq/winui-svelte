import { expect } from '@playwright/test';
import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('ToggleSwitch in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ToggleSwitch', '/dev/toggle-switch');
});

// The `<input>` is what the accessibility tree and a form read, and a user's click left its
// `checked` one state behind the root's. `check-box.spec.ts` says why the clicks have to be real.
test('the input holds the state after a click and after Space', async ({ page }) => {
	await page.goto('/dev/toggle-switch');
	const input = page.getByRole('switch').first();
	const root = input.locator('xpath=ancestor::div[contains(@class, "root")][1]');
	// The input takes no pointer events; a press lands on the track, inside the label.
	await root.locator('.track').click();
	await expect(root).toHaveAttribute('data-checked', 'true');
	await expect(input).toBeChecked();
	await page.keyboard.press('Space');
	await expect(root).not.toHaveAttribute('data-checked');
	await expect(input).not.toBeChecked();
});

test('the input holds the state when the parent puts it back', async ({ page }) => {
	await page.goto('/dev/checked-input');
	const input = page.getByRole('switch');
	const root = input.locator('xpath=ancestor::div[contains(@class, "root")][1]');
	await root.locator('.track').click();
	await expect(page.locator('#log')).toHaveText('switch:true');
	await expect(root).not.toHaveAttribute('data-checked');
	await expect(input).not.toBeChecked();
});
