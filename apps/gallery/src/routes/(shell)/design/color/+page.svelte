<script lang="ts">
	import { colorItems, colorSections, nav } from '$lib/design';
	import { resolve } from '$lib/resolve';

	const page = nav.find((n) => n.uniqueId === 'Color')!;

	const bySection = colorSections.map((section) => ({
		section,
		items: colorItems.filter((item) => item.section === section)
	}));
</script>

<h1 class="winui-TitleTextBlockStyle">{page.title}</h1>
<p class="winui-BodyTextBlockStyle">{page.subtitle}</p>

{#each bySection as group (group.section)}
	<section>
		<h2 class="winui-SubtitleTextBlockStyle">{group.section}</h2>

		{#each group.items as item, i (i)}
			{#if item.kind === 'example'}
				{@const ex = item}
				<div
					class="example"
					style:background={resolve(ex.background)}
					style:color={resolve(ex.foreground)}
				>
					<div class="winui-SubtitleTextBlockStyle">{ex.title}</div>
					<div class="caption winui-CaptionTextBlockStyle">{ex.description}</div>
					<div class="content"></div>
				</div>
			{:else}
				<div class="gallery-tile-grid" style:grid-template-columns="repeat({item.columns}, 1fr)">
					{#each item.tiles as tile, j (j)}
						{@const t = tile}
						<!-- WD-003: the two Mica tiles carry no fill; see docs/divergences.md -->
						<div
							class="tile"
							style:background={resolve(t.background)}
							style:color={resolve(t.foreground)}
						>
							<div class="winui-BodyStrongTextBlockStyle">{t.colorName}</div>
							<div class="caption winui-CaptionTextBlockStyle">{t.colorExplanation}</div>
							<div class="brush">{t.colorBrushName}</div>
						</div>
					{/each}
				</div>
			{/if}
		{/each}
	</section>
{/each}

<style>
	section {
		display: grid;
		gap: 16px;
		padding-bottom: 32px;
	}

	.example {
		/* c1-allow: 1px is the Gallery's card stroke width, not a tokenized theme value */
		border: 1px solid var(--winui-CardStrokeColorDefaultBrush);
		border-radius: var(--winui-OverlayCornerRadius);
		padding: 12px;
	}

	.example .caption,
	.example .content {
		opacity: 0.8;
	}

	.example .content {
		min-height: 32px;
	}

	.tile {
		padding: 12px;
		min-height: 138px;
		display: grid;
		gap: 4px;
	}

	.tile .caption {
		opacity: 0.8;
	}

	.tile .brush {
		/* c1-allow: a code face is categorical, not a themed value */
		font-family: monospace;
		margin-top: auto;
		opacity: 0.8;
	}
</style>
