<script lang="ts">
	import { GridView } from 'winui-svelte';

	const tiles = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
	let picked = $state<number[]>([]);
</script>

<svelte:head><title>GridView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">GridView</h1>
<p class="winui-BodyTextBlockStyle">A wrapping grid that owns selection and its item containers.</p>

<h2 class="winui-SubtitleTextBlockStyle">single selection — the default</h2>
<div class="row">
	<GridView items={tiles} selectedIndexes={[1]} {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">multiple selection</h2>
<div class="row">
	<GridView items={tiles} selectionMode="multiple" selectedIndexes={[0, 2, 5]} {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">extended selection</h2>
<div class="row">
	<GridView items={tiles} selectionMode="extended" selectedIndexes={[2, 3]} {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">no selection</h2>
<div class="row">
	<GridView items={tiles} selectionMode="none" {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a header and a footer</h2>
<div class="row">
	<GridView items={tiles} selectedIndexes={[0]} {itemTemplate} {header} {footer} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">selection the page owns</h2>
<div class="row">
	<GridView items={tiles} selectionMode="multiple" bind:selectedIndexes={picked} {itemTemplate} />
</div>
<p class="winui-BodyTextBlockStyle">{picked.join(', ') || 'nothing'}</p>

{#snippet itemTemplate(label: string)}
	<div class="tile">
		<span class="winui-BodyTextBlockStyle">{label}</span>
		<div class="swatch"></div>
	</div>
{/snippet}

{#snippet header()}
	<div class="band"><span class="winui-BodyStrongTextBlockStyle">Pictures</span></div>
{/snippet}

{#snippet footer()}
	<div class="band"><span class="winui-CaptionTextBlockStyle">8 pictures</span></div>
{/snippet}

<style>
	.row {
		display: block;
		width: 560px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	.band {
		padding: 8px 16px;
	}

	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 120px;
		height: 80px;
	}

	/* Ink rather than a card fill. Under high contrast every `…CardBackgroundFill…` and every
	   accent brush resolves to `SystemColorWindowColor` — the page's own background — and a
	   swatch painted with one is invisible in the theme where this page most needs to show that
	   the child rendered at all. */
	.swatch {
		width: 64px;
		height: 12px;
		background: var(--winui-TextFillColorPrimaryBrush);
	}
</style>
