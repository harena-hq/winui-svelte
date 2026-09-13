import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('RatingControl in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'RatingControl', '/dev/rating-control');
});

test('the resting glyph is half the size the resource names', async ({ page }) => {
	await page.goto('/dev/rating-control');
	const sizes = await page.getByTestId('unset').evaluate((control) => {
		const glyph = control.querySelector<HTMLElement>('.glyph')!;
		return {
			glyph: getComputedStyle(glyph).fontSize,
			resource: getComputedStyle(control)
				.getPropertyValue('--winui-RatingControlFontSizeForRendering')
				.trim()
		};
	});
	expect(sizes).toEqual({ glyph: '16px', resource: '32px' });
});

test('a fractional value clips one star and no other', async ({ page }) => {
	await page.goto('/dev/rating-control');
	// RatingControl.cpp:334-363 gives three full stars, then half of the fourth, then zero.
	const clips = await page
		.getByTestId('fractional')
		.locator('.foreground .glyph')
		.evaluateAll((glyphs) => glyphs.map((glyph) => getComputedStyle(glyph).clipPath));
	expect(clips.filter((clip) => /(?:^|\s)0%/.test(clip)).length).toBe(3);
	expect(clips.filter((clip) => clip.includes('50%')).length).toBe(1);
	expect(clips.filter((clip) => clip.includes('100%')).length).toBe(1);
});

test('an unset control shows no set star', async ({ page }) => {
	await page.goto('/dev/rating-control');
	const clips = await page
		.getByTestId('unset')
		.locator('.foreground .glyph')
		.evaluateAll((glyphs) => glyphs.map((glyph) => getComputedStyle(glyph).clipPath));
	expect(clips.every((clip) => clip.includes('100%'))).toBe(true);
});

test('clicking a star sets the value, and clicking it again clears it', async ({ page }) => {
	await page.goto('/dev/rating-control');
	// A pointer click on the current value clears upstream, so start unset to exercise the
	// set-then-clear sequence rather than contradicting SetRatingTo's pointer branch.
	// Clicks go to the background row, which is the only layer the pin lets the pointer reach
	// (RatingControl.xaml:56 against :67 and :70). Clicking the foreground is what a user cannot
	// do, and a test that did it would pass on a control nobody can raise.
	const set = page.getByTestId('unset');
	await set.locator('.background .glyph').nth(2).click();
	await expect(set).toHaveAttribute('aria-valuenow', '3');
	await set.locator('.background .glyph').nth(2).click();
	await expect(set).toHaveAttribute('aria-valuenow', '0');
	const noClear = page.getByTestId('no-clear');
	await noClear.locator('.background .glyph').first().click();
	await noClear.locator('.background .glyph').first().click();
	await expect(noClear).toHaveAttribute('aria-valuenow', '1');
});

test('the keyboard moves by one, and Home and End go to the ends', async ({ page }) => {
	await page.goto('/dev/rating-control');
	const set = page.getByTestId('set');
	await set.focus();
	await page.keyboard.press('ArrowRight');
	await expect(set).toHaveAttribute('aria-valuenow', '4');
	await page.keyboard.press('ArrowLeft');
	await expect(set).toHaveAttribute('aria-valuenow', '3');
	await page.keyboard.press('End');
	await expect(set).toHaveAttribute('aria-valuenow', '5');
	await page.keyboard.press('Home');
	await expect(set).toHaveAttribute('aria-valuenow', '0');
});

test('a read-only control takes no click and no focus', async ({ page }) => {
	await page.goto('/dev/rating-control');
	const readOnly = page.getByTestId('read-only');
	await expect(readOnly).not.toHaveAttribute('tabindex');
	await readOnly.locator('.background .glyph').nth(3).click();
	await expect(readOnly).toHaveAttribute('aria-valuenow', '3');
});

test('read-only keeps the Set colour and only disabled loses it', async ({ page }) => {
	await page.goto('/dev/rating-control');
	// The two are separate members upstream and the first draft of this component collapsed them,
	// painting a read-only control in the disabled brush. RatingControl.cpp:329-333 reaches the
	// Disabled visual state from `!IsEnabled()` alone; `IsReadOnly` appears only as a guard on the
	// interaction paths. So these three colours have to be two.
	const colourOf = (testId: string) =>
		page
			.getByTestId(testId)
			.locator('.foreground .glyph')
			.first()
			.evaluate((glyph) => getComputedStyle(glyph).color);

	const [set, readOnly, disabled] = await Promise.all([
		colourOf('set'),
		colourOf('read-only'),
		colourOf('disabled')
	]);
	expect(readOnly).toBe(set);
	expect(disabled).not.toBe(set);
	await expect(page.getByTestId('disabled')).not.toHaveAttribute('tabindex');
});

test('an empty star can be clicked, which is the only way a rating goes up', async ({ page }) => {
	await page.goto('/dev/rating-control');
	// The first draft could not do this. The foreground row covered the strip and a star clipped
	// to nothing still swallowed the click, so a rating could be lowered and never raised.
	const control = page.getByTestId('set');
	await control.locator('.background .glyph').nth(4).click();
	await expect(control).toHaveAttribute('aria-valuenow', '5');
});
