<script lang="ts">
	import { TabView } from '@harena-hq/winui-svelte/preview';

	/*
	 * A strip whose consumer acts on keys before the strip does (`onTabKeyDown`): Right on the last
	 * tab goes to the consumer's own button in the footer, Left on the first stops there, Left on a
	 * close button stays there, Delete closes a closable tab, and Enter on Third is refused. Every
	 * key reported is logged; Fourth is disabled and reports none.
	 *
	 * **Nothing photographs this page.** `tab-view-keys.spec.ts` presses the keys and reads where
	 * focus lands, what is selected, and the log.
	 */
	// Overview and Third have no close button, and Fourth, after Third, is disabled, so it is out
	// of the ring: Third is the last element of the arrow ring.
	let items = $state([
		{ id: 'k-1', header: 'Overview', closable: false },
		{ id: 'k-2', header: 'Second' },
		{ id: 'k-3', header: 'Third', closable: false },
		// Disabled, so it reports nothing.
		{ id: 'k-4', header: 'Fourth', disabled: true }
	]);
	let selected = $state<string | null>('k-1');
	let log = $state<string[]>([]);
	// The last key the TabView's root saw, through its rest props.
	let rootSaw = $state('');
	let newTab = $state<HTMLButtonElement | null>(null);

	function onTabKeyDown(id: string, event: KeyboardEvent) {
		log = [...log, `${id}:${event.key}`];
		if (event.key === 'ArrowRight' && id === 'k-3') {
			event.preventDefault();
			newTab?.focus();
		} else if (event.key === 'ArrowLeft' && (event.target as Element).matches('button.close')) {
			// A key taken on a close button: focus stays on it.
			event.preventDefault();
		} else if (event.key === 'ArrowLeft' && id === 'k-1') {
			// Stop at the end of the ring instead of wrapping.
			event.preventDefault();
		} else if (event.key === 'Delete' && items.find((item) => item.id === id)?.closable !== false) {
			event.preventDefault();
			items = items.filter((item) => item.id !== id);
		} else if (event.key === 'Enter' && id === 'k-3') {
			// The consumer refuses this activation.
			event.preventDefault();
		}
	}
</script>

{#snippet footer()}<button type="button" bind:this={newTab}>New tab</button>{/snippet}

<div class="frame">
	<TabView
		data-testid="keys"
		{items}
		bind:selected
		addTabButtonVisible={false}
		tabStripFooter={footer}
		{onTabKeyDown}
		onkeydown={(event: KeyboardEvent) => (rootSaw = event.key)}
	/>
</div>
<output data-testid="log">{log.join(' ')}</output>
<output data-testid="root">{rootSaw}</output>

<style>
	.frame {
		width: 720px;
		margin-top: 12px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
