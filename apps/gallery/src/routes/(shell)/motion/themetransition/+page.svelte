<script lang="ts">
	import { Button, Ellipse, ListView, Popup, Rectangle } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/motion/themetransition');
	if (item === null) throw new Error('Theme Transitions page has no Gallery item');
	const entranceSample = sampleOf('ThemeTransition/EntrancethemetransitionAddingItemsYour.txt');
	const repositionSample = sampleOf(
		'ThemeTransition/RepositionthemetransitionReactLayoutChanges.txt'
	);
	const contentSample = sampleOf(
		'ThemeTransition/ContentthemetransitionAnimateContentRefreshes.txt'
	);
	const addDeleteSample = sampleOf(
		'ThemeTransition/AdddeletethemetransitionAnimateAddingRemoving.txt'
	);
	const popupSample = sampleOf('ThemeTransition/PopupthemetransitionAnimateOpeningClosing.txt');
	// ContentDialogOpenCloseThemeTransition_Partial.h:31 — 83 is the smallest unit in this
	// vocabulary. The provider delays whole batches (.cpp:79, :84), never one item after another;
	// `IsStaggeringEnabled="True"` (ThemeTransitionPage.xaml:15) makes this page-visible stagger
	// necessary, but its size is ours and is documented as an approximation below.
	const ENTRANCE_STAGGER_MS = 83;
	let entranceNextId = 0;
	// The delay is carried as the finished custom property rather than a number the markup
	// interpolates, so the rectangle's own tag stays on one line — which is what lets the
	// `c1-allow` above it reach the `fill` attribute, since the exemption runs to the line after
	// the comment closes and no further.
	function entranceBatch(count: number) {
		return Array.from({ length: count }, (_, index) => ({
			id: entranceNextId++,
			style: `--theme-delay: ${index * ENTRANCE_STAGGER_MS}ms`
		}));
	}
	// ThemeTransitionPage.xaml:18-42 declares five, and its parent transition (:13-17) runs for
	// those on load as well as for items added later.
	let entranceItems = $state(entranceBatch(5));

	// ThemeTransitionPage.xaml:80-84 — the middle rectangle is 75 wide with 5px margins, so its
	// collapse removes 85px from the row and moves the right rectangle by that amount.
	const REPOSITION_DELTA_PX = 85;
	let middleVisible = $state(true);
	// A CSS animation restarts when its element is created, so the subject is keyed instead of
	// manually retriggered.
	let repositionTick = $state(0);
	let repositionFrom = $state(0);
	function reposition() {
		// ThemeTransitionPage.xaml.cs:75-80 toggles Visibility between Visible and Collapsed.
		repositionFrom = middleVisible ? REPOSITION_DELTA_PX : -REPOSITION_DELTA_PX;
		middleVisible = !middleVisible;
		repositionTick += 1;
	}

	let contentGeneration = $state(0);
	// ThemeTransitionPage.xaml.cs:48-57 — five strings are `Item i` until refresh, then
	// `Updated content i`. The generation in the key recreates rows on every refresh.
	const contentItems = $derived(
		Array.from({ length: 5 }, (_, index) => ({
			id: `${contentGeneration}-${index}`,
			label: contentGeneration === 0 ? `Item ${index}` : `Updated content ${index}`
		}))
	);

	interface AddDeleteRow {
		id: number;
		label: string;
		// A leaving row remains until its scale-out ends; an absent row has nothing to animate.
		leaving: boolean;
		delayMs: number;
	}

	// LinedFlowLayoutItemCollectionTransitionProvider.cpp:82-85 — an add in a batch with a remove
	// waits QuickAnimationDuration, ordering the two. ThemeTransitionPage.xaml.cs:102-107 makes
	// Add and Del that batch.
	const ADD_AFTER_DELETE_DELAY_MS = 167;
	// ThemeTransitionPage.xaml.cs:17, :22-25 — ten initial rows and `New Item 10` first.
	let addDeleteCount = $state(10);
	let addDeleteNextId = 0;
	let addDeleteRows = $state<AddDeleteRow[]>(
		Array.from({ length: 10 }, (_, index) => ({
			id: addDeleteNextId++,
			label: `Item ${index}`,
			leaving: false,
			delayMs: 0
		}))
	);
	function addRow(delayMs: number) {
		// ThemeTransitionPage.xaml.cs:59-64.
		addDeleteRows = [
			...addDeleteRows,
			{ id: addDeleteNextId++, label: `New Item ${addDeleteCount}`, leaving: false, delayMs }
		];
		addDeleteCount += 1;
	}
	function deleteRow() {
		// ThemeTransitionPage.xaml.cs:66-73 removes index 0. A row already leaving is gone to the
		// model, so this finds the first present row.
		const row = addDeleteRows.find((candidate) => !candidate.leaving);
		if (row === undefined) return false;
		row.leaving = true;
		return true;
	}
	function addAndDelete() {
		const deleted = deleteRow();
		addRow(deleted ? ADD_AFTER_DELETE_DELAY_MS : 0);
	}

	let popupOpen = $state(false);
	let popupClosing = $state(false);
	function closePopup() {
		// ThemeTransitionPage.xaml.cs:36-40 unmounts immediately. Run the equivalent close first:
		// LayoutTransition_partial.cpp:2308 runs it on TransitionTrigger_Unload.
		popupClosing = true;
	}
	function onPopupAnimationEnd(event: AnimationEvent) {
		// The two animations each dispatch an event. The 83ms fade cannot remove the 167ms scale;
		// Svelte scopes local keyframes with a hash prefix, hence this exact suffix comparison.
		if (!popupClosing || !event.animationName.endsWith('theme-surface-out')) return;
		popupClosing = false;
		popupOpen = false;
	}
</script>

<ItemPage {item}>
	<ControlExample
		headerText={entranceSample.header ?? undefined}
		xaml={entranceSample.xaml ?? undefined}
	>
		<!-- ThemeTransitionPage.xaml:12 and :18-42 — the StackPanel is a horizontal rectangle row. -->
		<div class="entrance-clip">
			<div class="entrance-row">
				{#each entranceItems as row (row.id)}
					<!-- c1-allow: ThemeTransitionPage.xaml:22 gives every rectangle the named colour
					     LightBlue, and ThemeTransitionPage.xaml.cs:89 gives the same one to each rectangle added later. It
					     is the sample's own brush rather than a themed one, so there is no token to read
					     it from. Written at the attribute rather than hoisted into a script constant:
					     C1 reads a presentation attribute and reads nothing in the script block, so a
					     constant would take the value out of the gate's reach instead of declaring it. -->
					<Rectangle class="entrance-rectangle" fill="lightblue" style={row.style} />
				{/each}
			</div>
		</div>
		{#snippet options()}
			<!-- ThemeTransitionPage.xaml:46-60 — a flex column restores the StackPanel's stretch for
			     inline-flex component roots; no Spacing is declared. -->
			<div class="options">
				<Button onclick={() => (entranceItems = [...entranceItems, ...entranceBatch(1)])}
					>Add one</Button
				>
				<Button onclick={() => (entranceItems = [...entranceItems, ...entranceBatch(5)])}
					>Add five</Button
				>
				<Button onclick={() => (entranceItems = [])}>Clear all</Button>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={repositionSample.header ?? undefined}
		xaml={repositionSample.xaml ?? undefined}
	>
		<!-- ThemeTransitionPage.xaml:68-97 — three Auto grid columns with one item each shrink to
		     the same row a flex layout makes; an absent middle child matches Collapsed. The three
		     named colours below are the sample's own, at :78, :85 and :91. -->
		<!-- The offset is declared on the row and not on the subject, because a custom property
		     inherits and the subject's own tag has to stay on one line for the `c1-allow` below it
		     to reach its `fill`. Same technique, same reason, as `--curve` on the Easing Functions
		     page's track. -->
		<div class="reposition-grid" style={`--theme-translate-from: ${repositionFrom}px`}>
			<!-- c1-allow: ThemeTransitionPage.xaml:78 — the left rectangle's named colour. -->
			<Rectangle class="reposition-rectangle" fill="red" />
			{#if middleVisible}
				<!-- c1-allow: ThemeTransitionPage.xaml:85 — the collapsible rectangle's named colour. -->
				<Rectangle class="reposition-rectangle" fill="green" />
			{/if}
			<!-- The first key has from=0, so its first-render animation visibly moves nothing. -->
			{#key repositionTick}
				<!-- c1-allow: ThemeTransitionPage.xaml:91 — the transition subject's named colour. -->
				<Rectangle class="reposition-rectangle reposition-subject" fill="blue" />
			{/key}
		</div>
		{#snippet options()}
			<!-- ThemeTransitionPage.xaml:102 has no HorizontalAlignment; DefaultButtonStyle's Left
			     alignment (generic.xaml:27630-27631) keeps this button content-sized. -->
			<div class="options">
				<Button class="unstretched-button" onclick={reposition}>Reposition</Button>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={contentSample.header ?? undefined}
		xaml={contentSample.xaml ?? undefined}
	>
		<!-- LinedFlowLayoutItemCollectionTransitionProvider.cpp:63-71 sends a reset-like refresh to
		     SlideIn. The ItemsView viewport clips it; this bare ListView needs its own clip. -->
		<div class="content-list-clip">
			<ListView items={contentItems} key={(row) => row.id} itemTemplate={contentRow} />
		</div>
		{#snippet options()}<div class="options">
				<Button class="unstretched-button" onclick={() => (contentGeneration += 1)}
					>Refresh data</Button
				>
			</div>{/snippet}
	</ControlExample>

	<ControlExample
		headerText={addDeleteSample.header ?? undefined}
		xaml={addDeleteSample.xaml ?? undefined}
	>
		<!-- WD-045: surviving rows close the gap when removal completes; see docs/divergences.md. -->
		<ListView items={addDeleteRows} key={(row) => row.id} itemTemplate={addDeleteRowTemplate} />
		{#snippet options()}
			<div class="options">
				<Button onclick={() => addRow(0)}>Add</Button>
				<Button onclick={deleteRow}>Delete</Button>
				<Button onclick={addAndDelete}>Add and Del</Button>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample headerText={popupSample.header ?? undefined} xaml={popupSample.xaml ?? undefined}>
		<div class="popup-example">
			<Button onclick={() => (popupOpen = true)}>Show Popup</Button>
			<!-- ThemeTransitionPage.xaml:164 — Popup has no layout presence; Margin="-75" offsets its
			     child from the written position. -->
			<Popup bind:open={popupOpen} horizontalOffset={-75} verticalOffset={-75}>
				<div
					class="popup-surface"
					data-closing={popupClosing || undefined}
					onanimationend={onPopupAnimationEnd}
				>
					<!-- ThemeTransitionPage.xaml:176-178 names brushes missing from this library's token
					     layer. `Flyout.svelte`'s `.presenter` rule already uses this shipped WinUI flyout-surface
					     pair — named rather than numbered, because a line in a file this repository
					     edits is staled by the next edit;
					     do not invent FlyoutBackgroundThemeBrush (C9 rejects undefined tokens). -->
					<Ellipse
						class="popup-ellipse"
						fill="var(--winui-FlyoutPresenterBackground)"
						stroke="var(--winui-FlyoutBorderThemeBrush)"
						strokeThickness={2}
					/>
					<div class="popup-content">
						<p class="popup-text">This is a popup using PopupThemeTransition</p>
						<Button onclick={closePopup}>Close Popup</Button>
					</div>
				</div>
			</Popup>
		</div>
	</ControlExample>
</ItemPage>

{#snippet contentRow(row: { id: string; label: string })}
	<div class="list-row content-row">{row.label}</div>
{/snippet}

{#snippet addDeleteRowTemplate(row: AddDeleteRow)}
	<div
		class="list-row add-delete-row"
		data-leaving={row.leaving || undefined}
		style={`--theme-delay: ${row.delayMs}ms`}
		onanimationend={() => {
			if (row.leaving) addDeleteRows = addDeleteRows.filter((other) => other.id !== row.id);
		}}
	>
		{row.label}
	</div>
{/snippet}

<style>
	/* v15 unit 4 runs under D40: these five transitions read their keyframes from the running
	   Windows theme (ThemeGenerator.cpp:727-742), so their numbers are their nearest modern
	   relative's, not their own. WD-044 records the search and approximation. */
	/* LinedFlowLayoutItemCollectionTransitionProvider.cpp:251-284 — SlideIn: opacity 0 to 1 and
	   translation (0, SlideInDistance) to (0, 0), where .h:54 gives SlideInDistance as 100. */
	@keyframes theme-slide-in {
		from {
			opacity: 0;
			translate: 0 100px;
		}
		to {
			opacity: 1;
			translate: 0 0;
		}
	}
	/* LinedFlowLayoutItemCollectionTransitionProvider.cpp:287-307 — ScaleCollapsed (.h:57) to
	   ScaleVisible (.h:56). */
	@keyframes theme-scale-in {
		from {
			scale: 0;
		}
		to {
			scale: 1;
		}
	}
	/* LinedFlowLayoutItemCollectionTransitionProvider.cpp:310-330 — the same scale pair reversed. */
	@keyframes theme-scale-out {
		from {
			scale: 1;
		}
		to {
			scale: 0;
		}
	}
	/* LinedFlowLayoutItemCollectionTransitionProvider.cpp:333-354 — Translate starts at the
	   caller's old position because only this page knows the layout delta. */
	@keyframes theme-translate {
		from {
			translate: var(--theme-translate-from);
		}
		to {
			translate: 0;
		}
	}
	/* LayoutTransition_partial.cpp:2291-2320 — the ContentDialog relative opens from scale 1.05
	   and opacity 0, and closes to them. Scale and opacity have distinct durations below. */
	@keyframes theme-surface-in {
		from {
			scale: 1.05;
		}
		to {
			scale: 1;
		}
	}
	@keyframes theme-surface-out {
		from {
			scale: 1;
		}
		to {
			scale: 1.05;
		}
	}
	@keyframes theme-fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes theme-fade-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	.options {
		display: flex;
		flex-direction: column;
	}
	/* `HorizontalAlignment="Stretch"` on the six buttons of examples 1 and 4
	   (ThemeTransitionPage.xaml:48, :53, :58, :141, :145, :149). */
	.options :global(button) {
		width: 100%;
	}
	/* The two buttons that say nothing — `:102` and `:121` — and so keep the Left alignment
	   `DefaultButtonStyle` gives them (generic.xaml:27630-27631). The class is named for that
	   property rather than for either page section, because it governs both. */
	.options :global(.unstretched-button) {
		align-self: flex-start;
		width: auto;
	}

	/* The two `SlideIn` subjects, and only those two: the translation starts 100px below the
	   resting place (.h:54) and neither parent clips. Upstream's relative runs inside an
	   `ItemsView` viewport, which does clip; a `StackPanel` in a card and a bare `ListView` have
	   no viewport at all, so the clip is ours. Without it the entrance rectangles paint below the
	   card for most of their 250ms — the card's example area is about 128px tall against a 100px
	   translation. Example 4 is not here on purpose: `ScaleIn` and `ScaleOut` run between scale 0
	   and 1 and never leave the element's own box, so a clip there would only be a clip waiting
	   to catch something it was not written for. */
	.entrance-clip,
	.content-list-clip {
		overflow: hidden;
	}
	.entrance-row,
	.reposition-grid {
		display: flex;
	}
	/* ThemeTransitionPage.xaml:19-21 — `Width="50" Height="50" Margin="5"`. */
	:global(.entrance-rectangle) {
		width: 50px;
		height: 50px;
		margin: 5px;
		/* c1-allow: LinedFlowLayoutItemCollectionTransitionProvider.cpp:251-284 and :367 —
		   SlideIn's DefaultAnimationDuration (.h:52) under its ease-in curve. */
		animation: theme-slide-in 250ms cubic-bezier(0.55, 0, 0, 1) var(--theme-delay) backwards;
	}
	:global(.reposition-rectangle) {
		width: 75px;
		height: 75px;
		margin: 5px;
	}
	:global(.reposition-subject) {
		/* c1-allow: LinedFlowLayoutItemCollectionTransitionProvider.cpp:333-354 and :367 —
		   Translate's DefaultAnimationDuration (.h:52) under its ease-in curve. */
		animation: theme-translate 250ms cubic-bezier(0.55, 0, 0, 1) both;
	}
	.content-row {
		/* c1-allow: LinedFlowLayoutItemCollectionTransitionProvider.cpp:251-284 and :367 —
		   SlideIn for the reset branch at :63-71. */
		animation: theme-slide-in 250ms cubic-bezier(0.55, 0, 0, 1) both;
	}
	.list-row {
		/* WD-046: the animated visual is this element, not the ListViewItem around it. */
		display: block;
	}
	.add-delete-row {
		/* LinedFlowLayoutItemCollectionTransitionProvider.cpp:356-361 — scale is about ActualSize / 2. */
		transform-origin: center;
		/* c1-allow: LinedFlowLayoutItemCollectionTransitionProvider.cpp:287-307 and :367 —
		   ScaleIn's QuickAnimationDuration (.h:51) under the ease-in curve. */
		animation: theme-scale-in 167ms cubic-bezier(0.55, 0, 0, 1) var(--theme-delay) backwards;
	}
	.add-delete-row[data-leaving] {
		/* c1-allow: LinedFlowLayoutItemCollectionTransitionProvider.cpp:310-330 and :377 —
		   ScaleOut's QuickAnimationDuration (.h:51) under the ease-out curve. */
		animation: theme-scale-out 167ms cubic-bezier(1, 0, 1, 1) forwards;
	}

	/* ThemeTransitionPage.xaml:157 — ControlExample's Consolas inherits into its content. */
	.popup-example {
		/* c1-allow: ThemeTransitionPage.xaml:157; PageHeader.svelte:317-318 is the literal precedent. */
		font-family: Consolas, monospace;
		/* ThemeTransitionPage.xaml:158-197 — the `Button` and the `Popup` are two children of one
		   `Grid` with no rows or columns, so both start at the cell's origin and `Margin="-75"` is
		   measured from there. `Popup` renders a zero-sized anchor where it is written, and in block
		   flow that anchor lands after the button rather than on it: measured on the reference
		   machine as a surface at y728 against a button at y771, the popup's own origin 32px — one
		   button — below the cell's. Overlaying the two children puts it back. */
		display: grid;
	}
	.popup-example > :global(*) {
		grid-area: 1 / 1;
	}
	/* ThemeTransitionPage.xaml:170 — a `Grid` with two children and no rows or columns stacks
	   them, which the `grid-area` below is. `transform-origin` is LayoutTransition_partial.cpp:2277,
	   where `scaleOrigin` is {0.5, 0.5}. */
	.popup-surface {
		display: grid;
		transform-origin: center;
		/* c1-allow: LayoutTransition_partial.cpp:2291-2297 and :2273 — open scale is 250ms under
		   cubic-bezier(0, 0, 0, 1), opacity is 83ms linear (.h:29, :31). */
		animation:
			theme-surface-in 250ms cubic-bezier(0, 0, 0, 1) both,
			theme-fade-in 83ms linear both;
	}
	/* `:global(*)` and not a bare `*`: Svelte scopes the compound on both sides of the combinator,
	   and the `Ellipse`'s root is that component's element, which carries no scope class of this
	   page's. Written bare first, the rule reached only the page's own `div` and the ellipse fell
	   into a second grid row — measured on the reference machine as a 248 by 342 surface with the
	   ellipse at y870 under content at y752, instead of the two sharing one 248 by 200 cell. */
	.popup-surface > :global(*) {
		grid-area: 1 / 1;
	}
	/* ThemeTransitionPage.xaml:172-175 — 200 by 200 under `HorizontalAlignment="Stretch"` and
	   `VerticalAlignment="Stretch"`. A XAML element given an explicit size under Stretch is
	   centred in the space it was allotted rather than pinned to its start, which is the rule the
	   Easing Functions page's rectangle is placed by. */
	:global(.popup-ellipse) {
		place-self: center;
		width: 200px;
		height: 200px;
	}
	/* ThemeTransitionPage.xaml:179-182 — a 200-wide StackPanel, Margin="24", vertically centred.
	   `place-self` rather than `align-self`: `:182` states only the vertical half, and the
	   horizontal half is the same explicit-size-under-Stretch centring the ellipse takes. The two
	   agree here anyway — 200 plus a 24 margin on each side is the 248 the cell is — but writing
	   `start` by omission would be writing a different rule that happens to land on the same
	   pixel. */
	.popup-content {
		width: 200px;
		margin: 24px;
		display: flex;
		flex-direction: column;
		place-self: center;
	}
	/* ThemeTransitionPage.xaml:183-189 — Margin="12", centred whole-word-wrapped text. */
	.popup-text {
		/* c1-allow: ThemeTransitionPage.xaml:186 — this TextBlock overrides the example's Consolas. */
		font-family: 'Segoe UI', sans-serif;
		margin: 12px;
		text-align: center;
		overflow-wrap: break-word;
	}
	/* ThemeTransitionPage.xaml:190-194 — the close button is horizontally centred. */
	.popup-content :global(button) {
		align-self: center;
	}
	.popup-surface[data-closing] {
		/* c1-allow: LayoutTransition_partial.cpp:2314-2320 — close scale is 167ms and opacity is
		   83ms (.h:30, :31), both on the named curves. */
		animation:
			theme-surface-out 167ms cubic-bezier(0, 0, 0, 1) forwards,
			theme-fade-out 83ms linear forwards;
	}

	/* ADR 0016, applied to this page: the sample's theme transitions are layout transitions, whose
	   registration the switch gates (LayoutTransition.cpp:219-245). So under
	   `prefers-reduced-motion` every motion here lands at its end at once. Durations and delays go
	   to zero rather than the animations to `none`, because the page listens for `animationend`,
	   which a zero-length animation still fires. `!important`, because this is one rule for every
	   animated element on the page, over rules of every weight; the two `:global` selectors are the
	   rectangles the Rectangle component renders, which this page animates. */
	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after,
		:global(.entrance-rectangle),
		:global(.reposition-subject) {
			animation-duration: 0s !important;
			animation-delay: 0s !important;
			transition-duration: 0s !important;
			transition-delay: 0s !important;
		}
	}
</style>
