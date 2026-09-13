<script lang="ts">
	import ColorSelector from '$lib/controls/ColorSelector.svelte';

	// This harness is not part of the Gallery reproduction: `/dev/` is unlinked and exists only
	// to photograph this Gallery-owned control's inputs and shape.
</script>

<svelte:head><title>ColorSelector — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ColorSelector</h1>
<p class="winui-BodyTextBlockStyle">
	A colour, a light colour that exposes the swatch edge, the transparent default, and three in a
	line.
</p>

<h2 class="winui-SubtitleTextBlockStyle">a colour</h2>
<ColorSelector color="#3B82F6" label="ButtonBackgroundColor" />

<h2 class="winui-SubtitleTextBlockStyle">
	a light colour, to show the swatch's own edge against the button's
</h2>
<ColorSelector color="#F2F6FA" label="BackgroundColor" />

<h2 class="winui-SubtitleTextBlockStyle">the default</h2>
<ColorSelector />

<h2 class="winui-SubtitleTextBlockStyle">a row of three in a line</h2>
<div class="row">
	<ColorSelector color="#3B82F6" label="ButtonBackgroundColor" />
	<ColorSelector color="#F2F6FA" label="BackgroundColor" />
	<ColorSelector label="Transparent" />
</div>

<style>
	.row {
		display: flex;
		gap: 12px;
	}
</style>
