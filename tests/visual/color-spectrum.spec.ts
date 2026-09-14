import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('ColorSpectrum in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ColorSpectrum', '/dev/color-spectrum');
});

test('the surface is drawn, not left blank', async ({ page }) => {
	await page.goto('/dev/color-spectrum');
	const pixels = await page
		.getByTestId('default')
		.locator('canvas')
		.evaluate((canvas) => {
			const context = (canvas as HTMLCanvasElement).getContext('2d')!;
			const side = (canvas as HTMLCanvasElement).width;
			return [
				[0, 0],
				[side - 1, 0],
				[0, side - 1]
			].map(([x, y]) => Array.from(context.getImageData(x, y, 1, 1).data));
		});
	expect(new Set(pixels.map((pixel) => pixel.join(','))).size).toBe(3);
});

test('the thumb sits where the colour is', async ({ page }) => {
	await page.goto('/dev/color-spectrum');
	const box = page.getByTestId('clamped');
	const geometry = await box.evaluate((control) => {
		const surface = control.querySelector<HTMLElement>('.surface')!.getBoundingClientRect();
		const thumb = control.querySelector<HTMLElement>('.thumb')!.getBoundingClientRect();
		return {
			x: thumb.left + thumb.width / 2 - surface.left,
			y: thumb.top + thumb.height / 2 - surface.top,
			side: surface.width
		};
	});
	// `clamped` is hue 90-180 with the colour at hue 135, saturation 1. The first component is
	// the **vertical** axis with its maximum at the top, so hue 135 of 90-180 is halfway down;
	// the second is horizontal with its maximum at the **left**, so saturation 1 is at x = 0.
	// The first draft of this component had the two the other way round and this test was
	// written to agree with it — `ColorSpectrum.cpp:1108-1160` is the authority.
	expect(geometry.x).toBeCloseTo(0, 0);
	expect(geometry.y).toBeCloseTo(geometry.side / 2, 0);
});

test('the thumb ring flips with the backdrop luminance at <= 0.5', async ({ page }) => {
	await page.goto('/dev/color-spectrum');
	const stroke = (id: string) =>
		page
			.getByTestId(id)
			.locator('.selection-ring')
			.evaluate((ring) => getComputedStyle(ring).borderColor);
	const [light, dark] = await Promise.all([stroke('light-thumb'), stroke('dark-thumb')]);
	expect(light).not.toBe(dark);
});

test('a click moves the colour to the point clicked', async ({ page }) => {
	await page.goto('/dev/color-spectrum');
	const control = page.getByTestId('default');
	const surface = control.locator('.surface');
	const box = await surface.boundingBox();
	if (!box) throw new Error('ColorSpectrum surface was not laid out');
	// Top-left is both maxima: hue 359 at the top, saturation 1 at the left.
	await surface.click({ position: { x: 0, y: 0 } });
	const topLeft = (await control.getAttribute('data-hsv'))!.split(',').map(Number);
	expect(topLeft[0]).toBeCloseTo(359, 0);
	expect(topLeft[1]).toBeCloseTo(1, 2);

	// And the opposite corner is both minima, which is what says the axes are not merely
	// swapped with each other.
	await surface.click({ position: { x: box.width - 1, y: box.height - 1 } });
	const bottomRight = (await control.getAttribute('data-hsv'))!.split(',').map(Number);
	expect(bottomRight[0]).toBeCloseTo(0, 0);
	expect(bottomRight[1]).toBeCloseTo(0, 2);
});

test('a ring projects a click outside its radius onto its boundary', async ({ page }) => {
	await page.goto('/dev/color-spectrum');
	const control = page.getByTestId('ring');
	const before = await control.getAttribute('data-hsv');
	const box = (await control.locator('.surface').boundingBox())!;
	// `page.mouse` rather than `locator.click`: the point is deliberately in a corner the ring
	// does not paint, and Playwright's actionability check refuses a coordinate whose topmost
	// element is not the locator. The pin puts a square Canvas there for exactly this reason.
	await page.mouse.click(box.x + 2, box.y + 2);
	const after = await control.getAttribute('data-hsv');
	expect(after).not.toBe(before);

	// And it lands *on* the circumference, not somewhere inside it: the second component, which
	// the ring reads radially, must come out at its minimum.
	const radial = Number(after!.split(',')[1]);
	expect(radial).toBeCloseTo(0, 2);
});

test('the bounds clamp the axis', async ({ page }) => {
	await page.goto('/dev/color-spectrum');
	const pixels = await page
		.getByTestId('clamped')
		.locator('canvas')
		.evaluate((canvas) => {
			const context = (canvas as HTMLCanvasElement).getContext('2d')!;
			const side = (canvas as HTMLCanvasElement).width;
			return [
				context.getImageData(0, 0, 1, 1).data,
				context.getImageData(0, side - 1, 1, 1).data
			].map((pixel) => Array.from(pixel));
		});
	// The clamped specimen is hue 90-180, and hue is the vertical axis with its maximum at the
	// top — so the top row is hue 180 (cyan) and the bottom row hue 90 (a green). Both are read
	// at x = 0, where saturation is at its maximum. Reading a row instead of a column is what
	// the first draft did, and it agreed with a transposed surface.
	expect(pixels[0]).toEqual([0, 255, 255, 255]);
	expect(pixels[1]).toEqual([128, 255, 0, 255]);
});

test("the ring's thumb lands back on the point that was clicked", async ({ page }) => {
	await page.goto('/dev/color-spectrum');
	// The thumb's position has to be the inverse of the input mapping, and the first draft was
	// neither — a 180-degree offset and a radius read from the wrong end, so the thumb sat
	// opposite the colour. Only a ring click can see it: the box thumb was right, and every
	// computed-style and canvas assertion passes either way.
	const ring = page.getByTestId('ring');
	const surface = ring.locator('.surface');
	const box = (await surface.boundingBox())!;
	const radius = box.width / 2;
	const distance = radius * 0.6;
	const target = {
		x: box.x + radius + Math.cos(Math.PI / 4) * distance,
		y: box.y + radius + Math.sin(Math.PI / 4) * distance
	};
	await page.mouse.click(target.x, target.y);

	const thumb = await ring.evaluate((control) => {
		const surfaceBox = control.querySelector<HTMLElement>('.surface')!.getBoundingClientRect();
		const thumbBox = control.querySelector<HTMLElement>('.thumb')!.getBoundingClientRect();
		return {
			x: thumbBox.left + thumbBox.width / 2 - surfaceBox.left,
			y: thumbBox.top + thumbBox.height / 2 - surfaceBox.top
		};
	});
	// Within two pixels: the pin floors the angle to a whole degree and the hue range is 0-359
	// against a full turn, so the round trip is not exact by design.
	expect(thumb.x).toBeCloseTo(target.x - box.x, -0.5);
	expect(thumb.y).toBeCloseTo(target.y - box.y, -0.5);
});

test('the surface fills the width it is given', async ({ page }) => {
	await page.goto('/dev/color-spectrum');
	// `ColorSpectrum.cpp:866-890` sizes the square at `min(ActualWidth, ActualHeight)`, and `:868`
	// draws nothing at all when that is zero — the control never picks a size of its own. The
	// `256px` this surface used to carry was ours rather than the pin's, and it held: composed
	// into a `ColorPicker` that had asked for 336 it stayed 256 and left eighty pixels of blank
	// control beside the gradient. Growing the parent is what that number could not follow.
	const sizes = await page.getByTestId('default').evaluate((root) => {
		const parent = root.parentElement!;
		const measure = () => {
			const box = root.querySelector<HTMLElement>('.surface')!.getBoundingClientRect();
			return { width: Math.round(box.width), height: Math.round(box.height) };
		};
		const before = measure();
		parent.style.width = '320px';
		const after = measure();
		parent.style.width = '';
		return { before, after };
	});
	expect(sizes.before).toEqual({ width: 256, height: 256 });
	expect(sizes.after).toEqual({ width: 320, height: 320 });
});
