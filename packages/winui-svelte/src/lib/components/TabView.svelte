<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/**
	 * The WinUI `TabViewWidthMode` enum (`TabView.idl:6-11`) — `Equal | SizeToContent | Compact`.
	 * All three members are here.
	 */
	export type TabViewWidthMode = 'equal' | 'sizeToContent' | 'compact';

	/**
	 * The WinUI `TabViewCloseButtonOverlayMode` enum (`TabView.idl:15-20`) —
	 * `Auto | OnPointerOver | Always`. All three members are here. `Auto` and `Always` are the
	 * same rule; `TabViewItem::UpdateCloseButton` (`TabViewItem.cpp:251-282`) has no third
	 * branch, and `Auto` reaches it through `default:`.
	 */
	export type TabViewCloseButtonOverlayMode = 'auto' | 'onPointerOver' | 'always';

	/**
	 * AddTabButtonClick's `args`: the member of `RoutedEventArgs` a handler here can use. Named
	 * for the event, as upstream's `args` is typed `Object` (TabView.idl:128) and carries the
	 * button's own `RoutedEventArgs`.
	 */
	export interface TabViewAddTabButtonClickEventArgs {
		/** RoutedEventArgs.OriginalSource — the add button. */
		readonly originalSource: HTMLButtonElement;
	}

	/**
	 * A tab's ContextRequested `args`: the members of `ContextRequestedEventArgs` a handler here
	 * can use, as upstream shows a tab's `ContextFlyout` from them
	 * (`CUIElement::OnContextRequestedCore`, uielement.cpp:12775-12861).
	 */
	export interface TabViewTabContextRequestedEventArgs {
		/** RoutedEventArgs.OriginalSource, narrowed to the tab. */
		readonly originalSource: HTMLElement;
		/**
		 * `TryGetPosition(tab)`: the pointer's point in the tab, from its top-left corner, or
		 * `null` when the keyboard asked, which upstream shows the flyout against the tab for.
		 */
		readonly position: { x: number; y: number } | null;
	}

	/** One tab. `TabView.TabItems` narrowed to plain records — D26 and NavigationView's narrowing. */
	export interface TabViewItemData {
		/** Stable identity. What `selected` holds and what the callbacks report. */
		id: string;
		/** TabViewItem.Header, narrowed to text. */
		header?: string;
		/** TabViewItem.Header, ADR 0012's general form. Wins over `header`. */
		headerContent?: Snippet;
		/** TabViewItem.IconSource, ADR 0012's shorthand: a Segoe Fluent Icons code point as uppercase hex. */
		glyph?: string | null;
		/** TabViewItem.IconSource, ADR 0012's general form. Wins over `glyph`. */
		icon?: Snippet;
		/**
		 * The tab's content. It is mounted with the tab and stays mounted, hidden, while the tab is
		 * unselected. Upstream keeps each item's `Content` too, but takes an unselected one out of
		 * the visual tree (`TabView::UpdateTabContent`, `TabView.cpp:964-1015`); here it stays in
		 * the document, so whatever it runs keeps running while it is hidden.
		 */
		content?: Snippet;
		/**
		 * No WinUI member: the tab element's `id`. Defaults to one derived from the component's own
		 * id and `id`; give one when a panel the consumer renders has to name the tab in
		 * `aria-labelledby`. It has to be unique in the document and hold no space, since it
		 * reaches an id list. An empty string counts as none.
		 */
		tabId?: string;
		/**
		 * No WinUI member: the `id` of a panel the consumer renders for this tab, which the tab's
		 * `aria-controls` names, with no space in it. The component then renders no panel of its
		 * own for this item, so its `content` is not rendered, and a selection change carries no
		 * focus into the consumer's panel: the consumer's panels are the consumer's to focus.
		 */
		panelId?: string;
		/** TabViewItem.IsClosable. Defaults to true, as upstream does. */
		closable?: boolean;
		/** IsEnabled on the tab, inverted to the attribute — ADR 0009. */
		disabled?: boolean;
	}

	export interface TabViewProps {
		items: TabViewItemData[];
		/**
		 * SelectedItem, narrowed to the `id` of one record. `null` means the first tab. Removing
		 * the selected record, by a close request or otherwise, moves it to the closest enabled tab.
		 * When focus is inside the shown content, a selection change moves it into the new content,
		 * or to the tab when that holds nothing focusable; otherwise nothing moves. Only the
		 * component's own panels count: a panel the consumer renders (`panelId`) is not one.
		 */
		selected?: string | null;
		onSelectedChange?: (id: string | null) => void;
		/**
		 * TabCloseRequested. This requests closure; the consumer edits its own collection, and if
		 * the tab was selected, the selection moves to the closest enabled tab once its record is
		 * gone. With none enabled, it names the removed record, a `null` selection included, so no
		 * tab shows as selected, and no change is reported.
		 */
		onTabCloseRequested?: (id: string) => void;
		/**
		 * No member of TabView: each TabViewItem's ContextRequested, reported by id, which is
		 * where a tab's `ContextFlyout` opens from. With a handler, the browser's own menu is not
		 * shown on an enabled tab; a disabled tab raises none and keeps the browser's menu.
		 */
		onTabContextRequested?: (id: string, args: TabViewTabContextRequestedEventArgs) => void;
		/**
		 * No WinUI member: each TabViewItem's KeyDown, reported by id before the strip's own
		 * handling, for a key pressed on the tab or anything inside it, its close button included;
		 * `event.target` tells which. A disabled tab reports none. A handler that calls
		 * `event.preventDefault()` takes the key: the strip then does nothing with it — no
		 * selection, no close, no focus move — and it does the same with a key any earlier
		 * listener prevented. The key still propagates.
		 */
		onTabKeyDown?: (id: string, event: KeyboardEvent) => void;
		/** IsEnabled on the control, inverted to the attribute — ADR 0009. */
		disabled?: boolean | null;
		/** TabWidthMode. Defaults to `Equal`, as upstream does (`TabView.idl:105`). */
		tabWidthMode?: TabViewWidthMode;
		/** CloseButtonOverlayMode. Defaults to `Auto`, as upstream does (`TabView.idl:109`). */
		closeButtonOverlayMode?: TabViewCloseButtonOverlayMode;
		/** IsAddTabButtonVisible. Defaults to true, as upstream does (`TabView.idl:119`). */
		addTabButtonVisible?: boolean;
		/**
		 * AddTabButtonClick. Upstream raises it with the add button's own `RoutedEventArgs` as its
		 * `args` (`TabView::OnAddButtonClick`, TabView.cpp:514-516), whose `OriginalSource` the
		 * button set to itself (`ButtonBase::OnClick`, ButtonBase_Partial.cpp:889), so a handler
		 * can show a flyout at it; this passes the button the same way.
		 */
		onAddTabButtonClick?: (args: TabViewAddTabButtonClickEventArgs) => void;
		/** TabStripHeader, ADR 0012's general form — the content left of the tabs. */
		tabStripHeader?: Snippet;
		/** TabStripFooter, ADR 0012's general form — the content right of the add button. */
		tabStripFooter?: Snippet;
		/**
		 * No WinUI member: renders the tab strip alone, without the content region
		 * (`TabContentPresenter`, `TabView.xaml:45`), so the consumer renders and places the panels
		 * itself; items' `content` is then not rendered, and no focus follows a selection change
		 * into a panel. Each item's `panelId` names the consumer's panel for the tab's
		 * `aria-controls`, and its `tabId` gives the tab an id the panel's `aria-labelledby` can
		 * name.
		 */
		stripOnly?: boolean;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// WD-023: dragging, reordering, tear-out, and browser-owned Ctrl+Tab are intentionally absent;
	// AddTabButtonCommand and AddTabButtonCommandParameter are XAML ICommand plumbing for the click;
	// `onAddTabButtonClick` is the web surface. TabStripHeaderTemplate and TabStripFooterTemplate
	// are DataTemplates, folded into their snippets by ADR 0012. TabViewListView is a template-private
	// items host, so D26 has this component render its records directly. WD-022 also applies here:
	// the label presenter uses `OpticalMarginAlignment="TrimSideBearings"` (`TabView.xaml:575`),
	// which CSS cannot express.

	const focusableSelector = [
		'a[href]',
		'area[href]',
		'button',
		'input',
		'select',
		'textarea',
		'iframe',
		'audio[controls]',
		'video[controls]',
		'summary',
		"[contenteditable]:not([contenteditable='false'])",
		'[tabindex]'
	].join(', ');

	// Stands in for `FocusManager::FindFirstFocusableElement` (`TabView.cpp:1000`).
	function firstFocusable(root: HTMLElement): HTMLElement | null {
		for (const element of root.querySelectorAll<HTMLElement>(focusableSelector)) {
			if (element.tabIndex < 0 || element.matches(':disabled')) continue;
			if (element.closest('[inert]')) continue;
			if (!element.checkVisibility({ visibilityProperty: true })) continue;
			return element;
		}
		return null;
	}
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	import { tick, untrack } from 'svelte';
	import { scrollBehavior } from '../internal/motion';

	let {
		items,
		selected = $bindable(null),
		onSelectedChange,
		onTabCloseRequested,
		onTabContextRequested,
		onTabKeyDown,
		disabled = false,
		tabWidthMode = 'equal',
		closeButtonOverlayMode = 'auto',
		addTabButtonVisible = true,
		onAddTabButtonClick,
		tabStripHeader,
		tabStripFooter,
		stripOnly = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: TabViewProps = $props();

	const str = useStrings();

	const uid = $props.id();
	// `TabView.xaml:576` writes `Content="&#xE711;"` on the close button — a template
	// literal rather than a resource. Named here because a Private Use Area character
	// written into the source is invisible in a diff and in most editors.
	const closeGlyph = String.fromCodePoint(0xe711);
	const addGlyph = String.fromCodePoint(0xe710); // TabView.xaml:41
	const scrollBackGlyph = String.fromCodePoint(0xedd9); // TabView.xaml:159
	const scrollForwardGlyph = String.fromCodePoint(0xedda); // TabView.xaml:165
	const isItemDisabled = (item: TabViewItemData) => disabled || item.disabled === true;
	const isClosable = (item: TabViewItemData) => item.closable !== false;
	const current = $derived(selected ?? items[0]?.id ?? null);
	const tabDomId = (id: string | null) =>
		items.find((item) => item.id === id)?.tabId || `${uid}-tab-${id ?? 'none'}`;
	const panelIdOf = (id: string) => `${uid}-panel-${id}`;

	function select(item: TabViewItemData) {
		if (isItemDisabled(item) || item.id === current) return;
		selected = item.id;
		onSelectedChange?.(item.id);
	}

	const closeId = (id: string) => `${uid}-close-${id}`;
	const hasCloseButton = (item: TabViewItemData) =>
		isClosable(item) && (closeButtonOverlayMode !== 'onPointerOver' || item.id === current);

	// The strip's arrow order, pressed on the original (`docs/keyboard.md`, the `TabView`
	// observation) and stated by the pin's own comment (`TabView.cpp:1439`): each tab, then its
	// close button, then the add-tab button, and from there back to the first tab — the arrows
	// wrap at both ends (`:1487-1494`), and the selection does not follow. A tab's Left and Right
	// reach it through `TabViewItem.cpp:578-597`, the add button's through `OnAddButtonKeyDown`
	// (`TabView.cpp:1578`). `IsTabStop="False"` on the close button (`TabView.xaml:576`) keeps it
	// out of the Tab order, not out of this one.
	const addId = `${uid}-add`;
	const focusOrder = $derived([
		...items.flatMap((item) =>
			isItemDisabled(item)
				? []
				: hasCloseButton(item)
					? [tabDomId(item.id), closeId(item.id)]
					: [tabDomId(item.id)]
		),
		...(addTabButtonVisible && !disabled ? [addId] : [])
	]);

	function moveFocus(from: string, step: number) {
		const index = focusOrder.indexOf(from);
		if (index === -1) return;
		const next = focusOrder[(index + step + focusOrder.length) % focusOrder.length];
		focusInStrip(next);
	}

	// A focused element is scrolled fully into view, the least distance it takes: pressed on the
	// reference on 2026-10-01, arrowing onto tabs past the strip's edge brought each one wholly in.
	// The browser's own scroll on `focus()` did not, measured in this strip: a tab 50 pixels past
	// the edge was left there, and one wholly out of view was centred. So it is turned off and this
	// does it. Only the strip scrolls, and `preventScroll` keeps the page still as well; upstream's
	// request bubbles on to the page's ScrollViewer, which the Gallery handles only on its
	// SizeToContent samples (`TabViewPage.xaml:179`), against a scroll on load
	// (`TabViewPage.xaml.cs:44-49`). Not pressed: a strip partly off the page's own edge.
	function focusInStrip(id: string | undefined) {
		const element = id ? document.getElementById(id) : null;
		if (!element) return;
		element.focus({ preventScroll: true });
		if (viewport?.contains(element)) bringIntoView(element, 0);
	}

	// The strip is one Tab stop, and the stop is the tab focus last visited: `TabNavigation="Once"`
	// on the tab list (`TabView.xaml:54`), which `ListViewBase` implements as tabbing back into the
	// previously visited item (`ListViewBase_Partial.cpp:1361-1364`). It remembers an item, so a
	// close button that had focus remembers its tab, and a change of selection moves it too, as
	// `Selector` does when the selection changes (`Selector_Partial.cpp:990`, `:2397`): the
	// remembered tab is derived from the selection and overwritten by focus, so until a tab is
	// visited the stop is the selected one. If the remembered tab is absent or disabled, the stop is
	// the enabled selected tab, else the first enabled tab; with none enabled, no tab is a stop.
	let remembered = $derived<string | null>(current);
	const isStop = (id: string | null) =>
		items.some((item) => item.id === id && !isItemDisabled(item));
	const entry = $derived(
		isStop(remembered)
			? remembered
			: isStop(current)
				? current
				: (items.find((item) => !isItemDisabled(item))?.id ?? null)
	);

	function walk(event: KeyboardEvent, here: string) {
		if (event.key === 'ArrowLeft') moveFocus(here, -1);
		else if (event.key === 'ArrowRight') moveFocus(here, 1);
		// Home and End were not pressed on the original; they keep to the tabs and their close
		// buttons, as they did before the add button joined the arrows.
		else if (event.key === 'Home') focusInStrip(focusOrder[0]);
		else if (event.key === 'End') focusInStrip(focusOrder.filter((id) => id !== addId).at(-1));
		else return false;

		event.preventDefault();
		return true;
	}

	// A tab's KeyDown, reported in the capture phase so it precedes the close button's own handler
	// as well as the tab's. A key the consumer prevents is left alone by both, which read
	// `defaultPrevented`; its propagation is not stopped, so the root's and the page's own
	// listeners still see it.
	function reportKey(event: KeyboardEvent, item: TabViewItemData) {
		if (!onTabKeyDown || isItemDisabled(item)) return;
		onTabKeyDown(item.id, event);
	}

	function handleKeydown(event: KeyboardEvent, item: TabViewItemData) {
		// A key already taken, by `onTabKeyDown` or anything before it, is left alone.
		if (event.defaultPrevented) return;
		if (event.ctrlKey && event.key === 'F4') {
			if (item.id === current && isClosable(item) && !isItemDisabled(item)) {
				event.preventDefault();
				onTabCloseRequested?.(item.id);
			}
			return;
		}

		// A tab is a `div`, so Enter and Space are not free — and they are what selects, because
		// the arrows do not: focus and selection are separate in this strip.
		if (event.key === 'Enter' || event.key === ' ') {
			// Leave Enter and Space to the focused child; preventing them cancels a button's click.
			// Upstream's close button requests the close on Click (`TabViewItem.cpp:328`).
			if (event.target !== event.currentTarget) return;
			event.preventDefault();
			select(item);
			return;
		}

		walk(event, tabDomId(item.id));
	}

	// A `contextmenu` the keyboard raised, Shift+F10 or the menu key, carries no pointer
	// button: Chromium gives it `button` -1, on Windows as on Linux, after either key.
	function requestContext(event: MouseEvent, item: TabViewItemData) {
		if (!onTabContextRequested || isItemDisabled(item)) return;
		event.preventDefault();
		const tab = event.currentTarget as HTMLElement;
		const box = tab.getBoundingClientRect();
		const position =
			event.button === -1 ? null : { x: event.clientX - box.left, y: event.clientY - box.top };
		onTabContextRequested(item.id, { originalSource: tab, position });
	}

	function handleCloseKeydown(event: KeyboardEvent, item: TabViewItemData) {
		if (event.defaultPrevented) return;
		if (walk(event, closeId(item.id))) event.stopPropagation();
	}

	let viewport = $state<HTMLElement | null>(null);
	let overflowing = $state(false);
	let atStart = $state(true);
	let atEnd = $state(false);
	let repeatDelay: ReturnType<typeof setTimeout> | undefined;
	let repeatInterval: ReturnType<typeof setInterval> | undefined;

	function syncScroll() {
		if (!viewport) return;
		const { clientWidth, scrollLeft, scrollWidth } = viewport;
		overflowing = scrollWidth - clientWidth > 0.1;
		atStart = scrollLeft < 0.1;
		atEnd = Math.abs(scrollLeft - (scrollWidth - clientWidth)) < 0.1;
	}

	function scrollBy(direction: number) {
		// `c_scrollAmount` is 50 (`TabView.cpp:30`); its two click handlers are `:1103-1117`.
		// `ChangeView` animates only while the platform's animations are on (ADR 0016).
		viewport?.scrollBy({ left: direction * 50, behavior: scrollBehavior() });
	}

	function stopRepeat() {
		if (repeatDelay !== undefined) clearTimeout(repeatDelay);
		if (repeatInterval !== undefined) clearInterval(repeatInterval);
		repeatDelay = undefined;
		repeatInterval = undefined;
	}

	function startRepeat(event: PointerEvent, direction: number) {
		if (disabled || (direction < 0 ? atStart : atEnd)) return;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		stopRepeat();
		scrollBy(direction);
		repeatDelay = setTimeout(() => {
			repeatInterval = setInterval(() => {
				// Reaching the end disables this button, and a disabled control is dispatched no
				// `pointerup` — so the repeat has to be what notices, or the interval outlives the
				// press. `Delay="50" Interval="100"` are upstream's (`TabView.xaml:158`, `:164`).
				if (direction < 0 ? atStart : atEnd) {
					stopRepeat();
					return;
				}
				scrollBy(direction);
			}, 100);
		}, 50);
	}

	/**
	 * `BringSelectedTabIntoView` (`TabView.cpp:748`): scroll the strip the least it takes to show
	 * the selected tab, whose target is its own width and 2 more, `c_targetRectWidthIncrement`
	 * (`TabViewItem.h:120`), "to avoid cutting off the end of the Tab" (`TabViewItem.cpp:627-629`).
	 * A target wider than the strip keeps its left edge in view. It animates as the scroll
	 * buttons' `ChangeView` does, only while the platform's animations are on (ADR 0016).
	 */
	function bringSelectedTabIntoView() {
		// The id is read untracked: `tabDomId` reads `items`, and the effect that calls this on a new
		// selection would otherwise run on every change to the items too, scrolling the strip after
		// a removal that has to hold it still.
		const tab = current === null ? null : document.getElementById(untrack(() => tabDomId(current)));
		// c1-allow: TabViewItem.h:120, c_targetRectWidthIncrement = 2
		if (tab) bringIntoView(tab, 2);
	}

	function bringIntoView(element: HTMLElement, extra: number) {
		if (!viewport) return;
		const view = viewport.getBoundingClientRect();
		const box = element.getBoundingClientRect();
		const before = box.left - view.left;
		const after = box.right + extra - view.right;
		const delta = before < 0 ? before : after > 0 ? Math.min(after, before) : 0;
		if (Math.abs(delta) > 0.5) viewport.scrollBy({ left: delta, behavior: scrollBehavior() });
	}

	// A removal that takes the selected tab selects the closest one (`TabView::OnItemsChanged`,
	// `TabView.cpp:780-815`): the tab now at its index, or the last if it was the last, and from
	// there the first enabled tab forward, wrapping, and `SelectedItem` raises the change. The
	// consumer removes the record, so the selection moves here, once the tab is gone. A `null`
	// selection shows the first tab and moves when that tab goes. A selection naming no tab is
	// upstream's `SelectedIndex` of -1, which any removal answers from the removed index (`:786`);
	// that is also where a removal that found no enabled tab leaves it, naming the removed record,
	// a `null` selection included, since `null` would show the first tab. Upstream is told of one
	// removal at a time; the start here is the one it reaches were the selected tab removed last:
	// the tabs kept before it. Any change that drops ids counts as a removal, a replaced list
	// included, where upstream sees a reset. The early return in the effect leaves `before`
	// holding a removed id, so `shown` is always one.
	function selectAfterRemoval(before: string[], kept: Set<string>) {
		const shown = selected ?? before[0];
		if (kept.has(shown)) return;
		const was = before.indexOf(shown);
		const from = was === -1 ? before.findIndex((id) => !kept.has(id)) : was;
		const start = Math.min(
			before.slice(0, from).filter((id) => kept.has(id)).length,
			items.length - 1
		);
		for (let step = 0; step < items.length; step++) {
			const item = items[(start + step) % items.length];
			if (isItemDisabled(item)) continue;
			selected = item.id;
			onSelectedChange?.(item.id);
			return;
		}
		selected = shown;
	}

	// Becoming selected brings a tab into view (`TabViewItem.cpp:151-154`), and so does a change
	// in the items presenter's size (`OnItemsPresenterSizeChanged`, `TabView.cpp:736-746`) — the
	// presenter's and not the strip's: it sits inside the ScrollViewer, so while the tabs overflow
	// its width is theirs, and a strip resized around tabs already at their minimum leaves it
	// alone. The strip's scrollable width stands in for it, because `.list` is as wide as the strip
	// whatever it holds. A removal holds it still: it sets `m_updateTabWidthOnPointerLeave`
	// (`:782`), under which a size change brings nothing in, and the pointer leaving
	// `TabContainerGrid` clears it (`:620-631`). Leaving re-runs upstream's `UpdateTabWidths`,
	// which these widths have already followed, so here it only clears the flag — and nothing is
	// lost by that, since tabs that overflow sit at their minimum width in `equal` mode and tabs
	// that could widen on leaving already fit, while the other two modes leave a tab's width to its
	// content (`UpdateTabWidths` leaves it NaN for both, `TabView.cpp:1140`, applied at
	// `:1324-1336`). A mode that did change on leaving would have to bring the selection in then.
	let removalPending = false;
	let previousIds: string[] = [];
	let previousDomIds: string[] = [];
	let itemsWidth = 0;
	$effect.pre(() => {
		const ids = items.map((item) => item.id);
		const kept = new Set(ids);
		const before = previousIds;
		const beforeDomIds = previousDomIds;
		previousIds = ids;
		previousDomIds = items.map((item) => tabDomId(item.id));
		if (!before.some((id) => !kept.has(id))) return;
		removalPending = true;
		// Untracked, so neither the selection nor what the consumer's callback reads re-runs this.
		untrack(() => {
			// Closing a tab that holds focus moves it to the first focusable tab after it, else
			// the first before it searching backwards, else the add button (`TabView::RequestCloseTab`,
			// `TabView.cpp:1017-1101`, searches at `:1048-1070`, fallback at `:1079-1082`). Here any
			// removal of the focused tab counts, not only a close request: the consumer removes the
			// record, so the component cannot distinguish them. This departure is deliberate.
			const focused = before.findIndex(
				(id, i) =>
					!kept.has(id) &&
					document.getElementById(beforeDomIds[i])?.contains(document.activeElement)
			);
			if (focused !== -1) {
				const canFocus = (id: string) =>
					kept.has(id) && items.some((item) => item.id === id && !isItemDisabled(item));
				const targetId =
					before.slice(focused + 1).find(canFocus) ??
					before.slice(0, focused).reverse().find(canFocus);
				const focusAdd = targetId === undefined && addTabButtonVisible && !disabled;
				if (targetId !== undefined || focusAdd) {
					tick().then(() => {
						if (document.activeElement !== document.body && document.activeElement !== null) return;
						if (targetId !== undefined) focusInStrip(tabDomId(targetId));
						else document.getElementById(addId)?.focus({ preventScroll: true });
					});
				}
			}
			selectAfterRemoval(before, kept);
		});
	});
	// Focus inside the content being replaced moves into the new content, its first focusable
	// element or else the tab (`TabView::UpdateTabContent`, `TabView.cpp:984-1011`); focus anywhere
	// else stays put. Upstream learns it from the presenter's LosingFocus, raised as the content is
	// swapped; here it is read before the DOM updates, after the removal effect above, so a removal
	// that moves the selection still finds its old panel, and moved once the new one is shown.
	// The move reads the selection as it stands then, so a consumer that redirects it in the same
	// update sends focus to the tab it ends on. A consumer that moves focus itself in the same
	// update keeps it, as upstream's move happens synchronously during the swap. The tab needs no
	// scroll of its own: becoming selected already brings it into view, in the effect below. With
	// `stripOnly`, or for an item with a `panelId`, there is no component panel: focus is never
	// found inside one on leaving such an item, and on arriving at such an item from inside a
	// component panel, focus goes to its tab, never into the consumer's panel.
	let shownBefore: string | null = null;
	let focusPending = false;
	$effect.pre(() => {
		const next = current;
		if (next === shownBefore) return;
		const panel = shownBefore === null ? null : document.getElementById(panelIdOf(shownBefore));
		const focusWasInside = panel?.contains(document.activeElement) ?? false;
		shownBefore = next;
		if (!focusWasInside || focusPending) return;
		focusPending = true;
		const from = document.activeElement;
		tick().then(() => {
			focusPending = false;
			if (
				document.activeElement !== from &&
				document.activeElement !== document.body &&
				document.activeElement !== null
			)
				return;
			const shownId = untrack(() => current);
			if (shownId === null) return;
			const shown = document.getElementById(panelIdOf(shownId));
			const tab = document.getElementById(tabDomId(shownId));
			const target = (shown && firstFocusable(shown)) ?? tab;
			target?.focus({ preventScroll: true });
			// A candidate that refuses focus leaves it on the body; the tab is upstream's fallback.
			if (target !== tab && document.activeElement !== target) tab?.focus({ preventScroll: true });
		});
	});
	// The selected tab's flare reaches 4 past it, so a new selection can move the content's edge
	// without any tab changing size; it is recorded here so that a later measure does not read
	// that as the items resizing.
	$effect(() => {
		void current;
		bringSelectedTabIntoView();
		untrack(() => (itemsWidth = contentWidth()));
	});

	const contentWidth = () => viewport?.scrollWidth ?? itemsWidth;

	function measureItems() {
		const width = contentWidth();
		if (Math.abs(width - itemsWidth) < 0.5) return;
		itemsWidth = width;
		if (!removalPending) bringSelectedTabIntoView();
	}

	function leaveStrip() {
		removalPending = false;
	}

	$effect(() => {
		if (!viewport) return;
		// Re-observed whenever the items change, so each tab's own size is watched as well. The ids
		// are read one by one, so a consumer's in-place `push` is seen as well as a new array.
		for (const item of items) void item.id;
		const observer = new ResizeObserver(() => {
			syncScroll();
			measureItems();
		});
		observer.observe(viewport);
		for (const tab of viewport.querySelectorAll('[role=tab]')) observer.observe(tab);
		untrack(() => {
			syncScroll();
			measureItems();
		});
		// Showing the buttons only shrinks the viewport, which cannot turn an overflow into a fit,
		// and hiding them only grows it, so these observations cannot oscillate.
		return () => observer.disconnect();
	});

	$effect(() => stopRepeat);
</script>

<div
	bind:this={ref}
	class={['root', className]}
	data-width-mode={tabWidthMode}
	data-close-mode={closeButtonOverlayMode}
	{style}
	{...rest}
>
	<!-- `TabContainerGrid` (TabView.xaml:29), whose `PointerExited` ends a run of removals. The
	     handler only notices where the pointer went; it makes nothing interactive, so the strip
	     takes no role for it. -->
	<!-- eslint-disable svelte/no-unused-svelte-ignore -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="strip" onpointerleave={leaveStrip}>
		<!-- eslint-enable svelte/no-unused-svelte-ignore -->
		<div class="line"></div>
		{#if tabStripHeader}<div class="strip-header">{@render tabStripHeader()}</div>{/if}
		<div class="scroller">
			{#if overflowing}
				<div class="scroll-slot back">
					<button
						type="button"
						class="scroll"
						tabindex="-1"
						aria-label={str('TabViewScrollDecreaseButtonTooltip')}
						disabled={disabled || atStart}
						onclick={(event) => {
							// Pointer-down already stepped; keyboard clicks alone have detail zero.
							if (event.detail === 0) scrollBy(-1);
						}}
						onpointerdown={(event) => startRepeat(event, -1)}
						onpointerup={stopRepeat}
						onpointercancel={stopRepeat}
						onlostpointercapture={stopRepeat}>{scrollBackGlyph}</button
					>
				</div>
			{/if}
			<div class="viewport" bind:this={viewport} onscroll={syncScroll}>
				<div class="list" role="tablist">
					{#each items as item (item.id)}
						<div
							class="tab"
							role="tab"
							id={tabDomId(item.id)}
							data-closable={isClosable(item) || undefined}
							tabindex={item.id === entry ? 0 : -1}
							aria-selected={item.id === current}
							aria-disabled={isItemDisabled(item) || undefined}
							aria-controls={item.panelId ||
								(!stripOnly && item.content ? panelIdOf(item.id) : undefined)}
							data-selected={item.id === current || undefined}
							onclick={() => select(item)}
							onfocusin={() => (remembered = item.id)}
							onkeydowncapture={(event) => reportKey(event, item)}
							onkeydown={(event) => handleKeydown(event, item)}
							oncontextmenu={(event) => requestContext(event, item)}
						>
							<div class="body">
								{#if item.icon || item.glyph}
									<!-- `{:else if item.glyph}` rather than a bare `{:else}` with a non-null
							     assertion: a published `.svelte` file's markup expressions are parsed as
							     JavaScript by the consumer's compiler, so a TypeScript `!` in one is a
							     syntax error in their build and not in ours. `pnpm smoke` is what says so. -->
									<span class="icon" aria-hidden="true">
										{#if item.icon}{@render item.icon()}{:else if item.glyph}{String.fromCodePoint(
												Number.parseInt(item.glyph, 16)
											)}{/if}
									</span>
								{/if}
								<span class="label winui-CaptionTextBlockStyle"
									>{#if item.headerContent}{@render item.headerContent()}{:else}{item.header}{/if}</span
								>
								{#if isClosable(item)}
									<!-- The pointer follows CSS hover while the keyboard walks only buttons certainly shown. -->
									<button
										type="button"
										class="close"
										tabindex="-1"
										aria-label={str('TabViewCloseButtonName')}
										disabled={isItemDisabled(item)}
										id={closeId(item.id)}
										onkeydown={(event) => handleCloseKeydown(event, item)}
										onclick={(event) => {
											event.stopPropagation();
											onTabCloseRequested?.(item.id);
										}}>{closeGlyph}</button
									>
								{/if}
							</div>
							<span class="separator"></span>
							{#if item.id === current}<span class="flare-right"></span>{/if}
						</div>
					{/each}
				</div>
			</div>
			{#if overflowing}
				<div class="scroll-slot forward">
					<button
						type="button"
						class="scroll"
						tabindex="-1"
						aria-label={str('TabViewScrollIncreaseButtonTooltip')}
						disabled={disabled || atEnd}
						onclick={(event) => {
							if (event.detail === 0) scrollBy(1);
						}}
						onpointerdown={(event) => startRepeat(event, 1)}
						onpointerup={stopRepeat}
						onpointercancel={stopRepeat}
						onlostpointercapture={stopRepeat}>{scrollForwardGlyph}</button
					>
				</div>
			{/if}
		</div>
		{#if addTabButtonVisible}
			<div class="add-slot">
				<button
					type="button"
					class="add"
					id={addId}
					aria-label={str('TabViewAddButtonName')}
					{disabled}
					onkeydown={(event) => {
						if (walk(event, addId)) event.stopPropagation();
					}}
					onclick={(event) => onAddTabButtonClick?.({ originalSource: event.currentTarget })}
					>{addGlyph}</button
				>
			</div>
		{/if}
		{#if tabStripFooter}<div class="strip-footer">{@render tabStripFooter()}</div>{/if}
	</div>
	<!-- TabContentPresenter (`TabView.xaml:45`). Every item's content stays mounted, and only the
	     selected one's panel is shown. `stripOnly` leaves it to the consumer. -->
	{#if !stripOnly}
		<div class="content">
			{#each items as item (item.id)}
				{#if item.content && !item.panelId}
					<div
						class="panel"
						role="tabpanel"
						id={panelIdOf(item.id)}
						aria-labelledby={tabDomId(item.id)}
						hidden={item.id !== current}
					>
						{@render item.content()}
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.root {
		display: flex;
		flex-direction: column;
	}

	.strip {
		position: relative;
		display: flex;
		background: var(--winui-TabViewBackground);
	}

	/* Upstream draws this line in three places that have to agree — the TabView template's own
	   two Borders (`TabView.xaml:36-37`), the list's 4px stubs (`:118`, `:123`) and each item's
	   own (`:546`) — because the strip is a ScrollViewer inside a ListView inside a Grid. One
	   line behind the tabs cannot disagree with itself, and the selected tab's opaque shape
	   covers it exactly where the item's own is collapsed. */
	.line {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		/* `TabView.xaml:36`, `Height="1"`. */
		height: 1px;
		background: var(--winui-TabViewBorderBrush);
	}

	.list {
		display: flex;
		min-width: 0;
		/* The 8px before the first tab and the 4px after the last were measured on the guest;
		   upstream builds the pair from four boxes that are never separately observable — the
		   `TabContainerGrid`'s 2px minimum left column (`TabView.xaml:31`), the ScrollViewer
		   grid's own 2px minimum column (`:151`), the `ScrollContentPresenter`'s 1px padding
		   (`:162`) and the `ItemsPresenter`'s 4px Header and Footer (`:116-125`). One padding
		   rather than four boxes. */
		padding: 0 4px 0 8px;
	}

	.scroller {
		display: flex;
		min-width: 0;
		/* `TabColumn` is `Auto` (`TabView.xaml:32`): the strip is as wide as its tabs until the
		   window runs out, and only then does it stop growing. */
		flex: 0 1 auto;
	}

	.viewport {
		min-width: 0;
		/* `TabViewHeaderPadding`, the TabView's Padding (`TabView.xaml:6`), which the template
		   passes to the list (`:39`) and the list's template to its `ItemsPresenter` (`:115`),
		   inside this ScrollViewer. Only the tabs feel it: the header and footer presenters span
		   the strip's whole height (`:38`, `:43`), and the add and scroll buttons sit on the
		   bottom (`:40`, `:157`, `:163`). */
		padding: var(--winui-TabViewHeaderPadding);
		/* The ScrollViewer the two RepeatButtons flank (`TabView.xaml:162`). `auto` and not
		   `hidden`, so the wheel and a trackpad still move the strip the way they do upstream;
		   the bar itself is upstream's thin overlay one and is not drawn here. */
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: none;
	}
	.viewport::-webkit-scrollbar {
		display: none;
	}

	/* The presenters set no content alignment (`TabView.xaml:38`, `:43`), and a ContentPresenter's
	   defaults to Stretch (`DependencyProperty.cpp:613-618`, arranged at `ContentPresenter.cpp
	   :891-894`), so what they hold is given the strip's height and places itself in it, as a
	   TextBlock with `VerticalAlignment="Center"` does in the Gallery's sample. A child brings
	   its own alignment: this package's Button does not yet carry its style's
	   `VerticalAlignment="Center"` (`Button_themeresources.xaml:162`), so in a header it
	   stretches unless the caller centres it; and a child of fixed height sits at the top here,
	   where XAML centres a Stretch child smaller than its slot. Centring here would fix those two
	   but shrink every child of auto height, which XAML's default `VerticalAlignment` of Stretch
	   (`DependencyProperty.cpp:613`) has fill the row; a child that wants centring says so. */
	.strip-header,
	.strip-footer {
		display: flex;
	}
	.strip-footer {
		/* `RightContentColumn` is the Grid's only `*` column (`TabView.xaml:34`) and its presenter
		   stretches into it (`TabView.xaml:43`). */
		flex: 1 1 auto;
		min-width: 0;
	}

	.add-slot,
	.scroll-slot {
		display: flex;
		/* `VerticalAlignment="Bottom"` on all three containers (`TabView.xaml:40`, `:157`, `:163`),
		   which puts the button's bottom edge on the bottom of the strip's border line. */
		align-self: flex-end;
		flex: none;
	}
	.add-slot {
		padding: var(--winui-TabViewItemAddButtonContainerPadding);
	}
	.scroll-slot.back {
		padding: var(--winui-TabViewItemLeftScrollButtonContainerPadding);
	}
	.scroll-slot.forward {
		padding: var(--winui-TabViewItemRightScrollButtonContainerPadding);
	}

	.add,
	.scroll {
		position: relative;
		display: grid;
		flex: none;
		place-items: center;
		padding: 0;
		font-family: var(--winui-SymbolThemeFontFamily);
		line-height: normal;
		border-style: solid;
		/* `TabViewScrollButtonStyle` reads the add button's thickness key and has none of its own
		   (`TabView.xaml:592`). */
		border-width: var(--winui-TabViewButtonBorderThickness);
		border-radius: var(--winui-ControlCornerRadius);
		cursor: pointer;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	.add {
		width: var(--winui-TabViewItemAddButtonWidth);
		height: var(--winui-TabViewItemAddButtonHeight);
		font-size: var(--winui-TabViewItemAddButtonFontSize);
		background: var(--winui-TabViewButtonBackground);
		color: var(--winui-TabViewButtonForeground);
		border-color: var(--winui-TabViewButtonBorderBrush);
	}
	.add:hover:not(:disabled) {
		background: var(--winui-TabViewButtonBackgroundPointerOver);
		color: var(--winui-TabViewButtonForegroundPointerOver);
		border-color: var(--winui-TabViewButtonBorderBrushPointerOver);
	}
	.add:active:not(:disabled) {
		background: var(--winui-TabViewButtonBackgroundPressed);
		color: var(--winui-TabViewButtonForegroundPressed);
		border-color: var(--winui-TabViewButtonBorderBrushPressed);
	}
	.add:disabled {
		background: var(--winui-TabViewButtonBackgroundDisabled);
		color: var(--winui-TabViewButtonForegroundDisabled);
		border-color: var(--winui-TabViewButtonBorderBrushDisabled);
		cursor: default;
	}

	.scroll {
		width: var(--winui-TabViewItemScrollButtonWidth);
		height: var(--winui-TabViewItemScrollButtonHeight);
		font-size: var(--winui-TabViewItemScrollButonFontSize);
		background: var(--winui-TabViewScrollButtonBackground);
		color: var(--winui-TabViewScrollButtonForeground);
		border-color: var(--winui-TabViewScrollButtonBorderBrush);
	}
	.scroll:hover:not(:disabled) {
		background: var(--winui-TabViewScrollButtonBackgroundPointerOver);
		color: var(--winui-TabViewScrollButtonForegroundPointerOver);
		border-color: var(--winui-TabViewScrollButtonBorderBrushPointerOver);
	}
	.scroll:active:not(:disabled) {
		background: var(--winui-TabViewScrollButtonBackgroundPressed);
		color: var(--winui-TabViewScrollButtonForegroundPressed);
		border-color: var(--winui-TabViewScrollButtonBorderBrushPressed);
	}
	.scroll:disabled {
		background: var(--winui-TabViewScrollButtonBackgroundDisabled);
		color: var(--winui-TabViewScrollButtonForegroundDisabled);
		border-color: var(--winui-TabViewScrollButtonBorderBrushDisabled);
		cursor: default;
	}

	.add:focus-visible::before,
	.scroll:focus-visible::before {
		content: '';
		position: absolute;
		/* c1-allow: TabView.xaml:238 and :594, both `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: TabView.xaml:238 and :594, both `FocusVisualMargin="-3"` */
		border-radius: calc(var(--winui-ControlCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	.tab {
		/* `TabViewItem.cpp:107` — "Assumes 4px curving-out corners, which are hardcoded in the
		   markup", and `TabView.xaml:547` draws them as 4x4 Paths. */
		position: relative;
		display: flex;
		/* `TabView.cpp`'s Equal width mode, which is the default: every tab gets the same width,
		   capped at TabViewItemMaxWidth and floored at TabViewItemMinWidth.
		   A `width` rather than a `flex-basis`, measured: the strip's Auto column is a flex item
		   sized to its own max-content, and a flex item's basis does not reach that calculation —
		   with `flex: 0 1 240px` the three tabs came out 142px each, their content width. */
		flex: 0 1 auto;
		width: var(--winui-TabViewItemMaxWidth);
		min-width: var(--winui-TabViewItemMinWidth);
		height: var(--winui-TabViewItemMinHeight);
		cursor: pointer;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	/* `TabView::UpdateTabWidths` (`TabView.cpp:1140` and `:1276`) leaves `tabWidth` at NaN for both
	   of the non-Equal modes, so `tvi.Width(NaN)` is Auto and neither `TabViewItemMinWidth` nor
	   `TabViewItemMaxWidth` is read at all — measured, a `Home` tab comes out 78px in both. */
	.root[data-width-mode='sizeToContent'] .tab,
	.root[data-width-mode='compact'] .tab {
		flex: 0 0 auto;
		width: auto;
		min-width: 0;
	}

	/* `TabViewItem::UpdateWidthModeVisualState` (`TabViewItem.cpp:284-295`) enters `Compact`
	   only for a tab that is *not* selected, and the state (`TabView.xaml:482-491`) collapses the
	   label and zeroes the icon's trailing margin. The icon already carries
	   `TabViewItemHeaderIconSize` as its width, which is the third setter. */
	.root[data-width-mode='compact'] .tab:not([data-selected='true']) .label {
		display: none;
	}
	.root[data-width-mode='compact'] .tab:not([data-selected='true']) .icon {
		margin: 0;
	}

	.body {
		position: relative;
		display: flex;
		/* A flex item of `.tab` rather than `height: 100%`, so the selected state's
		   `TabViewSelectedItemHeaderMargin` takes its pixel off the bottom the way a XAML Margin
		   does, instead of pushing the body past the tab. */
		flex: 1 1 auto;
		min-width: 0;
		align-items: center;
		box-sizing: border-box;
		/* `TabView.xaml:492-503`: the CloseIconStates group sets the padding in both of its
		   states, and `TabViewItem::UpdateCloseButton` (`TabViewItem.cpp:251-282`) is always in
		   one of them, so the Style's own `TabViewItemHeaderPadding` is never what draws. */
		padding: var(--winui-TabViewItemHeaderPaddingWithCloseButton);
		border: var(--winui-TabViewItemBorderThickness) solid transparent;
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
		/* `padding-box`. Upstream's tab header is `<Grid x:Name="TabContainer">`
		   (`TabView.xaml:562`), and what it takes from the templated parent is four
		   `{TemplateBinding}`s — Background, BorderBrush, BorderThickness, FocusVisualMargin —
		   plus CornerRadius, through a `{Binding}` to that same parent with a converter. Its
		   `Padding` is not a binding at all but a `{ThemeResource}` — `TabViewItemHeaderPadding`,
		   which is the one the comment on `padding` above says a visual state overrides.
		   `BackgroundSizing` is none of them, and the string does not occur in
		   `TabView_themeresources.xaml` at all. The three the template does write are the close,
		   add and scroll buttons' presenters (`TabView.xaml:191`, `:242`, `:599`), so nothing
		   reaches this Grid and it takes the property's default.

		   The chain is the Grid's own. `CGrid::GetBackgroundSizing` reads `Grid_BackgroundSizing`
		   itself (`Grid.cpp:1692`); the property is registered sparse with no default
		   (`StaticMetadata.g.cpp:33173`) and is not among the exceptions the switch at
		   `DependencyProperty.cpp:120` enumerates, so it takes the zero value of its enum —
		   `InnerBorderEdge`, `EnumDefs.g.h:552`. `CFrameworkElement::GetBackgroundSizing`
		   (`framework.cpp:2711`) returns that value outright, so the two agree here; it is the
		   fallback for types that do not declare the property, and a Grid does.

		   What is different from the picker presenters is that the stroke is not translucent but
		   absent: 1px on every side (`TabView.xaml:298`,
		   `TabView_themeresources.xaml:267`) painted with `SubtleFillColorTransparentBrush`
		   (`TabView.xaml:299`, `TabView_themeresources.xaml:69`). So this is geometry rather than
		   compositing — unclipped, a state's fill occupies a 1px ring where upstream leaves the
		   tab strip showing through. Measured on this build at the body's left and right edges on
		   the horizontal midline, on a tab neither of whose neighbours is selected: hovered 233
		   light and 45 dark against 243 and 32 once clipped, pressed 252 and 43 against the same
		   243 and 32.

		   `background` is a shorthand, so every state rule below that paints repeats the clip:
		   the declaration that drops it is the one that does not mention it. Four of the five
		   rules that give this element a background do — rest, hover, pressed, disabled. The
		   fifth is the selected rule, which writes `transparent` and so has no fill to clip; it
		   is named here because a sentence written as a rule otherwise reads as covering it. The
		   resting and disabled fills are themselves transparent in light and dark and opaque in
		   high contrast, so their clip is for that theme alone.

		   **The selected tab is a different element, in light and dark.** Upstream's Selected
		   state sets `TabContainer.Background` to `TabViewItemHeaderBackground`
		   (`TabView.xaml:342`) and paints the visible fill on a separate `SelectedBackgroundPath`
		   (`TabView.xaml:341`) — a Path, which has no border for a background to be sized
		   against. `.tab[data-selected='true']::before` below is that Path, and its geometry
		   answers to the Path's rather than to this Grid's.

		   In high contrast that brush is not transparent — `SystemColorButtonFaceColor` — so
		   upstream's selected Grid does paint a fill, and does clip it. The rule below writes
		   `transparent` instead of the token, which is a divergence older and wider than this
		   one; it is left as it was, and the clip is not what would fix it. */
		background: var(--winui-TabViewItemHeaderBackground) padding-box;
		color: var(--winui-TabViewItemHeaderForeground);
	}

	.tab:not([data-closable]) .body {
		padding: var(--winui-TabViewItemHeaderPaddingWithoutCloseButton);
	}
	.root[data-close-mode='onPointerOver'] .tab:not([data-selected='true']):not(:hover) .close {
		display: none;
	}
	.root[data-close-mode='onPointerOver'] .tab:not([data-selected='true']):not(:hover) .body {
		padding: var(--winui-TabViewItemHeaderPaddingWithoutCloseButton);
	}

	.icon {
		font-weight: normal;
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: var(--winui-TabViewItemHeaderIconSize);
		height: var(--winui-TabViewItemHeaderIconSize);
		margin: var(--winui-TabViewItemHeaderIconMargin);
		font-family: var(--winui-SymbolThemeFontFamily);
		/* The template scales the icon into a Viewbox of this size (`TabView.xaml:568`), so the
		   glyph's em is the box. */
		font-size: var(--winui-TabViewItemHeaderIconSize);
		line-height: normal;
		color: var(--winui-TabViewItemIconForeground);
	}

	.label {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.close {
		display: grid;
		flex: none;
		place-items: center;
		width: var(--winui-TabViewItemHeaderCloseButtonWidth);
		height: var(--winui-TabViewItemHeaderCloseButtonHeight);
		margin: var(--winui-TabViewItemHeaderCloseMargin);
		padding: 0;
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-TabViewItemHeaderCloseFontSize);
		line-height: normal;
		border: 0;
		border-radius: var(--winui-ControlCornerRadius);
		cursor: pointer;
		background: var(--winui-TabViewItemHeaderCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderCloseButtonForeground);
	}

	.separator {
		position: absolute;
		/* The Thickness emits in CSS order, so `inset` reads it whole — `8px 0px 8px 0px`, which
		   is `TabViewItemSeparatorMargin`. `left: auto` then releases the left edge, so `width`
		   and the inset's own right decide the rest. */
		inset: var(--winui-TabViewItemSeparatorMargin);
		left: auto;
		width: 1px;
		background: var(--winui-TabViewItemSeparator);
	}

	/* `TabView.cpp:217-231` and `TabViewItem.cpp:503-519` hide a separator for its own and its
	   following tab's selected, hover, and pressed states. */
	.tab[data-selected='true'] .separator,
	.tab:has(+ .tab[data-selected='true']) .separator,
	.tab:hover .separator,
	.tab:has(+ .tab:hover) .separator,
	.tab:active .separator,
	.tab:has(+ .tab:active) .separator {
		opacity: 0;
	}

	.tab:not([data-selected='true']):hover:not([aria-disabled='true']) .body {
		/* `padding-box`: the note on `.body` above carries the argument and the measurement. */
		background: var(--winui-TabViewItemHeaderBackgroundPointerOver) padding-box;
		color: var(--winui-TabViewItemHeaderForegroundPointerOver);
	}
	.tab:not([data-selected='true']):hover:not([aria-disabled='true']) .icon {
		color: var(--winui-TabViewItemIconForegroundPointerOver);
	}
	.tab:not([data-selected='true']):hover:not([aria-disabled='true']) .close {
		background: var(--winui-TabViewItemHeaderPointerOverCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderPointerOverCloseButtonForeground);
	}
	.tab:not([data-selected='true']):active:not([aria-disabled='true']) .body {
		/* `padding-box`, for the reason on `.body` above. */
		background: var(--winui-TabViewItemHeaderBackgroundPressed) padding-box;
		color: var(--winui-TabViewItemHeaderForegroundPressed);
	}
	.tab:not([data-selected='true']):active:not([aria-disabled='true']) .icon {
		color: var(--winui-TabViewItemIconForegroundPressed);
	}
	.tab:not([data-selected='true']):active:not([aria-disabled='true']) .close {
		background: var(--winui-TabViewItemHeaderPressedCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderPressedCloseButtonForeground);
	}

	.tab[data-selected='true'] {
		z-index: 1;
	}
	.tab[data-selected='true']::before {
		content: '';
		position: absolute;
		inset: 0 -1px 0 -1px;
		z-index: -1;
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
		background: var(--winui-TabViewItemHeaderBackgroundSelected);
	}
	.tab[data-selected='true'] .body {
		/* `TabViewSelectedItemHeaderMargin` — 1px wider on each side, 1px short at the bottom. */
		margin: var(--winui-TabViewSelectedItemHeaderMargin);
		/* `TabViewSelectedItemBorderThickness` is `1,1,1,0`; the emitted Thickness is in CSS
		   order, so it can be read whole. */
		border-width: var(--winui-TabViewSelectedItemBorderThickness);
		/* Transparent here, painted on `::after` below. The width still has to be declared: it
		   is what insets the label, the icon and the close button by the pixel the border
		   occupies, and dropping it would move all three. */
		border-color: transparent;
		background: transparent;
	}

	/* `TabViewSelectedItemBorderBrush` (`TabView_themeresources.xaml:72-80`) is a gradient over
	   four absolute pixels; measured on the original, the left and right borders fade out over
	   the bottom five while the top stays solid. A mask does that and leaves the 8px corners
	   intact — but a mask applies to an element's descendants too, so it goes on a pseudo-element
	   that carries only the border rather than on the body, which also carries the text.
	   `currentColor` is the mask's own alpha source and never renders; a colour literal here
	   would be a colour the component does not paint. */
	.tab[data-selected='true'] .body::after {
		content: '';
		position: absolute;
		/* An absolutely positioned child is placed against the padding box, so a negative inset
		   of the border's own width puts this exactly on the body's border box. */
		inset: -1px -1px 0 -1px;
		border-width: var(--winui-TabViewSelectedItemBorderThickness);
		border-style: solid;
		border-color: var(--winui-TabViewBorderBrush);
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
		pointer-events: none;
		-webkit-mask: linear-gradient(to bottom, currentColor calc(100% - 5px), transparent 100%);
		mask: linear-gradient(to bottom, currentColor calc(100% - 5px), transparent 100%);
	}
	.tab[data-selected='true'] .body,
	.tab[data-selected='true']:hover:not([aria-disabled='true']) .body,
	.tab[data-selected='true']:active:not([aria-disabled='true']) .body {
		color: var(--winui-TabViewItemHeaderForegroundSelected);
	}
	.tab[data-selected='true'] .icon {
		color: var(--winui-TabViewItemIconForegroundSelected);
	}
	.tab[data-selected='true'] .label {
		/* c1-allow: TabView.xaml:351, :370 and :389 each set `ContentPresenter.FontWeight` to
		   `SemiBold` inline — all three selected states do, so hovering a selected tab does not
		   thin its label — and no resource stands behind the value. */
		font-weight: 600;
	}
	.tab[data-selected='true'] .close {
		background: var(--winui-TabViewItemHeaderSelectedCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderSelectedCloseButtonForeground);
	}
	.tab[data-selected='true']:hover:not([aria-disabled='true']) .body {
		color: var(--winui-TabViewItemHeaderForegroundPointerOver);
	}
	.tab[data-selected='true']:hover:not([aria-disabled='true']) .icon {
		color: var(--winui-TabViewItemIconForegroundPointerOver);
	}
	.tab[data-selected='true']:hover:not([aria-disabled='true']) .close {
		background: var(--winui-TabViewItemHeaderPointerOverCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderPointerOverCloseButtonForeground);
	}
	.tab[data-selected='true']:active:not([aria-disabled='true']) .body {
		color: var(--winui-TabViewItemHeaderForegroundPressed);
	}
	.tab[data-selected='true']:active:not([aria-disabled='true']) .icon {
		color: var(--winui-TabViewItemIconForegroundPressed);
	}
	.tab[data-selected='true']:active:not([aria-disabled='true']) .close {
		background: var(--winui-TabViewItemHeaderPressedCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderPressedCloseButtonForeground);
	}

	.tab[data-selected='true']::after,
	.flare-right {
		content: '';
		position: absolute;
		bottom: 0;
		width: 4px;
		height: 4px;
		background:
			radial-gradient(
				circle 4px at 0 0,
				transparent 0 3px,
				var(--winui-TabViewBorderBrush) 3px 4px,
				transparent 4px
			),
			radial-gradient(
				circle 4px at 0 0,
				transparent 0 4px,
				var(--winui-TabViewItemHeaderBackgroundSelected) 4px
			);
	}
	.tab[data-selected='true']::after {
		left: -4px;
	}
	.flare-right {
		right: -4px;
		background:
			radial-gradient(
				circle 4px at 100% 0,
				transparent 0 3px,
				var(--winui-TabViewBorderBrush) 3px 4px,
				transparent 4px
			),
			radial-gradient(
				circle 4px at 100% 0,
				transparent 0 4px,
				var(--winui-TabViewItemHeaderBackgroundSelected) 4px
			);
	}

	/* The button's own states. The tab's rules above set the button's `Background`
	   (`TabView.xaml:320`), and the button's template paints over that in its own PointerOver and
	   Pressed states (`TabView.xaml:198`, `:211`), so under a pointer that is over both, the
	   button's wins. These are as specific as the tab's and come after them, which is what makes
	   them win here: with one class fewer they lost, and the button showed no fill at all. */
	.tab:not([aria-disabled='true']):hover .close:hover {
		background: var(--winui-TabViewItemHeaderCloseButtonBackgroundPointerOver);
		color: var(--winui-TabViewItemHeaderCloseButtonForegroundPointerOver);
	}
	.tab:not([aria-disabled='true']):active .close:active {
		background: var(--winui-TabViewItemHeaderCloseButtonBackgroundPressed);
		color: var(--winui-TabViewItemHeaderCloseButtonForegroundPressed);
	}
	.tab[aria-disabled='true'] .body {
		/* `padding-box`: transparent in light and dark, `SystemColorWindowColor` in high
		   contrast, which is the theme where this one is visible. */
		background: var(--winui-TabViewItemHeaderBackgroundDisabled) padding-box;
		color: var(--winui-TabViewItemHeaderForegroundDisabled);
	}
	.tab[aria-disabled='true'] .icon {
		color: var(--winui-TabViewItemIconForegroundDisabled);
	}
	.tab[aria-disabled='true'] .close {
		background: var(--winui-TabViewItemHeaderDisabledCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderDisabledCloseButtonForeground);
		cursor: default;
	}
	.tab[aria-disabled='true'] {
		cursor: default;
	}

	.tab:focus-visible .body::before {
		content: '';
		position: absolute;
		inset: calc(
			-1 * (var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
		);
		border-radius: calc(
				var(--winui-OverlayCornerRadius) + var(--winui-FocusVisualPrimaryThickness) +
					var(--winui-FocusVisualSecondaryThickness)
			)
			calc(
				var(--winui-OverlayCornerRadius) + var(--winui-FocusVisualPrimaryThickness) +
					var(--winui-FocusVisualSecondaryThickness)
			)
			calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
			calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness));
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	.content {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	.panel {
		flex-grow: 1;
	}

	.panel[hidden] {
		display: none;
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
		/* Holds the consumer's own layout, which the browser still forces. */
		.strip-header {
			forced-color-adjust: auto;
		}
		/* Holds the consumer's own layout, which the browser still forces. */
		.strip-footer {
			forced-color-adjust: auto;
		}
		/* Holds the consumer's own layout, which the browser still forces. */
		.panel {
			forced-color-adjust: auto;
		}
	}
</style>
