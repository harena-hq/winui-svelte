<script lang="ts">
	import { ItemContainer, ItemsRepeater } from 'winui-svelte';

	const tiles = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];
	const choices = ['Alpha', 'Beta', 'Gamma'];
	let picked = $state<string | null>(null);
</script>

<svelte:head><title>ItemContainer — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ItemContainer</h1>
<p class="winui-BodyTextBlockStyle">Selection chrome around caller-supplied item content.</p>

<h2 class="winui-SubtitleTextBlockStyle">at rest</h2>
<div class="row">
	<ItemContainer>{@render card('At rest')}</ItemContainer>
</div>

<h2 class="winui-SubtitleTextBlockStyle">selected</h2>
<div class="row">
	<ItemContainer selected>{@render card('Selected')}</ItemContainer>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled, unselected and selected</h2>
<div class="row">
	<ItemContainer disabled>{@render card('Disabled')}</ItemContainer>
	<ItemContainer disabled selected>{@render card('Disabled selected')}</ItemContainer>
</div>

<h2 class="winui-SubtitleTextBlockStyle">multiple selection</h2>
<div class="row">
	<ItemContainer multiSelectMode="multiple">{@render card('Unchecked')}</ItemContainer>
	<ItemContainer multiSelectMode="multiple" selected>{@render card('Checked')}</ItemContainer>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the ring follows the child</h2>
<div class="row">
	<ItemContainer selected>{@render card('Standard')}</ItemContainer>
	<ItemContainer selected>{@render tallCard('Tall')}</ItemContainer>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a grid of containers</h2>
<!-- `repeat(auto-fill, …)` needs a definite extent: a flex row makes this grid shrink to one
     track, so this row is block-level and fixed-width as in the ItemsRepeater harness. -->
<div class="row grid-row">
	<ItemsRepeater
		items={tiles}
		layout={{ kind: 'uniformGrid', minColumnSpacing: 8, minRowSpacing: 8 }}
	>
		{#snippet itemTemplate(tile, index)}
			<ItemContainer selected={index === 2}>{@render smallCard(tile)}</ItemContainer>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">invoking, and an owner that selects</h2>
<div class="row">
	{#each choices as choice (choice)}
		<!-- The owner owns this toggle: ItemContainer reports invocation and never selects itself. -->
		<ItemContainer
			selected={picked === choice}
			onItemInvoked={() => (picked = picked === choice ? null : choice)}
		>
			{@render card(choice)}
		</ItemContainer>
	{/each}
</div>

{#snippet card(label: string)}
	<div class="card">
		<span class="winui-BodyTextBlockStyle">{label}</span>
		<div class="swatch"></div>
	</div>
{/snippet}

{#snippet tallCard(label: string)}
	<div class="card tall">
		<span class="winui-BodyTextBlockStyle">{label}</span>
		<div class="swatch"></div>
	</div>
{/snippet}

{#snippet smallCard(label: string)}
	<div class="card small">
		<span class="winui-BodyTextBlockStyle">{label}</span>
		<div class="swatch"></div>
	</div>
{/snippet}

<style>
	.row {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 200px;
		height: 140px;
	}

	.card.tall {
		height: 280px;
	}

	.card.small {
		width: 120px;
		height: 80px;
	}

	/* Ink rather than a card fill. Under high contrast every `…CardBackgroundFill…` and every
	   accent brush resolves to `SystemColorWindowColor` — the page's own background — and a
	   swatch painted with one is invisible in the theme where this page most needs to show that
	   the child rendered at all. */
	.swatch {
		width: 96px;
		height: 12px;
		background: var(--winui-TextFillColorPrimaryBrush);
	}

	.card.small .swatch {
		width: 64px;
	}

	.grid-row {
		display: block;
		width: 560px;
	}
</style>
