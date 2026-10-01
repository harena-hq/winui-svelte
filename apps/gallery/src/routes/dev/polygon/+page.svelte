<script lang="ts">
	import { Polygon } from 'winui-svelte/preview';

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
<svelte:head><title>Polygon — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Polygon</h1>

<h2 class="winui-SubtitleTextBlockStyle">strokeThickness 2</h2>
<div class="row">
	<Polygon
		fill={SAMPLE_FILL}
		stroke={SAMPLE_STROKE}
		strokeThickness={2}
		points="0,100 50,0 100,100"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no stroke</h2>
<div class="row"><Polygon fill={SAMPLE_FILL} points="0,100 50,0 100,100" /></div>

<h2 class="winui-SubtitleTextBlockStyle">zero strokeThickness</h2>
<div class="row">
	<Polygon
		fill={SAMPLE_FILL}
		stroke={SAMPLE_STROKE}
		strokeThickness={0}
		points="0,100 50,0 100,100"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no fill</h2>
<div class="row">
	<Polygon stroke={SAMPLE_STROKE} strokeThickness={2} points="0,100 50,0 100,100" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">offset from origin</h2>
<div class="row">
	<Polygon
		fill={SAMPLE_FILL}
		stroke={SAMPLE_STROKE}
		strokeThickness={2}
		points="10,100 60,40 200,40 250,100"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">self crossing, evenOdd</h2>
<div class="row"><Polygon fill={SAMPLE_FILL} points="50,0 79,91 2,35 98,35 21,91" /></div>

<h2 class="winui-SubtitleTextBlockStyle">self crossing, nonzero</h2>
<div class="row">
	<Polygon fill={SAMPLE_FILL} fillRule="nonzero" points="50,0 79,91 2,35 98,35 21,91" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">empty points</h2>
<div class="row"><Polygon fill={SAMPLE_FILL} stroke={SAMPLE_STROKE} points="" /></div>

<!-- The wedge's right-hand vertex closes at about 13 degrees, whose mitre is 8.6 times the
     half-thickness: past SVG's default limit of 4 and inside XAML's 10, so the two disagree
     here and nowhere else on this page. It is also the one apex that reaches the box's own
     right edge, so a clipping root cuts the point off rather than merely blunting it. Every
     other row's sharpest join is about 53 degrees, which both limits mitre. -->
<h2 class="winui-SubtitleTextBlockStyle">sharp join, past SVG's mitre limit</h2>
<div class="row">
	<Polygon fill={SAMPLE_FILL} stroke={SAMPLE_STROKE} strokeThickness={4} points="0,0 120,14 0,28" />
</div>

<style>
	/* c1-allow: harness layout, not a WinUI value. */
	.row {
		display: flex;
	}
</style>
