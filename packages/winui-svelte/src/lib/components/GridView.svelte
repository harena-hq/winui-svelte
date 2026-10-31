<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SelectionMode } from '../internal/selection';

	export interface GridViewProps<T> {
		/** GridView.ItemsSource, deliberately named `items` by ADR 0013. */
		items: T[];
		/**
		 * GridView.ItemTemplate. Unlike ItemsView's, this template is the item's *content*:
		 * GridView generates the GridViewItem around it, which is what an ItemsControl does.
		 */
		itemTemplate: Snippet<[T, number]>;
		/** No WinUI member: Svelte identity for DOM reuse, as on ItemsRepeater. */
		key?: (item: T, index: number) => string | number;
		/** GridView.SelectionMode. Defaults to `Single`. */
		selectionMode?: SelectionMode;
		/** GridView.SelectedItems and SelectedIndex, held as indexes. */
		selectedIndexes?: number[];
		/** SelectionChanged. Reports the new selection. */
		onSelectedIndexesChange?: (indexes: number[]) => void;
		/** GridView.IsItemClickEnabled. Defaults to `false`. */
		itemClickEnabled?: boolean;
		/** ItemClick. Its args carry the clicked item. */
		onItemClick?: (item: T, index: number) => void;
		/** GridView.Header. */
		header?: Snippet;
		/** GridView.Footer. */
		footer?: Snippet;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts" generics="T">
	import { nextSelection } from '../internal/selection';
	import GridViewItem from './GridViewItem.svelte';
	import ScrollView from './ScrollView.svelte';

	let {
		items,
		itemTemplate: callerItemTemplate,
		key,
		selectionMode = 'single',
		selectedIndexes = $bindable([]),
		onSelectedIndexesChange,
		itemClickEnabled = false,
		onItemClick,
		header,
		footer,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: GridViewProps<T> = $props();

	let repeater = $state<HTMLElement | null>(null);
	// The last index interacted with without Shift. Every selector that has a range takes it
	// from the model's AnchorIndex, which is set by exactly that.
	let anchor = $state<number | null>(null);

	const isSelected = (index: number) => selectedIndexes.includes(index);

	function commit(next: number[]) {
		const sorted = [...new Set(next)].sort((a, b) => a - b);
		if (
			sorted.length === selectedIndexes.length &&
			sorted.every((value, index) => value === selectedIndexes[index])
		)
			return;
		selectedIndexes = sorted;
		onSelectedIndexesChange?.(sorted);
	}

	// Which item was interacted with. The repeater renders one element per item, in order, so
	// the index is the position of the child that contains the event's target. Asking the DOM
	// is what lets the delegated handler preserve its modifiers while caller content may render
	// anything.
	function indexOf(target: EventTarget | null) {
		if (!repeater || !(target instanceof Node)) return -1;
		return Array.from(repeater.children).findIndex((child) => child.contains(target));
	}

	function interact(index: number, ctrl: boolean, shift: boolean) {
		if (index < 0 || index >= items.length) return;
		if (itemClickEnabled) onItemClick?.(items[index], index);
		// ItemsView delegates to SingleSelector, MultipleSelector, and ExtendedSelector; ListViewBase's
		// own selection is in neither pin, so both controls use this one transcription of those rules.
		commit(nextSelection(selectionMode, { index, selected: selectedIndexes, anchor, ctrl, shift }));
		if (selectionMode === 'none') return;
		if (!shift) anchor = index;
	}

	function onClick(event: MouseEvent) {
		interact(indexOf(event.target), event.ctrlKey, event.shiftKey);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		// ListViewItem already prevents this key press's default before it bubbles here.
		interact(indexOf(event.target), event.ctrlKey, event.shiftKey);
	}
</script>

<!-- GridView renders GridViewItems in its own panel instead of ItemsRepeater: ItemsWrapGrid
     uses the first item's desired size, including GridViewItem's 0,0,4,4 margin, for its cell
     pitch. UniformGridLayout measures getBoundingClientRect(), which excludes that margin and
     would make a 190-pixel item overflow a 190-pixel cell. The uniform Gallery items make this
     wrapping panel, with the item's own margin and no added gap, reproduce that geometry. -->
<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<!-- GridView's style setters (generic.xaml:9035-9041) disable horizontal scrolling and set
	     vertical scrolling Enabled with its bar on Auto; the template's ScrollViewer
	     (:9068-9089) binds to them. This region is now a ScrollView, which supplies that
	     scrolling. -->
	<!-- generic.xaml:9032 — Padding 0,0,0,10, which is ten pixels under the last row. -->
	<ScrollView
		data-scroll-input="scroll-viewer"
		style="flex: 1 1 auto; min-height: 0; padding-bottom: 10px"
		role="listbox"
		tabindex="-1"
		aria-multiselectable={selectionMode === 'multiple' || selectionMode === 'extended'}
		onclick={onClick}
		onkeydown={onKeyDown}
	>
		{#if header}<div class="header">{@render header()}</div>{/if}
		<div class="panel" bind:this={repeater}>
			{#each items as item, index (key ? key(item, index) : index)}
				<GridViewItem selected={isSelected(index)}>
					{@render callerItemTemplate(item, index)}
				</GridViewItem>
			{/each}
		</div>
		{#if footer}<div class="footer">{@render footer()}</div>{/if}
	</ScrollView>
</div>

<style>
	/* generic.xaml:9031-9095 — a Border taking Background, BorderBrush, BorderThickness and
	   CornerRadius from the control, and the control's own style sets none of them. A GridView
	   with nothing set draws nothing; the border the Gallery's page shows is the page's. */
	.root {
		display: flex;
		min-height: 0;
		flex-direction: column;
	}

	/* ItemsWrapGrid Orientation="Horizontal" (generic.xaml:9058-9062). See the file comment:
	   the pitch is the item's own margin, so this panel adds no gap of its own. */
	.panel {
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
		/* A flex line stretches items by default; short grid items must not grow to the tallest. */
		align-items: flex-start;
	}
</style>
