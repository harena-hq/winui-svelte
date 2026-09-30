import { expect } from '@playwright/test';
import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('NavigationView in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'NavigationView', '/dev/navigation-view');
});

/**
 * Top mode strokes the content area with the content area's own brush.
 *
 * `ContentGrid` takes `NavigationViewContentGridBorderBrush` (`NavigationView.xaml:392`), and
 * the `TopNavigationMinimal` state (`NavigationView.xaml:25`) changes only its thickness, radius
 * and margin, so in top mode the stroke is still that brush: `CardStrokeColorDefaultBrush` in
 * light and dark, `SystemControlTransparentBrush` in high contrast.
 * `NavigationViewItemSeparatorForeground` is the pane's stroke (`RootSplitView`,
 * `NavigationView.xaml:289`). The two agree in light, which is how the substitution went unseen,
 * and part in dark — white at 8% against black at 10% — and in high contrast, where it drew a
 * white line upstream does not.
 *
 * The top-mode content area is compared with the route's first `auto` one, whose stroke is the
 * base rule's, so the assertion holds whatever the tokens resolve to. The separator brush is
 * resolved beside it to show the comparison can fail: it has to differ from the content brush in
 * dark and high contrast, or the override could come back with this test still green.
 */
test("top mode strokes the content area with the content grid's own brush", async ({ page }) => {
	for (const theme of ['light', 'dark', 'high-contrast'] as const) {
		await page.goto('/dev/navigation-view');
		await page.evaluate((t) => {
			localStorage.setItem('winui-svelte:theme', t);
			document.documentElement.dataset.theme = t;
		}, theme);
		await page.reload();
		// The page is prerendered with no `data-theme`, and after the reload only the layout's
		// mount effect writes it, from the stored value — so here the attribute is the render,
		// which it is not before a reload. Waiting on a stroke leaving the previous theme's value
		// is not enough: the prerendered default can satisfy that before hydration.
		await expect
			.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''), {
				timeout: 5000
			})
			.toBe(theme);

		// One read, so the three values come from one style resolution.
		const { content, top, separator } = await page.evaluate(() => {
			const stroke = (selector: string) =>
				getComputedStyle(document.querySelector(selector)!).borderTopColor;
			const probe = document.createElement('div');
			probe.style.color = 'var(--winui-NavigationViewItemSeparatorForeground)';
			document.body.append(probe);
			const separator = getComputedStyle(probe).color;
			probe.remove();
			return {
				content: stroke(".root[data-pane-display-mode='auto'] .content-grid"),
				top: stroke(".root[data-pane-display-mode='top'] .content-grid"),
				separator
			};
		});

		expect(
			top,
			`${theme}: the top-mode content area is not stroked with the content grid's brush`
		).toBe(content);
		if (theme !== 'light')
			expect(
				separator,
				`${theme}: the separator brush is the content brush here, so the comparison above cannot fail`
			).not.toBe(content);
	}
});
