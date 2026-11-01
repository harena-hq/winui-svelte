<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ItemsRepeaterLayout } from './ItemsRepeater.svelte';
	export type SelectionMode = import('../internal/selection').SelectionMode;

	/*
	 * `VerticalScrollController`, `TryGetItemIndex`, and `StartBringItemIntoView` are absent.
	 * This viewport is now a `ScrollView`, but this control does not expose its controller or
	 * imperative members. `Select`,
	 * `Deselect`, `IsSelected`, `SelectAll`, `DeselectAll`, and `InvertSelection` are six
	 * imperative methods expressible by assigning bindable `selectedIndexes`: this library
	 * publishes state, not commands, as ItemsRepeater did for its three imperative members.
	 * `CurrentItemIndex` is the focused item's index, but this control does not manage focus
	 * between items; WD-027 records that divergence. `ItemTransitionProvider` is animation,
	 * which the roadmap's Motion tranche owns. `Padding`, which upstream binds to the repeater's
	 * Margin, is absent because `class` and `style` are D21's escape hatch and a `padding` prop
	 * would be a second way to say one thing. `SelectionChanged` has empty upstream event args
	 * (ItemsView.idl:23-27), so `onSelectedIndexesChange` reports the new selection instead.
	 */

	/**
	 * What the view decided about one item, handed to the item template as its third argument —
	 * ADR 0013's v9 unit 4c amendment. The consumer spreads these onto the `ItemContainer` its
	 * own template renders, which is where upstream's `ItemsView` reaches by walking the visual
	 * tree.
	 */
	export interface ItemsViewItemState {
		/** ItemContainer.IsSelected, as this view decided it. */
		selected: boolean;
		/** ItemContainer.MultiSelectMode, which follows from the view's own SelectionMode. */
		multiSelectMode: 'single' | 'multiple';
	}

	/** ItemsView. */
	export interface ItemsViewProps<T> {
		/** ItemsView.ItemsSource, deliberately named `items` by ADR 0013. */
		items: T[];
		/** ItemsView.ItemTemplate, with the view's decision as its third argument. */
		itemTemplate: Snippet<[T, number, ItemsViewItemState]>;
		/** No WinUI member: Svelte identity for DOM reuse, as on ItemsRepeater. */
		key?: (item: T, index: number) => string | number;
		/** ItemsView.Layout. An omitted layout is the default `StackLayout` (ItemsView.xaml:11-15). */
		layout?: ItemsRepeaterLayout;
		/** ItemsView.SelectionMode. Defaults to `Single` (ItemsView.h:21). */
		selectionMode?: SelectionMode;
		/**
		 * ItemsView.SelectedItems, held as indexes rather than items — an index is what every
		 * selector method upstream takes, and what identifies an item this control cannot compare
		 * by value.
		 */
		selectedIndexes?: number[];
		/** SelectionChanged. Its upstream args are empty, so this reports the new selection. */
		onSelectedIndexesChange?: (indexes: number[]) => void;
		/** ItemsView.IsItemInvokedEnabled. Defaults to `false`. */
		itemInvokedEnabled?: boolean;
		/** ItemInvoked. Its args carry the invoked item (ItemsView.idl:17-20). */
		onItemInvoked?: (item: T, index: number) => void;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts" generics="T">
	import { nextSelection } from '../internal/selection';
	import ItemsRepeater from './ItemsRepeater.svelte';
	import ScrollView from './ScrollView.svelte';

	let {
		items,
		itemTemplate: callerItemTemplate,
		key,
		layout,
		selectionMode = 'single',
		selectedIndexes = $bindable([]),
		onSelectedIndexesChange,
		itemInvokedEnabled = false,
		onItemInvoked,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ItemsViewProps<T> = $props();

	let repeater = $state<HTMLElement | null>(null);
	// The last index interacted with without Shift. Every selector that has a range takes it
	// from the model's AnchorIndex, which is set by exactly that.
	let anchor = $state<number | null>(null);

	const multiSelectMode = $derived<'single' | 'multiple'>(
		selectionMode === 'multiple' ? 'multiple' : 'single'
	);

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
	// is what lets the consumer keep ownership of the container — ADR 0013's amendment.
	function indexOf(target: EventTarget | null) {
		if (!repeater || !(target instanceof Node)) return -1;
		return Array.from(repeater.children).findIndex((child) => child.contains(target));
	}

	function interact(index: number, ctrl: boolean, shift: boolean) {
		if (index < 0 || index >= items.length) return;
		if (itemInvokedEnabled) onItemInvoked?.(items[index], index);
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
		// ItemContainer already prevents this key press's default before it bubbles here.
		interact(indexOf(event.target), event.ctrlKey, event.shiftKey);
	}
</script>

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<!-- The automation peer upstream is an ISelectionProvider (ItemsView.idl:80), which is a
	     listbox, and the ItemContainers a caller's template renders are already `role="option"`
	     — an option owned by nothing is an ARIA error, so the owner is named here. The handlers
	     are on the same element because delegation is how the view learns which item was
	     interacted with and with which modifiers, and because upstream's own Style is
	     `IsTabStop="False"` (ItemsView.xaml:6), which is what `tabindex="-1"` says here: reachable
	     by script and by an assistive technology, never by the Tab key. -->
	<!-- PART_ScrollView (ItemsView.xaml:19-27). This region is now a ScrollView and inherits the
	     control's corner radius. -->
	<ScrollView
		style="height: 100%; border-radius: inherit"
		role="listbox"
		tabindex="-1"
		aria-multiselectable={selectionMode === 'multiple' || selectionMode === 'extended'}
		onclick={onClick}
		onkeydown={onKeyDown}
	>
		<ItemsRepeater bind:ref={repeater} {items} {key} {layout}>
			<!-- This is ItemsView's local `itemTemplate`; it renders the caller's aliased
			     `callerItemTemplate` with the third argument mandated by ADR 0013's v9 unit 4c
			     amendment. Aliasing avoids shadowing the caller's prop and recursing. -->
			{#snippet itemTemplate(item, index)}
				{@render callerItemTemplate(item, index, {
					selected: isSelected(index),
					multiSelectMode
				})}
			{/snippet}
		</ItemsRepeater>
	</ScrollView>
</div>

<style>
	/* ItemsView.xaml:4-10 — Background Transparent and CornerRadius ControlCornerRadius are the
	   only two visual setters the Style has, and the theme dictionaries are empty
	   (ItemsView_themeresources.xaml:3-7). This control paints nothing else. */
	.root {
		border-radius: var(--winui-ControlCornerRadius);
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
