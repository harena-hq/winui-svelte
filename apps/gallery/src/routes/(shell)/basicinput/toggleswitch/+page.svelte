<script lang="ts">
	import { ProgressRing, ToggleSwitch } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/basicinput/toggleswitch');
	if (item === null) throw new Error('ToggleSwitch page has no Gallery item');
	const simpleSample = sampleOf('ToggleSwitch/ToggleSwitchSimple.txt');
	const customSample = sampleOf('ToggleSwitch/ToggleSwitchCustom.txt');

	let working = $state(true);
</script>

<ItemPage {item}>
	<ControlExample
		headerText={simpleSample.header ?? undefined}
		xaml={simpleSample.xaml ?? undefined}
	>
		<!-- ToggleSwitchPage.xaml:23: AutomationProperties.Name="simple ToggleSwitch". -->
		<ToggleSwitch aria-label="simple ToggleSwitch" />
	</ControlExample>

	<ControlExample
		headerText={customSample.header ?? undefined}
		xaml={customSample.xaml ?? undefined}
		substitutions={{
			// ToggleSwitchPage.xaml:38-45: `isOn` writes "True" while the switch is on and
			// `isOff` writes "False" while it is off; a disabled substitution writes nothing.
			isOn: working ? 'True' : '',
			isOff: working ? '' : 'False'
		}}
	>
		<!-- ToggleSwitchPage.xaml:27-35: a horizontal StackPanel of the switch and a ring bound to
		     it. Both styles centre vertically (ToggleSwitch_themeresources.xaml:193,
		     ProgressRing.xaml:8). -->
		<div class="row">
			<ToggleSwitch
				header="Toggle work"
				offContent="Do work"
				onContent="Working"
				bind:checked={working}
			/>
			<!-- ToggleSwitchPage.xaml:34: Width="32"; the height is the style's 32
			     (ProgressRing.xaml:13). -->
			<ProgressRing active={working} style="width: 32px" />
		</div>
	</ControlExample>
</ItemPage>

<style>
	/* ToggleSwitchPage.xaml:27 is a StackPanel with Orientation="Horizontal" and no Spacing. */
	.row {
		display: flex;
		align-items: center;
	}
</style>
