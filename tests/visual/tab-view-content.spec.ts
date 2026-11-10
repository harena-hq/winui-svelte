import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

/**
 * Every tab's content stays mounted and only the selected one's is shown —
 * `TabView::UpdateTabContent` (`TabView.cpp:964-1015`) swaps which item's `Content` the presenter
 * holds, and each TabViewItem keeps its own. When focus was inside the content being replaced, it
 * moves to the first focusable element of the new content, or to the tab when there is none
 * (`:984-1011`); focus anywhere else stays where it is.
 *
 * The route's one strip: Keep A holds Note A and four buttons, `Next tab` selecting Keep B,
 * `Show C` selecting Keep C, `Show C, focus outside` selecting Keep C and focusing the Outside
 * input in a consumer effect, and `Close this tab` removing Keep A; Keep B holds Note B, Keep C
 * only a paragraph, and Keep D has no content. `Select C` and the Outside input sit outside the
 * strip. Keep C's tab takes the id `keep-tab-c` rather than a derived one, so its panel's label
 * and the move of focus to it are read through the item's `tabId`.
 */

const strip = (page: Page) => page.getByTestId('keep');
// A tab's own name takes its close button's in too ("Keep A Close Tab").
const tab = (page: Page, name: string) => strip(page).getByRole('tab', { name });
const note = (page: Page, name: string) => strip(page).getByRole('textbox', { name });

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/tab-view-content');
});

/** Switching away unmounts nothing: what was typed into Note A is still there coming back. */
test('text typed into one tab survives switching to another and back', async ({ page }) => {
	await note(page, 'Note A').fill('kept');
	await tab(page, 'Keep B').click();
	await expect(note(page, 'Note B')).toBeVisible();
	await tab(page, 'Keep A').click();
	await expect(note(page, 'Note A')).toHaveValue('kept');
});

/**
 * Only the selected tab's panel is shown, and each tab controls its own panel, which is labelled
 * by that tab.
 */
test("only the selected tab's panel is shown, and each tab names its own", async ({ page }) => {
	await expect(strip(page).getByRole('tabpanel')).toHaveCount(1);
	await expect(strip(page).locator('[role=tabpanel]:not([hidden])')).toHaveCount(1);
	for (const name of ['Keep A', 'Keep B', 'Keep C']) {
		const t = tab(page, name);
		const controls = await t.getAttribute('aria-controls');
		expect(controls).not.toBeNull();
		await expect(strip(page).locator(`[id="${controls}"]`)).toHaveAttribute(
			'aria-labelledby',
			(await t.getAttribute('id'))!
		);
	}
	await tab(page, 'Keep B').click();
	await expect(strip(page).getByRole('tabpanel')).toHaveCount(1);
	await expect(strip(page).locator('[role=tabpanel]:not([hidden])')).toHaveCount(1);
});

/** Focus inside the content follows the selection to the new content's first focusable element. */
test('focus in the content moves into the new content when the selection changes', async ({
	page
}) => {
	await note(page, 'Note A').focus();
	await strip(page).getByRole('button', { name: 'Next tab' }).click();
	await expect(tab(page, 'Keep B')).toHaveAttribute('aria-selected', 'true');
	await expect(note(page, 'Note B')).toBeFocused();
});

/**
 * Focus outside the content does not move: from a tab, Enter selects Keep B, whose content has a
 * note to focus, and focus stays on the tab; and from the `Select C` button outside the strip,
 * focus stays on the button.
 */
test('focus outside the content stays where it is when the selection changes', async ({ page }) => {
	await note(page, 'Note A').focus();
	await page.keyboard.press('Shift+Tab');
	await expect(tab(page, 'Keep A')).toBeFocused();
	// Right reaches Keep A's close button, then Keep B.
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await expect(tab(page, 'Keep B')).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(tab(page, 'Keep B')).toHaveAttribute('aria-selected', 'true');
	await expect(tab(page, 'Keep B')).toBeFocused();
	await expect(note(page, 'Note B')).not.toBeFocused();

	await tab(page, 'Keep A').click();
	await note(page, 'Note A').focus();
	const selectC = page.getByRole('button', { name: 'Select C' });
	await selectC.click();
	await expect(tab(page, 'Keep C')).toHaveAttribute('aria-selected', 'true');
	await expect(selectC).toBeFocused();
});

/**
 * A click on a tab takes focus to that tab before it selects, so focus is no longer in the
 * content and stays on the tab, as the new content is shown.
 */
test('clicking a tab with the mouse leaves focus on the clicked tab', async ({ page }) => {
	await note(page, 'Note A').focus();
	await tab(page, 'Keep B').click();
	await expect(tab(page, 'Keep B')).toHaveAttribute('aria-selected', 'true');
	await expect(tab(page, 'Keep B')).toBeFocused();
	await expect(note(page, 'Note B')).not.toBeFocused();
});

/** With nothing focusable in the new content, focus from the old content goes to the new tab. */
test('focus in the content goes to the tab when the new content has nothing to focus', async ({
	page
}) => {
	await strip(page).getByRole('button', { name: 'Show C', exact: true }).click();
	await expect(tab(page, 'Keep C')).toHaveAttribute('aria-selected', 'true');
	await expect(tab(page, 'Keep C')).toBeFocused();
});

test('a consumer that moves focus in the same selection change keeps it', async ({ page }) => {
	const showC = strip(page).getByRole('button', { name: 'Show C, focus outside' });
	await showC.focus();
	await showC.press('Enter');
	await expect(tab(page, 'Keep C')).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('textbox', { name: 'Outside' })).toBeFocused();
});

/**
 * A removal that moves the selection carries focus too: closing Keep A from inside its own content
 * selects Keep B, the tab now at its index (`TabView.cpp:780-815`), and focus lands in Note B.
 */
test('focus in removed content moves into the content the selection moves to', async ({ page }) => {
	await strip(page).getByRole('button', { name: 'Close this tab' }).click();
	await expect(tab(page, 'Keep A')).toHaveCount(0);
	await expect(tab(page, 'Keep B')).toHaveAttribute('aria-selected', 'true');
	await expect(note(page, 'Note B')).toBeFocused();
});

/** A tab without content controls no panel, and selecting it shows none. */
test('a tab without content controls no panel and shows none', async ({ page }) => {
	await expect(tab(page, 'Keep D')).not.toHaveAttribute('aria-controls');
	await tab(page, 'Keep D').click();
	await expect(tab(page, 'Keep D')).toHaveAttribute('aria-selected', 'true');
	await expect(strip(page).locator('[role=tabpanel]')).toHaveCount(3);
	await expect(strip(page).locator('[role=tabpanel]:not([hidden])')).toHaveCount(0);
});
