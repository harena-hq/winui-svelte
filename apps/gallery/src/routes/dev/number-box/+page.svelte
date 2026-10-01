<script lang="ts">
	import { NumberBox } from 'winui-svelte/preview';
	import type { NumberBoxProps } from 'winui-svelte/preview';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The eight
	 * rows below exercise the surface the unit names: empty, with a value, spin buttons
	 * inline, spin buttons inline and disabled, a range with a value, a range sitting on
	 * each of its two bounds, a header and a description, disabled, and one content-sized
	 * row — see the comment on that row for why it is not redundant with the others.
	 */

	let empty: NumberBoxProps['value'] = $state(null);
	let withValue: NumberBoxProps['value'] = $state(42);
	let spinButtons: NumberBoxProps['value'] = $state(0);
	let spinButtonsDisabled: NumberBoxProps['value'] = $state(0);
	let withRange: NumberBoxProps['value'] = $state(50);
	let atMaximum: NumberBoxProps['value'] = $state(10);
	let atMinimum: NumberBoxProps['value'] = $state(0);
	let withHeaderDescription: NumberBoxProps['value'] = $state(3);
	let withHeaderDescriptionDisabled: NumberBoxProps['value'] = $state(7);
	let disabled: NumberBoxProps['value'] = $state(99);
	let contentSized: NumberBoxProps['value'] = $state(1);
	let contentSizedNoSpin: NumberBoxProps['value'] = $state(1);
</script>

<svelte:head><title>NumberBox — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">NumberBox</h1>
<p class="winui-BodyTextBlockStyle">
	Nine rows, in the order the unit names them: empty with a placeholder, with a value, with spin
	buttons inline, with spin buttons inline and disabled, a range with a value, a range sitting on
	each of its two bounds, a header and a description, disabled, and content-sized.
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

<h2 class="winui-SubtitleTextBlockStyle">a range, on each bound</h2>
<div class="row">
	<!-- The top row sits on its maximum and the bottom on its minimum, so the spin button
	     that can no longer move is photographed in its disabled colours. -->
	<NumberBox bind:value={atMaximum} min={0} max={10} spinButtonPlacementMode="inline" />
	<NumberBox bind:value={atMinimum} min={0} max={10} spinButtonPlacementMode="inline" />
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

<h2 class="winui-SubtitleTextBlockStyle">content-sized</h2>
<div class="row start">
	<!-- Every row above stretches to the container, which is what a photographed row must not
	     do here: `NumberBox.xaml:33` lowers the control's minimum from a text box's 318 to
	     `NumberBoxMinWidth`'s 120 when the spin buttons are inline, and a stretched row renders
	     that setter and its absence identically. This row is content-sized, so the first box
	     below is 120 wide and the second is 318, and a baseline can tell them apart. -->
	<NumberBox bind:value={contentSized} spinButtonPlacementMode="inline" />
	<NumberBox bind:value={contentSizedNoSpin} />
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
		max-width: 580px;
	}

	.row.start {
		align-items: flex-start;
	}
</style>
