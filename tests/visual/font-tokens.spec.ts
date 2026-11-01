/**
 * A consumer replaces the text stacks through tokens, on `:root`: ADR 0021. The fallback keeps
 * Segoe where it is installed, and the three stacks replace it.
 */
import { CDP_ENDPOINT, expect, test } from './fixtures';
import type { Page } from '@playwright/test';

/** Segoe UI Variable's metrics, as ADR 0019 lays them over a system font. */
const SEGOE_METRICS =
	'ascent-override: 107.91015625%; descent-override: 25.09765625%; line-gap-override: 0%;';
const FAMILIES = "local('Arial'), local('Liberation Sans')";

const face = (name: string, src: string, metrics = '') =>
	`@font-face { font-family: '${name}'; src: ${src}; ${metrics} }`;

const family = (page: Page, selector: string) =>
	page
		.locator(selector)
		.first()
		.evaluate((node) => getComputedStyle(node).fontFamily);

test('the fallback comes after Segoe in all three of the ramp stacks', async ({ page }) => {
	await page.goto('/dev/button');
	await page.addStyleTag({ content: ":root { --winui-FallbackFontFamily: 'Probe', sans-serif; }" });
	for (const [ramp, segoe] of [
		['.winui-CaptionTextBlockStyle', 'Small'],
		['.winui-BodyTextBlockStyle', 'Text'],
		['.winui-TitleTextBlockStyle', 'Display']
	]) {
		await page.evaluate((name) => {
			const probe = document.createElement('div');
			probe.className = name;
			document.body.append(probe);
		}, ramp.slice(1));
		expect((await family(page, ramp)).replace(/"/g, "'")).toBe(
			`'Segoe UI Variable ${segoe}', 'Segoe UI', Probe, sans-serif`
		);
	}
});

test('the three stacks replace Segoe, on a Button and on what reads the token', async ({
	page
}) => {
	await page.goto('/dev/button');
	await page.addStyleTag({
		content: `:root {
			--winui-SmallFontFamily: 'Probe';
			--winui-ContentControlThemeFontFamily: 'Probe';
			--winui-DisplayFontFamily: 'Probe';
		}`
	});
	expect(await family(page, '.root.winui-BodyTextBlockStyle')).toBe('Probe');
	expect(await family(page, 'h1.winui-TitleTextBlockStyle')).toBe('Probe');
	await page.evaluate(() => {
		const probe = document.createElement('div');
		probe.className = 'winui-CaptionTextBlockStyle';
		document.body.append(probe);
	});
	expect(await family(page, '.winui-CaptionTextBlockStyle')).toBe('Probe');
	expect(
		await page.evaluate(() =>
			getComputedStyle(document.documentElement)
				.getPropertyValue('--winui-PivotHeaderItemFontFamily')
				.trim()
		)
	).toBe("'Probe'");
});

test('the icon stack is a token too', async ({ page }) => {
	await page.goto('/dev/info-bar');
	await page.addStyleTag({ content: ":root { --winui-SymbolThemeFontFamily: 'Probe'; }" });
	expect(await family(page, '.standard-icon')).toBe('Probe');
});

test("a font keeps a Button's height when it carries Segoe's line metrics", async ({ page }) => {
	await page.goto('/dev/button');
	const height = async () => {
		const box = await page
			.getByRole('button', { name: 'Default', exact: true })
			.first()
			.boundingBox();
		return box!.height;
	};
	expect(await height()).toBe(32);
	await page.addStyleTag({
		content: `${face('Bare', FAMILIES)}
			:root { --winui-ContentControlThemeFontFamily: 'Bare'; }`
	});
	await page.evaluate(() => document.fonts.load("14px 'Bare'"));
	// A control's height is its font's line: ADR 0011. This is what the metrics are there to stop.
	expect(await height()).not.toBe(32);
	await page.addStyleTag({
		content: `${face('Laid', FAMILIES, SEGOE_METRICS)}
			:root { --winui-ContentControlThemeFontFamily: 'Laid'; }`
	});
	await page.evaluate(() => document.fonts.load("14px 'Laid'"));
	expect(await height()).toBe(32);
});

test('a fallback draws what Segoe has no glyph for: all of it without Segoe', async ({ page }) => {
	await page.goto('/dev/button');
	const button = page.locator('[data-probe]');
	await page
		.getByRole('button', { name: 'Default', exact: true })
		.first()
		.evaluate((node) => node.setAttribute('data-probe', ''));
	const width = async (text: string) => {
		await button.evaluate((node, words) => {
			node.textContent = words;
		}, text);
		return button.evaluate((node) => {
			const range = document.createRange();
			range.selectNodeContents(node);
			return range.getBoundingClientRect().width;
		});
	};
	const latin = await width('Latin');
	const hangul = await width('한글');
	// Twice the size is what tells this face's text from any other.
	const src = CDP_ENDPOINT ? "local('Malgun Gothic'), local('Arial')" : FAMILIES;
	await page.addStyleTag({
		content: `@font-face { font-family: 'Big'; src: ${src}; size-adjust: 200%; }
			:root { --winui-FallbackFontFamily: 'Big', sans-serif; }`
	});
	await page.evaluate(() => document.fonts.load("14px 'Big'", 'Latin한글'));
	if (CDP_ENDPOINT) {
		expect(await width('Latin')).toBe(latin);
		expect(await width('한글')).toBeGreaterThan(hangul * 1.5);
	} else {
		expect(await width('Latin')).toBeGreaterThan(latin * 1.5);
	}
});

for (const [route, part] of [
	['text-box', 'input'],
	['password-box', 'input'],
	['number-box', 'input'],
	['navigation-view', '.item'],
	['navigation-view', '#top-content .item']
]) {
	test(`/dev/${route} ${part} reads the token under a page with no ramp class`, async ({
		page
	}) => {
		await page.goto(`/dev/${route}`);
		await page.addStyleTag({
			content: ":root { --winui-ContentControlThemeFontFamily: 'Probe'; }"
		});
		await page.evaluate(() => {
			document.querySelector('.window')?.classList.remove('winui-BodyTextBlockStyle');
		});
		// The precondition: nothing else above it carries a ramp class.
		expect(
			await page
				.locator(part)
				.first()
				.evaluate((node) => node.closest('[class*="TextBlockStyle"]') === null)
		).toBe(true);
		expect(await family(page, part)).toBe('Probe');
	});
}

for (const [route, root, part] of [
	['text-box', '.root:has(input)', 'input'],
	['password-box', '.root:has(input)', 'input'],
	['number-box', '.root:has(input)', 'input'],
	['navigation-view', 'li:has(.item)', '.item']
]) {
	test(`/dev/${route}: a class on the control's root still sets its font`, async ({ page }) => {
		await page.goto(`/dev/${route}`);
		await page.addStyleTag({ content: ".own-font { font-family: 'Own'; }" });
		await page
			.locator(root)
			.first()
			.evaluate((node) => node.classList.add('own-font'));
		expect(await family(page, `.own-font ${part}`)).toBe('Own');
	});
}
