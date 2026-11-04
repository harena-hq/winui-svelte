/**
 * The back arrow is the first frame of `AnimatedBackVisualSource`, drawn in a 16-pixel box: 12
 * wide and 10.5 tall, where the fallback glyph U+E72B inked 16 by 15 (WD-006).
 */
import { expect, test } from './fixtures';

for (const route of ['navigation-view', 'title-bar']) {
	test(`${route}: the back arrow is the animation's first frame`, async ({ page }) => {
		await page.goto(`/dev/${route}`);
		const arrow = page.locator('.back-button svg').first();
		const box = (await arrow.boundingBox())!;
		expect(box.width).toBe(16);
		expect(box.height).toBe(16);
		const ink = await arrow.locator('g').evaluate((node) => {
			const { x, y, width, height } = node.getBoundingClientRect();
			return { x, y, width, height };
		});
		expect(ink.width).toBeCloseTo(12, 1);
		expect(ink.height).toBeCloseTo(10.5, 1);
		// Centred on the box's (8, 8), as the composition's (24, 24) offset in a 48-unit box is.
		expect(ink.x + ink.width / 2 - box.x).toBeCloseTo(8, 1);
		expect(ink.y + ink.height / 2 - box.y).toBeCloseTo(8, 1);
	});
}
