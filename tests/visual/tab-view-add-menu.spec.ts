import { expect, test } from './fixtures';

/**
 * TabView's AddTabButtonClick hands its handler the add button, as upstream raises it with the
 * button's own `RoutedEventArgs`, whose `OriginalSource` is that button
 * (`TabView::OnAddButtonClick`, TabView.cpp:514-516; `ButtonBase::OnClick`,
 * ButtonBase_Partial.cpp:889). The harness's handler opens a MenuFlyout at it, a menu with no
 * trigger of its own.
 */

const ROUTE = '/dev/tab-view-add-menu';

test('the add button is handed to the handler, and a menu shown at it sits against it', async ({
	page
}) => {
	await page.goto(ROUTE);
	const add = page.getByRole('button', { name: 'Add New Tab' });
	await add.click();
	const menu = page.getByRole('menu');
	await expect(menu).toBeVisible();
	await expect(page.getByTestId('anchor')).toHaveText('Add New Tab');
	const button = (await add.boundingBox())!;
	const box = (await menu.boundingBox())!;
	// Placed against the button: overlapping it across, and within the 4px offset above or below,
	// with 4px of slack.
	expect(box.x).toBeLessThan(button.x + button.width);
	expect(box.x + box.width).toBeGreaterThan(button.x);
	const gap = Math.min(
		Math.abs(box.y - (button.y + button.height)),
		Math.abs(button.y - (box.y + box.height))
	);
	expect(gap).toBeLessThanOrEqual(8);
});

test('Escape closes the menu and gives the focus back to the add button', async ({ page }) => {
	await page.goto(ROUTE);
	const add = page.getByRole('button', { name: 'Add New Tab' });
	// A click that does not focus the button first, as WebKit's does not: nothing had the focus
	// before the menu opened, so it is the anchor the focus returns to, not what had it.
	await expect(page.locator('body')).toBeFocused();
	await add.dispatchEvent('click');
	await expect(page.getByRole('menu')).toBeVisible();
	// The menu took the focus, so its return below is the menu's doing.
	await expect
		.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="menu"]')))
		.toBe(true);
	await page.keyboard.press('Escape');
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(add).toBeFocused();
});

test('an item invoked from the menu closes it and its handler adds the tab', async ({ page }) => {
	await page.goto(ROUTE);
	const add = page.getByRole('button', { name: 'Add New Tab' });
	// Opened without focusing the button, so the focus's return is the menu's doing.
	await add.dispatchEvent('click');
	await page.getByRole('menuitem', { name: 'Terminal' }).click();
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(add).toBeFocused();
	await expect(page.getByRole('tab', { name: 'Terminal' })).toHaveAttribute(
		'aria-selected',
		'true'
	);
});

test('a second press on the add button closes the menu, and reaches nothing beneath', async ({
	page
}) => {
	await page.goto(ROUTE);
	const add = page.getByRole('button', { name: 'Add New Tab' });
	await add.click();
	await expect(page.getByRole('menu')).toBeVisible();
	// Held past the 10ms in which bits-ui settles a press outside, as a hand's press is.
	const box = (await add.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.waitForTimeout(100);
	await page.mouse.up();
	await expect(page.getByRole('menu')).toHaveCount(0);
	// The press did not reach the button, whose handler would have opened the menu again.
	await page.waitForTimeout(300);
	await expect(page.getByRole('menu')).toHaveCount(0);
	// With nothing pressed to take it, the focus goes back to the anchor rather than the body.
	await expect(add).toBeFocused();
});

test('Tab inside the menu closes it and gives the focus back to the add button', async ({
	page
}) => {
	await page.goto(ROUTE);
	const add = page.getByRole('button', { name: 'Add New Tab' });
	await add.dispatchEvent('click');
	await expect
		.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="menu"]')))
		.toBe(true);
	await page.keyboard.press('Tab');
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(add).toBeFocused();
});

test('a press on an element taking pointer events through the open menu keeps the focus', async ({
	page
}) => {
	await page.goto(ROUTE);
	const add = page.getByRole('button', { name: 'Add New Tab' });
	const elsewhere = page.getByRole('button', { name: 'Elsewhere' });
	await add.click();
	await expect(page.getByRole('menu')).toBeVisible();
	// The button sets `pointer-events: auto`, so the press reaches it through the body's `none`.
	await expect.poll(() => page.evaluate(() => document.body.style.pointerEvents)).toBe('none');
	const box = (await elsewhere.boundingBox())!;
	const hit = await page.evaluate(
		([x, y]) => document.elementFromPoint(x, y)?.textContent ?? null,
		[box.x + box.width / 2, box.y + box.height / 2]
	);
	expect(hit).toBe('Elsewhere');
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(elsewhere).toBeFocused();
});

test('a row invoked in a submenu gives the focus back to the add button', async ({ page }) => {
	await page.goto(ROUTE);
	const add = page.getByRole('button', { name: 'Add New Tab' });
	await add.dispatchEvent('click');
	await page.getByRole('menuitem', { name: 'More' }).hover();
	const row = page.getByRole('menuitem', { name: 'Console' });
	await expect(row).toBeVisible();
	// Held past the 10ms in which bits-ui settles a press it takes for one outside the menu,
	// which a submenu's, portaled apart, is to it.
	const box = (await row.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.waitForTimeout(100);
	await page.mouse.up();
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(page.getByRole('tab', { name: 'Console' })).toHaveCount(1);
	await expect(add).toBeFocused();
});

test('Tab inside a submenu closes the menu and gives the focus back to the add button', async ({
	page
}) => {
	await page.goto(ROUTE);
	const add = page.getByRole('button', { name: 'Add New Tab' });
	await add.dispatchEvent('click');
	await expect
		.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="menu"]')))
		.toBe(true);
	for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
	await expect(page.getByRole('menuitem', { name: 'More' })).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('menuitem', { name: 'Console' })).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(add).toBeFocused();
});

test('a close with the focus already outside the menu leaves it there', async ({ page }) => {
	await page.goto(ROUTE);
	const add = page.getByRole('button', { name: 'Add New Tab' });
	const elsewhere = page.getByRole('button', { name: 'Elsewhere' });
	// A real click focuses the button first, which bits-ui would return the focus to.
	await add.click();
	await expect(page.getByRole('menu')).toBeVisible();
	await elsewhere.evaluate((el: HTMLElement) => el.focus());
	await expect(elsewhere).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(elsewhere).toBeFocused();
});
