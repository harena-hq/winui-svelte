<script lang="ts">
	import { ToggleSplitButton } from 'winui-svelte';

	const items = [
		{ id: 'red', text: 'Red' },
		{ id: 'green', text: 'Green' },
		{ id: 'blue', text: 'Blue' }
	];

	/* The component's own harness, not part of the Gallery reproduction: `/dev/` is where each control gets a page to be photographed on, and nothing links to it. */
</script>

<svelte:head><title>ToggleSplitButton — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">ToggleSplitButton</h1>
<p class="winui-BodyTextBlockStyle">Four rows: unchecked, checked, disabled, and open.</p>

<h2 class="winui-SubtitleTextBlockStyle">unchecked</h2>
<div class="row">
	<ToggleSplitButton {items}>Choose colour</ToggleSplitButton>
</div>

<h2 class="winui-SubtitleTextBlockStyle">checked</h2>
<div class="row">
	<ToggleSplitButton {items} checked>Choose colour</ToggleSplitButton>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<ToggleSplitButton disabled>Disabled</ToggleSplitButton>
	<ToggleSplitButton checked disabled>Disabled checked</ToggleSplitButton>
</div>

<h2 class="winui-SubtitleTextBlockStyle">open</h2>
<div class="row clear-below">
	<ToggleSplitButton {items} checked open>Choose colour</ToggleSplitButton>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}

	/* SplitButton places its menu BottomEdgeAlignedLeft (SplitButton.cpp:226), so a portalled
	   menu needs room below rather than above. This last row only needs to keep the surface
	   inside the 720px viewport at which the baselines are photographed. */
	.clear-below {
		margin-bottom: 160px;
	}
</style>
