<script lang="ts">
	import { AnimatedVisualPlayer, type AnimatedVisual } from '@harena-hq/winui-svelte/preview';

	const TALL: AnimatedVisual = {
		width: 120,
		height: 180,
		duration: 1000,
		visual: tallVisual
	};

	const INSTANT: AnimatedVisual = {
		width: 120,
		height: 180,
		duration: 0,
		visual: tallVisual
	};

	let quarterPlayer = $state<ReturnType<typeof AnimatedVisualPlayer>>();

	$effect(() => {
		quarterPlayer?.setProgress(0.25);
	});
</script>

<svelte:head><title>AnimatedVisualPlayer — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">AnimatedVisualPlayer</h1>

<!-- Playwright's `animations: 'disabled'` finishes CSS animations but does not stop a
     requestAnimationFrame loop. Every row except the zero-duration branch therefore disables
     auto-play so its baseline has a deterministic progress. The zero-duration play is below the
     20 ms floor at AnimatedVisualPlayer.cpp:44-51 and settles at progress 0 before a frame. -->
<div class="rows">
	<h2 class="winui-SubtitleTextBlockStyle">No source</h2>
	<AnimatedVisualPlayer autoPlay={false} />
	<h2 class="winui-SubtitleTextBlockStyle">No visual, with fallback</h2>
	<AnimatedVisualPlayer source={null} {fallbackContent} autoPlay={false} />
	<h2 class="winui-SubtitleTextBlockStyle">No visual, without fallback</h2>
	<AnimatedVisualPlayer source={null} autoPlay={false} />
	<h2 class="winui-SubtitleTextBlockStyle">Uniform in a wide box</h2>
	<AnimatedVisualPlayer source={TALL} autoPlay={false} style="width: 200px; height: 120px" />
	<h2 class="winui-SubtitleTextBlockStyle">Uniform in a tall box</h2>
	<AnimatedVisualPlayer source={TALL} autoPlay={false} style="width: 120px; height: 200px" />
	<h2 class="winui-SubtitleTextBlockStyle">UniformToFill</h2>
	<AnimatedVisualPlayer
		source={TALL}
		autoPlay={false}
		stretch="uniformToFill"
		style="width: 200px; height: 120px"
	/>
	<h2 class="winui-SubtitleTextBlockStyle">Fill</h2>
	<AnimatedVisualPlayer
		source={TALL}
		autoPlay={false}
		stretch="fill"
		style="width: 200px; height: 120px"
	/>
	<h2 class="winui-SubtitleTextBlockStyle">None, box smaller than the visual</h2>
	<AnimatedVisualPlayer
		source={TALL}
		autoPlay={false}
		stretch="none"
		style="width: 80px; height: 80px"
	/>
	<h2 class="winui-SubtitleTextBlockStyle">None, box larger than the visual</h2>
	<AnimatedVisualPlayer
		source={TALL}
		autoPlay={false}
		stretch="none"
		style="width: 200px; height: 240px"
	/>
	<h2 class="winui-SubtitleTextBlockStyle">Natural size</h2>
	<AnimatedVisualPlayer source={TALL} autoPlay={false} />
	<h2 class="winui-SubtitleTextBlockStyle">Progress one quarter</h2>
	<AnimatedVisualPlayer bind:this={quarterPlayer} source={TALL} autoPlay={false} />
	<h2 class="winui-SubtitleTextBlockStyle">Auto-play with a zero duration</h2>
	<AnimatedVisualPlayer source={INSTANT} />
</div>

{#snippet fallbackContent()}<span>No visual available</span>{/snippet}

{#snippet tallVisual(progress: number)}
	<svg viewBox="0 0 120 180" preserveAspectRatio="none" aria-hidden="true">
		<rect width="120" height="180" fill="var(--animated-visual-harness-background)" />
		<rect
			y={180 - 180 * progress}
			width="120"
			height={180 * progress}
			fill="var(--animated-visual-harness-progress)"
		/>
	</svg>
{/snippet}

<style>
	/* These are the harness's own colours, chosen to stay legible in all three themes. A harness
	   source is not a transcription of an upstream visual. The wrapper passes them into the SVGs. */
	.rows {
		/* c1-allow: Harness-owned source colour, chosen for three-theme contrast. */
		--animated-visual-harness-background: #0067c0;
		/* c1-allow: Harness-owned source colour, chosen for three-theme contrast. */
		--animated-visual-harness-progress: #ffb900;
		/* The flex column and its gap only lay out harness rows; they are not visual tokens. */
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* The source receives its already-fitted box, so its full-bleed SVG draws at 100% of it. */
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
