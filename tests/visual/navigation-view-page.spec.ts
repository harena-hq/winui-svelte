/**
 * The NavigationView page runs the original's code-behind (NavigationViewPage.xaml.cs): each view
 * shows the sample page its selected item's Tag names, or the settings page; some write
 * "Sample Page " and the Tag's last character into the header; the options panes set the pane's
 * mode, and the last example's boxes and fields set its members and write its source.
 */
import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

const examples = (page: Page) => page.locator('[data-item-page] .example');
const view = (page: Page, index: number) =>
	examples(page).nth(index).locator('[data-pane-display-mode]').first();
const row = (nv: Locator, name: string) => nv.getByRole('treeitem', { name, exact: true });

/** Which sample page a view shows, by the element only that page draws. */
async function shown(nv: Locator) {
	const marks: [string, string][] = [
		['SamplePage1', '.source'],
		['SamplePage2', '.destination'],
		['SamplePage3', '.gray'],
		['SamplePage4', '.indian-red'],
		['SamplePage5', '.khaki'],
		['SamplePage6', '.sky-blue']
	];
	for (const [name, mark] of marks) if ((await nv.locator(mark).count()) > 0) return name;
	if ((await nv.getByText('Sample Settings Page', { exact: true }).count()) > 0) return 'settings';
	return null;
}

/** Opens the `index`th example's source pane and returns its code. */
async function code(page: Page, index: number) {
	const source = page.getByRole('button', { name: 'Source code' }).nth(index + 1);
	await source.click();
	return source.locator('xpath=ancestor::*[contains(@class,"card")][1]').locator('pre');
}

test.beforeEach(async ({ page }) => {
	await page.goto('/navigation/navigationview');
});

test('the first view starts on its first page and names it, and settings keeps the header', async ({
	page
}) => {
	const nv = view(page, 0);
	await expect(nv).toContainText('Sample Page 1');
	expect(await shown(nv)).toBe('SamplePage1');
	await row(nv, 'Menu Item3').click();
	await expect(nv).toContainText('Sample Page 3');
	await expect.poll(() => shown(nv)).toBe('SamplePage3');
	await row(nv, 'Settings').click();
	await expect.poll(() => shown(nv)).toBe('settings');
	// SelectionChanged5 sets the header only for an item (NavigationViewPage.xaml.cs:128-140).
	await expect(nv).toContainText('Sample Page 3');
});

test('the top view keeps its header and shows SamplePage3 for both items tagged with it', async ({
	page
}) => {
	const nv = view(page, 1);
	await expect(nv).toHaveAttribute('data-pane-display-mode', 'top');
	await expect(nv).toContainText('This is Header Text');
	await row(nv, 'Menu Item4').click();
	await expect.poll(() => shown(nv)).toBe('SamplePage3');
	await row(nv, 'Menu Item2').click();
	await expect.poll(() => shown(nv)).toBe('SamplePage2');
	await expect(nv).toContainText('This is Header Text');
});

test('the switching view is Top at a wide window and Auto at a narrow one', async ({ page }) => {
	// Each width loaded fresh: a resize the page has not yet seen would leave the last width's
	// mode standing, and a check of Top would pass on a stale Top.
	const modeAt = async (width: number) => {
		await page.setViewportSize({ width, height: 720 });
		await page.reload();
		await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(width);
		return view(page, 2).getAttribute('data-pane-display-mode');
	};
	expect(await modeAt(1280)).toBe('top');
	// Between the compact threshold and the expanded one it is still Top: the trigger's width is
	// the compact threshold's.
	expect(await modeAt(800)).toBe('top');
	// At CompactModeThresholdWidth, 641, the trigger applies; a pixel under it, it does not.
	expect(await modeAt(641)).toBe('top');
	expect(await modeAt(640)).toBe('auto');
});

test('the tabs view is Top with no back button', async ({ page }) => {
	const nv = view(page, 3);
	await expect(nv).toHaveAttribute('data-pane-display-mode', 'top');
	await expect(nv.getByRole('button', { name: 'Back' })).toHaveCount(0);
	await row(nv, 'Item4').click();
	await expect.poll(() => shown(nv)).toBe('SamplePage4');
});

test('the bound view names the category in its header and always shows SamplePage1', async ({
	page
}) => {
	const nv = view(page, 4);
	await expect(nv).toContainText('Sample Page 1');
	await row(nv, 'Category 3').click();
	await expect(nv).toContainText('Sample Page 3');
	expect(await shown(nv)).toBe('SamplePage1');
	await row(nv, 'Settings').click();
	await expect.poll(() => shown(nv)).toBe('settings');
	await expect(nv).toContainText('Sample Page 3');
});

test("the footer view's radios move its pane and write PaneDisplayMode", async ({ page }) => {
	const nv = view(page, 5);
	await expect(nv).toHaveAttribute('data-pane-display-mode', 'left');
	await expect(row(nv, 'Settings')).toHaveCount(0);
	await row(nv, 'Track an Order').click();
	await expect.poll(() => shown(nv)).toBe('SamplePage2');
	await expect(nv).toContainText('This is Header Text');
	const pre = await code(page, 5);
	await expect(pre).toContainText('PaneDisplayMode="Left"');
	// The first "Top mode" on the page is this example's; the hierarchy's comes after it.
	await page.getByRole('radio', { name: 'Top mode' }).first().check({ force: true });
	await expect(nv).toHaveAttribute('data-pane-display-mode', 'top');
	await expect(pre).toContainText('PaneDisplayMode="Top"');
});

test('the hierarchy expands Document options without selecting it, and its radios set the mode', async ({
	page
}) => {
	const nv = view(page, 6);
	await expect(nv).toContainText('Sample Page 1');
	await row(nv, 'Document options').click();
	await expect(row(nv, 'Create new')).toBeVisible();
	// SelectsOnInvoked False: the selection and the page stay Home's.
	expect(await shown(nv)).toBe('SamplePage1');
	await expect(nv).toContainText('Sample Page 1');
	await row(nv, 'Create new').click();
	await expect(nv).toContainText('Sample Page 5');
	await expect.poll(() => shown(nv)).toBe('SamplePage5');
	const pre = await code(page, 6);
	await page.getByRole('radio', { name: 'LeftCompact mode' }).check({ force: true });
	await expect(nv).toHaveAttribute('data-pane-display-mode', 'leftCompact');
	await expect(pre).toContainText('PaneDisplayMode="LeftCompact"');
});

test('the API view starts empty under "Header", and its options set it and its source', async ({
	page
}) => {
	const nv = view(page, 7);
	const options = page.locator('[data-item-page] .options').last();
	expect(await shown(nv)).toBeNull();
	await expect(nv).toContainText('Header');
	const pre = await code(page, 7);
	for (const text of [
		'IsSettingsVisible="True"',
		'IsBackButtonVisible="Auto"',
		'IsBackEnabled="False"',
		'Header="Header"',
		'AlwaysShowHeader="True"',
		'PaneTitle="Pane Title"',
		'PaneDisplayMode="Left"',
		'SelectionFollowsFocus="Disabled"',
		'SelectsOnInvoked="True"',
		'Visibility="Collapsed"',
		'<AutoSuggestBox QueryIcon="Find" AutomationProperties.Name="Search" />'
	])
		await expect(pre).toContainText(text);

	// The header field and the header are one value, both ways.
	await options.getByRole('textbox', { name: 'Header property' }).fill('Mine');
	await expect(nv).toContainText('Mine');
	await expect(pre).toContainText('Header="Mine"');
	await row(nv, 'Menu Item2').click();
	await expect(nv).toContainText('Sample Page 2');
	await expect(options.getByRole('textbox', { name: 'Header property' })).toHaveValue(
		'Sample Page 2'
	);
	await expect.poll(() => shown(nv)).toBe('SamplePage2');

	// Menu Item2's selection suppressed: invoking it leaves Menu Item3's page.
	await row(nv, 'Menu Item3').click();
	await expect.poll(() => shown(nv)).toBe('SamplePage3');
	const toggle = async (name: string) => {
		await options.getByRole('checkbox', { name, exact: true }).focus();
		await page.keyboard.press('Space');
	};
	await toggle('Selection of Menu Item2 suppressed');
	await expect(pre).toContainText('SelectsOnInvoked="False"');
	await row(nv, 'Menu Item2').click();
	expect(await shown(nv)).toBe('SamplePage3');
	// The selection and the header stay Menu Item3's, not only the page at this instant.
	await expect(row(nv, 'Menu Item3')).toHaveAttribute('aria-selected', 'true');
	await expect(row(nv, 'Menu Item2')).not.toHaveAttribute('aria-selected', 'true');
	await expect(options.getByRole('textbox', { name: 'Header property' })).toHaveValue(
		'Sample Page 3'
	);

	await expect(nv.getByRole('button', { name: 'Back' })).toHaveCount(1);
	await toggle('Back button visible');
	await expect(nv.getByRole('button', { name: 'Back' })).toHaveCount(0);
	await expect(pre).toContainText('IsBackButtonVisible="Collapsed"');
	await expect(row(nv, 'Settings')).toHaveCount(1);
	await toggle('Settings item visible');
	await expect(row(nv, 'Settings')).toHaveCount(0);
	await expect(pre).toContainText('IsSettingsVisible="False"');
	await toggle('AutoSuggestBox visible');
	await expect(pre).not.toContainText('AutoSuggestBox QueryIcon');
	await expect(nv.getByRole('img', { name: 'download' })).toHaveCount(0);
	await toggle('PaneFooter visible');
	await expect(nv.getByRole('img', { name: 'download' })).toBeVisible();
	await expect(pre).toContainText('Orientation="Vertical" Visibility="Visible"');
	// The members the control does not draw still write the source, as the original's boxes do.
	await toggle('PaneCustomContent visible');
	await expect(pre).toContainText('Margin="12,0" Visibility="Visible"');
	await toggle('Always show header');
	await expect(pre).toContainText('AlwaysShowHeader="False"');
	await toggle('Back button enabled');
	await expect(pre).toContainText('IsBackEnabled="True"');
	await toggle('Keyboard SelectionFollowsFocus');
	await expect(pre).toContainText('SelectionFollowsFocus="Enabled"');
	await options.getByRole('textbox', { name: 'PaneTitle property' }).fill('Mine too');
	await expect(pre).toContainText('PaneTitle="Mine too"');
	await page.getByRole('radio', { name: 'Top', exact: true }).check({ force: true });
	await expect(nv).toHaveAttribute('data-pane-display-mode', 'top');
	await expect(nv.locator('.pane-footer')).toHaveAttribute('data-orientation', 'horizontal');
});

/** The fill of each view's left pane, in the order the page draws them. A Top view has none:
 * its bar takes the top pane's brush, which the page does not override. */
async function paneFills(page: Page) {
	return page
		.locator('[data-item-page] [data-pane-display-mode]:not([data-pane-display-mode="top"]) .pane')
		.evaluateAll((panes) => panes.map((p) => getComputedStyle(p).backgroundColor));
}

test("every left pane is the page's own fallback colour, in light and in dark", async ({
	page
}) => {
	// NavigationViewExpandedPaneBackground (NavigationViewPage.xaml:27-52), an AcrylicBrush drawn as
	// its FallbackColor: #F2F2F2 in light, #1F1F1F in dark. Five of the eight views draw a left
	// pane at the test's width: the second and fourth are Top, and the third is Top past 641.
	expect(await paneFills(page)).toEqual(Array(5).fill('rgb(242, 242, 242)'));
	await page.emulateMedia({ colorScheme: 'dark' });
	expect(await paneFills(page)).toEqual(Array(5).fill('rgb(31, 31, 31)'));
	// An explicit dark theme reaches it by the attribute as well as by the media query.
	await page.emulateMedia({ colorScheme: 'light' });
	await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
	expect(await paneFills(page)).toEqual(Array(5).fill('rgb(31, 31, 31)'));
});

test("the hierarchy's text runs at XAML's line, each LineBreak one line more", async ({ page }) => {
	/** The tops of a paragraph's line boxes, in thousandths of a pixel. */
	const tops = (index: number) =>
		examples(page)
			.nth(6)
			.locator('.rich p')
			.nth(index)
			.evaluate((p) => {
				const range = document.createRange();
				range.selectNodeContents(p);
				return [...new Set([...range.getClientRects()].map((r) => Math.round(r.top * 1000)))];
			});
	const first = await tops(0);
	const second = await tops(1);
	// The RichTextBlock's lines 18.621 apart, XAML's advance at the Body size, not CSS's 19.
	expect((second[1] - second[0]) / 1000).toBeCloseTo(18.621, 2);
	// Between paragraphs, the LineBreak's blank line: two advances from one line to the next.
	expect((second[0] - first[first.length - 1]) / 1000).toBeCloseTo(2 * 18.621, 1);
});
