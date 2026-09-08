<script lang="ts">
	import { ItemsRepeater } from 'winui-svelte';

	const words = ['One', 'Two', 'Three', 'Four'];
	const bars = [40, 120, 80, 200, 60];
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
</style>
