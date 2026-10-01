<script lang="ts">
	import { ToggleSwitch } from 'winui-svelte/preview';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The five
	 * rows below exercise the surface the unit names — the two toggle positions, a header
	 * with non-default content, disabled in both states, and content rendered as a string
	 * the consumer supplies.
	 */

	let on = $state(true);
	let withHeader = $state(true);
	// The disabled row has its own. Sharing `checked` with the row above would make two
	// rows of the harness one control, and a photograph of it would show a state no click
	// on that row produced.
	let disabledChecked = $state(true);
	let custom = $state(false);
</script>

<svelte:head><title>ToggleSwitch — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ToggleSwitch</h1>
<p class="winui-BodyTextBlockStyle">
	Five rows, in the order the unit names them: off, on, on with a header and custom on/off content,
	disabled in both states, and a switch whose labels are not "On" and "Off".
</p>

<h2 class="winui-SubtitleTextBlockStyle">off</h2>
<div class="row">
	<ToggleSwitch />
</div>

<h2 class="winui-SubtitleTextBlockStyle">on</h2>
<div class="row">
	<ToggleSwitch bind:checked={on} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">with a header</h2>
<div class="row">
	<ToggleSwitch
		header="Toggle work"
		bind:checked={withHeader}
		onContent="Working"
		offContent="Do work"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<ToggleSwitch disabled />
	<ToggleSwitch bind:checked={disabledChecked} disabled />
</div>

<h2 class="winui-SubtitleTextBlockStyle">custom content</h2>
<div class="row">
	<ToggleSwitch bind:checked={custom} onContent="Enabled" offContent="Disabled" />
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}
</style>
