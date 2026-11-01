/**
 * A page's own text styles stop at a control: ADR 0021. The Gallery's window carries a ramp class,
 * which hides the leak, so the rule here is put on that wrapper as well as on the body.
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const PAGE_TEXT = `html, body, .window, .dev {
	font-family: Probe;
	font-size: 23px;
	font-weight: 800;
	line-height: 3;
}`;

/** Each route's control-owned text, which must not change under `PAGE_TEXT`. */
const CONTROLS: Record<string, string[]> = {
	'text-box': ['input', 'textarea', 'span.header', 'span.description'],
	'password-box': ['input', 'span.header', 'span.description'],
	'number-box': ['input.input', 'span.header', 'span.description'],
	'navigation-view': ['span.icon', 'span.content-presenter', 'span.content'],
	'pull-to-refresh': ['span.glyph'],
	'tree-view': ['span.chevron'],
	'item-container': ['div.checkbox'],
	'info-bar': ['.standard-icon-area > span'],
	'breadcrumb-bar': ['.chevron'],
	'tab-view': ['span.icon'],
	'title-bar': ['span.icon'],
	'tool-tip': ['div.popup'],
	'date-picker': ['span.month', 'span.day', 'span.year'],
	'time-picker': ['span.field'],
	'calendar-date-picker': ['span.date-text'],
	'calendar-view': ['span.main', 'span.label'],
	'color-picker': ['input', 'span.channel-label'],
	'info-badge': ['span.value', 'span.icon'],
	'rating-control': ['span.glyph', 'span.caption']
};

const text = (page: Page, selector: string) =>
	page
		.locator(selector)
		.first()
		.evaluate((node) => {
			const { fontFamily, fontSize, fontWeight, lineHeight } = getComputedStyle(node);
			return { fontFamily, fontSize, fontWeight, lineHeight };
		});

test('the page text reaches an element that is not a control', async ({ page }) => {
	await page.goto('/dev/text-box');
	await page.addStyleTag({ content: PAGE_TEXT });
	await page.evaluate(() => document.body.append(document.createElement('div')));
	expect(await text(page, 'body > div:last-child')).toEqual({
		fontFamily: 'Probe',
		fontSize: '23px',
		fontWeight: '800',
		lineHeight: '69px'
	});
});

for (const [route, selectors] of Object.entries(CONTROLS)) {
	test(`the page text stops at /dev/${route}`, async ({ page }) => {
		await page.goto(`/dev/${route}`);
		const before = await Promise.all(selectors.map((selector) => text(page, selector)));
		await page.addStyleTag({ content: PAGE_TEXT });
		expect((await text(page, '.dev')).fontSize).toBe('23px');
		const after = await Promise.all(selectors.map((selector) => text(page, selector)));
		expect(after).toEqual(before);
	});
}

test('a class on a TextBox still sets its size', async ({ page }) => {
	await page.goto('/dev/text-box');
	await page.addStyleTag({ content: '.big-probe { font-size: 20px; }' });
	await page
		.locator('.root:has(input)')
		.first()
		.evaluate((node) => {
			node.classList.add('big-probe');
		});
	expect((await text(page, '.big-probe input')).fontSize).toBe('20px');
});

test('a class on a NavigationViewItem still sets its size', async ({ page }) => {
	await page.goto('/dev/navigation-view');
	await page.addStyleTag({ content: '.big-probe { font-size: 20px; }' });
	await page
		.locator('li:has(span.content-presenter)')
		.first()
		.evaluate((node) => {
			node.classList.add('big-probe');
		});
	expect((await text(page, '.big-probe span.content-presenter')).fontSize).toBe('20px');
});

test('a MenuBarItem draws the body text, not the browser button font', async ({ page }) => {
	await page.goto('/dev/menu-bar');
	const title = await text(page, 'span.title');
	const body = await page.evaluate(() => {
		const probe = document.createElement('div');
		probe.className = 'winui-BodyTextBlockStyle';
		document.body.append(probe);
		const { fontFamily, fontSize } = getComputedStyle(probe);
		return { fontFamily, fontSize };
	});
	expect({ fontFamily: title.fontFamily, fontSize: title.fontSize }).toEqual(body);
});
