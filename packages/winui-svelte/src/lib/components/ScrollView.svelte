<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import { ScrollAnimation, type ScrollVector } from '../scroll-animation';

	export interface ScrollViewProps {
		/** ScrollView.Content. */
		children?: Snippet;
		/** ScrollView.HorizontalScrollBarVisibility (ScrollingScrollBarVisibility). */
		horizontalScrollBarVisibility?: 'auto' | 'visible' | 'hidden';
		/** ScrollView.VerticalScrollBarVisibility (ScrollingScrollBarVisibility). */
		verticalScrollBarVisibility?: 'auto' | 'visible' | 'hidden';
		/** ScrollView.ContentOrientation (ScrollingContentOrientation). */
		contentOrientation?: 'vertical' | 'horizontal' | 'both' | 'none';
		/** ScrollView.HorizontalScrollMode (ScrollingScrollMode). */
		horizontalScrollMode?: 'enabled' | 'disabled' | 'auto';
		/** ScrollView.VerticalScrollMode (ScrollingScrollMode). */
		verticalScrollMode?: 'enabled' | 'disabled' | 'auto';
		/** ScrollView.ZoomMode (ScrollingZoomMode). */
		zoomMode?: 'enabled' | 'disabled';
		/** ScrollView.ZoomFactor — read-only upstream, bindable here (ADR 0009). */
		zoomFactor?: number;
		/** ScrollView.MinZoomFactor. */
		minZoomFactor?: number;
		/** ScrollView.MaxZoomFactor. */
		maxZoomFactor?: number;
		/** ScrollView.HorizontalOffset — read-only upstream, bindable here (ADR 0009). */
		horizontalOffset?: number;
		/** ScrollView.VerticalOffset — read-only upstream, bindable here (ADR 0009). */
		verticalOffset?: number;
		/** ScrollView.ExtentWidth — read-only upstream, bindable here (ADR 0009). */
		extentWidth?: number;
		/** ScrollView.ExtentHeight — read-only upstream, bindable here (ADR 0009). */
		extentHeight?: number;
		/** ScrollView.ViewportWidth — read-only upstream, bindable here (ADR 0009). */
		viewportWidth?: number;
		/** ScrollView.ViewportHeight — read-only upstream, bindable here (ADR 0009). */
		viewportHeight?: number;
		/** ScrollView.ScrollableWidth — read-only upstream, bindable here (ADR 0009). */
		scrollableWidth?: number;
		/** ScrollView.ScrollableHeight — read-only upstream, bindable here (ADR 0009). */
		scrollableHeight?: number;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. */
		onOffsetChange?: ((offset: { horizontal: number; vertical: number }) => void) | undefined;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. */
		onZoomFactorChange?: ((factor: number) => void) | undefined;
		/** ScrollView.ScrollAnimationStarting. */
		onScrollAnimationStarting?:
			((args: ScrollingScrollAnimationStartingEventArgs) => void) | undefined;
		/** UIElement.IsEnabled. */
		disabled?: boolean;
		class?: string;
		style?: string;
		/** The ScrollView root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	/** ScrollingScrollOptions. */
	export interface ScrollingScrollOptions {
		/** ScrollingScrollOptions.AnimationMode; `auto` by default, as upstream's. */
		animationMode?: 'enabled' | 'disabled' | 'auto';
		/** ScrollingScrollOptions.SnapPointsMode. This component has no snap points, so the two
		 * values behave alike. */
		snapPointsMode?: 'default' | 'ignore';
	}

	/** ScrollingScrollAnimationStartingEventArgs. Assign `animation` to replace the animation. */
	export interface ScrollingScrollAnimationStartingEventArgs {
		animation: ScrollAnimation;
		readonly startPosition: ScrollVector;
		readonly endPosition: ScrollVector;
		readonly correlationId: number;
	}

	/** AddScrollVelocity, ScrollCompleted, the zoom methods and the anchoring properties belong to
	 * later units of this version. They are absent here for that sequencing reason, not declined. */
</script>

<script lang="ts">
	import ScrollBar from '../internal/ScrollBar.svelte';
	import { animationsEnabled } from '../internal/motion';

	let {
		children,
		horizontalScrollBarVisibility = 'auto',
		verticalScrollBarVisibility = 'auto',
		contentOrientation = 'vertical',
		horizontalScrollMode = 'auto',
		verticalScrollMode = 'auto',
		zoomMode = 'disabled', // ScrollView.h:40
		zoomFactor = $bindable(1),
		minZoomFactor = 0.1, // ScrollView.h:43
		maxZoomFactor = 10, // ScrollView.h:44
		horizontalOffset = $bindable(0),
		verticalOffset = $bindable(0),
		extentWidth = $bindable(0),
		extentHeight = $bindable(0),
		viewportWidth = $bindable(0),
		viewportHeight = $bindable(0),
		scrollableWidth = $bindable(0),
		scrollableHeight = $bindable(0),
		onOffsetChange,
		onZoomFactorChange,
		onScrollAnimationStarting,
		disabled = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ScrollViewProps = $props();

	let viewport = $state<HTMLDivElement | null>(null);
	let zoomBox = $state<HTMLDivElement | null>(null);
	let content = $state<HTMLDivElement | null>(null);
	let contentWidth = $state(0);
	let contentHeight = $state(0);
	let scrollTop = $state(0);
	let scrollLeft = $state(0);
	let constrainedZoomFactor = $derived(
		Math.max(minZoomFactor, Math.min(maxZoomFactor, zoomFactor))
	);
	let zoomBoxStyle = $derived(
		constrainedZoomFactor === 1 || contentWidth === 0 || contentHeight === 0
			? undefined
			: `width: ${contentWidth * constrainedZoomFactor}px; height: ${contentHeight * constrainedZoomFactor}px`
	);
	let contentStyle = $derived.by(() => {
		if (constrainedZoomFactor === 1) return undefined;
		// The vertical and horizontal orientation rules use 100% on one axis. Once zoom-box has
		// that axis's scaled size, preserve the measured pre-zoom dimension before transforming so
		// the percentage does not resolve against the scaled box and apply zoom twice.
		const dimensions = [
			...(contentOrientation === 'vertical' || contentOrientation === 'none'
				? [`width: ${contentWidth}px`]
				: []),
			...(contentOrientation === 'horizontal' || contentOrientation === 'none'
				? [`height: ${contentHeight}px`]
				: [])
		];
		return `${dimensions.join('; ')}${dimensions.length ? '; ' : ''}transform: scale(${constrainedZoomFactor}); transform-origin: 0 0`;
	});
	// The six extent and viewport props are this component's own measurement state as well as
	// what it publishes: upstream reports the same six numbers as read-only properties
	// (ScrollView.idl:29-34), and keeping a private copy beside them would be two sources for
	// one measurement.

	// ScrollBarController::UpdateCanScroll (ScrollBarController.cpp:299-308) is
	// `m_isScrollable && m_scrollBar.IsEnabled() && Maximum > Minimum`, so a disabled control
	// reports that it cannot scroll and an Auto bar collapses with it. A Visible one still draws,
	// because ScrollView.cpp:1667 sets that from the property alone.
	let canScrollVertically = $derived(
		!disabled && verticalScrollMode !== 'disabled' && extentHeight > viewportHeight
	);
	let canScrollHorizontally = $derived(
		!disabled && horizontalScrollMode !== 'disabled' && extentWidth > viewportWidth
	);
	// ScrollView.cpp:1646-1706: Hidden and Auto without scrollable extent draw nothing; only
	// Visible forces a controller, whose ScrollBar draws a rail without a thumb at zero range.
	let verticalBarVisible = $derived(
		verticalScrollBarVisibility === 'visible' ||
			(verticalScrollBarVisibility === 'auto' && canScrollVertically)
	);
	let horizontalBarVisible = $derived(
		horizontalScrollBarVisibility === 'visible' ||
			(horizontalScrollBarVisibility === 'auto' && canScrollHorizontally)
	);

	function measure() {
		if (!viewport) return;
		if (content) {
			// offset dimensions exclude transforms, which is the size zoom-box must multiply.
			// Percentage-oriented content gets its pre-zoom dimension from the current viewport;
			// measuring that axis from zoom-box would feed the scaled size back into the content.
			const measuredWidth =
				contentOrientation === 'vertical' || contentOrientation === 'none'
					? viewport.clientWidth
					: content.offsetWidth;
			const measuredHeight =
				contentOrientation === 'horizontal' || contentOrientation === 'none'
					? viewport.clientHeight
					: content.offsetHeight;
			contentWidth = measuredWidth;
			contentHeight = measuredHeight;
		}
		scrollTop = viewport.scrollTop;
		scrollLeft = viewport.scrollLeft;
		extentWidth = viewport.scrollWidth;
		extentHeight = viewport.scrollHeight;
		viewportWidth = viewport.clientWidth;
		viewportHeight = viewport.clientHeight;
		scrollableWidth = Math.max(0, extentWidth - viewportWidth);
		scrollableHeight = Math.max(0, extentHeight - viewportHeight);
	}

	function onScroll() {
		// A scroll the running animation did not make — a key, an offset bound from outside, the
		// browser's own wheel scroll — interrupts it, as upstream's input and requests do. The
		// animation's own write is known by the offsets the viewport held right after it.
		if (
			running &&
			viewport &&
			(Math.abs(viewport.scrollLeft - running.landed.x) > 0.5 ||
				Math.abs(viewport.scrollTop - running.landed.y) > 0.5)
		) {
			stopAnimation();
		}
		measure();
		if (horizontalOffset !== scrollLeft) horizontalOffset = scrollLeft;
		if (verticalOffset !== scrollTop) verticalOffset = scrollTop;
		onOffsetChange?.({ horizontal: scrollLeft, vertical: scrollTop });
	}

	// ScrollPresenter.h: s_offsetsChangeMsPerUnit, s_offsetsChangeMinMs, s_offsetsChangeMaxMs.
	const OFFSETS_CHANGE_MS_PER_UNIT = 5;
	const OFFSETS_CHANGE_MIN_MS = 50;
	const OFFSETS_CHANGE_MAX_MS = 1000;

	let lastCorrelationId = 0;
	// The running animation's frame request, its latest position and what the viewport made of
	// it. The position is kept here, unrounded, because the viewport snaps what it is given to
	// device pixels and a request that starts from a running animation starts from where the
	// animation is. What the viewport holds after the write is kept beside it, read back rather
	// than predicted, so that a scroll event can tell the animation's own write from another.
	let running: { frame: number; position: ScrollVector; landed: ScrollVector } | null = null;

	function currentPosition(): ScrollVector {
		if (running) return { x: running.position.x, y: running.position.y };
		return { x: viewport?.scrollLeft ?? 0, y: viewport?.scrollTop ?? 0 };
	}

	function stopAnimation() {
		if (!running) return;
		cancelAnimationFrame(running.frame);
		running = null;
	}

	function clampOffset(value: number, scrollable: number) {
		return Math.min(scrollable, Math.max(0, value));
	}

	function changeOffsets(target: ScrollVector, options: ScrollingScrollOptions | undefined) {
		const correlationId = ++lastCorrelationId;
		const start = currentPosition();
		stopAnimation();
		if (!viewport) return correlationId;
		const mode = options?.animationMode ?? 'auto';
		// ScrollPresenter::GetComputedAnimationMode: Auto follows the platform's animation switch.
		if (mode === 'disabled' || (mode === 'auto' && !animationsEnabled())) {
			viewport.scrollLeft = clampOffset(target.x, scrollableWidth);
			viewport.scrollTop = clampOffset(target.y, scrollableHeight);
			return correlationId;
		}
		// ScrollPresenter::GetPositionAnimation: one key frame at the end, the distance truncated
		// before it is turned into a duration.
		const distance = Math.trunc(Math.hypot(target.x - start.x, target.y - start.y));
		const stock = new ScrollAnimation();
		stock.insertKeyFrame(1, target);
		stock.duration = Math.min(
			OFFSETS_CHANGE_MAX_MS,
			Math.max(OFFSETS_CHANGE_MIN_MS, distance * OFFSETS_CHANGE_MS_PER_UNIT)
		);
		const args: ScrollingScrollAnimationStartingEventArgs = {
			animation: stock,
			startPosition: { x: start.x, y: start.y },
			endPosition: { x: target.x, y: target.y },
			correlationId
		};
		onScrollAnimationStarting?.(args);
		// A handler that made a request of its own has interrupted this one, as any later request
		// does.
		if (correlationId !== lastCorrelationId) return correlationId;
		run(args.animation, start);
		return correlationId;
	}

	function run(animation: ScrollAnimation, start: ScrollVector) {
		const startedAt = performance.now();
		const duration = animation.duration;
		// Each run checks that it is still the running one, so a run that was replaced stops at its
		// next frame even where its frame request was not the one cancelled.
		const self = {
			frame: 0,
			position: { x: start.x, y: start.y },
			landed: { x: viewport?.scrollLeft ?? 0, y: viewport?.scrollTop ?? 0 }
		};
		const step = () => {
			if (!viewport || running !== self) return;
			const progress =
				Number.isFinite(duration) && duration > 0
					? Math.min(1, (performance.now() - startedAt) / duration)
					: 1;
			const position = animation.valueAt(progress, start);
			self.position = {
				x: clampOffset(position.x, scrollableWidth),
				y: clampOffset(position.y, scrollableHeight)
			};
			viewport.scrollLeft = self.position.x;
			viewport.scrollTop = self.position.y;
			self.landed = { x: viewport.scrollLeft, y: viewport.scrollTop };
			if (progress >= 1) running = null;
			else self.frame = requestAnimationFrame(step);
		};
		self.frame = requestAnimationFrame(step);
		running = self;
	}

	// ScrollPresenter::OnPointerPressed hands a touch or pen contact to the interaction tracker,
	// whose interaction interrupts a running animation, and returns early for a mouse: a click on
	// the content leaves the animation running.
	function onPointerDown(event: PointerEvent) {
		if (event.pointerType === 'touch' || event.pointerType === 'pen') stopAnimation();
	}

	/**
	 * ScrollView.ScrollTo. Returns the request's correlation id. A disabled request lands before
	 * this returns, where upstream's lands on a later tick; the bound offsets follow on the scroll
	 * event it causes.
	 */
	export function scrollTo(
		horizontalOffset: number,
		verticalOffset: number,
		options?: ScrollingScrollOptions
	): number {
		return changeOffsets({ x: horizontalOffset, y: verticalOffset }, options);
	}

	/**
	 * ScrollView.ScrollBy. The deltas are added to where the view is now, a running animation's
	 * current position included, as upstream's ResetAnticipatedView leaves them. Returns the
	 * request's correlation id.
	 */
	export function scrollBy(
		horizontalOffsetDelta: number,
		verticalOffsetDelta: number,
		options?: ScrollingScrollOptions
	): number {
		const start = currentPosition();
		return changeOffsets(
			{ x: start.x + horizontalOffsetDelta, y: start.y + verticalOffsetDelta },
			options
		);
	}

	// Upstream's ZoomTo takes a centre point and the Gallery passes null, which means the centre of
	// the viewport (ScrollView.idl:104). So a zoom keeps whatever is in the middle of the box in the
	// middle of the box; anchoring at the top-left instead shows a different part of the content at
	// every factor, which is what a side-by-side against the original's own page showed.
	function reanchor(from: number, to: number) {
		if (!viewport || from === to || from === 0) return;
		const scale = to / from;
		const left =
			(viewport.scrollLeft + viewport.clientWidth / 2) * scale - viewport.clientWidth / 2;
		const top =
			(viewport.scrollTop + viewport.clientHeight / 2) * scale - viewport.clientHeight / 2;
		// After the frame in which the zoom box takes its new size, or the scroll offsets are
		// clamped against the old extent.
		requestAnimationFrame(() => {
			if (!viewport) return;
			viewport.scrollLeft = Math.max(0, left);
			viewport.scrollTop = Math.max(0, top);
		});
	}

	function setZoomFactor(next: number) {
		const factor = Math.max(minZoomFactor, Math.min(maxZoomFactor, next));
		if (factor === zoomFactor) return;
		const previous = constrainedZoomFactor;
		zoomFactor = factor;
		reanchor(previous, factor);
		onZoomFactorChange?.(factor);
	}

	function onWheel(event: WheelEvent) {
		stopAnimation();
		if (disabled || zoomMode !== 'enabled' || !event.ctrlKey || event.deltaY === 0) return;
		// This implementation uses a 1.1 step for each wheel notch; upstream only gates Ctrl+wheel.
		setZoomFactor(zoomFactor * (event.deltaY < 0 ? 1.1 : 1 / 1.1));
		event.preventDefault();
	}

	function scrollVertically(value: number) {
		if (viewport && viewport.scrollTop !== value) viewport.scrollTop = value;
	}

	function scrollHorizontally(value: number) {
		if (viewport && viewport.scrollLeft !== value) viewport.scrollLeft = value;
	}

	$effect(() => {
		if (!viewport || !content) return;
		const observer = new ResizeObserver(measure);
		observer.observe(viewport);
		// A viewport observer does not see content growth inside a fixed viewport.
		observer.observe(content);
		if (zoomBox) observer.observe(zoomBox);
		measure();
		return () => observer.disconnect();
	});

	// A running animation's frame request must not outlive the viewport it writes to.
	$effect(() => stopAnimation);

	// One, not the initial factor: a ScrollView mounted at a factor above one is upstream's
	// `ZoomTo(factor, null)` from one, so it centres the same way a later change does.
	let lastFactor = 1;
	$effect(() => {
		if (zoomFactor !== constrainedZoomFactor) zoomFactor = constrainedZoomFactor;
		if (constrainedZoomFactor !== lastFactor) {
			// A running scroll's positions are in the old factor's coordinates.
			stopAnimation();
			// A factor written from outside re-anchors on the same rule as one the wheel changed.
			reanchor(lastFactor, constrainedZoomFactor);
			lastFactor = constrainedZoomFactor;
		}
	});

	$effect(() => {
		scrollHorizontally(horizontalOffset);
		scrollVertically(verticalOffset);
	});
</script>

<!-- ScrollInputHelper::UpdateOutOfBoundsPanSize (ScrollInputHelper.cpp:307) branches on the
     source's effective zoom mode; ParallaxView reads the source through the DOM. -->
<div
	bind:this={ref}
	class={['scroll-view', className]}
	class:disabled
	{style}
	data-horizontal-scroll-mode={horizontalScrollMode}
	data-vertical-scroll-mode={verticalScrollMode}
	data-zoom-mode={zoomMode}
	{...rest}
>
	<!-- The pointer handler only notices a touch or pen contact so that it can stop a running
	     animation; it makes nothing interactive, so the viewport takes no role for it. -->
	<!-- eslint-disable svelte/no-unused-svelte-ignore -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={viewport}
		class="viewport"
		onscroll={onScroll}
		onwheel={onWheel}
		onpointerdown={onPointerDown}
	>
		<!-- eslint-enable svelte/no-unused-svelte-ignore -->
		<!-- ScrollPresenter.cpp:636-644 constrains the opposite axes to their names: Both frees
		     both dimensions while None constrains both, hence the four CSS rules below. -->
		<div bind:this={zoomBox} class="zoom-box" style={zoomBoxStyle}>
			<div
				bind:this={content}
				class="content"
				data-content-orientation={contentOrientation}
				style={contentStyle}
			>
				{@render children?.()}
			</div>
		</div>
	</div>
	{#if verticalBarVisible}
		<div class:with-horizontal={horizontalBarVisible} class="bar-wrapper vertical">
			<!-- UpdateScrollControllersVisualState (ScrollView.cpp:1821-1869) chooses touch versus
			     mouse upstream; touch is unreachable on the reference host, so this unit uses mouse. -->
			<ScrollBar
				value={scrollTop}
				minimum={0}
				maximum={scrollableHeight}
				viewportSize={viewportHeight}
				indicatorMode="mouse"
				{disabled}
				onValueChange={(value) => {
					stopAnimation();
					scrollVertically(value);
				}}
			/>
		</div>
	{/if}
	{#if horizontalBarVisible}
		<div class:with-vertical={verticalBarVisible} class="bar-wrapper horizontal">
			<ScrollBar
				orientation="horizontal"
				value={scrollLeft}
				minimum={0}
				maximum={scrollableWidth}
				viewportSize={viewportWidth}
				indicatorMode="mouse"
				{disabled}
				onValueChange={(value) => {
					stopAnimation();
					scrollHorizontally(value);
				}}
			/>
		</div>
	{/if}
	{#if verticalBarVisible && horizontalBarVisible}
		<!-- ScrollView.cpp:1701-1705 creates this only with both bars. Its theme token is transparent
		     in every shipped theme, but the element occupies the overlaid corner. -->
		<div class="separator"></div>
	{/if}
</div>

<style>
	.scroll-view {
		/* A one-cell grid rather than a positioned box with an absolute viewport. Upstream's
		   ScrollView measures to its content when nothing constrains it (ScrollPresenter.cpp:636-667
		   measures the unconstrained axis at infinity and the presenter reports that as its desired
		   size), and an absolutely positioned viewport contributes no height at all — a consumer
		   who writes no size would get a box of zero. The grid item carries the height instead, so
		   an unconstrained ScrollView is as tall as what it holds and a sized one fills its box. */
		display: grid;
		position: relative;
		overflow: hidden;
		border-radius: var(--winui-ControlCornerRadius);
	}
	.viewport {
		/* This class is this component's own, and a `class` a caller passes lands on the root
		   *without* a scope hash — so a caller that passes `class="viewport"` is styled by this
		   rule as well, and its root stops being `overflow: hidden`. Four controls did exactly
		   that; ParallaxView found it, because the first overflow box under a ListView was then
		   the ScrollView's root rather than the box that scrolls.

		   `min-*: 0`, because a grid item's automatic minimum size is its content and would stop the
		   viewport from ever being smaller than what it scrolls. */
		min-width: 0;
		min-height: 0;
		overflow: auto;
		scrollbar-width: none;
	}
	.scroll-view[data-horizontal-scroll-mode='disabled'] .viewport,
	.scroll-view.disabled .viewport {
		overflow-x: hidden;
	}
	.scroll-view[data-vertical-scroll-mode='disabled'] .viewport,
	.scroll-view.disabled .viewport {
		overflow-y: hidden;
	}

	.zoom-box {
		/* The box the zoom scales into, and at a factor of one it must be the viewport exactly.
		   Without these two the content's `height: 100%` — which is how `none` and `horizontal`
		   give the content the viewport's size on the axis they constrain — would resolve against
		   an auto-height parent and mean nothing: measured on the guest, a `none` box whose content
		   was 600 tall reported the content itself as 647 rather than 200. What upstream constrains
		   is the size the content is *measured* with (ScrollPresenter.cpp:636-644), not what a child
		   that cannot shrink then overflows by, and that is what these two reproduce. At a factor
		   above one the inline width and height override both. */
		width: 100%;
		height: 100%;
	}

	.content {
		/* A formatting-context root, because a XAML margin adds and a CSS margin collapses: a
		   child's top margin otherwise escapes this box, pushes the content down inside a
		   constrained axis, and makes an Auto bar appear on an axis upstream does not scroll.
		   Measured on the guest: fourteen pixels of paragraph margin turned `horizontal` and
		   `none` into two-bar rows. */
		display: flow-root;
	}
	.content[data-content-orientation='vertical'] {
		width: 100%;
		height: max-content;
	}
	.content[data-content-orientation='horizontal'] {
		width: max-content;
		height: 100%;
	}
	.content[data-content-orientation='both'] {
		width: max-content;
		height: max-content;
	}
	.content[data-content-orientation='none'] {
		width: 100%;
		height: 100%;
	}

	/* ScrollView.xaml:146-161 overlays a two-by-two grid. ScrollBarSize is 12
	   (ScrollBar_themeresources.xaml:180) and the template margin is 1 on both sides.

	   WD-036: the wrapper is a sibling of the viewport rather than a child of it, so a wheel over
	   the bar reaches a root whose overflow is hidden and scrolls nothing, where Windows scrolls
	   the content. */
	.bar-wrapper {
		position: absolute;
		box-sizing: border-box;
		padding: var(--winui-ScrollViewScrollBarsMargin);
	}
	.bar-wrapper.vertical {
		top: 0;
		right: 0;
		bottom: 0;
		width: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
	}
	.bar-wrapper.vertical.with-horizontal {
		bottom: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
	}
	.bar-wrapper.horizontal {
		left: 0;
		right: 0;
		bottom: 0;
		height: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
	}
	.bar-wrapper.horizontal.with-vertical {
		right: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
	}
	.separator {
		position: absolute;
		right: 0;
		bottom: 0;
		width: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
		height: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
		background-color: var(--winui-ScrollViewScrollBarsSeparatorBackground);
	}
</style>
