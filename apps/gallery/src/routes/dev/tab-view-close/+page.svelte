<script lang="ts">
	import { Button, TabView, type TabViewItemData } from 'winui-svelte/preview';

	/*
	 * Strips whose tabs close, for the selection a removal moves (`TabView::OnItemsChanged`,
	 * `TabView.cpp:780-815`).
	 *
	 * **Nothing photographs this page.** `tab-view-close.spec.ts` reads which tab is selected, the
	 * panel, and the selections each strip reported.
	 */
	const make = (count: number, disabled: number[] = []): TabViewItemData[] =>
		Array.from({ length: count }, (_, index) => ({
			// No space in the id: it reaches `aria-labelledby`, which is a space-separated id list.
			id: `doc-${index}`,
			header: `Document ${index}`,
			glyph: 'E8A5',
			content,
			disabled: disabled.includes(index)
		}));
	const remove = (items: TabViewItemData[], id: string) => items.filter((item) => item.id !== id);

	let bound = $state(make(5));
	let boundSelected = $state<string | null>('doc-0');
	let boundReported = $state<string[]>([]);
	let free = $state(make(3));
	let freeReported = $state<string[]>([]);
	let skip = $state(make(4, [1, 3]));
	let skipReported = $state<string[]>([]);
	let lone = $state(make(2, [1]));
	let loneReported = $state<string[]>([]);
</script>

{#snippet content()}<p class="winui-BodyTextBlockStyle">Document content.</p>{/snippet}

<svelte:head><title>TabView close — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TabView — closing the selected tab</h1>

<Button id="select-none" onclick={() => (boundSelected = 'nowhere')}>Select no tab</Button>
<Button
	id="close-two"
	onclick={() => (bound = bound.filter((item) => item.id !== 'doc-0' && item.id !== 'doc-1'))}
	>Close Documents 0 and 1</Button
>
<Button
	id="close-and-pick"
	onclick={() => {
		bound = remove(bound, 'doc-1');
		boundSelected = 'doc-3';
	}}>Close Document 1 and select Document 3</Button
>
<div class="frame" id="bound">
	<TabView
		items={bound}
		bind:selected={boundSelected}
		onSelectionChanged={(id) => (boundReported = [...boundReported, id ?? 'null'])}
		onTabCloseRequested={(id) => (bound = remove(bound, id))}
	/>
	<output>{boundReported.join(' ')}</output>
</div>

<div class="frame" id="free">
	<TabView
		items={free}
		onSelectionChanged={(id) => (freeReported = [...freeReported, id ?? 'null'])}
		onTabCloseRequested={(id) => (free = remove(free, id))}
	/>
	<output>{freeReported.join(' ')}</output>
</div>

<div class="frame" id="skip">
	<TabView
		items={skip}
		onSelectionChanged={(id) => (skipReported = [...skipReported, id ?? 'null'])}
		onTabCloseRequested={(id) => (skip = remove(skip, id))}
	/>
	<output>{skipReported.join(' ')}</output>
</div>

<div class="frame" id="lone">
	<TabView
		items={lone}
		onSelectionChanged={(id) => (loneReported = [...loneReported, id ?? 'null'])}
		onTabCloseRequested={(id) => (lone = remove(lone, id))}
	/>
	<output>{loneReported.join(' ')}</output>
</div>

<style>
	.frame {
		width: 720px;
		margin-top: 12px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
