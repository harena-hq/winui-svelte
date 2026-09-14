import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

// Every specimen that carries a colour carries `#3478F6` — rgb(52, 120, 246), whose HSV is
// h 218.9697, s 0.788618, v 0.964706. The whole numbers below are that colour read through each
// channel, and they are what makes the first test able to tell the three channels apart at all.
const HUE = '219';
const SATURATION = '79';
const VALUE = '96';

test('ColorPicker in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ColorPicker', '/dev/color-picker');
});

test('the third-dimension slider takes its channel from the components', async ({ page }) => {
	await page.goto('/dev/color-picker');
	// `ColorPicker.xaml:244` writes `ColorChannel="Value"` and
	// `SetThirdDimensionSliderChannel` (`ColorPicker.cpp:1144-1169`) overwrites it from
	// `ColorSpectrumComponents`. The bounds alone cannot show that — saturation and value share
	// 0–100 — so each row asserts the **value** too, which is the same colour read through a
	// different channel and is different for all three.
	for (const [id, min, max, now] of [
		['default', '0', '100', VALUE],
		['hue-slider', '0', '359', HUE],
		['saturation-slider', '0', '100', SATURATION]
	] as const) {
		const thumb = page.getByTestId(id).locator('.third .thumb');
		await expect.poll(() => thumb.getAttribute('aria-valuemin')).toBe(min);
		await expect.poll(() => thumb.getAttribute('aria-valuemax')).toBe(max);
		await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe(now);
	}
});

test('the value strip runs from black to the current hue at full value', async ({ page }) => {
	await page.goto('/dev/color-picker');
	// `ColorPicker.cpp:1096-1097`: both stops carry the current h and s, and only v moves.
	const image = await page
		.getByTestId('default')
		.locator('.third .gradient')
		.evaluate((element) => getComputedStyle(element).backgroundImage);
	expect(image).toBe('linear-gradient(to right, rgb(0, 0, 0), rgb(54, 124, 255))');
});

test('the saturation strip is full brightness whatever the colour', async ({ page }) => {
	await page.goto('/dev/color-picker');
	// `ColorPicker.cpp:1074-1075` forces `v` to 1.0 in both stops. The specimen's own value is
	// 0.9647, so an implementation that passed the current value through would end the strip at
	// rgb(0, 86, 246) instead — close enough to look right and wrong by the source.
	const image = await page
		.getByTestId('saturation-slider')
		.locator('.third .gradient')
		.evaluate((element) => getComputedStyle(element).backgroundImage);
	expect(image).toBe('linear-gradient(to right, rgb(255, 255, 255), rgb(0, 89, 255))');
	expect(image).not.toContain('rgb(0, 86, 246)');
});

test('the hue strip drops the stops outside its bounds', async ({ page }) => {
	await page.goto('/dev/color-picker');
	// `ColorPicker.cpp:1128-1136` keeps a sextant only while `minOffset < sextant/6 < maxOffset`,
	// with the offsets being hue/359. For 90–200 that is 0.250696 and 0.557103, so 2/6 and 3/6
	// survive and the other three do not, landing at (0.3333 - 0.250696) / 0.306407 = 0.2696 and
	// (0.5 - 0.250696) / 0.306407 = 0.8136.
	const image = await page
		.getByTestId('clamped')
		.locator('.third .gradient')
		.evaluate((element) => getComputedStyle(element).backgroundImage);
	expect(image).toBe(
		'linear-gradient(to right, rgb(128, 255, 0) 0%, rgb(0, 255, 0) 26.9697%, ' +
			'rgb(0, 255, 255) 81.3636%, rgb(0, 170, 255) 100%)'
	);
});

test('the alpha strip runs from transparent to opaque in the current colour', async ({ page }) => {
	await page.goto('/dev/color-picker');
	// `ColorPicker.cpp:1192-1193`: two stops of the same hsv, at alpha 0 and alpha 1.
	const image = await page
		.getByTestId('alpha')
		.locator('.alpha .gradient')
		.evaluate((element) => getComputedStyle(element).backgroundImage);
	expect(image).toBe('linear-gradient(to right, rgba(52, 120, 246, 0), rgb(52, 120, 246))');
});

test('the checkerboard leaves its first cell transparent', async ({ page }) => {
	await page.goto('/dev/color-picker');
	// The pin generates the checkerboard as pixels and makes a pixel **transparent** when
	// `(x / CheckerSize + y / CheckerSize) % 2 == 0`, with `CheckerSize` 4 (`ColorHelpers.cpp:9`).
	// The CSS conic gradient has to land on that phase and not its complement, which no reading
	// of the declaration can settle — so this photographs one 8px tile and reads four pixels.
	// The element's own screenshot, not a page clip: the dev layout is exactly `100vh` and scrolls
	// inside it (D16), so the alpha strip is below the fold and a page-level clip is refused as
	// "outside the resulting image". Playwright scrolls a locator into view for its own shot.
	const tile = await page.getByTestId('alpha').locator('.alpha .checkerboard').screenshot();
	const corners = await page.evaluate(
		async (url) => {
			const image = new Image();
			image.src = url;
			await image.decode();
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext('2d')!;
			context.drawImage(image, 0, 0);
			const luminance = (x: number, y: number) => {
				const [r, g, b] = context.getImageData(x, y, 1, 1).data;
				return r + g + b;
			};
			return { even: [luminance(1, 1), luminance(5, 5)], odd: [luminance(5, 1), luminance(1, 5)] };
		},
		`data:image/png;base64,${tile.toString('base64')}`
	);
	// The tint is translucent black under the light theme, so the cells the pin leaves
	// transparent are the brighter pair. A conic gradient rotated a quarter turn swaps them.
	for (const clear of corners.even) {
		for (const tinted of corners.odd) expect(clear).toBeGreaterThan(tinted);
	}
});

test('the hue survives being driven to zero value and back', async ({ page }) => {
	await page.goto('/dev/color-picker');
	// `UpdateColor(const Hsv&)` assigns hsv and derives rgb (`ColorPicker.cpp:501-508`), which is
	// why a hue is not lost at black. An implementation that kept `Color` as its state and
	// re-derived HSV from it would come back grey.
	const picker = page.getByTestId('default');
	const swatch = picker.locator('.current');
	const fill = () => swatch.evaluate((element) => getComputedStyle(element).backgroundColor);

	await picker.locator('.third .thumb').focus();
	await page.keyboard.press('Home');
	await expect.poll(fill).toBe('rgb(0, 0, 0)');
	await page.keyboard.press('End');
	await expect.poll(fill).toBe('rgb(54, 124, 255)');
});

test('the previous colour stacks under a spectrum and sits beside it without one', async ({
	page
}) => {
	await page.goto('/dev/color-picker');
	// `UpdateVisualState` picks the pair on `isColorSpectrumVisible`, not on orientation
	// (`ColorPicker.cpp:449-456`) — the two states named "Horizontal" are the no-spectrum ones.
	// Reading those names as orientation names passes the first half of this test and fails the
	// second, which is why both halves are here.
	const boxes = async (id: string) =>
		page.getByTestId(id).evaluate((root) => {
			const read = (selector: string) => {
				const element = root.querySelector<HTMLElement>(selector)!;
				const box = element.getBoundingClientRect();
				return {
					x: Math.round(box.x),
					y: Math.round(box.y),
					width: Math.round(box.width),
					height: Math.round(box.height),
					fill: getComputedStyle(element).backgroundColor
				};
			};
			return { current: read('.current'), previous: read('.previous') };
		});

	const stacked = await boxes('previous');
	expect(stacked.current.x).toBe(stacked.previous.x);
	expect(stacked.current.width).toBe(stacked.previous.width);
	expect(stacked.current.height).toBe(stacked.previous.height);
	expect(stacked.previous.y).toBe(stacked.current.y + stacked.current.height);
	expect(stacked.current.fill).not.toBe(stacked.previous.fill);

	const beside = await boxes('no-spectrum-previous');
	expect(beside.current.y).toBe(beside.previous.y);
	expect(beside.current.height).toBe(beside.previous.height);
	expect(beside.current.width).toBe(beside.previous.width);
	expect(beside.previous.x).toBe(beside.current.x + beside.current.width);
	expect(beside.current.fill).not.toBe(beside.previous.fill);
});

test('the spectrum is square and the preview is as tall as it', async ({ page }) => {
	await page.goto('/dev/color-picker');
	// `OnColorSpectrumSizeChanged` (`ColorPicker.cpp:656-664`) sets the spectrum's height to its
	// width on every width change, and says why: "since we want it to always be a square". The
	// spectrum itself draws at `min(width, height)` (`ColorSpectrum.cpp:866-890`), so a box wider
	// than it is tall fails nothing and breaks nothing — it renders a smaller square and leaves
	// the difference empty. That is what the first baseline photographed, at 336 by 256 with
	// eighty pixels of blank control between the gradient and the preview, and only the picture
	// showed it.
	const boxes = await page.getByTestId('default').evaluate((root) => {
		const read = (selector: string) => {
			const box = root.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
			return { width: Math.round(box.width), height: Math.round(box.height) };
		};
		return { spectrum: read('.spectrum'), preview: read('.preview') };
	});
	expect(boxes.spectrum.height).toBe(boxes.spectrum.width);
	expect(boxes.preview.height).toBe(boxes.spectrum.height);
});

test('collapsing the spectrum reshapes the preview into a bar', async ({ page }) => {
	await page.goto('/dev/color-picker');
	// `ColorPicker.xaml:20-24`: Width NaN, Height 44, Margin 0, column 0 spanning both.
	const shapes = await page.evaluate(() =>
		['default', 'no-spectrum'].map((id) => {
			const preview = document
				.querySelector(`[data-testid="${id}"]`)!
				.querySelector<HTMLElement>('.preview')!;
			const box = preview.getBoundingClientRect();
			return { width: Math.round(box.width), height: Math.round(box.height) };
		})
	);
	expect(shapes[0].width).toBe(44);
	expect(shapes[1].height).toBe(44);
	expect(shapes[1].width).toBeGreaterThan(44);
});

test('each hidden part is absent and the ones beside it are not', async ({ page }) => {
	await page.goto('/dev/color-picker');
	const count = (id: string, selector: string) => page.getByTestId(id).locator(selector).count();

	expect(await count('no-preview', '.preview')).toBe(0);
	expect(await count('no-preview', '.spectrum')).toBe(1);
	expect(await count('no-sliders', '.slider-grid')).toBe(0);
	expect(await count('no-sliders', '.preview')).toBe(1);
	expect(await count('no-spectrum', '.spectrum')).toBe(0);
	expect(await count('no-spectrum', '.preview')).toBe(1);
	// `ColorPicker.cpp:462` needs both `IsAlphaEnabled` and `IsAlphaSliderVisible`, and every
	// specimen but one leaves alpha disabled while `alphaSliderVisible` defaults to true.
	expect(await count('default', '.alpha')).toBe(0);
	expect(await count('alpha', '.alpha')).toBe(1);
});
