import { expect, test } from './fixtures';

const lead = '.content-root > div.winui-BodyTextBlockStyle';
const leadRoutes = [
	'/styles/compactsizing',
	'/motion/easingfunction',
	'/styles/acrylic',
	'/design/typography'
];

test("each page's lead RichTextBlock carries the ramp the inherited record would have supplied", async ({
	page
}) => {
	for (const route of leadRoutes) {
		// A step per route, so a failure names the page. The four assertions are identical and
		// `toHaveCSS` takes no message, so without this "expected 14px, received 16px" says nothing
		// about which of the four lost its class.
		await test.step(route, async () => {
			await page.goto(route);
			const block = page.locator(lead);
			await expect(block).toHaveCount(1);
			// The document root supplies no font, so omitting the class would use browser defaults rather
			// than TextFormatting.cpp:124, :144, :146 and FontAndScriptServices.h:30's 14/Normal/
			// XamlAutoFontFamily inherited record.
			await expect(block).toHaveCSS('font-size', '14px');
			await expect(block).toHaveCSS('font-weight', '400');
			expect(await block.evaluate((element) => getComputedStyle(element).fontFamily)).toContain(
				'Segoe UI Variable Text'
			);
		});
	}
});

test('the compact sizing list puts every line at the same left edge', async ({ page }) => {
	await page.goto('/styles/compactsizing');
	const block = page.locator(lead);
	await expect(block).toHaveCount(1);
	// Eleven Runs, eleven spans, and every one of them starts its own line. A stray template space
	// after a <LineBreak /> moves the span after it — previously measured at 3.84px of indent, which
	// is why LineBreak.svelte puts the compensation box on the block rather than beside the break,
	// where a space would stop being first on its line.
	//
	// The selector is passed in rather than written again, so the constant above stays the one
	// definition of where a lead block is.
	const lefts = await page.evaluate(
		(selector) =>
			[...document.querySelectorAll(`${selector} span`)].map(
				(element) => element.getBoundingClientRect().left
			),
		lead
	);
	expect(lefts).toHaveLength(11);
	for (const left of lefts) expect(Math.abs(left - lefts[0])).toBeLessThanOrEqual(0.5);
	// CompactSizingPage.xaml:31 specifies SemiBold (600); a strong element would be 700.
	await expect(block.locator('span').first()).toHaveCSS('font-weight', '600');
});

test('typography keeps the space upstream writes before its full stop', async ({ page }) => {
	await page.goto('/design/typography');
	const block = page.locator(lead);
	await expect(block).toHaveCount(1);
	// TypographyPage.xaml:44 places a whitespace run before the full stop after the Hyperlink.
	expect(((await block.textContent()) ?? '').replace(/\s+/g, ' ')).toContain(
		'Segoe UI Variable . Best practice'
	);
});
