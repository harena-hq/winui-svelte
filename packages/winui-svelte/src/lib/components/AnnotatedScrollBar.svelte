<script lang="ts" module>
	export interface AnnotatedScrollBarProps {
		/** AnnotatedScrollBar.Labels — each an `AnnotatedScrollBarLabel(content, scrollOffset)`. */
		labels?: { content: string; scrollOffset: number }[];
		/** AnnotatedScrollBar.SmallChange. Zero means `viewportSize / 8`. */
		smallChange?: number;
		/** IScrollController.SetValues — the scrolled region's own extent, in its units. */
		minimum?: number;
		/** IScrollController.SetValues. */
		maximum?: number;
		/** IScrollController.SetValues. */
		viewportSize?: number;
		/** IScrollController.SetValues — the region's current offset. */
		value?: number;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. Upstream's
		 *  `ScrollToRequested` and its siblings are the same request in event form. */
		onValueChange?: ((value: number) => void) | undefined;
		/** AnnotatedScrollBar.DetailLabelRequested — return the tooltip's text for an offset.
		 *  Returning undefined suppresses the tooltip, which is what upstream does when no handler
		 *  is attached. */
		detailLabelRequested?: ((scrollOffset: number) => string | undefined) | undefined;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/** The AnnotatedScrollBar root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// `ScrollController` (`AnnotatedScrollBar.idl:50`) is absent. It returns the control itself as
	// an `IScrollController` so that a `ScrollPresenter` can consume it — upstream's Gallery page
	// writes `scrollView.ScrollPresenter.VerticalScrollController = annotatedScrollBar.ScrollController`
	// and the two are wired. This library has no `IScrollController` interface to return, and the
	// four numbers that contract carries — minimum, maximum, viewport size and value, the arguments
	// of `IScrollController.SetValues` — are props here instead. The Gallery page binds them to a
	// `ScrollView`'s own published measurements and writes `onValueChange` back to its offset,
	// which is the same wiring in the shape this library has.
	//
	// `LabelTemplate` and `DetailLabelTemplate` (`:52-53`) are absent. They are `IElementFactory`
	// properties, and a `DataTemplate` object has no form here: a caller who wants different label
	// markup writes it in the snippet that holds this control. There is deliberately no snippet
	// prop for the label either — the default template is the only one either Gallery example uses,
	// and a prop nothing exercises is a prop that turns out to be the wrong shape the first time
	// something needs it.
	//
	// The `Scrolling` event and its `Cancel` (`:56`) are absent: this library publishes state
	// rather than cancellable commands, which is ADR 0009's own rule about imperative members.
	// `value` and `onValueChange` carry every change this control makes; nothing can veto one.

	/**
	 * `ThumbHeight` — the 3-pixel thumb, `AnnotatedScrollBar_themeresources.xaml:35`.
	 *
	 * `UpdateScrollOffsetToLabelOffsetFactor` (`AnnotatedScrollBar.cpp:461-474`) measures the
	 * thumb element and subtracts its `ActualHeight` from the label column's, so that the last
	 * scroll offset puts the thumb's *top* at the bottom of the rail rather than its bottom
	 * below it. The token is that same height, and reading the element back would be a layout
	 * measurement taken to learn a constant.
	 */
	const THUMB_HEIGHT = 3;

	/** `s_defaultViewportToSmallChangeRatio` (`AnnotatedScrollBar.h:206`). */
	const VIEWPORT_TO_SMALL_CHANGE_RATIO = 8;

	/**
	 * `CollapseCollidingAndOutOfBoundsLabels` (`AnnotatedScrollBar.cpp:395-454`), returning the
	 * collapsed flag for each label rather than writing `Visibility` onto elements.
	 *
	 * The walk is bottom to top, and the three clauses are upstream's: a label whose top is
	 * negative or whose bottom passes the rail's height is out of bounds; a label whose bottom
	 * reaches the top of the last one kept is colliding. The bottom-most label kept always
	 * survives a collision, and index 0 survives one too — unless the label it collides with is
	 * not the last of the list, in which case that one is collapsed instead (`:434-442`).
	 */
	function collapsedLabels(tops: number[], heights: number[], railHeight: number): boolean[] {
		const collapsed = tops.map(() => false);
		// `:402-406` returns before touching any visibility, so an unmeasured rail leaves the
		// labels as they were created — visible.
		if (tops.length === 0 || railHeight === 0) return collapsed;

		let previousTop = -1;
		let previousIndex = tops.length;
		for (let index = previousIndex - 1; index >= 0; index--) {
			const top = tops[index];
			const bottom = top + heights[index];
			const outOfBounds = top < 0 || bottom > railHeight;
			const colliding = previousTop >= 0 && previousTop <= bottom;
			if (outOfBounds) {
				collapsed[index] = true;
			} else if (colliding) {
				collapsed[index === 0 && previousIndex < tops.length - 1 ? previousIndex : index] = true;
			} else {
				collapsed[index] = false;
				previousTop = top;
				previousIndex = index;
			}
		}
		return collapsed;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';

	let {
		labels = [],
		smallChange = 0, // AnnotatedScrollBar.idl:54
		minimum = 0,
		maximum = 0,
		viewportSize = 0,
		value = $bindable(0),
		onValueChange,
		detailLabelRequested,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: AnnotatedScrollBarProps = $props();

	let verticalGrid = $state<HTMLDivElement | null>(null);
	let labelsColumn = $state<HTMLDivElement | null>(null);
	let labelElements = $state<(HTMLDivElement | null)[]>([]);
	/** The label column's own measured height — `labelsGrid.ActualHeight()` at `:471`. */
	let railHeight = $state(0);
	/** `m_labelSizes` — each label's measured height, refreshed whenever the observer fires. */
	let labelHeights = $state<number[]>([]);
	let collapsed = $state<boolean[]>([]);
	/** The pointer's offset from the top of the vertical grid, clamped, or `null` when it is away. */
	let pointerOffset = $state<number | null>(null);
	let detailLabel = $state<string | undefined>(undefined);
	let dragging = $state(false);

	// `UpdateScrollOffsetToLabelOffsetFactor` (`:461-474`). `scrollViewScrollableHeight` is
	// `Maximum - Minimum` with zero replaced by one, and `:471` reads the replaced value twice —
	// including inside the viewport term. Both reads are `range` here for that reason: written
	// with the raw difference, the viewport term is `1 - 0/0` at the default props and the whole
	// factor is NaN.
	const range = $derived(Math.max(maximum - minimum, 1));
	const factor = $derived(
		((railHeight - THUMB_HEIGHT) / range) * (1 - viewportSize / (viewportSize + range))
	);

	/** `GetLabelVerticalOffset` (`:456-459`). */
	const labelTops = $derived(labels.map((label) => label.scrollOffset * factor));

	// `AnnotatedScrollBarPanningInfo::UpdateThumbExpression` (`:202-212`) animates the thumb's
	// `Translation.Y` to `min(max, max(min, offset)) / -multiplier`, and the multiplier is the
	// negated factor — so the thumb's top is the clamped value times the factor.
	const thumbTop = $derived(Math.max(minimum, Math.min(maximum, value)) * factor);

	/** `EnsureSmallChangeValue` (`:484-490`), derived rather than written back onto the prop. */
	const step = $derived(
		smallChange > 0 ? smallChange : viewportSize / VIEWPORT_TO_SMALL_CHANGE_RATIO
	);

	// Upstream measures each label once, at creation, with
	// `LayoutUtils::MeasureAndGetDesiredHeightFor(labelContentPresenter, c_infSize)` (`:370-371`),
	// and caches the result in `m_labelSizes` for the collision test to read. The measured
	// element is the ContentPresenter around the default template, whose TextBlock carries
	// `Margin="0,-5,0,-2"` (`AnnotatedScrollBar.xaml:11`) — so the cached height is the text's own
	// height less 7, and every collision test is looser by that much. The margin is layout, not
	// decoration. `.label` is a `flow-root` here so that its `offsetHeight` is exactly that
	// number: the margin box of the text it contains, negative margins included.
	function measure() {
		const column = labelsColumn;
		if (!column) return;
		railHeight = column.clientHeight;
		labelHeights = labels.map((_, index) => labelElements[index]?.offsetHeight ?? 0);
	}

	$effect(() => {
		if (!labelsColumn) return;
		const observer = new ResizeObserver(measure);
		observer.observe(labelsColumn);
		// Upstream re-runs the pass on the labels grid's SizeChanged alone. A web font arriving
		// after first paint changes a label's height without changing the column's, and the pass
		// reads that height, so each label is observed too.
		for (const element of labelElements) if (element) observer.observe(element);
		measure();
		return () => observer.disconnect();
	});

	$effect(() => {
		const next = collapsedLabels(labelTops, labelHeights, railHeight);
		const current = untrack(() => collapsed);
		if (next.length !== current.length || next.some((flag, index) => flag !== current[index])) {
			collapsed = next;
		}
	});

	/**
	 * The one way a value leaves this control.
	 *
	 * Upstream's `ScrollTo` (`:894-958`) raises `ScrollToRequested` and lets the `ScrollPresenter`
	 * on the other end clamp; there is no presenter behind this prop, so the clamp is applied
	 * here. Without it a press at the very bottom of the rail — `railHeight / factor` — reports a
	 * value past `maximum`, because the factor divides the rail by the range and by the viewport
	 * term both.
	 */
	function scrollTo(offset: number) {
		const next = Math.max(minimum, Math.min(maximum, offset));
		if (next === value) return;
		value = next;
		onValueChange?.(next);
	}

	/** `args.GetCurrentPoint(verticalGrid).Position().Y`, clamped as `:677-678` clamps it. */
	function offsetFromTop(event: PointerEvent): number {
		const bounds = verticalGrid?.getBoundingClientRect();
		if (!bounds) return 0;
		return Math.min(Math.max(0, event.clientY - bounds.top), bounds.height);
	}

	/** `RaiseDetailLabelRequested` (`:976-990`). No handler means no tooltip, as `:980-983` says. */
	function raiseDetailLabel(offset: number) {
		detailLabel = detailLabelRequested?.(Math.min(offset / factor, maximum + viewportSize));
	}

	function onPointerEnter(event: PointerEvent) {
		const offset = offsetFromTop(event);
		pointerOffset = offset;
		raiseDetailLabel(offset);
	}

	// `OnVerticalGridPointerMoved` (`:663-709`): the hover visuals follow the pointer, and while
	// the pointer is held the same offset is scrolled to.
	function onPointerMove(event: PointerEvent) {
		const offset = offsetFromTop(event);
		pointerOffset = offset;
		raiseDetailLabel(offset);
		if (dragging) scrollTo(offset / factor);
	}

	/** `HideHoverVisuals` (`:506-510`), through `OnVerticalGridPointerExited` (`:711-741`). */
	function onPointerLeave() {
		if (dragging) return;
		pointerOffset = null;
		detailLabel = undefined;
	}

	// `OnVerticalGridPointerPressed` (`:743-790`) scrolls to the pressed offset and captures the
	// pointer, so the drag that follows is delivered here even when it leaves the rail.
	function onPointerDown(event: PointerEvent) {
		const offset = offsetFromTop(event);
		pointerOffset = offset;
		dragging = true;
		verticalGrid?.setPointerCapture(event.pointerId);
		raiseDetailLabel(offset);
		scrollTo(offset / factor);
	}

	/** `IsOutOfVerticalGridBounds` (`:877-892`), tolerance and all. */
	function isOutOfBounds(event: PointerEvent): boolean {
		const bounds = verticalGrid?.getBoundingClientRect();
		if (!bounds) return true;
		const tolerance = 1;
		const x = event.clientX - bounds.left;
		const y = event.clientY - bounds.top;
		return (
			x < tolerance ||
			x > bounds.width - tolerance ||
			y < tolerance ||
			y > bounds.height - tolerance
		);
	}

	// `OnVerticalGridPointerReleased` (`:792-833`) and `ProcessVerticalGridPointerCanceled`
	// (`:849-875`). The bounds check is the second one's: a release outside the rail gets no
	// PointerExited afterwards, so the hover visuals have to be hidden here or they stay.
	function endDrag(event: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		if (verticalGrid?.hasPointerCapture(event.pointerId)) {
			verticalGrid.releasePointerCapture(event.pointerId);
		}
		if (isOutOfBounds(event)) {
			pointerOffset = null;
			detailLabel = undefined;
		}
	}

	// `ScrollTo`'s IncrementButton and DecrementButton arms (`:904-919`). The naming is inverted
	// from the direction: the *increment* button is the one at the top (`AnnotatedScrollBar.xaml:32`)
	// and it applies `-SmallChange`, so it scrolls up. Transcribed as it stands rather than
	// renamed, because the name is what a reader diffing this against the source will search for.
	function increment() {
		scrollTo(Math.max(minimum, value - step));
	}

	function decrement() {
		scrollTo(Math.min(maximum, value + step));
	}
</script>

<!-- `PART_RootGrid` (AnnotatedScrollBar.xaml:25-30): three rows, `Auto` / `*` / `Auto`. There is
     no drawn rail — no line, no groove, no track fill. The visible furniture is the two chevrons,
     the labels and the thumb, and the control has no visual states of its own: the only state
     group in this template is inside the chevron button's style, and it swaps the glyph's
     foreground and nothing else.

     `IsTabStop="False"` on the control's style (`:5`), and `AutomationProperties.AccessibilityView="Raw"`
     on both buttons and on the label text. There is no `AnnotatedScrollBarAutomationPeer` in the
     pin, so the control names nothing to a reader and its parts are hidden from one. -->
<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<!-- `PART_VerticalIncrementRepeatButton` (`:31-39`). A plain `<button>` rather than the
	     library's RepeatButton, which is what `internal/ScrollBar.svelte` does for the same two
	     arrows and for the same reason: `ScrollButtonStyle` (`AnnotatedScrollBar_themeresources.xaml:42-92`)
	     replaces the template wholesale — a bare ContentPresenter with four foreground states —
	     and a class handed across a component boundary carries no scope hash to reach it with.
	     Hold-to-repeat is upstream's `RepeatButton` behaviour and is out of this unit, as it is
	     out of ScrollBar's: one click is one small change. -->
	<button type="button" class="chevron" tabindex="-1" aria-hidden="true" onclick={increment}>
		&#xEDDB;
	</button>
	<!-- `PART_VerticalGrid` (`:40-93`) is what the pointer is measured against. `role="presentation"`
	     because it is a template part rather than the control, and the whole template is
	     `AutomationProperties.AccessibilityView="Raw"`; it also satisfies the a11y rule that a div
	     carrying pointer handlers state a role. -->
	<div
		bind:this={verticalGrid}
		class="vertical-grid"
		role="presentation"
		onpointerenter={onPointerEnter}
		onpointermove={onPointerMove}
		onpointerleave={onPointerLeave}
		onpointerdown={onPointerDown}
		onpointerup={endDrag}
		onpointercancel={endDrag}
	>
		<!-- `PART_LabelsGrid` (`:41-45`): centred, `MinWidth="{StaticResource LabelsGridMinWidth}"`,
		     and every label in its one cell. -->
		<div bind:this={labelsColumn} class="labels">
			{#each labels as label, index (index)}
				<div
					bind:this={labelElements[index]}
					class="label"
					style="margin-top: {labelTops[index]}px"
					data-collapsed={collapsed[index] ? '' : undefined}
				>
					<span class="label-text winui-BodyTextBlockStyle">{label.content}</span>
				</div>
			{/each}
		</div>
		<!-- `PART_VerticalThumbGhost` (`:74-83`) follows the raw pointer while the thumb is being
		     dragged, so the two separate wherever the value cannot follow the pointer exactly.
		     Upstream shows it as a hover visual — `ShowHoverVisuals` (`:500-504`) is reached from
		     PointerEntered and PointerMoved alike, not only while pressed — and this unit's brief
		     asks for the drag alone. -->
		{#if dragging && pointerOffset !== null}
			<div class="thumb ghost" style="transform: translateY({pointerOffset}px)"></div>
		{/if}
		<!-- `PART_VerticalThumb` (`:84-92`). -->
		<div class="thumb" style="transform: translateY({thumbTop}px)"></div>
		<!-- `PART_DetailLabelToolTip` (`:46-72`). `ShowToolTipAtOffset` (`:527-569`) places it with
		     `PlacementRect = Rect(-contentWidth/2 + 2, offsetFromTop, 0, 0)` against
		     `PART_ToolTipRail`, a one-pixel-wide border at the right edge of the vertical grid.
		     The `-contentWidth/2` is what moves the box left by half its own width, so its right
		     edge lands two pixels right of the rail's left edge — one pixel right of the control —
		     and the box hangs to the left of the bar, over what is being scrolled. -->
		{#if pointerOffset !== null && detailLabel !== undefined}
			<div class="tooltip" style="top: {pointerOffset}px">
				<span class="tooltip-text winui-BaseTextBlockStyle">{detailLabel}</span>
			</div>
		{/if}
	</div>
	<!-- `PART_VerticalDecrementRepeatButton` (`:94-102`). -->
	<button type="button" class="chevron" tabindex="-1" aria-hidden="true" onclick={decrement}>
		&#xEDDC;
	</button>
</div>

<style>
	.root {
		/* An inline grid, because the Gallery's own layout puts this control in an `Auto` column
		   and the control's desired width is what fills it — the widest label, floored at
		   `LabelsGridMinWidth`. The middle row is `minmax(0, 1fr)` rather than `1fr`: an `fr`
		   track's automatic minimum is its content, and a label positioned near the bottom of the
		   rail would otherwise grow the row it is measured against. The consequence is that the
		   control needs a height from its container, exactly as the `*` row upstream does. */
		display: inline-grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		min-width: var(--winui-LabelsGridMinWidth);
		/* A press on the rail is a scroll, and without this it also starts a text selection that
		   runs through the labels for the length of the drag. XAML has no such default. */
		user-select: none;
	}

	/* ----- the chevrons (ScrollButtonStyle, AnnotatedScrollBar_themeresources.xaml:42-92) ----- */

	.chevron {
		/* `HorizontalAlignment="Right"` on both buttons (AnnotatedScrollBar.xaml:36, :99). */
		justify-self: end;
		display: grid;
		box-sizing: border-box;
		/* `MinWidth` and `MinHeight` are 16 (`:43-44`) and the style sets no `Padding`, so the
		   button keeps `DefaultRepeatButtonStyle`'s `ButtonPadding` — 11,5,11,6. The 16 is a floor
		   the button never reaches, not its size: it is materially wider and taller than that. */
		min-width: 16px;
		min-height: 16px;
		padding: var(--winui-ButtonPadding);
		place-items: center;
		background: var(--winui-ScrollButtonBackground);
		border: var(--winui-ScrollButtonStyleBorderThickness) solid var(--winui-ScrollButtonBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		color: var(--winui-ScrollButtonForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-ScrollButtonFontSize);
		line-height: normal;
		cursor: pointer;
		/* The user agent draws a focus ring of its own; the button is not a tab stop upstream. */
		outline: none;
	}

	/* The style's one visual state group changes the glyph's colour and nothing else (`:56-87`). */
	.chevron:hover:not(:disabled) {
		color: var(--winui-ScrollButtonForegroundPointerOver);
	}

	.chevron:active:not(:disabled) {
		color: var(--winui-ScrollButtonForegroundPressed);
	}

	/* Nothing on this control's surface disables a chevron — upstream reaches the state through
	   `IsEnabled` on the control — so this is the fourth CommonState transcribed rather than a
	   state the props can produce. */
	.chevron:disabled {
		color: var(--winui-ScrollButtonForegroundDisabled);
		cursor: default;
	}

	/* ----- the rail, which is not drawn (AnnotatedScrollBar.xaml:40-93) ----- */

	.vertical-grid {
		position: relative;
		display: grid;
		grid-template-rows: minmax(0, 1fr);
		min-height: 0;
		/* `IsTapEnabled="True"` on the root grid (`:25`): the whole area answers the pointer, and
		   `Background="Transparent"` on the labels grid (`:43`) is what makes it hit-testable. */
		touch-action: none;
	}

	.labels {
		grid-area: 1 / 1;
		/* `HorizontalAlignment="Center"` (`:44`) — and `justify-self` other than `stretch` is also
		   what shrinks the column to its widest label, which is the control's own desired width. */
		justify-self: center;
		align-self: stretch;
		display: grid;
		grid-template-rows: minmax(0, 1fr);
		min-width: var(--winui-LabelsGridMinWidth);
	}

	.label {
		/* Every label in the one cell the labels grid has, positioned by its own top margin —
		   `labelContentPresenter.Margin({0, labelVerticalOffset, 0, 0})` (`AnnotatedScrollBar.cpp:374`). */
		grid-area: 1 / 1;
		align-self: start;
		/* `labelContentPresenter.HorizontalAlignment(Right)` (`:355`), over the `Border`'s
		   `MinWidth="{StaticResource LabelsGridMinWidth}"` (AnnotatedScrollBar.xaml:9). */
		justify-self: end;
		min-width: var(--winui-LabelsGridMinWidth);
		/* A formatting-context root, so the text's negative margins stay inside this box and its
		   `offsetHeight` is the height upstream caches — the text's own, less 7. */
		display: flow-root;
	}

	/* `Visibility="Collapsed"` on a label the pass dropped. `visibility` rather than `display`,
	   because the collision test reads each label's measured height on every pass and a display
	   of `none` measures zero — the next pass would then keep what this one dropped. The label is
	   in a grid cell of its own with four siblings, so removing it from layout would change
	   nothing anyway. */
	.label[data-collapsed] {
		visibility: hidden;
	}

	.label-text {
		display: block;
		/* `Margin="0,-5,0,-2"` (AnnotatedScrollBar.xaml:11), as the CSS shorthand. */
		margin: -5px 0 -2px 0;
		/* `HorizontalAlignment="Right"`, `HorizontalTextAlignment="Right"`, `TextWrapping="NoWrap"`. */
		text-align: right;
		white-space: nowrap;
	}

	/* ----- the thumb and its ghost (AnnotatedScrollBar.xaml:74-92) ----- */

	.thumb {
		position: absolute;
		top: 0;
		/* `HorizontalAlignment="Right"` and `VerticalAlignment="Top"`; the top is the translation.
		   30 by 3 never reaches the 44 the labels column floors the width at, so the thumb has
		   never been what decides this control's width. */
		right: 0;
		width: var(--winui-ThumbWidth);
		height: var(--winui-ThumbHeight);
		border-radius: var(--winui-ThumbCornerRadius);
		background: var(--winui-VerticalThumbBrush);
		pointer-events: none;
	}

	.thumb.ghost {
		background: var(--winui-AccentFillColorDisabledBrush);
	}

	/* ----- the detail label's tooltip (AnnotatedScrollBar.xaml:46-72) ----- */

	.tooltip {
		position: absolute;
		/* The right edge two pixels right of the one-pixel rail's left edge — see the markup. */
		right: -1px;
		/* `VerticalContentAlignment="Center"` (`:53`) over the pointer's own offset. */
		transform: translateY(-50%);
		display: flex;
		box-sizing: border-box;
		/* `MeasureAndGetDesiredWidthFor(tooltipContentPresenter, c_infSize)` (`:559`) is the width
		   the placement rect is computed from: the content measured unconstrained, and only then
		   capped. An absolutely positioned box shrinks to fit its containing block instead — which
		   here is the 44-pixel-wide rail, so every tooltip wrapped. */
		width: max-content;
		max-width: var(--winui-AnnotatedScrollBarTooltipMaxWidth);
		min-height: var(--winui-AnnotatedScrollBarTooltipMinHeight);
		align-items: center;
		justify-content: flex-end;
		/* The box is a `ToolTip`, so its chrome is `DefaultToolTipStyle`'s — the same six values
		   `ToolTip.svelte` reads. `MaxWidth` and `MinHeight` are this control's own overrides
		   (`:51-52`). */
		padding: var(--winui-ToolTipBorderPadding);
		background: var(--winui-ToolTipBackgroundBrush) padding-box;
		border: var(--winui-ToolTipBorderThemeThickness) solid var(--winui-ToolTipBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		color: var(--winui-ToolTipForegroundBrush);
		/* Upstream's tooltip is a popup the pointer can land on, and `:727-740` exists to undo the
		   PointerExited that causes. Inert here, so the rail never loses the pointer to it. */
		pointer-events: none;
	}

	.tooltip-text {
		/* `Margin="0,0,0,2"`, `HorizontalAlignment="Right"`, `TextWrapping="WrapWholeWords"`, and
		   `BaseTextBlockStyle` — 14px semibold, which is not the weight the rail's labels use. */
		margin-bottom: 2px;
		text-align: right;
		overflow-wrap: break-word;
	}
</style>
