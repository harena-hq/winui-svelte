import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

type Page = import('@playwright/test').Page;

/**
 * The single-line half of WD-100, closed: a text control sized by its content is as wide as its
 * text, or its placeholder while it has none, over `TextControlThemeMinWidth`.
 *
 * Upstream's text view takes the text's width from RichEdit, unwrapped, and the placeholder
 * `TextBlock` shares its grid cell (TextBox_themeresources.xaml:337, :338). On the reference's
 * Gallery TextBox page the empty box is 64, and typing grows the box with its text. What sits
 * around the text — border, padding, buttons — is the same whatever the text is, so the
 * assertions below compare two boxes' widths with the two texts' widths rather than restating
 * that frame; the glyphs themselves are narrower here than RichEdit's, which they cannot see.
 */

const ROUTE = '/dev/text-control-widths';

/** The control's box, and the width its font gives a string. */
async function measure(page: Page, id: string, text: string) {
	const root = page.getByTestId(id);
	return root.evaluate((el, s) => {
		const input = el.querySelector('input') as HTMLInputElement;
		const context = document.createElement('canvas').getContext('2d')!;
		context.font = getComputedStyle(input).font;
		return {
			box: (el.querySelector('.box') as HTMLElement).getBoundingClientRect().width,
			text: context.measureText(s).width
		};
	}, text);
}

test('Text control widths in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'TextControlWidths', ROUTE);
});

test('an empty box with no placeholder sits at the minimum width', async ({ page }) => {
	await page.goto(ROUTE);
	const empty = await measure(page, 'empty', '');
	expect(empty.box).toBe(64);
});

test('a box is as wide as its placeholder, then as its text', async ({ page }) => {
	await page.goto(ROUTE);
	const placeholder = 'Search controls and samples...';
	const typed = 'Hello world, this is typed';
	const a = await measure(page, 'placeholder', placeholder);
	const b = await measure(page, 'typed', typed);
	expect(Math.abs(a.box - b.box - (a.text - b.text))).toBeLessThan(1);

	// The same box follows its own text as it changes, and goes back to its placeholder.
	// Measured unfocused: focused with text, the delete button's column joins the box, as
	// upstream's 30-pixel `DeleteButton` does (TextBox_themeresources.xaml:339). The reference
	// grew by 32, the other two being RichEdit's requested extent (WD-100).
	const blur = () => page.getByRole('heading', { name: 'Text control widths' }).click();
	const input = page.getByTestId('typed').locator('input');
	await input.fill(`${typed}, and then some more`);
	await blur();
	const c = await measure(page, 'typed', `${typed}, and then some more`);
	expect(Math.abs(c.box - b.box - (c.text - b.text))).toBeLessThan(1);
	await page.getByTestId('placeholder').locator('input').fill(typed);
	await blur();
	const d = await measure(page, 'placeholder', typed);
	expect(Math.abs(d.box - b.box)).toBeLessThan(1);
});

test('a header wider than the box widens the box with it', async ({ page }) => {
	await page.goto(ROUTE);
	const widths = await page.getByTestId('header').evaluate((el) => {
		const header = el.querySelector('.header') as HTMLElement;
		const context = document.createElement('canvas').getContext('2d')!;
		context.font = getComputedStyle(header).font;
		return {
			box: (el.querySelector('.box') as HTMLElement).getBoundingClientRect().width,
			header: context.measureText(header.textContent!.trim()).width
		};
	});
	expect(Math.abs(widths.box - widths.header)).toBeLessThan(1);
});

test('PasswordBox and AutoSuggestBox measure as TextBox does', async ({ page }) => {
	await page.goto(ROUTE);
	const short = await measure(page, 'query', 'Search');
	const long = await measure(page, 'long-query', 'Search controls and samples...');
	expect(Math.abs(long.box - short.box - (long.text - short.text))).toBeLessThan(1);

	const password = await measure(page, 'password', 'Enter your password');
	const placeholder = await measure(page, 'placeholder', 'Search controls and samples...');
	expect(
		Math.abs(placeholder.box - password.box - (placeholder.text - password.text))
	).toBeLessThan(1);
});

// Upstream caps the desired width at the width available (TextBoxView.cpp:1692), and the text
// scrolls inside the box rather than past it.
test('text wider than its row stops at the row', async ({ page }) => {
	await page.goto(ROUTE);
	const [row, box] = await page
		.getByTestId('narrow')
		.evaluate((el) => [
			(el.parentElement as HTMLElement).getBoundingClientRect().width,
			(el.querySelector('.box') as HTMLElement).getBoundingClientRect().width
		]);
	expect(box).toBe(row);
});

// The floor is the control's, as upstream's `MinWidth` is (TextBox_themeresources.xaml:193): in
// a row narrower than 64 the control overflows the row whole, rather than its box overflowing it.
test('a row narrower than the floor leaves the control at the floor', async ({ page }) => {
	await page.goto(ROUTE);
	const [root, box] = await page
		.getByTestId('floor')
		.evaluate((el) => [
			el.getBoundingClientRect().width,
			(el.querySelector('.box') as HTMLElement).getBoundingClientRect().width
		]);
	expect(box).toBe(64);
	expect(root).toBe(64);
});

// A guard rather than WD-100's own check: the change must leave a stretched box stretched.
test('a box its container stretches is as wide as the container', async ({ page }) => {
	await page.goto('/dev/text-box');
	const box = page.locator('.box').first();
	expect((await box.boundingBox())!.width).toBe(580);
});
