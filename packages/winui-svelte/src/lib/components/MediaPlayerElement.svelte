<script lang="ts" module>
	import type { MediaTransportControlsProps } from './MediaTransportControls.svelte';

	export interface MediaPlayerElementProps {
		/** Source, as the URL that WinUI's Source would resolve to. */
		source?: string | null;
		/** PosterSource. */
		posterSource?: string | null;
		/** AutoPlay. The browser permits unprompted autoplay only while muted. */
		autoPlay?: boolean;
		/** AreTransportControlsEnabled. */
		transportControlsEnabled?: boolean;
		/** Stretch. The transport controls write this through their Aspect ratio button. */
		stretch?: 'none' | 'fill' | 'uniform' | 'uniformToFill';
		onStretchChange?: (stretch: 'none' | 'fill' | 'uniform' | 'uniformToFill') => void;
		/** MediaPlayer. Read-only upstream; bindable here because the DOM video is the player. */
		mediaPlayer?: HTMLVideoElement | null;
		/** No WinUI member: this supplies props to the internally-created controls, where WinUI
		 *  instead accepts an author-created TransportControls instance. */
		transportControlsProps?: Partial<MediaTransportControlsProps>;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// `MediaPlayerElement.g.cpp:167-178` resolves LayoutRoot, MediaPlayerPresenter, PosterImage,
	// TimedTextSourcePresenter and TransportControlsPresenter. The video combines presenter and
	// PosterImage: its `poster` draws under precisely the condition the upstream image does
	// (`MediaPlayerElement_partial.cpp:825-842`).
	//
	// Deliberately absent: IsFullWindow and the full-window root, commented out upstream under
	// TODO 39683362; TimedTextSource and its caption presenter (WD-060); and
	// MediaPlayerPresenter.IsFullWindow plus AspectRatioWidth/Height.
</script>

<script lang="ts">
	import MediaTransportControls from './MediaTransportControls.svelte';

	let {
		source = null,
		posterSource = null,
		autoPlay = true,
		transportControlsEnabled = false,
		stretch = $bindable('uniform'),
		onStretchChange,
		mediaPlayer = $bindable(null),
		transportControlsProps = {},
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: MediaPlayerElementProps = $props();

	let transportControls = $state<MediaTransportControls | null>(null);

	$effect(() => {
		if (!autoPlay || !source || !mediaPlayer) return;
		// Browsers only honour autoplay without a gesture when muted. WinUI's default is still
		// AutoPlay=true; muting is the web adapter, not a WD-059 media-format divergence.
		mediaPlayer.muted = true;
		void mediaPlayer.play().catch(() => {});
	});
</script>

<div
	bind:this={ref}
	class={['media-player-element', className]}
	{style}
	data-stretch={stretch}
	onpointerenter={() => transportControls?.showPanel()}
	onpointerleave={() => transportControls?.hidePanelAfterDelay()}
	{...rest}
>
	<!-- eslint-disable-next-line svelte/no-unused-svelte-ignore -->
	<!-- svelte-ignore a11y_media_has_caption -- TimedTextSource is explicitly WD-060. -->
	<video
		bind:this={mediaPlayer}
		class="presenter"
		src={source ?? undefined}
		poster={posterSource ?? undefined}
		preload="metadata"
		playsinline
	></video>
	{#if transportControlsEnabled}
		<div class="transport-layer">
			<MediaTransportControls
				bind:this={transportControls}
				player={mediaPlayer}
				bind:stretch
				{onStretchChange}
				{...transportControlsProps}
			/>
		</div>
	{/if}
</div>

<style>
	.media-player-element {
		/* LayoutRoot is a Grid. One in-flow presenter determines this element's measure, while
		   TransportControlsPresenter is out of flow.
		   The explicit `100% / 100%` track is load-bearing, for the reason the AnimatedVisualPlayer
		   unit found in the other direction: without it an item larger than the container sizes
		   its own track instead, so a 200x120 player got a 134px row, the presenter's `height:100%`
		   resolved against that row rather than the box, and all four modes painted alike. */
		display: grid;
		grid-template: 100% / 100%;
		position: relative;
	}
	.presenter {
		/* Both axes fill the one grid row. Against an auto row — a caller who fixed neither axis —
		   a percentage height resolves to the content's own, so the element still measures to the
		   source's ratio; against a row a caller sized, it fills it and `object-fit` is what
		   decides the picture, which is the whole of `Stretch`. `height: auto` looked equivalent
		   and was not: it kept the ratio even inside a fixed box, so a 200x120 player drew a
		   200x134 video that overflowed it and every mode painted the same picture. */
		display: block;
		width: 100%;
		height: 100%;
	}
	.media-player-element[data-stretch='fill'] .presenter {
		object-fit: fill;
	}
	.media-player-element[data-stretch='uniform'] .presenter {
		object-fit: contain;
	}
	/* `object-position: left top` on the two modes that overflow, for the reason Image.svelte's
	   style block records: MediaPlayerPresenter and Image share `mediabase.cpp`'s scale
	   arithmetic, and the original clips an overflowing picture from its start rather than its
	   centre — measured there against the reference guest. WD-055 is the one case it gets wrong,
	   an element larger than the source under None, and it is that row's subject already. */
	.media-player-element[data-stretch='uniformToFill'] .presenter {
		object-fit: cover;
		object-position: left top;
	}
	.media-player-element[data-stretch='none'] .presenter {
		object-fit: none;
		object-position: left top;
	}
	.transport-layer {
		/* MediaTransportControls_themeresources.xaml:263 — bottom alignment; its own Style owns
		   the 12px inset. */
		position: absolute;
		inset: 0;
		display: grid;
		align-content: end;
	}
</style>
