<script lang="ts">
	import { ToggleSwitch } from 'winui-svelte';

	// `variant="rightAlignedCompact"`, the Toolkit's style, as the original's Settings page draws it: a row
	// with a label at the left and the switch at the right.
	let sound = $state(false);
</script>

<svelte:head><title>ToggleSwitch rightAlignedCompact — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ToggleSwitch — rightAlignedCompact</h1>
<div class="row" data-row="off">
	<span>Sound</span>
	<ToggleSwitch variant="rightAlignedCompact" bind:checked={sound} aria-label="Sound" />
</div>
<div class="row" data-row="on">
	<span>Checked</span>
	<ToggleSwitch variant="rightAlignedCompact" checked aria-label="Checked" />
</div>
<div class="row" data-row="header">
	<span>With a header</span>
	<ToggleSwitch variant="rightAlignedCompact" header="Hi" aria-label="With a header" />
</div>
<div class="row" data-row="long-header">
	<span>A long header</span>
	<ToggleSwitch
		variant="rightAlignedCompact"
		header="A header wider than the switch and its text"
		aria-label="Long"
	/>
</div>
<div class="row" data-row="disabled">
	<span>Disabled</span>
	<ToggleSwitch variant="rightAlignedCompact" disabled aria-label="Disabled" />
</div>
<div class="row" data-row="empty">
	<span>No text</span>
	<ToggleSwitch variant="rightAlignedCompact" onContent="" offContent="" aria-label="No text" />
</div>

<style>
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 400px;
	}
</style>
