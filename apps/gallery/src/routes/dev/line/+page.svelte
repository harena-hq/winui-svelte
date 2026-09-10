<script lang="ts">
	import { Line } from 'winui-svelte';

	// LinePage.xaml:29, :105, :168 — the Line page strokes its three shapes SteelBlue, Black and
	// DarkGoldenRod. A shape's brushes are values its caller supplies, so these are a sample's
	// colours and not the theme's, and they are literals here for that reason. The harness uses
	// two of the three; it is not the Gallery page and owes it no palette.
	//
	// Said plainly rather than left to be found: C1 reads a double-quoted presentation attribute
	// and does not read an expression, so naming them here also puts them out of the gate's
	// reach. That is acceptable on an unlinked harness route and it is not acceptable on a
	// Gallery page — unit 5's Line page declares them in its own style block under a `c1-allow`
	// citing these lines, which is what the Shape page does. (Written as "style block" and not
	// as the tag: a comment inside `<script>` is not inert to Svelte's parser, and spelling the
	// tag here closed the script element three files at a time.)
	const SAMPLE_STROKE = 'black';
</script>

<!-- /dev/ is the unlinked visual acceptance harness; Gallery navigation never links to these routes. -->
<svelte:head><title>Line — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Line</h1>

<h2 class="winui-SubtitleTextBlockStyle">strokeThickness 5</h2>
<div class="row">
	<Line stroke={SAMPLE_STROKE} strokeThickness={5} x1={0} y1={0} x2={200} y2={0} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">no stroke</h2>
<div class="row"><Line x1={0} y1={0} x2={200} y2={0} /></div>

<h2 class="winui-SubtitleTextBlockStyle">zero strokeThickness</h2>
<div class="row">
	<Line stroke={SAMPLE_STROKE} strokeThickness={0} x1={0} y1={0} x2={200} y2={0} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">diagonal</h2>
<div class="row">
	<Line stroke={SAMPLE_STROKE} strokeThickness={5} x1={0} y1={0} x2={120} y2={80} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">reversed coordinates</h2>
<div class="row">
	<Line stroke={SAMPLE_STROKE} strokeThickness={5} x1={200} y1={100} x2={0} y2={0} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">all zero</h2>
<div class="row"><Line /></div>

<style>
	/* c1-allow: harness layout, not a WinUI value. */
	.row {
		display: flex;
	}
</style>
