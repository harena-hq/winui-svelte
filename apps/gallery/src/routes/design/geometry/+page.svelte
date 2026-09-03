<script lang="ts">
	import { nav } from '$lib/design';
	import { geometryRows } from '$lib/design-tables';

	const page = nav.find((n) => n.uniqueId === 'Geometry')!;
</script>

<h1 class="winui-TitleTextBlockStyle">{page.title}</h1>
<p class="winui-BodyTextBlockStyle">{page.subtitle}</p>

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
