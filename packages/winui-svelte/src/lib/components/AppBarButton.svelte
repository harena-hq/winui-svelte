<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface AppBarButtonProps {
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
		/** No WinUI member: the overflow menu this row is in also holds toggle commands, so every
		 *  row reserves a check column. `OverflowWithToggleButtons`, AppBarButton_themeresources.xaml:204. */
		overflowWithToggleButtons?: boolean;
		/** No WinUI member: the overflow menu this row is in also holds icons, so every row reserves
		 *  an icon column. `OverflowWithMenuIcons`, AppBarButton_themeresources.xaml:214. */
		overflowWithMenuIcons?: boolean;
		/** Flyout, reduced to whether there is one. The library's flyouts own their open state and
		 *  take a button as their trigger, as `DropDownButton` does, so this prop carries only what
		 *  the template reads from the member: `HasFlyout` shows the sub-item chevron. */
		flyout?: boolean;
		/** No WinUI member: this row's own flyout is open. `OverflowSubMenuOpened`,
		 *  AppBarButton_themeresources.xaml:310, which only applies in the overflow appearance. */
		subMenuOpen?: boolean;
		/** KeyboardAcceleratorTextOverride — the accelerator text drawn at the row's right edge. */
		keyboardAcceleratorTextOverride?: string;
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean;
		/** Content — drawn in the icon slot, and only when neither `icon` nor `glyph` is given. The
		 *  template's one `ContentPresenter` (AppBarButton_themeresources.xaml:370) is bound to
		 *  `Icon`; the Gallery's `PathIcon` example (AppBarButtonPage.xaml:76) sets `Content`
		 *  instead, so the slot has to accept both. */
		children?: Snippet;
		class?: string;
		style?: string;
		ref?: HTMLButtonElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { getCommandBarRegistry, getCommandBarState } from '../internal/command-bar';

	let {
		label,
		icon,
		glyph,
		labelPosition,
		compact,
		inOverflow,
		overflowWithToggleButtons,
		overflowWithMenuIcons,
		flyout = false,
		subMenuOpen = false,
		keyboardAcceleratorTextOverride,
		disabled = false,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: AppBarButtonProps = $props();

	const bar = getCommandBarState();
	const registry = getCommandBarRegistry();
	// `untrack` is what keeps this to one registration. Registering pushes onto the presenter's
	// `$state` array, and a push reads that array's length — so an effect that registers depends
	// on the very list it is joining, and every peer that registers after it tears it down and
	// re-runs it. Measured: four commands in one menu left the presenter holding one shape.
	$effect(() =>
		untrack(() => registry?.(() => ({ icon: Boolean(icon ?? glyph ?? children), toggle: false })))
	);
	const effectiveLabelPosition = $derived(labelPosition ?? bar?.().labelPosition ?? 'bottom');
	const isCompact = $derived(compact ?? bar?.().compact ?? false);
	const isInOverflow = $derived(inOverflow ?? bar?.().inOverflow ?? false);
	const hasOverflowWithToggleButtons = $derived(
		overflowWithToggleButtons ?? bar?.().overflowWithToggleButtons ?? false
	);
	const hasOverflowWithMenuIcons = $derived(
		overflowWithMenuIcons ?? bar?.().overflowWithMenuIcons ?? false
	);

	// The pin carries no code that orders these states — there is no AppBarButton.cpp in the pin —
	// and the precedence below is the library's, chosen because the overflow states set everything
	// the bar states set and Compact is a property of a bar whose labels are underneath.
	const dataViewState = $derived(
		isInOverflow && hasOverflowWithToggleButtons && hasOverflowWithMenuIcons
			? 'overflow-with-toggle-buttons-and-menu-icons'
			: isInOverflow && hasOverflowWithMenuIcons
				? 'overflow-with-menu-icons'
				: isInOverflow && hasOverflowWithToggleButtons
					? 'overflow-with-toggle-buttons'
					: isInOverflow
						? 'overflow'
						: effectiveLabelPosition === 'collapsed'
							? 'label-collapsed'
							: effectiveLabelPosition === 'right'
								? 'label-on-right'
								: isCompact
									? 'compact'
									: 'full-size'
	);
</script>

<button
	bind:this={ref}
	type="button"
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	{disabled}
	aria-label={label}
	data-view-state={dataViewState}
	data-sub-menu-open={subMenuOpen ? 'true' : undefined}
	{...rest}
>
	<span class="fill" aria-hidden="true"></span>
	<span class="content">
		<span class="icon" aria-hidden="true">
			{#if icon}
				{@render icon()}
			{:else if glyph}
				<span class="glyph">{String.fromCodePoint(Number.parseInt(glyph, 16))}</span>
			{:else}
				{@render children?.()}
			{/if}
		</span>
		<!-- AppBarButton_themeresources.xaml:372 and :373 mark both text blocks
		     `AutomationProperties.AccessibilityView="Raw"`; the control is named from `Label`,
		     which is why the name survives an appearance that draws no text. -->
		<span class="label" aria-hidden="true">{label}</span>
		<span class="overflow-label" aria-hidden="true">{label}</span>
		{#if keyboardAcceleratorTextOverride}
			<span class="accelerator winui-CaptionTextBlockStyle">{keyboardAcceleratorTextOverride}</span>
		{/if}
		<!-- `AppBarButtonHasFlyoutChevronVisibility` is a resource a scope sets, not a property the
		     command carries: `CommandBar_themeresources.xaml:95` collapses it for a whole
		     `CommandBar` including the Popup that holds its overflow rows, and
		     `CommandBarFlyout_themeresources.xaml:649` collapses it for the flyout's bar while
		     `:552` turns it back on inside the flyout's overflow presenter. So the chevron is
		     absent outside any scope that speaks, present outside a bar entirely, and present in
		     one particular overflow. -->
		{#if flyout && (!bar || bar().subItemChevronVisible)}
			<span class="chevron-panel" aria-hidden="true">
				<span class="chevron"></span>
				<span class="overflow-chevron"></span>
			</span>
		{/if}
	</span>
</button>

<style>
	.root {
		position: relative;
		display: block;
		/* AppBarButton_themeresources.xaml:136, `Width="68"` */
		width: 68px;
		padding: 0;
		border: 0;
		/* AppBarButton_themeresources.xaml:146, the template root's `Background="Transparent"` */
		background: transparent;
		color: var(--winui-AppBarButtonForeground);
		text-align: left;
		cursor: pointer;
		user-select: none;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	/* The 68px column at AppBarButton_themeresources.xaml:136 is the icon-over-label column;
   a label drawn to the right of the icon cannot fit inside it. Layout, no c1-allow. */
	.root[data-view-state='label-on-right'] {
		width: auto;
	}

	/* AppBarButtonOverflowStyle at :124 sets `HorizontalAlignment="Stretch"` and `Width="NaN"`;
   the row fills its container in overflow. Layout, no c1-allow. */
	.root[data-view-state^='overflow'] {
		width: 100%;
	}

	.fill {
		position: absolute;
		inset: var(--winui-AppBarButtonInnerBorderMargin);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-AppBarButtonBackground) padding-box;
		/* c1-allow: AppBarButton_themeresources.xaml:356, `BrushTransition Duration="0:0:0.083"` */
		transition: background 83ms;
		pointer-events: none;
	}

	/* AppBarButton_themeresources.xaml:152, `Compact` sets the inner border's margin to
   `AppBarButtonInnerBorderCompactMargin`. Layout, no c1-allow. */
	.root[data-view-state='compact'] .fill {
		inset: var(--winui-AppBarButtonInnerBorderCompactMargin);
	}

	/* AppBarButton_themeresources.xaml:198, :207, :217 and :231 — every overflow state sets the
   inner border's margin to `AppBarButtonInnerBorderOverflowMargin`. Layout, no c1-allow. */
	.root[data-view-state^='overflow'] .fill {
		inset: var(--winui-AppBarButtonInnerBorderOverflowMargin);
	}

	/* The focus visual is drawn around the fill — :354 puts `Control.IsTemplateFocusTarget="True"`
   on the inner border, not the root. Shape copied from DropDownButton.svelte's
   `.root:focus-visible::before`, thinned to the fill. */
	.root:focus-visible .fill::before {
		content: '';
		position: absolute;
		/* c1-allow: AppBarButton_themeresources.xaml:138, `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: AppBarButton_themeresources.xaml:138, the same `-3` inset so the band stays
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

	.content {
		position: relative;
		display: grid;
		/* AppBarButton_themeresources.xaml:361–:363 and :366–:367: three columns and two rows,
	   both Auto in height. */
		grid-template-columns: 1fr auto auto;
		grid-template-rows: auto auto;
		/* A XAML `Grid` whose rows are both Auto inside a box taller than they need renders with
	   the content packed to the top — `align-content: start` reproduces that. */
		align-content: start;
		min-height: var(--winui-AppBarThemeMinHeight);
	}

	/* LabelOnRight and LabelCollapsed both set `ContentRoot.MinHeight` to
   `AppBarThemeCompactHeight` (:166, :188). Layout, no c1-allow. */
	.root[data-view-state='label-on-right'] .content,
	.root[data-view-state='label-collapsed'] .content {
		min-height: var(--winui-AppBarThemeCompactHeight);
	}

	/* Overflow sets `ContentRoot.MinHeight` to 0 (:197, :206, :216, :230). Layout, no c1-allow. */
	.root[data-view-state^='overflow'] .content {
		min-height: 0;
	}

	.icon {
		/* AppBarButton_themeresources.xaml:369 — the Viewbox carries no `Grid.Row` or
		   `Grid.Column`, so it is row 0, column 0. Stated rather than left to auto-placement,
		   which puts it in the next free cell instead. Layout, no c1-allow. */
		grid-row: 1;
		grid-column: 1;
		/* AppBarButton_themeresources.xaml:369, the Viewbox's `Height`. */
		height: var(--winui-AppBarButtonContentHeight);
		/* AppBarButton_themeresources.xaml:369, the Viewbox's collapsed margin. */
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
		/* AppBarButton_themeresources.xaml:369, `Height="{ThemeResource AppBarButtonContentHeight}"`;
	   the glyph fills the Viewbox's height. */
		font-size: var(--winui-AppBarButtonContentHeight);
		/* c1-allow: AppBarButton_themeresources.xaml:369, the `Viewbox` scales one glyph to a
		   16-pixel box, so the glyph's line box is its own height rather than the ramp's */
		line-height: 1;
	}

	.label {
		/* AppBarButton_themeresources.xaml:372, `Grid.Row="1"` — the label sits in row 2. */
		grid-row: 2;
		/* AppBarButton_themeresources.xaml:372, `FontSize="{ThemeResource AppBarButtonLabelFontSize}"`. */
		font-size: var(--winui-AppBarButtonLabelFontSize);
		/* AppBarButton_themeresources.xaml:372, `TextAlignment="Center"`. */
		text-align: center;
		/* AppBarButton_themeresources.xaml:372, `Margin="{ThemeResource AppBarButtonTextLabelMargin}"`. */
		margin: var(--winui-AppBarButtonTextLabelMargin);
		/* AppBarButton_themeresources.xaml:372, `TextWrapping="Wrap"` — the label wraps. */
		word-wrap: break-word;
		overflow-wrap: anywhere;
	}

	.overflow-label {
		/* AppBarButton_themeresources.xaml:373 — row 0, column 0, the same cell as the icon,
		   which the overflow states are what makes free. Layout, no c1-allow. */
		grid-row: 1;
		grid-column: 1;
		display: none;
		/* AppBarButton_themeresources.xaml:373, `Padding="{ThemeResource AppBarButtonOverflowTextLabelPadding}"`.
	   WD-020: the touch and game-controller label padding is not reproduced; see docs/divergences.md. */
		padding: var(--winui-AppBarButtonOverflowTextLabelPadding);
		/* AppBarButton_themeresources.xaml:373, `Margin="12,0,12,0"` at default, before any overflow
	   state moves it. Layout, no c1-allow. */
		margin: 0 12px;
	}

	.root[data-view-state^='overflow'] .overflow-label {
		display: block;
		/* AppBarButton_themeresources.xaml:373, `VerticalAlignment="Center"`. */
		align-self: center;
		/* AppBarButton_themeresources.xaml:373, `TextAlignment="Left"`. */
		text-align: left;
		/* AppBarButton_themeresources.xaml:373, `TextWrapping="NoWrap"` and `TextTrimming="Clip"`. */
		white-space: nowrap;
		overflow: hidden;
	}

	/* AppBarButton_themeresources.xaml:211, `OverflowTextLabel.Margin="38,0,12,0"` in
   `OverflowWithToggleButtons`. Layout, no c1-allow. */
	.root[data-view-state='overflow-with-toggle-buttons'] .overflow-label {
		margin: 0 12px 0 38px;
	}

	/* AppBarButton_themeresources.xaml:225, `OverflowTextLabel.Margin="38,0,12,0"` in
   `OverflowWithMenuIcons`. Layout, no c1-allow. */
	.root[data-view-state='overflow-with-menu-icons'] .overflow-label {
		margin: 0 12px 0 38px;
	}

	/* AppBarButton_themeresources.xaml:239, `OverflowTextLabel.Margin="76,0,12,0"` in
   `OverflowWithToggleButtonsAndMenuIcons`. Layout, no c1-allow. */
	.root[data-view-state='overflow-with-toggle-buttons-and-menu-icons'] .overflow-label {
		margin: 0 12px 0 76px;
	}

	/* AppBarButton_themeresources.xaml:374 also binds `MinWidth` to
	   `TemplateSettings.KeyboardAcceleratorTextMinWidth`, which a CommandBar computes once for a
	   whole menu so the accelerators line up down the column. That arithmetic is in code the pin
	   does not carry, so the column is not reserved here and a consumer that wants the alignment
	   sets a `min-width` through the token cascade. */
	.accelerator {
		/* AppBarButton_themeresources.xaml:374, `Grid.Column="1"` — column 2. */
		grid-column: 2;
		/* AppBarButton_themeresources.xaml:374, `VerticalAlignment="Center"`. */
		align-self: center;
		/* AppBarButton_themeresources.xaml:374, `HorizontalAlignment="Right"`. */
		justify-self: end;
		/* AppBarButton_themeresources.xaml:374, `Margin="24,0,12,0"` — LTR order: left=24, right=12. */
		margin: 0 12px 0 24px;
		/* AppBarButton_themeresources.xaml:374, `Foreground="{ThemeResource ...KeyboardAcceleratorTextForeground}"`. */
		color: var(--winui-AppBarButtonKeyboardAcceleratorTextForeground);
		/* `:374` collapses the label, and which state `KeyboardAcceleratorTextVisibility` is in is
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

	.chevron-panel {
		/* AppBarButton_themeresources.xaml:375, `Grid.Column="2"` — column 3. */
		grid-column: 3;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		/* Both children are placed in row 1 / column 1 of this inner grid.
	   AppBarButton_themeresources.xaml:376–:377. Layout, no c1-allow. */
	}

	.chevron {
		display: block;
		/* AppBarButton_themeresources.xaml:376, `FontFamily="{ThemeResource SymbolThemeFontFamily}"`. */
		font-family: var(--winui-SymbolThemeFontFamily);
		/* AppBarButton_themeresources.xaml:376, `FontSize="{ThemeResource AppBarButtonSubItemChevronFontSize}"`. */
		font-size: var(--winui-AppBarButtonSubItemChevronFontSize);
		/* c1-allow: AppBarButton_themeresources.xaml:376, a `FontIcon` is a glyph in a box and not
		   a line of text, so its line box is the em box */
		line-height: 1;
		/* AppBarButton_themeresources.xaml:376, `VerticalAlignment="Top"`. */
		align-self: start;
		/* AppBarButton_themeresources.xaml:376, `Margin="{ThemeResource AppBarButtonSubItemChevronMargin}"`. */
		margin: var(--winui-AppBarButtonSubItemChevronMargin);
		/* AppBarButton_themeresources.xaml:376, `Foreground="{ThemeResource AppBarButtonSubItemChevronForeground}"`. */
		color: var(--winui-AppBarButtonSubItemChevronForeground);
	}

	/* AppBarButton_themeresources.xaml:376, `Glyph="{ThemeResource AppBarButtonFlyoutGlyph}"`.
	   The glyph is drawn by a pseudo-element, as CheckBox's and Expander's are: `content` on a
	   real element renders nothing. */
	.chevron::before {
		content: var(--winui-AppBarButtonFlyoutGlyph);
	}

	/* AppBarButton_themeresources.xaml:155, :190, :200, :209, :223 and :237 — `Compact`,
	   `LabelCollapsed` and all four overflow states collapse the bar label. Layout, no
	   c1-allow. */
	.root[data-view-state='compact'] .label,
	.root[data-view-state='label-collapsed'] .label,
	.root[data-view-state^='overflow'] .label {
		display: none;
	}

	/* AppBarButton_themeresources.xaml:168–:179, `LabelOnRight` moves the label to row 0,
	   column 1, left-aligns it and gives it `AppBarButtonTextLabelOnRightMargin`. Layout, no
	   c1-allow. */
	.root[data-view-state='label-on-right'] .label {
		grid-row: 1;
		grid-column: 2;
		text-align: left;
		align-self: center;
		margin: var(--winui-AppBarButtonTextLabelOnRightMargin);
	}

	/* AppBarButton_themeresources.xaml:162, `LabelOnRight` gives the Viewbox
	   `AppBarButtonContentViewboxMargin`. Layout, no c1-allow. */
	.root[data-view-state='label-on-right'] .icon {
		margin: var(--winui-AppBarButtonContentViewboxMargin);
	}

	/* AppBarButton_themeresources.xaml:199 and :208 — `Overflow` and
	   `OverflowWithToggleButtons` collapse the Viewbox; the two `…MenuIcons` states keep it and
	   re-place it (:218–:222, :232–:236) as a 16 by 16 box at the row's left. Layout, no
	   c1-allow. */
	.root[data-view-state='overflow'] .icon,
	.root[data-view-state='overflow-with-toggle-buttons'] .icon {
		display: none;
	}

	.root[data-view-state='overflow-with-menu-icons'] .icon,
	.root[data-view-state='overflow-with-toggle-buttons-and-menu-icons'] .icon {
		justify-self: start;
		align-self: center;
		width: 16px;
		height: 16px;
		margin: 0 12px;
	}

	.root[data-view-state='overflow-with-toggle-buttons-and-menu-icons'] .icon {
		margin: 0 12px 0 38px;
	}

	/* AppBarButton_themeresources.xaml:180, `LabelOnRight` sets the chevron's margin to
   `AppBarButtonSubItemChevronLabelOnRightMargin`. Layout, no c1-allow. */
	.root[data-view-state='label-on-right'] .chevron {
		margin: var(--winui-AppBarButtonSubItemChevronLabelOnRightMargin);
	}

	.overflow-chevron {
		/* AppBarButton_themeresources.xaml:377, `FontFamily="{ThemeResource SymbolThemeFontFamily}"`. */
		font-family: var(--winui-SymbolThemeFontFamily);
		/* AppBarButton_themeresources.xaml:377, `FontSize="{ThemeResource AppBarButtonSecondarySubItemChevronFontSize}"`. */
		font-size: var(--winui-AppBarButtonSecondarySubItemChevronFontSize);
		/* c1-allow: AppBarButton_themeresources.xaml:377, the same: a `FontIcon`'s line box is its
		   em box */
		line-height: 1;
		/* AppBarButton_themeresources.xaml:377, `VerticalAlignment="Center"`. */
		align-self: center;
		/* AppBarButton_themeresources.xaml:377, `Margin="{ThemeResource AppBarButtonSecondarySubItemChevronMargin}"`. */
		margin: var(--winui-AppBarButtonSecondarySubItemChevronMargin);
		/* AppBarButton_themeresources.xaml:377, `Foreground="{ThemeResource AppBarButtonSubItemChevronForeground}"`
	   — the overflow chevron shares the same foreground binding as the in-bar chevron. */
		color: var(--winui-AppBarButtonSubItemChevronForeground);
		/* AppBarButton_themeresources.xaml:377, `Visibility="Collapsed"` — shown only in the overflow
	   states. Layout, no c1-allow. */
		display: none;
	}

	/* AppBarButton_themeresources.xaml:377, `Glyph="{ThemeResource AppBarButtonOverflowFlyoutGlyph}"`. */
	.overflow-chevron::before {
		content: var(--winui-AppBarButtonOverflowFlyoutGlyph);
	}

	/* Upstream puts this swap in `CommonStates` (:280, :293, :306, :319) rather than in
	   `ApplicationViewStates`, and `Disabled` (:267) is in that same group and carries no swap
	   setters — so a *disabled* overflow row upstream shows the in-bar chevron, at its
	   `-23,20,12,0` margin, in a 32-tall menu row. Keyed on the appearance here instead, which
	   is the divergence and the reason for it. */
	.root[data-view-state^='overflow'] .chevron {
		display: none;
	}

	.root[data-view-state^='overflow'] .overflow-chevron {
		display: block;
	}

	/* ---- states ---- */

	/* PointerOver — AppBarButton_themeresources.xaml:245–:254. */
	.root:hover .fill {
		background: var(--winui-AppBarButtonBackgroundPointerOver) padding-box;
	}
	.root:hover {
		color: var(--winui-AppBarButtonForegroundPointerOver);
	}
	/* The overflow chevron is deliberately absent from this rule. `OverflowSubItemChevron`'s
	   `Foreground` is bound once, at :377, and no `VisualState` re-sets it; every chevron brush
	   setter in the file — :252, :263, :274, :292, :305, :318 — targets `SubItemChevron`, which
	   is Collapsed throughout the overflow appearance. */
	.root:hover .chevron {
		color: var(--winui-AppBarButtonSubItemChevronForegroundPointerOver);
	}
	.root:hover .accelerator {
		color: var(--winui-AppBarButtonKeyboardAcceleratorTextForegroundPointerOver);
	}

	/* Pressed — AppBarButton_themeresources.xaml:256–:265. */
	.root:active .fill {
		background: var(--winui-AppBarButtonBackgroundPressed) padding-box;
	}
	.root:active {
		color: var(--winui-AppBarButtonForegroundPressed);
	}
	/* The overflow chevron is deliberately absent from this rule. `OverflowSubItemChevron`'s
	   `Foreground` is bound once, at :377, and no `VisualState` re-sets it; every chevron brush
	   setter in the file — :252, :263, :274, :292, :305, :318 — targets `SubItemChevron`, which
	   is Collapsed throughout the overflow appearance. */
	.root:active .chevron {
		color: var(--winui-AppBarButtonSubItemChevronForegroundPressed);
	}
	.root:active .accelerator {
		color: var(--winui-AppBarButtonKeyboardAcceleratorTextForegroundPressed);
	}

	/* SubMenuOpened — AppBarButton_themeresources.xaml:310–:321.
   The state that sets `SubItemChevron.Foreground` to `…SubMenuOpened` (`:318`) also collapses
   `SubItemChevron` (`:319`), so the brush paints nothing. Leave the chevron rule out and record
   why. */
	.root[data-view-state^='overflow'][data-sub-menu-open='true'] .fill {
		background: var(--winui-AppBarButtonBackgroundSubMenuOpened) padding-box;
	}
	.root[data-view-state^='overflow'][data-sub-menu-open='true'] {
		color: var(--winui-AppBarButtonForegroundSubMenuOpened);
	}
	.root[data-view-state^='overflow'][data-sub-menu-open='true'] .accelerator {
		color: var(--winui-AppBarButtonKeyboardAcceleratorTextForegroundSubMenuOpened);
	}

	/* Disabled — AppBarButton_themeresources.xaml:267–:276. */
	.root:disabled .fill {
		background: var(--winui-AppBarButtonBackgroundDisabled) padding-box;
	}
	.root:disabled {
		color: var(--winui-AppBarButtonForegroundDisabled);
		cursor: default;
	}
	/* The overflow chevron is deliberately absent from this rule. `OverflowSubItemChevron`'s
	   `Foreground` is bound once, at :377, and no `VisualState` re-sets it; every chevron brush
	   setter in the file — :252, :263, :274, :292, :305, :318 — targets `SubItemChevron`, which
	   is Collapsed throughout the overflow appearance. */
	.root:disabled .chevron {
		color: var(--winui-AppBarButtonSubItemChevronForegroundDisabled);
	}
	.root:disabled .accelerator {
		color: var(--winui-AppBarButtonKeyboardAcceleratorTextForegroundDisabled);
	}
</style>
