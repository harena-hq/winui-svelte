<script lang="ts">
	import { typographyRows, nav } from '$lib/design';

	const page = nav.find((n) => n.uniqueId === 'Typography')!;
</script>

<h1 class="winui-TitleTextBlockStyle">{page.title}</h1>
<p class="winui-BodyTextBlockStyle">{page.subtitle}</p>

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
