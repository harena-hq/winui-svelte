<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ComboBoxItemData {
		/** SelectedValue. Also the key the list is rendered by. */
		value: string;
		/**
		 * The item's content, when it is text, and its accessible name and typeahead key
		 * whether it is or not — `itemTemplate` replaces an item's appearance, not its text.
		 */
		label: string;
		/** IsEnabled on the item, inverted — ADR 0009. */
		disabled?: boolean;
	}

	export interface ComboBoxProps {
		/** ItemsSource, narrowed to the text items this unit renders. */
		items?: ComboBoxItemData[];
		/** SelectedValue. */
		value?: string;
		onValueChange?: (value: string) => void;
		/**
		 * ItemTemplate. Renders one item's content, in the trigger and in every list row.
		 * Absent, an item renders as its `label`.
		 */
		itemTemplate?: Snippet<[ComboBoxItemData, number]>;
		/** IsDropDownOpen. */
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		/** PlaceholderText. */
		placeholder?: string;
		/** IsEnabled, inverted to HTML's attribute — ADR 0009. */
		disabled?: boolean;
		/** Header. A string or a snippet. */
		header?: Snippet | string;
		/** Description. A string or a snippet. */
		description?: Snippet | string;
		/** Name and IsRequired, for a form. */
		name?: string;
		required?: boolean;
		class?: string;
		style?: string;
		/**
		 * The trigger `<button>`, not the root — ADR 0009's `ref` points at the interactive
		 * element. The root is the outer `<div>` the header and description sit on.
		 */
		ref?: HTMLButtonElement | null;
		[key: string]: unknown;
	}

	// One WinUI member is deliberately absent, and a plain comment says so rather than
	// a `/** */` one: a doc comment here would attach itself to `disabled` below and a
	// consumer hovering that prop would be told about it.
	//
	// `IsEditable="True"` and the `EditableModeStates` group. The editable variant is a
	// separate unit; this control renders the non-editable one only.
</script>

<script lang="ts">
	import { Select } from 'bits-ui';

	let {
		items = [],
		value = $bindable(''),
		onValueChange,
		itemTemplate,
		open = $bindable(false),
		onOpenChange,
		placeholder,
		disabled = false,
		header,
		description,
		name,
		required = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ComboBoxProps = $props();

	// `bits-ui`'s Select uses a `value` typed as `string | undefined` upstream and the
	// component contract here narrows it to `string`. A consumer clearing the selection
	// passes `''`; the empty string is the only falsy value the trigger shows as "nothing
	// selected".
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
	<Select.Root
		type="single"
		bind:value={
			() => value,
			(next) => {
				value = next;
				onValueChange?.(next);
			}
		}
		bind:open={
			() => open,
			(next) => {
				open = next;
				onOpenChange?.(next);
			}
		}
		{items}
		{disabled}
		{required}
		{name}
	>
		<Select.Trigger>
			<!-- Every element the primitive would render is rendered here instead, through its
			     `child` snippet — the escape ADR 0004 names first. bits-ui hands back the props
			     it needs on the trigger (including the `aria-expanded`, `aria-controls` and the
			     `data-state` it writes) and this component supplies the element and the class.
			     Written the other way, with `class="…"` passed to the primitive, the class reaches
			     the DOM without this component's scope hash, every rule for it has to be hoisted
			     out of the selector, and `.trigger` then matches every element in the application
			     that shares that very ordinary name. -->
			{#snippet child({ props })}
				<button {...props} bind:this={ref} class="trigger">
					<Select.Value>
						{#snippet child({ props, selection })}
							<span {...props} class="value">
								{#if selection.type === 'single' && selection.selected}
									{@const selectedValue = selection.selected.value}
									{@const index = items.findIndex((item) => item.value === selectedValue)}
									{#if itemTemplate && index !== -1}
										{@render itemTemplate(items[index], index)}
									{:else}
										{selection.selected.label}
									{/if}
								{:else}
									<span class="placeholder">{placeholder ?? ''}</span>
								{/if}
							</span>
						{/snippet}
					</Select.Value>
					<!-- WD-006: the chevron is an `AnimatedIcon` whose `FallbackIconSource` at
					     ComboBox_themeresources.xaml:585 is a `FontIconSource` in
					     `SymbolThemeFontFamily` at `FontSize="12"` with `Glyph="&#xE70D;"`. Render
					     the fallback, no transition; see docs/divergences.md. -->
					<span class="chevron" aria-hidden="true"></span>
				</button>
			{/snippet}
		</Select.Trigger>
		<Select.Portal>
			<Select.Content>
				{#snippet child({ props, wrapperProps })}
					<!-- `wrapperProps` is the outer wrapper Floating UI positions; pass it through
					     first, untouched. The popup's own border, background and corner live on
					     `props` and reach the `<div>` this control writes.

					     The popup carries the type ramp class again because it is not inside
					     the root: the portal moves it to `<body>`, and CSS inheritance follows
					     the DOM. Upstream has no such break — the popup is part of the
					     ComboBox's template, so `FontFamily` and `FontSize` reach it by
					     property inheritance from `DefaultComboBoxStyle`. Without the class
					     here the rows render in the document's own font. -->
					<div {...wrapperProps}>
						<div {...props} class={['popup', 'winui-BodyTextBlockStyle']}>
							<Select.Viewport>
								{#snippet child({ props })}
									<div {...props} class="list">
										{#each items as item, index (item.value)}
											<Select.Item
												value={item.value}
												label={item.label}
												disabled={item.disabled ?? false}
											>
												{#snippet child({ props })}
													<!-- The `data-selected` and `data-highlighted` bits-ui writes
													     are the conditions the CSS keys off; the snippet only
													     adds the element and the class. -->
													<div {...props} class="item">
														<span class="pill" aria-hidden="true"></span>
														<span class="item-content">
															{#if itemTemplate}{@render itemTemplate(
																	item,
																	index
																)}{:else}{item.label}{/if}
														</span>
													</div>
												{/snippet}
											</Select.Item>
										{/each}
									</div>
								{/snippet}
							</Select.Viewport>
						</div>
					</div>
				{/snippet}
			</Select.Content>
		</Select.Portal>
	</Select.Root>
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

	/* Row 0 of `DefaultComboBoxStyle` at ComboBox_themeresources.xaml:569: the
	   `HeaderContentPresenter` carries `Margin="{ThemeResource ComboBoxTopHeaderMargin}"`
	   and `Foreground="{ThemeResource ComboBoxHeaderForeground}"` and
	   `FontWeight="{ThemeResource ComboBoxHeaderThemeFontWeight}"`. `LineHeight="20"` and
	   `TextWrapping="Wrap"` map to `line-height: 20px` and `white-space: normal`; the
	   wrapper itself is line-height-normal and inherits, so the rule sets the constant
	   explicitly. */
	.header {
		margin: var(--winui-ComboBoxTopHeaderMargin);
		color: var(--winui-ComboBoxHeaderForeground);
		font-weight: var(--winui-ComboBoxHeaderThemeFontWeight);
		/* c1-allow: ComboBox_themeresources.xaml:569, `LineHeight="20"` on the
		   `HeaderContentPresenter` */
		line-height: 20px;
		white-space: normal;
	}

	/* Row 1 of `DefaultComboBoxStyle` at ComboBox_themeresources.xaml:571: the
	   `Background` Border carries `MinWidth="{ThemeResource ComboBoxThemeMinWidth}"`,
	   `CornerRadius="{TemplateBinding CornerRadius}"` (the control's own
	   `ControlCornerRadius`), `BorderThickness="{TemplateBinding BorderThickness}"`
	   (`ComboBoxBorderThemeThickness`), `Background` and `BorderBrush` template-bound
	   to the four `ComboBoxBackground*` and `ComboBoxBorderBrush*` brushes. The
	   `ComboBoxMinHeight` and `ComboBoxPadding` template settings reach the same box.

	   The `Control.IsTemplateFocusTarget="True"` puts the focus visual on the box. The
	   trigger's own `:focus-visible` rule below reads as the focus visual.

	   `font-family: inherit` is what lets the `<button>` paint text in the same family the
	   root's `winui-BodyTextBlockStyle` brings in; a `<button>`'s default is the user
	   agent's. */
	.trigger {
		position: relative;
		display: inline-flex;
		align-items: center;
		min-width: var(--winui-ComboBoxThemeMinWidth);
		min-height: var(--winui-ComboBoxMinHeight);
		padding: var(--winui-ComboBoxPadding);
		border-style: solid;
		border-width: var(--winui-ComboBoxBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		font-family: inherit;
		font-size: inherit;
		text-align: left;
		cursor: pointer;
		color: inherit;
		background: var(--winui-ComboBoxBackground) padding-box;
		/* That Border writes no `BackgroundSizing`, and neither template file does — the
		   string does not occur in ComboBox_themeresources.xaml or in
		   ComboBox_themeresources_perf2026.xaml except on the popup, at :590 and :544 — so
		   the fill takes the property's default and stops at the inner border edge. CSS
		   stops it at the border box, hence `padding-box` above.

		   The brush is the harder half. `ComboBoxBorderBrush` and
		   `ComboBoxBorderBrushPointerOver` both alias `ControlElevationBorderBrush`, which
		   is a `LinearGradientBrush` upstream and a `linear-gradient(...)` in the token
		   layer (tokens.css:899). A gradient is not a `border-color`: `var()` defers the
		   check to computed-value time, the declaration is invalid there, and an invalid
		   non-inherited property falls back to its initial value — `currentColor`. So this
		   rule painted the trigger's own text colour on all four edges, and nothing said
		   so: the declaration names the right brush and is dropped after parsing. The
		   tracked baselines read 27 in light and 255 in dark where the brush composites to
		   228 and 47. The ring below paints it; this border only reserves its width.
		   Button.svelte:79 and TextBox.svelte:170 carry the same pair. */
		border-color: transparent;
	}

	/* The border brush on the ring alone. `inset` is the border width negated, so this box —
	   placed against the trigger's padding box, as an absolutely positioned child is — lands on
	   the trigger's border box, and `border-radius: inherit` puts the two curves on top of each
	   other. The two mask layers are composited so the content box is punched out.
	   Button.svelte:117 describes the technique in full.

	   Which stop lands on which edge differs between the themes, and that is upstream's:
	   generic.xaml:2146 defines the brush under `Default` running `StartPoint="0,0"` to
	   `EndPoint="0,3"` with no transform, so `ControlStrokeColorSecondary` sits along the top,
	   and generic.xaml:7747 defines it under `Light` with a `ScaleTransform ScaleY="-1"` that
	   flips it to the bottom. The token layer mirrors that — `to bottom` at tokens.css:3094,
	   `to top` at tokens.css:899 — and the baselines now show it: on the seven triggers that
	   take the gradient, light reads 228 on three edges and 204 along the bottom, dark 47 on
	   three and 53 along the top. The eighth is the disabled one, whose brush is
	   `ControlStrokeColorDefaultBrush` — the gradient's far stop on its own — so it reads 228
	   and 47 flat on all four, and that is what pins its rule to a baseline.

	   High contrast is where this costs rather than pays. There the brush is a colour, so the
	   border it replaces was valid and drew the same value; what changed is that a masked
	   pseudo-element rounds its corners differently from a real border. That baseline moved by
	   422 pixels and 324 of them are this — 40 per trigger, 44 on the disabled one, inside four
	   rows of each corner and none above 31 levels. The other 98 sit on the two open dropdowns'
	   corners, span eight rows because `OverlayCornerRadius` is twice the corner here, and are
	   a single level each on an element this rule does not reach; playwright.config.ts:101 calls
	   that the lane's own noise. The ColorPicker baselines are the same trade with none of it
	   mixed in: 520 pixels over 13 triggers and 160 over 4, exactly 40 each. Button.svelte:79
	   and TextBox.svelte:170 made this trade before this one did. */
	.trigger::after {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--winui-ComboBoxBorderThemeThickness));
		border-radius: inherit;
		padding: var(--winui-ComboBoxBorderThemeThickness);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		background: var(--winui-ComboBoxBorderBrush);
	}

	/* The visible text inside the trigger. `ComboBoxForeground` is the colour of the
	   selected label; the placeholder uses a separate brush and a separate weight — see
	   TextBox's equivalent. The `PlaceholderTextBlock` upstream lives inside the
	   `ContentPresenter` at :577 and is bound through the `PlaceholderForeground`
	   property's alias onto `ComboBoxPlaceHolderForeground`. */
	.value {
		flex: 1 1 auto;
		min-width: 0;
		color: var(--winui-ComboBoxForeground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* The placeholder, visible only when the trigger has no selection. Its colour and
	   weight both come from their own resources — `PlaceholderForeground` and
	   `PlaceholderTextThemeFontWeight` — neither of which is the rest `Foreground`. The
	   focused-pressed state of the placeholder carries its own brush, but the trigger
	   reads it through a `Binding` rather than through a `VisualState` selector, so
	   picking the right focus selector requires the focus visual on the trigger below.
	   Reproducing the two brushes here is the closest equivalent the scoped CSS has. */
	.placeholder {
		color: var(--winui-ComboBoxPlaceHolderForeground);
		font-weight: var(--winui-ComboBoxPlaceholderTextThemeFontWeight);
	}

	/* The chevron: 12 by 12, right-aligned, the column 38 px wide the upstream grid
	   reserves. The glyph is the fallback WinUI itself draws — `&#xE70D;` in
	   `SymbolThemeFontFamily` at `FontSize="12"` per the `FontIconSource` at
	   ComboBox_themeresources.xaml:585. The escape is six digits and lowercase so a
	   future `content` concatenation cannot end at a stray space, the same shape
	   `TextBox.svelte`'s delete button carries. */
	.chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		/* c1-allow: ComboBox_themeresources.xaml:582, `Margin="0,0,14,0"` on the chevron */
		margin-right: 14px;
		/* c1-allow: ComboBox_themeresources.xaml:582, `Width="12"` and `Height="12"` on
		   the `AnimatedIcon` */
		width: 12px;
		height: 12px;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: ComboBox_themeresources.xaml:585, `FontSize="12"` on the
		   `FontIconSource` inside `AnimatedIcon.FallbackIconSource` */
		font-size: 12px;
		line-height: normal;
		color: var(--winui-ComboBoxDropDownGlyphForeground);
	}

	.chevron::before {
		/* c1-allow: ComboBox_themeresources.xaml:585, `Glyph="&#xE70D;"` on the
		   `FontIconSource` inside `AnimatedIcon.FallbackIconSource` — the glyph the
		   original draws under WD-006 */
		content: '\00e70d';
	}

	/* The popup: the `PopupBorder` Border at :590 carries `Background`, `BorderBrush`,
	   `BorderThickness`, `Padding` and `CornerRadius` from the popup's own resources.
	   The `Margin="0,-0.5,0,-1"` upstream is a half-pixel nudge for XAML's popup
	   placement and is not reproduced here: bits-ui positions the content with Floating UI
	   and a negative fractional margin against a different positioner is noise, not
	   fidelity. `OverlayCornerRadius` is the popup's own corner — distinct from the
	   trigger's `ControlCornerRadius`.

	   It also carries `BackgroundSizing="InnerBorderEdge"` in the attribute list, so the
	   fill's clip is read off the template rather than argued from the property's default
	   chain the way the pickers' flyout presenter needs. The fill stops at the stroke's
	   inner edge; CSS stops it at the border box, so the declaration below says
	   `padding-box`. What it changes is what the stroke lies on: the border colour here is
	   `ComboBoxDropDownBorderBrush`, which aliases `SurfaceStrokeColorFlyoutBrush` and so
	   resolves to `#0000000f` in light and `#00000033` in dark — translucent in both. An
	   unclipped fill is therefore what shows through the ring, and the dropdown's edge reads
	   one flat value wherever the popup is opened. Clipped, the ring takes its colour from
	   what is behind the popup. That last step is read rather than photographed: the template
	   settles the clip, but what the renderer then composites the stroke over is an inference,
	   and the pin carries no render walk to confirm it — `HWWalk.cpp` is not in the checkout.
	   No capture of the original's dropdown exists either. In high contrast both brushes
	   are opaque, though not by way of the flyout key: that block re-points
	   `ComboBoxDropDownBackground` and `ComboBoxDropDownBorderBrush` at
	   `SystemControlBackgroundChromeMediumLowBrush` and
	   `SystemControlForegroundChromeHighBrush`, which resolve to `SystemColorButtonFaceColor`
	   and `SystemColorButtonTextColor` — the same two keys upstream's own HighContrast
	   dictionary maps them to (`ComboBox_themeresources.xaml:168` and `:169`). So the clip
	   cannot be observed there, and the high-contrast baseline is byte-identical across this
	   change where light and dark are not.

	   `min-width` is the one thing the popup takes from outside its own resources. The
	   `ScrollViewer` at :591 binds `MinWidth` to `TemplateSettings.DropDownContentMinWidth`,
	   which WinUI computes as the ComboBox's own width — so upstream's dropdown is never
	   narrower than the control it drops from. bits-ui publishes the trigger's measured
	   width on the content as `--bits-floating-anchor-width`, and `max()` against
	   `ComboBoxPopupThemeMinWidth` keeps the 80 the source states as the floor for a
	   control narrower than that. Without this the popup shrinks to its longest item and
	   the control looks nothing like the original. */
	.popup {
		/* The popup layer. `Popup.svelte`'s `.root` rule carries the whole reason; the short
		   version is that this element is static, so the declaration paints nothing here and
		   is read by the primitive, which mirrors it onto the wrapper it positions. */
		z-index: 1000;
		min-width: max(var(--bits-floating-anchor-width), var(--winui-ComboBoxPopupThemeMinWidth));
		background: var(--winui-ComboBoxDropDownBackground) padding-box;
		border-style: solid;
		border-width: var(--winui-ComboBoxDropdownBorderThickness);
		border-color: var(--winui-ComboBoxDropDownBorderBrush);
		padding: var(--winui-ComboBoxDropdownBorderPadding);
		border-radius: var(--winui-OverlayCornerRadius);
		color: var(--winui-ComboBoxDropDownForeground);
	}

	/* The list: the `ScrollViewer` at :591 carries `Foreground` for the items, and the
	   `ItemsPresenter` carries `Margin="{ThemeResource ComboBoxDropdownContentMargin}"`
	   at :592 — the gap between the popup's border and the items. */
	.list {
		display: flex;
		flex-direction: column;
		margin: var(--winui-ComboBoxDropdownContentMargin);
		min-width: 0;
	}

	/* The item: the `LayoutRoot` Grid at :614 carries `Margin="5,2,5,2"`,
	   `CornerRadius="{TemplateBinding CornerRadius}"` (which the
	   `DefaultComboBoxItemStyle` sets to `ComboBoxItemCornerRadius`), and `Padding` and
	   `Background`/`BorderBrush` template-bound to the eight `ComboBoxItem*` brushes.
	   The `Control.IsTemplateFocusTarget="True"` puts the focus visual on the item. The
	   `Margin="5,2,5,2"` is on the `LayoutRoot` upstream; here it is on the item div,
	   which is the visual equivalent for a flex-column list. */
	.item {
		position: relative;
		display: flex;
		align-items: center;
		/* c1-allow: ComboBox_themeresources.xaml:614, the item's `LayoutRoot` carries
		   `Margin="5,2,5,2"` — XAML writes left,top,right,bottom and CSS writes
		   top,right,bottom,left. It is what insets each row from the popup's edge and
		   gives the selected row's rounded highlight its floating look. */
		margin: 2px 5px;
		padding: var(--winui-ComboBoxItemThemePadding);
		border-radius: var(--winui-ComboBoxItemCornerRadius);
		background: var(--winui-ComboBoxItemBackground);
		color: var(--winui-ComboBoxItemForeground);
		cursor: pointer;
	}

	/* No border on an item, and no `ComboBoxItemBorderBrush` anywhere in this component.
	   `DefaultComboBoxItemStyle` at ComboBox_themeresources.xaml:600 sets `Foreground`,
	   `Background`, `Padding` and `CornerRadius` and no `BorderThickness`, so the item's
	   border is the framework default of zero — and the nine `ComboBoxItemBorderBrush*`
	   keys the dictionary defines are read by nothing, the same shape as the pre-Fluent
	   `*ThemeBrush` families. A zero-width border with a colour on it is a declaration that
	   looks like a decision and is not one. */

	/* The selection indicator: the `Pill` Rectangle at :572 carries
	   `Width="{StaticResource ComboBoxItemPillWidth}"`,
	   `Height="{StaticResource ComboBoxItemPillHeight}"`,
	   `RadiusX="{StaticResource ComboBoxItemPillCornerRadius}"`,
	   `Fill="{ThemeResource ComboBoxItemPillFillBrush}"`, `Margin="1,0,0,0"`, and is
	   invisible at rest (`Opacity="0"`). The four `Selected*` states set `Opacity` to 1,
	   and `SelectedPressed` scales by `ComboBoxItemPillMinScale` (0.625). The scale has
	   no `transition` — the upstream animation runs over
	   `ComboBoxItemScaleAnimationDuration`, which this unit does not seed. The scale
	   token is emitted as `px` and read back through `calc(... / 1px)` so the cascade
	   stays editable without extending the generator's type system; see
	   `scripts/tokens/manifest.mjs`'s `DOUBLE_LENGTHS` for the comment. */
	.pill {
		position: absolute;
		left: 0;
		top: 50%;
		translate: 0 -50%;
		width: var(--winui-ComboBoxItemPillWidth);
		height: var(--winui-ComboBoxItemPillHeight);
		border-radius: var(--winui-ComboBoxItemPillCornerRadius);
		background: var(--winui-ComboBoxItemPillFillBrush);
		opacity: 0;
	}

	/* The visible label inside the item. `margin-left` reserves space for the pill so a
	   selected item's text aligns with a non-selected one's; the pill is three pixels
	   wide plus the `Margin="1,0,0,0"` upstream adds on its right. */
	.item-content {
		flex: 1 1 auto;
		min-width: 0;
		margin-left: 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* The focus visual; see Button.svelte for the shape. `ComboBox`'s style sets no
	   `FocusVisualMargin`, so the band takes the framework default of `0` —
	   `inset: 0` and `border-radius: inherit`, the same shape `NavigationViewItem.svelte`
	   uses. */
	.trigger:focus-visible {
		outline: none;
	}

	.root:has(.trigger:focus-visible)::before {
		content: '';
		position: absolute;
		/* The trigger is `position: relative` above, so that its ring can be placed against it,
		   and that puts the trigger after this band in paint order — both positioned, both
		   `z-index: auto`, the trigger later in the tree. This lifts the band back over it.
		   Nothing renders it today and that is a second defect, not this one: `top` below is
		   `ComboBoxTopHeaderMargin`, the four-value Thickness `0px 0px 8px 0px`, so the
		   declaration is invalid and `top` falls back to `auto`; with `bottom: 0` and an empty
		   pseudo the band is 0px tall, and the `top: 32px` a computed style reports is that
		   height solved backwards. Given a height, the pixel one in from the trigger's left
		   edge reads 187 in light without this line and 27 with it.

		   It is the only band in the library carrying one, and that is this control's shape
		   rather than an oversight elsewhere. Button.svelte:144 has the same ordering — band on
		   `::before`, ring on `::after` of one element — and pays one pixel for it: focused, in
		   light, the border box's outer pixel on /dev/button reads 237 shipped, 247 with the
		   band lifted and 252 with the ring hidden. Its band is `inset: -3px`, outside the box
		   the ring paints inside, so that pixel is the whole of what they share. This band is
		   `inset: 0` and what covers it is the trigger's own fill rather than a 1px ring, which
		   is why the same ordering costs 187 against 27 here. TextBox has no band to be under:
		   its focus visual is the ring changing brush, at TextBox.svelte:247. */
		z-index: 1;
		/* `top` and `bottom` mirror the trigger's own offset from the root — the header
		   adds the `ComboBoxTopHeaderMargin` on top, and the focus band has to clear it. */
		top: var(--winui-ComboBoxTopHeaderMargin);
		bottom: 0;
		left: 0;
		right: 0;
		border-radius: inherit;
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* The focus visual for the popup items — the `FocusVisualMargin="-3"` upstream at
	   :609 puts the band three pixels outside the item's border box. */
	.item:focus-visible {
		outline: none;
	}

	.list:has(.item:focus-visible)::before {
		content: '';
		position: absolute;
		/* c1-allow: ComboBox_themeresources.xaml:609, `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: the same 3px vertical offset Button, CheckBox, RadioButton and
		   ToggleSwitch carry, so the band stays concentric with the item's own corner */
		border-radius: calc(var(--winui-ComboBoxItemCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* ----- Trigger: PointerOver ----- */
	.trigger:hover {
		background: var(--winui-ComboBoxBackgroundPointerOver) padding-box;
	}

	.trigger:hover::after {
		background: var(--winui-ComboBoxBorderBrushPointerOver);
	}

	.trigger:hover .value {
		color: var(--winui-ComboBoxForegroundPointerOver);
	}

	.trigger:hover .placeholder {
		color: var(--winui-ComboBoxPlaceHolderForeground);
	}

	.trigger:hover .chevron {
		color: var(--winui-ComboBoxDropDownGlyphForeground);
	}

	/* ----- Trigger: Pressed ----- */
	.trigger:active {
		background: var(--winui-ComboBoxBackgroundPressed) padding-box;
	}

	.trigger:active::after {
		background: var(--winui-ComboBoxBorderBrushPressed);
	}

	.trigger:active .value {
		color: var(--winui-ComboBoxForegroundPressed);
	}

	/* ----- Items: PointerOver (`data-highlighted` is bits-ui's hover/active key) ----- */
	.item[data-highlighted] {
		background: var(--winui-ComboBoxItemBackgroundPointerOver);
		color: var(--winui-ComboBoxItemForegroundPointerOver);
	}

	/* ----- Items: Pressed ----- */
	.item:active {
		background: var(--winui-ComboBoxItemBackgroundPressed);
		color: var(--winui-ComboBoxItemForegroundPressed);
	}

	/* ----- Items: Selected ----- */
	.item[data-selected] {
		background: var(--winui-ComboBoxItemBackgroundSelected);
		color: var(--winui-ComboBoxItemForegroundSelected);
	}

	.item[data-selected] .pill {
		opacity: 1;
	}

	/* ----- Items: Selected + PointerOver ----- */
	.item[data-selected][data-highlighted] {
		background: var(--winui-ComboBoxItemBackgroundSelectedPointerOver);
		color: var(--winui-ComboBoxItemForegroundSelectedPointerOver);
	}

	/* ----- Items: Selected + Pressed ----- */
	.item[data-selected]:active {
		background: var(--winui-ComboBoxItemBackgroundSelectedPressed);
		color: var(--winui-ComboBoxItemForegroundSelectedPressed);
	}

	.item[data-selected]:active .pill {
		/* The upstream `SelectedPressed` state animates `ScaleY` to
		   `ComboBoxItemPillMinScale` (0.625) over `ComboBoxItemScaleAnimationDuration`;
		   the animation is out of scope and the scale is applied instantly. The token is
		   emitted as `px` and read back through `calc(... / 1px)`. */
		scale: var(--winui-ComboBoxItemPillMinScale);
	}

	/* ----- Items: Disabled ----- */
	.item[data-disabled] {
		background: var(--winui-ComboBoxItemBackgroundDisabled);
		color: var(--winui-ComboBoxItemForegroundDisabled);
		cursor: default;
	}

	/* ----- Items: Selected + Disabled ----- */
	.item[data-selected][data-disabled] {
		background: var(--winui-ComboBoxItemBackgroundSelectedDisabled);
		color: var(--winui-ComboBoxItemForegroundSelectedDisabled);
	}

	/* ----- Trigger: Disabled — written last so the four disabled brushes win over `:hover`
	   and `:active`. A disabled trigger must not light up under the pointer or while being
	   pressed. `data-disabled` is on the root rather than `:disabled` because the root is
	   a `<div>` and the trigger is a `<button>`. */
	.root[data-disabled] .trigger {
		background: var(--winui-ComboBoxBackgroundDisabled) padding-box;
		cursor: default;
	}

	.root[data-disabled] .trigger::after {
		background: var(--winui-ComboBoxBorderBrushDisabled);
	}

	.root[data-disabled] .trigger .value {
		color: var(--winui-ComboBoxForegroundDisabled);
	}

	.root[data-disabled] .trigger .placeholder {
		color: var(--winui-ComboBoxPlaceHolderForeground);
	}

	.root[data-disabled] .trigger .chevron {
		color: var(--winui-ComboBoxDropDownGlyphForegroundDisabled);
	}

	.root[data-disabled] .header {
		color: var(--winui-ComboBoxHeaderForegroundDisabled);
	}

	/* No `.root[data-disabled] .description` rule: the description's colour is the same in
	   every state, including disabled — upstream's `DescriptionPresenter` template never
	   overrides it. */
	.description {
		color: var(--winui-SystemControlDescriptionTextForegroundBrush);
		white-space: normal;
	}
</style>
