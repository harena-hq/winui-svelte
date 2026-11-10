<script lang="ts">
	import { TabView } from '@harena-hq/winui-svelte/preview';

	/*
	 * A strip whose host confirms or refuses selection requests through a function binding:
	 * the getter supplies the host's selection, and the setter records a pending request.
	 * Removing the selected tab also asks through that setter for the next enabled tab.
	 *
	 * **Nothing photographs this page.** `tab-view-confirm.spec.ts` reads the pending request,
	 * the reported ids, and which tab and panel stay selected until the host confirms.
	 */
	let items = $state([
		{ id: 'c-1', header: 'First', content: first },
		{ id: 'c-2', header: 'Second', content: second },
		{ id: 'c-3', header: 'Third', content: third }
	]);
	let catalog = $state<string | null>('c-1');
	let pending = $state<string | null>(null);
	let reported = $state<string[]>([]);
</script>

{#snippet first()}<p>First tab content.</p>{/snippet}
{#snippet second()}<p>Second tab content.</p>{/snippet}
{#snippet third()}<p>Third tab content.</p>{/snippet}

<div class="frame">
	<TabView
		data-testid="confirm"
		{items}
		bind:selected={() => catalog, (id) => (pending = id)}
		onSelectedChange={(id) => (reported = [...reported, id ?? 'null'])}
		addTabButtonVisible={false}
		onTabCloseRequested={(id) => (items = items.filter((item) => item.id !== id))}
	/>
</div>
<button
	type="button"
	onclick={() => {
		catalog = pending;
		pending = null;
	}}>Confirm</button
>
<button type="button" onclick={() => (pending = null)}>Refuse</button>
<output data-testid="pending">{pending ?? ''}</output>
<output data-testid="reported">{reported.join(' ')}</output>

<style>
	.frame {
		width: 720px;
		margin-top: 12px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
