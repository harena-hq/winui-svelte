<script lang="ts">
	import { Button, ProgressRing } from 'winui-svelte/preview';

	let sweepValue = $state(25);
	let sweepIndeterminate = $state(false);
	let sweepActive = $state(true);
	let sweepMount = $state(0);

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
	<ProgressRing indeterminate={false} value={0} />
	<ProgressRing indeterminate={false} value={12} />
	<ProgressRing indeterminate={false} value={25} />
	<ProgressRing indeterminate={false} value={50} />
	<ProgressRing indeterminate={false} value={75} />
	<ProgressRing indeterminate={false} value={90} />
	<ProgressRing indeterminate={false} value={100} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">indeterminate</h2>
<div class="row">
	<ProgressRing />
	<ProgressRing active={false} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">size</h2>
<div class="row">
	<ProgressRing indeterminate={false} value={50} style="width: 16px; height: 16px" />
	<ProgressRing indeterminate={false} value={50} style="width: 60px; height: 60px" />
	<ProgressRing indeterminate={false} value={50} style="width: 100px; height: 100px" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">sweep</h2>
<div class="row">
	{#key sweepMount}
		<ProgressRing
			indeterminate={sweepIndeterminate}
			active={sweepActive}
			value={sweepValue}
			data-testid="sweep"
		/>
	{/key}
	<Button onclick={() => (sweepValue = 75)}>Raise to 75</Button>
	<Button onclick={() => (sweepValue = 10)}>Lower to 10</Button>
	<Button onclick={() => (sweepIndeterminate = !sweepIndeterminate)}>Toggle indeterminate</Button>
	<Button onclick={() => (sweepActive = !sweepActive)}>Toggle active</Button>
	<Button
		onclick={() => {
			sweepIndeterminate = false;
			sweepValue = 90;
		}}>Determinate at 90</Button
	>
	<Button onclick={() => sweepMount++}>Remount</Button>
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
