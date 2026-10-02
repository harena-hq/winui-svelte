<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ToggleSwitchProps {
		/**
		 * IsOn, under HTML's name for it — ADR 0009. The control renders a real
		 * `<input type="checkbox" role="switch">`, where `checked` is already live, and two
		 * names for one state is the thing that rule exists to prevent.
		 */
		checked?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change
		 *  callback. Upstream signals this as the `Toggled` event. */
		onCheckedChange?: (checked: boolean) => void;
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean;
		/** Header. Absent by default, as upstream's presenter is `Visibility="Collapsed"`
		 *  until one is set. */
		header?: Snippet | string;
		/** OnContent. WinUI's own default is the word "On". */
		onContent?: Snippet | string;
		// ToggleSwitch has no default content slot upstream — its two content members are
		// `OnContent` and `OffContent`, and only one of them shows at a time — which is why
		// there is no `children` prop here. A plain comment rather than a `/** */` one: a doc
		// comment would attach itself to `offContent` below and describe the wrong thing.
		/** OffContent. WinUI's own default is the word "Off". */
		offContent?: Snippet | string;
		// Three HTML form attributes with no WinUI member follow, and a plain comment says so
		// rather than a `/** */` one: a doc comment here would attach itself to `name` below.
		// The rest props land on the root element, which for this control is the outer `<div>`,
		// so these would never reach the `<input>` they belong to.
		/** No WinUI member: the form field name. */
		name?: string;
		/** No WinUI member: the value submitted when the switch is on. */
		value?: string;
		/** No WinUI member: the id of the form to associate with. */
		form?: string;
		class?: string;
		style?: string;
		/**
		 * The `<input type="checkbox">`, not the root `<div>` — ADR 0009's `ref` points at the
		 * interactive element, which for Button happens to be the root and here does not.
		 */
		ref?: HTMLInputElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		checked = $bindable(false),
		onCheckedChange,
		disabled = false,
		header,
		onContent = 'On',
		offContent = 'Off',
		name,
		value,
		form,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ToggleSwitchProps = $props();

	// The knob travels `SwitchKnobBounds`' 40 less `SwitchKnob`'s 20
	// (`ToggleSwitch_themeresources.xaml:508-509`), which is the `To="20"` the `On` state gives
	// the knob's `X` (`:445`) and what `SizeChangedHandler` measures as the translation range
	// (`ToggleSwitch_Partial.cpp:937-952`).
	const KNOB_RANGE = 20;

	// The drag, `SwitchThumb`'s (`ToggleSwitch_themeresources.xaml:524-530`), a `Thumb` spanning
	// the switch, the gap and the content, which is this `<label>`. `DragStartedHandler`
	// (`ToggleSwitch_Partial.cpp:803`) takes the knob's translation where it is (`GetTranslations`,
	// `:421-428`, mid-slide included); `DragDeltaHandler` (`:823`) adds each horizontal change, the
	// `Thumb`'s per-move delta (`Thumb_Partial.cpp:285-288`), and notes that the knob was dragged;
	// `DragCompletedHandler` (`:844`) runs `MoveCompleted` (`:592`), which toggles if a dragged
	// knob ended past half the range — compared against the sum of the deltas, not the clamped
	// position `SetTranslations` (`:440`) draws. A lost capture completes the drag the same way
	// (`Thumb::OnPointerCaptureLost`, `Thumb_Partial.cpp:490-496`), and a disabled switch ends it
	// (`OnIsEnabledChanged`, `ToggleSwitch_Partial.cpp:1018-1021`).
	//
	// The tap is separate: `DragCompletedHandler` has cleared `m_isDragging` (`:860`) before
	// `TapHandler` (`:869`) runs, so a press that moved less than the tap's tolerance toggles as a
	// tap whatever the drag did. Pressed on the reference on 2026-10-01, from off: moved 1, 2 or
	// 3px in either axis, or 3 in both, and released, it turned on; moved 4px in either, it stayed
	// off. So did 6px; 14px turned it on, and from on 14px back turned it off; a drag that began
	// on the word "Off" moved the knob too; and through each drag the switch kept the look it
	// started with.
	const TAP_TOLERANCE = 4;
	let dragging = $state(false);
	let knobTranslation = $state(0);
	let knobRef = $state<HTMLElement | null>(null);
	let pointerId: number | null = null;
	let wasDragged = false;
	let tapped = true;
	let startX = 0;
	let startY = 0;
	let lastX = 0;
	// The click a released press goes on to fire, when the press was not a tap. It is canceled
	// as it passes the label, which cancels the label's activation, so the input is never clicked.
	// A click aimed at the input itself — a key's, a script's — is not the press's, since the input
	// takes no pointer events, and it is let through: `toggle()` runs on it, and canceling it would
	// restore the input's `checked` after the new state had been applied. The flag is consumed by
	// the next click, or dropped by the next press if none comes; a touch drag past the browser's
	// own slop, or a pan, fires no click at all.
	let suppressClick = false;

	function onLabelClick(event: MouseEvent) {
		if (!suppressClick) return;
		suppressClick = false;
		if (event.target !== ref) event.preventDefault();
	}

	function onDragStart(event: PointerEvent) {
		suppressClick = false;
		if (disabled || dragging || !event.isPrimary || event.button !== 0) return;
		(event.currentTarget as Element).setPointerCapture(event.pointerId);
		const transform = knobRef ? getComputedStyle(knobRef).transform : 'none';
		knobTranslation = transform === 'none' ? 0 : new DOMMatrix(transform).m41;
		pointerId = event.pointerId;
		dragging = true;
		wasDragged = false;
		tapped = true;
		startX = lastX = event.clientX;
		startY = event.clientY;
	}

	function onDragDelta(event: PointerEvent) {
		if (!dragging || event.pointerId !== pointerId) return;
		if (
			Math.abs(event.clientX - startX) >= TAP_TOLERANCE ||
			Math.abs(event.clientY - startY) >= TAP_TOLERANCE
		)
			tapped = false;
		const delta = event.clientX - lastX;
		if (delta === 0) return;
		lastX = event.clientX;
		wasDragged = true;
		knobTranslation += delta;
	}

	function onDragCompleted(event: PointerEvent) {
		if (!dragging || event.pointerId !== pointerId) return;
		dragging = false;
		pointerId = null;
		// A press that left the tolerance is not a tap, whichever axis it left by.
		suppressClick = !tapped;
		if (!wasDragged) return;
		// `DragStartedHandler` focuses the switch with `FocusState_Pointer`, which draws nothing.
		// Here it is done at the release, because the label's own `mousedown` would take focus
		// back off the input if it were done at the press.
		ref?.focus({ preventScroll: true, focusVisible: false });
		const half = KNOB_RANGE / 2;
		if (checked ? knobTranslation <= half : knobTranslation >= half) {
			checked = !checked;
			onCheckedChange?.(checked);
		}
	}

	$effect(() => {
		if (disabled && dragging) {
			dragging = false;
			pointerId = null;
			suppressClick = !tapped;
		}
	});

	function toggle(event: MouseEvent & { currentTarget: HTMLInputElement }) {
		// Nothing changes, so the click is canceled and its flip put back.
		if (dragging || disabled) {
			event.preventDefault();
			return;
		}
		checked = !checked;
		onCheckedChange?.(checked);
		// Left uncanceled and written from the props after the callback, for the reasons
		// CheckBox's `toggle` gives: canceling would restore `input.checked` after the props had
		// been applied to it, and a parent that puts `checked` back leaves Svelte nothing to write
		// while the browser's flip stands. As there, the click now fires `input` and `change`.
		event.currentTarget.checked = checked;
	}
</script>

<div
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	data-checked={checked || undefined}
	data-disabled={disabled || undefined}
	data-dragging={dragging || undefined}
	{...rest}
>
	{#if header !== undefined}
		<span class="header">
			{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
		</span>
	{/if}
	<label
		class="body"
		onpointerdown={onDragStart}
		onpointermove={onDragDelta}
		onpointerup={onDragCompleted}
		onlostpointercapture={onDragCompleted}
		onclickcapture={onLabelClick}
	>
		<input
			bind:this={ref}
			type="checkbox"
			role="switch"
			class="input"
			{checked}
			{disabled}
			{name}
			{value}
			{form}
			onclick={toggle}
		/>
		<span class="area"></span>
		<span class="track">
			<span class="off-track"></span>
			<span class="on-track"></span>
			<span
				bind:this={knobRef}
				class="knob"
				style:transform={dragging
					? `translateX(${Math.min(Math.max(knobTranslation, 0), KNOB_RANGE)}px)`
					: undefined}
			>
				<span class="knob-off"></span>
				<span class="knob-on"></span>
			</span>
		</span>
		<!-- Both are rendered, stacked, and one is faded out — upstream's `OffContentPresenter`
		     and `OnContentPresenter` are both `Grid.Column="2"` with `Opacity="0"`, and
		     `ContentStates` raises one of them. Swapping with an `{#if}` instead would size the
		     column to whichever string is showing and reflow the row on every toggle, which the
		     Gallery's own sample would show: "Do work" off, "Working" on. -->
		<span class="content">
			<span class="off-content">
				{#if typeof offContent === 'string'}{offContent}{:else}{@render offContent()}{/if}
			</span>
			<span class="on-content">
				{#if typeof onContent === 'string'}{onContent}{:else}{@render onContent()}{/if}
			</span>
		</span>
	</label>
</div>

<style>
	.root {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		/* `MinWidth` is `ToggleSwitchThemeMinWidth`; the body row is `HorizontalAlignment="Left"`
		   inside it, which is why the root is a column and the body is not stretched. */
		min-width: var(--winui-ToggleSwitchThemeMinWidth);
		user-select: none;
	}

	/* Row 0. `IsHitTestVisible="False"` and outside the switch area, so clicking it does not
	   toggle — which is why it is a sibling of the `<label>` rather than inside it. */
	.header {
		margin: var(--winui-ToggleSwitchTopHeaderMargin);
		color: var(--winui-ToggleSwitchHeaderForeground);
		white-space: normal;
	}

	/* Row 1: the track, a 12-wide gap, and the content, with the 10-tall gutters above and
	   below as padding. `width: max-content` stands in for `HorizontalAlignment="Left"` —
	   without it the row stretches to the root's `min-width` and the container background with
	   it. */
	.body {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		width: max-content;
		padding: var(--winui-ToggleSwitchPreContentMargin) 0 var(--winui-ToggleSwitchPostContentMargin)
			0;
		cursor: pointer;
		/* `ManipulationMode="System,TranslateX"` (`ToggleSwitch_themeresources.xaml:197`): a
		   horizontal touch drag is the switch's, a vertical one still pans what scrolls, and a pinch
		   still zooms. */
		touch-action: pan-y pinch-zoom;
	}

	/* The real control, kept focusable and kept out of the layout, exactly as CheckBox does. */
	.input {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: 0;
		padding: 0;
		border: 0;
		opacity: 0;
		pointer-events: none;
	}

	/* The focus visual; see Button.svelte for the shape. */
	.root:has(input:focus-visible)::before {
		content: '';
		position: absolute;
		/* c1-allow: ToggleSwitch_themeresources.xaml:200, `FocusVisualMargin="-7,-3,-7,-3"` —
		   XAML writes left,top,right,bottom and CSS `inset` writes top,right,bottom,left,
		   which is why the pair is reversed here */
		inset: -3px -7px;
		/* c1-allow: the same 3px vertical offset Button, CheckBox and RadioButton carry,
		   so the band stays concentric with the control's own corner */
		border-radius: calc(var(--winui-ControlCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* `SwitchAreaGrid` — spans the whole row and both gutters, inset 5 top and bottom by its
	   own `Margin="0,5"`, and carries the pointer-state container background. */
	.area {
		position: absolute;
		inset: 5px 0;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-ToggleSwitchContainerBackground);
	}

	.track {
		position: relative;
		flex: none;
		width: 40px;
		height: 20px;
	}

	/* Two `<Rectangle>`s upstream, one per track and not one restyled: `OuterBorder` carries
	   `ToggleSwitchFillOff` and `ToggleSwitchStrokeOff` (ToggleSwitch_themeresources.xaml:507)
	   and `SwitchKnobBounds` carries the `…On` pair (:508). Being Shapes, their stroke lands
	   where these borders land and the fill under it stops at the stroke's centreline rather
	   than at either box edge: WD-096. */
	.off-track,
	.on-track {
		position: absolute;
		inset: 0;
		box-sizing: border-box;
		/* c1-allow: `RadiusX="10" RadiusY="10"` on a 20-tall rectangle is a pill, and there
		   is no corner-radius resource for it — the two track rectangles carry the literal. */
		border-radius: 10px;
		border-style: solid;
	}

	.off-track {
		border-width: var(--winui-ToggleSwitchOuterBorderStrokeThickness);
		background: var(--winui-ToggleSwitchFillOff);
		border-color: var(--winui-ToggleSwitchStrokeOff);
	}

	/* `ToggleSwitchOnStrokeThickness` is 0 in Light and Dark and 1 under HighContrast: the on
	   track is a solid accent fill that needs no edge until the palette is two colours. */
	.on-track {
		border-width: var(--winui-ToggleSwitchOnStrokeThickness);
		background: var(--winui-ToggleSwitchFillOn);
		border-color: var(--winui-ToggleSwitchStrokeOn);
		opacity: 0;
	}

	/* The knob's 20x20 container. `HorizontalAlignment="Left"` with a `TranslateTransform` the
	   `On` state drives to X=20, and which a drag moves too.

	   Upstream moves it with a `RepositionThemeAnimation`, a framework theme animation with no
	   duration in any resource this repository reads, so the transform takes the same
	   `ControlFasterAnimationDuration` the surrounding opacity keyframes are written with rather
	   than a number invented for it. */
	.knob {
		position: absolute;
		left: 0;
		top: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform var(--winui-ControlFasterAnimationDuration)
			var(--winui-ControlFastOutSlowInKeySpline);
	}

	.knob-off,
	.knob-on {
		position: absolute;
		box-sizing: border-box;
		/* c1-allow: `CornerRadius="7"` on a 12x12 border, which exceeds half the box and clamps
		   to a circle; there is no corner-radius resource for the knob. */
		border-radius: 50%;
		width: 12px;
		height: 12px;
		transition:
			width var(--winui-ControlFasterAnimationDuration) var(--winui-ControlFastOutSlowInKeySpline),
			height var(--winui-ControlFasterAnimationDuration) var(--winui-ControlFastOutSlowInKeySpline);
	}

	.knob-off {
		background: var(--winui-ToggleSwitchKnobFillOff);
	}

	/* Only the on knob draws a stroke, and `ToggleSwitchKnobStrokeOn` is a gradient in the token
	   layer. A gradient named as a `border-color` is invalid CSS and silently dropped, which is
	   why Button, TextBox and RadioButton carry a transparent border under a two-layer
	   background instead. The same form here: the fill clipped to the padding box, the gradient
	   to the border box, and the fill written as a two-stop gradient of one colour because a
	   background layer takes an image, not a colour. */
	.knob-on {
		border-style: solid;
		border-width: var(--winui-ToggleSwitchOuterBorderStrokeThickness);
		border-color: transparent;
		background:
			linear-gradient(var(--winui-ToggleSwitchKnobFillOn), var(--winui-ToggleSwitchKnobFillOn))
				padding-box,
			var(--winui-ToggleSwitchKnobStrokeOn) border-box;
		opacity: 0;
	}

	/* One grid cell holding both presenters, so the column is as wide as the wider of the two
	   and stays that width across a toggle. */
	.content {
		display: grid;
		color: var(--winui-ToggleSwitchContentForeground);
		white-space: normal;
	}

	.off-content,
	.on-content {
		grid-area: 1 / 1;
	}

	.on-content {
		opacity: 0;
	}

	/* The toggle axis */
	.root[data-checked] .off-track,
	.root[data-checked] .knob-off {
		opacity: 0;
	}

	.root[data-checked] .off-content {
		opacity: 0;
	}

	.root[data-checked] .on-track,
	.root[data-checked] .knob-on,
	.root[data-checked] .on-content {
		opacity: 1;
	}

	.root[data-checked] .knob {
		transform: translateX(20px);
	}

	/* While dragged the knob follows the pointer with no easing, and on release the transition
	   carries it from wherever it was to its end — `DraggingToOnTransition` and
	   `DraggingToOffTransition` reposition it from the current offset (`:374`, `:404`). */
	.root[data-dragging] .knob {
		transition: none;
	}

	/* ----- PointerOver ----- */
	.root:hover .area {
		background: var(--winui-ToggleSwitchContainerBackgroundPointerOver);
	}
	.root:hover .off-track {
		background: var(--winui-ToggleSwitchFillOffPointerOver);
		border-color: var(--winui-ToggleSwitchStrokeOffPointerOver);
	}
	.root:hover .on-track {
		background: var(--winui-ToggleSwitchFillOnPointerOver);
		border-color: var(--winui-ToggleSwitchStrokeOnPointerOver);
	}
	.root:hover .knob-off {
		background: var(--winui-ToggleSwitchKnobFillOffPointerOver);
	}
	.root:hover .knob-on {
		background:
			linear-gradient(
					var(--winui-ToggleSwitchKnobFillOnPointerOver),
					var(--winui-ToggleSwitchKnobFillOnPointerOver)
				)
				padding-box,
			var(--winui-ToggleSwitchKnobStrokeOn) border-box;
	}

	/* ----- Pressed ----- */
	/* Pressed is upstream's while it drags (`ToggleSwitch_Partial.cpp:65-67`), whatever is under
	   the pointer, and `:active` alone is not: a touch that leaves the browser's tap slop drops
	   it mid-drag. */
	.root:active .area,
	.root[data-dragging] .area {
		background: var(--winui-ToggleSwitchContainerBackgroundPressed);
	}
	.root:active .off-track,
	.root[data-dragging] .off-track {
		background: var(--winui-ToggleSwitchFillOffPressed);
		border-color: var(--winui-ToggleSwitchStrokeOffPressed);
	}
	.root:active .on-track,
	.root[data-dragging] .on-track {
		background: var(--winui-ToggleSwitchFillOnPressed);
		border-color: var(--winui-ToggleSwitchStrokeOnPressed);
	}
	.root:active .knob-off,
	.root[data-dragging] .knob-off {
		background: var(--winui-ToggleSwitchKnobFillOffPressed);
	}
	.root:active .knob-on,
	.root[data-dragging] .knob-on {
		background:
			linear-gradient(
					var(--winui-ToggleSwitchKnobFillOnPressed),
					var(--winui-ToggleSwitchKnobFillOnPressed)
				)
				padding-box,
			var(--winui-ToggleSwitchKnobStrokeOn) border-box;
	}

	/* 12x12 at rest, 14x14 under the pointer, 17 wide by 14 tall while pressed — the squish is
	   the press affordance and it is not conditioned on the toggle state. All three are literals
	   in the template with no resource behind them. */
	.root:hover .knob-off,
	.root:hover .knob-on {
		width: 14px;
		height: 14px;
	}

	.root:active .knob-off,
	.root:active .knob-on,
	.root[data-dragging] .knob-off,
	.root[data-dragging] .knob-on {
		width: 17px;
		height: 14px;
	}

	/* Written last so it wins over `:hover` and `:active`: a disabled switch must not light up
	   under the pointer. `data-disabled` is on the root rather than `:disabled` because
	   `:disabled` matches the form control inside, and the root here is the outer `<div>`. */
	.root[data-disabled] .area {
		background: var(--winui-ToggleSwitchContainerBackgroundDisabled);
	}
	.root[data-disabled] .off-track {
		background: var(--winui-ToggleSwitchFillOffDisabled);
		border-color: var(--winui-ToggleSwitchStrokeOffDisabled);
	}
	.root[data-disabled] .on-track {
		background: var(--winui-ToggleSwitchFillOnDisabled);
		border-color: var(--winui-ToggleSwitchStrokeOnDisabled);
	}
	.root[data-disabled] .knob-off {
		background: var(--winui-ToggleSwitchKnobFillOffDisabled);
	}
	.root[data-disabled] .knob-on {
		background:
			linear-gradient(
					var(--winui-ToggleSwitchKnobFillOnDisabled),
					var(--winui-ToggleSwitchKnobFillOnDisabled)
				)
				padding-box,
			var(--winui-ToggleSwitchKnobStrokeOn) border-box;
	}
	.root[data-disabled] .content {
		color: var(--winui-ToggleSwitchContentForegroundDisabled);
	}
	.root[data-disabled] .header {
		color: var(--winui-ToggleSwitchHeaderForegroundDisabled);
	}

	/* Size and cursor, not only colour: `:hover` and `:active` still match a disabled control,
	   so a disabled switch would otherwise grow its knob under the pointer. Upstream's `Disabled`
	   state animates both knobs back to 12x12 — written as a literal rather than reaching for a
	   size resource that does not exist. */
	.root[data-disabled] .body {
		cursor: default;
	}
	.root[data-disabled] .knob-off,
	.root[data-disabled] .knob-on {
		width: 12px;
		height: 12px;
	}

	/* ADR 0016. The knob's slide is a `RepositionThemeAnimation` inside the `OffToOn` and
	   `OnToOff` transitions (ToggleSwitch_themeresources.xaml:418, :423), and the visual state
	   manager skips a transition to its end when the system's animations are off. The knob's
	   size keyframes are the pointer states' own storyboards and keep running. */
	@media (prefers-reduced-motion: reduce) {
		.knob {
			transition-duration: 0s;
		}
	}
</style>
