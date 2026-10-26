import { expect, test } from './fixtures';

type Locator = import('@playwright/test').Locator;
type Page = import('@playwright/test').Page;

/**
 * A disabled ComboBoxItem whose content is not a control draws `Disabled` whatever else it
 * is: `ChangeVisualState` chooses `Disabled` for a row that is not enabled before it
 * considers selection, pointer or press (`ComboBoxItem_Partial.cpp:447-453`). The template
 * declares `SelectedDisabled` (ComboBox_themeresources.xaml:689), but
 * ComboBoxItem derives from SelectorItem (`ComboBoxItem.g.h:23`), not ListBoxItem, whose code
 * enters it (`ListBoxItem_Partial.cpp:442`), so a selected disabled row shows neither the
 * selected fill nor the pill.
 *
 * The editable list is the one tested: its look follows `shown`, which the selection, the
 * arrows and type-ahead can each put on a disabled row. The non-editable list's follows the
 * primitive's highlight, whose navigation skips disabled rows (WD-106), so it reaches one only
 * when the row holding the look is disabled while the list is open, which no test drives.
 * The page follows the system scheme, which Playwright emulates as light; the two states'
 * fills differ in light and dark and coincide only in high contrast.
 */

const ROUTE = '/dev/combo-box-disabled-row';

async function open(page: Page) {
	await page.goto(ROUTE);
	const section = page.getByTestId('editable');
	await section.locator('.overlay').click();
	await expect(section.locator('input')).toHaveAttribute('aria-expanded', 'true');
	const row = page.locator('.editable-popup .item', { hasText: 'Cascadia Mono' });
	await expect(row).toBeVisible();
	await expect(row).toHaveAttribute('data-disabled', '');
	await expect(row).toHaveAttribute('data-selected', '');
	return row;
}

/** What `var(--winui-<token>)` computes to as a colour, on an element beside `near`. */
const tokenColour = (near: Locator, token: string) =>
	near.evaluate((el, token) => {
		const probe = document.createElement('span');
		probe.style.color = `var(--winui-${token})`;
		el.parentElement!.append(probe);
		const value = getComputedStyle(probe).color;
		probe.remove();
		return value;
	}, token);

const look = (row: Locator) =>
	row.evaluate((el) => {
		const style = getComputedStyle(el);
		return {
			background: style.backgroundColor,
			border: style.borderTopColor,
			foreground: style.color,
			pill: getComputedStyle(el.querySelector('.pill')!).opacity
		};
	});

const disabledLook = async (row: Locator) => ({
	background: await tokenColour(row, 'ComboBoxItemBackgroundDisabled'),
	border: await tokenColour(row, 'ComboBoxItemBorderBrushDisabled'),
	foreground: await tokenColour(row, 'ComboBoxItemForegroundDisabled'),
	pill: '0'
});

test('a disabled row drawn as selected draws Disabled, with no pill', async ({ page }) => {
	const row = await open(page);
	// The two states' fills differ here, so the rule can be told from the one it replaced.
	expect(await tokenColour(row, 'ComboBoxItemBackgroundSelectedDisabled')).not.toBe(
		await tokenColour(row, 'ComboBoxItemBackgroundDisabled')
	);
	expect(await look(row)).toEqual(await disabledLook(row));
});

test('under the pointer or held down, it still draws Disabled', async ({ page }) => {
	const row = await open(page);
	const expected = await disabledLook(row);
	await row.hover();
	await expect(row).toHaveAttribute('data-highlighted', '');
	await expect(row).toHaveAttribute('data-selected', '');
	expect(await look(row), 'under the pointer').toEqual(expected);
	await page.mouse.down();
	expect(await row.evaluate((el) => el.matches(':active')), 'the press did not reach the row').toBe(
		true
	);
	await expect(row).toHaveAttribute('data-selected', '');
	expect(await look(row), 'held down').toEqual(expected);
	await page.mouse.up();
});
