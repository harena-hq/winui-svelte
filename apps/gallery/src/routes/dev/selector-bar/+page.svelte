<script lang="ts">
	import { SelectorBar } from 'winui-svelte/preview';

	const iconItems = [
		{ id: 'recent', text: 'Recent', glyph: 'E823' },
		{ id: 'shared', text: 'Shared', glyph: 'E72D' },
		{ id: 'favorites', text: 'Favorites', glyph: 'E734' }
	];
	const pageItems = ['Page1', 'Page2', 'Page3', 'Page4', 'Page5'].map((text) => ({
		id: text,
		text
	}));
	const disabledPageItems = pageItems.map((item) => ({
		...item,
		disabled: item.id === 'Page2'
	}));
</script>

<svelte:head><title>SelectorBar — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">SelectorBar</h1>
<p class="winui-BodyTextBlockStyle">A horizontal, single-selection set of items.</p>

<h2 class="winui-SubtitleTextBlockStyle">icons and text</h2>
<div class="row"><SelectorBar items={iconItems} /></div>

<h2 class="winui-SubtitleTextBlockStyle">text only, with a selection</h2>
<div class="row"><SelectorBar items={pageItems} selected="Page1" /></div>

<h2 class="winui-SubtitleTextBlockStyle">a later selection</h2>
<div class="row"><SelectorBar items={pageItems} selected="Page3" /></div>

<h2 class="winui-SubtitleTextBlockStyle">a disabled item</h2>
<div class="row"><SelectorBar items={disabledPageItems} selected="Page1" /></div>

<h2 class="winui-SubtitleTextBlockStyle">the whole bar disabled</h2>
<div class="row"><SelectorBar items={pageItems} selected="Page1" disabled /></div>

<style>
	.row {
		display: flex;
		align-items: flex-start;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
