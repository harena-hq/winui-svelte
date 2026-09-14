<script lang="ts">
	import { ColorPicker } from 'winui-svelte';
	let color = $state('#3478F6');
</script>

<svelte:head><title>ColorPicker — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">ColorPicker</h1>
<h2 class="winui-SubtitleTextBlockStyle">default</h2>
<div class="row"><ColorPicker data-testid="default" bind:color /></div>
<h2 class="winui-SubtitleTextBlockStyle">alpha</h2>
<div class="row"><ColorPicker data-testid="alpha" alphaEnabled color="#3478F680" /></div>
<h2 class="winui-SubtitleTextBlockStyle">previous</h2>
<div class="row">
	<ColorPicker data-testid="previous" previousColor="#CC4125" color="#3478F6" />
</div>
<h2 class="winui-SubtitleTextBlockStyle">no spectrum</h2>
<div class="row"><ColorPicker data-testid="no-spectrum" colorSpectrumVisible={false} /></div>
<h2 class="winui-SubtitleTextBlockStyle">no spectrum previous</h2>
<div class="row">
	<ColorPicker
		data-testid="no-spectrum-previous"
		colorSpectrumVisible={false}
		previousColor="#CC4125"
	/>
</div>
<h2 class="winui-SubtitleTextBlockStyle">no preview</h2>
<div class="row"><ColorPicker data-testid="no-preview" colorPreviewVisible={false} /></div>
<h2 class="winui-SubtitleTextBlockStyle">no sliders</h2>
<div class="row">
	<ColorPicker data-testid="no-sliders" colorSliderVisible={false} alphaSliderVisible={false} />
</div>
<h2 class="winui-SubtitleTextBlockStyle">hue slider</h2>
<div class="row">
	<ColorPicker data-testid="hue-slider" colorSpectrumComponents="saturationValue" color="#3478F6" />
</div>
<h2 class="winui-SubtitleTextBlockStyle">saturation slider</h2>
<div class="row">
	<ColorPicker data-testid="saturation-slider" colorSpectrumComponents="hueValue" color="#3478F6" />
</div>
<h2 class="winui-SubtitleTextBlockStyle">clamped</h2>
<div class="row">
	<ColorPicker
		data-testid="clamped"
		minHue={90}
		maxHue={200}
		colorSpectrumComponents="saturationValue"
	/>
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		margin-bottom: 24px;
		max-width: 392px;
	}
</style>
