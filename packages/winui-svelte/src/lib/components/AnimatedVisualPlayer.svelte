<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/** IAnimatedVisual — what an IAnimatedVisualSource creates, in the shape a page can write. */
	export interface AnimatedVisual {
		/** IAnimatedVisual.Size's x — the composition's own pixel width. */
		width: number;
		/** IAnimatedVisual.Size's y. */
		height: number;
		/** IAnimatedVisual.Duration, in milliseconds. */
		duration: number;
		/** RootVisual, rendered at a progress between 0 and 1. */
		visual: Snippet<[number]>;
	}

	export interface AnimatedVisualPlayerProps {
		/** Source. `undefined` is no source at all; `null` is a source that created no visual,
		 *  which is what puts the player into its fallback state. */
		source?: AnimatedVisual | null;
		/** FallbackContent, drawn when a source creates no visual. */
		fallbackContent?: Snippet;
		/** AutoPlay. */
		autoPlay?: boolean;
		/** PlaybackRate. Negative plays the current play backwards. */
		playbackRate?: number;
		/** Stretch. AnimatedVisualPlayer's default is Uniform — `AnimatedVisualPlayer.idl:108`. */
		stretch?: 'none' | 'fill' | 'uniform' | 'uniformToFill';
		/** IsPlaying, under ADR 0009's naming. The control writes it. */
		playing?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onPlayingChange?: (playing: boolean) => void;
		/** IsAnimatedVisualLoaded, under ADR 0009's naming. The control writes it. */
		animatedVisualLoaded?: boolean;
		/** No WinUI member: ADR 0009's change callback for `animatedVisualLoaded`. */
		onAnimatedVisualLoadedChange?: (loaded: boolean) => void;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// AnimatedVisualPlayer derives from FrameworkElement rather than Control
	// (AnimatedVisualPlayer.idl:75-76), so it has no template and no theme dictionary; it
	// consequently adds no tokens.
	//
	// ArrangeOverride (AnimatedVisualPlayer.cpp:548-635) computes a scale and centres it. Its
	// Stretch::None branch (:570-577) never sets an offset, so it anchors at the origin and clips.
	// Container-query sizing is CSS's counterpart: against a 375x667 source in a 198x198 host,
	// Uniform measured 111.31x198 at 43.34,0; UniformToFill 198x352.17 at 0,-77.08; Fill 198x198
	// at 0,0; and None 375x667 at 0,0.
	//
	// MeasureOverride (AnimatedVisualPlayer.cpp:480-543) returns a natural visual size with infinite
	// space, a fallen-back child's desired size, or {0,0} without a visual. The inline natural width
	// and height below let a caller override them. Without a visual neither is set, so the block's
	// height follows its content and its width is the container's — which is what a FrameworkElement
	// arranged under its default Stretch alignment gets anyway, and the fallback is drawn from the
	// origin under either measure. Measured on the reference guest: a fallback row is 19 tall and an
	// empty player is 0.
	//
	// AnimationPlay's duration is Duration times its direct or wrapping progress span
	// (AnimatedVisualPlayer.cpp:12-28); under 20ms it jumps to `from` and completes (:36-51). A
	// normal play is linear, adding end/jump/start keyframes for a wrapping range (:61-75), loops or
	// runs once (:77-113), and starts its timeline at 1 for a negative rate (:105-113). PlayAsync
	// supersedes a current play after resetting it to `from`, rewrites the two zero/one segments, and
	// clamps both ends (:656-727); SetProgress clamps and completes a play (:739-767); Stop returns
	// to its current play's `from` (:771-780); Pause and Resume hold/release its clock (:213-246);
	// and AutoPlay starts a looping 0..1 play (:782-795, :1069-1077).
	//
	// PlayAsync's Async suffix names WinRT's IAsyncAction. This Promise-returning JS method is
	// `play()`, because a JS caller can already see that it is asynchronous.
	//
	// Deliberately absent: Diagnostics (AnimatedVisualPlayer.idl:80), ProgressObject (:104) and
	// AnimationOptimization (:101) are Composition handles — LottieGen diagnostics, a property
	// set for an external animation, and an animation-lifetime hint — and there is no
	// Composition here to expose or optimise. Duration (:81) is read-only upstream and already
	// belongs to the source, so a second readable name would duplicate it. OnHiding and
	// OnUnhiding (AnimatedVisualPlayer.cpp:175-211) only avoid DWM wake-ups while an app is
	// hidden. TryCreateAnimatedVisual on IAnimatedVisualSource and AnimatedVisualInvalidated on
	// IDynamicAnimatedVisualSource (AnimatedVisualPlayer.idl:24-38) are omitted because this
	// source is the created visual, and replacing it is setting this prop again.
</script>

<script lang="ts">
	let {
		source,
		fallbackContent,
		autoPlay = true,
		playbackRate = 1,
		stretch = 'uniform',
		playing = $bindable(false),
		onPlayingChange,
		animatedVisualLoaded = $bindable(false),
		onAnimatedVisualLoadedChange,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: AnimatedVisualPlayerProps = $props();

	let progress = $state(0);
	// UpdateContent (AnimatedVisualPlayer.cpp:994-1012) distinguishes no source from a source that
	// created no visual: only the explicit latter value loads fallback content.
	const visual = $derived(source ?? null);
	const fallenBack = $derived(source === null);

	type Play = {
		from: number;
		to: number;
		looped: boolean;
		duration: number;
		elapsed: number;
		startedAt: number;
		pausedAt: number | null;
		rate: number;
		rafId: number | null;
		resolve: () => void;
	};
	let currentPlay: Play | null = null;
	let autoPlayedVisual: AnimatedVisual | null = null;
	let previousVisual: AnimatedVisual | null | undefined = undefined;

	const clamp = (value: number) => Math.min(1, Math.max(0, value));

	function setPlaying(value: boolean) {
		if (playing !== value) {
			playing = value;
			onPlayingChange?.(value);
		}
	}

	function complete(play = currentPlay) {
		if (play === null) return;
		if (play.rafId !== null) cancelAnimationFrame(play.rafId);
		if (currentPlay === play) currentPlay = null;
		setPlaying(false);
		play.resolve();
	}

	function elapsedAt(play: Play, now: number) {
		return play.pausedAt === null
			? play.elapsed + (now - play.startedAt) * play.rate
			: play.elapsed;
	}

	function progressAt(play: Play, elapsed: number) {
		const wrapped = ((elapsed % play.duration) + play.duration) % play.duration;
		// AnimationPlay::Start (AnimatedVisualPlayer.cpp:105-113) puts a reverse controller at 1.
		// Preserve that endpoint instead of reducing its exact duration to zero before its first frame.
		const position = play.looped
			? elapsed > 0 && wrapped === 0
				? play.duration
				: wrapped
			: Math.min(play.duration, Math.max(0, elapsed));
		const timeline = position / play.duration;
		if (play.from <= play.to) return play.from + (play.to - play.from) * timeline;
		const switchOver = (1 - play.from) / (1 - play.from + play.to);
		return timeline <= switchOver
			? play.from + ((1 - play.from) * timeline) / switchOver
			: ((timeline - switchOver) * play.to) / (1 - switchOver);
	}

	function schedule(play: Play) {
		play.rafId = requestAnimationFrame((now) => {
			if (currentPlay !== play || play.pausedAt !== null) return;
			const elapsed = elapsedAt(play, now);
			progress = progressAt(play, elapsed);
			if (!play.looped && (elapsed >= play.duration || elapsed <= 0)) {
				complete(play);
				return;
			}
			schedule(play);
		});
	}

	function start(play: Play) {
		if (visual === null || play.pausedAt !== null) return;
		play.startedAt = performance.now();
		schedule(play);
	}

	/** PlayAsync (AnimatedVisualPlayer.cpp:656-727), expressed as a Promise-returning JS method. */
	export function play(from = 0, to = 1, looped = false): Promise<void> {
		// PlayAsync (:664-671) resets and completes a play before making its replacement.
		if (currentPlay !== null) {
			progress = currentPlay.from;
			complete(currentPlay);
		}
		// PlayAsync (:685-706) rewrites the two end segments, then clamps both ends.
		if (to === 0 && from > 0) to = 1;
		if (to > 0 && from === 1) from = 0;
		from = clamp(from);
		to = clamp(to);
		const span = from > to ? 1 - from + to : to - from;
		const duration = (visual?.duration ?? 0) * span;

		return new Promise((resolve) => {
			// AnimationPlay::Start (AnimatedVisualPlayer.cpp:43-51) completes short plays at `from`.
			if (duration < 20) {
				progress = from;
				setPlaying(false);
				resolve();
				return;
			}
			const now = performance.now();
			const rate = playbackRate;
			const play = (currentPlay = {
				from,
				to,
				looped,
				duration,
				elapsed: rate < 0 ? duration : 0,
				startedAt: now,
				pausedAt: null,
				rate,
				rafId: null,
				resolve
			});
			progress = progressAt(play, play.elapsed);
			setPlaying(true);
			start(play);
		});
	}

	/** Pause (AnimatedVisualPlayer.cpp:647-653) holds the current play's clock. */
	export function pause() {
		if (currentPlay === null || currentPlay.pausedAt !== null) return;
		const now = performance.now();
		currentPlay.elapsed = elapsedAt(currentPlay, now);
		currentPlay.pausedAt = now;
		if (currentPlay.rafId !== null) cancelAnimationFrame(currentPlay.rafId);
	}

	/** Resume (AnimatedVisualPlayer.cpp:729-735) releases the current play's clock. */
	export function resume() {
		if (currentPlay === null || currentPlay.pausedAt === null) return;
		currentPlay.pausedAt = null;
		currentPlay.startedAt = performance.now();
		start(currentPlay);
	}

	/** Stop (AnimatedVisualPlayer.cpp:771-780) returns a running play to its `from` value. */
	export function stop() {
		if (currentPlay !== null) setProgress(currentPlay.from);
	}

	/** SetProgress (AnimatedVisualPlayer.cpp:739-767) clamps and completes a running play. */
	export function setProgress(value: number) {
		progress = clamp(value);
		complete();
	}

	$effect(() => {
		const loaded = visual !== null;
		if (animatedVisualLoaded !== loaded) {
			animatedVisualLoaded = loaded;
			onAnimatedVisualLoadedChange?.(loaded);
		}
	});

	$effect(() => {
		if (previousVisual !== undefined && previousVisual !== visual && currentPlay !== null) {
			// OnSourcePropertyChanged unloads the old content and stops its play
			// (AnimatedVisualPlayer.cpp:889-953); failed creation also stops (:994-1007).
			progress = currentPlay.from;
			complete(currentPlay);
		}
		previousVisual = visual;
	});

	$effect(() => {
		if (visual === null) {
			autoPlayedVisual = null;
			return;
		}
		if (autoPlay && autoPlayedVisual !== visual && currentPlay === null) {
			autoPlayedVisual = visual;
			void play(0, 1, true);
		}
	});

	$effect(() => {
		if (currentPlay === null || currentPlay.rate === playbackRate) return;
		// OnPlaybackRatePropertyChanged (AnimatedVisualPlayer.cpp:1121-1128) changes a live controller.
		// Anchor elapsed timeline time before replacing the rate, so the painted frame cannot jump.
		currentPlay.elapsed = elapsedAt(currentPlay, performance.now());
		currentPlay.startedAt = performance.now();
		currentPlay.rate = playbackRate;
	});

	$effect(() => {
		return () => {
			const play = currentPlay;
			if (play !== null && play.rafId !== null) cancelAnimationFrame(play.rafId);
		};
	});

	// Private, and deliberately not `--winui-` prefixed: that prefix means a design token and gate
	// C9 walks every token a source file reads. These are per-instance composition dimensions.
	const rootStyle = $derived(
		visual === null
			? (style ?? '')
			: `--animated-visual-player-width:${visual.width};--animated-visual-player-height:${visual.height};` +
					`width:${visual.width}px;height:${visual.height}px;` +
					(style ?? '')
	);
</script>

<!-- AnimatedVisualPlayerAutomationPeer.cpp:18-21 reports Image. It has no name; a consumer's
     aria-label reaches this root through `...rest`. -->
<div
	bind:this={ref}
	class={['animated-visual-player', className]}
	style={rootStyle}
	data-stretch={stretch}
	role="img"
	{...rest}
>
	{#if visual !== null}
		<div class="stage">
			<div class="visual">{@render visual.visual(progress)}</div>
		</div>
	{:else if fallenBack && fallbackContent}
		{@render fallbackContent()}
	{/if}
</div>

<style>
	/* AnimatedVisualPlayer.idl:75-76 — a FrameworkElement, so a block-level box. Its size is the
	   inline width and height above rather than anything declared here, because MeasureOverride
	   gives it the visual's natural size and a caller overrides that through `style`. */
	.animated-visual-player {
		display: block;
	}
	/* ArrangeOverride (AnimatedVisualPlayer.cpp:548-635): containment belongs here, so the root can
	   still shrink-wrap fallback content. The explicit grid track keeps oversized visual centring
	   relative to the stage rather than its own grown track. */
	.stage {
		width: 100%;
		height: 100%;
		container-type: size;
		display: grid;
		grid-template: 100% / 100%;
		overflow: hidden;
	}
	/* AnimatedVisualPlayer.cpp:585-594 — Uniform takes the smaller scale and centres it. */
	[data-stretch='uniform'] .visual {
		place-self: center;
		width: min(
			100cqw,
			calc(100cqh * var(--animated-visual-player-width) / var(--animated-visual-player-height))
		);
		height: min(
			100cqh,
			calc(100cqw * var(--animated-visual-player-height) / var(--animated-visual-player-width))
		);
	}
	/* AnimatedVisualPlayer.cpp:596-605 — UniformToFill takes the larger scale and centres it. */
	[data-stretch='uniformToFill'] .visual {
		place-self: center;
		width: max(
			100cqw,
			calc(100cqh * var(--animated-visual-player-width) / var(--animated-visual-player-height))
		);
		height: max(
			100cqh,
			calc(100cqw * var(--animated-visual-player-height) / var(--animated-visual-player-width))
		);
	}
	/* AnimatedVisualPlayer.cpp:581-605 — Fill uses independent axis scales. */
	[data-stretch='fill'] .visual {
		place-self: stretch;
		width: 100cqw;
		height: 100cqh;
	}
	/* AnimatedVisualPlayer.cpp:570-577 — None does not centre and clips from the origin. */
	[data-stretch='none'] .visual {
		place-self: start;
		width: calc(var(--animated-visual-player-width) * 1px);
		height: calc(var(--animated-visual-player-height) * 1px);
	}
</style>
