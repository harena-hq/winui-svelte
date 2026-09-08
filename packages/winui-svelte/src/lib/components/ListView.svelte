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
	<div
		class="viewport"
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
	</div>
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

	/* The ScrollViewer at generic.xaml:9002-9021, whose attached settings on the Style disable
	   horizontal scrolling and leave vertical on Auto. A real ScrollViewer is its own control
	   and its own tranche; what this needs is the viewport, and the scrollbar rules below are
	   the same ones NavigationView and ItemsView carry — one reproduction of
	   ScrollBar_themeresources.xaml's two states, copied rather than shared because a Svelte
	   component's styles are scoped to it. The Scrolling tranche is where that stops. */
	.viewport {
		flex: 1 1 auto;
		min-height: 0;
		overflow: auto;
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
