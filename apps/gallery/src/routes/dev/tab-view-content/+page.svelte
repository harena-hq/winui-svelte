<script lang="ts">
	import { TabView } from '@harena-hq/winui-svelte/preview';

	/*
	 * A strip whose tabs hold state, for the content an unselected tab keeps and the focus a
	 * selection change carries (`TabView::UpdateTabContent`, `TabView.cpp:964-1015`).
	 *
	 * **Nothing photographs this page.** `tab-view-content.spec.ts` types into the notes and reads
	 * where focus lands.
	 */
	// Keep D has no content, so it controls no panel.
	let items = $state([
		{ id: 'keep-a', header: 'Keep A', content: keepA },
		{ id: 'keep-b', header: 'Keep B', content: keepB },
		{ id: 'keep-c', header: 'Keep C', content: keepC },
		{ id: 'keep-d', header: 'Keep D' }
	]);
	let selected = $state<string | null>('keep-a');
</script>

{#snippet keepA()}
	<label class="winui-BodyTextBlockStyle">Note A <input type="text" /></label>
	<button type="button" onclick={() => (selected = 'keep-b')}>Next tab</button>
	<button type="button" onclick={() => (selected = 'keep-c')}>Show C</button>
	<button type="button" onclick={() => (items = items.filter((item) => item.id !== 'keep-a'))}
		>Close this tab</button
	>
{/snippet}
{#snippet keepB()}
	<label class="winui-BodyTextBlockStyle">Note B <input type="text" /></label>
{/snippet}
{#snippet keepC()}<p class="winui-BodyTextBlockStyle">Keep C has nothing to focus.</p>{/snippet}

<div class="frame">
	<TabView data-testid="keep" {items} bind:selected addTabButtonVisible={false} />
</div>
<button type="button" onclick={() => (selected = 'keep-c')}>Select C</button>

<style>
	.frame {
		width: 720px;
		margin-top: 12px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
