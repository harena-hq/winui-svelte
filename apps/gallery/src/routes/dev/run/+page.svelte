<script lang="ts">
	import { Run, TextBlock } from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>Run — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Run</h1>
<h2 class="winui-SubtitleTextBlockStyle">bare</h2>
<TextBlock data-testid="bare"><Run data-testid="bare-run">A Run is characters.</Run></TextBlock>
<h2 class="winui-SubtitleTextBlockStyle">Gallery fourth example</h2>
<TextBlock data-testid="gallery-fourth"
	><Run fontFamily="Times New Roman" foreground="darkgray"
		>Text in a TextBlock doesn't have to be a simple string.</Run
	></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">formatting</h2>
<TextBlock data-testid="formatting"
	><Run fontSize={20} fontStyle="italic" fontWeight={700} characterSpacing={200}>Formatted Run</Run
	></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">text prop</h2>
<TextBlock data-testid="text-prop-host"
	>before<Run data-testid="text-prop" text=" spaced " />after</TextBlock
>
<!-- The three `dir` rows are one claim in three parts: a consumer's `dir` reaches the element
     untouched when no FlowDirection is set, FlowDirection overrides it when both are written, and
     FlowDirection alone writes the attribute the consumer did not. The first is the one an
     attribute emitted after `{...rest}` silently erases.

     The string is bracketed by Latin letters on purpose. The first draft was
     `שלום עולם 123`, and it photographed the same in every one of these rows: European digits
     after a Hebrew run take that run's level whatever the base direction is, so three different
     props produced one picture. `abc` and `xyz` are strong characters, so the base direction
     decides which of them is leftmost — the picture now says which row is which. -->
<h2 class="winui-SubtitleTextBlockStyle">flow direction</h2>
<TextBlock data-testid="rest-dir-host"
	><Run data-testid="rest-dir" dir="rtl">abc שלום עולם xyz</Run></TextBlock
>
<TextBlock data-testid="flow-ltr-host"
	><Run data-testid="flow-ltr" dir="rtl" flowDirection="leftToRight">abc שלום עולם xyz</Run
	></TextBlock
>
<TextBlock data-testid="flow-rtl-host"
	><Run data-testid="flow-rtl" flowDirection="rightToLeft">abc שלום עולם xyz</Run></TextBlock
>
<!-- WD-080: the row that can tell the two mechanisms apart. A `dir` alone is HTML's
     `unicode-bidi: isolate`, which takes the run out of the surrounding bidi resolution and leaves
     the parenthesised digits to its right; the embedding the pin pushes leaves it in, and they
     move to its left. Every other specimen on this page renders identically either way, because a
     run that is the whole content of its block has no neutral beside it to resolve. -->
<TextBlock data-testid="embedding-host"
	>Label: <Run data-testid="embedding" flowDirection="rightToLeft">שלום עולם</Run><span
		data-testid="embedding-trailing">&nbsp;(123)</span
	></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">adjacent</h2>
<TextBlock data-testid="adjacent"
	><Run text="one " /><Run text="two " /><Run text="three" /></TextBlock
>
