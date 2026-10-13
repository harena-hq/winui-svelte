/**
 * The TeachingTip page runs the original's code-behind: each button's Click sets its tip's
 * IsOpen to true (TeachingTipPage.xaml.cs:16-29), so it opens a tip and never closes one. The
 * first and third tips are targeted at their buttons and not light-dismissed; the second is
 * untargeted, light-dismissed, and carries an action and a close button (TeachingTipPage.xaml).
 */
import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

const examples = (page: Page) => page.locator('[data-item-page] .example');
const show = (page: Page, index: number) =>
	examples(page).nth(index).getByRole('button', { name: 'Show TeachingTip' });

// The tips are portalled out of their examples and carry no role, so each is found by the
// primitive's content attribute and what only it carries.
const refreshTip = (page: Page) =>
	page.locator('[data-popover-content]').filter({ has: page.locator('.icon') });
const buttonsTip = (page: Page) =>
	page
		.locator('[data-popover-content]')
		.filter({ has: page.getByRole('button', { name: 'Action button' }) });
const heroTip = (page: Page) =>
	page.locator('[data-popover-content]').filter({ has: page.getByRole('img', { name: 'Sunset' }) });

/** The tip's box once Floating UI has placed it: until then bits-ui parks the wrapper at
 *  `translate(0, -200%)` (use-floating-layer.svelte.js:135), which has a real box. */
async function placed(tip: Locator) {
	let last: { x: number; y: number; width: number; height: number } | null = null;
	await expect
		.poll(async () => {
			const now = await tip.boundingBox();
			const settled = !!now && now.y >= 0 && !!last && now.x === last.x && now.y === last.y;
			last = now;
			return settled;
		})
		.toBe(true);
	const box: { x: number; y: number; width: number; height: number } = last!;
	return box;
}

/** A press held as a hand holds one, longer than the primitive's 10ms light-dismiss debounce
 *  (use-dismissable-layer.svelte.js:150); Playwright's own click lets go at once. */
async function press(page: Page, target: Locator) {
	await target.hover();
	await page.mouse.down();
	await page.waitForTimeout(100);
	await page.mouse.up();
}

/** Long enough for a toggle, had there been one, to have closed the tip. */
const settle = (page: Page) => page.waitForTimeout(300);

test.beforeEach(async ({ page }) => {
	await page.goto('/dialogsandflyouts/teachingtip');
});

test('a targeted tip opens from its button, which never closes it', async ({ page }) => {
	for (const [index, tip] of [
		[0, refreshTip],
		[2, heroTip]
	] as const) {
		await expect(tip(page)).toHaveCount(0);
		await show(page, index).click();
		await expect(tip(page)).toBeVisible();
		// IsOpen = true again: the tip stays open, as it does on the original.
		await press(page, show(page, index));
		await settle(page);
		await expect(tip(page)).toBeVisible();
		await tip(page).getByRole('button', { name: 'Close', exact: true }).click();
		await expect(tip(page)).toHaveCount(0);
		// From the keyboard too: the button's own activation raises the same Click.
		await show(page, index).focus();
		await page.keyboard.press('Enter');
		await expect(tip(page)).toBeVisible();
		await page.keyboard.press('Enter');
		await settle(page);
		await expect(tip(page)).toBeVisible();
		await tip(page).getByRole('button', { name: 'Close', exact: true }).click();
		await expect(tip(page)).toHaveCount(0);
	}
});

test('the first tip shows the Refresh symbol and is not light-dismissed', async ({ page }) => {
	await show(page, 0).click();
	const tip = refreshTip(page);
	await expect(tip).toBeVisible();
	// Symbol.Refresh is E72C.
	expect(await tip.locator('.icon').textContent()).toBe(String.fromCodePoint(0xe72c));
	await expect(tip).toContainText('This is the title');
	await expect(tip).toContainText('And this is the subtitle');
	// The tip points at its button: the card ends above it.
	const card = await placed(tip);
	const button = (await show(page, 0).boundingBox())!;
	expect(card.y + card.height).toBeLessThanOrEqual(button.y);
	await page.mouse.click(1000, 500);
	await settle(page);
	await expect(tip).toBeVisible();
});

test('the Gallery lowers TeachingTipMinWidth, so the first tip is as wide as its text', async ({
	page
}) => {
	// App.xaml:62 sets it to 48 for the whole app; the control's own 320 leaves a 304 card.
	await show(page, 0).click();
	const card = await placed(refreshTip(page));
	expect(card.width).toBeLessThan(304);
});

test('the untargeted tip keeps its action, closes on its close button or a click outside', async ({
	page
}) => {
	const tip = buttonsTip(page);
	await show(page, 1).click();
	await expect(tip).toBeVisible();
	// Untargeted: no tail, centred, and its card's bottom PlacementMargin="20" plus 24 plus the
	// 8px tail track above the window's, as the reference guest measured it.
	await expect(tip.locator('.tail')).toHaveCount(0);
	const card = await placed(tip);
	const { width, height } = await page.evaluate(() => ({
		width: document.documentElement.clientWidth,
		height: document.documentElement.clientHeight
	}));
	expect(Math.abs(height - (card.y + card.height) - 52)).toBeLessThanOrEqual(0.5);
	expect(Math.abs(card.x + card.width / 2 - width / 2)).toBeLessThanOrEqual(0.5);

	// ActionButtonClick has no handler on the page and the tip stays open.
	await tip.getByRole('button', { name: 'Action button' }).click();
	await settle(page);
	await expect(tip).toBeVisible();
	await tip.getByRole('button', { name: 'Close button' }).click();
	await expect(tip).toHaveCount(0);

	// The layer listens for an outside press only from a timer its mount starts
	// (use-dismissable-layer.svelte.js:59), so the press waits for the placed tip.
	await show(page, 1).click();
	await placed(tip);
	await page.mouse.click(1000, 300);
	await expect(tip).toHaveCount(0);

	// A keyboard press on its button raises Click without dismissing it, and Click sets IsOpen
	// to true rather than toggling it, so the tip stays open. The guest's stayed open after an
	// Enter pressed once its button had opened it, though where its focus sat did not show.
	await show(page, 1).click();
	await placed(tip);
	await show(page, 1).focus();
	await page.keyboard.press('Enter');
	await settle(page);
	await expect(tip).toBeVisible();
	await tip.getByRole('button', { name: 'Close button' }).click();
	await expect(tip).toHaveCount(0);

	// The press on its own button dismisses it, and it stays dismissed, as on the original.
	await show(page, 1).click();
	await placed(tip);
	await press(page, show(page, 1));
	await settle(page);
	await expect(tip).toHaveCount(0);
});

test('the hero tip spans its image, sets its description 16 below, and prefers below', async ({
	page
}) => {
	// Tall enough that the tip fits under its button, where PreferredPlacement="Bottom" puts it.
	await page.setViewportSize({ width: 1280, height: 1400 });
	await show(page, 2).click();
	const tip = heroTip(page);
	await expect(tip).toBeVisible();
	const card = await placed(tip);
	const button = (await show(page, 2).boundingBox())!;
	expect(card.y).toBeGreaterThanOrEqual(button.y + button.height);
	// The image stretches across the card, inside its 1px border.
	const image = (await tip.getByRole('img', { name: 'Sunset' }).boundingBox())!;
	expect(image.width).toBeCloseTo(card.width - 2, 0);
	// The TextBlock's Margin="0,16,0,0".
	const subtitle = (await tip
		.getByText('And this is the subtitle', { exact: true })
		.boundingBox())!;
	const description = (await tip
		.getByText('Description can go here', { exact: true })
		.boundingBox())!;
	expect(description.y - (subtitle.y + subtitle.height)).toBeCloseTo(16, 0);
});

test("each example's source pane has its C# tab", async ({ page }) => {
	for (const index of [0, 1, 2]) {
		const source = page.getByRole('button', { name: 'Source code' }).nth(index + 1);
		await source.click();
		const card = source.locator('xpath=ancestor::*[contains(@class,"card")][1]');
		await card.getByRole('option', { name: 'C#' }).click();
		await expect(card.locator('pre')).toContainText(
			`TestButton${index + 1}TeachingTip.IsOpen = true;`
		);
	}
});

test('the hero tip opens above its button where there is no room below', async ({ page }) => {
	// The window is too short for the tip under the third button, so it opens above, as the
	// original's did on the reference guest.
	await page.setViewportSize({ width: 1280, height: 720 });
	await show(page, 2).click();
	const card = await placed(heroTip(page));
	const button = (await show(page, 2).boundingBox())!;
	expect(card.y + card.height).toBeLessThanOrEqual(button.y);
});
