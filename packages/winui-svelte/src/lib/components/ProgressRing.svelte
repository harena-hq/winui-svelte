<script lang="ts" module>
	export interface ProgressRingProps {
		/** IsActive. Whether the progress ring is visible and running. */
		active?: boolean;
		/** IsIndeterminate. Whether the ring uses the repeating indeterminate composition. */
		indeterminate?: boolean;
		/**
		 * Value. The current progress value, clamped into `[minimum, maximum]` as `CoerceValue`
		 * does at `ProgressRing.cpp:420`.
		 */
		value?: number;
		/** Minimum. The lower bound used to calculate the determinate proportion. */
		minimum?: number;
		/** Maximum. The upper bound used to calculate the determinate proportion. */
		maximum?: number;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// `DeterminateSource` and `IndeterminateSource` are `MUX_PREVIEW` properties that replace
	// the Lottie compositions wholesale. There is no `IAnimatedVisualSource` here to accept.
	//
	// A determinate ring sweeps up and snaps down. `UpdateLottieProgress` (ProgressRing.cpp:305-325)
	// plays the composition from the old value's progress to the new one when that rises, and
	// sets the new progress when it does not; the instance script says when it runs and how long
	// a play takes. The play reads no animation switch (ADR 0016), so reduced motion keeps it.
	//
	// `ProgressRingTemplateSettings` is deliberately absent: `EllipseDiameter`, `EllipseOffset`
	// and `MaxSideLength` are back-compat properties that the current template never binds.
</script>

<script lang="ts">
	import { untrack } from 'svelte';

	// Radius and stroke in a 32-unit box, read off the generated Lottie compositions.
	// Indeterminate: ProgressRingIndeterminate.cpp:178 Radius 7 and :215 StrokeThickness 1.5,
	//   both under the Scale:<5,5> at :162, in an 80-unit viewport (:326) — so 35 and 7.5
	//   there, and 14 and 3 once normalised to 32.
	// Determinate: ProgressRingDeterminate.cpp:171 Radius 8 and :207 StrokeThickness 1.5,
	//   both under the Scale:<1.77,1.77> at :204, in a 32-unit viewport (:285) — so 14.16
	//   and 2.655, already in 32.
	// The two disagree because the two compositions were generated separately; measured on
	// the reference guest at 60px they draw a 6px and a 5px stroke, so the difference is real.
	const INDETERMINATE_GEOMETRY = { radius: 14, stroke: 3 };
	const DETERMINATE_GEOMETRY = { radius: 14.16, stroke: 2.655 };

	// The determinate arc's length is not the value's fraction of the range.
	// ProgressRingDeterminate.cpp:269-278 binds TrimEnd to the player's progress with six
	// keyframes, and every eased segment uses the easing built at :254 from the control
	// points (0.167, 0.167) and (0.833, 0.833). Both lie on y = x, so every point of that
	// Bezier does too and each segment is exactly linear — the mapping is piecewise linear,
	// and it is not the identity. It tracks the value up to 0.75, then falls behind, and
	// closes the ring at 0.991667 rather than at 1.
	const TRIM_KEYFRAMES: readonly (readonly [number, number])[] = [
		[0.00833333377, 0.0001],
		[0.25, 0.25],
		[0.5, 0.5],
		[0.75, 0.75],
		[0.983333349, 0.96666666],
		[0.991666675, 1]
	];

	// ProgressRingDeterminate.cpp:155 gives the arc's container a Scale of (0, 0) and :161
	// steps it to (1, 1) at the first keyframe's progress through a StepEasingFunction, so a
	// value below 0.833% of the range draws nothing at all. Without this the round line cap
	// on a zero-length trim paints a dot at twelve o'clock. Measured on the reference guest
	// at 60px: Value 0 leaves no ink, Value 1 draws a 6x5 cap.
	const VISIBILITY_PROGRESS = TRIM_KEYFRAMES[0][0];

	function trimEnd(progress: number): number {
		if (progress <= TRIM_KEYFRAMES[0][0]) return TRIM_KEYFRAMES[0][1];
		for (let i = 1; i < TRIM_KEYFRAMES.length; i++) {
			const [p, v] = TRIM_KEYFRAMES[i];
			if (progress <= p) {
				const [p0, v0] = TRIM_KEYFRAMES[i - 1];
				return v0 + ((progress - p0) / (p - p0)) * (v - v0);
			}
		}
		return 1;
	}

	let {
		active = true,
		indeterminate = true,
		value = 0,
		minimum = 0,
		maximum = 100,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ProgressRingProps = $props();

	const clampedValue = $derived(Math.min(maximum, Math.max(minimum, value)));
	const fraction = $derived(
		maximum - minimum === 0 ? 0 : (clampedValue - minimum) / (maximum - minimum)
	);

	// The composition's duration: ProgressRingDeterminate.cpp:61, c_durationTicks 20000000 ticks
	// of 100ns. A play from p0 to p1 lasts (p1 - p0) of it (AnimatedVisualPlayer.cpp:25-27) and
	// moves linearly in time: the play's keyframe uses a linear easing (:58, :75), and the
	// ring's player (ProgressRing.xaml:32) keeps PlaybackRate at its default of 1
	// (AnimatedVisualPlayer.properties.cpp:119), which AnimatedVisualPlayer.cpp:106-107 hands
	// the play's controller.
	const DURATION_MS = 2000;
	// AnimatedVisualPlayer.cpp:44-48: a play shorter than 20ms is not animated; the player is
	// set to the play's *from* progress, so a rise of under 1% of the range leaves the arc where
	// it was.
	const MIN_PLAY_MS = 20;

	// m_oldValue (ProgressRing.h:62): the old *value*, not its progress, so a range change
	// measures it against the new range (ProgressRing.cpp:312).
	let old = 0;
	// The player's progress, which the arc draws. Mounting an active determinate ring settles it
	// on `fraction` (see the effect below), so that is what the server renders; an indeterminate
	// or inactive ring does not draw it.
	let shown = $state(untrack(() => fraction));
	let frame = 0;

	function stop() {
		cancelAnimationFrame(frame);
		frame = 0;
	}

	// ProgressRing.cpp:305-325. The comparison is on the raw progress and the play on the
	// clamped one (AnimatedVisualPlayer.cpp:704-705). A rise starts at the old value's
	// progress even while an earlier sweep is short of it, so the arc first jumps ahead to
	// where that sweep was going.
	//
	// Time is the frames' own, from the first frame on. Upstream's player pauses a play while
	// its host is hidden or the app suspends and resumes it after (AnimatedVisualPlayer.cpp:329-352,
	// :410-432). A sweep started in a background tab holds at its start until frames resume and
	// then plays in full, as a play started hidden does (:99). A sweep already running when the
	// tab is hidden does not pause: it has ended when the tab returns.
	function updateProgress() {
		const range = maximum - minimum;
		const from = range === 0 ? 0 : (old - minimum) / range;
		const to = fraction;
		stop();
		if (from < to) {
			const start = Math.min(1, Math.max(0, from));
			const end = Math.min(1, Math.max(0, to));
			const duration = (end - start) * DURATION_MS;
			shown = start;
			if (duration >= MIN_PLAY_MS) {
				let t0 = -1;
				const step = (time: number) => {
					if (t0 < 0) t0 = time;
					const k = Math.min(1, (time - t0) / duration);
					shown = start + (end - start) * k;
					frame = k < 1 ? requestAnimationFrame(step) : 0;
				};
				frame = requestAnimationFrame(step);
			}
		} else {
			shown = Math.min(1, Math.max(0, to));
		}
		old = clampedValue;
	}

	// ProgressRing.cpp:327-364. An active determinate ring runs the update, so a value that
	// rose while the ring was indeterminate sweeps from the last determinate one: value changes
	// do not update `old` while indeterminate (:165). An indeterminate ring's looped play (:340)
	// replaces the sweep. An inactive ring's Stop (:359) sets the player's progress to
	// m_currentPlayFromProgress (AnimatedVisualPlayer.cpp:778), which nothing assigns after its
	// initial 0 (AnimatedVisualPlayer.h:136); the ring is transparent until the update runs.
	function updateStates() {
		if (active && !indeterminate) {
			updateProgress();
		} else {
			if (frame && !active) shown = 0;
			stop();
		}
	}

	let applied = false;
	let last = { value: 0, minimum: 0, maximum: 0, active: false, indeterminate: false };
	$effect(() => {
		const now = { value: clampedValue, minimum, maximum, active, indeterminate };
		if (!applied) {
			// OnApplyTemplate (ProgressRing.cpp:49-51) updates unconditionally and then the
			// states, whose second update finds `old` equal to the value and sets it at once.
			applied = true;
			updateProgress();
			updateStates();
		} else {
			// The Value, Maximum and Minimum handlers update only a determinate ring
			// (ProgressRing.cpp:165, :185, :205); IsActive and IsIndeterminate update the
			// states (:144, :149). When a state change and a value change land in one flush and
			// the states will run an update of their own, the value's is skipped, so one update
			// measures from `old`. For IsActive that is the state set first; set second, upstream
			// sweeps while inactive and the activation snaps to the end. For IsIndeterminate it is
			// the value set first. The orders differ only if the value moved while indeterminate:
			// set first, the state plays from `old` to that value and the new value then plays
			// on from there.
			const ranged =
				now.value !== last.value || now.minimum !== last.minimum || now.maximum !== last.maximum;
			const states = now.active !== last.active || now.indeterminate !== last.indeterminate;
			if (ranged && !indeterminate && !(states && active)) updateProgress();
			if (states) updateStates();
		}
		last = now;
	});
	$effect(() => stop);

	const trim = $derived(trimEnd(shown));
	const arcHidden = $derived(!indeterminate && shown < VISIBILITY_PROGRESS);
	const geometry = $derived(indeterminate ? INDETERMINATE_GEOMETRY : DETERMINATE_GEOMETRY);
	const ringState = $derived(
		!active ? 'inactive' : indeterminate ? 'active' : 'determinate-active'
	);

	// The ring is a decorative, non-interactive visual: `ProgressRing.xaml:6` sets
	// `IsHitTestVisible` false and `:11` sets `IsTabStop` false. Upstream has a
	// `ProgressRingAutomationPeer`; do not invent an ARIA role for the wrong element.
	// There is no bits-ui primitive for this shape, and Progress's `<div>` has no use here.
</script>

<div bind:this={ref} {...rest} class={['root', className]} {style} data-ring-state={ringState}>
	<svg class="ring" viewBox="0 0 32 32" aria-hidden="true">
		<circle
			class="track"
			cx="16"
			cy="16"
			r={geometry.radius}
			stroke-width={geometry.stroke}
			fill="none"
			pathLength="1"
		/>
		<circle
			class="arc"
			cx="16"
			cy="16"
			r={geometry.radius}
			stroke-width={geometry.stroke}
			fill="none"
			pathLength="1"
			stroke-linecap="round"
			transform="rotate(-90 16 16)"
			style:stroke-dasharray={indeterminate ? undefined : `${trim} 1`}
			style:visibility={arcHidden ? 'hidden' : undefined}
		/>
	</svg>
</div>

<style>
	.root {
		display: inline-block;
		/* ProgressRing.xaml:12, Setter Property="Width" Value="32" */
		width: 32px;
		/* ProgressRing.xaml:13, Setter Property="Height" Value="32" */
		height: 32px;
		/* ProgressRing.xaml:10, Setter Property="MinWidth" Value="16" */
		min-width: 16px;
		/* ProgressRing.xaml:9, Setter Property="MinHeight" Value="16" */
		min-height: 16px;
	}

	.ring {
		display: block;
		width: 100%;
		height: 100%;
	}

	.track {
		stroke: var(--winui-ProgressRingBackgroundThemeBrush);
	}

	.arc {
		stroke: var(--winui-ProgressRingForegroundThemeBrush);
	}

	.root[data-ring-state='inactive'] {
		/* c1-allow: ProgressRing.xaml:23, Inactive sets LayoutRoot.Opacity to 0 */
		opacity: 0;
	}

	.root[data-ring-state='active'] .ring {
		transform-origin: center;
		animation-name: ring-rotate;
	}

	.root[data-ring-state='active'] .arc {
		animation-name: ring-trim;
	}

	.root[data-ring-state='active'] .ring,
	.root[data-ring-state='active'] .arc {
		/* c1-allow: ProgressRingIndeterminate.cpp:51, c_durationTicks=20000000 WinRT ticks at 100 nanoseconds = 2s */
		animation-duration: 2s;
		animation-iteration-count: infinite;
	}

	/* Composition easing governs the segment ending at a keyframe, while CSS keyframe
	   easing governs the segment starting at one. Every eased segment here uses the same
	   curve, so the curve belongs on CSS's 0% and 50% keyframes. */
	@keyframes ring-rotate {
		0% {
			transform: rotate(0deg);
			animation-timing-function: cubic-bezier(0.167, 0.167, 0.833, 0.833);
		}
		50% {
			transform: rotate(450deg);
			animation-timing-function: cubic-bezier(0.167, 0.167, 0.833, 0.833);
		}
		100% {
			transform: rotate(900deg);
		}
	}

	/* At 100% the trim is a zero-length round cap at path position 0.5 and the container
	   has rotated 900 degrees, or 180 degrees. At 0% the cap is at position 0 with no
	   rotation; the half-turns cancel, making the repeated wrap seamless. */
	@keyframes ring-trim {
		0% {
			stroke-dasharray: 0.0001 1;
			stroke-dashoffset: 0;
			animation-timing-function: cubic-bezier(0.167, 0.167, 0.833, 0.833);
		}
		50% {
			stroke-dasharray: 0.5 1;
			stroke-dashoffset: 0;
			animation-timing-function: cubic-bezier(0.167, 0.167, 0.833, 0.833);
		}
		100% {
			stroke-dasharray: 0 1;
			stroke-dashoffset: -0.5;
		}
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
