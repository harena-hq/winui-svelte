<script lang="ts">
	import { NumberBox } from 'winui-svelte';
	import type { NumberBoxProps } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The seven
	 * rows below exercise the surface the unit names: empty, with a value, spin buttons
	 * inline, spin buttons inline and disabled, a range with a value, a header and a
	 * description, and disabled.
	 */

	let empty: NumberBoxProps['value'] = $state(null);
	let withValue: NumberBoxProps['value'] = $state(42);
	let spinButtons: NumberBoxProps['value'] = $state(0);
	let spinButtonsDisabled: NumberBoxProps['value'] = $state(0);
	let withRange: NumberBoxProps['value'] = $state(50);
	let withHeaderDescription: NumberBoxProps['value'] = $state(3);
	let withHeaderDescriptionDisabled: NumberBoxProps['value'] = $state(7);
	let disabled: NumberBoxProps['value'] = $state(99);
</script>

<svelte:head><title>NumberBox — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">NumberBox</h1>
<p class="winui-BodyTextBlockStyle">
	Seven rows, in the order the unit names them: empty with a placeholder, with a value, with spin
	buttons inline, with spin buttons inline and disabled, a range with a value, a header and a
	description, and disabled.
</p>

<h2 class="winui-SubtitleTextBlockStyle">empty</h2>
<div class="row">
	<NumberBox bind:value={empty} placeholder="Type a number" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">with a value</h2>
<div class="row">
	<NumberBox bind:value={withValue} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">spin buttons</h2>
<div class="row">
	<NumberBox bind:value={spinButtons} spinButtonPlacementMode="inline" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">spin buttons, disabled</h2>
<div class="row">
	<NumberBox bind:value={spinButtonsDisabled} spinButtonPlacementMode="inline" disabled />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a range</h2>
<div class="row">
	<NumberBox bind:value={withRange} min={0} max={100} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a header and a description</h2>
<div class="row">
	<NumberBox
		header="Quantity"
		description="Between 1 and 10."
		min={1}
		max={10}
		bind:value={withHeaderDescription}
	/>
	<NumberBox
		header="Quantity"
		description="Between 1 and 10."
		min={1}
		max={10}
		bind:value={withHeaderDescriptionDisabled}
		disabled
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<NumberBox bind:value={disabled} disabled />
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
		max-width: 580px;
	}
</style>
