/**
 * What a `NavigationView`'s pane tells the rows inside it.
 *
 * WinUI holds these on the items themselves and the control writes them: selection is
 * `NavigationViewItemBase.IsSelected` (`NavigationView.idl:315`), expansion is
 * `NavigationViewItem.IsExpanded` (`NavigationView.idl:347`), and the container walks its
 * own `MenuItems` to set them. This library holds them on the control instead — `selected`
 * is an id and `expandedItems` a list of them — and pushed each one down as a prop, which
 * works only while the control is also what renders the row.
 *
 * ADR 0015 ends that: a consumer's snippet draws the row, so the control no longer holds
 * the element it must inform. A Svelte parent cannot reach into a snippet, so the same
 * facts travel as context — the shape `internal/command-bar.ts` ships, minus its second
 * half. There a command reads context as the default under its own prop and a prop the
 * consumer passes wins; here there is still nothing to layer under, and the reason changed
 * when `NavigationViewItem` took its own props. It has them now, and none of them is a
 * second spelling of anything here: `tag` is the argument each lookup below is made with,
 * not an override of its answer. `IsSelected` and `IsExpanded` are the two that would be,
 * and they are deliberately absent — a prop for either is a second writer for a fact this
 * library holds on the control, and the unit that gives one a second writer is the unit
 * that owes the prop-wins rule.
 *
 * Two keys rather than one, because they have different lifetimes. The pane's state is one
 * value for the whole subtree and the control publishes it once. The level is different at
 * every depth: each row reads the level it sits at and publishes one deeper for its own
 * children, so a row's `aria-level` is a fact about where it was rendered rather than a
 * number its caller has to count.
 *
 * **Only the left pane reads this, and that is a decision rather than an oversight.**
 * `expandedItems`, `setExpanded` and `collapsed` describe the left pane and mean nothing in
 * top mode, where the control renders `NavigationViewTopItem` instead. The record is
 * published in both modes anyway, because `setContext` has to run during initialisation and
 * putting it under a display-mode branch is a worse trap than an unread record. `selected`
 * and `onItemInvoked` are the pair both panes need, and `NavigationViewTopItem.svelte` still
 * takes exactly those two as props — one fact carried two ways, which is the drift ADR 0015
 * names. Splitting this record into a shared key and a left-only one would be a second
 * mechanism with no second reader, so the unit that gives the top item a reason to read
 * context is the unit that splits it.
 */
import { getContext, setContext } from 'svelte';
import type { Snippet } from 'svelte';
// Type-only, and that is what keeps it honest: the component imports this module, so a value
// import of the component here would be a cycle. `import type` is erased before there is one.
import type { NavigationViewEntry } from '../components/NavigationView.svelte';

const PANE = Symbol('winui-svelte.navigation-view.pane');
const LEVEL = Symbol('winui-svelte.navigation-view.level');

/** What one pane tells every row under it. */
export interface NavigationViewPaneState {
	/** `SelectedItem`, narrowed by this library to the id the consumer holds. */
	selected: string | null;
	/** Every expanded row's id. Upstream's per-item `IsExpanded`, held by the control. */
	expandedItems: string[];
	/** The control's one writer for expansion. A row asks; it never edits the array. */
	setExpanded: (id: string, open: boolean) => void;
	/** `ItemInvoked`. */
	onItemInvoked?: (id: string) => void;
	/** `ShouldEnableToolTip`: the left pane is the closed-compact icons-only rail. */
	collapsed: boolean;
	/**
	 * `MenuItemTemplate` (`NavigationView.idl:207`) — the consumer's snippet for one entry,
	 * absent when the control draws its own rows.
	 *
	 * It travels here rather than down as a prop because a row's *children* are templated
	 * too: upstream hands an item's own repeater the same factory its five own repeaters get
	 * (`NavigationViewItem.cpp:171`, against `NavigationView.cpp:470`, `:492`, `:511`, `:557`
	 * and `:580`), so the template reaches every depth — and a Svelte parent cannot reach
	 * into a snippet, which is the constraint this whole module exists for.
	 *
	 * The entry is typed by the bound rather than by the control's `T`. At the top level that
	 * is exact and the control casts once where it publishes this, saying so. On the nested
	 * path it is a widening: `NavigationViewItem`'s `items` prop is `NavigationViewItemData[]`,
	 * so a template that reads a row's own extra fields sees the bound's there. The unit that
	 * makes the item generic in its row is what would carry `T` the rest of the way.
	 */
	menuItemTemplate?: Snippet<[NavigationViewEntry, number]>;
	/**
	 * The rows a Tab into the pane lands on, or `null` when every row is an ordinary tab stop.
	 *
	 * `OnRepeaterGettingFocus` (`NavigationView.cpp:2944`) has the two halves of it, and they
	 * are two branches rather than one rule. Focus arriving from **outside** a root repeater is
	 * redirected onto `GetContainerForIndexPath(selectedIndex, lastVisible = true)` (`:2988`) —
	 * the selected row, or its deepest on-screen ancestor when the selection sits inside a
	 * collapsed subtree. A Tab from **within** the same repeater instead walks the rows
	 * `FindNextElement` keeps offering and sets `IsTabStop(false)` on each (`:3018`) until the
	 * search leaves the repeater, restoring them afterwards. Together they are what the
	 * reference press recorded: one stop per list, and that stop is the selected row.
	 *
	 * **Both halves run only after a Tab the control itself saw.** The guard at `:2947` reads
	 * `m_TabKeyPrecedesFocusChange`, which the control's own key handlers set for Tab and clear
	 * for any other key (`:3087-3126`), and which is cleared otherwise only when focus arrives in
	 * a root list (`:3044`). `KeyDown` bubbles, so the control sees a key only when focus was
	 * inside it. A Tab pressed outside it, in a title bar above the control as the Gallery's is
	 * (`MainWindow.xaml:23-61`, beside the control at `:137`), is redirected only if a Tab the
	 * control saw is still pending; with none, focus lands on the list's first row. Both were
	 * pressed on the reference, from its search box: `Home` on 2026-10-24, and on 2026-10-26
	 * `Home` after a pointer had put focus there and the selected row after a Shift+Tab had.
	 *
	 * **Upstream's mechanism acts on the Tab, and this one is set before it.** There every row is
	 * a tab stop until a Tab asks otherwise; here the rows that are not the stop carry
	 * `tabindex="-1"`, and the stop follows the focus (`noteFocus` below, and the flag beside it
	 * in `NavigationView.svelte`). It is the focused row while focus is on a row of the list,
	 * which is the walk out of the repeater: a Tab from that row reaches no other row of it. It
	 * is the selected row, as above, while focus is anywhere else inside the control, or outside
	 * it with a Tab pending. And it is the list's first row while focus is outside the control
	 * with none, the Tab that nothing redirects. The two agree on entering the list from either
	 * side of it, on leaving it in either direction from any of its rows, and on a row focused by
	 * pointer. They part in three places. A Shift+Tab into the menu from past the control with no
	 * Tab pending and no footer row drawn lands upstream on the menu's last row and here on its
	 * first. A Shift+Tab into a list that does not hold the selection, from below it inside the
	 * control — from the content into the footer, or from a footer row into the menu — is the same
	 * case with the Tab pending: nothing redirects it (`:2986`), so upstream lands wherever XAML's
	 * reverse tab search enters the repeater, and here on the first row. The pin's core search
	 * resolves a container to its last focusable element in tab order, with no memory of an earlier
	 * focus on that path for a `TabFocusNavigation="Once"` scope such as a repeater; which row that
	 * is under an expanded last row is not settled by the reading, and it was not pressed. WD-108
	 * in `docs/divergences.md` records it. And a press on something inside the
	 * control that takes no focus leaves focus where it was upstream, while the browser moves it
	 * to the body, outside the control.
	 *
	 * Both of upstream's branches are guarded by `m_selectionModel.SelectedIndex()`, so with no
	 * selection at all neither fires and the rows are tab stops as they come. That is what
	 * `null` means here: the pin's own guard, not a default chosen for it.
	 *
	 * A list rather than one id, because the pane has two root lists — the menu and the footer,
	 * which is `footerItems` with the settings row appended (`NavigationView.cpp:866-871`) — and
	 * that is why Tab reaches Settings as a stop of its own when no footer item is drawn above it.
	 * It holds at most two, one per list, so membership is a scan, and a `string[]` is what
	 * `expandedItems` beside it already is.
	 */
	tabStops: string[] | null;
	/**
	 * Where focus is, as `tabStops` needs it. A row reports its own focus here with its tag, and
	 * the control works out which list that row is in and tells inside from outside itself. The
	 * report also clears the pending Tab, as focus arriving in a root list does upstream. A row in
	 * the rail's flyout reports too, and its tag names a row the rail does not draw, so no rail
	 * row is a stop while focus is on a row of the flyout. Its report clears the pending Tab as
	 * well, where the flyout's list is no root list upstream; nothing can tell, because the flyout is
	 * drawn outside the control, so no key pressed in it reaches the control's listeners, and a
	 * key or a press that opens it from its row has cleared the flag already. A flyout opened
	 * from script, through `expandedItems`, clears nothing first; telling the two apart then
	 * takes a press in the flyout, a dismissal outside the control and a Tab back in.
	 */
	noteFocus: (tag: string) => void;
}

/** Publish the pane's state. The argument is a getter so the value stays reactive. */
export function setNavigationViewPane(state: () => NavigationViewPaneState) {
	setContext(PANE, state);
}

/**
 * Read it, or throw. An absent context means the row is not inside a pane.
 *
 * `NavigationViewItem` is in the release (ADR 0017), so a consumer can place one anywhere. It
 * throws rather than returning `undefined` for the caller to render around:
 * `internal/command-bar.ts` returns `undefined` because a command outside a bar is a real case
 * with a real answer, while a row outside a pane would draw with no selection, no expansion and
 * no invoke — which reads as a styling defect rather than as the mistake it is. The unit that
 * made the component public kept the throw, because replacing the throw with a behaviour later
 * is not a breaking change, while a behaviour chosen now could not be changed later without one.
 */
export function getNavigationViewPane(): () => NavigationViewPaneState {
	const state = getContext<(() => NavigationViewPaneState) | undefined>(PANE);
	if (!state) throw new Error('NavigationViewItem must be rendered inside a NavigationView.');
	return state;
}

/**
 * Where a row sits, as upstream's two separate facts rather than as one number.
 *
 * `level` is `Depth` (`NavigationViewItemBase`), 1-based here because it is also the row's
 * `aria-level`. `topLevel` is `IsTopLevelItem`, and the two are **not** the same question:
 * upstream computes it as "my parent repeater is one of the control's own"
 * (`NavigationView.cpp:5748-5751`), never from the depth. The rail's flyout is what separates
 * them — a row inside it is given depth 0 (`PropagateDepthToChildren(0)`,
 * `NavigationViewItem.cpp:883`) and is still not top-level, because the repeater it sits in is
 * the reparented children one. Reading rootness off the depth would give every flyout child
 * with children a flyout of its own, which upstream does not do.
 */
export interface NavigationViewPlacement {
	/** `Depth` + 1, so a top-level row is 1. Drives `aria-level` and the left indentation. */
	level: number;
	/** `IsTopLevelItem`: this row is in one of the control's own lists. */
	topLevel: boolean;
	/**
	 * The tag of the top-level row whose children flyout this row is drawn in, at any depth
	 * within it; `null` outside the rail's children flyout.
	 *
	 * A leaf invoked inside it collapses that row, which closes the flyout, as
	 * `NavigationView::CloseFlyoutIfRequired` does (`NavigationView.cpp:360-390`), and a row
	 * inside it is a tab stop whatever `tabStops` says.
	 */
	flyoutOwner: string | null;
}

/**
 * Publish where the rows rendered from here sit. The pane publishes `{ level: 1, topLevel:
 * true, flyoutOwner: null }`.
 *
 * A getter rather than a value, for the same reason the pane's state is one: what a row
 * publishes is not fixed at initialisation. The pane opening and closing moves a row's
 * children between the flyout and the list below it while the row stays mounted, and
 * `setContext` runs once.
 */
export function setNavigationViewPlacement(placement: () => NavigationViewPlacement) {
	setContext(LEVEL, placement);
}

/**
 * Read it. A row reads its own placement, then publishes one for its children. There is no
 * fallback default: the pane publishes before it renders a row, and a call that got here
 * without one has already thrown on `PANE` above.
 */
export function getNavigationViewPlacement(): () => NavigationViewPlacement {
	return getContext<() => NavigationViewPlacement>(LEVEL);
}

/**
 * The attribute a keyboard ring's root carries.
 *
 * `closest` finds the innermost, which is what makes the rail's children flyout a ring of its
 * own with no ordering logic anywhere: the pane carries the marker and so does the flyout's
 * list, and a row inside the flyout resolves to the flyout.
 *
 * It is here rather than in the two components because both of them write it and one of them
 * reads it, and a string spelled in three places is the shape a rename breaks silently.
 */
export const RING_ROOT = 'data-navigation-view-ring';

/**
 * The same marker as something to spread onto a ring root, so no component has to spell the
 * attribute itself. One frozen object rather than a fresh one per render, which would make
 * the spread a new value every time.
 */
export const RING_ROOT_ATTRIBUTE: Record<string, string> = Object.freeze({ [RING_ROOT]: '' });

/**
 * The element above the ring's first row — the pane toggle.
 *
 * **Upstream has no such marker, because upstream does not need one.** `FocusNextUpItem`
 * (`NavigationView.cpp:2773`) is a *repair* on XAML's geometric focus navigation rather than a
 * replacement for it: from the first row, `FindNextElement(Up)` returns the toggle, the
 * `try_as<NavigationViewItem>` at `:2786` fails so the whole correction is skipped, `Depth()`
 * is 0 so the climb-to-parent at `:2822` is skipped too, and the key goes back **unhandled**.
 * XAML's own directional navigation then moves focus onto the toggle. Pressed on the reference
 * on 2026-09-22: from the settings row, Up walks every visible row and then reaches the
 * hamburger.
 *
 * The web has no directional focus navigation, so declining the key moves nothing — which is
 * what this control did, and is the defect this marker exists to fix. Where upstream declines
 * and lets the platform finish, this has to name the element itself.
 */
export const RING_HEAD = 'data-navigation-view-ring-head';

/** The head marker, spreadable. One frozen object, as `RING_ROOT_ATTRIBUTE` is. */
export const RING_HEAD_ATTRIBUTE: Record<string, string> = Object.freeze({ [RING_HEAD]: '' });

/**
 * Move focus one visible row along the ring `row` sits in, and say whether it moved.
 *
 * Upstream's Up and Down are `FocusNextUpItem` (`NavigationView.cpp:2773`) and
 * `FocusNextDownItem` (`:2832`), and most of what they do is repair XAML's *geometric* focus
 * navigation: ask `FocusManager` for the element above or below, then check whether what came
 * back is a row at the same depth and, if not, descend into its last visible child or climb to
 * its parent. The observable that arithmetic produces is the previous or next **visible row in
 * document order** — which the DOM already has, so this reads the ring out of the document
 * rather than recomputing it from the item tree, and the tree's shape never enters.
 *
 * **Two scopes, because the pin has two, and they differ twice over.** Up and Down defer to
 * XAML's directional focus, which crosses out of the menu's repeater into the footer's below
 * it — the reference press recorded exactly that, Down reaching Settings and Up returning
 * (`docs/keyboard.md`, answer 2), and a footer item is crossed into the same way, being a row of
 * the footer's repeater above the settings row in it (`NavigationView.cpp:866-871`). Home and
 * End cross neither out of the list **nor into a subtree**: `KeyboardFocusFirstItemFromItem`
 * (`:2898`) and `KeyboardFocusLastItemFromItem` (`:2921`) take
 * `GetParentRootItemsRepeaterForContainer(nvib)` (`:2909`, `:2932`) and hand it to
 * `GetFirstFocusableElement` (`:2853`) or `GetLastFocusableElement` (`:2876`), each of which
 * walks **`ir.ItemsSourceView()`** — one repeater's own items — and never descends into a
 * child repeater. The arrows do descend, which is the same distinction from the other side:
 * `FocusNextUpItem` asks `FindLastFocusableElement(childRepeater)` (`:2799`) for the row above
 * an expanded parent, and `FocusNextDownItem` asks `FindFirstFocusableElement` (`:2844`).
 *
 * So End from a menu row reaches the **last top-level row**, even when that row is expanded
 * and its children are on screen below it. An earlier version of this function took the last
 * visible row instead; the comment said what upstream does and the code did not, and no
 * specimen on the harness could tell the two apart because the last top-level row there had no
 * children.
 *
 * In this DOM the two root lists are the pane's two `<ul role="tree">` — the menu's, and the
 * footer's holding `footerItems` and then the settings row — and an inline expanded subtree
 * is a `<ul role="group">` inside one of them, so `closest('[role="tree"]')` climbs to
 * the root exactly as `:1093` walks up to the root repeater — from any depth, which is why the
 * pressed row's own position never enters the ends. Inside the rail's children flyout the
 * flyout's own list is a `role="tree"` **and** carries the ring marker, so both scopes land on
 * it there — which is the `m_lastItemExpandedIntoFlyout` branch those two functions take first
 * (`:2901`, `:2924`).
 */
export function moveRingFocus(row: HTMLElement, key: string): boolean {
	// `checkVisibility` rather than `offsetParent !== null`: a closed minimal pane is hidden
	// with `visibility`, which leaves the rows laid out and gives every one of them an
	// `offsetParent`. A collapsed subtree is not in the document at all, so nothing here has
	// to know about expansion.
	const visibleRowsIn = (container: Element) =>
		[...container.querySelectorAll<HTMLElement>('[role="treeitem"]')].filter((candidate) =>
			candidate.checkVisibility({ visibilityProperty: true })
		);

	if (key === 'Home' || key === 'End') {
		const list = row.closest('[role="tree"]');
		// Unreachable for anything this control renders — every row carrying the handler sits in
		// one of the pane's lists or in a flyout's, and the top pane draws `NavigationViewTopItem`,
		// which never calls this. It is a guard rather than a case, and it is here because the
		// argument is a plain element and this module is reachable by a deep import.
		if (!list) return false;
		// The list's **own** rows. `closest` on the two list roles rather than a child selector,
		// because what has to be true is "this row belongs to this list and not to one nested in
		// it" — a consumer's `menuItemTemplate` may put a wrapper between the `<li>` and the row,
		// and a nested list is a `<ul role="group">` either way.
		const own = visibleRowsIn(list).filter(
			(candidate) => candidate.closest('[role="tree"],[role="group"]') === list
		);
		const next = key === 'Home' ? own[0] : own[own.length - 1];
		if (!next || next === row) return false;
		next.focus();
		return true;
	}

	const root = row.closest(`[${RING_ROOT}]`);
	// The same guard, and the same reason.
	if (!root) return false;
	const rows = visibleRowsIn(root);
	const at = rows.indexOf(row);
	if (at < 0) return false;
	// **The two ends are not the same, and both are measured now.** At the foot Down scrolled
	// the page the sample sits on rather than returning to the top (`docs/keyboard.md`,
	// answer 2), so there is no wrap and the key is left alone. At the head Up reaches the pane
	// toggle — pressed 2026-09-22 — which upstream gets by declining the key and letting XAML's
	// directional navigation finish the move. Nothing here wraps in either direction.
	if (key === 'ArrowUp' && at === 0) {
		const head = ringHeadFor(root);
		if (!head) return false;
		head.focus();
		return true;
	}
	const next = rows[key === 'ArrowDown' ? at + 1 : at - 1];
	if (!next || next === row) return false;
	next.focus();
	return true;
}

/**
 * The ring's head for a given ring root, or `null`.
 *
 * Depth-limited on purpose. The toggle is a child of the control's root grid rather than of the
 * pane — `PaneToggleButtonGrid` is a child of `RootGrid` (`NavigationView.xaml:180`) — so it is
 * found through the ring root's parent; and a `NavigationView` rendered inside another one's
 * content area would put a second toggle under the same ancestor, one level deeper than this
 * looks. `:scope > * > [head]` is that control's own toggle and nothing else's.
 */
function ringHeadFor(root: Element): HTMLElement | null {
	return root.parentElement?.querySelector<HTMLElement>(`:scope > * > [${RING_HEAD}]`) ?? null;
}

/**
 * Move focus from the ring's head onto its first visible row, and say whether it moved.
 *
 * **The other half of the same platform behaviour, and both halves are pressed.** Nothing in
 * `NavigationView` subscribes to the toggle's keys — the `KeyDown` handler is attached to each
 * item (`NavigationView.cpp:3595`) — so Down on the toggle is handled by nobody and XAML's
 * directional navigation moves focus to the row below, by the same mechanism that carries Up
 * the other way. Pressed on the reference on 2026-09-22, in the same sitting as the upward
 * half: Down on the hamburger enters the first row.
 *
 * The reading came first and the press followed, which is the order this file wants: the
 * mechanism said what to expect, and the expectation was checked rather than shipped.
 */
export function enterRingFromHead(head: HTMLElement, key: string): boolean {
	if (key !== 'ArrowDown') return false;
	const root = head.parentElement?.parentElement?.querySelector(`[${RING_ROOT}]`);
	if (!root) return false;
	const first = [...root.querySelectorAll<HTMLElement>('[role="treeitem"]')].find((candidate) =>
		candidate.checkVisibility({ visibilityProperty: true })
	);
	if (!first) return false;
	first.focus();
	return true;
}
