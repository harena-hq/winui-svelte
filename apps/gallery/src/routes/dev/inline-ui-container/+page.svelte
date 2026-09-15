<script lang="ts">
	import { InlineUIContainer, Paragraph, RichTextBlock, Run } from 'winui-svelte';
</script>

<svelte:head><title>InlineUIContainer — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">InlineUIContainer</h1>
<RichTextBlock
	><Paragraph
		><Run>Before</Run><InlineUIContainer data-testid="baseline-box"
			><div class="box"></div></InlineUIContainer
		><Run>after</Run><span data-testid="baseline-ruler" class="ruler"></span></Paragraph
	></RichTextBlock
>
<RichTextBlock
	><Paragraph data-testid="validated-line"
		><InlineUIContainer><span class="glyph">!</span></InlineUIContainer><Run text=" " /><Run
			>Validation message</Run
		></Paragraph
	></RichTextBlock
>

<style>
	/* Harness layout, not a WinUI value — but not invisible either: this page is photographed in
	   three themes and its whole subject is where an element sits in a line of text, so a box with
	   no paint would give the baseline nothing to hold. The fill is an emitted token, so it follows
	   the theme switch like everything else on the page. */
	.box {
		width: 24px;
		height: 24px;
		background: var(--winui-AccentFillColorDefaultBrush);
	}

	/* The baseline reference the assertion measures against: an empty inline-block has no in-flow
	   line box, so CSS puts its baseline at its bottom margin edge, which is the text baseline of
	   the line it sits in. Zero-width, so it displaces nothing it is measuring. */
	.ruler {
		display: inline-block;
		width: 0;
	}

	/* c1-allow: harness layout, not a WinUI value */
	.glyph {
		display: block;
		width: 14px;
		height: 14px;
		background: var(--winui-SystemFillColorCriticalBrush);
	}
</style>
