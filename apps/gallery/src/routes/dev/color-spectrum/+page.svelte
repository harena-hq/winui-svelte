<script lang="ts">
	import { ColorSpectrum, type HsvColor } from '@harena-hq/winui-svelte/preview';

	let interactive = $state<HsvColor>({ h: 0, s: 0, v: 1, a: 1 });
	const components = [
		'hueValue',
		'valueHue',
		'hueSaturation',
		'saturationHue',
		'saturationValue',
		'valueSaturation'
	] as const;
</script>

<svelte:head><title>ColorSpectrum — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">ColorSpectrum</h1>
<h2 class="winui-SubtitleTextBlockStyle">default box</h2>
<div class="box"><ColorSpectrum data-testid="default" bind:hsvColor={interactive} /></div>
<h2 class="winui-SubtitleTextBlockStyle">ring</h2>
<div class="box">
	<ColorSpectrum data-testid="ring" shape="ring" hsvColor={{ h: 210, s: 0.7, v: 0.8, a: 1 }} />
</div>
<h2 class="winui-SubtitleTextBlockStyle">components</h2>
{#each components as component (component)}
	<div class="box">
		<ColorSpectrum
			data-testid={component}
			components={component}
			hsvColor={{ h: 210, s: 0.7, v: 0.8, a: 1 }}
		/>
	</div>
{/each}
<h2 class="winui-SubtitleTextBlockStyle">clamped hue</h2>
<div class="box">
	<ColorSpectrum
		data-testid="clamped"
		minHue={90}
		maxHue={180}
		hsvColor={{ h: 135, s: 1, v: 1, a: 1 }}
	/>
</div>
<h2 class="winui-SubtitleTextBlockStyle">thumb luminance</h2>
<div class="box">
	<ColorSpectrum data-testid="light-thumb" hsvColor={{ h: 0, s: 0, v: 1, a: 1 }} />
</div>
<div class="box">
	<ColorSpectrum data-testid="dark-thumb" hsvColor={{ h: 0, s: 1, v: 0.1, a: 1 }} />
</div>

<style>
	/* The control takes its width from its parent, as `ColorPicker.xaml:218` gives it one; this
	   harness is that parent, at the 256 the picker's own `MinWidth` names. `inline-block` is
	   what the control's own root used to carry, and it is kept here so the six `components`
	   specimens still flow side by side and every baseline on this page stays the render it
	   already was — the change beneath it is the control's, not this page's. */
	.box {
		display: inline-block;
		width: 256px;
	}
</style>
