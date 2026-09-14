<script lang="ts">
	import { ColorPicker } from 'winui-svelte';
</script>

<svelte:head><title>ColorPicker horizontal — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">ColorPicker horizontal</h1>
<!-- This separate route keeps the already-expensive vertical ColorPicker page within one visual-test budget. -->
<h2 class="winui-SubtitleTextBlockStyle">default</h2>
<div class="row">
	<ColorPicker data-testid="default" orientation="horizontal" color="#3478F6" />
</div>
<h2 class="winui-SubtitleTextBlockStyle">alpha</h2>
<div class="row">
	<ColorPicker data-testid="alpha" orientation="horizontal" alphaEnabled color="#3478F680" />
</div>
<h2 class="winui-SubtitleTextBlockStyle">more button</h2>
<div class="row">
	<ColorPicker
		data-testid="more-button"
		orientation="horizontal"
		moreButtonVisible
		color="#3478F6"
	/>
</div>
<h2 class="winui-SubtitleTextBlockStyle">no spectrum</h2>
<div class="row">
	<ColorPicker
		data-testid="no-spectrum"
		orientation="horizontal"
		colorSpectrumVisible={false}
		color="#3478F6"
	/>
</div>
<h2 class="winui-SubtitleTextBlockStyle">no channel text</h2>
<div class="row">
	<ColorPicker
		data-testid="no-channel-text"
		orientation="horizontal"
		colorChannelTextInputVisible={false}
		color="#3478F6"
	/>
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		margin-bottom: 24px;
	}
</style>
