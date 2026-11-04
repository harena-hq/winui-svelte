<script lang="ts">
	import { SystemBackdropElement } from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>SystemBackdropElement — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">SystemBackdropElement</h1>

<!-- Under high contrast all three tokens resolve to SystemColorWindowColor, so these render alike. -->
<h2 class="winui-SubtitleTextBlockStyle">the three backdrops</h2>
<div class="ground">
	<SystemBackdropElement class="sample" systemBackdrop="acrylic" cornerRadius={8} />
	<SystemBackdropElement class="sample" systemBackdrop="mica" cornerRadius={8} />
	<SystemBackdropElement class="sample" systemBackdrop="micaAlt" cornerRadius={8} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">no backdrop</h2>
<div class="ground"><SystemBackdropElement class="sample" cornerRadius={8} /></div>

<h2 class="winui-SubtitleTextBlockStyle">no corner radius</h2>
<div class="ground"><SystemBackdropElement class="sample" systemBackdrop="acrylic" /></div>

<h2 class="winui-SubtitleTextBlockStyle">four radii</h2>
<div class="ground">
	<SystemBackdropElement class="sample" systemBackdrop="acrylic" cornerRadius="4,8,12,16" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">radii larger than the box</h2>
<div class="ground">
	<SystemBackdropElement class="small-sample" systemBackdrop="acrylic" cornerRadius={80} />
</div>

<style>
	.ground {
		display: flex;
		align-items: flex-start;
		/* c1-allow: harness layout, not a WinUI value */
		gap: 16px;
		/* c1-allow: harness layout, not a WinUI value */
		padding: 16px;
		/* c1-allow: harness ground, not a WinUI value — the three fallbacks are near-white in
		   the light theme and unreadable on the page's own background */
		background: #7a7a7a;
	}

	/* A class handed to a component carries no scope hash, so these need `:global`. The
	   descendant form rather than a bare one: five pages in this tree already style a
	   `.sample` of their own, and an unscoped `:global(.sample)` would reach every one of
	   them. */
	.ground :global(.sample) {
		width: 200px;
		height: 120px;
	}

	.ground :global(.small-sample) {
		width: 60px;
		height: 40px;
	}
</style>
