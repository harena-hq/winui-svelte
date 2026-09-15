/**
 * What a `CommandBar` tells the commands inside it.
 *
 * WinUI does this by walking `PrimaryCommands` and setting `IsCompact`, `LabelPosition` and
 * `IsInOverflow` on each `ICommandBarElement`. A Svelte parent cannot reach into a snippet,
 * so the same information travels as context and each command reads it as the default under
 * its own prop: a prop the consumer passes always wins.
 */
import { getContext, setContext } from 'svelte';

const KEY = Symbol('winui-svelte.command-bar');
const REGISTER = Symbol('winui-svelte.command-bar.register');

export interface CommandBarCommandState {
	/** ICommandBarElement.IsCompact. */
	compact: boolean;
	/** The effective label position, as `AppBarButton`'s own prop spells it. */
	labelPosition: 'bottom' | 'right' | 'collapsed';
	/** ICommandBarElement.IsInOverflow. */
	inOverflow: boolean;
	/** Whether the overflow menu reserves an icon column. */
	overflowWithMenuIcons: boolean;
	/** Whether the overflow menu reserves a check column. */
	overflowWithToggleButtons: boolean;
	/** Whether the scope a command sits in draws the sub-item chevron. `CommandBar` collapses
	 *  it for its whole subtree, popup included (`CommandBar_themeresources.xaml:95`);
	 *  `CommandBarFlyout` collapses it on the bar (`CommandBarFlyout_themeresources.xaml:649`)
	 *  and the overflow presenter turns it back on (`:552`). The resource is
	 *  `AppBarButtonHasFlyoutChevronVisibility` and `:264` is the setter that reads it. */
	subItemChevronVisible: boolean;
}

/** What one command tells the container it sits in about the space its peers must reserve. */
export interface CommandBarCommandShape {
	/** The command draws an icon, so the menu reserves an icon column. */
	icon: boolean;
	/** The command is a toggle, so the menu reserves a check column. */
	toggle: boolean;
	/** The command has a label that `HasVisibleLabel` would count:
	 *  `CommandBarFlyoutCommandBar.h:74`. */
	label: boolean;
}

/** Publish the state. The argument is a getter so the value stays reactive. */
export function setCommandBarState(state: () => CommandBarCommandState) {
	setContext(KEY, state);
}

/**
 * Read it. `undefined` means the command is not in a `CommandBar` at all, which is a
 * different thing from being in one whose values happen to be the defaults —
 * `AppBarButton`'s sub-item chevron is collapsed by a `CommandBar`'s own resource scope
 * (`CommandBar_themeresources.xaml:95`) and by nothing else.
 */
export function getCommandBarState(): (() => CommandBarCommandState) | undefined {
	return getContext(KEY);
}

/**
 * Publish the command registry. WinUI walks a command collection to decide the container states
 * it implies — `OverflowWithMenuIcons` and `OverflowWithToggleButtons` from `SecondaryCommands`
 * at `CommandBar_themeresources.xaml:875`-`:878`, and `HasPrimaryLabels` from `PrimaryCommands`
 * at `CommandBarFlyoutCommandBar.cpp:803`-`:812`. A Svelte parent cannot inspect a snippet, so
 * each command reports its shape while it renders and the container combines them. Same
 * information, opposite direction.
 */
export function setCommandBarRegistry(
	register: (shape: () => CommandBarCommandShape) => () => void
) {
	setContext(REGISTER, register);
}

/** Read the registry, which is absent outside a container that publishes one — the overflow
 *  presenter and `CommandBarFlyout`'s bar. */
export function getCommandBarRegistry():
	((shape: () => CommandBarCommandShape) => () => void) | undefined {
	return getContext(REGISTER);
}
