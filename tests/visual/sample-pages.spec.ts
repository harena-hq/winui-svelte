/**
 * The Gallery's sample pages (SampleSupport/SamplePages/), drawn on a harness in a frame 860
 * wide, the content area a NavigationView example offers on the reference guest.
 */
import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

const frame = (page: Page, name: string) => page.locator(`[data-sample-page="${name}"]`);

/** Each element's box relative to its frame, rounded. */
async function boxes(target: Locator, selector: string) {
	return target.evaluate((f, sel) => {
		const o = f.getBoundingClientRect();
		return [...f.querySelectorAll(sel)].map((e) => {
			const r = e.getBoundingClientRect();
			return {
				x: Math.round(r.x - o.x),
				y: Math.round(r.y - o.y),
				width: Math.round(r.width),
				height: Math.round(r.height),
				background: getComputedStyle(e).backgroundColor
			};
		});
	}, selector);
}

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/sample-pages');
});

test("SamplePage1's tiles sit where the original's do in the same width", async ({ page }) => {
	// Measured on the reference guest, the first NavigationView example's content area at
	// x=691: the accent tile at 5, 250 wide and 314 tall, a pixel above the grey tiles, which
	// are 288 wide from 266 and 566, in rows 162 apart.
	const [darkA, lightA, lightB, darkB, source] = await boxes(
		frame(page, 'SamplePage1'),
		'.grid > div'
	);
	expect(source).toMatchObject({ x: 5, y: 5, width: 250, height: 314 });
	expect(darkA).toMatchObject({ x: 266, y: 6, width: 288, height: 150 });
	expect(lightA).toMatchObject({ x: 566, y: 6, width: 288, height: 150 });
	expect(lightB).toMatchObject({ x: 266, y: 168, width: 288, height: 150 });
	expect(darkB).toMatchObject({ x: 566, y: 168, width: 288, height: 150 });
	expect([darkA, lightA, lightB, darkB].map((t) => t.background)).toEqual([
		'rgb(169, 169, 169)',
		'rgb(211, 211, 211)',
		'rgb(211, 211, 211)',
		'rgb(169, 169, 169)'
	]);
	expect(source.background).toBe(
		await page
			.evaluate(() =>
				getComputedStyle(document.documentElement)
					.getPropertyValue('--winui-SystemAccentColor')
					.trim()
			)
			.then((hex) => {
				const n = parseInt(hex.slice(1), 16);
				return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
			})
	);
});

test("SamplePage2's accent tile is 150 by 200 at a margin of 12, beside its text", async ({
	page
}) => {
	const [destination, content] = await boxes(frame(page, 'SamplePage2'), '.grid > div');
	expect(destination).toMatchObject({ x: 12, y: 12, width: 150, height: 200 });
	expect(content.x).toBe(12 + 150 + 12 + 12);
	await expect(frame(page, 'SamplePage2').locator('.winui-TitleTextBlockStyle')).toHaveText(
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
	);
	// MinHeight="200" (SamplePage2.xaml:38). The 200-high tile in the same row would also give
	// the panel 200, as a Stretch-aligned panel takes its row's height, so the tile is taken
	// away with the text and the panel's own minimum is all that is left.
	await frame(page, 'SamplePage2').evaluate((f) => {
		f.querySelectorAll('.content p').forEach((p) => (p.textContent = ''));
		(f.querySelector('.destination') as HTMLElement).style.display = 'none';
	});
	const [emptied] = await boxes(frame(page, 'SamplePage2'), '.grid > div:not(.destination)');
	expect(emptied.height).toBe(200);
});

test("SamplePage3's first column is twice each other, its tall tile across two rows", async ({
	page
}) => {
	const [tall, , gray, light] = await boxes(frame(page, 'SamplePage3'), '.grid > div');
	// 2*,*,* of 860, each tile inset 5.
	expect(tall.width + 10).toBeCloseTo(2 * (light.width + 10), 0);
	expect(tall.height).toBe(150 + 10 + 150);
	expect(gray.background).toBe('rgb(128, 128, 128)');
});

test("SamplePage4's first Grid holds all three tiles in one row, the second below it", async ({
	page
}) => {
	const tiles = await boxes(frame(page, 'SamplePage4'), '.wide-first > div');
	expect(tiles.map((t) => t.y)).toEqual([5, 5, 5]);
	expect(tiles[0].width + 10).toBeCloseTo(2 * (tiles[1].width + 10), 0);
	const second = await boxes(frame(page, 'SamplePage4'), '.wide-last > div');
	// *,*,2*: IndianRed in the wide last column.
	expect(second[2].width + 10).toBeCloseTo(2 * (second[0].width + 10), 0);
	expect(second[2].background).toBe('rgb(205, 92, 92)');
	// The StackPanel stacks the second Grid under the first's 160-high row.
	expect(second.map((t) => t.y)).toEqual([165, 165, 165]);
});

test('SamplePage5 and 6 draw their ellipses at their sizes, centred in their cells', async ({
	page
}) => {
	// Each row is a tile's 150 and its margins, 160 high; the columns are a sixth, a sixth and
	// two thirds of 860.
	const sixth = 860 / 6;
	const five = await boxes(frame(page, 'SamplePage5'), '.ellipse');
	expect(five.map((e) => [e.width, e.height])).toEqual([
		[150, 150],
		[75, 75]
	]);
	const centre = (e: { x: number; y: number; width: number; height: number }) => [
		e.x + e.width / 2,
		e.y + e.height / 2
	];
	expect(centre(five[0])[0]).toBeCloseTo(2 * sixth + 2 * sixth, 0);
	expect(centre(five[0])[1]).toBeCloseTo(80, 0);
	// The 75 one spans the first two columns and is centred across them, in the second row.
	expect(centre(five[1])[0]).toBeCloseTo(sixth, 0);
	// Within a pixel: the boxes are rounded before an odd size is halved.
	expect(Math.abs(centre(five[1])[1] - (160 + 80))).toBeLessThanOrEqual(1);
	expect(five.map((e) => e.background)).toEqual(['rgb(143, 188, 143)', 'rgb(60, 179, 113)']);
	const six = await boxes(frame(page, 'SamplePage6'), '.ellipse');
	expect(six.map((e) => e.width)).toEqual([20, 50, 50, 20]);
	expect(six.map((e) => centre(e).map((v) => Math.round(v)))).toEqual([
		[Math.round(sixth / 2), 80],
		[Math.round(sixth * 1.5), 80],
		[Math.round(sixth / 2), 240],
		[Math.round(sixth * 1.5), 240]
	]);
	expect(six.map((e) => e.background)).toEqual([
		'rgb(72, 209, 204)',
		'rgb(70, 130, 180)',
		'rgb(176, 224, 230)',
		'rgb(72, 209, 204)'
	]);
});

test('the settings page centres its title', async ({ page }) => {
	const title = frame(page, 'SampleSettingsPage').getByText('Sample Settings Page', {
		exact: true
	});
	await expect(title).toHaveClass(/winui-TitleTextBlockStyle/);
	// The text run itself, since a stretched paragraph would centre its box whatever its text did.
	const t = await title.evaluate((el) => {
		const range = document.createRange();
		range.selectNodeContents(el);
		const r = range.getBoundingClientRect();
		return { x: r.x, y: r.y, width: r.width, height: r.height };
	});
	const f = (await frame(page, 'SampleSettingsPage').boundingBox())!;
	// Within a pixel: the run's box is the font's, not the line's, so it can sit half a pixel off.
	expect(Math.abs(t.x + t.width / 2 - f.x - 430)).toBeLessThanOrEqual(1);
	expect(Math.abs(t.y + t.height / 2 - f.y - 350)).toBeLessThanOrEqual(1);
});
