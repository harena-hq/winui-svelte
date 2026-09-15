<script lang="ts">
	import { Hyperlink, Paragraph, RichTextBlock, Run } from 'winui-svelte';
	const longText =
		'This sentence is deliberately wider than the narrow box and contains ordinary words for wrapping.';
</script>

<svelte:head><title>RichTextBlock — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">RichTextBlock</h1>
<h2 class="winui-SubtitleTextBlockStyle">bare</h2>
<RichTextBlock data-testid="bare"><Paragraph>I am a RichTextBlock.</Paragraph></RichTextBlock>
<!-- RichTextBlockPage.xaml:30-36, and the spaces are transcribed rather than repaired. Upstream
     writes `supports<Run …>` with nothing between them, and puts each `, ` on the next source
     line, where XAML collapses the newline and its indent into one space. So the original reads
     "…supports" then "formatted text" then " , hyperlinks" — a space before each comma that a
     copy-editor would remove and this harness keeps, because the bar is what the original draws.
     Every string is a `text` prop for the reason `RunProps.text` gives: markup's edge whitespace
     belongs to the template compiler, and these edges are the specimen. -->
<h2 class="winui-SubtitleTextBlockStyle">the Gallery's second example</h2>
<RichTextBlock data-testid="gallery-second" selectionHighlightColor="green"
	><Paragraph
		><Run text="RichTextBlock provides a rich text display container that supports" /><Run
			fontStyle="italic"
			fontWeight={700}
			text="formatted text"
		/><Run text=" , " /><Hyperlink
			navigateUri="https://learn.microsoft.com/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.Documents.Hyperlink"
			>hyperlinks</Hyperlink
		><Run text=" , inline images, and other rich content." /></Paragraph
	><Paragraph>RichTextBlock also supports a built-in overflow model.</Paragraph></RichTextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">wrapping</h2>
<div class="narrow">
	<RichTextBlock data-testid="wrapping-default"><Paragraph>{longText}</Paragraph></RichTextBlock
	><RichTextBlock data-testid="wrapping-no-wrap" textWrapping="noWrap"
		><Paragraph>{longText}</Paragraph></RichTextBlock
	><RichTextBlock data-testid="wrapping-wrap-whole-words" textWrapping="wrapWholeWords"
		><Paragraph>{longText}</Paragraph></RichTextBlock
	>
</div>
<h2 class="winui-SubtitleTextBlockStyle">trimming</h2>
<div class="narrow">
	<RichTextBlock data-testid="trimming-clip" textWrapping="noWrap" textTrimming="clip"
		><Paragraph>{longText}</Paragraph></RichTextBlock
	><RichTextBlock
		data-testid="trimming-character"
		textWrapping="noWrap"
		textTrimming="characterEllipsis"><Paragraph>{longText}</Paragraph></RichTextBlock
	>
</div>
<h2 class="winui-SubtitleTextBlockStyle">selection</h2>
<RichTextBlock data-testid="selection-default"
	><Paragraph>Selectable browser text.</Paragraph></RichTextBlock
><RichTextBlock data-testid="selection-disabled" textSelectionEnabled={false}
	><Paragraph>Unselectable browser text.</Paragraph></RichTextBlock
><RichTextBlock data-testid="selection-highlight" selectionHighlightColor="darkorange"
	><Paragraph>Local highlight colour.</Paragraph></RichTextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">padding and formatting</h2>
<RichTextBlock data-testid="padding" padding="8,5"
	><Paragraph>Padded text.</Paragraph></RichTextBlock
><RichTextBlock
	data-testid="formatting"
	fontFamily="Arial"
	fontSize={24}
	fontStyle="italic"
	fontWeight={700}
	foreground="cornflowerblue"
	characterSpacing={200}><Paragraph>All formatting members.</Paragraph></RichTextBlock
>

<!-- The four members this control emits even for their own defaults, put where they can be seen
     to do it: an ancestor that sets all four of the inherited properties they map to. XAML gives
     a RichTextBlock its own default here rather than an ancestor's, because none of the four is in
     the inherited text formatting record (corep.h:487-499), and a CSS component that left any of
     them unset would take this wrapper's value instead. -->
<h2 class="winui-SubtitleTextBlockStyle">defaults against an inheriting ancestor</h2>
<div class="hostile">
	<RichTextBlock data-testid="inheriting-ancestor"
		><Paragraph>Defaults win over the ancestor.</Paragraph></RichTextBlock
	>
</div>

<style>
	/* c1-allow: harness layout, not a WinUI value */
	.narrow {
		width: 220px;
	}

	/* c1-allow: harness layout, not a WinUI value. Every declaration here is an inherited CSS
	   property whose XAML counterpart is not inherited, so each one is a value the component has to
	   refuse. */
	.hostile {
		width: 220px;
		text-indent: 40px;
		text-align: right;
		white-space: nowrap;
		user-select: none;
	}
</style>
