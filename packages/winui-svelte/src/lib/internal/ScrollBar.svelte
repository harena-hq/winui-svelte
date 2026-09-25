<script lang="ts" module>
	export interface ScrollBarProps {
		/** ScrollBar.Orientation. */
		orientation?: 'vertical' | 'horizontal';
		/** RangeBase.Value — the scroll offset. */
		value?: number;
		/** RangeBase.Minimum. */
		minimum?: number;
		/** RangeBase.Maximum — the largest offset, i.e. the scrollable extent. */
		maximum?: number;
		/** ScrollBar.ViewportSize. */
		viewportSize?: number;
		/** ScrollBar.IndicatorMode (ScrollingIndicatorMode). */
		indicatorMode?: 'none' | 'mouse' | 'touch';
		/** Control.IsEnabled, inverted. */
		disabled?: boolean;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. */
		onValueChange?: ((value: number) => void) | undefined;
		class?: string;
		style?: string;
		/** The ScrollBar root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		orientation = 'vertical',
		value = $bindable(0),
		minimum = 0,
		maximum = 0,
		viewportSize = 0,
		indicatorMode = 'mouse',
		disabled = false,
		onValueChange,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ScrollBarProps = $props();

	let trackLength = $state(0);
	let drag = $state<{
		pointerId: number;
		pointerStart: number;
		thumbStart: number;
	} | null>(null);

	// ScrollBar_Partial.cpp:796-803 measures the control along its scrolling axis; its two
	// ScrollBarSize arrow boxes occupy 2 × 12 before the thumb's travel starts.
	let repeatButtonsLength = $derived(2 * 12);
	let range = $derived(maximum - minimum);
	// ScrollBar_Partial.cpp:1392-1432, 1500-1523 computes the viewport proportion and clamps it to 30.
	let thumbLength = $derived(
		Math.max(
			30,
			Math.round((trackLength * viewportSize) / Math.max(1, viewportSize + maximum - minimum))
		)
	);
	// ScrollBar_Partial.cpp:1513 hides an impossible or unnecessary indicator.
	let hideThumb = $derived(
		trackLength === 0 ||
			range === 0 ||
			thumbLength > trackLength - repeatButtonsLength ||
			trackLength - repeatButtonsLength <= 30
	);
	// ScrollBar_Partial.cpp:1343-1369 maps RangeBase.Value into the thumb's leading offset; 12 is
	// the leading ScrollBarSize arrow box that the invisible LargeDecrease button occupies.
	let multiplier = $derived(range === 0 ? 0 : (value - minimum) / range);
	let thumbStart = $derived(
		12 + Math.max(0, multiplier * (trackLength - repeatButtonsLength - thumbLength))
	);
	// ScrollBar_Partial.cpp:1357, 1372-1385; 32 is VerticalPanningThumb's MinHeight/MinWidth
	// in ScrollBar_themeresources.xaml:714.
	let touchLength = $derived(
		Math.max(
			32,
			Math.round((trackLength * viewportSize) / Math.max(1, viewportSize + maximum - minimum))
		)
	);
	let touchStart = $derived(Math.max(0, multiplier * (trackLength - touchLength)));
	// ScrollBarController.cpp:90, 127 uses one eighth of the viewport, floored at one.
	let smallChange = $derived(Math.max(1, viewportSize / 8));
	let thumbStyle = $derived(
		orientation === 'vertical'
			? `top: ${thumbStart}px; height: ${thumbLength}px`
			: `left: ${thumbStart}px; width: ${thumbLength}px`
	);
	let panningStyle = $derived(
		orientation === 'vertical'
			? `top: ${touchStart}px; height: ${touchLength}px`
			: `left: ${touchStart}px; width: ${touchLength}px`
	);

	function clamp(next: number): number {
		return Math.max(minimum, Math.min(maximum, next));
	}

	function commit(next: number) {
		if (disabled) return;
		value = clamp(next);
		onValueChange?.(value);
	}

	function moveBy(amount: number) {
		// ScrollBar_themeresources.xaml's RepeatButtons use Interval="50"; hold-to-repeat is
		// intentionally outside this unit, so one click performs exactly one small change.
		commit(value + amount);
	}

	function positionOf(event: PointerEvent): number {
		const bounds = ref?.getBoundingClientRect();
		if (!bounds) return 0;
		return orientation === 'vertical' ? event.clientY - bounds.top : event.clientX - bounds.left;
	}

	function onTrackPointerDown(event: PointerEvent) {
		if (disabled || indicatorMode !== 'mouse' || hideThumb) return;
		const target = event.target as Element | null;
		if (target?.closest('.arrow, .thumb')) return;
		const position = positionOf(event);
		if (position < thumbStart) moveBy(-viewportSize);
		else if (position > thumbStart + thumbLength) moveBy(viewportSize);
	}

	function onThumbPointerDown(event: PointerEvent) {
		if (disabled || hideThumb) return;
		const thumb = event.currentTarget as HTMLElement;
		thumb.setPointerCapture(event.pointerId);
		drag = {
			pointerId: event.pointerId,
			pointerStart: positionOf(event),
			thumbStart
		};
	}

	function onPointerMove(event: PointerEvent) {
		if (!drag || drag.pointerId !== event.pointerId || disabled) return;
		// ScrollBar_Partial.cpp:1343-1369 applies the captured thumb offset over the available track.
		const available = trackLength - repeatButtonsLength - thumbLength;
		if (available <= 0 || range === 0) return;
		const offset = Math.max(
			0,
			Math.min(available, drag.thumbStart - 12 + positionOf(event) - drag.pointerStart)
		);
		commit(minimum + (range * offset) / available);
	}

	function endDrag(event: PointerEvent) {
		if (drag?.pointerId === event.pointerId) drag = null;
	}

	$effect(() => {
		if (!ref) return;
		const observer = new ResizeObserver(() => {
			trackLength = orientation === 'vertical' ? (ref?.clientHeight ?? 0) : (ref?.clientWidth ?? 0);
		});
		observer.observe(ref);
		trackLength = orientation === 'vertical' ? ref.clientHeight : ref.clientWidth;
		return () => observer.disconnect();
	});
</script>

<div
	bind:this={ref}
	data-scroll-bar
	data-orientation={orientation}
	class={['scroll-bar', className]}
	class:disabled
	{style}
	role="scrollbar"
	aria-orientation={orientation}
	aria-valuenow={value}
	aria-valuemin={minimum}
	aria-valuemax={maximum}
	aria-disabled={disabled || undefined}
	onpointerdown={onTrackPointerDown}
	onpointermove={onPointerMove}
	onpointerup={endDrag}
	onpointercancel={endDrag}
	{...rest}
>
	{#if indicatorMode === 'mouse'}
		<div class="rail">
			<div class="track"></div>
			<button
				class="arrow decrease"
				type="button"
				tabindex="-1"
				aria-hidden="true"
				{disabled}
				onclick={() => moveBy(-smallChange)}
			>
				<span class="arrow-glyph"
					>{#if orientation === 'vertical'}&#xEDDB;{:else}&#xEDD9;{/if}</span
				>
			</button>
			<button
				class="arrow increase"
				type="button"
				tabindex="-1"
				aria-hidden="true"
				{disabled}
				onclick={() => moveBy(smallChange)}
			>
				<span class="arrow-glyph"
					>{#if orientation === 'vertical'}&#xEDDC;{:else}&#xEDDA;{/if}</span
				>
			</button>
			{#if !hideThumb}
				<div
					class="thumb"
					role="presentation"
					style={thumbStyle}
					onpointerdown={onThumbPointerDown}
				></div>
			{/if}
		</div>
	{:else if indicatorMode === 'touch'}
		<div class="panning-rail">
			{#if !hideThumb}
				<div class="panning-thumb" style={panningStyle}></div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.scroll-bar {
		box-sizing: border-box;
		position: relative;
		background: var(--winui-ScrollBarBackground);
		/* ScrollBar_themeresources.xaml:672, 694 binds a zero-width border. */
		border: 0 solid var(--winui-ScrollBarBorderBrush);
	}

	.scroll-bar[data-orientation='vertical'] {
		width: var(--winui-ScrollBarSize);
		/* ScrollBar_Partial.cpp:796-803 stretches the control along its scrolling axis. */
		height: 100%;
	}

	.scroll-bar[data-orientation='horizontal'] {
		/* ScrollBar_Partial.cpp:796-803 stretches the control along its scrolling axis. */
		width: 100%;
		height: var(--winui-ScrollBarSize);
	}

	.rail,
	.panning-rail {
		position: absolute;
		inset: 0;
	}

	.track {
		box-sizing: border-box;
		position: absolute;
		inset: 0;
		background: var(--winui-ScrollBarTrackFill);
		border: var(--winui-ScrollBarTrackBorderThemeThickness) solid var(--winui-ScrollBarTrackStroke);
		border-radius: calc(var(--winui-ScrollBarCornerRadius) * 2);
		/* ScrollBar_themeresources.xaml:528-670 starts the expanded rail transparent. */
		opacity: 0;
		transition: opacity var(--winui-ScrollBarOpacityChangeDuration) linear
			var(--winui-ScrollBarContractBeginTime);
	}

	.arrow {
		box-sizing: border-box;
		position: absolute;
		display: grid;
		width: var(--winui-ScrollBarSize);
		height: var(--winui-ScrollBarSize);
		place-items: center;
		border: 0;
		background: var(--winui-ScrollBarButtonBackground);
		color: var(--winui-ScrollBarButtonArrowForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-ScrollBarButtonArrowIconFontSize);
		/* ScrollBar_themeresources.xaml:528-670 starts the expanded rail transparent. */
		opacity: 0;
		transition: opacity var(--winui-ScrollBarOpacityChangeDuration) linear
			var(--winui-ScrollBarContractBeginTime);
	}

	.scroll-bar[data-orientation='vertical'] .decrease {
		top: 0;
		left: 0;
		padding: var(--winui-ScrollBarVerticalDecreaseMargin);
	}

	.scroll-bar[data-orientation='vertical'] .increase {
		bottom: 0;
		left: 0;
		padding: var(--winui-ScrollBarVerticalIncreaseMargin);
	}

	.scroll-bar[data-orientation='horizontal'] .decrease {
		left: 0;
		top: 0;
		padding: var(--winui-ScrollBarHorizontalDecreaseMargin);
	}

	.scroll-bar[data-orientation='horizontal'] .increase {
		right: 0;
		top: 0;
		padding: var(--winui-ScrollBarHorizontalIncreaseMargin);
	}

	.arrow:hover {
		background: var(--winui-ScrollBarButtonBackgroundPointerOver);
		color: var(--winui-ScrollBarButtonArrowForegroundPointerOver);
	}

	.arrow:active {
		background: var(--winui-ScrollBarButtonBackgroundPressed);
		color: var(--winui-ScrollBarButtonArrowForegroundPressed);
	}

	.arrow:active .arrow-glyph {
		transform: scale(var(--winui-ScrollBarButtonArrowScalePressed));
	}

	.arrow:disabled {
		background: var(--winui-ScrollBarButtonBackgroundDisabled);
		color: var(--winui-ScrollBarButtonArrowForegroundDisabled);
	}

	.thumb {
		box-sizing: border-box;
		position: absolute;
		/* The thumb is centred across the rail and then pushed by ScrollBarThumbOffset, which is
		   what XAML does: an explicit Width under the default HorizontalAlignment centres, and
		   VerticalThumbTransform adds the offset (ScrollBar_themeresources.xaml:705-708). Measured
		   on the reference guest, the collapsed fill lands three pixels clear of the rail's edge
		   and the expanded fill is centred; right-aligning the box instead puts both two pixels
		   too far out and hangs the collapsed one over the rail. */
		right: 50%;
		width: var(--winui-ScrollBarVerticalThumbMinWidth);
		/* `background-color`, never the `background` shorthand: the shorthand resets
		   `background-clip` to `border-box`, and every rule below that changes the thumb's colour
		   would then paint the transparent stroke as well — an eight-wide mark where the original
		   draws two. Found by measuring the disabled row of the baseline. */
		background-color: var(--winui-ScrollBarPanningThumbBackground);
		/* Half the stroke, not all of it. A XAML stroke straddles the edge — three pixels inside
		   and three outside — so a border-box border of half the thickness is what leaves the
		   painted fill upstream leaves: two pixels of the collapsed eight, six of the expanded
		   twelve, both measured on the guest. The whole thickness would consume the box. */
		border: calc(var(--winui-ScrollBarThumbStrokeThickness) / 2) solid
			var(--winui-ScrollBarThumbBorderBrush);
		/* The radius belongs to the fill, and the fill is the padding box — CSS gives a padding box
		   the border box's radius less the border width, so a bare 3 here leaves the visible strip
		   with none. `VerticalThumbTemplate` (ScrollBar_themeresources.xaml:394-395) is a Rectangle
		   whose RadiusX/Y is ScrollBarCornerRadius and whose StrokeThickness is
		   ScrollBarThumbStrokeThickness; a XAML Shape insets its path by half the stroke, so the
		   path upstream rounds *is* the strip this border-clip leaves, and it rounds it by 3.
		   Adding half the stroke back makes the padding box's radius 3 again, and CSS's own clamp to
		   half the shorter side then reproduces XAML's: 1 across the resting 2, 3 across the
		   hovered 6. Measured on the guest — the original's hovered fill widens 2, 4, 5, 6 over its
		   first four rows and ours went to 6 on the first. */
		border-radius: calc(
			var(--winui-ScrollBarCornerRadius) + var(--winui-ScrollBarThumbStrokeThickness) / 2
		);
		background-clip: padding-box;
		transform: translateX(calc(50% + var(--winui-ScrollBarThumbOffset)));
		/* ScrollBar_themeresources.xaml:542-553, 586-597 sets KeySpline="0,0,0,1". */
		transition:
			width var(--winui-ScrollBarContractDuration) cubic-bezier(0, 0, 0, 1),
			transform var(--winui-ScrollBarContractDuration) cubic-bezier(0, 0, 0, 1),
			background-color var(--winui-ScrollBarColorChangeDuration) linear;
		/* The same two keyframes carry `BeginTime="{StaticResource ScrollBarContractBeginTime}"`,
		   and the whole Expanded-to-Collapsed storyboard (ScrollBar_themeresources.xaml:530-555)
		   begins there — the arrows' and the track's opacity on the same tick as the thumb's
		   width. Without this the thumb starts shrinking the instant the pointer leaves and the
		   arrows still wait half a second, so the two come apart. The colour keeps a delay of
		   none: it is a `VisualState.Setter` (`:557-561`), which XAML applies on entering the
		   state rather than through the storyboard. This longhand has to follow the shorthand
		   above, which resets it. */
		transition-delay:
			var(--winui-ScrollBarContractBeginTime), var(--winui-ScrollBarContractBeginTime), 0s;
	}

	.scroll-bar[data-orientation='horizontal'] .thumb {
		right: auto;
		bottom: 50%;
		width: auto;
		height: var(--winui-ScrollBarHorizontalThumbMinHeight);
		transform: translateY(calc(50% + var(--winui-ScrollBarThumbOffset)));
		transition-property: height, transform, background-color;
	}

	/* ScrollBar_themeresources.xaml:563-598 — the Expanded state's whole storyboard begins at
	   ScrollBarExpandBeginTime, the thumb's width and offset (`:586`, `:589`) included. The rail's
	   own brushes are Setters (`:564-573`) and land at once, which is why nothing here is
	   delayed and the two rules below are. */
	.scroll-bar:hover {
		background: var(--winui-ScrollBarBackgroundPointerOver);
		border-color: var(--winui-ScrollBarBorderBrushPointerOver);
	}

	.scroll-bar:hover .track,
	.scroll-bar:hover .arrow {
		opacity: 1;
		transition-delay: var(--winui-ScrollBarExpandBeginTime);
	}

	.scroll-bar:hover .track {
		background: var(--winui-ScrollBarTrackFillPointerOver);
		border-color: var(--winui-ScrollBarTrackStrokePointerOver);
	}

	.scroll-bar[data-orientation='vertical']:hover .thumb {
		width: var(--winui-ScrollBarSize);
		transform: translateX(50%);
		background-color: var(--winui-ScrollBarThumbBackground);
		transition-duration:
			var(--winui-ScrollBarExpandDuration), var(--winui-ScrollBarExpandDuration),
			var(--winui-ScrollBarColorChangeDuration);
		transition-delay:
			var(--winui-ScrollBarExpandBeginTime), var(--winui-ScrollBarExpandBeginTime), 0s;
	}

	.scroll-bar[data-orientation='horizontal']:hover .thumb {
		height: var(--winui-ScrollBarSize);
		transform: translateY(50%);
		background-color: var(--winui-ScrollBarThumbBackground);
		transition-duration:
			var(--winui-ScrollBarExpandDuration), var(--winui-ScrollBarExpandDuration),
			var(--winui-ScrollBarColorChangeDuration);
		transition-delay:
			var(--winui-ScrollBarExpandBeginTime), var(--winui-ScrollBarExpandBeginTime), 0s;
	}

	.panning-thumb {
		box-sizing: border-box;
		position: absolute;
		right: 0;
		/* ScrollBar_themeresources.xaml:713-714 sets VerticalPanningThumb Width="2" and Margin="2,0,2,0". */
		width: 2px;
		/* ScrollBar_themeresources.xaml:713-714 sets VerticalPanningThumb Width="2" and Margin="2,0,2,0". */
		margin: 0 2px;
		/* ScrollBar_themeresources.xaml:714 sets VerticalPanningThumb MinHeight="32". */
		min-height: 32px;
		background: var(--winui-ScrollBarPanningThumbBackground);
		border-radius: var(--winui-ScrollBarCornerRadius);
	}

	.scroll-bar[data-orientation='horizontal'] .panning-thumb {
		right: auto;
		bottom: 0;
		/* ScrollBar_themeresources.xaml:691-692 transposes VerticalPanningThumb to Height="2" and Margin="0,2,0,2". */
		width: auto;
		/* ScrollBar_themeresources.xaml:691-692 transposes VerticalPanningThumb to Height="2" and Margin="0,2,0,2". */
		height: 2px;
		/* ScrollBar_themeresources.xaml:691-692 transposes VerticalPanningThumb to Height="2" and Margin="0,2,0,2". */
		margin: 2px 0;
		/* ScrollBar_themeresources.xaml:691-692 sets HorizontalPanningThumb MinWidth="32". */
		min-width: 32px;
		min-height: 0;
	}

	.scroll-bar.disabled {
		/* ScrollBar_themeresources.xaml:436 sets the disabled root opacity to 0.5. */
		opacity: 0.5;
		background: var(--winui-ScrollBarBackgroundDisabled);
		border-color: var(--winui-ScrollBarBorderBrushDisabled);
	}

	.scroll-bar.disabled .track {
		background: var(--winui-ScrollBarTrackFillDisabled);
		border-color: var(--winui-ScrollBarTrackStrokeDisabled);
	}

	.scroll-bar.disabled .thumb,
	.scroll-bar.disabled:hover .thumb {
		background-color: var(--winui-ScrollBarThumbFillDisabled);
	}

	.scroll-bar.disabled .panning-thumb {
		background: var(--winui-ScrollBarPanningThumbBackgroundDisabled);
	}

	/* ADR 0016. With the system's animations off, upstream does not play `Expanded` and the
	   `Expanded`-to-`Collapsed` transition at all: it asks for `ExpandedWithoutAnimation` and
	   `CollapsedWithoutAnimation` instead (ScrollBar_Partial.cpp:754-775), whose animations
	   keep each `BeginTime` and have a zero `Duration` (ScrollBar_themeresources.xaml:600-670).
	   So the rail still waits before it expands and before it contracts, and then snaps. The
	   thumb's colour is left as it is: neither state pair animates it. */
	@media (prefers-reduced-motion: reduce) {
		.track,
		.arrow {
			transition-duration: 0s;
		}

		.thumb,
		.scroll-bar[data-orientation='vertical']:hover .thumb,
		.scroll-bar[data-orientation='horizontal']:hover .thumb {
			transition-duration: 0s, 0s, var(--winui-ScrollBarColorChangeDuration);
		}
	}
</style>
