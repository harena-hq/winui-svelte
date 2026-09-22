<script lang="ts" module>
	import type { Snippet } from 'svelte';

	// The shape Floating UI accepts as `customAnchor`: an object exposing a
	// `getBoundingClientRect()` method. The pointer-anchored default builds one and
	// returns a zero-size rect at the tracked pointer position. Defined here rather
	// than imported because bits-ui does not export the `Measurable` type name.
	type Measurable = {
		getBoundingClientRect: () => DOMRect;
	};

	export interface ToolTipProps {
		/** Content. A string or a snippet. */
		content?: Snippet | string;
		/** ToolTipService.Placement, plus `PlacementMode.Mouse` as the default — see the
		 *  comment on the placement logic for the measurement that chose it. */
		placement?: 'mouse' | 'top' | 'bottom' | 'left' | 'right';
		/**
		 * `ToolTipService.VerticalOffset` and `HorizontalOffset` as the one number a single-axis
		 * placement needs: the gap between the tooltip and what it is anchored to, in pixels.
		 *
		 * Left unset it is the system default **for the input mode that opened this tooltip** —
		 * see `KEYBOARD_OFFSET` and `MOUSE_OFFSET` below. Upstream draws that line in the same
		 * place: `IsPropertyLocal` (`ToolTip_Partial.cpp:1220`, and `:1713` on the windowed path)
		 * asks whether the consumer set the property, and only an unset one falls through to the
		 * mode switch beside it. A value passed here is that local value and holds for every mode.
		 */
		offset?: number;
		/**
		 * No WinUI member: whether hovering the trigger opens the tooltip.
		 *
		 * `ToolTipService.ToolTip` — the attached property nearly every WinUI tooltip
		 * arrives through — opens on hover, so this defaults to `true`. A control that
		 * builds its own tooltip instead does not: WinUI's Slider raises the thumb's value
		 * tooltip while the thumb is held and nothing hovers it open. Setting this `false`
		 * withholds the primitive's own pointer and focus handlers from the trigger, which
		 * leaves `open` the only thing that opens it.
		 */
		openOnHover?: boolean;
		/** IsOpen. */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: boolean) => void;
		/** IsEnabled, inverted to HTML's attribute — ADR 0009. */
		disabled?: boolean;
		/**
		 * The element the tooltip is attached to. Receives the props it must spread.
		 *
		 * Spread them **first**, before the element's own attributes: they carry the
		 * primitive's event handlers, and a trigger that sets one of the same names
		 * after the spread replaces it rather than adding to it. Where the trigger has
		 * its own handler for an event the props also carry — `onclick` is the one that
		 * bites, since it is what dismisses the tooltip when the trigger is pressed —
		 * call the one from these props as well. `TitleBar.svelte` does both.
		 */
		children: Snippet<[Record<string, unknown>]>;
		class?: string;
		style?: string;
		/** ADR 0009's `ref` points at the interactive element: here, the popup. */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// `ToolTipService.PlacementRect` is deliberately absent, and a plain comment says so
	// rather than a `/** */` one: a doc comment here would attach itself to `disabled`
	// below and a consumer hovering that prop would be told about it.
	//
	// `PlacementRect` anchors the tooltip to a rectangle in the placement target's
	// coordinate space — `Point="X,Y"` and `Width`/`Height` on the WinUI side. The
	// Gallery's ToolTip page has a third example that uses it, and it belongs to a
	// later unit.
	//
	// `ToolTipService.VerticalOffset` and `HorizontalOffset` are absent for a different
	// reason: they were specified for this unit and the measurement withdrew them. The
	// Gallery's second example sets `VerticalOffset="-80"`, and on the reference guest
	// that tooltip is still anchored to the pointer in both axes — pointer (468,455)
	// puts its top at 503, pointer (400,462) puts it at 510, the pointer's own delta —
	// but it sits *below* the pointer, top at `pointer.y + 48`, where the default sits
	// above it with its bottom at `pointer.y - 20`. A negative offset of 80 moving the
	// box 100 px the other way is not the delta the property name suggests, and two
	// points do not determine the rule. Shipping the arithmetic that happens to fit
	// them would be inventing a contract, so the props wait for a unit that measures
	// the family properly.

	// ToolTip is a `Windows.UI.Xaml` control WinUI 3 only restyles, so there is no
	// `controls/dev/ToolTip/` — and **the pin carries the implementation anyway**, at
	// `dxaml/xcp/dxaml/lib/ToolTip_Partial.cpp` (2584 lines) and `ToolTipService_Partial.cpp`
	// (2362). An earlier version of this comment said there was none to read. That was true of
	// a checkout holding `controls/dev` alone and `8928bb8` falsified it;
	// `docs/surface.md`'s ToolTip section was corrected and this line was not, which is the
	// class that section is about. What is read here is placement, the input mode and the show
	// delay — the anchor comments below, `onPointerLeave`, `SHOW_DELAY` and the provider carry
	// the citations. Dismissal is still unswept, and so is the reshow half of the delay.

	// `AutomaticToolTipInputMode` (`DXamlTypes.h:69-75`), less `Touch`, which nothing here
	// reaches: the primitive returns on `pointerType === "touch"` (`tooltip.svelte.js:490`,
	// `:518`) and so opens no tooltip for one. **Its return does not shield this component**,
	// because the pointer wrappers below run *before* it — that ordering is the reason they
	// exist — so each tests the pointer type itself rather than inheriting the primitive's
	// answer. A review found this stated the other way round, which would have left a touch
	// latching the mouse mode and recording a position for an open that never comes.
	//
	// Upstream opens one on a press-and-hold and gives it both its own delay and its own 44px
	// offset (`DEFAULT_TOUCH_OFFSET`, `ToolTip_Partial.h:13`); neither is built, and
	// `docs/surface.md` records it.
	type InputMode = 'none' | 'mouse' | 'keyboard';

	// The template's `OpenStates` group fades the popup in and out with
	// `FadeInThemeAnimation` and `FadeOutThemeAnimation`. Not built in this unit —
	// theme animations are v14's, the version that also owns `ThemeShadow`.
</script>

<script lang="ts">
	import { Tooltip } from 'bits-ui';

	// `GetInitialShowDelay` (`ToolTipService_Partial.cpp:1788-1838`) is a table over the input
	// mode, and the function's own comment prints it (`:1788-1793`):
	//
	//                Touch   Mouse   Keyboard
	//     Normal        1x      2x         2x
	//     Reshow         0    1.5x         2x
	//
	// where x is `SPI_GETMOUSEHOVERTIME`, 400ms by default (`ToolTipService_Partial.h:18`).
	//
	// **One cell of that comment is not what the code does.** The mouse row is
	// `ulSPIGetMouseHoverTimeTicks *= static_cast<INT64>(isReshow ? 1.5 : 2)` (`:1825`), and the
	// conditional's common type is `double`, so a reshow multiplies by `static_cast<INT64>(1.5)`
	// — **1**, not 1.5. Upstream's mouse reshow is 1x, 400ms. The other five cells survive the
	// cast: touch is `isReshow ? 0 : 1` over integers (`:1822-1823`) and keyboard is a bare
	// `*= 2` (`:1828-1829`).
	//
	// Both modes this component reaches wait 2x on a normal open, so one constant covers them.
	// The reshow row is not built — WD-094, and the provider's `skipDelayDuration` below.
	const SHOW_DELAY = 800;

	// `DEFAULT_KEYBOARD_OFFSET` and `DEFAULT_MOUSE_OFFSET`, `ToolTip_Partial.h:10-11`.
	//
	// **The two numbers are not one rule, and only the first is reached by the code that names
	// them.** The switch that assigns both lives in `PerformNonMousePlacementWithPopup`
	// (`ToolTip_Partial.cpp:1229-1255`) and in the windowed directional path (`:1722-1748`),
	// which place the popup against the *element*; each inflates the target rect by the offset
	// (`:1275`) so the gap it leaves is the number itself. `PerformMousePlacementWithPopup`
	// takes neither — a pointer-anchored popup's gap is `m_mousePlacementVerticalOffset`, 11
	// (`ToolTip_Partial.h:56`), plus whatever the offset properties hold. So 20 is upstream's
	// number for an element-anchored tooltip opened by a mouse, and the 20 this component uses
	// for the pointer-anchored default is the measurement recorded on the placement logic below.
	// One number, two reasons; do not collapse them.
	//
	// 12 is measured as well as read. On the reference guest, with a rail row focused by an
	// arrow key, the tooltip's border box stands exactly 12px clear of the row's 48x40 bounds —
	// twice, on two different rows, with the row's focus visual straddling those bounds by its
	// own 2px. That capture is what this unit started from; ours stood 20 clear.
	const KEYBOARD_OFFSET = 12;
	const MOUSE_OFFSET = 20;

	let {
		content,
		placement = 'mouse',
		offset,
		openOnHover = true,
		open = $bindable(false),
		onOpenChange,
		disabled = false,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ToolTipProps = $props();

	// Pointer tracking for the pointer-anchored default. The anchor is a virtual
	// element whose rect sits at the pointer — `side="top"`, `align="center"`, and a
	// `sideOffset` that is 20 for this mode and reproduces the measurement §4 records.
	//
	// **The popup is placed where the pointer was when it opened, and does not follow it**
	// — the half §4 did not measure. Photographed on the reference guest: a tooltip
	// standing over a 40px button did not change by one pixel while the pointer moved 21
	// across it and 20 down, and the same tooltip opened from x 381 and from x 409 centred
	// on 381 and on 409, the pointer's own delta. Pointer-anchored and pointer-following
	// are two claims; the measurement established the first and this component had
	// implemented the second.
	//
	// `pointer` therefore goes on tracking, and `frozen` is what the popup is positioned
	// against: the first rect read after an open, held until the close clears it. The
	// obvious implementation — stop recording once `open` is true — is wrong, and the
	// test that opens from two positions is what says so. An open that takes no delay makes
	// `open` true before the `pointermove` carrying the new position arrives, and a guard on
	// `open` then pins that tooltip to the previous one's place. Freezing on the read instead
	// is indifferent to that order: the move handler and the popup's mount fall in one task,
	// and Floating UI does not measure until the microtask after it.
	//
	// The path that produced it was the provider's skip-delay window, which this component now
	// withholds (`skipDelayDuration={0}` below) — but the instant paths that remain are the
	// focus timer's own `setOpen` and a consumer's `open`, so the hazard outlives the window
	// and the guard on `open` would still be wrong.
	const pointer = $state({ x: 0, y: 0 });

	let frozen: { x: number; y: number } | null = null;

	/**
	 * `m_inputMode`: what opened this tooltip — and, while it is closed, what would open one now.
	 *
	 * Upstream keeps one such field and reads it three times: to choose the anchor (the mode is
	 * read at `ToolTip_Partial.cpp:817`, the second line of the test opening at `:816`, under
	 * the sentence at `:815`), the delay
	 * (`ToolTipService_Partial.cpp:1788-1838`) and the offset (`:1229-1255`). This holds the same one for the same three, which is why it is a
	 * mode rather than the boolean it began as — the boolean answered only the first.
	 *
	 * The handlers below write it only when `open` is false and the effect below clears it on
	 * the close, so **it cannot change under a popup that is on screen**, in any direction. That
	 * is the whole invariant, and each half of it was a defect on its own: `onPointerLeave` has
	 * the one that was measured and `onPointerEnter` the one a review found.
	 */
	let inputMode = $state<InputMode>('none');

	/** The one open this component schedules itself: the keyboard's. See `onFocus`. */
	let focusTimer: ReturnType<typeof setTimeout> | undefined;

	// Released whenever the tooltip is closed, and by an effect rather than inside the
	// `bind:open` setter below. That setter runs when the *primitive* changes `open`; a
	// consumer closing its own bound `open` never reaches it, and the stale anchor would
	// then pin the next tooltip where the last one stood — the same defect the two
	// rejected implementations had, arriving by a path the pointer never takes.
	$effect(() => {
		if (!open) {
			frozen = null;
			// And the input mode, for the same reason the position is released here rather than
			// on the pointer leaving. See `onPointerLeave`. Upstream's close does the same, at
			// `ToolTip_Partial.cpp:405`.
			inputMode = 'none';
			// And any open still owed, which is upstream's `CancelAutomaticToolTip` stopping the
			// one timer (`ToolTipService_Partial.cpp:720`). Without it a close between a focus
			// and its delay leaves a timer that fires into a cleared mode.
			clearTimeout(focusTimer);
		}
	});

	// A focus whose tooltip never opened leaves a timer behind; a component torn down under it
	// would otherwise write `open` after its own removal.
	$effect(() => () => clearTimeout(focusTimer));

	const pointerAnchor: Measurable = {
		getBoundingClientRect(): DOMRect {
			frozen ??= { x: pointer.x, y: pointer.y };
			return new DOMRect(frozen.x, frozen.y, 0, 0);
		}
	};

	// Placement logic. `mouse` is the WinUI fifth `PlacementMode` value — the
	// behaviour §4 measured — and is the default. The other four names anchor to
	// the trigger element rather than to the pointer, the mode unit 035 needs.
	// The 20px gap was measured on the reference guest between a pointer and the bottom
	// of a hover-opened tooltip, and independently between the bottom of an
	// element-anchored Slider tooltip and the top of the thumb's visible circle.
	const side = $derived(placement === 'mouse' ? 'top' : placement);
	// The gap is a function of the input mode wherever the consumer has not fixed it, which is
	// the whole of `IsPropertyLocal` plus the switch beside it. `inputMode` is `'none'` while the
	// tooltip is closed and for an open nothing latched — a consumer's own `open` — and that
	// case takes the mouse number: upstream's switch assigns nothing for `None` and leaves the
	// offset at whatever the properties gave it, which is not a behaviour worth reproducing when
	// the alternative is the default every other path lands on.
	const sideOffset = $derived(
		offset ?? (inputMode === 'keyboard' ? KEYBOARD_OFFSET : MOUSE_OFFSET)
	);
	// The anchor is always passed explicitly, and the named placements pass the trigger
	// element itself. Leaving it null and letting the primitive fall back to its own
	// record of the trigger loses the race when the tooltip is open before the trigger
	// has been registered — measured: a tooltip whose `open` starts `true` renders at
	// (0, -60), the position Floating UI computes with no reference, and never recovers,
	// while the same tooltip opened by a hover a moment later lands correctly. Binding
	// the element here makes the anchor exist as early as the element does.
	let triggerEl = $state<HTMLElement | null>(null);
	// Pointer-anchored **only when a pointer's own entry latched the mode while the tooltip was
	// closed, and nothing has closed it since**. Presence is not the test, and stating it as
	// presence was wrong in both directions: the popup stays pointer-anchored after the pointer
	// has left, and a close taken with the pointer still resting on the trigger — a press
	// dismisses one (`tooltip.svelte.js:461-470`, `:583-588`) — leaves the next programmatic
	// open element-anchored with a pointer sitting right there. The pin agrees on that corner
	// too, because it clears `m_inputMode` on the close. A focus opens one as well — the
	// primitive puts an `onfocus` on the trigger and `onFocus` below replaces it — so a keyboard
	// user tabbing onto the trigger opens a tooltip with no pointer anywhere, and `pointer`
	// then holds either its initial `{0, 0}`
	// or wherever the mouse last was inside this trigger — neither of which is a position to
	// honour. Upstream **answers** this case rather than not having it, and an earlier version
	// of this line said it had none to answer: the keyboard path hands `OnOwnerEnterInternal`
	// the mode `Keyboard` (`ToolTipService_Partial.cpp:1714`), so the mouse-placement test the
	// enter handler below cites is not taken and the popup is placed against the element. So
	// is this one.
	//
	// It has to be the anchor rather than the frozen value, because freezing is what makes the
	// wrong answer permanent: before this, a corner-pinned popup at least corrected itself the
	// moment a pointer crossed the trigger, and the freeze removed the correction.
	const customAnchor = $derived<Measurable | HTMLElement | null>(
		placement === 'mouse' && inputMode === 'mouse' ? pointerAnchor : triggerEl
	);

	function track(event: PointerEvent) {
		if (placement !== 'mouse') return;
		pointer.x = event.clientX;
		pointer.y = event.clientY;
	}

	function onPointerMove(bitProps: Record<string, unknown>, event: PointerEvent) {
		(bitProps.onpointermove as ((event: PointerEvent) => void) | undefined)?.(event);
		if (event.pointerType !== 'touch') track(event);
	}

	// The entry is recorded **before** the primitive's own handler runs, and that order is
	// the whole reason this wrapper exists beside `onpointermove`. A tooltip opened inside
	// the provider's skip-delay window opens on the entry itself, and its popup is mounted
	// and measured in the microtask after that handler — one dispatch before the
	// `pointermove` carrying the same position. Recording on the way in means the pointer
	// is already where it is by the time anything asks.
	//
	// The latch is taken here and not re-taken, and the pin says so in its own words:
	// "PlacementMode.Mouse only makes sense for automatic ToolTips opened by touch or mouse"
	// (`ToolTip_Partial.cpp:815`, above the test at `:817`; the windowed-popup path repeats
	// both at `:1432-1434`). What that test reads is fixed for the life of an open.
	// `AutomaticToolTipInputMode` is `{None, Touch, Mouse, Keyboard}` (`DXamlTypes.h:69-75`)
	// and `m_inputMode` is written in exactly three places: the constructor
	// (`ToolTip_Partial.cpp:32`), the close (`:405`), and the open — where
	// `ToolTipService_Partial.cpp:480` copies `s_lastEnterInputMode` in, inside
	// `OpenAutomaticToolTip`, three lines above that function's own `put_IsOpen(TRUE)` at
	// `:483`. `OnOwnerEnterInternal` records the mode at `:657`, and the keyboard path hands
	// it `Keyboard` (`ToolTipService_Partial.cpp:1714`).
	//
	// So a tooltip opened by anything but a pointer is element-placed for its whole life,
	// whatever the pointer does afterwards — and the close clearing the mode at `:405` is why
	// a programmatic re-open with the pointer still sitting on the trigger is element-placed
	// there too, which is what the effect above reproduces. That second case was never
	// measured here and the flag used to get it wrong in the other direction: nothing cleared
	// it across a close the pointer never left.
	//
	// Without the `!open` test a tooltip opened with no pointer — a keyboard focus, or a
	// consumer's own `open` — jumped to the pointer the moment one crossed the trigger; and
	// once the leave stopped releasing the mode, that jump became permanent. The hover-open
	// case is unaffected for the ordering reason this handler already exists for: it runs
	// before the primitive's, so `open` is still false at the enter. That used to matter
	// because the provider's skip-delay could open the popup in the same task; the window is
	// withheld now, and the ordering is kept anyway — it costs nothing, and an invariant that
	// holds only while a delay is non-zero is one the next change to the delay silently breaks.
	function onPointerEnter(bitProps: Record<string, unknown>, event: PointerEvent) {
		// One pending open, as upstream has one service-level timer that each enter restarts
		// (`ToolTipService_Partial.cpp:657-662` — the mode is recorded, the delay recomputed for
		// it and the timer started again): a pointer's entry replaces whatever a focus had
		// scheduled, rather than leaving a second open to fire behind it in the wrong mode.
		if (event.pointerType !== 'touch') {
			clearTimeout(focusTimer);
			if (!open) inputMode = 'mouse';
			track(event);
		}
		(bitProps.onpointerenter as ((event: PointerEvent) => void) | undefined)?.(event);
	}

	// The leave does **not** release the anchor, and a close is what does. `customAnchor`
	// turns on `inputMode`, so clearing it here flips a popup that is still on screen from
	// the pointer's rect to the trigger's — and the flip alone is what moves it. Changing the
	// anchor writes `customAnchorNode` (`use-floating-layer.svelte.js:188-190`), an effect
	// copies that to `anchorNode` (`:27-39`), that box is the `reference`
	// (`:195`) which `attach()` reads (`use-floating.svelte.js:113`, `:115`) inside
	// `$effect(attach)` at `:139`, and re-running it calls `autoUpdate`, whose last statement
	// is an unconditional `update()` (`floating-ui.dom.mjs:676`).
	// `updatePositionStrategy="always"` is **not** the cause and dropping it would not help:
	// it only turns on the per-frame rect poll. Measured on `/dev/navigation-view-rail`: a
	// rail row's tooltip opened at y 197 and
	// jumped to y 179 the moment the pointer crossed onto another row, standing there for
	// another 200ms before it closed. The 18 is not a placement error and it is not a
	// coincidence — the row is 36 tall, the pointer was at its middle, and both anchors put
	// the popup's bottom 20 above themselves, so the gap between them is the half-row.
	//
	// Upstream is in the same position and answers it the same way, which is worth saying
	// because it hooks a pointer move at all: `ToolTip_Partial.cpp:373` — "Since ToolTip is
	// kept open, need to hook up with CoreWindow or XamlIslandRoot to handle PointerMove and
	// Key event" — and what it does with those moves is the safe-zone test, never a placement.
	//
	// Why the popup is still on screen to be moved: `Tooltip.Provider` defaults
	// `disableHoverableContent` to false, so a trigger leaving only stops the delay timer
	// (`tooltip.svelte.js:284-291`) and the close comes from the grace area a moment later.
	// A tooltip the pointer then settles on stays open, and it keeps the anchor it opened
	// with, which is the same answer by the same route.
	//
	// Upstream keeps an opened tooltip on screen past the pointer leaving its owner **and**
	// does not move it, which is both halves of what this does.
	// `ToolTipService_Partial.cpp:1474` is `OnOwnerPointerExitedOrLostOrCanceled` and its own
	// comment at `:1484-1485` is the first half — "Opened ToolTip will be kept and will be
	// closed when Pointer is out side of safe zone / Not opened ToolTip will be cancelled" —
	// with the close arriving later from `OnSafeZoneCheck` (`:349`) through
	// `HandleToolTipSafeZone` (`:913`, the test at `:939`) and `IsToolTipInSafeZone`
	// (`:1113`). The second half is that the popup is placed only by
	// `PerformPlacementInternal`, and its six callers are `OnPlacementCriteriaChanged`
	// (`ToolTip_Partial.cpp:569`), `OnToolTipSizeChanged` (`:1905`), `OnPopupOpened`
	// (`:1938`), `OnRootVisualSizeChanged` (`:2049`), `OnIsEnabledChanged` (`:2093`) and
	// `RepositionPopup` (`:2204`, which nothing in the pin calls). Not one is a pointer path.
	//
	// An earlier version of this comment argued from the opposite premise — that a WinUI
	// tooltip's pointer leaving is its close, so there was no window in which to get this
	// wrong. There is a window, upstream sits in it without moving, and the conclusion is the
	// stronger for it. A review found it by opening the two files that this file's own module
	// comment on ToolTip's place in the pin had said were not there to open.
	//
	// The mode is still cleared before the next open, in the effect above, and the pointer's
	// own position goes on being tracked either way — this withholds the *decision*, not the
	// measurement.
	function onPointerLeave(bitProps: Record<string, unknown>, event: PointerEvent) {
		if (event.pointerType !== 'touch' && !open) inputMode = 'none';
		(bitProps.onpointerleave as ((event: PointerEvent) => void) | undefined)?.(event);
	}

	// Every open this component performs itself goes through here. The `bind:open` setter below
	// runs when the *primitive* changes `open`, so a change made here would reach a consumer's
	// bound value and never its `onOpenChange`, which ADR 0009 pairs with it.
	function setOpen(next: boolean) {
		open = next;
		onOpenChange?.(next);
	}

	// The keyboard's open, written here rather than left to the primitive **because of the
	// delay**. bits-ui splits the two paths: its hover goes through `#handleDelayedOpen` and its
	// `#onfocus` calls `root.handleOpen()` (`tooltip.svelte.js:575`), which stops the timer and
	// opens in the same task. So a tooltip reached by Tab appeared with no wait at all where the
	// original waits — the defect this unit is for. Upstream has no such split: the focus path
	// hands `OnOwnerEnterInternal` the mode `Keyboard` (`ToolTipService_Partial.cpp:1714`) and
	// the one `GetInitialShowDelay` decides its wait exactly as it decides a pointer's.
	//
	// The primitive's own `onfocus` is replaced rather than wrapped, and nothing calls through:
	// all it does besides opening is `setActiveTrigger`, and the open below reaches that anyway
	// through `ensureActiveTrigger` on the root's `open` watcher (`tooltip.svelte.js:232-240`,
	// the call at `:234`).
	//
	// **Two guards stand in for one rule, and they do not cover it exactly.** Upstream opens on
	// a focus that is `FocusState::Keyboard`, or `Programmatic` with UIA behind it, and on
	// nothing else (`ToolTipService_Partial.cpp:1706-1714`).
	//
	// `pointerDown` is the first, and it is the primitive's own `#isPointerDown`
	// (`tooltip.svelte.js:564`) put back after its handler was dropped. `:focus-visible` alone
	// does **not** subsume it: Chromium grants that pseudo-class to a text input or a
	// `contenteditable` however it was focused, so a pressed text-entry trigger matches it while
	// upstream calls the same focus `Pointer` and shows nothing. No consumer wraps one today and
	// `children` takes any element, which is the whole reason the latch is here rather than
	// argued away.
	//
	// `:focus-visible` is the second, and it is what separates a keyboard focus from the rest —
	// measured in Chromium with a scripted `focus()` after each kind of input. Where it does not
	// reach upstream's rule is the *programmatic* half: an ordinary `focus()` matches it, and
	// upstream declines that focus unless UIA drove it. The DOM has no UIA to ask, so that one
	// is WD-095 rather than a line of code.
	function onFocus(event: FocusEvent) {
		// `IsEnabled`, and it is tested here because dropping the primitive's `onfocus` dropped
		// its own `#isDisabled()` with it. `Tooltip.Root` does not refuse an `open` set from
		// outside — `disabled` reaches only its trigger's handlers and the data attributes
		// (`tooltip.svelte.js:400`, `:431`, `:682`) — so without this line a disabled tooltip
		// opened on a keyboard focus, which is a path the primitive used to close off. It is
		// tested again when the timer fires, because the prop can change inside the delay.
		//
		// **What is not reproduced is the other half of `IsEnabled`**: upstream hides a tooltip
		// that is already open when it goes disabled, by putting the popup's opacity to 0
		// (`ToolTip_Partial.cpp:2075-2098`) while leaving `IsOpen` true. Nothing here does that,
		// and nothing did before this unit either. `docs/surface.md` records it.
		if (disabled) return;
		// The press, which a focus follows: `pointerdown` fires before `focus`, so the latch is
		// already set by the time a click's focus arrives here.
		if (pointerDown) return;
		if (!(event.currentTarget as HTMLElement).matches(':focus-visible')) return;
		// A focus that lands on a tooltip already on screen schedules nothing, and upstream's
		// handler is written the same way round: `get_IsOpen` is read first and the whole body
		// sits under `if (!isAlreadyOpen)` (`ToolTipService_Partial.cpp:1692-1700`).
		//
		// Guarding the *timer* and not only the mode is the point. With the mode alone guarded,
		// a focus arriving over a hover-opened popup armed a timer that outlived the popup: the
		// pointer leaves, the close clears the mode to `'none'`, and the timer then opens a
		// tooltip a keyboard focus asked for with the mouse's 20 — the defect this unit exists
		// to remove, arriving by the path it added.
		if (open) return;
		// Before the timer rather than inside it: `sideOffset` and `customAnchor` are read when
		// the popup mounts, so the mode has to be this open's mode by then, and writing it here
		// keeps the rule the rest of this file follows — the mode is decided by the entry and
		// read at the open.
		inputMode = 'keyboard';
		clearTimeout(focusTimer);
		focusTimer = setTimeout(() => {
			if (disabled) return;
			setOpen(true);
		}, SHOW_DELAY);
	}

	// The blur closes through the primitive, which is already right, and only the pending timer
	// is ours to cancel: a focus that leaves before the delay elapses must open nothing.
	function onBlur(bitProps: Record<string, unknown>, event: FocusEvent) {
		clearTimeout(focusTimer);
		(bitProps.onblur as ((event: FocusEvent) => void) | undefined)?.(event);
	}

	/** Whether a pointer is pressed on the trigger — the primitive's `#isPointerDown`, rebuilt. */
	let pointerDown = false;

	// A press cancels the open it interrupts, in both halves. The primitive cancels *its* pending
	// open here (`tooltip.svelte.js:461-479`, `cancelPendingOpen` at `:471`) and this cancels
	// ours, which nothing else would: a press does not move focus off the trigger it lands on, so
	// `onBlur` never runs, and a tooltip pressed at t=100 opened anyway at t=800. Upstream cancels
	// at the same moment, through `CancelAutomaticToolTip` (`ToolTipService_Partial.cpp:703-726`,
	// the `Stop()` at `:720`).
	//
	// The `pointerup` listener goes on the document rather than the trigger, because a press that
	// releases somewhere else still ends: the primitive does the same at `:476-478`.
	function onPointerDown(bitProps: Record<string, unknown>, event: PointerEvent) {
		pointerDown = true;
		clearTimeout(focusTimer);
		document.addEventListener('pointerup', () => (pointerDown = false), { once: true });
		(bitProps.onpointerdown as ((event: PointerEvent) => void) | undefined)?.(event);
	}

	// The handlers the primitive uses to open and close the tooltip by itself. With
	// `openOnHover` false they are withheld from the trigger, and `open` is then the only
	// thing that opens it. Withholding them is what `openOnHover` means: `disabled` is
	// `IsEnabled` and says the tooltip does not exist, which is a different claim.
	const SELF_OPENING_HANDLERS = [
		'onpointerdown',
		'onpointerup',
		'onpointerenter',
		'onpointermove',
		'onpointerleave',
		'onfocus',
		'onblur'
	] as const;

	// `...rest` is not merged in here. ADR 0009 sends it to the element the component
	// owns, and that is the popup: the trigger belongs to the call site, which can put
	// its own attributes on it directly.
	function triggerProps(bitProps: Record<string, unknown>): Record<string, unknown> {
		if (!openOnHover) {
			// Spread and delete rather than rebuild by `Object.entries`. The primitive's
			// props carry a Svelte attachment under a **symbol** key — it is what registers
			// the trigger node, and therefore what the popup anchors to — and
			// `Object.entries` does not return symbols. Measured: rebuilt that way the
			// tooltip opened at the position Floating UI computes with no reference.
			const kept = { ...bitProps };
			for (const key of SELF_OPENING_HANDLERS) delete kept[key];
			return kept;
		}
		return {
			...bitProps,
			onpointerdown: (event: PointerEvent) => onPointerDown(bitProps, event),
			onpointerenter: (event: PointerEvent) => onPointerEnter(bitProps, event),
			onpointerleave: (event: PointerEvent) => onPointerLeave(bitProps, event),
			onpointermove: (event: PointerEvent) => onPointerMove(bitProps, event),
			onfocus: (event: FocusEvent) => onFocus(event),
			onblur: (event: FocusEvent) => onBlur(bitProps, event)
		};
	}
</script>

<!-- `delayDuration` is the wait before a hover opens one, and `skipDelayDuration` a grace
     window bits-ui opens after a close within which the next open skips the wait entirely —
     700 and 300 by default, the skip at `tooltip.svelte.js:141-151`.

     Upstream has a *reshow row* rather than a skip: within `BETWEEN_SHOW_DELAY_MS` of the last
     tooltip (200ms, `ToolTipService_Partial.h:17`) the wait drops to 400ms for a mouse — 1x,
     not the 1.5x its comment prints, see `SHOW_DELAY` — and stays 800 for a keyboard. **The row
     is not built, and WD-094 is the entry for it.** 0 here withholds the skip so that every
     open waits the full delay. For the mouse that is 400ms long where skipping was 400ms
     short, which is a tie; the keyboard is what breaks it, because the full delay is exactly
     upstream's keyboard reshow and skipping was the whole 800 short of it. Getting the mouse
     row right needs a clock this component does not have — the window is per provider and this
     renders one provider per tooltip — which is the rest of WD-094's argument. -->
<Tooltip.Provider delayDuration={SHOW_DELAY} skipDelayDuration={0}>
	<Tooltip.Root bind:open={() => open, (next) => setOpen(next)} {disabled}>
		<Tooltip.Trigger bind:ref={triggerEl}>
			<!-- The trigger is the consumer's element, not one this component invents.
			     `Tooltip.Trigger` would render its own `<button>` by default; the `child`
			     snippet is the escape ADR 0004 names first and hands the props bits-ui
			     wants on the trigger (the `aria-describedby` and the pointer handlers)
			     to the call site's element. A wrapper element with `display: contents` was
			     rejected: it puts a box in the DOM that upstream has no equivalent for,
			     and `pointerenter` on a box-less element is not something to bet a
			     hover on. -->
			{#snippet child({ props })}
				{@render children(triggerProps(props))}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Portal>
			<Tooltip.Content
				bind:ref
				{side}
				{sideOffset}
				align="center"
				{customAnchor}
				updatePositionStrategy="always"
			>
				<!-- `Tooltip.Content`'s `child` snippet hands back `props` (the popup's own
				     border, background, padding) and `wrapperProps` (the outer wrapper
				     Floating UI positions). Pass `wrapperProps` through first, untouched.

				     The popup carries its own font — `ContentControlThemeFontFamily` at
				     `ToolTipContentThemeFontSize`, not the Body ramp's 14px — because a
				     portalled element leaves the type ramp behind: the portal moves the
				     element to `<body>`, and CSS inheritance follows the DOM rather than
				     the visual hierarchy. Upstream has no such break — the popup is part
				     of the ToolTip's template, so `FontFamily` and `FontSize` reach it by
				     property inheritance from `DefaultToolTipStyle`. -->
				{#snippet child({ props, wrapperProps })}
					<div {...wrapperProps}>
						<div {...props} class={['popup', className]} {style} {...rest}>
							{#if typeof content === 'string'}{content}{:else if content}{@render content()}{/if}
						</div>
					</div>
				{/snippet}
			</Tooltip.Content>
		</Tooltip.Portal>
	</Tooltip.Root>
</Tooltip.Provider>

<style>
	/* The popup: the `ContentPresenter` at ToolTip_themeresources.xaml:56. The
	   `Background`, `BorderBrush`, `BorderThickness`, `Padding`, `MaxWidth` and
	   `CornerRadius` reach it through `TemplateBinding` onto `DefaultToolTipStyle`'s
	   nine `Setter` calls.

	   `BackgroundSizing="InnerBorderEdge"` upstream is CSS's `background-clip:
	   padding-box`; without it, a 1px border lets the background reach into the
	   border ring and the ring renders with two colours. The `padding-box` clip
	   is what `TextBox.svelte:176` writes for the same reason.

	   `max-width` is the pop-up's own, not a floor: `MaxWidth` is a ceiling, not
	   a `MinWidth`, and the tooltip content wraps within it. The width itself
	   comes from the content; this is just the line the wrapping never crosses.

	   `corner-radius` is `ControlCornerRadius` — the `Setter` at :52 reads
	   `{ThemeResource ControlCornerRadius}`, the same resource Button's corner
	   reads. The token is already emitted.

	   The popup carries its own font and not the type-ramp class: a portalled
	   element leaves the ramp behind (§7 of the unit), and this control's font is
	   its own — `ContentControlThemeFontFamily` at `ToolTipContentThemeFontSize`,
	   not the Body ramp's 14px. `line-height: normal` is what §4 measured as
	   the 16px line box that makes the one-line tooltip 32 high (1 border + 6
	   padding + 16 line + 8 padding + 1 border). */
	.popup {
		/* The popup layer. `Popup.svelte`'s `.root` rule carries the whole reason; the short
		   version is that this element is static, so the declaration paints nothing here and
		   is read by the primitive, which mirrors it onto the wrapper it positions. */
		z-index: 1000;
		background: var(--winui-ToolTipBackgroundBrush) padding-box;
		color: var(--winui-ToolTipForegroundBrush);
		border-style: solid;
		border-width: var(--winui-ToolTipBorderThemeThickness);
		border-color: var(--winui-ToolTipBorderBrush);
		padding: var(--winui-ToolTipBorderPadding);
		border-radius: var(--winui-ControlCornerRadius);
		/* The popup host casts this shadow rather than the template. ToolTip alone has
		   `Translation.Z` 16 at ToolTip_Partial.cpp:647 against every other elevated control's 32;
		   the value comes from the recipe in scripts/tokens/manifest.mjs. */
		box-shadow: var(--winui-ToolTipShadow);
		max-width: var(--winui-ToolTipMaxWidth);
		font-family: var(--winui-ContentControlThemeFontFamily);
		font-size: var(--winui-ToolTipContentThemeFontSize);
		line-height: normal;
	}
</style>
