<script lang="ts">
	import { LineBreak, Paragraph, RichTextBlock } from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>Paragraph — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">Paragraph</h1>
<h2 class="winui-SubtitleTextBlockStyle">owner and local values</h2>
<RichTextBlock textIndent={24}
	><Paragraph data-testid="indent-inherited">Inherited indent.</Paragraph><Paragraph
		data-testid="indent-local"
		textIndent={0}>Local indent.</Paragraph
	></RichTextBlock
>
<div class="wide">
	<RichTextBlock textAlignment="right"
		><Paragraph data-testid="align-inherited">Inherited alignment.</Paragraph><Paragraph
			data-testid="align-local"
			textAlignment="left">Local alignment.</Paragraph
		></RichTextBlock
	>
</div>
<RichTextBlock lineHeight={40}
	><Paragraph data-testid="line-height-inherited">Inherited line height.</Paragraph><Paragraph
		data-testid="line-height-local"
		lineHeight={20}>Local line height.</Paragraph
	></RichTextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">margin and formatting</h2>
<RichTextBlock
	><Paragraph data-testid="margin" margin="0,16">Paragraph margin.</Paragraph><Paragraph
		data-testid="formatting"
		fontFamily="Arial"
		fontSize={24}
		fontStyle="italic"
		fontWeight={700}
		foreground="cornflowerblue"
		characterSpacing={200}>All formatting members.</Paragraph
	></RichTextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">trailing LineBreak</h2>
<div class="narrow">
	<RichTextBlock
		><Paragraph data-testid="trailing-break">one<LineBreak />two<LineBreak /></Paragraph
		></RichTextBlock
	><RichTextBlock
		><Paragraph data-testid="no-trailing-break">one<LineBreak />two</Paragraph></RichTextBlock
	>
</div>

<style>
	/* c1-allow: harness layout, not a WinUI value */
	.narrow {
		width: 220px;
	}

	/* c1-allow: harness layout, not a WinUI value */
	.wide {
		width: 420px;
	}
</style>
