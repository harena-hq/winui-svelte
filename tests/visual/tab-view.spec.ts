import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('TabView in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'TabView', '/dev/tab-view');
});

/**
 * The strip's arrow order runs through the add-tab button and wraps, and Tab re-enters on the tab
 * focus last visited.
 *
 * Pressed on the original (`docs/keyboard.md`, the `TabView` observation): Right from a tab
 * reaches its close button, then the next tab, and from the last close button the add-tab button,
 * and from there the first tab; Left runs the same ring backward, so from the first tab it reaches
 * the add button. No arrow changes the selection. With one tab selected and focus arrowed to
 * another, Tab out to the add button and Shift+Tab back lands on the one arrowed to. The pin's
 * comment states the same order (`TabView.cpp:1439`).
 *
 * The route's first strip, the Gallery's own: three documents, `Document 0` selected.
 */
test('the arrows ring through the add button, and re-entry is the tab last focused', async ({
	page
}) => {
	await page.goto('/dev/tab-view');
	const strip = page.locator('.root:has([role=tablist])').first();
	const tab = (n: number) => strip.getByRole('tab', { name: `Document ${n}` });
	const close = (n: number) => tab(n).getByRole('button', { name: 'Close' });
	const add = strip.getByRole('button', { name: 'Add New Tab' });
	const selected = () => strip.locator('[role=tab][aria-selected=true] .label').innerText();

	await tab(0).focus();
	const ring = [close(0), tab(1), close(1), tab(2), close(2), add, tab(0)];
	for (const [i, next] of ring.entries()) {
		await page.keyboard.press('ArrowRight');
		await expect(next, `Right ${i + 1} from Document 0`).toBeFocused();
	}
	await page.keyboard.press('ArrowLeft');
	await expect(add, 'Left from the first tab').toBeFocused();
	await page.keyboard.press('ArrowLeft');
	await expect(close(2), 'Left from the add button').toBeFocused();
	expect((await selected()).trim(), 'an arrow changed the selection').toBe('Document 0');

	await tab(1).click();
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await expect(tab(2)).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(add, 'Tab from the strip').toBeFocused();
	await page.keyboard.press('Shift+Tab');
	await expect(tab(2), 'Shift+Tab back into the strip').toBeFocused();
	expect((await selected()).trim()).toBe('Document 1');
});
