<script lang="ts">
	import { NavigationView, type NavigationViewEntry } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The menu
	 * below is written out rather than read from `data/winui-gallery-shell.json` on
	 * purpose — the record is what the shell renders, and a harness that moved whenever
	 * the record did would make every baseline a re-pin away from failing.
	 *
	 * Glyphs are code points from the Gallery's own icon catalogue.
	 */
	const items: NavigationViewEntry[] = [
		{ id: 'home', content: 'Home', glyph: 'E80F' },
		{
			id: 'design',
			content: 'Design',
			glyph: 'EB3C',
			children: [
				{ id: 'color', content: 'Color', glyph: 'E790' },
				{ id: 'geometry', content: 'Geometry', glyph: 'E743' },
				{ id: 'typography', content: 'Typography', glyph: 'E8D2' }
			]
		},
		{ id: 'accessibility', content: 'Accessibility', glyph: 'E776' },
		{ header: 'Controls' },
		{ id: 'all', content: 'All', glyph: 'E8A9' },
		{ id: 'basic-input', content: 'Basic input', glyph: 'E73A' },
		{ id: 'collections', content: 'Collections', glyph: 'E80A' }
	];

	let selected = $state<string | null>('color');
	let events = $state<string[]>([]);

	function select(where: string) {
		return (id: string) => {
			selected = id;
			events = [...events, `${where}: ${id}`];
		};
	}

	// Bound rather than passed: the component closes its own pane on entering minimal, and
	// a literal would leave that write with nowhere to go.
	let minimalPaneOpen = $state(true);
</script>

<svelte:head><title>NavigationView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">NavigationView</h1>
<p class="winui-BodyTextBlockStyle">
	One control in each display mode. The first resolves its own from its width, so it is the one that
	changes when the window does; the other two are pinned.
</p>

<h2 class="winui-SubtitleTextBlockStyle">auto — resolved from the control's width</h2>
<div class="frame">
	<NavigationView {items} {selected} onselect={select('auto')}>
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">compact — pinned, pane closed</h2>
<div class="frame">
	<NavigationView {items} {selected} onselect={select('compact')} displayMode="compact" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">minimal — pinned, pane open over the content</h2>
<div class="frame">
	<NavigationView
		{items}
		{selected}
		onselect={select('minimal')}
		displayMode="minimal"
		bind:paneOpen={minimalPaneOpen}
	>
		<p class="winui-BodyTextBlockStyle">The pane is drawn over this.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">settings item hidden</h2>
<p class="winui-BodyTextBlockStyle">
	The settings row is absent because <code>settingsVisible</code> is false.
</p>
<div class="frame">
	<NavigationView {items} {selected} onselect={select('hidden')} settingsVisible={false}>
		<p class="winui-BodyTextBlockStyle">The pane carries no settings row.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">selection</h2>
<pre class="log">{events.length ? events.join('\n') : 'nothing selected yet'}</pre>

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
		min-height: 3em;
		padding: 12px;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		color: var(--winui-TextFillColorSecondaryBrush);
		white-space: pre-wrap;
		/* c1-allow: a code face is categorical, not a themed value */
		font-family: monospace;
	}
</style>
