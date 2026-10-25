/**
 * Whether the last input was a key rather than a pointer, which is what decides if a focus the
 * Gallery sets from script draws its visual. WinUI turns a `FocusState.Programmatic` focus into
 * a keyboard focus, which draws one, when the last input device was the keyboard, and into a
 * pointer focus, which does not, after a pointer or before any input at all
 * (`CFocusManager::CoerceFocusState`, dxaml/xcp/core/dll/focusmgr.cpp:3195; the device starts
 * as `None`, InputDeviceCache.cpp:28). Chromium's `:focus-visible` for a scripted `focus()`
 * answers differently twice: before any input it grants one, and after typing in the search box
 * and clicking a suggestion it still does, where the reference drew none.
 *
 * A pointer that moves counts, not only one pressed: upstream records the device for every
 * pointer message it processes but a replayed one, an update included, and one that does not
 * move the cursor still records it, only marked as not ending a UIA focus
 * (`PointerInputProcessor::ProcessPointerInput`, PointerInputProcessor.cpp:218-251). Chromium
 * sends no `pointermove` of its own when the page moves under a pointer at rest, which upstream's
 * replay would be: none arrived after a layout change or a scroll in headless Chromium 151. A
 * wheel turned counts too, which upstream also takes through that function (`:308`) and the
 * browser sends as a `wheel` event with no pointer event beside it.
 *
 * The shell records it, from capture-phase listeners on the document, because the page that
 * reads it is loaded only after the input that navigated to it.
 */
let keyboard = false;

export function noteKeyDown() {
	keyboard = true;
}

export function notePointer() {
	keyboard = false;
}

export function lastInputWasKeyboard() {
	return keyboard;
}
