<script lang="ts">
	import { ColorPickerSlider } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where each
	 * control gets a page to be photographed on, and nothing links to it.
	 *
	 * Every specimen is wrapped in a `.row`, and that is load-bearing rather than decoration.
	 * `.root` is `inline-flex`, so on its own it shrinks to its content — an 18px thumb over a
	 * `width: 100%` track that resolves against nothing and collapses to zero. Upstream the
	 * control is a `Control`, whose `HorizontalAlignment` defaults to `Stretch`, and both uses
	 * put it in a `Grid` that gives it a width (`ColorPicker.xaml:238`, `:246`). A column flex
	 * container is what reproduces that here: its cross axis is the width, and `align-items`
	 * defaults to `stretch`. `dev/slider/+page.svelte` does the same for the same reason.
	 */
	let value = $state(50);
</script>

<svelte:head><title>ColorPickerSlider — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ColorPickerSlider</h1>

<h2 class="winui-SubtitleTextBlockStyle">default</h2>
<div class="row"><ColorPickerSlider data-testid="default" bind:value /></div>

<h2 class="winui-SubtitleTextBlockStyle">over a colour strip</h2>
<div class="row strip"><ColorPickerSlider data-testid="over-strip" value={70} /></div>

<h2 class="winui-SubtitleTextBlockStyle">alpha</h2>
<div class="row"><ColorPickerSlider data-testid="alpha" colorChannel="alpha" value={55} /></div>

<h2 class="winui-SubtitleTextBlockStyle">hue</h2>
<div class="row">
	<ColorPickerSlider data-testid="hue" colorChannel="hue" max={359} value={180} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">with a header</h2>
<div class="row"><ColorPickerSlider data-testid="with-header" header="Value" /></div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<ColorPickerSlider data-testid="disabled" disabled header="Value" value={40} />
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		margin-bottom: 24px;
		max-width: 320px;
	}

	/* `ThirdDimensionSliderGrid`, ColorPicker.xaml:230-237: a `Rectangle` 12 tall, vertically
	   centred, carrying the gradient, with the slider laid over it in the same cell. The
	   gradient itself is page-local demonstration paint standing in for
	   `ThirdDimensionSliderGradientBrush` (:233), which the ColorPicker computes from its own
	   colour and which is the next unit's work — this page only needs something under the thumb
	   for the baseline to show it against. */
	.strip {
		position: relative;
	}

	.strip::before {
		content: '';
		position: absolute;
		inset: 0;
		margin: auto 0;
		height: 12px;
		/* c1-allow: ColorPicker_themeresources.xaml:32, ColorPickerSliderCornerRadius */
		border-radius: 6px;
		/* c1-allow: harness paint for ColorPicker.xaml:233's ThirdDimensionSliderGradientBrush */
		background: linear-gradient(to right, #000, #fff);
		pointer-events: none;
	}
</style>
