/**
 * `variant="rightAlignedCompact"`, the Community Toolkit's `RightAlignedCompactToggleSwitchStyle`
 * (SettingsCard.xaml:483-490). On the reference guest the Gallery's Settings page draws the Sound
 * row's switch as a control 36 tall with its "Off" 12 before a 40 by 20 track at its right edge,
 * and its focus visual 86 by 42, so a control 72 wide.
 */
import { CDP_ENDPOINT, expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const row = (page: Page, name: string) => page.locator(`[data-row=${name}]`);

async function boxes(page: Page, name: string) {
	const root = row(page, name).locator('.root');
	return {
		root: (await root.boundingBox())!,
		track: (await root.locator('.track').boundingBox())!,
		text: (await root.locator('.content').boundingBox())!
	};
}

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/toggle-switch-compact');
});

test('the text comes before the track, 12 from it, and the track ends the control', async ({
	page
}) => {
	const { root, track, text } = await boxes(page, 'off');
	expect(root.height).toBe(36);
	expect(track.width).toBe(40);
	expect(track.height).toBe(20);
	expect(track.x + track.width).toBe(root.x + root.width);
	expect(track.x - (text.x + text.width)).toBe(12);
	expect(text.x).toBe(root.x);
	// Centred in the height, as on the guest: 339 to 358 in a control from 331 to 366.
	expect(track.y - root.y).toBe(8);
});

test('the shorter text meets the gap', async ({ page }) => {
	// On and Off are the same width under the local lane's Arial-metric fallback.
	test.skip(!CDP_ENDPOINT, 'the two texts differ in width only under Segoe');
	const { text } = await boxes(page, 'on');
	const shown = (await row(page, 'on').locator('.on-content').boundingBox())!;
	expect(shown.width).toBeLessThan(text.width);
	expect(shown.x + shown.width).toBe(text.x + text.width);
});

test('the knob rests 3 from the ends of the track, as on the guest', async ({ page }) => {
	const off = await boxes(page, 'off');
	const offKnob = (await row(page, 'off').locator('.knob-off').boundingBox())!;
	expect(offKnob.x - off.track.x).toBe(3);
	const on = await boxes(page, 'on');
	const onKnob = (await row(page, 'on').locator('.knob-on').boundingBox())!;
	expect(on.track.x + on.track.width - (onKnob.x + onKnob.width)).toBe(3);
});

test('a pointer above the track is outside the control, as on the guest', async ({ page }) => {
	const { root, track } = await boxes(page, 'off');
	const hovered = () =>
		row(page, 'off')
			.locator('.root')
			.evaluate((n) => n.matches(':hover'));
	await page.mouse.move(track.x + 20, root.y + 2);
	expect(await hovered()).toBe(false);
	await page.mouse.move(track.x + 20, track.y + 10);
	expect(await hovered()).toBe(true);
});

test('the knob grows from its end of the track, hovered and pressed', async ({ page }) => {
	const { track } = await boxes(page, 'off');
	const knob = row(page, 'off').locator('.knob-off');
	const box = async () => (await knob.boundingBox())!;
	await page.mouse.move(track.x + 20, track.y + 10);
	await expect.poll(async () => (await box()).width).toBe(14);
	expect((await box()).x - track.x).toBe(3);
	await page.mouse.down();
	await expect.poll(async () => (await box()).width).toBe(17);
	expect((await box()).x - track.x).toBe(3);
	await page.mouse.up();
});

test('a disabled one takes neither the hover nor the press', async ({ page }) => {
	const { track } = await boxes(page, 'disabled');
	const knob = row(page, 'disabled').locator('.knob-off');
	await page.mouse.click(track.x + 20, track.y + 10);
	expect((await knob.boundingBox())!.width).toBe(12);
	await expect(row(page, 'disabled').getByRole('switch')).not.toBeChecked();
});

test('a wide header leaves the track at the right edge', async ({ page }) => {
	const { root, track } = await boxes(page, 'long-header');
	expect(track.x + track.width).toBe(root.x + root.width);
});

test('a header lies over the body at the left, and the control stays 36 tall', async ({ page }) => {
	const { root, track } = await boxes(page, 'header');
	const header = (await row(page, 'header').locator('.header').boundingBox())!;
	expect(root.height).toBe(36);
	expect(header.x).toBe(root.x);
	expect(header.y).toBe(root.y);
	expect(track.y - root.y).toBe(8);
});

test('with no text it is the track and the gap before it', async ({ page }) => {
	const { root, track } = await boxes(page, 'empty');
	expect(root.width).toBe(52);
	expect(track.x + track.width).toBe(root.x + root.width);
});

test('it still toggles, by the track and by the text', async ({ page }) => {
	const input = row(page, 'off').getByRole('switch');
	await row(page, 'off').locator('.track').click();
	await expect(input).toBeChecked();
	await row(page, 'off').locator('.content').click();
	await expect(input).not.toBeChecked();
});

test('the focus visual is 7 and 3 outside the control', async ({ page }) => {
	const root = row(page, 'off').locator('.root');
	const size = (await root.boundingBox())!;
	const visual = await root.evaluate((node) => {
		node.querySelector('input')!.focus({ focusVisible: true });
		const before = getComputedStyle(node, '::before');
		return [parseFloat(before.height), parseFloat(before.width)];
	});
	expect(visual[0]).toBe(42);
	expect(visual[1]).toBeCloseTo(size.width + 14, 1);
});

test('the width is the guest’s, under Segoe', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'the guest measured Segoe, which this browser does not have');
	const { root } = await boxes(page, 'off');
	// XAML rounds a text's width up to the pixel, so "Off" takes 20 there and 19.33 here.
	expect(root.width).toBeGreaterThan(71);
	expect(root.width).toBeLessThanOrEqual(72);
});
