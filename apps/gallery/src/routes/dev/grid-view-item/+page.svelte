<script lang="ts">
	import { GridViewItem } from 'winui-svelte/preview';
</script>

<svelte:head><title>GridViewItem — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">GridViewItem</h1>
<p class="winui-BodyTextBlockStyle">A grid item with native-presenter selection chrome.</p>

<h2 class="winui-SubtitleTextBlockStyle">at rest</h2>
<div class="row">
	<GridViewItem>{@render tile('One')}</GridViewItem>
	<GridViewItem>{@render tile('Two')}</GridViewItem>
	<GridViewItem>{@render tile('Three')}</GridViewItem>
	<GridViewItem>{@render tile('Four')}</GridViewItem>
</div>

<h2 class="winui-SubtitleTextBlockStyle">selected</h2>
<div class="row">
	<GridViewItem>{@render tile('One')}</GridViewItem>
	<GridViewItem selected>{@render tile('Selected')}</GridViewItem>
	<GridViewItem>{@render tile('Three')}</GridViewItem>
	<GridViewItem>{@render tile('Four')}</GridViewItem>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<GridViewItem disabled>{@render tile('Disabled')}</GridViewItem>
	<GridViewItem disabled selected>{@render tile('Disabled selected')}</GridViewItem>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the ring follows the child</h2>
<div class="row">
	<GridViewItem selected>{@render tile('Standard')}</GridViewItem>
	<GridViewItem selected>{@render tallTile('Tall')}</GridViewItem>
</div>

{#snippet tile(label: string)}
	<div class="tile">
		<span class="winui-BodyTextBlockStyle">{label}</span>
		<div class="swatch"></div>
	</div>
{/snippet}

{#snippet tallTile(label: string)}
	<div class="tile tall">
		<span class="winui-BodyTextBlockStyle">{label}</span>
		<div class="swatch"></div>
	</div>
{/snippet}

<style>
	/* `align-items: flex-start` because a flex line stretches its items by default, and the row
	   that exists to show the ring taking its size from the child would otherwise show two
	   items of the same height — which is the opposite of its claim. */
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		width: 560px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
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

	.tile.tall {
		height: 160px;
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
