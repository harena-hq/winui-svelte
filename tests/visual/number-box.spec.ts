import type { Locator } from '@playwright/test';
import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('NumberBox in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'NumberBox', '/dev/number-box');
});

/**
 * The spin buttons take the text control's button brushes, not the global repeat button's.
 *
 * The template's root `Grid` redefines the resting, pointer-over and pressed `RepeatButton*`
 * background, foreground and border brushes to the `TextControlButton*` brush of the same state,
 * in all three theme dictionaries (`NumberBox.xaml:61-102`), and the spin buttons, whose style is
 * `BasedOn` the `RepeatButton` style, sit inside it. The disabled background and foreground are
 * left alone, and the disabled border brush is redefined to the resting one (`:74`). The
 * component used to read the global brushes, and in light and dark drew a filled button with the
 * elevation ring where upstream draws no ring and, at rest, no fill.
 *
 * The up button is read at rest, under the pointer and with the button held, the down button at
 * rest and under the pointer, and a disabled up button at rest: its fill, its glyph, and the ring
 * its `::before` paints. Each is compared with the brush named above, resolved in the theme being
 * read. The `RepeatButton*` names the button's rules read are also resolved inside the button and
 * asserted to be those same brushes, so a redefinition that names a brush that does not exist fails
 * rather than falling to transparent, as a fill or ring does, which is what four of the targets are
 * in light and dark and five in high contrast. Each redefined brush is also resolved outside the
 * control, as the global one, and asserted to differ from the redefinition in at least one theme,
 * so every comparison that stands for the redefinition could have failed. The disabled fill and
 * glyph are the same brush either way and stand only for themselves.
 */
test("the spin buttons take the text control's button brushes", async ({ page }) => {
	type Brushes = [fill: string, text: string, ring: string];
	type Read = {
		button: 'up' | 'down';
		state: string;
		item: Locator;
		hold?: 'hover' | 'press';
		want: Brushes;
	};
	const UNKNOWN = 'rgb(1, 2, 3)';

	/** The fixture's NumberBox whose `.row` follows the heading with this text. */
	const under = (heading: string) =>
		page
			.locator('h2', { hasText: new RegExp(`^${heading}$`) })
			.locator('xpath=following-sibling::div[1]');
	/** The button's fill and glyph, and its ring as `::before` paints it. */
	const look = (item: Locator) =>
		item.evaluate((el): Brushes => {
			const style = getComputedStyle(el);
			const ring = getComputedStyle(el, '::before');
			return [
				style.backgroundColor,
				style.color,
				`${ring.backgroundColor} ${ring.backgroundImage}`
			];
		});
	/**
	 * Each theme resource as the button would paint it, resolved in a probe appended to `host`:
	 * inside the control for the redefinitions' targets, on the body for the global brushes.
	 */
	const resolve = async (host: Locator, names: Brushes) => {
		const brushes = await host.evaluate(
			(el, [names, unknown]) => {
				const probe = document.createElement('div');
				el.append(probe);
				const paint = (name: string) => {
					probe.style.background = `var(--winui-${name}, ${unknown})`;
					probe.style.color = `var(--winui-${name}, ${unknown})`;
					const style = getComputedStyle(probe);
					return style;
				};
				const fill = paint(names[0]).backgroundColor;
				const text = paint(names[1]).color;
				const ringStyle = paint(names[2]);
				const ring = `${ringStyle.backgroundColor} ${ringStyle.backgroundImage}`;
				probe.remove();
				return [fill, text, ring] as Brushes;
			},
			[names, UNKNOWN] as const
		);
		expect(brushes.join(' '), `${names.join(', ')}: not all theme resources`).not.toContain(
			UNKNOWN
		);
		return brushes;
	};

	/** For each redefinition, whether any theme so far has told it from the global brush. */
	const toldApart = new Map<string, boolean>();
	for (const theme of ['light', 'dark', 'high-contrast'] as const) {
		await page.goto('/dev/number-box');
		await page.evaluate((t) => {
			localStorage.setItem('winui-svelte:theme', t);
			document.documentElement.dataset.theme = t;
		}, theme);
		await page.reload();
		await expect
			.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''))
			.toBe(theme);

		const up = under('spin buttons').locator('.spin-up');
		const down = under('spin buttons').locator('.spin-down');
		const disabledUp = under('spin buttons, disabled').locator('.spin-up');
		await expect(disabledUp).toBeDisabled();
		const reads: Read[] = [
			{
				button: 'up',
				state: 'rest',
				item: up,
				want: [
					'TextControlButtonBackground',
					'TextControlButtonForeground',
					'TextControlButtonBorderBrush'
				]
			},
			{
				button: 'up',
				state: 'hover',
				item: up,
				hold: 'hover',
				want: [
					'TextControlButtonBackgroundPointerOver',
					'TextControlButtonForegroundPointerOver',
					'TextControlButtonBorderBrushPointerOver'
				]
			},
			{
				button: 'up',
				state: 'pressed',
				item: up,
				hold: 'press',
				want: [
					'TextControlButtonBackgroundPressed',
					'TextControlButtonForegroundPressed',
					'TextControlButtonBorderBrushPressed'
				]
			},
			{
				button: 'down',
				state: 'rest',
				item: down,
				want: [
					'TextControlButtonBackground',
					'TextControlButtonForeground',
					'TextControlButtonBorderBrush'
				]
			},
			{
				button: 'down',
				state: 'hover',
				item: down,
				hold: 'hover',
				want: [
					'TextControlButtonBackgroundPointerOver',
					'TextControlButtonForegroundPointerOver',
					'TextControlButtonBorderBrushPointerOver'
				]
			},
			{
				button: 'up',
				state: 'disabled',
				item: disabledUp,
				want: [
					'RepeatButtonBackgroundDisabled',
					'RepeatButtonForegroundDisabled',
					'TextControlButtonBorderBrush'
				]
			}
		];
		/** The global brush each redefinition replaces, in the same order. */
		const globals: Record<string, Brushes> = {
			rest: ['RepeatButtonBackground', 'RepeatButtonForeground', 'RepeatButtonBorderBrush'],
			hover: [
				'RepeatButtonBackgroundPointerOver',
				'RepeatButtonForegroundPointerOver',
				'RepeatButtonBorderBrushPointerOver'
			],
			pressed: [
				'RepeatButtonBackgroundPressed',
				'RepeatButtonForegroundPressed',
				'RepeatButtonBorderBrushPressed'
			],
			disabled: [
				'RepeatButtonBackgroundDisabled',
				'RepeatButtonForegroundDisabled',
				'RepeatButtonBorderBrushDisabled'
			]
		};

		for (const r of reads) {
			await r.item.scrollIntoViewIfNeeded();
			await page.mouse.move(0, 0);
			if (r.hold) await r.item.hover();
			if (r.hold === 'press') await page.mouse.down();
			const got = await look(r.item);
			await page.mouse.move(0, 0);
			if (r.hold === 'press') await page.mouse.up();

			const want = await resolve(r.item, r.want);
			const what = `${theme}, the ${r.button} button ${r.state}`;
			expect(got, what).toEqual(want);
			expect(
				await resolve(r.item, globals[r.state]),
				`${what}: the names its rules read are not these brushes`
			).toEqual(want);
			const global = await resolve(page.locator('body'), globals[r.state]);
			for (const i of [0, 1, 2]) {
				if (r.want[i] === globals[r.state][i]) continue;
				const key = `${r.state}: ${r.want[i]} for ${globals[r.state][i]}`;
				toldApart.set(key, (toldApart.get(key) ?? false) || want[i] !== global[i]);
			}
		}
	}
	expect(toldApart.size, 'no redefinition was compared').toBeGreaterThan(0);
	expect(
		[...toldApart].filter(([, apart]) => !apart).map(([key]) => key),
		'redefinitions no theme tells from the global brush'
	).toEqual([]);
});
