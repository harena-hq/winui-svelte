<script lang="ts">
	import { TabView } from '@harena-hq/winui-svelte/preview';

	/*
	 * A strip whose item ids hold whitespace and an encoded lookalike, for the ids the component
	 * derives from them: `chat 1` holds a space, `chat\t2` a tab, and `chat%201` is what the first
	 * one would encode to, so the three have to stay distinct.
	 *
	 * **Nothing photographs this page.** `tab-view-ids.spec.ts` reads the ids, the ARIA links
	 * between each tab and its panel, and where focus lands.
	 */
	let items = $state([
		{ id: 'chat 1', header: 'Chat 1', content: chat1 },
		{ id: 'chat\t2', header: 'Chat 2', content: chat2 },
		{ id: 'chat%201', header: 'Chat 3', content: chat3 }
	]);
	let selected = $state<string | null>('chat 1');
</script>

{#snippet chat1()}
	<button type="button">Inside 1</button>
	<button type="button" onclick={() => (selected = 'chat%201')}>Show 3</button>
{/snippet}
{#snippet chat2()}
	<button type="button">Inside 2</button>
{/snippet}
{#snippet chat3()}
	<button type="button">Inside 3</button>
{/snippet}

<div class="frame">
	<TabView
		data-testid="ids"
		{items}
		bind:selected
		addTabButtonVisible={false}
		onTabCloseRequested={(id) => (items = items.filter((item) => item.id !== id))}
	/>
</div>

<style>
	.frame {
		width: 720px;
		margin-top: 12px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
