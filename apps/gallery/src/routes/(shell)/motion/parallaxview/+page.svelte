<!-- ParallaxViewPage.xaml — the two Gallery examples reproduced below. -->
<script lang="ts">
	import { ListView, ParallaxView, Rectangle, ScrollView } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { groups, itemOf } from '$lib/shell';

	const item = itemOf('/motion/parallaxview');
	if (item === null) throw new Error('ParallaxView page has no Gallery item');
	const listSample = sampleOf('ParallaxView/ParallaxViewParallaxListview.txt');
	const scrollSample = sampleOf('ParallaxView/ParallaxViewParallaxScrollview.txt');
	const items = groups
		.flatMap((group) => group.items)
		.sort((a, b) => a.title.localeCompare(b.title));
	const colours = [
		'aliceblue',
		'antiquewhite',
		'aqua',
		'aquamarine',
		'azure',
		'beige',
		'bisque',
		'blanchedalmond',
		'blueviolet',
		'brown',
		'burlywood',
		'cadetblue',
		'chartreuse',
		'chocolate',
		'coral',
		'cornflowerblue',
		'cornsilk',
		'crimson',
		'cyan'
	];
	let listSource = $state<HTMLElement | null>(null);
	let scrollSource = $state<HTMLDivElement | null>(null);
</script>

<ItemPage {item}>
	<ControlExample
		headerText={listSample.header ?? undefined}
		xaml={listSample.xaml ?? undefined}
		height={750}
	>
		<div class="example-grid" data-vertical-alignment="stretch">
			<!-- ParallaxViewPage.xaml:17-18 sets HorizontalAlignment="Left" VerticalAlignment="Top"
			     and neither reaches the layout: MeasureOverride returns the available size whenever
			     it is finite (ParallaxView.cpp:74-76), so the control's desired size is the whole
			     cell and Left/Top arrange it at the rectangle Stretch would. Nothing is transcribed
			     here on purpose. -->
			<ParallaxView source={listSource} verticalShift={500}
				><img src="/cliff.jpg" alt="cliff" /></ParallaxView
			>
			<!-- ParallaxViewPage.xaml:25-26 — overflowing ListView content desires the cell's full
			     height, so Top and the default Stretch arrange it identically here. -->
			<ListView
				bind:ref={listSource}
				{items}
				key={(entry) => entry.uniqueId}
				class="sample-list"
				aria-label="all samples"
			>
				{#snippet header()}<p class="list-header">
						Scroll the list to see parallaxing of image
					</p>{/snippet}
				{#snippet itemTemplate(entry)}<span class="list-item">{entry.title}</span>{/snippet}
			</ListView>
		</div>
	</ControlExample>

	<ControlExample
		headerText={scrollSample.header ?? undefined}
		xaml={scrollSample.xaml ?? undefined}
		height={750}
	>
		<div class="example-grid" data-vertical-alignment="stretch">
			<!-- ParallaxViewPage.xaml:58-59, and the same reading as example 1's. -->
			<ParallaxView source={scrollSource} verticalShift={500}
				><img src="/cliff.jpg" alt="cliff" /></ParallaxView
			>
			<p class="scroll-header">Scroll the rectangles to see parallaxing of image</p>
			<ScrollView bind:ref={scrollSource} class="sample-scroller">
				<div class="stack">
					{#each colours as colour (colour)}
						<Rectangle fill={colour} style="height: 150px" />
					{/each}
				</div>
			</ScrollView>
		</div>
	</ControlExample>
</ItemPage>

<style>
	.example-grid {
		display: grid;
		/* ParallaxViewPage.xaml:14 and :56 — every child occupies the XAML Grid's one cell. */
		height: 100%;
	}
	.example-grid > :global(*) {
		grid-area: 1 / 1;
		/* A XAML Grid paints its children in order, and the second example's ScrollView and the
		   first's half-transparent ListView are both meant to sit over the image. In CSS the
		   ParallaxView's child carries a `translate`, which lifts it into the positioned-descendant
		   paint step — above the in-flow background of a later sibling, which is why the ListView's
		   50% black was computed, applied, and invisible. `position: relative` puts every cell
		   child in that same step, where tree order decides again. */
		position: relative;
	}
	:global(.sample-list) {
		/* c1-allow: ParallaxViewPage.xaml:28, Background="#80000000" — AARRGGBB, so 50% black. */
		background: #00000080;
	}
	.list-header {
		width: max-content;
		max-width: 280px;
		margin: 0 auto;
		/* c1-allow: ParallaxViewPage.xaml:41, FontSize="28" on the header TextBlock. */
		font-size: 28px;
		/* c1-allow: ParallaxViewPage.xaml:42, Foreground="White". */
		color: #fff;
		/* `width: max-content` under this cap centres a 280px box once it wraps, while XAML centres
		   the wrapped lines' 244px used width; CSS has no length for that used width. */
	}
	.list-item {
		/* WD-051: SystemControlForegroundAltHighBrush is outside the token extractor source set. */
		color: var(--winui-TextOnAccentFillColorPrimaryBrush);
	}
	.scroll-header {
		width: max-content;
		max-width: 280px;
		/* ParallaxViewPage.xaml:67, VerticalAlignment="Top"; the horizontal half is the auto margin. */
		align-self: start;
		margin: 0 auto;
		/* c1-allow: ParallaxViewPage.xaml:68, FontSize="28" on the header TextBlock. */
		font-size: 28px;
		/* c1-allow: ParallaxViewPage.xaml:69, Foreground="White". */
		color: #fff;
	}
	:global(.sample-scroller) {
		width: 150px;
		justify-self: start;
	}
	/* ParallaxViewPage.xaml:76 — the StackPanel the nineteen rectangles sit in. Without it each
	   `Rectangle` is an inline `<svg>` on its own line box and carries the descender space below
	   its baseline: measured, nineteen 150px rows came to 2926 rather than 2850, which is four
	   pixels a row and a parallax rate computed against the wrong extent. */
	.stack {
		display: flex;
		flex-direction: column;
	}
</style>
