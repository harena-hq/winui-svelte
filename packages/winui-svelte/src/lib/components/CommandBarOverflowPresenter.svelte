<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface CommandBarOverflowPresenterProps {
		/** The secondary commands, as the default snippet. */
		children?: Snippet;
		/** No WinUI member: the `AppBarButtonHasFlyoutChevronVisibility` resource the presenter's
		 *  own `Grid.Resources` carries. `CommandBar`'s overflow leaves it collapsed
		 *  (`CommandBar_themeresources.xaml:95` scopes the whole control, popup included);
		 *  `CommandBarFlyout`'s overflow sets it `Visible`
		 *  (`CommandBarFlyout_themeresources.xaml:552`). */
		subItemChevronVisible?: boolean;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import {
		setCommandBarRegistry,
		setCommandBarState,
		type CommandBarCommandShape
	} from '../internal/command-bar';

	let {
		children,
		subItemChevronVisible = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: CommandBarOverflowPresenterProps = $props();

	let shapes = $state<Array<() => CommandBarCommandShape>>([]);
	setCommandBarRegistry((shape) => {
		shapes.push(shape);
		return () => {
			shapes = shapes.filter((current) => current !== shape);
		};
	});
	const overflowWithMenuIcons = $derived(shapes.some((shape) => shape().icon));
	const overflowWithToggleButtons = $derived(shapes.some((shape) => shape().toggle));
	setCommandBarState(() => ({
		compact: false,
		labelPosition: 'bottom',
		inOverflow: true,
		overflowWithMenuIcons,
		overflowWithToggleButtons,
		subItemChevronVisible
	}));
</script>

<div bind:this={ref} class={['root', 'winui-BodyTextBlockStyle', className]} {style} {...rest}>
	<!-- CommandBar_themeresources.xaml:883's WindowedPopupPadding makes a Win32 popup HWND taller
	     for translation space; a web portal has no HWND, so it has no counterpart here. -->
	<div class="items">{@render children?.()}</div>
</div>

<style>
	/* The popup host casts this shadow at `Translation.Z` 32 (`ElevationHelper.cpp:19`).
	   `GetDropShadowRecipe` in dxaml/xcp/components/graphics/inc/DropShadowRecipe.h defines it;
	   `PLATFORM_SHADOWS` derives the value and records the one composition-to-CSS blur constant. */
	.root {
		/* The popup layer, and this component is where `CommandBar`'s lives: its portal's
		   content is this component, and its `c13-layer:` marker redirects the gate here.
		   `Popup.svelte`'s `.root` rule carries the whole reason. In that use the declaration
		   is read rather than applied — the primitive takes it off this element and mirrors it
		   onto the wrapper it positions.

		   **Inline it is not inert, and an earlier version of this comment said it was.**
		   CommandBarFlyout.svelte renders this component as a direct child of its
		   `.surface`, which is `display: grid`, and **a grid item's `z-index` applies
		   and establishes a stacking context whatever its `position` is**. So inline this box
		   is painted in the positive-z layer, above its sibling `.bar`.

		   Checked, and it changes nothing drawn. The two are adjacent grid rows that abut:
		   `CommandBarOverflowPresenterMargin` sits on `.items` below, not on this element, and
		   neither margin is negative. The overflow's shadow is suppressed where it would cross
		   the seam (`.surface :global(.overflow)` in CommandBarFlyout.svelte). The `ExpandedUp`
		   state gives the overflow `order: -1`, and grid paints in order-modified document order,
		   so that state really does reverse which of the two is on top — with no geometric overlap,
		   nothing renders differently either way.

		   The lane agrees as far as it reaches: the full battery ran with this declaration in
		   place and **no baseline moved**, this component's three among them. How far that
		   reaches was not established — `order: -1` belongs to
		   `.surface[data-view-state='both-commands'].expanded[data-side='top']`, and whether
		   any baseline photographs a flyout opening upwards is unchecked, so that one state
		   rests on the reasoning above rather than on the lane. */
		z-index: 1000;
		box-sizing: border-box;
		/* CommandBar_themeresources.xaml:896, `MaxWidth="{ThemeResource CommandBarOverflowMaxWidth}"`. */
		max-width: var(--winui-CommandBarOverflowMaxWidth);
		/* CommandBar_themeresources.xaml:856 and :858 through CommandBarTemplateSettings, whose
		   three candidates are :5, :6 and :8. WD-020: the touch minimum is selected from the last
		   input device, which the web does not expose as the equivalent framework signal. */
		min-width: var(--winui-CommandBarOverflowMinWidth);
		max-height: var(--winui-CommandBarOverflowMaxHeight);
		/* CommandBar_themeresources.xaml:899, `ScrollViewer.VerticalScrollMode="Auto"`. */
		overflow-y: auto;
		/* CommandBar_themeresources.xaml:897, `HorizontalScrollMode="Disabled"`. */
		overflow-x: hidden;
		/* WD-002: the acrylic brush paints the solid FallbackColor WinUI itself paints. */
		background: var(--winui-CommandBarOverflowPresenterBackground) padding-box;
		border: var(--winui-CommandBarOverflowPresenterBorderThickness) solid
			var(--winui-CommandBarOverflowPresenterBorderBrush);
		border-radius: var(--winui-OverlayCornerRadius);
		padding: var(--winui-CommandBarOverflowPresenterBorderPadding);
		box-shadow: var(--winui-PopupShadow);
	}

	/* Only DisplayModeDefault is reproduced: this version has no full-width CommandBar, so the
	   template's FullWidthOpenDown and FullWidthOpenUp variants do not apply. */
	.items {
		margin: var(--winui-CommandBarOverflowPresenterMargin);
	}
</style>
