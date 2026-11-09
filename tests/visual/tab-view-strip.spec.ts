import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

/**
 * `stripOnly`: the strip without its content region (`TabContentPresenter`, `TabView.xaml:45`),
 * for a consumer that renders and places the panels itself. Each item's `tabId` is its tab's `id`
 * and its `panelId` the tab's `aria-controls`, so the consumer's panels and the tabs name each
 * other, and the strip's keyboard keeps working with ids it did not derive.
 *
 * The route's first strip holds Session 1 to 3, whose tabs are `strip-tab-s-N`; Sessions 1 and 2
 * name their panels `strip-panel-s-N`, and Session 3 carries `content` and no `panelId`, so only
 * `stripOnly` keeps that content out. Below it a notice, then the consumer's panels for four
 * sessions, `s-4` with no tab, each holding `Input s-N`.
 */

const strip = (page: Page) => page.getByTestId('strip');
// A tab's own name takes its close button's in too ("Session 1 Close Tab").
const tab = (page: Page, name: string) => strip(page).getByRole('tab', { name });

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/tab-view-strip');
});

/**
 * The component renders no panel and no content region, and Session 3's `content`, which no
 * `panelId` holds back, is not rendered, so its tab controls nothing.
 */
test('the strip renders no panel and no content region', async ({ page }) => {
	await expect(strip(page).locator('[role=tabpanel]')).toHaveCount(0);
	await expect(strip(page).locator('.content')).toHaveCount(0);
	await expect(page.getByText('Never rendered.')).toHaveCount(0);
	await expect(tab(page, 'Session 3')).not.toHaveAttribute('aria-controls');
});

/**
 * Nothing of the component sits below its strip, and the notice sits between the strip and the
 * shown panel, in document order and on screen.
 */
test('the notice sits between the strip and the panels', async ({ page }) => {
	const stripBox = (await strip(page).boundingBox())!;
	const tabStrip = (await strip(page).locator('.strip').boundingBox())!;
	expect(stripBox.height).toBeCloseTo(tabStrip.height, 1);
	const noticeBox = (await page.getByTestId('notice').boundingBox())!;
	const panelBox = (await page.getByTestId('panel-s-1').boundingBox())!;
	expect(noticeBox.y).toBeGreaterThanOrEqual(stripBox.y + stripBox.height);
	expect(panelBox.y).toBeGreaterThanOrEqual(noticeBox.y + noticeBox.height);
	const order = await page.evaluate(() => {
		const [s, n, p] = ['strip', 'notice', 'panel-s-1'].map((id) =>
			document.querySelector(`[data-testid="${id}"]`)!
		);
		return [
			Boolean(s.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING),
			Boolean(n.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)
		];
	});
	expect(order).toEqual([true, true]);
});

/**
 * Each tab carries its `tabId` as its `id` and its `panelId` as `aria-controls`, and the
 * consumer's panel names that tab in `aria-labelledby`.
 */
test("each tab names the consumer's panel, and the panel names the tab", async ({ page }) => {
	for (const n of [1, 2]) {
		const t = tab(page, `Session ${n}`);
		await expect(t).toHaveAttribute('id', `strip-tab-s-${n}`);
		await expect(t).toHaveAttribute('aria-controls', `strip-panel-s-${n}`);
		await expect(page.getByTestId(`panel-s-${n}`)).toHaveAttribute(
			'aria-labelledby',
			`strip-tab-s-${n}`
		);
	}
});

/** A click moves `aria-selected`, and the bound selection shows the consumer's panel. */
test("selecting with the mouse shows the consumer's panel through the bound selection", async ({
	page
}) => {
	await tab(page, 'Session 2').click();
	await expect(tab(page, 'Session 2')).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByTestId('panel-s-2')).toBeVisible();
	await expect(page.getByTestId('panel-s-1')).toBeHidden();
	await tab(page, 'Session 1').click();
	await expect(page.getByTestId('panel-s-1')).toBeVisible();
});

/**
 * The arrow ring and the strip's one Tab stop work with ids the component did not derive: Right
 * reaches Session 1's close button and then Session 2, and Enter selects it. Arrowed on to Session
 * 3 without selecting it, Tab leaves for the consumer's shown panel, and Shift+Tab returns to the
 * tab last focused, Session 3, not the selected one.
 */
test('the keyboard ring and Tab re-entry work with custom ids', async ({ page }) => {
	await tab(page, 'Session 1').focus();
	await page.keyboard.press('ArrowRight');
	await expect(tab(page, 'Session 1').locator('button.close')).toBeFocused();
	await page.keyboard.press('ArrowRight');
	await expect(tab(page, 'Session 2')).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(tab(page, 'Session 2')).toHaveAttribute('aria-selected', 'true');
	// Arrowed to without selecting, so re-entry can tell the tab last focused from the selected one.
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press('ArrowRight');
	await expect(tab(page, 'Session 3')).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(page.getByRole('textbox', { name: 'Input s-2' })).toBeFocused();
	await page.keyboard.press('Shift+Tab');
	await expect(tab(page, 'Session 3')).toBeFocused();
	await expect(tab(page, 'Session 2')).toHaveAttribute('aria-selected', 'true');
});

/**
 * Without `stripOnly`, an item with a `panelId` gets no panel of the component's own, and the
 * others keep theirs: the second strip's Mixed 1 names the consumer's panel, and only Mixed 2's
 * panel is the component's.
 */
test("an item with a panelId gets no panel of the component's own", async ({ page }) => {
	const mixed = page.getByTestId('mixed');
	await expect(mixed.locator('[role=tabpanel]')).toHaveCount(1);
	await expect(mixed.getByRole('tab', { name: 'Mixed 1' })).toHaveAttribute(
		'aria-controls',
		'mixed-panel-m-1'
	);
	await expect(page.getByText('Mixed 1 content.')).toHaveCount(0);
	const own = await mixed.getByRole('tab', { name: 'Mixed 2' }).getAttribute('aria-controls');
	await expect(mixed.locator('[role=tabpanel]')).toHaveAttribute('id', own!);
});

/**
 * Leaving a component panel for an item whose panel is the consumer's sends focus to that item's
 * tab and not into the consumer's panel: `Show Mixed 1`, inside Mixed 2's panel, selects Mixed 1.
 */
test("focus leaving a component panel for a consumer's panel goes to the tab", async ({ page }) => {
	const mixed = page.getByTestId('mixed');
	await mixed.getByRole('button', { name: 'Show Mixed 1' }).click();
	await expect(mixed.getByRole('tab', { name: 'Mixed 1' })).toHaveAttribute(
		'aria-selected',
		'true'
	);
	await expect(mixed.getByRole('tab', { name: 'Mixed 1' })).toBeFocused();
	await expect(page.getByRole('button', { name: 'Consumer m-1' })).not.toBeFocused();
});
