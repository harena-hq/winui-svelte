import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * A determinate ring sweeps up and snaps down (ProgressRing.cpp:305-325). A rise plays the
 * composition from the old value's progress to the new one over that share of its 2s, linearly
 * in time; a fall sets the new progress at once. ProgressRing.svelte cites where each comes
 * from. The clock is Playwright's, paused once the page is up, so the sweep is stepped through
 * frame by frame rather than slept through. Frames land every 16ms and a sweep's time starts at
 * its first frame, so after `runFor(n)` a sweep is between n - 32 and n milliseconds in.
 *
 * The expected arc lengths are the trim keyframes' (ProgressRingDeterminate.cpp:269-278): equal
 * to the progress up to 0.75, and 0.75 + (p - 0.75) / (0.98333 - 0.75) * (0.96667 - 0.75)
 * above it, so progress 0.9 draws 0.8893.
 */

/** The first number of the sweep ring's arc dash array: the arc's length as a share of 1. */
function arc(page: Page) {
	return page
		.locator('[data-testid="sweep"] .arc')
		.evaluate((element) => parseFloat((element as SVGElement).style.strokeDasharray));
}

async function near(page: Page, expected: number, tolerance: number) {
	expect(Math.abs((await arc(page)) - expected)).toBeLessThanOrEqual(tolerance);
}

function press(page: Page, name: string) {
	return page.getByRole('button', { name }).click();
}

async function open(page: Page) {
	await page.clock.install({ time: Date.now() });
	await page.goto('/dev/progress-ring');
	const now = await page.evaluate(() => Date.now());
	await page.clock.pauseAt(now + 10_000);
}

test('a mount draws its value at once', async ({ page }) => {
	await open(page);
	await near(page, 0.25, 0.001);
	// Remounted on the paused clock. A mount that swept from `m_oldValue`'s 0 would draw its
	// first frame's 0.0001 here and stay there, since no frame runs.
	await press(page, 'Remount');
	await near(page, 0.25, 0.001);
});

test('a rise sweeps over its share of 2s and a fall snaps', async ({ page }) => {
	await open(page);
	// 25 to 75 is progress 0.25 to 0.75, so 1000ms.
	await press(page, 'Raise to 75');
	await near(page, 0.25, 0.01);
	await page.clock.runFor(500);
	await near(page, 0.5, 0.02);
	await page.clock.runFor(600);
	await near(page, 0.75, 0.001);

	// Progress 0.1 lies between the keyframes (0.00833, 0.0001) and (0.25, 0.25), so its
	// trim is 0.0001 + (0.1 - 0.00833) / (0.25 - 0.00833) * (0.25 - 0.0001) = 0.0949.
	await press(page, 'Lower to 10');
	await near(page, 0.0949, 0.001);
});

test('a rise during a sweep starts from the old value', async ({ page }) => {
	await open(page);
	await press(page, 'Raise to 75');
	await page.clock.runFor(500);
	await near(page, 0.5, 0.02);
	// The old value is 75 although the arc is near 0.5, so the arc jumps ahead to 0.75 and
	// sweeps to 0.9 over 300ms.
	await press(page, 'Determinate at 90');
	await near(page, 0.75, 0.001);
	await page.clock.runFor(150);
	const mid = await arc(page);
	expect(mid).toBeGreaterThan(0.8);
	expect(mid).toBeLessThan(0.825);
	await page.clock.runFor(400);
	await near(page, 0.8893, 0.001);
});

test('a value raised while indeterminate sweeps from the last determinate one', async ({
	page
}) => {
	await open(page);
	await press(page, 'Toggle indeterminate');
	await press(page, 'Raise to 75');
	await press(page, 'Toggle indeterminate');
	await near(page, 0.25, 0.001);
	await page.clock.runFor(500);
	await near(page, 0.5, 0.02);
	await page.clock.runFor(600);
	await near(page, 0.75, 0.001);
});

test('turning determinate and raising in one handler sweeps', async ({ page }) => {
	await open(page);
	await press(page, 'Toggle indeterminate');
	// 25 to 90 is progress 0.25 to 0.9, so 1300ms; 650ms in is progress 0.575.
	await press(page, 'Determinate at 90');
	await near(page, 0.25, 0.001);
	await page.clock.runFor(650);
	await near(page, 0.575, 0.02);
	await page.clock.runFor(700);
	await near(page, 0.8893, 0.001);
});

test('reactivating during a sweep draws the value at once', async ({ page }) => {
	await open(page);
	await press(page, 'Raise to 75');
	await page.clock.runFor(500);
	await press(page, 'Toggle active');
	await press(page, 'Toggle active');
	await near(page, 0.75, 0.001);
});
