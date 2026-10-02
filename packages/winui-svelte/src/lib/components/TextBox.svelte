<script lang="ts" module>
	import type { Snippet } from 'svelte';

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
		/** Header. A string or a snippet; nothing is rendered when it is not given. */
		header?: Snippet | string;
		/** Description. A string or a snippet; nothing is rendered when it is not given. */
		description?: Snippet | string;
		class?: string;
		style?: string;
		ref?: HTMLInputElement | HTMLTextAreaElement | null;
		[key: string]: unknown;
	}

	// Two WinUI members are deliberately absent, and a plain comment says so rather
	// than a `/** */` one: a doc comment here would attach itself to `placeholder` below
	// and a consumer hovering that prop would be told about one of them.
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
		header,
		description,
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

<div class={['root', className]} {style} data-disabled={disabled || undefined} {...rest}>
	{#if header !== undefined}
		<span class="header">
			{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
		</span>
	{/if}
	<div
		class="box"
		data-multiline={acceptsReturn}
		onfocusin={() => (focused = true)}
		onfocusout={() => (focused = false)}
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
			<!-- `autocomplete="off"`, as AutoSuggestBox carries it: the browser's history of a field
			     is a drop-down no WinUI text control has. -->
			<input
				bind:this={ref}
				type="text"
				autocomplete="off"
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
	<!-- Upstream marks the `DescriptionPresenter` `AutomationProperties.AccessibilityView="Raw"`
	     (`TextBox_themeresources.xaml:339`), which keeps the description out of the control's
	     accessibility view; no `aria-describedby` on the input here, for the same reason. -->
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
		/* TextBox_themeresources.xaml:193 binds MinWidth to this token, 64 in all three themes.
		   Above it, a content-sized box is as wide as its text element's default rather than its
		   content (WD-100). */
		min-width: var(--winui-TextControlThemeMinWidth);
		/* TextBox_themeresources.xaml:192 binds MinHeight to this token. */
		min-height: var(--winui-TextControlThemeMinHeight);
		padding: var(--winui-TextControlThemePadding);
		border-style: solid;
		/* Both `TextControlBorderBrush` and `TextControlBorderBrushFocused` are gradients
		   (aliases onto `TextControlElevationBorderBrush` and `…FocusedBrush`). A gradient
		   named as a `border-color` is invalid CSS and silently dropped — the same reason
		   Button.svelte carries its own transparent border. The gradient is painted by
		   `.box::after` so it sits on the ring alone — a two-layer background clipped to
		   `border-box` paints across the whole element rather than across the ring. The
		   fill on the element clips to `padding-box` and `BackgroundSizing="InnerBorderEdge"`
		   upstream sets that clip. */
		border-color: transparent;
		border-width: var(--winui-TextControlBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-TextControlBackground) padding-box;
		color: var(--winui-TextControlForeground);
	}

	/* The border brush is a gradient, and a gradient cannot be a `border-color`. It used to be
	   a second background layer clipped to `border-box`, which paints across the whole element
	   rather than across the ring. This paints it on the ring alone.

	   `inset` is the negative border width because an absolutely positioned child is placed
	   against its parent's padding box; backing it out by exactly the border width makes the
	   ring's box the parent's border box, so `border-radius: inherit` puts the two curves on
	   top of each other with no correction.

	   The mask is two layers, the inner one clipped to the content box, composited so the
	   content box is punched out. `-webkit-mask-composite: xor` is the same operation under
	   the prefixed property, which is what Safari reads. */
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

	/* Row 0 of `TextBox_themeresources.xaml:326`: the header presenter above the box, with its
	   `Margin="{ThemeResource TextBoxTopHeaderMargin}"` and `Foreground="{ThemeResource
	   TextControlHeaderForeground}"`. `TextWrapping="Wrap"` upstream maps to `white-space:
	   normal` here; `FontWeight="Normal"` is the inherited default, and a declaration
	   restating it is a value no token can change. */
	.header {
		margin: var(--winui-TextBoxTopHeaderMargin);
		color: var(--winui-TextControlHeaderForeground);
		white-space: normal;
	}

	/* Row 2 of `TextBox_themeresources.xaml:339`: the description presenter below the box, with
	   `Foreground="{ThemeResource SystemControlDescriptionTextForegroundBrush}"` and no margin.
	   One colour in every state, including disabled — upstream's template never overrides it. */
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
	   1px` — negated, and they are written out because `calc()` cannot negate a multi-value
	   shorthand. `inset: calc(-1 * var(…))` against that token is invalid, so the declaration
	   is dropped and the ring falls back to its static position: measured at
	   `5px 566px 35px 10px`, which is nowhere, and the focused border vanished entirely. The
	   resting rule above can use `calc()` because `TextControlBorderThemeThickness` is the
	   uniform `1px`; the day it is not, it breaks the same way and silently, because `inset`
	   is not a property C1 checks. */
	.root:focus-within .box::after {
		inset: -1px -1px -2px -1px;
		padding: var(--winui-TextControlBorderThemeThicknessFocused);
		background: var(--winui-TextControlBorderBrushFocused);
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
		/* Kept where AutoSuggestBox's twin was deleted, and the difference is the root: that
		   control carries `winui-BodyTextBlockStyle` and this one does not, so `font: inherit`
		   here resolves against the consumer's page rather than against a ramp class inside the
		   library. A WinUI TextBox draws its text at the font's own spacing whatever surrounds
		   it, and this is what says so. ADR 0011. */
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
	   `:disabled` matches a form control and the root is a `<div>`; the header sits on the
	   root and not the box, so its disabled colour needs the same hook. */
	.root[data-disabled] .box {
		background: var(--winui-TextControlBackgroundDisabled) padding-box;
		color: var(--winui-TextControlForegroundDisabled);
		cursor: default;
	}
	.root[data-disabled] .box::after {
		background: var(--winui-TextControlBorderBrushDisabled);
	}

	.root[data-disabled] textarea::placeholder,
	.root[data-disabled] input::placeholder {
		color: var(--winui-TextControlPlaceholderForegroundDisabled);
	}

	.root[data-disabled] textarea,
	.root[data-disabled] input {
		cursor: default;
	}

	/* No `.root[data-disabled] .description` rule: the description's colour is the same in every
	   state, including disabled — `TextBox_themeresources.xaml` never overrides it. */
	.root[data-disabled] .header {
		color: var(--winui-TextControlHeaderForegroundDisabled);
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
	   radius. (That last clause used to credit a deleted `SearchBox` component for the
	   measurement; the mechanism is the argument.) */
	.delete::before {
		content: '';
		position: absolute;
		inset: var(--winui-TextBoxInnerButtonMargin);
		border-radius: var(--winui-ControlCornerRadius);
	}

	.delete::after {
		content: '\00e894' / '';
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
