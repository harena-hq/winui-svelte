<script lang="ts">
	import { BreadcrumbBar } from 'winui-svelte/preview';

	const longItems = [
		'Home',
		'Documents',
		'Design',
		'Northwind',
		'Images',
		'Folder1',
		'Folder2',
		'Folder3'
	].map((content) => ({ content }));
	const fourItems = ['Home', 'Folder1', 'Folder2', 'Folder3'].map((content) => ({ content }));
</script>

<svelte:head><title>BreadcrumbBar — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">BreadcrumbBar</h1>
<p class="winui-BodyTextBlockStyle">A path through nested folders.</p>

<h2 class="winui-SubtitleTextBlockStyle">every crumb</h2>
<div class="row"><div style="width: 720px"><BreadcrumbBar items={longItems} /></div></div>

<h2 class="winui-SubtitleTextBlockStyle">collapsed</h2>
<div class="row"><div style="width: 320px"><BreadcrumbBar items={longItems} /></div></div>

<h2 class="winui-SubtitleTextBlockStyle">the ellipsis flyout, open</h2>
<div class="row clear-above">
	<div style="width: 320px"><BreadcrumbBar items={longItems} ellipsisOpen /></div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">four crumbs</h2>
<div class="row"><BreadcrumbBar items={fourItems} /></div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row"><BreadcrumbBar items={fourItems} disabled /></div>

<style>
	.row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 24px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	/* The default Flyout placement is Top, and its portalled presenter is out of flow. */
	.clear-above {
		margin-top: 260px;
	}
</style>
