<script lang="ts">
	import { NavigationView, type NavigationViewEntry } from 'winui-svelte/preview';

	/*
	 * The rail's children flyout — `ChildrenFlyout` — and the expansion memory beside it.
	 *
	 * **Nothing photographs this page.** Every assertion in `navigation-view-rail.spec.ts` is
	 * about which element exists, where it sits and what an event did;
	 * `/dev/navigation-view` keeps the three tracked baselines and draws no open flyout, so
	 * none of them moves. A photograph of the flyout is owed and is not this page's to take:
	 * a new baseline is a picture somebody has to look at.
	 *
	 * Three levels, because two cannot tell the interesting case apart. `IsTopLevelItem` is
	 * "my parent repeater is one of the control's own" (`NavigationView.cpp:5748-5751`), not a
	 * depth — so `color`, sitting inside `design`'s flyout, must draw *its* children inline
	 * within that flyout rather than opening a second one, even though it is drawn at depth 0.
	 */
	const items: NavigationViewEntry[] = [
		{ id: 'home', content: 'Home', glyph: 'E80F' },
		{
			id: 'design',
			content: 'Design',
			glyph: 'EB3C',
			children: [
				{
					id: 'color',
					content: 'Color',
					glyph: 'E790',
					children: [
						{ id: 'swatches', content: 'Swatches' },
						{ id: 'gradients', content: 'Gradients' }
					]
				},
				{ id: 'geometry', content: 'Geometry', glyph: 'E743' }
			]
		},
		{ id: 'all', content: 'All', glyph: 'E8A9' }
	];

	let selected = $state<string | null>('home');
	let invoked = $state<string[]>([]);

	function onItemInvoked(id: string) {
		selected = id;
		invoked = [...invoked, id];
	}

	// Bound so the toggle button's write has somewhere to go, and so the test can read the
	// pane's state rather than infer it.
	let memoryPaneOpen = $state(true);
	let memoryExpanded = $state<string[]>([]);
</script>

<svelte:head><title>NavigationView rail flyout — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">NavigationView — the rail's children flyout</h1>
<p class="winui-BodyTextBlockStyle">
	A closed-compact pane has no room for a child row: with the label gone it would be
	indistinguishable from its parent's. Upstream reparents the children into an attached flyout and
	shows it when the row expands.
</p>

<h2 class="winui-SubtitleTextBlockStyle">compact — pinned, pane closed</h2>
<div class="frame" id="rail">
	<NavigationView {items} {selected} {onItemInvoked} paneDisplayMode="leftCompact">
		<p class="winui-BodyTextBlockStyle">Content sits beside the rail.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the pane remembers what it collapsed</h2>
<p class="winui-BodyTextBlockStyle">
	Closing the pane force-collapses every expanded top-level row, and opening it puts them back.
	Without it, closing the pane on an expanded row would pop its flyout open unbidden.
</p>
<div class="frame" id="memory">
	<NavigationView
		{items}
		{selected}
		{onItemInvoked}
		paneDisplayMode="left"
		bind:paneOpen={memoryPaneOpen}
		bind:expandedItems={memoryExpanded}
	>
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>
<pre class="log" id="pane-state">{memoryPaneOpen ? 'open' : 'closed'} / {memoryExpanded.length
		? memoryExpanded.join(',')
		: 'none'}</pre>

<h2 class="winui-SubtitleTextBlockStyle">what was invoked</h2>
<pre class="log" id="log">{invoked.length ? invoked.join('\n') : 'nothing invoked yet'}</pre>

<style>
	.frame {
		height: 360px;
		margin-bottom: 24px;
		overflow: hidden;
		border-radius: var(--winui-OverlayCornerRadius);
		/* c1-allow: 1px is the Gallery's card stroke width, not a tokenized theme value */
		border: 1px solid var(--winui-CardStrokeColorDefaultBrush);
	}

	.frame :global(> *) {
		height: 100%;
	}

	.log {
		min-height: 2em;
		padding: 12px;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		color: var(--winui-TextFillColorSecondaryBrush);
		white-space: pre-wrap;
		/* c1-allow: a code face is categorical, not a themed value */
		font-family: monospace;
	}
</style>
