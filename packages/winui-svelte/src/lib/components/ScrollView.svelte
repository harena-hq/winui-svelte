<script lang="ts" module>
	import type { Snippet } from 'svelte';

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
		/** UIElement.IsEnabled. */
		disabled?: boolean;
		class?: string;
		style?: string;
		/** The ScrollView root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	/** ZoomMode, ZoomFactor, MinZoomFactor, MaxZoomFactor, ScrollTo, ScrollBy,
	 * AddScrollVelocity and their options/events, plus anchoring properties, belong to later
	 * units of this version. They are absent here for that sequencing reason, not declined. */
</script>

<script lang="ts">
	import ScrollBar from '../internal/ScrollBar.svelte';

	let {
		children,
		horizontalScrollBarVisibility = 'auto',
		verticalScrollBarVisibility = 'auto',
		contentOrientation = 'vertical',
		horizontalScrollMode = 'auto',
		verticalScrollMode = 'auto',
		horizontalOffset = $bindable(0),
		verticalOffset = $bindable(0),
		extentWidth = $bindable(0),
		extentHeight = $bindable(0),
		viewportWidth = $bindable(0),
		viewportHeight = $bindable(0),
		scrollableWidth = $bindable(0),
		scrollableHeight = $bindable(0),
		onOffsetChange,
		disabled = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ScrollViewProps = $props();

	let viewport = $state<HTMLDivElement | null>(null);
	let content = $state<HTMLDivElement | null>(null);
	let scrollTop = $state(0);
	let scrollLeft = $state(0);
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
		measure();
		if (horizontalOffset !== scrollLeft) horizontalOffset = scrollLeft;
		if (verticalOffset !== scrollTop) verticalOffset = scrollTop;
		onOffsetChange?.({ horizontal: scrollLeft, vertical: scrollTop });
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
		measure();
		return () => observer.disconnect();
	});

	$effect(() => {
		scrollHorizontally(horizontalOffset);
		scrollVertically(verticalOffset);
	});
</script>

<div
	bind:this={ref}
	class={['scroll-view', className]}
	class:disabled
	{style}
	data-horizontal-scroll-mode={horizontalScrollMode}
	data-vertical-scroll-mode={verticalScrollMode}
	{...rest}
>
	<div bind:this={viewport} class="viewport" onscroll={onScroll}>
		<!-- ScrollPresenter.cpp:636-644 constrains the opposite axes to their names: Both frees
		     both dimensions while None constrains both, hence the four CSS rules below. -->
		<div bind:this={content} class="content" data-content-orientation={contentOrientation}>
			{@render children?.()}
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
				onValueChange={scrollVertically}
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
				onValueChange={scrollHorizontally}
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
		/* `min-*: 0`, because a grid item's automatic minimum size is its content and would stop the
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
	   (ScrollBar_themeresources.xaml:180) and the template margin is 1 on both sides. */
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
