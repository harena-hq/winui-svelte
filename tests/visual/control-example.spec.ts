import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('ControlExample in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ControlExample', '/dev/control-example');
});

test("the source pane's copy button keeps its corners and border, 8 from the pane's edge", async ({
	page
}) => {
	await page.goto('/basicinput/button');
	// The first example's source pane, opened by its own header.
	const source = page.locator('[data-item-page] .source').first();
	await source.getByRole('button', { name: 'Source code' }).click();
	// The row the presenter fills, as the Expander's content grid gives it its whole width.
	const row = source.locator('.presenter-row');
	const presenter = row.locator(':scope > *');
	const copy = presenter.getByRole('button', { name: 'Copy to clipboard' });
	await expect(copy).toBeVisible();
	// Only the Expander's root takes the pane's squared corners and clip; the copy button keeps
	// ControlCornerRadius and an unclipped ring (CopyButton.xaml:42 and :30).
	const style = await copy.evaluate((button) => {
		const computed = getComputedStyle(button);
		return { radius: computed.borderRadius, overflow: computed.overflow };
	});
	expect(style).toEqual({ radius: '4px', overflow: 'visible' });
	// Padding="16,0,16,16" goes to the code alone (SampleCodePresenter.xaml:28); the button's
	// Border sits at Margin="0,0,8,0" from the presenter's own edge, at its top
	// (SampleCodePresenter.xaml:32-38).
	// Polled: the pane slides in as the Expander opens, and the two boxes are read apart.
	await expect
		.poll(async () => {
			const pane = (await row.boundingBox())!;
			const box = (await copy.boundingBox())!;
			return [pane.x + pane.width - (box.x + box.width), box.y - pane.y];
		})
		.toEqual([8, 0]);
	const padding = await presenter
		.locator('.code-area')
		.evaluate((area) => getComputedStyle(area).padding);
	expect(padding).toBe('0px 16px 16px');
});
