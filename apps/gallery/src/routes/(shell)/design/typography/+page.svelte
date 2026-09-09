<script lang="ts">
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
	<!-- WinUI's inline Hyperlink has no control in this library yet. -->
	<!-- This top margin prevents the Hyperlink focus rectangle from being clipped. -->
	<p class="prose winui-BodyTextBlockStyle">
		Typography helps provide structure and hierarchy to UI. The default font for Windows is
		<a href="https://learn.microsoft.com/windows/apps/design/downloads/#fonts">Segoe UI Variable</a
		>. Best practice is to use Regular weight for most text, use Semibold for titles. The minimum
		values should be 12px Regular, 14px Semibold.
	</p>

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

	.prose {
		margin: 4px 0 0;
	}

	.prose a {
		color: var(--winui-AccentTextFillColorPrimaryBrush);
	}

	.example {
		min-height: 24px;
	}

	.mono {
		/* c1-allow: a code face is categorical, not a themed value */
		font-family: monospace;
	}
</style>
