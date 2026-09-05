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

	function toggle(event: MouseEvent) {
		if (disabled) return;
		// The browser has already flipped `input.checked` by the time this runs; preventing
		// the default runs the canceled-activation steps, which put it back. The component
		// owns the state, so it applies its own cycle to the props and lets the `checked`
		// attribute below re-assert the result. Space and Enter reach here too — a checkbox's
		// keyboard activation dispatches a click.
		//
		// Measured rather than recalled, because a review disputed it: inside this handler an
		// unchecked box reads `checked === true` and a checked one reads `false`, and after
		// `preventDefault()` both hold their original value. `indeterminate` behaves the same
		// way — the pre-click steps clear it and cancellation restores it — which is what lets
		// the indeterminate branch below run without the DOM having moved underneath it.
		event.preventDefault();
		if (indeterminate) set(false, false);
		else if (checked) set(false, threeState);
		else set(true, false);
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
		/* WD-008: no system focus visual is drawn here, and a keyboard-focused CheckBox is
		   not distinguished from an unfocused one; see docs/divergences.md.

		   `line-height: normal` overrides the type ramp class on the same element, and does
		   so deliberately. `winui-BodyTextBlockStyle` stands in for `ContentControlThemeFontFamily`
		   and `ControlContentThemeFontSize`, which `controls/dev` defines nowhere — the
		   substitution `Button.svelte` records. It is a stand-in for the family and the size
		   only: upstream's ContentPresenter carries no TextBlock style, so its line spacing is
		   the font's own. That distinction is invisible on Button, whose label is one centred
		   line, and visible here, where `TextWrapping="Wrap"` means the content really does
		   take a second line. */
		line-height: normal;
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

	/* Upstream draws this as a `Rectangle` with a centred 1px stroke inside a 20x20 Grid, so
	   its painted edge sits a half pixel outside the box on every side. A CSS border is drawn
	   inside the border box instead. The half pixel is not reproduced; `UseLayoutRounding="False"`
	   upstream means the original renders it antialiased either way. */
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
		content: var(--winui-CheckBoxCheckedGlyph);
		margin: 1px 0 -1px 0;
	}

	.root[data-state='indeterminate'] .box::after {
		content: var(--winui-CheckBoxIndeterminateGlyph);
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
