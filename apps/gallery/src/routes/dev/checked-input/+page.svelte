<script lang="ts">
	import { CheckBox, RadioButton, ToggleSwitch } from '@harena-hq/winui-svelte/preview';

	/*
	 * The `<input>` behind `CheckBox`, `ToggleSwitch` and `RadioButton`, in the cases where the
	 * browser's own change to `checked` is wrong and the props' update has nothing to write: an
	 * indeterminate box whose `checked` is false, a radio with no `value` to put in its `group`,
	 * and a parent that puts the state back from its callback. "Moves on" and "Clears the group"
	 * are the contrast: a parent moves the selection to a third radio or clears it, the props do
	 * change, and the clicked radio still ends unselected.
	 *
	 * **Nothing photographs this page.** `check-box.spec.ts`, `toggle-switch.spec.ts` and
	 * `radio-button.spec.ts` click each row and read the input against the component's root.
	 * `#log` records every callback these rows run, in order, so a test whose row ends
	 * where it started can tell that the click reached the component.
	 */
	let log = $state<string[]>([]);
	let mixed = $state(true);
	let staysUnchecked = $state(false);
	let staysMixed = $state(true);
	let staysOff = $state(false);
	let staysFirst = $state('first');
	let movesOn = $state('start');
	let noValue = $state('none');
	let cleared = $state('kept');
	let staysClear = $state(false);
</script>

<svelte:head><title>Checked input — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Checked input</h1>

<div class="row">
	<CheckBox checked={false} bind:indeterminate={mixed}>Unchecked and indeterminate</CheckBox>
	<CheckBox
		bind:checked={staysUnchecked}
		onCheckedChange={(checked) => {
			log = [...log, `checked:${checked}`];
			staysUnchecked = false;
		}}
	>
		Stays unchecked
	</CheckBox>
	<CheckBox
		bind:indeterminate={staysMixed}
		onIndeterminateChange={(indeterminate) => {
			log = [...log, `indeterminate:${indeterminate}`];
			staysMixed = true;
		}}
	>
		Stays indeterminate
	</CheckBox>
	<ToggleSwitch
		bind:checked={staysOff}
		onCheckedChange={(checked) => {
			log = [...log, `switch:${checked}`];
			staysOff = false;
		}}
		header="Stays off"
	/>
</div>

<div class="row">
	<RadioButton
		name="stays"
		value="first"
		bind:group={staysFirst}
		onGroupChange={(group) => {
			log = [...log, `group:${group}`];
			staysFirst = 'first';
		}}
	>
		Stays first
	</RadioButton>
	<RadioButton
		name="stays"
		value="second"
		bind:group={staysFirst}
		onGroupChange={(group) => {
			log = [...log, `group:${group}`];
			staysFirst = 'first';
		}}
	>
		Never second
	</RadioButton>
	<RadioButton name="moves" value="start" bind:group={movesOn}>Start</RadioButton>
	<RadioButton
		name="moves"
		value="clicked"
		bind:group={movesOn}
		onGroupChange={(group) => {
			log = [...log, `moves:${group}`];
			movesOn = 'third';
		}}
	>
		Moves on
	</RadioButton>
	<RadioButton name="moves" value="third" bind:group={movesOn}>Third</RadioButton>
	<RadioButton name="clears" value="kept" bind:group={cleared}>Kept</RadioButton>
	<RadioButton
		name="clears"
		value="clearing"
		bind:group={cleared}
		onGroupChange={(group) => {
			log = [...log, `clears:${group}`];
			cleared = '';
		}}
	>
		Clears the group
	</RadioButton>
	<RadioButton name="valueless" value="none" bind:group={noValue}>Has a value</RadioButton>
	<RadioButton name="valueless" bind:group={noValue}>Has no value</RadioButton>
	<RadioButton
		bind:checked={staysClear}
		onCheckedChange={(checked) => {
			log = [...log, `radio:${checked}`];
			staysClear = false;
		}}
	>
		Stays clear
	</RadioButton>
</div>
<p id="log">{log.join(' ')}</p>

<style>
	.row {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}
</style>
