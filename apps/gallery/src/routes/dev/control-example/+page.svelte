<script lang="ts">
	import { Button, CheckBox, ToggleSwitch } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';

	const xaml = `<FlipView MaxWidth="400" Height="270"
          AutomationProperties.AutomationControlType="List"
          AutomationProperties.LocalizedControlType="list">
    <Image Source="ms-appx:///Assets/SampleMedia/cliff.jpg" AutomationProperties.Name="Cliff"/>
    <Image Source="ms-appx:///Assets/SampleMedia/grapes.jpg" AutomationProperties.Name="Grapes"/>
</FlipView>`;
	const csharp = `// A handler, and the four scopes this grammar paints.
private void OnClick(object sender, RoutedEventArgs e)
{
    var count = 42;
    string label = "Hello";
}`;
</script>

<svelte:head><title>ControlExample — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ControlExample</h1>

<h2 class="winui-SubtitleTextBlockStyle">example only</h2>
<ControlExample headerText="Example only" {xaml}>
	<Button>Sample button</Button>
</ControlExample>

<h2 class="winui-SubtitleTextBlockStyle">example and options</h2>
<ControlExample headerText="Example and options" {xaml}>
	<Button>Sample button</Button>
	{#snippet options()}
		<div class="option-stack">
			<ToggleSwitch>Enable feature</ToggleSwitch>
			<CheckBox>Show details</CheckBox>
		</div>
	{/snippet}
</ControlExample>

<h2 class="winui-SubtitleTextBlockStyle">example, output and options</h2>
<ControlExample headerText="Example, output and options" {xaml}>
	<Button>Sample button</Button>
	{#snippet output()}<span>The sample output appears here.</span>{/snippet}
	{#snippet options()}
		<div class="option-stack">
			<ToggleSwitch>Enable feature</ToggleSwitch>
			<CheckBox>Show details</CheckBox>
		</div>
	{/snippet}
</ControlExample>

<h2 class="winui-SubtitleTextBlockStyle">both languages</h2>
<ControlExample headerText="Both languages" {xaml} {csharp}>
	<Button>Sample button</Button>
</ControlExample>

<h2 class="winui-SubtitleTextBlockStyle">no source code</h2>
<ControlExample headerText="No source code" {xaml} sourceCodeVisible={false}>
	<Button>Sample button</Button>
</ControlExample>

<h2 class="winui-SubtitleTextBlockStyle">no header</h2>
<ControlExample {xaml}>
	<Button>Sample button</Button>
</ControlExample>

<!-- The sample says where it sits: `VerticalAlignment="Top"` on the Border page's sample
     (BorderPage.xaml:24) is `data-vertical-alignment="top"` on the pane's direct child. The
     options pane is tall so the pane has room to show the difference. -->
<h2 class="winui-SubtitleTextBlockStyle">a sample aligned to the top</h2>
<ControlExample headerText="Aligned to the top" {xaml}>
	<div data-vertical-alignment="top"><Button>Sample button</Button></div>
	{#snippet options()}
		<div class="option-stack">
			<ToggleSwitch>Enable feature</ToggleSwitch>
			<CheckBox>Show details</CheckBox>
			<CheckBox>Show more details</CheckBox>
			<CheckBox>Show every detail</CheckBox>
		</div>
	{/snippet}
</ControlExample>

<style>
	.option-stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>
