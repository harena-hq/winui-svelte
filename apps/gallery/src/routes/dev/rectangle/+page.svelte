<script lang="ts">
	import { Rectangle } from 'winui-svelte/preview';

	// ShapePage.xaml:27-28 — the original's own sample colours: its ellipse and its rectangle
	// are filled SteelBlue and stroked Black. A shape's fill is a value its caller supplies, so
	// these are a sample's colours and not the theme's, and they are literals here for that
	// reason.
	//
	// Said plainly rather than left to be found: C1 reads a double-quoted presentation attribute
	// and does not read an expression, so naming them here also puts them out of the gate's
	// reach. That is acceptable on an unlinked harness route and it is not acceptable on a
	// Gallery page — the Shape page writes them as attributes under a `c1-allow` citing this
	// same source line, which is what dev/viewbox does for ViewboxPage.xaml's four fills.
	const SAMPLE_FILL = 'steelblue';
	const SAMPLE_STROKE = 'black';
</script>

<!-- /dev/ is the unlinked visual acceptance harness; Gallery navigation never links to these routes. -->
<svelte:head><title>Rectangle — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Rectangle</h1>

<h2 class="winui-SubtitleTextBlockStyle">strokeThickness 2</h2>
<div class="row">
	<Rectangle class="shape" fill={SAMPLE_FILL} stroke={SAMPLE_STROKE} strokeThickness={2} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">no stroke</h2>
<div class="row"><Rectangle class="shape" fill={SAMPLE_FILL} /></div>

<h2 class="winui-SubtitleTextBlockStyle">zero strokeThickness</h2>
<div class="row">
	<Rectangle class="shape" fill={SAMPLE_FILL} stroke={SAMPLE_STROKE} strokeThickness={0} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">no fill</h2>
<div class="row"><Rectangle class="shape" stroke={SAMPLE_STROKE} strokeThickness={2} /></div>

<h2 class="winui-SubtitleTextBlockStyle">zero radii</h2>
<div class="row">
	<Rectangle
		class="shape"
		fill={SAMPLE_FILL}
		stroke={SAMPLE_STROKE}
		strokeThickness={2}
		radiusX={0}
		radiusY={0}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">unequal radii</h2>
<div class="row">
	<Rectangle
		class="shape"
		fill={SAMPLE_FILL}
		stroke={SAMPLE_STROKE}
		strokeThickness={2}
		radiusX={20}
		radiusY={8}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">clamped radii</h2>
<div class="row">
	<Rectangle
		class="shape"
		fill={SAMPLE_FILL}
		stroke={SAMPLE_STROKE}
		strokeThickness={2}
		radiusX={100}
		radiusY={100}
	/>
</div>

<style>
	/* c1-allow: harness layout; each shape's size is owned by this page. */
	.row {
		display: flex;
	}

	/* c1-allow: harness measurement size, not a WinUI value. */
	:global(.shape) {
		width: 100px;
		height: 100px;
	}
</style>
