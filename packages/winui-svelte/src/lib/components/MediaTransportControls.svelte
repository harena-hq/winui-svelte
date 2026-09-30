<script lang="ts" module>
	export type MediaStretch = 'none' | 'fill' | 'uniform' | 'uniformToFill';
	export type MediaTransportState = 'normal' | 'loading' | 'buffering' | 'error';

	/**
	 * `MediaTransportControls` is a `Control` whose complete template is
	 * `MediaTransportControls_themeresources.xaml:63-427`; its resource dictionary is therefore
	 * the token set this component consumes.
	 *
	 * The two zero-size separators split the command list into three groups. Upstream sums each
	 * group's visible widths and centres the middle group while keeping the outer groups flush
	 * (`MediaTransportControls_partial.cpp:5597-5696`). `1fr auto 1fr` expresses that rule. Its
	 * negative-gap branch is unreachable here: the 296px minimum is wider than the 160px occupied
	 * by the four default buttons.
	 *
	 * The panel waits 3 seconds before hiding (`MediaTransportControls_partial.cpp:55`) and fades
	 * in over 0.3 seconds and out over 0.7 seconds
	 * (`MediaTransportControls_themeresources.xaml:115-137`).
	 *
	 * Deliberately absent: `FullWindowButton` and `CompactOverlayButton`, which upstream itself
	 * comments out under TODO 39683362 at
	 * `MediaTransportControls_themeresources.xaml:237-245,407-417`, so their absence is parity;
	 * `ThumbnailRequested` and the scrubbing preview; and
	 * `MediaTransportControlsHelper.DropoutOrder` with the `Dropout`/`Expand` pass
	 * (`MediaTransportControls_partial.cpp:5439-5595`). CSS wraps or overflows instead, and no page
	 * in this reproduction reaches that width. Cast, closed-caption, audio-track and track-navigation
	 * behaviour is deliberately absent under WD-060.
	 */
	export interface MediaTransportControlsProps {
		/** The `MediaPlayer` this control drives. */
		player?: HTMLVideoElement | null;
		/** IsCompact. */
		compact?: boolean;
		/** ShowAndHideAutomatically. */
		showAndHideAutomatically?: boolean;
		/** IsSeekBarVisible. */
		seekBarVisible?: boolean;
		/** IsSeekEnabled. */
		seekEnabled?: boolean;
		/** IsVolumeButtonVisible. */
		volumeButtonVisible?: boolean;
		/** IsVolumeEnabled. */
		volumeEnabled?: boolean;
		/** IsPlayPauseButtonVisible. */
		playPauseButtonVisible?: boolean;
		/** IsPlayPauseEnabled. */
		playPauseEnabled?: boolean;
		/** IsZoomButtonVisible. */
		zoomButtonVisible?: boolean;
		/** IsZoomEnabled. */
		zoomEnabled?: boolean;
		/** IsStopButtonVisible. */
		stopButtonVisible?: boolean;
		/** IsStopEnabled. */
		stopEnabled?: boolean;
		/** IsSkipBackwardButtonVisible. */
		skipBackwardButtonVisible?: boolean;
		/** IsSkipBackwardEnabled. */
		skipBackwardEnabled?: boolean;
		/** IsSkipForwardButtonVisible. */
		skipForwardButtonVisible?: boolean;
		/** IsSkipForwardEnabled. */
		skipForwardEnabled?: boolean;
		/** IsFastRewindButtonVisible. */
		fastRewindButtonVisible?: boolean;
		/** IsFastRewindEnabled. */
		fastRewindEnabled?: boolean;
		/** IsFastForwardButtonVisible. */
		fastForwardButtonVisible?: boolean;
		/** IsFastForwardEnabled. */
		fastForwardEnabled?: boolean;
		/** IsPlaybackRateButtonVisible. */
		playbackRateButtonVisible?: boolean;
		/** IsPlaybackRateEnabled. */
		playbackRateEnabled?: boolean;
		/** IsRepeatButtonVisible. */
		repeatButtonVisible?: boolean;
		/** IsRepeatEnabled. */
		repeatEnabled?: boolean;
		/** IsPreviousTrackButtonVisible. */
		previousTrackButtonVisible?: boolean;
		/** IsNextTrackButtonVisible. */
		nextTrackButtonVisible?: boolean;
		/** No WinUI member. `CastButton` is always present in the template at :402; this escape
		 * hatch lets the deterministic harness and consumers remove it. */
		castButtonVisible?: boolean;
		/** Seconds elapsed. */
		position?: number;
		onPositionChange?: (position: number) => void;
		/** Seconds in the source, or 0 while unknown. */
		duration?: number;
		/** `PlayPauseStates`; true selects `PauseState`. */
		playing?: boolean;
		onPlayingChange?: (playing: boolean) => void;
		/** The player's volume in the range 0..1. */
		volume?: number;
		onVolumeChange?: (volume: number) => void;
		/** `VolumeMuteStates`. */
		muted?: boolean;
		onMutedChange?: (muted: boolean) => void;
		/** `m_sourceLoaded`; false blanks the remaining time. */
		sourceLoaded?: boolean;
		/** `MediaStates` at `MediaTransportControls_themeresources.xaml:140-166`. */
		mediaState?: MediaTransportState;
		/** `ErrorTextBlock` at `MediaTransportControls_themeresources.xaml:278`. */
		errorText?: string;
		/** The owning `MediaPlayerElement.Stretch`; the zoom button changes it. */
		stretch?: MediaStretch;
		onStretchChange?: (stretch: MediaStretch) => void;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	/** MediaTransportControls_partial.cpp:4107-4150 — `GetTimeFormat` under
	 * `TIME_NOTIMEMARKER | TIME_FORCE24HOURFORMAT`, which on the reference guest's en-US is
	 * `H:mm:ss`. Whole seconds: :3396-3415 truncates at :3404 and :3414 before formatting. */
	function formatTime(seconds: number): string {
		const wholeSeconds = Math.trunc(Math.max(0, seconds)) % 86400;
		const hours = Math.trunc(wholeSeconds / 3600);
		const minutes = Math.trunc((wholeSeconds % 3600) / 60);
		const remainder = wholeSeconds % 60;
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
	}
</script>

<script lang="ts">
	import type { RadioMenuFlyoutItemData } from './MenuFlyout.svelte';
	import { Symbol } from '../symbol';
	import AppBarButton from './AppBarButton.svelte';
	import Flyout from './Flyout.svelte';
	import MenuFlyout from './MenuFlyout.svelte';
	import ProgressBar from './ProgressBar.svelte';
	import Slider from './Slider.svelte';

	let {
		player = null,
		compact = false,
		showAndHideAutomatically = true,
		seekBarVisible = true,
		seekEnabled = true,
		volumeButtonVisible = true,
		volumeEnabled = true,
		playPauseButtonVisible = true,
		playPauseEnabled = true,
		zoomButtonVisible = true,
		zoomEnabled = true,
		stopButtonVisible = false,
		stopEnabled = true,
		skipBackwardButtonVisible = false,
		skipBackwardEnabled = true,
		skipForwardButtonVisible = false,
		skipForwardEnabled = true,
		fastRewindButtonVisible = false,
		fastRewindEnabled = true,
		fastForwardButtonVisible = false,
		fastForwardEnabled = true,
		playbackRateButtonVisible = false,
		playbackRateEnabled = true,
		repeatButtonVisible = false,
		repeatEnabled = true,
		previousTrackButtonVisible = false,
		nextTrackButtonVisible = false,
		castButtonVisible = true,
		position = $bindable(0),
		onPositionChange,
		duration = $bindable(0),
		playing = $bindable(false),
		onPlayingChange,
		volume = $bindable(1),
		onVolumeChange,
		muted = $bindable(false),
		onMutedChange,
		// These four values are fed by the player but are display-only within this component,
		// so they are bindable without user-edit callbacks.
		sourceLoaded = $bindable(false),
		mediaState = $bindable<MediaTransportState>('normal'),
		errorText = $bindable(''),
		stretch = $bindable<MediaStretch>('uniform'),
		onStretchChange,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: MediaTransportControlsProps = $props();

	const hasPlayer = $derived(player !== null);
	const progressValue = $derived(duration > 0 ? (position / duration) * 100 : 0);
	const elapsedText = $derived(formatTime(position));
	const remainingText = $derived(sourceLoaded ? formatTime(duration - position) : '');
	const volumeValue = $derived(volume * 100);
	const captionsAvailable = $derived((player?.textTracks.length ?? 0) > 0);
	const audioTracksAvailable = $derived.by(() => {
		if (!player) return false;
		const tracks = (player as HTMLVideoElement & { audioTracks?: { length: number } }).audioTracks;
		return (tracks?.length ?? 0) > 1;
	});

	let panelVisible = $state(true);
	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	let playbackRate = $state(1);
	let repeatState = $state<'none' | 'all' | 'one'>('none');

	const playbackRateItems: RadioMenuFlyoutItemData[] = [0.25, 0.5, 1, 1.5, 2].map((rate) => ({
		id: String(rate),
		text: `${rate}x`,
		groupName: 'playbackRate'
	}));

	function clearHideTimer(): void {
		if (hideTimer !== undefined) {
			clearTimeout(hideTimer);
			hideTimer = undefined;
		}
	}

	export function showPanel(): void {
		clearHideTimer();
		panelVisible = true;
	}

	export function hidePanelAfterDelay(): void {
		clearHideTimer();
		if (!showAndHideAutomatically || !playing) {
			panelVisible = true;
			return;
		}
		hideTimer = setTimeout(() => {
			panelVisible = false;
			hideTimer = undefined;
		}, 3000);
	}

	function setPosition(next: number): void {
		position = next;
		onPositionChange?.(next);
	}

	function setPlaying(next: boolean): void {
		playing = next;
		onPlayingChange?.(next);
	}

	function setVolume(next: number): void {
		volume = next;
		onVolumeChange?.(next);
	}

	function setMuted(next: boolean): void {
		muted = next;
		onMutedChange?.(next);
	}

	function mediaErrorMessage(error: MediaError | null): string {
		// The upstream strings are `localizedResource` values absent from the pin; these plain
		// sentences are this reproduction's own messages for the four `MediaError.code` values.
		switch (error?.code) {
			case MediaError.MEDIA_ERR_ABORTED:
				return 'Playback was cancelled.';
			case MediaError.MEDIA_ERR_NETWORK:
				return 'The media could not be downloaded.';
			case MediaError.MEDIA_ERR_DECODE:
				return 'The media could not be decoded.';
			default:
				return 'This media format is not supported.';
		}
	}

	$effect(() => {
		if (!player) return;
		const video = player;

		const onLoadedMetadata = () => {
			duration = video.duration;
			sourceLoaded = true;
			mediaState = 'normal';
		};
		const onTimeUpdate = () => setPosition(video.currentTime);
		const onPlay = () => setPlaying(true);
		const onPlaying = () => (mediaState = 'normal');
		const onPause = () => setPlaying(false);
		const onVolumeChange = () => {
			setVolume(video.volume);
			setMuted(video.muted);
		};
		const onWaiting = () => (mediaState = 'buffering');
		const onError = () => {
			mediaState = 'error';
			errorText = mediaErrorMessage(video.error);
		};
		const onEmptied = () => {
			sourceLoaded = false;
			duration = 0;
			setPosition(0);
		};

		if (video.currentSrc && video.readyState === 0) mediaState = 'loading';
		if (video.readyState >= HTMLMediaElement.HAVE_METADATA) onLoadedMetadata();
		setPosition(video.currentTime);
		setPlaying(!video.paused);
		setVolume(video.volume);
		setMuted(video.muted);
		playbackRate = video.playbackRate;

		video.addEventListener('loadedmetadata', onLoadedMetadata);
		video.addEventListener('timeupdate', onTimeUpdate);
		video.addEventListener('play', onPlay);
		video.addEventListener('playing', onPlaying);
		video.addEventListener('pause', onPause);
		video.addEventListener('volumechange', onVolumeChange);
		video.addEventListener('waiting', onWaiting);
		video.addEventListener('error', onError);
		video.addEventListener('emptied', onEmptied);

		return () => {
			video.removeEventListener('loadedmetadata', onLoadedMetadata);
			video.removeEventListener('timeupdate', onTimeUpdate);
			video.removeEventListener('play', onPlay);
			video.removeEventListener('playing', onPlaying);
			video.removeEventListener('pause', onPause);
			video.removeEventListener('volumechange', onVolumeChange);
			video.removeEventListener('waiting', onWaiting);
			video.removeEventListener('error', onError);
			video.removeEventListener('emptied', onEmptied);
		};
	});

	// SeekbarPositionUpdateFreqInSecs is 0.250 at MediaTransportControls_partial.cpp:57. The
	// browser's `timeupdate` event already fires at roughly that cadence, so there is no timer.
	function seekTo(percent: number): void {
		// MediaTransportControls_partial.cpp:3387-3393 raises `m_positionUpdateUIOnly` around its
		// own `put_Value` so that `OnPositionSliderValueChanged` does not write `Position` back.
		// The same echo arrives here: the slider's `step` is 1, so it snaps the percentage this
		// component just handed it and reports the snapped value as a change. Without this guard
		// a mounted panel quantises its own position to a hundredth of the duration — at 12.19
		// seconds that turns a position of 6 into 5.97, and the elapsed time reads 0:00:05.
		if (Math.round(progressValue) === percent) return;
		const next = duration > 0 ? Math.min(duration, Math.max(0, (percent / 100) * duration)) : 0;
		setPosition(next);
		if (hasPlayer && player) player.currentTime = next;
	}

	function changeVolume(percent: number): void {
		const next = Math.min(1, Math.max(0, percent / 100));
		setVolume(next);
		if (hasPlayer && player) player.volume = next;
	}

	function toggleMute(): void {
		const next = !muted;
		setMuted(next);
		if (hasPlayer && player) player.muted = next;
	}

	/** The play/pause command drives the owner, as the template's PlayPauseButton at :366 does. */
	function togglePlayback(): void {
		if (!player) {
			setPlaying(!playing);
			return;
		}
		if (player.paused) void player.play().catch(() => {});
		else player.pause();
	}

	/** MediaTransportControls_themeresources.xaml:350 — stop pauses and returns to the start. */
	function stop(): void {
		player?.pause();
		setPlaying(false);
		setPosition(0);
		if (player) player.currentTime = 0;
	}

	/** MediaTransportControls_partial.cpp:65 — SkipBackwardInSecs is 10. */
	function skipBackward(): void {
		const next = Math.min(duration, Math.max(0, position - 10));
		setPosition(next);
		if (player) player.currentTime = next;
	}

	/** MediaTransportControls_partial.cpp:64 — SkipForwardInSecs is 30. */
	function skipForward(): void {
		const next = Math.min(duration, Math.max(0, position + 30));
		setPosition(next);
		if (player) player.currentTime = next;
	}

	/** MediaTransportControls_partial.cpp:63 — AvailablePlaybackRateList is
	 * `{ 0.25, 0.5, 1.0, 1.5, 2.0 }`. */
	function setPlaybackRate(next: number): void {
		if (![0.25, 0.5, 1, 1.5, 2].includes(next)) return;
		playbackRate = next;
		if (player) player.playbackRate = next;
	}

	/** MediaTransportControls_themeresources.xaml:361-363 and WD-061 — Chromium cannot play a
	 * negative HTMLMediaElement playback rate, so rewind steps down the positive rate list. */
	function fastRewind(): void {
		const rates = [0.25, 0.5, 1, 1.5, 2];
		const index = rates.findIndex((rate) => rate >= playbackRate);
		setPlaybackRate(rates[Math.max(0, index <= 0 ? 0 : index - 1)]);
	}

	/** MediaTransportControls_themeresources.xaml:371-373 — fast forward steps upward. */
	function fastForward(): void {
		const rates = [0.25, 0.5, 1, 1.5, 2];
		const index = rates.findIndex((rate) => rate >= playbackRate);
		setPlaybackRate(rates[Math.min(rates.length - 1, index < 0 ? rates.length - 1 : index + 1)]);
	}

	/** RepeatStates at MediaTransportControls_themeresources.xaml:247-260 has none/all/one. */
	function cycleRepeat(): void {
		repeatState = repeatState === 'none' ? 'all' : repeatState === 'all' ? 'one' : 'none';
		if (player) player.loop = repeatState !== 'none';
	}

	/** MediaTransportControls_partial.cpp:2568-2596 — Uniform becomes UniformToFill; every
	 * other value becomes Uniform. */
	function toggleZoom(): void {
		stretch = stretch === 'uniform' ? 'uniformToFill' : 'uniform';
		onStretchChange?.(stretch);
	}

	/** WD-060 — CastButton, CCSelectionButton, AudioTracksSelectionButton,
	 * PreviousTrackButton and NextTrackButton render, focus, and deliberately change nothing. */
	function unavailableMediaCommand(): void {}

	$effect(() => {
		if (!showAndHideAutomatically || !playing) showPanel();
		else hidePanelAfterDelay();
		return clearHideTimer;
	});
</script>

{#snippet volumeFlyoutContent()}
	<div class="volume-row">
		<AppBarButton
			class="command-button"
			label={muted ? 'Unmute' : 'Mute'}
			labelPosition="collapsed"
			glyph={muted ? Symbol.Mute : Symbol.Volume}
			title={muted ? 'Unmute' : 'Mute'}
			disabled={!volumeEnabled}
			onclick={toggleMute}
		/>
		<Slider
			class="volume-slider"
			value={volumeValue}
			onValueChange={changeVolume}
			disabled={!volumeEnabled}
			thumbToolTipEnabled={false}
		/>
		<span class="volume-value winui-CaptionTextBlockStyle">{Math.round(volumeValue)}</span>
	</div>
{/snippet}

<div
	bind:this={ref}
	class={['media-transport-controls', panelVisible ? 'visible' : 'hidden', className]}
	{style}
	role="group"
	aria-label="Media transport controls"
	data-compact={compact ? 'true' : 'false'}
	data-media-state={mediaState}
	{...rest}
>
	<div class="control-panel">
		{#if mediaState === 'error'}
			<div class="error">
				<span class="error-text winui-CaptionTextBlockStyle">{errorText}</span>
			</div>
		{/if}

		{#if seekBarVisible}
			<div class="timeline">
				<Slider
					class="progress-slider"
					value={progressValue}
					onValueChange={seekTo}
					disabled={!seekEnabled}
					thumbToolTipEnabled={false}
				/>
				{#if mediaState === 'loading' || mediaState === 'buffering'}
					<ProgressBar class="buffering-progress" isIndeterminate showPaused={false} />
				{/if}
				<div class="time-text">
					<span class="elapsed winui-CaptionTextBlockStyle">{elapsedText}</span>
					<span class="remaining winui-CaptionTextBlockStyle">{remainingText}</span>
				</div>
			</div>
		{/if}

		{#if compact && playPauseButtonVisible}
			<div class="left-side-play">
				<AppBarButton
					class="command-button"
					label={playing ? 'Pause' : 'Play'}
					labelPosition="collapsed"
					glyph={playing ? 'F8AE' : 'F5B0'}
					title={playing ? 'Pause' : 'Play'}
					disabled={!playPauseEnabled}
					onclick={togglePlayback}
				/>
			</div>
		{/if}

		<div class="command-row">
			<div class="group left">
				{#if volumeButtonVisible}
					<Flyout
						placement="topEdgeAlignedLeft"
						content={volumeFlyoutContent}
						style="background: var(--winui-MediaTransportControlsFlyoutBackground); padding: 0"
					>
						{#snippet children(triggerProps)}
							<AppBarButton
								{...triggerProps}
								class="command-button"
								label="Volume"
								labelPosition="collapsed"
								glyph={muted ? Symbol.Mute : Symbol.Volume}
								title="Volume"
								disabled={!volumeEnabled}
							/>
						{/snippet}
					</Flyout>
				{/if}
				{#if captionsAvailable}
					<AppBarButton
						class="command-button"
						label="Closed captions"
						labelPosition="collapsed"
						glyph="ED1E"
						title="Closed captions"
						onclick={unavailableMediaCommand}
					/>
				{/if}
				{#if audioTracksAvailable}
					<AppBarButton
						class="command-button"
						label="Audio tracks"
						labelPosition="collapsed"
						glyph="ED1F"
						title="Audio tracks"
						onclick={unavailableMediaCommand}
					/>
				{/if}
			</div>

			<div class="group middle">
				{#if stopButtonVisible}
					<AppBarButton
						class="command-button"
						label="Stop"
						labelPosition="collapsed"
						glyph={Symbol.Stop}
						title="Stop"
						disabled={!stopEnabled}
						onclick={stop}
					/>
				{/if}
				{#if skipBackwardButtonVisible}
					<AppBarButton
						class="command-button"
						label="Back 10 seconds"
						labelPosition="collapsed"
						glyph="ED3C"
						title="Back 10 seconds"
						disabled={!skipBackwardEnabled}
						onclick={skipBackward}
					/>
				{/if}
				{#if previousTrackButtonVisible}
					<AppBarButton
						class="command-button"
						label="Previous"
						labelPosition="collapsed"
						glyph="F8AC"
						title="Previous"
						onclick={unavailableMediaCommand}
					/>
				{/if}
				{#if fastRewindButtonVisible}
					<AppBarButton
						class="command-button"
						label="Rewind"
						labelPosition="collapsed"
						glyph="E627"
						title="Rewind"
						disabled={!fastRewindEnabled}
						onclick={fastRewind}
					/>
				{/if}
				{#if playPauseButtonVisible && !compact}
					<AppBarButton
						class="command-button play-pause"
						label={playing ? 'Pause' : 'Play'}
						labelPosition="collapsed"
						glyph={playing ? 'F8AE' : 'F5B0'}
						title={playing ? 'Pause' : 'Play'}
						disabled={!playPauseEnabled}
						onclick={togglePlayback}
					/>
				{/if}
				{#if fastForwardButtonVisible}
					<AppBarButton
						class="command-button"
						label="Fast forward"
						labelPosition="collapsed"
						glyph="E628"
						title="Fast forward"
						disabled={!fastForwardEnabled}
						onclick={fastForward}
					/>
				{/if}
				{#if nextTrackButtonVisible}
					<AppBarButton
						class="command-button"
						label="Next"
						labelPosition="collapsed"
						glyph="F8AD"
						title="Next"
						onclick={unavailableMediaCommand}
					/>
				{/if}
				{#if skipForwardButtonVisible}
					<AppBarButton
						class="command-button"
						label="Forward 30 seconds"
						labelPosition="collapsed"
						glyph="ED3D"
						title="Forward 30 seconds"
						disabled={!skipForwardEnabled}
						onclick={skipForward}
					/>
				{/if}
				{#if playbackRateButtonVisible}
					<MenuFlyout
						items={playbackRateItems}
						selected={{ playbackRate: String(playbackRate) }}
						onSelectedChange={(selected) => setPlaybackRate(Number(selected.playbackRate))}
					>
						{#snippet children(triggerProps)}
							<AppBarButton
								{...triggerProps}
								class="command-button"
								label="Playback rate"
								labelPosition="collapsed"
								glyph="EC57"
								title="Playback rate"
								disabled={!playbackRateEnabled}
							/>
						{/snippet}
					</MenuFlyout>
				{/if}
			</div>

			<div class="group right">
				{#if repeatButtonVisible}
					<AppBarButton
						class="command-button"
						label="Repeat"
						labelPosition="collapsed"
						glyph={repeatState === 'one' ? Symbol.RepeatOne : Symbol.RepeatAll}
						title="Repeat"
						disabled={!repeatEnabled}
						aria-pressed={repeatState !== 'none'}
						onclick={cycleRepeat}
					/>
				{/if}
				{#if zoomButtonVisible}
					<AppBarButton
						class="command-button"
						label="Aspect ratio"
						labelPosition="collapsed"
						glyph="E799"
						title="Aspect ratio"
						disabled={!zoomEnabled}
						onclick={toggleZoom}
					/>
				{/if}
				{#if castButtonVisible}
					<AppBarButton
						class="command-button"
						label="Cast to device"
						labelPosition="collapsed"
						glyph="EC15"
						title="Cast to device"
						onclick={unavailableMediaCommand}
					/>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.media-transport-controls {
		box-sizing: border-box;
		/* MediaTransportControls_themeresources.xaml:67-69 — the Style's Margin, MinWidth and
		   MaxWidth. The computed width preserves its 12px inline inset until MaxWidth caps it;
		   auto inline margins centre the capped panel. */
		width: calc(
			100% - var(--winui-MediaTransportControlsMargin) - var(--winui-MediaTransportControlsMargin)
		);
		margin-top: var(--winui-MediaTransportControlsMargin);
		margin-right: auto;
		margin-bottom: var(--winui-MediaTransportControlsMargin);
		margin-left: auto;
		min-width: var(--winui-MediaTransportControlsMinWidth);
		max-width: var(--winui-MediaTransportControlsMaxWidth);
		/* `ControlPanelFadeIn` (`:122`) lands its TranslateTransform on 0.5 rather than 0. Half a
		   pixel is not a position: it lands the panel's top border between two device pixels and
		   blurs the whole edge against the video behind it, which is 402 of the 937 pixels this
		   panel differed from the reference by before it was dropped. The slide is kept — the
		   hidden state below still translates by 50 — and only its resting value is rounded. */
		transform: translateY(0);
		transition-property: opacity, transform;
		/* c1-allow: MediaTransportControls_themeresources.xaml:120, :122 — the FadeIn storyboard. */
		transition-duration: 300ms, 300ms;
	}

	.media-transport-controls.hidden {
		opacity: 0;
		transform: translateY(50px);
		pointer-events: none;
		/* c1-allow: MediaTransportControls_themeresources.xaml:129, :134 — the FadeOut storyboard. */
		transition-duration: 700ms, 700ms;
	}

	.control-panel {
		display: grid;
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto 1fr auto;
		box-sizing: border-box;
		overflow: hidden;
		/* MediaTransportControls_themeresources.xaml:263 — ControlPanelGrid's fill, border and
		   radius; CornerRadius is the Style's OverlayCornerRadius at :72 via TemplateBinding.
		   The fill carries `padding-box`: that Grid sets no `BackgroundSizing` and takes a
		   Grid's default, `InnerBorderEdge`, so the stroke — translucent in light and dark —
		   lies on what is behind the panel rather than on its fill. */
		background: var(--winui-MediaTransportControlsPanelBackground) padding-box;
		border: var(--winui-MediaTransportControlsBorderThickness) solid
			var(--winui-MediaTransportControlsBorderBrush);
		border-radius: var(--winui-OverlayCornerRadius);
	}

	/* MediaTransportControls_themeresources.xaml:277 — ErrorBorder is 320x96, spans all three
	   columns and centres horizontally. Its child takes the Border's default stretch, and a
	   stretched TextBlock still draws from the top of its slot, so the message sits at the
	   top-left inside the 12px margin at `:278` rather than centred in the box. */
	.error {
		grid-row: 1;
		grid-column: 1 / 4;
		justify-self: center;
		width: 320px;
		height: 96px;
		background: var(--winui-MediaTransportControlsPanelBackground);
	}

	.error-text {
		display: block;
		margin: 12px;
		color: var(--winui-MediaTransportControlsFillMediaText);
	}

	.timeline {
		grid-row: 2;
		grid-column: 2;
		display: grid;
		grid-template-rows: auto auto;
		min-width: 0;
	}

	/* `progress-slider`, `buffering-progress`, `command-button` and `volume-slider` are class
	   props handed to other components. A class passed across a component boundary carries no
	   scope hash, so it is reached through `:global` under a local ancestor — the construction
	   `TeachingTip.svelte`'s `.commands > :global(.action)` rule already uses. Measured before this
	   was written: without it the command buttons keep AppBarButton's own 68px width and the panel
	   comes out 98 tall against the reference's 101. */
	.timeline :global(.progress-slider) {
		grid-row: 1;
		grid-column: 1;
		min-width: 80px;
		height: var(--winui-MediaTransportControlsSliderHeight);
		/* :289 repeats the dictionary's 7,2,7,1 literal; the token allows CompactMode at :211
		   to replace it with MediaTransportControlsProgressSliderCompactMargin. */
		margin: var(--winui-MediaTransportControlsProgressSliderMargin);
	}

	.timeline :global(.buffering-progress) {
		grid-row: 1;
		grid-column: 1;
		align-self: start;
		height: 4px;
		margin-top: 2px;
		pointer-events: none;
	}

	/* No `color` here on purpose. The dictionary defines `MediaTransportControlsFillTimeElapsedText`
	   at `:9` and nothing reads it: grepped across both pins, the only reference to any
	   `MediaTransportControlsFill*` key is `:98`, where `MediaTextBlockStyle` takes
	   `…FillMediaText`. `TimeElapsedElement` and `TimeRemainingElement` (`:292`, `:293`) carry
	   `CaptionTextBlockStyle` and no Foreground, so they inherit the ambient primary text brush —
	   measured as #1A1A1A on the reference guest against the #5F5F5F the secondary brush gives. */
	.time-text {
		grid-row: 2;
		grid-column: 1;
		display: flex;
		justify-content: space-between;
		align-items: end;
		height: 16px;
		margin: 0 7px 2px;
	}

	.command-row {
		grid-row: 3;
		grid-column: 2;
		/* MediaTransportControls_themeresources.xaml:309 — CommandBar Margin="0,3". */
		margin: 3px 0;
		/* MediaTransportControls_partial.cpp:5597-5696 — separators delimit three groups; the
		   middle is centred and the outers are flush. Equal 1fr tracks express that arithmetic.
		   `space-between` would not centre unequal 40px and 80px outer groups. The negative branch
		   at :5676-5680 is unreachable at MinWidth 296 against 160px of default buttons. */
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		/* c1-allow: MediaTransportControls_themeresources.xaml:313 overrides this token inside the CommandBar resource scope. */
		--winui-AppBarThemeCompactHeight: var(--winui-MediaTransportControlsAppBarButtonHeight);
		/* c1-allow: MediaTransportControls_themeresources.xaml:311. */
		--winui-AppBarButtonInnerBorderMargin: 5px;
		/* c1-allow: MediaTransportControls_themeresources.xaml:312. A two-value XAML Thickness is
		   left,top and then mirrored, so `0,12` is 12 above and below and nothing at the sides —
		   which is what makes the 16px icon box fill the 40px button exactly. Written as
		   `0 12px` instead, the icon loses both vertical margins and the glyph photographs eleven
		   pixels above the original's. */
		--winui-AppBarButtonContentViewboxCollapsedMargin: 12px 0;
	}

	.group {
		display: flex;
	}

	.group.left {
		justify-self: start;
	}

	.group.right {
		justify-self: end;
	}

	/* MediaTransportControls_themeresources.xaml:79-83 — AppBarButtonStyle pins both axes to
	   MediaTransportControlsAppBarButtonWidth/Height, against AppBarButton's own 68px default. */
	.control-panel :global(.command-button) {
		width: var(--winui-MediaTransportControlsAppBarButtonWidth);
		height: var(--winui-MediaTransportControlsAppBarButtonHeight);
		min-width: var(--winui-MediaTransportControlsAppBarButtonWidth);
	}

	.volume-row {
		display: flex;
		align-items: center;
		padding: 3px 11px;
	}

	.volume-row :global(.volume-slider) {
		width: var(--winui-MediaTransportControlsSliderWidth);
		height: var(--winui-MediaTransportControlsSliderHeight);
		margin: 0 8px 0 12px;
	}

	.volume-value {
		width: 24px;
		margin: 0 16px 0 8px;
		color: var(--winui-MediaTransportControlsFillMediaText);
		text-align: right;
	}

	.media-transport-controls[data-media-state='loading'] :global(.progress-slider),
	.media-transport-controls[data-media-state='loading'] .command-row {
		opacity: 0;
	}

	/* MediaTransportControls_themeresources.xaml:202-214 — CompactMode applies these nine
	   coordinated changes as one visual state. */
	.media-transport-controls[data-compact='true'] .left-side-play {
		grid-column: 1;
		grid-row: 2;
	}

	.media-transport-controls[data-compact='true'] .time-text {
		display: none;
	}

	.media-transport-controls[data-compact='true'] .command-row {
		grid-column: 3;
		grid-row: 2;
		margin: 0;
	}

	.media-transport-controls[data-compact='true'] .control-panel {
		height: 48px;
		padding: 3px;
	}

	.media-transport-controls[data-compact='true'] :global(.progress-slider) {
		margin: var(--winui-MediaTransportControlsProgressSliderCompactMargin);
	}
</style>
