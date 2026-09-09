<script lang="ts">
	import SampleCodePresenter from '$lib/frame/SampleCodePresenter.svelte';

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
	const inline =
		'<TextBlock Text="A single inline sample, long enough that it has to be trimmed rather than wrapped or scrolled." />';
	const substituted = `<FlipView MaxWidth="400" Height="$(Height)"
          AutomationProperties.AutomationControlType="List"
          AutomationProperties.LocalizedControlType="list">
    <Image Source="ms-appx:///Assets/SampleMedia/cliff.jpg" AutomationProperties.Name="Cliff"/>
    <Image Source="ms-appx:///Assets/SampleMedia/grapes.jpg" AutomationProperties.Name="Grapes"/>
</FlipView>`;
</script>

<svelte:head><title>SampleCodePresenter — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">SampleCodePresenter</h1>

<h2 class="winui-SubtitleTextBlockStyle">xaml</h2>
<div class="row"><SampleCodePresenter code={xaml} /></div>

<h2 class="winui-SubtitleTextBlockStyle">csharp</h2>
<div class="row"><SampleCodePresenter code={csharp} sampleType="csharp" /></div>

<h2 class="winui-SubtitleTextBlockStyle">inline</h2>
<div class="row"><SampleCodePresenter code={inline} sampleType="inline" /></div>

<h2 class="winui-SubtitleTextBlockStyle">a substitution</h2>
<div class="row"><SampleCodePresenter code={substituted} substitutions={{ Height: '270' }} /></div>

<h2 class="winui-SubtitleTextBlockStyle">no copy button</h2>
<div class="row">
	<SampleCodePresenter code={csharp} sampleType="csharp" copyButtonVisible={false} />
</div>

<style>
	.row {
		max-width: 720px;
		padding: 16px 16px 16px;
		background: var(--winui-CardBackgroundFillColorSecondaryBrush);
	}
</style>
