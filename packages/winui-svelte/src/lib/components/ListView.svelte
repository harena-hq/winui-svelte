<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SelectionMode } from '../internal/selection';

	export interface ListViewProps<T> {
		/** ListView.ItemsSource, deliberately named `items` by ADR 0013. */
		items: T[];
		/**
		 * ListView.ItemTemplate. Unlike ItemsView's, this template is the row's *content*:
		 * ListView generates the ListViewItem around it, which is what an ItemsControl does.
		 */
		itemTemplate: Snippet<[T, number]>;
		/** No WinUI member: Svelte identity for DOM reuse, as on ItemsRepeater. */
		key?: (item: T, index: number) => string | number;
		/** ListView.SelectionMode. Defaults to `Single`. */
		selectionMode?: SelectionMode;
		/** ListView.SelectedItems and SelectedIndex, held as indexes. */
		selectedIndexes?: number[];
		/** SelectionChanged. Reports the new selection. */
		onSelectionChanged?: (indexes: number[]) => void;
		/** ListView.IsItemClickEnabled. Defaults to `false`. */
		isItemClickEnabled?: boolean;
		/** ItemClick. Its args carry the clicked item. */
		onItemClick?: (item: T, index: number) => void;
		/** ListView.Header. */
		header?: Snippet;
		/** ListView.Footer. */
		footer?: Snippet;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts" generics="T">
	import { nextSelection } from '../internal/selection';
	import ItemsRepeater from './ItemsRepeater.svelte';
	import ListViewItem from './ListViewItem.svelte';
	import ScrollView from './ScrollView.svelte';

	let {
		items,
		itemTemplate: callerItemTemplate,
		key,
		selectionMode = 'single',
		selectedIndexes = $bindable([]),
		onSelectionChanged,
		isItemClickEnabled = false,
		onItemClick,
		header,
		footer,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ListViewProps<T> = $props();

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
		onSelectionChanged?.(sorted);
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
		if (isItemClickEnabled) onItemClick?.(items[index], index);
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

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<!-- The ScrollViewer at generic.xaml:9002-9021 disables horizontal scrolling and leaves vertical
	     scrolling on Auto. This region is now a ScrollView, which supplies that scrolling. -->
	<ScrollView
		class="viewport"
		style="flex: 1 1 auto; min-height: 0"
		role="listbox"
		tabindex="-1"
		aria-multiselectable={selectionMode === 'multiple' || selectionMode === 'extended'}
		onclick={onClick}
		onkeydown={onKeyDown}
	>
		{#if header}<div class="header">{@render header()}</div>{/if}
		<!-- ItemsRepeater's omitted layout is its vertical StackLayout with no spacing, matching
		     ItemsStackPanel. The four pixels between rows are ListViewItem's background inset;
		     adding spacing here would double the rhythm. -->
		<ItemsRepeater bind:ref={repeater} {items} {key}>
			{#snippet itemTemplate(item, index)}
				<ListViewItem selected={isSelected(index)}>
					{@render callerItemTemplate(item, index)}
				</ListViewItem>
			{/snippet}
		</ItemsRepeater>
		{#if footer}<div class="footer">{@render footer()}</div>{/if}
	</ScrollView>
</div>

<style>
	/* generic.xaml:9000-9027 — a Border taking Background, BorderBrush, BorderThickness and
	   CornerRadius from the control, and the control's own style sets none of them. A ListView
	   with nothing set draws nothing; the border the Gallery's page shows is the page's. */
	.root {
		display: flex;
		min-height: 0;
		flex-direction: column;
	}
</style>
