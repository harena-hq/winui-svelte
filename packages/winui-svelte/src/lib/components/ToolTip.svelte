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
		/** No WinUI member: the gap between the tooltip and what it is anchored to, in pixels.
		 *  20 is the gap measured on the reference guest, twice — see the comment on the
		 *  placement logic. */
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

	// ToolTip is a `Windows.UI.Xaml` control WinUI 3 only restyles: there is no
	// implementation in the pin to read, and `docs/surface.md` names this case as one
	// to acknowledge rather than leave unexplained.

	// The template's `OpenStates` group fades the popup in and out with
	// `FadeInThemeAnimation` and `FadeOutThemeAnimation`. Not built in this unit —
	// theme animations are v14's, the version that also owns `ThemeShadow`.
</script>

<script lang="ts">
	import { Tooltip } from 'bits-ui';

	let {
		content,
		placement = 'mouse',
		offset = 20,
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

	// Pointer tracking for the pointer-anchored default. The anchor is a virtual element whose
	// rect sits at the pointer — `side="top"`, `align="center"`, and `sideOffset={offset}`
	// defaults to 20, reproducing the reference-guest measurement of a hover-opened tooltip's
	// 20px gap between the pointer and the bottom of the tooltip.
	//
	// **The popup is placed where the pointer was when it opened, and does not follow it** — the half
	// the gap measurement left open. Photographed on the reference guest: a tooltip standing over a
	// 40px button did not change by one pixel while the pointer moved 21 across it and 20 down, and
	// the same tooltip opened from x 381 and from x 409 centred on 381 and on 409, the pointer's own
	// delta. Pointer-anchored and pointer-following are two claims; the gap measurement established
	// the first and this component had implemented the second.
	//
	// `pointer` therefore goes on tracking, and `frozen` is what the popup is positioned
	// against: the first rect read after an open, held until the close clears it. The
	// obvious implementation — stop recording once `open` is true — is wrong, and the
	// test that opens from two positions is what says so. The primitive opens the *second*
	// tooltip with no delay, so `open` is already true when the `pointermove` carrying the
	// new position arrives, and a guard on `open` pins every later tooltip to the first
	// one's place. Freezing on the read instead is indifferent to that order: the move
	// handler and the popup's mount fall in one task, and Floating UI does not measure
	// until the microtask after it.
	const pointer = $state({ x: 0, y: 0 });

	let frozen: { x: number; y: number } | null = null;

	// Released whenever the tooltip is closed, and by an effect rather than inside the
	// `bind:open` setter below. That setter runs when the *primitive* changes `open`; a
	// consumer closing its own bound `open` never reaches it, and the stale anchor would
	// then pin the next tooltip where the last one stood — the same defect the two
	// rejected implementations had, arriving by a path the pointer never takes.
	$effect(() => {
		if (!open) frozen = null;
	});

	const pointerAnchor: Measurable = {
		getBoundingClientRect(): DOMRect {
			frozen ??= { x: pointer.x, y: pointer.y };
			return new DOMRect(frozen.x, frozen.y, 0, 0);
		}
	};

	// Placement logic. `mouse` is the WinUI fifth `PlacementMode` value — the measured behaviour —
	// and is the default. The other four names anchor to the trigger element rather than to the
	// pointer, the mode Slider's thumb tooltip uses. The 20px gap was measured on the reference guest
	// between a pointer and the bottom of a hover-opened tooltip, and independently between the
	// bottom of an element-anchored Slider tooltip and the top of the thumb's visible circle.
	const side = $derived(placement === 'mouse' ? 'top' : placement);
	const sideOffset = $derived(offset);
	// The anchor is always passed explicitly, and the named placements pass the trigger
	// element itself. Leaving it null and letting the primitive fall back to its own
	// record of the trigger loses the race when the tooltip is open before the trigger
	// has been registered — measured: a tooltip whose `open` starts `true` renders at
	// (0, -60), the position Floating UI computes with no reference, and never recovers,
	// while the same tooltip opened by a hover a moment later lands correctly. Binding
	// the element here makes the anchor exist as early as the element does.
	let triggerEl = $state<HTMLElement | null>(null);
	/** Whether a pointer is on the trigger — see `customAnchor` for why the anchor turns on it. */
	let pointerInside = $state(false);
	// Pointer-anchored **only while there is a pointer on the trigger**. `onfocus` is one of
	// the handlers the primitive puts on it, so a keyboard user tabbing onto the trigger opens
	// a tooltip with no pointer anywhere, and `pointer` then holds either its initial `{0, 0}`
	// or wherever the mouse last was inside this trigger — neither of which is a position to
	// honour. Upstream has no such case to answer: `PlacementMode.Mouse` is a pointer's
	// placement and XAML opens a keyboard tooltip against the element. So does this.
	//
	// It has to be the anchor rather than the frozen value, because freezing is what makes the
	// wrong answer permanent: before this, a corner-pinned popup at least corrected itself the
	// moment a pointer crossed the trigger, and the freeze removed the correction.
	const customAnchor = $derived<Measurable | HTMLElement | null>(
		placement === 'mouse' && pointerInside ? pointerAnchor : triggerEl
	);

	function track(event: PointerEvent) {
		if (placement !== 'mouse') return;
		pointer.x = event.clientX;
		pointer.y = event.clientY;
	}

	function onPointerMove(bitProps: Record<string, unknown>, event: PointerEvent) {
		(bitProps.onpointermove as ((event: PointerEvent) => void) | undefined)?.(event);
		track(event);
	}

	// The entry is recorded **before** the primitive's own handler runs, and that order is
	// the whole reason this wrapper exists beside `onpointermove`. A tooltip opened inside
	// the provider's skip-delay window opens on the entry itself, and its popup is mounted
	// and measured in the microtask after that handler — one dispatch before the
	// `pointermove` carrying the same position. Recording on the way in means the pointer
	// is already where it is by the time anything asks.
	function onPointerEnter(bitProps: Record<string, unknown>, event: PointerEvent) {
		pointerInside = true;
		track(event);
		(bitProps.onpointerenter as ((event: PointerEvent) => void) | undefined)?.(event);
	}

	function onPointerLeave(bitProps: Record<string, unknown>, event: PointerEvent) {
		pointerInside = false;
		(bitProps.onpointerleave as ((event: PointerEvent) => void) | undefined)?.(event);
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
			onpointerenter: (event: PointerEvent) => onPointerEnter(bitProps, event),
			onpointerleave: (event: PointerEvent) => onPointerLeave(bitProps, event),
			onpointermove: (event: PointerEvent) => onPointerMove(bitProps, event)
		};
	}
</script>

<Tooltip.Provider>
	<Tooltip.Root
		bind:open={
			() => open,
			(next) => {
				open = next;
				onOpenChange?.(next);
			}
		}
		{disabled}
	>
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

	   The popup carries its own font and not the type-ramp class: a portalled element leaves the ramp
	   behind, and this control's font is its own — `ContentControlThemeFontFamily` at
	   `ToolTipContentThemeFontSize`, not the Body ramp's 14px. `line-height: normal` gives a 16px
	   line box at 12px, which makes the one-line tooltip 32 high (1 border + 6 padding + 16 line +
	   8 padding + 1 border), the height measured on the reference guest. */
	.popup {
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
