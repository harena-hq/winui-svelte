/**
 * A tab's close button takes its own PointerOver and Pressed fills under a pointer that is over the
 * tab as well: the button's template paints over the tab's setter (TabView.xaml:198, :211, :320).
 */
import { expect, test } from './fixtures';
import type { Locator } from '@playwright/test';

/** What `token` resolves to as a background, read off a probe beside the button. */
const resolved = (close: Locator, token: string) =>
	close.evaluate((node, name) => {
		const probe = document.createElement('div');
		probe.style.background = `var(${name})`;
		node.parentElement!.append(probe);
		const value = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return value;
	}, token);

const fill = (close: Locator) => close.evaluate((node) => getComputedStyle(node).backgroundColor);

for (const [name, index] of [
	['selected', 0],
	['unselected', 1]
] as const) {
	test(`the ${name} tab's close button fills under the pointer and when pressed`, async ({
		page
	}) => {
		await page.goto('/dev/tab-view');
		const close = page.locator('[role=tab]').nth(index).locator('.close');
		await close.hover();
		const over = await resolved(close, '--winui-TabViewItemHeaderCloseButtonBackgroundPointerOver');
		expect(over).not.toBe('rgba(0, 0, 0, 0)');
		await expect.poll(() => fill(close)).toBe(over);

		await page.mouse.down();
		const pressed = await resolved(close, '--winui-TabViewItemHeaderCloseButtonBackgroundPressed');
		await expect.poll(() => fill(close)).toBe(pressed);
		await page.mouse.move(0, 0);
		await page.mouse.up();
	});
}
