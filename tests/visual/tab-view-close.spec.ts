import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

/**
 * Closing the selected tab selects the closest one — `TabView::OnItemsChanged`
 * (`TabView.cpp:780-815`): the tab now at the removed one's index, or the last if it was the
 * last, and from there the first enabled tab forward, wrapping. A selection naming no tab is
 * upstream's `SelectedIndex` of -1, which any removal answers the same way, from the removed
 * index (`:786`).
 *
 * Pressed on the reference on 2026-10-14, the Gallery's first TabView sample: with Document 1
 * selected, closing it selected Document 2; closing Document 2, now selected and last, selected
 * Document 0.
 *
 * Removing the tab that holds focus moves it to the first enabled tab after it, else the first
 * before it searching backwards, else the add button (`TabView::RequestCloseTab`,
 * `TabView.cpp:1017-1101`, searches at `:1048-1070`, fallback at `:1079-1082`). Here any removal
 * counts, not only a close request; focus outside the removed tab stays put.
 *
 * The strip's Tab stop is an enabled tab even when the selection names none or the first tab is
 * disabled.
 */

const strip = (page: Page, name: string) => page.locator(`#${name}`);
// A tab's own name takes its close button's in too ("Document 2 Close"), so tabs are found by
// their label's text.
const tab = (page: Page, name: string, id: string) =>
	strip(page, name)
		.locator('[role=tab]')
		.filter({ hasText: new RegExp(`Document ${id.slice(4)}(?!\\d)`) });
const selectedTabs = (page: Page, name: string) =>
	strip(page, name)
		.locator('[role=tab][aria-selected=true]')
		.evaluateAll((tabs) => tabs.map((t) => t.textContent!.match(/Document \d+/)![0]));
const reported = (page: Page, name: string) => strip(page, name).locator('output');
const close = (page: Page, name: string, id: string) =>
	tab(page, name, id).locator('button.close').click({ force: true });

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/tab-view-close');
});

test('Tab reaches a tab when the selection names none', async ({ page }) => {
	await page.locator('#select-none').click();
	await page.locator('#close-and-pick').focus();
	await page.keyboard.press('Tab');
	await expect(tab(page, 'bound', 'doc-0')).toBeFocused();
});

test('Tab skips a disabled first tab, and the arrows walk from where it lands', async ({
	page
}) => {
	await strip(page, 'lone').getByRole('button', { name: 'Add New Tab' }).focus();
	await page.keyboard.press('Tab');
	await expect(tab(page, 'first-off', 'doc-1')).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(tab(page, 'first-off', 'doc-1').locator('button.close')).toBeFocused();
});

test.describe('focus after removing a tab', () => {
	test('closing the focused tab focuses the next enabled tab', async ({ page }) => {
		await tab(page, 'bound', 'doc-2').click();
		await page.keyboard.press('Control+F4');
		await expect(tab(page, 'bound', 'doc-2')).toHaveCount(0);
		await expect(tab(page, 'bound', 'doc-3')).toBeFocused();
	});

	test('closing the focused last tab focuses the previous enabled tab', async ({ page }) => {
		await tab(page, 'bound', 'doc-4').click();
		await page.keyboard.press('Control+F4');
		await expect(tab(page, 'bound', 'doc-4')).toHaveCount(0);
		await expect(tab(page, 'bound', 'doc-3')).toBeFocused();
	});

	test('closing the focused tab skips disabled neighbours in both directions', async ({ page }) => {
		await tab(page, 'skip', 'doc-2').click();
		await page.keyboard.press('Control+F4');
		await expect(tab(page, 'skip', 'doc-2')).toHaveCount(0);
		await expect(tab(page, 'skip', 'doc-0')).toBeFocused();
	});

	test('closing the focused tab with none enabled left focuses the add button', async ({
		page
	}) => {
		await tab(page, 'lone', 'doc-0').click();
		await page.keyboard.press('Control+F4');
		await expect(tab(page, 'lone', 'doc-0')).toHaveCount(0);
		await expect(strip(page, 'lone').getByRole('button', { name: 'Add New Tab' })).toBeFocused();
	});

	test('removing tabs from an outside button keeps focus on that button', async ({ page }) => {
		const button = page.locator('#close-two');
		await button.focus();
		await page.keyboard.press('Enter');
		await expect(tab(page, 'bound', 'doc-0')).toHaveCount(0);
		await expect(tab(page, 'bound', 'doc-1')).toHaveCount(0);
		await expect(button).toBeFocused();
	});
});

test('closing the selected tab selects the one now at its index, and reports it', async ({
	page
}) => {
	await tab(page, 'bound', 'doc-1').click();
	await close(page, 'bound', 'doc-1');
	await expect.poll(() => selectedTabs(page, 'bound')).toEqual(['Document 2']);
	await expect(reported(page, 'bound')).toHaveText('doc-1 doc-2');
	// The panel follows: it is labelled by the tab now selected.
	const labelledBy = await strip(page, 'bound')
		.getByRole('tabpanel')
		.getAttribute('aria-labelledby');
	expect(await tab(page, 'bound', 'doc-2').getAttribute('id')).toBe(labelledBy);
});

test('closing the selected last tab selects the new last', async ({ page }) => {
	await tab(page, 'bound', 'doc-4').click();
	await close(page, 'bound', 'doc-4');
	await expect.poll(() => selectedTabs(page, 'bound')).toEqual(['Document 3']);
	await expect(reported(page, 'bound')).toHaveText('doc-4 doc-3');
});

test('closing a tab that is not selected leaves the selection and reports nothing', async ({
	page
}) => {
	await close(page, 'bound', 'doc-2');
	await expect(tab(page, 'bound', 'doc-2')).toHaveCount(0);
	expect(await selectedTabs(page, 'bound')).toEqual(['Document 0']);
	await expect(reported(page, 'bound')).toHaveText('');
});

test('closing a tab before the selected one, then the selected, starts from where it now is', async ({
	page
}) => {
	await tab(page, 'bound', 'doc-2').click();
	await close(page, 'bound', 'doc-0');
	await expect(tab(page, 'bound', 'doc-0')).toHaveCount(0);
	expect(await selectedTabs(page, 'bound')).toEqual(['Document 2']);
	// Document 2 is now at index 1, so the tab now there is Document 3; its index before the
	// first close, 2, would give Document 4.
	await close(page, 'bound', 'doc-2');
	await expect.poll(() => selectedTabs(page, 'bound')).toEqual(['Document 3']);
	await expect(reported(page, 'bound')).toHaveText('doc-2 doc-3');
});

test('two tabs removed at once start from the tabs kept before the selected one', async ({
	page
}) => {
	// One at a time, either order gives Document 2: removing 0 then 1 starts at index 0, and
	// removing 1 then 0 selects 2 and keeps it. The selected tab's old index, 1, would give 3.
	await tab(page, 'bound', 'doc-1').click();
	await page.locator('#close-two').click();
	await expect.poll(() => selectedTabs(page, 'bound')).toEqual(['Document 2']);
	await expect(reported(page, 'bound')).toHaveText('doc-1 doc-2');
});

test('a selection naming no tab is answered by any removal, from the removed index', async ({
	page
}) => {
	await page.locator('#select-none').click();
	await expect.poll(() => selectedTabs(page, 'bound')).toEqual([]);
	await close(page, 'bound', 'doc-2');
	await expect(tab(page, 'bound', 'doc-2')).toHaveCount(0);
	await expect.poll(() => selectedTabs(page, 'bound')).toEqual(['Document 3']);
	await expect(reported(page, 'bound')).toHaveText('doc-3');
});

test('with no selection given, closing another tab leaves the first shown and reports nothing', async ({
	page
}) => {
	await close(page, 'free', 'doc-1');
	await expect(tab(page, 'free', 'doc-1')).toHaveCount(0);
	expect(await selectedTabs(page, 'free')).toEqual(['Document 0']);
	await expect(reported(page, 'free')).toHaveText('');
});

test('closing the only tab leaves none, and reports nothing for it', async ({ page }) => {
	await close(page, 'free', 'doc-0');
	await close(page, 'free', 'doc-1');
	await close(page, 'free', 'doc-2');
	await expect(strip(page, 'free').locator('[role=tab]')).toHaveCount(0);
	await expect(reported(page, 'free')).toHaveText('doc-1 doc-2');
	await expect(strip(page, 'free').locator('[role=tabpanel]')).toHaveCount(0);
});

test('with no selection given, closing the first tab selects and reports the next', async ({
	page
}) => {
	expect(await selectedTabs(page, 'free')).toEqual(['Document 0']);
	await close(page, 'free', 'doc-0');
	await expect.poll(() => selectedTabs(page, 'free')).toEqual(['Document 1']);
	await expect(reported(page, 'free')).toHaveText('doc-1');
});

test('a disabled tab is passed over going forward, and the search wraps', async ({ page }) => {
	// Documents 1 and 3 are disabled. Closing Document 0 starts at Document 1 and passes to 2.
	await close(page, 'skip', 'doc-0');
	await expect.poll(() => selectedTabs(page, 'skip')).toEqual(['Document 2']);
	// Closing Document 2 starts at Document 3, the last, and wraps past it to Document 1, also
	// disabled, so no tab is left to select.
	await close(page, 'skip', 'doc-2');
	await expect(tab(page, 'skip', 'doc-2')).toHaveCount(0);
	expect(await selectedTabs(page, 'skip')).toEqual([]);
	await expect(reported(page, 'skip')).toHaveText('doc-2');
});

test('closing the selected tab before a disabled last one wraps to the first', async ({ page }) => {
	await tab(page, 'skip', 'doc-2').click();
	await close(page, 'skip', 'doc-2');
	await expect.poll(() => selectedTabs(page, 'skip')).toEqual(['Document 0']);
	await expect(reported(page, 'skip')).toHaveText('doc-2 doc-0');
});

test('a selection the consumer moves in the same change as the removal is kept', async ({
	page
}) => {
	await tab(page, 'bound', 'doc-1').click();
	await page.locator('#close-and-pick').click();
	await expect(tab(page, 'bound', 'doc-1')).toHaveCount(0);
	await expect.poll(() => selectedTabs(page, 'bound')).toEqual(['Document 3']);
	await expect(reported(page, 'bound')).toHaveText('doc-1');
});

test('with no selection given and no enabled tab left, closing the first leaves none selected', async ({
	page
}) => {
	// Document 1 is disabled. A `null` selection would show it as the first tab, so the strip
	// keeps naming the closed one instead.
	await close(page, 'lone', 'doc-0');
	await expect(tab(page, 'lone', 'doc-0')).toHaveCount(0);
	expect(await selectedTabs(page, 'lone')).toEqual([]);
	await expect(reported(page, 'lone')).toHaveText('');
	// No panel is shown: the disabled tab's stays hidden, and the closed one's went with its tab.
	await expect(strip(page, 'lone').locator('[role=tabpanel]')).toHaveCount(1);
	await expect(strip(page, 'lone').locator('[role=tabpanel]')).toHaveAttribute('hidden');
});
