import { CDP_ENDPOINT, expect, test } from './fixtures';

// The harness itself, under test: the Gallery builds, serves, and reaches the browser —
// which, for a tracked baseline, is a browser on Windows.
test('the Gallery serves a page', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

// There is almost nothing on this page yet, and that is the point: it pins the pipeline
// end to end — build, serve, render on Windows, compare — before there is any design to
// confuse a failure with.
//
// Skipped anywhere else, and not as a convenience. Only the Windows baselines are tracked,
// so a local run has none to compare against and would fail on every clean clone for a
// reason no one can fix. Writing a local baseline instead would be worse: it passes, and
// what it pins is a substitute face.
test('the Gallery page is unchanged', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await page.goto('/');
	await expect(page).toHaveScreenshot('gallery-home.png', { fullPage: true });
});
