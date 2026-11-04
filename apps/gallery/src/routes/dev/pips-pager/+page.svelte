<script lang="ts">
	import { PipsPager } from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>PipsPager — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">PipsPager</h1>
<p class="winui-BodyTextBlockStyle">
	A run of pips over a paginated collection, with two optional navigation buttons.
</p>

<h2 class="winui-SubtitleTextBlockStyle">five pages, first selected, both buttons collapsed</h2>
<div class="row"><PipsPager numberOfPages={5} /></div>

<h2 class="winui-SubtitleTextBlockStyle">five pages, third selected, both buttons visible</h2>
<div class="row">
	<PipsPager
		numberOfPages={5}
		selectedPageIndex={2}
		previousButtonVisibility="visible"
		nextButtonVisibility="visible"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">
	five pages, last selected — the next arrow is hidden and keeps its box
</h2>
<div class="row">
	<PipsPager
		numberOfPages={5}
		selectedPageIndex={4}
		previousButtonVisibility="visible"
		nextButtonVisibility="visible"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">
	ten pages, five visible, the sixth selected and centred
</h2>
<div class="row"><PipsPager numberOfPages={10} maxVisiblePips={5} selectedPageIndex={5} /></div>

<h2 class="winui-SubtitleTextBlockStyle">infinite pages, the third selected</h2>
<div class="row"><PipsPager numberOfPages={-1} selectedPageIndex={2} /></div>

<h2 class="winui-SubtitleTextBlockStyle">
	vertical, five pages, third selected, both buttons visible
</h2>
<div class="row">
	<PipsPager
		orientation="vertical"
		numberOfPages={5}
		selectedPageIndex={2}
		previousButtonVisibility="visible"
		nextButtonVisibility="visible"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">
	wrap, five pages, first selected — the previous arrow is painted
</h2>
<div class="row">
	<PipsPager
		numberOfPages={5}
		wrapMode="wrap"
		previousButtonVisibility="visible"
		nextButtonVisibility="visible"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">
	the previous button visible on pointer over, the third selected
</h2>
<div class="row">
	<PipsPager
		numberOfPages={5}
		selectedPageIndex={2}
		previousButtonVisibility="visibleOnPointerOver"
	/>
</div>

<style>
	.row {
		display: flex;
		align-items: flex-start;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
