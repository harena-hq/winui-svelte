import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';
import type { Page } from '@playwright/test';

test('ItemPage in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ItemPage', '/dev/item-page');
});

test('the source flyout spaces its label and its links as the pin does', async ({ page }) => {
	await page.goto('/dev/item-page');
	await page.getByRole('button', { name: 'Source code' }).first().click();
	// Nothing photographs this popup. `ItemPage`'s baseline is taken with the flyout shut, so
	// every measurement inside it was unguarded until this test — which is how the four pixels
	// below came to be eight.
	//
	// `ControlSourcePanel` (PageHeader.xaml:147) and its sample-page sibling (:179) carry no
	// `Spacing`. The four pixels between a section's label row and its link, and between one
	// link and the next, are each link's own `Margin="-12,4,-12,0"` (:169, :204, :212). A `gap`
	// beside that margin counts them twice.
	const gaps = await page.evaluate(() => {
		const list = document.querySelector('.source-list')!;
		const top = (selector: string, root: Element) =>
			root.querySelector(selector)!.getBoundingClientRect().top;
		const bottom = (selector: string, root: Element) =>
			root.querySelector(selector)!.getBoundingClientRect().bottom;
		const sections = [...list.querySelectorAll(':scope > section')];
		const links = [...sections[1].querySelectorAll('.source-link')].map((element) =>
			element.getBoundingClientRect()
		);
		const separator = list.querySelector('.separator')!.getBoundingClientRect();
		return {
			labelToLink: sections.map((section) =>
				Math.round(top('.source-link', section) - bottom('.source-label', section))
			),
			linkToLink: Math.round(links[1].top - links[0].bottom),
			linkToSeparator: Math.round(separator.top - sections[0].getBoundingClientRect().bottom),
			separatorToNextSection: Math.round(
				sections[1].getBoundingClientRect().top - separator.bottom
			),
			separatorBleed: Math.round((separator.width - list.getBoundingClientRect().width) / 2)
		};
	});
	expect(gaps.labelToLink).toEqual([4, 4]);
	expect(gaps.linkToLink).toBe(4);
	// The rule sits **below** the link's box, never through it. `ControlSourcePanel`'s
	// `Margin="0,0,0,4"` (:147) is the whole gap above it and the sample panel's
	// `Margin="0,8,0,0"` (:179) the whole gap below; `MenuFlyoutSeparator Margin="-12"` (:177)
	// is applied horizontally only, which is what the twelve on each side below is. Applying it
	// vertically as well drew the rule four pixels inside the link, across its pointer-over
	// fill — measured against a capture of the shipped Gallery, where it is clear of the fill.
	expect(gaps.linkToSeparator).toBe(4);
	expect(gaps.separatorToNextSection).toBe(8);
	expect(gaps.separatorBleed).toBe(12);
});

// ItemPage.xaml:53-61 binds the description to a TextBlock's `Text`, where a line feed is a line
// break. AppBarButton's record has three; without them its four sentences run on as one.
test('a line feed in the description starts a new line', async ({ page }) => {
	await page.goto('/menusandtoolbars/appbarbutton');
	const rows = await page.locator('[data-item-page] .description').evaluate((element) => {
		const text = element.firstChild as Text;
		const top = (offset: number) => {
			const range = document.createRange();
			range.setStart(text, offset);
			range.setEnd(text, offset + 1);
			return range.getBoundingClientRect().top;
		};
		const value = text.data;
		const rows: [number, number][] = [];
		for (let i = value.indexOf('\n'); i !== -1; i = value.indexOf('\n', i + 1)) {
			rows.push([top(i - 1), top(i + 1)]);
		}
		return rows;
	});
	expect(rows).toHaveLength(3);
	for (const [before, after] of rows) expect(after).toBeGreaterThan(before);
});

// `this.Focus(FocusState.Programmatic)` once the page is loaded (ItemPage.xaml.cs:44): the page
// is no tab stop, so the focus goes to the header's first button. WinUI draws a programmatic
// focus's visual after a key and not after a pointer or before any input
// (`CFocusManager::CoerceFocusState`, focusmgr.cpp:3195); the reference showed the first two on
// 2026-10-24.
const row = (label: string) => `[role="treeitem"]:has(> .content-presenter:text-is("${label}"))`;
const api = (page: Page) =>
	page.locator('[data-item-page]').getByRole('button', { name: 'API details' });
const focusVisible = (page: Page) =>
	api(page).evaluate((button) => button.matches(':focus-visible'));

test('a page opened from the pane focuses its first button, drawn after a key only', async ({
	page
}) => {
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/basicinput/checkbox');
	// On the first load too, drawn as a pointer's focus: there has been no input, and upstream's
	// rule draws one only after a key. Chromium's own choice would draw it.
	await expect(api(page)).toBeFocused();
	expect(await focusVisible(page)).toBe(false);

	await page.locator(row('Button')).click();
	await expect(page).toHaveURL(/\/basicinput\/button$/);
	await expect(api(page)).toBeFocused();
	expect(await focusVisible(page)).toBe(false);

	await page.locator(row('CheckBox')).focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/basicinput\/checkbox$/);
	await expect(api(page)).toBeFocused();
	expect(await focusVisible(page)).toBe(true);
});

test('a page chosen from the search box with the pointer draws no visual after the typing', async ({
	page
}) => {
	// Chromium's own choice for a scripted focus would draw one here, after the text box had
	// focus; the reference drew none.
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/');
	const box = page.locator('.search input');
	await box.click();
	await box.pressSequentially('TabView');
	await page.getByRole('option', { name: 'TabView', exact: true }).click();
	await expect(page).toHaveURL(/\/navigation\/tabview$/);
	await expect(api(page)).toBeFocused();
	expect(await focusVisible(page)).toBe(false);
});

test('a page chosen with Enter in the rail’s flyout takes the focus from it, drawn', async ({
	page
}) => {
	// The press measured on the reference: the pane shut by its toggle at 1600, Enter on a
	// section row, Down to the second page, Enter.
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/basicinput/checkbox');
	await page.locator('.pane-toggle-button').click();
	await expect(page.locator('[data-pane-open]')).toHaveAttribute('data-pane-open', 'false');
	await page.locator(row('Basic input')).focus();
	await page.keyboard.press('Enter');
	const flyout = page.locator('.flyout-children');
	await expect(flyout.locator(row('Button'))).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	// Both pages are placeholders, so one `ItemPage` serves the two and focuses again.
	await expect(page).toHaveURL(/\/basicinput\/dropdownbutton$/);
	await expect(flyout).toHaveCount(0);
	await expect(api(page)).toBeFocused();
	expect(await focusVisible(page)).toBe(true);
});

test('the selected row invoked again keeps the focus, as it loads no page', async ({ page }) => {
	// The shell still navigates to the page already shown; upstream navigates on a selection
	// change, and this invoke changes none.
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/basicinput/button');
	const button = page.locator(row('Button'));
	await button.focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/basicinput\/button$/);
	await page.waitForTimeout(300);
	await expect(button).toBeFocused();

	// The mark is spent: the page gone back to takes the focus. Left by a search, which is no
	// invoke of the pane's and so does not replace the mark.
	const box = page.locator('.search input');
	await box.click();
	await box.pressSequentially('CheckBox');
	await page.getByRole('option', { name: 'CheckBox', exact: true }).click();
	await expect(page).toHaveURL(/\/basicinput\/checkbox$/);
	await page.goBack();
	await expect(page).toHaveURL(/\/basicinput\/button$/);
	await expect(api(page)).toBeFocused();
});

test('the shown page’s row after a container was opened is a selection, and focuses', async ({
	page
}) => {
	// Opening `Design` selects it, so invoking `Button` again changes the selection back, and
	// upstream's selection change loads the page (MainWindow.xaml.cs:400).
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/basicinput/button');
	await page.locator(row('Design')).click();
	await expect(page.locator(row('Design'))).toHaveAttribute('aria-selected', 'true');
	const button = page.locator(row('Button'));
	await button.focus();
	await page.keyboard.press('Enter');
	await expect(api(page)).toBeFocused();
	expect(await focusVisible(page)).toBe(true);
});

test('a pointer moved after the last key draws no visual', async ({ page }) => {
	// Upstream records the device for a pointer update as for a press
	// (PointerInputProcessor.cpp:218-251). Going back sends no input of its own.
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/basicinput/checkbox');
	await page.locator(row('Button')).focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/basicinput\/button$/);
	expect(await focusVisible(page)).toBe(true);
	await page.mouse.move(800, 600);
	await page.goBack();
	await expect(page).toHaveURL(/\/basicinput\/checkbox$/);
	await expect(api(page)).toBeFocused();
	expect(await focusVisible(page)).toBe(false);
});

test('a wheel turned after the last key draws no visual', async ({ page }) => {
	// A wheel goes through the same `ProcessPointerInput` (PointerInputProcessor.cpp:308).
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/basicinput/checkbox');
	await page.locator(row('Button')).focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/basicinput\/button$/);
	expect(await focusVisible(page)).toBe(true);
	// `mouse.wheel` resolves before the page has the event, so the test waits for the event, on a
	// listener armed by a call that has returned before the wheel is sent.
	await page.evaluate(() => {
		const target = window as unknown as { wheeled?: Promise<null> };
		target.wheeled = new Promise((resolve) =>
			document.addEventListener('wheel', () => resolve(null), { capture: true, once: true })
		);
	});
	await page.mouse.wheel(0, 100);
	await page.evaluate(() => (window as unknown as { wheeled?: Promise<null> }).wheeled);
	await page.goBack();
	await expect(page).toHaveURL(/\/basicinput\/checkbox$/);
	await expect(api(page)).toBeFocused();
	expect(await focusVisible(page)).toBe(false);
});

test('the header stays as the samples scroll, and the bars start below it', async ({ page }) => {
	// `pageHeader` is rootPanel's first row and `svPanel` its second (ItemPage.xaml:32-47).
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/basicinput/button');
	const header = page.locator('[data-item-page] .header-slot');
	const scroller = page.locator('[data-item-page] .page-scroller');
	const viewport = scroller.locator('.viewport').first();
	const before = (await header.boundingBox())!;
	const region = (await scroller.boundingBox())!;
	expect(region.y).toBeGreaterThanOrEqual(before.y + before.height);
	// The page overflows, so the scroll below moves something.
	expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
	await viewport.evaluate((el) => el.scrollTo({ top: 100, behavior: 'instant' }));
	await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBe(100);
	expect(await header.boundingBox()).toEqual(before);
	// No box around the header scrolled in the region's place.
	const scrolled = await header.evaluate((el) => {
		const found: string[] = [];
		for (let box = el.parentElement; box; box = box.parentElement) {
			if (box.scrollTop !== 0) found.push(box.className);
		}
		return found;
	});
	expect(scrolled).toEqual([]);
});
