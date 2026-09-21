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
}

/** Publish the pane's state. The argument is a getter so the value stays reactive. */
export function setNavigationViewPane(state: () => NavigationViewPaneState) {
	setContext(PANE, state);
}

/**
 * Read it, or throw. An absent context means the row is not inside a pane.
 *
 * `NavigationViewItem` is not re-exported from `index.ts` and the control is its only
 * caller here — but internal means unexported, not unreachable. The package's exports map
 * publishes every file under `dist` (`package.json:31-36`), so a consumer who writes
 * `winui-svelte/components/NavigationViewItem.svelte` resolves it today. This is a
 * reachable failure, and it throws rather than returning `undefined` for the caller to
 * render around: `internal/command-bar.ts` returns `undefined` because a command outside a
 * bar is a real case with a real answer, while a row outside a pane would draw with no
 * selection, no expansion and no invoke — which reads as a styling defect rather than as
 * the mistake it is. What such a row *should* do is a question for the unit that makes the
 * component public, and it is not answered here.
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
	 * This row is drawn inside the rail's children flyout, at any depth within it.
	 *
	 * It has no upstream counterpart and it is here for one reason: the flyout shows labels,
	 * so the rail's tooltip is redundant inside it, and the primitive's tooltip takes the
	 * Escape that should have closed the flyout. WD-092.
	 */
	inFlyout: boolean;
}

/**
 * Publish where the rows rendered from here sit. The pane publishes `{ level: 1, topLevel:
 * true }`.
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
