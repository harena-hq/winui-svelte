<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface TreeViewItemProps {
		/** TreeViewItem.Content, the content property. */
		children?: Snippet;
		/** No WinUI member: the node's depth, which upstream carries in TemplateSettings. */
		depth?: number;
		/** TreeViewItem.IsExpanded. */
		expanded?: boolean;
		/** Whether the node has children at all; a leaf shows no chevron. */
		expandable?: boolean;
		/** TreeViewItem.IsSelected. */
		selected?: boolean;
		/** IsEnabled, inverted — ADR 0009. */
		disabled?: boolean | null;
		/** Raised by a click on the chevron alone. */
		onExpandToggle?: () => void;
		/** Raised by a click or an Enter or Space anywhere else on the row. */
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
		depth = 0,
		expanded = false,
		expandable = false,
		selected = false,
		disabled = false,
		onExpandToggle,
		onItemInvoked,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: TreeViewItemProps = $props();

	function invoke() {
		if (disabled) return;
		onItemInvoked?.();
	}

	function toggle(event: MouseEvent) {
		if (disabled || !expandable) return;
		// Keep the chevron action from also invoking the row.
		event.stopPropagation();
		onExpandToggle?.();
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		// Space scrolls the page unless this keyboard invocation cancels its browser default.
		event.preventDefault();
		if (!disabled && expandable) onExpandToggle?.();
		invoke();
	}
</script>

<div
	bind:this={ref}
	class={['root', className]}
	{style}
	role="treeitem"
	tabindex={disabled ? -1 : 0}
	aria-level={depth + 1}
	aria-selected={selected}
	aria-expanded={expandable ? expanded : undefined}
	aria-disabled={disabled || undefined}
	data-selected={selected || undefined}
	data-disabled={disabled || undefined}
	data-expanded={expanded || undefined}
	onclick={invoke}
	onkeydown={onKeyDown}
	{...rest}
>
	<div class="indicator"></div>
	<div class="grid" style:padding-left={`${depth * 16}px`}>
		<span
			class="chevron"
			data-expandable={expandable || undefined}
			onclick={toggle}
			role="presentation"
		></span>
		<div class="content">{@render children?.()}</div>
	</div>
</div>

<style>
	/* TreeViewItem.xaml:15 — Margin 4,2 and Padding 0,3,0,5 on the root grid, MinHeight 28 from
	   the Style, and a corner radius of ControlCornerRadius rather than ListViewItem's own. */
	.root {
		position: relative;
		display: flex;
		align-items: center;
		box-sizing: border-box;
		min-height: var(--winui-TreeViewItemMinHeight);
		margin: var(--winui-TreeViewItemPresenterMargin);
		padding: var(--winui-TreeViewItemPresenterPadding);
		border-style: solid;
		border-width: var(--winui-TreeViewItemBorderThemeThickness);
		border-color: var(--winui-TreeViewItemBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-TreeViewItemBackground);
		color: var(--winui-TreeViewItemForeground);
		user-select: none;
	}

	/* TreeViewItem.xaml:130 — a 3-by-16 rectangle with a radius of 2, left and centred. Its
	   left edge is the root's own, which is why it is placed against the padding box's start
	   with a negative inset: the root's padding is 0 on the left, so the two agree. */
	.indicator {
		position: absolute;
		left: 0;
		top: 50%;
		width: 3px;
		height: 16px;
		transform: translateY(-50%);
		/* c1-allow: TreeViewItem.xaml:130, RadiusX and RadiusY of 2 on the indicator */
		border-radius: 2px;
		background: var(--winui-TreeViewItemSelectionIndicatorForeground);
		opacity: 0;
		pointer-events: none;
	}

	/* MultiSelectGrid, whose Padding is TreeViewItemTemplateSettings.Indentation —
	   TreeViewItem.cpp:515-525, depth times sixteen and nothing else. */
	.grid {
		display: flex;
		align-items: center;
		flex: 1 1 auto;
		min-width: 0;
	}

	/* ExpandCollapseChevron: Padding 14,0 around a 12-by-12 glyph that itself has Padding 2,
	   so the column is 12 + 4 of glyph padding + 28 of its own. A leaf keeps the column — the
	   chevron is Collapsed by visibility upstream, not removed — so the content of every row
	   at one depth starts in the same place. */
	.chevron {
		flex: none;
		box-sizing: content-box;
		width: 12px;
		height: 12px;
		padding: 2px 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: TreeView.idl:206, GlyphSize defaults to 8.0 */
		font-size: 8px;
		font-weight: normal;
		line-height: normal;
		color: inherit;
	}

	.chevron[data-expandable] {
		cursor: default;
	}

	/* c1-allow: TreeView.idl:204, CollapsedGlyph defaults to \E76C */
	.chevron[data-expandable]::after {
		content: '\E76C' / '';
	}

	/* c1-allow: TreeView.idl:202, ExpandedGlyph defaults to \E70D */
	.root[data-expanded] .chevron[data-expandable]::after {
		content: '\E70D' / '';
	}

	/* ContentPresenter, MinHeight TreeViewItemContentHeight. */
	.content {
		flex: 1 1 auto;
		min-width: 0;
		min-height: var(--winui-TreeViewItemContentHeight);
		display: flex;
		align-items: center;
	}

	/* TreeViewItem.xaml:17-99 — the unselected pointer states exclude selected and disabled
	   containers, matching ItemContainer and ListViewItem's state exclusions. */
	.root:not([data-disabled]):not([data-selected]):hover {
		background: var(--winui-TreeViewItemBackgroundPointerOver);
		color: var(--winui-TreeViewItemForegroundPointerOver);
		border-color: var(--winui-TreeViewItemBorderBrushPointerOver);
	}

	.root:not([data-disabled]):not([data-selected]):active {
		background: var(--winui-TreeViewItemBackgroundPressed);
		color: var(--winui-TreeViewItemForegroundPressed);
		border-color: var(--winui-TreeViewItemBorderBrushPressed);
	}

	.root[data-selected] {
		background: var(--winui-TreeViewItemBackgroundSelected);
		color: var(--winui-TreeViewItemForegroundSelected);
		border-color: var(--winui-TreeViewItemBorderBrushSelected);
	}

	.root[data-selected] .indicator {
		opacity: 1;
	}

	/* The glyph foreground follows ContentPresenter.Foreground in every XAML state, so it
	   inherits the row's colour instead of restating eight equivalent values. */
	.root[data-selected]:not([data-disabled]):hover {
		background: var(--winui-TreeViewItemBackgroundSelectedPointerOver);
		color: var(--winui-TreeViewItemForegroundSelectedPointerOver);
		border-color: var(--winui-TreeViewItemBorderBrushSelectedPointerOver);
	}

	.root[data-selected]:not([data-disabled]):hover .indicator {
		background: var(--winui-TreeViewItemSelectionIndicatorForegroundPointerOver);
	}

	.root[data-selected]:not([data-disabled]):active {
		background: var(--winui-TreeViewItemBackgroundSelectedPressed);
		color: var(--winui-TreeViewItemForegroundSelectedPressed);
		border-color: var(--winui-TreeViewItemBorderBrushSelectedPressed);
	}

	.root[data-selected]:not([data-disabled]):active .indicator {
		background: var(--winui-TreeViewItemSelectionIndicatorForegroundPressed);
	}

	.root[data-disabled] {
		background: var(--winui-TreeViewItemBackgroundDisabled);
		color: var(--winui-TreeViewItemForegroundDisabled);
		border-color: var(--winui-TreeViewItemBorderBrushDisabled);
	}

	.root[data-disabled] .indicator {
		background: var(--winui-TreeViewItemSelectionIndicatorForegroundDisabled);
	}

	.root[data-selected][data-disabled] {
		background: var(--winui-TreeViewItemBackgroundSelectedDisabled);
		color: var(--winui-TreeViewItemForegroundSelectedDisabled);
		border-color: var(--winui-TreeViewItemBorderBrushSelectedDisabled);
	}

	.root[data-selected][data-disabled] .indicator {
		opacity: 1;
	}

	.root:focus-visible {
		outline: none;
	}

	/* FocusVisualMargin="0,-1,0,-1": ListViewItem's inherited two-brush band extends one
	   pixel above and below the item, while remaining flush at its sides. */
	.root:focus-visible::before {
		content: '';
		position: absolute;
		inset: 0 -1px;
		border-radius: var(--winui-ControlCornerRadius);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-ListViewItemFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-ListViewItemFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
