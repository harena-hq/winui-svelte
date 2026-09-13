import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('TextBlock in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'TextBlock', '/dev/text-block');
});

test('the two defaults XAML has and CSS does not', async ({ page }) => {
	await page.goto('/dev/text-block');

	for (const testId of ['bare', 'selection-disabled']) {
		const styles = await page.getByTestId(testId).evaluate((element) => {
			const computed = getComputedStyle(element);
			return { whiteSpace: computed.whiteSpace, userSelect: computed.userSelect };
		});
		expect(styles).toEqual({ whiteSpace: 'nowrap', userSelect: 'none' });
	}

	const selectionEnabledStyles = await page.getByTestId('selection-enabled').evaluate((element) => {
		const computed = getComputedStyle(element);
		return { whiteSpace: computed.whiteSpace, userSelect: computed.userSelect };
	});
	expect(selectionEnabledStyles).toEqual({ whiteSpace: 'nowrap', userSelect: 'text' });
});

test('CharacterSpacing is thousandths of an em', async ({ page }) => {
	await page.goto('/dev/text-block');
	const { fontSize, letterSpacing } = await page
		.getByTestId('gallery-third')
		.evaluate((element) => {
			const computed = getComputedStyle(element);
			return {
				fontSize: Number.parseFloat(computed.fontSize),
				letterSpacing: Number.parseFloat(computed.letterSpacing)
			};
		});
	expect(letterSpacing).toBeCloseTo(fontSize * (200 / 1000));
});

test("TextWrapping's three values", async ({ page }) => {
	await page.goto('/dev/text-block');
	for (const [testId, expected] of [
		['wrapping-no-wrap', ['nowrap', 'normal']],
		['wrapping-wrap', ['normal', 'break-word']],
		['wrapping-wrap-whole-words', ['normal', 'normal']]
	] as const) {
		const actual = await page.getByTestId(testId).evaluate((element) => {
			const computed = getComputedStyle(element);
			return [computed.whiteSpace, computed.overflowWrap];
		});
		expect(actual).toEqual(expected);
	}
});

test('MaxLines clamps to its count', async ({ page }) => {
	await page.goto('/dev/text-block');
	const measurement = await page.getByTestId('max-lines-two').evaluate((element) => {
		const unlimited = document.querySelector<HTMLElement>('[data-testid="max-lines-unlimited"]')!;
		const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
		const range = document.createRange();
		range.selectNodeContents(element);
		// `normal` line-height does not resolve to a length, so the first line's Range rect is the
		// browser's actual laid-out line height. Use a computed length when it is available.
		const singleLineHeight = Number.isFinite(lineHeight)
			? lineHeight
			: range.getClientRects()[0]!.height;
		return {
			clamped: element.getBoundingClientRect().height,
			unlimited: unlimited.getBoundingClientRect().height,
			singleLineHeight
		};
	});

	expect(measurement.clamped).toBeLessThan(measurement.unlimited);
	expect(measurement.clamped).toBeCloseTo(measurement.singleLineHeight * 2, 0);
});

test('the selection highlight falls back to the token the text controls paint', async ({
	page
}) => {
	await page.goto('/dev/text-block');
	// `getComputedStyle(element, '::selection')` does not report the highlight's own style in
	// Chromium, so the assertion is on the two values the rule composes rather than on the paint:
	// the per-instance custom property, and the token behind it. The token is the half that can
	// rot silently — if it stopped resolving, the fallback would be empty and a TextBlock would
	// select in Edge's blue beside four controls selecting in WinUI's accent.
	const read = (testId: string) =>
		page.getByTestId(testId).evaluate((element) => {
			const computed = getComputedStyle(element);
			return {
				own: computed.getPropertyValue('--text-block-selection-highlight-color').trim(),
				token: computed.getPropertyValue('--winui-TextControlSelectionHighlightColor').trim()
			};
		});

	const overridden = await read('selection-highlight');
	expect(overridden.own).toBe('darkorange');
	expect(overridden.token).not.toBe('');

	const plain = await read('selection-enabled');
	expect(plain.own).toBe('');
	expect(plain.token).toBe(overridden.token);
});

test('WD-078: trimming leaves wrapping text alone, and a line count is what reaches it', async ({
	page
}) => {
	await page.goto('/dev/text-block');
	const measured = await page.getByTestId('wrap-trim-untrimmed').evaluate((element) => {
		const clamped = document.querySelector<HTMLElement>('[data-testid="wrap-trim-clamped"]')!;
		return {
			hidden: element.scrollHeight - element.clientHeight,
			untrimmedHeight: element.getBoundingClientRect().height,
			clampedHeight: clamped.getBoundingClientRect().height
		};
	});
	// Nothing is hidden: the element is exactly as tall as its own content, so `text-overflow` had
	// no overflowing line box to trim. That is the divergence, asserted rather than described —
	// upstream trims the last line that fits (GridViewPage.xaml:55-56 is the pairing).
	expect(measured.hidden).toBe(0);
	// And the escape WD-078 names does work: the same text under a two-line clamp is shorter.
	expect(measured.clampedHeight).toBeLessThan(measured.untrimmedHeight);
});
