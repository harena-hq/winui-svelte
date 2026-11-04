<script lang="ts">
	import { Hyperlink, Paragraph, RichTextBlock } from '@harena-hq/winui-svelte/preview';
	import { typographyRows } from '$lib/design';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/design/typography');
	if (item === null) throw new Error('Typography page has no Gallery item');
	const sample = sampleOf('Typography/TypographyTypeRamp.txt');
</script>

<ItemPage {item}>
	<!-- TypographyPage.xaml:41-47 — the RichTextBlock, Paragraph, Hyperlink, and its NavigateUri,
	     with `Margin="0,4,0,0"` at :41, which is the inline style below.

	     No Style is named, and the class is still what carries the ramp: XAML's inherited text
	     formatting record has a default of its own — TextFormatting::CreateDefault
	     (TextFormatting.cpp:110) sets FontSize 14 (:124, applied at :142), FontWeight Normal (:146)
	     and the ultimate font (:144), which FontAndScriptServices.h:30 declares as the literal
	     string XamlAutoFontFamily — and this document's root supplies no font at all.

	     The space before the full stop after the Hyperlink is upstream's: :44 writes `</Hyperlink> .`
	     and XAML collapses that whitespace run to one space. It is transcribed, not repaired. -->
	<!-- TypographyPage.xaml:40 — This top margin prevents the Hyperlink focus rectangle from being clipped. -->
	<RichTextBlock class="winui-BodyTextBlockStyle" style="margin-top: 4px">
		<Paragraph>
			Typography helps provide structure and hierarchy to UI. The default font for Windows is
			<Hyperlink navigateUri="https://learn.microsoft.com/windows/apps/design/downloads/#fonts"
				>Segoe UI Variable</Hyperlink
			> . Best practice is to use Regular weight for most text, use Semibold for titles. The minimum values
			should be 12px Regular, 14px Semibold.
		</Paragraph>
	</RichTextBlock>

	<!-- WD-029: the annotated image above this table is absent; see docs/divergences.md -->
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		horizontalContentAlignment="stretch"
	>
		<div class="header winui-CaptionTextBlockStyle">
			<div>Example</div>
			<div>Variable Font</div>
			<div>Size/Line height</div>
			<div>Style</div>
		</div>

		{#each typographyRows as row, i (i)}
			<div class={i % 2 === 0 ? 'design-row-light' : 'design-row'}>
				<div class="example winui-{row.resourceName}">{row.example}</div>
				<div>{row.variableFont}</div>
				<div>{row.sizeLineHeight}</div>
				<div class="mono">{row.resourceName}</div>
			</div>
		{/each}
	</ControlExample>
</ItemPage>

<style>
	.header,
	.design-row,
	.design-row-light {
		display: grid;
		grid-template-columns: 2fr 2fr 1fr 1fr;
		gap: 16px;
		padding: 12px 16px;
		align-items: center;
	}

	.header {
		color: var(--winui-TextFillColorSecondaryBrush);
	}

	.example {
		min-height: 24px;
	}

	.mono {
		/* c1-allow: a code face is categorical, not a themed value */
		font-family: monospace;
	}
</style>
