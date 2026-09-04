<script lang="ts">
	import { icons, nav } from '$lib/design';

	const page = nav.find((n) => n.uniqueId === 'Iconography')!;
</script>

<h1 class="winui-TitleTextBlockStyle">{page.title}</h1>
<p class="winui-BodyTextBlockStyle">{page.subtitle}</p>
{#if page.description}
	<p class="winui-CaptionTextBlockStyle">{page.description}</p>
{/if}

<div class="grid">
	{#each icons as icon, i (i)}
		<div class="tile">
			<div class="glyph">{String.fromCodePoint(parseInt(icon.Code, 16))}</div>
			<div class="name winui-CaptionTextBlockStyle">{icon.Name}</div>
		</div>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, 96px);
		gap: 8px;
	}

	.tile {
		width: 96px;
		height: 96px;
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		/* c1-allow: 1px is the Gallery's card stroke width, not a tokenized theme value */
		border: 1px solid var(--winui-CardStrokeColorDefaultBrush);
		border-radius: var(--winui-ControlCornerRadius);
		display: grid;
		grid-template-rows: 1fr auto;
		align-items: center;
		justify-items: center;
		padding: 8px;
		box-sizing: border-box;
	}

	.glyph {
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: 28px is the Gallery's glyph size, not a tokenized theme value */
		font-size: 28px;
	}

	.name {
		color: var(--winui-TextFillColorSecondaryBrush);
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: center;
	}
</style>
