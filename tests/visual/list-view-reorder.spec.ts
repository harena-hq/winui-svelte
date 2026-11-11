import { expect, type Page } from '@playwright/test';
import { CDP_ENDPOINT, test } from './fixtures';

/*
 * Keyboard modifiers and directions: ListViewBaseItem_Partial.cpp:2095-2131; bounds and focus:
 * ListViewBase_Partial_Reorder.cpp:1868-1975 (focus and scroll at :1963). Selection survives
 * remove/insert (:1540-1545); multi-item dragging (:662-693) is deliberately absent here.
 * Reorder targets: ListViewItem_themeresources.xaml:9-10. One photograph, of a drag in progress,
 * on the reference browser; the rest read the DOM.
 */
test.beforeEach(async ({ page }) => {
	await page.goto('/dev/list-view-reorder');
});

const items = (page: Page) => page.locator('#pinned [role=option]');
const item = (page: Page, index: number) => items(page).filter({ hasText: `Pinned ${index}` });
const order = (indexes: number[]) => indexes.map((index) => `Pinned ${index}`);

async function recordDefaultPrevented(page: Page) {
	await page.evaluate(() => {
		document.addEventListener('keydown', (event) => {
			if (event.key.startsWith('Arrow')) {
				const output = document.querySelector('#reorders')!;
				output.setAttribute('data-prevented', String(event.defaultPrevented));
			}
		});
	});
}

async function startDrag(page: Page) {
	const source = (await item(page, 0).boundingBox())!;
	const target = (await item(page, 2).boundingBox())!;
	const x = source.x + source.width / 2;
	const y = source.y + source.height / 2;
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.move(x + 12, target.y + target.height / 2 + 8, { steps: 8 });
	return { x, y, height: source.height };
}

async function expectClean(page: Page) {
	await expect(page.locator('#pinned [data-dragging], #pinned [data-reorder-target]')).toHaveCount(
		0
	);
	for (const option of await items(page).all()) await expect(option).toHaveCSS('translate', 'none');
}

test('Alt+Shift+ArrowDown moves the selected item, reports and follows focus', async ({ page }) => {
	await item(page, 1).focus();
	await page.keyboard.press('Alt+Shift+ArrowDown');
	await expect(items(page)).toHaveText(order([0, 2, 1, 3, 4]));
	await expect(page.locator('#reorders')).toHaveText('1>2');
	await expect(item(page, 1)).toBeFocused();
	await expect(page.locator('#selected')).toHaveText('2');
});

test('Alt+Shift+ArrowUp moves the selected item toward the lower index', async ({ page }) => {
	await item(page, 1).focus();
	await page.keyboard.press('Alt+Shift+ArrowUp');
	await expect(items(page)).toHaveText(order([1, 0, 2, 3, 4]));
	await expect(page.locator('#reorders')).toHaveText('1>0');
	await expect(page.locator('#selected')).toHaveText('0');
});

test('Alt+Shift+ArrowRight and ArrowLeft move like Down and Up', async ({ page }) => {
	await item(page, 1).focus();
	await page.keyboard.press('Alt+Shift+ArrowRight');
	await expect(items(page)).toHaveText(order([0, 2, 1, 3, 4]));
	await expect(page.locator('#reorders')).toHaveText('1>2');
	await page.keyboard.press('Alt+Shift+ArrowLeft');
	await expect(items(page)).toHaveText(order([0, 1, 2, 3, 4]));
	await expect(page.locator('#reorders')).toHaveText('1>2 2>1');
});

test('arrows past either end do nothing but still prevent the default', async ({ page }) => {
	await recordDefaultPrevented(page);
	await item(page, 0).focus();
	await page.keyboard.press('Alt+Shift+ArrowUp');
	await expect(page.locator('#reorders')).toHaveAttribute('data-prevented', 'true');
	await page.locator('#reorders').evaluate((output) => output.removeAttribute('data-prevented'));
	await item(page, 4).focus();
	await page.keyboard.press('Alt+Shift+ArrowDown');
	await expect(page.locator('#reorders')).toHaveAttribute('data-prevented', 'true');
	await expect(items(page)).toHaveText(order([0, 1, 2, 3, 4]));
	await expect(page.locator('#reorders')).toBeEmpty();
});

test('Control+Alt+Shift+ArrowDown does not reorder', async ({ page }) => {
	await item(page, 1).focus();
	await page.keyboard.press('Control+Alt+Shift+ArrowDown');
	await expect(items(page)).toHaveText(order([0, 1, 2, 3, 4]));
	await expect(page.locator('#reorders')).toBeEmpty();
});

test('Alt+Shift+ArrowDown does not reorder a list without reorderItems', async ({ page }) => {
	await recordDefaultPrevented(page);
	const locked = page.locator('#locked [role=option]');
	await locked.nth(1).focus();
	await page.keyboard.press('Alt+Shift+ArrowDown');
	await expect(locked).toHaveText(['Locked 0', 'Locked 1', 'Locked 2']);
	await expect(page.locator('#reorders')).toHaveAttribute('data-prevented', 'false');
	await expect(page.locator('#reorders')).toBeEmpty();
});

test('moving an unselected item across the selected one carries that selection', async ({
	page
}) => {
	await item(page, 0).focus();
	await page.keyboard.press('Alt+Shift+ArrowDown');
	await expect(items(page)).toHaveText(order([1, 0, 2, 3, 4]));
	await expect(page.locator('#selected')).toHaveText('0');
	await expect(item(page, 1)).toHaveAttribute('aria-selected', 'true');
});

test('pointer drag moves one item and its click does not select it', async ({ page }) => {
	await page.evaluate(() => {
		document.addEventListener(
			'click',
			(event) => {
				document.querySelector('#reorders')!.setAttribute('data-click-seen', 'true');
				// Read after dispatch, including the listbox's capture guard.
				setTimeout(() => {
					document
						.querySelector('#reorders')!
						.setAttribute('data-click-prevented', String(event.defaultPrevented));
				}, 0);
			},
			{ capture: true }
		);
	});
	await startDrag(page);
	await page.mouse.up();
	await expect(items(page)).toHaveText(order([1, 2, 0, 3, 4]));
	await expect(page.locator('#reorders')).toHaveText('0>2');
	// The press focused the item, and the keyed move of its node would blur it.
	await expect(item(page, 0)).toBeFocused();
	// A keyed move can make the browser omit its click; when one comes, the guard takes it.
	if (await page.locator('#reorders').getAttribute('data-click-seen')) {
		await expect(page.locator('#reorders')).toHaveAttribute('data-click-prevented', 'true');
	}
	await expect(page.locator('#selected')).toHaveText('0');
	await expect(item(page, 1)).toHaveAttribute('aria-selected', 'true');
});

test('mid-drag targets fade and scale, rows shift, and release clears all styles', async ({
	page
}) => {
	const { height } = await startDrag(page);
	await expect(item(page, 0)).toHaveAttribute('data-dragging', '');
	const pointerOverBackground = await item(page, 0).evaluate((element) => {
		const probe = document.createElement('div');
		probe.style.backgroundColor = getComputedStyle(element).getPropertyValue(
			'--winui-ListViewItemBackgroundPointerOver'
		);
		element.append(probe);
		const resolved = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return resolved;
	});
	await expect(item(page, 0).locator('.background')).toHaveCSS(
		'background-color',
		pointerOverBackground
	);
	await expect(page.locator('#pinned [data-reorder-target]')).toHaveCount(4);
	for (const index of [1, 2, 3, 4]) {
		await expect(item(page, index)).toHaveAttribute('data-reorder-target', '');
		await expect(item(page, index)).toHaveCSS('opacity', '0.5');
		await expect(item(page, index)).toHaveCSS('scale', '0.95');
	}
	for (const index of [1, 2]) {
		await expect(item(page, index)).toHaveCSS('translate', `0px ${-height}px`);
	}
	await expect(item(page, 3)).toHaveCSS('translate', '0px');
	await page.mouse.up();
	await expectClean(page);
});

test('Escape during an active drag cancels without reporting or leaving styles', async ({
	page
}) => {
	await startDrag(page);
	await page.keyboard.press('Escape');
	await expectClean(page);
	await page.mouse.up();
	await expect(items(page)).toHaveText(order([0, 1, 2, 3, 4]));
	await expect(page.locator('#reorders')).toBeEmpty();
});

test('a move within eight pixels stays a click and selects without reordering', async ({
	page
}) => {
	const box = (await item(page, 0).boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2 + 8, box.y + box.height / 2 + 8);
	await page.mouse.up();
	await expect(page.locator('#selected')).toHaveText('0');
	await expect(item(page, 0)).toHaveAttribute('aria-selected', 'true');
	await expect(page.locator('#reorders')).toBeEmpty();
});

test('dropping back at the original index reports no move', async ({ page }) => {
	const { x, y } = await startDrag(page);
	await page.mouse.move(x, y, { steps: 8 });
	await page.mouse.up();
	await expect(items(page)).toHaveText(order([0, 1, 2, 3, 4]));
	await expect(page.locator('#reorders')).toBeEmpty();
	await expectClean(page);
});

test('a drag in progress, photographed', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await startDrag(page);
	await expect(page.locator('#pinned')).toHaveScreenshot('mid-drag.png');
	await page.mouse.up();
});

test('a press released outside the list before the threshold leaves no drag behind', async ({
	page
}) => {
	const box = (await item(page, 0).boundingBox())!;
	const x = box.x + box.width / 2;
	const y = box.y + box.height / 2;
	const outside = (await page.locator('h1').boundingBox())!;
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.move(x + 3, y + 3);
	// Out of the list in one step, so no move inside it crosses the threshold, then released.
	await page.mouse.move(outside.x + 4, outside.y + 4);
	await page.mouse.up();
	// A new press outside, carried into the list with the button held, is not that drag.
	await page.mouse.down();
	await page.mouse.move(x, y, { steps: 4 });
	await page.mouse.move(x, y + 3 * box.height, { steps: 8 });
	await expectClean(page);
	await page.mouse.up();
	await expect(page.locator('#reorders')).toBeEmpty();
});

test('the keyboard does nothing while a drag is in progress', async ({ page }) => {
	await startDrag(page);
	await page.keyboard.press('Alt+Shift+ArrowDown');
	await expect(items(page)).toHaveText(order([0, 1, 2, 3, 4]));
	await page.mouse.up();
	await expect(items(page)).toHaveText(order([1, 2, 0, 3, 4]));
	await expect(page.locator('#reorders')).toHaveText('0>2');
});

test('a drag survives its capture moving from the item to the list', async ({ page }) => {
	// A pen's press captures the pointer to the item it lands on, implicitly. The item takes it
	// here, explicitly, so a mouse reaches the same state: activation then moves the capture to
	// the list, and the item's `lostpointercapture` bubbles to it.
	await item(page, 0).evaluate((element) =>
		element.addEventListener('pointerdown', (event) =>
			element.setPointerCapture((event as PointerEvent).pointerId)
		)
	);
	await startDrag(page);
	await expect(item(page, 0)).toHaveAttribute('data-dragging', '');
	await page.mouse.up();
	await expect(items(page)).toHaveText(order([1, 2, 0, 3, 4]));
	await expect(page.locator('#reorders')).toHaveText('0>2');
});

test('a keyboard click on a control in the list goes through after a drag', async ({ page }) => {
	await startDrag(page);
	await page.mouse.up();
	await expect(page.locator('#reorders')).toHaveText('0>2');
	await page.locator('#pinned-footer').focus();
	await page.keyboard.press('Enter');
	await expect(page.locator('#pinned-footer')).toHaveText('Footer 1');
});

test('a keyboard move ends a press that had not yet become a drag', async ({ page }) => {
	const box = (await item(page, 0).boundingBox())!;
	const target = (await item(page, 2).boundingBox())!;
	const x = box.x + box.width / 2;
	await page.mouse.move(x, box.y + box.height / 2);
	await page.mouse.down();
	await page.keyboard.press('Alt+Shift+ArrowDown');
	await expect(page.locator('#reorders')).toHaveText('0>1');
	await page.mouse.move(x, target.y + target.height / 2 + 8, { steps: 8 });
	await expectClean(page);
	await page.mouse.up();
	await expect(items(page)).toHaveText(order([1, 0, 2, 3, 4]));
	await expect(page.locator('#reorders')).toHaveText('0>1');
});

test('a move carries the range anchor with the item it names', async ({ page }) => {
	const options = page.locator('#extended [role=option]');
	const named = (text: string) => options.filter({ hasText: text });
	await named('Extended 1').click();
	await page.keyboard.press('Alt+Shift+ArrowDown');
	await expect(options).toHaveText(['Extended 0', 'Extended 2', 'Extended 1', 'Extended 3']);
	// The anchor is Extended 1, now at index 2, so the range is indexes 2 and 3.
	await named('Extended 3').click({ modifiers: ['Shift'] });
	await expect(named('Extended 1')).toHaveAttribute('aria-selected', 'true');
	await expect(named('Extended 3')).toHaveAttribute('aria-selected', 'true');
	await expect(named('Extended 2')).toHaveAttribute('aria-selected', 'false');
});

test('a drop in a list without keys focuses the item moved, not its old index', async ({
	page
}) => {
	const options = page.locator('#extended [role=option]');
	const named = (text: string) => options.filter({ hasText: text });
	await page.locator('#extended').scrollIntoViewIfNeeded();
	const source = (await named('Extended 0').boundingBox())!;
	const target = (await named('Extended 2').boundingBox())!;
	const x = source.x + source.width / 2;
	await page.mouse.move(x, source.y + source.height / 2);
	await page.mouse.down();
	await page.mouse.move(x, target.y + target.height / 2 + 8, { steps: 8 });
	await page.mouse.up();
	await expect(options).toHaveText(['Extended 1', 'Extended 2', 'Extended 0', 'Extended 3']);
	await expect(named('Extended 0')).toBeFocused();
});

test('a move carries the range anchor in multiple selection too', async ({ page }) => {
	const options = page.locator('#multiple [role=option]');
	const named = (text: string) => options.filter({ hasText: text });
	await named('Multiple 1').click();
	await page.keyboard.press('Alt+Shift+ArrowDown');
	await expect(options).toHaveText(['Multiple 0', 'Multiple 2', 'Multiple 1', 'Multiple 3']);
	await named('Multiple 3').click({ modifiers: ['Shift'] });
	await expect(named('Multiple 1')).toHaveAttribute('aria-selected', 'true');
	await expect(named('Multiple 3')).toHaveAttribute('aria-selected', 'true');
	await expect(named('Multiple 2')).toHaveAttribute('aria-selected', 'false');
});

test('reorderItems without onItemReorder moves nothing: not the selection, focus or key', async ({
	page
}) => {
	await recordDefaultPrevented(page);
	const options = page.locator('#bare [role=option]');
	await options.first().focus();
	await page.keyboard.press('Alt+Shift+ArrowDown');
	await expect(page.locator('#reorders')).toHaveAttribute('data-prevented', 'false');
	await expect(options).toHaveText(['Bare 0', 'Bare 1', 'Bare 2']);
	await expect(options.first()).toHaveAttribute('aria-selected', 'true');
	await expect(options.first()).toBeFocused();
});
