<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/*
	 * WD-028: touch and pointer gestures, ScrollViewer snap-point inertia from ScrollingHost's
	 * HorizontalSnapPointsType="MandatorySingle", and UseTouchAnimationsForAllNavigation are
	 * framework scrolling concerns deferred to the Scrolling tranche. The four buttons' pre-Fluent
	 * FlipViewButton*ThemeBrush palette is likewise not used by the Fluent template reproduced here.
	 */
	export interface FlipViewProps<T> {
		/** FlipView.ItemsSource, deliberately named `items` by ADR 0013. */
		items: T[];
		/** FlipView.ItemTemplate. The control wraps each in a FlipViewItem. */
		itemTemplate: Snippet<[T, number]>;
		/** No WinUI member: Svelte identity for DOM reuse. */
		key?: (item: T, index: number) => string | number;
		/** FlipView.SelectedIndex. Bindable, because the flip buttons move it. */
		selectedIndex?: number;
		/** SelectionChanged, narrowed to the new index. */
		onSelectedIndexChange?: (index: number) => void;
		/**
		 * FlipView's ItemsPanel orientation — `VirtualizingStackPanel Orientation="Horizontal"`
		 * by default, and the Gallery's own third example sets it vertical.
		 */
		orientation?: 'horizontal' | 'vertical';
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts" generics="T">
	import { useStrings } from '../strings';
	import FlipViewItem from './FlipViewItem.svelte';

	let {
		items,
		itemTemplate,
		key,
		selectedIndex = $bindable(0),
		onSelectedIndexChange,
		orientation = 'horizontal',
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: FlipViewProps<T> = $props();

	const str = useStrings();

	const canGoPrevious = $derived(selectedIndex > 0);
	const canGoNext = $derived(selectedIndex < items.length - 1);
	const offset = $derived(
		orientation === 'horizontal'
			? `translateX(${-selectedIndex * 100}%)`
			: `translateY(${-selectedIndex * 100}%)`
	);

	function go(delta: number) {
		const next = selectedIndex + delta;
		if (next < 0 || next >= items.length) return;
		selectedIndex = next;
		onSelectedIndexChange?.(next);
	}
</script>

<div bind:this={ref} class={['root', className]} {style} data-orientation={orientation} {...rest}>
	<div class="viewport">
		<div class="panel" style:transform={offset}>
			{#each items as item, index (key ? key(item, index) : index)}
				<FlipViewItem>{@render itemTemplate(item, index)}</FlipViewItem>
			{/each}
		</div>
	</div>
	<!-- The measured rule: a button is absent when there is nothing in its direction. -->
	{#if canGoPrevious}
		<!-- IsTabStop="False" on all four upstream buttons. -->
		<button
			type="button"
			class="flip previous"
			tabindex="-1"
			aria-label={str('UIA_FLIPVIEW_PREVIOUS')}
			onclick={() => go(-1)}
		></button>
	{/if}
	{#if canGoNext}
		<!-- IsTabStop="False" on all four upstream buttons. -->
		<button
			type="button"
			class="flip next"
			tabindex="-1"
			aria-label={str('UIA_FLIPVIEW_NEXT')}
			onclick={() => go(1)}
		></button>
	{/if}
</div>

<style>
	/* FlipView_themeresources.xaml:78-98 — Background FlipViewBackground, BorderThickness 0,
	   CornerRadius ControlCornerRadius. */
	.root {
		position: relative;
		overflow: hidden;
		background: var(--winui-FlipViewBackground);
		border-radius: var(--winui-ControlCornerRadius);
	}

	/* ScrollingHost, whose snap points show one item at a time. This reproduction moves the
	   panel rather than scrolling it: the control's own SelectedIndex is the state either way,
	   and a transform cannot be left between two items the way a scroll offset can. */
	.viewport {
		height: 100%;
		overflow: hidden;
	}

	.panel {
		display: flex;
		height: 100%;
	}

	.root[data-orientation='vertical'] .panel {
		flex-direction: column;
	}

	/* FlipView_themeresources.xaml:300-303 — 16 by 38 horizontally, 38 by 16 vertically, a
	   margin of 1, the control's own corner radius, and no tab stop. The button's own template
	   (`:104-296`) is a Border with a FontIcon at FlipViewButtonFontSize. */
	.flip {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 1px;
		padding: 0;
		box-sizing: border-box;
		border-style: solid;
		border-width: var(--winui-FlipViewButtonBorderThemeThickness);
		border-color: var(--winui-FlipViewNextPreviousButtonBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-FlipViewNextPreviousButtonBackground);
		color: var(--winui-FlipViewNextPreviousArrowForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-FlipViewButtonFontSize);
		/* Measured on the reference machine: the original shows no flip button until the
		   pointer is over the control. The template declares them unconditionally and the code
		   that hides them is the framework's FlipView, which neither pin carries. */
		opacity: 0;
	}

	.root:hover .flip,
	.root:focus-within .flip {
		opacity: 1;
	}

	.flip:hover {
		background: var(--winui-FlipViewNextPreviousButtonBackgroundPointerOver);
		border-color: var(--winui-FlipViewNextPreviousButtonBorderBrushPointerOver);
		color: var(--winui-FlipViewNextPreviousArrowForegroundPointerOver);
	}

	.flip:active {
		background: var(--winui-FlipViewNextPreviousButtonBackgroundPressed);
		border-color: var(--winui-FlipViewNextPreviousButtonBorderBrushPressed);
		color: var(--winui-FlipViewNextPreviousArrowForegroundPressed);
		/* `scale` composes with the centring transform, unlike a transform replacement. */
		scale: var(--winui-FlipViewButtonScalePressed);
	}

	.root[data-orientation='horizontal'] .flip {
		width: 16px;
		height: 38px;
		top: 50%;
		transform: translateY(-50%);
	}

	.root[data-orientation='horizontal'] .previous {
		left: 0;
	}

	.root[data-orientation='horizontal'] .next {
		right: 0;
	}

	.root[data-orientation='vertical'] .flip {
		width: 38px;
		height: 16px;
		left: 50%;
		transform: translateX(-50%);
	}

	.root[data-orientation='vertical'] .previous {
		top: 0;
	}

	.root[data-orientation='vertical'] .next {
		bottom: 0;
	}

	/* c1-allow: FlipView_themeresources.xaml:193, HorizontalPreviousTemplate's Glyph */
	.root[data-orientation='horizontal'] .previous::after {
		content: '\EDD9' / '';
	}

	/* c1-allow: FlipView_themeresources.xaml:145, HorizontalNextTemplate's Glyph */
	.root[data-orientation='horizontal'] .next::after {
		content: '\EDDA' / '';
	}

	/* c1-allow: FlipView_themeresources.xaml:289, VerticalPreviousTemplate's Glyph */
	.root[data-orientation='vertical'] .previous::after {
		content: '\EDDB' / '';
	}

	/* c1-allow: FlipView_themeresources.xaml:241, VerticalNextTemplate's Glyph */
	.root[data-orientation='vertical'] .next::after {
		content: '\EDDC' / '';
	}
</style>
