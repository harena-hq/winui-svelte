<script lang="ts">
	import { ColorSpectrum, type HsvColor } from 'winui-svelte';

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
<ColorSpectrum data-testid="default" bind:hsvColor={interactive} />
<h2 class="winui-SubtitleTextBlockStyle">ring</h2>
<ColorSpectrum data-testid="ring" shape="ring" hsvColor={{ h: 210, s: 0.7, v: 0.8, a: 1 }} />
<h2 class="winui-SubtitleTextBlockStyle">components</h2>
{#each components as component (component)}
	<ColorSpectrum
		data-testid={component}
		components={component}
		hsvColor={{ h: 210, s: 0.7, v: 0.8, a: 1 }}
	/>
{/each}
<h2 class="winui-SubtitleTextBlockStyle">clamped hue</h2>
<ColorSpectrum
	data-testid="clamped"
	minHue={90}
	maxHue={180}
	hsvColor={{ h: 135, s: 1, v: 1, a: 1 }}
/>
<h2 class="winui-SubtitleTextBlockStyle">thumb luminance</h2>
<ColorSpectrum data-testid="light-thumb" hsvColor={{ h: 0, s: 0, v: 1, a: 1 }} />
<ColorSpectrum data-testid="dark-thumb" hsvColor={{ h: 0, s: 1, v: 0.1, a: 1 }} />
