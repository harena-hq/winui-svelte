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

	// Minimal hides the pane entirely when it is closed; the other two keep it, narrowed.
	const paneVisible = $derived(mode !== 'minimal' || paneOpen);
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
		{#if paneVisible}
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
		{/if}
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
		/* `RootSplitView.PaneBackground`, NavigationView.xaml:289. An overlaying pane is
		   drawn on top of the content, so it is opaque; a pane sitting beside the content
		   is transparent and shows the window's backdrop. Both are solid colours at this
		   pin — `AcrylicInAppFillColorDefaultBrush` is defined as one, not as a material. */
		background: var(--winui-NavigationViewDefaultPaneBackground);
	}

	/* NavigationView.xaml:126, the `PaneNotOverlaying` visual state. `data-overlay` is
	   already that distinction: it is true exactly when the pane is drawn above the
	   content rather than beside it. */
	.root:not([data-overlay='true']) .pane {
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
	   button that is not in it. Height and margin are the button's own, so the items below hold
	   the positions they had while the button was here. */
	.toggle-button-row {
		flex: 0 0 auto;
		height: var(--winui-PaneToggleButtonHeight);
		margin: var(--winui-NavigationViewButtonHolderGridMargin);
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
