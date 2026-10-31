/**
 * A dialog described by part of its content: the rest props carry `aria-describedby` to the dialog
 * element, past the one the primitive sets, and the title still names it.
 */
import { expect, test } from './fixtures';

test('aria-describedby describes the dialog, and the title names it', async ({ page }) => {
	await page.goto('/dev/content-dialog-describe');
	const dialog = page.getByRole('dialog');
	await expect(dialog).toHaveAccessibleName('Empty the cart?');
	await expect(dialog).toHaveAccessibleDescription('All items will be removed.');
});
