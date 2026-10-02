<script lang="ts">
	import { CheckBox, ToggleSwitch } from 'winui-svelte/preview';

	/*
	 * The `<input>` behind `CheckBox` and `ToggleSwitch`, in the two cases where the browser's
	 * flip of `checked` is wrong and the props' own update has nothing to write: an indeterminate
	 * box whose `checked` is false, and a parent that puts the state back from its callback.
	 *
	 * **Nothing photographs this page.** `check-box.spec.ts` and `toggle-switch.spec.ts` click each
	 * row and read the input against the component's root. `#log` records every callback the
	 * put-back rows run, in order, so a test whose row ends where it started can tell that the
	 * click reached the component.
	 */
	let log = $state<string[]>([]);
	let mixed = $state(true);
	let staysUnchecked = $state(false);
	let staysMixed = $state(true);
	let staysOff = $state(false);
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

<p id="log">{log.join(' ')}</p>

<style>
	.row {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}
</style>
