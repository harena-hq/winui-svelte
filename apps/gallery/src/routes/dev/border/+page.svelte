<script lang="ts">
	import { Border } from 'winui-svelte/preview';
</script>

<svelte:head><title>Border — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Border</h1>

<h2 class="winui-SubtitleTextBlockStyle">the Gallery's sample</h2>
<div class="row">
	<Border borderThickness={2} borderBrush="#FFD700" background="#FFFFFF">
		<span class="text">Text inside a border</span>
	</Border>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no border</h2>
<div class="row">
	<Border background="#E0E0FF" padding="8,5"><span class="text">Text inside a border</span></Border>
</div>

<h2 class="winui-SubtitleTextBlockStyle">four thicknesses and a radius</h2>
<div class="row">
	<Border borderThickness="1,2,3,4" cornerRadius={8} borderBrush="#0078D4" padding={8}>
		<span class="text">Text inside a border</span>
	</Border>
</div>

<h2 class="winui-SubtitleTextBlockStyle">four radii</h2>
<div class="row">
	<Border cornerRadius="4,8,12,16" borderThickness={2} borderBrush="#0078D4" padding={8}>
		<span class="text">Text inside a border</span>
	</Border>
</div>

<h2 class="winui-SubtitleTextBlockStyle">background sizing</h2>
<div class="row">
	<Border borderThickness={8} borderBrush="rgba(0, 120, 212, 0.4)" background="#FFD700">
		<span class="text">inner border edge</span>
	</Border>
	<Border
		borderThickness={8}
		borderBrush="rgba(0, 120, 212, 0.4)"
		background="#FFD700"
		backgroundSizing="outerBorderEdge"
	>
		<span class="text">outer border edge</span>
	</Border>
</div>

<h2 class="winui-SubtitleTextBlockStyle">sized</h2>
<div class="row">
	<Border style="width: 160px; height: 64px" borderThickness={2} borderBrush="#0078D4">
		<div class="fill"></div>
	</Border>
</div>

<style>
	/* c1-allow: harness layout, not a WinUI value */
	.row {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}

	/* c1-allow: BorderPage.xaml:28-31 — the sample's TextBlock: Margin="8,5", FontSize="18", Foreground="Black" */
	.text {
		display: block;
		margin: 5px 8px;
		/* c1-allow: BorderPage.xaml:28-31 — the sample's TextBlock sets FontSize="18". */
		font-size: 18px;
		/* c1-allow: BorderPage.xaml:28-31 — the sample's TextBlock sets Foreground="Black". */
		color: black;
	}

	/* c1-allow: harness layout, not a WinUI value */
	.fill {
		height: 100%;
		/* c1-allow: harness layout, not a WinUI value */
		background: #ffd700;
	}
</style>
