<script lang="ts">
	import { RadioButton } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The five
	 * rows below exercise the surface the unit names — single state in two positions,
	 * native grouping, disabled in both states, and content that wraps onto a second line.
	 */

	let checked = $state(true);
	// The disabled rows have their own. Sharing `checked` with the row above would make
	// two rows of the harness one control, and a photograph of it would show a state
	// no click on that row produced.
	let disabledChecked = $state(true);
	let fruit = $state('pear');
</script>

<svelte:head><title>RadioButton — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">RadioButton</h1>
<p class="winui-BodyTextBlockStyle">
	Five rows, in the order the unit names them: unselected, selected, a native group with a shared
	`name` and a `bind:group` value, disabled in both states, and long content wrapping onto a second
	line.
</p>

<h2 class="winui-SubtitleTextBlockStyle">unselected</h2>
<div class="row">
	<RadioButton>Unselected</RadioButton>
</div>

<h2 class="winui-SubtitleTextBlockStyle">selected</h2>
<div class="row">
	<RadioButton bind:checked>Selected</RadioButton>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a group</h2>
<div class="column">
	<RadioButton name="fruit" value="apple" bind:group={fruit}>Apple</RadioButton>
	<RadioButton name="fruit" value="pear" bind:group={fruit}>Pear</RadioButton>
	<RadioButton name="fruit" value="plum" bind:group={fruit}>Plum</RadioButton>
	<p class="winui-BodyTextBlockStyle">Selected: {fruit}</p>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<RadioButton disabled>Disabled</RadioButton>
	<RadioButton bind:checked={disabledChecked} disabled>Disabled selected</RadioButton>
</div>

<h2 class="winui-SubtitleTextBlockStyle">long content</h2>
<div class="row narrow">
	<RadioButton>
		A RadioButton whose content is long enough to wrap onto a second line inside the row.
	</RadioButton>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}

	.row.narrow {
		max-width: 320px;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 24px;
	}
</style>
