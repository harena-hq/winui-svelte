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
		/** IsOpen. */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: boolean) => void;
		/** IsEnabled, inverted to HTML's attribute — ADR 0009. */
		disabled?: boolean;
		/** The element the tooltip is attached to. Receives the props it must spread. */
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
	// rect sits at the pointer — `side="top"`, `align="center"`, and `sideOffset={20}`
	// reproduces the reference-guest measurement of a hover-opened tooltip's 20px gap between
	// the pointer and the bottom of the tooltip. `updatePositionStrategy` is `"always"` so
	// Floating UI calls `getBoundingClientRect()` on every animation frame; the function reads
	// the reactive `pointer` so the tooltip follows the pointer for as long as it is open.
	const pointer = $state({ x: 0, y: 0 });

	const pointerAnchor: Measurable = {
		getBoundingClientRect(): DOMRect {
			return new DOMRect(pointer.x, pointer.y, 0, 0);
		}
	};

	// Placement logic. `mouse` is the WinUI fifth `PlacementMode` value — the measured
	// behaviour — and is the default. The other four names anchor to the trigger element
	// rather than to the pointer, the mode needed for Slider's thumb tooltip.
	const side = $derived(placement === 'mouse' ? 'top' : placement);
	// 20 is the gap measured on the reference guest between the pointer and the bottom of a
	// hover-opened tooltip. An element-anchored one takes no gap: what WinUI puts between a
	// tooltip and its placement target has not been measured, and the four named placements
	// are here for Slider's thumb tooltip rather than for the Gallery's page.
	const sideOffset = $derived(placement === 'mouse' ? 20 : 0);
	// The anchor is always passed explicitly, and the named placements pass the trigger
	// element itself. Leaving it null and letting the primitive fall back to its own
	// record of the trigger loses the race when the tooltip is open before the trigger
	// has been registered — measured: a tooltip whose `open` starts `true` renders at
	// (0, -60), the position Floating UI computes with no reference, and never recovers,
	// while the same tooltip opened by a hover a moment later lands correctly. Binding
	// the element here makes the anchor exist as early as the element does.
	let triggerEl = $state<HTMLElement | null>(null);
	const customAnchor = $derived<Measurable | HTMLElement | null>(
		placement === 'mouse' ? pointerAnchor : triggerEl
	);

	function onPointerMove(bitProps: Record<string, unknown>, event: PointerEvent) {
		(bitProps.onpointermove as ((event: PointerEvent) => void) | undefined)?.(event);
		if (placement === 'mouse') {
			pointer.x = event.clientX;
			pointer.y = event.clientY;
		}
	}

	// `...rest` is not merged in here. ADR 0009 sends it to the element the component
	// owns, and that is the popup: the trigger belongs to the call site, which can put
	// its own attributes on it directly.
	function triggerProps(bitProps: Record<string, unknown>): Record<string, unknown> {
		return {
			...bitProps,
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
					<!-- WD-006: the popup is measured to cast a drop shadow onto what is
					     under it — the rows below its bottom edge darken from `#CC` back
					     up to the page over about eight pixels. That is `ThemeShadow`,
					     which is v14's and is not built in this unit. The lack of a
					     `box-shadow` here is the deliberate absence, not an oversight. -->
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
		max-width: var(--winui-ToolTipMaxWidth);
		font-family: var(--winui-ContentControlThemeFontFamily);
		font-size: var(--winui-ToolTipContentThemeFontSize);
		line-height: normal;
	}
</style>
