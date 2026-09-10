<script lang="ts">
	import { Polyline } from 'winui-svelte';

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
	const SAMPLE_FILL = 'steelblue';
	const SAMPLE_STROKE = 'black';
</script>

<!-- /dev/ is the unlinked visual acceptance harness; Gallery navigation never links to these routes. -->
<svelte:head><title>Polyline — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Polyline</h1>

<h2 class="winui-SubtitleTextBlockStyle">strokeThickness 2</h2>
<div class="row">
	<Polyline stroke={SAMPLE_STROKE} strokeThickness={2} points="10,100 60,40 200,40 250,100" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">no stroke</h2>
<div class="row"><Polyline fill={SAMPLE_FILL} points="10,100 60,40 200,40 250,100" /></div>

<h2 class="winui-SubtitleTextBlockStyle">zero strokeThickness</h2>
<div class="row">
	<Polyline
		fill={SAMPLE_FILL}
		stroke={SAMPLE_STROKE}
		strokeThickness={0}
		points="10,100 60,40 200,40 250,100"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">filled</h2>
<div class="row">
	<Polyline fill={SAMPLE_FILL} stroke={SAMPLE_STROKE} points="10,100 60,40 200,40 250,100" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">self crossing, evenOdd</h2>
<div class="row"><Polyline fill={SAMPLE_FILL} points="50,0 79,91 2,35 98,35 21,91" /></div>

<h2 class="winui-SubtitleTextBlockStyle">self crossing, nonzero</h2>
<div class="row">
	<Polyline fill={SAMPLE_FILL} fillRule="nonzero" points="50,0 79,91 2,35 98,35 21,91" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">empty points</h2>
<div class="row"><Polyline fill={SAMPLE_FILL} stroke={SAMPLE_STROKE} points="" /></div>

<style>
	/* c1-allow: harness layout, not a WinUI value. */
	.row {
		display: flex;
	}
</style>
