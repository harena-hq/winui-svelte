import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes, THEMES } from './themes';

type Page = import('@playwright/test').Page;

/**
 * What the editable ComboBox looks like, as against what it does (combo-box-editable.spec.ts).
 *
 * Measured against the reference Gallery's "Font Size" example in light theme. With focus in the
 * text, upstream's `EditableText` TextBox is what draws: its own border and padding sit inside the
 * ComboBox's grid cell, so the text starts one border plus `ComboBoxEditableTextPadding` from the
 * outer edge, and neither the overlay nor the chevron moves. With focus on the control itself —
 * after Escape while open — the TextBox is still sized and paints its resting background over
 * the Pill, which is why the reference draws that pill at 30%.
 *
 * The pictures are tracked for the Windows lane only; the assertions below them read layout and
 * computed style, and run in either lane.
 */

const ROUTE = '/dev/combo-box-editable';
const font = (page: Page) => page.getByRole('combobox', { name: 'Font Size' });

async function setTheme(page: Page, theme: string) {
	await page.evaluate((t) => {
		localStorage.setItem('winui-svelte:theme', t);
		document.documentElement.dataset.theme = t;
	}, theme);
	await expect
		.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''))
		.toBe(theme);
}

/** A brush token resolved the way a `background` declaration would resolve it. */
function resolved(page: Page, token: string) {
	return page.evaluate((name) => {
		const probe = document.createElement('div');
		probe.style.background = `var(${name})`;
		document.body.append(probe);
		const value = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return value;
	}, token);
}

/** Resolved, and something: a renamed token resolves to transparent, as no rule at all does. */
async function painted(page: Page, token: string) {
	const value = await resolved(page, token);
	expect(value, token).not.toBe('rgba(0, 0, 0, 0)');
	return value;
}

/**
 * The box and eight pixels around it: `HighlightBackground` reaches four outside the box when
 * focus is on the control, and the row's own left edge is the box's, so a capture of the row
 * would cut that ring off on one side.
 */
async function around(page: Page) {
	const box = (await page.getByTestId('font-size').locator('.box').boundingBox())!;
	return { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 };
}

/** Escape while open: focus lands on the control itself, with the list closed. */
async function focusTheControl(page: Page) {
	await font(page).click();
	await page.keyboard.press('ArrowDown');
	await expect(font(page)).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('Escape');
	await expect(font(page)).toHaveAttribute('aria-expanded', 'false');
	// The box's squared corners outlast `aria-expanded`: they follow the popup's side, which
	// clears only once the popup has left the page. A picture taken in between has them.
	await expect(page.getByTestId('font-size').locator('.root')).not.toHaveAttribute(
		'data-popup-side'
	);
	await expect
		.poll(() =>
			page
				.getByTestId('font-size')
				.evaluate((el) => document.activeElement === el.querySelector('.box'))
		)
		.toBe(true);
}

test('ComboBox editable in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ComboBoxEditable', ROUTE);
});

test('ComboBox editable focused, in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	for (const theme of THEMES) {
		await page.goto(ROUTE);
		await setTheme(page, theme);
		await font(page).click();
		await expect(font(page)).toBeFocused();
		await page.mouse.move(0, 0);
		await expect(page).toHaveScreenshot(`ComboBoxEditable-focused-${theme}.png`, {
			clip: await around(page)
		});
	}
});

test('ComboBox editable with focus on the control, in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	for (const theme of THEMES) {
		await page.goto(ROUTE);
		await setTheme(page, theme);
		await focusTheControl(page);
		await page.mouse.move(0, 0);
		await expect(page).toHaveScreenshot(`ComboBoxEditable-control-focused-${theme}.png`, {
			clip: await around(page)
		});
	}
});

// In every theme: high contrast is where the focused border is thicker on the left, and where a
// text box measured with the focused thickness would move.
test('focus moves neither the text nor the overlay', async ({ page }) => {
	const geometry = () =>
		page.getByTestId('font-size').evaluate((el) => {
			const input = el.querySelector('.input') as HTMLInputElement;
			const style = getComputedStyle(input);
			const overlay = (el.querySelector('.overlay') as HTMLElement).getBoundingClientRect();
			return {
				textLeft:
					input.getBoundingClientRect().left +
					parseFloat(style.borderLeftWidth) +
					parseFloat(style.paddingLeft),
				overlay: [overlay.left, overlay.top, overlay.width, overlay.height]
			};
		});
	for (const theme of THEMES) {
		await page.goto(ROUTE);
		await setTheme(page, theme);
		const rest = await geometry();
		await font(page).click();
		await expect(font(page)).toBeFocused();
		expect(await geometry(), `${theme}, text focused`).toEqual(rest);
		await focusTheControl(page);
		expect(await geometry(), `${theme}, control focused`).toEqual(rest);
	}
});

test('the focused ring is the TextBox border, two pixels on every side in high contrast', async ({
	page
}) => {
	await page.goto(ROUTE);
	const ring = () =>
		page.getByTestId('font-size').evaluate((el) => {
			const style = getComputedStyle(el.querySelector('.box') as HTMLElement, '::before');
			return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
		});
	await font(page).click();
	await expect(font(page)).toBeFocused();
	expect(await ring()).toEqual(['1px', '1px', '2px', '1px']);
	await setTheme(page, 'high-contrast');
	expect(await ring()).toEqual(['2px', '2px', '2px', '2px']);
});

test('focus on the control puts the text box background over the pill', async ({ page }) => {
	await page.goto(ROUTE);
	const background = () =>
		page
			.getByTestId('font-size')
			.evaluate(
				(el) => getComputedStyle(el.querySelector('.input') as HTMLElement).backgroundColor
			);
	await font(page).click();
	await expect(font(page)).toBeFocused();
	expect(await background()).toBe('rgba(0, 0, 0, 0)');
	await focusTheControl(page);
	expect(await background()).toBe(await painted(page, '--winui-TextControlBackground'));
});

test('selected text takes the TextBox selection highlight', async ({ page }) => {
	await page.goto(ROUTE);
	const highlight = await font(page).evaluate(
		(el) => getComputedStyle(el, '::selection').backgroundColor
	);
	expect(highlight).toBe(await painted(page, '--winui-TextControlSelectionHighlightColor'));
});

// The faceplate is measured from the cell's edge: `ComboBoxPadding`'s 12 on the left, the text,
// and the 38px glyph column (ComboBox_themeresources.xaml:567). A box with no width of its own
// takes that width from its text, or from its placeholder while it has none.
test('a box with no width of its own fits its text or its placeholder', async ({ page }) => {
	await page.goto(ROUTE);
	const input = page.getByTestId('colours').getByRole('combobox');
	const fits = () =>
		input.evaluate((el: HTMLInputElement) => {
			const context = document.createElement('canvas').getContext('2d')!;
			context.font = getComputedStyle(el).font;
			const shown = el.value === '' ? el.placeholder : el.value;
			const box = el.closest('.box') as HTMLElement;
			return box.getBoundingClientRect().width - (12 + context.measureText(shown).width + 38);
		});
	expect(Math.abs(await fits())).toBeLessThan(1);
	await input.click({ position: { x: 10, y: 10 } });
	await page.keyboard.type('Yellowish');
	await page.keyboard.press('Enter');
	await expect(input).toHaveValue('Yellowish');
	// Unfocused, as the first reading was: focused, upstream measures the TextBox instead, one
	// border wider on each side.
	await page.getByRole('heading', { name: 'ComboBox editable', exact: true }).click();
	await expect(input).not.toBeFocused();
	expect(Math.abs(await fits())).toBeLessThan(1);
});
