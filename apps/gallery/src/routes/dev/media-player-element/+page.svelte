<script lang="ts">
	import { MediaPlayerElement } from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>MediaPlayerElement — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">MediaPlayerElement</h1>

<!-- Playwright's `animations: 'disabled'` completes CSS animations but cannot freeze a decoding
     video, so no row auto-plays and every baseline remains deterministic. -->
<div class="rows">
	<h2 class="winui-SubtitleTextBlockStyle">No source, no poster</h2>
	<MediaPlayerElement autoPlay={false} />
	<h2 class="winui-SubtitleTextBlockStyle">Poster, no source</h2>
	<MediaPlayerElement posterSource="/valley.jpg" autoPlay={false} />
	<h2 class="winui-SubtitleTextBlockStyle">Poster, Uniform</h2>
	<MediaPlayerElement
		posterSource="/valley.jpg"
		autoPlay={false}
		style="width: 200px; height: 120px"
	/>
	<h2 class="winui-SubtitleTextBlockStyle">Poster, UniformToFill</h2>
	<MediaPlayerElement
		posterSource="/valley.jpg"
		stretch="uniformToFill"
		autoPlay={false}
		style="width: 200px; height: 120px"
	/>
	<h2 class="winui-SubtitleTextBlockStyle">Poster, Fill</h2>
	<MediaPlayerElement
		posterSource="/valley.jpg"
		stretch="fill"
		autoPlay={false}
		style="width: 200px; height: 120px"
	/>
	<h2 class="winui-SubtitleTextBlockStyle">Poster, None</h2>
	<MediaPlayerElement
		posterSource="/valley.jpg"
		stretch="none"
		autoPlay={false}
		style="width: 200px; height: 120px"
	/>
	<h2 class="winui-SubtitleTextBlockStyle">Poster with transport controls</h2>
	<MediaPlayerElement posterSource="/valley.jpg" transportControlsEnabled autoPlay={false} />
	<h2 class="winui-SubtitleTextBlockStyle">Poster with compact controls</h2>
	<MediaPlayerElement
		posterSource="/valley.jpg"
		transportControlsEnabled
		transportControlsProps={{ compact: true }}
		autoPlay={false}
	/>
	<h2 class="winui-SubtitleTextBlockStyle">Source without playback</h2>
	<MediaPlayerElement source="/ladybug.mp4" posterSource="/valley.jpg" autoPlay={false} />
</div>

<style>
	.rows {
		display: flex;
		flex-direction: column;
		gap: 12px;
		/* A MediaPlayerElement is a stretching Control, so an uncapped row would take the whole
		   harness column and photograph a 1232-wide video. 400 is the MaxWidth both Gallery
		   examples set, which keeps every row the size the page under test is judged at. */
		max-width: 400px;
	}
</style>
