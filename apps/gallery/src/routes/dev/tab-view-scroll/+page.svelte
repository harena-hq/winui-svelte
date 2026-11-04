<script lang="ts">
	import { Button, TabView } from '@harena-hq/winui-svelte/preview';

	/*
	 * A strip with more tabs than fit, for `BringSelectedTabIntoView` (`TabView.cpp:748`).
	 *
	 * **Nothing photographs this page.** `tab-view-scroll.spec.ts` reads the strip's scroll offset
	 * and the selected tab's box. The two buttons select without focusing a tab, so what moves the
	 * strip is the selection and not the focus that would move it on its own.
	 */
	let items = $state(
		Array.from({ length: 12 }, (_, index) => ({
			// No space in the id: it reaches `aria-labelledby`, which is a space-separated id list.
			id: `doc-${index}`,
			header: `Document ${index}`,
			glyph: 'E8A5',
			content
		}))
	);
	let selected = $state<string | null>('doc-0');
	let added = 12;
	// The Gallery's own add handler appends without selecting, which is
	// what lets an addition be told apart from a selection here (`TabViewPage.xaml.cs:53`).
	function add() {
		const index = added++;
		items = [...items, { id: `doc-${index}`, header: `Document ${index}`, glyph: 'E8A5', content }];
	}
</script>

{#snippet content()}<p class="winui-BodyTextBlockStyle">Document content.</p>{/snippet}

<svelte:head><title>TabView scroll — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TabView — the selected tab in view</h1>

<div class="actions">
	<Button id="select-first" onclick={() => (selected = items[0]?.id ?? null)}>Select first</Button>
	<Button id="select-last" onclick={() => (selected = items.at(-1)?.id ?? null)}>Select last</Button
	>
</div>

<div class="frame" id="strip">
	<TabView
		{items}
		bind:selected
		onAddTabButtonClick={add}
		onTabCloseRequested={(id) => (items = items.filter((item) => item.id !== id))}
	/>
</div>

<style>
	.actions {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}

	.frame {
		width: 520px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
