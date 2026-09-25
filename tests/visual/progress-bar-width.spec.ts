import { expect, test } from './fixtures';

type Page = import('@playwright/test').Page;

/**
 * A ProgressBar's indicators are whole pixels wide, and its indeterminate animation travels by
 * shares of the bar, not of the rounded indicators. Upstream sets each indicator's `Width` from
 * code (ProgressBar.cpp:174-196), which layout rounding rounds half up (framework.cpp:1234,
 * inlined.cpp:127), and builds the animation's positions from the unrounded width (:216-230).
 */

type Bar = {
	width: number;
	state: string;
	share: number | null;
	determinate: number;
	one: number;
	two: number;
};

async function bars(page: Page): Promise<Bar[]> {
	const read = await page.locator('.clip').evaluateAll((clips) =>
		clips.map((clip) => {
			const root = clip.closest('[role="progressbar"]')!;
			const part = (selector: string) =>
				clip.querySelector(selector)!.getBoundingClientRect().width;
			const now = root.getAttribute('aria-valuenow');
			const min = Number(root.getAttribute('aria-valuemin'));
			const max = Number(root.getAttribute('aria-valuemax'));
			return {
				width: clip.getBoundingClientRect().width,
				state: root.getAttribute('data-progress-state')!,
				share: now === null ? null : (Number(now) - min) / (max - min),
				determinate: part('.determinate'),
				one: part('.one'),
				two: part('.two')
			};
		})
	);
	expect(read.length).toBeGreaterThan(0);
	return read;
}

function expectRounded(bar: Bar) {
	const label = `${bar.state}, ${bar.width} wide`;
	expect(bar.one, `40%: ${label}`).toBe(Math.round(bar.width * 0.4));
	// Paused and errored indeterminate bars stretch the second to the whole width (:181).
	const twoShare = /^indeterminate-(paused|error)$/.test(bar.state) ? 1 : 0.6;
	expect(bar.two, `${twoShare * 100}%: ${label}`).toBe(Math.round(bar.width * twoShare));
	if (bar.share !== null && !bar.state.startsWith('indeterminate'))
		expect(bar.determinate, `the value's share: ${label}`).toBe(Math.round(bar.width * bar.share));
}

test('every indicator on the ProgressBar route is its share of the bar, rounded', async ({
	page
}) => {
	await page.goto('/dev/progress-bar');
	const all = await bars(page);
	all.forEach(expectRounded);
	// `value={25}` on a 130-pixel bar: 32.5, which rounds half up.
	expect(all.some((bar) => bar.width === 130 && bar.determinate === 33)).toBe(true);
});

test('a 131-pixel bar rounds its shares both ways', async ({ page }) => {
	// 40% is 52.4 and 60% is 78.6, a quarter is 32.75 and three quarters 98.25: two round
	// down and two up, so a rounding that always went one way fails here.
	await page.goto('/dev/progress-bar');
	await page.evaluate(() =>
		document
			.querySelectorAll<HTMLElement>('[role="progressbar"]')
			.forEach((bar) => (bar.style.width = '131px'))
	);
	const all = (await bars(page)).filter((bar) => bar.width === 131);
	expect(all.length).toBeGreaterThan(0);
	all.forEach(expectRounded);
	expect(all.some((bar) => bar.state === 'indeterminate' && bar.one === 52 && bar.two === 79)).toBe(
		true
	);
	expect(all.some((bar) => bar.share === 0.25 && bar.determinate === 33)).toBe(true);
	expect(all.some((bar) => bar.share === 0.75 && bar.determinate === 98)).toBe(true);
});

test('a paused indeterminate bar stretches its indicator to the whole bar, rounded', async ({
	page
}) => {
	// Upstream sets the stretched indicator to `maxIndicatorWidth` (:181), which layout rounding
	// rounds like the others: at 130.6 pixels it is 131, where `100%` would be 130.6.
	await page.goto('/dev/progress-bar');
	await page.evaluate(() => {
		document.querySelector<HTMLElement>(
			'[role="progressbar"][data-progress-state="indeterminate-paused"]'
		)!.style.width = '130.6px';
	});
	const paused = (await bars(page)).find((bar) => bar.state === 'indeterminate-paused')!;
	expect(paused.width).toBeCloseTo(130.6, 1);
	expect(paused.two).toBe(131);
});

test('the indeterminate animation travels by the bar, not by the rounded indicator', async ({
	page
}) => {
	// At 131 pixels the first indicator starts at -40% of the bar, -52.4, where -100% of the
	// rounded indicator would be -52; the second at -90%, -117.9, against -118.5.
	await page.goto('/dev/progress-bar');
	const starts = await page.evaluate(() => {
		const bar = document.querySelector<HTMLElement>(
			'[role="progressbar"][data-progress-state="indeterminate"]'
		)!;
		bar.style.width = '131px';
		const at = (selector: string) => {
			const indicator = bar.querySelector<HTMLElement>(selector)!;
			const animation = indicator.getAnimations()[0];
			animation.pause();
			animation.currentTime = 0;
			return new DOMMatrix(getComputedStyle(indicator).transform).m41;
		};
		return { one: at('.one'), two: at('.two') };
	});
	expect(starts.one).toBeCloseTo(-52.4, 1);
	expect(starts.two).toBeCloseTo(-117.9, 1);
});
