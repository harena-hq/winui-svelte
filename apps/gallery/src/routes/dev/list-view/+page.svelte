<script lang="ts">
	import { ListView } from '@harena-hq/winui-svelte/preview';

	const people = [
		'Kendall Collins',
		'Henry Ross',
		'Vance DeLeon',
		'Victoria Burke',
		'Amber Rodriguez',
		'Amari Rivera'
	];
	let picked = $state<number[]>([]);
</script>

<svelte:head><title>ListView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ListView</h1>
<p class="winui-BodyTextBlockStyle">A scrolling list that owns selection and its row containers.</p>

<h2 class="winui-SubtitleTextBlockStyle">single selection — the default</h2>
<div class="row">
	<ListView items={people} selectedIndexes={[1]} {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">multiple selection</h2>
<div class="row">
	<ListView items={people} selectionMode="multiple" selectedIndexes={[0, 2, 3]} {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">extended selection</h2>
<div class="row">
	<ListView items={people} selectionMode="extended" selectedIndexes={[2, 3]} {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">no selection</h2>
<div class="row">
	<ListView items={people} selectionMode="none" {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a header and a footer</h2>
<div class="row">
	<ListView items={people} selectedIndexes={[0]} {itemTemplate} {header} {footer} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">selection the page owns</h2>
<div class="row">
	<ListView items={people} selectionMode="multiple" bind:selectedIndexes={picked} {itemTemplate} />
</div>
<p class="winui-BodyTextBlockStyle">{picked.join(', ') || 'nothing'}</p>

{#snippet itemTemplate(person: string)}
	<span class="winui-BodyTextBlockStyle">{person}</span>
{/snippet}

{#snippet header()}
	<div class="band"><span class="winui-BodyStrongTextBlockStyle">People</span></div>
{/snippet}

{#snippet footer()}
	<div class="band"><span class="winui-CaptionTextBlockStyle">6 people</span></div>
{/snippet}

<style>
	.row {
		display: block;
		width: 360px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	.band {
		padding: 8px 16px;
	}
</style>
