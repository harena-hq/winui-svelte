import { expect, test } from './fixtures';
import { THEMES } from './themes';

/**
 * A disabled ComboBox with nothing selected paints its placeholder in `Disabled`'s brush
 * (ComboBox_themeresources.xaml:464, `ComboBoxPlaceHolderForegroundDisabled`), not in rest's.
 * What this can tell apart is that pair: the other disabled foregrounds resolve to the same
 * colour in every theme of this pin, so which disabled key the rule names is not checked.
 * The route's last row is that trigger; the `disabled` row above it carries a selection and
 * shows no placeholder, which is why the wrong brush went unseen.
 */

const setTheme = (page: import('@playwright/test').Page, theme: string) =>
	page.evaluate((t) => {
		localStorage.setItem('winui-svelte:theme', t);
		document.documentElement.dataset.theme = t;
	}, theme);

test('a disabled placeholder takes the disabled brush in every theme', async ({ page }) => {
	await page.goto('/dev/combo-box');
	const placeholder = page.locator('.root[data-disabled] .trigger .placeholder');
	await expect(placeholder).toHaveCount(1);
	const colours: Record<string, [string, string, string]> = {};
	for (const theme of THEMES) {
		await setTheme(page, theme);
		colours[theme] = await placeholder.evaluate((el) => {
			const token = (name: string) => {
				const probe = document.createElement('span');
				probe.style.color = `var(--winui-${name})`;
				el.parentElement!.append(probe);
				const value = getComputedStyle(probe).color;
				probe.remove();
				return value;
			};
			return [
				getComputedStyle(el).color,
				token('ComboBoxPlaceHolderForegroundDisabled'),
				token('ComboBoxPlaceHolderForeground')
			];
		});
		const [painted, disabled] = colours[theme];
		expect(painted, theme).toBe(disabled);
	}
	// That each theme took: the disabled brush is a different colour in each of the three.
	expect(
		new Set(THEMES.map((theme) => colours[theme][1])).size,
		'a theme did not change what the probe resolved'
	).toBe(THEMES.length);
	// Where the two brushes differ at all, which is where a rule painting rest's could be seen.
	expect(
		THEMES.some((theme) => colours[theme][1] !== colours[theme][2]),
		'the disabled and resting brushes agree in every theme, so nothing here can disagree'
	).toBe(true);
});
