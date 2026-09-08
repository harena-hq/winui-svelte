<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/*
	 * ListViewItem stacks presenter chrome around caller content. Its template is the native
	 * ListViewItemPresenter, so its background and indicator geometry were measured on the
	 * reference machine rather than read from XAML. Drag, reorder and placeholder families are
	 * absent because reordering is not built; pre-Fluent *ThemeBrush families are read by no
	 * current template; the presenter's FocusBorderBrush/FocusSecondaryBorderBrush rectangle is
	 * superseded by the system focus band. The inline checkbox — ListViewItemContentOffsetX,
	 * ListViewItemCheckMode, both *VisualEnabled booleans and the ListViewItemCheckBox* family —
	 * remains owed by v9 and docs/plan.md.
	 */
	export interface ListViewItemProps {
		/** ListViewItem.Content, the content property — ADR 0009 maps it to `children`. */
		children?: Snippet;
		/** ListViewItem.IsSelected. The item never sets it; its owner does. */
		selected?: boolean;
		/** IsEnabled, inverted to the HTML sense — ADR 0009. */
		disabled?: boolean;
		/** No WinUI event of its own: the item reports a click or an Enter or Space. */
		onItemInvoked?: () => void;
		class?: string;
		style?: string;
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
	}: ListViewItemProps = $props();

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
	<!-- This is a child rather than the root's own background because the presenter insets it;
	     the root's box is what the focus band and layout use. -->
	<div class="background"></div>
	<div class="indicator"></div>
	<div class="content">{@render children?.()}</div>
</div>

<style>
	/* generic.xaml:27524-27545 — Padding 16,0,12,0, MinWidth 88, MinHeight 40, content
	   vertically centred and horizontally stretched. */
	.root {
		position: relative;
		display: flex;
		align-items: center;
		box-sizing: border-box;
		min-width: var(--winui-ListViewItemMinWidth);
		min-height: var(--winui-ListViewItemMinHeight);
		padding: 0 12px 0 16px;
		color: var(--winui-ListViewItemForeground);
		user-select: none;
	}

	/* The presenter paints its background inset from the item's own box, and the inset is in no
	   file: measured on the reference machine as 2 above and below and 4 either side, in a
	   40-tall row whose box runs the full width of the list. It is a child rather than the root's
	   own background because the root's box is what the focus band and the layout use. */
	.background {
		position: absolute;
		inset: 2px 4px;
		border-radius: var(--winui-ListViewItemCornerRadius);
		background: var(--winui-ListViewItemBackground);
		pointer-events: none;
	}

	/* Measured: a 3-by-16 capsule at the background's left edge, vertically centred. */
	.indicator {
		position: absolute;
		left: 4px;
		top: 50%;
		width: 3px;
		height: 16px;
		transform: translateY(-50%);
		border-radius: var(--winui-ListViewItemSelectionIndicatorCornerRadius);
		background: var(--winui-ListViewItemSelectionIndicatorBrush);
		opacity: 0;
		pointer-events: none;
	}

	.content {
		position: relative;
		flex: 1 1 auto;
		min-width: 0;
	}

	/* The state rules exclude one another: selected chrome must not be overwritten by the
	   unselected pointer rules, and disabled items only enter their normal state. */
	.root:not([data-disabled]):not([data-selected]):hover {
		color: var(--winui-ListViewItemForegroundPointerOver);
	}

	.root:not([data-disabled]):not([data-selected]):hover .background {
		background: var(--winui-ListViewItemBackgroundPointerOver);
	}

	.root:not([data-disabled]):not([data-selected]):active {
		color: var(--winui-ListViewItemForegroundPressed);
	}

	.root:not([data-disabled]):not([data-selected]):active .background {
		background: var(--winui-ListViewItemBackgroundPressed);
	}

	.root[data-selected] {
		color: var(--winui-ListViewItemForegroundSelected);
	}

	.root[data-selected] .background {
		background: var(--winui-ListViewItemBackgroundSelected);
	}

	.root[data-selected] .indicator {
		opacity: 1;
	}

	.root[data-selected]:not([data-disabled]):hover {
		color: var(--winui-ListViewItemForegroundSelectedPointerOver);
	}

	.root[data-selected]:not([data-disabled]):hover .background {
		background: var(--winui-ListViewItemBackgroundSelectedPointerOver);
	}

	.root[data-selected]:not([data-disabled]):hover .indicator {
		background: var(--winui-ListViewItemSelectionIndicatorPointerOverBrush);
	}

	.root[data-selected]:not([data-disabled]):active {
		color: var(--winui-ListViewItemForegroundSelectedPressed);
	}

	.root[data-selected]:not([data-disabled]):active .background {
		background: var(--winui-ListViewItemBackgroundSelectedPressed);
	}

	.root[data-selected]:not([data-disabled]):active .indicator {
		background: var(--winui-ListViewItemSelectionIndicatorPressedBrush);
	}

	.root[data-selected][data-disabled] .background {
		background: var(--winui-ListViewItemBackgroundSelectedDisabled);
	}

	.root[data-selected][data-disabled] .indicator {
		background: var(--winui-ListViewItemSelectionIndicatorDisabledBrush);
	}

	.root[data-disabled] {
		opacity: var(--winui-ListViewItemDisabledThemeOpacity);
	}

	.root:focus-visible {
		outline: none;
	}

	/* FocusVisualMargin="1": the system's 2-and-1 band sits one pixel inside the item box. */
	.root:focus-visible::before {
		content: '';
		position: absolute;
		inset: 1px;
		border-radius: var(--winui-ListViewItemCornerRadius);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-ListViewItemFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-ListViewItemFocusVisualSecondaryBrush);
		pointer-events: none;
	}
</style>
