/**
 * The ProgressRing page runs the original's bindings and code-behind. Example 1's ToggleSwitch
 * binds `IsActive` and its substitution (ProgressRingPage.xaml:31, :53). Each example's ComboBox
 * sets the ring's `Background` — its track (ProgressRingPage.xaml.cs:30-50). The `Background`
 * substitution is enabled until a pick, `Transparent` disables it and `LightGray` enables it.
 * Example 2's NumberBox drives the ring
 * (ProgressRingPage.xaml.cs:18-28), and a box that is not a number goes back to 0.
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const rings = (page: Page) => page.locator('[data-item-page] [data-ring-state]');
const box = (page: Page) => page.locator('[data-item-page]').getByRole('spinbutton');
const picker = (page: Page, index: number) =>
	page
		.locator('[data-item-page] button')
		.filter({ hasText: /Pick a color|Transparent|LightGray/ })
		.nth(index);

/** Opens the `index`th example's source pane and returns its code. The page header's own
 *  "Source code" button comes first. */
async function code(page: Page, index: number) {
	const source = page.getByRole('button', { name: 'Source code' }).nth(index + 1);
	await source.click();
	return source.locator('xpath=ancestor::*[contains(@class,"card")][1]').locator('pre');
}

/** The track's resolved stroke colour. */
function track(page: Page, index: number) {
	return rings(page)
		.nth(index)
		.evaluate((el) => getComputedStyle(el.querySelector('.track')!).stroke);
}

/** The track token as the page declared it on the ring itself — empty unless the page set it.
 *  The computed value would not do: the inherited default is `#ffffff00` as well. */
function token(page: Page, index: number) {
	return rings(page)
		.nth(index)
		.evaluate((el) =>
			(el as HTMLElement).style.getPropertyValue('--winui-ProgressRingBackgroundThemeBrush').trim()
		);
}

async function pick(page: Page, index: number, name: string) {
	await picker(page, index).click();
	await page.getByRole('option', { name }).click();
	await expect(picker(page, index)).toContainText(name);
}

test.beforeEach(async ({ page }) => {
	await page.goto('/statusandinfo/progressring');
});

test('the toggle sets the indeterminate ring active and its XAML', async ({ page }) => {
	const ring = rings(page).nth(0);
	const xaml = await code(page, 0);
	await expect(ring).toHaveAttribute('data-ring-state', 'active');
	await expect(xaml).toContainText('IsActive="True"');
	await page.getByRole('switch', { name: 'Progress Options' }).focus();
	await page.keyboard.press('Space');
	await expect(ring).toHaveAttribute('data-ring-state', 'inactive');
	await expect(xaml).toContainText('IsActive="False"');
});

// Before anything is picked the substitution is enabled and the ring keeps its own brush, as
// on the original, whose source reads `Background="LightGray"` at load over a ring with no
// track drawn.
for (const index of [0, 1]) {
	test(`example ${index + 1}: LightGray colours its track, Transparent clears it and the XAML`, async ({
		page
	}) => {
		const other = 1 - index;
		const xaml = await code(page, index);
		const resting = await track(page, index);
		await expect(xaml).toContainText('Background="LightGray"');
		await pick(page, index, 'LightGray');
		expect(await track(page, index)).toBe('rgb(211, 211, 211)');
		await expect(xaml).toContainText('Background="LightGray"');
		// Each ComboBox sets its own example's ring (ProgressRingPage.xaml.cs:32).
		expect(await track(page, other)).toBe(resting);
		// Colors.Transparent is white at no alpha, which draws as nothing, and the ring's default
		// track is the same colour in light and dark; the ring's own declaration is what tells the
		// pick from one that did nothing.
		expect(await token(page, index)).toBe('#d3d3d3');
		await pick(page, index, 'Transparent');
		expect(await token(page, index)).toBe('#ffffff00');
		await expect(xaml).not.toContainText('Background=');
	});
}

test('the NumberBox sets the determinate ring and its XAML', async ({ page }) => {
	const arc = rings(page).nth(1).locator('.arc');
	const xaml = await code(page, 1);
	await expect(arc).toHaveCSS('visibility', 'hidden');
	await expect(xaml).toContainText('Value="0"');
	await box(page).fill('45');
	await box(page).press('Enter');
	await expect(arc).toHaveCSS('visibility', 'visible');
	await expect(xaml).toContainText('Value="45"');
});

test('an emptied NumberBox goes back to 0, and the ring with it', async ({ page }) => {
	const arc = rings(page).nth(1).locator('.arc');
	const xaml = await code(page, 1);
	await box(page).fill('45');
	await box(page).press('Enter');
	await expect(xaml).toContainText('Value="45"');
	// NumberBox reports the empty box as it is typed, so the reset has happened before the Tab;
	// the Tab commits it as upstream would, and not by Enter (see progress-bar-page.spec.ts).
	await box(page).fill('');
	await box(page).press('Tab');
	await expect(box(page)).toHaveValue('0');
	await expect(arc).toHaveCSS('visibility', 'hidden');
	await expect(xaml).toContainText('Value="0"');
});
