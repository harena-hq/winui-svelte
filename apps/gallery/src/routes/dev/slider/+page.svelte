<script lang="ts">
	import { Slider } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The fourteen
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
	Fourteen rows: at rest, mid-range, a header and custom range, stepped, disabled, tooltip disabled,
	vertical variants, horizontal reversal, and inline and outside tick marks.
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

<h2 class="winui-SubtitleTextBlockStyle">vertical</h2>
<div class="row-across">
	<Slider orientation="vertical" value={40} style="height: 100px" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">vertical, reversed</h2>
<div class="row-across">
	<Slider orientation="vertical" isDirectionReversed value={40} style="height: 100px" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">vertical, a header</h2>
<div class="row-across">
	<Slider
		orientation="vertical"
		header={rowSpacingHeader}
		style="height: 120px"
		value={8}
		min={0}
		max={16}
		step={1}
		isDirectionReversed
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">vertical, disabled</h2>
<div class="row-across">
	<Slider orientation="vertical" disabled style="height: 100px" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">horizontal, reversed</h2>
<div class="row">
	<Slider isDirectionReversed value={30} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">ticks, inline</h2>
<div class="row">
	<Slider tickFrequency={1} min={0} max={16} value={8} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">ticks, outside</h2>
<div class="row">
	<Slider tickPlacement="outside" tickFrequency={10} value={30} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">ticks, vertical</h2>
<div class="row-across">
	<Slider
		orientation="vertical"
		tickFrequency={1}
		min={0}
		max={16}
		value={8}
		isDirectionReversed
		style="height: 100px"
	/>
	<Slider orientation="vertical" tickPlacement="topLeft" tickFrequency={4} style="height: 100px" />
</div>

<!-- GridPage.xaml:97: `TextBlock Margin="0,0,0,10"` inside `Slider.Header`. -->
{#snippet rowSpacingHeader()}
	<span style="display: block; margin-bottom: 10px">RowSpacing</span>
{/snippet}

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
		max-width: 580px;
	}

	/* c1-allow: harness layout, a shared row for vertical Slider samples */
	.row-across {
		display: flex;
		align-items: flex-start;
		/* c1-allow: harness layout, gap between vertical Slider samples */
		gap: 24px;
		margin-bottom: 24px;
	}
</style>
