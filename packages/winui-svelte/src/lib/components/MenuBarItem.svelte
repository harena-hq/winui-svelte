<script lang="ts" module>
	import type { MenuFlyoutEntry } from './MenuFlyout.svelte';

	export interface MenuBarItemProps {
		/** Title — the text on the bar. */
		title?: string;
		/** Items — the rows of the menu this item opens, in `MenuFlyout`'s own entry vocabulary,
		 * because upstream's menu is a `MenuFlyout` too (`MenuBarItemFlyout.cpp`). */
		items?: MenuFlyoutEntry[];
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean | null;
		/** No WinUI member: the identity this item's menu is known by inside its `MenuBar`.
		 * Defaults to a generated id, so a consumer never has to supply one. */
		value?: string;
		/** `ToggleMenuFlyoutItem.IsChecked`, collected — `MenuFlyout`'s own prop, passed through. */
		checked?: string[];
		onCheckedChange?: (checked: string[]) => void;
		/** `RadioMenuFlyoutItem.IsChecked`, collected — `MenuFlyout`'s own prop, passed through. */
		selected?: Record<string, string>;
		onSelectedChange?: (selected: Record<string, string>) => void;
		/** `MenuFlyoutItem.Click`, reported by id. */
		onItemInvoked?: (id: string) => void;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/** ADR 0009's `ref` points at the interactive element: here, the trigger button. */
		ref?: HTMLButtonElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { Menubar } from 'bits-ui';
	import MenuFlyout from './MenuFlyout.svelte';

	const uid = $props.id();

	let {
		title = '',
		items = [],
		disabled = false,
		value = uid,
		checked = $bindable([]),
		onCheckedChange,
		selected = $bindable({}),
		onSelectedChange,
		onItemInvoked,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: MenuBarItemProps = $props();
</script>

<Menubar.Menu {value}>
	<Menubar.Trigger disabled={disabled ?? false}>
		{#snippet child({ props })}
			<!-- `{...props}` first: they are the primitive's own handlers, and an attribute of the
			     same name set after the spread replaces one rather than adding to it. That is the
			     rule `MenuFlyout`'s `children` TSDoc states for a trigger a consumer spreads by
			     hand, and it holds here where the component does the spreading. -->
			<button
				{...props}
				bind:this={ref}
				type="button"
				class={['root', className]}
				{style}
				{disabled}
				{...rest}
			>
				<span class="fill"></span>
				<!-- MenuBarItem.xaml:19–31 keeps the contained button transparent; only `.fill`,
				     the `Background` border at :55, paints the item's background. -->
				<span class="title">{title}</span>
			</button>
		{/snippet}
	</Menubar.Trigger>
	<!-- MenuBarItem.cpp:269 and :271 place the flyout below the button at its left edge. -->
	<!-- The zero offset matches the reference guest: the menu border starts immediately below
	     the item fill, overriding MenuFlyout's standalone four-pixel gap. -->
	<MenuFlyout
		menubar
		{items}
		placement="bottomEdgeAlignedLeft"
		offset={0}
		bind:checked
		{onCheckedChange}
		bind:selected
		{onSelectedChange}
		{onItemInvoked}
	/>
</Menubar.Menu>

<style>
	.root {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* MenuBarItem.xaml:56, the inner `ContentButton`'s `VerticalAlignment="Stretch"`: the item
		   fills the bar's height less its own margin. Measured on the reference guest, that is 32
		   inside a 40-tall bar. */
		align-self: stretch;
		margin: var(--winui-MenuBarItemMargin);
		padding: var(--winui-MenuBarItemButtonPadding);
		/* MenuBarItem.xaml:56, the contained button has `BorderThickness="0"`. */
		border: 0;
		/* MenuBarItem.xaml:19–31 overrides all four `ButtonBackground` brushes to `Transparent`,
		   which is how the inner button is stopped from painting anything: the fill is `.fill`,
		   the `Background` border at :55, and nothing else. */
		background: transparent;
		color: var(--winui-MenuBarItemForeground);
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	.fill {
		position: absolute;
		inset: 0;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-MenuBarItemBackground);
		/* The thickness is zero in light and dark and two in HighContrast, so this rule paints
		   the live border brushes only under high contrast. MenuBar_themeresources.xaml:11–41. */
		border: var(--winui-MenuBarItemBorderThickness) solid var(--winui-MenuBarItemBorderBrush);
		pointer-events: none;
	}

	.title {
		position: relative;
	}

	/* MenuBarItem.cpp:403–427 orders pressed above pointer-over above selected. Selected is
	   therefore first: an open item's pointer-over fill wins over its selected fill. */
	.root[data-state='open'] .fill {
		background: var(--winui-MenuBarItemBackgroundSelected);
		border-color: var(--winui-MenuBarItemBorderBrushSelected);
	}

	.root:hover .fill {
		background: var(--winui-MenuBarItemBackgroundPointerOver);
		border-color: var(--winui-MenuBarItemBorderBrushPointerOver);
	}

	.root:active .fill {
		background: var(--winui-MenuBarItemBackgroundPressed);
		border-color: var(--winui-MenuBarItemBorderBrushPressed);
	}

	.root:focus-visible::before {
		content: '';
		position: absolute;
		/* MenuBarItem.xaml:14, `FocusVisualMargin="-3"`. */
		inset: -3px;
		/* c1-allow: MenuBarItem.xaml:14, the same `-3` inset as the band itself */
		border-radius: calc(var(--winui-ControlCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}
</style>
