<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface RadioButtonProps {
		/** IsChecked, under HTML's name for it — ADR 0009. */
		checked?: boolean | null;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change
		 *  callback. Upstream signals this as the `Checked` and `Unchecked` events. */
		onCheckedChange?: (checked: boolean) => void;
		/**
		 * No WinUI member: the selected `value` of the group this radio belongs to, so a
		 * consumer can bind one variable to the whole group instead of one `checked` each.
		 * WinUI's equivalent lives on the separate `RadioButtons` container, which is not
		 * this control. Binding it makes `checked` derived rather than owned.
		 */
		group?: string;
		/** No WinUI member: the change callback ADR 0009 pairs with `group`. */
		onGroupChange?: (group: string) => void;
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean | null;
		// Four HTML form attributes with no WinUI member follow, and a plain comment says so
		// rather than a `/** */` one: a doc comment here would attach itself to `name` below.
		//
		// The rest props land on the root element, which for this control is the `<label>`
		// wrapper rather than the `<input>`, so these would never reach the control they
		// belong to. `name` carries more weight here than on CheckBox: it is what makes two
		// radios one group in the browser, and without it a group is a set of independent
		// radios that all look selected.
		/** No WinUI member: the form field name, and the browser's own grouping key. */
		name?: string | null;
		/** No WinUI member: the value submitted when this radio is the selected one. */
		value?: string;
		/** No WinUI member: HTML form validation. */
		required?: boolean | null;
		/** No WinUI member: the id of the form to associate with. */
		form?: string | null;
		/** Content — the label beside the ring, as the default snippet. */
		children?: Snippet;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/**
		 * The `<input type="radio">`, not the `<label>` root — ADR 0009's `ref` points at the
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
		group = $bindable(undefined),
		onGroupChange,
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
	}: RadioButtonProps = $props();

	// `group` and `checked` are two views of one state, and the component must not let
	// them disagree. `group` wins when it is bound, because a group has one selected value
	// and any number of radios.
	const selected = $derived(group === undefined ? checked : group === value);

	// A radio never unselects itself: clicking a selected radio does nothing, which is
	// both the HTML behaviour and WinUI's. The `onCheckedChange?.(false)` for the radio
	// that loses the selection is not raised here either — this control does not know
	// about its siblings, and the group's own binding is what tells a consumer the
	// selection moved.
	function choose() {
		if (disabled || selected) return;
		if (group !== undefined) {
			if (value === undefined) return;
			group = value;
			onGroupChange?.(value);
		}
		if (!checked) {
			checked = true;
			onCheckedChange?.(true);
		}
	}

	// The browser has already checked this input, and unchecked the one checked before it in
	// its radio button group, by the time this runs. When the state `selected` derives from
	// ends where it began — the radio was already selected, has no `value` to put in `group`,
	// or a parent puts the state back from its callback — Svelte has nothing new to write, so
	// the click is canceled and the browser puts both inputs back itself. A canceled click
	// fires neither `input` nor `change`.
	//
	// Otherwise the click stands, and canceling would be wrong: Svelte applies the change in a
	// microtask, a microtask checkpoint follows each listener of a click the user made, and the
	// canceled-activation steps would then restore the old selection over it. Svelte writes
	// only the inputs whose `selected` changed, though, and the clicked one's need not have: a
	// parent that clears `group` leaves it unselected before and after. So the handler writes
	// it here, inside the listener, where the activation keeps it.
	function onclick(event: MouseEvent & { currentTarget: HTMLInputElement }) {
		const state = () => (group === undefined ? (checked ?? false) : group);
		const before = state();
		choose();
		if (state() === before) event.preventDefault();
		else event.currentTarget.checked = selected ?? false;
	}
</script>

<label
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	data-checked={selected || undefined}
	data-disabled={disabled || undefined}
	{...rest}
>
	<input
		bind:this={ref}
		type="radio"
		class="input"
		checked={selected}
		{disabled}
		{name}
		{value}
		{required}
		{form}
		{onclick}
	/>
	<span class="ring">
		<span class="outer"></span>
		<span class="checked-ring"></span>
		<span class="dot"></span>
		<span class="press-dot"></span>
	</span>
	<span class="content">{@render children?.()}</span>
</label>

<style>
	.root {
		position: relative;
		display: inline-flex;
		/* The ring column is `VerticalAlignment="Top"`, RadioButton_themeresources.xaml:370. */
		align-items: flex-start;
		/* `MinWidth` is the literal 120, RadioButton_themeresources.xaml:194. */
		min-width: 120px;
		border-style: solid;
		/* Upstream's root Grid takes `{TemplateBinding BorderThickness}` and the style sets
		   none, so it paints at `Control.BorderThickness`'s default of zero. The colour is
		   still wired: the brush is a real template binding, and a consumer reaching it
		   through the token cascade should find it connected rather than dropped. */
		border-width: 0;
		border-radius: var(--winui-ControlCornerRadius);
		cursor: pointer;
		user-select: none;
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
		/* c1-allow: RadioButton_themeresources.xaml:196, `FocusVisualMargin="-7,-3,-7,-3"` —
		   XAML writes left,top,right,bottom and CSS `inset` writes top,right,bottom,left,
		   which is why the pair is reversed here */
		inset: -3px -7px;
		/* c1-allow: the same 3px vertical offset Button, CheckBox and ToggleSwitch carry,
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

	/* The 20-wide column, 32 tall, with the four stacked elements centred in it. */
	.ring {
		position: relative;
		flex: none;
		display: flex;
		align-items: center;
		justify-content: center;
		/* `<ColumnDefinition Width="20" />`, RadioButton_themeresources.xaml:367. */
		width: 20px;
		/* `<Grid VerticalAlignment="Top" Height="32">`, RadioButton_themeresources.xaml:370. */
		height: 32px;
	}

	.outer,
	.checked-ring,
	.dot,
	.press-dot {
		position: absolute;
		box-sizing: border-box;
		/* c1-allow: upstream draws these as `<Ellipse>`, a shape rather than a rounded
		   rectangle, so there is no corner-radius resource to read — 50% is what "ellipse"
		   means in CSS. `PressedCheckGlyph` is the one exception and agrees: a
		   `<Border CornerRadius="6">` at 4x4, RadioButton_themeresources.xaml:376, where 6
		   exceeds half the box and clamps to the same circle. */
		border-radius: 50%;
	}

	/* `<Ellipse Width="20" Height="20" …>`, RadioButton_themeresources.xaml:371 and :373. Both
	   carry a `Fill` and a `Stroke` rather than a background and a border, which is WD-096: the
	   stroke lands where this border lands and the fill stops half a pixel short of where this
	   one does. */
	.outer,
	.checked-ring {
		width: 20px;
		height: 20px;
		border-style: solid;
		border-width: var(--winui-RadioButtonBorderThemeThickness);
	}

	/* The dot's stroke is `CircleElevationBorderBrush` when unchecked and
	   `AccentControlElevationBorderBrush` when checked, and both are gradients in the token
	   layer. A gradient named as a `border-color` is invalid CSS and silently dropped, which is
	   why Button and TextBox carry a transparent border under a two-layer background instead.
	   The same form is used here, with the fill clipped to the padding box and the gradient to
	   the border box. The fill is written as a two-stop gradient of one colour because a
	   background layer takes an image, not a colour. */
	.dot,
	.press-dot {
		border-style: solid;
		border-width: var(--winui-RadioButtonBorderThemeThickness);
		border-color: transparent;
	}

	.dot {
		width: var(--winui-RadioButtonCheckGlyphSize);
		height: var(--winui-RadioButtonCheckGlyphSize);
		opacity: 0;
	}

	/* `<Border Width="4" Height="4" …>`, RadioButton_themeresources.xaml:376. */
	.press-dot {
		width: 4px;
		height: 4px;
		opacity: 0;
	}

	/* `VerticalContentAlignment="Top"` on the ContentPresenter, with `Margin` bound to the
	   control's `Padding`; `TextWrapping="Wrap"`. */
	.content {
		/* `Padding` is the literal 8,6,0,0 — left, top, right, bottom in XAML's order — at
		   RadioButton_themeresources.xaml:187. */
		margin: 6px 0 0 8px;
		white-space: normal;
	}

	/* The check axis: the two ellipses swap and the dot appears. */
	.root[data-checked] .outer {
		opacity: 0;
	}

	.root:not([data-checked]) .checked-ring {
		opacity: 0;
	}

	.root[data-checked] .dot {
		opacity: 1;
	}

	/* ----- Normal ----- */
	.root {
		background: var(--winui-RadioButtonBackground);
		border-color: var(--winui-RadioButtonBorderBrush);
		color: var(--winui-RadioButtonForeground);
	}
	.root .outer {
		background: var(--winui-RadioButtonOuterEllipseFill);
		border-color: var(--winui-RadioButtonOuterEllipseStroke);
	}
	.root .checked-ring {
		background: var(--winui-RadioButtonOuterEllipseCheckedFill);
		border-color: var(--winui-RadioButtonOuterEllipseCheckedStroke);
	}
	.root .dot,
	.root .press-dot {
		background:
			linear-gradient(
					var(--winui-RadioButtonCheckGlyphFill),
					var(--winui-RadioButtonCheckGlyphFill)
				)
				padding-box,
			var(--winui-RadioButtonCheckGlyphStroke) border-box;
	}

	/* ----- PointerOver ----- */
	.root:hover {
		background: var(--winui-RadioButtonBackgroundPointerOver);
		border-color: var(--winui-RadioButtonBorderBrushPointerOver);
		color: var(--winui-RadioButtonForegroundPointerOver);
	}
	.root:hover .outer {
		background: var(--winui-RadioButtonOuterEllipseFillPointerOver);
		border-color: var(--winui-RadioButtonOuterEllipseStrokePointerOver);
	}
	.root:hover .checked-ring {
		background: var(--winui-RadioButtonOuterEllipseCheckedFillPointerOver);
		border-color: var(--winui-RadioButtonOuterEllipseCheckedStrokePointerOver);
	}
	.root:hover .dot,
	.root:hover .press-dot {
		background:
			linear-gradient(
					var(--winui-RadioButtonCheckGlyphFillPointerOver),
					var(--winui-RadioButtonCheckGlyphFillPointerOver)
				)
				padding-box,
			var(--winui-RadioButtonCheckGlyphStrokePointerOver) border-box;
	}

	/* ----- Pressed ----- */
	.root:active {
		background: var(--winui-RadioButtonBackgroundPressed);
		border-color: var(--winui-RadioButtonBorderBrushPressed);
		color: var(--winui-RadioButtonForegroundPressed);
	}
	.root:active .outer {
		background: var(--winui-RadioButtonOuterEllipseFillPressed);
		border-color: var(--winui-RadioButtonOuterEllipseStrokePressed);
	}
	.root:active .checked-ring {
		background: var(--winui-RadioButtonOuterEllipseCheckedFillPressed);
		border-color: var(--winui-RadioButtonOuterEllipseCheckedStrokePressed);
	}
	.root:active .dot,
	.root:active .press-dot {
		background:
			linear-gradient(
					var(--winui-RadioButtonCheckGlyphFillPressed),
					var(--winui-RadioButtonCheckGlyphFillPressed)
				)
				padding-box,
			var(--winui-RadioButtonCheckGlyphStrokePressed) border-box;
	}

	/* The `Checked` visual state sets `CheckGlyph.Stroke` once, with no pointer variants —
	   `RadioButtonCheckGlyphStrokeCheckedPointerOver` and its two siblings are defined upstream
	   and read by nothing. It is the only colour the check axis touches. */
	.root[data-checked] .dot {
		background:
			linear-gradient(
					var(--winui-RadioButtonCheckGlyphFill),
					var(--winui-RadioButtonCheckGlyphFill)
				)
				padding-box,
			var(--winui-RadioButtonCheckGlyphStrokeChecked) border-box;
	}

	/* `RadioButtonCheckGlyphSize` 12 at rest, `…PointerOverSize` 14, `…PressedOverSize` 10,
	   each a `SplineDoubleKeyFrame` on Width and Height with `ControlFastOutSlowInKeySpline`.
	   The dot's is `ControlNormalAnimationDuration`; the press dot's is
	   `ControlFastAnimationDuration`. */
	.dot {
		transition:
			width var(--winui-ControlNormalAnimationDuration) var(--winui-ControlFastOutSlowInKeySpline),
			height var(--winui-ControlNormalAnimationDuration) var(--winui-ControlFastOutSlowInKeySpline);
	}

	.root:hover .dot {
		width: var(--winui-RadioButtonCheckGlyphPointerOverSize);
		height: var(--winui-RadioButtonCheckGlyphPointerOverSize);
	}

	.root:active .dot {
		width: var(--winui-RadioButtonCheckGlyphPressedOverSize);
		height: var(--winui-RadioButtonCheckGlyphPressedOverSize);
	}

	/* `:not([data-checked])` because the `Checked` visual state drives
	   `PressedCheckGlyph.Opacity` to 0 — RadioButton_themeresources.xaml:353. The press dot is
	   the affordance for selecting an unselected radio; a selected one answers a press by
	   shrinking its own dot to `…PressedOverSize` instead. Without this the two would stack,
	   a 10px press dot under a 10px check dot. */
	.root:not([data-checked]):active .press-dot {
		opacity: 1;
		width: var(--winui-RadioButtonCheckGlyphPressedOverSize);
		height: var(--winui-RadioButtonCheckGlyphPressedOverSize);
		transition:
			width var(--winui-ControlFastAnimationDuration) var(--winui-ControlFastOutSlowInKeySpline),
			height var(--winui-ControlFastAnimationDuration) var(--winui-ControlFastOutSlowInKeySpline);
	}

	/* Written last so it wins over `:hover` and `:active`: a disabled radio must not light up
	   under the pointer. `data-disabled` is on the root rather than `:disabled` because
	   `:disabled` matches a form control and the root is a `<label>`. */
	.root[data-disabled] {
		background: var(--winui-RadioButtonBackgroundDisabled);
		border-color: var(--winui-RadioButtonBorderBrushDisabled);
		color: var(--winui-RadioButtonForegroundDisabled);
		cursor: default;
	}
	.root[data-disabled] .outer {
		background: var(--winui-RadioButtonOuterEllipseFillDisabled);
		border-color: var(--winui-RadioButtonOuterEllipseStrokeDisabled);
	}
	.root[data-disabled] .checked-ring {
		background: var(--winui-RadioButtonOuterEllipseCheckedFillDisabled);
		border-color: var(--winui-RadioButtonOuterEllipseCheckedStrokeDisabled);
	}
	/* Size and opacity, not only colour: `:hover` and `:active` still match a disabled
	   control's `<label>`, so a disabled radio would otherwise grow its dot under the pointer
	   and show a press dot on mousedown. The 14 is upstream's — the `Disabled` state animates
	   `CheckGlyph` to 14x14 at RadioButton_themeresources.xaml:335, which is the pointer-over
	   size rather than the resting 12, and is written as a literal here rather than reaching
	   for `RadioButtonCheckGlyphPointerOverSize`, which happens to hold the same number and
	   means something else. */
	.root[data-disabled] .dot {
		width: 14px;
		height: 14px;
	}

	.root[data-disabled] .press-dot {
		opacity: 0;
	}

	.root[data-disabled] .dot,
	.root[data-disabled] .press-dot {
		background:
			linear-gradient(
					var(--winui-RadioButtonCheckGlyphFillDisabled),
					var(--winui-RadioButtonCheckGlyphFillDisabled)
				)
				padding-box,
			var(--winui-RadioButtonCheckGlyphStrokeDisabled) border-box;
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
