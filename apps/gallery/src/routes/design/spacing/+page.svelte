<script lang="ts">
	import { nav } from '$lib/design';
	import { spacingRows } from '$lib/design-tables';

	const page = nav.find((n) => n.uniqueId === 'Spacing')!;
</script>

<h1 class="winui-TitleTextBlockStyle">{page.title}</h1>
<p class="winui-BodyTextBlockStyle">{page.subtitle}</p>

<div class="header winui-CaptionTextBlockStyle">
	<div>Value</div>
	<div>Usage</div>
</div>

{#each spacingRows as row, i (i)}
	<div class={i % 2 === 0 ? 'design-row-light' : 'design-row'}>
		<div class="value-row">
			<span class="swatch" style:width={row.value.replace('epx', 'px')}></span>
			<span>{row.value}</span>
		</div>
		<div>{row.usage}</div>
	</div>
{/each}

<style>
	.header,
	.design-row,
	.design-row-light {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 16px;
		padding: 12px 16px;
		align-items: center;
	}

	.header {
		color: var(--winui-TextFillColorSecondaryBrush);
	}

	.value-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.swatch {
		height: 20px;
		background: var(--winui-AccentFillColorDefaultBrush);
		border-radius: var(--winui-ControlCornerRadius);
	}
</style>
