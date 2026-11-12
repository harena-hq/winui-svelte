import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

/**
 * The ids `TabView` derives from an item's `id` reach `id` attributes and ID reference lists
 * (`aria-controls`, `aria-labelledby`), which split on whitespace. The route's three items are
 * `chat 1` (a space), `chat\t2` (a tab) and `chat%201` (what the first would encode to), so an
 * escaping that leaks a space or collides shows here.
 */

const strip = (page: Page) => page.getByTestId('ids');
// A tab's own name takes its close button's in too ("Chat 1 Close Tab").
const tab = (page: Page, name: RegExp) => strip(page).getByRole('tab', { name });

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/tab-view-ids');
});

/** No derived id holds whitespace: every tab, panel and close button has a single-token id. */
test('no derived id holds whitespace', async ({ page }) => {
	const ids = await strip(page)
		.locator('[role=tab], [role=tabpanel], button.close')
		.evaluateAll((elements) => elements.map((element) => element.id));
	expect(ids.length).toBeGreaterThan(0);
	for (const id of ids) expect(id).toMatch(/^\S+$/);
});

/** Each tab controls its own panel, and that panel is labelled by that tab alone. */
test('each tab controls its own panel and that panel is labelled by it', async ({ page }) => {
	for (const name of [/^Chat 1/, /^Chat 2/, /^Chat 3/]) {
		const t = tab(page, name);
		const controls = await t.getAttribute('aria-controls');
		expect(controls).not.toBeNull();
		expect(controls!.split(/\s+/)).toHaveLength(1);
		const tabId = await t.getAttribute('id');
		expect(tabId).not.toBeNull();
		const panel = await page.evaluate((id) => {
			const element = document.getElementById(id);
			return element
				? {
						role: element.getAttribute('role'),
						labelledby: element.getAttribute('aria-labelledby')
					}
				: null;
		}, controls!);
		expect(panel).not.toBeNull();
		expect(panel!.role).toBe('tabpanel');
		expect(panel!.labelledby).not.toBeNull();
		expect(panel!.labelledby!.split(/\s+/)).toHaveLength(1);
		expect(panel!.labelledby).toBe(tabId);
	}
});

/** The encoding is injective: the three tab ids and the three panel ids are pairwise distinct. */
test('the encoding does not collide', async ({ page }) => {
	const names = [/^Chat 1/, /^Chat 2/, /^Chat 3/];
	const tabIds = await Promise.all(
		names.map(async (name) => (await tab(page, name).getAttribute('id'))!)
	);
	const panelIds = await Promise.all(
		names.map(async (name) => (await tab(page, name).getAttribute('aria-controls'))!)
	);
	expect(new Set(tabIds).size).toBe(3);
	expect(new Set(panelIds).size).toBe(3);
});

/** Selecting Chat 2 by click shows its panel and hides Chat 1's. */
test("selecting by click shows that tab's panel", async ({ page }) => {
	await tab(page, /^Chat 2/).click();
	const panelHolding = (name: string) =>
		strip(page)
			.getByRole('tabpanel')
			.filter({ has: page.getByRole('button', { name }) });
	await expect(panelHolding('Inside 2')).toBeVisible();
	await expect(panelHolding('Inside 1')).toBeHidden();
});

/** Focus inside Chat 1 follows the selection into Chat 3's panel, onto Inside 3. */
test('focus moves into the new panel from the old one', async ({ page }) => {
	await strip(page).getByRole('button', { name: 'Show 3' }).click();
	await expect(strip(page).getByRole('button', { name: 'Inside 3' })).toBeFocused();
});

/** Right walks from the Chat 1 tab to its close button. */
test('Right walks from a tab to its close button', async ({ page }) => {
	const chat1 = tab(page, /^Chat 1/);
	await chat1.focus();
	await page.keyboard.press('ArrowRight');
	await expect(chat1.locator('button.close')).toBeFocused();
});
