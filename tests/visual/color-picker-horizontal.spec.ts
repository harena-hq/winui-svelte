import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('ColorPicker horizontal in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ColorPickerHorizontal', '/dev/color-picker-horizontal');
});

test('the four children sit in one row on the alpha specimen', async ({ page }) => {
	await page.goto('/dev/color-picker-horizontal');
	const boxes = await page.getByTestId('alpha').evaluate((root) =>
		['.spectrum-grid', '.third', '.alpha', '.more-entries'].map((selector) => {
			const box = root.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
			return { left: box.left, top: box.top };
		})
	);
	for (const box of boxes) expect(Math.abs(box.top - boxes[0].top)).toBeLessThanOrEqual(1);
	for (let index = 1; index < boxes.length; index++) {
		expect(boxes[index].left).toBeGreaterThan(boxes[index - 1].left);
	}
});

test('both sliders stand on end', async ({ page }) => {
	await page.goto('/dev/color-picker-horizontal');
	const sliders = page.getByTestId('alpha').locator('.picker-slider');
	expect(await sliders.count()).toBe(2);
	for (let index = 0; index < 2; index++) {
		const slider = sliders.nth(index);
		await expect(slider).toHaveAttribute('data-orientation', 'vertical');
		const box = await slider.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.width).toBe(32);
		expect(box!.height).toBeGreaterThan(box!.width);
	}
});

test('a horizontal picker has no More button and shows its grid', async ({ page }) => {
	await page.goto('/dev/color-picker-horizontal');
	// ColorPicker.cpp:464 ignores IsMoreButtonVisible horizontally; :465 keeps the grid open.
	const picker = page.getByTestId('more-button');
	expect(await picker.locator('.more-button').count()).toBe(0);
	expect(await picker.locator('.text-entry').count()).toBe(1);
});

test('the vertical arrangement did not move', async ({ page }) => {
	await page.goto('/dev/color-picker');
	// The default specimen has alpha disabled, so only the alpha specimen contains all four parts.
	const boxes = await page.getByTestId('alpha').evaluate((root) =>
		['.spectrum-grid', '.third', '.alpha', '.more-entries'].map((selector) => {
			const box = root.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
			return { left: box.left, top: box.top };
		})
	);
	for (const box of boxes) expect(Math.abs(box.left - boxes[0].left)).toBeLessThanOrEqual(1);
	for (let index = 1; index < boxes.length; index++) {
		expect(boxes[index].top).toBeGreaterThan(boxes[index - 1].top);
	}
});

test('the hex box spans the row and the label column is 122 wide', async ({ page }) => {
	await page.goto('/dev/color-picker-horizontal');
	const assertHexLayout = async (id: string, lowerRowSelector: string) => {
		const layout = await page.getByTestId(id).evaluate((root, selector) => {
			const box = (selector: string) =>
				root.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
			const hex = box('.hex-box');
			const entry = box('.text-entry');
			const lowerRow = box(selector);
			return { hex, entry, lowerRow };
		}, lowerRowSelector);
		expect(layout.hex.width).toBe(120);
		expect(Math.abs(layout.hex.left - layout.entry.left)).toBeLessThanOrEqual(1);
		expect(layout.hex.top).toBeLessThan(layout.lowerRow.top);
	};
	await assertHexLayout('default', '.representation');
	// This specimen omits .representation, so .text-panels proves the same row ordering.
	await assertHexLayout('no-channel-text', '.text-panels');
	const columns = await page
		.getByTestId('default')
		.locator('.channel-panel')
		.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' '));
	// ColorPicker.xaml:371's box column is `Auto` and :193 pins the label column at 122. A CSS
	// `auto` track absorbs free space where a XAML `Auto` column does not: measured before the
	// grid was told not to, the box column came out 242 and every label sat 122 too far right.
	expect(columns).toEqual(['120px', '8px', '122px']);
});

test('the gradient strip is painted under its own thumb', async ({ page }) => {
	await page.goto('/dev/color-picker-horizontal');
	// ColorPicker.xaml:156, :169 and :173 centre all three background rectangles in their column,
	// and :208-211 makes every root column `Auto`. A CSS `auto` track stretches, and a stretched column puts
	// the 12-wide strip in the middle of the slack rather than under the 32-wide slider: measured
	// before the fix, the third-dimension column was 166 wide and its strip 61 pixels from the
	// thumb. This is the assertion that would have caught it, and it is the same defect the
	// vertical harness had one unit earlier.
	for (const selector of ['.third', '.alpha']) {
		const centres = await page.getByTestId('alpha').evaluate((root, selector) => {
			const grid = root.querySelector<HTMLElement>(selector)!;
			const centre = (element: HTMLElement) => {
				const box = element.getBoundingClientRect();
				return box.left + box.width / 2;
			};
			return {
				strip: centre(grid.querySelector<HTMLElement>('.gradient')!),
				slider: centre(grid.querySelector<HTMLElement>('.picker-slider')!),
				column: grid.getBoundingClientRect().width
			};
		}, selector);
		expect(Math.abs(centres.strip - centres.slider)).toBeLessThanOrEqual(1);
		expect(centres.column).toBe(32);
	}
});
