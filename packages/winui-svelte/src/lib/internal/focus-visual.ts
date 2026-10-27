/**
 * Tracks the focus modality at the document and reflects it onto the element the
 * attachment is attached to, as a `data-focus-visual` attribute set when and only when
 * the modality is keyboard.
 *
 * The browser's `:focus-visible` is the same rule for elements the user agent focuses
 * itself: every component in this library keys its focus visual on it, and the right
 * selector for a `<button>` or an `<input>` is still `:focus-visible`. This attachment
 * is for the elements where that breaks down — the ones a primitive focuses from
 * script rather than the user agent focusing them.
 *
 * The Slider's thumb is the first one: `<span tabindex="0" role="slider">`. A `<span>`
 * is not mouse-focusable natively, so no user-agent focus happens on a press; bits-ui
 * then calls `.focus()` on the thumb from script, and Chromium grants `:focus-visible`
 * to that scripted focus. The two-ring focus band appears around the track on every
 * mouse drag, where the original shows nothing. WinUI draws that band for
 * `FocusState.Keyboard` only, so the thumb needs the modality distinction, and this
 * attachment is what supplies it.
 *
 * Adopt this when the element's focus is moved by a script rather than by the user
 * agent. Do not adopt it for an element the user agent focuses itself — `:focus-visible`
 * is right, and is what to use.
 */
import type { Attachment } from 'svelte/attachments';

type Modality = 'keyboard' | 'pointer' | 'none';

// The shared state every element the attachment is used on reads. WinUI draws a
// programmatic focus as a keyboard focus only when the last input device was the keyboard,
// and as a pointer focus otherwise, including before any input
// (`CFocusManager::CoerceFocusState`, focusmgr.cpp:3195). The device starts as `None`
// (InputDeviceCache.cpp:28), and a window takes Keyboard instead only when the system shows
// keyboard cues (XamlIslandRoot.cpp:1183-1197), which a page cannot read. So an element
// focused by script before any input draws no visual, where Chromium's `:focus-visible`
// grants one. `'none'` behaves as `'pointer'` does and is there to say which state it is.
//
// Only a press counts as a pointer here. Upstream records the device for every pointer
// message it does not replay, a move and the wheel included
// (PointerInputProcessor.cpp:218-251), so a key, then a pointer move, then a scripted focus
// draws the visual here and none there.
let modality: Modality = 'none';

// The document listeners are installed once, when this module is first evaluated in the
// browser, and are never removed. Not on the first attachment to run: the key that opens a
// flyout comes before the flyout's content mounts, and on a page where nothing else carries
// the attachment it would go unrecorded, so a CalendarDatePicker opened from the keyboard
// drew no visual. The module is evaluated with the code of the component that imports it,
// so a key that loads that code, by navigating to a page that uses it, is not seen either.
// Both phases are capture-phase so they run before any handler that could move focus, and
// both are passive so they do not block the user agent's scrolling or pinch-zoom
// bookkeeping. The cleanup returned by the attachment removes only the three
// node listeners; removing the document listeners there would unmount them for the next
// component that adopts the attachment and silently break it.
//
// The module is imported on the server too, by the components that use it, and SvelteKit's
// SSR has no `document`.
if (typeof document !== 'undefined') {
	document.addEventListener(
		'keydown',
		() => {
			modality = 'keyboard';
		},
		{ capture: true, passive: true }
	);
	document.addEventListener(
		'pointerdown',
		() => {
			modality = 'pointer';
		},
		{ capture: true, passive: true }
	);
}

const ATTRIBUTE = 'data-focus-visual';

export const focusVisual: Attachment<HTMLElement> = (node) => {
	const onFocus = () => {
		if (modality === 'keyboard') node.setAttribute(ATTRIBUTE, '');
		else node.removeAttribute(ATTRIBUTE);
	};

	const onBlur = () => {
		node.removeAttribute(ATTRIBUTE);
	};

	const onPointerDown = () => {
		// An element already focused from the keyboard and then pressed with a mouse:
		// no `focus` event fires, and both WinUI and the browser drop the visual.
		node.removeAttribute(ATTRIBUTE);
	};

	node.addEventListener('focus', onFocus);
	node.addEventListener('blur', onBlur);
	node.addEventListener('pointerdown', onPointerDown);

	return () => {
		node.removeEventListener('focus', onFocus);
		node.removeEventListener('blur', onBlur);
		node.removeEventListener('pointerdown', onPointerDown);
	};
};
