<script lang="ts">
	import { RepeatButton } from 'winui-svelte';
	/* The component's own harness, not part of the Gallery reproduction: `/dev/` is where each control gets a page to be photographed on, and nothing links to it. */
</script>

<svelte:head><title>RepeatButton — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">RepeatButton</h1>
<p class="winui-BodyTextBlockStyle">
	Three rows, in order: enabled with default delay and interval, disabled, and ScrollBar's 50 ms
	values.
</p>
<h2 class="winui-SubtitleTextBlockStyle">default timing</h2>
<div class="row"><RepeatButton>Click and hold</RepeatButton></div>
<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row"><RepeatButton disabled>Click and hold</RepeatButton></div>
<h2 class="winui-SubtitleTextBlockStyle">ScrollBar timing</h2>
<div class="row"><RepeatButton delay={50} interval={50}>Click and hold (50 ms)</RepeatButton></div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}
</style>
