<script lang="ts">
	import { ItemContainer, ItemsView, type ItemsViewItemState } from 'winui-svelte';

	const photos = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
	let picked = $state<number[]>([]);
</script>

<svelte:head><title>ItemsView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ItemsView</h1>
<p class="winui-BodyTextBlockStyle">A scrolling ItemsRepeater viewport that owns selection.</p>

<h2 class="winui-SubtitleTextBlockStyle">single selection — the default</h2>
<div class="row">
	<ItemsView
		items={photos}
		layout={{ kind: 'uniformGrid', minColumnSpacing: 8, minRowSpacing: 8 }}
		selectedIndexes={[1]}
	>
		{#snippet itemTemplate(photo, index, state)}
			{@render tile(photo, index, state)}
		{/snippet}
	</ItemsView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">multiple selection</h2>
<div class="row">
	<ItemsView
		items={photos}
		selectionMode="multiple"
		layout={{ kind: 'uniformGrid', minColumnSpacing: 8, minRowSpacing: 8 }}
		selectedIndexes={[0, 3, 4]}
	>
		{#snippet itemTemplate(photo, index, state)}
			{@render tile(photo, index, state)}
		{/snippet}
	</ItemsView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">extended selection</h2>
<div class="row">
	<ItemsView
		items={photos}
		selectionMode="extended"
		layout={{ kind: 'uniformGrid', minColumnSpacing: 8, minRowSpacing: 8 }}
		selectedIndexes={[2, 3, 4]}
	>
		{#snippet itemTemplate(photo, index, state)}
			{@render tile(photo, index, state)}
		{/snippet}
	</ItemsView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no selection</h2>
<div class="row">
	<ItemsView
		items={photos}
		selectionMode="none"
		layout={{ kind: 'uniformGrid', minColumnSpacing: 8, minRowSpacing: 8 }}
	>
		{#snippet itemTemplate(photo, index, state)}
			{@render tile(photo, index, state)}
		{/snippet}
	</ItemsView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a stack layout, and a viewport that scrolls</h2>
<!-- The viewport scrolls — 640 of content in 200 — but no scrollbar appears in the three
     baselines, and that is the browser rather than the component. The reference guest drives a
     headless Edge, and headless Chromium uses overlay scrollbars on every platform: they take no
     layout space, they are hidden at rest, and `::-webkit-scrollbar` rules do not paint them.
     The component's scrollbar rules are NavigationView's and are correct in a headed browser;
     nothing this page can do will photograph one. -->
<div class="row">
	<div class="short">
		<ItemsView items={photos} style="height: 100%">
			{#snippet itemTemplate(photo, index, state)}
				{@render tile(photo, index, state)}
			{/snippet}
		</ItemsView>
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">selection the page owns</h2>
<div class="row">
	<ItemsView
		items={photos}
		selectionMode="multiple"
		layout={{ kind: 'uniformGrid', minColumnSpacing: 8, minRowSpacing: 8 }}
		bind:selectedIndexes={picked}
	>
		{#snippet itemTemplate(photo, index, state)}
			{@render tile(photo, index, state)}
		{/snippet}
	</ItemsView>
</div>
<p class="winui-BodyTextBlockStyle">{picked.join(', ') || 'nothing'}</p>

<!-- The index is rendered rather than dropped. A template that takes an argument it does not
     use leaves that argument unexercised, and the second one — the index ADR 0013 puts between
     the item and the view's decision — is the one this page would otherwise never read. -->
{#snippet tile(label: string, index: number, state: ItemsViewItemState)}
	<ItemContainer selected={state.selected} multiSelectMode={state.multiSelectMode}>
		<div class="tile">
			<span class="winui-BodyTextBlockStyle">{index + 1}. {label}</span>
			<div class="swatch"></div>
		</div>
	</ItemContainer>
{/snippet}

<style>
	.row {
		display: block;
		width: 560px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	.short {
		height: 200px;
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

	/* Ink rather than a card fill. Under high contrast every accent and card brush resolves to
	   the page's own background, so a swatch painted with one would be invisible. */
	.swatch {
		width: 64px;
		height: 12px;
		background: var(--winui-TextFillColorPrimaryBrush);
	}
</style>
