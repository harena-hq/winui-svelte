<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface PasswordBoxProps {
		/** Password, under HTML's name for the value. */
		value?: string;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback.
		 *  Upstream signals this as `PasswordChanged`, which is not implemented. */
		onValueChange?: (value: string) => void;
		/** PlaceholderText, under HTML's name for it. */
		placeholder?: string | null;
		/** IsEnabled, inverted to HTML's attribute — ADR 0009. */
		disabled?: boolean | null;
		/** MaxLength. 0 upstream means no limit; omit the attribute in that case. */
		maxLength?: number;
		/** Header. A string or a snippet; nothing is rendered when it is not given. */
		header?: Snippet | string;
		/** Description. A string or a snippet; nothing is rendered when it is not given. */
		description?: Snippet | string;
		// The four HTML form attributes the rest props cannot reach: the root is a `<div>`
		// wrapper and these belong on the `<input>`, so they are declared rather than
		// spread. The exception set is closed in ADR 0009 for the same reason.
		/** No WinUI member: the form field name. */
		name?: string | null;
		/** No WinUI member: HTML form validation. */
		required?: boolean | null;
		/** No WinUI member: the id of the form to associate with. */
		form?: string | null;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/** The `<input type="password">`, not the root — ADR 0009's `ref` points at the
		 *  interactive element, which for Button happens to be the root and here does not. */
		ref?: HTMLInputElement | null;
		[key: string]: unknown;
	}

	// Two WinUI members are deliberately absent, and a plain comment says so rather than
	// a `/** */` one: a doc comment here would attach itself to `placeholder` below and a
	// consumer hovering that prop would be told about one of them.
	//
	// `PasswordRevealMode`'s `Hidden` and `Visible` — this unit implements `Peek`, the
	// default, and the other two are a prop a later unit adds if anything needs them.
	//
	// `PasswordChar`, which HTML does not expose.
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	let {
		value = $bindable(''),
		onValueChange,
		placeholder,
		disabled = false,
		maxLength,
		header,
		description,
		name,
		required = false,
		form,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: PasswordBoxProps = $props();

	const str = useStrings();

	let revealing = $state(false);

	// Upstream's `ButtonStates` group at `PasswordBox_themeresources.xaml:165` toggles the
	// reveal button between `ButtonVisible` and `ButtonCollapsed` solely on the password
	// being non-empty — focus is not a condition. The XAML has no focus requirement on
	// the button's visibility; the runtime code is what watches the password. Reproducing
	// that keeps the button visible whenever there is something to reveal, with focus
	// irrelevant.
	const showReveal = $derived(value !== '' && !disabled);

	function onInput(event: Event) {
		const next = (event.currentTarget as HTMLInputElement).value;
		onValueChange?.(next);
	}

	// WinUI's `PasswordRevealMode` defaults to `Peek`: the password is shown for as long
	// as the button is held and hidden again on release. The element in the source is a
	// `ToggleButton`, and the next reader will expect latching. `pointerdown` reveals,
	// `pointerup`, `pointerleave` and `blur` hide.
	//
	// The caret is carried across the change by hand, and the frame it is put back on is
	// the whole of the fix. Upstream reveals by changing what one text field draws, so
	// nothing there moves the caret; here the reveal is a change of the `<input>`'s
	// `type`, and Chromium resets a password field's selection to offset 0 at the end of
	// the task that dispatched the pointer event — after `click`, and so after both the
	// handler and anything it queues as a microtask. Measured against a plain
	// `<input>` + `<button>` with no framework in the page: restoring synchronously and
	// restoring in a microtask both end at 0, and restoring in a `requestAnimationFrame`
	// ends where the user left it. The frame callback also lands after Svelte has
	// flushed the new `type` to the DOM, which is the other thing the restore has to
	// wait for.
	function setRevealing(next: boolean) {
		const input = ref;
		const start = input?.selectionStart ?? null;
		const end = input?.selectionEnd ?? null;
		const direction = input?.selectionDirection ?? 'none';
		revealing = next;
		if (input && start !== null && end !== null) {
			requestAnimationFrame(() => input.setSelectionRange(start, end, direction));
		}
	}

	function reveal() {
		setRevealing(true);
	}
	function hide() {
		setRevealing(false);
	}
</script>

<div class={['root', className]} {style} data-disabled={disabled || undefined} {...rest}>
	{#if header !== undefined}
		<span class="header">
			{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
		</span>
	{/if}
	<!-- `onfocusin` and `onfocusout` are kept here even though PasswordBox draws no
	     delete button: the reveal button's `hide()` runs on `blur`, and the `<input>`
	     leaving focus is the moment that fires. The reveal button is `tabindex="-1"` so
	     a `pointerdown` on it does not move focus to the button; only the input losing
	     focus does. -->
	<div class="box">
		<!-- `autocomplete="off"`, as TextBox carries it, stops the browser's history of the field.
		     It does not stop a password manager, which ignores `off` on a password field. -->
		<input
			bind:this={ref}
			type={revealing ? 'text' : 'password'}
			autocomplete="off"
			bind:value
			{placeholder}
			{disabled}
			maxlength={maxLength === undefined || maxLength === 0 ? undefined : maxLength}
			{name}
			{required}
			{form}
			oninput={onInput}
			onblur={hide}
		/>
		{#if showReveal}
			<!-- `onmousedown` preventing default is what keeps this button working outside
			     Chromium, the same reason TextBox's delete button carries one. Cited rather
			     than restated: the comment on TextBox.svelte's delete button records the full
			     measurement. -->
			<button
				type="button"
				class="reveal"
				tabindex="-1"
				aria-label={str(
					revealing ? 'WinUISveltePasswordBoxHidePasswordName' : 'UIA_PASSWORDBOX_REVEAL'
				)}
				onmousedown={(event) => event.preventDefault()}
				onpointerdown={reveal}
				onpointerup={hide}
				onpointerleave={hide}
				onblur={hide}
			></button>
		{/if}
	</div>
	<!-- Upstream marks the `DescriptionPresenter` `AutomationProperties.AccessibilityView="Raw"`
	     (`PasswordBox_themeresources.xaml:194`), which keeps the description out of the
	     control's accessibility view; no `aria-describedby` on the input here, for the
	     same reason. -->
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
		/* As TextBox's root: see the same declaration there. */
		min-width: var(--winui-TextControlThemeMinWidth);
	}

	.box {
		/* XAML's `MinHeight` and `MinWidth` include the border and the padding; CSS's
		   `min-height` and `min-width` do not, unless the box is `border-box`. Without
		   this line a control whose minimum comes from a WinUI resource renders that
		   minimum *plus* its own padding and border — measured: this box came out 45px
		   tall against the original's 32. */
		box-sizing: border-box;
		position: relative;
		display: flex;
		align-items: stretch;
		/* PasswordBox_themeresources.xaml:190 binds MinWidth to this token, 64 in all three themes. */
		min-width: var(--winui-TextControlThemeMinWidth);
		/* PasswordBox_themeresources.xaml:190 binds MinHeight to this token. */
		min-height: var(--winui-TextControlThemeMinHeight);
		padding: var(--winui-TextControlThemePadding);
		border-style: solid;
		/* `TextControlBorderBrush` is a gradient (an alias onto
		   `TextControlElevationBorderBrush`); a gradient named as a `border-color` is
		   invalid CSS and silently dropped. The same shape TextBox carries, and the
		   same reason `.box::after` paints the ring. See the comment in TextBox.svelte's `.box`. */
		border-color: transparent;
		border-width: var(--winui-TextControlBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-TextControlBackground) padding-box;
		color: var(--winui-TextControlForeground);
	}

	/* The border brush is a gradient, painted on the ring alone rather than the whole
	   element. The mask composites the inner content-box layer with a ring layer so the
	   content box is punched out; see the comment above TextBox.svelte's `.box::after` for the full
	   explanation. */
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

	/* Row 0 of `PasswordBox_themeresources.xaml:189`: the header presenter above the box,
	   with its `Margin="{ThemeResource PasswordBoxTopHeaderMargin}"` and
	   `Foreground="{ThemeResource TextControlHeaderForeground}"`. The XAML's
	   `TextWrapping="Wrap"` maps to `white-space: normal`. The key is
	   `PasswordBoxTopHeaderMargin` and not `TextBoxTopHeaderMargin` — separate names
	   with separate values; both resolve to `0,0,0,8` at this pin. */
	.header {
		margin: var(--winui-PasswordBoxTopHeaderMargin);
		color: var(--winui-TextControlHeaderForeground);
		white-space: normal;
	}

	/* Row 2 of `PasswordBox_themeresources.xaml:194`: the description presenter below the
	   box, with `Foreground="{ThemeResource SystemControlDescriptionTextForegroundBrush}"`
	   and no margin. One colour in every state, including disabled. */
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

	/* The focused border is the whole of this control's focus affordance; there is no system
	   focus visual, and PasswordBox arrives at that by a different route from TextBox.
	   `TextBox_themeresources.xaml:195` opts out explicitly, binding `UseSystemFocusVisuals`
	   to `IsApplicationFocusVisualKindReveal`, which the framework dictionary defines as
	   `False` in all three themes. `PasswordBox_themeresources.xaml` names neither that
	   property nor `FocusVisualMargin` anywhere, so it never opts in — and opting in is what
	   the styles that do draw one all do, `<Setter Property="UseSystemFocusVisuals"
	   Value="{StaticResource UseSystemFocusVisuals}" />`, a setter that would be noise on
	   every one of them if the property already defaulted to drawing. Same outcome, two
	   routes, and worth writing down because the difference reads as an oversight in the
	   source and is not one to reproduce differently. */
	.root:focus-within .box {
		border-width: var(--winui-TextControlBorderThemeThicknessFocused);
		background: var(--winui-TextControlBackgroundFocused) padding-box;
		color: var(--winui-TextControlForegroundFocused);
	}
	/* The four `inset` values mirror `TextControlBorderThemeThicknessFocused` — `1px 1px 2px
	   1px` — negated. `calc()` cannot negate a multi-value shorthand, so they are written
	   out: see the comment above TextBox.svelte's `.root:focus-within .box::after`
	   for the measurement. */
	.root:focus-within .box::after {
		inset: -1px -1px -2px -1px;
		padding: var(--winui-TextControlBorderThemeThicknessFocused);
		background: var(--winui-TextControlBorderBrushFocused);
	}

	.root input {
		flex: 1 1 auto;
		min-width: 0;
		border: 0;
		background: transparent;
		padding: 0;
		font: inherit;
		color: inherit;
		outline: none;
		/* Kept where AutoSuggestBox's twin was deleted, and the difference is the root: that
		   control carries `winui-BodyTextBlockStyle` and this one does not, so `font: inherit`
		   here resolves against the consumer's page rather than against a ramp class inside the
		   library. A WinUI TextBox draws its text at the font's own spacing whatever surrounds
		   it, and this is what says so. ADR 0011. */
		line-height: normal;
		/* PasswordBox measures as TextBox does: see the same declaration in TextBox.svelte. */
		field-sizing: content;
	}

	.root input::placeholder {
		color: var(--winui-TextControlPlaceholderForeground);
	}

	.root:hover input::placeholder {
		color: var(--winui-TextControlPlaceholderForegroundPointerOver);
	}

	.root:focus-within input::placeholder {
		color: var(--winui-TextControlPlaceholderForegroundFocused);
	}

	.root input::selection {
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

	.root[data-disabled] input::placeholder {
		color: var(--winui-TextControlPlaceholderForegroundDisabled);
	}

	.root[data-disabled] input {
		cursor: default;
	}

	/* No `.root[data-disabled] .description` rule: the description's colour is the same
	   in every state, including disabled — `PasswordBox_themeresources.xaml` never
	   overrides it. */
	.root[data-disabled] .header {
		color: var(--winui-TextControlHeaderForegroundDisabled);
	}

	/* The reveal button. `Width="30"` and `VerticalAlignment="Stretch"` upstream land a
	   30-wide, full-height column the glyph is centred in.

	   `TextControlButtonBackground` is the framework-dictionary name the unit brief §5
	   lists as the second control to read from it: the dictionary aliases it onto
	   `SystemControlTransparentBrush`, which `SystemControlTransparentBrush` does not
	   define as a brush — the generator reaches the `transparent` keyword through
	   ADR 0008's table — so the button paints no fill at rest.

	   `HelperButtonThemePadding` is `0,0,-2,0`; on a 30-wide, full-height button the
	   glyph is centred, and the padding only shifts it 2px left in CSS — the brief
	   says it has no visible effect on the centre-aligned glyph. Reproduced verbatim
	   anyway: the visible effect of a token is not this component's to judge. */
	.reveal {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		padding: var(--winui-HelperButtonThemePadding);
		border: 0;
		border-radius: var(--winui-ControlCornerRadius);
		background: transparent;
		color: var(--winui-TextControlButtonForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-PasswordBoxIconFontSize);
		line-height: normal;
		cursor: pointer;
	}

	/* The fill lives on `::before` rather than on the button itself so the inner margin
	   tracks the source: the upstream `ButtonLayoutGrid` carries
	   `Margin="{ThemeResource TextBoxInnerButtonMargin}"`, and putting the margin on
	   the button would shrink the radius. (That last clause used to credit a deleted
	   `SearchBox` component for the measurement; the mechanism is the argument.) */
	.reveal::before {
		content: '';
		position: absolute;
		inset: var(--winui-TextBoxInnerButtonMargin);
		border-radius: var(--winui-ControlCornerRadius);
	}

	/* `&#xF78D;` from `PasswordBox_themeresources.xaml:100` — the Reveal glyph from
	   Segoe Fluent Icons. */
	.reveal::after {
		content: '\f78d' / '';
		position: relative;
	}

	.reveal:hover::before {
		background: var(--winui-TextControlButtonBackgroundPointerOver);
	}

	.reveal:active::before {
		background: var(--winui-TextControlButtonBackgroundPressed);
	}

	.reveal:hover {
		color: var(--winui-TextControlButtonForegroundPointerOver);
	}

	.reveal:active {
		color: var(--winui-TextControlButtonForegroundPressed);
	}
</style>
