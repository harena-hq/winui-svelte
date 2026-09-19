<script lang="ts">
	import { onMount } from 'svelte';
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
		{
			// Children with no glyph of their own, as the real menu's Accessibility section
			// has: it is the case where the icon column collapses to 8 and the child's label
			// lands almost under its parent's.
			id: 'accessibility',
			content: 'Accessibility',
			glyph: 'E776',
			children: [
				{ id: 'screen-reader', content: 'Screen reader support' },
				{ id: 'keyboard', content: 'Keyboard support' }
			]
		},
		{ header: 'Controls' },
		{ id: 'all', content: 'All', glyph: 'E8A9' },
		{ id: 'basic-input', content: 'Basic input', glyph: 'E73A' },
		{ id: 'collections', content: 'Collections', glyph: 'E80A' }
	];
	// nvSample6 carries no Icon, which places these in the top presenter's ContentOnly state.
	const topContentItems: NavigationViewEntry[] = [
		{ id: 'menu-1', content: 'Menu Item1' },
		{ id: 'menu-2', content: 'Menu Item2' },
		{ id: 'menu-3', content: 'Menu Item3' },
		{ id: 'menu-4', content: 'Menu Item4' }
	];
	const topIconItems: NavigationViewEntry[] = [
		{ id: 'menu-1', content: 'Menu Item1', glyph: 'E80F' },
		{ id: 'menu-2', content: 'Menu Item2', glyph: 'E8A5' },
		{ id: 'menu-3', content: 'Menu Item3', glyph: 'E713' },
		{ id: 'menu-4', content: 'Menu Item4', glyph: 'E790' }
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

	// Seeded before the control mounts, which is the point: a page reached at a child's URL
	// has to render with that child's parent already open.
	let seeded = $state(['design']);

	// The frame below is the one that photographs an overlaying pane, and the control will not
	// render one at rest: it closes its own pane on entering minimal, and mounting in minimal is
	// entering it. That behaviour is right — a phone-width window opens with the pane shut — so
	// the harness drives the other state rather than the control being changed to allow it. A
	// child's `onMount` runs before its parent's, so this write lands after the control's own
	// and its guard, which only acts when the display mode changes, does not answer it. The
	// toggle button still closes the pane from here.
	let overlayPaneOpen = $state(false);
	onMount(() => {
		overlayPaneOpen = true;
	});
</script>

<svelte:head><title>NavigationView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">NavigationView</h1>
<p class="winui-BodyTextBlockStyle">
	One control in each display mode. The first resolves its own from its width, so it is the one that
	changes when the window does; the other two are pinned.
</p>

<h2 class="winui-SubtitleTextBlockStyle">auto — resolved from the control's width</h2>
<div class="frame">
	<NavigationView {items} {selected} onItemInvoked={select('auto')}>
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">compact — pinned, pane closed</h2>
<div class="frame">
	<NavigationView
		{items}
		{selected}
		onItemInvoked={select('compact')}
		paneDisplayMode="leftCompact"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">minimal — pinned, pane closed</h2>
<p class="winui-BodyTextBlockStyle">
	The control closes its own pane on entering minimal, so this is the closed state however
	<code>paneOpen</code> is seeded. The toggle button is the only way back into the pane.
</p>
<div class="frame">
	<NavigationView
		{items}
		{selected}
		onItemInvoked={select('minimal')}
		paneDisplayMode="leftMinimal"
		bind:paneOpen={minimalPaneOpen}
	>
		<p class="winui-BodyTextBlockStyle">The pane is drawn over this.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">minimal — pinned, pane open</h2>
<p class="winui-BodyTextBlockStyle">
	What a phone-width window looks like once the toggle has been pressed. The pane is drawn over the
	content rather than beside it, so it is opaque, rounded on its right corners, and casts a shadow
	onto what it covers.
</p>
<div class="frame">
	<NavigationView
		{items}
		{selected}
		onItemInvoked={select('overlay')}
		paneDisplayMode="leftMinimal"
		bind:paneOpen={overlayPaneOpen}
	>
		<!-- Positioned, and that is the point. A light-dismiss layer is positioned with
		     `z-index: auto`, so it paints in tree order against anything else positioned in the
		     content — and the Gallery's shell puts a `position: relative` scroller there, which
		     took every tap while a plain paragraph took none. A harness whose content is
		     unpositioned cannot tell the two orders apart. -->
		<div class="positioned">
			<p class="winui-BodyTextBlockStyle">The pane is drawn over this.</p>
		</div>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">settings item hidden</h2>
<p class="winui-BodyTextBlockStyle">
	The settings row is absent because <code>settingsVisible</code> is false.
</p>
<div class="frame">
	<NavigationView {items} {selected} onItemInvoked={select('hidden')} settingsVisible={false}>
		<p class="winui-BodyTextBlockStyle">The pane carries no settings row.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">seeded expansion</h2>
<p class="winui-BodyTextBlockStyle">
	The frame starts with <code>design</code> already open because the page seeded the array.
</p>
<div class="frame">
	<NavigationView {items} {selected} onItemInvoked={select('seeded')} bind:expandedItems={seeded}>
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">top — the pane above the content</h2>
<div class="frame">
	<NavigationView
		items={topContentItems}
		selected="menu-1"
		onItemInvoked={select('top')}
		paneDisplayMode="top"
		><p class="winui-BodyTextBlockStyle">Content sits below the pane.</p></NavigationView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">top — with icons</h2>
<div class="frame">
	<NavigationView
		items={topIconItems}
		selected="menu-1"
		onItemInvoked={select('top-icons')}
		paneDisplayMode="top"
		><p class="winui-BodyTextBlockStyle">Content sits below the pane.</p></NavigationView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">top — narrower than its items</h2>
<div class="frame">
	<div class="narrow">
		<NavigationView
			items={topIconItems}
			selected="menu-1"
			onItemInvoked={select('top-narrow')}
			paneDisplayMode="top"
			><p class="winui-BodyTextBlockStyle">
				The overflow button opens the remaining items.
			</p></NavigationView
		>
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">top — no settings row</h2>
<div class="frame">
	<NavigationView
		items={topContentItems}
		selected="menu-1"
		onItemInvoked={select('top-no-settings')}
		paneDisplayMode="top"
		settingsVisible={false}
		><p class="winui-BodyTextBlockStyle">The settings row is absent.</p></NavigationView
	>
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

	.narrow {
		max-width: 420px;
		height: 100%;
	}

	/* See the comment on the frame that uses it. `position` is the reason it exists and the
	   height is what makes the position reachable: a positioned box only takes the taps that
	   land on it, and one as tall as its own paragraph leaves the rest of the content area to
	   whatever is underneath — which is how the first version of this harness passed against a
	   component that failed on the shell. The shell's `ScrollView` fills its content area, so
	   this does too. No paint of its own, so no baseline moves. */
	.positioned {
		position: relative;
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
