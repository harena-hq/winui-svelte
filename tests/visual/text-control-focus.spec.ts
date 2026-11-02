/**
 * Focus thickens a text control's bottom border and moves nothing. Upstream's `BorderElement`
 * shares a grid cell with the text instead of holding it (TextBox_themeresources.xaml:336-337), and
 * the reference Gallery's TextBox spans 32 rows of pixels at rest and focused.
 */
import { expect, test } from './fixtures';

const BOX = 'xpath=ancestor::*[contains(concat(" ", @class, " "), " box ")][1]';

const FIELDS = [
	{ route: 'text-box', name: 'single line', field: 'input', value: 'text', height: 32 },
	{ route: 'text-box', name: 'multi-line', field: 'textarea', value: 'text', height: undefined },
	{ route: 'password-box', name: 'single line', field: 'input', value: 'text', height: 32 },
	{
		route: 'number-box',
		name: 'no spin buttons',
		field: '.box:not(.inline) input',
		value: '12',
		height: 32
	},
	{
		route: 'number-box',
		name: 'inline spin buttons',
		field: '.box.inline input',
		value: '12',
		height: 32
	},
	{ route: 'auto-suggest-box', name: 'single line', field: 'input', value: 'text', height: 32 }
];

for (const { route, name, field, value, height } of FIELDS) {
	test(`${route}, ${name}: focus moves nothing and thickens the bottom`, async ({ page }) => {
		await page.goto(`/dev/${route}`);
		const input = page.locator(`.root:not([data-disabled]) ${field}`).first();
		const box = input.locator(BOX);
		await input.scrollIntoViewIfNeeded();
		const rest = (await box.boundingBox())!;
		const restText = (await input.boundingBox())!;
		if (height !== undefined) expect(rest.height).toBe(height);

		await input.focus();
		await input.fill(value);
		await expect(input).toHaveValue(value);
		const focused = (await box.boundingBox())!;
		const focusedText = (await input.boundingBox())!;
		expect(focused.height).toBe(rest.height);
		expect(focused.y).toBe(rest.y);
		expect(focusedText.y).toBe(restText.y);
		expect(focusedText.height).toBe(restText.height);

		const ring = await box.evaluate((node) => {
			const { bottom, paddingBottom } = getComputedStyle(node, '::after');
			return { bottom, paddingBottom };
		});
		expect(ring).toEqual({ bottom: '-1px', paddingBottom: '2px' });
	});
}
