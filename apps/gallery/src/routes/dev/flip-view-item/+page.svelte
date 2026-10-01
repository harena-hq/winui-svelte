<script lang="ts">
	import { FlipViewItem } from 'winui-svelte/preview';
</script>

<svelte:head><title>FlipViewItem — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">FlipViewItem</h1>
<p class="winui-BodyTextBlockStyle">A stretched item container for FlipView content.</p>

<h2 class="winui-SubtitleTextBlockStyle">one item</h2>
<div class="row">
	<FlipViewItem><div class="slide">One item</div></FlipViewItem>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a taller child</h2>
<div class="row">
	<FlipViewItem><div class="slide tall">Taller child</div></FlipViewItem>
</div>

<style>
	.row {
		display: block;
		width: 400px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	.slide {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 80px;
	}

	.slide.tall {
		height: 160px;
	}
</style>
