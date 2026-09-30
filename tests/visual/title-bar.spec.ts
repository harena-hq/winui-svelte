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

/**
 * The back and pane-toggle buttons keep their width however narrow the bar is.
 *
 * Both sit in `Auto` columns (`TitleBar.xaml:172`, `:174`). A grid measures a cell in an `Auto`
 * column at an unbounded width (`CGrid::MeasureCell`, `Grid.cpp:435-440`), raises the column's
 * minimum to the width the cell asks for (`CGrid::MeasureCellsGroup`, `:361`), and in arrange
 * gives no column less than its minimum (`CGrid::SetFinalSize`, `:1415`, `:1434`), so what gives
 * way in a narrow bar is the content's `*` column. The buttons used to shrink with it: at 300 both
 * were about 21 pixels wide.
 *
 * The Gallery's shell is the fixture, one page in so that the back button shows. Each button's
 * width is read at 800, where it is asserted to be its token's, and again at 300, where the
 * content is asserted to overflow its column, so the row is short of room when the second read is
 * taken.
 */
test('the title buttons keep their width in a narrow bar', async ({ page }) => {
	await page.setViewportSize({ width: 800, height: 720 });
	await page.goto('/');
	const bar = page.locator('[data-height][data-display-mode]');
	// The item's text begins with its icon's glyph.
	await page.locator('[role=treeitem]:visible', { hasText: /\bAll\s*$/ }).click();
	await expect(bar.locator('.back-button')).toBeVisible();

	const widths = () =>
		bar
			.locator('.title-button')
			.evaluateAll((buttons) => buttons.map((b) => b.getBoundingClientRect().width));
	const wide = await widths();
	expect(wide, 'the back and pane-toggle buttons are not both shown').toHaveLength(2);
	const tokens = await bar.evaluate((el) =>
		['--winui-TitleBarBackButtonWidth', '--winui-TitleBarPaneToggleButtonWidth'].map((name) =>
			parseFloat(getComputedStyle(el).getPropertyValue(name))
		)
	);
	expect(wide, 'a title button is not its token width at 800').toEqual(tokens);

	await page.setViewportSize({ width: 300, height: 720 });
	await page.evaluate(
		() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
	);
	expect(
		await bar.locator('.content-presenter').evaluate((el) => el.scrollWidth > el.clientWidth),
		'the content fits at 300, so nothing presses on the buttons'
	).toBe(true);
	expect(await widths(), 'a title button gave way').toEqual(wide);
});
