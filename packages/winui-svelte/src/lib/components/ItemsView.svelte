<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ItemsRepeaterLayout } from './ItemsRepeater.svelte';

	/*
	 * `ScrollView`, `VerticalScrollController`, `TryGetItemIndex`, and `StartBringItemIntoView`
	 * are absent because this viewport is `overflow: auto`, not a `ScrollView` object with a
	 * controller to hand back. The real ScrollView is its own control and tranche. `Select`,
	 * `Deselect`, `IsSelected`, `SelectAll`, `DeselectAll`, and `InvertSelection` are six
	 * imperative methods expressible by assigning bindable `selectedIndexes`: this library
	 * publishes state, not commands, as ItemsRepeater did for its three imperative members.
	 * `CurrentItemIndex` is the focused item's index, but this control does not manage focus
	 * between items; WD-027 records that divergence. `ItemTransitionProvider` is animation,
	 * which the roadmap's Motion tranche owns. `Padding`, which upstream binds to the repeater's
	 * Margin, is absent because `class` and `style` are D21's escape hatch and a `padding` prop
	 * would be a second way to say one thing. `SelectionChanged` has empty upstream event args
	 * (ItemsView.idl:23-27), so `onSelectionChanged` reports the new selection instead.
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
		selectionMode?: 'none' | 'single' | 'multiple' | 'extended';
		/**
		 * ItemsView.SelectedItems, held as indexes rather than items — an index is what every
		 * selector method upstream takes, and what identifies an item this control cannot compare
		 * by value.
		 */
		selectedIndexes?: number[];
		/** SelectionChanged. Its upstream args are empty, so this reports the new selection. */
		onSelectionChanged?: (indexes: number[]) => void;
		/** ItemsView.IsItemInvokedEnabled. Defaults to `false`. */
		isItemInvokedEnabled?: boolean;
		/** ItemInvoked. Its args carry the invoked item (ItemsView.idl:17-20). */
		onItemInvoked?: (item: T, index: number) => void;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts" generics="T">
	import ItemsRepeater from './ItemsRepeater.svelte';

	let {
		items,
		itemTemplate: callerItemTemplate,
		key,
		layout,
		selectionMode = 'single',
		selectedIndexes = $bindable([]),
		onSelectionChanged,
		isItemInvokedEnabled = false,
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
		onSelectionChanged?.(sorted);
	}

	const range = (from: number, to: number) => {
		const [lo, hi] = from <= to ? [from, to] : [to, from];
		return Array.from({ length: hi - lo + 1 }, (_, index) => lo + index);
	};

	// SingleSelector::OnInteractedAction, ItemsView/SingleSelector.cpp:25-45. The model is put
	// in single-select first, so a plain click always moves the selection rather than adding to
	// it; Ctrl is the only way to end up with nothing selected.
	function interactSingle(index: number, ctrl: boolean) {
		if (!ctrl || !isSelected(index)) commit([index]);
		else commit([]);
	}

	// MultipleSelector::OnInteractedAction, ItemsView/MultipleSelector.cpp:18-63. A Shift range
	// takes the anchor's own state: it selects the range when the anchor is selected and
	// deselects it when the anchor is not, and does nothing when the two already agree.
	function interactMultiple(index: number, shift: boolean) {
		if (shift && anchor !== null) {
			const anchorSelected = isSelected(anchor);
			if (anchorSelected === isSelected(index)) return;
			const span = range(anchor, index);
			commit(
				anchorSelected
					? [...selectedIndexes, ...span]
					: selectedIndexes.filter((selectedIndex) => !span.includes(selectedIndex))
			);
			return;
		}
		commit(
			isSelected(index)
				? selectedIndexes.filter((selectedIndex) => selectedIndex !== index)
				: [...selectedIndexes, index]
		);
	}

	// ExtendedSelector::OnInteractedAction, ItemsView/ExtendedSelector.cpp:18-53. Note the last
	// branch: a plain click on an item that is already selected changes nothing, which is what
	// keeps a multi-item selection alive under a click that is about to become a drag.
	function interactExtended(index: number, ctrl: boolean, shift: boolean) {
		if (shift && anchor !== null) commit(range(anchor, index));
		else if (ctrl)
			commit(
				isSelected(index)
					? selectedIndexes.filter((selectedIndex) => selectedIndex !== index)
					: [...selectedIndexes, index]
			);
		else if (!isSelected(index)) commit([index]);
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
		if (isItemInvokedEnabled) onItemInvoked?.(items[index], index);
		if (selectionMode === 'none') return;
		if (selectionMode === 'single') interactSingle(index, ctrl);
		else if (selectionMode === 'multiple') interactMultiple(index, shift);
		else interactExtended(index, ctrl, shift);
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
	<div
		class="viewport"
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
	</div>
</div>

<style>
	/* ItemsView.xaml:4-10 — Background Transparent and CornerRadius ControlCornerRadius are the
	   only two visual setters the Style has, and the theme dictionaries are empty
	   (ItemsView_themeresources.xaml:3-7). This control paints nothing else. */
	.root {
		border-radius: var(--winui-ControlCornerRadius);
	}

	/* PART_ScrollView (ItemsView.xaml:19-27). A real ScrollView is its own control and its own
	   tranche; what the view needs here is the viewport, and the scrollbar rules below are
	   NavigationView's, which reproduce ScrollBar_themeresources.xaml's two states. */
	.viewport {
		height: 100%;
		overflow: auto;
		border-radius: inherit;
	}

	/* `ScrollBarSize` is 12 and `ScrollBarVerticalThumbMinWidth` is 8 —
	   ScrollBar_themeresources.xaml:180 and :182 — where the browser's default rail is half
	   again as wide. The thumb is inset into the rail with a transparent border, so both
	   numbers are the source's rather than one being the other minus a guess. The real
	   ScrollBar, with the collapse and expand its visual states drive, is the Scrolling
	   tranche's. */
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
		/* The source's `Collapsed` state names 8 — ScrollBar_themeresources.xaml:543 — and
		   what Windows renders at rest is thinner than that. 5 of border in a 12 rail
		   leaves the 2 the original draws. */
		/* c1-allow: measured 2px on a capture of the real Gallery's pane */
		border: 5px solid transparent;
		/* A capsule at both widths. `border-radius` applies to the border box and the
		   visible thumb is the padding box, so the radius it sees is this minus the border:
		   1 against a 2 wide thumb at rest, 3 against a 6 wide one on hover. Half of
		   `ScrollBarSize` is the number that makes both come out round. */
		/* c1-allow: ScrollBar_themeresources.xaml:180, half of ScrollBarSize 12 */
		border-radius: 6px;
	}

	/* `Expanded` — ScrollBar_themeresources.xaml:587, the rail at `ScrollBarSize` with the
	   thumb at `ScrollBarVerticalThumbMinWidth`. WinUI animates between the two; a hover
	   rule is the same two states without the animation. */
	/* Measured on the original with the pointer over it: the track fills with
	   `ScrollBarTrackFillPointerOver` — `AcrylicInAppFillColorDefaultBrush`,
	   ScrollBar_themeresources.xaml:32 — across the full 12, and the thumb inside it is 6,
	   not the 8 the `Expanded` state's own number suggests. The padding either side of the
	   thumb is what makes it read as thinner than a bar drawn edge to edge. */
	.viewport:hover::-webkit-scrollbar-track {
		background: var(--winui-AcrylicInAppFillColorDefaultBrush);
	}

	.viewport:hover::-webkit-scrollbar-thumb {
		/* c1-allow: measured 6px of thumb inside the 12 of ScrollBarSize on the original */
		border: 3px solid transparent;
	}
</style>
