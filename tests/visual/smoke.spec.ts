import { expect, test } from './fixtures';

// The harness itself, under test: the Gallery builds, serves, and reaches the browser —
// which, for a tracked baseline, is a browser on Windows.
test('the Gallery serves a page', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
