import { expect, test } from './fixtures';

type Page = import('@playwright/test').Page;
type Locator = import('@playwright/test').Locator;

/**
 * While a non-editable ComboBox's list is open, the row drawn as selected is the row keyboard
 * focus is on, which is not always the selected row: `OverrideSelectedIndexForVisualStates`
 * (ComboBox_Partial.cpp:6326). Opening with nothing selected puts it on the first row
 * (`OnOpen`, :1716-1741); the arrows move it (:2979), from where it is, and so does type-ahead
 * (:3979); the pointer does not, and draws `PointerOver` on the row it is over. Measured on the
 * reference guest's ComboBox page: the Colors list, opened with nothing selected, draws Blue
 * with its pill and the Selected fill, and the row under the pointer that opened it with the
 * PointerOver fill.
 */

async function open(page: Page, nth: number) {
	await page.goto('/basicinput/combobox');
	const trigger = page.locator('button.trigger').nth(nth);
	await trigger.click();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	const rows = page.locator('.select-popup [data-select-item]');
	// The popup is hidden until it is placed, and a hidden row still has a box and its text.
	await expect(rows.first()).toBeVisible();
	return { trigger, rows };
}

const pill = (row: Locator) =>
	row.locator('> .pill').evaluate((el) => getComputedStyle(el).opacity);

test('a list opened with nothing selected draws its first row as selected', async ({ page }) => {
	// The Colors sample, whose placeholder is showing.
	const { trigger, rows } = await open(page, 0);
	await expect(trigger).toContainText('Pick a color');
	await expect(rows).toHaveCount(4);
	await expect(page.locator('.select-popup [aria-selected="true"]')).toHaveCount(0);
	const first = rows.first();
	await expect(first).toHaveText('Blue');
	await expect(first).toHaveAttribute('data-selected', '');
	expect(await pill(first)).toBe('1');
	await expect(page.locator('.select-popup [data-selected]')).toHaveCount(1);
	// The list lays its middle row on the box, so the pointer that opened it is over another
	// row, which draws PointerOver; the first row does not.
	await expect(first).not.toHaveAttribute('data-highlighted');
	const over = page.locator('.select-popup [data-select-item][data-highlighted]');
	await expect(over).toHaveCount(1);
	await expect(over).not.toHaveText('Blue');
	expect(await pill(over)).toBe('0');
});

test('the arrows move the selected look and leave the selection', async ({ page }) => {
	// The fonts sample, with Courier New selected.
	const { trigger, rows } = await open(page, 1);
	const chosen = rows.filter({ hasText: 'Courier New' });
	const next = rows.filter({ hasText: 'Segoe UI' });
	await expect(chosen).toHaveAttribute('data-selected', '');
	await expect(next).not.toHaveAttribute('data-selected');

	await page.keyboard.press('ArrowDown');
	await expect(next).toHaveAttribute('data-selected', '');
	expect(await pill(next)).toBe('1');
	// The selected row draws as unselected, and is still the selection.
	await expect(chosen).not.toHaveAttribute('data-selected');
	expect(await pill(chosen)).toBe('0');
	await expect(chosen).toHaveAttribute('aria-selected', 'true');
	await expect(next).not.toHaveAttribute('aria-selected', 'true');

	// Type-ahead moves it as well: Times New Roman is the only row that starts with a T.
	const last = rows.filter({ hasText: 'Times New Roman' });
	await page.keyboard.press('t');
	await expect(last).toHaveAttribute('data-selected', '');
	await expect(page.locator('.select-popup [data-selected]')).toHaveCount(1);

	// Escape keeps the selection, and opening again draws it on the selected row.
	await page.keyboard.press('Escape');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await expect(trigger).toContainText('Courier New');
	await page.keyboard.press('ArrowDown');
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect(chosen).toHaveAttribute('data-selected', '');
	await expect(page.locator('.select-popup [data-selected]')).toHaveCount(1);
});

test('the pointer moves PointerOver, and the keys go on from the selected look', async ({
	page
}) => {
	const { trigger, rows } = await open(page, 1);
	const chosen = rows.filter({ hasText: 'Courier New' });
	const other = rows.filter({ hasText: 'Arial' });
	const next = rows.filter({ hasText: 'Segoe UI' });
	const box = (await other.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await expect(other).toHaveAttribute('data-highlighted', '');
	await expect(chosen).not.toHaveAttribute('data-highlighted');
	await expect(chosen).toHaveAttribute('data-selected', '');
	await expect(other).not.toHaveAttribute('data-selected');
	// The arrow steps from the row drawn as selected, not from the row under the pointer, and
	// Enter chooses the row it reached.
	await page.keyboard.press('ArrowDown');
	await expect(next).toHaveAttribute('data-selected', '');
	await expect(page.locator('.select-popup [data-selected]')).toHaveCount(1);
	await page.keyboard.press('Enter');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await expect(trigger).toContainText('Segoe UI');
});

test('a list opened scrolled with nothing selected draws the first row in view (WD-106)', async ({
	page
}) => {
	// The placement harness's last list: twelve rows, more than the nine shown, and no selection.
	// Upstream draws row 0, out of view; the row bits-ui first highlights, and so the row drawn
	// here, is the first enabled row wholly in view, and the arrows step from it.
	await page.goto('/dev/combo-box-placement');
	const trigger = page.locator('#long-empty button.trigger');
	await trigger.scrollIntoViewIfNeeded();
	await trigger.click();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	const list = page.locator('.select-popup .list');
	const rows = list.locator('[data-select-item]');
	await expect(rows).toHaveCount(12);
	// The popup is hidden until it is placed, and it is scrolled as it is placed.
	await expect(list).toBeVisible();
	const g = await list.evaluate((el) => {
		const view = el.getBoundingClientRect();
		return {
			scrollTop: el.scrollTop,
			firstInView: [...el.children].findIndex((row) => {
				const r = row.getBoundingClientRect();
				return r.top >= view.top && r.bottom <= view.bottom;
			})
		};
	});
	// Without the scroll the first row in view is row 0, and the case is not reached.
	expect(g.scrollTop).toBeGreaterThan(0);
	expect(g.firstInView).toBeGreaterThan(0);
	await expect(rows.nth(g.firstInView)).toHaveAttribute('data-selected', '');
	await expect(page.locator('.select-popup [data-selected]')).toHaveCount(1);
	await page.keyboard.press('ArrowDown');
	await expect(rows.nth(g.firstInView + 1)).toHaveAttribute('data-selected', '');
});
