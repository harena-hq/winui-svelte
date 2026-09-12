<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ScrollViewerProps {
		/** ScrollViewer.Content. */
		children?: Snippet;
		/** ScrollViewer.HorizontalScrollBarVisibility (ScrollBarVisibility). */
		horizontalScrollBarVisibility?: 'disabled' | 'auto' | 'hidden' | 'visible';
		/** ScrollViewer.VerticalScrollBarVisibility (ScrollBarVisibility). */
		verticalScrollBarVisibility?: 'disabled' | 'auto' | 'hidden' | 'visible';
		/** ScrollViewer.HorizontalScrollMode (ScrollMode). */
		horizontalScrollMode?: 'enabled' | 'disabled' | 'auto';
		/** ScrollViewer.VerticalScrollMode (ScrollMode). */
		verticalScrollMode?: 'enabled' | 'disabled' | 'auto';
		/** ScrollViewer.ZoomMode (ZoomMode). */
		zoomMode?: 'enabled' | 'disabled';
		/** ScrollViewer.ZoomFactor — read-only upstream, bindable here (ADR 0009). */
		zoomFactor?: number;
		/** ScrollViewer.MinZoomFactor. */
		minZoomFactor?: number;
		/** ScrollViewer.MaxZoomFactor. */
		maxZoomFactor?: number;
		/** ScrollViewer.HorizontalOffset — read-only upstream, bindable here (ADR 0009). */
		horizontalOffset?: number;
		/** ScrollViewer.VerticalOffset — read-only upstream, bindable here (ADR 0009). */
		verticalOffset?: number;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. */
		onOffsetChange?: ((offset: { horizontal: number; vertical: number }) => void) | undefined;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. */
		onZoomFactorChange?: ((factor: number) => void) | undefined;
		/** UIElement.IsEnabled. */
		disabled?: boolean;
		class?: string;
		style?: string;
		/** The ScrollViewer root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	/** The older ScrollViewer is the same box and scrollbar as ScrollView with different property
	 * names. Its pin implements it in dxaml/xcp/dxaml/lib/ScrollViewer_Partial.cpp and restyles it
	 * in controls/dev/CommonStyles/ScrollViewer_themeresources.xaml:21-222, so it is a
	 * Windows.UI.Xaml control WinUI 3 does not reimplement. */
</script>

<script lang="ts">
	import ScrollView from './ScrollView.svelte';

	let {
		children,
		horizontalScrollBarVisibility = 'disabled', // ScrollViewer_Partial.cpp:146
		verticalScrollBarVisibility = 'visible', // ScrollViewer_themeresources.xaml:31
		horizontalScrollMode = 'auto', // ScrollViewer_themeresources.xaml:23
		verticalScrollMode = 'auto', // ScrollViewer_themeresources.xaml:24
		zoomMode = 'disabled', // ScrollViewer_themeresources.xaml:28
		zoomFactor = $bindable(1),
		minZoomFactor = 0.1, // Platform default, shared with ScrollView.
		maxZoomFactor = 10, // Platform default, shared with ScrollView.
		horizontalOffset = $bindable(0),
		verticalOffset = $bindable(0),
		onOffsetChange,
		onZoomFactorChange,
		disabled = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ScrollViewerProps = $props();

	let horizontalConstrained = $derived(horizontalScrollBarVisibility === 'disabled');
	let verticalConstrained = $derived(verticalScrollBarVisibility === 'disabled');
	// contentOrientation names the axes it frees, so a constrained horizontal axis becomes vertical.
	// ScrollBarVisibility.Disabled both hides the bar and constrains that axis; ScrollView splits
	// those concerns between its visibility, mode, and contentOrientation properties.
	let contentOrientation: 'vertical' | 'horizontal' | 'both' | 'none' = $derived(
		horizontalConstrained && verticalConstrained
			? 'none'
			: horizontalConstrained
				? 'vertical'
				: verticalConstrained
					? 'horizontal'
					: 'both'
	);
	let scrollViewHorizontalVisibility: 'auto' | 'hidden' | 'visible' = $derived(
		horizontalConstrained
			? 'hidden'
			: (horizontalScrollBarVisibility as 'auto' | 'hidden' | 'visible')
	);
	let scrollViewVerticalVisibility: 'auto' | 'hidden' | 'visible' = $derived(
		verticalConstrained ? 'hidden' : (verticalScrollBarVisibility as 'auto' | 'hidden' | 'visible')
	);
	let scrollViewHorizontalMode = $derived(
		horizontalConstrained ? 'disabled' : horizontalScrollMode
	);
	let scrollViewVerticalMode = $derived(verticalConstrained ? 'disabled' : verticalScrollMode);
</script>

<!-- ScrollViewer is the FxScrollViewer that ScrollInputHelper.cpp:307-311 gives a 10% overpan
     allowance, unlike the full-viewport ScrollPresenter allowance at :313-323. -->
<ScrollView
	bind:ref
	data-scroll-input="scroll-viewer"
	{children}
	horizontalScrollBarVisibility={scrollViewHorizontalVisibility}
	verticalScrollBarVisibility={scrollViewVerticalVisibility}
	{contentOrientation}
	horizontalScrollMode={scrollViewHorizontalMode}
	verticalScrollMode={scrollViewVerticalMode}
	{zoomMode}
	bind:zoomFactor
	{minZoomFactor}
	{maxZoomFactor}
	bind:horizontalOffset
	bind:verticalOffset
	{onOffsetChange}
	{onZoomFactorChange}
	{disabled}
	class={className}
	{style}
	{...rest}
/>
