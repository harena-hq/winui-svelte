<script lang="ts">
	import { CheckBox } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The seven
	 * rows below exercise the surface the unit names — two-state and three-state across
	 * four pointer states, content, and form participation.
	 */

	let checked = $state(true);
	// The indeterminate row has its own pair. Sharing `checked` with the row above would
	// make two rows of the harness one control, and a photograph of it would show a state
	// no click on that row produced.
	let mixedChecked = $state(true);
	let mixedIndeterminate = $state(true);
	let threeStateChecked = $state(false);
	let threeStateIndeterminate = $state(false);
	let agree = $state(false);
</script>

<svelte:head><title>CheckBox — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">CheckBox</h1>
<p class="winui-BodyTextBlockStyle">
	Seven rows, in the order the unit names them: unchecked, checked, indeterminate, three-state,
	disabled in all three states, long content wrapping onto a second line, and form participation
	with a named value.
</p>

<h2 class="winui-SubtitleTextBlockStyle">unchecked</h2>
<div class="row">
	<CheckBox>Unchecked</CheckBox>
</div>

<h2 class="winui-SubtitleTextBlockStyle">checked</h2>
<div class="row">
	<CheckBox bind:checked>Checked</CheckBox>
</div>

<h2 class="winui-SubtitleTextBlockStyle">indeterminate</h2>
<div class="row">
	<CheckBox bind:checked={mixedChecked} bind:indeterminate={mixedIndeterminate}
		>Indeterminate</CheckBox
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">three-state</h2>
<div class="row">
	<CheckBox
		bind:checked={threeStateChecked}
		bind:indeterminate={threeStateIndeterminate}
		threeState
	>
		Three-state
	</CheckBox>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<CheckBox disabled>Disabled</CheckBox>
	<CheckBox checked disabled>Disabled checked</CheckBox>
	<CheckBox checked indeterminate disabled>Disabled indeterminate</CheckBox>
</div>

<h2 class="winui-SubtitleTextBlockStyle">long content</h2>
<div class="row narrow">
	<CheckBox>
		A CheckBox whose content is long enough to wrap onto a second line inside the row.
	</CheckBox>
</div>

<h2 class="winui-SubtitleTextBlockStyle">form participation</h2>
<div class="row">
	<form>
		<CheckBox name="agree" value="yes" bind:checked={agree}>Agree</CheckBox>
	</form>
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
</style>
