/**
 * The ProgressBar page runs the original's bindings and code-behind. Example 1's radio buttons
 * bind `ShowPaused` and `ShowError` (ProgressBarPage.xaml:28-29) and their substitutions (:42-43); Example
 * 2's NumberBox drives the bar through `ProgressValue_ValueChanged` (ProgressBarPage.xaml.cs:15-27),
 * which sets a box that is not a number back to 0, and the bar with it.
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const bars = (page: Page) => page.locator('[data-item-page] [role=progressbar]');
const box = (page: Page) => page.locator('[data-item-page]').getByRole('spinbutton');

/** Opens the `index`th example's source pane and returns its code. The page header's own
 *  "Source code" button comes first. */
async function code(page: Page, index: number) {
	const source = page.getByRole('button', { name: 'Source code' }).nth(index + 1);
	await source.click();
	return source.locator('xpath=ancestor::*[contains(@class,"card")][1]').locator('pre');
}

test.beforeEach(async ({ page }) => {
	await page.goto('/statusandinfo/progressbar');
});

test('the progress state radios set the indeterminate bar and its XAML', async ({ page }) => {
	const bar = bars(page).nth(0);
	const xaml = await code(page, 0);
	await expect(bar).toHaveAttribute('data-progress-state', 'indeterminate');
	await expect(xaml).toContainText('ShowPaused="False" ShowError="False"');
	await page.getByText('Paused', { exact: true }).click();
	await expect(bar).toHaveAttribute('data-progress-state', 'indeterminate-paused');
	await expect(xaml).toContainText('ShowPaused="True" ShowError="False"');
	await page.getByText('Error', { exact: true }).click();
	await expect(bar).toHaveAttribute('data-progress-state', 'indeterminate-error');
	await expect(xaml).toContainText('ShowPaused="False" ShowError="True"');
	await page.getByText('Running', { exact: true }).click();
	await expect(bar).toHaveAttribute('data-progress-state', 'indeterminate');
	await expect(xaml).toContainText('ShowPaused="False" ShowError="False"');
});

test('the NumberBox sets the determinate bar and its XAML', async ({ page }) => {
	const bar = bars(page).nth(1);
	const xaml = await code(page, 1);
	await expect(bar).toHaveAttribute('aria-valuenow', '0');
	await expect(xaml).toContainText('Value="0"');
	await box(page).fill('45');
	await box(page).press('Enter');
	await expect(bar).toHaveAttribute('aria-valuenow', '45');
	await expect(xaml).toContainText('Value="45"');
});

test('an emptied NumberBox goes back to 0, and the bar with it', async ({ page }) => {
	const bar = bars(page).nth(1);
	const xaml = await code(page, 1);
	await box(page).fill('45');
	await box(page).press('Enter');
	await expect(bar).toHaveAttribute('aria-valuenow', '45');
	// The box writes Enter's commit back a frame later and puts back the caret it recorded at the
	// key, collapsed at the end (Zag's `syncInputElement`, `number-input.machine.mjs:414-421`).
	// A select-all inside that frame is undone, and `fill('')` then deletes nothing: 5 of 80
	// repetitions failed so. Two frames let the write land first.
	await page.evaluate(
		() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
	);
	// Committed by leaving the box, as upstream's NumberBox raises ValueChanged on commit. Not by
	// Enter: an Enter pressed while the page's write of 0 is still landing put the previous value
	// back, once in a full run on the Windows lane and never alone. That race is NumberBox's.
	await box(page).fill('');
	await box(page).press('Tab');
	await expect(box(page)).toHaveValue('0');
	await expect(bar).toHaveAttribute('aria-valuenow', '0');
	await expect(xaml).toContainText('Value="0"');
});
