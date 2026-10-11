/**
 * The Expander page runs the original's bindings and code-behind. Example 1's substitutions
 * follow the Expander's `IsExpanded`, the ComboBox's value and the Expander's
 * `VerticalAlignment` (ExpanderPage.xaml:45-49), and picking `Up` both reverses the direction and
 * aligns the Expander to the bottom, so it grows upwards (ExpanderPage.xaml.cs:15-32). Example 2
 * is 500 wide with no content padding, its header centred and its content left-aligned with a
 * 4px margin (ExpanderPage.xaml:54-64).
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

const examples = (page: Page) => page.locator('[data-item-page] .example');
const firstHeader = (page: Page) =>
	page.getByRole('button', { name: 'This text is in the header' });
const firstContent = (page: Page) => examples(page).nth(0).getByText('This is in the content');

async function box(locator: Locator) {
	const b = await locator.boundingBox();
	if (b === null) throw new Error('no box');
	return b;
}

/** Which side of the header the content is on, once it has finished sliding: `above` when its
 *  bottom is at or over the header's top, `below` when its top is at or under the header's
 *  bottom, and `overlapping` while it is still moving. */
async function side(page: Page) {
	const c = await box(firstContent(page));
	const h = await box(firstHeader(page));
	if (c.y + c.height <= h.y + 0.5) return 'above';
	if (c.y >= h.y + h.height - 0.5) return 'below';
	return 'overlapping';
}

/** The box of an element's text itself, not of the element, which may be a stretched block. */
function ink(locator: Locator) {
	return locator.evaluate((el) => {
		const range = document.createRange();
		range.selectNodeContents(el);
		const r = range.getBoundingClientRect();
		return { x: r.x, y: r.y, width: r.width, height: r.height };
	});
}

async function pick(page: Page, direction: 'Up' | 'Down') {
	await page.locator('[data-item-page] .options button.trigger').click();
	await page.getByRole('option', { name: direction, exact: true }).click();
	await expect(page.locator('[data-item-page] .options button.trigger')).toHaveText(direction);
}

test.beforeEach(async ({ page }) => {
	await page.goto('/layout/expander');
});

test('expanding and collapsing writes IsExpanded', async ({ page }) => {
	const xaml = await code(page, 0);
	await expect(xaml).toContainText('IsExpanded="False"');
	await firstHeader(page).click();
	await expect(firstContent(page)).toBeVisible();
	await expect(xaml).toContainText('IsExpanded="True"');
	await firstHeader(page).click();
	await expect(firstContent(page)).toBeHidden();
	await expect(xaml).toContainText('IsExpanded="False"');
});

test('Down is the start: the content opens below, the Expander at the top', async ({ page }) => {
	const xaml = await code(page, 0);
	await expect(xaml).toContainText('ExpandDirection="Down"');
	await expect(xaml).toContainText('VerticalAlignment="Top"');
	const area = await box(examples(page).nth(0));
	const header = await box(firstHeader(page));
	// The example presenter's 12px padding (ControlExample.xaml:115), and the Expander against
	// its top.
	expect(header.y - area.y).toBeCloseTo(12, 0);
	await firstHeader(page).click();
	// Polled: the content slides in from the header.
	await expect.poll(() => side(page)).toBe('below');
});

test('Up opens the content above and aligns the Expander to the bottom', async ({ page }) => {
	const xaml = await code(page, 0);
	await pick(page, 'Up');
	await expect(xaml).toContainText('ExpandDirection="Up"');
	await expect(xaml).toContainText('VerticalAlignment="Bottom"');
	const area = await box(examples(page).nth(0));
	const header = await box(firstHeader(page));
	// The options column makes the area taller than the Expander, so the two alignments differ.
	expect(area.y + area.height - (header.y + header.height)).toBeCloseTo(12, 0);
	expect(header.y - area.y).toBeGreaterThan(12);
	await firstHeader(page).click();
	await expect.poll(() => side(page)).toBe('above');
	await pick(page, 'Down');
	await expect(xaml).toContainText('ExpandDirection="Down"');
	await expect(xaml).toContainText('VerticalAlignment="Top"');
	await expect.poll(() => side(page)).toBe('below');
});

test('the second Expander is 500 wide, its header centred and its content left', async ({
	page
}) => {
	const header = page.getByRole('button', { name: 'This text is centered' });
	const expander = examples(page).nth(1).locator('> * > *').first();
	expect((await box(expander)).width).toBe(500);
	await header.click();
	const text = examples(page).nth(1).getByText('This text is centered');
	const content = examples(page).nth(1).getByText('And this text is left aligned');
	await expect(content).toBeVisible();
	const e = await box(expander);
	const t = await ink(text);
	const c = await box(content);
	// Centred in the header presenter, which the chevron's column narrows on the right.
	const presenter = await box(expander.locator('.header-content'));
	expect(t.x - e.x).toBeGreaterThan(100);
	expect(Math.abs(t.x + t.width / 2 - (presenter.x + presenter.width / 2))).toBeLessThan(1);
	// Left: the 1px border, no padding, and the TextBlock's own 4px margin.
	expect(c.x - e.x).toBeCloseTo(5, 0);
});
