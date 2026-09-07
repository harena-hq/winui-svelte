<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface CommandBarProps {
		/** PrimaryCommands — the commands on the bar. `CommandBar`'s XAML `ContentProperty`, so
		 *  ADR 0009 makes it `children`. */
		children?: Snippet;
		/** SecondaryCommands — the commands in the overflow menu. Rendered nowhere in this version:
		 *  the surface that shows them is the next unit's. It is accepted here because
		 *  `OverflowButtonVisibility="Auto"` is decided by whether there are any. */
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
		/** No WinUI member: the "see more" button was clicked. `IsOpen` and the surface it opens
		 *  are the next unit's; this is the click, reported so a consumer is not stuck. */
		onOverflowButtonClick?: (event: MouseEvent) => void;
		class?: string;
		style?: string;
		/** ADR 0009's `ref` points at the interactive element; a CommandBar is `IsTabStop="False"`
		 *  (`:81`) and has none, so this is the root. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { setCommandBarState } from '../internal/command-bar';

	let {
		children,
		secondaryCommands,
		content,
		closedDisplayMode = 'compact',
		defaultLabelPosition = 'bottom',
		overflowButtonVisibility = 'auto',
		disabled = false,
		onOverflowButtonClick,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: CommandBarProps = $props();

	// A bar whose labels are underneath shows them only when it is open, so its closed commands
	// are Compact; a bar whose labels are on the right or collapsed says so through labelPosition
	// and its commands are not additionally compact.
	setCommandBarState(() => ({
		compact: closedDisplayMode === 'compact' && defaultLabelPosition === 'bottom',
		labelPosition: defaultLabelPosition,
		inOverflow: false,
		overflowWithMenuIcons: false,
		overflowWithToggleButtons: false
	}));

	const showOverflowButton = $derived(
		overflowButtonVisibility === 'visible' ||
			(overflowButtonVisibility === 'auto' && secondaryCommands !== undefined)
	);
	const secondaryCommandsOnly = $derived(children === undefined && secondaryCommands !== undefined);
</script>

<div
	bind:this={ref}
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	data-display-mode={closedDisplayMode}
	data-secondary-commands-only={secondaryCommandsOnly ? 'true' : undefined}
	{...rest}
>
	<div class="content-root">
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
				aria-label="See more"
				onclick={onOverflowButtonClick}
			>
				<span class="more-fill">
					<!-- CommandBar_themeresources.xaml:839, `Glyph="&#xE712;"` — a literal in the
					     template, not a resource, so it is a code point here. -->
					<span class="ellipsis" aria-hidden="true">{String.fromCodePoint(0xe712)}</span>
				</span>
			</button>
		{/if}
	</div>
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
	   delta is not in the pin, so the outcome is what is reproduced — the ellipsis alone.
	   Layout, no c1-allow. */
	.root[data-display-mode='minimal'] .commands {
		display: none;
	}

	/* `HiddenClosed` (:700) translates the clip by `TemplateSettings.HiddenVerticalDelta` and
	   disables both command hosts (:709, :712). The delta is arithmetic the pin does not carry —
	   there is no `CommandBar.cpp` — so what is reproduced is the outcome, nothing on screen, and
	   the Gallery's own CommandBar page never sets the property, so no baseline compares it with
	   the original. Layout, no c1-allow. */
	.root[data-display-mode='hidden'] {
		height: 0;
	}

	.root[data-display-mode='hidden'] .content-root {
		display: none;
	}

	.root[data-secondary-commands-only='true'] .primary {
		display: none;
	}
</style>
