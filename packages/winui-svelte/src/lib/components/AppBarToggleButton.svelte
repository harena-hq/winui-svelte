<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface AppBarToggleButtonProps {
		/** Label — the text under the icon, or beside it, or as the overflow row's text. */
		label?: string;
		/** Icon — the `IconElement`, drawn by the consumer. ADR 0012. */
		icon?: Snippet;
		/** No WinUI member: ADR 0012's shorthand. A Segoe Fluent Icons code point as uppercase
		 *  hex, drawn as the icon when `icon` is absent. */
		glyph?: string;
		/** The effective label position, which two WinUI members between them decide:
		 *  `AppBarButton.LabelPosition` (`CommandBarLabelPosition`, `Default` or `Collapsed`) and,
		 *  where that is `Default`, the containing `CommandBar.DefaultLabelPosition`
		 *  (`CommandBarDefaultLabelPosition`, `Bottom`, `Right` or `Collapsed`). The template has one
		 *  visual state per outcome, so the library has one prop. */
		labelPosition?: 'bottom' | 'right' | 'collapsed';
		/** IsCompact, from `ICommandBarElement` — the bar's `ClosedDisplayMode` is `Compact`. */
		compact?: boolean;
		/** IsInOverflow, from `ICommandBarElement` — the command is drawn as an overflow menu row. */
		inOverflow?: boolean;
		/** No WinUI member: the overflow menu this row is in also holds icons, so every row reserves
		 *  an icon column. `OverflowWithMenuIcons`, AppBarToggleButton_themeresources.xaml:287. */
		overflowWithMenuIcons?: boolean;
		/** IsChecked's boolean half, under HTML's polarity — ADR 0009. A checked button is never also indeterminate. */
		checked?: boolean;
		/** The change callback ADR 0009 pairs with `checked`. */
		onCheckedChange?: (checked: boolean) => void;
		/** IsChecked's null, spelled the way ARIA spells it: `aria-pressed="mixed"`. */
		indeterminate?: boolean;
		/** No WinUI member: the change callback ADR 0009 pairs with `indeterminate`. */
		onIndeterminateChange?: (indeterminate: boolean) => void;
		/** IsThreeState. True makes a click cycle through the indeterminate state. */
		threeState?: boolean;
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean;
		/** Content — drawn in the icon slot, and only when neither `icon` nor `glyph` is given. The
		 *  template's one `ContentPresenter` (AppBarToggleButton_themeresources.xaml:485) is bound to
		 *  `Icon`; the Gallery's `PathIcon` example (AppBarButtonPage.xaml:76) sets `Content`
		 *  instead, so the slot has to accept both. */
		children?: Snippet;
		/** KeyboardAcceleratorTextOverride — the accelerator text drawn at the row's right edge. */
		keyboardAcceleratorTextOverride?: string;
		class?: string;
		style?: string;
		ref?: HTMLButtonElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		label,
		icon,
		glyph,
		labelPosition = 'bottom',
		compact = false,
		inOverflow = false,
		overflowWithMenuIcons = false,
		checked = $bindable(false),
		onCheckedChange,
		indeterminate = $bindable(false),
		onIndeterminateChange,
		threeState = false,
		disabled = false,
		children,
		keyboardAcceleratorTextOverride,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: AppBarToggleButtonProps = $props();

	// The word `Indeterminate` does not occur anywhere in
	// AppBarToggleButton_themeresources.xaml, so the template has no indeterminate state.
	// An indeterminate control therefore draws as unchecked: `data-checked` is "false" when
	// indeterminate, matching the template's behaviour.
	const dataChecked = $derived(indeterminate ? 'false' : checked ? 'true' : 'false');

	// The pin carries no code that orders these states — there is no AppBarButton.cpp in the pin —
	// and the precedence below is the library's, chosen because the overflow states set everything
	// the bar states set and Compact is a property of a bar whose labels are underneath.
	const dataViewState = $derived(
		inOverflow && overflowWithMenuIcons
			? 'overflow-with-menu-icons'
			: inOverflow
				? 'overflow'
				: labelPosition === 'collapsed'
					? 'label-collapsed'
					: labelPosition === 'right'
						? 'label-on-right'
						: compact
							? 'compact'
							: 'full-size'
	);

	// `ToggleButton.svelte`'s guarded setter, lifted whole. The guard is the point: a callback
	// fires for a value that changed and for no other, so clicking an indeterminate control
	// reports the indeterminate change alone rather than also reporting a `checked` that was
	// already false.
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

	// Exactly ToggleButton.svelte's click cycle: call the consumer's onclick first, return if
	// disabled, then cycle indeterminate -> unchecked -> checked -> (threeState ? indeterminate
	// : unchecked).
	function click(event: MouseEvent) {
		const handler = rest.onclick;
		if (typeof handler === 'function') handler(event);
		if (disabled) return;
		if (indeterminate) set(false, false);
		else if (checked) set(false, threeState);
		else set(true, false);
	}
</script>

<button
	bind:this={ref}
	type="button"
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	{disabled}
	aria-label={label}
	data-view-state={dataViewState}
	data-checked={dataChecked}
	aria-pressed={indeterminate ? 'mixed' : checked}
	{...rest}
	onclick={click}
>
	<span class="fill" aria-hidden="true"></span>
	<span class="content">
		<!-- AppBarToggleButton_themeresources.xaml:483, `Text="&#xE73E;"` — a literal in the
		     template, not a resource, so it is a code point here. -->
		<span class="check" aria-hidden="true">{String.fromCodePoint(0xe73e)}</span>
		<span class="icon" aria-hidden="true">
			{#if icon}
				{@render icon()}
			{:else if glyph}
				<span class="glyph">{String.fromCodePoint(Number.parseInt(glyph, 16))}</span>
			{:else}
				{@render children?.()}
			{/if}
		</span>
		<!-- AppBarToggleButton_themeresources.xaml:487 and :488 mark both text blocks
		     `AutomationProperties.AccessibilityView="Raw"`; the control is named from `Label`,
		     which is why the name survives an appearance that draws no text. -->
		<span class="label" aria-hidden="true">{label}</span>
		<span class="overflow-label" aria-hidden="true">{label}</span>
		{#if keyboardAcceleratorTextOverride}
			<span class="accelerator winui-CaptionTextBlockStyle">{keyboardAcceleratorTextOverride}</span>
		{/if}
	</span>
</button>

<style>
	.root {
		position: relative;
		display: block;
		/* AppBarToggleButton_themeresources.xaml:221, `Width="68"` */
		width: 68px;
		padding: 0;
		border: 0;
		/* AppBarToggleButton_themeresources.xaml:231, the template root's `Background="Transparent"` */
		background: transparent;
		color: var(--winui-AppBarToggleButtonForeground);
		text-align: left;
		cursor: pointer;
		user-select: none;
	}

	/* The 68px column at AppBarToggleButton_themeresources.xaml:221 is the icon-over-label column;
   a label drawn to the right of the icon cannot fit inside it. Layout, no c1-allow. */
	.root[data-view-state='label-on-right'] {
		width: auto;
	}

	/* AppBarToggleButtonOverflowStyle at :208 sets `HorizontalAlignment="Stretch"` and `Width="NaN"`;
   the row fills its container in overflow. Layout, no c1-allow. */
	.root[data-view-state^='overflow'] {
		width: 100%;
	}

	/* ---- check glyph ---- */

	.check {
		/* AppBarToggleButton_themeresources.xaml:483 — row 0, column 0, in front of the icon and
		   the overflow label. Layout, no c1-allow. */
		grid-row: 1;
		grid-column: 1;
		/* AppBarToggleButton_themeresources.xaml:483, `FontFamily="{ThemeResource SymbolThemeFontFamily}"`. */
		font-family: var(--winui-SymbolThemeFontFamily);
		/* AppBarToggleButton_themeresources.xaml:483, `Height="14"` and `Width="14"`. */
		height: 14px;
		width: 14px;
		/* AppBarToggleButton_themeresources.xaml:483, `FontSize="16"`. */
		/* c1-allow: AppBarToggleButton_themeresources.xaml:483, `FontSize="16"` — a literal in the
	   template, written as a code point in markup with a source comment. */
		font-size: 16px;
		/* c1-allow: AppBarToggleButton_themeresources.xaml:483, the check glyph is a 14 by 14 box
		   holding one icon, so its line box is the em box rather than the ramp's */
		line-height: 1;
		/* AppBarToggleButton_themeresources.xaml:483, `Margin="{ThemeResource AppBarToggleButtonOverflowCheckMargin}"`. */
		margin: var(--winui-AppBarToggleButtonOverflowCheckMargin);
		/* AppBarToggleButton_themeresources.xaml:483, `HorizontalAlignment="Left"` and
	   `VerticalAlignment="Center"`. */
		align-self: center;
		justify-self: start;
		/* AppBarToggleButton_themeresources.xaml:483, `Opacity="0"` — invisible until checked. */
		opacity: 0;
		/* AppBarToggleButton_themeresources.xaml:483, `Visibility="Collapsed"` — shown only in the
	   overflow states. Layout, no c1-allow. */
		display: none;
		/* AppBarToggleButton_themeresources.xaml:483, `Foreground="{ThemeResource AppBarToggleButtonCheckGlyphForeground}"`. */
		color: var(--winui-AppBarToggleButtonCheckGlyphForeground);
	}

	/* Visible in both overflow states — AppBarToggleButton_themeresources.xaml:283 and :298. */
	.root[data-view-state^='overflow'] .check {
		display: block;
	}

	/* Opacity 1 when checked — AppBarToggleButton_themeresources.xaml:347, :360, :373, :386,
   :418, :429, :441. */
	.root[data-checked='true'] .check {
		opacity: 1;
	}

	/* ---- fill + border ring (copied from ToggleButton.svelte, substituting the AppBar… token) ---- */

	.fill {
		position: absolute;
		/* AppBarToggleButton_themeresources.xaml:469, `Margin="{StaticResource AppBarButtonInnerBorderMargin}"`
	   — AppBarButton's key, not one of its own. Layout, no c1-allow. */
		inset: var(--winui-AppBarButtonInnerBorderMargin);
		border-radius: var(--winui-ControlCornerRadius);
		/* AppBarToggleButton_themeresources.xaml:216, `BorderThickness="{ThemeResource AppBarToggleButtonBorderThemeThickness}"`,
	   whose value :200 defines as 1 in every theme. The ring is masked onto the border so the checked gradient can be painted
	   on it without fighting the fill. */
		border: var(--winui-AppBarToggleButtonBorderThemeThickness) solid transparent;
		/* AppBarToggleButton_themeresources.xaml:227, `BackgroundSizing="InnerBorderEdge"` at rest. */
		background: var(--winui-AppBarToggleButtonBackground) padding-box;
		/* c1-allow: AppBarToggleButton_themeresources.xaml:471, `BrushTransition Duration="0:0:0.083"` */
		transition: background 83ms;
		pointer-events: none;
	}

	/* AppBarToggleButton_themeresources.xaml:237, `Compact` sets the inner border's margin to
   `AppBarButtonInnerBorderCompactMargin`. Layout, no c1-allow. */
	.root[data-view-state='compact'] .fill {
		inset: var(--winui-AppBarButtonInnerBorderCompactMargin);
	}

	/* AppBarToggleButton_themeresources.xaml:280 and :290 — both overflow states set the inner
   border's margin to `AppBarButtonInnerBorderOverflowMargin`. Layout, no c1-allow. */
	.root[data-view-state^='overflow'] .fill {
		inset: var(--winui-AppBarButtonInnerBorderOverflowMargin);
	}

	/* The gradient brush is painted on a masked pseudo-element, as ToggleButton.svelte does, so it
   occupies the border ring rather than the opaque fill. `AppBarToggleButtonBorderBrushChecked` and
   `…BorderBrushCheckedPointerOver` are `AccentControlElevationBorderBrush`, which is a gradient. */
	.fill::after {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--winui-AppBarToggleButtonBorderThemeThickness));
		border-radius: inherit;
		padding: var(--winui-AppBarToggleButtonBorderThemeThickness);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		/* c1-allow: AppBarToggleButton_themeresources.xaml:471, the same `BrushTransition Duration="0:0:0.083"`;
	   the ring fades with the fill because upstream transitions one painted surface. */
		transition: background 83ms;
	}

	/* The system focus visual is drawn around the fill — :469 puts
   `Control.IsTemplateFocusTarget="True"` on the inner border, not the root. Shape copied from
   ToggleButton.svelte's `.root:focus-visible::before`, thinned to the fill. */
	.root:focus-visible .fill::before {
		content: '';
		position: absolute;
		/* c1-allow: AppBarToggleButton_themeresources.xaml:223, `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: AppBarToggleButton_themeresources.xaml:223, the same `-3` inset so the band stays
	   concentric with the inner border's corner */
		border-radius: calc(var(--winui-ControlCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* ---- content grid ---- */

	.content {
		position: relative;
		display: grid;
		/* AppBarToggleButton_themeresources.xaml:475–:477 — two columns, `*` and `Auto`.
	   The check glyph lives in column 1 alongside the icon; the accelerator lives in column 2. */
		grid-template-columns: 1fr auto;
		/* AppBarToggleButton_themeresources.xaml:479–:481 — two rows, both Auto. */
		grid-template-rows: auto auto;
		align-content: start;
		min-height: var(--winui-AppBarThemeMinHeight);
	}

	/* LabelOnRight and LabelCollapsed both set `ContentRoot.MinHeight` to
   `AppBarThemeCompactHeight` (:251, :270). Layout, no c1-allow. */
	.root[data-view-state='label-on-right'] .content,
	.root[data-view-state='label-collapsed'] .content {
		min-height: var(--winui-AppBarThemeCompactHeight);
	}

	/* Overflow sets `ContentRoot.MinHeight` to 0 (:279, :289). Layout, no c1-allow. */
	.root[data-view-state^='overflow'] .content {
		min-height: 0;
	}

	.icon {
		/* AppBarToggleButton_themeresources.xaml:484 — the Viewbox carries no `Grid.Row` or
		   `Grid.Column`, so it is row 0, column 0. Stated rather than left to auto-placement.
		   Layout, no c1-allow. */
		grid-row: 1;
		grid-column: 1;
		/* AppBarToggleButton_themeresources.xaml:484, the Viewbox's `Height`. */
		height: var(--winui-AppBarButtonContentHeight);
		/* AppBarToggleButton_themeresources.xaml:484, the Viewbox's collapsed margin. */
		margin: var(--winui-AppBarButtonContentViewboxCollapsedMargin);
		display: flex;
		align-items: center;
		justify-content: center;
		/* The Viewbox scales its single child; anything inside this span that the consumer renders — a
	   bitmap or a path — should behave the same way. Image and svg selectors are declared so a
	   consumer's element receives the constraint; they are unused in the library's own markup. */
		:global(img),
		:global(svg) {
			max-height: 100%;
			max-width: 100%;
		}
	}

	.icon .glyph {
		font-family: var(--winui-SymbolThemeFontFamily);
		/* AppBarToggleButton_themeresources.xaml:484, `Height="{ThemeResource AppBarButtonContentHeight}"`;
	   the glyph fills the Viewbox's height. */
		font-size: var(--winui-AppBarButtonContentHeight);
		/* c1-allow: AppBarToggleButton_themeresources.xaml:484, the `Viewbox` scales one glyph to a
		   16-pixel box, so the glyph's line box is its own height rather than the ramp's */
		line-height: 1;
	}

	.label {
		/* AppBarToggleButton_themeresources.xaml:487, `Grid.Row="1"` — row 2. */
		grid-row: 2;
		/* AppBarToggleButton_themeresources.xaml:487, `FontSize="12"` — a literal in the template,
	   where AppBarButton's :372 reads `AppBarButtonLabelFontSize`. */
		/* c1-allow: AppBarToggleButton_themeresources.xaml:487, `FontSize="12"` — a literal in the
	   template, where AppBarButton's :372 reads `AppBarButtonLabelFontSize` */
		font-size: 12px;
		/* AppBarToggleButton_themeresources.xaml:487, `TextAlignment="Center"`. */
		text-align: center;
		/* AppBarToggleButton_themeresources.xaml:487, `Margin="{ThemeResource AppBarToggleButtonTextLabelMargin}"`. */
		margin: var(--winui-AppBarToggleButtonTextLabelMargin);
		/* AppBarToggleButton_themeresources.xaml:487, `TextWrapping="Wrap"` — the label wraps. */
		word-wrap: break-word;
		overflow-wrap: anywhere;
	}

	.overflow-label {
		/* AppBarToggleButton_themeresources.xaml:488 — row 0, column 0, the same cell as the icon
		   and the check glyph. Layout, no c1-allow. */
		grid-row: 1;
		grid-column: 1;
		display: none;
		/* AppBarToggleButton_themeresources.xaml:488, `Padding="{ThemeResource AppBarToggleButtonOverflowTextLabelPadding}"`.
	   WD-020: the touch and game-controller label padding is not reproduced; see docs/divergences.md. */
		padding: var(--winui-AppBarToggleButtonOverflowTextLabelPadding);
		/* AppBarToggleButton_themeresources.xaml:488, `Margin="38,0,12,0"` at default, before any overflow
	   state moves it. Layout, no c1-allow. */
		margin: 0 12px 0 38px;
	}

	.root[data-view-state='overflow'] .overflow-label,
	.root[data-view-state='overflow-with-menu-icons'] .overflow-label {
		display: block;
		/* AppBarToggleButton_themeresources.xaml:488, `VerticalAlignment="Center"`. */
		align-self: center;
		/* AppBarToggleButton_themeresources.xaml:488, `TextAlignment="Left"`. */
		text-align: left;
		/* AppBarToggleButton_themeresources.xaml:488, `TextWrapping="NoWrap"` and `TextTrimming="Clip"`. */
		white-space: nowrap;
		overflow: hidden;
	}

	/* AppBarToggleButton_themeresources.xaml:300, `OverflowTextLabel.Margin="76,0,12,0"` in
   `OverflowWithMenuIcons`. Layout, no c1-allow. */
	.root[data-view-state='overflow-with-menu-icons'] .overflow-label {
		margin: 0 12px 0 76px;
	}

	/* AppBarToggleButton_themeresources.xaml:241, :273, :282 and :297 — `Compact`,
	   `LabelCollapsed` and both overflow states collapse the bar label. Layout, no c1-allow. */
	.root[data-view-state='compact'] .label,
	.root[data-view-state='label-collapsed'] .label,
	.root[data-view-state^='overflow'] .label {
		display: none;
	}

	/* AppBarToggleButton_themeresources.xaml:253–:264, `LabelOnRight` moves the label to row 0,
	   column 1, left-aligns it and gives it `AppBarToggleButtonTextLabelOnRightMargin`. Layout,
	   no c1-allow. */
	.root[data-view-state='label-on-right'] .label {
		grid-row: 1;
		grid-column: 2;
		text-align: left;
		align-self: center;
		margin: var(--winui-AppBarToggleButtonTextLabelOnRightMargin);
	}

	/* AppBarToggleButton_themeresources.xaml:248, `LabelOnRight` gives the Viewbox
	   `AppBarButtonContentViewboxMargin` — AppBarButton's key. Layout, no c1-allow. */
	.root[data-view-state='label-on-right'] .icon {
		margin: var(--winui-AppBarButtonContentViewboxMargin);
	}

	/* AppBarToggleButton_themeresources.xaml:281 collapses the Viewbox in `Overflow`;
	   `OverflowWithMenuIcons` keeps it and re-places it (:291–:296) as a 16 by 16 box, 38 from
	   the row's left, because the check column is always ahead of it. Layout, no c1-allow. */
	.root[data-view-state='overflow'] .icon {
		display: none;
	}

	.root[data-view-state='overflow-with-menu-icons'] .icon {
		justify-self: start;
		align-self: center;
		/* AppBarToggleButton_themeresources.xaml:294 and :295 are `MaxWidth` and `MaxHeight`, a
		   ceiling — where AppBarButton's :220 and :221 are `Width` and `Height`, which is a
		   floor as well. The two are not the same setter. Layout, no c1-allow. */
		max-width: 16px;
		max-height: 16px;
		margin: 0 12px 0 38px;
	}

	.accelerator {
		/* AppBarToggleButton_themeresources.xaml:489, `Grid.Column="1"` — column 2. */
		grid-column: 2;
		/* AppBarToggleButton_themeresources.xaml:489, `VerticalAlignment="Center"`. */
		align-self: center;
		/* AppBarToggleButton_themeresources.xaml:489, `HorizontalAlignment="Right"`. */
		justify-self: end;
		/* AppBarToggleButton_themeresources.xaml:489, `Margin="24,0,12,0"` — LTR order: left=24, right=12. */
		margin: 0 12px 0 24px;
		/* AppBarToggleButton_themeresources.xaml:489, `Foreground="{ThemeResource ...KeyboardAcceleratorTextForeground}"`. */
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForeground);
		/* `:489` collapses the label, and which state `KeyboardAcceleratorTextVisibility` is in is
	   decided by code the pin does not carry. Read off the reference guest: the Gallery's
	   AppBarButton page draws a `Save` command with a real `KeyboardAccelerator` and no text
	   beside it, and the CommandBar page's overflow row draws `Ctrl+I`. The label belongs to
	   the overflow appearance, which is the one with a column wide enough for it. Layout, no
	   c1-allow. */
		display: none;
	}

	.root[data-view-state^='overflow'] .accelerator {
		display: block;
	}

	/* ---- states ---- */

	/* Normal — AppBarToggleButton_themeresources.xaml:305. */
	.root[data-checked='false'] .fill {
		background: var(--winui-AppBarToggleButtonBackground) padding-box;
	}
	.root[data-checked='false'] .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrush);
	}
	.root[data-checked='false'] {
		color: var(--winui-AppBarToggleButtonForeground);
	}

	.root[data-checked='false']:hover .fill {
		background: var(--winui-AppBarToggleButtonBackgroundPointerOver) padding-box;
	}
	.root[data-checked='false']:hover .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrushPointerOver);
	}
	.root[data-checked='false']:hover {
		color: var(--winui-AppBarToggleButtonForegroundPointerOver);
	}
	.root[data-checked='false']:hover .accelerator {
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundPointerOver);
	}

	.root[data-checked='false']:active .fill {
		background: var(--winui-AppBarToggleButtonBackgroundPressed) padding-box;
	}
	.root[data-checked='false']:active .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrushPressed);
	}
	.root[data-checked='false']:active {
		color: var(--winui-AppBarToggleButtonForegroundPressed);
	}
	.root[data-checked='false']:active .accelerator {
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundPressed);
	}

	.root[data-checked='false']:disabled .fill {
		background: var(--winui-AppBarToggleButtonBackgroundDisabled) padding-box;
	}
	.root[data-checked='false']:disabled .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrushDisabled);
	}
	.root[data-checked='false']:disabled {
		color: var(--winui-AppBarToggleButtonForegroundDisabled);
		cursor: default;
	}
	.root[data-checked='false']:disabled .accelerator {
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundDisabled);
	}

	/* Checked — AppBarToggleButton_themeresources.xaml:339–:348. The checked fill flips
   `BackgroundSizing` to `OuterBorderEdge`, so the opacity sits beneath the border ring. */
	.root[data-checked='true'] .fill {
		background: var(--winui-AppBarToggleButtonBackgroundChecked) border-box;
	}
	.root[data-checked='true'] .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrushChecked);
	}
	.root[data-checked='true'] {
		color: var(--winui-AppBarToggleButtonForegroundChecked);
	}

	.root[data-checked='true']:hover .fill {
		background: var(--winui-AppBarToggleButtonBackgroundCheckedPointerOver) border-box;
	}
	.root[data-checked='true']:hover .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrushCheckedPointerOver);
	}
	.root[data-checked='true']:hover {
		color: var(--winui-AppBarToggleButtonForegroundCheckedPointerOver);
	}
	.root[data-checked='true']:hover .accelerator {
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundCheckedPointerOver);
	}

	.root[data-checked='true']:active .fill {
		background: var(--winui-AppBarToggleButtonBackgroundCheckedPressed) border-box;
	}
	.root[data-checked='true']:active .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrushCheckedPressed);
	}
	.root[data-checked='true']:active {
		color: var(--winui-AppBarToggleButtonForegroundCheckedPressed);
	}
	.root[data-checked='true']:active .accelerator {
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundCheckedPressed);
	}

	.root[data-checked='true']:disabled .fill {
		background: var(--winui-AppBarToggleButtonBackgroundCheckedDisabled) border-box;
	}
	.root[data-checked='true']:disabled .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrushCheckedDisabled);
	}
	.root[data-checked='true']:disabled {
		color: var(--winui-AppBarToggleButtonForegroundCheckedDisabled);
		cursor: default;
	}
	.root[data-checked='true']:disabled .accelerator {
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundCheckedDisabled);
	}

	/* OverflowNormal — AppBarToggleButton_themeresources.xaml:389. No setters; nothing to paint. */
	/* OverflowPointerOver — AppBarToggleButton_themeresources.xaml:390–:399:
   BackgroundHighLightOverlayPointerOver on the fill, the same PointerOver brushes elsewhere,
   and the chevron/overflow-label take their pointer-over colours. */
	.root[data-view-state^='overflow'][data-checked='false']:hover .fill {
		background: var(--winui-AppBarToggleButtonBackgroundHighLightOverlayPointerOver) padding-box;
	}
	.root[data-view-state^='overflow'][data-checked='false']:hover .check {
		color: var(--winui-AppBarToggleButtonCheckGlyphForegroundPointerOver);
	}
	.root[data-view-state^='overflow'][data-checked='false']:hover .overflow-label {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundPointerOver);
	}

	/* OverflowPressed — AppBarToggleButton_themeresources.xaml:401–:410. */
	.root[data-view-state^='overflow'][data-checked='false']:active .fill {
		background: var(--winui-AppBarToggleButtonBackgroundHighLightOverlayPressed) padding-box;
	}
	.root[data-view-state^='overflow'][data-checked='false']:active .check {
		color: var(--winui-AppBarToggleButtonCheckGlyphForegroundPressed);
	}
	.root[data-view-state^='overflow'][data-checked='false']:active .overflow-label {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundPressed);
	}

	/* OverflowChecked — AppBarToggleButton_themeresources.xaml:412–:419.
   Paints `BorderBrushChecked` on the ring, the unchecked foreground on content/label/accelerator
   (the checked foreground is NOT applied here — the state uses `AppBarToggleButtonForeground`,
   not `…ForegroundChecked`), and the checked opacity on the chevron. */
	.root[data-view-state^='overflow'][data-checked='true'] .fill {
		/* AppBarToggleButton_themeresources.xaml:412–:419 sets the ring, three foregrounds and the
		   glyph's opacity, and no `Background` and no `BackgroundSizing` — so a checked overflow
		   row keeps the transparent fill the template binds, clipped as `InnerBorderEdge`. The
		   accent fill belongs to the bar appearance's `Checked` (:341) and to nothing else. */
		background: var(--winui-AppBarToggleButtonBackground) padding-box;
	}
	.root[data-view-state^='overflow'][data-checked='true'] .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrushChecked);
	}
	.root[data-view-state^='overflow'][data-checked='true'] {
		color: var(--winui-AppBarToggleButtonForeground);
	}
	.root[data-view-state^='overflow'][data-checked='true'] .check {
		color: var(--winui-AppBarToggleButtonForeground);
	}
	.root[data-view-state^='overflow'][data-checked='true'] .overflow-label {
		color: var(--winui-AppBarToggleButtonForeground);
	}
	.root[data-view-state^='overflow'][data-checked='true'] .accelerator {
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForeground);
	}

	/* OverflowCheckedPointerOver — AppBarToggleButton_themeresources.xaml:421–:430. */
	.root[data-view-state^='overflow'][data-checked='true']:hover .fill {
		background: var(--winui-AppBarToggleButtonBackgroundHighLightOverlayCheckedPointerOver)
			padding-box;
	}
	/* AppBarToggleButton_themeresources.xaml:421–:430 sets no `BorderBrush`, so the ring reverts
	   to the template's own binding — `AppBarToggleButtonBorderBrush`, transparent. The next
	   state along, `OverflowCheckedPressed`, does set one (:435), which is what makes this an
	   omission rather than an oversight. */
	.root[data-view-state^='overflow'][data-checked='true']:hover .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrush);
	}
	/* AppBarToggleButton_themeresources.xaml:424, `Content.Foreground`. */
	.root[data-view-state^='overflow'][data-checked='true']:hover .icon {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundCheckedPointerOver);
	}
	.root[data-view-state^='overflow'][data-checked='true']:hover .check {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundCheckedPointerOver);
	}
	.root[data-view-state^='overflow'][data-checked='true']:hover .overflow-label {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundCheckedPointerOver);
	}
	.root[data-view-state^='overflow'][data-checked='true']:hover .accelerator {
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundPointerOver);
	}

	/* OverflowCheckedPressed — AppBarToggleButton_themeresources.xaml:432–:442. */
	.root[data-view-state^='overflow'][data-checked='true']:active .fill {
		background: var(--winui-AppBarToggleButtonBackgroundHighLightOverlayCheckedPressed) padding-box;
	}
	.root[data-view-state^='overflow'][data-checked='true']:active .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrushCheckedPressed);
	}
	/* AppBarToggleButton_themeresources.xaml:436, `Content.Foreground`. */
	.root[data-view-state^='overflow'][data-checked='true']:active .icon {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundCheckedPressed);
	}
	.root[data-view-state^='overflow'][data-checked='true']:active .check {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundCheckedPressed);
	}
	.root[data-view-state^='overflow'][data-checked='true']:active .overflow-label {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundCheckedPressed);
	}
	.root[data-view-state^='overflow'][data-checked='true']:active .accelerator {
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundPressed);
	}

	/* Disabled in overflow — the single `Disabled` and `CheckedDisabled` states serve both appearances;
   there is no `OverflowDisabled` and no `OverflowCheckedDisabled`. An overflow row that is disabled
   takes the same Disabled or CheckedDisabled brushes it would take outside overflow. */
	.root[data-view-state^='overflow'][data-checked='false']:disabled .fill {
		background: var(--winui-AppBarToggleButtonBackgroundDisabled) padding-box;
	}
	.root[data-view-state^='overflow'][data-checked='false']:disabled .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrushDisabled);
	}
	/* AppBarToggleButton_themeresources.xaml:334 — `Disabled` sends the check glyph to
   `…OverflowLabelForegroundDisabled`. A `CheckGlyphForeground…Disabled` exists but only the
   Reveal template reads it, which is why the token layer excludes it. */
	.root[data-view-state^='overflow'][data-checked='false']:disabled .check {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundDisabled);
	}
	.root[data-view-state^='overflow'][data-checked='false']:disabled .overflow-label {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundDisabled);
	}
	.root[data-view-state^='overflow'][data-checked='false']:disabled .accelerator {
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundDisabled);
	}

	.root[data-view-state^='overflow'][data-checked='true']:disabled .fill {
		background: var(--winui-AppBarToggleButtonBackgroundCheckedDisabled) border-box;
	}
	.root[data-view-state^='overflow'][data-checked='true']:disabled .fill::after {
		background: var(--winui-AppBarToggleButtonBorderBrushCheckedDisabled);
	}
	.root[data-view-state^='overflow'][data-checked='true']:disabled .check {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundCheckedDisabled);
	}
	.root[data-view-state^='overflow'][data-checked='true']:disabled .overflow-label {
		color: var(--winui-AppBarToggleButtonOverflowLabelForegroundCheckedDisabled);
	}
	.root[data-view-state^='overflow'][data-checked='true']:disabled .accelerator {
		color: var(--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundCheckedDisabled);
	}
</style>
