import { expect, test } from './fixtures';

type Page = import('@playwright/test').Page;

/**
 * A tab's context menu, after the Gallery's TabView page. Upstream shows a tab's
 * `ContextFlyout` at the pointer's point when it has one and against the tab otherwise
 * (`CUIElement::OnContextRequestedCore`, uielement.cpp:12775-12861), and a MenuFlyout shown at
 * a point puts its top-left corner there (`FlyoutBase::UpdateTargetPosition`,
 * FlyoutBase_partial.cpp:3251-3260). On the reference, a right-click on a tab opened the menu
 * with its border at the pointer, and Shift+F10 on a focused tab opened it centred above the
 * tab.
 */

const ROUTE = '/dev/tab-view-context-menu';

const tab = (page: Page, name: string) => page.getByTestId('main').getByRole('tab', { name });
const rows = async (page: Page) =>
	(await page.getByRole('menuitem').allTextContents()).map((text) => text.trim());

test('a right-click opens the menu with its top-left corner at the pointer', async ({ page }) => {
	await page.goto(ROUTE);
	const target = tab(page, 'Document 1');
	const box = (await target.boundingBox())!;
	const x = box.x + 40;
	const y = box.y + box.height / 2;
	await page.mouse.click(x, y, { button: 'right' });
	const menu = page.getByRole('menu');
	await expect(menu).toBeVisible();
	await expect(page.getByTestId('request')).toHaveText('tab-1 pointer');
	expect(await rows(page)).toEqual(['Move tab left', 'Move tab right']);
	const placed = (await menu.boundingBox())!;
	expect(Math.abs(placed.x - x)).toBeLessThanOrEqual(1);
	expect(Math.abs(placed.y - y)).toBeLessThanOrEqual(1);
	await page.keyboard.press('Escape');
	await expect(menu).toHaveCount(0);
	await expect(target).toBeFocused();
});

test('Shift+F10 on a focused tab opens the menu centred above it', async ({ page }) => {
	await page.goto(ROUTE);
	const target = tab(page, 'Document 1');
	await target.focus();
	await page.keyboard.press('Shift+F10');
	const menu = page.getByRole('menu');
	await expect(menu).toBeVisible();
	await expect(page.getByTestId('request')).toHaveText('tab-1 keyboard');
	const box = (await target.boundingBox())!;
	const placed = (await menu.boundingBox())!;
	expect(Math.abs(placed.x + placed.width / 2 - (box.x + box.width / 2))).toBeLessThanOrEqual(1);
	// The placement's 4px gap, as MenuFlyout keeps it against any anchor; this case's gap was
	// not measured on the reference.
	expect(Math.abs(box.y - (placed.y + placed.height) - 4)).toBeLessThanOrEqual(1);
	// On the reference the first row is drawn focused.
	await expect(page.getByRole('menuitem', { name: 'Move tab left' })).toBeFocused();
});

test('the end tabs offer only the move they can make', async ({ page }) => {
	await page.goto(ROUTE);
	await tab(page, 'Document 0').click({ button: 'right' });
	await expect(page.getByRole('menu')).toBeVisible();
	expect(await rows(page)).toEqual(['Move tab right']);
	await page.keyboard.press('Escape');
	await expect(page.getByRole('menu')).toHaveCount(0);
	await tab(page, 'Document 2').click({ button: 'right' });
	await expect(page.getByRole('menu')).toBeVisible();
	expect(await rows(page)).toEqual(['Move tab left']);
});

test('a move invoked from the menu moves the tab, and the focus returns to it', async ({
	page
}) => {
	await page.goto(ROUTE);
	await tab(page, 'Document 0').click({ button: 'right' });
	await page.getByRole('menuitem', { name: 'Move tab right' }).click();
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(page.getByTestId('main').getByRole('tab')).toHaveText([
		/Document 1/,
		/Document 0/,
		/Document 2/
	]);
	await expect(tab(page, 'Document 0')).toBeFocused();
});

test('a menu with nothing to offer is not shown, and the browser’s is not either', async ({
	page
}) => {
	await page.goto(ROUTE);
	const only = page.getByTestId('lone').getByRole('tab', { name: 'Only' });
	// Read once the event is done with: Svelte handles it delegated, after this listener.
	await only.evaluate((el) =>
		el.addEventListener(
			'contextmenu',
			(event) =>
				setTimeout(
					() => ((window as unknown as { prevented?: boolean }).prevented = event.defaultPrevented)
				),
			{ once: true }
		)
	);
	await only.click({ button: 'right' });
	await expect
		.poll(() => page.evaluate(() => (window as unknown as { prevented?: boolean }).prevented))
		.toBe(true);
	await expect(page.getByTestId('request')).toHaveText('only pointer');
	await expect(page.getByRole('menu')).toHaveCount(0);
});

test('without a handler a tab leaves the browser its own menu', async ({ page }) => {
	await page.goto(ROUTE);
	const only = page.getByTestId('plain').getByRole('tab', { name: 'Only' });
	const prevented = await only.evaluate((el) => {
		const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
		el.dispatchEvent(event);
		return event.defaultPrevented;
	});
	expect(prevented).toBe(false);
});

test('a right-click on another tab while a menu is open opens that tab’s menu', async ({
	page
}) => {
	await page.goto(ROUTE);
	await tab(page, 'Document 0').click({ button: 'right' });
	await expect(page.getByRole('menu')).toBeVisible();
	await page.evaluate(() => {
		const seen: boolean[] = [];
		(window as unknown as { seen: boolean[] }).seen = seen;
		document.addEventListener(
			'contextmenu',
			(event) => {
				if (event.isTrusted) setTimeout(() => seen.push(event.defaultPrevented));
			},
			true
		);
	});
	const box = (await tab(page, 'Document 2').boundingBox())!;
	const x = box.x + 30;
	const y = box.y + box.height / 2;
	// The body's lock is on, so the press lands on the root rather than on the tab.
	expect(await page.evaluate(() => document.body.style.pointerEvents)).toBe('none');
	await page.mouse.click(x, y, { button: 'right' });
	// The browser's own menu was not drawn over it.
	await expect
		.poll(() => page.evaluate(() => (window as unknown as { seen: boolean[] }).seen))
		.toEqual([true]);
	await expect(page.getByTestId('request')).toHaveText('tab-2 pointer');
	await expect(page.getByRole('menu')).toHaveCount(1);
	expect(await rows(page)).toEqual(['Move tab left']);
	const placed = (await page.getByRole('menu').boundingBox())!;
	expect(Math.abs(placed.x - x)).toBeLessThanOrEqual(1);
	expect(Math.abs(placed.y - y)).toBeLessThanOrEqual(1);
	// The new menu locks the body as the first did, and takes the focus, which it gives back to
	// the tab it opened from.
	expect(await page.evaluate(() => document.body.style.pointerEvents)).toBe('none');
	await expect
		.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="menu"]')))
		.toBe(true);
	await page.keyboard.press('Escape');
	await expect(page.getByRole('menu')).toHaveCount(0);
	await expect(tab(page, 'Document 2')).toBeFocused();
});

test('a right-click in the open menu leaves it open, and draws no browser menu', async ({
	page
}) => {
	await page.goto(ROUTE);
	await tab(page, 'Document 1').click({ button: 'right' });
	const row = page.getByRole('menuitem', { name: 'Move tab right' });
	await expect(row).toBeVisible();
	await page.evaluate(() => {
		const seen: boolean[] = [];
		(window as unknown as { seen: boolean[] }).seen = seen;
		document.addEventListener(
			'contextmenu',
			(event) => setTimeout(() => seen.push(event.defaultPrevented)),
			true
		);
	});
	await row.click({ button: 'right' });
	await expect
		.poll(() => page.evaluate(() => (window as unknown as { seen: boolean[] }).seen))
		.toEqual([true]);
	await page.waitForTimeout(300);
	await expect(page.getByRole('menu')).toHaveCount(1);
	// The press invoked no row.
	await expect(page.getByTestId('main').getByRole('tab')).toHaveText([
		/Document 0/,
		/Document 1/,
		/Document 2/
	]);
});
