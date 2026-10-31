<script lang="ts">
	import { ProgressBar } from 'winui-svelte/preview';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. Every bar is
	 * 130px wide because the original Gallery's ProgressBarPage.xaml sets `Width="130"`.
	 * The plain indeterminate bar photographs as a still 60%-wide bar, and that is correct.
	 * `snapshotAllThemes` uses `toHaveScreenshot`, whose `animations` option defaults to
	 * `disabled`, and an infinite animation is *cancelled* for the shot rather than paused
	 * at a keyframe — so both indicators render with no transform at all, at the left edge,
	 * and the wider of the two covers the narrower. The paused and error bars below it are
	 * genuinely still at full width; only the first row is an artefact of the capture.
	 */
</script>

<svelte:head><title>ProgressBar — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ProgressBar</h1>
<p class="winui-BodyTextBlockStyle">
	Four rows exercise determinate, paused, error, indeterminate, and non-default ranges.
</p>

<h2 class="winui-SubtitleTextBlockStyle">determinate</h2>
<div class="row">
	<ProgressBar value={0} style="width: 130px" />
	<ProgressBar value={25} style="width: 130px" />
	<ProgressBar value={50} style="width: 130px" />
	<ProgressBar value={75} style="width: 130px" />
	<ProgressBar value={100} style="width: 130px" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">determinate, paused and error</h2>
<div class="row">
	<ProgressBar value={50} style="width: 130px" />
	<ProgressBar value={50} showPaused style="width: 130px" />
	<ProgressBar value={50} showError style="width: 130px" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">indeterminate</h2>
<div class="row">
	<ProgressBar indeterminate style="width: 130px" />
	<ProgressBar indeterminate showPaused style="width: 130px" />
	<ProgressBar indeterminate showError style="width: 130px" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">range</h2>
<div class="row">
	<ProgressBar minimum={0} maximum={10} value={5} style="width: 130px" />
	<ProgressBar minimum={-50} maximum={50} value={0} style="width: 130px" />
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 24px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
