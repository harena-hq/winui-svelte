/**
 * The InfoBar page runs the original's bindings and code-behind. Each bar's IsOpen is bound
 * two ways to its CheckBox (InfoBarPage.xaml:36, :79 and :117); example 1's ComboBox sets the
 * Severity (InfoBarPage.xaml.cs:23-46), example 2's two set the message and the action button
 * and the source they write (InfoBarPage.xaml.cs:17-21 and :48-94), and example 3's CheckBoxes
 * the icon and close button (InfoBarPage.xaml:118-125).
 */
import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

/** Opens the `index`th example's source pane and returns its code. The page header's own
 *  "Source code" button comes first. */
async function code(page: Page, index: number) {
	const source = page.getByRole('button', { name: 'Source code' }).nth(index + 1);
	await source.click();
	return source.locator('xpath=ancestor::*[contains(@class,"card")][1]').locator('pre');
}

/** The code exactly, its indentation included. */
const text = (pre: Locator) => pre.evaluate((el) => el.textContent ?? '');

const examples = (page: Page) => page.locator('[data-item-page] .example');
const bar = (page: Page, index: number) => examples(page).nth(index).locator('[data-severity]');
const options = (page: Page, index: number) => page.locator('[data-item-page] .options').nth(index);

async function pick(page: Page, index: number, combo: number, option: string) {
	await options(page, index).locator('button.trigger').nth(combo).click();
	await page.getByRole('option', { name: option, exact: true }).click();
}

/** The role-located input takes no pointer events (CheckBox.svelte's `.input`), so it is
 *  driven from the keyboard. */
async function toggle(page: Page, index: number, name: string) {
	await options(page, index).getByRole('checkbox', { name, exact: true }).focus();
	await page.keyboard.press('Space');
}

const MESSAGE =
	'Essential app message for your users to be informed of, acknowledge, or take action on.';
const LONG =
	'A long essential app message for your users to be informed of, acknowledge, or take action on. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin dapibus dolor vitae justo rutrum, ut lobortis nibh mattis. Aenean id elit commodo, semper felis nec.';

test.beforeEach(async ({ page }) => {
	await page.goto('/statusandinfo/infobar');
});

test('each bar sits at the top of its example', async ({ page }) => {
	// InfoBar.xaml:15 draws the bar at the top of the control, which stretches down the
	// example; the example's padding is 12.
	for (const index of [0, 1, 2]) {
		const box = await bar(page, index).boundingBox();
		const example = await examples(page).nth(index).boundingBox();
		if (box === null || example === null) throw new Error('no box');
		expect(box.y - example.y).toBeCloseTo(12, 1);
		expect(example.height - box.height).toBeGreaterThan(24);
	}
});

test('the Severity ComboBox sets the first bar and writes its name', async ({ page }) => {
	const xaml = await code(page, 0);
	await expect(bar(page, 0)).toHaveAttribute('data-severity', 'informational');
	expect(await text(xaml)).toBe(
		`<InfoBar\n    IsOpen="True"\n    Severity="Informational"\n    Title="Title"\n    Message="${MESSAGE}" />`
	);
	for (const name of ['Success', 'Warning', 'Error', 'Informational']) {
		await pick(page, 0, 0, name);
		await expect(bar(page, 0)).toHaveAttribute('data-severity', name.toLowerCase());
		await expect(xaml).toContainText(`Severity="${name}"`);
	}
});

test('closing a bar clears its own Is Open, and checking it opens the bar again', async ({
	page
}) => {
	for (const index of [0, 1, 2]) {
		const xaml = await code(page, index);
		const isOpen = options(page, index).getByRole('checkbox', { name: 'Is Open', exact: true });
		await expect(bar(page, index)).toBeVisible();
		await expect(isOpen).toBeChecked();
		await bar(page, index).getByRole('button', { name: 'Close' }).click();
		await expect(bar(page, index)).toBeHidden();
		await expect(isOpen).not.toBeChecked();
		await expect(xaml).toContainText('IsOpen="False"');
		// The other two bars are bound to their own boxes.
		for (const other of [0, 1, 2].filter((i) => i !== index)) {
			await expect(bar(page, other)).toBeVisible();
			await expect(
				options(page, other).getByRole('checkbox', { name: 'Is Open', exact: true })
			).toBeChecked();
		}
		await toggle(page, index, 'Is Open');
		await expect(bar(page, index)).toBeVisible();
		await expect(xaml).toContainText('IsOpen="True"');
	}
});

test('the second bar starts long with no action, and the ComboBoxes change both', async ({
	page
}) => {
	const xaml = await code(page, 1);
	const message = bar(page, 1).getByText(LONG, { exact: true });
	await expect(message).toBeVisible();
	await expect(bar(page, 1).getByRole('button', { name: 'Close' })).toHaveCount(1);
	await expect(bar(page, 1).getByRole('button')).toHaveCount(1);
	// No ActionButton at all, rather than an empty one: the slot is not drawn.
	await expect(bar(page, 1).locator('.action')).toHaveCount(0);
	await expect(bar(page, 1).getByRole('link')).toHaveCount(0);
	expect(await text(xaml)).toBe(
		'<InfoBar\n    IsOpen="True"\n    Title="Title"\n    Message="A long essential app message..." >\n    \n</InfoBar>'
	);

	await pick(page, 1, 0, 'Short');
	await expect(
		bar(page, 1).getByText('A short essential app message.', { exact: true })
	).toBeVisible();
	await expect(message).toHaveCount(0);
	await expect(xaml).toContainText('Message="A short essential app message." >');

	await pick(page, 1, 1, 'Button');
	await expect(bar(page, 1).getByRole('button', { name: 'Action', exact: true })).toBeVisible();
	expect(await text(xaml)).toBe(
		'<InfoBar\n    IsOpen="True"\n    Title="Title"\n    Message="A short essential app message." >\n    <InfoBar.ActionButton>\n            <Button Content="Action" Click="InfoBarButton_Click" />\n    </InfoBar.ActionButton> \n</InfoBar>'
	);

	await pick(page, 1, 1, 'Hyperlink');
	const link = bar(page, 1).getByRole('link', { name: 'Informational link', exact: true });
	await expect(link).toHaveAttribute('href', 'http://www.microsoft.com/');
	await expect(link).toHaveAttribute('target', '_blank');
	await expect(link).toHaveAttribute('rel', 'noreferrer');
	await expect(bar(page, 1).getByRole('button', { name: 'Action' })).toHaveCount(0);
	expect(await text(xaml)).toContain(
		'    <InfoBar.ActionButton>\n            <HyperlinkButton Content="Informational link" NavigateUri="https://www.example.com" />\n    </InfoBar.ActionButton>\n</InfoBar>'
	);

	await pick(page, 1, 0, 'Long');
	await expect(message).toBeVisible();
	await pick(page, 1, 1, 'None');
	await expect(bar(page, 1).getByRole('link')).toHaveCount(0);
	await expect(bar(page, 1).getByRole('button')).toHaveCount(1);
	await expect(bar(page, 1).locator('.action')).toHaveCount(0);
	expect(await text(xaml)).toBe(
		'<InfoBar\n    IsOpen="True"\n    Title="Title"\n    Message="A long essential app message..." >\n    \n</InfoBar>'
	);
});

test('the third bar hides its icon and its close button', async ({ page }) => {
	const xaml = await code(page, 2);
	await expect(bar(page, 2)).toHaveAttribute('data-icon-state', 'standard');
	await expect(bar(page, 2).getByRole('button', { name: 'Close' })).toHaveCount(1);
	await expect(xaml).toContainText('IsIconVisible="True"');
	await expect(xaml).toContainText('IsClosable="True"');
	await toggle(page, 2, 'Is Icon Visible');
	await expect(bar(page, 2)).toHaveAttribute('data-icon-state', 'none');
	await expect(xaml).toContainText('IsIconVisible="False"');
	await expect(xaml).toContainText('IsClosable="True"');
	await toggle(page, 2, 'Is Closable');
	await expect(bar(page, 2).getByRole('button', { name: 'Close' })).toHaveCount(0);
	await expect(xaml).toContainText('IsClosable="False"');
	await expect(bar(page, 2)).toBeVisible();
	await toggle(page, 2, 'Is Icon Visible');
	await expect(bar(page, 2)).toHaveAttribute('data-icon-state', 'standard');
	await expect(xaml).toContainText('IsIconVisible="True"');
});
