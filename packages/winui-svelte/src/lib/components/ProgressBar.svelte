<script lang="ts" module>
	export interface ProgressBarProps {
		/** RangeBase.Value. The current progress value. */
		value?: number;
		/** RangeBase.Minimum. The lower bound used to calculate the filled proportion. */
		minimum?: number;
		/**
		 * RangeBase.Maximum. Defaults to 100 because the control's own style sets it at
		 * `ProgressBar.xaml:9`, not because RangeBase does.
		 */
		maximum?: number;
		/** IsIndeterminate. Replaces the determinate fill with the repeating moving indicators. */
		isIndeterminate?: boolean;
		/** ShowPaused. Selects the paused foreground color. */
		showPaused?: boolean;
		/**
		 * ShowError. It wins over `showPaused` when both are true, matching
		 * `ProgressBar.cpp:87`.
		 */
		showError?: boolean;
		class?: string;
		style?: string;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// `Visibility` is deliberately absent. `ProgressBar.cpp:89` requires it before entering
	// any indeterminate state; a DOM element that is not displayed runs no CSS animation, so
	// there is nothing to build.
	//
	// The reposition and fade transitions are also deliberately absent. `ProgressBar.xaml:22`
	// runs a RepositionThemeAnimation when the determinate indicator's length changes, and
	// `ProgressBar.xaml:42-44` runs FadeInThemeAnimation when the bar leaves the indeterminate
	// state. Both are platform theme animations whose curves are nowhere in the template, so
	// reproducing them would mean inventing them; they are deferred to the Motion tranche.
</script>

<script lang="ts">
	import { Progress } from 'bits-ui';

	let {
		value = 0,
		minimum = 0,
		maximum = 100,
		isIndeterminate = false,
		showPaused = false,
		showError = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ProgressBarProps = $props();

	const state = $derived(
		isIndeterminate
			? showError
				? 'indeterminate-error'
				: showPaused
					? 'indeterminate-paused'
					: 'indeterminate'
			: showError
				? 'error'
				: showPaused
					? 'paused'
					: 'determinate'
	);
	const percent = $derived(
		isIndeterminate || maximum - minimum === 0
			? 0
			: Math.min(100, Math.max(0, ((value - minimum) / (maximum - minimum)) * 100))
	);

	// `ProgressBar.cpp:87` enters six resting states. `Normal` is never entered by the code;
	// `Updating` and `UpdatingError` exist only inside SetProgressBarIndicatorWidth to
	// trigger a reposition transition and are motion, not resting looks.
	//
	// Passing null to bits-ui is intentional: its Progress.Root keeps the progressbar role
	// and min/max ARIA values, while omitting aria-valuenow for the indeterminate state.
</script>

<Progress.Root value={isIndeterminate ? null : value} min={minimum} max={maximum}>
	{#snippet child({ props })}
		<!-- `data-progress-state` is this component's state machine. bits-ui already writes
		     its own `data-state` here, and the two attributes mean different things. -->
		<div
			bind:this={ref}
			{...props}
			{...rest}
			class={['root', className]}
			{style}
			data-progress-state={state}
		>
			<div class="clip">
				<div class="track"></div>
				<div class="determinate" style:width="{percent}%"></div>
				<div class="indeterminate one"></div>
				<div class="indeterminate two"></div>
			</div>
		</div>
	{/snippet}
</Progress.Root>

<style>
	.root {
		position: relative;
		min-height: var(--winui-ProgressBarMinHeight);
		border-style: solid;
		border-width: var(--winui-ProgressBarBorderThemeThickness);
		border-color: var(--winui-ProgressBarBorderBrush);
		border-radius: var(--winui-ProgressBarCornerRadius);
		box-sizing: border-box;
	}

	.clip {
		position: relative;
		height: var(--winui-ProgressBarMinHeight);
		overflow: hidden;
	}

	.track {
		position: absolute;
		inset-inline: 0;
		top: 50%;
		transform: translateY(-50%);
		height: var(--winui-ProgressBarTrackHeight);
		background: var(--winui-ProgressBarBackground);
		border-radius: var(--winui-ProgressBarTrackCornerRadius);
	}

	.determinate,
	.indeterminate {
		position: absolute;
		inset-block: 0;
		left: 0;
		background: var(--winui-ProgressBarForeground);
		border-radius: var(--winui-ProgressBarCornerRadius);
	}

	.indeterminate {
		opacity: 0;
	}

	.one {
		width: 40%;
	}

	.two {
		width: 60%;
	}

	.determinate {
		/* c1-allow: ProgressBar.xaml:86, Duration="0:0:0.167" on the determinate color storyboard */
		transition: background-color 167ms;
	}

	/* `determinate` is the base state and has no rule of its own: the base layer above is
	   already what it looks like. */

	.root[data-progress-state='paused'] .determinate {
		background: var(--winui-ProgressBarPausedForegroundColor);
	}

	.root[data-progress-state='error'] .determinate {
		background: var(--winui-ProgressBarErrorForegroundColor);
	}

	.root[data-progress-state='indeterminate'] .track {
		opacity: 0;
	}

	.root[data-progress-state='indeterminate'] .determinate {
		width: 0;
	}

	.root[data-progress-state='indeterminate'] .indeterminate {
		opacity: 1;
	}

	.root[data-progress-state='indeterminate'] .one {
		animation-name: indicator-one;
	}

	.root[data-progress-state='indeterminate'] .two {
		animation-name: indicator-two;
	}

	.root[data-progress-state='indeterminate'] .one,
	.root[data-progress-state='indeterminate'] .two {
		/* c1-allow: ProgressBar.xaml:104, the indeterminate storyboard's 2-second repeat */
		animation-duration: 2s;
		animation-iteration-count: infinite;
	}

	.root[data-progress-state='indeterminate-paused'] .track,
	.root[data-progress-state='indeterminate-paused'] .determinate,
	.root[data-progress-state='indeterminate-paused'] .one,
	.root[data-progress-state='indeterminate-error'] .track,
	.root[data-progress-state='indeterminate-error'] .determinate,
	.root[data-progress-state='indeterminate-error'] .one {
		opacity: 0;
	}

	.root[data-progress-state='indeterminate-paused'] .two,
	.root[data-progress-state='indeterminate-error'] .two {
		width: 100%;
		opacity: 1;
		transform: translateX(0);
		animation-name: none;
	}

	.root[data-progress-state='indeterminate-paused'] .two {
		background: var(--winui-ProgressBarPausedForegroundColor);
	}

	.root[data-progress-state='indeterminate-error'] .two {
		background: var(--winui-ProgressBarErrorForegroundColor);
	}

	@keyframes indicator-one {
		0% {
			transform: translateX(-100%);
			animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
		}
		75%,
		100% {
			transform: translateX(300%);
		}
	}

	@keyframes indicator-two {
		0%,
		37.5% {
			transform: translateX(-150%);
			animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
		}
		100% {
			transform: translateX(166%);
		}
	}

	/* ADR 0016. Entering `Paused` or `Error` is the state's own `ColorAnimation`
	   (ProgressBar.xaml:86 and the `Paused` state after it) and keeps its time. Coming back to
	   `Determinate` is a `VisualTransition` (:30, :35), which the visual state manager skips to
	   its end when the system's animations are off, so the colour lands at once. */
	@media (prefers-reduced-motion: reduce) {
		.root:not([data-progress-state='paused']):not([data-progress-state='error']) .determinate {
			transition-duration: 0s;
		}
	}
</style>
