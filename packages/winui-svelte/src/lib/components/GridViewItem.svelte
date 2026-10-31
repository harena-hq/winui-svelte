<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/** GridViewItem stacks native-presenter selection chrome around caller content. */
	export interface GridViewItemProps {
		/** GridViewItem.Content, the content property — ADR 0009 maps it to `children`. */
		children?: Snippet;
		/** GridViewItem.IsSelected. The item never sets it; its owner does. */
		selected?: boolean;
		/** IsEnabled, inverted to the HTML sense — ADR 0009. */
		disabled?: boolean | null;
		/** No WinUI event of its own: the item reports a click or an Enter or Space. */
		onItemInvoked?: () => void;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		children,
		selected = false,
		disabled = false,
		onItemInvoked,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: GridViewItemProps = $props();

	function invoke() {
		if (disabled) return;
		onItemInvoked?.();
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		// Space scrolls the page unless this keyboard invocation cancels its browser default.
		event.preventDefault();
		invoke();
	}
</script>

<!-- `role="option"` is the closest ARIA match to the automation peer's selection-item provider.
     It precedes the rest spread so an owner can supply its own roving tabindex. -->
<div
	bind:this={ref}
	class={['root', className]}
	{style}
	role="option"
	tabindex={disabled ? -1 : 0}
	aria-selected={selected}
	aria-disabled={disabled || undefined}
	data-selected={selected || undefined}
	data-disabled={disabled || undefined}
	onclick={invoke}
	onkeydown={onKeyDown}
	{...rest}
>
	<div class="ring"></div>
	<div class="inner"></div>
	<div class="content">{@render children?.()}</div>
</div>

<style>
	/* generic.xaml:27496-27517 — content centred both ways, MinWidth and MinHeight 44, and a
	   Margin of 0,0,4,4 that upstream puts on the item rather than on the panel. */
	.root {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		min-width: var(--winui-GridViewItemMinWidth);
		min-height: var(--winui-GridViewItemMinHeight);
		margin: 0 4px 4px 0;
		border-radius: var(--winui-GridViewItemCornerRadius);
		background: var(--winui-GridViewItemBackground);
		color: var(--winui-GridViewItemForeground);
		user-select: none;
	}

	/* Measured: 2 of accent at the item's own edge, then 1 of ink, then the content. The ring
	   is drawn over the content rather than inset from it, which makes an image item's corners
	   look right. */
	.ring {
		position: absolute;
		inset: 0;
		border: var(--winui-GridViewItemSelectedBorderThickness) solid transparent;
		border-radius: inherit;
		z-index: 1;
		pointer-events: none;
	}

	.inner {
		position: absolute;
		inset: var(--winui-GridViewItemSelectedBorderThickness);
		/* c1-allow: measured 1px of GridViewItemSelectedInnerBorderBrush inside the 2 of ring
		   on the reference machine; no resource states this thickness */
		border: 1px solid transparent;
		border-radius: inherit;
		z-index: 1;
		pointer-events: none;
	}

	.content {
		position: relative;
		min-width: 0;
	}

	.root:not([data-disabled]):not([data-selected]):hover {
		background: var(--winui-GridViewItemBackgroundPointerOver);
		color: var(--winui-GridViewItemForegroundPointerOver);
	}

	.root:not([data-disabled]):not([data-selected]):active {
		background: var(--winui-GridViewItemBackgroundPressed);
	}

	.root[data-selected] {
		background: var(--winui-GridViewItemBackgroundSelected);
		color: var(--winui-GridViewItemForegroundSelected);
	}

	.root[data-selected] .ring {
		border-color: var(--winui-GridViewItemSelectedBorderBrush);
	}

	.root[data-selected] .inner {
		border-color: var(--winui-GridViewItemSelectedInnerBorderBrush);
	}

	.root[data-selected]:not([data-disabled]):hover {
		background: var(--winui-GridViewItemBackgroundSelectedPointerOver);
	}

	.root[data-selected]:not([data-disabled]):hover .ring {
		border-color: var(--winui-GridViewItemSelectedPointerOverBorderBrush);
	}

	.root[data-selected]:not([data-disabled]):active {
		background: var(--winui-GridViewItemBackgroundSelectedPressed);
	}

	.root[data-selected]:not([data-disabled]):active .ring {
		border-color: var(--winui-GridViewItemSelectedPressedBorderBrush);
	}

	.root[data-selected][data-disabled] {
		background: var(--winui-GridViewItemBackgroundSelectedDisabled);
	}

	.root[data-selected][data-disabled] .ring {
		border-color: var(--winui-GridViewItemSelectedDisabledBorderBrush);
	}

	/* The native grid presenter binds ListViewItemDisabledThemeOpacity; there is no grid key. */
	.root[data-disabled] {
		opacity: var(--winui-ListViewItemDisabledThemeOpacity);
	}

	.root:focus-visible {
		outline: none;
	}

	.root:focus-visible::before {
		content: '';
		position: absolute;
		inset: -3px;
		/* c1-allow: generic.xaml:27496-27517, FocusVisualMargin="-3" expands the band and its
		   corner radius by 3px so it stays concentric with the item's own corner. */
		border-radius: calc(var(--winui-GridViewItemCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-GridViewItemFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-GridViewItemFocusVisualSecondaryBrush);
		pointer-events: none;
	}
</style>
