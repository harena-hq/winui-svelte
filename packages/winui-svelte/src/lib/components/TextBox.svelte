<script lang="ts" module>
	export interface TextBoxProps {
		/** Text, under HTML's name for it — ADR 0009. */
		value?: string;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback.
		 *  Upstream signals this as `TextChanged`, which is not implemented. */
		onValueChange?: (value: string) => void;
		/** PlaceholderText, under HTML's name for it. */
		placeholder?: string;
		/** IsReadOnly, under HTML's name for it. */
		readonly?: boolean;
		/** IsEnabled, inverted to HTML's attribute — ADR 0009. */
		disabled?: boolean;
		/** MaxLength. 0 upstream means no limit; omit the attribute in that case. */
		maxLength?: number;
		/** AcceptsReturn. True renders a `<textarea>`, false an `<input type="text">`. */
		acceptsReturn?: boolean;
		class?: string;
		style?: string;
		ref?: HTMLInputElement | HTMLTextAreaElement | null;
		[key: string]: unknown;
	}

	// Four WinUI members are deliberately absent, and a plain comment says so rather
	// than a `/** */` one: a doc comment here would attach itself to `placeholder` below
	// and a consumer hovering that prop would be told about one of them.
	//
	// `Header` and `Description` are out of scope here: their resources
	// (`TextControlHeaderForeground`, `TextControlHeaderForegroundDisabled`,
	// `SystemControlDescriptionTextForegroundBrush`) are defined in the XAML framework
	// dictionary rather than in any per-control `*_themeresources.xaml` file, the same hole
	// ADR 0008 describes for the legacy brushes. AutoSuggestBox, PasswordBox and NumberBox
	// read the same names, and they are measured once for the whole Text family rather than
	// guessed here for one control.
	//
	// `TextWrapping` follows `acceptsReturn` — a `<textarea>` wraps and an `<input>`
	// does not — so the prop adds nothing on either branch.
	//
	// `SelectionHighlightColor` is the token `TextControlSelectionHighlightColor`
	// applied to `::selection` in CSS, which needs no Svelte prop to reach.
</script>

<script lang="ts">
	let {
		value = $bindable(''),
		onValueChange,
		placeholder,
		readonly = false,
		disabled = false,
		maxLength,
		acceptsReturn = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: TextBoxProps = $props();

	let focused = $state(false);

	const showDelete = $derived(value !== '' && !readonly && !disabled && focused);

	function clear() {
		value = '';
		onValueChange?.('');
		ref?.focus();
	}

	function onInput(event: Event) {
		const next = (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
		onValueChange?.(next);
	}
</script>

<div
	class={['root', className]}
	{style}
	data-multiline={acceptsReturn}
	data-disabled={disabled || undefined}
	onfocusin={() => (focused = true)}
	onfocusout={() => (focused = false)}
	{...rest}
>
	{#if acceptsReturn}
		<textarea
			bind:this={ref}
			bind:value
			{placeholder}
			{readonly}
			{disabled}
			maxlength={maxLength === undefined || maxLength === 0 ? undefined : maxLength}
			oninput={onInput}
			rows="3"></textarea>
	{:else}
		<input
			bind:this={ref}
			type="text"
			bind:value
			{placeholder}
			{readonly}
			{disabled}
			maxlength={maxLength === undefined || maxLength === 0 ? undefined : maxLength}
			oninput={onInput}
		/>
	{/if}
	{#if showDelete}
		<!-- `onmousedown` preventing default is what keeps this button working outside
		     Chromium. The row is shown only while the box has focus, upstream's
		     `ButtonStates` group; focus leaving the input therefore unmounts the button.
		     Chromium focuses a `<button>` on mousedown, so the `focusin` that follows
		     cancels the `focusout` and the click still lands — Firefox and Safari do not,
		     so the button is gone before `click` fires and the box never clears. Measured
		     on Svelte 5.57.0 by blurring the input with nothing else taking focus.
		     Preventing the default keeps focus on the input, which is also what upstream's
		     `IsTabStop="False"` says this button is: not a focus target at all. -->
		<button
			type="button"
			class="delete"
			tabindex="-1"
			aria-label="Clear text"
			onmousedown={(event) => event.preventDefault()}
			onclick={clear}
		></button>
	{/if}
</div>

<style>
	.root {
		display: flex;
		align-items: stretch;
		/* c1-allow: TextBox_themeresources.xaml:193 binds MinWidth to
		   TextControlThemeMinWidth, which controls/dev defines nowhere. Measured 318px
		   on the same reference guest apps/gallery/src/lib/SearchBox.svelte records. */
		min-width: 318px;
		/* c1-allow: TextBox_themeresources.xaml:192 binds MinHeight to
		   TextControlThemeMinHeight, which controls/dev defines only for compact
		   density. Measured 32px on the same reference guest
		   apps/gallery/src/lib/SearchBox.svelte records. */
		min-height: 32px;
		padding: var(--winui-TextControlThemePadding);
		border-style: solid;
		/* Both `TextControlBorderBrush` and `TextControlBorderBrushFocused` are gradients
		   (aliases onto `TextControlElevationBorderBrush` and `…FocusedBrush`). A gradient
		   named as a `border-color` is invalid CSS and silently dropped — the same reason
		   Button.svelte carries its own transparent border. The two-layer background form
		   SearchBox already uses carries the gradient under a transparent border, with the
		   fill clipped to `padding-box` and the gradient to `border-box`.
		   `BackgroundSizing="InnerBorderEdge"` upstream sets that clip. */
		border-color: transparent;
		border-width: var(--winui-TextControlBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		background:
			linear-gradient(var(--winui-TextControlBackground), var(--winui-TextControlBackground))
				padding-box,
			var(--winui-TextControlBorderBrush) border-box;
		color: var(--winui-TextControlForeground);
	}

	.root:hover {
		background:
			linear-gradient(
					var(--winui-TextControlBackgroundPointerOver),
					var(--winui-TextControlBackgroundPointerOver)
				)
				padding-box,
			var(--winui-TextControlBorderBrushPointerOver) border-box;
		color: var(--winui-TextControlForegroundPointerOver);
	}

	.root:focus-within {
		border-width: var(--winui-TextControlBorderThemeThicknessFocused);
		background:
			linear-gradient(
					var(--winui-TextControlBackgroundFocused),
					var(--winui-TextControlBackgroundFocused)
				)
				padding-box,
			var(--winui-TextControlBorderBrushFocused) border-box;
		color: var(--winui-TextControlForegroundFocused);
	}

	.root textarea,
	.root input {
		flex: 1 1 auto;
		min-width: 0;
		border: 0;
		background: transparent;
		padding: 0;
		font: inherit;
		color: inherit;
		outline: none;
		line-height: normal;
	}

	.root textarea {
		resize: vertical;
	}

	.root textarea::placeholder,
	.root input::placeholder {
		color: var(--winui-TextControlPlaceholderForeground);
	}

	.root:hover textarea::placeholder,
	.root:hover input::placeholder {
		color: var(--winui-TextControlPlaceholderForegroundPointerOver);
	}

	.root:focus-within textarea::placeholder,
	.root:focus-within input::placeholder {
		color: var(--winui-TextControlPlaceholderForegroundFocused);
	}

	.root textarea::selection,
	.root input::selection {
		background: var(--winui-TextControlSelectionHighlightColor);
	}

	/* The `data-disabled` rules are written last so they win over `:hover` and
	   `:focus-within`: a disabled box must not light up under the pointer or gain
	   focus styling. `data-disabled` is on the root rather than `:disabled` because
	   `:disabled` matches a form control and the root is a `<div>`. */
	.root[data-disabled] {
		background:
			linear-gradient(
					var(--winui-TextControlBackgroundDisabled),
					var(--winui-TextControlBackgroundDisabled)
				)
				padding-box,
			var(--winui-TextControlBorderBrushDisabled) border-box;
		color: var(--winui-TextControlForegroundDisabled);
		cursor: default;
	}

	.root[data-disabled] textarea::placeholder,
	.root[data-disabled] input::placeholder {
		color: var(--winui-TextControlPlaceholderForegroundDisabled);
	}

	.root[data-disabled] textarea,
	.root[data-disabled] input {
		cursor: default;
	}

	/* The delete button. `Width="30"` and `VerticalAlignment="Stretch"` upstream land
	   a 30-wide, full-height column the glyph is centred in.

	   `TextControlButtonBackground` is one of the framework-dictionary names undefined
	   in the pin, and the original draws no fill at rest — `background: transparent`
	   is what the source says.

	   `HelperButtonThemePadding` is likewise undefined and has no visible effect here:
	   the glyph is centred in a fixed 30-wide, full-height button, so a padding that
	   would offset the glyph within the button is a padding that nothing reads. */
	.delete {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		padding: 0;
		border: 0;
		border-radius: var(--winui-ControlCornerRadius);
		background: transparent;
		color: var(--winui-TextControlButtonForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-TextBoxIconFontSize);
		line-height: normal;
		cursor: pointer;
	}

	/* The fill lives on `::before` rather than on the button itself so the inner
	   margin and the rounded corners track the source: `TextBoxButtonStates` sets the
	   background on a child element with `TextBoxInnerButtonMargin` and
	   `ControlCornerRadius`, and putting the margin on the button would shrink the
	   radius the way SearchBox records. */
	.delete::before {
		content: '';
		position: absolute;
		inset: var(--winui-TextBoxInnerButtonMargin);
		border-radius: var(--winui-ControlCornerRadius);
	}

	.delete::after {
		content: '\00e894';
		position: relative;
	}

	.delete:hover::before {
		background: var(--winui-TextControlButtonBackgroundPointerOver);
	}

	.delete:active::before {
		background: var(--winui-TextControlButtonBackgroundPressed);
	}

	.delete:hover {
		color: var(--winui-TextControlButtonForegroundPointerOver);
	}

	.delete:active {
		color: var(--winui-TextControlButtonForegroundPressed);
	}
</style>
