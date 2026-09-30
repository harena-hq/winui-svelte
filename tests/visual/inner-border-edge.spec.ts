import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { test } from './fixtures';
import { growViewportToContent } from './themes';

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
 * border is transparent and `::after` paints the ring (the comment above TextBox.svelte's
 * `.box::after` has that in full). The claim is that the fill contributes nothing there, so the
 * test forces `padding-box` and asserts the pixel does not move — theme- and brush-independent,
 * unlike asserting a colour.
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
		// reported as a dark one. `snapshotAllThemes` in themes.ts records what that costs when
		// nobody waits.
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
			// write alone is deleted again by hydration; `snapshotAllThemes` in themes.ts records
			// what that cost.
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

/**
 * The ComboBox dropdown's own fill stops at its stroke, and this template says so in a word.
 *
 * Nothing above reaches this element, and what it costs to establish differs from the two
 * sections above it. The pickers' presenters take `BackgroundSizing`'s default because the
 * string does not occur in their files at all, so the value has to be argued down a chain of
 * registration and enum defaults. `ComboBox_themeresources.xaml:590` writes
 * `BackgroundSizing="InnerBorderEdge"` into `PopupBorder`'s attribute list, beside the
 * `Background`, `BorderBrush` and `BorderThickness` it binds on the same line. The claim here
 * rests on the template and on nothing else.
 *
 * `ComboBoxDropDownBorderBrush` aliases `SurfaceStrokeColorFlyoutBrush`, which resolves to
 * `#0000000f` in light and `#00000033` in dark — translucent in both, which is what makes the
 * clip observable: unclipped, the stroke lies on the dropdown's own opaque fill and reads one
 * value wherever the popup opens; clipped, it takes its colour from whatever is behind.
 *
 * **That second clause is the mechanism, and the backdrop assertions are what measure it.**
 * The first two assertions are satisfied by any clip that merely differs from `border-box`, so
 * on their own they would leave the unit's actual claim untested. Injecting a surface between
 * the page and the popup's own layer must move the clipped ring and must leave the unclipped
 * one exactly where it was — and the interior reading is the guard that says the backdrop went
 * behind the popup rather than over it, without which both readings would be of the backdrop.
 *
 * Unlike the flyout presenters, the two clipped edges here cannot be compared against each
 * other in either direction: this popup carries no shadow, the page behind it is one flat
 * colour at this position, and so the ring reads one value clipped **and** unclipped. That is
 * measured and not reasoned — on the tracked baselines, all four edges of both dropdowns read
 * 234 before this clip and 228 after in light, and 35 and 25 in dark, eight readings landing
 * on one value each. It is why the backdrop is the control rather than a collapse of two edges
 * onto one value, and it also makes the top-edge assertion below a duplicate of the left-edge
 * one on this build. Both are kept: what separates them is an asymmetric border, which nothing
 * here produces today and a later `border-top-width` would introduce without a word.
 *
 * The route is read rather than driven. `/dev/combo-box` renders two of its eight rows with
 * the popup bound open, so it is on the page at load; clicking a trigger would open a third
 * and leave it ambiguous which of them a `.popup` reading took. The count is asserted.
 *
 * High contrast is left out for the reason the sections above leave it out: there the pair is
 * `SystemColorButtonFaceColor` under `SystemColorButtonTextColor`, both opaque, and the
 * positive control could not fire.
 */

/**
 * The dropdown's left and top edge pixels — the ring its border brush paints — and one pixel
 * inside it, two in from the left edge on the same midline, which is the dropdown's own fill.
 */
async function dropdown(page: Page, popup: Locator) {
	const shot = await popup.screenshot();
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
			const mid = Math.floor(image.naturalHeight / 2);
			return {
				left: at(0, mid),
				top: at(Math.floor(image.naturalWidth / 2), 0),
				inside: at(2, mid)
			};
		},
		`data:image/png;base64,${shot.toString('base64')}`
	);
}

test("the ComboBox dropdown's fill stops at the inner border edge", async ({ page }) => {
	let light = '';
	for (const theme of ['light', 'dark'] as const) {
		await page.goto('/dev/combo-box');
		await page.evaluate((t) => {
			localStorage.setItem('winui-svelte:theme', t);
			document.documentElement.dataset.theme = t;
		}, theme);
		await page.reload();

		const popup = page.locator('.popup').first();
		await popup.waitFor({ state: 'visible' });
		// Two rows bind `open`. A third would not make `.first()` vary between runs — it is
		// DOM order, and deterministic — it would make it steadily the wrong popup, which is
		// the failure this assertion turns into a red rather than into a quiet reading of a
		// render the test is not about.
		expect(
			await page.locator('.popup').count(),
			'the route no longer renders exactly the two open dropdowns this reads the first of'
		).toBe(2);
		// **`growViewportToContent` rather than a scroll, and the difference is the surface this
		// reads over.** The layout paints the app's background on `.window`, which is
		// `height: 100vh; overflow: hidden`, and a portalled popup is placed into `<body>`
		// outside that box — so scrolling the popup into view drags it past `.window`'s bottom
		// edge and onto Chromium's default canvas. The ring then reads 240 light and 14 dark
		// against the 228 and 25 the tracked baselines hold, because a clipped ring's value is
		// a property of what is behind the popup. Growing the viewport is how `themes.ts`
		// reaches the state those images were photographed in, and its own doc comment says
		// that is what it is exported for. The default canvas is also a colour this project
		// pins nowhere, so reading over it would leave the positive control's margin to a
		// browser default.
		await growViewportToContent(page);
		// Nothing is waited on for an animation, and the absence is deliberate: `ComboBox.svelte`
		// declares no transition, no animation and no keyframes, and `document.getAnimations()`
		// is empty at every sample across the second after this reload. A wait on it would be
		// true on its first evaluation on every run, which is a guard no input separates from
		// its absence.

		// And the guard that keeps it there. `.window` is the element carrying
		// `SolidBackgroundFillColorBaseBrush`, so a dropdown hanging below it is one whose ring
		// composites over the browser's canvas — which is what the line above prevents, stated
		// as something a later route change can fail rather than as a comment.
		expect(
			await popup.evaluate((el) => {
				const app = document.querySelector('.window')!.getBoundingClientRect();
				const own = el.getBoundingClientRect();
				return own.top >= app.top && own.bottom <= app.bottom;
			}),
			`${theme}: the dropdown hangs outside the app background, so its ring reads over the browser's default canvas and not over anything this project pins`
		).toBe(true);

		const box = (await popup.boundingBox())!;
		const viewport = page.viewportSize()!;
		const escaped = `${theme}: the dropdown is not wholly in frame, so an edge reading is not an edge`;
		expect(box.x, `${escaped} (left)`).toBeGreaterThanOrEqual(0);
		expect(box.y, `${escaped} (top)`).toBeGreaterThanOrEqual(0);
		expect(box.x + box.width, `${escaped} (right)`).toBeLessThanOrEqual(viewport.width);
		expect(box.y + box.height, `${escaped} (bottom)`).toBeLessThanOrEqual(viewport.height);

		// The theme is polled rather than asserted, and on the render rather than on
		// `dataset.theme`, which would only report what the write above put there. These two
		// themes paint this fill different colours, so the reading is what can disagree — and
		// the poll is also the wait, because a plain assertion here passes or fails on whether
		// the stylesheet happened to have followed the attribute by the time it ran.
		if (theme === 'light') light = (await dropdown(page, popup)).inside;
		else
			await expect
				.poll(async () => (await dropdown(page, popup)).inside, { timeout: 5000 })
				.not.toBe(light);

		const shipped = await dropdown(page, popup);

		/** Reads the dropdown with `background-clip` overridden, then puts the page back. */
		const withClip = async (value: string) => {
			const tag = await page.addStyleTag({
				content: `.popup { background-clip: ${value} !important; }`
			});
			const pixels = await dropdown(page, popup);
			await tag.evaluate((el) => (el as Element).remove());
			return pixels;
		};

		expect(shipped, `${theme}: the shipped fill reaches under the dropdown's stroke`).toEqual(
			await withClip('padding-box')
		);

		const unclipped = await withClip('border-box');
		expect(
			unclipped.left,
			`${theme}: an unclipped fill changed the ring not at all, so this reads somewhere it cannot reach`
		).not.toBe(shipped.left);
		expect(
			unclipped.top,
			`${theme}: an unclipped fill changed the top edge not at all, so this reads somewhere it cannot reach`
		).not.toBe(shipped.top);

		// The mechanism. 999 is chosen against the single popup layer C13 gates — one value,
		// 1000, declared in `Popup.svelte`'s `.root` rule with nothing above it — so this lands
		// between the page and the popup, which is where the thing a translucent stroke shows
		// through has to be. `.popup` is `position: static`, so its own `z-index` paints
		// nothing and bits-ui mirrors the value onto the wrapper it positions; the comment
		// above that declaration in `ComboBox.svelte` carries the whole of it.
		const backdrop = await page.addStyleTag({
			content: `body::before { content: ''; position: fixed; inset: 0; background: #ff0000; z-index: 999; }`
		});
		const behind = await dropdown(page, popup);
		expect(
			behind.inside,
			`${theme}: the backdrop landed over the dropdown, not behind it, so both readings are of the backdrop`
		).toBe(shipped.inside);
		expect(
			behind.left,
			`${theme}: the clipped stroke did not follow what is behind the popup`
		).not.toBe(shipped.left);
		expect(
			behind.top,
			`${theme}: the clipped stroke did not follow what is behind the popup, at the top edge`
		).not.toBe(shipped.top);

		// The other half of the backdrop reading, and it checks a premise rather than the clip.
		// An unclipped fill hides what is behind it only because this dropdown's fill is
		// opaque, and it is opaque only because `AcrylicInAppFillColorDefaultBrush` emits its
		// fallback colour rather than the material it names (WD-002). The acrylic upstream
		// composes is the input that separates this from an assertion that cannot disagree,
		// which is why it is worth an assertion rather than a sentence.
		const behindUnclipped = await withClip('border-box');
		expect(
			{ left: behindUnclipped.left, top: behindUnclipped.top },
			`${theme}: the backdrop reached the ring through an unclipped fill, so either it landed in front of the popup or this fill is no longer opaque`
		).toEqual({ left: unclipped.left, top: unclipped.top });
		await backdrop.evaluate((el) => (el as Element).remove());
	}
});

/**
 * The AutoSuggestBox's suggestion list — and the first element in this file whose two clipped
 * edges lie over two different surfaces because of where the control puts its popup, rather
 * than because of a shadow.
 *
 * The value is `4c0e000`'s shape rather than the section above it: neither AutoSuggestBox
 * template writes `BackgroundSizing` on `SuggestionsContainer`
 * (`AutoSuggestBox_themeresources.xaml:283`), so the Border takes the property's default and
 * the chain that commit walks is what settles it. The string does occur once in each file —
 * `AutoSuggestBox_themeresources.xaml:101` and `AutoSuggestBox_themeresources_perf2026.xaml:89`
 * — on the query button's `ContentPresenter`, near enough to this element to be read as it,
 * which is why it is named here rather than left out.
 *
 * **What is new is one assertion, and the flyout-presenter section above is where to read why
 * it was not made before.** That section asserts the same collapse this one does — forcing
 * `border-box` must put both edges on one value, because an unclipped stroke lies on the
 * element's own uniform fill — and then declines the converse on purpose: clipped, its two
 * edges do differ, but they differ because `PopupShadow` is not the same above the presenter as
 * beside it, so the assertion would go red on a shadow change with the fill perfectly faithful.
 * Here the asymmetry has no decoration in it. This list carries no shadow, and it lands on the
 * box it belongs to, so its sides lie over the page while its top edge lies over the box's own
 * bottom stroke — a fact about where the control puts its popup. So the converse is asserted
 * here, and its failure message names both of the things that can cause it. The dropdown
 * between the two cannot make it either way: its four edges are over one flat page colour, so
 * clipped and unclipped each collapse to a single value there and only an injected backdrop
 * separates "the fill stops" from "the stroke shows what is behind". On the guest's
 * baselines, unclipped, every edge reads 234 in light and 35 in dark; clipped, the sides read
 * 228 and 25 and the top edge reads 126 and 122. Which surface that top edge is on is derived
 * rather than assumed: every box on the route is 31 rows from its top border to its bottom
 * one, the last one's top border is at y=741, so its bottom border is the very row the list's
 * top ring occupies. That row is not readable in the shipped image — the list covers exactly
 * the box's own columns there — so the 134 and 153 come off the four enabled siblings, whose
 * bottom strokes those are, and then off inverting the composite: 126 admits 134 and nothing
 * else, 133 giving 125 and 135 giving 127, and 122 likewise admits only 153. The page behind
 * the sides reads 243 and 32 — and it is the side edge, not the top, that shows these are
 * floors: 243 × 240/255 is 228.7 and the ring reads 228, where rounding would give 229. The
 * top edge's two products are whole enough that either rule returns them. The fifth box is
 * the disabled one, whose bottom row is 228 and 47 because it takes
 * `TextControlBorderBrushDisabled` instead; its 31 rows still hold. The backdrop is kept and
 * now says something it could not say above: one surface behind both edges makes the two
 * readings agree again.
 *
 * `AutoSuggestBoxSuggestionsListBorderBrush` aliases `SurfaceStrokeColorFlyoutBrush`, the same
 * `#0000000f` and `#00000033` the dropdown's does, which is what makes any of this observable.
 * The fill is opaque only because `AcrylicBackgroundFillColorDefaultBrush` emits its fallback
 * colour rather than the material it names (WD-002), and the interior reading under the
 * backdrop is what holds that premise to an assertion. High contrast is left out for the
 * reason the sections above leave it out — `SystemColorWindowTextColor` over
 * `SystemColorButtonFaceColor`, both opaque — and its baseline is byte-identical across the
 * change this test was written for, where light and dark are not.
 *
 * The route is read rather than driven, as above: `/dev/auto-suggest-box` binds one row's
 * popup open, and the count is asserted so a second one cannot quietly become what `.first()`
 * returns. The pixels come from `dropdown` above; to a reader of three pixels the two popups
 * are the same element.
 */
test("the AutoSuggestBox suggestion list's fill stops at the inner border edge", async ({
	page
}) => {
	let light = '';
	for (const theme of ['light', 'dark'] as const) {
		await page.goto('/dev/auto-suggest-box');
		await page.evaluate((t) => {
			localStorage.setItem('winui-svelte:theme', t);
			document.documentElement.dataset.theme = t;
		}, theme);
		await page.reload();

		const popup = page.locator('.popup').first();
		await popup.waitFor({ state: 'visible' });
		expect(
			await page.locator('.popup').count(),
			'the route no longer renders exactly the one open suggestion list this reads'
		).toBe(1);
		// The same hazard and the same one answer as the section above, and on this route the
		// call does more than keep the list in frame — it is what puts the list on its anchor.
		// `.window` is `height: 100vh; overflow: hidden`, so at the default 720 the content is
		// clipped and Floating UI shifts the list up to keep it visible: measured at y 567..701
		// against a box whose bottom edge falls at 731.66, so the list is a hundred and
		// sixty-four pixels above its anchor and wholly over the page. Grown to the content it
		// sits at 731..865, its top row inside that bottom border, and reads 126 where the
		// unanchored one reads 228. The
		// helper's own poll is what lands after that reposition, so a probe that reads the rect
		// straight after `setViewportSize` still sees 567 and is measuring the wrong frame.
		//
		// So replacing this call with a `scrollIntoView` — which scrolls nothing here, there
		// being no scroller to move — leaves every assertion below green on chromium-linux, and
		// the two-surface pair passes on 228 against 227 — one level, and not from the clip:
		// the left edge is at x=24 at both viewports, but unanchored it sits over an
		// anti-aliased edge of the page content reading 242 rather than 243, and 242 composites
		// to 227. The mechanism the assertion was written for is absent. On the guest the
		// page is 1041 tall and the list is at 772..917, below the 720 fold, and the same
		// mutation dies on the containment assertion under this one. A mutation that survives
		// the untracked lane is not evidence about the tracked one.
		await growViewportToContent(page);
		expect(
			await popup.evaluate((el) => {
				const app = document.querySelector('.window')!.getBoundingClientRect();
				const own = el.getBoundingClientRect();
				return own.top >= app.top && own.bottom <= app.bottom;
			}),
			`${theme}: the suggestion list hangs outside the app background, so its ring reads over the browser's default canvas and not over anything this project pins`
		).toBe(true);

		const box = (await popup.boundingBox())!;
		const viewport = page.viewportSize()!;
		const escaped = `${theme}: the suggestion list is not wholly in frame, so an edge reading is not an edge`;
		expect(box.x, `${escaped} (left)`).toBeGreaterThanOrEqual(0);
		expect(box.y, `${escaped} (top)`).toBeGreaterThanOrEqual(0);
		expect(box.x + box.width, `${escaped} (right)`).toBeLessThanOrEqual(viewport.width);
		expect(box.y + box.height, `${escaped} (bottom)`).toBeLessThanOrEqual(viewport.height);

		// Polled on the render rather than asserted on `dataset.theme`, for the reason the
		// section above gives: the attribute only reports the write, and the poll is also the
		// wait for the stylesheet to have followed it.
		if (theme === 'light') light = (await dropdown(page, popup)).inside;
		else
			await expect
				.poll(async () => (await dropdown(page, popup)).inside, { timeout: 5000 })
				.not.toBe(light);

		const shipped = await dropdown(page, popup);

		/** Reads the list with `background-clip` overridden, then puts the page back. */
		const withClip = async (value: string) => {
			const tag = await page.addStyleTag({
				content: `.popup { background-clip: ${value} !important; }`
			});
			const pixels = await dropdown(page, popup);
			await tag.evaluate((el) => (el as Element).remove());
			return pixels;
		};

		expect(shipped, `${theme}: the shipped fill reaches under the list's stroke`).toEqual(
			await withClip('padding-box')
		);

		const unclipped = await withClip('border-box');
		expect(
			unclipped.left,
			`${theme}: an unclipped fill changed the ring not at all, so this reads somewhere it cannot reach`
		).not.toBe(shipped.left);
		expect(
			unclipped.top,
			`${theme}: an unclipped fill changed the top edge not at all, so this reads somewhere it cannot reach`
		).not.toBe(shipped.top);

		// The two-surface pair, which is this section's own and needs nothing injected.
		// Unclipped, the ring is the list's own fill seen through its stroke, so it is one
		// value whatever an edge faces. Clipped, it is what that edge faces — and the top
		// lands on the box's own bottom stroke while the sides face the page.
		expect(
			unclipped.top,
			`${theme}: an unclipped ring reads two values on two edges, so it is not the list's own fill showing through`
		).toBe(unclipped.left);
		expect(
			shipped.top,
			`${theme}: a clipped ring reads one value over two different surfaces, so either the list no longer abuts its box or its fill still reaches the stroke`
		).not.toBe(shipped.left);

		// 999 is chosen against the single popup layer C13 gates — one value, 1000, which on
		// this route is declared on `.popup` itself in `AutoSuggestBox.svelte` and not by
		// `Popup.svelte`, which bits-ui's `Combobox.Portal` does not render. So this lands
		// between the page and the popup, which is where a thing seen through a translucent
		// stroke has to be.
		const backdrop = await page.addStyleTag({
			content: `body::before { content: ''; position: fixed; inset: 0; background: #ff0000; z-index: 999; }`
		});
		const behind = await dropdown(page, popup);
		expect(
			behind.inside,
			`${theme}: the backdrop reached the list's interior, so either it landed in front of the popup or this fill is no longer opaque`
		).toBe(shipped.inside);
		expect(
			behind.left,
			`${theme}: the clipped stroke did not follow what is behind the popup`
		).not.toBe(shipped.left);
		// The last one is not the pair above restated, though nothing on this build separates
		// them. It fails when the two edges disagree over *one* surface, which means the
		// difference is in the edges themselves or in something behind one of them rather than
		// in the two surfaces — measured with a 4px strip at `z-index: 999`, above the backdrop
		// and below the list, behind the top edge alone: this goes red while the pair above
		// stays green. That is the flyout presenters' case arriving here, and it is what keeps
		// "the asymmetry is where the control puts its popup, not a decoration" a checked claim
		// rather than a sentence in this comment.
		expect(
			behind.top,
			`${theme}: one surface behind both edges still reads as two, so the top edge is not reading what is behind it`
		).toBe(behind.left);
		await backdrop.evaluate((el) => (el as Element).remove());
	}
});

/**
 * The ComboBox trigger's fill stops at the inner border edge, and the edge is the brush.
 *
 * One element and two claims, because on this control they were one defect. The Border this
 * stands for is `ComboBox_themeresources.xaml:571` — `Background`, `BorderBrush`,
 * `BorderThickness` and `CornerRadius` all template-bound, no `BackgroundSizing` on it and none
 * in the file outside the popup, and the same element in
 * `ComboBox_themeresources_perf2026.xaml:525` writes none either. So the fill takes the
 * property's default and stops at the stroke's inner edge, where CSS would run it to the border
 * box.
 *
 * What kept that invisible is the second claim. `ComboBoxBorderBrush` and
 * `ComboBoxBorderBrushPointerOver` alias `ControlElevationBorderBrush`, a gradient, and a
 * gradient cannot be a `border-color`: the declaration parses, because `var()` defers the check,
 * and is dropped at computed-value time, leaving the initial `currentColor`. An opaque near-black
 * edge in light and an opaque white one in dark hide whatever the fill does beneath them.
 * `ComboBox.svelte` now paints the brush on `.trigger::after` and lets the border reserve the
 * width, as Button.svelte's `.root::after` and TextBox.svelte's `.box::after` already did, and the
 * guest baselines moved from 27 to 228 in light and from 255 to 47 in dark.
 *
 * Pressed and disabled were never part of that: both alias `ControlStrokeColorDefaultBrush`
 * (`generic.xaml:680` and `generic.xaml:681`), a solid colour, so the declaration naming them
 * was never dropped. Their edges were wrong anyway, by the other half: the disabled specimen's
 * left edge moves 230 to 228 in light and 56 to 47 in dark in the baselines this commit
 * regenerates, because the stroke lay on the trigger's own unclipped fill rather than on the
 * page. Which is why the clip is measured in every state — `background` is a shorthand, a state
 * rule restating the brush resets the clip with it, and that is the defect the three pickers at
 * the top of this file carried.
 *
 * High contrast is left out of the loop for two reasons, one measured and one structural. The
 * stroke is opaque there, so the left edge reads `182,246,240` under both clips and the clip's
 * positive control could not fire; and the shape assertion expects a gradient at rest, where
 * high contrast resolves that brush to a colour. One reading is taken in that theme all the
 * same, after the loop, because it is the only place the hover override can be falsified.
 */

const TRIGGER_STATES = ['rest', 'hover', 'pressed', 'disabled'] as const;
type TriggerState = (typeof TRIGGER_STATES)[number];

test("the ComboBox trigger's fill stops at the inner border edge in every state", async ({
	page
}) => {
	await page.goto('/dev/combo-box');

	const first = page.locator('.trigger').first();
	await first.waitFor();
	// Not framing, and not a rescue: at 720 this page settles with `scrollY` at 340 and nothing
	// overlaps — four fresh contexts land there identically. What the grow removes is the
	// dependence on that. Two of this route's ComboBoxes open their dropdowns, a dropdown is
	// portalled to the body, and Floating UI places it from wherever the page has scrolled when
	// it runs: scrolled back to the top at 720, the first one lands at 566..704, over the
	// disabled specimen at 608..640, and `elementFromPoint` at that trigger's edge returns
	// `.list` instead of `.trigger`. Grown to content there is no scroll to depend on, the
	// popups sit at 736..874 and 1163..1269, and this reads what the tracked baselines read,
	// because `snapshotAllThemes` grows the viewport too. The AutoSuggestBox section above is
	// the other half of the same lesson: at 720 that route's popup leaves its anchor outright.
	await growViewportToContent(page);
	// Disabled is a prop on the control rather than `:disabled` on the button — the rule keys on
	// `.root[data-disabled]` — so it is a different specimen and not a forced pseudo-class.
	// Forcing it on the first trigger would measure the resting style and report it as disabled.
	// The route has two disabled triggers; this reads the one carrying a selection, the
	// `disabled` row, and not the one drawing its placeholder.
	const disabled = page
		.locator('.root[data-disabled] .trigger')
		.filter({ hasNot: page.locator('.placeholder') });
	await expect(disabled).toHaveCount(1);

	const cdp = await page.context().newCDPSession(page);
	await cdp.send('DOM.enable');
	await cdp.send('CSS.enable');
	const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
	const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
		nodeId: root.nodeId,
		selector: '.trigger'
	});
	const nodeId = nodeIds[0];

	const box = (state: TriggerState) => (state === 'disabled' ? disabled : first);

	const enter = async (state: TriggerState) => {
		await cdp.send('CSS.forcePseudoState', {
			nodeId,
			forcedPseudoClasses: state === 'hover' || state === 'pressed' ? ['hover'] : []
		});
		// Pressed is the component's pointer flag rather than `:active` (ComboBox.svelte's
		// `pressed`), so it is set directly, the way the press handler sets it. A real press
		// would leave the pointer on the trigger for every later state, against the forced
		// `:hover`, and over the pixel this reads.
		await first.evaluate(
			(el, on) => (on ? el.setAttribute('data-pressed', '') : el.removeAttribute('data-pressed')),
			state === 'pressed'
		);
		// `enter` sends the whole `forcedPseudoClasses` array on every call, `[]` included, so a
		// reordering of `TRIGGER_STATES` cannot carry one state's forcing into the next. What
		// these guards answer is whether the forcing took at all: a CDP session holding a
		// `nodeId` staled by a re-render reports nothing, and four readings of the resting state
		// would be measured and named as four states.
		if (state === 'disabled')
			// Neither `:disabled` nor a forced class — the rule keys on `.root[data-disabled]`,
			// so this is a second specimen that `forcePseudoState` never touches. Asking whether
			// it is hovered is a question about an element nothing in this test moves, and it
			// answers the same before and after any change. `cursor` is set by that rule and by
			// no other, so it is the one reading that says the state is in force.
			expect(
				await disabled.evaluate((el) => getComputedStyle(el).cursor),
				'the disabled specimen is not rendering as disabled'
			).toBe('default');
		else if (state === 'rest')
			expect(
				await first.evaluate((el) => el.matches(':hover') || el.hasAttribute('data-pressed')),
				'the resting state is not resting'
			).toBe(false);
		else
			expect(
				await first.evaluate(
					(el, s) => (s === 'pressed' ? el.hasAttribute('data-pressed') : el.matches(`:${s}`)),
					state
				),
				`the ${state} state did not take`
			).toBe(true);
	};

	/** Reads the edge with one extra declaration in force, then puts the page back. */
	const withStyle = async (state: TriggerState, content: string) => {
		const tag = await page.addStyleTag({ content });
		const pixel = await ring(page, box(state));
		await tag.evaluate((el) => (el as Element).remove());
		return pixel;
	};

	const setTheme = (theme: string) =>
		page.evaluate((t) => {
			localStorage.setItem('winui-svelte:theme', t);
			document.documentElement.dataset.theme = t;
		}, theme);

	const measure = async (theme: string) => {
		for (const state of TRIGGER_STATES) {
			await enter(state);
			const shipped = await ring(page, box(state));
			expect(shipped, `${theme}, ${state}: the shipped fill reaches into the ring`).toBe(
				await withStyle(state, '.trigger { background-clip: padding-box !important }')
			);
			// The positive control, and it runs per state rather than once. The equality above
			// compares one pixel under two clips, so it passes just as quietly when that pixel
			// is not on the ring at all — and each state reads its own element or its own
			// forced render, so one state proving the reading lands says nothing about the
			// next. Unclipped, the stroke lies on the trigger's own fill instead of on the
			// page: 228 to 237 in light, over a backdrop 9 levels lighter, and 47 to 59 in
			// dark, where the stroke is 7.1% white over one 13 levels lighter.
			expect(
				await withStyle(state, '.trigger { background-clip: border-box !important }'),
				`${theme}, ${state}: an unclipped fill changed nothing, so this reads somewhere it cannot reach`
			).not.toBe(shipped);
			// The other half, and it runs per state for the same reason. The two readings above
			// are both satisfied by an edge that is merely stable across the clip — delete the
			// ring rule outright and the band reads the page under both clips and all four
			// equalities still pass. Hidden, the ring has to change this pixel.
			expect(
				await withStyle(state, '.trigger::after { display: none !important }'),
				`${theme}, ${state}: hiding the ring changed nothing, so something else paints this edge`
			).not.toBe(shipped);
			// And which brush this state names. `ControlStrokeColorDefaultBrush` is also the far
			// stop of the gradient the base rule paints, so the pixel read here — the left edge
			// at mid-height — is 228 in light whether a pressed or disabled ring paints it or
			// the base one does. The edge the gradient's *near* stop lands on is not: the bottom
			// in light, the top in dark, which is the flip two themes make of one brush. The
			// tracked baselines read that edge already and pin the disabled rule with it — the
			// seven enabled triggers read 204 along the bottom in light and 53 along the top in
			// dark, and the disabled one reads 228 and 47, flat on all four edges because its
			// brush is flat. Nothing photographs the pressed rule, since no specimen is pressed.
			// So what is asserted here is the shape rather than the value: a deleted state rule
			// falls back to the base gradient, and a gradient is `background-image` where a
			// colour is not. `.trigger:hover::after` is not covered in either theme measured
			// here, and cannot be: in light and dark `ComboBoxBorderBrushPointerOver` aliases
			// the brush the resting rule already names, so the override restates it and no
			// pixel separates the two. High contrast is the one theme where the two keys
			// differ, and the reading at the end of this test is there for that.
			expect(
				await box(state).evaluate((el) => getComputedStyle(el, '::after').backgroundImage),
				`${theme}, ${state}: the ring is not the kind of brush this state names`
			)[state === 'rest' || state === 'hover' ? 'toContain' : 'toBe'](
				state === 'rest' || state === 'hover' ? 'linear-gradient' : 'none'
			);
		}

		// Per theme, and all four sides: the border reserves the ring's width and paints
		// nothing. This is the only thing standing between the brush and `currentColor`, which
		// is what the declaration this unit replaced resolved to.
		expect(
			await first.evaluate((el) => {
				const c = getComputedStyle(el);
				return [c.borderTopColor, c.borderRightColor, c.borderBottomColor, c.borderLeftColor];
			}),
			`${theme}: the border paints a colour of its own, so the ring is not alone on this edge`
		).toEqual(['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)']);
	};

	await setTheme('light');
	const light = await ring(page, first);
	await measure('light');

	await setTheme('dark');
	// The same poll the tests above use: until the stylesheet has followed the attribute the
	// pixel is still the light one, and a second light pass would otherwise be reported as dark.
	await expect.poll(() => ring(page, first), { timeout: 5000 }).not.toBe(light);
	const dark = await ring(page, first);
	await measure('dark');

	// One reading in high contrast, and only this one. `.trigger:hover::after` restates the
	// resting brush in light and in dark, so nothing there can say whether the rule is present;
	// high contrast is where the two keys part — under `:root[data-theme='high-contrast']` the
	// token layer resolves `ComboBoxBorderBrush` to `SystemControlForegroundBaseMediumBrush`
	// and `ComboBoxBorderBrushPointerOver` to `SystemColorHighlightColor`. On the same pixel every
	// other reading here uses, hovered reads `161,191,222` and the rule overridden with the
	// resting brush reads `182,246,240`. This is the whole of the theme's coverage: the clip
	// cannot be measured against an opaque stroke, and the shape assertion wants a gradient
	// where this theme has a colour. The poll is the weak kind — any change off the dark
	// reading satisfies it — and what makes that acceptable is the assertion after it: in light
	// both of its readings are 228 and in dark both are 47, so a run that lands in any other
	// theme fails here rather than passing quietly. Measured in all three.
	await setTheme('high-contrast');
	await expect.poll(() => ring(page, first), { timeout: 5000 }).not.toBe(dark);
	await enter('hover');
	const hovered = await ring(page, first);
	expect(
		await withStyle(
			'hover',
			'.trigger:hover::after { background: var(--winui-ComboBoxBorderBrush) !important }'
		),
		'high contrast, hover: the hover ring is already the resting brush, so its rule does nothing'
	).not.toBe(hovered);
	await enter('rest');
});

/**
 * The TeachingTip's close button stops its fill at the inner border edge, and here the style
 * says so in a setter.
 *
 * `AlternateCloseButtonStyle` sets `BackgroundSizing` to `InnerBorderEdge`
 * (`TeachingTip_themeresources.xaml:102`) and its template's `ContentPresenter` binds it
 * (`TeachingTip_themeresources.xaml:165`), so the claim rests on the style rather than on the
 * property's default. `.close-fill` is that presenter.
 *
 * In light and dark the style gives the stroke and the fill one brush in each state —
 * `SubtleFillColorSecondary` on hover and `SubtleFillColorTertiary` pressed, both translucent
 * there. So unclipped, the 1px ring is that brush laid over itself; clipped, it is the brush
 * once over the card, which is what the inside of the button is too. Measured on the first
 * tip's button: hovered, the edge reads 232 unclipped against 240 clipped in light and 64
 * against 52 in dark; pressed, 238 against 243 and 56 against 48. The inside reads the clipped
 * value in all four.
 *
 * Rest is left out because both brushes are `SubtleFillColorTransparent` there and the
 * positive control could not fire, and high contrast because there every brush in the style is
 * an opaque system colour.
 */

const CLOSE_STATES = ['hover', 'pressed'] as const;

/** The first five pixels of the close button's horizontal midline, as `r,g,b`, from its left. */
async function midline(page: Page, fill: Locator) {
	const shot = await fill.screenshot();
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
			const y = Math.floor(image.naturalHeight / 2);
			return [0, 1, 2, 3, 4].map((x) =>
				[...context.getImageData(x, y, 1, 1).data].slice(0, 3).join(',')
			);
		},
		`data:image/png;base64,${shot.toString('base64')}`
	);
}

test("the TeachingTip close button's fill stops at the inner border edge", async ({ page }) => {
	let light = '';
	for (const theme of ['light', 'dark'] as const) {
		await page.goto('/dev/teaching-tip');
		// Both channels and a reload, then a wait on the render, for the reason the tab header
		// section gives.
		await page.evaluate((t) => {
			localStorage.setItem('winui-svelte:theme', t);
			document.documentElement.dataset.theme = t;
		}, theme);
		await page.reload();

		// The first tip on the route. It sets no `closeButtonContent`, so its header carries the
		// alternate close button; the route's later tips are not needed.
		const close = page.locator('.close').first();
		const fill = close.locator('.close-fill');
		await fill.waitFor();
		const rendered = () => fill.evaluate((el) => getComputedStyle(el).color);
		if (theme === 'light') light = await rendered();
		else await expect.poll(rendered, { timeout: 5000 }).not.toBe(light);
		// The dark pass repaints after first paint, which starts transitions on the page — twelve
		// under Chromium on Linux — and none may still be running while one reading is compared
		// with the next. This is the flyout presenter section's form rather than awaiting each
		// `finished`, which rejects when a transition is cancelled.
		await page.waitForFunction(() =>
			document.getAnimations().every((a) => a.playState !== 'running')
		);

		// Forced rather than driven, as the sections above do: a real press on this button
		// closes the tip. `DOM.querySelectorAll` and `page.locator` agree on the first `.close`
		// only while the two count the same elements, so the count is asserted.
		const cdp = await page.context().newCDPSession(page);
		await cdp.send('DOM.enable');
		await cdp.send('CSS.enable');
		const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
		const { nodeIds } = await cdp.send('DOM.querySelectorAll', {
			nodeId: root.nodeId,
			selector: '.close'
		});
		expect(nodeIds.length, `${theme}: CDP and the page count different close buttons`).toBe(
			await page.locator('.close').count()
		);

		// The stroke's column is found rather than assumed. The button sits at a fractional x,
		// and which column of its screenshot the 1px stroke lands in depends on how the browser
		// snaps it — the first under Chromium on Linux, the second on the reference guest. Read
		// at the first on the guest, the edge and the inside were both the card, and the clip
		// assertion below compared the card with itself and passed. So the stroke is painted
		// opaque red once, and the column that turns reddest is the edge.
		const locate = await page.addStyleTag({
			content: '.close-fill { border-color: rgb(255, 0, 0) !important; }'
		});
		const redness = (await midline(page, fill)).map((pixel) => {
			const [r, g] = pixel.split(',').map(Number);
			return r - g;
		});
		await locate.evaluate((el) => (el as Element).remove());
		const column = redness.indexOf(Math.max(...redness));
		expect(
			redness[column],
			`${theme}: no pixel of the midline is the painted stroke`
		).toBeGreaterThan(200);
		// `midline` reads five columns and the inside is two past the edge.
		expect(column, `${theme}: the stroke is past the columns this reads`).toBeLessThanOrEqual(2);
		const closeEdge = async () => {
			const row = await midline(page, fill);
			return { edge: row[column], inside: row[column + 2] };
		};

		for (const state of CLOSE_STATES) {
			await cdp.send('CSS.forcePseudoState', {
				nodeId: nodeIds[0],
				forcedPseudoClasses: state === 'hover' ? ['hover'] : ['hover', 'active']
			});
			expect(
				await close.evaluate((el, s) => el.matches(s === 'pressed' ? ':active' : ':hover'), state),
				`${theme}: the ${state} state did not take`
			).toBe(true);

			/** Reads the edge with `background-clip` overridden, then puts the page back. */
			const withClip = async (value: string) => {
				const tag = await page.addStyleTag({
					content: `.close-fill { background-clip: ${value} !important; }`
				});
				const pixels = await closeEdge();
				await tag.evaluate((el) => (el as Element).remove());
				return pixels;
			};

			const shipped = await closeEdge();
			expect(shipped, `${theme}: the ${state} fill runs under the close button's stroke`).toEqual(
				await withClip('padding-box')
			);
			expect(
				shipped.edge,
				`${theme}: the ${state} edge is not the brush once over the card, as the inside is`
			).toBe(shipped.inside);
			// The positive control: an unclipped fill has to move the edge, or the reading is
			// somewhere the fill never reaches.
			expect(
				(await withClip('border-box')).edge,
				`${theme}: an unclipped ${state} fill changed the edge not at all`
			).not.toBe(shipped.edge);
		}
		await cdp.send('CSS.forcePseudoState', { nodeId: nodeIds[0], forcedPseudoClasses: [] });
	}
});
