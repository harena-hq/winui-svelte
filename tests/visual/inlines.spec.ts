import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('Run in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'Run', '/dev/run');
});

test('Span in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'Span', '/dev/span');
});

test('Bold in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'Bold', '/dev/bold');
});

test('Italic in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'Italic', '/dev/italic');
});

test('Underline in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'Underline', '/dev/underline');
});

test('LineBreak in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'LineBreak', '/dev/line-break');
});

test("Bold is absolute where the browser's own element is relative", async ({ page }) => {
	await page.goto('/dev/bold');
	// Both live in the same BodyStrong TextBlock, which is `font-weight: 600`. The second half is
	// what makes the first mean anything: `<b>` takes the user agent's `bolder`, which resolves
	// against 600 to 900, while CBold::Create writes 700 outright.
	await expect(page.getByTestId('component-bold')).toHaveCSS('font-weight', '700');
	await expect(page.getByTestId('ua-bold')).toHaveCSS('font-weight', '900');
});

test('Italic sets the style and Underline sets the line', async ({ page }) => {
	await page.goto('/dev/italic');
	await expect(page.getByTestId('bare')).toHaveCSS('font-style', 'italic');
	await page.goto('/dev/underline');
	await expect(page.getByTestId('bare')).toHaveCSS('text-decoration-line', 'underline');
});

test('a trailing LineBreak makes the empty line a trailing br does not', async ({ page }) => {
	await page.goto('/dev/line-break');
	const measurement = await page.getByTestId('no-trailing').evaluate((element) => {
		const trailing = document.querySelector<HTMLElement>('[data-testid="trailing"]')!;
		const twoLines = document.querySelector<HTMLElement>('[data-testid="two-lines"]')!;
		return {
			difference: trailing.getBoundingClientRect().height - element.getBoundingClientRect().height,
			lineHeight: twoLines.getBoundingClientRect().height / 2
		};
	});
	expect(measurement.difference).toBeCloseTo(measurement.lineHeight, 0);
});

test('a LineBreak in the middle of a line costs no height', async ({ page }) => {
	await page.goto('/dev/line-break');
	const measurement = await page.getByTestId('two-lines').evaluate((element) => {
		const singleLine = document.querySelector<HTMLElement>('[data-testid="single-line"]')!;
		return {
			twoLines: element.getBoundingClientRect().height,
			singleLine: singleLine.getBoundingClientRect().height
		};
	});
	expect(measurement.twoLines).toBeCloseTo(measurement.singleLine * 2, 0);
});

test("a Run's text prop keeps the spaces markup would trim", async ({ page }) => {
	await page.goto('/dev/run');
	// `textContent` rather than `toHaveText`, which normalises whitespace and would pass on a Run
	// that had dropped both spaces.
	const run = page.getByTestId('text-prop');
	expect(await run.evaluate((element) => element.textContent)).toBe(' spaced ');
});

test("FlowDirection writes dir, and leaves a consumer's alone when it is not set", async ({
	page
}) => {
	await page.goto('/dev/run');
	// The first row is the one that fails if `dir` is emitted after `{...rest}` as a conditional
	// that evaluates to `undefined`: the attribute is then removed rather than left alone, and a
	// consumer's direction disappears from every Run in the Gallery.
	await expect(page.getByTestId('rest-dir')).toHaveAttribute('dir', 'rtl');
	await expect(page.getByTestId('flow-ltr')).toHaveAttribute('dir', 'ltr');
	await expect(page.getByTestId('flow-rtl')).toHaveAttribute('dir', 'rtl');

	// The attributes above are what the component writes; these are what the browser did with
	// them. All three rows carry the same string, `abc שלום עולם xyz`, and the base direction
	// decides which strong run is leftmost. Without this the three rows photograph identically —
	// they did, until the string stopped ending in digits, which take the preceding Hebrew run's
	// level whatever the base direction is.
	const leftmost = (testId: string) =>
		page.getByTestId(testId).evaluate((element) => {
			const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
			const glyphs: { left: number; char: string }[] = [];
			let node: Node | null;
			while ((node = walker.nextNode())) {
				const text = (node as Text).data;
				for (let i = 0; i < text.length; i++) {
					if (/\s/.test(text[i])) continue;
					const range = document.createRange();
					range.setStart(node, i);
					range.setEnd(node, i + 1);
					glyphs.push({ left: range.getBoundingClientRect().left, char: text[i] });
				}
			}
			return glyphs.sort((a, b) => a.left - b.left)[0].char;
		});

	expect(await leftmost('rest-dir')).toBe('x');
	expect(await leftmost('flow-ltr')).toBe('a');
	expect(await leftmost('flow-rtl')).toBe('x');
});

test("Span's formatting reaches the inlines nested inside it", async ({ page }) => {
	await page.goto('/dev/span');
	const styles = await page.getByTestId('span-nested').evaluate((element) => {
		const computed = getComputedStyle(element);
		return { color: computed.color, fontStyle: computed.fontStyle };
	});
	expect(styles).toEqual({ color: 'rgb(100, 149, 237)', fontStyle: 'italic' });
});

test('three adjacent Runs keep the spaces between them', async ({ page }) => {
	await page.goto('/dev/run');
	expect(await page.getByTestId('adjacent').evaluate((element) => element.textContent)).toBe(
		'one two three'
	);
});

test('a LineBreak inside a wrapping TextBlock breaks it and adds nothing else', async ({
	page
}) => {
	await page.goto('/dev/line-break');
	// The pairing the pinned Gallery writes: TextWrapping sits on seven of the ten TextBlocks that
	// hold a LineBreak. `white-space: normal` is where the empty inline box that makes the trailing
	// line could show up as a line nobody asked for, so the strings are short enough that the
	// expected count is exactly two against one.
	const measurement = await page.getByTestId('wrap-break').evaluate((element) => {
		const control = document.querySelector<HTMLElement>('[data-testid="wrap-no-break"]')!;
		return {
			broken: element.getBoundingClientRect().height,
			control: control.getBoundingClientRect().height
		};
	});
	expect(measurement.broken).toBeCloseTo(measurement.control * 2, 0);
});

test('the trailing break still makes its empty line when the block wraps', async ({ page }) => {
	await page.goto('/dev/line-break');
	// Wrapping plus a trailing LineBreak is the shape five of those seven take, and it is the one
	// the padding box exists for. The two specimens differ by exactly that final break.
	const measurement = await page.getByTestId('wrap-trailing').evaluate((element) => {
		const control = document.querySelector<HTMLElement>('[data-testid="wrap-trailing-control"]')!;
		const height = control.getBoundingClientRect().height;
		return { difference: element.getBoundingClientRect().height - height, lineHeight: height / 2 };
	});
	expect(measurement.difference).toBeCloseTo(measurement.lineHeight, 0);
});

test('WD-080: FlowDirection embeds the run rather than isolating it', async ({ page }) => {
	await page.goto('/dev/run');
	// `dir` alone is HTML's `unicode-bidi: isolate`, which leaves the trailing neutrals to the
	// right of the Hebrew; the embedding the pin pushes (U+202B … U+202C) brings them to its left.
	// Reading the geometry rather than the declaration is what makes this test able to fail: a
	// computed-style check would pass on a value the browser never acted on.
	const geometry = await page.getByTestId('embedding').evaluate((element) => {
		const trailing = document.querySelector<HTMLElement>('[data-testid="embedding-trailing"]')!;
		return {
			unicodeBidi: getComputedStyle(element).unicodeBidi,
			runLeft: element.getBoundingClientRect().left,
			trailingLeft: trailing.getBoundingClientRect().left
		};
	});
	expect(geometry.unicodeBidi).toBe('embed');
	expect(geometry.trailingLeft).toBeLessThan(geometry.runLeft);
});

test('a Run with no FlowDirection writes no bidi of its own', async ({ page }) => {
	await page.goto('/dev/run');
	// `DirectionalControl::None` (ParagraphTextSource.cpp:474) is what an unset FlowDirection means
	// upstream, and `rest-dir` is the case that would otherwise pick up the embedding by accident:
	// it carries a consumer's `dir`, which HTML isolates and this component leaves alone.
	await expect(page.getByTestId('bare-run')).toHaveCSS('unicode-bidi', 'normal');
	await expect(page.getByTestId('rest-dir')).toHaveCSS('unicode-bidi', 'isolate');
});

test('a LineBreak contributes no character of its own to the text', async ({ page }) => {
	await page.goto('/dev/line-break');
	// XAML's LineBreak is one character, U+2028, and a `<br>` is none — so `onetwo` is what this
	// reproduction can offer and what it must offer exactly. The guard is against a space creeping
	// back in between the two roots: a newline written between them is a text node Svelte keeps,
	// it is invisible in every layout, and it reaches copy, paste and the accessibility text.
	const texts = await page.evaluate(() =>
		['two-lines', 'trailing', 'double'].map(
			(id) => document.querySelector(`[data-testid="${id}"]`)!.textContent
		)
	);
	expect(texts).toEqual(['onetwo', 'onetwo', 'onetwo']);
});

test('whitespace written after a LineBreak does not indent the next line', async ({ page }) => {
	await page.goto('/dev/line-break');
	// Found by opening the baseline, not by a gate: with the compensating box as a sibling of the
	// `<br>`, the space a template writes after `<LineBreak />` was no longer first on its line and
	// so did not collapse. The Gallery's own fourth example came out 3.84px indented. The box lives
	// on TextBlock now, and this reads the two lines' left edges to say so.
	const edges = await page.getByTestId('space-after-break').evaluate((element) => {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		const glyphs: { top: number; left: number }[] = [];
		let node: Node | null;
		while ((node = walker.nextNode())) {
			const text = (node as Text).data;
			for (let i = 0; i < text.length; i++) {
				if (/\s/.test(text[i])) continue;
				const range = document.createRange();
				range.setStart(node, i);
				range.setEnd(node, i + 1);
				const box = range.getBoundingClientRect();
				glyphs.push({ top: box.top, left: box.left });
			}
		}
		const first = Math.min(...glyphs.map((g) => g.top));
		const leftOf = (onSecondLine: boolean) =>
			Math.min(...glyphs.filter((g) => g.top > first + 5 === onSecondLine).map((g) => g.left));
		return { firstLine: leftOf(false), secondLine: leftOf(true) };
	});
	expect(edges.secondLine).toBeCloseTo(edges.firstLine, 1);
});
