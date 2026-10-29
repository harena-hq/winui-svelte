/**
 * The Flyout page runs the original's one example and its code-behind: "Empty cart" opens its
 * flyout above it, and "Yes, empty my cart" hides it (FlyoutPage.xaml:30-42,
 * FlyoutPage.xaml.cs:16-22). The flyout is light-dismissed, as every Flyout is.
 */
import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

const trigger = (page: Page) =>
	page.locator('[data-item-page] .example').getByRole('button', { name: 'Empty cart' });
// The flyout is portalled out of its example.
const flyout = (page: Page) =>
	page.locator('[data-popover-content]').filter({ hasText: 'Do you want to continue?' });
const confirm = (page: Page) => flyout(page).getByRole('button', { name: 'Yes, empty my cart' });

/** The flyout's box once Floating UI has placed it: until then bits-ui parks the wrapper at
 *  `translate(0, -200%)` (use-floating-layer.svelte.js:135), which has a real box. */
async function placed(target: Locator) {
	let last: { x: number; y: number; width: number; height: number } | null = null;
	await expect
		.poll(async () => {
			const now = await target.boundingBox();
			const settled = !!now && now.y >= 0 && !!last && now.x === last.x && now.y === last.y;
			last = now;
			return settled;
		})
		.toBe(true);
	const box: { x: number; y: number; width: number; height: number } = last!;
	return box;
}

test.beforeEach(async ({ page }) => {
	await page.goto('/dialogsandflyouts/flyout');
});

test('"Empty cart" opens its flyout above it, centred, the message over the inner button', async ({
	page
}) => {
	await expect(flyout(page)).toHaveCount(0);
	await trigger(page).click();
	const card = await placed(flyout(page));
	const button = (await trigger(page).boundingBox())!;
	// FlyoutBase's default Placement="Top" and its 4px FlyoutMargin, as the guest measured.
	expect(button.y - (card.y + card.height)).toBeCloseTo(4, 0);
	expect(card.x + card.width / 2).toBeCloseTo(button.x + button.width / 2, 0);
	const message = (await flyout(page)
		.getByText('All items will be removed. Do you want to continue?', { exact: true })
		.boundingBox())!;
	const inner = (await confirm(page).boundingBox())!;
	// The TextBlock's Margin="0,0,0,12".
	expect(inner.y - (message.y + message.height)).toBeCloseTo(12, 0);
	await expect(flyout(page).locator('.winui-BaseTextBlockStyle')).toHaveCount(1);
});

test('"Yes, empty my cart" hides the flyout, and the focus returns to "Empty cart"', async ({
	page
}) => {
	await trigger(page).click();
	await placed(flyout(page));
	await confirm(page).click();
	await expect(flyout(page)).toHaveCount(0);
	await expect(trigger(page)).toBeFocused();

	// From the keyboard too, by Space and by Enter: the key opens it with the focus on the inner
	// button, as Space did on the guest, and the same key on that button hides it.
	for (const key of ['Space', 'Enter']) {
		await page.keyboard.press(key);
		await placed(flyout(page));
		await expect(confirm(page)).toBeFocused();
		await page.keyboard.press(key);
		await expect(flyout(page)).toHaveCount(0);
		await expect(trigger(page)).toBeFocused();
	}
});

test('the focus returns in the state the trigger had when the flyout opened', async ({ page }) => {
	const visual = () => trigger(page).evaluate((node) => node.matches(':focus-visible'));
	const close = async (how: () => Promise<void>, drawn: boolean) => {
		await placed(flyout(page));
		await how();
		await expect(flyout(page)).toHaveCount(0);
		await expect(trigger(page)).toBeFocused();
		expect(await visual()).toBe(drawn);
	};

	// A press focused the trigger: a key on the inner button hides the flyout, and the focus
	// comes back with no visual, as it did on the guest. A key on the trigger focused so opens
	// the flyout with the trigger's state unchanged.
	await trigger(page).click();
	await close(() => page.keyboard.press('Enter'), false);
	await page.keyboard.press('Space');
	await close(() => page.keyboard.press('Space'), false);
	// Escape returns it as a key does, with the visual, whatever the trigger had.
	await page.keyboard.press('Space');
	await close(() => page.keyboard.press('Escape'), true);
	// The keyboard focused the trigger: a press on the inner button keeps the visual.
	await page.keyboard.press('Space');
	await close(() => confirm(page).click(), true);
	// A press outside returns it as a press does, with none.
	await page.keyboard.press('Space');
	await close(() => page.mouse.click(1000, 500), false);
	// A press on the trigger the keyboard focused gives it the state a press does, as on the
	// guest's menus.
	await page.keyboard.press('Shift+Tab');
	await page.keyboard.press('Tab');
	expect(await visual()).toBe(true);
	await trigger(page).click();
	await close(() => page.keyboard.press('Enter'), false);
});

test('the flyout is light-dismissed by a press outside and by Escape', async ({ page }) => {
	await trigger(page).click();
	await placed(flyout(page));
	await page.mouse.click(1000, 500);
	await expect(flyout(page)).toHaveCount(0);

	await trigger(page).click();
	await placed(flyout(page));
	await page.keyboard.press('Escape');
	await expect(flyout(page)).toHaveCount(0);
	await expect(trigger(page)).toBeFocused();
});
