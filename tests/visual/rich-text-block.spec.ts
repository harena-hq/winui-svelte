import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('RichTextBlock in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'RichTextBlock', '/dev/rich-text-block');
});
test('Paragraph in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'Paragraph', '/dev/paragraph');
});
test('InlineUIContainer in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'InlineUIContainer', '/dev/inline-ui-container');
});

test('the two defaults RichTextBlock does not share with TextBlock', async ({ page }) => {
	await page.goto('/dev/rich-text-block');
	// DependencyProperty.cpp:735-737 and :282 make these CSS defaults, unlike TextBlock's.
	await expect(page.getByTestId('wrapping-default')).toHaveCSS('white-space', 'normal');
	expect(
		await page.getByTestId('selection-default').evaluate((el) => getComputedStyle(el).userSelect)
	).not.toBe('none');
	await expect(page.getByTestId('selection-disabled')).toHaveCSS('user-select', 'none');
});

test('the defaults survive an ancestor that sets all four inherited properties', async ({
	page
}) => {
	await page.goto('/dev/rich-text-block');
	// None of these four is in XAML's inherited text formatting record (corep.h:487-499) — which is
	// why BlockLayoutHelpers.cpp:278-279 has to write the paragraph-to-owner fallback by hand — and
	// all four map to CSS properties that are inherited. The wrapper sets every one of them to the
	// opposite of the control's default, so each assertion fails if the component stops emitting a
	// default it could have left to the cascade.
	const computed = await page.getByTestId('inheriting-ancestor').evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			textIndent: style.textIndent,
			textAlign: style.textAlign,
			whiteSpace: style.whiteSpace,
			userSelect: style.userSelect
		};
	});
	expect(computed).toEqual({
		textIndent: '0px',
		textAlign: 'left',
		whiteSpace: 'normal',
		userSelect: 'text'
	});
});

test("TextWrapping's three values", async ({ page }) => {
	await page.goto('/dev/rich-text-block');
	for (const [testId, expected] of [
		['wrapping-no-wrap', ['nowrap', 'normal']],
		['wrapping-default', ['normal', 'break-word']],
		['wrapping-wrap-whole-words', ['normal', 'normal']]
	] as const) {
		const actual = await page.getByTestId(testId).evaluate((element) => {
			const computed = getComputedStyle(element);
			return [computed.whiteSpace, computed.overflowWrap];
		});
		expect(actual).toEqual(expected);
	}
});

test('trimming crosses the component boundary as a custom property', async ({ page }) => {
	await page.goto('/dev/rich-text-block');
	// BlockLayoutHelpers.cpp:339-340 keeps trimming on the owner; Paragraph's scoped root needs this inherited channel.
	await expect(page.getByTestId('trimming-character')).toHaveCSS('text-overflow', 'ellipsis');
	await expect(page.getByTestId('trimming-character').locator('p')).toHaveCSS('overflow', 'hidden');
	await expect(page.getByTestId('trimming-character').locator('p')).toHaveCSS(
		'text-overflow',
		'ellipsis'
	);
	await expect(page.getByTestId('bare').locator('p')).toHaveCSS('overflow', 'visible');
});

test("a Paragraph takes its owner's value and a local one overrides", async ({ page }) => {
	await page.goto('/dev/paragraph');
	// BlockLayoutHelpers.cpp:607: the control is read when the Paragraph has no local value.
	await expect(page.getByTestId('indent-inherited')).toHaveCSS('text-indent', '24px');
	await expect(page.getByTestId('indent-local')).toHaveCSS('text-indent', '0px');
	await expect(page.getByTestId('align-inherited')).toHaveCSS('text-align', 'right');
	await expect(page.getByTestId('align-local')).toHaveCSS('text-align', 'left');
	await expect(page.getByTestId('line-height-inherited')).toHaveCSS('line-height', '40px');
	await expect(page.getByTestId('line-height-local')).toHaveCSS('line-height', '20px');
});

test('a Paragraph ending in a LineBreak makes the empty line XAML makes', async ({ page }) => {
	await page.goto('/dev/paragraph');
	const measurement = await page.getByTestId('trailing-break').evaluate((element) => {
		const control = document.querySelector<HTMLElement>('[data-testid="no-trailing-break"]')!;
		return {
			difference: element.getBoundingClientRect().height - control.getBoundingClientRect().height,
			lineHeight: control.getBoundingClientRect().height / 2
		};
	});
	expect(measurement.difference).toBeCloseTo(measurement.lineHeight, 0);
});

test('an embedded element sits its bottom edge on the baseline', async ({ page }) => {
	await page.goto('/dev/inline-ui-container');
	// GetElementBaseline's else branch returns the element height, putting its bottom on the baseline.
	const measurement = await page.getByTestId('baseline-box').evaluate((element) => {
		const ruler = document.querySelector<HTMLElement>('[data-testid="baseline-ruler"]')!;
		return {
			display: getComputedStyle(element).display,
			overflow: getComputedStyle(element).overflow,
			difference: element.getBoundingClientRect().bottom - ruler.getBoundingClientRect().bottom
		};
	});
	expect(measurement.display).toBe('inline-block');
	expect(measurement.overflow).toBe('clip');
	expect(measurement.difference).toBeCloseTo(0, 0);
});
