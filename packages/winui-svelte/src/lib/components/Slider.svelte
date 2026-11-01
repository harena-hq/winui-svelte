<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface SliderProps {
		/** Value. */
		value?: number;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback.
		 *  Upstream signals this as the `ValueChanged` event. */
		onValueChange?: (value: number) => void;
		/** Minimum. */
		min?: number;
		/** Maximum. */
		max?: number;
		/** StepFrequency, under the name the primitive and the DOM both use. */
		step?: number;
		/** Orientation. Horizontal, or the vertical template (Slider_themeresources.xaml:418). */
		orientation?: 'horizontal' | 'vertical';
		/** IsDirectionReversed. The value grows leftward, or downward when vertical. */
		directionReversed?: boolean;
		/** TickFrequency. The value interval between tick marks; 0, the default, draws none. */
		tickFrequency?: number;
		/** TickPlacement. Where the ticks are drawn; Slider's default is Inline. */
		tickPlacement?: 'none' | 'topLeft' | 'bottomRight' | 'outside' | 'inline';
		/** IsEnabled, inverted to HTML's attribute — ADR 0009. */
		disabled?: boolean | null;
		/** IsThumbToolTipEnabled. */
		thumbToolTipEnabled?: boolean;
		/** Header. A string or a snippet; nothing is rendered when it is not given. */
		header?: Snippet | string;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/**
		 * The thumb, not the root — ADR 0009's `ref` points at the interactive element.
		 * The root is the outer `<div>`; the thumb is the one bits-ui positions over the
		 * value and the one the focus ring sits around.
		 */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// Two WinUI members are deliberately absent, and a plain comment says so rather than
	// a `/** */` one: a doc comment here would attach itself to `disabled` below and a
	// consumer hovering that prop would be told about one of them.
	//
	// Snapping is `step`'s responsibility. `SnapsTo="Ticks"` with equal `TickFrequency` and
	// `StepFrequency` — the Gallery's only use — is the same behavior.
</script>

<script lang="ts">
	import { Slider } from 'bits-ui';
	import { focusVisual } from '../internal/focus-visual';
	import ToolTip from './ToolTip.svelte';

	let {
		value = $bindable(0),
		onValueChange,
		min = 0,
		max = 100,
		step = 1,
		orientation = 'horizontal',
		directionReversed = false,
		tickFrequency = 0,
		tickPlacement = 'inline',
		disabled = false,
		thumbToolTipEnabled = true,
		header,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: SliderProps = $props();

	let thumbToolTipOpen = $state(false);
	let container = $state<HTMLSpanElement | undefined>(undefined);
	let trackLength = $state<number | undefined>(undefined);
	let thumbLength = $state<number | undefined>(undefined);

	const showInline = $derived(tickPlacement === 'inline');
	const showOutsideBefore = $derived(tickPlacement === 'topLeft' || tickPlacement === 'outside');
	const showOutsideAfter = $derived(tickPlacement === 'bottomRight' || tickPlacement === 'outside');
	const ticks = $derived.by(() => {
		if (
			tickFrequency <= 0 ||
			trackLength === undefined ||
			thumbLength === undefined ||
			max <= min
		) {
			return [];
		}

		const measuredTrackLength = trackLength;
		const measuredThumbLength = thumbLength;
		const visualRange = measuredTrackLength - measuredThumbLength;
		const numIntervals = Math.max(1, (max - min) / tickFrequency);
		let tickMarkNumber = Math.floor(numIntervals);
		let interval = Math.max(1, visualRange / numIntervals);
		if (interval < 20) {
			const ratio = Math.ceil(20 / interval);
			interval *= ratio;
			tickMarkNumber = Math.floor(tickMarkNumber / ratio);
		}
		tickMarkNumber += 1;

		const thumbOffset = Math.max(0, (measuredThumbLength - 1) / 2);
		const forward = orientation === 'horizontal' ? !directionReversed : directionReversed;
		return Array.from({ length: tickMarkNumber }, (_, index) => {
			const offset = forward
				? thumbOffset + index * interval
				: measuredTrackLength - (thumbOffset + 1) - index * interval;
			return Math.round(offset);
		});
	});

	$effect(() => {
		if (!container) return;
		// `measure` reads the orientation at call time; naming it here makes a change of
		// orientation re-run the measurement rather than wait for the next resize.
		void orientation;

		const measure = () => {
			if (!container) return;
			trackLength = orientation === 'horizontal' ? container.clientWidth : container.clientHeight;
			const thumbKey =
				orientation === 'horizontal'
					? '--winui-SliderHorizontalThumbWidth'
					: '--winui-SliderVerticalThumbHeight';
			const measuredThumbLength = parseFloat(
				getComputedStyle(container).getPropertyValue(thumbKey)
			);
			// Without the token layer there is no reliable thumb length, so ticks cannot be placed.
			thumbLength = Number.isFinite(measuredThumbLength) ? measuredThumbLength : undefined;
		};

		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(container);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (!thumbToolTipEnabled) {
			thumbToolTipOpen = false;
			return;
		}

		const closeThumbToolTip = () => {
			thumbToolTipOpen = false;
		};
		document.addEventListener('pointerup', closeThumbToolTip);
		document.addEventListener('pointercancel', closeThumbToolTip);

		return () => {
			document.removeEventListener('pointerup', closeThumbToolTip);
			document.removeEventListener('pointercancel', closeThumbToolTip);
		};
	});

	// Keyboard is out of scope for this unit: whether the original raises this tooltip when
	// the value is changed with the arrow keys was not measured, so only the thumb being
	// held opens it.
	//
	// The tooltip is given `openOnHover={false}`, so the props it hands back carry none of
	// the primitive's own opening handlers and there is nothing of its to call here. The
	// thumb's own `onpointerdown` is the primitive's and still has to run: it is what
	// starts the drag.
	function onThumbPointerDown(thumbProps: Record<string, unknown>) {
		return (event: PointerEvent) => {
			(thumbProps.onpointerdown as ((event: PointerEvent) => void) | undefined)?.(event);
			if (event.button === 0 && !disabled) thumbToolTipOpen = true;
		};
	}
</script>

<div
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	data-disabled={disabled || undefined}
	data-orientation={orientation}
	{...rest}
>
	{#if header !== undefined}
		<span class="header">
			{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
		</span>
	{/if}
	<!-- helpers.js maps horizontal ltr/rtl to lr/rl and vertical ltr/rtl to bt/tb;
	     `orientation` selects the horizontal or vertical pair, while `rtl` reverses either. -->
	<Slider.Root
		type="single"
		bind:value={
			() => value,
			(next) => {
				value = next;
				onValueChange?.(next);
			}
		}
		{min}
		{max}
		{step}
		disabled={disabled ?? false}
		{orientation}
		dir={directionReversed ? 'rtl' : 'ltr'}
	>
		{#snippet child({ props, thumbItems })}
			<!-- Every element the primitive would render is rendered here instead, through its
			     `child` snippet — the escape ADR 0004 names first. bits-ui hands back the props
			     it needs on the element (including the inline `style` that positions the range
			     and the thumb) and this component supplies the element and the class. Written
			     the other way, with `class="…"` passed to the primitive, the class reaches the
			     DOM without this component's scope hash, every rule for it has to be
			     `:global(…)`, and `.fill` and `.thumb` then match every element in the
			     application that shares those very ordinary names. -->
			<span {...props} bind:this={container} class="container">
				<span class="track"></span>
				<Slider.Range>
					{#snippet child({ props })}
						<span {...props} class="fill"></span>
					{/snippet}
				</Slider.Range>
				{#if ticks.length > 0}
					{#if showOutsideBefore}
						<span class="tick-bar outside before">
							{#each ticks as offset (offset)}
								<span
									class="tick"
									style:left={orientation === 'horizontal' ? `${offset}px` : undefined}
									style:top={orientation === 'vertical' ? `${offset}px` : undefined}
								></span>
							{/each}
						</span>
					{/if}
					{#if showInline}
						<span class="tick-bar inline">
							{#each ticks as offset (offset)}
								<span
									class="tick"
									style:left={orientation === 'horizontal' ? `${offset}px` : undefined}
									style:top={orientation === 'vertical' ? `${offset}px` : undefined}
								></span>
							{/each}
						</span>
					{/if}
					{#if showOutsideAfter}
						<span class="tick-bar outside after">
							{#each ticks as offset (offset)}
								<span
									class="tick"
									style:left={orientation === 'horizontal' ? `${offset}px` : undefined}
									style:top={orientation === 'vertical' ? `${offset}px` : undefined}
								></span>
							{/each}
						</span>
					{/if}
				{/if}
				{#each thumbItems as thumb (thumb.index)}
					<Slider.Thumb index={thumb.index}>
						{#snippet child({ props })}
							{#if thumbToolTipEnabled}
								<!-- The tooltip anchors to the thumb's 18px layout box
								     (`SliderHorizontalThumbWidth`), while `.thumb::before` grows the
								     visible circle by 2px on every side from the `Margin="-2"` already
								     cited above: 20px above the circle is 20px + 2px = 22px above the
								     element. Vertical placement was not measured on the reference and
								     follows this horizontal logic; the Gallery Grid page checks it later. -->
								<ToolTip
									content={String(value)}
									placement={orientation === 'vertical' ? 'left' : 'top'}
									offset={22}
									openOnHover={false}
									bind:open={thumbToolTipOpen}
								>
									{#snippet children(toolTipProps)}
										<span
											{...toolTipProps}
											{...props}
											bind:this={ref}
											class="thumb"
											onpointerdown={onThumbPointerDown(props)}
											{@attach focusVisual}
										>
											<span class="inner"></span>
										</span>
									{/snippet}
								</ToolTip>
							{:else}
								<span {...props} bind:this={ref} class="thumb" {@attach focusVisual}>
									<span class="inner"></span>
								</span>
							{/if}
						{/snippet}
					</Slider.Thumb>
				{/each}
			</span>
		{/snippet}
	</Slider.Root>
</div>

<style>
	.root {
		display: inline-flex;
		flex-direction: column;
		position: relative;
	}

	/* Row 0 of `DefaultSliderStyle` at Slider_themeresources.xaml:396. `TextWrapping="Wrap"`
	   upstream maps to `white-space: normal` here. */
	.header {
		margin: var(--winui-SliderTopHeaderMargin);
		color: var(--winui-SliderHeaderForeground);
		font-weight: var(--winui-SliderHeaderThemeFontWeight);
		white-space: normal;
	}

	/* `HorizontalTemplate` at Slider_themeresources.xaml:400 has three rows whose heights
	   are `SliderPreContentMargin` (14), `Auto`, `SliderPostContentMargin` (14) — 14 + 4 + 14
	   = 32, which is `SliderHorizontalHeight`. Centring in the 32 is what replaces the two
	   margins.

	   No resting or disabled background, and the omission is upstream's rather than this
	   component's. `SliderContainerBackground` is defined under `HighContrast` at :57 and
	   `Light` at :114 and **not under `Default`**; `SliderContainerBackgroundDisabled` is
	   defined twice under `Default`, at :12 onto `ControlFillColorTransparentBrush` and at
	   :13 onto `ControlFillColorTransparent`, a `Color` where a `Brush` is wanted. Neither
	   can be emitted as a token that resolves in all three themes, so neither is read here.
	   Both are transparent wherever they are defined, so nothing is painted differently for
	   it; what is lost is the ability to notice a re-pin that gives them a value. The
	   pointer-over and pressed siblings are complete and are read below. */
	.container {
		position: relative;
		display: flex;
		align-items: center;
		min-height: var(--winui-SliderHorizontalHeight);
		touch-action: none;
	}

	/* `HorizontalTrackRect` at Slider_themeresources.xaml:411. Full width, the
	   `SliderTrackThemeHeight` bar, the control's `CornerRadius` which the style sets to
	   `SliderTrackCornerRadius`. Filled with the control's `Background`, which
	   `DefaultSliderStyle` sets to `SliderTrackFill`. */
	.track {
		width: 100%;
		height: var(--winui-SliderTrackThemeHeight);
		border-radius: var(--winui-SliderTrackCornerRadius);
		background: var(--winui-SliderTrackFill);
	}

	/* `HorizontalDecreaseRect` at Slider_themeresources.xaml:412. The same bar from the
	   start to the value. Height and radius as the track; filled with the control's
	   `Foreground`, which `DefaultSliderStyle` sets to `SliderTrackValueFill`. No
	   positioning: the primitive owns where the value end is.

	   No `:global` anywhere in this block, and that is why the markup goes through the
	   primitive's `child` snippet: every element carrying a class is written in this
	   component, so every selector below is scoped by the compiler. */
	.fill {
		height: var(--winui-SliderTrackThemeHeight);
		border-radius: var(--winui-SliderTrackCornerRadius);
		background: var(--winui-SliderTrackValueFill);
	}

	/* `HorizontalThumb` at Slider_themeresources.xaml:416, a 18x18 box. The primitive
	   positions it absolutely; the rules below only paint it. `display: grid; place-items:
	   center` keeps the inner accent circle centred. `cursor: pointer` is what tells the
	   pointer it can drag the value. */
	/* `outline: none` for the reason every other component here sets it: the focus visual
	   is drawn by this component, on `.container::before` below, and the user agent's own
	   ring is a second one. On the thumb it is not merely redundant — the thumb is round
	   and the ring is drawn around its box, so the two are different shapes. */
	.thumb {
		width: var(--winui-SliderHorizontalThumbWidth);
		height: var(--winui-SliderHorizontalThumbHeight);
		border-radius: var(--winui-SliderThumbCornerRadius);
		display: grid;
		place-items: center;
		cursor: pointer;
		outline: none;
	}

	/* `SliderThumbStyle` at Slider_themeresources.xaml:192: the visible circle is a
	   22x22 `Border` around an 18x18 layout box, so it carries `Margin="-2"`. `-2px`
	   here backs out the layout box by the `SliderHorizontalThumbWidth/Height` margin so
	   the ring's box is the thumb's own border box. The `z-index` puts the outer face
	   behind `.inner`. */
	.thumb::before {
		content: '';
		position: absolute;
		/* c1-allow: Slider_themeresources.xaml:198, `Margin="-2"` on `SliderThumbStyle`'s
		   Border — the visible circle is the layout box grown by 2 on every side */
		inset: -2px;
		background: var(--winui-SliderOuterThumbBackground);
		border-radius: var(--winui-SliderThumbCornerRadius);
		z-index: -1;
	}

	/* The thumb's gradient border, painted as a masked ring for the same reason Button's
	   is: `SliderThumbBorderBrush` aliases `ControlElevationBorderBrush`, a gradient in
	   the token layer, and a gradient named as a `border-color` is invalid CSS and
	   silently dropped. The mask is two layers composited so the content box is punched
	   out — `-webkit-mask-composite: xor` is the same operation under the prefixed
	   property, which is what Safari reads. */
	.thumb::after {
		content: '';
		position: absolute;
		inset: -2px;
		border-radius: inherit;
		/* c1-allow: Slider_themeresources.xaml:193, `BorderThickness="1"` on
		   `SliderThumbStyle` */
		padding: 1px;
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		background: var(--winui-SliderThumbBorderBrush);
	}

	/* `SliderInnerThumb` at Slider_themeresources.xaml:199: the accent `Ellipse`, 12x12
	   at rest. `CommonStates` scales it by 0.86 at rest, 1.167 on hover, 0.71 while
	   pressed — measured on the reference guest against the shipped Gallery, the rendered
	   accent circle is 10.3px at rest, 14.1px on hover and 8.5px pressed, which is 12
	   times each scale. So the scales are right, the source's comments are wrong about
	   the base being 14, and `scale` (not three widths) is what keeps the circle centred
	   for free. The three numbers are unitless, so C1 does not see them, but each gets a
	   line-number citation. No `transition` — a transition would need the upstream
	   `ControlFastAnimationDuration` / `ControlNormalAnimationDuration`, which this unit
	   does not seed, and the snapshot suite photographs the resting, hover and pressed
	   sizes at their final values. */
	.inner {
		width: var(--winui-SliderInnerThumbWidth);
		height: var(--winui-SliderInnerThumbHeight);
		/* c1-allow: Slider_themeresources.xaml:199, `SliderInnerThumb` is an `Ellipse` */
		border-radius: 50%;
		background: var(--winui-SliderThumbBackground);
		/* c1-allow: Slider_themeresources.xaml:210, the `Normal` state's 0.86 scale */
		scale: 0.86;
	}

	/* The focus visual, the shape Button.svelte records. The tab stop is the thumb, so
	   the selector reaches through to it; `DefaultSliderStyle` at :184 sets
	   `FocusVisualMargin="-7,0,-7,0"`, which is `inset: 0 -7px`.

	   The selector is keyed on an attribute the attachment sets rather than on
	   `:focus-visible`, which is what every other component here uses. A `<span>` is not
	   mouse-focusable, so pressing the thumb focuses nothing; the primitive then calls
	   `.focus()` on it from a script, and Chromium grants `:focus-visible` to that.
	   Measured: after a mouse drag the thumb still matches `:focus-visible`, so the band
	   lit up around the track where the original shows nothing — WinUI draws it for
	   `FocusState.Keyboard` only. The attachment tracks the modality at the document and
	   sets the attribute when and only when it is keyboard, which is the distinction
	   `:focus-visible` already makes for an element the user agent focuses itself. This
	   one is not that element. */
	.container:has(.thumb[data-focus-visual])::before {
		content: '';
		position: absolute;
		/* c1-allow: Slider_themeresources.xaml:184, `FocusVisualMargin="-7,0,-7,0"` — XAML
		   writes left,top,right,bottom and CSS `inset` writes top,right,bottom,left */
		inset: 0 -7px;
		/* c1-allow: the same 3px vertical offset Button, CheckBox, RadioButton and
		   ToggleSwitch carry, so the band stays concentric with the control's own corner */
		border-radius: calc(var(--winui-ControlCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* `VerticalTemplate` at Slider_themeresources.xaml:418-434 turns the horizontal template
	   a quarter turn. Its grid's first row stretches, so the container consumes the root height
	   remaining after the header. The existing `align-items: center` gives the absolutely
	   positioned thumb its horizontally centred static position. */
	.root[data-orientation='vertical'] .container {
		flex: 1 1 auto;
		flex-direction: column;
		min-height: 0;
		/* The template's columns are `SliderPreContentMargin`, `Auto`, `SliderPostContentMargin`
		   (:424-427) — 14 + 4 + 14 = 32 — and a XAML Grid does not spread its fixed columns
		   across a wider slot, so under a wide header the track stays 14 from the left edge.
		   Measured on the original's Grid page: the `RowSpacing` header starts at the track's
		   left edge minus 14. A column exactly `SliderVerticalWidth` wide, aligned to the
		   start, is that; centring the track in the header's width was not. */
		width: var(--winui-SliderVerticalWidth);
		align-self: flex-start;
	}

	/* `VerticalTrackRect`, Slider_themeresources.xaml:429. */
	.root[data-orientation='vertical'] .track {
		width: var(--winui-SliderTrackThemeHeight);
		height: 100%;
	}

	/* `VerticalDecreaseRect`, Slider_themeresources.xaml:430; bits-ui supplies the inline
	   `top`/`bottom` span. */
	.root[data-orientation='vertical'] .fill {
		width: var(--winui-SliderTrackThemeHeight);
		height: auto;
	}

	/* `VerticalThumb`, Slider_themeresources.xaml:434. */
	.root[data-orientation='vertical'] .thumb {
		width: var(--winui-SliderVerticalThumbWidth);
		height: var(--winui-SliderVerticalThumbHeight);
	}

	/* `FocusVisualMargin="-7,0,-7,0"` at Slider_themeresources.xaml:184 belongs to the style,
	   rather than either template, so `inset: 0 -7px` above applies unchanged when vertical. */

	/* TickBar layers paint over the track. */
	.tick-bar {
		position: absolute;
		pointer-events: none;
	}

	/* `HorizontalInlineTickBar`, Slider_themeresources.xaml:414. */
	.tick-bar.inline {
		left: 0;
		right: 0;
		height: var(--winui-SliderTrackThemeHeight);
		top: 50%;
		translate: 0 -50%;
	}

	/* `TopTickBar`/`BottomTickBar`, Slider_themeresources.xaml:413/:415. The 4px margins put
	   each outside bar beyond the track's centred edge. */
	.tick-bar.outside {
		left: 0;
		right: 0;
		height: var(--winui-SliderOutsideTickBarThemeHeight);
	}
	.tick-bar.outside.before {
		/* c1-allow: Slider_themeresources.xaml:413, `Margin="0,0,0,4"` */
		bottom: calc(50% + var(--winui-SliderTrackThemeHeight) / 2 + 4px);
	}
	.tick-bar.outside.after {
		/* c1-allow: Slider_themeresources.xaml:415, `Margin="0,4,0,0"` */
		top: calc(50% + var(--winui-SliderTrackThemeHeight) / 2 + 4px);
	}

	/* TickBar_Partial.cpp, `singlePixelWidthScaled`. */
	.tick {
		position: absolute;
		/* c1-allow: TickBar_Partial.cpp, `singlePixelWidthScaled` */
		width: 1px;
		height: 100%;
	}

	/* `HorizontalInlineTickBar`, `TopTickBar`, and `BottomTickBar` at
	   Slider_themeresources.xaml:413-415. */
	.tick-bar.inline .tick {
		background: var(--winui-SliderInlineTickBarFill);
	}
	.tick-bar.outside .tick {
		background: var(--winui-SliderTickBarFill);
	}
	.root[data-disabled] .tick-bar.outside .tick {
		background: var(--winui-SliderTickBarFillDisabled);
	}

	/* `VerticalInlineTickBar`, Slider_themeresources.xaml:432. */
	.root[data-orientation='vertical'] .tick-bar.inline {
		top: 0;
		bottom: 0;
		left: 50%;
		right: auto;
		width: var(--winui-SliderTrackThemeHeight);
		height: auto;
		translate: -50% 0;
	}

	/* `LeftTickBar`/`RightTickBar`, Slider_themeresources.xaml:431/:433. The 4px margins put
	   each outside bar beyond the track's centred edge. */
	.root[data-orientation='vertical'] .tick-bar.outside {
		top: 0;
		bottom: 0;
		width: var(--winui-SliderOutsideTickBarThemeHeight);
		height: auto;
	}
	.root[data-orientation='vertical'] .tick-bar.outside.before {
		left: auto;
		/* c1-allow: Slider_themeresources.xaml:431, `Margin="0,0,4,0"` */
		right: calc(50% + var(--winui-SliderTrackThemeHeight) / 2 + 4px);
	}
	.root[data-orientation='vertical'] .tick-bar.outside.after {
		right: auto;
		/* c1-allow: Slider_themeresources.xaml:433, `Margin="4,0,0,0"` */
		left: calc(50% + var(--winui-SliderTrackThemeHeight) / 2 + 4px);
	}

	/* TickBar_Partial.cpp, `singlePixelWidthScaled`, transposed for vertical. */
	.root[data-orientation='vertical'] .tick {
		width: 100%;
		/* c1-allow: TickBar_Partial.cpp, `singlePixelWidthScaled` */
		height: 1px;
	}

	/* ----- PointerOver ----- */
	.container:hover .track {
		background: var(--winui-SliderTrackFillPointerOver);
	}
	.container:hover .fill {
		background: var(--winui-SliderTrackValueFillPointerOver);
	}
	.container:hover .inner {
		background: var(--winui-SliderThumbBackgroundPointerOver);
		/* c1-allow: Slider_themeresources.xaml:222, the `PointerOver` state's 1.167 scale */
		scale: 1.167;
	}
	.container:hover {
		background: var(--winui-SliderContainerBackgroundPointerOver);
	}

	/* ----- Pressed ----- */
	/* The primitive sets `data-active` on the thumb while it is being dragged; the
	   pressed state is the inner accent scaled to 0.71 and the four `Pressed` brushes. */
	.container:has(.thumb[data-active]) .track {
		background: var(--winui-SliderTrackFillPressed);
	}
	.container:has(.thumb[data-active]) .fill {
		background: var(--winui-SliderTrackValueFillPressed);
	}
	.container:has(.thumb[data-active]) .inner {
		background: var(--winui-SliderThumbBackgroundPressed);
		/* c1-allow: Slider_themeresources.xaml:234, the `Pressed` state's 0.71 scale */
		scale: 0.71;
	}
	.container:has(.thumb[data-active]) {
		background: var(--winui-SliderContainerBackgroundPressed);
	}

	/* ----- Disabled — written last so the four disabled brushes win over `:hover` and
	   `:has(...)`. A disabled slider must not light up under the pointer or while being
	   dragged. `data-disabled` is on the root rather than `:disabled` because the root
	   is a `<div>` and the thumb is a `<span>` without `:disabled`. */
	.root[data-disabled] .track {
		background: var(--winui-SliderTrackFillDisabled);
	}
	.root[data-disabled] .container .fill {
		background: var(--winui-SliderTrackValueFillDisabled);
	}
	.root[data-disabled] .inner {
		background: var(--winui-SliderThumbBackgroundDisabled);
		/* c1-allow: Slider_themeresources.xaml:245, the `Disabled` state's 1.167 scale — the
		   same 14px circle hover shows. A disabled slider's accent dot is larger than a
		   resting one, which reads as a mistake and is what the source says. */
		scale: 1.167;
	}
	.root[data-disabled] .container .thumb {
		cursor: default;
	}
	.root[data-disabled] .header {
		color: var(--winui-SliderHeaderForegroundDisabled);
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
