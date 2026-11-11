<script lang="ts">
	import { ListView, SplitView } from '@harena-hq/winui-svelte/preview';

	/*
	 * A session list in an inline pane, for moving items by pointer and keyboard.
	 * `list-view-reorder.spec.ts` reads the order, selection, reports and in-progress styles.
	 */
	const sessions = (prefix: string, title: string, count: number) =>
		Array.from({ length: count }, (_, index) => ({
			id: `${prefix}${index}`,
			title: `${title} ${index}`
		}));
	let pinned = $state(sessions('p', 'Pinned', 5));
	let pinnedSelected = $state([1]);
	let reorders = $state<string[]>([]);
	const recent = sessions('r', 'Recent', 3);
	const locked = ['Locked 0', 'Locked 1', 'Locked 2'];
	let extended = $state(['Extended 0', 'Extended 1', 'Extended 2', 'Extended 3']);
	let multiple = $state(['Multiple 0', 'Multiple 1', 'Multiple 2', 'Multiple 3']);
	const bare = ['Bare 0', 'Bare 1', 'Bare 2'];
	let footerClicks = $state(0);
</script>

<svelte:head><title>ListView reorder — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ListView — reordering sessions</h1>

<SplitView displayMode="inline" paneOpen openPaneLength={320} style="height: 560px">
	{#snippet pane()}
		<p class="winui-BodyStrongTextBlockStyle">Pinned</p>
		<ListView
			id="pinned"
			reorderItems
			selectionMode="single"
			bind:selectedIndexes={pinnedSelected}
			key={(session) => session.id}
			items={pinned}
			onItemReorder={(from, to) => {
				const [moved] = pinned.splice(from, 1);
				pinned.splice(to, 0, moved);
				reorders.push(`${from}>${to}`);
			}}
		>
			{#snippet itemTemplate(session)}{session.title}{/snippet}
			{#snippet footer()}
				<button id="pinned-footer" onclick={() => footerClicks++}>Footer {footerClicks}</button>
			{/snippet}
		</ListView>
		<p class="winui-BodyStrongTextBlockStyle">Recent</p>
		<ListView id="recent" items={recent}>
			{#snippet itemTemplate(session)}{session.title}{/snippet}
		</ListView>
	{/snippet}
	<p class="winui-BodyTextBlockStyle">Choose a session from the pane.</p>
</SplitView>

<output id="reorders">{reorders.join(' ')}</output>
<output id="selected">{pinnedSelected.join(' ')}</output>
<ListView id="locked" items={locked}>
	{#snippet itemTemplate(item)}{item}{/snippet}
</ListView>
<!-- A range anchor carried through a move. -->
<ListView
	id="extended"
	reorderItems
	selectionMode="extended"
	items={extended}
	onItemReorder={(from, to) => {
		const [moved] = extended.splice(from, 1);
		extended.splice(to, 0, moved);
	}}
>
	{#snippet itemTemplate(item)}{item}{/snippet}
</ListView>
<ListView
	id="multiple"
	reorderItems
	selectionMode="multiple"
	items={multiple}
	onItemReorder={(from, to) => {
		const [moved] = multiple.splice(from, 1);
		multiple.splice(to, 0, moved);
	}}
>
	{#snippet itemTemplate(item)}{item}{/snippet}
</ListView>
<!-- `reorderItems` with no callback, so nothing can move. -->
<ListView id="bare" reorderItems selectedIndexes={[0]} items={bare}>
	{#snippet itemTemplate(item)}{item}{/snippet}
</ListView>
