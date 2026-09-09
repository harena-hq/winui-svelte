<script lang="ts">
	import { geometryRows } from '$lib/design-tables';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/design/geometry');
	if (item === null) throw new Error('Geometry page has no Gallery item');
	const sample = sampleOf('Geometry/Geometry.txt');
</script>

<ItemPage {item}>
	<p class="prose winui-BodyTextBlockStyle">
		Geometry describes the shape, size and position of UI elements on screen. These fundamental
		design elements help experiences feel coherent across the entire design system. WinUI uses three
		levels of rounding depending on what UI component is being rounded and how that component is
		arranged relative to neighboring elements. You can reference built-in corner radii styles using:
		<em class="mono">{'CornerRadius="{StaticResource ControlCornerRadius}"'}</em>.
	</p>

	<!-- WD-029: the annotated image above this table is absent; see docs/divergences.md -->
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		horizontalContentAlignment="stretch"
	>
		<div class="header winui-CaptionTextBlockStyle">
			<div>Corner radius</div>
			<div>Usage</div>
			<div>Style</div>
		</div>

		{#each geometryRows as row, i (i)}
			<div class={i % 2 === 0 ? 'design-row-light' : 'design-row'}>
				<div class="swatch-row">
					<span class="swatch" style:border-radius={row.radius === '0' ? '0' : row.radius}></span>
					<span>{row.label}</span>
				</div>
				<div>{row.usage}</div>
				<div class="mono">{row.style}</div>
			</div>
		{/each}
	</ControlExample>
</ItemPage>

<style>
	.header,
	.design-row,
	.design-row-light {
		display: grid;
		grid-template-columns: 200px 1fr 1fr;
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

	.swatch-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.swatch {
		width: 20px;
		height: 20px;
		background: var(--winui-AccentFillColorDefaultBrush);
	}

	.mono {
		/* c1-allow: a code face is categorical, not a themed value */
		font-family: monospace;
	}
</style>
