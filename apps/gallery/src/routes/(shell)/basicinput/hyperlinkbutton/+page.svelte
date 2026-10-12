<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { CheckBox, HyperlinkButton } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/basicinput/hyperlinkbutton');
	if (item === null) throw new Error('HyperlinkButton page has no Gallery item');
	const navigateSample = sampleOf('HyperlinkButton/HyperlinkButtonNavigate.txt');
	const clickSample = sampleOf('HyperlinkButton/HyperlinkButtonClick.txt');

	let disabled = $state(false);

	// HyperlinkButtonPage.xaml.cs:17-20: the click opens the ToggleButton item in the window's
	// own frame.
	function goToToggleButton() {
		void goto(resolve('/basicinput/togglebutton'));
	}
</script>

<ItemPage {item}>
	<ControlExample
		headerText={navigateSample.header ?? undefined}
		xaml={navigateSample.xaml ?? undefined}
		substitutions={{
			// HyperlinkButtonPage.xaml:35-40: written while the box is checked, and a disabled
			// substitution writes nothing.
			IsEnabled: disabled ? 'IsEnabled="False" ' : ''
		}}
	>
		<!-- HyperlinkButtonPage.xaml:24-28. The original launches the URI in an external app
		     (HyperLinkButton_Partial.cpp:168-172), which the item's own description names as
		     the default browser (ControlInfoData.json:1449), outside the Gallery's window; a
		     new tab is that here, as the page header's links do. -->
		<HyperlinkButton
			navigateUri="https://www.microsoft.com"
			target="_blank"
			rel="noreferrer"
			{disabled}>Microsoft home page</HyperlinkButton
		>
		{#snippet options()}
			<!-- HyperlinkButtonPage.xaml:31-33: a StackPanel holding the one CheckBox. -->
			<CheckBox bind:checked={disabled}>Disable hyperlink button</CheckBox>
		{/snippet}
	</ControlExample>

	<ControlExample headerText={clickSample.header ?? undefined} xaml={clickSample.xaml ?? undefined}>
		<!-- HyperlinkButtonPage.xaml:45-48. -->
		<HyperlinkButton onclick={goToToggleButton}>Go to ToggleButton</HyperlinkButton>
	</ControlExample>
</ItemPage>
