<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface CheckBoxProps {
		/**
		 * IsChecked, under HTML's name for it — ADR 0009. WinUI's `IsChecked` is a `bool?`
		 * whose null is the indeterminate state; HTML splits the two, and `checked` here is
		 * the boolean half. A checked box is never also indeterminate.
		 */
		checked?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change
		 *  callback. Upstream signals this as the `Checked` and `Unchecked` events. */
		onCheckedChange?: (checked: boolean) => void;
		/**
		 * IsChecked's null, under HTML's name for it — `input.indeterminate`. Setting it
		 * makes the box show the dash regardless of `checked`.
		 */
		indeterminate?: boolean;
		/** No WinUI member: the change callback ADR 0009 pairs with `indeterminate`.
		 *  Upstream signals this as the `Indeterminate` event. */
		onIndeterminateChange?: (indeterminate: boolean) => void;
		/** IsThreeState. True makes a click cycle through the indeterminate state. */
		threeState?: boolean;
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean;
		// Four HTML form attributes with no WinUI member follow, and a plain comment says so
		// rather than a `/** */` one: a doc comment here would attach itself to `name` below.
		//
		// The rest props land on the root element, which for this control is the `<label>`
		// wrapper rather than the `<input>` — so `name`, `value`, `required` and `form` would
		// never reach the control they belong to. They are declared instead, which is why
		// ADR 0009 keeps the HTML attribute vocabulary as a closed reserved set.
		/** No WinUI member: the form field name. */
		name?: string;
		/** No WinUI member: the value submitted when the box is checked. */
		value?: string;
		/** No WinUI member: HTML form validation. */
		required?: boolean;
		/** No WinUI member: the id of the form to associate with. */
		form?: string;
		/** Content — the label beside the box, as the default snippet. */
		children?: Snippet;
		class?: string;
		style?: string;
		/**
		 * The `<input type="checkbox">`, not the `<label>` root — ADR 0009's `ref` points at
		 * the interactive element, which for Button happens to be the root and here does not.
		 */
		ref?: HTMLInputElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		checked = $bindable(false),
		onCheckedChange,
		indeterminate = $bindable(false),
		onIndeterminateChange,
		threeState = false,
		disabled = false,
		required = false,
		name,
		value,
		form,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: CheckBoxProps = $props();

	const state = $derived(indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked');

	$effect(() => {
		if (ref) ref.indeterminate = indeterminate;
	});

	function set(nextChecked: boolean, nextIndeterminate: boolean) {
		if (checked !== nextChecked) {
			checked = nextChecked;
			onCheckedChange?.(nextChecked);
		}
		if (indeterminate !== nextIndeterminate) {
			indeterminate = nextIndeterminate;
			onIndeterminateChange?.(nextIndeterminate);
		}
	}

	function toggle(event: MouseEvent & { currentTarget: HTMLInputElement }) {
		// Nothing changes, so the click is canceled and its flip put back.
		if (disabled) {
			event.preventDefault();
			return;
		}
		// The click's legacy-pre-activation steps have already flipped `input.checked` and
		// cleared `indeterminate` by the time this runs, so the cycle reads the props, not the
		// element. Space reaches here too: a checkbox's keyboard activation dispatches a click.
		if (indeterminate) set(false, false);
		else if (checked) set(false, threeState);
		else set(true, false);
		// The click is left uncanceled. Svelte applies the props to the element in a microtask,
		// and a microtask checkpoint follows each listener of a click the user made, so that
		// runs before dispatch ends; canceling the click would then run the canceled-activation
		// steps after it and restore the element to its state before the click, and the props
		// and the accessibility tree would disagree from then on. A click dispatched from script
		// — `element.click()`, `dispatchEvent` — defers the checkpoint past dispatch, which is
		// why, while the click was canceled, only such a click left the two agreeing after a
		// change. Left uncanceled, it fires the input's `input` and `change` on every click an
		// enabled box takes, as a native checkbox does, even when a parent puts the state back.
		//
		// So the browser's flip stands, and `checked` is written here, inside the listener, where
		// the activation keeps it — from the props as they stand after the callbacks, not from the
		// step the cycle took. Svelte writes `checked` only when it differs from what it last
		// wrote, and two cases leave it nothing to write while the flip is wrong: leaving an
		// indeterminate box whose `checked` is false, which the flip checks, and a parent that puts
		// the props back from `onCheckedChange` or `onIndeterminateChange`. `indeterminate` needs
		// no write here: the `$effect` above re-runs on any change to the prop, a bound parent's
		// that puts it back included.
		event.currentTarget.checked = checked;
	}
</script>

<label
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	data-state={state}
	data-disabled={disabled || undefined}
	{...rest}
>
	<input
		bind:this={ref}
		type="checkbox"
		class="input"
		{checked}
		{disabled}
		{name}
		{value}
		{required}
		{form}
		onclick={toggle}
	/>
	<span class="box"></span>
	<span class="content">{@render children?.()}</span>
</label>

<style>
	.root {
		position: relative;
		display: inline-flex;
		align-items: center;
		min-width: var(--winui-CheckBoxMinWidth);
		min-height: var(--winui-CheckBoxHeight);
		border-style: solid;
		/* Upstream's root Grid takes `{TemplateBinding BorderThickness}` and the CheckBox
		   style sets no `BorderThickness`, so it paints at `Control.BorderThickness`'s
		   default of zero. The colour is still wired, because the brush is a real template
		   binding and a consumer reaching it through the token cascade should find it
		   connected rather than dropped. */
		border-width: 0;
		border-radius: var(--winui-ControlCornerRadius);
		cursor: pointer;
		user-select: none;
	}

	/* The real control, kept focusable and kept out of the layout. `display: none` and
	   `visibility: hidden` would both take it out of the tab order; opacity does not.
	   `pointer-events: none` is safe because a click on the `<label>` is forwarded to the
	   input by label activation rather than by hit-testing. */
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
		inset: var(--winui-CheckBoxFocusVisualMargin);
		/* c1-allow: the same 3px vertical offset Button, RadioButton and ToggleSwitch carry,
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

	/* Upstream draws this as a `Rectangle` — `NormalRectangle`, carrying `Fill` and `Stroke`
	   rather than a Background and a BorderBrush (`CheckBox_themeresources.xaml:603`). So the
	   `BackgroundSizing` question the border-carrying elements in this library answer does not
	   arise here at all. Six types declare that property — Border, ContentPresenter, Control,
	   Grid, RelativePanel and StackPanel, five of which read it back through an override of
	   their own (`Border.cpp:952`, `ContentPresenter.cpp:1316`, `Grid.cpp:1692`,
	   `RelativePanel.cpp:161`, `StackPanel.cpp:945`) — and Rectangle is not among them.
	   `CRectangle` is a `CShape` is a `CFrameworkElement` (`rectangle.h:20`, `shape.h:19`), and
	   the base class does supply a getter (`framework.cpp:2711`), but it is a fallback no Shape
	   reaches. It has three call sites and every one of them is guarded the same way: one is
	   inside `CBorder` itself on a `this` that is already a Border (`Border.cpp:553`), and the
	   other two sit in functions that open by asserting their element is a Panel, a Border or a
	   ContentPresenter — `framework.cpp:3843` under the assert at `framework.cpp:3827`, and
	   `Border.cpp:668` under the one at `Border.cpp:655`.

	   What a Shape does instead is shrink its geometry by the stroke.
	   `CShape::GetOutlineRect` (`shape.cpp:841`) returns the rect
	   `(t/2, t/2, w - t, h - t)` — its own comment at `shape.cpp:861` gives the reason, that
	   the stroked shape should fit within width and height — and
	   `CRectangle::UpdateRenderGeometry` hands that straight to the render geometry
	   (`rectangle.cpp:235`). `CRectangle`'s constructor sets `Stretch` to `Fill`
	   (`rectangle.h:30`), whose branch of `UpdateRectangleBoundsForStretchMode` is a no-op
	   (`shape.cpp:903`), so nothing moves it afterwards.

	   At 20x20 with `StrokeThickness` 1 (`CheckBox_themeresources.xaml:269`) that geometry is
	   `(0.5, 0.5, 19, 19)`, and a centred stroke on it spans 0 to 1. **The stroke therefore
	   lands exactly where a CSS border lands, fully inside the box**, which is why nothing here
	   is a stroke-placement divergence and the whole of the difference is in the fill.
	   Upstream's fill stops at the stroke's centreline,
	   0.5, where `background-clip: border-box` runs it out to 0 and `padding-box` would stop
	   it at 1. The two CSS options are wrong by the same half pixel in opposite directions, so
	   the default stands — and it stands because nothing else works, not because the
	   difference is small. WD-096 carries the measurement, and it is a divergence rather than
	   an approximation: a capture of the original reads this ring at 130 on a hovered box,
	   where an unclipped fill computes 127 and a clipped one 134, so the half is on the screen
	   and what ships is the 127. Seven constructions aimed at that half all rasterise onto one
	   whole pixel or the other at this lane's `devicePixelRatio` of one. The distance from the
	   original is half the distance between the two CSS values, which puts it inside the gate's
	   two levels at rest and as far as twenty outside them on the pressed accent states. */
	.box {
		position: relative;
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		width: var(--winui-CheckBoxSize);
		height: var(--winui-CheckBoxSize);
		border-style: solid;
		border-width: var(--winui-CheckBoxBorderThickness);
		border-radius: var(--winui-ControlCornerRadius);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-CheckBoxGlyphSize);
	}

	/* WD-006: the glyph is the static one WinUI falls back to, with no transition between
	   pointer states; see docs/divergences.md. An unchecked box generates no pseudo-element at
	   all, because upstream's four unchecked visual states drive `AnimatedIcon.State` to an
	   `…Off` value and the original draws nothing there.

	   These two rules carry only `content`. The glyph's colour is one of the six brushes a
	   combined state paints, so it lives in the state matrix below with the other five,
	   next to the fill and stroke it has to be legible against.

	   `Margin="0,1,0,-1"` on the CheckGlyph, which the indeterminate states reset to 0. */
	.root[data-state='checked'] .box::after {
		content: var(--winui-CheckBoxCheckedGlyph) / '';
		margin: 1px 0 -1px 0;
	}

	.root[data-state='indeterminate'] .box::after {
		content: var(--winui-CheckBoxIndeterminateGlyph) / '';
	}

	/* `VerticalContentAlignment="Top"` on the ContentPresenter, with `Margin` bound to the
	   control's `Padding`; `TextWrapping="Wrap"`. */
	.content {
		align-self: flex-start;
		margin: var(--winui-CheckBoxPadding);
		white-space: normal;
	}

	/* `transparent` rather than a token: the four `CheckBoxCheckGlyphForegroundUnchecked*`
	   brushes upstream defines exist for the down-level path, where `AnimatedIcon` shows its
	   fallback glyph and hides it by matching the fill. That trick fails under high contrast,
	   so this control follows the animated original — no glyph at all when unchecked — and
	   the four brushes are not emitted. */
	.root[data-state='unchecked'] {
		background: var(--winui-CheckBoxBackgroundUnchecked);
		border-color: var(--winui-CheckBoxBorderBrushUnchecked);
		color: var(--winui-CheckBoxForegroundUnchecked);
	}
	.root[data-state='unchecked'] .box {
		background: var(--winui-CheckBoxCheckBackgroundFillUnchecked);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeUnchecked);
	}

	.root[data-state='unchecked']:hover {
		background: var(--winui-CheckBoxBackgroundUncheckedPointerOver);
		border-color: var(--winui-CheckBoxBorderBrushUncheckedPointerOver);
		color: var(--winui-CheckBoxForegroundUncheckedPointerOver);
	}
	.root[data-state='unchecked']:hover .box {
		background: var(--winui-CheckBoxCheckBackgroundFillUncheckedPointerOver);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeUncheckedPointerOver);
	}

	.root[data-state='unchecked']:active {
		background: var(--winui-CheckBoxBackgroundUncheckedPressed);
		border-color: var(--winui-CheckBoxBorderBrushUncheckedPressed);
		color: var(--winui-CheckBoxForegroundUncheckedPressed);
	}
	.root[data-state='unchecked']:active .box {
		background: var(--winui-CheckBoxCheckBackgroundFillUncheckedPressed);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeUncheckedPressed);
	}

	.root[data-state='checked'] {
		background: var(--winui-CheckBoxBackgroundChecked);
		border-color: var(--winui-CheckBoxBorderBrushChecked);
		color: var(--winui-CheckBoxForegroundChecked);
	}
	.root[data-state='checked'] .box {
		background: var(--winui-CheckBoxCheckBackgroundFillChecked);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeChecked);
	}
	.root[data-state='checked'] .box::after {
		color: var(--winui-CheckBoxCheckGlyphForegroundChecked);
	}

	.root[data-state='checked']:hover {
		background: var(--winui-CheckBoxBackgroundCheckedPointerOver);
		border-color: var(--winui-CheckBoxBorderBrushCheckedPointerOver);
		color: var(--winui-CheckBoxForegroundCheckedPointerOver);
	}
	.root[data-state='checked']:hover .box {
		background: var(--winui-CheckBoxCheckBackgroundFillCheckedPointerOver);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeCheckedPointerOver);
	}
	.root[data-state='checked']:hover .box::after {
		color: var(--winui-CheckBoxCheckGlyphForegroundCheckedPointerOver);
	}

	.root[data-state='checked']:active {
		background: var(--winui-CheckBoxBackgroundCheckedPressed);
		border-color: var(--winui-CheckBoxBorderBrushCheckedPressed);
		color: var(--winui-CheckBoxForegroundCheckedPressed);
	}
	.root[data-state='checked']:active .box {
		background: var(--winui-CheckBoxCheckBackgroundFillCheckedPressed);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeCheckedPressed);
	}
	.root[data-state='checked']:active .box::after {
		color: var(--winui-CheckBoxCheckGlyphForegroundCheckedPressed);
	}

	.root[data-state='indeterminate'] {
		background: var(--winui-CheckBoxBackgroundIndeterminate);
		border-color: var(--winui-CheckBoxBorderBrushIndeterminate);
		color: var(--winui-CheckBoxForegroundIndeterminate);
	}
	.root[data-state='indeterminate'] .box {
		background: var(--winui-CheckBoxCheckBackgroundFillIndeterminate);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeIndeterminate);
	}
	.root[data-state='indeterminate'] .box::after {
		color: var(--winui-CheckBoxCheckGlyphForegroundIndeterminate);
	}

	.root[data-state='indeterminate']:hover {
		background: var(--winui-CheckBoxBackgroundIndeterminatePointerOver);
		border-color: var(--winui-CheckBoxBorderBrushIndeterminatePointerOver);
		color: var(--winui-CheckBoxForegroundIndeterminatePointerOver);
	}
	.root[data-state='indeterminate']:hover .box {
		background: var(--winui-CheckBoxCheckBackgroundFillIndeterminatePointerOver);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeIndeterminatePointerOver);
	}
	.root[data-state='indeterminate']:hover .box::after {
		color: var(--winui-CheckBoxCheckGlyphForegroundIndeterminatePointerOver);
	}

	.root[data-state='indeterminate']:active {
		background: var(--winui-CheckBoxBackgroundIndeterminatePressed);
		border-color: var(--winui-CheckBoxBorderBrushIndeterminatePressed);
		color: var(--winui-CheckBoxForegroundIndeterminatePressed);
	}
	.root[data-state='indeterminate']:active .box {
		background: var(--winui-CheckBoxCheckBackgroundFillIndeterminatePressed);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeIndeterminatePressed);
	}
	.root[data-state='indeterminate']:active .box::after {
		color: var(--winui-CheckBoxCheckGlyphForegroundIndeterminatePressed);
	}

	/* Written last so they win over `:hover` and `:active`: a disabled box must not light up
	   under the pointer. `data-disabled` is on the root rather than `:disabled` because
	   `:disabled` matches a form control and the root is a `<label>`. */
	.root[data-disabled][data-state='unchecked'] {
		background: var(--winui-CheckBoxBackgroundUncheckedDisabled);
		border-color: var(--winui-CheckBoxBorderBrushUncheckedDisabled);
		color: var(--winui-CheckBoxForegroundUncheckedDisabled);
	}
	.root[data-disabled][data-state='unchecked'] .box {
		background: var(--winui-CheckBoxCheckBackgroundFillUncheckedDisabled);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeUncheckedDisabled);
	}

	.root[data-disabled][data-state='checked'] {
		background: var(--winui-CheckBoxBackgroundCheckedDisabled);
		border-color: var(--winui-CheckBoxBorderBrushCheckedDisabled);
		color: var(--winui-CheckBoxForegroundCheckedDisabled);
	}
	.root[data-disabled][data-state='checked'] .box {
		background: var(--winui-CheckBoxCheckBackgroundFillCheckedDisabled);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeCheckedDisabled);
	}
	.root[data-disabled][data-state='checked'] .box::after {
		color: var(--winui-CheckBoxCheckGlyphForegroundCheckedDisabled);
	}

	.root[data-disabled][data-state='indeterminate'] {
		background: var(--winui-CheckBoxBackgroundIndeterminateDisabled);
		border-color: var(--winui-CheckBoxBorderBrushIndeterminateDisabled);
		color: var(--winui-CheckBoxForegroundIndeterminateDisabled);
	}
	.root[data-disabled][data-state='indeterminate'] .box {
		background: var(--winui-CheckBoxCheckBackgroundFillIndeterminateDisabled);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeIndeterminateDisabled);
	}
	.root[data-disabled][data-state='indeterminate'] .box::after {
		color: var(--winui-CheckBoxCheckGlyphForegroundIndeterminateDisabled);
	}

	.root[data-disabled] {
		cursor: default;
	}
</style>
