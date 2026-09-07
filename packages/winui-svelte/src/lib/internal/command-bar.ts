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
