/**
 * The MenuFlyout page runs the original's seven examples and its code-behind: the Sort menu
 * writes the invoked row's Tag beside its button, and the split menu writes the invoked row's
 * Text beside its own, for a split row's own half as for a row under it
 * (MenuFlyoutPage.xaml.cs:16-48). The toggle example's source pane shows each toggle's
 * IsChecked (MenuFlyoutPage.xaml:65-68).
 */
import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

const examples = (page: Page) => page.locator('[data-item-page] .example');
const example = (page: Page, index: number) => examples(page).nth(index);
const menu = (page: Page) => page.getByRole('menu').first();
const output = (page: Page, index: number) => example(page, index).locator('[data-output]');

/** The menu's box once Floating UI has placed it: until then bits-ui parks the wrapper at
 *  `translate(0, -200%)` (use-floating-layer.svelte.js:135), which has a real box. */
async function placed(target: Locator) {
	let last: { x: number; y: number; width: number; height: number } | null = null;
	await expect
		.poll(async () => {
			const now = await target.boundingBox();
			const settled = !!now && now.y >= 0 && !!last && now.x === last.x && now.y === last.y;
			last = now;
			return settled;
		})
		.toBe(true);
	const box: { x: number; y: number; width: number; height: number } = last!;
	return box;
}

async function open(page: Page, index: number, name: string) {
	await example(page, index).getByRole('button', { name, exact: true }).click();
	await placed(menu(page));
}

test.beforeEach(async ({ page }) => {
	await page.goto('/menusandtoolbars/menuflyout');
});

test('seven examples, each with its own trigger', async ({ page }) => {
	await expect(examples(page)).toHaveCount(7);
	const names = ['Sort', 'Options', 'File Options', 'File Options', 'Edit Options', 'Edit Options'];
	for (const [index, name] of [...names, 'Options'].entries()) {
		await expect(example(page, index).getByRole('button', { name, exact: true })).toBeVisible();
	}
});

test('the Sort menu opens above its button and writes the row it invoked', async ({ page }) => {
	const sort = example(page, 0).getByRole('button', { name: 'Sort', exact: true });
	// Symbol.Sort, and the chevron of a button with a flyout.
	await expect(sort.locator('.glyph')).toHaveText(String.fromCodePoint(0xe8cb));
	await expect(sort.locator('.chevron')).toHaveCount(1);
	await expect(output(page, 0)).toHaveText('');
	for (const [row, tag] of [
		['By rating', 'rating'],
		['By match', 'match'],
		['By distance', 'distance']
	]) {
		await open(page, 0, 'Sort');
		const card = await placed(menu(page));
		const button = (await sort.boundingBox())!;
		expect(card.y + card.height).toBeLessThanOrEqual(button.y);
		await menu(page).getByRole('menuitem', { name: row }).click();
		await expect(menu(page)).toHaveCount(0);
		await expect(output(page, 0)).toHaveText(`Sort by: ${tag}`);
	}
});

test('the Sort button carries its tooltip', async ({ page }) => {
	await example(page, 0).getByRole('button', { name: 'Sort', exact: true }).hover();
	await expect(page.locator('.popup:text-is("Sort")')).toBeVisible();
});

test('the toggles start checked, and the source pane follows them', async ({ page }) => {
	// The page header's own Source code button comes first, so the second example's is third.
	const source = page.getByRole('button', { name: 'Source code' }).nth(2);
	await source.click();
	const code = source.locator('xpath=ancestor::*[contains(@class,"card")][1]').locator('pre');
	await expect(code).toContainText('<ToggleMenuFlyoutItem Text="Repeat" IsChecked="True"/>');
	await expect(code).toContainText('<ToggleMenuFlyoutItem Text="Shuffle" IsChecked="True"/>');

	await open(page, 1, 'Options');
	const repeat = menu(page).getByRole('menuitemcheckbox', { name: 'Repeat' });
	await expect(repeat).toHaveAttribute('aria-checked', 'true');
	await expect(menu(page).getByRole('menuitemcheckbox', { name: 'Shuffle' })).toHaveAttribute(
		'aria-checked',
		'true'
	);
	await repeat.click();
	await expect(code).toContainText('<ToggleMenuFlyoutItem Text="Repeat" IsChecked="False"/>');
	await expect(code).toContainText('<ToggleMenuFlyoutItem Text="Shuffle" IsChecked="True"/>');
});

test('the cascading menu opens Send to, and Compressed file within it', async ({ page }) => {
	await open(page, 2, 'File Options');
	await page.getByRole('menuitem', { name: 'Send to' }).hover();
	await expect(page.getByRole('menuitem', { name: 'Desktop (shortcut)' })).toBeVisible();
	await page.getByRole('menuitem', { name: 'Compressed file' }).hover();
	for (const row of ['Compress and email', 'Compress to .7z', 'Compress to .zip']) {
		await expect(page.getByRole('menuitem', { name: row })).toBeVisible();
	}
});

test("the split menu writes the Text of what was invoked, a split row's half included", async ({
	page
}) => {
	await expect(output(page, 3)).toHaveText('');
	await open(page, 3, 'File Options');
	await page.locator('.split-primary[aria-label="Save"]').click();
	await expect(menu(page)).toHaveCount(0);
	await expect(output(page, 3)).toHaveText('Clicked: Save');

	await open(page, 3, 'File Options');
	await page.locator('.split-secondary[aria-label="Save"]').click();
	await page.getByRole('menuitem', { name: 'Save as .pdf' }).click();
	await expect(output(page, 3)).toHaveText('Clicked: Save as .pdf');

	await open(page, 3, 'File Options');
	await page.locator('.split-secondary[aria-label="Share"]').click();
	await page.getByRole('menuitem', { name: 'Share via link' }).click();
	await expect(output(page, 3)).toHaveText('Clicked: Share via link');
});

test('the icon menus draw their glyphs, and the second its accelerators', async ({ page }) => {
	// FontIcon E72D, Symbol.Copy E8C8 and Symbol.Delete E74D; Rename and Select have none.
	const glyphs = ['E72D', 'E8C8', 'E74D'].map((hex) => String.fromCodePoint(parseInt(hex, 16)));
	for (const index of [4, 5]) {
		await open(page, index, 'Edit Options');
		for (const [i, row] of ['Share', 'Copy', 'Delete'].entries()) {
			await expect(menu(page).getByRole('menuitem', { name: row }).locator('.icon')).toHaveText(
				glyphs[i]
			);
		}
		for (const row of ['Rename', 'Select']) {
			await expect(menu(page).getByRole('menuitem', { name: row }).locator('.icon')).toHaveCount(0);
		}
		await expect(menu(page).locator('.separator')).toHaveCount(1);
		await expect(menu(page).locator('.accelerator')).toHaveText(
			index === 4 ? [] : ['Ctrl+S', 'Ctrl+C', 'Delete']
		);
		await page.keyboard.press('Escape');
		await expect(menu(page)).toHaveCount(0);
	}
});

test('the radio groups start on Portrait and Medium icons, and each keeps its own', async ({
	page
}) => {
	await open(page, 6, 'Options');
	const radio = (name: string) => menu(page).getByRole('menuitemradio', { name });
	const checkedRows = async () => {
		const rows = ['Landscape', 'Portrait', 'Small icons', 'Medium icons', 'Large icons'];
		const out: string[] = [];
		for (const row of rows) {
			if ((await radio(row).getAttribute('aria-checked')) === 'true') out.push(row);
		}
		return out;
	};
	expect(await checkedRows()).toEqual(['Portrait', 'Medium icons']);
	await radio('Landscape').click();
	await open(page, 6, 'Options');
	expect(await checkedRows()).toEqual(['Landscape', 'Medium icons']);
});
