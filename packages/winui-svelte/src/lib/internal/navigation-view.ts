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
 * consumer passes wins; here there is nothing to layer it under until `NavigationViewItem`
 * takes the props ADR 0015 maps, and the unit that adds them adds the prop-wins rule with
 * them.
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

/** Publish the depth the rows rendered from here sit at. The pane publishes 1. */
export function setNavigationViewLevel(level: number) {
	setContext(LEVEL, level);
}

/**
 * Read it. A row reads its own level, then publishes `level + 1` for its children. There is
 * no fallback default: the pane publishes 1 before it renders a row, and a call that got
 * here without one has already thrown on `PANE` above.
 */
export function getNavigationViewLevel(): number {
	return getContext<number>(LEVEL);
}
