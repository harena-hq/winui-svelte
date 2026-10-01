<script lang="ts">
	import { Border, Viewbox } from 'winui-svelte/preview';
</script>

<svelte:head><title>Viewbox — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Viewbox</h1>

<h2 class="winui-SubtitleTextBlockStyle">uniform, 200</h2>
<div class="row">
	<Viewbox style="width: 200px; height: 200px">{@render sample()}</Viewbox>
</div>

<h2 class="winui-SubtitleTextBlockStyle">fill, 200</h2>
<div class="row">
	<Viewbox stretch="fill" style="width: 200px; height: 200px">{@render sample()}</Viewbox>
</div>

<h2 class="winui-SubtitleTextBlockStyle">uniformToFill, 200</h2>
<div class="row">
	<Viewbox stretch="uniformToFill" style="width: 200px; height: 200px">{@render sample()}</Viewbox>
</div>

<h2 class="winui-SubtitleTextBlockStyle">none, 200</h2>
<div class="row">
	<Viewbox stretch="none" style="width: 200px; height: 200px">{@render sample()}</Viewbox>
</div>

<h2 class="winui-SubtitleTextBlockStyle">uniform, 100</h2>
<div class="row">
	<Viewbox style="width: 100px; height: 100px">{@render sample()}</Viewbox>
</div>

<h2 class="winui-SubtitleTextBlockStyle">downOnly at 200 and at 100</h2>
<div class="row">
	<Viewbox stretchDirection="downOnly" style="width: 200px; height: 200px"
		>{@render sample()}</Viewbox
	>
	<Viewbox stretchDirection="downOnly" style="width: 100px; height: 100px"
		>{@render sample()}</Viewbox
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">upOnly at 100</h2>
<div class="row">
	<Viewbox stretchDirection="upOnly" style="width: 100px; height: 100px">{@render sample()}</Viewbox
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no size</h2>
<div class="row">
	<Viewbox>{@render sample()}</Viewbox>
</div>

{#snippet sample()}
	<!-- ViewboxPage.xaml:28-51 — Border, DarkGray stack, four coloured rectangles, image, and caption. -->
	<Border borderBrush="#808080" borderThickness={15}>
		<div class="stack">
			<div class="bars">
				<div class="bar blue"></div>
				<div class="bar green"></div>
				<div class="bar red"></div>
				<div class="bar yellow"></div>
			</div>
			<img src="/Slices.png" alt="" width="90" height="90" />
			<div class="caption">This is text.</div>
		</div>
	</Border>
{/snippet}

<style>
	/* c1-allow: harness layout, not a WinUI value */
	.row {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}

	.stack {
		/* c1-allow: ViewboxPage.xaml:29 — StackPanel Background="DarkGray". */
		background: #a9a9a9;
	}

	/* c1-allow: ViewboxPage.xaml:30 — the inner StackPanel has Orientation="Horizontal". */
	.bars {
		display: flex;
	}

	/* c1-allow: ViewboxPage.xaml:31-46 — rectangles have Width="40" and Height="10". */
	.bar {
		width: 40px;
		height: 10px;
	}

	.blue {
		/* c1-allow: ViewboxPage.xaml:34 — Fill="Blue". */
		background: #0000ff;
	}

	.green {
		/* c1-allow: ViewboxPage.xaml:38 — Fill="Green". */
		background: #008000;
	}

	.red {
		/* c1-allow: ViewboxPage.xaml:42 — Fill="Red". */
		background: #ff0000;
	}

	.yellow {
		/* c1-allow: ViewboxPage.xaml:46 — Fill="Yellow". */
		background: #ffff00;
	}

	/* c1-allow: ViewboxPage.xaml:48 — the image is 90×90; block removes the HTML line box. */
	img {
		display: block;
		/* An Image in a vertical StackPanel is arranged across the panel's width and centres its
		   bitmap in that slot; measured on the original, the 90px image sits mid-way across the
		   160px stack. */
		margin: 0 auto;
	}

	/* c1-allow: ViewboxPage.xaml:49 — TextBlock HorizontalAlignment="Center". */
	.caption {
		text-align: center;
	}
</style>
