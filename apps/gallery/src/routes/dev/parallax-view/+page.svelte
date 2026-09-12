<script lang="ts">
	import { ListView, ParallaxView, ScrollView } from 'winui-svelte';

	const listItems = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'];
	let scrollSource = $state<HTMLDivElement | null>(null);
	let listSource = $state<HTMLElement | null>(null);
	let horizontalSource = $state<HTMLDivElement | null>(null);
	let stillSource = $state<HTMLDivElement | null>(null);
	let scrolledSource = $state<HTMLDivElement | null>(null);
</script>

<svelte:head><title>ParallaxView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ParallaxView</h1>

<div class="rows">
	<section>
		<h2>vertical shift over a ScrollView</h2>
		<div class="pair">
			<ParallaxView source={scrollSource} verticalShift={500} class="parallax"
				><img src="/cliff.jpg" alt="cliff" /></ParallaxView
			>
			<ScrollView bind:ref={scrollSource} class="source"
				><div class="tall">Scrollable content</div></ScrollView
			>
		</div>
	</section>
	<section>
		<h2>vertical shift over a ListView</h2>
		<div class="pair">
			<ParallaxView source={listSource} verticalShift={500} class="parallax"
				><img src="/cliff.jpg" alt="cliff" /></ParallaxView
			>
			<ListView bind:ref={listSource} items={listItems} class="source">
				{#snippet itemTemplate(item)}<div class="list-row">{item}</div>{/snippet}
			</ListView>
		</div>
	</section>
	<section>
		<h2>horizontal shift</h2>
		<div class="pair">
			<ParallaxView source={horizontalSource} horizontalShift={300} class="parallax"
				><img src="/cliff.jpg" alt="cliff" /></ParallaxView
			>
			<ScrollView bind:ref={horizontalSource} class="source" contentOrientation="horizontal"
				><div class="wide">Horizontal content</div></ScrollView
			>
		</div>
	</section>
	<section>
		<h2>nothing to scroll</h2>
		<div class="pair">
			<ParallaxView source={stillSource} verticalShift={500} class="parallax"
				><img src="/cliff.jpg" alt="cliff" /></ParallaxView
			>
			<ScrollView bind:ref={stillSource} class="source"><div>Content fits.</div></ScrollView>
		</div>
	</section>
	<section>
		<h2>already scrolled</h2>
		<div class="pair">
			<ParallaxView source={scrolledSource} verticalShift={500} class="parallax"
				><img src="/cliff.jpg" alt="cliff" /></ParallaxView
			>
			<ScrollView bind:ref={scrolledSource} class="source" verticalOffset={250}
				><div class="tall">Scrollable content</div></ScrollView
			>
		</div>
	</section>
</div>

<style>
	/* Layout arithmetic only — every declaration here is a harness dimension, and C1 scopes
	   itself to the value families that carry the theme, so none of it needs an exemption.
	   The row is wide enough for both controls and the gap between them; a narrower one let
	   each pair overflow into the pair beside it. */
	.rows {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		align-items: flex-start;
	}
	section {
		width: 566px;
	}
	.pair {
		display: grid;
		grid-template-columns: 400px 150px;
		gap: 16px;
	}
	:global(.parallax) {
		width: 400px;
		height: 200px;
	}
	:global(.source) {
		width: 150px;
		height: 200px;
	}
	/* The three content boxes, sized so that rows 1, 2, 3 and 5 scroll and row 4 does not. */
	.tall {
		min-height: 700px;
	}
	.wide {
		width: 600px;
	}
	.list-row {
		height: 100px;
	}
</style>
