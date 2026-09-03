<script lang="ts" module>
	/** One selectable entry in the menu. */
	export interface NavigationViewItemData {
		/** Stable identity. What `selected` holds and what `onselect` reports. */
		id: string;
		/** The label. */
		content: string;
		/** A Segoe Fluent Icons code point as uppercase hex, e.g. `'E790'`. */
		glyph?: string | null;
		children?: NavigationViewItemData[];
	}

	/** A non-interactive label above a group of items. */
	export interface NavigationViewHeaderData {
		header: string;
	}

	export type NavigationViewEntry = NavigationViewItemData | NavigationViewHeaderData;

	export type NavigationViewDisplayMode = 'auto' | 'expanded' | 'compact' | 'minimal';

	/**
	 * The two shapes are disjoint on their own, so the discriminant is a field one of them
	 * has rather than a `kind` nobody writes and everybody forgets to keep true.
	 */
	export function isNavigationViewHeader(
		entry: NavigationViewEntry
	): entry is NavigationViewHeaderData {
		return 'header' in entry;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import NavigationViewItem from './NavigationViewItem.svelte';

	interface Props {
		items: NavigationViewEntry[];
		/** Controlled: the caller owns selection, because for an app it is the route. */
		selected?: string | null;
		onselect?: (id: string) => void;
		paneOpen?: boolean;
		/** An app whose title bar carries the toggle hides this one. */
		paneToggleVisible?: boolean;
		displayMode?: NavigationViewDisplayMode;
		header?: Snippet;
		paneFooter?: Snippet;
		children?: Snippet;
	}

	let {
		items,
		selected = null,
		onselect,
		paneOpen = $bindable(true),
		paneToggleVisible = true,
		displayMode = 'auto',
		header,
		paneFooter,
		children
	}: Props = $props();

	// The control's own width, not the viewport's: NavigationView measures itself, and a
	// pane inside a split screen is meant to collapse on its own account. `bind:clientWidth`
	// is Svelte's own resize binding, so no ResizeObserver and no container query.
	let width = $state(0);

	// microsoft-ui-xaml @ 79646b4e, NavigationView.idl:176 and :179 — the
	// `MUX_DEFAULT_VALUE` of `CompactModeThresholdWidth` and `ExpandedModeThresholdWidth`.
	const COMPACT_THRESHOLD = 641;
	const EXPANDED_THRESHOLD = 1008;

	const mode = $derived.by((): Exclude<NavigationViewDisplayMode, 'auto'> => {
		if (displayMode !== 'auto') return displayMode;
		// Before the first measurement `clientWidth` is 0, which is not "very narrow" but
		// "not yet known". Rendering minimal for one frame would flash the pane away on
		// every mount, so the widest mode is the one to guess with.
		if (width === 0) return 'expanded';
		if (width < COMPACT_THRESHOLD) return 'minimal';
		if (width < EXPANDED_THRESHOLD) return 'compact';
		return 'expanded';
	});

	// A plain `Set` mutated in place is not reactive in Svelte 5; `SvelteSet` is.
	const expanded = new SvelteSet<string>();

	// `paneOpen` is written in exactly one place: crossing into expanded opens the pane,
	// crossing into either narrower mode closes it, which is what NavigationView does —
	// compact is the icons-only rail, and a compact pane the user opens overlays the
	// content rather than widening the rail.
	//
	// `acted` is deliberately not `$state`. An effect that reads and writes the same
	// reactive value re-runs on its own write and undoes whatever the caller just set —
	// this repository has shipped that bug once already, in the Gallery's theme switch.
	// Keeping the last mode acted on outside the reactive graph is what makes the guard a
	// guard rather than another dependency.
	let acted: NavigationViewDisplayMode | null = null;
	$effect(() => {
		if (mode === acted) return;
		acted = mode;
		paneOpen = mode === 'expanded';
	});

	// Minimal hides the pane entirely when it is closed; the other two keep it, narrowed.
	const paneVisible = $derived(mode !== 'minimal' || paneOpen);
	// Overlaying is what makes compact and minimal different from expanded: the pane is
	// drawn above the content instead of beside it, so the content does not reflow.
	const overlay = $derived(mode !== 'expanded' && paneOpen);
	// Icons only, labels and chevrons hidden.
	const collapsed = $derived(!paneOpen && mode !== 'minimal');
</script>

<div
	bind:clientWidth={width}
	class="root"
	data-display-mode={mode}
	data-pane-open={paneOpen}
	data-overlay={overlay}
	data-collapsed={collapsed}
>
	{#if paneVisible}
		<div class="pane">
			{#if paneToggleVisible}
				<div class="button-holder-grid">
					<button
						type="button"
						class="pane-toggle"
						aria-label={paneOpen ? 'Close navigation' : 'Open navigation'}
						aria-expanded={paneOpen}
						onclick={() => (paneOpen = !paneOpen)}
					></button>
				</div>
			{/if}

			<div class="items-container-grid">
				<ul role="tree" class="menu-items">
					{#each items as entry, i (isNavigationViewHeader(entry) ? `h${i}` : entry.id)}
						{#if isNavigationViewHeader(entry)}
							<li role="none">
								<div class="item-header winui-BodyStrongTextBlockStyle">{entry.header}</div>
							</li>
						{:else}
							<NavigationViewItem item={entry} level={1} {selected} {expanded} {onselect} />
						{/if}
					{/each}
				</ul>
			</div>

			{#if paneFooter}
				<div class="footer-content-border">{@render paneFooter()}</div>
			{/if}
		</div>
	{/if}

	<div class="content-grid">
		{#if header}
			<div class="header-content">{@render header()}</div>
		{/if}
		<div class="content-presenter">
			{#if children}{@render children()}{/if}
		</div>
	</div>
</div>

<style>
	.root {
		/* `c_itemIndentation`, the inset a child menu item gets per level of depth —
		   microsoft-ui-xaml @ 79646b4e, NavigationViewItemBase.h:63, multiplied by the
		   item's depth in `NavigationViewItem::UpdateItemIndentation`. A layout constant
		   in a header rather than a theme resource, so there is no token to read it from;
		   it is not `--winui-` prefixed because that prefix means a WinUI resource key
		   unchanged, and this is not one. ADR 0006. */
		/* c1-allow: NavigationViewItemBase.h:63, c_itemIndentation — no resource names it */
		--nav-indentation: 31px;
		position: relative;
		display: flex;
		min-height: 0;
		background: var(--winui-NavigationViewContentBackground);
	}

	.pane {
		display: flex;
		flex-direction: column;
		flex: 0 0 auto;
		overflow: hidden;
		/* The pane is transparent over the window's backdrop in light and dark, and a
		   system colour under high contrast — which is why the shell paints something
		   behind it rather than leaving the page's own background to show through. */
		background: var(--winui-NavigationViewExpandedPaneBackground);
	}

	/* The open pane's width. microsoft-ui-xaml @ 79646b4e, NavigationView.idl:198 —
	   `OpenPaneLength`'s MUX_DEFAULT_VALUE. It is a property default rather than a theme
	   resource, so there is no token to read it from. */
	.root:not([data-collapsed='true']) .pane {
		/* c1-allow: NavigationView.idl:198, OpenPaneLength MUX_DEFAULT_VALUE("320.0") */
		width: 320px;
	}

	.root[data-collapsed='true'] .pane {
		width: var(--winui-NavigationViewCompactPaneLength);
	}

	/* Overlaying, not reflowing: compact and minimal draw the open pane above the content.
	   `NavigationViewDefaultPaneBackground` rather than the expanded one, because an
	   overlaid pane has the content behind it rather than the window. */
	.root[data-overlay='true'] .pane {
		position: absolute;
		inset: 0 auto 0 0;
		z-index: 1;
		background: var(--winui-NavigationViewDefaultPaneBackground);
	}

	.button-holder-grid {
		flex: 0 0 auto;
		display: flex;
		margin: var(--winui-NavigationViewButtonHolderGridMargin);
	}

	.pane-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--winui-PaneToggleButtonWidth);
		min-height: var(--winui-PaneToggleButtonHeight);
		background: var(--winui-NavigationViewItemBackground);
		color: var(--winui-NavigationViewItemForeground);
		border: 0;
		border-radius: var(--winui-ControlCornerRadius);
		cursor: pointer;
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-NavigationViewItemOnLeftIconBoxHeight);
	}

	/* GlobalNavButton, the hamburger. Written here rather than in the markup because it
	   is a picture, not text: a screen reader gets `aria-label` and should not also be
	   handed a private-use code point. */
	.pane-toggle::before {
		content: '\e700';
	}

	.pane-toggle:hover {
		background: var(--winui-NavigationViewButtonBackgroundPointerOver);
		color: var(--winui-NavigationViewButtonForegroundPointerOver);
	}

	.pane-toggle:active {
		background: var(--winui-NavigationViewButtonBackgroundPressed);
		color: var(--winui-NavigationViewButtonForegroundPressed);
	}

	.items-container-grid {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		margin: var(--winui-NavigationViewPaneContentGridMargin);
	}

	.menu-items {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* `NavigationViewItemInnerHeaderMargin` is 16 to the left and right, which puts the
	   header's text where a top-level item's icon starts — 16 from the pane's edge on the
	   reference capture, measured. The separator margin above and below is what spaces it
	   from the items on either side. */
	.item-header {
		color: var(--winui-NavigationViewItemHeaderForeground);
		margin: var(--winui-NavigationViewItemSeparatorMargin);
		padding: var(--winui-NavigationViewItemInnerHeaderMargin);
		white-space: nowrap;
	}

	/* Collapsed to icons, a header has nothing left to show and its own margins would
	   still occupy a row. */
	.root[data-collapsed='true'] .item-header {
		display: none;
	}

	.footer-content-border {
		flex: 0 0 auto;
	}

	.content-grid {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		background: var(--winui-NavigationViewContentBackground);
		border-style: solid;
		border-width: var(--winui-NavigationViewContentGridBorderThickness);
		border-color: var(--winui-NavigationViewContentGridBorderBrush);
		border-radius: var(--winui-NavigationViewContentGridCornerRadius);
		margin: var(--winui-NavigationViewContentMargin);
	}

	.root[data-display-mode='minimal'] .content-grid {
		border-width: var(--winui-NavigationViewMinimalContentGridBorderThickness);
		border-radius: var(--winui-NavigationViewMinimalContentGridCornerRadius);
		margin: var(--winui-NavigationViewMinimalContentMargin);
	}

	.header-content {
		flex: 0 0 auto;
		margin: var(--winui-NavigationViewHeaderMargin);
	}

	.root[data-display-mode='minimal'] .header-content {
		margin: var(--winui-NavigationViewMinimalHeaderMargin);
	}

	.content-presenter {
		flex: 1 1 auto;
		min-height: 0;
		padding: var(--winui-NavigationViewContentPresenterMargin);
	}

	/* Collapsed to icons. `:global` because the item is a component of its own with its
	   own scoped styles, and the state that decides this lives on the root — the
	   alternative is threading the mode through every level of the recursion as a prop
	   that only CSS reads. `display: none` rather than `visibility` or a zero width: the
	   row must not reserve the space it is not drawing. */
	.root[data-collapsed='true'] .pane :global(.item) {
		grid-template-columns: auto;
		justify-content: center;
		padding-right: 0;
		padding-left: 0;
	}

	.root[data-collapsed='true'] .pane :global(.item .content-presenter),
	.root[data-collapsed='true'] .pane :global(.item .expand-chevron) {
		display: none;
	}

	/* A collapsed pane shows top-level items only: a child's row would be
	   indistinguishable from its parent's with the label gone, and WinUI moves them into
	   a flyout, which belongs to the tranche that builds Flyout. */
	.root[data-collapsed='true'] .pane :global(.children) {
		display: none;
	}
</style>
