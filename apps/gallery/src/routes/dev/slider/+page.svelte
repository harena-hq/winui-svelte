<script lang="ts">
	import { Slider } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The six
	 * rows below exercise the surface the unit names — at rest, mid-range, with a header
	 * and a custom range matching the Gallery's own sample, stepped, disabled, and with
	 * the thumb tooltip disabled.
	 */

	let atRest = $state(0);
	let midRange = $state(40);
	let withHeader = $state(800);
	let stepped = $state(30);
</script>

<svelte:head><title>Slider — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Slider</h1>
<p class="winui-BodyTextBlockStyle">
	Six rows, in the order the unit names them: at rest, mid-range, with a header and a custom min/max
	like the Gallery's own example, stepped, disabled, and the thumb tooltip disabled.
</p>

<h2 class="winui-SubtitleTextBlockStyle">at rest</h2>
<div class="row">
	<Slider bind:value={atRest} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">mid-range</h2>
<div class="row">
	<Slider bind:value={midRange} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a header</h2>
<div class="row">
	<Slider header="Control header" bind:value={withHeader} min={500} max={1000} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">stepped</h2>
<div class="row">
	<Slider step={10} bind:value={stepped} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<Slider disabled />
</div>

<h2 class="winui-SubtitleTextBlockStyle">the thumb tooltip disabled</h2>
<div class="row">
	<Slider thumbToolTipEnabled={false} />
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
		max-width: 580px;
	}
</style>
