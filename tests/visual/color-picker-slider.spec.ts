import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('ColorPickerSlider in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ColorPickerSlider', '/dev/color-picker-slider');
});

test('neither track bar is painted', async ({ page }) => {
	await page.goto('/dev/color-picker-slider');
	const control = page.getByTestId('default');
	// ColorPicker.xaml:504/:505 keep both rectangles in the template at opacity zero.
	const opacity = await control.evaluate((root) => ({
		track: getComputedStyle(root.querySelector<HTMLElement>('.track')!).opacity,
		fill: getComputedStyle(root.querySelector<HTMLElement>('.fill')!).opacity
	}));
	expect(opacity).toEqual({ track: '0', fill: '0' });
});

test("the thumb's visible circle is its layout box", async ({ page }) => {
	await page.goto('/dev/color-picker-slider');
	const geometry = await page.getByTestId('default').evaluate((root) => {
		const thumb = root.querySelector<HTMLElement>('.thumb')!;
		const thumbBox = thumb.getBoundingClientRect();
		const innerBox = root.querySelector<HTMLElement>('.inner')!.getBoundingClientRect();
		return {
			thumb: { width: thumbBox.width, height: thumbBox.height },
			inner: { width: innerBox.width, height: innerBox.height },
			backgroundColor: getComputedStyle(thumb).backgroundColor
		};
	});
	expect(geometry.thumb).toEqual({ width: 18, height: 18 });
	expect(geometry.inner).toEqual({ width: 10, height: 10 });
	expect(geometry.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('the value reaches both ends of the track', async ({ page }) => {
	await page.goto('/dev/color-picker-slider');
	const control = page.getByTestId('default');
	// The harness row is what gives the track a width, for the reason its own comment gives;
	// the offsets below are half the 18px thumb, so the whole thumb stays inside the track at
	// both ends rather than hanging off it.
	const thumb = control.locator('.thumb');
	await thumb.focus();
	await page.keyboard.press('Home');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('0');
	const atMin = await control.evaluate((root) => {
		const container = root.querySelector<HTMLElement>('.container')!.getBoundingClientRect();
		const thumb = root.querySelector<HTMLElement>('.thumb')!.getBoundingClientRect();
		return thumb.left + thumb.width / 2 - (container.left + 9);
	});

	await page.keyboard.press('End');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('100');
	const atMax = await control.evaluate((root) => {
		const container = root.querySelector<HTMLElement>('.container')!.getBoundingClientRect();
		const thumb = root.querySelector<HTMLElement>('.thumb')!.getBoundingClientRect();
		return thumb.left + thumb.width / 2 - (container.right - 9);
	});

	expect(Math.abs(atMin)).toBeLessThanOrEqual(1);
	expect(Math.abs(atMax)).toBeLessThanOrEqual(1);
});

test('an arrow steps by one and stops at the bound', async ({ page }) => {
	await page.goto('/dev/color-picker-slider');
	const thumb = page.getByTestId('default').locator('.thumb');
	await thumb.focus();
	await page.keyboard.press('ArrowRight');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('51');
	await page.keyboard.press('ArrowLeft');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('50');
	await page.keyboard.press('ArrowLeft');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('49');
	await page.keyboard.press('End');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('100');
	await page.keyboard.press('ArrowRight');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('100');
});

test('ArrowDown lowers and ArrowUp raises', async ({ page }) => {
	await page.goto('/dev/color-picker-slider');
	const thumb = page.getByTestId('default').locator('.thumb');
	await thumb.focus();
	// ColorPickerSlider.cpp:100 derives inversion from RTL flow, not IsDirectionReversed;
	// this specimen deliberately leaves isDirectionReversed unset.
	await page.keyboard.press('ArrowDown');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('49');
	await page.keyboard.press('ArrowUp');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('50');
});

test("Ctrl+Arrow takes the channel's major step", async ({ page }) => {
	await page.goto('/dev/color-picker-slider');
	const hue = page.getByTestId('hue').locator('.thumb');
	await hue.focus();
	await page.keyboard.press('Control+ArrowRight');
	await expect.poll(() => hue.getAttribute('aria-valuenow')).toBe('210');
	await page.keyboard.press('Control+ArrowLeft');
	await expect.poll(() => hue.getAttribute('aria-valuenow')).toBe('180');
	await page.keyboard.press('Control+ArrowLeft');
	await expect.poll(() => hue.getAttribute('aria-valuenow')).toBe('150');

	const value = page.getByTestId('default').locator('.thumb');
	await value.focus();
	await page.keyboard.press('Control+ArrowRight');
	await expect.poll(() => value.getAttribute('aria-valuenow')).toBe('60');
	await page.keyboard.press('Control+ArrowLeft');
	await expect.poll(() => value.getAttribute('aria-valuenow')).toBe('50');
	await page.keyboard.press('Control+ArrowLeft');
	await expect.poll(() => value.getAttribute('aria-valuenow')).toBe('40');
});

test('Ctrl+Arrow on alpha snaps to the next multiple of ten', async ({ page }) => {
	await page.goto('/dev/color-picker-slider');
	const thumb = page.getByTestId('alpha').locator('.thumb');
	await thumb.focus();
	// 55 is not a multiple of ten, so ColorHelpers.cpp:329-335's floor/ceil shows in both
	// directions: upward it clears 55 to 60.
	await page.keyboard.press('Control+ArrowRight');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('60');
	// From a multiple the same arithmetic moves a whole ten rather than snapping in place.
	await page.keyboard.press('Control+ArrowLeft');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('50');
	await page.keyboard.press('Control+ArrowLeft');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('40');

	// The downward snap from a non-multiple needs 55 back; reloading restores the specimen's
	// own value, and is one step where walking back from 40 would be fifteen.
	await page.reload();
	await thumb.focus();
	await page.keyboard.press('Control+ArrowLeft');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('50');
});

test('the pointer and the pressed state change the inner fill', async ({ page }) => {
	await page.goto('/dev/color-picker-slider');
	const control = page.getByTestId('default');
	const inner = control.locator('.inner');
	const resting = await inner.evaluate((element) => getComputedStyle(element).backgroundColor);
	await control.locator('.thumb').hover();
	await expect
		.poll(() => inner.evaluate((element) => getComputedStyle(element).backgroundColor))
		.not.toBe(resting);
	const disabled = await page
		.getByTestId('disabled')
		.locator('.inner')
		.evaluate((element) => getComputedStyle(element).backgroundColor);
	expect(disabled).not.toBe(resting);
});

test('a disabled slider dims its header and ignores the keyboard', async ({ page }) => {
	await page.goto('/dev/color-picker-slider');
	const enabledHeader = await page
		.getByTestId('with-header')
		.locator('.header')
		.evaluate((element) => getComputedStyle(element).color);
	const disabledControl = page.getByTestId('disabled');
	const disabledHeader = await disabledControl
		.locator('.header')
		.evaluate((element) => getComputedStyle(element).color);
	expect(disabledHeader).not.toBe(enabledHeader);

	const thumb = disabledControl.locator('.thumb');
	await thumb.focus();
	await page.keyboard.press('ArrowRight');
	await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('40');
});
