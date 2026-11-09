<script lang="ts">
	import { TabView } from '@harena-hq/winui-svelte/preview';

	/*
	 * A strip without its content region (`stripOnly`), for a consumer that renders and places the
	 * panels itself: a notice sits between the strip and the panels, and a panel stays mounted for a
	 * session that has no tab in the strip.
	 *
	 * **Nothing photographs this page.** `tab-view-strip.spec.ts` reads where the panels sit, how
	 * the tabs and panels name each other, and what the keyboard reaches.
	 */
	// Session 3 carries `content` and no `panelId`, so only `stripOnly` keeps that content out.
	const items = [
		{ id: 's-1', header: 'Session 1', tabId: 'strip-tab-s-1', panelId: 'strip-panel-s-1' },
		{ id: 's-2', header: 'Session 2', tabId: 'strip-tab-s-2', panelId: 'strip-panel-s-2' },
		{ id: 's-3', header: 'Session 3', tabId: 'strip-tab-s-3', content: neverRendered }
	];
	// s-4 has no tab: a session in another workspace, whose panel stays mounted.
	const sessions = ['s-1', 's-2', 's-3', 's-4'];
	let selected = $state<string | null>('s-1');
	// Without `stripOnly`: Mixed 1's panel is the consumer's, Mixed 2's the component's own.
	let mixedSelected = $state<string | null>('m-2');
	const mixedItems = [
		{ id: 'm-1', header: 'Mixed 1', panelId: 'mixed-panel-m-1', content: mixed1 },
		{ id: 'm-2', header: 'Mixed 2', content: mixed2 }
	];
</script>

{#snippet neverRendered()}<p>Never rendered.</p>{/snippet}
{#snippet mixed1()}<p>Mixed 1 content.</p>{/snippet}
{#snippet mixed2()}
	<p>Mixed 2 content.</p>
	<button type="button" onclick={() => (mixedSelected = 'm-1')}>Show Mixed 1</button>
{/snippet}

<div class="frame">
	<TabView data-testid="strip" stripOnly {items} bind:selected addTabButtonVisible={false} />
	<div data-testid="notice" class="winui-BodyTextBlockStyle">
		A notice between the strip and the panels.
	</div>
	{#each sessions as id (id)}
		<div
			id="strip-panel-{id}"
			role="tabpanel"
			aria-labelledby={id === 's-4' ? undefined : `strip-tab-${id}`}
			hidden={id !== selected}
			data-testid="panel-{id}"
		>
			<label>Input {id} <input type="text" /></label>
		</div>
	{/each}
</div>

<div class="frame">
	<TabView
		data-testid="mixed"
		items={mixedItems}
		bind:selected={mixedSelected}
		addTabButtonVisible={false}
	/>
	<div id="mixed-panel-m-1" role="tabpanel">
		The consumer's panel for Mixed 1. <button type="button">Consumer m-1</button>
	</div>
</div>

<style>
	.frame {
		width: 720px;
		margin-top: 12px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
