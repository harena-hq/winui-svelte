import { expect } from '@playwright/test';
import { test } from './fixtures';

/**
 * A ComboBox header breaks inside a word too wide for its line, as `TextWrapping="Wrap"`
 * (`ComboBox_themeresources.xaml:569`) does. Measured on the reference, the Gallery's TabView
 * page (`TabViewPage.xaml:286-294`): the header "TabViewItem CloseButtonOverlayMode" over a
 * ComboBox 150 wide ran three lines 20 apart, "TabViewItem", "CloseButtonOverlayMo" and "de".
 */
test('a header word wider than the box breaks inside it, in lines 20 apart', async ({ page }) => {
	await page.goto('/dev/combo-box-header');
	const header = page.locator('#narrow .header');
	const lines = await header.evaluate((el) => {
		const range = document.createRange();
		const rows = new Map<number, string>();
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		for (
			let node = walker.nextNode() as Text | null;
			node;
			node = walker.nextNode() as Text | null
		) {
			for (let i = 0; i < node.length; i++) {
				if (!node.data[i].trim()) continue;
				range.setStart(node, i);
				range.setEnd(node, i + 1);
				const top = Math.round(range.getBoundingClientRect().top);
				rows.set(top, (rows.get(top) ?? '') + node.data[i]);
			}
		}
		return [...rows.entries()].map(([top, text]) => ({ top, text }));
	});
	expect(lines.map((l) => l.text)).toEqual(['TabViewItem', 'CloseButtonOverlayMo', 'de']);
	expect(lines[1].top - lines[0].top).toBe(20);
	expect(lines[2].top - lines[1].top).toBe(20);
	// Nothing reaches past the box.
	const overflow = await header.evaluate((el) => el.scrollWidth - el.clientWidth);
	expect(overflow).toBeLessThanOrEqual(0);
});
