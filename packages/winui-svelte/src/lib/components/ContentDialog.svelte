<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/**
	 * `ContentDialogButton`, lower-cased. Which command button Enter clicks, and which is drawn as
	 * the accent one while no other command button holds focus.
	 */
	export type ContentDialogButton = 'none' | 'primary' | 'secondary' | 'close';

	export interface ContentDialogProps {
		/** Title. Narrowed to a string: `object` has no Svelte analogue that a `Snippet` does not
		 * already cover, and the content slot is the snippet. */
		title?: string;
		/**
		 * Content. To describe the dialog by part of it, give that part an `id` and the dialog its
		 * `aria-describedby`, which the rest props carry to the dialog element. There is no
		 * description member upstream, and a slot for one would have to choose between a dialog's
		 * text and the fields beside it, which only the consumer knows.
		 */
		children?: Snippet;
		/** PrimaryButtonText. A button with no text is not drawn, which is `PrimaryVisible` and
		 * the states beside it. */
		primaryButtonText?: string;
		/** SecondaryButtonText. */
		secondaryButtonText?: string;
		/** CloseButtonText. */
		closeButtonText?: string;
		/**
		 * DefaultButton. As upstream, the button that takes Enter and the first focus is the one drawn
		 * in the accent colour (ContentDialog_themeresources.xaml:194-208), so a dialog cannot accent
		 * a confirm button while Cancel holds the focus.
		 */
		defaultButton?: ContentDialogButton;
		/** IsPrimaryButtonEnabled. No element takes this name, so the polarity stays — ADR 0009. */
		primaryButtonEnabled?: boolean;
		/** IsSecondaryButtonEnabled. */
		secondaryButtonEnabled?: boolean;
		/** `ShowAsync`/`Hide` as state. ADR 0009 maps a control's own state to a bindable prop. */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback.
		 * `Opened`, `Closing` and `Closed` are recoverable from it. */
		onOpenChange?: (open: boolean) => void;
		/** PrimaryButtonClick. `ContentDialogResult.Primary` is which callback ran. */
		onPrimaryButtonClick?: () => void;
		/** SecondaryButtonClick. */
		onSecondaryButtonClick?: () => void;
		/** CloseButtonClick. `ContentDialogResult.None` is this one. */
		onCloseButtonClick?: () => void;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/** ADR 0009's `ref` points at the interactive element: here, the card. */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// `TitleTemplate`, `ContentTemplate`, `PrimaryButtonStyle`, `SecondaryButtonStyle` and
	// `CloseButtonStyle` are absent: a Svelte consumer restyles through `class`, `style` and the
	// token cascade, which is ADR 0002, and templates a slot with a snippet.
	// `PrimaryButtonCommand` and the `*CommandParameter` members are absent: `ICommand` is a
	// binding contract, and the callback above is the whole of it that reaches the screen.
	// `FullSizeDesired` is absent. It is one visual state, `FullDialogSizing`, which stretches the
	// card vertically; it is not what this unit measures and no Gallery example sets it.
	// `XamlRoot` is absent: a browser tab has one root and the portal goes to it.

	// Candidates for `FocusManager_GetFirstFocusableElement`, which `ContentDialog_Partial.cpp:2011`
	// asks about the content. Everything the browser can focus by default, plus anything given a
	// `tabindex` or made editable; it deliberately over-matches, because the two tests that
	// narrow it are properties rather than selectors and are applied in `tabStop` below.
	const FOCUS_CANDIDATE = [
		'a[href]',
		'area[href]',
		'button',
		'input',
		'select',
		'textarea',
		'iframe',
		'summary',
		'audio[controls]',
		'video[controls]',
		'[contenteditable]:not([contenteditable="false"])',
		'[tabindex]'
	].join(', ');

	/**
	 * Is this element a tab stop, and where in the order?
	 *
	 * `IsTabStop="False"` is a negative `tabIndex` — reachable by script and not by Tab, which is
	 * what the template says the dialog itself is (`ContentDialog_themeresources.xaml:62`) and
	 * what the card carries. **Read through the `tabIndex` property, never off the attribute**:
	 * the property is the parsed value, so it answers `tabindex=" -1"` as −1 and `tabindex="-0"`
	 * as 0 and the elements that are tab stops with no attribute at all — with the one exception
	 * below, which the property gets wrong.
	 *
	 * XAML orders focus by `TabIndex` and so does HTML: a positive index comes first, ascending,
	 * and everything else follows in document order. The content slot is the consumer's, so a
	 * positive index in it is theirs to write and not this library's to assume away.
	 */
	function tabStop(element: HTMLElement) {
		if (element.matches(':disabled')) return null;
		// One element does not answer for itself. Measured in Chromium 2026-09-18: a
		// `contenteditable` element with no `tabindex` of its own reports `tabIndex` −1 and is a
		// tab stop anyway, where `audio[controls]`, `video[controls]`, `iframe` and `summary` all
		// report 0 and `details` without a `summary` reports −1 and is not focusable at all. An
		// explicit attribute is still the consumer's word, in both directions.
		const index =
			element.isContentEditable && !element.hasAttribute('tabindex') ? 0 : element.tabIndex;
		if (index < 0) return null;
		// `Number.MAX_SAFE_INTEGER` and not `Infinity`: the rank is subtracted in the comparator
		// below, and `Infinity - Infinity` is `NaN`, which makes a comparator that reorders the
		// equal ranks — the whole of the ordinary case — by nothing in particular.
		return index > 0 ? index : Number.MAX_SAFE_INTEGER;
	}
</script>

<script lang="ts">
	import { Dialog } from 'bits-ui';
	import Button from './Button.svelte';

	let {
		title,
		children,
		primaryButtonText,
		secondaryButtonText,
		closeButtonText,
		defaultButton = 'none',
		primaryButtonEnabled = true,
		secondaryButtonEnabled = true,
		open = $bindable(false),
		onOpenChange,
		onPrimaryButtonClick,
		onSecondaryButtonClick,
		onCloseButtonClick,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ContentDialogProps = $props();

	const buttonCount = $derived(
		[primaryButtonText, secondaryButtonText, closeButtonText].filter(Boolean).length
	);

	// Every close reaches `onOpenChange`, which is the promise its doc makes. A button's click set
	// `open` and nothing else, so the callback heard Escape and never a button.
	function dismiss(callback?: () => void) {
		callback?.();
		open = false;
		onOpenChange?.(false);
	}

	// `ContentDialog::ExecuteCloseAction` (`ContentDialog_Partial.cpp:2063`), which Escape runs: a
	// close button that is there and enabled is clicked, so `CloseButtonClick` fires and the
	// result is `None`; with none, the dialog only hides.
	function executeCloseAction() {
		if (closeRef && !closeRef.disabled) closeRef.click();
		else dismiss();
	}

	// What takes Enter for itself before it reaches the layout root. A XAML button handles the key
	// and marks it handled (`ButtonBase_Partial.cpp:449-467`), and the root's handler never sees
	// it — pressed on the reference on 2026-10-01: Enter on the focused `Cancel` cancelled, where
	// Enter on the focused CheckBox clicked the default button, because a CheckBox does not take
	// Enter. On the web the elements whose own activation is Enter are these, and a control that
	// handles the key itself says so with `preventDefault`.
	//
	// Escape has no such list. The primitive's escape layer listens on the document, calls
	// `preventDefault` itself and hands `onEscapeKeydown` a copy, so a control's own
	// `preventDefault` does not keep Escape from it, and would not without the layout root carrying
	// that fact across — where upstream's `AutoSuggestBox` takes Escape even with its list closed
	// (`AutoSuggestBox_Partial.cpp:1134-1145`), here the dialog closes. Recorded in
	// `docs/surface.md` beside this handler.
	const TAKES_ENTER =
		'button, a[href], area[href], summary, textarea, select, [contenteditable]:not([contenteditable="false"]), input[type="button"], input[type="submit"], input[type="reset"], input[type="image"], input[type="file"], input[type="color"], audio[controls], video[controls]';

	// `ProcessLayoutRootKey` (`ContentDialog_Partial.cpp:1736`), its Enter half (`:1761`): the
	// default button is clicked if it is enabled, wherever focus is in the dialog, unless focus is
	// on something that takes Enter itself. Pressed on the reference on 2026-10-01: with focus on
	// the content's CheckBox, Enter saved; with no default button, Enter did nothing. An Enter that
	// commits an IME composition belongs to the input method, which is still holding the text, and
	// is not a press of the dialog's.
	function onLayoutRootKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' || event.defaultPrevented) return;
		if (event.isComposing || event.keyCode === 229) return;
		const taker = event.target instanceof Element ? event.target.closest(TAKES_ENTER) : null;
		if (taker && (event.currentTarget as Element).contains(taker)) return;
		const button = defaultButtonRef;
		if (!button || button.disabled) return;
		event.preventDefault();
		button.click();
	}

	let contentRef = $state<HTMLElement | null>(null);
	let primaryRef = $state<HTMLButtonElement | null>(null);
	let secondaryRef = $state<HTMLButtonElement | null>(null);
	let closeRef = $state<HTMLButtonElement | null>(null);

	// `GetDefaultButtonHelper` (`ContentDialog_Partial.cpp:1566`) resolves `DefaultButton` to a
	// button rather than to a style, so this reads the prop and not the accent variant beside it.
	// A button whose text is unset is not rendered here and upstream collapses it; either way the
	// step below it is what answers.
	const defaultButtonRef = $derived(
		defaultButton === 'primary'
			? primaryRef
			: defaultButton === 'secondary'
				? secondaryRef
				: defaultButton === 'close'
					? closeRef
					: null
	);

	// `DefaultButtonStates` (`ContentDialog_Partial.cpp:398-440`): the default button is drawn as
	// the accent one while focus is outside the command area, and inside it only while the
	// default button itself holds focus. Upstream re-reads focus on every `GotFocus` of the layout
	// root (`:232-238`), so this is the element the last `focusin` there reached. Pressed on the
	// reference on 2026-10-01: Tab from the CheckBox to `Save` kept its accent, on to
	// `Don't Save` and `Cancel` dropped it, and Shift+Tab back to `Save` and to the CheckBox drew
	// it again.
	let focusedElement = $state<Element | null>(null);
	let commandsRef = $state<HTMLElement | null>(null);
	function drawnAsDefault(button: 'primary' | 'secondary' | 'close') {
		if (defaultButton !== button) return false;
		const inCommandArea = focusedElement !== null && !!commandsRef?.contains(focusedElement);
		return !inCommandArea || focusedElement === defaultButtonRef;
	}
	function onLayoutRootFocusIn(event: FocusEvent) {
		focusedElement = event.target instanceof Element ? event.target : null;
	}

	// `wasFocusSet` is an out-parameter of each `SetFocusedElement` call below rather than an
	// assumption that it worked, and reading `document.activeElement` back is that
	// out-parameter: `.focus()` on a hidden or unrendered element is a silent no-op, which no
	// selector can predict.
	function focusProgrammatically(element: HTMLElement | null) {
		if (!element) return false;
		element.focus({ focusVisible: false });
		return document.activeElement === element;
	}

	// `ContentDialog::SetInitialFocusElement` (`ContentDialog_Partial.cpp:1984`), whose three
	// steps are `:1997` the first focusable element of the content, `:2027` the default button,
	// and `:2039` the first focusable command button — each with `FocusState_Programmatic`
	// (`:2023`, `:2035`, `:2056`), which moves focus and draws no visual.
	//
	// The order is content first, and the default button is the *fallback*. Both of the Gallery's
	// examples put a CheckBox in the content, so neither ever reaches step two, and the accent
	// `Save` button of the one with `DefaultButton="Primary"` is not the element that holds focus
	// when the dialog opens. Measured on the reference guest 2026-09-18: shown from a mouse
	// click, nothing in the dialog is lit; one Tab lights `Save`, which places focus on the
	// CheckBox before it; and Space pressed instead of Tab toggles that CheckBox and still lights
	// nothing.
	//
	// `focus({ focusVisible: false })` is `FocusState_Programmatic` rather than a workaround for
	// it — a plain `focus()` grants `:focus-visible` on a page that has seen no interaction,
	// which is every page that opens a dialog on load.
	//
	// The last line is this library's and not upstream's: `SetInitialFocusElement` simply returns
	// with focus wherever it was, which leaves it outside a dialog that traps it. WD-015.
	function setInitialFocusElement() {
		const content = [...(contentRef?.querySelectorAll<HTMLElement>(FOCUS_CANDIDATE) ?? [])]
			.map((element) => [element, tabStop(element)] as const)
			.filter((pair): pair is readonly [HTMLElement, number] => pair[1] !== null)
			// `sort` is stable, so equal ranks keep the document order `querySelectorAll` returned.
			.sort(([, a], [, b]) => a - b);
		for (const [candidate] of content) if (focusProgrammatically(candidate)) return;
		if (focusProgrammatically(defaultButtonRef)) return;
		for (const command of [primaryRef, secondaryRef, closeRef])
			if (focusProgrammatically(command)) return;
		focusProgrammatically(ref);
	}
</script>

<Dialog.Root
	{open}
	onOpenChange={(value) => {
		open = value;
		onOpenChange?.(value);
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay>
			{#snippet child({ props })}
				<div {...props} class="smoke"></div>
			{/snippet}
		</Dialog.Overlay>
		<!-- `LayoutRoot`, whose `KeyDown` is upstream's (`ContentDialog_Partial.cpp:224-226`). -->
		<!-- eslint-disable svelte/no-unused-svelte-ignore -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="layout" onkeydown={onLayoutRootKeydown} onfocusin={onLayoutRootFocusIn}>
			<!-- eslint-enable svelte/no-unused-svelte-ignore -->
			<Dialog.Content
				interactOutsideBehavior="ignore"
				onEscapeKeydown={(event) => {
					// The primitive would close the dialog itself and skip the close button; this is
					// `ProcessLayoutRootKey`'s Escape half (`:1747-1760`) instead.
					event.preventDefault();
					executeCloseAction();
				}}
				onOpenAutoFocus={(event) => {
					// The primitive focuses the first focusable descendant with a plain `focus()`,
					// which is the right element in the Gallery's dialog and lights it. Cancel that
					// and run upstream's own three steps unlit instead.
					event.preventDefault();
					setInitialFocusElement();
				}}
			>
				{#snippet child({ props })}
					<div
						{...props}
						bind:this={ref}
						class={['card', 'winui-BodyTextBlockStyle', className]}
						{style}
						{...rest}
					>
						<div class="scroll">
							<div class="upper">
								{#if title}
									<Dialog.Title>
										{#snippet child({ props: titleProps })}
											<div {...titleProps} class="title">{title}</div>
										{/snippet}
									</Dialog.Title>
								{/if}
								<div class="content" bind:this={contentRef}>{@render children?.()}</div>
							</div>
						</div>
						{#if buttonCount > 0}
							<div class="commands" data-count={buttonCount} bind:this={commandsRef}>
								{#if primaryButtonText}
									<Button
										bind:ref={primaryRef}
										variant={drawnAsDefault('primary') ? 'accent' : 'default'}
										disabled={!primaryButtonEnabled}
										onclick={() => dismiss(onPrimaryButtonClick)}
									>
										{primaryButtonText}
									</Button>
								{/if}
								{#if secondaryButtonText}
									<Button
										bind:ref={secondaryRef}
										variant={drawnAsDefault('secondary') ? 'accent' : 'default'}
										disabled={!secondaryButtonEnabled}
										onclick={() => dismiss(onSecondaryButtonClick)}
									>
										{secondaryButtonText}
									</Button>
								{/if}
								{#if closeButtonText}
									<Button
										bind:ref={closeRef}
										variant={drawnAsDefault('close') ? 'accent' : 'default'}
										onclick={() => dismiss(onCloseButtonClick)}
									>
										{closeButtonText}
									</Button>
								{/if}
							</div>
						{/if}
					</div>
				{/snippet}
			</Dialog.Content>
		</div>
	</Dialog.Portal>
</Dialog.Root>

<style>
	/* ContentDialog_themeresources.xaml:222 — LayoutRoot's smoke rectangle fills the window. */
	.smoke {
		/* The popup layer. `Popup.svelte`'s `.root` rule carries the whole reason. `Dialog` is
		   not a floating layer — there is no wrapper for the primitive to mirror this onto —
		   and this element is `position: fixed`, so the declaration is used where it sits. */
		z-index: 1000;
		position: fixed;
		inset: 0;
		background: var(--winui-ContentDialogSmokeFill);
	}

	/* ContentDialog_themeresources.xaml:221 — LayoutRoot is the centred, full-window layer. */
	.layout {
		/* The popup layer. `Popup.svelte`'s `.root` rule carries the whole reason. `Dialog` is
		   not a floating layer — there is no wrapper for the primitive to mirror this onto —
		   and this element is `position: fixed`, so the declaration is used where it sits. */
		z-index: 1000;
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	/* ContentDialog_themeresources.xaml:223 — BackgroundElement is the bordered dialog card;
	   clipping is needed because the top overlay would otherwise square its rounded corners. */
	.card {
		pointer-events: auto;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: var(--winui-ContentDialogMinWidth);
		max-width: var(--winui-ContentDialogMaxWidth);
		min-height: var(--winui-ContentDialogMinHeight);
		max-height: var(--winui-ContentDialogMaxHeight);
		border-style: solid;
		border-width: var(--winui-ContentDialogBorderWidth);
		border-color: var(--winui-ContentDialogBorderBrush);
		border-radius: var(--winui-OverlayCornerRadius);
		/* The dialog host casts this shadow at `Translation.Z` 128
		   (`ContentDialog_Partial.cpp:1165`). `GetDropShadowRecipe` in
		   dxaml/xcp/components/graphics/inc/DropShadowRecipe.h defines it; `PLATFORM_SHADOWS`
		   derives the value and records the one composition-to-CSS blur constant. It is a depth of
		   its own: a dialog's ramp runs past forty pixels where a popup's closes in nineteen, and
		   a dialog darkens the pixels above it where a popup darkens none.

		   `padding-box` is `BackgroundSizing="InnerBorderEdge"` on `BackgroundElement`
		   (ContentDialog_themeresources.xaml:223). It matters here rather than being a
		   formality: `ContentDialogBorderBrush` resolves to `SurfaceStrokeColorDefaultBrush`,
		   which is 40% alpha, so a fill clipped to the border box composites the ring against
		   the card instead of against the smoke behind it. Every other `InnerBorderEdge` site
		   in this library writes `padding-box`; this one did not. */
		background: var(--winui-ContentDialogBackground) padding-box;
		box-shadow: var(--winui-DialogShadow);
		color: var(--winui-ContentDialogForeground);
		/* The card is `tabindex="-1"`, so it is not in the tab order and only script focuses it:
		   the open handler above, and the primitive's focus scope, which falls back to its own
		   container when focus leaves it. The browser paints its own ring for the second of
		   those, and WinUI's dialog draws none. */
		outline: none;
	}

	/* ContentDialog_themeresources.xaml:232 — ContentScrollViewer owns the scrollable area, and
	   :227's `DialogSpace` gives it the star row, so it takes every pixel the command row does
	   not. A ScrollViewer stretches its content, and the Grid at :233 sets no VerticalAlignment,
	   so the overlay and the separator it carries reach the bottom of that row rather than
	   stopping at the content. Without the flex column below, a dialog shorter than
	   `ContentDialogMinHeight` would draw the separator against its text and leave a band of
	   card fill between the separator and the commands. */
	.scroll {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	/* ContentDialog_themeresources.xaml:233 — the upper Grid receives overlay, padding, and separator. */
	.upper {
		/* Stretched by the rule above; `flex-shrink: 0` so taller content scrolls instead. */
		flex: 1 0 auto;
		background: var(--winui-ContentDialogTopOverlay);
		padding: var(--winui-ContentDialogPadding);
		border-style: solid;
		border-width: var(--winui-ContentDialogSeparatorThickness);
		border-color: var(--winui-ContentDialogSeparatorBorderBrush);
	}

	/* ContentDialog_themeresources.xaml:238 — Title is the fixed-size, semibold heading. The
	   template writes FontSize="20" and FontWeight="SemiBold" directly; although
	   SubtitleTextBlockStyle uses the same pair, it names the Display family and does not measure
	   like this ContentControl. */
	.title {
		margin: var(--winui-ContentDialogTitleMargin);
		/* c1-allow: ContentDialog_themeresources.xaml:238 */
		font-size: 20px;
		/* c1-allow: ContentDialog_themeresources.xaml:238 */
		font-weight: 600;
	}

	/* ContentDialog_themeresources.xaml:248 — CommandSpace separates and pads the command row. */
	.commands {
		flex: none;
		/* The command row is laid out in the width the dialog already has and does not widen it.
		   Upstream's star columns are equal shares with each child's natural width as a floor —
		   measured on the original, `Save` / `Don't Save` / `Cancel` come out 85 / 91 / 78 inside
		   a 320 card, because the middle one needs more than the 84.67 an equal share gives and
		   takes it from the others, while `Replace` / `Keep` / `Cancel` all fit and come out
		   85 / 85 / 84. `repeat(n, 1fr)` reproduces that distribution exactly, once the width is
		   fixed. What it does not reproduce is XAML's measure pass, which asks the buttons for
		   their natural widths and sums them; CSS sizes an `fr` track set by the *largest*
		   contribution times the track count, so the row asked for 3 x 90.34 and grew the card to
		   337 against the original's 320. `contain: inline-size` is what takes the row out of
		   that measurement. WD-014 records what it costs. */
		contain: inline-size;
		padding: var(--winui-ContentDialogPadding);
		background: var(--winui-ContentDialogBackground);
		display: grid;
		/* ContentDialogButtonSpacing is a GridLength at ContentDialog_themeresources.xaml:16;
		   the token layer emits no equivalent, so the measured 8px track gap stays local. */
		gap: 8px;
	}

	/* ContentDialog_themeresources.xaml:144 onward — one and two visible buttons keep two star tracks. */
	.commands[data-count='1'],
	.commands[data-count='2'] {
		grid-template-columns: 1fr 1fr;
	}

	/* ContentDialog_themeresources.xaml:144 onward — three visible buttons use three equal tracks. */
	.commands[data-count='3'] {
		grid-template-columns: 1fr 1fr 1fr;
	}

	/* ContentDialog_themeresources.xaml:144 onward — one visible button occupies the right star
	   track. `CloseVisible`, `PrimaryVisible` and `SecondaryVisible` each collapse the other two
	   buttons and leave `PrimaryColumn`'s star empty, so a lone button is half the width and sits
	   at the right rather than filling the row.

	   `:global` because the child is a `Button`, and a scoped `> *` compiles to a selector that
	   requires this component's scoping class on the child — which another component's root
	   element never carries. Without it the rule matches nothing and the button silently draws in
	   the left half; measured on the guest at 25px from the card's left edge, where it belongs at
	   164. */
	.commands[data-count='1'] > :global(*) {
		grid-column: 2;
	}
</style>
