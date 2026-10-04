import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('ProgressBar in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ProgressBar', '/dev/progress-bar');
});

// ProgressBar.xaml:158 centres the 1px track in the 3px row, which is one whole row: the middle
// of the three the indicator paints. A track placed on a half pixel paints two rows at half
// strength, which is what this counts. The clip runs two rows past the bar on each side, so the
// bar's rows are read against the page whether it sits on a whole pixel or not, and the theme is
// pinned to light: in high contrast the track is the window colour and has nothing to show.
test('the track is one whole row, on the middle of the bar', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('winui-svelte:theme', 'light'));
	await page.goto('/dev/progress-bar');
	await expect
		.poll(() => page.evaluate(() => document.documentElement.dataset.theme))
		.toBe('light');
	const bar = page.getByRole('progressbar').nth(2);
	await expect(bar).toHaveAttribute('aria-valuenow', '50');
	const box = (await bar.boundingBox())!;
	const top = Math.floor(box.y) - 2;
	const shot = await page.screenshot({
		clip: { x: box.x, y: top, width: box.width, height: Math.ceil(box.y + box.height) + 2 - top }
	});
	const { fill, track } = await page.evaluate(async (data) => {
		const image = new Image();
		image.src = `data:image/png;base64,${data}`;
		await image.decode();
		const canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		const context = canvas.getContext('2d')!;
		context.drawImage(image, 0, 0);
		const pixel = (x: number, y: number) => [...context.getImageData(x, y, 1, 1).data.slice(0, 3)];
		// Row 0 is two rows above the bar: the page, whatever the theme makes it.
		const painted = (x: number) => {
			const page = pixel(x, 0);
			return [...Array(image.height).keys()].filter(
				(y) => pixel(x, y).reduce((sum, value, i) => sum + Math.abs(value - page[i]), 0) > 12
			);
		};
		return {
			fill: painted(Math.floor(image.width / 4)),
			track: painted(Math.floor((image.width * 3) / 4))
		};
	}, shot.toString('base64'));
	expect(fill).toHaveLength(3);
	expect(track).toEqual([fill[1]]);
});
