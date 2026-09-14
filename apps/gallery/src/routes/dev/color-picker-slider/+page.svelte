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

<h2 class="winui-SubtitleTextBlockStyle">vertical</h2>
<div class="row upright">
	<ColorPickerSlider
		data-testid="vertical"
		orientation="vertical"
		value={50}
		style="height: 256px"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">vertical over a colour strip</h2>
<div class="row upright strip-upright">
	<ColorPickerSlider
		data-testid="vertical-strip"
		orientation="vertical"
		value={70}
		style="height: 256px"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">vertical with a header</h2>
<div class="row upright">
	<ColorPickerSlider
		data-testid="vertical-header"
		orientation="vertical"
		header="Value"
		style="height: 256px"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">vertical disabled</h2>
<div class="row upright">
	<ColorPickerSlider
		data-testid="vertical-disabled"
		orientation="vertical"
		disabled
		value={40}
		style="height: 256px"
	/>
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		margin-bottom: 24px;
		max-width: 320px;
	}

	/* `ThirdDimensionSliderGrid`, ColorPicker.xaml:238-245: a `Rectangle` 12 tall, vertically
	   centred, carrying the gradient, with the slider laid over it in the same cell. The
	   gradient itself is page-local demonstration paint standing in for
	   `ThirdDimensionSliderGradientBrush` (:241), which the ColorPicker computes from its own
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
		/* c1-allow: harness paint for ColorPicker.xaml:241's ThirdDimensionSliderGradientBrush */
		background: linear-gradient(to right, #000, #fff);
		pointer-events: none;
	}

	/* A vertical ColorPickerSlider takes its length from its consumer the way the horizontal one
	   takes its width, and for the same reason: ColorPicker.xaml:512's grid stretches its first
	   row, and in the picker's horizontal orientation that row is the spectrum's height. So the
	   height goes on the control, as `dev/slider`'s vertical specimens put it there — 256 is
	   ColorPicker.xaml:218's MinHeight, the size the control is really used at. All this row
	   does is stop a 32-wide control being stretched across it. */
	.row.upright {
		align-items: flex-start;
	}

	/* The same page-local demonstration paint as `.strip`, turned upright: ColorPicker.xaml:155's
	   Horizontal state gives ThirdDimensionBackgroundRectangle a Width of 12 and :157 stretches it
	   vertically, and the RotateTransform at :158-162 is what puts the gradient's first stop at
	   the bottom, where the vertical slider's minimum is.

	   `width: max-content` is what makes the paint land on the slider. `.strip` centres its bar
	   in the row's height and the row is exactly as tall as the horizontal control, so it lands.
	   The transposition centres in the row's *width*, and the row is 320 wide against a 32-wide
	   control pinned to its left edge: measured before this line, the bar's centre was at 184 and
	   the control's at 40. Shrinking the row to its content puts the two back together. */
	.strip-upright {
		position: relative;
		width: max-content;
	}

	.strip-upright::before {
		content: '';
		position: absolute;
		inset: 0;
		margin: 0 auto;
		width: 12px;
		/* c1-allow: ColorPicker_themeresources.xaml:32, ColorPickerSliderCornerRadius */
		border-radius: 6px;
		/* c1-allow: harness paint for ColorPicker.xaml:241's ThirdDimensionSliderGradientBrush */
		background: linear-gradient(to top, #000, #fff);
		pointer-events: none;
	}
</style>
