/**
 * The ToolTip page's code-behind only initializes it (ToolTipPage.xaml.cs:8-15); what the page
 * carries is three tooltips declared in its XAML (ToolTipPage.xaml:24-52). A Button's, a
 * TextBlock's at the default place, and an Image's on its right; the TextBlock's VerticalOffset
 * and the Image's PlacementRect are owed in docs/library-gate.md's ToolTip row.
 */
import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

const examples = (page: Page) => page.locator('[data-item-page] .example');
const popup = (page: Page, text: string) =>
	page.locator('[data-tooltip-content]').filter({ hasText: text });

/** Moves the pointer onto `target` and rests it there; the 800ms show delay passes while the
 *  assertion that follows waits. */
async function hover(page: Page, target: Locator) {
	await target.scrollIntoViewIfNeeded();
	const box = (await target.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2 - 10, box.y + box.height / 2);
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

/** The popup's box once Floating UI has placed it: until then bits-ui parks the wrapper at
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
	await page.goto('/statusandinfo/tooltip');
});

test('the button raises its simple tooltip', async ({ page }) => {
	const button = examples(page)
		.nth(0)
		.getByRole('button', { name: 'Button with a simple ToolTip.' });
	await expect(popup(page, 'Simple ToolTip')).toHaveCount(0);
	await hover(page, button);
	await expect(popup(page, 'Simple ToolTip')).toBeVisible();
	await expect(popup(page, 'Simple ToolTip')).toHaveText('Simple ToolTip');
});

test('the TextBlock raises its tooltip, and is no tab stop', async ({ page }) => {
	const text = examples(page).nth(1).getByText('TextBlock with an offset ToolTip.', {
		exact: true
	});
	await hover(page, text);
	await expect(popup(page, 'Offset ToolTip.')).toBeVisible();
	await expect(text).not.toHaveAttribute('tabindex');
	await expect(text).not.toHaveAttribute('type');
	await expect(text).not.toHaveAttribute('disabled');
});

test("the Image's tooltip sits on its right, described, and the Image is no tab stop", async ({
	page
}) => {
	const image = examples(page).nth(2).locator('img');
	await expect(image).toHaveAttribute('src', '/cliff.jpg');
	await image.scrollIntoViewIfNeeded();
	const box = (await image.boundingBox())!;
	// Width="400" Height="266".
	expect(box.width).toBe(400);
	expect(box.height).toBe(266);
	await expect(image).not.toHaveAttribute('tabindex');
	await expect(image).not.toHaveAttribute('type');
	await expect(image).not.toHaveAttribute('disabled');

	await hover(page, image);
	const tip = popup(page, 'Non-occluding ToolTip.');
	await expect(tip).toBeVisible();
	await expect(tip).toHaveAttribute('aria-description', 'Non-occluding tooltip');
	// Placement="Right": its left edge clears the Image's right one. The vertical bounds guard
	// this library's centring on the Image; upstream's follows the pointer, which rests at the
	// Image's centre here, so the two cannot be told apart by them.
	const card = await placed(tip);
	expect(card.x).toBeGreaterThanOrEqual(box.x + box.width);
	expect(card.y).toBeGreaterThanOrEqual(box.y);
	expect(card.y + card.height).toBeLessThanOrEqual(box.y + box.height);
});
