import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

/**
 * `onTabKeyDown`: each tab's KeyDown, reported by id before the strip's own handling, for a key
 * pressed on the tab or on its close button. A handler that prevents the key takes it, and the
 * strip does nothing with it.
 *
 * The route's strip holds Overview (`k-1`) and Third (`k-3`), neither closable, and Second
 * (`k-2`), closable, with Overview selected and no add button; its footer holds the consumer's
 * `New tab` button. The handler takes Right on Third to focus `New tab`, Left on Overview to stop
 * there, Left on a close button, Delete on a closable tab to close it, and Enter on Third to
 * refuse it, and logs every key reported as `id:key`. Fourth is disabled and closable, so a Delete
 * reported on it would close it.
 */

const strip = (page: Page) => page.getByTestId('keys');
// A tab's own name takes its close button's in too ("Second Close Tab").
const tab = (page: Page, name: string) => strip(page).getByRole('tab', { name });

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/tab-view-keys');
});

/**
 * Third is the last element of the ring, so Right would wrap to Overview; prevented, it goes to
 * the consumer's button instead.
 */
test("a prevented ArrowRight on the last tab goes to the consumer's button", async ({ page }) => {
	await tab(page, 'Third').focus();
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('button', { name: 'New tab' })).toBeFocused();
	await expect(tab(page, 'Overview')).not.toBeFocused();
});

/**
 * Left on Overview would wrap to Third; prevented, focus stays on Overview, and the key still
 * propagates to the TabView's root, whose own `onkeydown` sees it.
 */
test('a prevented ArrowLeft on the first tab stops there', async ({ page }) => {
	await tab(page, 'Overview').focus();
	await page.keyboard.press('ArrowLeft');
	await expect(tab(page, 'Overview')).toBeFocused();
	await expect(page.getByTestId('root')).toHaveText('ArrowLeft');
});

/**
 * A key the handler does not take keeps the strip's behaviour, and one pressed on a close button
 * is reported with its tab's id: Right walks Overview, Second, Second's close button, Third.
 */
test('keys the handler does not take keep the strip behaviour', async ({ page }) => {
	await tab(page, 'Overview').focus();
	await page.keyboard.press('ArrowRight');
	await expect(tab(page, 'Second')).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(tab(page, 'Second').locator('button.close')).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(tab(page, 'Third')).toBeFocused();
	await expect(page.getByTestId('log')).toHaveText('k-1:ArrowRight k-2:ArrowRight k-2:ArrowRight');
});

/**
 * Delete on a focused tab reaches the handler with that tab's id, and the handler closes it; the
 * selection stays on Overview, and focus moves to Third, the next enabled tab.
 */
test('Delete closes the focused tab through the handler', async ({ page }) => {
	await tab(page, 'Second').focus();
	await page.keyboard.press('Delete');
	await expect(page.getByTestId('log')).toHaveText('k-2:Delete');
	await expect(tab(page, 'Second')).toHaveCount(0);
	await expect(tab(page, 'Overview')).toHaveAttribute('aria-selected', 'true');
	await expect(tab(page, 'Third')).toBeFocused();
});

/**
 * A key prevented on a close button is left alone there too: Left from Second's close button would
 * walk to Second, and taken, focus stays on the button; the key still reaches the root.
 */
test('a key prevented on a close button stays there', async ({ page }) => {
	await tab(page, 'Second').locator('button.close').focus();
	await page.keyboard.press('ArrowLeft');
	await expect(tab(page, 'Second').locator('button.close')).toBeFocused();
	await expect(page.getByTestId('log')).toHaveText('k-2:ArrowLeft');
	await expect(page.getByTestId('root')).toHaveText('ArrowLeft');
});

/** A disabled tab reports no key. */
test('a disabled tab reports nothing', async ({ page }) => {
	await tab(page, 'Fourth').focus();
	await page.keyboard.press('Delete');
	await expect(tab(page, 'Fourth')).toHaveCount(1);
	await expect(page.getByTestId('root')).toHaveText('Delete');
	await expect(page.getByTestId('log')).toHaveText('');
});

/**
 * Enter on Third is prevented, so nothing is selected; Enter on Second is not taken, so the strip
 * selects it.
 */
test('a prevented Enter selects nothing', async ({ page }) => {
	await tab(page, 'Third').focus();
	await page.keyboard.press('Enter');
	await expect(tab(page, 'Third')).toHaveAttribute('aria-selected', 'false');
	await expect(tab(page, 'Overview')).toHaveAttribute('aria-selected', 'true');
	await tab(page, 'Second').focus();
	await page.keyboard.press('Enter');
	await expect(tab(page, 'Second')).toHaveAttribute('aria-selected', 'true');
});
