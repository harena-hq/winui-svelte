import { CDP_ENDPOINT, expect, test } from './fixtures';

/**
 * ADR 0018: the icon token names a face of the release's own glyphs after the two Segoe
 * families, so a glyph draws from it only where neither is installed. Each glyph is drawn to a
 * canvas from four stacks and the pixels compared, because a measured width cannot tell two
 * faces apart when one was fitted to the other's box.
 */
const { FALLBACK_FAMILY, FALLBACK_GLYPHS } =
	await (import('../../scripts/icons/fallback.mjs') as Promise<
		typeof import('../../scripts/icons/fallback.mjs')
	>);

const ABSENT = "'NoSuchFamilyIsInstalledAnywhere'";

test('the release glyphs draw from Segoe where it is installed, and from the fallback face elsewhere', async ({
	page
}) => {
	await page.goto('/');
	const drawn = await page.evaluate(
		async ({ family, absent, points }) => {
			const stack = getComputedStyle(document.documentElement)
				.getPropertyValue('--winui-SymbolThemeFontFamily')
				.trim();
			const fallback = `'${family}'`;
			const stacks = { stack, segoe: "'Segoe Fluent Icons'", fallback, absent };
			const size = 64;
			const canvas = document.createElement('canvas');
			canvas.width = canvas.height = size;
			const context = canvas.getContext('2d', { willReadFrequently: true });
			if (!context) throw new Error('no 2d context');

			const rows = [];
			for (const point of points) {
				const char = String.fromCodePoint(parseInt(point, 16));
				// A face behind `unicode-range` loads when a character in it is first asked for,
				// and a canvas does not wait for that, so each is loaded before drawing.
				await document.fonts.load(`${size}px ${fallback}`, char);
				const pixels = {} as Record<string, string>;
				for (const [name, value] of Object.entries(stacks)) {
					context.clearRect(0, 0, size, size);
					context.font = `${size}px ${value}`;
					context.textBaseline = 'alphabetic';
					context.fillText(char, 0, size);
					const data = context.getImageData(0, 0, size, size).data;
					let hash = 0;
					for (let i = 3; i < data.length; i += 4) hash = (hash * 31 + data[i]) | 0;
					pixels[name] = String(hash);
				}
				context.font = `1000px ${fallback}`;
				const m = context.measureText(char);
				const box = [
					-m.actualBoundingBoxLeft,
					m.actualBoundingBoxRight,
					-m.actualBoundingBoxDescent,
					m.actualBoundingBoxAscent
				].map(Math.round);
				rows.push({ point, pixels, box });
			}

			// The line box an icon sits in, at 16px and the line height a template leaves alone. A
			// block's height is its line's, line gap included, where an inline box's is not.
			await document.fonts.load(`16px ${fallback}`, ' ');
			const lineOf = (value: string) => {
				const block = document.createElement('div');
				block.style.cssText = `font: 16px ${value}; line-height: normal`;
				block.textContent = String.fromCodePoint(0xe70d);
				document.body.append(block);
				const height = block.offsetHeight;
				block.remove();
				return height;
			};
			return { stack, rows, line: lineOf(stack), segoeLine: lineOf(stacks.segoe) };
		},
		{ family: FALLBACK_FAMILY, absent: ABSENT, points: FALLBACK_GLYPHS.map((row) => row.point) }
	);

	// The build may requote the stack, which changes nothing it names.
	expect(drawn.stack.replaceAll('"', "'")).toBe(
		`'Segoe Fluent Icons', 'Segoe MDL2 Assets', '${FALLBACK_FAMILY}'`
	);
	// Segoe Fluent Icons' line is an em, ascent 1000, descent 0 and no gap. The face has a space so
	// that it, and not the browser's default text face, sizes the line where Segoe is absent, and
	// the same metrics so that it sizes it alike.
	expect(drawn.line, 'the line a 16px icon sits in').toBe(16);
	if (CDP_ENDPOINT) expect(drawn.segoeLine, "Segoe Fluent Icons' own line").toBe(16);
	for (const { point, pixels, box } of drawn.rows) {
		// The fallback face draws something of its own for every one of them: not the
		// browser's missing-glyph box, and not nothing.
		expect(pixels.fallback, `${point} from the fallback face`).not.toBe(pixels.absent);
		if (CDP_ENDPOINT) {
			// Where Segoe is installed the stack draws it, pixel for pixel, and the fallback is
			// something else, so the comparison could have told them apart.
			expect(pixels.stack, `${point} from the token's stack`).toBe(pixels.segoe);
			expect(pixels.fallback, `${point} from the fallback face`).not.toBe(pixels.segoe);
		} else {
			expect(pixels.stack, `${point} from the token's stack`).toBe(pixels.fallback);
		}
		// Where a row was fitted to a Segoe box, the face's ink is inside it and spans it on one
		// axis, the one the fit was bound by. The 20 thousandths are a margin over the pipeline's
		// rounding, the outlines' tenth of a unit and the TrueType conversion's whole units, and
		// over Segoe's own 64th-of-an-em grid that the measured boxes fall on.
		const row = FALLBACK_GLYPHS.find((glyph) => glyph.point === point);
		if (row?.part === 'holes' && row.box) {
			// A symbol cut from Fluent's circle is placed with the circle's transform, not fitted:
			// it is inside the circle drawn here, and its centre is near the Segoe symbol's. The four
			// sit within 16 thousandths of it; drawn at the viewBox's own scale instead, without the
			// circle's transform, the first is 47 out.
			const circle = FALLBACK_GLYPHS.find((glyph) => glyph.point === row.with);
			if (!circle?.box) throw new Error(`${point}: no circle row ${row.with}`);
			const [left, right, bottom, top] = circle.box;
			expect(box[0], `${point} left`).toBeGreaterThanOrEqual(left);
			expect(box[1], `${point} right`).toBeLessThanOrEqual(right);
			expect(box[2], `${point} bottom`).toBeGreaterThanOrEqual(bottom);
			expect(box[3], `${point} top`).toBeLessThanOrEqual(top);
			const centre = (a: number, b: number) => (a + b) / 2;
			const [sLeft, sRight, sBottom, sTop] = row.box;
			expect(
				Math.abs(centre(box[0], box[1]) - centre(sLeft, sRight)),
				`${point} centre across: ${box} against ${row.box}`
			).toBeLessThanOrEqual(24);
			expect(
				Math.abs(centre(box[2], box[3]) - centre(sBottom, sTop)),
				`${point} centre up: ${box} against ${row.box}`
			).toBeLessThanOrEqual(24);
		} else if (row?.box) {
			const [left, right, bottom, top] = row.box;
			const near = (a: number, b: number) => Math.abs(a - b) <= 20;
			expect(box[0], `${point} left`).toBeGreaterThanOrEqual(left - 20);
			expect(box[1], `${point} right`).toBeLessThanOrEqual(right + 20);
			expect(box[2], `${point} bottom`).toBeGreaterThanOrEqual(bottom - 20);
			expect(box[3], `${point} top`).toBeLessThanOrEqual(top + 20);
			expect(
				(near(box[0], left) && near(box[1], right)) || (near(box[2], bottom) && near(box[3], top)),
				`${point} spans its box on one axis: ${box} in ${row.box}`
			).toBe(true);
		}
	}
});
