/**
 * Where, and in what focus state, a flyout's close returns the focus.
 *
 * Upstream's popup saves the focused element's focus state when it opens
 * (`CPopup::Open`, Popup.cpp:592-596). When it closes it returns the focus to that element only
 * if the popup still holds the focus or nothing does (`CPopup::Close`, Popup.cpp:866-872), and
 * in the saved state (:873-884) unless it was light-dismissed: Escape returns it as `Keyboard`
 * (`CPopupRoot::OnKeyDown`, Popup.cpp:5344) and a press outside as `Pointer`
 * (`CPopupRoot::OnPointerPressed`, Popup.cpp:5327). So a trigger a press focused gets the focus
 * back with no visual from a close a key made — `Hide` from a key on a button inside, a menu
 * row's invoke — and a trigger the keyboard focused gets it back with one from any close but a
 * press outside. A press on a trigger the keyboard focused gives it `Pointer` too. On the
 * reference guest the Flyout and MenuFlyout pages do all of it but that last, which the
 * MenuFlyout page alone was driven for, and a menu opened by Enter on a trigger a press had
 * focused returns it with none.
 *
 * The primitive returns the focus with a plain `focus()`, and Chromium grants `:focus-visible`
 * to a scripted focus after a key, so the browser keyed the visual on what closed the flyout
 * rather than on how its trigger was focused. `focus({ focusVisible })` states the saved state
 * instead: measured in the local Chromium and the guest's Edge, it is honoured both ways, and in
 * the local Chromium a later Enter on an element focused with `focusVisible: false` does not
 * grant the visual, as a key on a `Pointer`-focused control upstream does not change its state.
 *
 * A press is not something `:focus-visible` records on an element that already has the focus,
 * and a menu's trigger never takes the focus from the press that opens it, as the primitive
 * prevents the press's default. So the trigger's own presses are read here, through `trigger`,
 * an attachment to spread onto it.
 */
import { createAttachmentKey } from 'svelte/attachments';

export function createFocusReturn() {
	let node: HTMLElement | null = null;
	// Whether a press, rather than the keyboard, last focused the trigger or pressed it.
	let pressed = false;
	let saved: Element | null = null;
	let visible = false;
	// What the light dismiss decided, or `null` where the flyout was not light-dismissed.
	let dismissed: boolean | null = null;

	const onPointerDown = () => {
		pressed = true;
	};
	const onFocus = () => {
		if (node?.matches(':focus-visible')) pressed = false;
	};

	return {
		trigger: {
			[createAttachmentKey()]: (element: HTMLElement) => {
				node = element;
				pressed = false;
				element.addEventListener('pointerdown', onPointerDown, true);
				element.addEventListener('focus', onFocus);
				return () => {
					element.removeEventListener('pointerdown', onPointerDown, true);
					element.removeEventListener('focus', onFocus);
					if (node === element) node = null;
				};
			}
		},
		/** The element `trigger` is spread onto, while it is mounted. */
		get triggerNode() {
			return node;
		},
		/** The element that had the focus when the flyout opened. */
		get saved() {
			return saved;
		},
		/** The flyout opened. Called before the primitive moves the focus into it. */
		opened() {
			// The primitive's own return skips the body, which is where the focus is when nothing
			// has it.
			saved = document.activeElement === document.body ? null : document.activeElement;
			visible = !!saved && saved.matches(':focus-visible') && !(saved === node && pressed);
			dismissed = null;
		},
		escaped() {
			dismissed = true;
		},
		pressedOutside() {
			dismissed = false;
		},
		/**
		 * Returns the focus to `target`, unless it is on an element outside the flyout, which
		 * `inside` tells. An element that did not have the focus when the flyout opened gets it
		 * as a press gives it: a menu's trigger, which the primitive keeps the focus from on the
		 * press that opens it, is the one upstream's press focused.
		 */
		restore(target: HTMLElement, inside: (focused: Element) => boolean) {
			const focused = document.activeElement;
			if (focused && focused !== document.body && !inside(focused)) return;
			target.focus({ focusVisible: dismissed ?? (target === saved && visible) });
		}
	};
}
