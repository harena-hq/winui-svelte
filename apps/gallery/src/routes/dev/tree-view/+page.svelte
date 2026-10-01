<script lang="ts">
	import { TreeView } from 'winui-svelte/preview';

	interface Node {
		id: string;
		label: string;
		children?: Node[];
	}

	const tree: Node[] = [
		{
			id: 'work',
			label: 'Work Documents',
			children: [
				{ id: 'feb', label: 'Functional Specifications' },
				{
					id: 'quarterly',
					label: 'Quarterly Reports',
					children: [
						{ id: 'q1', label: 'Q1 Report' },
						{ id: 'q2', label: 'Q2 Report' }
					]
				}
			]
		},
		{
			id: 'personal',
			label: 'Personal Documents',
			children: [
				{ id: 'recipes', label: 'Recipes' },
				{ id: 'budget', label: 'Budget' }
			]
		}
	];

	let openKeys = $state<(string | number)[]>(['work']);
	let pickedKey = $state<string | number | null>('feb');
</script>

<svelte:head><title>TreeView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TreeView</h1>
<p class="winui-BodyTextBlockStyle">A scrolling tree that owns its row containers.</p>

<h2 class="winui-SubtitleTextBlockStyle">a closed tree</h2>
<div class="row">
	<TreeView
		items={tree}
		key={(node) => node.id}
		childrenOf={(node) => node.children}
		expandedKeys={[]}
		{itemTemplate}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">three levels open</h2>
<div class="row">
	<TreeView
		items={tree}
		key={(node) => node.id}
		childrenOf={(node) => node.children}
		expandedKeys={['work', 'quarterly']}
		selectedKey="q2"
		{itemTemplate}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no selection</h2>
<div class="row">
	<TreeView
		items={tree}
		key={(node) => node.id}
		childrenOf={(node) => node.children}
		selectionMode="none"
		expandedKeys={['personal']}
		{itemTemplate}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the page owns both</h2>
<div class="row">
	<TreeView
		items={tree}
		key={(node) => node.id}
		childrenOf={(node) => node.children}
		bind:expandedKeys={openKeys}
		bind:selectedKey={pickedKey}
		{itemTemplate}
	/>
</div>
<p class="winui-BodyTextBlockStyle">
	{`${pickedKey ?? 'nothing'} · ${openKeys.join(', ') || 'closed'}`}
</p>

{#snippet itemTemplate(node: Node)}
	<span class="winui-BodyTextBlockStyle">{node.label}</span>
{/snippet}

<style>
	.row {
		display: block;
		width: 360px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
