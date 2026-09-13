<script lang="ts">
	import { MediaTransportControls } from 'winui-svelte';
</script>

<svelte:head><title>MediaTransportControls — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">MediaTransportControls</h1>
<div class="rows">
	<h2 class="winui-SubtitleTextBlockStyle">Paused</h2>
	<div class="box"><MediaTransportControls duration={12.19} sourceLoaded /></div>
	<h2 class="winui-SubtitleTextBlockStyle">Playing</h2>
	<div class="box">
		<MediaTransportControls position={6} duration={12.19} playing sourceLoaded />
	</div>
	<h2 class="winui-SubtitleTextBlockStyle">Muted</h2>
	<div class="box"><MediaTransportControls duration={12.19} muted sourceLoaded /></div>
	<h2 class="winui-SubtitleTextBlockStyle">Not loaded</h2>
	<div class="box"><MediaTransportControls duration={12.19} /></div>
	<h2 class="winui-SubtitleTextBlockStyle">Loading</h2>
	<div class="box"><MediaTransportControls mediaState="loading" /></div>
	<h2 class="winui-SubtitleTextBlockStyle">Buffering</h2>
	<div class="box"><MediaTransportControls mediaState="buffering" /></div>
	<h2 class="winui-SubtitleTextBlockStyle">Error</h2>
	<div class="box">
		<MediaTransportControls mediaState="error" errorText="The media could not be decoded." />
	</div>
	<h2 class="winui-SubtitleTextBlockStyle">Compact</h2>
	<div class="box"><MediaTransportControls compact duration={12.19} sourceLoaded /></div>
	<h2 class="winui-SubtitleTextBlockStyle">All optional buttons</h2>
	<div class="box">
		<MediaTransportControls
			duration={12.19}
			sourceLoaded
			stopButtonVisible
			skipBackwardButtonVisible
			skipForwardButtonVisible
			fastRewindButtonVisible
			fastForwardButtonVisible
			playbackRateButtonVisible
			repeatButtonVisible
			previousTrackButtonVisible
			nextTrackButtonVisible
		/>
	</div>
	<h2 class="winui-SubtitleTextBlockStyle">No seek bar</h2>
	<div class="box">
		<MediaTransportControls duration={12.19} sourceLoaded seekBarVisible={false} />
	</div>
	<h2 class="winui-SubtitleTextBlockStyle">Middle group only</h2>
	<div class="box">
		<MediaTransportControls
			duration={12.19}
			sourceLoaded
			volumeButtonVisible={false}
			zoomButtonVisible={false}
			castButtonVisible={false}
		/>
	</div>
	<h2 class="winui-SubtitleTextBlockStyle">No auto-hide</h2>
	<div class="box">
		<MediaTransportControls duration={12.19} sourceLoaded showAndHideAutomatically={false} />
	</div>
</div>

<style>
	.rows {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.box {
		/* Harness-owned background, selected solely to keep the panel legible in every theme. */
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		padding: 12px;
	}
</style>
