import { expect, CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('CommandBarFlyout in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'CommandBarFlyout', '/dev/command-bar-flyout');
});

test("a labelled command grows the bar's row to fifty-two", async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	const primary = page.getByTestId('default').locator('.primary');
	// CommandBarFlyout_themeresources.xaml:1015–:1016.
	expect(await primary.evaluate((element) => element.getBoundingClientRect().height)).toBe(52);
	// CommandBarFlyout_themeresources.xaml:1011–:1019.
	await expect(primary).toHaveAttribute('data-view-state', 'has-primary-labels');
});

test('a bar of collapsed labels keeps the forty-pixel row', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	const primary = page.getByTestId('labels-collapsed').locator('.primary');
	// CommandBarFlyout_themeresources.xaml:1043.
	expect(await primary.evaluate((element) => element.getBoundingClientRect().height)).toBe(40);
	// CommandBarFlyoutCommandBar.h:74–:80.
	await expect(primary).toHaveAttribute('data-view-state', 'no-primary-labels');
});

test('a label that wraps grows the row past its floor', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	const primary = page.getByTestId('wrapped-label').locator('.primary');
	const measured = await primary.evaluate((element) => ({
		row: element.getBoundingClientRect().height,
		label: element.querySelectorAll('.root .label')[1].getBoundingClientRect().height
	}));
	// :299's `TextWrapping="Wrap"` inside :274's 60-wide panel: "Save a copy" takes two line
	// boxes where "Share" takes one.
	expect(measured.label).toBeGreaterThan(20);
	// CommandBarFlyout_themeresources.xaml:1016. `Height="NaN"` is what lets the row follow that
	// second line; :1015's 52 is a floor and not a size. Measured with :1043's fixed 40 left in
	// place and only the 52 applied, this row was 52 and the label overflowed it.
	expect(measured.row).toBeGreaterThan(52);
});

test('one labelled command puts every command in the state', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	const primary = page.getByTestId('one-label').locator('.primary');
	// CommandBarFlyoutCommandBar.cpp:814–:820.
	await expect(primary).toHaveAttribute('data-view-state', 'has-primary-labels');
	const commands = primary.locator('.root');
	// CommandBarFlyoutCommandBar.cpp:814–:820.
	await expect(commands).toHaveCount(3);
	// CommandBarFlyout_themeresources.xaml:274.
	expect(
		await commands.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
	).toEqual([60, 60, 60]);
});

test('a labelled command is sixty wide and its icon sits nine below the top', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	const commands = page.getByTestId('default').locator('.primary .root');
	// CommandBarFlyout_themeresources.xaml:274 and :272.
	await expect(commands).toHaveCount(3);
	for (const command of await commands.all()) {
		const measured = await command.evaluate((root) => {
			const icon = root.querySelector<HTMLElement>('.icon')!;
			return {
				width: root.getBoundingClientRect().width,
				top: icon.getBoundingClientRect().top - root.getBoundingClientRect().top
			};
		});
		expect(measured.width).toBe(60);
		expect(measured.top).toBeCloseTo(9, 1);
	}
});

test("the label sits six below the icon and two above the command's foot", async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	const command = page.getByTestId('default').locator('.primary .root').first();
	const measured = await command.evaluate((root) => {
		const icon = root.querySelector<HTMLElement>('.icon')!;
		const label = root.querySelector<HTMLElement>('.label')!;
		return {
			gap: label.getBoundingClientRect().top - icon.getBoundingClientRect().bottom,
			marginBottom: getComputedStyle(label).marginBottom
		};
	});
	// CommandBarFlyout_themeresources.xaml:299.
	expect(measured.gap).toBeCloseTo(6, 1);
	// CommandBarFlyout_themeresources.xaml:299.
	expect(measured.marginBottom).toBe('2px');
});

test('the commands row is forty tall', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	// CommandBarFlyout_themeresources.xaml:1043. The specimen is the collapsed-label one because
	// :1043's fixed 40 is what `NoPrimaryLabels` leaves in place; :1015 replaces it with a 52
	// floor the moment any command on the bar carries a label.
	await expect(page.getByTestId('labels-collapsed').locator('.primary')).toHaveCSS(
		'height',
		'40px'
	);
});

test('a command whose own label position is collapsed draws no label', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	// What collapses these is the command's own `LabelPosition`, not the bar's
	// `DefaultLabelPosition` at :638: `HasVisibleLabel` reads the property itself
	// (CommandBarFlyoutCommandBar.h:74-:80) and AppBarButton_Partial.cpp:451-:458 computes the
	// effective position without writing it back, so a labelled command with the property unset
	// puts the bar into `HasPrimaryLabels` however the bar's default is spelled. This test read
	// `default` and cited :638 until the unit that built `HasPrimaryLabels` measured the original.
	const labels = page.getByTestId('labels-collapsed').locator('.primary .label');
	await expect(labels).toHaveCount(3);
	for (const label of await labels.all()) {
		await expect(label).not.toBeVisible();
	}
});

test('six commands do not push the bar past its maximum', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	// CommandBarFlyout_themeresources.xaml:639. The specimen's test id is on the bar itself:
	// this control owns its presenter rather than composing Flyout's, so there is no wrapper
	// between the popup and `PrimaryItemsRoot`.
	const bar = await page.getByTestId('many').boundingBox();
	expect(bar).not.toBeNull();
	expect(bar!.width).toBeLessThanOrEqual(440);
});

test('an icon-only command is as wide as the template asks', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	// `Width="NaN"` at :120 undoes AppBarButton_themeresources.xaml:136's 68, and :285's
	// ContentRoot MinWidth="40" is the floor. Measured before the override: 68 apiece.
	const widths = await page
		.getByTestId('labels-collapsed')
		.locator('.primary > .root')
		.evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().width)));
	expect(widths).toEqual([40, 40, 40]);
});

test('the flyout draws one border, not two', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	// The first build of this control composed `Flyout`, whose presenter carries its own
	// background, border, radius and padding while :627-642 supplies every one of them here.
	// The picture showed two rounded borders, one inside the other, and no gate saw it.
	const bar = page.getByTestId('default');
	await expect(bar).toHaveCSS('border-top-width', '1px');
	const nested = await bar.evaluate(
		(node) => node.parentElement!.querySelectorAll('[style*="border"], .presenter').length
	);
	expect(nested).toBe(0);
	// `CommandBarFlyoutBackground` is `#00000000`; WD-002 is what puts a fill behind it.
	const painted = await bar.evaluate((node) => getComputedStyle(node).backgroundImage);
	expect(painted).not.toBe('none');
});
