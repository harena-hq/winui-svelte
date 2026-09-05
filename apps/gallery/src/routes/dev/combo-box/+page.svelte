<script lang="ts">
	import { ComboBox } from 'winui-svelte';
	import type { ComboBoxProps } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The six
	 * rows below exercise the surface the unit names: nothing selected, a selection,
	 * a header and a description, a disabled item, disabled, and an open popup so the
	 * list reaches the snapshot.
	 */

	const colours: ComboBoxProps['items'] = [
		{ value: 'red', label: 'Red' },
		{ value: 'green', label: 'Green' },
		{ value: 'blue', label: 'Blue' },
		{ value: 'yellow', label: 'Yellow' }
	];

	const withDisabled: ComboBoxProps['items'] = [
		{ value: 'sans', label: 'Segoe UI' },
		{ value: 'serif', label: 'Times New Roman' },
		{ value: 'mono', label: 'Cascadia Mono', disabled: true },
		{ value: 'display', label: 'Segoe UI Display' }
	];

	let placeholder: ComboBoxProps['value'] = $state('');
	let selected: ComboBoxProps['value'] = $state('green');
	let headerDescription: ComboBoxProps['value'] = $state('');
	let withDisabledItem: ComboBoxProps['value'] = $state('');
	let disabledControl: ComboBoxProps['value'] = $state('blue');
	let openSelection: ComboBoxProps['value'] = $state('');
	let open = $state(true);
</script>

<svelte:head><title>ComboBox — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ComboBox</h1>
<p class="winui-BodyTextBlockStyle">
	Six rows, in the order the unit names them: placeholder, a selection, a header and a description,
	an item that is itself disabled, the control as a whole disabled, and the popup open so the list
	reaches the snapshot.
</p>

<h2 class="winui-SubtitleTextBlockStyle">placeholder</h2>
<div class="row">
	<ComboBox items={colours} placeholder="Pick a colour" bind:value={placeholder} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">selected</h2>
<div class="row">
	<ComboBox items={colours} bind:value={selected} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a header and a description</h2>
<div class="row">
	<ComboBox
		placeholder="Pick a colour"
		items={colours}
		header="Colours"
		description="The accent colour for the brand surface."
		bind:value={headerDescription}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a disabled item</h2>
<div class="row">
	<ComboBox items={withDisabled} placeholder="Pick a colour" bind:value={withDisabledItem} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<ComboBox items={colours} bind:value={disabledControl} disabled />
</div>

<h2 class="winui-SubtitleTextBlockStyle">open</h2>
<div class="row">
	<ComboBox items={colours} placeholder="Pick a colour" bind:value={openSelection} bind:open />
</div>

<div class="tail"></div>

<style>
	/* The last row's popup is open in the snapshot; without room below it Floating UI
	   flips it upward over the row above, which would hide that row from the baseline. */
	.tail {
		height: 220px;
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
		max-width: 320px;
	}
</style>
