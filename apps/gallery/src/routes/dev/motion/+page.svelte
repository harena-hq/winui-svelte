<script lang="ts">
	const FRAMES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
</script>

<svelte:head><title>Motion — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Motion</h1>

<p class="winui-BodyTextBlockStyle">
	Each strip shows eleven frames of one animation, paused at negative delays, so a baseline compares
	the curve instead of the resting frame. The duration is fixed at 1000ms and cancels out, so the
	picture says nothing about it.
</p>

<h2 class="winui-SubtitleTextBlockStyle">linear</h2>
<p class="winui-CaptionTextBlockStyle">
	BrushTransition's easing, SharedTransitionAnimations.cpp:15
</p>
<div class="track curve-1">
	{#each FRAMES as k (k)}
		<span class="marker" style={`animation-delay: ${-k * 100}ms`}></span>
	{/each}
</div>

<h2 class="winui-SubtitleTextBlockStyle">ControlFastOutSlowInKeySpline</h2>
<p class="winui-CaptionTextBlockStyle">
	generic.xaml:23271 defines it as 0,0,0,1; the token layer emits it as cubic-bezier(0, 0, 0, 1)
</p>
<div class="track curve-2">
	{#each FRAMES as k (k)}
		<span class="marker" style={`animation-delay: ${-k * 100}ms`}></span>
	{/each}
</div>

<h2 class="winui-SubtitleTextBlockStyle">cubic-bezier(0.8, 0, 0.2, 1)</h2>
<p class="winui-CaptionTextBlockStyle">
	the implicit-transition and connected-animation curve, SharedTransitionAnimations.cpp:22 and
	ConnectedAnimationService.cpp:27-28
</p>
<div class="track curve-3">
	{#each FRAMES as k (k)}
		<span class="marker" style={`animation-delay: ${-k * 100}ms`}></span>
	{/each}
</div>

<h2 class="winui-SubtitleTextBlockStyle">cubic-bezier(0.1, 0.9, 0.2, 1)</h2>
<p class="winui-CaptionTextBlockStyle">
	DrillIn's scale and Slide's entrance, ThemeAnimations.cpp:1091-1093 and
	ThemeTransitions.cpp:1547-1548
</p>
<div class="track curve-4">
	{#each FRAMES as k (k)}
		<span class="marker" style={`animation-delay: ${-k * 100}ms`}></span>
	{/each}
</div>

<h2 class="winui-SubtitleTextBlockStyle">cubic-bezier(0.17, 0.17, 0, 1)</h2>
<p class="winui-CaptionTextBlockStyle">DrillIn's opacity, ThemeAnimations.cpp:1097-1099</p>
<div class="track curve-5">
	{#each FRAMES as k (k)}
		<span class="marker" style={`animation-delay: ${-k * 100}ms`}></span>
	{/each}
</div>

<h2 class="winui-SubtitleTextBlockStyle">cubic-bezier(0.7, 0, 1, 0.5)</h2>
<p class="winui-CaptionTextBlockStyle">Slide's exit, ThemeTransitions.cpp:1549-1550</p>
<div class="track curve-6">
	{#each FRAMES as k (k)}
		<span class="marker" style={`animation-delay: ${-k * 100}ms`}></span>
	{/each}
</div>

<style>
	@keyframes motion-frame {
		from {
			translate: 0px;
		}

		to {
			translate: 472px;
		}
	}

	/* c1-allow: harness layout, not a WinUI value */
	.track {
		position: relative;
		width: 480px;
		height: 24px;
		background: var(--winui-CardStrokeColorDefaultBrush);
	}

	/* c1-allow: harness layout, not a WinUI value */
	.marker {
		position: absolute;
		top: 8px;
		width: 8px;
		height: 8px;
		background: var(--winui-AccentFillColorDefaultBrush);
		/* c1-allow: the instrument's sampling base is 1000ms and cancels out of the picture; it is not a WinUI value */
		animation: motion-frame 1000ms paused both;
	}

	/* BrushTransition's easing, SharedTransitionAnimations.cpp:15 */
	.curve-1 .marker {
		animation-timing-function: linear;
	}

	/* generic.xaml:23271 defines it as 0,0,0,1; the token layer emits cubic-bezier(0, 0, 0, 1) */
	.curve-2 .marker {
		animation-timing-function: var(--winui-ControlFastOutSlowInKeySpline);
	}

	/* The implicit-transition and connected-animation curve, SharedTransitionAnimations.cpp:22 and ConnectedAnimationService.cpp:27-28 */
	.curve-3 .marker {
		animation-timing-function: cubic-bezier(0.8, 0, 0.2, 1);
	}

	/* DrillIn's scale and Slide's entrance, ThemeAnimations.cpp:1091-1093 and ThemeTransitions.cpp:1547-1548 */
	.curve-4 .marker {
		animation-timing-function: cubic-bezier(0.1, 0.9, 0.2, 1);
	}

	/* DrillIn's opacity, ThemeAnimations.cpp:1097-1099 */
	.curve-5 .marker {
		animation-timing-function: cubic-bezier(0.17, 0.17, 0, 1);
	}

	/* Slide's exit, ThemeTransitions.cpp:1549-1550 */
	.curve-6 .marker {
		animation-timing-function: cubic-bezier(0.7, 0, 1, 0.5);
	}
</style>
