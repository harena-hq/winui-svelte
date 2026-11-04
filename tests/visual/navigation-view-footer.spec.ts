import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures';

// `FooterMenuItems`, here `footerItems`. Nothing here is a screenshot: the specimens on
// `/dev/navigation-view` are drawn only under `?footer`, so that route's three-theme baseline
// does not move, and the Gallery's footer example is read by what it shows rather than by how.
//
// What the control does with the list is upstream's, and each test names the line it holds the
// control to. The footer's source is `FooterMenuItems` with the settings item appended last
// (`UpdateFooterRepeaterItemsSource`, NavigationView.cpp:866-871), and that one source is set
// on the left footer repeater below the pane footer (NavigationView.xaml:377-381) and on the top
// footer repeater, the column after the top pane footer (NavigationView.xaml:278, :280). Both
// lists are one selection model (NavigationView.cpp:875), so one id selects across them.
const SPECIMENS = '/dev/navigation-view?footer';

const row = (label: string) => `[role="treeitem"]:has(> .content-presenter:text-is("${label}"))`;
const selectedRows = (frame: Locator) => frame.locator('[role="treeitem"][aria-selected="true"]');

/**
 * `row` is the one selected row in `frame`. By attribute rather than by text: a row's text
 * carries its icon's code point, and an expanded row's carries its children's labels too.
 */
async function onlySelected(frame: Locator, target: Locator) {
	await expect(selectedRows(frame)).toHaveCount(1);
	await expect(target).toHaveAttribute('aria-selected', 'true');
}

/** The left pane's rows in document order, by label. */
const leftLabels = (scope: Locator) =>
	scope
		.locator('[role="treeitem"] > .content-presenter')
		.evaluateAll((cells) => cells.map((cell) => cell.textContent?.trim() ?? ''));

/** The row `UpdatePaneLayout` divides, and the two lists it divides it between. */
const parts = (frame: Locator) => ({
	container: frame.locator('.items-container-row'),
	menu: frame.locator('.items-container-grid'),
	footer: frame.locator('.footer-items')
});
/** How far a list's content runs past its viewport; 0 when it does not scroll. */
const overrun = (scroll: Locator) =>
	scroll.locator('.viewport').evaluate((element) => element.scrollHeight - element.clientHeight);
const height = async (locator: Locator) => (await locator.boundingBox())!.height;

async function openSpecimens(page: Page) {
	await page.goto(SPECIMENS);
	// The specimens are drawn on mount, so their frame is the proof that the query was read.
	await expect(page.locator('#footer-left')).toBeVisible();
}

test('left: footer items sit below the pane footer, and settings is their last row', async ({
	page
}) => {
	await openSpecimens(page);
	const frame = page.locator('#footer-left');

	// One ring, menu first: the two `role="tree"` lists in document order.
	expect(await leftLabels(frame.locator('.pane'))).toEqual([
		'Home',
		'All',
		'Account',
		'Help',
		'Settings'
	]);
	// The footer's own list holds the footer items and the settings row together, which is the
	// one source the footer repeater is given, and the menu's holds neither.
	expect(await leftLabels(frame.locator('.footer-items'))).toEqual(['Account', 'Help', 'Settings']);
	expect(await leftLabels(frame.locator('.items-container-grid'))).toEqual(['Home', 'All']);

	// Read as geometry as well as order: the grid's rows are menu, separator, pane footer, footer
	// items (NavigationView.xaml:352-359), so the pane footer is between the two lists on screen.
	const box = async (locator: Locator) => (await locator.boundingBox())!;
	const all = await box(frame.locator(row('All')));
	const paneFooter = await box(frame.locator('.footer-content-border'));
	const account = await box(frame.locator(row('Account')));
	const settings = await box(frame.locator(row('Settings')));
	expect(paneFooter.y).toBeGreaterThanOrEqual(all.y + all.height);
	expect(account.y).toBeGreaterThanOrEqual(paneFooter.y + paneFooter.height);
	expect(settings.y).toBeGreaterThan(account.y);
	// Pushed to the bottom of the pane, which is what the menu's `*` row does to the rest.
	const pane = await box(frame.locator('.pane'));
	expect(pane.y + pane.height - (settings.y + settings.height)).toBeLessThan(16);
});

test('left: a footer item is selected alone and reported, and the selection moves back', async ({
	page
}) => {
	await openSpecimens(page);
	const frame = page.locator('#footer-left');
	await onlySelected(frame, frame.locator(row('Home')));

	await frame.locator(row('Account')).click();
	await onlySelected(frame, frame.locator(row('Account')));
	await expect(page.locator('.log')).toContainText('footer-left: account');

	await frame.locator(row('Home')).click();
	await onlySelected(frame, frame.locator(row('Home')));
});

test("left: a footer item's children expand inline and select as a menu item's do", async ({
	page
}) => {
	await openSpecimens(page);
	const frame = page.locator('#footer-left');
	const help = frame.locator(row('Help'));

	await expect(help).toHaveAttribute('aria-expanded', 'false');
	await expect(frame.locator(row('Documentation'))).toHaveCount(0);
	// `OnNavigationViewItemInvoked` toggles expansion whatever else the invoke does
	// (NavigationView.cpp:1062), in the footer's repeater as in the menu's.
	await help.click();
	await expect(help).toHaveAttribute('aria-expanded', 'true');
	// Inline and one level in, inside the footer's own list.
	const documentation = frame.locator(`.footer-items ${row('Documentation')}`);
	await expect(documentation).toBeVisible();
	await expect(documentation).toHaveAttribute('aria-level', '2');

	await documentation.click();
	await onlySelected(frame, frame.locator(row('Documentation')));
	await expect(page.locator('.log')).toContainText('footer-left: documentation');
});

test('left: Up and Down cross between the lists, and Home and End stop at the footer', async ({
	page
}) => {
	await openSpecimens(page);
	const frame = page.locator('#footer-left');
	const at = (label: string) => frame.locator(row(label));

	// Down from the menu's last row reaches the footer's first, as it reaches Settings with no
	// footer item (`docs/keyboard.md`, answer 2): XAML's directional focus crosses repeaters.
	await at('All').focus();
	await page.keyboard.press('ArrowDown');
	await expect(at('Account')).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(at('Help')).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(at('Settings')).toBeFocused();
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('ArrowUp');
	await expect(at('All')).toBeFocused();

	// Home and End walk one root repeater's own items (NavigationView.cpp:2898-2932), and the
	// settings row is the footer repeater's last.
	await at('Account').focus();
	await page.keyboard.press('End');
	await expect(at('Settings')).toBeFocused();
	await page.keyboard.press('Home');
	await expect(at('Account')).toBeFocused();
	// And the menu's ends are the menu's, with the footer below it.
	await at('Home').focus();
	await page.keyboard.press('End');
	await expect(at('All')).toBeFocused();
});

test('left: Tab stops once in each list, and the footer stop is the selected footer row', async ({
	page
}) => {
	await openSpecimens(page);
	const frame = page.locator('#footer-left');
	const at = (label: string) => frame.locator(row(label));
	const stops = async (expected: Record<string, '0' | '-1'>) => {
		for (const [label, tabindex] of Object.entries(expected))
			await expect(at(label)).toHaveAttribute('tabindex', tabindex);
	};

	// Help is selected, and is not the footer's first row: a stop on Account would be the
	// unredirected entry, and one on Settings the old one-row settings list.
	await at('Help').click();
	await onlySelected(frame, at('Help'));

	// Focus in the menu: the menu's stop is the focused row (the walk out, `:3010-3027`), and the
	// footer's is the selection, which is where `OnRepeaterGettingFocus` redirects a Tab entering
	// the repeater that holds it (NavigationView.cpp:2974-2993).
	await at('Home').focus();
	await stops({ Home: '0', All: '-1', Account: '-1', Help: '0', Settings: '-1' });
	await page.keyboard.press('Tab');
	await expect(at('Help')).toBeFocused();

	// Back again, and this half pins the recorded divergence, not upstream's answer. The menu holds
	// no selection, so nothing redirects the Shift+Tab, and here the unredirected stop is the
	// list's first row. Upstream's is wherever XAML's reverse tab search enters the repeater,
	// which the pin reads as the last focusable row in tab order and which was not pressed.
	// WD-108: Shift+Tab into a list from below lands on its first row; see docs/divergences.md
	await page.keyboard.press('Shift+Tab');
	await expect(at('Home')).toBeFocused();
});

test('left: with both lists taller than half the pane, each gets half and both scroll', async ({
	page
}) => {
	await openSpecimens(page);
	const frame = page.locator('#footer-split');
	const { container, menu, footer } = parts(frame);

	// Both overrun, which is the premise of `UpdatePaneLayout`'s last branch
	// (NavigationView.cpp:1620-1626) and a property of the specimen rather than of the control.
	await expect.poll(() => overrun(menu)).toBeGreaterThan(0);
	await expect.poll(() => overrun(footer)).toBeGreaterThan(0);
	await expect(frame.locator('.items-separator')).toBeVisible();

	const half = (await height(container)) / 2;
	// Each list is capped at half. The footer's row is `Auto` and gets its cap; the menu's is the
	// `*` row (NavigationView.xaml:352-359), so the separator's 3 + 1 + 4 + 2 and the empty pane
	// footer's 4 of margin, which the division does not count, come out of the menu: 14 under half.
	expect(Math.abs((await height(footer)) - half)).toBeLessThanOrEqual(0.5);
	expect(Math.abs((await height(menu)) - (half - 14))).toBeLessThanOrEqual(1);
});

test('left: a menu within half leaves the footer the rest, and both scroll under the rule', async ({
	page
}) => {
	await openSpecimens(page);
	const frame = page.locator('#footer-scrolls');
	const { container, menu, footer } = parts(frame);

	// `:1606`: the menu and the footer group do not both fit, and the menu is within half. The
	// footer's cap is the row less the menu's rows (NavigationView.cpp:1609), and the footer's
	// row is `Auto`, so the footer gets exactly that and scrolls.
	await expect.poll(() => overrun(footer)).toBeGreaterThan(0);
	await expect(frame.locator('.items-separator')).toBeVisible();
	const menuRows = await height(menu.locator('ul[role="tree"]'));
	expect(menuRows).toBeLessThanOrEqual((await height(container)) / 2);
	expect(
		Math.abs((await height(footer)) - ((await height(container)) - menuRows))
	).toBeLessThanOrEqual(0.5);
	// The cap counts neither the separator nor the pane footer, which are drawn as well: the rule
	// is its line's 3 + 1 + 4 (`NavigationViewItemSeparatorMargin` around
	// `NavigationViewItemSeparatorHeight`, NavigationView.xaml:600) and the instance's 2 below
	// (:375), and the empty pane footer is 4 of margin (:377). The menu's `*` row is what gives,
	// so it ends 3 + 1 + 4 + 2 + 4 = 14 under its rows and scrolls by that, as upstream's row
	// does. A pixel either way, because `scrollHeight` and `clientHeight` are whole numbers and
	// the row need not be.
	await expect.poll(() => overrun(menu)).toBeGreaterThanOrEqual(13);
	expect(await overrun(menu)).toBeLessThanOrEqual(15);
});

test('left: with no menu entry the footer takes the row, and no rule is drawn', async ({
	page
}) => {
	await openSpecimens(page);
	const frame = page.locator('#footer-no-menu');
	const { container, menu, footer } = parts(frame);

	// `:1593`: the menu is capped at nothing and the footer at the whole row
	// (NavigationView.cpp:1595), with the rule collapsed whether or not the footer fits.
	await expect(footer).toBeVisible();
	await expect.poll(() => height(menu)).toBe(0);
	await expect(frame.locator('.items-separator')).toHaveCount(0);
	expect(await overrun(footer)).toBe(0);
	// The footer is at the top of the row only if the menu really took nothing: the pane footer's
	// empty box and its 4 of margin are all that is above it.
	const top = (await container.boundingBox())!.y;
	expect((await footer.boundingBox())!.y - top).toBeLessThanOrEqual(4.5);
});

test("left: a header's margin stays inside the list it is measured in", async ({ page }) => {
	await openSpecimens(page);
	const frame = page.locator('#footer-headers');
	const { menu, footer } = parts(frame);

	// Both lists fit, so `:1599` caps the footer at its own measured height. A header opening the
	// footer used to collapse its top margin out of the `<ul>` that height was read from, and the
	// footer then came out a few pixels short of its rows and scrolled in a pane it fitted.
	await expect(footer).toBeVisible();
	await expect(frame.locator('.items-separator')).toHaveCount(0);
	await expect.poll(() => overrun(footer)).toBe(0);
	expect(await overrun(menu)).toBe(0);
	// And the list's own box is the whole of what it draws: the header's margins are inside it.
	for (const scroll of [menu, footer]) {
		const list = scroll.locator('ul[role="tree"]');
		const content = await list.evaluate(
			(element) => element.parentElement!.getBoundingClientRect().height
		);
		expect(Math.abs((await height(list)) - content)).toBeLessThanOrEqual(0.01);
	}
});

test('top: the footer items follow the pane footer at the right, and select alone', async ({
	page
}) => {
	await openSpecimens(page);
	const frame = page.locator('#footer-top');
	const trailing = frame.locator('.top-trailing');

	// One list after the pane footer: the footer items and then the settings row.
	const labels = await trailing.getByRole('treeitem').evaluateAll((rows) =>
		// The label span, or the name an icon-only row carries instead: the row's own text
		// starts with its icon's code point.
		rows.map(
			(element) =>
				element.getAttribute('aria-label') ?? element.querySelector('.content')?.textContent
		)
	);
	expect(labels).toEqual(['Account', 'Help', 'Settings']);
	const box = async (locator: Locator) => (await locator.boundingBox())!;
	const paneFooter = await box(frame.locator('.top-footer'));
	const all = await box(frame.locator('.top-items').getByRole('treeitem', { name: 'All' }));
	const account = await box(trailing.getByRole('treeitem', { name: 'Account' }));
	expect(account.x).toBeGreaterThanOrEqual(paneFooter.x + paneFooter.width);
	expect(account.x).toBeGreaterThan(all.x + all.width);

	await trailing.getByRole('treeitem', { name: 'Help' }).click();
	await onlySelected(frame, trailing.getByRole('treeitem', { name: 'Help' }));
	await expect(page.locator('.log')).toContainText('footer-top: help');
	// WD-025 holds in the footer as in the primary list: the children are not drawn.
	await expect(frame.getByRole('treeitem', { name: 'Documentation' })).toHaveCount(0);

	await frame.locator('.top-items').getByRole('treeitem', { name: 'Home' }).click();
	await onlySelected(frame, frame.locator('.top-items').getByRole('treeitem', { name: 'Home' }));
});

// The Gallery's own example, "NavigationView with Footer Menu Items"
// (NavigationViewPage.xaml:241-313), the sixth on the page. Help's Tag is the same as Your
// Cart's (:301, :305), so both show SamplePage5 while only the one clicked is selected.
/**
 * Which sample page a view shows, by the element only that page draws, as the page's own spec
 * reads it.
 */
async function shown(nv: Locator) {
	for (const [name, mark] of [
		['SamplePage4', '.indian-red'],
		['SamplePage5', '.khaki']
	])
		if ((await nv.locator(mark).count()) > 0) return name;
	return null;
}

test("the Gallery's footer example selects its footer items and shows their pages", async ({
	page
}) => {
	await page.goto('/navigation/navigationview');
	const nv = page
		.locator('[data-item-page] .example')
		.nth(5)
		.locator('[data-pane-display-mode]')
		.first();
	const item = (name: string) => nv.getByRole('treeitem', { name, exact: true });
	await expect(nv).toHaveAttribute('data-pane-display-mode', 'left');

	await expect(nv.locator('.footer-items').getByRole('treeitem')).toHaveCount(3);
	await item('Your Cart').click();
	await expect.poll(() => shown(nv)).toBe('SamplePage5');
	await onlySelected(nv, item('Your Cart'));
	// Account between the two, so that Help's page is one it has to bring back.
	await item('Account').click();
	await expect.poll(() => shown(nv)).toBe('SamplePage4');
	await onlySelected(nv, item('Account'));
	await item('Help').click();
	await expect.poll(() => shown(nv)).toBe('SamplePage5');
	await onlySelected(nv, item('Help'));

	// The first "Top mode" on the page is this example's; the hierarchy's comes after it.
	await page.getByRole('radio', { name: 'Top mode' }).first().check({ force: true });
	await expect(nv).toHaveAttribute('data-pane-display-mode', 'top');
	await expect(nv.locator('.top-trailing').getByRole('treeitem')).toHaveCount(3);
	await item('Account').click();
	await expect.poll(() => shown(nv)).toBe('SamplePage4');
	await onlySelected(nv, item('Account'));
});
