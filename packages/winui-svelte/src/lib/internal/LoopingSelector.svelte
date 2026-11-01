<script lang="ts" module>
	/** Template-private items host (D26): DatePicker and TimePicker compose this internally. */
	export interface LoopingSelectorProps {
		/** LoopingSelector.Items, narrowed to the text the pickers put in it. */
		items: string[];
		/** LoopingSelector.SelectedIndex. */
		selectedIndex?: number;
		/** Observes a SelectedIndex change without requiring a binding. */
		onSelectedIndexChange?: (index: number) => void;
		/** LoopingSelector.ShouldLoop. */
		shouldLoop?: boolean;
		/** LoopingSelector.ItemHeight. DatePicker_themeresources.xaml:115 sets the presenter row to 40. */
		itemHeight?: number;
		/** The column's accessible name. */
		label?: string | undefined;
		class?: string;
		style?: string;
		/** The LoopingSelector root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	let {
		items,
		selectedIndex = $bindable(0),
		onSelectedIndexChange,
		shouldLoop = false,
		itemHeight = 40,
		label = undefined,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: LoopingSelectorProps = $props();

	const str = useStrings();

	let scroller = $state<HTMLDivElement | null>(null);
	let viewportHeight = $state(0);
	let ignoreNextScrollEnd = false;
	const repetitions = 9;
	const middleBlock = Math.floor(repetitions / 2);
	const renderedItems = $derived(
		shouldLoop ? Array.from({ length: repetitions }, () => items).flat() : items
	);

	function normalizedIndex(index: number): number {
		if (items.length === 0) return 0;
		return shouldLoop
			? ((index % items.length) + items.length) % items.length
			: Math.max(0, Math.min(index, items.length - 1));
	}

	function isSelectedRendered(renderedIndex: number): boolean {
		return shouldLoop
			? renderedIndex === middleBlock * items.length + selectedIndex
			: renderedIndex === selectedIndex;
	}

	/**
	 * The scroll position that puts an item's centre on the viewport's centre. A column that does
	 * not loop opens with a spacer of half the viewport less half an item, so that its first and
	 * last items can reach the centre, and that spacer is part of every item's offset — leaving it
	 * out put the sixth year four rows above where it belongs.
	 */
	function targetScrollTop(index: number): number {
		if (!scroller || items.length === 0) return 0;
		const block = shouldLoop ? middleBlock : 0;
		const leading = shouldLoop ? 0 : (viewportHeight - itemHeight) / 2;
		return Math.max(
			0,
			leading +
				(block * items.length + normalizedIndex(index)) * itemHeight +
				itemHeight / 2 -
				viewportHeight / 2
		);
	}

	function commit(index: number) {
		const next = normalizedIndex(index);
		if (next === selectedIndex) return;
		selectedIndex = next;
		onSelectedIndexChange?.(next);
	}

	function centredItem(): HTMLElement | null {
		if (!scroller) return null;
		const viewportCentre = scroller.scrollTop + scroller.clientHeight / 2;
		return [
			...scroller.querySelectorAll<HTMLElement>('[data-looping-selector-item]')
		].reduce<HTMLElement | null>((nearest, item) => {
			if (!nearest) return item;
			const distance = Math.abs(item.offsetTop + itemHeight / 2 - viewportCentre);
			const nearestDistance = Math.abs(nearest.offsetTop + itemHeight / 2 - viewportCentre);
			return distance < nearestDistance ? item : nearest;
		}, null);
	}

	function selectFromScroll() {
		if (ignoreNextScrollEnd) {
			ignoreNextScrollEnd = false;
			return;
		}
		const item = centredItem();
		if (!item || items.length === 0 || !scroller) return;
		const renderedIndex = Number(item.dataset.renderedIndex);
		commit(renderedIndex % items.length);

		// WinUI normalizes its oversized virtual panel once it leaves its central region
		// (LoopingSelector_Partial.cpp:1132-1142, :1826-1852). Nine DOM repetitions give the
		// same endless range; move back to the middle block without a visible change.
		if (shouldLoop) {
			const block = Math.floor(renderedIndex / items.length);
			const blockOffset = middleBlock - block;
			if (blockOffset !== 0) scroller.scrollTop += blockOffset * items.length * itemHeight;
		}
	}

	function move(direction: -1 | 1) {
		if (items.length === 0) return;
		if (!shouldLoop && (selectedIndex + direction < 0 || selectedIndex + direction >= items.length))
			return;
		commit(selectedIndex + direction);
	}

	// Every dependency is read synchronously. An `await` inside an effect ends its tracking, so
	// a version of this that computed the target after a `tick()` ran once on mount and never
	// again: a selection set from outside — or by this component's own up and down buttons —
	// moved the index and left the column where it was.
	$effect(() => {
		const node = scroller;
		const index = selectedIndex;
		const height = viewportHeight;
		const count = items.length;
		if (!node || count === 0 || height === 0) return;
		const target = targetScrollTop(index);
		// A programmatic selection must not be read back as a user scroll. Half an item is
		// enough tolerance for mandatory snapping to settle without fighting this assignment.
		if (Math.abs(node.scrollTop - target) > itemHeight / 2) {
			ignoreNextScrollEnd = true;
			node.scrollTop = target;
		}
	});

	$effect(() => {
		if (!scroller) return;
		const observer = new ResizeObserver(() => {
			viewportHeight = scroller?.clientHeight ?? 0;
		});
		observer.observe(scroller);
		viewportHeight = scroller.clientHeight;
		return () => observer.disconnect();
	});
</script>

<div
	bind:this={ref}
	class={className}
	{style}
	data-looping-selector
	data-selected-index={selectedIndex}
	{...rest}
>
	<div
		bind:this={scroller}
		class="scroller"
		role="listbox"
		aria-label={label}
		onscrollend={selectFromScroll}
	>
		<div
			class="items"
			style:--looping-selector-item-height={`${itemHeight}px`}
			style:--looping-selector-viewport-height={`${viewportHeight}px`}
		>
			{#if !shouldLoop}<div class="spacer" aria-hidden="true"></div>{/if}
			{#each renderedItems as item, renderedIndex (`${renderedIndex}-${item}`)}
				<div
					class="item"
					data-looping-selector-item
					data-rendered-index={renderedIndex}
					data-selected={isSelectedRendered(renderedIndex) || undefined}
					role="option"
					aria-selected={isSelectedRendered(renderedIndex)}
				>
					<div class="item-content" class:selected={isSelectedRendered(renderedIndex)}>
						{item}
					</div>
				</div>
			{/each}
			{#if !shouldLoop}<div class="spacer" aria-hidden="true"></div>{/if}
		</div>
	</div>
	<button
		class="navigation up"
		type="button"
		aria-label={str('WinUISvelteLoopingSelectorPreviousName')}
		disabled={!shouldLoop && selectedIndex === 0}
		onclick={() => move(-1)}>&#xEDDB;</button
	>
	<button
		class="navigation down"
		type="button"
		aria-label={str('WinUISvelteLoopingSelectorNextName')}
		disabled={!shouldLoop && (items.length === 0 || selectedIndex === items.length - 1)}
		onclick={() => move(1)}>&#xEDDC;</button
	>
</div>

<style>
	[data-looping-selector] {
		box-sizing: border-box;
		position: relative;
		display: block;
		overflow: hidden;
	}

	.scroller {
		height: 100%;
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
		scrollbar-width: none;
	}

	.scroller::-webkit-scrollbar {
		display: none;
	}

	.items {
		position: relative;
	}

	.spacer {
		height: calc(
			(var(--looping-selector-viewport-height) - var(--looping-selector-item-height)) / 2
		);
	}

	.item {
		display: flex;
		height: var(--looping-selector-item-height);
		scroll-snap-align: center;
	}

	.item-content {
		display: flex;
		width: 100%;
		height: 100%;
		margin: var(--winui-LoopingSelectorItemMargin);
		align-items: center;
		justify-content: center;
		/* LoopingSelectorItem's template starts from Transparent (DateTimePickerFlyout_themeresources.xaml:226). */
		background: transparent;
		color: var(--winui-LoopingSelectorItemForeground);
	}

	.item:hover .item-content {
		background: var(--winui-LoopingSelectorItemBackgroundPointerOver);
		color: var(--winui-LoopingSelectorItemForegroundPointerOver);
	}

	.item:active .item-content {
		background: var(--winui-LoopingSelectorItemBackgroundPressed);
		color: var(--winui-LoopingSelectorItemForegroundPressed);
	}

	.item-content.selected {
		background: var(--winui-LoopingSelectorItemBackgroundSelected);
		color: var(--winui-LoopingSelectorItemForegroundSelected);
	}

	.navigation {
		position: absolute;
		z-index: 1;
		left: 0;
		width: 100%;
		height: var(--winui-LoopingSelectorUpDownButtonHeight);
		margin: var(--winui-LoopingSelectorUpDownButtonMargin);
		border: 0;
		padding: 0;
		background: var(--winui-LoopingSelectorUpDownButtonBackground);
		color: var(--winui-LoopingSelectorUpDownButtonForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		/* Measured against the guest: generic.xaml is unavailable, and the arrows match CalendarView. */
		font-size: var(--winui-CalendarViewNavigationButtonFontSize);
		opacity: 0;
		pointer-events: none;
	}

	[data-looping-selector]:hover .navigation {
		opacity: 1;
		pointer-events: auto;
	}

	.up {
		top: 0;
	}

	.down {
		bottom: 0;
	}

	.navigation:hover {
		background: var(--winui-LoopingSelectorUpDownButtonBackgroundPointerOver);
		color: var(--winui-LoopingSelectorUpDownButtonForegroundPointerOver);
	}

	.navigation:active {
		background: var(--winui-LoopingSelectorUpDownButtonBackgroundPressed);
		color: var(--winui-LoopingSelectorUpDownButtonForegroundPressed);
		transform: scale(var(--winui-LoopingSelectorUpDownButtonScalePressed));
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
