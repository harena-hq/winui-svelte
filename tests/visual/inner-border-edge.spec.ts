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

/**
 * A tab header's state fills stop at the inner border edge of a border that paints nothing.
 *
 * The two sections above are about a translucent stroke: the fill shows *through* it, so
 * clipping changes what the stroke composites over. This one is the other half of the same
 * property, and it is geometry rather than compositing. `TabViewItemBorderThickness` is 1 on
 * every side (`TabView.xaml:298`, `TabView_themeresources.xaml:267`) and
 * `TabViewItemBorderBrush` is `SubtleFillColorTransparentBrush` (`TabView.xaml:299`,
 * `TabView_themeresources.xaml:69`) — fully transparent. So the question is not what colour the
 * ring composites to but whether the fill is in the ring at all: unclipped it is, and upstream
 * leaves the tab strip showing through.
 *
 * Upstream's tab header is `<Grid x:Name="TabContainer">` (`TabView.xaml:562`). What it takes
 * from the templated parent is four `{TemplateBinding}`s — Background, BorderBrush,
 * BorderThickness, FocusVisualMargin — and CornerRadius, through a `{Binding}` to that same
 * parent with a converter; its `Padding` is a `{ThemeResource}` and not a binding at all.
 * `BackgroundSizing` is none of them. The string does not occur
 * in `TabView_themeresources.xaml` at all, and the three places `TabView.xaml` writes it are the
 * close, add and scroll buttons' presenters (`:191`, `:242`, `:599`). So the Grid takes the
 * property's default.
 *
 * **A Grid reads that default from its own property**, which is the part worth writing down:
 * `CGrid::GetBackgroundSizing` is `Grid.cpp:1692`, beside `CBorder`'s at `Border.cpp:952` and
 * the two panels' at `StackPanel.cpp:945` and `RelativePanel.cpp:161`.
 * `Grid_BackgroundSizing` is registered sparse with no default (`StaticMetadata.g.cpp:33173`)
 * and is not among the exceptions the switch at `DependencyProperty.cpp:120` enumerates, so it
 * is the zero value of its enum, `InnerBorderEdge` (`EnumDefs.g.h:552`). The base-class fallback
 * at `framework.cpp:2711` returns that value outright and so agrees — but it is the fallback for
 * types that do not declare the property, and a Grid declares it.
 *
 * **The selected tab is deliberately not here, and the reason holds in two themes of three.**
 * Upstream's Selected state sets `TabContainer.Background` to `TabViewItemHeaderBackground`
 * (`TabView.xaml:342`) and paints the selected fill on a separate `SelectedBackgroundPath`
 * (`TabView.xaml:341`), which is a Path and has no border for a background to be sized against.
 * `.tab[data-selected='true']::before` is that Path. In light and dark that brush is fully
 * transparent, so the Grid paints nothing and there is no fill to clip; in high contrast it is
 * `SystemColorButtonFaceColor` and the Grid does paint. Our selected rule writes `transparent`
 * rather than the token, which is a separate and older divergence — named here so that the
 * exclusion is not read as covering it.
 *
 * **What is also not here:** the resting and disabled fills carry the clip too, and in light and
 * dark both are fully transparent, so no reading can separate them. They are visible only in
 * high contrast, where this test does not go, and the commit that added their clip says so
 * rather than implying they are pinned.
 *
 * The reading is the left and right edges on the horizontal midline, and not the top or bottom:
 * this row of tabs lays out at a fractional `y` (173.6875 on this build), so an element
 * screenshot is a whole device pixel taller than the element and its first row straddles the
 * boundary. The horizontal edges are on integers and have no such half-pixel.
 */

// Adding a third state here needs one thing re-checked: `.separator` is a sibling of `.body` at
// the tab's right edge and it spans the midline, so it would contaminate the right reading. Both
// states below force a pseudo-class that hides it — `.tab:hover .separator` and
// `.tab:active .separator` are `opacity: 0` — which is why it is not a problem now and would be
// at rest.
const TAB_STATES = ['hover', 'pressed'] as const;

/** The pixels in the body's left and right border strips, on its horizontal midline. */
async function sides(page: Page, body: Locator) {
	const shot = await body.screenshot();
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
			const y = Math.floor(image.naturalHeight / 2);
			return { left: at(0, y), right: at(image.naturalWidth - 1, y) };
		},
		`data:image/png;base64,${shot.toString('base64')}`
	);
}

test("a tab header's state fill stops at the inner border edge", async ({ page }) => {
	// The first TabView's third tab. Not the second: tab 0 is the selected one, and a selected
	// tab's own body carries `TabViewSelectedItemHeaderMargin` — `-1,0,-1,1`
	// (`TabView_themeresources.xaml:269`) — so it reaches a pixel into the neighbour on each side,
	// which is exactly the strip read here. Measured on the second tab, its left edge sits under
	// that body and reads one value under all three clips while its right edge, which nothing
	// overlaps, moves normally. So half the reading would be of another element, and it is the
	// half that cannot say so.
	const TAB = 2;

	/** What the page renders for the specimen, which differs between the two themes. */
	const rendered = () =>
		page
			.locator('.tab')
			.nth(TAB)
			.locator('.body')
			.evaluate((el) => getComputedStyle(el).color);

	let light = '';
	for (const theme of ['light', 'dark'] as const) {
		await page.goto('/dev/tab-view');
		// The Gallery's layout re-applies the stored theme in a mount effect, so a `dataset` write
		// alone is deleted again by hydration; write both channels, reload, then wait on the
		// **render** rather than reading back what the line above wrote.
		await page.evaluate((t) => {
			localStorage.setItem('winui-svelte:theme', t);
			document.documentElement.dataset.theme = t;
		}, theme);
		await page.reload();
		await page.locator('.tab').first().waitFor();
		if (theme === 'light') light = await rendered();
		else await expect.poll(rendered, { timeout: 5000 }).not.toBe(light);

		const tab = page.locator('.tab').nth(TAB);
		const body = tab.locator('.body');
		expect(await tab.getAttribute('data-selected'), `${theme}: the specimen is selected`).toBe(
			null
		);
		expect(await tab.getAttribute('aria-disabled'), `${theme}: the specimen is disabled`).toBe(
			null
		);

		// The guard the choice of specimen rests on, and a live one: on the second tab it fails,
		// naming the left edge. `elementsFromPoint` returns elements and not their pseudo-elements,
		// so what it catches is the neighbouring body's own negative margin — which is the same
		// pixel the `::before` paints, because that `::before` is sized to it.
		const covered = await body.evaluate((el) => {
			const r = el.getBoundingClientRect();
			const others = (x: number) =>
				document
					.elementsFromPoint(x, r.top + r.height / 2)
					.filter((e) => e !== el && e.classList.contains('body')).length;
			return { left: others(r.left + 0.5), right: others(r.right - 0.5) };
		});
		expect(covered.left, `${theme}: another body covers the left strip, so this reads it`).toBe(0);
		expect(covered.right, `${theme}: another body covers the right strip, so this reads it`).toBe(
			0
		);

		// The states are forced rather than driven: `.tab:active` needs the button held down, and
		// a real press on a tab selects it, which is the one state this test is not about.
		const cdp = await page.context().newCDPSession(page);
		await cdp.send('DOM.enable');
		await cdp.send('CSS.enable');
		const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
		const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
			nodeId: root.nodeId,
			selector: '.tab'
		});

		for (const state of TAB_STATES) {
			await cdp.send('CSS.forcePseudoState', {
				nodeId: nodeIds[TAB],
				forcedPseudoClasses: state === 'hover' ? ['hover'] : ['hover', 'active']
			});
			expect(
				await tab.evaluate((el, s) => el.matches(`:${s === 'pressed' ? 'active' : s}`), state),
				`${theme}: the ${state} state did not take`
			).toBe(true);

			/** Reads both strips with `background-clip` overridden, then puts the page back. */
			const withClip = async (value: string) => {
				const tag = await page.addStyleTag({
					content: `.body { background-clip: ${value} !important; }`
				});
				const pixels = await sides(page, body);
				await tag.evaluate((el) => (el as Element).remove());
				return pixels;
			};

			const shipped = await sides(page, body);
			expect(
				shipped,
				`${theme}: the ${state} fill reaches into the tab's own transparent border`
			).toEqual(await withClip('padding-box'));

			// The positive control, asserted per edge: a single `not.toEqual` on the pair passes
			// while one of the two edges is being read somewhere the fill never reaches.
			const unclipped = await withClip('border-box');
			expect(
				unclipped.left,
				`${theme}: an unclipped ${state} fill changed the left strip not at all`
			).not.toBe(shipped.left);
			expect(
				unclipped.right,
				`${theme}: an unclipped ${state} fill changed the right strip not at all`
			).not.toBe(shipped.right);
		}
		await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[TAB], forcedPseudoClasses: [] });
	}
});
