<script lang="ts">
	import { ItemsRepeater } from 'winui-svelte';

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

	/* Vertical flow wraps into columns, so it is the height that has to be definite. */
	.tall {
		align-items: stretch;
		height: 200px;
	}
</style>
