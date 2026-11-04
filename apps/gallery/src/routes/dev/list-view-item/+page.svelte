<script lang="ts">
	import { ListViewItem } from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>ListViewItem — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ListViewItem</h1>
<p class="winui-BodyTextBlockStyle">A list row with native-presenter selection chrome.</p>

<h2 class="winui-SubtitleTextBlockStyle">at rest</h2>
<div class="row">
	<ListViewItem>First item</ListViewItem>
	<ListViewItem>Second item</ListViewItem>
	<ListViewItem>Third item</ListViewItem>
</div>

<h2 class="winui-SubtitleTextBlockStyle">selected</h2>
<div class="row">
	<ListViewItem>First item</ListViewItem>
	<ListViewItem selected>Selected item</ListViewItem>
	<ListViewItem>Third item</ListViewItem>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<ListViewItem disabled>Disabled item</ListViewItem>
	<ListViewItem disabled selected>Disabled selected item</ListViewItem>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a taller child</h2>
<div class="row">
	<ListViewItem><div class="tall">First line<br />Second line</div></ListViewItem>
	<ListViewItem selected><div class="tall">First line<br />Second line</div></ListViewItem>
</div>

<!-- Ink rather than a card fill. Under high contrast every `…CardBackgroundFill…` and every
	 accent brush resolves to `SystemColorWindowColor` — the page's own background — and a swatch
	 painted with one is invisible in the theme where this page most needs to show that the child
	 rendered at all. -->
<div class="swatch"></div>

<style>
	.row {
		display: block;
		width: 360px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	.tall {
		height: 64px;
	}

	.swatch {
		width: 96px;
		height: 12px;
		background: var(--winui-TextFillColorPrimaryBrush);
	}
</style>
