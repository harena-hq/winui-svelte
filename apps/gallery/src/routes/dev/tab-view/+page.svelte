<script lang="ts">
	import { TabView } from 'winui-svelte';

	const documents = [
		{ id: 'Document 0', header: 'Document 0', glyph: 'E8A5', content: document0 },
		{ id: 'Document 1', header: 'Document 1', glyph: 'E8A5', content: document1 },
		{ id: 'Document 2', header: 'Document 2', glyph: 'E8A5', content: document2 }
	];
	const textDocuments = documents.map((item) => ({
		id: item.id,
		header: item.header,
		content: item.content
	}));
	const firstFixed = documents.map((item, index) => ({ ...item, closable: index !== 0 }));
	const withDisabledSecond = documents.map((item, index) => ({ ...item, disabled: index === 1 }));
	let galleryItems = $state([...documents]);
</script>

{#snippet document0()}<p class="winui-BodyTextBlockStyle">Document 0 content.</p>{/snippet}
{#snippet document1()}<p class="winui-BodyTextBlockStyle">Document 1 content.</p>{/snippet}
{#snippet document2()}<p class="winui-BodyTextBlockStyle">Document 2 content.</p>{/snippet}

<svelte:head><title>TabView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TabView</h1>
<p class="winui-BodyTextBlockStyle">A tab strip with one visible item panel.</p>

<h2 class="winui-SubtitleTextBlockStyle">the Gallery's own</h2>
<div class="row">
	<TabView
		items={galleryItems}
		onTabCloseRequested={(id) => {
			galleryItems = galleryItems.filter((item) => item.id !== id);
		}}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a later selection</h2>
<div class="row"><TabView items={documents} selected="Document 2" /></div>

<h2 class="winui-SubtitleTextBlockStyle">without icons</h2>
<div class="row"><TabView items={textDocuments} /></div>

<h2 class="winui-SubtitleTextBlockStyle">a tab that cannot be closed</h2>
<div class="row"><TabView items={firstFixed} /></div>

<h2 class="winui-SubtitleTextBlockStyle">a disabled tab</h2>
<div class="row"><TabView items={withDisabledSecond} /></div>

<style>
	.row {
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
