import { expect, test } from '@playwright/test';

// The harness itself, under test: the Gallery builds, serves, and reaches the browser.
// Component coverage arrives with the components; C4 fails the build if a component
// ever ships without its three-theme entry here.
test('the Gallery serves a page', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
