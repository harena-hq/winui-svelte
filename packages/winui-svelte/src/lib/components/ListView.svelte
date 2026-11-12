<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SelectionMode } from '../internal/selection';

	/*
	 * `reorderItems` moves one item within this list; the consumer applies the reported move.
	 * Alt+Shift+Arrow moves the focused item (ListViewBaseItem_Partial.cpp:2095-2131). Drag between
	 * lists, upstream's `CanDragItems` and `AllowDrop`, moving several selected items together
	 * (ListViewBase_Partial_Reorder.cpp:662-693), auto-scroll at the edges while dragging, and touch
	 * drag are not built. The dragged item is drawn in the list's own scroll viewport, which clips
	 * it; upstream's drag visual is drawn above the window's content, past the list's edges (seen on
	 * the reference, dragging the Gallery's sample). A change to `items` while a drag is in progress
	 * is not followed: the drag keeps the indexes it started with.
	 *
	 * Three of upstream's reorder values are not used. `ListViewItemDragThemeOpacity` (0.80) is set
	 * on the drag visual (ListViewBaseItem_Partial.cpp:1776-1781), and the Gallery's sample, dragged
	 * on the reference, draws that visual's text at full opacity, so the dragged item here is
	 * opaque. `ListViewItemReorderThemeOpacity` (0.80) fades the item's own container before it
	 * is hidden (ListViewBaseItemPresenter_Partial.cpp:370-391); here the item is the one dragged,
	 * and its slot closes. `ListViewItemReorderHintThemeOffset` (10) moves an item in a reorder hint
	 * state (ListViewBaseItemChrome.cpp:2225-2247), and the pin enters none:
	 * VisualStatesHelper.cpp:146 always chooses `NoReorderHint`.
	 */
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
		onSelectedIndexesChange?: (indexes: number[]) => void;
		/** ListView.IsItemClickEnabled. Defaults to `false`. */
		itemClickEnabled?: boolean;
		/** ItemClick. Its args carry the clicked item. */
		onItemClick?: (item: T, index: number) => void;
		/**
		 * ListView.CanReorderItems. Defaults to `false`. Within this list only; see the header. It
		 * takes effect only with `onItemReorder`, since nothing else can move a record.
		 */
		reorderItems?: boolean;
		/**
		 * No WinUI member: upstream moves the record in its ItemsSource itself
		 * (ListViewBase_Partial_Reorder.cpp:1532-1537). Here the consumer owns `items`, so a
		 * reorder is reported as the item's index before the move and its index after it, and the
		 * consumer moves the record, synchronously, in this callback.
		 */
		onItemReorder?: (fromIndex: number, toIndex: number) => void;
		/** ListView.Header. */
		header?: Snippet;
		/** ListView.Footer. */
		footer?: Snippet;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts" generics="T">
	import { tick } from 'svelte';
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
		onSelectedIndexesChange,
		itemClickEnabled = false,
		onItemClick,
		reorderItems = false,
		onItemReorder,
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

	let drag = $state<{
		from: number;
		pointerId: number;
		startX: number;
		startY: number;
		dx: number;
		dy: number;
		to: number;
		height: number;
		active: boolean;
	} | null>(null);
	let suppressClick = false;
	let dragCentres: number[] = [];

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

	function movedIndex(index: number, from: number, to: number) {
		if (index === from) return to;
		if (from < to && from < index && index <= to) return index - 1;
		if (from > to && to <= index && index < from) return index + 1;
		return index;
	}

	// Without the callback no record can move, so neither does the selection nor focus.
	const reorderable = $derived(reorderItems && onItemReorder !== undefined);

	// Turning reordering off, or taking the callback away, ends a drag in progress unreported.
	$effect(() => {
		if (!reorderable) drag = null;
	});

	function reorder(from: number, to: number) {
		if (from === to || !onItemReorder) return;
		onItemReorder(from, to);
		// ListViewBase_Partial_Reorder.cpp:1540-1545 reselects after remove then insert.
		// Every selected item stays selected: each is carried through the move, and so is the
		// range anchor, which names an item too.
		if (anchor !== null) anchor = movedIndex(anchor, from, to);
		commit(selectedIndexes.map((index) => movedIndex(index, from, to)));
	}

	function shift(index: number) {
		if (!drag?.active) return 0;
		if (drag.from < index && index <= drag.to) return -drag.height;
		if (drag.to <= index && index < drag.from) return drag.height;
		return 0;
	}

	function onPointerDown(event: PointerEvent) {
		suppressClick = false;
		if (!reorderable || event.button !== 0 || !event.isPrimary || event.pointerType === 'touch')
			return;
		const from = indexOf(event.target);
		if (from < 0 || !repeater) return;
		drag = {
			from,
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			dx: 0,
			dy: 0,
			to: from,
			height: repeater.children[from].getBoundingClientRect().height,
			active: false
		};
	}

	function onPointerMove(event: PointerEvent & { currentTarget: EventTarget & HTMLElement }) {
		if (!drag || drag.pointerId !== event.pointerId || !repeater) return;
		// Released where not even the window heard it, such as outside the page.
		if ((event.buttons & 1) === 0) {
			drag = null;
			return;
		}
		drag.dx = event.clientX - drag.startX;
		drag.dy = event.clientY - drag.startY;
		// Upstream starts a mouse drag past twice the system's drag rectangle
		// (ListViewBaseItem_Partial.cpp:54, :1864-1877). Eight is twice Windows' default of four;
		// the metric itself is not read.
		if (!drag.active && (Math.abs(drag.dx) > 8 || Math.abs(drag.dy) > 8)) {
			// Record layout before translate/scale starts; animated rects lag the target shift.
			const top = repeater.getBoundingClientRect().top;
			dragCentres = Array.from(repeater.children, (child) => {
				const rect = child.getBoundingClientRect();
				return rect.top - top + rect.height / 2;
			});
			drag.active = true;
			event.currentTarget.setPointerCapture(drag.pointerId);
		}
		if (!drag.active) return;
		const y = event.clientY - repeater.getBoundingClientRect().top;
		drag.to = dragCentres.filter((centre, index) => index !== drag?.from && centre < y).length;
	}

	async function onPointerUp(event: PointerEvent) {
		if (!drag || drag.pointerId !== event.pointerId) return;
		const { active, from, to } = drag;
		drag = null;
		if (!active || !reorderable) return;
		// Whether the dragged item held focus, read before the move: a keyed list moves its node,
		// which blurs it, and an unkeyed one leaves focus on the index, now another item.
		const focused = repeater?.children[from] === document.activeElement;
		reorder(from, to);
		// The click this release may produce is dispatched before any task queued here, so
		// the guard lasts until then and never reaches a later, unrelated click.
		suppressClick = true;
		setTimeout(() => (suppressClick = false));
		if (!focused || from === to) return;
		await tick();
		// Upstream focuses a dragged item that held focus (ListViewBase_Partial_Reorder.cpp:1352-1366).
		const option = repeater?.children[to] as HTMLElement | undefined;
		option?.focus({ preventScroll: true });
	}

	function onPointerCancel(event: PointerEvent) {
		if (drag?.pointerId === event.pointerId) drag = null;
	}

	// Only the list's own loss of capture ends a drag. Activation moves a pen's implicit capture
	// from the item to the list, and the item's `lostpointercapture` bubbles here.
	function onLostPointerCapture(event: PointerEvent) {
		if (event.target === event.currentTarget) onPointerCancel(event);
	}

	// A pending drag has no capture, so a release outside the list reaches only the window. The
	// list's own `pointerup` runs first and has already cleared one released inside it.
	function onWindowPointerEnd(event: PointerEvent) {
		if (drag && !drag.active && drag.pointerId === event.pointerId) drag = null;
	}

	function onClickCapture(event: MouseEvent) {
		if (!suppressClick) return;
		suppressClick = false;
		event.stopPropagation();
		event.preventDefault();
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

	async function onKeyDown(event: KeyboardEvent) {
		// A drag takes the keyboard: upstream handles every key during one
		// (ListViewBaseItem_Partial.cpp:2069-2074), and a move from the keyboard would leave the
		// drag naming indexes that no longer hold its item. Escape cancels the drag.
		if (drag?.active) {
			event.preventDefault();
			if (event.key === 'Escape') drag = null;
			return;
		}
		const from = indexOf(event.target);
		if (
			reorderable &&
			event.altKey &&
			event.shiftKey &&
			!event.ctrlKey &&
			['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) &&
			from >= 0 &&
			repeater?.children[from] === event.target
		) {
			// Handled even at an end (ListViewBaseItem_Partial.cpp:2095-2131).
			event.preventDefault();
			// A press still short of the threshold names this index; the move would stale it.
			drag = null;
			const to = from + (event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1);
			if (to < 0 || to >= items.length) return;
			reorder(from, to);
			await tick();
			// Focus and bring the moved item into view (ListViewBase_Partial_Reorder.cpp:1963).
			// Stack ItemsRepeater children are the options themselves, with no wrapper.
			const option = repeater?.children[to] as HTMLElement | undefined;
			option?.focus({ preventScroll: true });
			option?.scrollIntoView({ block: 'nearest' });
			return;
		}
		if (event.key !== 'Enter' && event.key !== ' ') return;
		// ListViewItem already prevents this key press's default before it bubbles here.
		interact(indexOf(event.target), event.ctrlKey, event.shiftKey);
	}
</script>

<svelte:window onpointerup={onWindowPointerEnd} onpointercancel={onWindowPointerEnd} />

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<!-- The ScrollViewer at generic.xaml:9002-9021 disables horizontal scrolling and leaves vertical
	     scrolling on Auto. This region is now a ScrollView, which supplies that scrolling. -->
	<ScrollView
		data-scroll-input="scroll-viewer"
		style="flex: 1 1 auto; min-height: 0"
		role="listbox"
		tabindex="-1"
		aria-multiselectable={selectionMode === 'multiple' || selectionMode === 'extended'}
		onclick={onClick}
		onkeydown={onKeyDown}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerCancel}
		onlostpointercapture={onLostPointerCapture}
		onclickcapture={onClickCapture}
	>
		{#if header}<div class="header">{@render header()}</div>{/if}
		<!-- ItemsRepeater's omitted layout is its vertical StackLayout with no spacing, matching
		     ItemsStackPanel. The four pixels between rows are ListViewItem's background inset;
		     adding spacing here would double the rhythm. -->
		<ItemsRepeater bind:ref={repeater} {items} {key}>
			{#snippet itemTemplate(item, index)}
				<ListViewItem
					selected={isSelected(index)}
					data-dragging={drag?.active && index === drag.from ? '' : undefined}
					data-reorder-target={drag?.active && index !== drag.from ? '' : undefined}
					style={drag?.active
						? `translate: ${index === drag.from ? `${drag.dx}px ${drag.dy}px` : `0 ${shift(index)}px`}`
						: undefined}
				>
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

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
		/* Holds the consumer's own layout, which the browser still forces. */
		.header {
			forced-color-adjust: auto;
		}
		/* Holds the consumer's own layout, which the browser still forces. */
		.footer {
			forced-color-adjust: auto;
		}
	}
</style>
