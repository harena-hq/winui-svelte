<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/** One selectable entry in the menu. */
	export interface NavigationViewItemData {
		/** Stable identity. What `selected` holds and what `ItemInvoked` reports. */
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

	/**
	 * The WinUI `NavigationViewDisplayMode` enum — `Minimal | Compact | Expanded` — which is
	 * the mode the control *computed*, exposed upstream as the read-only `DisplayMode`. All
	 * three members are here; the enum has no others.
	 *
	 * It is not the same enum as `NavigationViewPaneDisplayMode` below and not in the same
	 * position: this one is complete, that one had a member missing. A comment here used to
	 * claim they were one fact, and that claim is how a top pane nobody had built read as a
	 * top pane nobody needed.
	 */
	export type NavigationViewDisplayMode = 'minimal' | 'compact' | 'expanded';

	/**
	 * The WinUI `NavigationViewPaneDisplayMode` enum the consumer *sets* — `Auto | Left | Top |
	 * LeftCompact | LeftMinimal`, in `NavigationView.idl:24`'s own member order. All five are
	 * implemented.
	 */
	export type NavigationViewPaneDisplayMode =
		'auto' | 'left' | 'top' | 'leftCompact' | 'leftMinimal';

	/**
	 * The two shapes are disjoint on their own, so the discriminant is a field one of them
	 * has rather than a `kind` nobody writes and everybody forgets to keep true.
	 */
	export function isNavigationViewHeader(
		entry: NavigationViewEntry
	): entry is NavigationViewHeaderData {
		return 'header' in entry;
	}

	export interface NavigationViewProps {
		/**
		 * Narrows `MenuItemsSource` (objects that become `NavigationViewItem` elements) to
		 * plain data records identified by `id`.
		 */
		items: NavigationViewEntry[];
		/**
		 * Narrows `SelectedItem` (one of the menu's `NavigationViewItem` objects) to an
		 * `id` the consumer holds.
		 *
		 * The id `'settings'` is reserved for the row the control renders when
		 * `settingsVisible` is true. `onItemInvoked` reports it the same way it reports
		 * any other id, so a caller's own menu must not use it.
		 */
		selected?: string | null;
		/** ItemInvoked — fires when a menu row is activated. */
		onItemInvoked?: (id: string) => void;
		/** IsPaneOpen — `$bindable`. */
		paneOpen?: boolean;
		/**
		 * No WinUI member: ADR 0009 pairs every `$bindable` prop with its own
		 * `on<Prop>Change` so a consumer can observe without binding. Upstream splits the
		 * same signal four ways — `PaneOpening`, `PaneOpened`, `PaneClosing`, `PaneClosed`
		 * — and none of those is implemented. Fires on every write the control makes to
		 * `paneOpen`, and never on one the consumer makes through the binding.
		 */
		onPaneOpenChange?: (open: boolean) => void;
		/** IsPaneToggleButtonVisible — an app whose title bar carries the toggle hides this one. */
		paneToggleButtonVisible?: boolean;
		/**
		 * PaneDisplayMode — the settable mode the consumer chooses, and all five of its members
		 * are here. The read-only `DisplayMode` member and its `DisplayModeChanged` event are
		 * still not implemented, because nothing consumes them.
		 */
		paneDisplayMode?: NavigationViewPaneDisplayMode;
		/**
		 * The ids of the items whose children are shown. `$bindable`. No WinUI member:
		 * upstream holds expansion on each `NavigationViewItem` as `IsExpanded`, and this
		 * control takes data rather than elements, so the aggregate lives here. The control
		 * replaces the array with a new one on each expand/collapse; observe it through
		 * `onExpandedItemsChange` or by binding.
		 */
		expandedItems?: string[];
		/**
		 * No WinUI member, for the same reason `expandedItems` has none. Upstream signals
		 * expansion per item, as `Expanding` and `Collapsed`; this reports the aggregate.
		 */
		onExpandedItemsChange?: (ids: string[]) => void;
		/** IsSettingsVisible, whose default is likewise true. */
		settingsVisible?: boolean;
		/** Header — the slot above the content area. */
		header?: Snippet;
		/** PaneFooter — the slot at the bottom of the pane. */
		paneFooter?: Snippet;
		/** Content — the main content area. */
		children?: Snippet;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import Flyout from './Flyout.svelte';
	import NavigationViewItem from './NavigationViewItem.svelte';
	import NavigationViewTopItem from './NavigationViewTopItem.svelte';
	import ScrollView from './ScrollView.svelte';

	let {
		items,
		selected = null,
		onItemInvoked,
		paneOpen = $bindable(true),
		onPaneOpenChange,
		paneToggleButtonVisible = true,
		paneDisplayMode = 'auto',
		expandedItems = $bindable([]),
		onExpandedItemsChange,
		settingsVisible = true,
		header,
		paneFooter,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: NavigationViewProps = $props();

	// The control's own width, not the viewport's: NavigationView measures itself, and a
	// pane inside a split screen is meant to collapse on its own account. `bind:clientWidth`
	// is Svelte's own resize binding, so no ResizeObserver and no container query.
	let width = $state(0);

	// microsoft-ui-xaml @ 79646b4e, NavigationView.idl:176 and :179 — the
	// `MUX_DEFAULT_VALUE` of `CompactModeThresholdWidth` and `ExpandedModeThresholdWidth`.
	const COMPACT_THRESHOLD = 641;
	const EXPANDED_THRESHOLD = 1008;

	// `CreateAndHookEventsToSettings` — NavigationView.cpp:1319 — gives the settings item an
	// `AnimatedIcon` whose fallback is a `SymbolIconSource` set to `Symbol::Setting`. The
	// Gallery's own icon catalogue lists that symbol as `Settings`, E713. WD-006 records that
	// we render the fallback and never the animation.
	//
	// The label is the localized `SettingsButtonName`, which
	// `NavigationView/Strings/en-us/Resources.resw` gives as "Settings".
	const SETTINGS_ITEM: NavigationViewItemData = {
		id: 'settings',
		content: 'Settings',
		glyph: 'E713'
	};
	// The same item on the top pane, with no content. That is not a shortcut for hiding the
	// label: an empty content is what enters the presenter's `IconOnly` state
	// (`NavigationView_themeresources.xaml:791`), which is what sizes the button 36 rather than
	// 44 — the size the reference render shows and `MUX_NavigationViewSettingsItemStyleWhenOnTopPane`
	// does not. The label survives as the tooltip, which is where upstream puts it too
	// (`UpdateSettingsItemToolTip`, NavigationView.cpp:1921).
	const SETTINGS_ITEM_TOP: NavigationViewItemData = { id: 'settings', content: '', glyph: 'E713' };

	// `TopNavigationViewOverflowButtonWidth` — NavigationView_themeresources.xaml:213. A number
	// rather than the custom property because it is subtracted from a `clientWidth`, and the
	// token is a string the layout engine owns rather than one this can do arithmetic on.
	const OVERFLOW_BUTTON_WIDTH = 40;
	const overflowFlyoutStyle =
		'--winui-FlyoutContentPadding: var(--winui-TopNavigationViewOverflowMenuPadding);';

	const isTop = $derived(paneDisplayMode === 'top');

	const mode = $derived.by((): NavigationViewDisplayMode => {
		// Minimal, and not a fourth value: `UpdateVisualStateForDisplayModeGroup` —
		// NavigationView.cpp:2674-2682 — computes the display mode first and only then, because
		// `IsTopNavigationView()`, goes to `TopNavigationMinimal` instead of `Minimal`. So in top
		// mode WinUI's own computed `DisplayMode` is Minimal, which is also why the top pane
		// always draws the rule `TopNavigationMinimal` sets under it rather than only when narrow.
		if (isTop) return 'minimal';
		if (paneDisplayMode === 'left') return 'expanded';
		if (paneDisplayMode === 'leftCompact') return 'compact';
		if (paneDisplayMode === 'leftMinimal') return 'minimal';
		// 'auto' — measure.
		// Before the first measurement `clientWidth` is 0, which is not "very narrow" but
		// "not yet known". Rendering minimal for one frame would flash the pane away on
		// every mount, so the widest mode is the one to guess with.
		if (width === 0) return 'expanded';
		if (width < COMPACT_THRESHOLD) return 'minimal';
		if (width < EXPANDED_THRESHOLD) return 'compact';
		return 'expanded';
	});

	// Every write the control makes to `paneOpen` goes through this. The equality guard is
	// not optional: the display-mode effect below runs on mount and would otherwise
	// announce a change that did not happen. Consumer writes via `bind:paneOpen` bypass
	// this on purpose — a binding round-trip is a write the consumer made, not one the
	// control made.
	function setPaneOpen(open: boolean) {
		if (paneOpen === open) return;
		paneOpen = open;
		onPaneOpenChange?.(open);
	}

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
		setPaneOpen(mode === 'expanded');
	});

	// A `VisualTransition` runs when a state changes, and the first state a control is put into
	// is not a change — upstream's pane does not animate onto the screen when the page opens.
	// Here it did, and for a reason worth naming: the effect above settles `paneOpen` against a
	// `mode` that is measured from the rendered width, so the first thing the browser sees after
	// hydration is an attribute changing, which is exactly what a CSS transition listens for.
	// Measured before this guard: three panes on the harness animated on load, the rail's clip
	// over 120ms and two overlay panes over 120 and 350.
	//
	// Two frames rather than one. The width arrives through `bind:clientWidth`, so `mode` can
	// settle on the frame after the first paint, and a flag raised one frame earlier would let
	// that settling animate — which is the same defect one frame later.
	let settled = $state(false);
	$effect(() => {
		const outer = requestAnimationFrame(() => {
			const inner = requestAnimationFrame(() => {
				settled = true;
			});
			frame = inner;
		});
		let frame = outer;
		return () => cancelAnimationFrame(frame);
	});

	// Every write the control makes to `expandedItems` goes through this. A new array
	// every time, never a mutation of the one the consumer holds — that is what makes the
	// binding two-way and `onExpandedItemsChange` observable. `NavigationViewItem` calls
	// it from `activate()` and `toggle()`; it does not touch the array itself.
	function setExpanded(id: string, open: boolean) {
		const present = expandedItems.includes(id);
		// Both branches return the same array when there is nothing to do. `filter` builds a
		// new one unconditionally, so without the `present` test collapsing an id that was
		// never expanded would pass the identity guard below and announce a change that did
		// not happen.
		const next = open
			? present
				? expandedItems
				: [...expandedItems, id]
			: present
				? expandedItems.filter((x) => x !== id)
				: expandedItems;
		if (next === expandedItems) return;
		expandedItems = next;
		onExpandedItemsChange?.(next);
	}

	// `UpdatePaneLayout` shows the pane's separator when the menu scrolls. ScrollView observes
	// both its viewport and content, so its published scrollable height answers that directly.
	let paneScrollableHeight = $state(0);
	let menuOverflows = $derived(paneScrollableHeight > 0);

	// Overlaying is what makes compact and minimal different from expanded: the pane is
	// drawn above the content instead of beside it, so the content does not reflow.
	const overlay = $derived(mode !== 'expanded' && paneOpen);
	// Icons only, labels and chevrons hidden.
	const collapsed = $derived(!paneOpen && mode !== 'minimal');
	// The row is measured against two boxes, and **not** against the box the items sit in.
	// `.top-items` is content-sized, so hiding an item narrows it — measuring there would feed
	// the decision back into its own input and the row would collapse one item per frame until
	// only the selected one was left. `.top-nav-grid` is the row, and `.top-trailing` holds the
	// footer and the settings button; neither changes when an item moves into the flyout, so
	// the width the items may occupy is a fixed point rather than a fixed point to be reached.
	let topGrid: HTMLElement | undefined = $state();
	let topTrailing: HTMLElement | undefined = $state();
	let topItemElements: HTMLElement[] = [];
	let overflowFrom = $state(Number.POSITIVE_INFINITY);
	let topOverflowOpen = $state(false);
	const selectedIndex = $derived(
		items.findIndex((entry) => !isNavigationViewHeader(entry) && entry.id === selected)
	);
	const overflowing = $derived(Number.isFinite(overflowFrom));
	const isOverflowed = (index: number) => index >= overflowFrom && index !== selectedIndex;
	const overflowItems = $derived(
		items.filter(
			(entry, index) => !isNavigationViewHeader(entry) && isOverflowed(index)
		) as NavigationViewItemData[]
	);

	function recomputeTopOverflow() {
		if (!isTop || items.length < 2 || !topGrid) {
			overflowFrom = Number.POSITIVE_INFINITY;
			return;
		}
		// `ArrangeTopNavItems` — NavigationView.cpp:3738-3751 — measures the row with the
		// overflow button hidden and only then, if it does not fit, makes the button visible,
		// measures again and shrinks. Two passes, which is also why showing the button cannot
		// decide whether to show the button.
		const room = topGrid.clientWidth - (topTrailing?.offsetWidth ?? 0);
		const widths = topItemElements.map((element) => element?.offsetWidth ?? 0);
		if (widths.reduce((total, itemWidth) => total + itemWidth, 0) <= room) {
			overflowFrom = Number.POSITIVE_INFINITY;
			return;
		}
		// `FindMovableItemsBeyondAvailableWidth` — NavigationView.cpp:4019-4059 — accumulates
		// the primary list's widths front to back and moves everything from the first overrun
		// on. It never counts the selected item, which is what keeps a selected entry on the
		// row when the window narrows rather than hiding the one the user is looking at.
		//
		// Not counting it also leaves the row over budget by exactly that item's width, and
		// upstream pays for that with a second pass: `ShrinkTopNavigationSize` — :3922-3952 —
		// re-measures and calls `FindMovableItemsToBeRemovedFromPrimaryList` for the residue.
		// Charging the selected item's width to the budget before the walk reaches the same
		// state in one pass, and it was a measurement that said so: with the two passes
		// collapsed into one and the charge missing, a 412-wide strip kept three 130-wide items
		// in 332 pixels and clipped the third against the overflow button.
		const selectedWidth =
			selectedIndex >= 0 ? (topItemElements[selectedIndex]?.offsetWidth ?? 0) : 0;
		const available = room - OVERFLOW_BUTTON_WIDTH - selectedWidth;
		let required = 0;
		let next = Number.POSITIVE_INFINITY;
		for (let index = 0; index < items.length; index++) {
			if (index === selectedIndex) continue;
			if (required + (widths[index] ?? 0) > available) {
				next = index;
				break;
			}
			required += widths[index] ?? 0;
		}
		// `KeepAtLeastOneItemInPrimaryList` — NavigationView.cpp:4062. With nothing selected the
		// walk can reach index 0, and a row with no items at all is not a state WinUI enters.
		if (next === 0 && selectedIndex < 0) next = 1;
		overflowFrom = next;
	}

	$effect(() => {
		// Reading each label is what makes a relabelled entry re-measure: the array reference
		// alone does not change when a consumer edits one record in place.
		items.forEach((entry) => void (isNavigationViewHeader(entry) ? entry.header : entry.content));
		const grid = topGrid;
		if (!grid) return;
		// The `<li>` a `NavigationViewTopItem` renders belongs to that component, so there is no
		// `bind:this` to collect the way `BreadcrumbBar` collects its own crumbs. The list is
		// keyed and its rows are never removed — an overflowed one is hidden, not unmounted —
		// so one query per change of `items` is enough.
		topItemElements = Array.from(grid.querySelectorAll<HTMLElement>('.top-items > .top-list > li'));
		recomputeTopOverflow();
		const observer = new ResizeObserver(recomputeTopOverflow);
		observer.observe(grid);
		if (topTrailing) observer.observe(topTrailing);
		return () => observer.disconnect();
	});
</script>

<div
	bind:this={ref}
	bind:clientWidth={width}
	class={['root', className]}
	{style}
	data-display-mode={mode}
	data-pane-open={paneOpen}
	data-overlay={overlay}
	data-collapsed={collapsed}
	data-pane-display-mode={paneDisplayMode}
	data-settled={settled || undefined}
	{...rest}
>
	<!-- NavigationView.xaml:180 — PaneToggleButtonGrid is a child of RootGrid, not of the pane,
	     with HorizontalAlignment="Left" VerticalAlignment="Top" Canvas.ZIndex="100". Nothing about
	     the pane's visibility reaches it, which is why a closed minimal pane still has a way to be
	     opened. The two conditions that do reach it are NavigationView.cpp:4398's
	     `IsPaneToggleButtonVisible() && !IsTopNavigationView()`. -->
	{#if !isTop && paneToggleButtonVisible}
		<div class="button-holder-grid">
			<button
				type="button"
				class="pane-toggle"
				aria-label={paneOpen ? 'Close navigation' : 'Open navigation'}
				aria-expanded={paneOpen}
				onclick={() => setPaneOpen(!paneOpen)}
			></button>
		</div>
	{/if}
	{#if !isTop}
		<!-- `ShadowCaster`, NavigationView.xaml:409 — see the rule. Written before the pane
		     rather than after the SplitView, which is where upstream puts it; the rule says what
		     that costs. -->
		<div class="shadow-caster" aria-hidden="true"></div>
		<!-- Rendered in every left shape, including the minimal one where it is not shown.
		     `PaneRoot` is a template part with a `Visibility`, not a part that comes and goes:
		     `Closed` leaves it at the template's `Collapsed` (SplitView_themeresources.xaml:700)
		     and every other state sets it `Visible`, and the `Closed → Open*` transitions set it
		     visible at key time zero so the pane is on screen for the whole of the animation
		     that brings it in. An element added on open and removed on close has nothing to
		     animate in either direction, which is what this was. Hidden by `visibility` below,
		     so it is out of the tab order and out of the accessibility tree while closed. -->
		<div class="pane">
			<div class="pane-content-grid">
				<!-- NavigationView.xaml:296, PaneContentGridToggleButtonRow. The button is
					     anchored to the root below, the way upstream anchors PaneToggleButtonGrid
					     to RootGrid; this row is the space upstream keeps for it inside the pane,
					     and it is what stops the menu from moving up when the button leaves. -->
				{#if paneToggleButtonVisible}
					<div class="toggle-button-row" aria-hidden="true"></div>
				{/if}

				<!-- This pane region is now a ScrollView; horizontal scrolling remains disabled. -->
				<ScrollView
					class="items-container-grid"
					style="flex: 1 1 auto; min-height: 0"
					horizontalScrollMode="disabled"
					bind:scrollableHeight={paneScrollableHeight}
				>
					<ul role="tree" class="menu-items">
						{#each items as entry, i (isNavigationViewHeader(entry) ? `h${i}` : entry.id)}
							{#if isNavigationViewHeader(entry)}
								<li role="none">
									<div class="item-header winui-BodyStrongTextBlockStyle">{entry.header}</div>
								</li>
							{:else}
								<NavigationViewItem
									item={entry}
									level={1}
									{selected}
									{expandedItems}
									{setExpanded}
									{onItemInvoked}
									{collapsed}
								/>
							{/if}
						{/each}
					</ul>
				</ScrollView>

				{#if menuOverflows}
					<div class="items-separator"></div>
				{/if}

				<!-- Always in the grid, as `FooterContentBorder` is — NavigationView.xaml:377.
				     Empty it is 4 pixels of bottom margin, and those 4 are part of the space
				     the footer sits in whether or not an app fills the slot. -->
				<div class="footer-content-border">
					{#if paneFooter}{@render paneFooter()}{/if}
				</div>

				{#if settingsVisible}
					<div class="footer-items">
						<ul role="tree" class="menu-items">
							<NavigationViewItem
								item={SETTINGS_ITEM}
								level={1}
								{selected}
								{expandedItems}
								{setExpanded}
								{onItemInvoked}
								{collapsed}
							/>
						</ul>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="top-pane">
			<!-- BackButtonPlaceholderOnTopNav is zero in BackButtonCollapsed; this library has no back-button prop. -->
			<div class="top-nav-grid" bind:this={topGrid}>
				<div class="top-items">
					<ul role="tree" class="top-list">
						{#each items as entry, index (isNavigationViewHeader(entry) ? `h${index}` : entry.id)}
							{#if isNavigationViewHeader(entry)}
								<li role="none" data-overflowed={isOverflowed(index) || undefined}>
									<div class="top-header winui-BodyStrongTextBlockStyle">{entry.header}</div>
								</li>
							{:else}
								<!-- WD-025: top-pane children are not drawn; see docs/divergences.md -->
								<NavigationViewTopItem
									item={entry}
									{selected}
									{onItemInvoked}
									placement="primary"
									overflowed={isOverflowed(index)}
								/>
							{/if}
						{/each}
					</ul>
				</div>
				{#if overflowing}
					<Flyout
						bind:open={topOverflowOpen}
						placement="bottomEdgeAlignedRight"
						style={overflowFlyoutStyle}
						content={overflowRows}
					>
						{#snippet children(props)}<button
								{...props}
								type="button"
								class="overflow-button"
								aria-label="More"
							></button>{/snippet}
					</Flyout>
				{/if}
				<div class="top-spacer"></div>
				<!-- `PaneFooterOnTopPane` and `TopFooterMenuItemsHost` — NavigationView.xaml:278
				     and :280 — are two columns; they share one box here because what the
				     overflow measurement needs is the width of everything trailing the items,
				     and one box is one `offsetWidth`. -->
				<div class="top-trailing" bind:this={topTrailing}>
					{#if paneFooter}<div class="top-footer">{@render paneFooter()}</div>{/if}
					{#if settingsVisible}
						<ul role="tree" class="top-list">
							<NavigationViewTopItem
								item={SETTINGS_ITEM_TOP}
								{selected}
								{onItemInvoked}
								placement="primary"
								tooltip="Settings"
							/>
						</ul>
					{/if}
				</div>
			</div>
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

	<!-- `LightDismissLayer`, SplitView_themeresources.xaml:723 — a `Fill="Transparent"` rectangle
	     over the SplitView's content that every `Open*Overlay*` state makes visible (`:571`,
	     `:650`, `:678`). Tapping it closes the pane, and that reaches this control because
	     `RootSplitView.IsPaneOpen` is two-way bound to `IsPaneOpen` (NavigationView.xaml:289),
	     which `NavigationView.cpp:1702` says in as many words. The condition is
	     `NavigationView::IsLightDismissible` (`:1842`) — the SplitView's `DisplayMode` neither
	     `Inline` nor `CompactInline` — which, taken with an open pane, is what `overlay` already
	     is here.

	     There is no scrim, and that is upstream's answer rather than a simplification: the fill
	     only becomes `SplitViewLightDismissOverlayBackground` in the `OverlayVisible` state
	     (`:688`), which `LightDismissOverlayMode` selects, and its default `Auto` resolves to off
	     everywhere but Xbox. `SplitView.svelte` carries the same layer for the same part.

	     **It goes after the content, which is where the template puts it** — the last child of
	     `ContentRoot`, after the `Border` carrying `Content` (`:718-723`). That order is the
	     whole mechanism and it is not decoration: a positioned element with `z-index: auto`
	     paints in tree order, so a layer written before the content loses to anything in the
	     content that is positioned. Measured on the Gallery's own shell, where
	     `ScrollView`'s `.scroll-view.page` is `position: relative` and took every tap: the layer
	     was there, covered the point, and `elementFromPoint` returned the page.

	     The pane is above this (its `z-index: 1`, which beats `auto` whatever the order) and so
	     is the toggle button (`:100`), so neither dismisses by being clicked.

	     What this does not reproduce is the cancellable half:
	     `AttemptClosePaneLightly` (`:1707`) raises `PaneClosing` and honours its `Cancel`, and
	     ADR 0009's change callbacks have no equivalent — the same gap `SplitView.svelte` records.
	     Its other three callers are `GamepadView`, `XButton1` and Alt+Left (`:3112`, `:3132`);
	     the first two are not web inputs and the third is the browser's own Back. -->
	{#if overlay}
		<div class="light-dismiss" onclick={() => setPaneOpen(false)} aria-hidden="true"></div>
	{/if}
</div>

{#snippet overflowRows()}
	<!-- Headers have no overflow presenter style in the pin, so an overflowed header is dropped. -->
	<ul role="tree" class="overflow-list">
		{#each overflowItems as item (item.id)}
			<NavigationViewTopItem
				{item}
				{selected}
				placement="overflow"
				onItemInvoked={(id) => {
					onItemInvoked?.(id);
					topOverflowOpen = false;
				}}
			/>
		{/each}
	</ul>
{/snippet}

<style>
	.root {
		flex: 1 1 auto;
		/* `c_itemIndentation`, the inset a child menu item gets per level of depth —
		   microsoft-ui-xaml @ 79646b4e, NavigationViewItemBase.h:63, multiplied by the
		   item's depth in `NavigationViewItem::UpdateItemIndentation`. A layout constant
		   in a header rather than a theme resource, so there is no token to read it from;
		   it is not `--winui-` prefixed because that prefix means a WinUI resource key
		   unchanged, and this is not one. ADR 0006. */
		/* c1-allow: NavigationViewItemBase.h:63, c_itemIndentation — no resource names it */
		--nav-indentation: 31px;
		/* `OpenPaneLength`'s default. microsoft-ui-xaml @ 79646b4e, NavigationView.idl:198 — a
		   property default rather than a theme resource, so there is no token to read it from,
		   and not `--winui-` prefixed for the reason above. A custom property rather than three
		   copies of the number, because the rules that reserve the pane's strip subtract it. */
		/* c1-allow: NavigationView.idl:198, OpenPaneLength MUX_DEFAULT_VALUE("320.0") */
		--nav-open-pane-length: 320px;
		/* How far outside its own box the pane's clip is held on the edges it is not cutting at.
		   Upstream needs no such thing: `PaneClipRectangle` is a rectangle geometry the size of
		   `PaneRoot` (SplitView_themeresources.xaml:705), and a clip that coincides with the box
		   it is on is a clip that does nothing.

		   Here it is not nothing, twice over. `inset(0)` erases an outer `box-shadow` — measured,
		   and the reason `ShadowCaster` below is its own element. And with the shadow gone it
		   still softens the pane's own edge, because a clip at the border box antialiases the
		   boundary it lands on and the pane's top is at a fractional offset: measured on the
		   reference lane, the pane's top scanline moved by as much as 105 levels in high
		   contrast, over three specimens, where the same render at `-16px` is byte-identical to
		   the one before this clip existed. **`pnpm gate` cannot see it** — pixelmatch reads a
		   one-row change at a box edge as an anti-aliased edge and discards it, so all three
		   themes passed while the render had changed.

		   Any positive length does the job, because the pane paints nothing outside its border
		   box. Sixteen is where the number came from — `PaneOverlayShadowDepth`
		   (NavigationView_themeresources.xaml:207), the depth `--winui-PaneShadow` is built
		   from, which bounded the shadow this clip used to cut. It is kept as a clearance rather
		   than re-derived, because a clearance that was right for a 5.333px blur is comfortably
		   right for nothing at all. */
		/* c1-allow: NavigationView_themeresources.xaml:207, PaneOverlayShadowDepth */
		--nav-pane-clip-outset: 16px;
		position: relative;
		display: flex;
		min-height: 0;
	}

	.root[data-pane-display-mode='top'] {
		flex-direction: column;
	}
	/* `TopNavArea` — NavigationView.xaml:212. The transparent background shows what is behind it. */
	.top-pane {
		flex: 0 0 auto;
		background: var(--winui-NavigationViewTopPaneBackground);
	}
	/* `TopNavGrid` — NavigationView.xaml:214. */
	.top-nav-grid {
		display: flex;
		align-items: stretch;
		height: var(--winui-NavigationViewTopPaneHeight);
		margin: var(--winui-TopNavigationViewTopNavGridMargin);
	}
	/* `TopNavMenuItemsHost` — NavigationView.xaml:232 — sits in an `Auto` column, so the box is
	   the visible items' width and the `*` column beside it takes the slack. The `ScrollViewer`
	   around the repeater at :230 has both scroll modes `Disabled` with its bars hidden, so it
	   clips and never scrolls. */
	.top-items {
		flex: 0 1 auto;
		min-width: 0;
		overflow: hidden;
	}
	.top-list {
		display: flex;
		height: 100%;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	/* The `*` column at NavigationView.xaml:221, which is what pushes the footer group to the
	   right of the row. */
	.top-spacer {
		flex: 1 1 auto;
		min-width: 0;
	}

	.top-trailing {
		display: flex;
		align-items: stretch;
		flex: none;
	}

	.top-footer {
		display: flex;
		align-items: center;
	}
	/* NavigationView.xaml:557-564. */
	.top-header {
		display: flex;
		align-items: center;
		height: 40px;
		margin: var(--winui-TopNavigationViewItemInnerHeaderMargin);
	}
	/* An item that has moved into the flyout stays mounted, because the next measurement needs
	   its width. `display: none` would report 0 and the row would then decide it fits, put it
	   back, and take it out again. `visibility: hidden` keeps the box measurable and takes the
	   row out of the tab order; `position: absolute` takes it out of the flow. */
	.top-list > :global([data-overflowed='true']) {
		visibility: hidden;
		position: absolute;
		pointer-events: none;
	}
	/* `NavigationViewOverflowButtonStyleWhenPaneOnTop` — NavigationView_themeresources.xaml:348.
	   It has neither border nor rounded corners, and that is not an omission here: the Style
	   sets `BorderBrush` and `BorderThickness` and sets no `CornerRadius`, while its `RootGrid`
	   at :362 binds only `Height`, `Width` and `Background`. Unit 2's lesson — a `Style` setter
	   is not layout until some element in the template binds it. */
	.overflow-button {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: none;
		align-self: center;
		width: var(--winui-TopNavigationViewOverflowButtonWidth);
		height: var(--winui-TopNavigationViewOverflowButtonHeight);
		margin: var(--winui-TopNavigationViewOverflowButtonMargin);
		background: var(--winui-NavigationViewItemBackground);
		color: var(--winui-TopNavigationViewItemForeground);
		border: 0;
		cursor: pointer;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: NavigationView_themeresources.xaml:388, the FontIcon's FontSize="16" */
		font-size: 16px;
		line-height: normal;
		/* The user agent's own ':focus-visible' ring is a second one; see Button.svelte. */
		outline: none;
	}

	/* `More`, the glyph the FontIcon at :388 draws. Written here rather than in the markup
	   because it is a picture, not text: the button already carries an `aria-label`. */
	.overflow-button::before {
		content: '\e712';
	}
	.overflow-button:hover {
		background: var(--winui-TopNavigationViewItemBackgroundPointerOver);
		color: var(--winui-TopNavigationViewItemForegroundPointerOver);
	}
	.overflow-button:active {
		background: var(--winui-TopNavigationViewItemBackgroundPressed);
		color: var(--winui-TopNavigationViewItemForegroundPressed);
	}
	.overflow-button:focus-visible::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}
	.overflow-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.pane {
		display: flex;
		flex-direction: column;
		flex: 0 0 auto;
		overflow: hidden;
		/* `PaneRoot.Width` is `OpenPaneLength`, and a XAML width includes the border the rule
		   below adds — the same reason `.content-presenter` carries this line. Without it the
		   open pane would be 322 where the resource says 320. */
		box-sizing: border-box;
		/* The containing block for `HCPaneBorder` below. An overlaying pane is positioned
		   already; this is what covers the other display modes. */
		position: relative;
		/* `RootSplitView.PaneBackground`, NavigationView.xaml:289. An overlaying pane is
		   drawn on top of the content, so it is opaque; a pane sitting beside the content
		   is transparent and shows the window's backdrop. `AcrylicInAppFillColorDefaultBrush`
		   is an `AcrylicBrush` in light and dark (AcrylicBrush_themeresources.xaml:44, :96)
		   and a `SolidColorBrush` only in high contrast (:148) — what reaches this line is its
		   `FallbackColor`, which is WD-002 and not a property of this control. */
		background: var(--winui-NavigationViewDefaultPaneBackground);
		/* `RootSplitView.CornerRadius`, NavigationView.xaml:289 — `OverlayCornerRadius` through
		   `RightCornerRadiusFilterConverter`, which is `Filter="Right"`
		   (CornerRadius_themeresources.xaml:18), so the top-right and bottom-right corners and
		   not the other two. The binding sits on the SplitView and reads as though it rounded
		   the whole control; the SplitView's own template is what settles it, handing the value
		   to `PaneRoot` alone (SplitView_themeresources.xaml:700, `CornerRadius="{TemplateBinding
		   CornerRadius}"`). So it is the pane that is rounded, in every display mode, which is
		   why this sits on `.pane` rather than under `data-overlay` with the shadow. A SplitView
		   is square by default — its style takes `SplitViewPaneRootCornerRadius` (:47), which is
		   0 (:13) — so this radius is NavigationView's override and not the primitive's own.

		   It shows only where the pane is opaque. Beside the content the pane paints
		   `NavigationViewExpandedPaneBackground`, which is a transparent colour in light and
		   dark and `SystemColorWindowColor` in high contrast
		   (NavigationView_themeresources.xaml:6, :72, :138) — so of the three themes, only high
		   contrast can show a corner here while the pane is not overlaying. */
		border-radius: 0 var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0;
		/* `RootSplitView.BorderThickness`, the same line, reaching `PaneRoot` the same way. It is
		   transparent while the pane is beside the content (`PaneNotOverlaying` sets
		   `RootSplitView.BorderBrush` to `Transparent`, NavigationView.xaml:127) and takes its
		   space in every mode either way, which is why the thickness is here and only the colour
		   is under `data-overlay`.

		   `NavigationViewPaneContentGridMargin` is the evidence that it belongs here: the pane
		   content grid's margin is `-1,3`, and a -1 with no border to cancel pushes the menu a
		   pixel past the pane's own edge, where the `overflow: hidden` above cuts it. That
		   margin has been transcribed since the Navigation tranche; the border it was written
		   against had not been. */
		border: var(--winui-NavigationViewBorderThickness) solid transparent;
	}

	/* NavigationView.xaml:129, a setter of the `PaneNotOverlaying` visual state. `data-overlay` is
	   already that distinction: it is true exactly when the pane is drawn above the
	   content rather than beside it. */
	.root:not([data-overlay='true']) .pane {
		background: var(--winui-NavigationViewExpandedPaneBackground);
	}

	/* `HCPaneBorder`, SplitView_themeresources.xaml:715 — a 1px rectangle right-aligned inside
	   `PaneRoot`, beside the pane's own border rather than instead of it. Every `Open*` state
	   makes it visible (`:563`, `:595`, `:635` and their right-placed twins) and `Closed` and
	   the two `ClosedCompact*` ones leave it collapsed, so what it tracks is `IsPaneOpen` and
	   not the display mode — which is why this is keyed on `data-pane-open` and not on
	   `data-overlay` like the shadow. Its fill is `SystemControlForegroundTransparentBrush`:
	   transparent in light and dark, `SystemColorButtonTextColor` in high contrast, so the seam
	   is in the markup in all three themes and drawn in one. `SplitView.svelte` carries the
	   same part for the same reason. */
	.pane::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		/* c1-allow: SplitView_themeresources.xaml:715, HCPaneBorder Width="1" */
		width: 1px;
		background: var(--winui-SystemControlForegroundTransparentBrush);
		visibility: hidden;
	}

	.root[data-pane-open='true'] .pane::after {
		visibility: visible;
	}

	/* `PaneRoot.Width` is `OpenPaneLength` in every state — `SplitView_themeresources.xaml:700`
	   binds it once and no visual state overrides it. A rail is not a narrower pane: it is this
	   pane, clipped. `PaneClipRectangle` (`:706`) is the clip and `PaneClipRectangleTransform`
	   is what the open and close transitions move, which is the whole reason the width lives
	   here and the narrowing does not. */
	.pane {
		width: var(--nav-open-pane-length);
	}

	/* `ListSizeCompact` (NavigationView.xaml:303) narrows `PaneContentGrid`, not `PaneRoot`.
	   Transcribing that width onto the pane put it on the wrong box: it gave the same rail at
	   rest, and it left the control with no clip to animate and with the pane's own right edge
	   — its border, and `HCPaneBorder` — drawn at the rail's edge where the template clips both
	   away. */
	.root[data-collapsed='true'] .pane-content-grid {
		width: var(--winui-NavigationViewCompactPaneLength);
	}

	/* `PaneClipRectangle` and `PaneTransform`, the two things the open and close transitions
	   move, and the two states they move between. Every open shape shows the whole pane where it
	   sits; the closed ones differ, and the difference is the point:

	   a closed rail shows `CompactPaneLength` of it and the pane does not move — the compact
	   transitions drive `PaneClipRectangleTransform` and nothing else (`:111`, `:229`), so the
	   rail widens in place;

	   a closed minimal pane is gone, and gets there by moving — the minimal transitions drive
	   `PaneTransform` by `NegativeOpenPaneLength` *and* the clip by `OpenPaneLength` (`:55`,
	   `:177`), so it slides off to the left rather than narrowing to nothing.

	   The base state is the open one, which is also what expanded holds. Both properties are
	   written as `inset()` on every branch because a transition needs two values of one kind:
	   `clip-path: none` and an `inset()` do not interpolate, they cut. Every edge the clip is not
	   cutting at is held `--nav-pane-clip-outset` outside the box rather than on it — see that
	   property for what a clip lying on the border box does to the edge it lands on. */
	.pane {
		translate: 0 0;
		clip-path: inset(calc(-1 * var(--nav-pane-clip-outset)));
		visibility: visible;
	}

	.root[data-collapsed='true'] .pane {
		clip-path: inset(
			calc(-1 * var(--nav-pane-clip-outset))
				calc(var(--nav-open-pane-length) - var(--winui-NavigationViewCompactPaneLength))
				calc(-1 * var(--nav-pane-clip-outset)) calc(-1 * var(--nav-pane-clip-outset))
		);
	}

	/* `Closed` leaves `PaneRoot` at the template's `Collapsed` (`:700`). `visibility` is in the
	   transition list with the other two so that it flips at the end of a close and at the start
	   of an open, which is what the storyboards do by setting it visible at key time zero. */
	.root[data-display-mode='minimal']:not([data-pane-open='true']) .pane {
		translate: calc(-1 * var(--nav-open-pane-length)) 0;
		clip-path: inset(
			calc(-1 * var(--nav-pane-clip-outset)) 0 calc(-1 * var(--nav-pane-clip-outset))
				var(--nav-open-pane-length)
		);
		visibility: hidden;
	}

	/* The durations, and the one thing this encoding cannot carry. Upstream names sixteen
	   transitions by the pair of states they run between; CSS can only see the state being
	   entered, so each rule below is a target and the duration is whichever transition most
	   often arrives there. The overlay pair is 0:0:0.35 in and 0:0:0.12 out on
	   `0.1,0.9 0.2,1.0`, written as literals in the transitions themselves (`:55`, `:111`,
	   `:177`, `:229`). The close is the base and the open states replace it — the same
	   resolution `SplitView.svelte` reached for the same reason.

	   What it costs: a window narrowing from expanded to a rail is `OpenInlineLeft →
	   ClosedCompactLeft` (`:382`), which drives the clip over
	   `SplitViewPaneAnimationOpenDuration` — 200ms. It arrives at the same closed-rail state
	   that a pane closing from an overlay arrives at, which is 120ms, and the rail's own state
	   cannot hold both, so the resize takes the overlay number. Eighty milliseconds on a
	   transition nothing drives deliberately, written here rather than left for a reader to
	   find.

	   That number was 20 in this comment and in `4cba9b2`'s body until this commit, from reading
	   `SplitViewPaneAnimationCloseDuration`'s 0.1s out of the resource table and attaching it to
	   a transition that names a different resource. Citing `:382` was not enough; the duration a
	   transition runs at is in the transition. */
	.pane {
		/* c1-allow: SplitView_themeresources.xaml:177, :229 — overlay close duration and spline */
		transition:
			translate 120ms cubic-bezier(0.1, 0.9, 0.2, 1),
			clip-path 120ms cubic-bezier(0.1, 0.9, 0.2, 1),
			visibility 120ms;
	}

	.root[data-pane-open='true'][data-display-mode='compact'] .pane,
	.root[data-pane-open='true'][data-display-mode='minimal'] .pane {
		/* c1-allow: SplitView_themeresources.xaml:55, :111 — overlay open duration */
		transition-duration: 350ms;
	}

	/* Expanded is the inline shape, and its durations are resources rather than literals.

	   It is not always open, which this comment used to say and `c67f2df` corrected one rule
	   below without correcting it here: the expanded shape moves between `OpenInlineLeft` and
	   `ClosedCompactLeft` (`:355`, `:382`), and one resource covers both directions — the clip
	   over `SplitViewPaneAnimationOpenDuration` either way.

	   `margin-inline-end` is in the list and is the `ContentTransform` this control had no
	   answer for. The template jumps `ColumnDefinition1` at key time zero and glides
	   `ContentRoot` back from `OpenPaneLengthMinusCompactLength`, so the content moves smoothly
	   while the column moves at once; here the column *is* that margin, and transitioning it
	   moves the content for the same reason `SplitView.svelte` transitions its track. Only the
	   expanded rules list it, because it is the only shape whose margin has two values —
	   compact holds `CompactPaneGridLength` open and closed alike, and minimal reserves nothing
	   in either.

	   Its duration is `SplitViewPaneAnimationOpenPreDuration`, which is 0.19999 against the
	   open duration's 0.2. Ten microseconds is not a stagger anyone sees; it is upstream
	   ordering the two so the content's animation is the one that finishes first. Reproduced
	   because it is what the template says, and noted because a reader who finds a five-decimal
	   duration deserves to be told it is a tie-break rather than a typo. */
	.root[data-display-mode='expanded'] .pane {
		transition:
			translate var(--winui-SplitViewPaneAnimationOpenDuration) cubic-bezier(0, 0.35, 0.15, 1),
			clip-path var(--winui-SplitViewPaneAnimationOpenDuration) cubic-bezier(0, 0.35, 0.15, 1),
			/* c1-allow: SplitView_themeresources.xaml:355, :382 — inline spline */ visibility
				var(--winui-SplitViewPaneAnimationOpenDuration),
			margin-inline-end var(--winui-SplitViewPaneAnimationOpenPreDuration)
				cubic-bezier(0, 0.35, 0.15, 1);
	}

	/* Until the control has settled, there is no transition to run — see the comment on
	   `settled`. This is a `transition-property` of `none` rather than a zero duration, so that
	   nothing is even considered while the first state is being reached. */
	.root:not([data-settled]) .pane,
	.root:not([data-settled]) .shadow-caster {
		transition-property: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.pane,
		.shadow-caster {
			transition-duration: 0s;
		}
	}

	/* `ColumnDefinition1`, the width of the column the pane sits in — which is not the pane's
	   own width, and that is the distinction the template keeps and this control had lost. The
	   pane is `OpenPaneLength` in every state; the column under it is `CompactPaneGridLength`
	   in `ClosedCompactLeft` (SplitView_themeresources.xaml:543) and in `OpenCompactOverlayLeft`
	   (`:635`, which also moves `ContentRoot` into the second column), and it is nothing at all
	   for the minimal shapes, where `ContentRoot` keeps the template's `Grid.ColumnSpan="2"`
	   (`:718`) and spans the control whatever the column says.

	   Which of our shapes reach those states is decided one level up, and not where it looks.
	   `NavigationView::UpdateVisualStateForDisplayModeGroup` gives the SplitView `CompactOverlay`
	   for Compact and **`CompactInline` for Expanded** (NavigationView.cpp:2664, :2668) — so the
	   expanded shape is a compact SplitView too, and it has two states rather than one. Open, it
	   is `OpenInlineLeft` and the column is the pane's own width, which is what a flex item takes
	   by default. Closed, it is `ClosedCompactLeft` like any other closed compact shape, and the
	   column is 48. That second half is what this rule had missed: the pane clipped down to a
	   rail and went on reserving all 320, leaving 272 pixels of nothing between the rail and the
	   content in a window wide enough to be expanded.

	   `collapsed` is the attribute that says it — `!paneOpen && mode !== 'minimal'` is
	   `ClosedCompactLeft` exactly — and with compact's open state beside it the pair covers the
	   two states the template gives 48 to, and no others.

	   A negative end margin is that column. The pane lays out at its own width and gives back
	   all but the column, so its outer size is the column's. `SplitView.svelte` reaches the same
	   cases through `--pane-column`, because that control's root is the grid the template
	   describes and this one's is not. */
	.root[data-display-mode='compact'] .pane,
	.root[data-collapsed='true'] .pane {
		margin-inline-end: calc(
			var(--winui-NavigationViewCompactPaneLength) - var(--nav-open-pane-length)
		);
	}

	.root[data-display-mode='minimal'] .pane {
		margin-inline-end: calc(-1 * var(--nav-open-pane-length));
	}

	/* Overlaying, not reflowing: compact and minimal draw the open pane above the content.
	   `NavigationViewDefaultPaneBackground` rather than the expanded one, because an
	   overlaid pane has the content behind it rather than the window. */
	.root[data-overlay='true'] .pane {
		/* Above the content, and still in the flow that decides how much room the content gets.
		   Those are two questions in the template and they were one here: a pane taken out of
		   flow reserves nothing, so opening a compact rail handed its strip back to the content
		   and the page relaid out behind the pane. `ColumnDefinition1` is where the template
		   answers the second one, and the rule further down is what sets it.

		   `z-index` needs no `position` of its own — `.pane` is already `relative`, for
		   `HCPaneBorder`. */
		z-index: 1;
		background: var(--winui-NavigationViewDefaultPaneBackground);
		/* `RootSplitView.BorderBrush`, NavigationView.xaml:289 — the stroke the pane carries
		   while it is over the content, and the one `PaneNotOverlaying` paints transparent. */
		border-color: var(--winui-NavigationViewItemSeparatorForeground);
	}

	/* `ShadowCaster` — NavigationView.xaml:409. A Grid beside the SplitView in NavigationView's
	   own template, the width of the open pane, with no background, no content and no corner
	   radius: a box that casts and does nothing else. `NavigationView::SetDropShadow`
	   (NavigationView.cpp:5028) puts a `ThemeShadow` on it at `PaneOverlayShadowDepth` while the
	   pane is open in compact or minimal, and `PaneNotOverlaying` (NavigationView.xaml:128) holds
	   it at zero opacity otherwise — the two conditions `data-overlay` already is. Without a
	   shadow an opaque pane sits on the content with nothing between them, which is what the pane
	   looked like here at phone width.

	   The shadow was on `.pane` until this element existed, and both of the divergences that
	   followed came of one box doing two jobs. A clip at the border box takes an outer
	   `box-shadow` with it, so `f7fb6a8`'s clip erased the shadow and a negative inset had to buy
	   it back — the inset stays, for the second reason recorded on it, but it is no longer this
	   shadow's business. And `.pane` carries `OverlayCornerRadius` on its right corners, so its
	   shadow turned those corners where upstream's, cast by a square Grid, does not: the corner
	   is square now, and the arc between the pane's rounded corner and the caster's square one
	   shows the content rather than a shadow, because an outer `box-shadow` is not painted
	   inside the box that casts it.

	   Painted before `.pane` and occluded by it, where upstream's caster is declared after the
	   SplitView. It makes no difference while the pane is open and still — the shadow is drawn
	   outside the caster's box, which is the pane's box — and one difference on the way out,
	   where the caster is already rail-width under a pane that is still wide: here that band is
	   hidden behind the pane, and a composition drop shadow, drawn under its own visual and over
	   what is below it, would show it. Not measured; the guest was not driven through a 120ms
	   window for it. */
	.shadow-caster {
		position: absolute;
		/* `Grid.RowSpan="2"` over a root grid whose row 1 holds the SplitView: the caster is as
		   tall as the control rather than as tall as the pane. Row 0 is the top-nav area, and a
		   left display mode collapses it — so wherever this element is rendered at all, the two
		   heights are the same. */
		inset: 0 auto 0 0;
		width: var(--nav-open-pane-length);
		/* Transparent and out of the way: upstream's caster has no background and is not
		   hit-testable without one. */
		pointer-events: none;
		/* Above the content and above `.light-dismiss`, which is where the caster sits upstream
		   by being written after the SplitView that holds them both. `.pane` takes the same
		   `z-index` under `data-overlay` and wins on tree order. */
		z-index: 1;
		opacity: 0;
		box-shadow: var(--winui-PaneShadow);
		/* The same corners `.pane` takes, and upstream's caster has none (NavigationView.xaml:409
		   declares a `Grid` with a width and a transform and nothing else). It is here because the
		   two shadows are made differently: a composition `ThemeShadow` is drawn from a visual and
		   lands behind the rounded `PaneRoot` in front of it, while a CSS `box-shadow` takes its
		   silhouette from the border box of whatever carries it. Photographed on the reference
		   guest — the Gallery's own pane, overlaying, bottom-right corner — the original's shadow
		   is continuous around the corner arc: just outside it the content is darkened by 13 to 15
		   levels of 111, which is what the straight edge two hundred rows above darkens it by.
		   Square here, that arc is the one place the shadow is not drawn at all, because an outer
		   box-shadow is never painted inside the box that casts it. So the radius is not a part
		   transcribed from the caster; it is what makes this primitive produce the contour the
		   original's shadow has. */
		border-radius: 0 var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0;
		/* `ShadowCasterTransform.TranslateX` (NavigationView.xaml:411), which the group's
		   transitions run from `NegativeOpenPaneLengthMinusCompactLength` to 0 (`:98`) and back
		   (`:113`). `RootSplitView.CompactPaneLength` is the control's own in every display mode
		   (`:289`), so this offset is 320 - 48 in minimal too, where the pane itself slides the
		   whole 320 (SplitView_themeresources.xaml:64) — on the way in the caster leads the pane
		   by a rail's width, which is upstream's arithmetic rather than a simplification of it.
		   In compact the two agree exactly: same value, same spline, same duration as the clip
		   (SplitView_themeresources.xaml:129). */
		translate: calc(var(--winui-NavigationViewCompactPaneLength) - var(--nav-open-pane-length)) 0;
	}

	/* `ListSizeCompact` narrows the caster to `CompactPaneLength` (NavigationView.xaml:84), and
	   `OnSplitViewPaneClosing` enters that state as the close begins (NavigationView.cpp:1765),
	   so the caster is rail-width for the whole of the way out while the pane is still narrowing
	   to meet it. `data-collapsed` is that state's condition exactly — closed in `CompactOverlay`
	   or `CompactInline` (NavigationView.cpp:1794). The group has no transitions, so the width
	   changes in one frame in both directions. */
	.root[data-collapsed='true'] .shadow-caster {
		width: var(--winui-NavigationViewCompactPaneLength);
	}

	.root[data-overlay='true'] .shadow-caster {
		opacity: 1;
		translate: 0 0;
	}

	/* The `PaneOverlayGroup` transitions, NavigationView.xaml:95 and :109 — 0:0:0.35 into
	   `PaneOverlaying` and 0:0:0.12 out. The opacity frames are `LinearDoubleKeyFrame` and carry
	   no spline (`:102`, `:116`); the translate frames carry `0.1,0.9 0.2,1.0`, the curve the
	   pane's own clip runs on. */
	.shadow-caster {
		/* c1-allow: NavigationView.xaml:113, :116 — the ease-out duration and its spline */
		transition:
			opacity 120ms linear,
			translate 120ms cubic-bezier(0.1, 0.9, 0.2, 1);
	}

	.root[data-overlay='true'] .shadow-caster {
		/* c1-allow: NavigationView.xaml:99, :102 — the way in */
		transition-duration: 350ms;
	}

	/* NavigationView.xaml:180 — PaneToggleButtonGrid: left, top, and Canvas.ZIndex="100", which
	   is above the overlaying pane's own z-index of 1. `ButtonHolderGrid` (:186) carries
	   NavigationViewButtonHolderGridMargin and no horizontal margin, so the button sits at the
	   root's left edge rather than at the pane content grid's -1px one. */
	.button-holder-grid {
		position: absolute;
		left: 0;
		top: 0;
		z-index: 100;
		display: flex;
		margin: var(--winui-NavigationViewButtonHolderGridMargin);
	}

	/* NavigationView.xaml:296, PaneContentGridToggleButtonRow — the space the pane keeps for a
	   button that is not in it. The row is `Auto`, so two constraints meet on it and the larger
	   wins: `TogglePaneButtonVisible` sets the row's own `MinHeight` to
	   `NavigationViewPaneHeaderRowMinHeight`, 40 (`NavigationView.xaml:48`), and the grid inside
	   it gets a `MinHeight` of the toggle button's height from `UpdatePaneLayout`
	   (`NavigationView.cpp:4662`, applied at `:4721`) under the same condition. So the `{#if}`
	   around this element is that state, and `max()` here is the arithmetic rather than its
	   answer — 40 at this pin, and still the original's number if `PaneToggleButtonHeight` ever
	   passes 40.
	   Not the button's own box, which is what this rule reserved until it was measured. The
	   button is in an overlay anchored to the root (`NavigationView.xaml:180`), not in this row,
	   so the 4 below it is margin in the overlay that the pane was never asked to match, and
	   reserving 4 + 36 + 4 here put everything under it in the pane four pixels low. */
	.toggle-button-row {
		flex: 0 0 auto;
		min-height: max(
			var(--winui-NavigationViewPaneHeaderRowMinHeight),
			var(--winui-PaneToggleButtonHeight)
		);
	}

	.pane-toggle {
		position: relative;
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
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	/* GlobalNavButton, the hamburger. Written here rather than in the markup because it
	   is a picture, not text: a screen reader gets `aria-label` and should not also be
	   handed a private-use code point. */
	.pane-toggle::before {
		content: '\e700';
	}

	/* The focus visual; see Button.svelte in this package for the shape. `::after` because
	   `::before` above is the glyph. `NavigationView.xaml:197` sets `FocusVisualMargin="0"`
	   on `TogglePaneButton` explicitly, so the band is drawn inside the button's own bounds
	   and inherits its corner radius. */
	.pane-toggle:focus-visible::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	.pane-toggle:hover {
		background: var(--winui-NavigationViewButtonBackgroundPointerOver);
		color: var(--winui-NavigationViewButtonForegroundPointerOver);
	}

	.pane-toggle:active {
		background: var(--winui-NavigationViewButtonBackgroundPressed);
		color: var(--winui-NavigationViewButtonForegroundPressed);
	}

	/* `NavigationViewPaneContentGridMargin` belongs to `PaneContentGrid` — NavigationView.xaml:291
	   — which encloses the toggle button, the menu items, the pane footer and the footer
	   items. `ItemsContainerGrid` itself carries no margin. */
	.pane-content-grid {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
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

	/* `VisualItemsSeparator` — NavigationView.xaml:375. The instance's own `Margin="0,0,0,2"`
	   overrides the `NavigationViewItemSeparator` style's, so the token for that margin is
	   deliberately not read here. */
	.items-separator {
		flex: 0 0 auto;
		height: var(--winui-NavigationViewItemSeparatorHeight);
		/* c1-allow: NavigationView.xaml:375, VisualItemsSeparator Margin="0,0,0,2" */
		margin: 0 0 2px;
		background: var(--winui-NavigationViewItemSeparatorForeground);
	}

	.footer-content-border {
		flex: 0 0 auto;
		/* c1-allow: NavigationView.xaml:377, FooterContentBorder Margin="0,0,0,4" */
		margin: 0 0 4px;
	}

	.footer-items {
		flex: 0 0 auto;
	}

	/* `:723`. Desktop `Auto` light dismiss leaves this transparent, so it is a hit target and
	   nothing else. `z-index` is left alone on purpose: positioned and painted above the static
	   content, below the pane's 1 and the button holder's 100. */
	.light-dismiss {
		position: absolute;
		inset: 0;
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

	.root[data-pane-display-mode='top'] .content-grid {
		margin: var(--winui-TopNavigationViewContentMargin);
		border-style: solid;
		border-color: var(--winui-NavigationViewItemSeparatorForeground);
		border-width: var(--winui-TopNavigationViewContentGridBorderThickness);
		border-radius: var(--winui-TopNavigationViewContentGridCornerRadius);
	}

	.header-content {
		flex: 0 0 auto;
		margin: var(--winui-NavigationViewHeaderMargin);
	}

	.root[data-display-mode='minimal'] .header-content {
		margin: var(--winui-NavigationViewMinimalHeaderMargin);
	}

	.content-presenter {
		/* XAML's `MinHeight` and `MinWidth` include the border and the padding; CSS's
		   `min-height` and `min-width` do not, unless the box is `border-box`. Without
		   this line a control whose minimum comes from a WinUI resource renders that
		   minimum *plus* its own padding and border — measured: this box came out 45px
		   tall against the original's 32. */
		box-sizing: border-box;
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
