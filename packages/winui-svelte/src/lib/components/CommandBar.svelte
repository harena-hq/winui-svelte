<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface CommandBarProps {
		/** PrimaryCommands — the commands on the bar. `CommandBar`'s XAML `ContentProperty`, so
		 *  ADR 0009 makes it `children`. */
		children?: Snippet;
		/** SecondaryCommands — the commands in the portalled overflow menu. Their presence also
		 *  decides `OverflowButtonVisibility="Auto"`. */
		secondaryCommands?: Snippet;
		/** AppBar.Content — the bar's own content, drawn to the left of the commands. */
		content?: Snippet;
		/** ClosedDisplayMode (`AppBarClosedDisplayMode`). */
		closedDisplayMode?: 'compact' | 'minimal' | 'hidden';
		/** DefaultLabelPosition (`CommandBarDefaultLabelPosition`) — the label position every command
		 *  in this bar takes unless it sets `labelPosition` itself. */
		defaultLabelPosition?: 'bottom' | 'right' | 'collapsed';
		/** OverflowButtonVisibility (`CommandBarOverflowButtonVisibility`). `auto` shows the button
		 *  when there are secondary commands, which is `CommandBarTemplateSettings.EffectiveOverflowButtonVisibility`
		 *  reduced to what this version builds. */
		overflowButtonVisibility?: 'auto' | 'visible' | 'collapsed';
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. Drives `CommonStates`' `Disabled`
		 *  (`CommandBar_themeresources.xaml:114`), which recolours the ellipsis alone. */
		disabled?: boolean;
		/** IsOpen, under HTML's name for it — ADR 0009. */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: boolean) => void;
		/** IsSticky. An open sticky bar is not closed by a click outside it. No baseline can
		 *  photograph this: the Gallery's own page sets it only from code
		 *  (`CommandBarPage.xaml.cs:44`), and the difference is what a click elsewhere does. */
		sticky?: boolean;
		class?: string;
		style?: string;
		/** ADR 0009's `ref` points at the interactive element; a CommandBar is `IsTabStop="False"`
		 *  (`:81`) and has none, so this is the root. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	import { Popover } from 'bits-ui';
	import CommandBarOverflowPresenter from './CommandBarOverflowPresenter.svelte';
	import { setCommandBarState } from '../internal/command-bar';

	let {
		children,
		secondaryCommands,
		content,
		closedDisplayMode = 'compact',
		defaultLabelPosition = 'bottom',
		overflowButtonVisibility = 'auto',
		disabled = false,
		open = $bindable(false),
		onOpenChange,
		sticky = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: CommandBarProps = $props();

	const str = useStrings();

	// A bar whose labels are underneath shows them only when it is open, so its closed commands
	// are Compact; a bar whose labels are on the right or collapsed says so through labelPosition
	// and its commands are not additionally compact.
	//
	// `&& !open` is the whole of what `ClosedDisplayMode` means, and the pin says so at
	// `CommandBar_themeresources.xaml:597`: `CompactOpenDown` sets `ClipGeometryTransform.Y` to
	// **0**, which stops the clip hiding anything — and the only thing below the 48 it was hiding
	// is the label row. A property named for the *closed* bar describes the closed bar alone.
	setCommandBarState(() => ({
		compact: closedDisplayMode === 'compact' && defaultLabelPosition === 'bottom' && !open,
		labelPosition: defaultLabelPosition,
		inOverflow: false,
		overflowWithMenuIcons: false,
		overflowWithToggleButtons: false,
		subItemChevronVisible: false
	}));

	const showOverflowButton = $derived(
		overflowButtonVisibility === 'visible' ||
			(overflowButtonVisibility === 'auto' && secondaryCommands !== undefined)
	);
	const secondaryCommandsOnly = $derived(children === undefined && secondaryCommands !== undefined);

	function setOpen(next: boolean) {
		if (open === next) return;
		open = next;
		onOpenChange?.(next);
	}
</script>

<div
	bind:this={ref}
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	data-display-mode={closedDisplayMode}
	data-secondary-commands-only={secondaryCommandsOnly ? 'true' : undefined}
	data-open={open}
	{...rest}
>
	<div class="content-root">
		{#if open}
			<!-- CommandBar_themeresources.xaml:841, `HighContrastBorder`; it is retained even though
			     the shipped normal-theme brush is transparent, preserving the template's high-contrast part. -->
			<div class="high-contrast-border"></div>
			<!-- CommandBar_themeresources.xaml:842, `OpenBorder`. -->
			<div class="open-border"></div>
		{/if}
		<div class="commands">
			<div class="content">{@render content?.()}</div>
			<div class="primary">{@render children?.()}</div>
		</div>
		{#if showOverflowButton}
			<!-- Microsoft names this button "See more" in its published reference; the pin has no SR_
		     resource for the string. -->
			<button
				type="button"
				class="more"
				{disabled}
				aria-label={str('UIA_MORE_BUTTON')}
				onclick={() => setOpen(!open)}
			>
				<span class="more-fill">
					<!-- CommandBar_themeresources.xaml:839, `Glyph="&#xE712;"` — a literal in the
					     template, not a resource, so it is a code point here. -->
					<span class="ellipsis" aria-hidden="true">{String.fromCodePoint(0xe712)}</span>
				</span>
			</button>
		{/if}
	</div>
	{#if secondaryCommands !== undefined}
		<Popover.Root bind:open={() => open, (next) => setOpen(next)}>
			<!-- c13-layer: CommandBarOverflowPresenter.svelte — this portal's content is that
			     component, so the layer is on its `.root` rather than on anything here. C13
			     follows the name and checks that file, so this is a redirection rather than an
			     exemption. `Popup.svelte`'s `.root` rule is what the layer is and why every
			     portalled surface needs one. -->
			<Popover.Portal>
				<!-- CommandBar_themeresources.xaml:851 places the overflow at the bar's right edge. -->
				<!-- OpenDown uses the primitive's normal bottom placement; its flip supplies OpenUp. -->
				<Popover.Content
					side="bottom"
					align="end"
					sideOffset={0}
					customAnchor={ref}
					interactOutsideBehavior={sticky ? 'ignore' : 'close'}
				>
					{#snippet child({ props, wrapperProps })}
						<div {...wrapperProps}>
							<CommandBarOverflowPresenter {...props}>
								{@render secondaryCommands?.()}
							</CommandBarOverflowPresenter>
						</div>
					{/snippet}
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	{/if}
</div>

<style>
	.root {
		display: block;
		/* CommandBar_themeresources.xaml:788–:793 puts a `RectangleGeometry` clip on `LayoutRoot`,
		   translated by `TemplateSettings.CompactVerticalDelta`, and `CompactClosed` (:553) leaves
		   it there. That clip is the whole reason a closed bar is 48 tall while the commands
		   inside it are 64: `ContentRoot`'s own `MinHeight` is 48 (:795) but its content is a
		   command's 64, and the window shows the top of it. Measured on the reference guest, off
		   the Gallery's own AppBarSeparator page: the separator's rule is 32 rows tall, and a
		   separator insets its rule 8 above and 8 below (`AppBarSeparatorMargin`), so the row it
		   stretches to is 48. `AppBarButtonInnerBorderCompactMargin`'s 22 at the bottom is the
		   other half of the same arithmetic — 6 + 36 + 22 = 64, and the fill ends at 42, inside
		   the 48 the clip leaves. Layout, no c1-allow. */
		height: var(--winui-AppBarThemeCompactHeight);
		overflow: hidden;
		background: var(--winui-CommandBarBackground);
		color: var(--winui-CommandBarForeground);
	}

	.content-root {
		position: relative;
		display: grid;
		/* CommandBar_themeresources.xaml:797 and :798 — `*` then `Auto` with
		   `MinWidth="{ThemeResource AppBarMoreButtonColumnMinWidth}"`. The minimum belongs to the
		   column and not to the button: a bar with no overflow button still keeps the six pixels,
		   which is what a `minmax()` says and what a `min-width` on the button cannot. Layout, no
		   c1-allow. */
		grid-template-columns: 1fr minmax(var(--winui-AppBarMoreButtonColumnMinWidth), auto);
		align-items: start;
		min-height: var(--winui-AppBarThemeCompactHeight);
	}

	/* Open, the clip stops hiding anything — `:597` sets its transform to 0 — so the row grows to
	   whatever the commands measure, which for a bar whose labels are underneath is the 64 they
	   were being clipped to 48 from. Layout, no c1-allow. */
	.root[data-open='true'] {
		height: auto;
		min-height: var(--winui-AppBarThemeCompactHeight);
	}

	/* CommandBar_themeresources.xaml:557 and :588, `ContentRoot.Background`. */
	.root[data-open='true'] .content-root {
		background: var(--winui-CommandBarBackgroundOpen);
		/* CommandBar_themeresources.xaml:560 and :591, the control's CornerRadius. */
		border-radius: var(--winui-ControlCornerRadius);
	}

	/* CommandBar_themeresources.xaml:569 and :600, `MoreButton.VerticalAlignment="Stretch"`. */
	.root[data-open='true'] .more {
		align-self: stretch;
	}

	.open-border,
	.high-contrast-border {
		position: absolute;
		inset: 0;
		border-radius: var(--winui-ControlCornerRadius);
		pointer-events: none;
	}

	.open-border {
		border: var(--winui-CommandBarBorderThicknessOpen) solid var(--winui-CommandBarBorderBrushOpen);
	}

	.high-contrast-border {
		/* c1-allow: CommandBar_themeresources.xaml:841, `StrokeThickness="1"` */
		border: 1px solid var(--winui-CommandBarHighContrastBorder);
	}

	.commands {
		/* CommandBar_themeresources.xaml:805, :806 — `*` then `Auto`. The DynamicOverflowEnabled
		   state at :780 swaps them; dynamic overflow is not built in this version. */
		display: grid;
		grid-template-columns: 1fr auto;
	}

	.content {
		/* CommandBar_themeresources.xaml:811 binds the ContentControl margin to the bar padding,
		   which :80 sets to `4,0,0,0`. */
		margin: 0 0 0 4px;
		justify-self: start;
		align-self: start;
	}

	.primary {
		display: flex;
		flex-direction: row;
		justify-self: end;
		min-height: var(--winui-AppBarThemeCompactHeight);
	}

	.more {
		/* CommandBar_themeresources.xaml:960 via :831, `Width="{ThemeResource AppBarExpandButtonThemeWidth}"`. */
		width: var(--winui-AppBarExpandButtonThemeWidth);
		min-height: var(--winui-AppBarThemeCompactHeight);
		align-self: start;
		display: grid;
		padding: 0;
		border: 0;
		/* CommandBar_themeresources.xaml:967, the EllipsisButton template root's Background="Transparent". */
		background: transparent;
		color: var(--winui-AppBarButtonForeground);
		cursor: pointer;
		position: relative;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	.more-fill {
		margin: var(--winui-AppBarEllipsisButtonInnerBorderMargin);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-AppBarButtonBackground);
		display: grid;
		place-items: center;
		position: relative;
	}

	.ellipsis {
		/* CommandBar_themeresources.xaml:839, `Height="{ThemeResource AppBarExpandButtonCircleDiameter}"`
		   and `VerticalAlignment="Center"` — a three-pixel layout box, centred in the fill, that the
		   20px glyph overflows equally above and below. The line height has to be that same three
		   pixels and not `1`: with a 20px line box the glyph is laid out from the box's top and
		   lands 8 or 9 pixels low, which is what the first photograph showed against the reference
		   guest's own bar — its ellipsis ink is 303–305 against an icon's 298–310, the two centred
		   on the same row. */
		height: var(--winui-AppBarExpandButtonCircleDiameter);
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: CommandBar_themeresources.xaml:839, `FontSize="20"` */
		font-size: 20px;
		/* c1-allow: CommandBar_themeresources.xaml:839, the same `Height` — a three-pixel line box
		   is what puts the glyph's own centre on the box's centre */
		line-height: var(--winui-AppBarExpandButtonCircleDiameter);
	}

	/* EllipsisButton sets border brushes in these states, but BorderThickness="0" at :951 means
	   they paint nothing; those excluded AppBarButton border tokens are deliberately not read. */
	.more:hover .more-fill {
		background: var(--winui-AppBarButtonBackgroundPointerOver);
	}

	.more:hover {
		color: var(--winui-AppBarButtonForegroundPointerOver);
	}

	.more:active .more-fill {
		background: var(--winui-AppBarButtonBackgroundPressed);
	}

	.more:active {
		color: var(--winui-AppBarButtonForegroundPressed);
	}

	.more:disabled .more-fill {
		background: var(--winui-AppBarButtonBackgroundDisabled);
	}

	.more:disabled {
		color: var(--winui-AppBarButtonForegroundDisabled);
		cursor: default;
	}

	.more:disabled .ellipsis {
		color: var(--winui-CommandBarEllipsisIconForegroundDisabled);
	}

	/* Control.IsTemplateFocusTarget is on the ContentPresenter at :1025, so this band hugs the
	   inner fill rather than the button box. */
	.more:focus-visible .more-fill::before {
		content: '';
		position: absolute;
		/* c1-allow: CommandBar_themeresources.xaml:962, `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: CommandBar_themeresources.xaml:962, the same `-3` inset keeps the band concentric */
		border-radius: calc(var(--winui-ControlCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* `MinimalClosed` (:613) translates the clip by `TemplateSettings.MinimalVerticalDelta` and
	   takes the content out of the hit test (:619). Same reading as `HiddenClosed` below: the
	   delta was not in the pin when this was written — `AppBar_Partial.cpp:1340-1342` computes
	   `MinimalVerticalDelta` and the checkout carries it now, unswept — so the outcome is what is reproduced — the ellipsis alone.
	   Layout, no c1-allow. */
	.root[data-display-mode='minimal']:not([data-open='true']) .commands {
		display: none;
	}

	/* `HiddenClosed` (:700) translates the clip by `TemplateSettings.HiddenVerticalDelta` and
	   disables both command hosts (:709, :712). The delta is arithmetic the pin does not carry —
	   there is no `CommandBar.cpp` — so what is reproduced is the outcome, nothing on screen, and
	   the Gallery's own CommandBar page never sets the property, so no baseline compares it with
	   the original. Layout, no c1-allow. */
	.root[data-display-mode='hidden']:not([data-open='true']) {
		height: 0;
	}

	.root[data-display-mode='hidden']:not([data-open='true']) .content-root {
		display: none;
	}

	.root[data-secondary-commands-only='true'] .primary {
		display: none;
	}
</style>
