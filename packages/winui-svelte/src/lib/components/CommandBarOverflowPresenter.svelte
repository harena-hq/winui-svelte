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
		class?: string;
		style?: string;
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
