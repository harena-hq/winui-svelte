<script lang="ts">
	import NotApplicablePanel from '$lib/frame/NotApplicablePanel.svelte';
</script>

<svelte:head><title>NotApplicablePanel — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">NotApplicablePanel</h1>

<div class="rows">
	<h2 class="winui-SubtitleTextBlockStyle">Content height</h2>
	<NotApplicablePanel element="MapControl" reason="No map is drawn here" row="WD-063" />

	<h2 class="winui-SubtitleTextBlockStyle">The slot's height</h2>
	<NotApplicablePanel
		element="MapControl"
		reason="An Azure Maps service token and its tile service are what draw a map, and neither is part of this reproduction"
		row="WD-063"
		height={400}
	/>

	<h2 class="winui-SubtitleTextBlockStyle">A reason that wraps</h2>
	<NotApplicablePanel
		element="WebView2"
		reason="The page this example hosts refuses to be framed by this origin, so nothing is hosted here"
		row="WD-062"
		height={200}
	/>
</div>

<style>
	.rows {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 720px;
	}
</style>
