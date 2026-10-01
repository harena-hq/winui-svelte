<script lang="ts">
	import { WebView2 } from 'winui-svelte/preview';
</script>

<svelte:head><title>WebView2 — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">WebView2</h1>

<!-- Every row frames a same-origin asset this Gallery already serves. A row naming a remote URL
     would photograph the network. -->
<div class="rows">
	<h2 class="winui-SubtitleTextBlockStyle">No source</h2>
	<div class="box"><WebView2 title="Empty frame" /></div>

	<h2 class="winui-SubtitleTextBlockStyle">Source</h2>
	<div class="box"><WebView2 source="/valley.jpg" title="A framed image" /></div>

	<h2 class="winui-SubtitleTextBlockStyle">defaultBackgroundColor</h2>
	<div class="box">
		<WebView2 defaultBackgroundColor="#0078D4" title="Frame with a background colour" />
	</div>

	<!-- The same source as the Source row, so the two differ only in the box, which is what makes
	     "fills it" something the baseline can show. `/Slices.png` was here first and could not:
	     it is 90x90 and leaves the rest of the frame transparent, so the taller box photographed
	     as nothing and the row proved only that it had not crashed. -->
	<h2 class="winui-SubtitleTextBlockStyle">Fills a taller box</h2>
	<div class="box tall"><WebView2 source="/valley.jpg" title="A framed image, stretched" /></div>
</div>

<style>
	.rows {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	/* A WebView2 takes its size from its caller, so the harness is what supplies one. */
	.box {
		width: 300px;
		height: 160px;
	}
	.tall {
		height: 260px;
	}
</style>
