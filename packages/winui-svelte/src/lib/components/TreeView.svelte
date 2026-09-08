<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/*
	 * TreeViewSelectionMode.Multiple and its check box column remain owed with ListViewItem's
	 * check box in v9 (docs/plan.md). CanDragItems, CanReorderItems and AllowDrop are reordering
	 * work this version does not build. Expanding and Collapsed event args expose Node and Item;
	 * onExpandedChange instead reports the new key set. TreeViewNode itself is absent because
	 * ADR 0013 keeps the caller's item type rather than wrapping it.
	 */
	export interface TreeViewProps<T> {
		/** TreeView.RootNodes, as the caller's own items. */
		items: T[];
		/** No WinUI member: stable identity for expansion and selection. */
		key: (item: T) => string | number;
		/** No WinUI member: TreeViewNode.Children, asked of the caller's own item. */
		childrenOf?: (item: T) => T[] | undefined;
		/** TreeView.ItemTemplate. The second argument is the node's depth, not its index. */
		itemTemplate: Snippet<[T, number]>;
		/** TreeView.SelectionMode, without Multiple — see the file comment. */
		selectionMode?: 'none' | 'single';
		/** TreeView.SelectedItem, held as a key. */
		selectedKey?: string | number | null;
		/** SelectionChanged, narrowed to the new key. */
		onSelectionChanged?: (key: string | number | null) => void;
		/** Which branches are open, by key. Bindable, because the tree opens them itself. */
		expandedKeys?: (string | number)[];
		/** Expanding and Collapsed, reported together as the new set. */
		onExpandedChange?: (keys: (string | number)[]) => void;
		/** ItemInvoked. */
		onItemInvoked?: (item: T, depth: number) => void;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts" generics="T">
	import TreeViewItem from './TreeViewItem.svelte';

	let {
		items,
		key,
		childrenOf,
		itemTemplate,
		selectionMode = 'single',
		selectedKey = $bindable<string | number | null>(null),
		onSelectionChanged,
		expandedKeys = $bindable<(string | number)[]>([]),
		onExpandedChange,
		onItemInvoked,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: TreeViewProps<T> = $props();

	// The visible rows, in document order, with the depth each one draws at. A node's children
	// are only walked when open, which makes a closed branch cost nothing.
	interface Row {
		item: T;
		depth: number;
		id: string | number;
		expandable: boolean;
	}

	const rows = $derived.by(() => {
		const out: Row[] = [];
		const walk = (list: T[], depth: number) => {
			for (const item of list) {
				const id = key(item);
				const kids = childrenOf?.(item);
				const expandable = !!kids && kids.length > 0;
				out.push({ item, depth, id, expandable });
				if (expandable && expandedKeys.includes(id)) walk(kids, depth + 1);
			}
		};
		walk(items, 0);
		return out;
	});

	function select(id: string | number) {
		if (selectionMode !== 'single' || selectedKey === id) return;
		selectedKey = id;
		onSelectionChanged?.(id);
	}

	function toggle(id: string | number) {
		const next = expandedKeys.includes(id)
			? expandedKeys.filter((candidate) => candidate !== id)
			: [...expandedKeys, id];
		expandedKeys = next;
		onExpandedChange?.(next);
	}

	function invoke(row: Row) {
		select(row.id);
		onItemInvoked?.(row.item, row.depth);
	}

	// Tree selection is one key, not a set of indexes, and TreeViewSelectionMode has no Extended;
	// internal/selection.ts is therefore not this control's selection model. WD-027 records the
	// deliberately absent arrow-key navigation.
</script>

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<div class="viewport" role="tree" tabindex="-1">
		{#each rows as row (row.id)}
			<TreeViewItem
				depth={row.depth}
				expandable={row.expandable}
				expanded={expandedKeys.includes(row.id)}
				selected={selectedKey === row.id}
				onExpandToggle={() => toggle(row.id)}
				onItemInvoked={() => invoke(row)}
			>
				{@render itemTemplate(row.item, row.depth)}
			</TreeViewItem>
		{/each}
	</div>
</div>

<style>
	/* generic.xaml:9000-9027 — a Border taking Background, BorderBrush, BorderThickness and
	   CornerRadius from the control, and the control's own style sets none of them. A TreeView
	   with nothing set draws nothing; the border the Gallery's page shows is the page's. */
	.root {
		display: flex;
		min-height: 0;
		flex-direction: column;
	}

	/* TreeView.xaml:8-28 is one TreeViewList, a ListView subclass. This is ListView's viewport:
	   horizontal scrolling is absent, vertical scrolling is automatic, and scoped scrollbar rules
	   reproduce ScrollBar_themeresources.xaml until the Scrolling tranche owns the control. */
	.viewport {
		flex: 1 1 auto;
		min-height: 0;
		overflow: auto;
	}

	/* `ScrollBarSize` is 12 and `ScrollBarVerticalThumbMinWidth` is 8 —
	   ScrollBar_themeresources.xaml:180 and :182 — where the browser's default rail is half
	   again as wide. */
	.viewport::-webkit-scrollbar {
		/* c1-allow: ScrollBar_themeresources.xaml:180, ScrollBarSize 12 */
		width: 12px;
	}

	.viewport::-webkit-scrollbar-track {
		background: transparent;
	}

	.viewport::-webkit-scrollbar-thumb {
		background: var(--winui-ControlStrongFillColorDefaultBrush);
		background-clip: padding-box;
		/* c1-allow: measured 2px on a capture of the real Gallery's pane */
		border: 5px solid transparent;
		/* c1-allow: ScrollBar_themeresources.xaml:180, half of ScrollBarSize 12 */
		border-radius: 6px;
	}

	/* `Expanded` — ScrollBar_themeresources.xaml:587; the native animation is represented by
	   its pointer-over endpoint. */
	.viewport:hover::-webkit-scrollbar-track {
		background: var(--winui-AcrylicInAppFillColorDefaultBrush);
	}

	.viewport:hover::-webkit-scrollbar-thumb {
		/* c1-allow: measured 6px of thumb inside the 12 of ScrollBarSize on the original */
		border: 3px solid transparent;
	}
</style>
