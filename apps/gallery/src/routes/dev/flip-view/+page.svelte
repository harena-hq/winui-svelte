<script lang="ts">
	import { FlipView } from 'winui-svelte';

	const slides = ['One', 'Two', 'Three', 'Four'];
</script>

<svelte:head><title>FlipView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">FlipView</h1>
<p class="winui-BodyTextBlockStyle">A one-item viewport with buttons to move between items.</p>

<h2 class="winui-SubtitleTextBlockStyle">the first item</h2>
<div class="row">
	<FlipView items={slides} style="height: 220px" {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">the third of four</h2>
<div class="row">
	<FlipView items={slides} selectedIndex={2} style="height: 220px" {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">the last item</h2>
<div class="row">
	<FlipView items={slides} selectedIndex={3} style="height: 220px" {itemTemplate} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">vertical</h2>
<div class="row">
	<FlipView
		items={slides}
		orientation="vertical"
		selectedIndex={1}
		style="height: 220px"
		{itemTemplate}
	/>
</div>

{#snippet itemTemplate(label: string)}
	<div class="slide">
		<span class="winui-BodyTextBlockStyle">{label}</span>
		<div class="swatch"></div>
	</div>
{/snippet}

<style>
	.row {
		display: block;
		width: 400px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	/* A column, like every other harness in this tranche, and with a rule at each end so the
	   viewport's own extent is visible: the control's background is `FlipViewBackground`, which
	   is `SolidBackgroundFillColorBaseBrush` and therefore the page's own colour in both light
	   and dark. The original is the same — its FlipView has no frame either, and what shows the
	   control is the item inside it. */
	.slide {
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		height: 100%;
		border-block: var(--winui-ItemContainerSelectedInnerThickness) solid
			var(--winui-TextFillColorPrimaryBrush);
	}

	/* Ink rather than a card fill. Under high contrast every `…CardBackgroundFill…` and every
	   accent brush resolves to `SystemColorWindowColor` — the page's own background — and a swatch
	   painted with one is invisible in the theme where this page most needs to show that the child
	   rendered at all. */
	.swatch {
		width: 64px;
		height: 12px;
		background: var(--winui-TextFillColorPrimaryBrush);
	}
</style>
