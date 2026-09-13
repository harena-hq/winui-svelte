<script lang="ts">
	import { LineBreak, TextBlock } from 'winui-svelte';

	const longText =
		'A long line demonstrates wrapping in the TextBlock that contains this LineBreak.';
</script>

<svelte:head><title>LineBreak — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">LineBreak</h1>
<h2 class="winui-SubtitleTextBlockStyle">two lines</h2>
<div class="narrow"><TextBlock data-testid="two-lines">one<LineBreak />two</TextBlock></div>
<h2 class="winui-SubtitleTextBlockStyle">single line</h2>
<div class="narrow"><TextBlock data-testid="single-line">one</TextBlock></div>
<h2 class="winui-SubtitleTextBlockStyle">trailing line</h2>
<div class="narrow"><TextBlock data-testid="no-trailing">one<LineBreak />two</TextBlock></div>
<div class="narrow">
	<TextBlock data-testid="trailing">one<LineBreak />two<LineBreak /></TextBlock>
</div>
<h2 class="winui-SubtitleTextBlockStyle">double</h2>
<div class="narrow">
	<TextBlock data-testid="double">one<LineBreak /><LineBreak />two</TextBlock>
</div>
<!-- The case the baseline caught and no test did: a template that writes a newline after the
     break, which is what a wrapped paragraph looks like in source. The two lines must start at the
     same x. They did not while the compensating box was a sibling of the `<br>`. -->
<h2 class="winui-SubtitleTextBlockStyle">whitespace after the break</h2>
<div class="narrow">
	<TextBlock data-testid="space-after-break" textWrapping="wrap"
		>one<LineBreak />
		two</TextBlock
	>
</div>
<h2 class="winui-SubtitleTextBlockStyle">in wrap</h2>
<div class="narrow">
	<TextBlock data-testid="in-wrap" textWrapping="wrap">{longText}<LineBreak />{longText}</TextBlock>
</div>
<!-- The pairing the pinned Gallery actually writes, counted by parsing the XAML rather than by
     matching it: ten `TextBlock` elements hold a `LineBreak`, and `TextWrapping` is on seven of
     them — AnimatedIconPage two, GridViewPage two, SystemBackdropsPage three. The rest of what
     those ten carry is `Margin` twice and `MaxWidth` and `FontSize` twice each, and `MaxLines`,
     `TextTrimming`, `LineHeight`, `TextAlignment` and `IsTextSelectionEnabled` appear on none of
     them. A regex over the same files said otherwise and invented a `Style` pairing six times
     over, by pairing an opening tag with a nested element's closing one.

     The pair matters because the empty inline box that makes the trailing line is a layout
     participant, and `white-space: normal` is where a stray one would show up as a line nobody
     asked for. Two short strings rather than two long ones, so the expected count is exact. -->
<div class="narrow">
	<TextBlock data-testid="wrap-break" textWrapping="wrap">one<LineBreak />two</TextBlock>
</div>
<div class="narrow">
	<TextBlock data-testid="wrap-no-break" textWrapping="wrap">one two</TextBlock>
</div>
<!-- Wrapping with a *trailing* LineBreak is the shape five of those seven actually take —
     SystemBackdropsPage:46, AnimatedIconPage:17 and :63, and GridViewPage:273 and :278 — and it is
     the configuration the padding box exists for, so it gets its own row rather than being
     inferred from the two above. -->
<h2 class="winui-SubtitleTextBlockStyle">wrap with a trailing break</h2>
<div class="narrow">
	<TextBlock data-testid="wrap-trailing" textWrapping="wrap"
		>one<LineBreak />two<LineBreak /></TextBlock
	>
</div>
<div class="narrow">
	<TextBlock data-testid="wrap-trailing-control" textWrapping="wrap">one<LineBreak />two</TextBlock>
</div>

<style>
	/* c1-allow: harness layout, not a WinUI value */
	.narrow {
		width: 220px;
	}
</style>
