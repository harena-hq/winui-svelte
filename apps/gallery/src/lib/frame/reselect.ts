/**
 * The path of the page the shell is going to again because its selected row was invoked again,
 * which upstream does not navigate for: it navigates on a selection change
 * (MainWindow.xaml.cs:304-404), and that invoke changes none, so no page loads to take the focus.
 * The shell still goes to the page shown, so the page asks here whether a navigation was one of
 * those, rather than reading it off where the focus is. That is the body after a
 * `goto` without `keepFocus` and also after one that kept the focus on a row the same invoke then
 * removed, as the rail's flyout does when it closes.
 *
 * A mark lasts as long as its navigation: the page takes it in `afterNavigate`, and the shell
 * clears it in the navigation's `finally`, which runs after the `afterNavigate` callbacks, so
 * one that was aborted or superseded does not stand in for a later navigation to the same page.
 * Every invoke the shell makes replaces it, with `null` for one that is no reselect, so a mark
 * still in flight does not stand in for the invoke after it either.
 */
let pending: { path: string } | null = null;

export function markReselect(path: string | null): object | null {
	pending = path === null ? null : { path };
	return pending;
}

export function clearReselect(mark: object | null) {
	if (mark !== null && pending === mark) pending = null;
}

/** Whether the navigation that reached `path` was a reselect. Clears the record either way. */
export function takeReselect(path: string | undefined): boolean {
	const reselect = pending !== null && pending.path === path;
	pending = null;
	return reselect;
}
