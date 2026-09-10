<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface NumberBoxProps {
		/** Value. `null` is WinUI's `NaN` — the box is empty. */
		value?: number | null;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback.
		 *  Upstream signals this as `ValueChanged`, which is not implemented. */
		onValueChange?: (value: number | null) => void;
		/** Minimum and Maximum. */
		min?: number;
		max?: number;
		/** SmallChange, the step a spin button applies. */
		step?: number;
		/** SpinButtonPlacementMode. `'compact'` is not built in this unit. */
		spinButtonPlacementMode?: 'hidden' | 'inline';
		/** PlaceholderText. */
		placeholder?: string;
		/** IsEnabled, inverted to HTML's attribute — ADR 0009. */
		disabled?: boolean;
		/** Header. A string or a snippet; nothing is rendered when it is not given. */
		header?: Snippet | string;
		/** Description. A string or a snippet; nothing is rendered when it is not given. */
		description?: Snippet | string;
		// The two HTML form attributes the rest props cannot reach: the root is a `<div>`
		// wrapper and these belong on the `<input>`, so they are declared rather than
		// spread. The exception set is closed in ADR 0009 for the same reason.
		/** No WinUI member: the form field name. */
		name?: string;
		/** No WinUI member: the id of the form to associate with. */
		form?: string;
		class?: string;
		style?: string;
		/** The `<input>`, not the root — ADR 0009's `ref` points at the interactive
		 *  element. */
		ref?: HTMLInputElement | null;
		[key: string]: unknown;
	}

	// Three WinUI members are deliberately absent, and a plain comment names them rather
	// than a `/** */` one: a doc comment here would attach itself to `placeholder` below
	// and a consumer hovering that prop would be told about one of them.
	//
	// `SpinButtonPlacementMode="Compact"`, the popup variant, and every `NumberBoxPopup*`
	// resource. This unit builds `Hidden` (the default) and `Inline`; the compact
	// placement arrives with its own tranche.
	//
	// `AcceptsExpression`. WinUI evaluates arithmetic typed into the box; nothing here does.
	//
	// `ValidationMode` beyond clamping to `min`/`max`.
</script>

<script lang="ts">
	import * as numberInput from '@zag-js/number-input';
	import { normalizeProps, useMachine } from '@zag-js/svelte';

	let {
		value = $bindable(null),
		onValueChange,
		min,
		max,
		step = 1,
		spinButtonPlacementMode = 'hidden',
		placeholder,
		disabled = false,
		header,
		description,
		name,
		form,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: NumberBoxProps = $props();

	// `value` is WinUI's `Value` — the number in the box — and a number in this component's
	// contract. The Zag machine's `value` is a string: an empty box is `null` here and `''`
	// there, and the conversion is at the boundary so neither side sees the other's type.
	// `useMachine`'s second argument is a function so a prop change re-reads the machine's
	// context; a stale value would be a number whose string form is now from the previous
	// render.
	const machineValue = $derived(value === null || value === undefined ? '' : String(value));

	// The machine's id is also the prefix Zag uses for every element id it derives
	// (`numberbox` → `<input id="number-input:numberbox:input">`). A constant here means
	// every NumberBox on the page shares one DOM id, so two NumberBoxes in the same
	// document collide on the input, the labels and any test that selects by id. Svelte's
	// `$props.id()` returns an id unique to this component instance. Other components in
	// this library pass through `bits-ui`, which generates its own; this is the first
	// component here to wire a state machine directly and so the first to need it.
	const uid = $props.id();

	const service = useMachine(numberInput.machine, () => ({
		id: uid,
		value: machineValue,
		min,
		max,
		step,
		disabled,
		name,
		form,
		onValueChange: (details: { value: string; valueAsNumber: number }) => {
			// The machine's empty value is `''`; this component's is `null`. Re-parse
			// through `valueAsNumber` rather than `Number(details.value)` so the
			// machine's own `Intl.NumberFormat` parser — which the consumer's locale
			// configures — is the one that decides between `NaN` and a number.
			const next =
				details.value === ''
					? null
					: Number.isFinite(details.valueAsNumber)
						? details.valueAsNumber
						: null;
			value = next;
			onValueChange?.(next);
		}
	}));

	const api = $derived(numberInput.connect(service, normalizeProps));

	const showSpin = $derived(spinButtonPlacementMode === 'inline');

	// Chains the machine's own handler first, then writes back through `onValueChange`.
	// The same shape AutoSuggestBox's `Combobox.Input` carries, and the same rule:
	// writing a bare `oninput` after `{...props}` would replace the one the primitive put
	// there and the controlled-value wiring would silently stop seeing keystrokes. See
	// AutoSuggestBox.svelte:177 for the measurement.
	function onInput(event: Event) {
		const handler = (api.getInputProps() as { oninput?: ((event: Event) => void) | undefined })
			.oninput;
		handler?.(event);
		// `api.value` is the machine's string. A consumer binding `value` to a number
		// expects the number, and the machine's own `onValueChange` already covered the
		// `null`-when-empty and the `Intl.NumberFormat`-parsed path. The handler above
		// ran first, so `api.value` reflects the keystroke already.
		const next = api.value === '' ? null : Number(api.value);
		value = next;
		onValueChange?.(next);
	}
</script>

<div
	class={['root', className]}
	{style}
	data-disabled={disabled || undefined}
	{...api.getRootProps()}
	{...rest}
>
	{#if header !== undefined}
		<span class="header">
			{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
		</span>
	{/if}
	<div class={['box', showSpin && 'inline']}>
		<!-- The `<input>` is the control; the two spin buttons are its siblings in the
		     box's flex row, matching upstream's `Grid` where the input spans all three
		     columns and the buttons sit on top in columns 1 and 2 (`NumberBox.xaml:174`
		     and `:175`). Upstream's `SpinButtonsVisible` state at `NumberBox.xaml:33`
		     *lowers* `InputBox.MinWidth` to `NumberBoxMinWidth` (120) from the 318 the
		     InputBox inherits through `NumberBoxTextBoxStyle`, which is
		     `BasedOn="{StaticResource DefaultTextBoxStyle}"` and overrides only
		     `Template` (`NumberBox.xaml:114`). A NumberBox with spin buttons is allowed
		     to be *narrower* than a text box, not wider. `InputBox` is
		     `Grid.ColumnSpan="3"`, so that minimum is the whole control's — which is why
		     the class goes on the box and the input keeps its `min-width: 0`. -->
		<input
			bind:this={ref}
			class="input"
			value={api.value}
			{...api.getInputProps()}
			{placeholder}
			oninput={onInput}
		/>
		{#if showSpin}
			<!-- `IsTabStop="False"` on both spin buttons, for TextBox's delete-button reason:
			     the input is the focus target, and a tab stop inside the box would break
			     arrow-key traversal upstream expects. Cited rather than restated:
			     TextBox.svelte:109 records the measurement. The two handlers call the
			     machine's first and then add nothing: the button's repeat-on-hold is the
			     machine's, not a timer here. `getIncrementTriggerProps()` and
			     `getDecrementTriggerProps()` carry every handler and data attribute the
			     state needs. The `disabled` attribute makes both buttons inert when the
			     box is disabled; the disabled colours come from the
			     `.root[data-disabled]` rules below. -->
			<button
				type="button"
				class="spin-up"
				tabindex="-1"
				aria-label="Increase value"
				{disabled}
				{...api.getIncrementTriggerProps()}
			></button>
			<button
				type="button"
				class="spin-down"
				tabindex="-1"
				aria-label="Decrease value"
				{disabled}
				{...api.getDecrementTriggerProps()}
			></button>
		{/if}
	</div>
	<!-- Upstream marks the `DescriptionPresenter` `AutomationProperties.AccessibilityView="Raw"`
	     (`NumberBox_themeresources.xaml`, the same as TextBox's), which keeps the description
	     out of the control's accessibility view; no `aria-describedby` on the input here,
	     for the same reason. -->
	{#if description !== undefined}
		<span class="description">
			{#if typeof description === 'string'}{description}{:else}{@render description()}{/if}
		</span>
	{/if}
</div>

<style>
	.root {
		display: flex;
		flex-direction: column;
	}

	/* The box: `NumberBox.xaml:27` reads the same `TextControl*` family TextBox reads in the
	   same four states, and the box itself — its border, background, foreground and the
	   masked gradient ring — is TextBox's, repeated. The same comments and the same
	   measurement: see TextBox.svelte:138.

	   No focus visual on the box: `NumberBox_themeresources.xaml` names neither
	   `UseSystemFocusVisuals` nor `FocusVisualMargin`, so it never opts in — and the
	   same outcome TextBox reaches by binding `UseSystemFocusVisuals` to `False` is
	   what NumberBox reaches by not setting it. Same route, same result; the focused
	   border is the box's, not the input's. */
	.box {
		/* XAML's `MinHeight` and `MinWidth` include the border and the padding; CSS's
		   `min-height` and `min-width` do not, unless the box is `border-box`. Without
		   this line a control whose minimum comes from a WinUI resource renders that
		   minimum *plus* its own padding and border — measured: this box came out 45px
		   tall against the original's 32.

		   `height: 32px` rather than `min-height` so the children cannot grow the box
		   past 32. With `min-height`, an input whose padding-plus-content exceeds the
		   box's content area stretches the row, and the box comes out 36 — measured.
		   A fixed `height` is what makes `align-items: stretch` honour it. */
		box-sizing: border-box;
		position: relative;
		display: flex;
		align-items: stretch;
		/* c1-allow: TextBox_themeresources.xaml:193 binds MinWidth to TextControlThemeMinWidth,
		   defined at 64px. This reproduction uses 318px instead, measured on the reference guest and
		   recorded by apps/gallery/src/lib/SearchBox.svelte; which of the two is right is a
		   measurement no unit has made yet. */
		min-width: 318px;
		/* TextBox_themeresources.xaml:192 binds MinHeight to this token. */
		height: var(--winui-TextControlThemeMinHeight);
		min-height: var(--winui-TextControlThemeMinHeight);
		border-style: solid;
		/* Both `TextControlBorderBrush` and `TextControlBorderBrushFocused` are gradients
		   (aliases onto `TextControlElevationBorderBrush` and `…FocusedBrush`). A gradient
		   named as a `border-color` is invalid CSS and silently dropped. The gradient is
		   painted by `.box::after` so it sits on the ring alone — the same shape TextBox
		   carries. See TextBox.svelte:159 for the full explanation. */
		border-color: transparent;
		border-width: var(--winui-TextControlBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-TextControlBackground) padding-box;
		color: var(--winui-TextControlForeground);
	}

	/* `NumberBox.xaml:33` — the `SpinButtonsVisible` state lowers the control's minimum
	   from a text box's 318 to `NumberBoxMinWidth`'s 120. It is a floor coming *down*,
	   and it has to sit on the same element as the 318 it replaces or it never applies.
	   `SpinButtonsCollapsed` and `SpinButtonsPopup` both keep the 318. */
	.box.inline {
		min-width: var(--winui-NumberBoxMinWidth);
	}

	.box::after {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--winui-TextControlBorderThemeThickness));
		border-radius: inherit;
		padding: var(--winui-TextControlBorderThemeThickness);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		background: var(--winui-TextControlBorderBrush);
	}

	/* The header: same `TextControl*` family TextBox reads, the same reason — the
	   `HeaderContentPresenter` at `NumberBox.xaml:20` binds
	   `Foreground="{ThemeResource TextControlHeaderForeground}"`. */
	.header {
		margin: var(--winui-TextBoxTopHeaderMargin);
		color: var(--winui-TextControlHeaderForeground);
		white-space: normal;
	}

	/* The description: same as TextBox and PasswordBox — one colour in every state,
	   including disabled. */
	.description {
		color: var(--winui-SystemControlDescriptionTextForegroundBrush);
		white-space: normal;
	}

	.root:hover .box {
		background: var(--winui-TextControlBackgroundPointerOver) padding-box;
		color: var(--winui-TextControlForegroundPointerOver);
	}
	.root:hover .box::after {
		background: var(--winui-TextControlBorderBrushPointerOver);
	}

	.root:focus-within .box {
		border-width: var(--winui-TextControlBorderThemeThicknessFocused);
		background: var(--winui-TextControlBackgroundFocused) padding-box;
		color: var(--winui-TextControlForegroundFocused);
	}
	/* The four `inset` values mirror `TextControlBorderThemeThicknessFocused` — `1px 1px 2px
	   1px` — negated; `calc()` cannot negate a multi-value shorthand, so they are written
	   out. See TextBox.svelte:236 for the measurement. */
	.root:focus-within .box::after {
		inset: -1px -1px -2px -1px;
		padding: var(--winui-TextControlBorderThemeThicknessFocused);
		background: var(--winui-TextControlBorderBrushFocused);
	}

	/* The `<input>` itself: padding belongs to the input, not the box, and that is not a
	   stylistic choice. Upstream puts `TextControlThemePadding` on the `TextBox` inside
	   `NumberBoxTextBoxStyle`, and the two spin buttons are its siblings outside that
	   padding. Put it on the box instead and the spin button's
	   `VerticalAlignment="Stretch"` stacks with it: measured 41px against the original's
	   32 on the reference guest. The same shape AutoSuggestBox carries and the same
	   reason: see AutoSuggestBox.svelte:381 for the measurement.

	   `min-height: 0` and `max-height: 100%` cap the input at the box's content-area
	   height. Without them the input grows past 30px to fit the row, and the box comes
	   out at 36 — measured. With `box-sizing: border-box` the padding eats into the
	   available height rather than adding to it. */
	.input {
		padding: var(--winui-TextControlThemePadding);
		flex: 1 1 auto;
		/* An `<input>` carries an intrinsic width — its `size` attribute's worth of
		   characters, twenty by default — and a XAML `TextBox` carries none. Left at
		   `auto` that intrinsic width becomes the box's content width, and the box comes
		   out 179 where upstream's is 120: the minimum `SpinButtonsVisible` sets is a
		   floor the control never reaches, so lowering it changes nothing. `width: 0`
		   with `flex-grow: 1` is what makes the input size to its box instead of the
		   other way round. `flex-basis: 0` is not enough — a flex item still offers its
		   own max-content to an intrinsically sized container. */
		width: 0;
		min-width: 0;
		min-height: 0;
		max-height: 100%;
		border: 0;
		background: transparent;
		font: inherit;
		color: inherit;
		outline: none;
		/* Kept where AutoSuggestBox's twin was deleted, and the difference is the root: that
		   control carries `winui-BodyTextBlockStyle` and this one does not, so `font: inherit`
		   here resolves against the consumer's page rather than against a ramp class inside the
		   library. A WinUI TextBox draws its text at the font's own spacing whatever surrounds
		   it, and this is what says so. ADR 0011. */
		line-height: normal;
		box-sizing: border-box;
	}

	.input::placeholder {
		color: var(--winui-TextControlPlaceholderForeground);
	}

	.root:hover .input::placeholder {
		color: var(--winui-TextControlPlaceholderForegroundPointerOver);
	}

	.root:focus-within .input::placeholder {
		color: var(--winui-TextControlPlaceholderForegroundFocused);
	}

	.input::selection {
		background: var(--winui-TextControlSelectionHighlightColor);
	}

	/* Written last so they win over `:hover` and `:focus-within`: a disabled box must not
	   light up under the pointer or gain focus styling. `data-disabled` is on the root
	   rather than `:disabled` because `:disabled` matches a form control and the root is
	   a `<div>`; the header sits on the root and not the box, so its disabled colour
	   needs the same hook. */
	.root[data-disabled] .box {
		background: var(--winui-TextControlBackgroundDisabled) padding-box;
		color: var(--winui-TextControlForegroundDisabled);
		cursor: default;
	}
	.root[data-disabled] .box::after {
		background: var(--winui-TextControlBorderBrushDisabled);
	}

	.root[data-disabled] .input::placeholder {
		color: var(--winui-TextControlPlaceholderForegroundDisabled);
	}

	.root[data-disabled] .input {
		cursor: default;
	}

	.root[data-disabled] .header {
		color: var(--winui-TextControlHeaderForegroundDisabled);
	}

	/* No `.root[data-disabled] .description` rule: the description's colour is the same
	   in every state, including disabled — `NumberBox_themeresources.xaml` never overrides
	   it. */

	/* The spin buttons. `NumberBoxSpinButtonStyle` at NumberBox_themeresources.xaml:182 is
	   `BasedOn` the default `RepeatButton` style, so the brushes it paints come from the
	   `RepeatButton*` families: `Background`, `Foreground` and `BorderBrush` in the four
	   `CommonStates` (Normal, PointerOver, Pressed, Disabled).

	   Upstream places the two buttons side by side in adjacent columns of the same row
	   (`NumberBox.xaml:174` and `:175`); the input spans all three columns and the
	   buttons sit on top of it. The two `Auto` columns come to 76: the up button is
	   `4 + 32 + 4` wide with `Margin="4"`, the down button `0 + 32 + 4` with
	   `Margin="0,4,4,4"`, and only the down button's left margin is zero. Measured 76,
	   as the two buttons' left edges 36 apart.

	   The 72 in `SpinButtonsVisible` is a different number in a different grid: that
	   setter at `NumberBox.xaml:344` is in the inner `NumberBoxTextBoxStyle` template,
	   where it reserves an inset so the text does not run under the buttons. Upstream
	   reserves four less than the buttons occupy and lets the text pass under the up
	   button's right margin; reproduced rather than corrected, because the bar is what
	   the original renders.

	   `MinWidth="32"`, `Padding="0"` and `VerticalAlignment="Stretch"` upstream. The
	   four-part `NumberBoxSpinButtonBorderThickness` (`0,1,1,1` — no **left** border)
	   is applied as a shorthand to each button. The seam between them is drawn once, by
	   the up button's right border — the down button's left side is the one the
	   resource zeroes, which is what keeps the pair from doubling to 2px where they
	   meet.

	   The control's `CornerRadius` is bound on **both** buttons (`NumberBox.xaml:174`
	   and `:175`), so each button carries the full radius on all four corners; the
	   outer two corners track the box's rounded corners because each button abuts a
	   matching edge of the box.

	   `FontSize="12"` and `FontFamily="{ThemeResource SymbolThemeFontFamily}"`.

	   Each glyph — `&#xE70E;` (ChevronUp) at `NumberBox.xaml:174` and `&#xE70D;`
	   (ChevronDown) at :175 — is a `c1-allow` citing its line, the way ComboBox's
	   chevron does. */
	.spin-up,
	.spin-down {
		box-sizing: border-box;
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		/* c1-allow: NumberBox_themeresources.xaml:185, `MinWidth="32"` on
		   `NumberBoxSpinButtonStyle` */
		min-width: 32px;
		padding: 0;
		position: relative;
		border-style: solid;
		border-width: var(--winui-NumberBoxSpinButtonBorderThickness);
		/* `RepeatButtonBorderBrush` resolves to `ControlElevationBorderBrush`, a
		   `linear-gradient(...)` in the token layer — a CSS gradient is not a valid
		   `border-color` and the declaration is silently dropped, so the border falls
		   back to `currentColor` (here `RepeatButtonForeground`, near-black) and the
		   buttons render with heavy black edges. The gradient is painted by
		   `.spin-up::before` / `.spin-down::before` so it sits on the ring alone. See
		   Button.svelte:69 for the full explanation. */
		border-color: transparent;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-RepeatButtonBackground);
		color: var(--winui-RepeatButtonForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: NumberBox_themeresources.xaml:182, `FontSize="12"` on
		   `NumberBoxSpinButtonStyle` */
		font-size: 12px;
		line-height: normal;
		cursor: pointer;
	}

	.spin-up {
		margin: 4px;
	}

	.spin-down {
		/* c1-allow: NumberBox.xaml:175, `Margin="0,4,4,4"` on `DownSpinButton`. XAML
		   writes Left,Top,Right,Bottom; CSS writes Top,Right,Bottom,Left. The 0 is on
		   the **left**, between the two buttons. */
		margin: 4px 4px 4px 0;
	}

	/* The spin button's border brush is a gradient (see the shared rule above) and a
	   gradient cannot be a `border-color`. `::after` is already taken by the glyph, so
	   the ring goes on `::before`. The mask is two layers composited so the content box
	   is punched out, leaving the ring visible — the same technique `.box::after` uses
	   just above and Button.svelte:113 describes in full. `inset` is the border
	   thickness negated so the ring's box is the button's border box, and `border-radius:
	   inherit` puts the two curves on top of each other.

	   `inset` is written out, not `calc(-1 * var(--winui-NumberBoxSpinButtonBorderThickness))`,
	   because `calc()` cannot negate a multi-value shorthand. See TextBox.svelte:242 for
	   the same shape and the same reason. */
	.spin-up::before,
	.spin-down::before {
		content: '';
		position: absolute;
		/* c1-allow: NumberBox_themeresources.xaml:29,
		   `NumberBoxSpinButtonBorderThickness` = `0,1,1,1`. XAML writes Left,Top,Right,
		   Bottom and the 0 is on the **left**; CSS `inset` writes Top,Right,Bottom,Left,
		   so the 0 is **last** here. The four values mirror the resource negated. */
		inset: -1px -1px -1px 0;
		border-radius: inherit;
		padding: var(--winui-NumberBoxSpinButtonBorderThickness);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		background: var(--winui-RepeatButtonBorderBrush);
	}

	/* c1-allow: NumberBox.xaml:174, `UpSpinButton` `Content="&#xE70E;"` */
	.spin-up::after {
		content: '\e70e';
	}

	/* c1-allow: NumberBox.xaml:175, `DownSpinButton` `Content="&#xE70D;"` */
	.spin-down::after {
		content: '\e70d';
	}

	.spin-up:hover {
		background: var(--winui-RepeatButtonBackgroundPointerOver);
		color: var(--winui-RepeatButtonForegroundPointerOver);
	}
	.spin-up:hover::before {
		background: var(--winui-RepeatButtonBorderBrushPointerOver);
	}

	.spin-up:active {
		background: var(--winui-RepeatButtonBackgroundPressed);
		color: var(--winui-RepeatButtonForegroundPressed);
	}
	.spin-up:active::before {
		background: var(--winui-RepeatButtonBorderBrushPressed);
	}

	.spin-down:hover {
		background: var(--winui-RepeatButtonBackgroundPointerOver);
		color: var(--winui-RepeatButtonForegroundPointerOver);
	}
	.spin-down:hover::before {
		background: var(--winui-RepeatButtonBorderBrushPointerOver);
	}

	.spin-down:active {
		background: var(--winui-RepeatButtonBackgroundPressed);
		color: var(--winui-RepeatButtonForegroundPressed);
	}
	.spin-down:active::before {
		background: var(--winui-RepeatButtonBorderBrushPressed);
	}

	/* A spin button is disabled for two reasons and the template names neither. The first
	   is the control being disabled. The second is the value reaching the bound the button
	   moves towards: `NumberBox.cpp`'s `UpdateSpinButtonEnabled` at :680 enters
	   `UpSpinButtonDisabled` when the value is not below `Maximum` and
	   `DownSpinButtonDisabled` when it is not above `Minimum`, and those states —
	   `NumberBox.xaml:42-59` — set `IsEnabled="False"` on the button, which is what sends
	   the `RepeatButton` to its own `Disabled` visuals. The condition lives in the code;
	   the template only says what the state does.

	   Both reasons put `disabled` on the `<button>` here: the first through the prop, the
	   second through the machine, which stops the trigger at the bound on its own. So one
	   selector covers both, and it is written after `:hover` and `:active` so a disabled
	   button does not light up under the pointer. */
	.spin-up:disabled,
	.spin-down:disabled {
		background: var(--winui-RepeatButtonBackgroundDisabled);
		color: var(--winui-RepeatButtonForegroundDisabled);
		cursor: default;
	}
	.spin-up:disabled::before,
	.spin-down:disabled::before {
		background: var(--winui-RepeatButtonBorderBrushDisabled);
	}
</style>
