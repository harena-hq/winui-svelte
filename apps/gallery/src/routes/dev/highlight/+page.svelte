<script lang="ts">
	import { highlight, type SampleLanguage, type Theme } from '$lib/highlight';

	// WinUI-Gallery/Samples/Geometry/Geometry.txt, its two XAML lines.
	const xaml = `<Grid CornerRadius="{StaticResource OverlayCornerRadius}"/>
<Grid CornerRadius="{StaticResource ControlCornerRadius}"/>`;
	// The ColorCode C# grammar harness sample specified for this route.
	const csharp = `// A handler, and the four scopes this grammar paints.
private void OnClick(object sender, RoutedEventArgs e)
{
    var count = 42;
    string label = "Hello";
}`;

	const panes: { language: SampleLanguage; theme: Theme; code: string }[] = [
		{ language: 'xaml', theme: 'light', code: xaml },
		{ language: 'xaml', theme: 'dark', code: xaml },
		{ language: 'csharp', theme: 'light', code: csharp },
		{ language: 'csharp', theme: 'dark', code: csharp }
	];
</script>

<svelte:head><title>Highlight — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Highlight</h1>

{#each panes as pane (pane.language + pane.theme)}
	<h2 class="winui-SubtitleTextBlockStyle">{pane.language}, {pane.theme} palette</h2>
	<pre>{#each highlight(pane.code, pane.language, pane.theme) as span, index (index)}<span
				style:color={span.color ?? undefined}
				class:code-bold={span.bold}
				class:code-italic={span.italic}>{span.text}</span
			>{/each}</pre>
{/each}

<style>
	pre {
		/* c1-allow: SampleCodePresenter.xaml.cs:251, the RichTextBlock the presenter builds carries this stack */
		font-family: Consolas, 'Cascadia Code', monospace;
		color: var(--winui-TextFillColorPrimaryBrush);
		background: var(--winui-CardBackgroundFillColorSecondaryBrush);
		padding: 12px;
	}

	.code-bold {
		/* c1-allow: ColorCode.internal/RichTextBlockFormatter.cs:148, a bold style sets FontWeights.Bold on the run */
		font-weight: bold;
	}

	.code-italic {
		font-style: italic;
	}
</style>
