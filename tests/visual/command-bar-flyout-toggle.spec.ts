import type { Locator } from '@playwright/test';
import { expect, CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

function overflow(bar: Locator) {
	return bar.locator('..').locator('.overflow');
}

test('CommandBarFlyout toggle commands in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'CommandBarFlyoutToggle', '/dev/command-bar-flyout-toggle');
});

test('a toggle and a button agree on where the icon sits', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const commands = page.getByTestId('bar-toggles-labels').locator('.primary .root');
	const toggle = commands.first();
	const button = commands.nth(2);
	const [toggleTop, buttonTop, toggleOffset, buttonOffset] = await Promise.all([
		toggle.locator('.icon').evaluate((element) => element.getBoundingClientRect().top),
		button.locator('.icon').evaluate((element) => element.getBoundingClientRect().top),
		toggle.evaluate((root) => {
			const icon = root.querySelector<HTMLElement>('.icon')!;
			return icon.getBoundingClientRect().top - root.getBoundingClientRect().top;
		}),
		button.evaluate((root) => {
			const icon = root.querySelector<HTMLElement>('.icon')!;
			return icon.getBoundingClientRect().top - root.getBoundingClientRect().top;
		})
	]);
	// CommandBarFlyout_themeresources.xaml:488 and :273.
	expect(toggleTop).toBeCloseTo(buttonTop, 1);
	// CommandBarFlyout_themeresources.xaml:488 and :273.
	expect(toggleOffset).toBeCloseTo(9, 1);
	expect(buttonOffset).toBeCloseTo(9, 1);
});

test("the ellipsis button is as tall as the bar's interior", async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const specimen = page.getByTestId('bar-toggles-labels');
	const primary = specimen.locator('.primary');
	const more = specimen.locator('.more');
	// CommandBarFlyout_themeresources.xaml:573's `VerticalAlignment="Stretch"` against :1043's
	// `Margin="3,3,0,3"`: the button fills the bar's interior, which is the command row plus
	// three above and three below. The row's height is read from the DOM rather than written as
	// 58, so this says the ellipsis tracks the row instead of restating :1015's number.
	expect(
		Math.abs(
			(await more.evaluate((element) => element.getBoundingClientRect().height)) -
				((await primary.evaluate((element) => element.getBoundingClientRect().height)) + 6)
		)
	).toBeLessThanOrEqual(0.5);
});

test('a secondary command never enters the labelled state', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const specimen = page.getByTestId('overflow-icons');
	// CommandBarFlyoutCommandBar.cpp:803–:820.
	await expect(specimen.locator('.primary')).toHaveAttribute(
		'data-view-state',
		'has-primary-labels'
	);
	const rows = overflow(specimen).locator('.root');
	// CommandBarFlyoutCommandBar.cpp:822–:829.
	await expect(rows).toHaveCount(3);
	for (const row of await rows.all()) {
		await expect(row).toHaveAttribute('data-view-state', /^overflow/);
		// CommandBarFlyout_themeresources.xaml:299 and :514.
		await expect(row.locator('.label')).toHaveCSS('display', 'none');
	}
});

test("a checked toggle on the bar wears the flyout's checked skin", async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const checked = page.getByTestId('bar-toggles').locator('.primary .root[data-checked="true"]');
	const measured = await checked.evaluate((root) => {
		const fill = root.querySelector<HTMLElement>('.fill')!;
		// A token is resolved by painting it on a throwaway span inside the same scope, so every
		// value below is read back in one notation. `getPropertyValue` would return whichever
		// notation the token happens to carry and make the comparisons about spelling.
		const resolve = (token: string) => {
			const probe = document.createElement('span');
			probe.style.background = `var(${token})`;
			root.append(probe);
			const style = getComputedStyle(probe);
			const out = { color: style.backgroundColor, image: style.backgroundImage };
			probe.remove();
			return out;
		};
		const ring = getComputedStyle(fill, '::after');
		return {
			fill: getComputedStyle(fill).backgroundColor,
			accent: resolve('--winui-CommandBarFlyoutAppBarButtonBackgroundChecked').color,
			ringColor: ring.backgroundColor,
			ringImage: ring.backgroundImage,
			libraryRing: resolve('--winui-AccentControlElevationBorderBrush').image
		};
	});
	// The accent fill is `:388`. It resolves to the same brush the library's own
	// `AppBarToggleButton` already uses, so this half is a regression guard and not evidence
	// that the redefinition is in force.
	expect(measured.fill).toBe(measured.accent);
	// The ring is the half that isolates it. `:316` is the only `BorderBrush` the flyout's
	// toggle style states and no visual state changes it, so a checked command in this flyout
	// draws no ring at all — where the library's checked ring is
	// `AccentControlElevationBorderBrush`, a gradient. Measured without the redefinition:
	// `linear-gradient(to top, rgba(0, 0, 0, 0.4) 0.99px, rgba(255, 255, 255, 0.08) 3px)`.
	// Asserting that the library's brush really is still a gradient is what stops this test
	// quietly becoming a tautology if that brush is ever flattened.
	expect(measured.libraryRing).toContain('gradient');
	expect(measured.ringImage).toBe('none');
	expect(measured.ringColor).toMatch(/^rgba\([^)]*,\s*0\)$/);
});

test('a toggle command in this flyout paints no ring', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const fill = page
		.getByTestId('bar-toggles')
		.locator('.primary .root[data-checked] .fill')
		.first();
	// `:313` states no `BorderThickness`, so the control default of zero stands — where the
	// library's own template binds a thickness of 1. The difference only paints in high
	// contrast, where `:100`'s `SystemControlForegroundTransparentBrush` is the system button
	// text colour rather than anything transparent.
	await expect(fill).toHaveCSS('border-top-width', '0px');
	// The ring is a masked pseudo-element sized from the same token, so zeroing the border alone
	// would leave it drawing one pixel outside the fill instead of on it.
	const ring = await fill.evaluate((element) => getComputedStyle(element, '::after').content);
	expect(ring).toBe('none');
});

test("every command's icon is centred in the bar row, toggles included", async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const specimen = page.getByTestId('bar-toggles');
	const row = await specimen.locator('.primary').boundingBox();
	expect(row).not.toBeNull();
	const middle = row!.y + row!.height / 2;
	// Three commands: two toggles and a button. `:506` top-aligns the toggle's panel where
	// `:291` centres the button's, and this asserts that the two are *not* split here — see the
	// note on `.primary .root .icon` in `CommandBarFlyout.svelte` for the capture behind that.
	// Before the content box stopped being floored at `AppBarThemeCompactHeight`, all three sat
	// four pixels below this line.
	const icons = specimen.locator('.primary .root .icon');
	await expect(icons).toHaveCount(3);
	for (const icon of await icons.all()) {
		const box = await icon.boundingBox();
		expect(box).not.toBeNull();
		expect(Math.abs(box!.y + box!.height / 2 - middle)).toBeLessThanOrEqual(1);
	}
});

test("an overflow row's inner border is inset two pixels on every side", async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const fill = overflow(page.getByTestId('overflow-plain')).locator('.root .fill').first();
	const inset = await fill.evaluate((element) => {
		const computed = getComputedStyle(element);
		return [computed.top, computed.right, computed.bottom, computed.left];
	});
	expect(inset).toEqual(['2px', '2px', '2px', '2px']);
});

test("the overflow check glyph is twelve point and offset fifteen from the row's left", async ({
	page
}) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const check = overflow(page.getByTestId('overflow-plain')).locator('.check').first();
	const computed = await check.evaluate((element) => {
		const style = getComputedStyle(element);
		return { fontSize: style.fontSize, margin: style.margin };
	});
	expect(computed).toEqual({ fontSize: '12px', margin: '4px 14px 4px 15px' });
});

test('a plain overflow row indents its label by thirty-nine', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const labels = overflow(page.getByTestId('overflow-plain')).locator('.root .overflow-label');
	await expect(labels).toHaveCount(3);
	expect(
		await labels.evaluateAll((elements) =>
			elements.map((element) => getComputedStyle(element).marginLeft)
		)
	).toEqual(['39px', '39px', '39px']);
	// `:301` and `:516` both state `Padding="0,6,0,7"`, against the `0,5,0,8` the library's own
	// templates carry. Nothing else asserts it.
	await expect(labels.first()).toHaveCSS('padding', '6px 0px 7px');
});

test('an overflow row with icons indents its label by sixty-seven', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const labels = overflow(page.getByTestId('overflow-icons')).locator('.root .overflow-label');
	await expect(labels).toHaveCount(3);
	expect(
		await labels.evaluateAll((elements) =>
			elements.map((element) => getComputedStyle(element).marginLeft)
		)
	).toEqual(['67px', '67px', '67px']);
});

test('an overflow row with icons indents its icon by thirty-nine', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const icons = overflow(page.getByTestId('overflow-icons')).locator('.root .icon');
	await expect(icons).toHaveCount(3);
	expect(
		await icons.evaluateAll((elements) =>
			elements.map((element) => getComputedStyle(element).marginLeft)
		)
	).toEqual(['39px', '39px', '39px']);
});

test('a checked overflow row shows its check glyph and not the accent fill', async ({ page }) => {
	await page.goto('/dev/command-bar-flyout-toggle');
	const rows = overflow(page.getByTestId('overflow-plain')).locator('.root[data-checked]');
	const checked = rows.filter({ has: page.locator('.overflow-label', { hasText: 'Word wrap' }) });
	const unchecked = rows.filter({
		has: page.locator('.overflow-label', { hasText: 'Show ruler' })
	});
	// Both colours are read as `backgroundColor` so the comparison is between two values in the
	// same notation. Reading the token with `getPropertyValue` instead would compare `rgb(...)`
	// against whatever notation the token happens to carry, and the inequality would hold for
	// the notation rather than for the colour.
	const appearance = await checked.evaluate((root) => {
		const probe = document.createElement('span');
		probe.style.background = 'var(--winui-CommandBarFlyoutAppBarButtonBackgroundChecked)';
		root.append(probe);
		const accent = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return {
			accent,
			check: getComputedStyle(root.querySelector<HTMLElement>('.check')!).opacity,
			fill: getComputedStyle(root.querySelector<HTMLElement>('.fill')!).backgroundColor
		};
	});
	expect(appearance.check).toBe('1');
	await expect(unchecked.locator('.check')).toHaveCSS('opacity', '0');
	// `AppBarToggleButton_themeresources.xaml:412`-`:419` sets no `Background` for
	// `OverflowChecked`, so a checked overflow row keeps the transparent fill the template binds
	// and says it is checked with the glyph alone. Asserted as "fully transparent" rather than as
	// "not the accent", because a not-equal on two colours passes for a row painted any third
	// colour by accident. Measured: `rgba(255, 255, 255, 0)` against an accent of
	// `rgb(0, 103, 192)` — the channels differ too, so the alpha is the claim worth making.
	expect(appearance.fill).toMatch(/^rgba\([^)]*,\s*0\)$/);
	expect(appearance.fill).not.toBe(appearance.accent);
});
