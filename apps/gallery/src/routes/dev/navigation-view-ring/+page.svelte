<script lang="ts">
	import { NavigationView, type NavigationViewEntry } from '@harena-hq/winui-svelte/preview';

	/*
	 * The pane's keyboard ring: which row Tab lands on, and where the arrows, Home and End go
	 * from there.
	 *
	 * **Nothing photographs this page.** Every assertion in `navigation-view-ring.spec.ts` is
	 * about which element holds focus and whether a key was handled, and `/dev/navigation-view`
	 * carries the three tracked baselines. A frame added there pushes the later specimens down
	 * the page, which has broken untouched interaction tests in this repository before, so the
	 * ring gets a page of its own the way the template and the rail did.
	 *
	 * **One specimen per branch of the tab-stop rule**, because a rule with five branches and
	 * one specimen is one branch tested and four asserted. Four of them are frames; the fifth is
	 * a state the first frame is driven into, which is a specimen and not a frame. The rule is `tabStops` in
	 * `NavigationView.svelte`, and its branches are: a selection on screen, a selection hidden
	 * inside a collapsed subtree, no selection at all, a selection that names no row, and the
	 * settings row — which is not in `items` and so takes the same code path as the fourth and
	 * a different answer. The fifth has no frame of its own: it is reached by clicking the
	 * settings row in the first.
	 *
	 * **The rail's frame is not a sixth branch, and it is here to show that.** A rail is the
	 * same rule under a different display mode, and the test that earns the frame is the pair
	 * that holds the selection still and opens and shuts the flyout — same selection, opposite
	 * answers, both of them the walk rather than a case written for the rail.
	 */
	const items: NavigationViewEntry[] = [
		// **A header first, and that is not decoration.** Where the entry has to be the list's
		// first *row*, the code asks for the first entry that is not a header; with a row at
		// index 0 that question and "the first entry" have the same answer, and the branch is
		// asserted rather than tested. The Gallery's own shell opens with a header too.
		{ header: 'Navigate' },
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
		// A header, because the ring must step over one: it draws an `<li role="none">` and no
		// `treeitem`, so nothing in `moveRingFocus` has to know it exists — which is a claim a
		// list without one cannot test.
		{ header: 'More' },
		// **The last top-level row has children, and that is the whole reason it does.** End
		// reaches the last row of the root list's own items rather than the last row visible
		// under the list, and the two are the same element unless the last top-level row is
		// expanded. With a leaf here the assertion would pass against either rule.
		{
			id: 'all',
			content: 'All',
			glyph: 'E8A9',
			children: [
				{ id: 'recent', content: 'Recent' },
				{ id: 'archive', content: 'Archive' }
			]
		}
	];

	/** What has focus, named. The assertions then read a name rather than an element. */
	let focused = $state('nothing');

	function describe(element: Element | null): string {
		if (!element || element === document.body) return 'nothing';
		// The rail's children flyout is portalled out of the pane, so it is in no frame.
		const where = element.closest('.flyout-children')
			? 'flyout'
			: (element.closest('.frame')?.id ?? 'outside');
		const row = element.closest('[role="treeitem"]');
		if (row) {
			const label = row.querySelector(':scope > .content-presenter')?.textContent?.trim();
			const suffix = element.classList.contains('expand-chevron') ? ' / chevron' : '';
			return `${where} / ${label || '(unlabelled)'}${suffix}`;
		}
		if (element.classList.contains('pane-toggle')) return `${where} / pane toggle`;
		return `${where} / ${element.tagName.toLowerCase()}`;
	}

	$effect(() => {
		const report = () => (focused = describe(document.activeElement));
		document.addEventListener('focusin', report);
		return () => document.removeEventListener('focusin', report);
	});

	// Each frame keeps its own selection and its own expansion, because they are the inputs to
	// the branch that frame exists to show. `selected` is not bindable — this library holds the
	// selection on the consumer and reports an invoke — so a frame that should follow its rows
	// takes the invoke and writes it, and `#no-selection` deliberately takes none.
	let midSelected = $state<string | null>('design');
	let midExpanded = $state<string[]>(['design', 'all']);
	let hiddenSelected = $state<string | null>('swatches');
	let hiddenExpanded = $state<string[]>(['design']);
	let noneExpanded = $state<string[]>([]);
	let unknownExpanded = $state<string[]>([]);
	let railSelected = $state<string | null>('home');
</script>

<svelte:head><title>NavigationView keyboard ring — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">NavigationView — the pane's keyboard ring</h1>
<p class="winui-BodyTextBlockStyle">
	Tab crosses the pane in one press and lands on the selected row; the arrows move among the rows
	from there, and Home and End go to the ends of one root list.
</p>

<pre class="log" id="focused">{focused}</pre>

<h2 class="winui-SubtitleTextBlockStyle">the selection is on screen, and is not the first row</h2>
<p class="winui-BodyTextBlockStyle">
	Design is selected and expanded, and so is All at the foot. The stop is Design — not Home, and not
	either of the two rows its subtree puts on screen.
</p>
<div class="frame" id="selected-mid">
	<NavigationView
		{items}
		selected={midSelected}
		onItemInvoked={(id) => (midSelected = id)}
		bind:expandedItems={midExpanded}
		paneDisplayMode="left"
	>
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the selection is inside a collapsed subtree</h2>
<p class="winui-BodyTextBlockStyle">
	Swatches is selected and Color is shut, so the selected row is not on screen. The stop is Color —
	the deepest row on the path that every row above it is expanded through.
</p>
<div class="frame" id="selected-hidden">
	<NavigationView
		{items}
		selected={hiddenSelected}
		onItemInvoked={(id) => (hiddenSelected = id)}
		bind:expandedItems={hiddenExpanded}
		paneDisplayMode="left"
	>
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">nothing is selected</h2>
<p class="winui-BodyTextBlockStyle">
	Both of upstream's branches are guarded by the selection, so with none every row is an ordinary
	tab stop. That is the pin's own guard rather than a default chosen for it.
</p>
<div class="frame" id="no-selection">
	<NavigationView {items} selected={null} bind:expandedItems={noneExpanded} paneDisplayMode="left">
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the selection names no row</h2>
<p class="winui-BodyTextBlockStyle">
	A consumer routing by URL can be on a page under no row at all. That is not a selection —
	upstream's selection model has no index for it — so the rows are tab stops as they come, the same
	answer as no selection and for a different reason.
</p>
<div class="frame" id="selected-unknown">
	<NavigationView
		{items}
		selected="nowhere"
		bind:expandedItems={unknownExpanded}
		paneDisplayMode="left"
	>
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">the rail, and the ring inside its flyout</h2>
<p class="winui-BodyTextBlockStyle">
	A rail force-collapses its top level, so its ring is the three top-level rows and the Settings
	row. A row with children opens a flyout, whose list is a ring of its own.
</p>
<div class="frame" id="rail">
	<NavigationView
		{items}
		selected={railSelected}
		onItemInvoked={(id) => (railSelected = id)}
		paneDisplayMode="leftCompact"
	>
		<p class="winui-BodyTextBlockStyle">Content sits beside the rail.</p>
	</NavigationView>
</div>

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
