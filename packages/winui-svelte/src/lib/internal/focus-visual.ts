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

type Modality = 'keyboard' | 'pointer';

// The shared state every element the attachment is used on reads. Keyboard first, so an
// element focused before any interaction has happened draws the visual; that is what a
// browser does with `:focus-visible` and what a user with no pointer needs.
let modality: Modality = 'keyboard';

// The document listeners are installed once, on the first attachment to run, and are
// never removed. Both phases are capture-phase so they run before any handler that could
// move focus, and both are passive so they do not block the user agent's scrolling or
// pinch-zoom bookkeeping. The cleanup returned by the attachment removes only the three
// node listeners; removing the document listeners here would unmount them for the next
// component that adopts the attachment and silently break it.
let documentListenersInstalled = false;
function installDocumentListeners() {
	if (documentListenersInstalled) return;
	documentListenersInstalled = true;
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
	// An attachment does not run on the server, but the module is imported there by
	// the components that use it, and SvelteKit's SSR has no `document`. Skip the
	// installation rather than guard every listener call.
	if (typeof document === 'undefined') return;

	installDocumentListeners();

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
