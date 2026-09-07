<script lang="ts">
	import { ToggleButton } from 'winui-svelte';
	/* The component's own harness, not part of the Gallery reproduction: `/dev/` is where each control gets a page to be photographed on, and nothing links to it. */
</script>

<svelte:head><title>ToggleButton — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">ToggleButton</h1>
<p class="winui-BodyTextBlockStyle">
	Four rows, in order: the three states enabled, the same states disabled, a three-state unchecked
	button, and a long label to show nothing clips.
</p>
<h2 class="winui-SubtitleTextBlockStyle">states enabled</h2>
<div class="row">
	<ToggleButton>Unchecked</ToggleButton><ToggleButton checked>Checked</ToggleButton><ToggleButton
		indeterminate>Indeterminate</ToggleButton
	>
</div>
<h2 class="winui-SubtitleTextBlockStyle">states disabled</h2>
<div class="row">
	<ToggleButton disabled>Unchecked</ToggleButton><ToggleButton checked disabled
		>Checked</ToggleButton
	><ToggleButton indeterminate disabled>Indeterminate</ToggleButton>
</div>
<h2 class="winui-SubtitleTextBlockStyle">three state</h2>
<div class="row"><ToggleButton threeState>Three-state button</ToggleButton></div>
<h2 class="winui-SubtitleTextBlockStyle">long label</h2>
<div class="row">
	<ToggleButton>A very long label that the ToggleButton does not clip</ToggleButton>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}
</style>
