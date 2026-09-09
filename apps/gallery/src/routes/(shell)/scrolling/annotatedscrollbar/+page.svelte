<script lang="ts">
	import { AnnotatedScrollBar, ScrollView, Slider } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/scrolling/annotatedscrollbar');
	if (item === null) throw new Error('AnnotatedScrollBar page has no Gallery item');
	const linkedSample = sampleOf('AnnotatedScrollBar/AnnotatedscrollbarLinkedScrollview.txt');

	// AnnotatedScrollBarPage.xaml.cs:14-23 — the five runs of the source collection, and the
	// 120 by 90 an item occupies in the ItemsRepeater. The tile itself is 112 by 82 with a
	// margin of 4 (AnnotatedScrollBarPage.xaml:37-42), which is where the pitch comes from.
	const RUNS = [
		{ name: 'Azure', count: 32 },
		{ name: 'Crimson', count: 50 },
		{ name: 'Cyan', count: 8 },
		{ name: 'Fuchsia', count: 70 },
		{ name: 'Gold', count: 90 }
	];
	const ITEM_WIDTH = 120;
	const ITEM_HEIGHT = 90;

	/** `PopulateColorCollection` (`:69-105`), as one flat list of 250 colour names. */
	const TILES = RUNS.flatMap((run) => Array.from({ length: run.count }, () => run.name));

	/** The index of the first tile of each run — what `PopulateLabelCollection` (`:107-122`) labels. */
	const RUN_STARTS = RUNS.map((_, index) =>
		RUNS.slice(0, index).reduce((total, run) => total + run.count, 0)
	);
	/** The index of the last tile of each run, which `GetOffsetLabel` (`:124-146`) compares against. */
	const RUN_ENDS = RUNS.map((run, index) => RUN_STARTS[index] + run.count - 1);

	let tileGrid = $state<HTMLDivElement | null>(null);
	let tileGridWidth = $state(0);
	let extentHeight = $state(0);
	let viewportHeight = $state(0);
	let verticalOffset = $state(0);
	// AnnotatedScrollBarPage.xaml:69 — the Slider's own starting Value, and the bar's MaxHeight.
	let maxHeight = $state(500);

	// `ItemsRepeater_SizeChanged` (`:51-56`): a resize changes how many items a row holds, which
	// moves every label. `GetItemsPerRow` (`:177-180`) is the repeater's width over the item width,
	// floored, and never less than one.
	const itemsPerRow = $derived(Math.max(Math.floor(tileGridWidth / ITEM_WIDTH), 1));

	/** `GetOffsetOfItem` (`:148-151`). */
	const offsetOfItem = $derived(
		(itemIndex: number) => ITEM_HEIGHT * Math.floor(itemIndex / itemsPerRow)
	);

	const labels = $derived(
		RUNS.map((run, index) => ({ content: run.name, scrollOffset: offsetOfItem(RUN_STARTS[index]) }))
	);

	// `GetOffsetLabel` (`:124-146`) answers with the colour of the last item in the row the offset
	// falls on, which is the run whose final item sits at or below it.
	const labelForOffset = $derived((offset: number) => {
		const run = RUNS.find((_, index) => offset <= offsetOfItem(RUN_ENDS[index]));
		return (run ?? RUNS[RUNS.length - 1]).name;
	});

	$effect(() => {
		const grid = tileGrid;
		if (!grid) return;
		const observer = new ResizeObserver(() => (tileGridWidth = grid.clientWidth));
		observer.observe(grid);
		tileGridWidth = grid.clientWidth;
		return () => observer.disconnect();
	});
</script>

<ItemPage {item}>
	<ControlExample
		headerText={linkedSample.header ?? undefined}
		xaml={linkedSample.xaml ?? undefined}
		csharp={linkedSample.csharp ?? undefined}
	>
		<!-- AnnotatedScrollBarPage.xaml:20-55 — `ColumnDefinitions="*, Auto"`. -->
		<div class="sample-grid">
			<ScrollView
				class="tiles-view"
				verticalScrollBarVisibility="hidden"
				bind:extentHeight
				bind:viewportHeight
				bind:verticalOffset
			>
				<div bind:this={tileGrid} class="tiles">
					{#each TILES as colour, index (index)}
						<div class="tile" data-colour={colour}></div>
					{/each}
				</div>
			</ScrollView>
			<!-- `scrollView.ScrollPresenter.VerticalScrollController = annotatedScrollBar.ScrollController`
			     (`:41`), in the shape this library has: the four numbers `IScrollController.SetValues`
			     carries are read off the ScrollView's own published measurements, and the bar writes
			     the offset back. -->
			<AnnotatedScrollBar
				class="bar"
				style="max-height: {maxHeight}px"
				{labels}
				maximum={Math.max(0, extentHeight - viewportHeight)}
				viewportSize={viewportHeight}
				value={verticalOffset}
				onValueChange={(offset) => (verticalOffset = offset)}
				detailLabelRequested={labelForOffset}
			/>
		</div>
		{#snippet options()}
			<!-- AnnotatedScrollBarPage.xaml:57-71. -->
			<div class="options">
				<p class="option-text winui-BodyTextBlockStyle">
					Changing the AnnotatedScrollBar height refreshes its Labels layout.
				</p>
				<Slider
					class="height-slider"
					header="AnnotatedScrollBar maximum height:"
					min={100}
					max={500}
					bind:value={maxHeight}
				/>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.sample-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: start;
		/* The `*` column is the whole point of `MaxWidth="800"` on the ScrollView: without a width
		   to divide, a shrink-to-fit grid gives column 0 its own minimum and the tile grid comes
		   out one column wide. `ControlExample`'s pane is a flex column whose default
		   `HorizontalContentAlignment` is Left, so the sample has to claim the width itself. */
		width: 100%;
	}

	/* AnnotatedScrollBarPage.xaml:21-26 — `MaxWidth="800"`, `MaxHeight="500"`, and a background
	   the sample picks by name.

	   The height is written as `height` rather than `max-height`, which is what the source says:
	   ScrollView's viewport is a grid item in an `auto` row, and an `auto` row is sized to its
	   content, so a `max-height` clips the root and leaves the viewport as tall as the 250 tiles —
	   22504 pixels, measured — and nothing scrolls. A definite height is what this library's
	   ScrollView takes, and the used height is 500 either way: the tile grid is never shorter than
	   the maximum. */
	:global(.tiles-view) {
		max-width: 800px;
		height: 500px;
		/* c1-allow: AnnotatedScrollBarPage.xaml:25 — the sample's own `Background="LightGray"`. */
		background: lightgray;
	}

	.tiles {
		/* `UniformGridLayout` inside an `ItemsRepeater` with `Margin="2"` (`:27-34`): as many
		   120-wide columns as fit, the remainder left at the end of the row. */
		display: grid;
		grid-template-columns: repeat(auto-fill, 120px);
		justify-content: start;
		margin: 2px;
	}

	.tile {
		/* `Width="112" Height="82" Margin="4" CornerRadius="4"` (`:37-42`), which is the 120 by 90
		   pitch the label offsets are computed from. */
		width: 112px;
		height: 82px;
		margin: 4px;
		border-radius: 4px; /* c1-allow: AnnotatedScrollBarPage.xaml:42 — CornerRadius="4". */
	}

	/* The five `Microsoft.UI.Colors` the sample names (`:71`, `:78`, `:85`, `:92`, `:99`). */
	.tile[data-colour='Azure'] {
		/* c1-allow: AnnotatedScrollBarPage.xaml.cs:71 — `new SolidColorBrush(Colors.Azure)`. */
		background: azure;
	}
	.tile[data-colour='Crimson'] {
		/* c1-allow: AnnotatedScrollBarPage.xaml.cs:78 — `new SolidColorBrush(Colors.Crimson)`. */
		background: crimson;
	}
	.tile[data-colour='Cyan'] {
		/* c1-allow: AnnotatedScrollBarPage.xaml.cs:85 — `new SolidColorBrush(Colors.Cyan)`. */
		background: cyan;
	}
	.tile[data-colour='Fuchsia'] {
		/* c1-allow: AnnotatedScrollBarPage.xaml.cs:92 — `new SolidColorBrush(Colors.Fuchsia)`. */
		background: fuchsia;
	}
	.tile[data-colour='Gold'] {
		/* c1-allow: AnnotatedScrollBarPage.xaml.cs:99 — `new SolidColorBrush(Colors.Gold)`. */
		background: gold;
	}

	/* AnnotatedScrollBarPage.xaml:48-54 — `Margin="4,0,48,0"`, `HorizontalAlignment="Right"`, and
	   a `MaxHeight` the Slider drives. The bar stretches into the row the ScrollView sizes, up to
	   that maximum, which is what gives it the height its own `*` row needs. */
	:global(.bar) {
		align-self: stretch;
		justify-self: end;
		margin: 0 48px 0 4px;
	}

	.options {
		display: grid;
		min-width: 200px; /* c1-allow: AnnotatedScrollBarPage.xaml:58 — Grid MinWidth="200". */
	}

	.option-text {
		margin: 0;
		align-self: center;
	}

	:global(.height-slider) {
		margin-top: 10px; /* c1-allow: AnnotatedScrollBarPage.xaml:64 — Margin="0,10,0,0". */
	}
</style>
