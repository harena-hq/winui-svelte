<script lang="ts">
	import { onMount } from 'svelte';
	import { NavigationView, type NavigationViewEntry } from '@harena-hq/winui-svelte/preview';

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

	// The two panes whose menus overrun. Each gets its own array rather than sharing `seeded`:
	// a bound prop is written back by the control, so one array across three frames would make
	// a click in any of them expand the other two, and the overrun this page exists to hold
	// steady would depend on where the last click landed.
	let overrunWithoutSettings = $state(['design']);
	let overrunWithPaneFooter = $state(['design']);
	let overrunWithBoth = $state(['design']);

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

	// The footer specimens, appended last and drawn only under `?footer`. This route's whole body
	// is a baseline in three themes (`navigation-view.spec.ts`), and a specimen drawn on every
	// load would move it; read on mount rather than from the page's URL because the route is
	// prerendered, where the query is not there to read. `navigation-view-footer.spec.ts` is the
	// reader. Each specimen holds its own selection and expansion, for the reason the overrun
	// frames above give.
	let footerSpecimens = $state(false);
	onMount(() => {
		footerSpecimens = new URLSearchParams(location.search).has('footer');
	});
	const footerMenu: NavigationViewEntry[] = [
		{ id: 'home', content: 'Home', glyph: 'E80F' },
		{ id: 'all', content: 'All', glyph: 'E8A9' }
	];
	const footerEntries: NavigationViewEntry[] = [
		{ id: 'account', content: 'Account', glyph: 'E77B' },
		{
			id: 'help',
			content: 'Help',
			glyph: 'E897',
			children: [
				{ id: 'documentation', content: 'Documentation' },
				{ id: 'feedback', content: 'Feedback' }
			]
		}
	];
	// Taller than half of any pane this page draws, with the overrunning menu beside it: the
	// division's last branch, where each list gets half.
	const tallFooter: NavigationViewEntry[] = [
		{ id: 'footer-1', content: 'Footer 1', glyph: 'E77B' },
		{ id: 'footer-2', content: 'Footer 2', glyph: 'E719' },
		{ id: 'footer-3', content: 'Footer 3', glyph: 'E897' },
		{ id: 'footer-4', content: 'Footer 4', glyph: 'E80F' },
		{ id: 'footer-5', content: 'Footer 5', glyph: 'E8A9' }
	];
	let footerLeftSelected = $state<string | null>('home');
	let footerLeftExpanded = $state<string[]>([]);
	let footerTopSelected = $state<string | null>('home');
	let footerSplitExpanded = $state(['design']);
	// A footer that opens on a header and a menu that ends on one: the two places a header's
	// margin used to collapse out of the list being measured.
	const headedMenu: NavigationViewEntry[] = [...footerMenu, { header: 'More' }];
	const headedFooter: NavigationViewEntry[] = [
		{ header: 'Support' },
		{ id: 'account', content: 'Account', glyph: 'E77B' }
	];
	const noMenu: NavigationViewEntry[] = [];
	function selectFooter(where: string, set: (id: string) => void) {
		return (id: string) => {
			set(id);
			events = [...events, `${where}: ${id}`];
		};
	}
</script>

<svelte:head><title>NavigationView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">NavigationView</h1>
<p class="winui-BodyTextBlockStyle">
	One control in each display mode. The first resolves its own from its width, so it is the one that
	changes when the window does; the other two are pinned.
</p>

<h2 class="winui-SubtitleTextBlockStyle">auto — resolved from the control's width</h2>
<div class="frame" id="menu-fits">
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
<div class="frame" id="seeded-expansion">
	<NavigationView {items} {selected} onItemInvoked={select('seeded')} bind:expandedItems={seeded}>
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the menu overruns and the footer holds no item</h2>
<p class="winui-BodyTextBlockStyle">
	The same overrunning menu as above with no settings row, and no pane separator. Upstream's test is
	on the pair <em>no footer menu item and no settings item</em>, not on whether anything is below
	the rule — the pane footer's box is always in the grid, empty or not.
</p>
<div class="frame" id="menu-overruns-without-settings">
	<NavigationView
		{items}
		{selected}
		onItemInvoked={select('overrun-no-settings')}
		bind:expandedItems={overrunWithoutSettings}
		settingsVisible={false}
	>
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the menu overruns and the pane footer is filled</h2>
<p class="winui-BodyTextBlockStyle">
	The frame above with the <code>paneFooter</code> slot filled. The separator is still not drawn:
	the test upstream makes is on the footer <em>items</em>, and an app's pane footer is not one of
	them — its height is counted when the pane's space is divided and nowhere in the decision.
</p>
<div class="frame" id="menu-overruns-with-pane-footer">
	<NavigationView
		{items}
		{selected}
		onItemInvoked={select('overrun-pane-footer')}
		bind:expandedItems={overrunWithPaneFooter}
		settingsVisible={false}
	>
		{#snippet paneFooter()}
			<p class="winui-CaptionTextBlockStyle pane-footer-note">Signed in as harness</p>
		{/snippet}
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">
	the menu overruns with a settings row and a pane footer
</h2>
<p class="winui-BodyTextBlockStyle">
	Both filled at once, which is the only arrangement in which a pane footer can be seen not to
	<em>remove</em> the separator. The frame above shows one does not bring the rule back; without this
	one, a control that treated a filled pane footer as a reason to collapse would look right in every other
	frame on this page.
</p>
<div class="frame" id="menu-overruns-with-settings-and-pane-footer">
	<NavigationView
		{items}
		{selected}
		onItemInvoked={select('overrun-both')}
		bind:expandedItems={overrunWithBoth}
	>
		{#snippet paneFooter()}
			<p class="winui-CaptionTextBlockStyle pane-footer-note">Signed in as harness</p>
		{/snippet}
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">top — the pane above the content</h2>
<div class="frame" id="top-content">
	<NavigationView
		items={topContentItems}
		selected="menu-1"
		onItemInvoked={select('top')}
		paneDisplayMode="top"
		><p class="winui-BodyTextBlockStyle">Content sits below the pane.</p></NavigationView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">top — with icons</h2>
<div class="frame" id="top-icons">
	<NavigationView
		items={topIconItems}
		selected="menu-1"
		onItemInvoked={select('top-icons')}
		paneDisplayMode="top"
		><p class="winui-BodyTextBlockStyle">Content sits below the pane.</p></NavigationView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">top — narrower than its items</h2>
<div class="frame" id="top-narrow">
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

{#if footerSpecimens}
	<h2 class="winui-SubtitleTextBlockStyle">left — footer items, a pane footer and settings</h2>
	<div class="frame" id="footer-left">
		<NavigationView
			items={footerMenu}
			footerItems={footerEntries}
			selected={footerLeftSelected}
			onItemInvoked={selectFooter('footer-left', (id) => (footerLeftSelected = id))}
			bind:expandedItems={footerLeftExpanded}
			paneDisplayMode="left"
		>
			{#snippet paneFooter()}
				<p class="winui-CaptionTextBlockStyle pane-footer-note">Signed in as harness</p>
			{/snippet}
			<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
		</NavigationView>
	</div>

	<h2 class="winui-SubtitleTextBlockStyle">top — footer items, a pane footer and settings</h2>
	<div class="frame" id="footer-top">
		<NavigationView
			items={footerMenu}
			footerItems={footerEntries}
			selected={footerTopSelected}
			onItemInvoked={selectFooter('footer-top', (id) => (footerTopSelected = id))}
			paneDisplayMode="top"
		>
			{#snippet paneFooter()}
				<p class="winui-CaptionTextBlockStyle pane-footer-note">Signed in as harness</p>
			{/snippet}
			<p class="winui-BodyTextBlockStyle">Content sits below the pane.</p>
		</NavigationView>
	</div>

	<h2 class="winui-SubtitleTextBlockStyle">left — both lists taller than half the pane</h2>
	<div class="frame" id="footer-split">
		<NavigationView
			{items}
			footerItems={tallFooter}
			selected={null}
			bind:expandedItems={footerSplitExpanded}
			paneDisplayMode="left"
		>
			<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
		</NavigationView>
	</div>

	<h2 class="winui-SubtitleTextBlockStyle">left — a short menu over a footer that overruns</h2>
	<div class="frame" id="footer-scrolls">
		<NavigationView
			items={footerMenu}
			footerItems={tallFooter}
			selected={null}
			paneDisplayMode="left"
		>
			<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
		</NavigationView>
	</div>

	<h2 class="winui-SubtitleTextBlockStyle">left — no menu entry, only a footer</h2>
	<div class="frame" id="footer-no-menu">
		<NavigationView items={noMenu} footerItems={tallFooter} selected={null} paneDisplayMode="left">
			<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
		</NavigationView>
	</div>

	<h2 class="winui-SubtitleTextBlockStyle">left — lists that open and end on a header</h2>
	<div class="frame" id="footer-headers">
		<NavigationView
			items={headedMenu}
			footerItems={headedFooter}
			selected={null}
			paneDisplayMode="left"
		>
			<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
		</NavigationView>
	</div>
{/if}

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

	/* The specimen `pane-separator.spec.ts` reads as a menu that fits. Its back button, which the
	   control draws by default, takes a row of 40 above the toggle; the frame is taller by that
	   row so the menu still fits under it. */
	#menu-fits {
		height: 400px;
	}

	.narrow {
		max-width: 420px;
		height: 100%;
	}

	/* See the comment on the frame that uses it. `position` is the reason it exists and the
	   height is what makes the position reachable: a positioned box only takes the taps that
	   land on it, and one as tall as its own paragraph leaves the rest of the content area to
	   whatever is underneath — which is how the first version of this harness passed against a
	   component that failed on the shell. The shell's page area fills its content area, so
	   this does too. No paint of its own, so no baseline moves. */
	.positioned {
		position: relative;
		height: 100%;
	}

	/* The `paneFooter` slot holds an app's own content, so what it looks like is the harness's
	   to decide and not the control's: nothing here reproduces anything, and none of these
	   numbers is upstream's. One line, inset by eye, so that the frame photographs the slot
	   being filled rather than a block of text. */
	.pane-footer-note {
		margin: 0;
		padding: 4px 16px;
		color: var(--winui-TextFillColorSecondaryBrush);
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
