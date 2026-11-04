<script lang="ts">
	import { SemanticZoom } from '@harena-hq/winui-svelte/preview';

	// One detailed list and one summary list, short enough that both fit the 200-tall box.
	const ITEMS = ['Button', 'CheckBox', 'RadioButton', 'ToggleSwitch'];
	const GROUPS = ['Basic input', 'Collections', 'Scrolling'];
</script>

<svelte:head><title>SemanticZoom — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">SemanticZoom</h1>
<p class="winui-BodyTextBlockStyle">
	Two views of one collection in the same box, one shown at a time, with a cross-fade between them.
</p>

<h2 class="winui-SubtitleTextBlockStyle">the zoomed-in view active — a short list of items</h2>
<div class="box">
	<SemanticZoom class="zoom" zoomedInViewActive {zoomedInView} {zoomedOutView} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">
	the zoomed-out view active — a short list of group names
</h2>
<div class="box">
	<SemanticZoom class="zoom" zoomedInViewActive={false} {zoomedInView} {zoomedOutView} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">
	zoomOutButtonEnabled with the zoomed-in view active — the button is drawn
</h2>
<div class="box">
	<SemanticZoom
		class="zoom"
		zoomedInViewActive
		zoomOutButtonEnabled
		{zoomedInView}
		{zoomedOutView}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">
	changeViews false with the zoomed-in view active — clicking the out view does nothing
</h2>
<div class="box">
	<SemanticZoom
		class="zoom"
		zoomedInViewActive
		changeViews={false}
		{zoomedInView}
		{zoomedOutView}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="box">
	<SemanticZoom class="zoom" zoomedInViewActive disabled {zoomedInView} {zoomedOutView} />
</div>

{#snippet zoomedInView()}
	<ul class="list">
		{#each ITEMS as item (item)}
			<li class="winui-BodyTextBlockStyle">{item}</li>
		{/each}
	</ul>
{/snippet}

{#snippet zoomedOutView()}
	<ul class="list">
		{#each GROUPS as group (group)}
			<li class="winui-SubtitleTextBlockStyle">{group}</li>
		{/each}
	</ul>
{/snippet}

<style>
	/* c1-allow: acceptance harness layout; the one-pixel currentcolor border makes each
	   specified 300 by 200 box measurable. */
	.box {
		width: 300px;
		height: 200px;
		border: 1px solid currentcolor; /* c1-allow: acceptance harness baseline border makes each box measurable. */
	}

	/* The control takes its size from the harness box, which is what row 3's corner button and
	   the same-bounds claim are measured against. */
	:global(.zoom) {
		width: 100%;
		height: 100%;
	}

	/* c1-allow: acceptance harness content, not a WinUI template — a plain list so that the two
	   views differ visibly from each other. */
	.list {
		margin: 0;
		padding: 8px 8px 8px 24px;
	}
</style>
