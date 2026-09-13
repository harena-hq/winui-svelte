<script lang="ts">
	import { RefreshContainer, RefreshVisualizer } from 'winui-svelte';

	// The list row 7 puts inside the container, long enough that the region it scrolls actually
	// scrolls — a container whose content holds no scrolled region takes no pull at all, which is
	// what `InfoProvider(nullptr)` (`RefreshContainer.cpp:247`) leaves upstream.
	const ITEMS = [
		'Azure',
		'Crimson',
		'Cyan',
		'Fuchsia',
		'Gold',
		'Indigo',
		'Ivory',
		'Khaki',
		'Lavender',
		'Linen',
		'Magenta',
		'Maroon',
		'Navy',
		'Olive'
	];

	// A handler that settles after a delay and changes nothing, so that a drag past the threshold
	// spends a visible second in `refreshing` — which is the whole of what row 7 is for. Without
	// one the container completes the request in the same microtask it raises it, exactly as
	// upstream's `RaiseRefreshRequested` completes a deferral nobody took, and the spin lasts no
	// frames at all. Nothing is inserted: the row's resting render has to be the same before a
	// drag and after one, or it is not a baseline.
	const settleAfterASecond = () => new Promise<void>((resolve) => setTimeout(resolve, 1000));
</script>

<svelte:head><title>PullToRefresh — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">PullToRefresh</h1>
<p class="winui-BodyTextBlockStyle">
	A refresh indicator that fades, turns, pops and spins through five states, and the container that
	reveals it. The states are driven directly here: the gesture that reaches them is a touch pull at
	the start of the scrolled content, as it is upstream, and no button exists to provoke them from a
	page.
</p>

<h2 class="winui-SubtitleTextBlockStyle">idle — opacity 0.4 at the starting angle</h2>
<div class="box">
	<RefreshVisualizer class="visualizer" state="idle" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">peeking — opacity 1 at the starting angle</h2>
<div class="box">
	<RefreshVisualizer class="visualizer" state="peeking" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">
	interacting at a ratio of 0.4 — opacity 0.4, half a turn, and half the parallax
</h2>
<div class="box">
	<RefreshVisualizer class="visualizer" state="interacting" interactionRatio={0.4} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">pending — opacity 1, and a 300ms pop to 1.5 and back</h2>
<div class="box">
	<RefreshVisualizer class="visualizer" state="pending" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">refreshing — opacity 1 and a continuous turn</h2>
<div class="box">
	<RefreshVisualizer class="visualizer" state="refreshing" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">
	idle with pullDirection leftToRight — the starting angle is −90°
</h2>
<div class="box">
	<RefreshVisualizer class="visualizer" state="idle" pullDirection="leftToRight" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">
	a container at rest — it draws nothing of the control, and a downward touch pull reveals it
</h2>
<div class="box container-box">
	<RefreshContainer class="container" onRefreshRequested={settleAfterASecond}>
		<ul class="list">
			{#each ITEMS as item (item)}
				<li class="winui-BodyTextBlockStyle">{item}</li>
			{/each}
		</ul>
	</RefreshContainer>
</div>

<style>
	/* c1-allow: acceptance harness layout; the one-pixel currentcolor border makes each specified
	   200 by 120 box measurable. */
	.box {
		width: 200px;
		height: 120px;
		border: 1px solid currentcolor; /* c1-allow: acceptance harness baseline border makes each box measurable. */
		margin-bottom: 16px;
	}

	/* Row 7's box is the 200-tall bordered list the Gallery's own examples use, not the 120 the
	   six visualizer rows are measured in. */
	.container-box {
		height: 200px;
	}

	:global(.visualizer) {
		width: 100%;
	}

	:global(.container) {
		width: 100%;
		height: 100%;
	}

	/* c1-allow: acceptance harness content, not a WinUI template — a plain scrolling list, so that
	   the container has a region whose start the pull has to begin at. */
	.list {
		margin: 0;
		padding: 8px 8px 8px 24px;
		height: 100%;
		box-sizing: border-box;
		overflow-y: auto;
	}

	/* Rows 4 and 5 animate, and an animation running when the shutter opens is a baseline that
	   disagrees with itself. This stops them and nothing else; the snapshot helper does not set
	   the preference, so it is the reader's own setting that decides. `:global`, because the
	   animations are inside the component and a class handed across that boundary carries no
	   scope hash to reach them with — and `!important` for the same reason one step further on:
	   the rules being overridden carry the component's scope class twice over, and a selector
	   written from outside cannot out-specify a selector it cannot see. Measured without it: both
	   animations kept running under the preference. */
	@media (prefers-reduced-motion: reduce) {
		:global(.visualizer *) {
			animation: none !important;
		}
	}
</style>
