import { expect, test } from './fixtures';

type Page = import('@playwright/test').Page;

/**
 * The library's `focusVisual` attachment, for an element a script focuses. WinUI draws a
 * programmatic focus as a keyboard focus only when the last input device was the keyboard,
 * and as a pointer focus, with no visual, otherwise, including before any input
 * (`CFocusManager::CoerceFocusState`, focusmgr.cpp:3195; the device starts as `None`,
 * InputDeviceCache.cpp:28, and a window takes Keyboard only when the system shows keyboard
 * cues, XamlIslandRoot.cpp:1183-1197, which a page cannot read). Chromium's `:focus-visible`
 * grants a scripted focus the visual when no input has come yet. The Slider's thumb, a
 * `<span>` bits-ui focuses from script, carries the attachment.
 */

const ROUTE = '/dev/slider';

const thumb = (page: Page) => page.locator('.thumb').first();
const drawn = (page: Page) => thumb(page).evaluate((el) => el.hasAttribute('data-focus-visual'));

async function focusFromScript(page: Page) {
	await thumb(page).evaluate((el: HTMLElement) => el.blur());
	await thumb(page).evaluate((el: HTMLElement) => el.focus());
	await expect(thumb(page)).toBeFocused();
}

test('a scripted focus before any input draws no visual', async ({ page }) => {
	await page.goto(ROUTE);
	await focusFromScript(page);
	expect(await drawn(page)).toBe(false);
});

test('after a key it does, and after a press it does not again', async ({ page }) => {
	await page.goto(ROUTE);
	await page.keyboard.press('Shift');
	await focusFromScript(page);
	expect(await drawn(page), 'after a key').toBe(true);
	await page.mouse.click(1, 1);
	await focusFromScript(page);
	expect(await drawn(page), 'after a press').toBe(false);
});

test('a key that opens a flyout counts, though nothing carried the attachment before it', async ({
	page
}) => {
	// The Gallery's CalendarDatePicker page draws no element with the attachment until its
	// flyout opens, and the key that opens it comes first.
	await page.goto('/dateandtime/calendardatepicker');
	await expect(page.locator('.calendar-view, [role="slider"]')).toHaveCount(0);
	const box = page.locator('.calendar-date-picker .box').first();
	await box.evaluate((el: HTMLElement) => el.focus());
	await page.keyboard.press('Enter');
	const focused = page.locator(':focus');
	await expect(page.locator('.calendar-view')).toHaveCount(1);
	await expect(focused).toHaveClass(/\b(title|day)\b/);
	expect(await focused.evaluate((el) => el.hasAttribute('data-focus-visual'))).toBe(true);
});
