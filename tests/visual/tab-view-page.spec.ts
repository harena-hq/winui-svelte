/**
 * The TabView page runs the original's code-behind (TabViewPage.xaml.cs): the Loaded handler's
 * three Document tabs, the add and close handlers, the bound sample's MyData collection, the
 * keyboard accelerators, the two option boxes that set the width and close-button modes, and the
 * context menu's Opening and its moves.
 */
import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

const examples = (page: Page) => page.locator('[data-item-page] .example');
const view = (page: Page, index: number) =>
	examples(page).nth(index).locator('[data-width-mode]').first();
const tabs = (tv: Locator) => tv.locator('[role=tab]');
/** Each tab's label, a `*` after the selected one. */
const labels = (tv: Locator) =>
	tabs(tv).evaluateAll((all) =>
		all.map(
			(t) =>
				(t.querySelector('.label')?.textContent ?? '').trim() +
				(t.getAttribute('aria-selected') === 'true' ? '*' : '')
		)
	);
const tab = (tv: Locator, label: string) =>
	tabs(tv).filter({ has: tv.page().locator('.label', { hasText: new RegExp(`^${label}$`) }) });
const hold = { delay: 100 };

/** Which sample page a view shows, by the element only that page draws. */
async function shown(tv: Locator) {
	const marks: [string, string][] = [
		['SamplePage1', '.source'],
		['SamplePage2', '.destination'],
		['SamplePage3', '.gray']
	];
	for (const [name, mark] of marks)
		if ((await tv.locator('[role=tabpanel]').locator(mark).count()) > 0) return name;
	return null;
}

/** Opens the `index`th example's source pane and returns its code. */
async function code(page: Page, index: number) {
	const source = page.getByRole('button', { name: 'Source code' }).nth(index + 1);
	await source.click();
	return source.locator('xpath=ancestor::*[contains(@class,"card")][1]').locator('pre');
}

test.beforeEach(async ({ page }) => {
	await page.goto('/navigation/tabview');
});

test('the first view loads three documents, adds at the count unselected, and closes', async ({
	page
}) => {
	const tv = view(page, 0);
	expect(await labels(tv)).toEqual(['Document 0*', 'Document 1', 'Document 2']);
	// CreateNewTab: SamplePage1, 2 and 3 by the index modulo three (TabViewPage.xaml.cs:73-84).
	expect(await shown(tv)).toBe('SamplePage1');
	await tab(tv, 'Document 1').click(hold);
	await expect.poll(() => shown(tv)).toBe('SamplePage2');
	await tv.getByRole('button', { name: 'Add new tab' }).click(hold);
	expect(await labels(tv)).toEqual(['Document 0', 'Document 1*', 'Document 2', 'Document 3']);
	// The new tab's index is the count when it was added, so after a close two tabs can share a
	// header, as they do in the original.
	await tab(tv, 'Document 0')
		.locator('button.close')
		.click({ ...hold, force: true });
	await tv.getByRole('button', { name: 'Add new tab' }).click(hold);
	expect(await labels(tv)).toEqual(['Document 1*', 'Document 2', 'Document 3', 'Document 3']);
	await tab(tv, 'Document 3').last().click(hold);
	// Index 3 again, so SamplePage1 again.
	await expect.poll(() => shown(tv)).toBe('SamplePage1');
});

test('the markup view draws the Placeholder symbol, and adds Document tabs', async ({ page }) => {
	const tv = view(page, 1);
	expect(await labels(tv)).toEqual(['Document 0*', 'Document 1', 'Document 2']);
	for (const icon of await tabs(tv).locator('.icon').all())
		await expect(icon).toHaveText(String.fromCodePoint(0xe18a));
	await tab(tv, 'Document 2').click(hold);
	await expect.poll(() => shown(tv)).toBe('SamplePage3');
	await tv.getByRole('button', { name: 'Add new tab' }).click(hold);
	await expect(tabs(tv).last().locator('.icon')).toHaveText(String.fromCodePoint(0xe8a5));
	expect((await labels(tv)).at(-1)).toBe('Document 3');
});

test('the bound view draws MyData and adds and removes them', async ({ page }) => {
	const tv = view(page, 2);
	expect(await labels(tv)).toEqual(['MyData Doc 0*', 'MyData Doc 1', 'MyData Doc 2']);
	for (const icon of await tabs(tv).locator('.icon').all())
		await expect(icon).toHaveText(String.fromCodePoint(0xe18a));
	await tab(tv, 'MyData Doc 1').click(hold);
	await expect.poll(() => shown(tv)).toBe('SamplePage2');
	await tv.getByRole('button', { name: 'Add new tab' }).click(hold);
	await tab(tv, 'MyData Doc 1')
		.locator('button.close')
		.click({ ...hold, force: true });
	// The closed tab was selected, so the one now at its index is.
	expect(await labels(tv)).toEqual(['MyData Doc 0', 'MyData Doc 2*', 'MyData Doc 3']);
});

test("the keyboard view's accelerators act from anywhere on the page", async ({ page }) => {
	const tv = view(page, 3);
	// Focus on another example's tab: an accelerator is the window's (pressed on the reference,
	// Control+T there added a tab to this view).
	await tab(view(page, 0), 'Document 0').focus();
	await page.keyboard.press('Control+t', hold);
	expect(await labels(tv)).toEqual(['Document 0*', 'Document 1', 'Document 2', 'Document 3']);
	expect(await tabs(view(page, 0)).count()).toBe(3);
	await page.keyboard.press('Control+3', hold);
	expect(await labels(tv)).toEqual(['Document 0', 'Document 1', 'Document 2*', 'Document 3']);
	await page.keyboard.press('Control+9', hold);
	expect((await labels(tv)).at(-1)).toBe('Document 3*');
	// Control+8 names no tab of four, and selects nothing (TabViewPage.xaml.cs:215-218).
	await page.keyboard.press('Control+2', hold);
	await page.keyboard.press('Control+8', hold);
	expect(await labels(tv)).toEqual(['Document 0', 'Document 1*', 'Document 2', 'Document 3']);
	await page.keyboard.press('Control+9', hold);
	// Control+W closes the selected tab, and the closest is selected.
	await page.keyboard.press('Control+w', hold);
	expect(await labels(tv)).toEqual(['Document 0', 'Document 1', 'Document 2*']);
	// The keypad's digits are other keys (NumberPad1, not Number1): its "1", with NumLock on, is
	// neither acted on nor marked handled.
	const send = (keys: { key: string; code: string }) =>
		page.evaluate(
			({ key, code }) =>
				window.dispatchEvent(
					new KeyboardEvent('keydown', {
						key,
						code,
						ctrlKey: true,
						bubbles: true,
						cancelable: true
					})
				),
			keys
		);
	expect(await send({ key: '1', code: 'Numpad1' })).toBe(true);
	expect(await labels(tv)).toEqual(['Document 0', 'Document 1', 'Document 2*']);
	// The number row's first key is Number1 whatever it types: "&" on AZERTY.
	expect(await send({ key: '&', code: 'Digit1' })).toBe(false);
	expect(await labels(tv)).toEqual(['Document 0*', 'Document 1', 'Document 2']);
	// T is the key in T's place where the layout's letters are not Latin, as with a Hangul IME.
	expect(await send({ key: 'ㅅ', code: 'KeyT' })).toBe(false);
	expect(await tabs(tv).count()).toBe(4);
	// Where the layout's letters are Latin, T is the key that types t, not the key in T's place:
	// Dvorak's t is on K, and its T place types y.
	expect(await send({ key: 'y', code: 'KeyT' })).toBe(true);
	expect(await tabs(tv).count()).toBe(4);
	expect(await send({ key: 't', code: 'KeyK' })).toBe(false);
	expect(await tabs(tv).count()).toBe(5);
	await page.keyboard.press('Control+Alt+t', hold);
	expect(await tabs(tv).count()).toBe(5);
	// Another modifier with the chord is not the accelerator.
	await page.keyboard.press('Control+Shift+T', hold);
	expect(await tabs(tv).count()).toBe(5);
});

test("the custom content view's header and footer centre in the strip, the footer at its end", async ({
	page
}) => {
	const tv = view(page, 4);
	await expect(tv).toHaveAttribute('data-width-mode', 'sizeToContent');
	const box = await tv.evaluate((root) => {
		const strip = root.querySelector('.strip')!.getBoundingClientRect();
		const r = (s: string) => root.querySelector(s)!.getBoundingClientRect();
		return { strip, header: r('.strip-header-text'), footer: r('.strip-footer-text') };
	});
	const middle = (box.strip.top + box.strip.bottom) / 2;
	expect((box.header.top + box.header.bottom) / 2).toBeCloseTo(middle, 0);
	expect((box.footer.top + box.footer.bottom) / 2).toBeCloseTo(middle, 0);
	// Margin="6" and HorizontalAlignment="Right" (TabViewPage.xaml:196-197).
	expect(box.strip.right - box.footer.right).toBeCloseTo(6, 0);
	expect(box.header.left - box.strip.left).toBeCloseTo(8, 0);
});

test('the width view starts SizeToContent and its box sets the mode and the source', async ({
	page
}) => {
	const tv = view(page, 5);
	await expect(tv).toHaveAttribute('data-width-mode', 'sizeToContent');
	const pre = await code(page, 5);
	await expect(pre).toContainText('TabWidthMode="SizeToContent"');
	const box = page.getByRole('button', { name: /^TabWidthBehavior/ });
	for (const [label, mode] of [
		['Equal', 'equal'],
		['Compact', 'compact']
	]) {
		await box.click(hold);
		await page.getByRole('option', { name: label }).click(hold);
		await expect(tv).toHaveAttribute('data-width-mode', mode);
		await expect(pre).toContainText(`TabWidthMode="${label}"`);
	}
	expect(await tabs(tv).locator('button.close').count()).toBe(0);
});

test('the close-button view starts Always, its box sets OnPointerOver as OnHover, and a close closes nothing', async ({
	page
}) => {
	const tv = view(page, 6);
	await expect(tv).toHaveAttribute('data-close-mode', 'always');
	const pre = await code(page, 6);
	await expect(pre).toContainText('CloseButtonOverlayMode="Always"');
	const box = page.getByRole('button', { name: /^TabViewItem CloseButtonOverlayMode/ });
	await box.click(hold);
	await page.getByRole('option', { name: 'OnHover' }).click(hold);
	await expect(tv).toHaveAttribute('data-close-mode', 'onPointerOver');
	await expect(pre).toContainText('CloseButtonOverlayMode="OnPointerOver"');
	// No TabCloseRequested is set on this view (TabViewPage.xaml:256-262).
	await tab(tv, 'Home')
		.locator('button.close')
		.click({ ...hold, force: true });
	expect(await tabs(tv).count()).toBe(3);
});

test('the icon view draws full-colour bitmaps, as wide as its text line and no less than 490', async ({
	page
}) => {
	const tv = view(page, 7);
	const sources = await tabs(tv)
		.locator('img')
		.evaluateAll((imgs) => imgs.map((i) => new URL((i as HTMLImageElement).src).pathname));
	expect(sources).toEqual(['/cmd.png', '/powershell.png', '/linux.png']);
	for (const img of await tabs(tv).locator('img').all())
		expect(await img.evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBe(16);
	expect(await tv.getByRole('button', { name: 'Add new tab' }).count()).toBe(0);
	// Left-aligned in a StackPanel with its text, as the original measured: the TabView and the
	// line above it share their width, which is the text's.
	const widths = await examples(page)
		.nth(7)
		.evaluate((example) => {
			const text = example.querySelector('p')!;
			const range = document.createRange();
			range.selectNodeContents(text);
			return {
				text: range.getBoundingClientRect().width,
				view: example.querySelector('[data-width-mode]')!.getBoundingClientRect().width
			};
		});
	expect(widths.view).toBeGreaterThanOrEqual(490);
	// MinWidth="490" (TabViewPage.xaml:311), which this line of text already exceeds.
	await expect(tv).toHaveCSS('min-width', '490px');
	expect(Math.abs(widths.view - widths.text)).toBeLessThanOrEqual(1);
});

test("the accent view's strip is SystemAccentColorLight2 in light and Dark2 in dark", async ({
	page
}) => {
	const tv = view(page, 8);
	const fill = () => tv.locator('.strip').evaluate((s) => getComputedStyle(s).backgroundColor);
	const token = (name: string) =>
		page.evaluate((n) => {
			const probe = document.createElement('div');
			probe.style.backgroundColor = `var(${n})`;
			document.body.append(probe);
			const value = getComputedStyle(probe).backgroundColor;
			probe.remove();
			return value;
		}, name);
	expect(await fill()).toBe(await token('--winui-SystemAccentColorLight2'));
	await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
	expect(await fill()).toBe(await token('--winui-SystemAccentColorDark2'));
	await page.evaluate(() => (document.documentElement.dataset.theme = 'light'));
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.evaluate(() => delete document.documentElement.dataset.theme);
	expect(await fill()).toBe(await token('--winui-SystemAccentColorDark2'));
	// High contrast keeps the control's own: the page's dictionaries name no HighContrast brush.
	await page.evaluate(() => (document.documentElement.dataset.theme = 'high-contrast'));
	expect(await fill()).toBe(await token('--winui-TabViewBackground'));
	// And the other views keep theirs in every theme.
	expect(
		await view(page, 0)
			.locator('.strip')
			.evaluate((s) => getComputedStyle(s).backgroundColor)
	).toBe(await token('--winui-TabViewBackground'));
});

test('the windowing button opens no window', async ({ page }) => {
	const button = examples(page)
		.nth(9)
		.getByRole('button', { name: 'Click here to launch the sample' });
	const popups: unknown[] = [];
	page.on('popup', (p) => popups.push(p));
	await button.click(hold);
	await page.waitForTimeout(300);
	expect(popups).toHaveLength(0);
	expect(page.context().pages()).toHaveLength(1);
});

/** The page's one menu's rows, once it is open. */
const menuRows = async (page: Page) => {
	await expect(page.getByRole('menu')).toBeVisible();
	return (await page.getByRole('menuitem').allTextContents()).map((text) => text.trim());
};

test("every view's tabs but the bound view's open the page's move menu", async ({ page }) => {
	// TabViewPage.xaml:12 and the ContextFlyout of every markup tab and every tab CreateNewTab
	// makes; the bound view's template sets none.
	for (const [index, first, middle] of [
		[0, 'Document 0', 'Document 1'],
		[1, 'Document 0', 'Document 1'],
		[3, 'Document 0', 'Document 1'],
		[4, 'Document 0', 'Document 1'],
		[5, 'Home', 'Tab 2 Has Longer Text'],
		[6, 'Home', 'Tab 2 Has Longer Text'],
		[7, 'CMD Prompt', 'PowerShell'],
		[8, 'Document 0', 'Document 1']
	] as const) {
		const tv = view(page, index);
		await tab(tv, first).scrollIntoViewIfNeeded();
		await tab(tv, first).click({ button: 'right' });
		expect(await menuRows(page), `view ${index}, ${first}`).toEqual(['Move tab right']);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('menu')).toHaveCount(0);
		await tab(tv, middle).click({ button: 'right' });
		expect(await menuRows(page), `view ${index}, ${middle}`).toEqual([
			'Move tab left',
			'Move tab right'
		]);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('menu')).toHaveCount(0);
	}
	const bound = view(page, 2);
	await tab(bound, 'MyData Doc 1').click({ button: 'right' });
	// Long enough for a menu to open, were one to.
	await page.waitForTimeout(300);
	await expect(page.getByRole('menu')).toHaveCount(0);
});

test('a move from the menu moves the tab in its own view, and an added tab has the menu', async ({
	page
}) => {
	const width = view(page, 5);
	await tab(width, 'Third Tab').click({ button: 'right' });
	expect(await menuRows(page)).toEqual(['Move tab left']);
	await page.getByRole('menuitem', { name: 'Move tab left' }).click();
	await expect.poll(() => labels(width)).toEqual(['Home*', 'Third Tab', 'Tab 2 Has Longer Text']);
	// The close-button view, built from the same three tabs, is not moved with it.
	expect(await labels(view(page, 6))).toEqual(['Home*', 'Tab 2 Has Longer Text', 'Third Tab']);
	const first = view(page, 0);
	await first.getByRole('button', { name: 'Add new tab' }).click(hold);
	await tab(first, 'Document 3').click({ button: 'right' });
	expect(await menuRows(page)).toEqual(['Move tab left']);
});
