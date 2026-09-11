<script lang="ts">
	import { EASING_MODES, EASING_NAMES, linearEasing, type EasingName } from '$lib/easing';

	const FRAMES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	const SOURCE_LINES = {
		BackEase: 114,
		BounceEase: 288,
		CircleEase: 88,
		CubicEase: 194,
		ElasticEase: 242,
		ExponentialEase: 139,
		PowerEase: 160,
		QuadraticEase: 178,
		QuarticEase: 210,
		QuinticEase: 226,
		SineEase: 339
	} as const;

	// One `linear()` string per curve, not one per marker. Each carries 256 stops and runs to
	// about two kilobytes; building it inside the frame loop wrote 363 copies into the
	// prerendered HTML and took this one page to 984KB, against 11KB for `dev/motion`. The
	// thirty-three strings reach their eleven markers each through a custom property on the
	// track, because a custom property inherits and `animation-timing-function` does not.
	const CURVES: Record<EasingName, Record<string, string>> = Object.fromEntries(
		EASING_NAMES.map((name) => [
			name,
			Object.fromEntries(EASING_MODES.map((mode) => [mode, linearEasing(name, mode)]))
		])
	) as Record<EasingName, Record<string, string>>;
</script>

<svelte:head><title>Easing functions — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Easing functions</h1>

<p class="winui-BodyTextBlockStyle">
	Thirty-three strips show eleven frames each, paused at negative delays. Each is one of XAML's
	eleven easing functions in one of its three modes, carried into CSS as a 256-stop linear().
</p>

{#each EASING_NAMES as name (name)}
	<section>
		<h2 class="winui-SubtitleTextBlockStyle">{name}</h2>
		{#each EASING_MODES as mode (mode)}
			<p class="winui-CaptionTextBlockStyle">
				{mode}
				{name}, EasingFunctions.cpp:{SOURCE_LINES[name]}
			</p>
			<div class="track" style={`--curve: ${CURVES[name][mode]}`}>
				{#each FRAMES as k (k)}
					<span class="marker" style={`animation-delay: ${-k * 100}ms`}></span>
				{/each}
			</div>
		{/each}
	</section>
{/each}

<style>
	@keyframes easing-function-frame {
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
		/* A lane wide enough for the curves that leave the track. Six of the thirty-three do:
		   BackEase and ElasticEase undershoot and overshoot in all three modes, and the furthest
		   left any marker goes is 177px before its track — BackEase EaseIn, whose closed form
		   dips to about -0.375 before returning to 1. The dev layout's own 24px gutter left four
		   of those six running off the left of the page, where a screenshot cannot photograph
		   them and only the spec's arithmetic would have noticed. Measured, then rounded up. */
		margin-left: 200px;
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
		animation: easing-function-frame 1000ms paused both;
		/* Set on the track above, because one curve serves eleven markers. */
		animation-timing-function: var(--curve);
	}
</style>
