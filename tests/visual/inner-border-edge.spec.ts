import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { test } from './fixtures';

/**
 * A state's fill stops at the inner border edge, as the control's own resting fill does.
 *
 * XAML clips a background to the inner border edge unless `BackgroundSizing` says otherwise,
 * and in these three templates nothing says otherwise: the string does not occur in
 * `DatePicker_themeresources.xaml`, `TimePicker_themeresources.xaml` or
 * `CalendarDatePicker_themeresources.xaml` at all — no attribute, no setter, no key frame, and
 * no `{TemplateBinding BackgroundSizing}` on the presenter, where `Button`, `ToggleButton` and
 * `AppBarToggleButton` all carry one. So the value is the property's default in every state,
 * and the default is `InnerBorderEdge`: it is not among the exceptions the switch at
 * `DependencyProperty.cpp:120` enumerates, so it takes the zero value of its enum
 * (`EnumDefs.g.h:552`).
 *
 * The pin cannot show the renderer reading that value. `HWWalk.cpp` is not in the checkout, and
 * the geometry read that is — `framework.cpp:3842`, choosing at `framework.cpp:3950` — is
 * reachable only from the print path (`Border.cpp:451`, `ContentPresenter.cpp:1403`,
 * `panel.cpp:208`). `Border.cpp:668` is a hit test, which is a different question. The template
 * settles the value on its own; the two readings the pin carries agree about what it means.
 *
 * CSS clips to the border box instead, so each of these elements carries `padding-box` on its
 * fill. What made a test worth writing is that `background` is a **shorthand**: a state rule
 * that restates the brush resets `background-clip` with it, so the clip has to be repeated on
 * every state and its absence is invisible in the declaration that drops it. All three controls
 * had it on the resting rule and on none of the other three, and the difference is one pixel
 * wide — under any baseline's tolerance, which is why nothing caught it.
 *
 * The reading is the pixel at the box's left edge, which is the ring these controls paint their
 * border brush into: the brushes are gradients, a gradient cannot be a `border-color`, so the
 * border is transparent and `::after` paints the ring (`TextBox.svelte:177` has that in full).
 * The claim is that the fill contributes nothing there, so the test forces `padding-box` and
 * asserts the pixel does not move — theme- and brush-independent, unlike asserting a colour.
 *
 * **Forcing `border-box` is the positive control**, and it is what keeps the assertion from
 * being one that cannot disagree: an unclipped fill has to move that pixel, or the measurement
 * is reading somewhere the fill never reaches.
 *
 * The ring brush is not one brush across the four states: rest and hover alias
 * `ControlElevationBorderBrush` while pressed and disabled alias
 * `ControlStrokeColorDefaultBrush` (`DatePicker_themeresources.xaml:15`). Nothing here depends
 * on that, because each state is compared against itself under two clips and never against
 * another state.
 *
 * High contrast is left out on purpose. There the fill is `SystemColorButtonFaceColor` and the
 * stroke `SystemColorButtonTextColor`, both opaque, so an unclipped fill under an opaque stroke
 * changes nothing and the positive control could not fire.
 */

const CONTROLS = [
	{ name: 'CalendarDatePicker', route: '/dev/calendar-date-picker', box: '.box', index: 2 },
	{ name: 'DatePicker', route: '/dev/date-picker', box: '.flyout-button', index: 0 },
	{ name: 'TimePicker', route: '/dev/time-picker', box: '.flyout-button', index: 0 }
] as const;

const STATES = ['rest', 'hover', 'pressed', 'disabled'] as const;
type State = (typeof STATES)[number];

/** The pixel at the box's left edge, on its horizontal midline, as `r,g,b`. */
async function ring(page: Page, box: Locator) {
	const shot = await box.screenshot();
	return page.evaluate(
		async (url) => {
			const image = new Image();
			image.src = url;
			await image.decode();
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext('2d')!;
			context.drawImage(image, 0, 0);
			const [r, g, b] = context.getImageData(0, Math.floor(image.naturalHeight / 2), 1, 1).data;
			return `${r},${g},${b}`;
		},
		`data:image/png;base64,${shot.toString('base64')}`
	);
}

for (const control of CONTROLS)
	test(`${control.name}'s fill stops at the inner border edge in every state`, async ({ page }) => {
		await page.clock.setFixedTime(new Date('2026-09-08T12:00:00Z'));
		await page.goto(control.route);

		const box = page.locator(control.box).nth(control.index);
		await box.waitFor();

		// Pressing one of these buttons opens its flyout, which re-renders the button and drops
		// `:active` before a screenshot can be taken, so the state is forced rather than driven.
		// `disabled` is a property and needs no forcing.
		//
		// `DOM.querySelectorAll` does not pierce shadow roots where `page.locator` does, so the
		// two `index` values address the same element only while these routes carry none. They
		// carry none; and if that changed, the forced state would land on another node and the
		// guard in `enter` would say so rather than the run passing quietly.
		const cdp = await page.context().newCDPSession(page);
		await cdp.send('DOM.enable');
		await cdp.send('CSS.enable');
		const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
		const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
			nodeId: root.nodeId,
			selector: control.box
		});
		const nodeId = nodeIds[control.index];

		const enter = async (state: State) => {
			await box.evaluate((el, s) => ((el as HTMLButtonElement).disabled = s === 'disabled'), state);
			await cdp.send('CSS.forcePseudoState', {
				nodeId,
				forcedPseudoClasses:
					state === 'hover' ? ['hover'] : state === 'pressed' ? ['hover', 'active'] : []
			});
			// `rest` is guarded too, and the guard is the point: it is the one state defined by
			// what is *not* set, so without this a reordering of `STATES` — not a code change —
			// would measure a still-forced hover and report it as the resting reading.
			if (state === 'rest')
				expect(
					await box.evaluate((el) => el.matches(':hover') || el.matches(':active')),
					'the resting state is not resting'
				).toBe(false);
			else
				expect(
					await box.evaluate((el, s) => el.matches(`:${s === 'pressed' ? 'active' : s}`), state),
					`the ${state} state did not take`
				).toBe(true);
		};

		/** Reads the ring with `background-clip` overridden, then puts the page back. */
		const withClip = async (value: string) => {
			const tag = await page.addStyleTag({
				content: `${control.box} { background-clip: ${value} !important; }`
			});
			const pixel = await ring(page, box);
			await tag.evaluate((el) => (el as Element).remove());
			return pixel;
		};

		const setTheme = (theme: string) =>
			page.evaluate((t) => {
				localStorage.setItem('winui-svelte:theme', t);
				document.documentElement.dataset.theme = t;
			}, theme);

		const measure = async (theme: string) => {
			for (const state of STATES) {
				await enter(state);
				const shipped = await ring(page, box);
				expect(shipped, `${theme}, ${state}: the shipped fill reaches into the ring`).toBe(
					await withClip('padding-box')
				);
			}
			// The positive control, on the state with the widest separation.
			await enter('hover');
			expect(
				await withClip('border-box'),
				`${theme}, hovered: an unclipped fill changed nothing, so this reads somewhere it cannot reach`
			).not.toBe(await ring(page, box));
			await enter('rest');
		};

		await setTheme('light');
		const light = await ring(page, box);
		await measure('light');

		await setTheme('dark');
		// Reading `dataset.theme` back would only report what the line above wrote. What can
		// disagree is the render: these two themes paint this ring different colours, so until
		// the stylesheet has followed the attribute the pixel is still the light one — and if
		// the theme never took, this poll is what says so rather than a second light-theme pass
		// reported as a dark one. `themes.ts:74-90` records what that costs when nobody waits.
		await expect.poll(() => ring(page, box), { timeout: 5000 }).not.toBe(light);
		await measure('dark');
	});

/**
 * The same claim one element up: the flyout presenter's own fill stops at its stroke.
 *
 * Nothing above reaches this element. The three tests above are about a **state** rule dropping
 * a clip the base rule set; here the clip was simply never written, and the element is the
 * popup surface rather than the button that opens it. Upstream's presenter is a single
 * `<Border x:Name="Background">` binding `Background`, `BorderBrush` and `BorderThickness`
 * together — `DatePicker_themeresources.xaml:276` under the style at
 * `DatePicker_themeresources.xaml:260`, `TimePicker_themeresources.xaml:274` under
 * `TimePicker_themeresources.xaml:259` — and `BackgroundSizing` does not occur in either file,
 * so each Border takes the property's default. The same author writes it out on the presenter
 * next door: `MenuFlyout_themeresources.xaml:289` sets `BackgroundSizing="InnerBorderEdge"`
 * explicitly on `MenuFlyoutPresenter`'s template root.
 *
 * Two readings rather than one, because a single edge cannot say that the fill is what an
 * unclipped stroke lies on. `SurfaceStrokeColorFlyout` is translucent, so an unclipped stroke
 * takes its colour from the presenter's own fill, which is uniform: forcing `border-box` must
 * therefore collapse both edges onto one value, and that is asserted.
 *
 * **The converse is not asserted, and the reason is worth the line.** Clipped, the two edges do
 * differ on this build — the stroke then lies on what is behind the popup, and `PopupShadow` is
 * not the same above the presenter as beside it. But that difference is a fact about the shadow
 * and not about the clip: with `box-shadow: none` and the clip exactly as shipped, both edges
 * read one value again (228 light, 25 dark, measured). An assertion that the shipped edges
 * differ would go red on a shadow change with the fill perfectly faithful, and its message would
 * send the reader to the clip. The two assertions that carry this test — shipped equals forced
 * `padding-box`, and forced `border-box` differs — hold with or without a shadow.
 *
 * High contrast is left out for the same reason as above, and it is worth saying rather than
 * leaving as a silence: there the presenter's fill is `SystemColorWindowColor` and its stroke
 * `SystemColorWindowTextColor`, both opaque, so an unclipped fill under an opaque stroke
 * changes nothing and the positive control could not fire.
 */

const PRESENTERS = [
	{ name: 'DatePicker', route: '/dev/date-picker' },
	{ name: 'TimePicker', route: '/dev/time-picker' }
] as const;

/**
 * The two pixels inside the presenter's stroke: its left edge on the horizontal midline, and
 * its top edge on the vertical one.
 */
async function edges(page: Page, presenter: Locator) {
	const shot = await presenter.screenshot();
	return page.evaluate(
		async (url) => {
			const image = new Image();
			image.src = url;
			await image.decode();
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext('2d')!;
			context.drawImage(image, 0, 0);
			const at = (x: number, y: number) =>
				[...context.getImageData(x, y, 1, 1).data].slice(0, 3).join(',');
			return {
				left: at(0, Math.floor(image.naturalHeight / 2)),
				top: at(Math.floor(image.naturalWidth / 2), 0)
			};
		},
		`data:image/png;base64,${shot.toString('base64')}`
	);
}

for (const control of PRESENTERS)
	test(`${control.name}'s flyout presenter fill stops at the inner border edge`, async ({
		page
	}) => {
		/** What the page renders for the closed button, which differs between the two themes. */
		const rendered = () =>
			page
				.locator('.flyout-button')
				.first()
				.evaluate((el) => getComputedStyle(el).backgroundColor);

		let light = '';
		for (const theme of ['light', 'dark'] as const) {
			await page.goto(control.route);
			// The Gallery's layout re-applies the stored theme in a mount effect, so a `dataset`
			// write alone is deleted again by hydration; `themes.ts:74-90` records what that cost.
			// Write both channels, reload, and then wait on the **render** — reading `dataset`
			// back would only report what the line above wrote.
			await page.evaluate((t) => {
				localStorage.setItem('winui-svelte:theme', t);
				document.documentElement.dataset.theme = t;
			}, theme);
			await page.reload();
			if (theme === 'light') light = await rendered();
			else await expect.poll(rendered, { timeout: 5000 }).not.toBe(light);

			// The flyout centres itself on its button, so a specimen near the top of the page
			// opens a presenter whose own top edge is above the viewport — measured at y=-30 for
			// the first specimen here. The rows outside the page photograph as white and read as
			// an edge that never moves, which is a passing reading of nothing.
			//
			// The second specimen clears the viewport at this size on its own, and the first
			// cannot be centred at all (`block: 'center'` has nowhere to scroll to at the top of
			// a page), so the scroll below is not what the reading rests on. **The guard is**, and
			// it is a live one: opened from the first specimen with no scroll, all four of its
			// assertions are reachable and the top one fires.
			const button = page.locator('.flyout-button').nth(1);
			await button.evaluate((el) => el.scrollIntoView({ block: 'center' }));
			await button.click();
			const presenter = page.locator('.presenter');
			await presenter.waitFor({ state: 'visible' });
			await page.waitForFunction(() =>
				document.getAnimations().every((a) => a.playState !== 'running')
			);

			const box = (await presenter.boundingBox())!;
			const viewport = page.viewportSize()!;
			// Four assertions rather than one `&&`, so a failure names the edge that escaped:
			// the first reading of this took the presenter's top at y=-30 and photographed the
			// page outside it as an edge that never moves.
			const escaped = `${theme}: the presenter is not wholly in frame, so an edge reading is not an edge`;
			expect(box.x, `${escaped} (left)`).toBeGreaterThanOrEqual(0);
			expect(box.y, `${escaped} (top)`).toBeGreaterThanOrEqual(0);
			expect(box.x + box.width, `${escaped} (right)`).toBeLessThanOrEqual(viewport.width);
			expect(box.y + box.height, `${escaped} (bottom)`).toBeLessThanOrEqual(viewport.height);

			/** Reads both edges with `background-clip` overridden, then puts the page back. */
			const withClip = async (value: string) => {
				const tag = await page.addStyleTag({
					content: `.presenter { background-clip: ${value} !important; }`
				});
				const pixels = await edges(page, presenter);
				await tag.evaluate((el) => (el as Element).remove());
				return pixels;
			};

			const shipped = await edges(page, presenter);
			expect(shipped, `${theme}: the shipped fill reaches under the presenter's stroke`).toEqual(
				await withClip('padding-box')
			);

			// The positive control, and the shape of the defect in one line: unclipped, the stroke
			// lies on the presenter's own uniform fill, so its two edges read the same value.
			const unclipped = await withClip('border-box');
			expect(
				unclipped,
				`${theme}: an unclipped fill changed neither edge, so this reads somewhere it cannot reach`
			).not.toEqual(shipped);
			expect(
				unclipped.left,
				`${theme}: an unclipped stroke should read one value on both edges, because the fill it lies on is uniform`
			).toBe(unclipped.top);
		}
	});
