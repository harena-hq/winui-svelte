<script lang="ts">
	import { Path } from 'winui-svelte';

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
<svelte:head><title>Path — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Path</h1>

<h2 class="winui-SubtitleTextBlockStyle">the Gallery's curve</h2>
<div class="row">
	<Path data="M 10,100 C 100,25 300,250 400,75 H 200" stroke={SAMPLE_STROKE} strokeThickness={2} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">filled</h2>
<div class="row">
	<Path
		data="M 10,100 C 100,25 300,250 400,75 H 200"
		fill={SAMPLE_FILL}
		stroke={SAMPLE_STROKE}
		strokeThickness={2}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">F0 prefix</h2>
<div class="row">
	<Path
		data="F0 M 0,0 L 100,0 L 100,100 L 0,100 Z M 25,25 L 75,25 L 75,75 L 25,75 Z"
		fill={SAMPLE_FILL}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">F1 prefix</h2>
<div class="row">
	<Path
		data="F1 M 0,0 L 100,0 L 100,100 L 0,100 Z M 25,25 L 75,25 L 75,75 L 25,75 Z"
		fill={SAMPLE_FILL}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no prefix</h2>
<div class="row">
	<Path
		data="M 0,0 L 100,0 L 100,100 L 0,100 Z M 25,25 L 75,25 L 75,75 L 25,75 Z"
		fill={SAMPLE_FILL}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no stroke</h2>
<div class="row"><Path data="M 10,100 C 100,25 300,250 400,75 H 200" fill={SAMPLE_FILL} /></div>

<h2 class="winui-SubtitleTextBlockStyle">empty data</h2>
<div class="row"><Path /></div>

<style>
	/* c1-allow: harness layout, not a WinUI value. */
	.row {
		display: flex;
	}
</style>
