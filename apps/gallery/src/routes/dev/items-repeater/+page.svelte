<script lang="ts">
	import { ItemsRepeater } from '@harena-hq/winui-svelte/preview';

	const words = ['One', 'Two', 'Three', 'Four'];
	const bars = [40, 120, 80, 200, 60];
	// Item 0 is neither the widest nor the narrowest, so a cell measured from it is
	// distinguishable from a cell measured from either.
	const gridBars = [120, 40, 200, 80, 60];
	const swatches = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];
	const people = [
		{ id: 'a', name: 'Ada' },
		{ id: 'g', name: 'Grace' },
		{ id: 'k', name: 'Katherine' }
	];
	const categories = [
		{ id: 'fruit', title: 'Fruit', entries: ['Apple', 'Pear', 'Plum'] },
		{ id: 'veg', title: 'Vegetables', entries: ['Leek', 'Onion'] }
	];
	// Aspect ratios rather than images: an item's width on a line is its width at the line
	// height, and a fixed-ratio box states that without loading anything. Item 0 is neither
	// the widest nor the narrowest.
	const ratios = [1.5, 0.75, 2.2, 1, 1.75, 0.6, 1.3, 2];
</script>

<svelte:head><title>ItemsRepeater — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ItemsRepeater</h1>
<p class="winui-BodyTextBlockStyle">A layout container that draws caller-supplied items.</p>

<h2 class="winui-SubtitleTextBlockStyle">the default layout — a vertical stack, no spacing</h2>
<div class="row">
	<ItemsRepeater items={words}>
		{#snippet itemTemplate(word)}
			<span class="winui-BodyTextBlockStyle">{word}</span>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">vertical, spacing 8</h2>
<div class="row">
	<ItemsRepeater items={words} layout={{ kind: 'stack', spacing: 8 }}>
		{#snippet itemTemplate(word)}
			<span class="winui-BodyTextBlockStyle">{word}</span>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">horizontal, spacing 8</h2>
<div class="row">
	<ItemsRepeater items={words} layout={{ kind: 'stack', orientation: 'horizontal', spacing: 8 }}>
		{#snippet itemTemplate(word)}
			<span class="winui-BodyTextBlockStyle">{word}</span>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a template that is not a string</h2>
<div class="row">
	<ItemsRepeater items={bars} layout={{ kind: 'stack', spacing: 4 }}>
		{#snippet itemTemplate(width)}
			<div class="bar" style:width="{width}px"></div>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a keyed list</h2>
<div class="row">
	<ItemsRepeater items={people} key={(person) => person.id} layout={{ kind: 'stack', spacing: 8 }}>
		{#snippet itemTemplate(person, index)}
			<span class="winui-BodyTextBlockStyle">{index + 1}. {person.name}</span>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">nested repeaters</h2>
<div class="row">
	<ItemsRepeater items={categories} layout={{ kind: 'stack', spacing: 12 }}>
		{#snippet itemTemplate(category)}
			<!-- One root per item, the way upstream's `CategoryTemplate` is one `StackPanel`
			     (ItemsRepeaterPage.xaml). Two roots here would make the title and its own
			     entries two children of the outer stack, each 12px apart. -->
			<div class="category">
				<span class="winui-BodyStrongTextBlockStyle">{category.title}</span>
				<ItemsRepeater
					items={category.entries}
					layout={{ kind: 'stack', orientation: 'horizontal', spacing: 8 }}
				>
					{#snippet itemTemplate(entry)}
						<span class="winui-BodyTextBlockStyle">{entry}</span>
					{/snippet}
				</ItemsRepeater>
			</div>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">uniform grid — cells measured from the first item</h2>
<div class="row grid-row">
	<ItemsRepeater
		items={gridBars}
		layout={{ kind: 'uniformGrid', minColumnSpacing: 8, minRowSpacing: 8 }}
	>
		{#snippet itemTemplate(width)}
			<div class="bar" style:width="{width}px"></div>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">uniform grid — 108 by 108 cells</h2>
<div class="row grid-row">
	<ItemsRepeater
		items={swatches}
		layout={{
			kind: 'uniformGrid',
			minItemWidth: 108,
			minItemHeight: 108,
			minColumnSpacing: 12,
			minRowSpacing: 12
		}}
	>
		{#snippet itemTemplate(word)}
			<span class="winui-BodyTextBlockStyle">{word}</span>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">uniform grid — items stretched to fill the line</h2>
<div class="row grid-row">
	<ItemsRepeater
		items={swatches}
		layout={{
			kind: 'uniformGrid',
			minItemWidth: 108,
			minItemHeight: 108,
			minColumnSpacing: 12,
			minRowSpacing: 12,
			itemsStretch: 'fill'
		}}
	>
		{#snippet itemTemplate(word)}
			<span class="winui-BodyTextBlockStyle">{word}</span>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">uniform grid — the leftover space between items</h2>
<div class="row grid-row">
	<ItemsRepeater
		items={swatches}
		layout={{
			kind: 'uniformGrid',
			minItemWidth: 108,
			minItemHeight: 108,
			minColumnSpacing: 12,
			minRowSpacing: 12,
			itemsJustification: 'spaceBetween'
		}}
	>
		{#snippet itemTemplate(word)}
			<span class="winui-BodyTextBlockStyle">{word}</span>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">uniform grid — vertical, wrapping to the right</h2>
<div class="row tall">
	<ItemsRepeater
		items={swatches}
		layout={{
			kind: 'uniformGrid',
			orientation: 'vertical',
			minItemWidth: 108,
			minItemHeight: 40,
			minColumnSpacing: 12,
			minRowSpacing: 12
		}}
	>
		{#snippet itemTemplate(word)}
			<span class="winui-BodyTextBlockStyle">{word}</span>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">uniform grid — at most three per line</h2>
<div class="row grid-row">
	<ItemsRepeater
		items={swatches}
		layout={{
			kind: 'uniformGrid',
			minItemWidth: 108,
			minItemHeight: 108,
			minColumnSpacing: 12,
			minRowSpacing: 12,
			maximumRowsOrColumns: 3
		}}
	>
		{#snippet itemTemplate(word)}
			<span class="winui-BodyTextBlockStyle">{word}</span>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">uniform grid — at most three per line, stretched</h2>
<!-- The cap has two implementations and this is the second one. Without `fill` the layout
     narrows itself to the capped line; with it the line keeps the whole width and the items
     divide it, so the cap has to live in each track's minimum instead of in the extent. A row
     for one of them leaves the other built and unexercised. -->
<div class="row grid-row">
	<ItemsRepeater
		items={swatches}
		layout={{
			kind: 'uniformGrid',
			minItemWidth: 108,
			minItemHeight: 108,
			minColumnSpacing: 12,
			minRowSpacing: 12,
			itemsStretch: 'fill',
			maximumRowsOrColumns: 3
		}}
	>
		{#snippet itemTemplate(word)}
			<span class="winui-BodyTextBlockStyle">{word}</span>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">uniform grid — vertical, at most two per line</h2>
<!-- The third path: a vertical line wraps into columns, so the extent the cap takes away is
     the height rather than the width. -->
<div class="row tall">
	<ItemsRepeater
		items={swatches}
		layout={{
			kind: 'uniformGrid',
			orientation: 'vertical',
			minItemWidth: 108,
			minItemHeight: 40,
			minColumnSpacing: 12,
			minRowSpacing: 12,
			maximumRowsOrColumns: 2
		}}
	>
		{#snippet itemTemplate(word)}
			<span class="winui-BodyTextBlockStyle">{word}</span>
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">lined flow — items keep their width</h2>
<div class="row lined-row">
	<ItemsRepeater
		items={ratios}
		layout={{ kind: 'linedFlow', lineHeight: 60, lineSpacing: 8, minItemSpacing: 8 }}
	>
		{#snippet itemTemplate(ratio)}
			{@render ratioTile(ratio)}
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">lined flow — the line ends flush, except the last</h2>
<div class="row lined-row">
	<ItemsRepeater
		items={ratios}
		layout={{
			kind: 'linedFlow',
			lineHeight: 60,
			lineSpacing: 8,
			minItemSpacing: 8,
			itemsStretch: 'fill'
		}}
	>
		{#snippet itemTemplate(ratio)}
			{@render ratioTile(ratio)}
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">lined flow — the line height is the first item's</h2>
<div class="row lined-row">
	<ItemsRepeater items={ratios} layout={{ kind: 'linedFlow', lineSpacing: 8, minItemSpacing: 8 }}>
		{#snippet itemTemplate(ratio)}
			{@render sizedTile(ratio)}
		{/snippet}
	</ItemsRepeater>
</div>

<h2 class="winui-SubtitleTextBlockStyle">lined flow — the leftover space between items</h2>
<div class="row lined-row">
	<ItemsRepeater
		items={ratios}
		layout={{
			kind: 'linedFlow',
			lineHeight: 60,
			lineSpacing: 8,
			minItemSpacing: 8,
			itemsJustification: 'spaceBetween'
		}}
	>
		{#snippet itemTemplate(ratio)}
			{@render ratioTile(ratio)}
		{/snippet}
	</ItemsRepeater>
</div>

{#snippet ratioTile(ratio: number)}
	<div class="tile" style:aspect-ratio={ratio}></div>
{/snippet}

{#snippet sizedTile(ratio: number)}
	<div class="tile sized" style:aspect-ratio={ratio}></div>
{/snippet}

<style>
	.row {
		display: flex;
		align-items: flex-start;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	/* Ink, not accent. Under high contrast `AccentFillColorDefaultBrush` resolves to
	   `SystemColorWindowColor` — the page's own background — so an accent-filled rectangle
	   with no border is invisible in that theme, and this row's whole point is that the
	   template drew something. WinUI's own accent fills always carry an HC border; this one
	   is simpler as a text colour. */
	.bar {
		height: 12px;
		background: var(--winui-TextFillColorPrimaryBrush);
	}

	/* An ink tile, because under high contrast every accent and card brush resolves to
	   `SystemColorWindowColor` — the page's own background — and a tile painted with one is
	   invisible in exactly the theme this row has to prove itself in. */
	.tile {
		height: 100%;
		background: var(--winui-TextFillColorPrimaryBrush);
	}

	.tile.sized {
		height: 48px;
	}

	.category {
		display: flex;
		flex-direction: column;
	}

	/* `repeat(auto-fill, …)` needs a definite extent along the wrapping axis, and a flex item
	   is shrink-to-fit, so a grid left in `.row` alone resolves to exactly one track. These two
	   rules are what give the four grid rows something to wrap against, and a fixed number
	   rather than the viewport's keeps the wrap count the same in every snapshot. */
	.grid-row {
		display: block;
		width: 560px;
	}

	/* A lined flow wraps against its own content width, so it needs a definite one — the same
	   reason `.grid-row` exists. */
	.lined-row {
		display: block;
		width: 560px;
	}

	/* Vertical flow wraps into columns, so it is the height that has to be definite. */
	.tall {
		align-items: stretch;
		height: 200px;
	}
</style>
