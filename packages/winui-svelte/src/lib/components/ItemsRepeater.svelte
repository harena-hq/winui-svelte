<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/*
	 * ItemsRepeater draws no chrome and reads no token: laying out caller-drawn items is the
	 * whole control. `ItemsRepeater.Background` is deliberately absent because `class` and
	 * `style` are D21's escape hatch, and the token cascade already covers the rest; a
	 * `background` prop would be a second way to say one thing. WD-026: virtualisation is
	 * absent; see docs/divergences.md. `HorizontalCacheLength` and `VerticalCacheLength` are
	 * virtualisation buffers; `ElementPrepared`, `ElementClearing`, and `ElementIndexChanged`
	 * are its lifecycle; and `GetElementIndex`, `TryGetElement`, and `GetOrCreateElement` are
	 * imperative access to realized elements, so none are carried. `ItemTransitionProvider` is
	 * animation, which the roadmap's Motion tranche owns.
	 */

	/** StackLayout. */
	export interface StackLayoutOptions {
		/** Not a WinUI member: identifies the upstream `StackLayout` class. */
		kind: 'stack';
		/** StackLayout.Orientation. Defaults to `Vertical`. */
		orientation?: 'vertical' | 'horizontal';
		/** StackLayout.Spacing. Defaults to `0.0`. */
		spacing?: number;
	}

	/** UniformGridLayout. */
	export interface UniformGridLayoutOptions {
		/** Not a WinUI member: identifies the upstream `UniformGridLayout` class. */
		kind: 'uniformGrid';
		/** UniformGridLayout.Orientation. Defaults to `Horizontal`. */
		orientation?: 'horizontal' | 'vertical';
		/** UniformGridLayout.MinItemWidth. Defaults to the first item's desired width. */
		minItemWidth?: number;
		/** UniformGridLayout.MinItemHeight. Defaults to the first item's desired height. */
		minItemHeight?: number;
		/** UniformGridLayout.MinRowSpacing. Defaults to `0.0`. */
		minRowSpacing?: number;
		/** UniformGridLayout.MinColumnSpacing. Defaults to `0.0`. */
		minColumnSpacing?: number;
		/**
		 * UniformGridLayout.ItemsStretch. Defaults to `None`; upstream's `Uniform` member is
		 * deferred because it needs a JavaScript layout pass.
		 */
		itemsStretch?: 'none' | 'fill';
		/**
		 * UniformGridLayout.MaximumRowsOrColumns — a cap on the items one line may hold. Upstream's
		 * default is `-1` read as an unsigned int, which is no cap at all; a value below 1 is
		 * clamped to 1 (`UniformGridLayout.cpp:338`). Omitted here means uncapped.
		 */
		maximumRowsOrColumns?: number;
		/** UniformGridLayout.ItemsJustification. Defaults to `Start`. */
		itemsJustification?:
			'start' | 'center' | 'end' | 'spaceAround' | 'spaceBetween' | 'spaceEvenly';
	}

	/** ItemsRepeater.Layout. */
	export type ItemsRepeaterLayout = StackLayoutOptions | UniformGridLayoutOptions;

	/** ItemsRepeater. */
	export interface ItemsRepeaterProps<T> {
		/** ItemsRepeater.ItemsSource, deliberately named `items` by ADR 0013. */
		items: T[];
		/** ItemsRepeater.ItemTemplate. */
		itemTemplate: Snippet<[T, number]>;
		/** No WinUI member: Svelte identity for DOM reuse. */
		key?: (item: T, index: number) => string | number;
		/** ItemsRepeater.Layout. An omitted layout is the default `StackLayout`. */
		layout?: ItemsRepeaterLayout;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts" generics="T">
	let {
		items,
		itemTemplate,
		key,
		layout,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ItemsRepeaterProps<T> = $props();

	const kind = $derived(layout?.kind ?? 'stack');
	const orientation = $derived(
		layout?.orientation ?? (kind === 'stack' ? 'vertical' : 'horizontal')
	);
	const spacing = $derived(
		kind === 'stack' ? ((layout as StackLayoutOptions | undefined)?.spacing ?? 0) : 0
	);
	const grid = $derived(kind === 'uniformGrid' ? (layout as UniformGridLayoutOptions) : null);
	const horizontal = $derived(orientation === 'horizontal');

	let measured = $state<{ width: number; height: number } | null>(null);

	const needsMeasure = $derived(
		kind === 'uniformGrid' &&
			(grid?.minItemWidth === undefined || grid?.minItemHeight === undefined)
	);

	// One measurement per change of input, never a measurement of our own output. While
	// `measured` is null the root is laid out as a start-aligned column, so item 0 reports the
	// size it wants rather than the size a track gave it; the grid template follows from that and
	// nothing sets `measured` again until an input changes. Measuring inside the grid instead
	// would feed a track's width back into the number that produced it.
	//
	// The dependencies are scalars and one array reference, deliberately — `layout` is usually an
	// object literal in the caller's markup and is therefore a new object on every render of that
	// component, so depending on it would re-measure for no reason. Re-running this effect when
	// `measured` is already null assigns null to null, which Svelte does not schedule, so the two
	// effects cannot chase each other.
	$effect(() => {
		void items;
		void kind;
		void orientation;
		void grid?.minItemWidth;
		void grid?.minItemHeight;
		measured = null;
	});

	$effect(() => {
		if (!needsMeasure || measured !== null) return;
		const first = ref?.firstElementChild;
		if (!first) return;
		const box = first.getBoundingClientRect();
		measured = { width: box.width, height: box.height };
	});

	const cellWidth = $derived(grid?.minItemWidth ?? measured?.width ?? null);
	const cellHeight = $derived(grid?.minItemHeight ?? measured?.height ?? null);
	const measuring = $derived(kind === 'uniformGrid' && (cellWidth === null || cellHeight === null));

	// Along the line, and across it. Horizontal wraps into rows, so the line runs along the
	// width; vertical wraps into columns, so it runs along the height.
	const lineCell = $derived(horizontal ? cellWidth : cellHeight);
	const crossCell = $derived(horizontal ? cellHeight : cellWidth);

	// `min(what fits, the cap)` is upstream's GetItemsPerLine (UniformGridLayout.cpp:333-352),
	// and CSS computes the first half for us — `repeat(auto-fill, …)` already fits as many
	// tracks as the container's line extent allows. Capping is therefore a question of taking
	// that extent away from it, and the two stretch modes need it taken away differently.
	const cap = $derived(
		grid?.maximumRowsOrColumns === undefined
			? null
			: Math.max(1, Math.trunc(grid.maximumRowsOrColumns))
	);
	const lineGap = $derived(horizontal ? (grid?.minColumnSpacing ?? 0) : (grid?.minRowSpacing ?? 0));

	// Without Fill the layout narrows itself to the capped line and the items keep their size
	// (UniformGridLayout.cpp:216-235), which is exactly a maximum extent along the line: the
	// grid's own `auto-fill` then cannot fit more than the cap.
	const lineMax = $derived(
		measuring || cap === null || grid?.itemsStretch === 'fill'
			? null
			: `${cap * (lineCell ?? 0) + (cap - 1) * lineGap}px`
	);
	const maxWidth = $derived(horizontal ? lineMax : null);
	const maxHeight = $derived(horizontal ? null : lineMax);

	// With Fill the extent stays the whole available width and the items divide it, so the
	// extent cannot be the lever. Raising each track's *minimum* to the share a capped line
	// would give it is: `auto-fill` fits at most `cap` of them, and `1fr` still stretches them
	// across everything available. Where the container is narrower than that share, `max()`
	// falls back to the cell and fewer tracks fit, which is `min(what fits, the cap)` again.
	const fillMin = $derived(
		cap === null
			? `${lineCell}px`
			: `max(${lineCell}px, calc((100% - ${(cap - 1) * lineGap}px) / ${cap}))`
	);
	const track = $derived(
		grid?.itemsStretch === 'fill' ? `minmax(${fillMin}, 1fr)` : `${lineCell}px`
	);
	const templateColumns = $derived(measuring || !horizontal ? null : `repeat(auto-fill, ${track})`);
	const templateRows = $derived(measuring || horizontal ? null : `repeat(auto-fill, ${track})`);
	const autoRows = $derived(measuring || !horizontal ? null : `${crossCell}px`);
	const autoColumns = $derived(measuring || horizontal ? null : `${crossCell}px`);
	const justification = $derived(
		measuring || kind === 'stack'
			? null
			: {
					start: 'start',
					center: 'center',
					end: 'end',
					spaceAround: 'space-around',
					spaceBetween: 'space-between',
					spaceEvenly: 'space-evenly'
				}[grid?.itemsJustification ?? 'start']
	);
	const columnGap = $derived(
		kind === 'stack' ? `${spacing}px` : `${grid?.minColumnSpacing ?? 0}px`
	);
	const rowGap = $derived(kind === 'stack' ? `${spacing}px` : `${grid?.minRowSpacing ?? 0}px`);

	// The upstream names gaps by their role, but CSS names physical axes: a vertical line's item
	// gap is still vertical. Therefore column-gap is always MinColumnSpacing and row-gap is always
	// MinRowSpacing; no physical swap is needed.
</script>

<div
	bind:this={ref}
	class={['root', className]}
	{style}
	data-layout={kind}
	data-measuring={measuring ? 'true' : null}
	style:grid-template-columns={templateColumns}
	style:grid-template-rows={templateRows}
	style:grid-auto-rows={autoRows}
	style:grid-auto-columns={autoColumns}
	style:max-width={maxWidth}
	style:max-height={maxHeight}
	style:column-gap={columnGap}
	style:row-gap={rowGap}
	style:justify-content={horizontal ? justification : null}
	style:align-content={horizontal ? null : justification}
	data-orientation={orientation}
	{...rest}
>
	{#each items as entry, index (key ? key(entry, index) : index)}
		{@render itemTemplate(entry, index)}
	{/each}
</div>

<style>
	.root[data-layout='stack'] {
		display: flex;
	}

	.root[data-layout='stack'][data-orientation='vertical'] {
		flex-direction: column;
	}

	.root[data-layout='stack'][data-orientation='horizontal'] {
		flex-direction: row;
	}

	.root[data-layout='uniformGrid'] {
		display: grid;
		align-content: start;
		justify-content: start;
	}

	.root[data-layout='uniformGrid'][data-orientation='vertical'] {
		grid-auto-flow: column;
	}

	/* The measuring pass. Item 0 is asked what size it wants, so the root is a start-aligned
	   column for one frame and no track has been computed yet. */
	.root[data-layout='uniformGrid'][data-measuring='true'] {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
</style>
