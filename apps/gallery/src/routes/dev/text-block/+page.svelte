<script lang="ts">
	import { TextBlock, type TextBlockStyleName } from 'winui-svelte';

	const textStyles: TextBlockStyleName[] = [
		'BaseTextBlockStyle',
		'CaptionTextBlockStyle',
		'BodyTextBlockStyle',
		'BodyStrongTextBlockStyle',
		'BodyLargeTextBlockStyle',
		'BodyLargeStrongTextBlockStyle',
		'SubtitleTextBlockStyle',
		'TitleTextBlockStyle',
		'TitleLargeTextBlockStyle',
		'DisplayTextBlockStyle'
	];

	const longText =
		'One long line demonstrates how this TextBlock wraps its content when its available width is limited.';
	const longWordText =
		'A very long unbroken word Supercalifragilisticexpialidociousdemonstratesthewrappingdifference follows.';
</script>

<svelte:head><title>TextBlock — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TextBlock</h1>

<h2 class="winui-SubtitleTextBlockStyle">bare</h2>
<TextBlock data-testid="bare" text="I am a TextBlock." />

<h2 class="winui-SubtitleTextBlockStyle">the ten ramp styles</h2>
{#each textStyles as textStyle (textStyle)}
	<TextBlock data-testid={`style-${textStyle}`} {textStyle} text={textStyle} />
{/each}

<h2 class="winui-SubtitleTextBlockStyle">the Gallery's third example</h2>
<TextBlock
	data-testid="gallery-third"
	fontFamily="Arial"
	fontSize={24}
	fontStyle="italic"
	foreground="cornflowerblue"
	characterSpacing={200}
	textWrapping="wrapWholeWords"
	text="I am super excited to be here!"
/>

<h2 class="winui-SubtitleTextBlockStyle">the three wrapping modes</h2>
<div class="narrow">
	<TextBlock data-testid="wrapping-no-wrap" textWrapping="noWrap" text={longWordText} />
	<TextBlock data-testid="wrapping-wrap" textWrapping="wrap" text={longWordText} />
	<TextBlock
		data-testid="wrapping-wrap-whole-words"
		textWrapping="wrapWholeWords"
		text={longWordText}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the four trimming modes</h2>
<div class="narrow">
	<TextBlock data-testid="trimming-none" textTrimming="none" text={longText} />
	<TextBlock data-testid="trimming-clip" textTrimming="clip" text={longText} />
	<TextBlock data-testid="trimming-character" textTrimming="characterEllipsis" text={longText} />
	<TextBlock data-testid="trimming-word" textTrimming="wordEllipsis" text={longText} />
</div>

<!-- WD-078: the first of these trims nothing, because `text-overflow` trims a line box and a
     wrapping block never overflows one. The second is the escape the row names — a line count
     reaches the clamp, which does trim. GridViewPage.xaml:55-56 is the upstream pairing. -->
<h2 class="winui-SubtitleTextBlockStyle">trimming under wrap</h2>
<div class="narrow">
	<TextBlock
		data-testid="wrap-trim-untrimmed"
		textWrapping="wrap"
		textTrimming="characterEllipsis"
		text={longText}
	/>
	<TextBlock
		data-testid="wrap-trim-clamped"
		textWrapping="wrap"
		textTrimming="characterEllipsis"
		maxLines={2}
		text={longText}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">maxLines</h2>
<div class="narrow">
	<TextBlock data-testid="max-lines-two" textWrapping="wrap" maxLines={2} text={longText} />
	<TextBlock data-testid="max-lines-unlimited" textWrapping="wrap" maxLines={0} text={longText} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">the seven alignments</h2>
<div class="wide">
	<TextBlock data-testid="alignment-left" textAlignment="left" text="left" />
	<TextBlock data-testid="alignment-center" textAlignment="center" text="center" />
	<TextBlock data-testid="alignment-right" textAlignment="right" text="right" />
	<TextBlock
		data-testid="alignment-justify"
		textAlignment="justify"
		textWrapping="wrap"
		text={longText}
	/>
	<TextBlock data-testid="alignment-start" textAlignment="start" text="start" />
	<TextBlock data-testid="alignment-end" textAlignment="end" text="end" />
	<TextBlock data-testid="alignment-detect" textAlignment="detectFromContent" text="שלום עולם" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">fontWeight and dir</h2>
<TextBlock data-testid="font-weight" fontWeight={600} text="fontWeight 600, straight to CSS." />
<!-- `dir` is declared rather than left to the rest props so that detectFromContent can override
     it; every other alignment passes the consumer's value through, which is this one. -->
<TextBlock
	data-testid="dir-rtl"
	dir="rtl"
	textAlignment="start"
	text="dir=rtl with textAlignment=start"
/>

<h2 class="winui-SubtitleTextBlockStyle">selection</h2>
<TextBlock data-testid="selection-enabled" textSelectionEnabled text="Selectable browser text." />
<TextBlock
	data-testid="selection-highlight"
	textSelectionEnabled
	selectionHighlightColor="darkorange"
	text="Selectable text with a local highlight colour."
/>
<TextBlock data-testid="selection-disabled" text="Selection is disabled by default." />

<h2 class="winui-SubtitleTextBlockStyle">padding and lineHeight</h2>
<div class="narrow">
	<TextBlock data-testid="padding" textWrapping="wrap" padding="8,5" text={longText} />
	<TextBlock data-testid="line-height" textWrapping="wrap" lineHeight={40} text={longText} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">inline children</h2>
<!-- Inline components are the next unit; plain markup is their placeholder here. -->
<TextBlock data-testid="inline-children"
	>Text can be <b>bold</b>, <i>italic</i>, or <u>underlined</u>.</TextBlock
>

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
