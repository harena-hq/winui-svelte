<script lang="ts">
	import type { SvelteSet } from 'svelte/reactivity';
	import type { NavigationViewItemData } from './NavigationView.svelte';
	import Self from './NavigationViewItem.svelte';

	interface Props {
		item: NavigationViewItemData;
		/** 1 for a top-level item. Drives both `aria-level` and the left indentation. */
		level: number;
		selected: string | null;
		expanded: SvelteSet<string>;
		onselect?: (id: string) => void;
	}

	let { item, level, selected, expanded, onselect }: Props = $props();

	const open = $derived(expanded.has(item.id));
	const hasChildren = $derived((item.children?.length ?? 0) > 0);
	const isSelected = $derived(selected === item.id);

	function activate() {
		// An expandable item that is clicked on its label both selects and expands. The
		// chevron is the only way to collapse one, which is what NavigationView does: a
		// second click on the label would otherwise navigate and close in one gesture.
		if (hasChildren && !open) expanded.add(item.id);
		onselect?.(item.id);
	}

	function onkeydown(event: KeyboardEvent) {
		// WD-004: Enter and Space, and no arrow keys — every item is its own tab stop.
		// See docs/divergences.md.
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		activate();
	}

	function toggle(event: MouseEvent) {
		// Without this the row's own handler also runs, and collapsing would immediately
		// re-expand.
		event.stopPropagation();
		if (open) expanded.delete(item.id);
		else expanded.add(item.id);
	}
</script>

<li role="none">
	<div
		role="treeitem"
		class="item"
		aria-selected={isSelected}
		aria-expanded={hasChildren ? open : undefined}
		aria-level={level}
		tabindex="0"
		data-selected={isSelected}
		data-expanded={hasChildren ? open : undefined}
		onclick={activate}
		{onkeydown}
	>
		<span class="selection-indicator"></span>
		<span class="icon-column" data-icon={item.glyph ? true : undefined}>
			{#if item.glyph}
				<span class="icon">{String.fromCodePoint(parseInt(item.glyph, 16))}</span>
			{/if}
		</span>
		<span class="content-presenter">{item.content}</span>
		{#if hasChildren}
			<button
				type="button"
				class="expand-chevron"
				aria-label={open ? 'Collapse' : 'Expand'}
				onclick={toggle}
			></button>
		{/if}
	</div>

	{#if hasChildren && open}
		<ul role="group" class="children">
			{#each item.children ?? [] as child (child.id)}
				<Self item={child} level={level + 1} {selected} {expanded} {onselect} />
			{/each}
		</ul>
	{/if}
</li>

<style>
	.item {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		min-height: var(--winui-NavigationViewItemOnLeftMinHeight);
		margin: var(--winui-NavigationViewItemButtonMargin);
		/* c1-allow: NavigationView_themeresources.xaml:604, the item's ContentGrid carries
		   Margin="0,0,14,0" and no resource names the 14 */
		padding-right: 14px;
		border-style: solid;
		border-width: var(--winui-NavigationViewItemBorderThickness);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-NavigationViewItemBackground);
		color: var(--winui-NavigationViewItemForeground);
		border-color: var(--winui-NavigationViewItemBorderBrush);
		cursor: pointer;
		user-select: none;
	}

	/* One `c_itemIndentation` per level below the top, on the item's padding rather than on
	   the list that holds it: in the original the row's background runs the full width of
	   the pane and only its contents move right.

	   WinUI multiplies without a bound and this enumerates four levels. The Gallery's
	   deepest menu is two, and a fifth level sharing the fourth's inset is a stated limit
	   rather than a silent truncation — add a rule when a menu needs one. */
	.item[aria-level='2'] {
		padding-left: var(--nav-indentation);
	}

	.item[aria-level='2'] .selection-indicator {
		left: var(--nav-indentation);
	}

	.item[aria-level='3'] {
		padding-left: calc(var(--nav-indentation) * 2);
	}

	.item[aria-level='3'] .selection-indicator {
		left: calc(var(--nav-indentation) * 2);
	}

	.item[aria-level='4'] {
		padding-left: calc(var(--nav-indentation) * 3);
	}

	.item[aria-level='4'] .selection-indicator {
		left: calc(var(--nav-indentation) * 3);
	}

	/* The states `MUX_NavigationViewItemPresenterStyleWhenOnLeftPane` names, in the order
	   its VisualStateManager names them. Two of the seven transpose the words between the
	   state and the resource: the `PointerOverSelected` state reads
	   `…BackgroundSelectedPointerOver`. */
	.item:hover {
		background: var(--winui-NavigationViewItemBackgroundPointerOver);
		color: var(--winui-NavigationViewItemForegroundPointerOver);
		border-color: var(--winui-NavigationViewItemBorderBrushPointerOver);
	}

	.item:active {
		background: var(--winui-NavigationViewItemBackgroundPressed);
		color: var(--winui-NavigationViewItemForegroundPressed);
		border-color: var(--winui-NavigationViewItemBorderBrushPressed);
	}

	/* Nothing in this version renders a disabled item. The rule is here because the state
	   exists in the source, and a missing rule reads the same as one decided against. */
	.item[aria-disabled='true'] {
		background: var(--winui-NavigationViewItemBackgroundDisabled);
		color: var(--winui-NavigationViewItemForegroundDisabled);
		border-color: var(--winui-NavigationViewItemBorderBrushDisabled);
		cursor: default;
	}

	.item[data-selected='true'] {
		background: var(--winui-NavigationViewItemBackgroundSelected);
		color: var(--winui-NavigationViewItemForegroundSelected);
		border-color: var(--winui-NavigationViewItemBorderBrushSelected);
	}

	.item[data-selected='true']:hover {
		background: var(--winui-NavigationViewItemBackgroundSelectedPointerOver);
		color: var(--winui-NavigationViewItemForegroundSelectedPointerOver);
		border-color: var(--winui-NavigationViewItemBorderBrushSelectedPointerOver);
	}

	.item[data-selected='true']:active {
		background: var(--winui-NavigationViewItemBackgroundSelectedPressed);
		color: var(--winui-NavigationViewItemForegroundSelectedPressed);
		border-color: var(--winui-NavigationViewItemBorderBrushSelectedPressed);
	}

	/* Absolutely placed, because in the template it lives in its own grid stacked over the
	   content rather than in a column of it — an indicator that took a column would push
	   every icon three pixels right of where WinUI draws it. */
	.selection-indicator {
		position: absolute;
		/* Absolute positioning is relative to the padding box, so the indentation has to be
		   applied to `left` as well as to the item's padding — on the reference capture a
		   child's indicator sits exactly one `c_itemIndentation` right of its row's left
		   edge, and one rule setting both keeps the two from drifting apart. */
		left: 0;
		top: 50%;
		translate: 0 -50%;
		width: var(--winui-NavigationViewSelectionIndicatorWidth);
		height: var(--winui-NavigationViewSelectionIndicatorHeight);
		border-radius: var(--winui-NavigationViewSelectionIndicatorRadius);
		background: var(--winui-NavigationViewSelectionIndicatorForeground);
		opacity: 0;
	}

	.item[data-selected='true'] .selection-indicator {
		opacity: 1;
	}

	/* `IconColumn.Width` binds `TemplateSettings.SmallerIconWidth` —
	   NavigationView_themeresources.xaml:611 — which
	   `NavigationViewItemPresenter::UpdateCompactPaneLength` computes as
	   `CompactPaneLength - 8`. At this pin that is `48 - 8`, so it lands on the same 40 as
	   `NavigationViewIconBoxWidth` and the two are indistinguishable on screen. They are
	   still different quantities, and the expression is the one the template evaluates. */
	.icon-column {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* c1-allow: NavigationViewItemPresenter.cpp:289, `SmallerIconWidth` is
		   `CompactPaneLength - 8` */
		width: calc(var(--winui-NavigationViewCompactPaneLength) - 8px);
		height: var(--winui-NavigationViewItemOnLeftIconBoxHeight);
	}

	/* `IconCollapsed` — NavigationView_themeresources.xaml:509. The box goes away and the
	   column keeps 8, which is the gap that stays between the indentation and the label. */
	.icon-column:not([data-icon]) {
		/* c1-allow: NavigationView_themeresources.xaml:510, IconColumn.Width Value="8" */
		width: 8px;
	}

	.icon {
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-NavigationViewItemOnLeftIconBoxHeight);
		line-height: normal;
	}

	.content-presenter {
		min-width: 0;
		padding: var(--winui-NavigationViewItemContentPresenterMargin);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.expand-chevron {
		display: flex;
		align-items: center;
		justify-content: center;
		/* c1-allow: NavigationView_themeresources.xaml:617, ExpandCollapseChevron Width="40" */
		width: 40px;
		/* c1-allow: NavigationView_themeresources.xaml:618, the chevron's own 12 by 12 box */
		height: 12px;
		margin: var(--winui-NavigationViewItemExpandChevronMargin);
		padding: 0;
		background: transparent;
		border: 0;
		color: inherit;
		cursor: pointer;
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-NavigationViewItemExpandedGlyphFontSize);
		line-height: normal;
	}

	/* `NavigationViewItemExpandedGlyph` is ChevronDown, and the token is already a quoted
	   CSS string. WinUI animates between a down and an up chevron and only falls back to
	   this one glyph when the animation cannot run, so the rotation is ours: down while
	   collapsed, up while expanded. Which way the real control points in each state is one
	   of the things v2's side-by-side against Windows 11 is for. */
	.expand-chevron::before {
		content: var(--winui-NavigationViewItemExpandedGlyph);
		display: block;
	}

	.item[data-expanded='true'] .expand-chevron::before {
		rotate: 180deg;
	}

	.children {
		list-style: none;
		margin: 0;
		padding: 0;
	}
</style>
