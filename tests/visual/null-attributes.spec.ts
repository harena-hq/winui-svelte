/**
 * An HTML attribute's prop takes `null` as an element does, as absent: ADR 0009's 2026-10-31
 * amendment. The harness compiling is what `svelte-check` proves; this holds what `null` then does.
 */
import { expect, test } from './fixtures';

test('null leaves each control enabled and its placeholder unwritten', async ({ page }) => {
	await page.goto('/dev/null-attributes');
	await expect(page.getByRole('button', { name: 'Button' })).toBeEnabled();
	const box = page.getByRole('textbox').first();
	await expect(box).toBeEditable();
	await expect(box).not.toHaveAttribute('placeholder');
	await expect(page.getByRole('switch').first()).toBeEnabled();
	await expect(page.getByRole('button', { name: 'Spread' })).toBeEnabled();
	await expect(page.locator('.trigger')).toBeEnabled();
	await expect(page.getByRole('button', { name: 'Expander' })).toBeEnabled();
});

test('null state reads as off, and a class array keeps its names', async ({ page }) => {
	await page.goto('/dev/null-attributes');
	const toggle = page.getByRole('button', { name: 'Toggle' });
	await expect(toggle).toHaveAttribute('aria-pressed', 'false');
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('checkbox')).not.toBeChecked();
	const classes = page.getByRole('button', { name: 'Classes' });
	await expect(classes).toHaveClass(/\bmine\b/);
	await expect(classes).not.toHaveClass(/null/);
});
