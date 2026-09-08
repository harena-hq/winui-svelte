/**
 * The four ItemsView selectors, transcribed from
 * `.upstream/microsoft-ui-xaml/controls/dev/ItemsView/`. They live here rather than in a
 * component because two controls need them and neither of the two implements them upstream:
 * `ItemsView` delegates to these four classes, and `ListViewBase`'s own selection is in
 * neither pin. One transcription shared is better than a second one invented.
 *
 * Each takes the current selection and returns the next one, and returns the same array
 * identity when the rule says nothing changes — which is what lets a caller skip an event.
 */
export type SelectionMode = 'none' | 'single' | 'multiple' | 'extended';

export interface SelectionInput {
	/** The item interacted with. */
	index: number;
	/** The current selection, ascending. */
	selected: number[];
	/** The last index interacted with without Shift, or `null`. */
	anchor: number | null;
	ctrl: boolean;
	shift: boolean;
}

const range = (from: number, to: number) => {
	const [lo, hi] = from <= to ? [from, to] : [to, from];
	return Array.from({ length: hi - lo + 1 }, (_, index) => lo + index);
};

// SingleSelector::OnInteractedAction, ItemsView/SingleSelector.cpp:25-45. The model is put
// in single-select first, so a plain click always moves the selection rather than adding to
// it; Ctrl is the only way to end up with nothing selected.
function interactSingle(input: SelectionInput) {
	if (!input.ctrl || !input.selected.includes(input.index)) return [input.index];
	return [];
}

// MultipleSelector::OnInteractedAction, ItemsView/MultipleSelector.cpp:18-63. A Shift range
// takes the anchor's own state: it selects the range when the anchor is selected and
// deselects it when the anchor is not, and does nothing when the two already agree.
function interactMultiple(input: SelectionInput) {
	if (input.shift && input.anchor !== null) {
		const anchorSelected = input.selected.includes(input.anchor);
		if (anchorSelected === input.selected.includes(input.index)) return input.selected;
		const span = range(input.anchor, input.index);
		return anchorSelected
			? [...input.selected, ...span]
			: input.selected.filter((selectedIndex) => !span.includes(selectedIndex));
	}
	return input.selected.includes(input.index)
		? input.selected.filter((selectedIndex) => selectedIndex !== input.index)
		: [...input.selected, input.index];
}

// ExtendedSelector::OnInteractedAction, ItemsView/ExtendedSelector.cpp:18-53. Note the last
// branch: a plain click on an item that is already selected changes nothing, which is what
// keeps a multi-item selection alive under a click that is about to become a drag.
function interactExtended(input: SelectionInput) {
	if (input.shift && input.anchor !== null) return range(input.anchor, input.index);
	if (input.ctrl)
		return input.selected.includes(input.index)
			? input.selected.filter((selectedIndex) => selectedIndex !== input.index)
			: [...input.selected, input.index];
	if (!input.selected.includes(input.index)) return [input.index];
	return input.selected;
}

export function nextSelection(mode: SelectionMode, input: SelectionInput): number[] {
	if (mode === 'none') return input.selected;
	if (mode === 'single') return interactSingle(input);
	if (mode === 'multiple') return interactMultiple(input);
	return interactExtended(input);
}
