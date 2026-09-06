<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface AutoSuggestBoxProps {
		/** Text. */
		value?: string;
		onValueChange?: (value: string) => void;
		/** ItemsSource, narrowed to the text suggestions this unit renders. Filtering is
		 *  the consumer's responsibility — WinUI raises `TextChanged` and the app sets
		 *  `ItemsSource`; this component renders `suggestions` as given. */
		suggestions?: string[];
		/** IsSuggestionListOpen. */
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		/** QuerySubmitted, raised by Enter or by the query button. */
		onQuerySubmitted?: (query: string) => void;
		/** SuggestionChosen. */
		onSuggestionChosen?: (suggestion: string) => void;
		/** PlaceholderText. */
		placeholder?: string;
		/** QueryIcon, as the glyph's code point — `'E721'` is Search. The query button is
		 *  rendered only when this is given, which is what the template's `QueryIcon`
		 *  binding amounts to. */
		queryIcon?: string;
		/** IsEnabled, inverted — ADR 0009. */
		disabled?: boolean;
		/** Header. A string or a snippet. */
		header?: Snippet | string;
		/** Description. A string or a snippet. */
		description?: Snippet | string;
		class?: string;
		style?: string;
		/** The `<input>`, not the root — ADR 0009's `ref` points at the interactive
		 *  element. */
		ref?: HTMLInputElement | null;
		[key: string]: unknown;
	}

	// Three WinUI members are deliberately absent, and a plain comment names them rather
	// than a `/** */` one: a doc comment here would attach itself to `queryIcon` below and
	// a consumer hovering that prop would be told about one of them.
	//
	// `LightDismissOverlayMode` and `AutoSuggestBoxLightDismissOverlayBackground`. The
	// light-dismiss overlay this control does not build.
	//
	// `ItemTemplate` and `ItemsSource` of non-text items. Suggestions are strings here; a
	// template that paints anything else is its own control and the `suggestions` prop
	// above is the text-only narrowing.
	//
	// `TextChanged` and the filtering it triggers. WinUI raises it; this component renders
	// `suggestions` as given. A consumer who needs to filter sets `suggestions` from a
	// `$derived` on `value` and the absence is invisible.
</script>

<script lang="ts">
	import { Combobox } from 'bits-ui';

	let {
		value = $bindable(''),
		onValueChange,
		suggestions = [],
		open = $bindable(false),
		onOpenChange,
		onQuerySubmitted,
		onSuggestionChosen,
		placeholder,
		queryIcon,
		disabled = false,
		header,
		description,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: AutoSuggestBoxProps = $props();

	// The suggestion list is as wide as the control, which is what
	// `AutoSuggestBox_themeresources.xaml:283` gets for free by putting the popup inside the
	// control's own grid. bits-ui anchors its content to `Combobox.Input`, and the input is
	// narrower than the box by the box's padding and its two buttons — measured 283 against
	// a 336 box — so `--bits-floating-anchor-width` is the wrong number here and the box is
	// measured instead. The popup is portalled to the body, so the value cannot be inherited
	// through a custom property and is merged into the element's own `style` below.
	// bits-ui types a `child` snippet's props as `Record<string, unknown>`, so a handler it
	// put on the element is `unknown` and cannot be called without saying what it is. This
	// says it in one place rather than at every call site.
	const chain = <E extends Event>(handler: unknown, event: E) =>
		(handler as ((event: E) => void) | undefined)?.(event);

	let boxWidth = $state(0);
	let boxEl = $state<HTMLDivElement | null>(null);

	// bits-ui centres the content on its anchor, and for a Combobox the anchor is the
	// `<input>`, not the control. `align="start"` puts the popup's left edge on the input's;
	// this offset moves it the rest of the way to the box's, which is where upstream's popup
	// sits because it is a child of the control's own grid. The number is the box's left
	// border plus its left padding, read off the elements rather than written down, so a
	// re-pin that changes `TextControlThemePadding` carries it.
	const alignOffset = $derived.by(() => {
		if (!open || !boxEl) return 0;
		const input = boxEl.querySelector('input');
		if (!input) return 0;
		return -(input.getBoundingClientRect().left - boxEl.getBoundingClientRect().left);
	});

	// bits-ui's `Combobox.Root` takes items as `value`/`label` pairs; the narrowing
	// `suggestions: string[]` becomes that pair with the same string in both fields.
	const items = $derived(
		suggestions.map((suggestion) => ({ value: suggestion, label: suggestion }))
	);

	// The delete button. The upstream `ButtonStates` group at
	// `AutoSuggestBox_themeresources.xaml:211` toggles `DeleteButton.Visibility` on the
	// box being non-empty, with focus not a condition — the same shape PasswordBox's
	// reveal button carries, and the same reason focus is irrelevant here.
	const showDelete = $derived(value !== '' && !disabled);

	function clear() {
		value = '';
		onValueChange?.('');
		ref?.focus();
	}

	function submit() {
		onQuerySubmitted?.(value);
	}
</script>

<div
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	data-disabled={disabled || undefined}
	{...rest}
>
	{#if header !== undefined}
		<span class="header">
			{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
		</span>
	{/if}
	<!-- `value` is WinUI's `Text` — the text in the box — so it binds `inputValue`, not
	     `value`. bits-ui's `value` is the *selected item*, which is WinUI's
	     `ChosenSuggestion`: choosing one raises `onSuggestionChosen` and, as upstream does,
	     puts the suggestion's text in the box. Binding `value` to the selection instead is
	     the mistake that renders a box showing its placeholder while its delete button says
	     there is something to delete.

	     `inputValue` is passed, not bound: the primitive declares it non-bindable, which
	     `pnpm check` says plainly and the browser does not — typing updated the DOM and left
	     `value` behind. So the text comes back the way TextBox's does, from the element's own
	     `oninput`, and the primitive's handler is called first so its filtering and its open
	     state still see every keystroke. -->
	<Combobox.Root
		type="single"
		inputValue={value}
		onValueChange={(chosen) => {
			if (!chosen) return;
			value = chosen;
			onValueChange?.(chosen);
			onSuggestionChosen?.(chosen);
		}}
		bind:open={
			() => open,
			(next) => {
				open = next;
				onOpenChange?.(next);
			}
		}
		{items}
		{disabled}
	>
		<div class="box" bind:this={boxEl} bind:offsetWidth={boxWidth}>
			<Combobox.Input {placeholder}>
				{#snippet child({ props })}
					<!-- Every element the primitive would render is rendered here instead,
					     through its `child` snippet — the escape ADR 0004 names first. See
					     ComboBox.svelte:114 for the rationale. -->
					<!-- Both handlers call the primitive's first and then add to it. Written the
					     other way round — `{...props}` and then a bare `onkeydown` — the later
					     attribute replaces the one bits-ui put there, and the arrow keys stop
					     moving through the suggestions and Escape stops closing the list, with
					     nothing failing loudly enough to notice. -->
					<input
						{...props}
						bind:this={ref}
						class="input"
						oninput={(event) => {
							chain(props.oninput, event);
							value = event.currentTarget.value;
							onValueChange?.(value);
						}}
						onkeydown={(event) => {
							chain(props.onkeydown, event);
							if (event.key === 'Enter') submit();
						}}
					/>
				{/snippet}
			</Combobox.Input>
			{#if showDelete}
				<!-- `onmousedown` preventing default is what keeps this button working
				     outside Chromium. Cited rather than restated: TextBox.svelte:109 records
				     the full measurement. -->
				<button
					type="button"
					class="delete"
					tabindex="-1"
					aria-label="Clear text"
					onmousedown={(event) => event.preventDefault()}
					onclick={clear}
				></button>
			{/if}
			{#if queryIcon !== undefined}
				<!-- Same shape as the delete button: `onmousedown` preventDefault keeps it
				     working outside Chromium (TextBox.svelte:109), and `tabindex="-1"` says
				     what upstream's `IsTabStop="False"` says — not a focus target. The glyph
				     lives in the DOM rather than in `::after` so a hex string the consumer
				     supplies reaches the rendered text without escaping it in CSS. -->
				<button
					type="button"
					class="query"
					tabindex="-1"
					aria-label="Submit query"
					onmousedown={(event) => event.preventDefault()}
					onclick={submit}>{String.fromCodePoint(parseInt(queryIcon, 16))}</button
				>
			{/if}
		</div>
		<Combobox.Portal>
			<Combobox.Content align="start" {alignOffset}>
				{#snippet child({ props, wrapperProps })}
					<!-- `wrapperProps` is the outer wrapper Floating UI positions; pass it
					     through first, untouched. The popup's own border, background and
					     corner live on `props` and reach the `<div>` this control writes.
					     The same shape ComboBox uses; see ComboBox.svelte:144 — including the
					     type ramp class on the popup, which a portalled element has to carry
					     itself because CSS inheritance follows the DOM and the portal moves
					     it out of the root. -->
					<div {...wrapperProps}>
						<div
							{...props}
							class={['popup', 'winui-BodyTextBlockStyle']}
							style={`${props.style ?? ''};min-width:${boxWidth}px`}
						>
							<Combobox.Viewport>
								{#snippet child({ props })}
									<div {...props} class="list">
										<!-- The suggestion rows are `ListViewItem`s in the source,
										     and this library has no ListView yet, so the rows here
										     are this control's own — styled from the
										     `ComboBoxItem*` families ComboBox's items already
										     reach. A real ListView in the Collections tranche is
										     what would replace them; read the keys directly while
										     there is one. -->
										{#each items as item (item.value)}
											<Combobox.Item value={item.value} label={item.label}>
												{#snippet child({ props })}
													<div
														{...props}
														class="item"
														onclick={() => onSuggestionChosen?.(item.label)}
													>
														<span class="item-content">{item.label}</span>
													</div>
												{/snippet}
											</Combobox.Item>
										{/each}
									</div>
								{/snippet}
							</Combobox.Viewport>
						</div>
					</div>
				{/snippet}
			</Combobox.Content>
		</Combobox.Portal>
	</Combobox.Root>
	{#if description !== undefined}
		<span class="description">
			{#if typeof description === 'string'}{description}{:else}{@render description()}{/if}
		</span>
	{/if}
</div>

<style>
	.root {
		display: inline-flex;
		flex-direction: column;
		position: relative;
	}

	/* The header presenter: `AutoSuggestBox_themeresources.xaml:238` carries
	   `Margin="{ThemeResource AutoSuggestBoxTopHeaderMargin}"` and
	   `Foreground="{ThemeResource TextControlHeaderForeground}"`. `TextWrapping="Wrap"`
	   maps to `white-space: normal`. The header reads through the same `TextControl*`
	   family the box does, for the reason the source applies both to the same
	   `TextControlThemeFontFamily` and the same `ControlContentThemeFontSize`. */
	.header {
		margin: var(--winui-AutoSuggestBoxTopHeaderMargin);
		color: var(--winui-TextControlHeaderForeground);
		white-space: normal;
	}

	/* The box: `AutoSuggestBoxTextBoxStyle` at AutoSuggestBox_themeresources.xaml:29 sets
	   `Foreground`, `Background`, `BorderBrush`, `BorderThickness` and `Padding` to the
	   same `TextControl*` resources TextBox reads — so the four states paint the same
	   brushes, and the styles here are TextBox's, repeated.

	   The TextBox tranche records why the box's border is transparent and the gradient
	   is painted on `::after`: the source brushes are gradients, and a gradient named as a
	   `border-color` is invalid CSS. See TextBox.svelte:159. */
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
		/* c1-allow: TextBox_themeresources.xaml:193 binds MinWidth to
		   TextControlThemeMinWidth, which controls/dev defines nowhere. Measured 318px on
		   a capture of the real Gallery's AutoSuggestBox, apps/gallery/src/lib/SearchBox.svelte
		   records. */
		min-width: 318px;
		/* c1-allow: TextBox_themeresources.xaml:192 binds MinHeight to
		   TextControlThemeMinHeight, which controls/dev defines only for compact density.
		   Measured 32px on the same reference guest
		   apps/gallery/src/lib/SearchBox.svelte records. */
		min-height: 32px;
		border-style: solid;
		border-color: transparent;
		border-width: var(--winui-TextControlBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-TextControlBackground) padding-box;
		color: var(--winui-TextControlForeground);
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

	.root:hover .box {
		background: var(--winui-TextControlBackgroundPointerOver) padding-box;
		color: var(--winui-TextControlForegroundPointerOver);
	}
	.root:hover .box::after {
		background: var(--winui-TextControlBorderBrushPointerOver);
	}

	/* AutoSuggestBox_themeresources.xaml:262 binds `UseSystemFocusVisuals` to
	   `IsApplicationFocusVisualKindReveal`, the same resource TextBox's own template at
	   TextBox_themeresources.xaml:195 binds. The framework dictionary defines it as
	   `False` in all three themes, so the box opts out of the system focus visual and
	   draws its own on the focused border — the same shape TextBox's `focus-within`
	   rules paint, and the same reason no extra ring is needed. The four `inset` values
	   mirror `TextControlBorderThemeThicknessFocused` — `1px 1px 2px 1px` — negated;
	   `calc()` cannot negate a multi-value shorthand, so they are written out. See
	   TextBox.svelte:236 for the measurement. */
	.root:focus-within .box {
		border-width: var(--winui-TextControlBorderThemeThicknessFocused);
		background: var(--winui-TextControlBackgroundFocused) padding-box;
		color: var(--winui-TextControlForegroundFocused);
	}
	.root:focus-within .box::after {
		inset: -1px -1px -2px -1px;
		padding: var(--winui-TextControlBorderThemeThicknessFocused);
		background: var(--winui-TextControlBorderBrushFocused);
	}

	/* The `<input>` itself: `flex: 1 1 auto` so the text takes the row, `min-width: 0` so
	   long strings can ellipsise past the buttons to their right, `font: inherit` so the
	   `<input>` paints in the root's family, and `outline: none` because the focused
	   border is the box's, not the input's. */
	.input {
		/* The padding belongs to the input, not to the box, and that is not a stylistic
		   choice. Upstream puts `TextControlThemePadding` on the `TextBox` inside the
		   control — `AutoSuggestBoxTextBoxStyle` — and the two buttons are its siblings
		   outside that padding. Put it on the box instead and the query button's
		   `Height="28"` at :242 stacks with it: measured 41px against the original's 32 on
		   the reference guest, with the search box in the Gallery's own title bar. */
		padding: var(--winui-TextControlThemePadding);
		flex: 1 1 auto;
		min-width: 0;
		border: 0;
		background: transparent;
		font: inherit;
		color: inherit;
		outline: none;
		line-height: normal;
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

	/* The delete button. `DeleteButton` at AutoSuggestBox_themeresources.xaml:241 carries
	   `Width="32"`, `VerticalAlignment="Stretch"`, and the same `Padding` and `CornerRadius`
	   the helper button reaches. The `DeleteButtonStyle` at :50 paints a `ButtonLayoutGrid`
	   whose `Margin` is `AutoSuggestBoxDeleteButtonMargin` (`0,4`) and whose
	   `Background` aliases `TextControlButtonBackground`, which the dictionary resolves
	   to transparent — so the button paints no fill at rest, the same shape TextBox's
	   delete button and PasswordBox's reveal button carry. At rest is not the whole
	   story: `PointerOver` and `Pressed` in the same template put a real brush on that
	   grid, and it is the grid — inset by the margin, not the button's own box — that
	   the fill is painted on. `.delete::before` below is that grid.

	   `AutoSuggestBoxLeftButtonMargin` (`3`) is the spacer column between the input and
	   the delete button. It is read as a left margin so the button sits where the grid
	   column it occupies in the source would land it. */
	.delete {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		/* c1-allow: AutoSuggestBox_themeresources.xaml:241, `DeleteButton` `Width="32"` */
		width: 32px;
		padding: 0;
		border: 0;
		border-radius: var(--winui-ControlCornerRadius);
		background: transparent;
		color: var(--winui-TextControlButtonForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-AutoSuggestBoxIconFontSize);
		line-height: normal;
		cursor: pointer;
		margin-left: var(--winui-AutoSuggestBoxLeftButtonMargin);
	}

	/* `ButtonLayoutGrid` at AutoSuggestBox_themeresources.xaml:54 — the element the two
	   state brushes are animated onto. Its `Margin` is `AutoSuggestBoxDeleteButtonMargin`
	   and its `CornerRadius` is `ControlCornerRadius`, so the fill is inset from the
	   button's box rather than filling it. TextBox.svelte:355 is the same shape against
	   `TextBoxInnerButtonMargin`. */
	.delete::before {
		content: '';
		position: absolute;
		inset: var(--winui-AutoSuggestBoxDeleteButtonMargin);
		border-radius: var(--winui-ControlCornerRadius);
	}

	/* The glyph: `&#xE894;` from `DeleteButtonStyle` at
	   `AutoSuggestBox_themeresources.xaml:91` — the Cancel glyph from Segoe Fluent Icons,
	   at `AutoSuggestBoxIconFontSize` (12). */
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

	/* The query button. `QueryButton` at AutoSuggestBox_themeresources.xaml:242 carries
	   `Width="32"`, `Height="28"`, `Margin="2,0,0,0"` and the same padding and corner
	   radius the delete button reaches. The `QueryButtonStyle` at :97 paints a
	   `ContentPresenter` whose `Background` aliases the same `TextControlButtonBackground`
	   and whose `Margin` is `AutoSuggestBoxInnerButtonMargin` — so the button paints no
	   fill at rest, the same as the delete button. The button is rendered only when the
	   consumer supplies a `queryIcon`, which is what the template's `QueryIcon` binding
	   amounts to.

	   The fill is painted on `::before` rather than on the button itself so the inner
	   margin and the rounded corners track the source. See SearchBox.svelte:166 for the
	   measurement. */
	.query {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		/* c1-allow: AutoSuggestBox_themeresources.xaml:242, `QueryButton` `Width="32"` */
		width: 32px;
		/* c1-allow: AutoSuggestBox_themeresources.xaml:242, `QueryButton` `Height="28"` */
		height: 28px;
		/* c1-allow: AutoSuggestBox_themeresources.xaml:242, `QueryButton` `Margin="2,0,0,0"` */
		margin-left: 2px;
		padding: var(--winui-AutoSuggestBoxQueryButtonPadding);
		border: 0;
		border-radius: var(--winui-ControlCornerRadius);
		background: transparent;
		color: var(--winui-TextControlButtonForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-AutoSuggestBoxIconFontSize);
		line-height: normal;
		cursor: pointer;
	}

	.query::before {
		content: '';
		position: absolute;
		inset: var(--winui-AutoSuggestBoxInnerButtonMargin);
		border-radius: var(--winui-ControlCornerRadius);
	}

	.query:hover::before {
		background: var(--winui-TextControlButtonBackgroundPointerOver);
	}

	.query:active::before {
		background: var(--winui-TextControlButtonBackgroundPressed);
	}

	.query:hover {
		color: var(--winui-TextControlButtonForegroundPointerOver);
	}

	.query:active {
		color: var(--winui-TextControlButtonForegroundPressed);
	}

	/* The popup: the `SuggestionsContainer` Border at
	   AutoSuggestBox_themeresources.xaml:283 carries the popup's `Padding`,
	   `BorderThickness`, `BorderBrush`, `Background` and `CornerRadius` from the
	   AutoSuggestBox's own resources, in that order. The `Margin="0,-0.5,0,-1"` upstream
	   is a half-pixel nudge for XAML's popup placement and is not reproduced here: bits-ui
	   positions the content with Floating UI and a negative fractional margin against a
	   different positioner is noise, not fidelity. `OverlayCornerRadius` is the popup's
	   own corner — distinct from the box's `ControlCornerRadius`.

	   `min-width` is the one thing the popup takes from outside its own resources. The
	   `ScrollViewer` at :591 — no, the popup's `MaxWidth` upstream binds to the editable
	   text box's own width, which WinUI computes as `TextControlThemeMinWidth` for a
	   box narrower than that. bits-ui publishes the input's measured width on the content
	   as `--bits-floating-anchor-width`, and `max()` against `TextControlThemeMinWidth`
	   keeps the 64 the source states as the floor. Without this the popup shrinks to
	   its longest item and the control looks nothing like the original. */
	.popup {
		background: var(--winui-AutoSuggestBoxSuggestionsListBackground);
		border-style: solid;
		border-width: var(--winui-AutoSuggestListBorderThemeThickness);
		border-color: var(--winui-AutoSuggestBoxSuggestionsListBorderBrush);
		padding: var(--winui-AutoSuggestListMargin);
		border-radius: var(--winui-OverlayCornerRadius);
		color: var(--winui-ComboBoxDropDownForeground);
		max-height: var(--winui-AutoSuggestListMaxHeight);
	}

	/* The list: the `ListView` at AutoSuggestBox_themeresources.xaml:286 carries
	   `Margin="{ThemeResource AutoSuggestListPadding}"` — the gap between the popup's
	   border and the items. */
	.list {
		display: flex;
		flex-direction: column;
		margin: var(--winui-AutoSuggestListPadding);
		min-width: 0;
	}

	/* The item: read through the `ComboBoxItem*` brushes ComboBox's items already reach,
	   because this control has no `AutoSuggestListViewItem*` family and the
	   `ComboBoxItem*` family is what `DefaultListViewItemStyle` paints under the same
	   names upstream. The same `Margin`, `CornerRadius`, `Padding` and eight brushes
	   ComboBox's items use — see ComboBox.svelte:345 for the upstream references. */
	.item {
		position: relative;
		display: flex;
		align-items: center;
		/* c1-allow: ComboBox_themeresources.xaml:614, the item's `LayoutRoot` carries
		   `Margin="5,2,5,2"` — XAML writes left,top,right,bottom and CSS writes
		   top,right,bottom,left. The same margin ComboBox's items carry. */
		margin: 2px 5px;
		padding: var(--winui-ComboBoxItemThemePadding);
		border-radius: var(--winui-ComboBoxItemCornerRadius);
		background: var(--winui-ComboBoxItemBackground);
		color: var(--winui-ComboBoxItemForeground);
		cursor: pointer;
	}

	.item-content {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Items: PointerOver (`data-highlighted` is bits-ui's hover/active key) — the same
	   rule ComboBox's items use. */
	.item[data-highlighted] {
		background: var(--winui-ComboBoxItemBackgroundPointerOver);
		color: var(--winui-ComboBoxItemForegroundPointerOver);
	}

	/* Items: Pressed. */
	.item:active {
		background: var(--winui-ComboBoxItemBackgroundPressed);
		color: var(--winui-ComboBoxItemForegroundPressed);
	}

	/* Items: Selected — `data-selected` is bits-ui's selection key, and the same shape
	   ComboBox uses. */
	.item[data-selected] {
		background: var(--winui-ComboBoxItemBackgroundSelected);
		color: var(--winui-ComboBoxItemForegroundSelected);
	}

	/* The focus visual for the popup items. The ComboBox focus visual at
	   ComboBox.svelte:434 is the model; `FocusVisualMargin="-3"` upstream at
	   ComboBox_themeresources.xaml:609 puts the band three pixels outside the item's
	   border box. */
	.item:focus-visible {
		outline: none;
	}

	.list:has(.item:focus-visible)::before {
		content: '';
		position: absolute;
		/* c1-allow: ComboBox_themeresources.xaml:609, `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: the same 3px vertical offset ComboBox carries, so the band stays
		   concentric with the item's own corner */
		border-radius: calc(var(--winui-ComboBoxItemCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* The description: `DescriptionPresenter` at AutoSuggestBox_themeresources.xaml:243
	   carries `Foreground="{ThemeResource SystemControlDescriptionTextForegroundBrush}"`
	   and no margin. One colour in every state, including disabled — upstream's template
	   never overrides it. */
	.description {
		color: var(--winui-SystemControlDescriptionTextForegroundBrush);
		white-space: normal;
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
	   in every state, including disabled — `AutoSuggestBox_themeresources.xaml` never
	   overrides it. */
</style>
