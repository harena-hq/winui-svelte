/**
 * A Windows contrast theme is the high-contrast theme: ADR 0005. `emulateMedia` is this page's
 * alone, so the reference guest's own theme is not touched. A consumer's trial found the defect
 * under a real contrast theme and saw the same computed values under this emulation.
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const SYSTEM_COLORS = {
	WindowColor: 'Canvas',
	WindowTextColor: 'CanvasText',
	ButtonFaceColor: 'ButtonFace',
	ButtonTextColor: 'ButtonText',
	GrayTextColor: 'GrayText',
	HighlightColor: 'Highlight',
	HighlightTextColor: 'HighlightText',
	HotlightColor: 'LinkText'
};

const system = (page: Page, keyword: string) =>
	page.evaluate((colour) => {
		const probe = document.createElement('div');
		probe.style.color = colour;
		document.body.append(probe);
		const value = getComputedStyle(probe).color;
		probe.remove();
		return value;
	}, keyword);

// Short of the scrollbar's 15 columns, which the guest's Edge draws in each drawing's own colours.
const CONTROLS = { x: 0, y: 0, width: 1265, height: 720 };

/** The page as a contrast theme forces it, and as the high-contrast theme draws it from the same
 *  eight colours, which is what the three-theme baselines photograph. */
async function bothDrawings(page: Page, route: string) {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.goto(route);
	await page.waitForTimeout(250);
	const forced = await page.screenshot({ animations: 'disabled', clip: CONTROLS });
	const colours = await page.evaluate((keywords) => {
		const probe = document.createElement('div');
		document.body.append(probe);
		const read = Object.entries(keywords).map(([key, keyword]) => {
			probe.style.color = keyword;
			return [key, getComputedStyle(probe).color];
		});
		probe.remove();
		return read;
	}, SYSTEM_COLORS);

	await page.emulateMedia({ forcedColors: 'none' });
	await page.evaluate((read) => {
		localStorage.setItem('winui-svelte:theme', 'high-contrast');
		const root = document.documentElement;
		root.dataset.theme = 'high-contrast';
		for (const [key, value] of read) root.style.setProperty(`--winui-SystemColor${key}`, value);
	}, colours);
	await page.waitForTimeout(250);
	const themed = await page.screenshot({ animations: 'disabled', clip: CONTROLS });
	return { forced, themed };
}

for (const route of [
	'toggle-switch',
	'toggle-switch-compact',
	'button',
	'info-bar',
	'combo-box',
	'color-picker',
	'expander',
	'text-box',
	'tab-view',
	'navigation-view',
	'menu-flyout',
	'content-dialog',
	'teaching-tip'
]) {
	test(`/dev/${route} draws what the high-contrast theme draws`, async ({ page }) => {
		const { forced, themed } = await bothDrawings(page, `/dev/${route}`);
		expect(forced.equals(themed)).toBe(true);
	});
}

test('the theme is the contrast theme whatever data-theme asks for', async ({ page }) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.goto('/dev/forced-colors');
	const fill = () =>
		page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--winui-ToggleSwitchFillOn')
		);
	const contrast = await fill();
	for (const theme of ['light', 'dark', 'high-contrast']) {
		await page.evaluate((t) => {
			document.documentElement.dataset.theme = t;
		}, theme);
		expect(await fill()).toBe(contrast);
	}
	// The strongest theme scope, which only a dark preference and no `data-theme` reaches.
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.evaluate(() => {
		delete document.documentElement.dataset.theme;
	});
	expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(true);
	expect(await fill()).toBe(contrast);
	await page.emulateMedia({ forcedColors: 'none' });
	expect(await fill()).not.toBe(contrast);
});

test('an on switch draws its track and knob, and an off one its knob', async ({ page }) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.goto('/dev/forced-colors');
	const on = page.locator('.root[data-checked]').first();
	const off = page.locator('.root:not([data-checked]):has(.knob-off)').first();
	const background = (part: ReturnType<Page['locator']>) =>
		part.evaluate((node) => getComputedStyle(node).backgroundColor);
	// ToggleSwitch_themeresources.xaml's HighContrast dictionary: `ToggleSwitchFillOn` and
	// `ToggleSwitchKnobFillOn`, `ToggleSwitchKnobFillOff`.
	expect(await background(on.locator('.on-track'))).toBe(await system(page, 'Highlight'));
	expect(await background(on.locator('.knob-on'))).toBe(await system(page, 'HighlightText'));
	expect(await background(off.locator('.knob-off'))).toBe(await system(page, 'ButtonText'));
});

test('an accent Button is marked, and an InfoBar draws its disc', async ({ page }) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.goto('/dev/button');
	const fill = (part: ReturnType<Page['locator']>) =>
		part.evaluate((node) => getComputedStyle(node).backgroundColor);
	expect(await fill(page.getByRole('button', { name: 'Accent', exact: true }).first())).toBe(
		await system(page, 'Highlight')
	);
	expect(await fill(page.getByRole('button', { name: 'Default', exact: true }).first())).toBe(
		await system(page, 'ButtonFace')
	);
	await page.goto('/dev/info-bar');
	// The disc is a glyph, in `color`.
	expect(
		await page
			.locator('.icon-background')
			.first()
			.evaluate((node) => getComputedStyle(node).color)
	).toBe(await system(page, 'Highlight'));
});

test('the rules keyed on data-theme hold without it', async ({ page }) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.goto('/dev/hyperlink');
	const link = page.getByRole('link').first();
	await link.hover();
	expect(await link.evaluate((node) => getComputedStyle(node).textDecorationLine)).toBe(
		'underline'
	);
	// `UpdateUnderline()` draws only when the style is not None (Hyperlink.cpp:663-671).
	const plain = page.getByTestId('no-underline');
	await plain.hover();
	expect(await plain.evaluate((node) => getComputedStyle(node).textDecorationLine)).toBe('none');
	await page.goto('/dev/color-picker');
	const more = page.locator('.more-button').first();
	expect(
		await more.evaluate((node) =>
			getComputedStyle(node).getPropertyValue('--winui-ToggleButtonForeground').trim()
		)
	).toBe('ButtonText');
});

test("a focus visual is drawn, as the browser's forcing would take it away", async ({ page }) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.goto('/dev/forced-colors');
	await page.keyboard.press('Tab');
	const shadow = await page
		.locator('.root:has(input:focus-visible)')
		.evaluate((node) => getComputedStyle(node, '::before').boxShadow);
	expect(shadow).not.toBe('none');
});

test("a surface's own parts are unforced, and the consumer's layout in it is still forced", async ({
	page
}) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.goto('/dev/forced-colors');
	const adjust = (selector: string) =>
		page.locator(selector).evaluate((node) => getComputedStyle(node).forcedColorAdjust);
	expect(await adjust('.on-track >> nth=0')).toBe('none');
	for (const own of ['scroll-view', 'expander']) {
		expect(await adjust(`[data-own='${own}']`)).toBe('auto');
		const colour = await page
			.locator(`[data-own='${own}']`)
			.evaluate((node) => getComputedStyle(node).color);
		expect(colour).not.toBe('rgb(200, 0, 0)');
	}
});

test('a portalled surface is unforced too, and what it holds is forced', async ({ page }) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.goto('/dev/content-dialog-describe');
	const adjust = (locator: ReturnType<Page['locator']>) =>
		locator.evaluate((node) => getComputedStyle(node).forcedColorAdjust);
	await expect(page.getByRole('dialog')).toBeVisible();
	expect(await adjust(page.getByRole('dialog'))).toBe('none');
	expect(await adjust(page.locator('#words'))).toBe('auto');

	await page.goto('/menusandtoolbars/menuflyout');
	await page
		.locator('[data-item-page] .example')
		.first()
		.getByRole('button', { name: 'Sort', exact: true })
		.click();
	const menu = page.getByRole('menu').first();
	await expect(menu).toBeVisible();
	expect(await adjust(menu)).toBe('none');
	expect(await adjust(menu.getByRole('menuitem').first())).toBe('none');
});
