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
	// The determinate play-forward is deliberately absent. `ProgressRing.cpp:305` plays the
	// composition from the old value to the new one when the value rises, so a rising value
	// sweeps over `|to - from| * 2s`, and snaps when it falls. CSS cannot express a duration
	// proportional to the distance, and the asymmetry is not a look; it is deferred to the
	// Motion tranche, so this ring moves to its new value immediately.
	//
	// `ProgressRingTemplateSettings` is deliberately absent: `EllipseDiameter`, `EllipseOffset`
	// and `MaxSideLength` are back-compat properties that the current template never binds.
</script>

<script lang="ts">
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
	const trim = $derived(trimEnd(fraction));
	const arcHidden = $derived(!indeterminate && fraction < VISIBILITY_PROGRESS);
	const geometry = $derived(indeterminate ? INDETERMINATE_GEOMETRY : DETERMINATE_GEOMETRY);
	const state = $derived(!active ? 'inactive' : indeterminate ? 'active' : 'determinate-active');

	// The ring is a decorative, non-interactive visual: `ProgressRing.xaml:6` sets
	// `IsHitTestVisible` false and `:11` sets `IsTabStop` false. Upstream has a
	// `ProgressRingAutomationPeer`; do not invent an ARIA role for the wrong element.
	// There is no bits-ui primitive for this shape, and Progress's `<div>` has no use here.
</script>

<div bind:this={ref} {...rest} class={['root', className]} {style} data-ring-state={state}>
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
</style>
