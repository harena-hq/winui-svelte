import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('TitleBar in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'TitleBar', '/dev/title-bar');
});

/**
 * The title bar goes compact when its content stops fitting, and back at the width it went at.
 *
 * `TitleBar.cpp`'s `OnSizeChanged` switches to the `Compact` state the first time the content's
 * desired width reaches its column's, and remembers the bar's width at that moment; it switches
 * back only once the bar is at least that wide again. `Compact` (`TitleBar.xaml:149-156`)
 * collapses the title and the subtitle and moves the content to the left with
 * `TitleBarCompactContentMargin` on its right, so a search box wider than its column is clipped
 * on the right, as the original Gallery's is, rather than on both sides.
 *
 * The Gallery's own shell is the fixture, because its search box is the content that stops
 * fitting. The window narrows ten pixels at a time until the bar goes compact, and the width it
 * went at is the one the rest of the test turns on. The clip is read at 300, narrower than the
 * box and the buttons together, because collapsing the title gives the box room again.
 */
test('the title bar goes compact when its content stops fitting', async ({ page }) => {
	await page.setViewportSize({ width: 800, height: 720 });
	await page.goto('/');
	// Other components carry `data-display-mode` too; `data-height` is the title bar's alone.
	const bar = page.locator('[data-height][data-display-mode]');
	const title = bar.locator('.title');
	const presenter = bar.locator('.content-presenter');
	const mode = () => bar.getAttribute('data-display-mode');
	const settle = () =>
		page.evaluate(
			() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
		);

	await expect(bar).toHaveAttribute('data-display-mode', 'expanded');
	await expect(title).toBeVisible();

	let width = 800;
	while ((await mode()) === 'expanded') {
		width -= 10;
		expect(width, 'the bar never went compact').toBeGreaterThan(200);
		await page.setViewportSize({ width, height: 720 });
		await settle();
	}
	const threshold = width;
	expect(threshold, 'the bar went compact too narrow for the reads below').toBeGreaterThan(340);

	await expect(title).toBeHidden();

	// Collapsing the title widens the column, so at the width the bar went compact at the box
	// fits again; it is clipped once the window is narrower than the box and the buttons.
	for (const narrower of [threshold - 40, 300, threshold - 1]) {
		await page.setViewportSize({ width: narrower, height: 720 });
		await settle();
		expect(await mode(), `the bar left compact at ${narrower}, below ${threshold}`).toBe('compact');
		if (narrower !== 300) continue;
		const edges = await presenter.evaluate((el) => {
			const box = el.getBoundingClientRect();
			const child = el.firstElementChild!.getBoundingClientRect();
			return {
				presenterLeft: box.left,
				childLeft: child.left,
				childOverflowsRight: child.right > box.right,
				marginRight: getComputedStyle(el).marginRight
			};
		});
		expect(edges.childOverflowsRight, 'the content fits at 300, so nothing is clipped').toBe(true);
		expect(edges.childLeft, 'the content is clipped on the left too').toBe(edges.presenterLeft);
		expect(edges.marginRight).toBe('16px');
	}

	await page.setViewportSize({ width: threshold, height: 720 });
	await settle();
	expect(await mode(), `the bar stayed compact back at ${threshold}`).toBe('expanded');
	await expect(title).toBeVisible();
});
