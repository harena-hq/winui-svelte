import { expect, CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('CommandBarFlyout in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'CommandBarFlyout', '/dev/command-bar-flyout');
});

test('the commands row is forty tall and the ellipsis forty-four wide', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	// CommandBarFlyout_themeresources.xaml:1043 and :568.
	await expect(page.getByTestId('default').locator('.primary')).toHaveCSS('height', '40px');
	await expect(page.getByTestId('default').locator('.more')).toHaveCSS('width', '44px');
});

test("a closed flyout's commands carry no label", async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	// CommandBarFlyout_themeresources.xaml:638 sets DefaultLabelPosition="Collapsed".
	await expect(page.getByTestId('default').locator('.primary .label')).toHaveCount(3);
	for (const label of await page.getByTestId('default').locator('.primary .label').all()) {
		await expect(label).not.toBeVisible();
	}
});

test('the ellipsis sits to the right of the last command', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout');
	const specimen = page.getByTestId('default');
	const more = await specimen.locator('.more').boundingBox();
	const lastCommand = await specimen.locator('.primary > button').last().boundingBox();
	expect(more).not.toBeNull();
	expect(lastCommand).not.toBeNull();
	// Adjacent `*` and `Auto` columns share an edge, so the ellipsis is not left of the last
	// command even though their bounding boxes do not have a gap.
	expect(more!.x).toBeGreaterThanOrEqual(lastCommand!.x + lastCommand!.width);
	expect(Math.abs(more!.y - lastCommand!.y)).toBeLessThanOrEqual(1);
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
		.getByTestId('default')
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
