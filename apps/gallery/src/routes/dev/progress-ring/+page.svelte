<script lang="ts">
	import { ProgressRing } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on. The indeterminate row photographs at
	 * whatever frame a cancelled animation leaves; see `dev/progress-bar/+page.svelte`, which
	 * explains the same thing. `toHaveScreenshot` cancels infinite animations for the shot
	 * rather than pausing them at a keyframe.
	 */
</script>

<svelte:head><title>ProgressRing — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ProgressRing</h1>
<p class="winui-BodyTextBlockStyle">
	Determinate, indeterminate, inactive, and resizable progress rings.
</p>

<h2 class="winui-SubtitleTextBlockStyle">determinate</h2>
<div class="row">
	<ProgressRing isIndeterminate={false} value={0} />
	<ProgressRing isIndeterminate={false} value={12} />
	<ProgressRing isIndeterminate={false} value={25} />
	<ProgressRing isIndeterminate={false} value={50} />
	<ProgressRing isIndeterminate={false} value={75} />
	<ProgressRing isIndeterminate={false} value={90} />
	<ProgressRing isIndeterminate={false} value={100} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">indeterminate</h2>
<div class="row">
	<ProgressRing />
	<ProgressRing isActive={false} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">size</h2>
<div class="row">
	<ProgressRing isIndeterminate={false} value={50} style="width: 16px; height: 16px" />
	<ProgressRing isIndeterminate={false} value={50} style="width: 60px; height: 60px" />
	<ProgressRing isIndeterminate={false} value={50} style="width: 100px; height: 100px" />
</div>

<style>
	.row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 24px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
