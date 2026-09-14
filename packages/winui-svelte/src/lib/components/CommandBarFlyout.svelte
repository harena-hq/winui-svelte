<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { FlyoutPlacement } from '../internal/flyout-placement';

	export interface CommandBarFlyoutProps {
		/** PrimaryCommands — the commands on the bar. Not `children`, because a flyout's
		 * `children` is already spoken for: `FlyoutBase` attaches to a trigger, and this library
		 * passes that trigger the props it must spread through the `children` snippet
		 * (`Flyout.svelte`). `CommandBar`'s own `children` *is* its primary commands, so the two
		 * precedents disagree and this control keeps the flyout's. */
		commands?: Snippet;
		/** The element the flyout is attached to. Receives the props it must spread, first. */
		children: Snippet<[Record<string, unknown>]>;
		/** FlyoutBase.Placement. */
		placement?: FlyoutPlacement;
		/** No WinUI member: the gap between the flyout and its trigger, in pixels. `Flyout.svelte`
		 * measured 4 on the reference guest and no pinned dictionary states it. */
		offset?: number;
		/** IsOpen. */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: boolean) => void;
		/** SecondaryCommands — the commands the ellipsis reveals. Their presence is also what
		 *  makes the ellipsis appear at all, under `overflowButtonVisibility`. */
		secondaryCommands?: Snippet;
		/** OverflowButtonVisibility, reduced to what this version builds: `'auto'` shows the
		 *  ellipsis when there are secondary commands, which is
		 *  `CommandBarTemplateSettings.EffectiveOverflowButtonVisibility` (`:1050`). */
		overflowButtonVisibility?: 'auto' | 'visible' | 'collapsed';
		/** IsOpen on the CommandBar inside the flyout — whether the overflow is showing. Named
		 *  for what it does rather than `open`, which this control already spends on the flyout
		 *  itself. */
		expanded?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onExpandedChange?: (expanded: boolean) => void;
		class?: string;
		style?: string;
		/** ADR 0009's `ref` points at the flyout presenter. */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { Popover } from 'bits-ui';
	import CommandBarOverflowPresenter from './CommandBarOverflowPresenter.svelte';
	import { FLYOUT_PLACEMENTS } from '../internal/flyout-placement';
	import { setCommandBarState } from '../internal/command-bar';

	let {
		commands,
		children,
		placement = 'top',
		offset = 4,
		open = $bindable(false),
		onOpenChange,
		secondaryCommands,
		overflowButtonVisibility = 'auto',
		expanded = $bindable(false),
		onExpandedChange,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: CommandBarFlyoutProps = $props();

	const position = $derived(FLYOUT_PLACEMENTS[placement]);
	// CommandBar.svelte:80-83 reduces `EffectiveOverflowButtonVisibility` (`:1050`) the same way,
	// for the same three cases.
	const showOverflowButton = $derived(
		overflowButtonVisibility === 'visible' ||
			(overflowButtonVisibility === 'auto' && secondaryCommands !== undefined)
	);
	const overflowShown = $derived(expanded && secondaryCommands !== undefined);

	function setExpanded(next: boolean) {
		if (expanded === next) return;
		expanded = next;
		onExpandedChange?.(next);
	}

	// `ClosedDisplayMode="Compact"` only makes a bottom-labelled closed bar compact. This bar's
	// `DefaultLabelPosition="Collapsed"` chooses its 40px icon row instead.
	setCommandBarState(() => ({
		compact: false,
		labelPosition: 'collapsed',
		inOverflow: false,
		overflowWithMenuIcons: false,
		overflowWithToggleButtons: false,
		subItemChevronVisible: false
	}));
</script>

<!-- This drives the popup itself rather than composing `Flyout`, because upstream's two flyouts
     are siblings: `CommandBarFlyout` and `Flyout` both derive from `FlyoutBase` and neither
     wraps the other. A `FlyoutPresenter`'s background, border, radius, padding and min and max
     sizes are `Flyout`'s own chrome, and `DefaultCommandBarFlyoutCommandBarStyle` supplies every
     one of them itself (:627-642) — composing the two drew both, which is what the first
     screenshot of this control showed: two rounded borders, one inside the other. -->
<Popover.Root
	bind:open={
		() => open,
		(next) => {
			open = next;
			onOpenChange?.(next);
			// `CommandBarFlyout.cpp` reopens a flyout collapsed; a closed flyout that kept its
			// expansion would reopen showing an overflow nobody asked for.
			if (!next) setExpanded(false);
		}
	}
>
	<Popover.Trigger>
		{#snippet child({ props })}
			{@render children(props)}
		{/snippet}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content side={position.side} align={position.align} sideOffset={offset}>
			{#snippet child({ props, wrapperProps })}
				<div {...wrapperProps}>
					<!-- `OuterContentRoot` and `ContentRoot` (:1021, :1022) are one `.surface`, and
					     `PrimaryItemsRoot` (:1038) is `.bar`. -->
					<div class={['surface', overflowShown && 'expanded']}>
						<div
							{...props}
							bind:this={ref}
							class={['bar', 'winui-BodyTextBlockStyle', className]}
							{style}
							{...rest}
						>
							<div class="primary">{@render commands?.()}</div>
							{#if showOverflowButton}
								<button
									type="button"
									class="more"
									aria-label="See more"
									aria-expanded={expanded}
									onclick={() => setExpanded(!expanded)}
								>
									<!-- `FontWeight="SemiBold"` (:575) styles button text, and this button's only
									     content is a FontIcon. -->
									<span class="ellipsis" aria-hidden="true"></span>
								</button>
							{/if}
						</div>
						{#if overflowShown}
							<!-- `OverflowPopup` (`:1057`) and `OuterOverflowContentRootV2` (`:1063`).
							     WD-087: the intrinsic width deliberately has no measured endpoints for the
							     upstream expansion animation, so this version renders its final end states. -->
							<CommandBarOverflowPresenter class="overflow" subItemChevronVisible>
								{@render secondaryCommands?.()}
							</CommandBarOverflowPresenter>
						{/if}
					</div>
				</div>
			{/snippet}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>

<style>
	/* `OuterContentRoot` (`:1021`) sized by `FlyoutTemplateSettings.CurrentWidth`, which
	   `CommandBarFlyoutCommandBar.cpp:886` computes as
	   `min(MaxWidth, max(collapsedWidth, overflowPopupSize.Width))`. A `max-content` width
	   clamped by `max-width` over one `minmax(0, 1fr)` column is that expression: the column takes
	   the larger max-content contribution, the clamp caps it, and both children stretch to it.

	   The shadow is here rather than on either box inside. `:1007` gives
	   `OuterOverflowContentRootV2` its own `CommandBarFlyoutOverflowShadow` while the popup host
	   casts the bar's; they read as one shadow around one surface. */
	.surface {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		width: max-content;
		max-width: 440px;
		border-radius: var(--winui-OverlayCornerRadius);
		box-shadow: var(--winui-PopupShadow);
	}

	.bar {
		box-sizing: border-box;
		display: grid;
		/* `:1040-1041`'s two columns are `*` and `Auto MinWidth="3"`, and a XAML `Auto` column is
		   content-sized where a CSS `auto` track is stretched by the free-space step. */
		grid-template-columns: auto auto;
		justify-content: start;
		align-items: center;
		border: var(--winui-CommandBarFlyoutBorderThemeThickness) solid
			var(--winui-CommandBarFlyoutBorderBrush);
		border-radius: var(--winui-OverlayCornerRadius);
		/* WD-002: `CommandBarFlyoutBackground` is `DesktopAcrylicTransparentBrush`, `#00000000` in
		   all three themes — the bar paints nothing, and what the original actually shows is its
		   `SystemBackdrop`, `AcrylicBackgroundFillColorDefaultBackdrop` (`:110`, `:626`), a bare
		   `<DesktopAcrylicBackdrop />` with no value a stylesheet could carry. Same route
		   `MenuFlyout` took to the same place; see docs/divergences.md. The control's own brush
		   composites over the fallback so a consumer's override still lands. */
		background:
			linear-gradient(
					var(--winui-CommandBarFlyoutBackground),
					var(--winui-CommandBarFlyoutBackground)
				)
				padding-box,
			var(--winui-AcrylicBackgroundFillColorDefaultBrush) padding-box;
		color: var(--winui-CommandBarFlyoutForeground);
		/* The focus scope focuses this element from script when the flyout opens, and Chromium
		   grants `:focus-visible` to a scripted focus on a `tabindex="-1"` element. `Flyout.svelte`
		   and `Popup.svelte` carry the same rule for the same reason. */
		outline: none;
	}

	/* `ExpandedUp` (`:837`) puts the overflow above the primary row and `ExpandedDown` (`:849`)
	   below it. `bits-ui` publishes the placed side, after collision handling, as `data-side` on
	   the props handed to this snippet. `ExpandedUpWithPrimaryCommands` (`:966`) removes the
	   overflow's bottom edge; no setter changes the bar's four border edges. */
	.surface.expanded:has(.bar[data-side='top']) .bar {
		border-radius: 0 0 var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius);
	}

	.surface.expanded:has(.bar[data-side='top']) :global(.overflow) {
		order: -1;
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
		border-width: var(--winui-CommandBarFlyoutBorderUpThemeThickness);
	}

	/* `ExpandedDownWithPrimaryCommands` (`:975`), the mirror image, removes the top edge. */
	.surface.expanded:has(.bar[data-side='bottom']) .bar {
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
	}

	.surface.expanded:has(.bar[data-side='bottom']) :global(.overflow) {
		border-radius: 0 0 var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius);
		border-width: var(--winui-CommandBarFlyoutBorderDownThemeThickness);
	}

	/* CommandBarFlyout_themeresources.xaml:112, :113, :188, :189, :195, :196, :202, :203, :280. */
	.primary {
		--winui-AppBarButtonBackground: var(--winui-CommandBarFlyoutAppBarButtonBackground);
		--winui-AppBarButtonBackgroundPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundPointerOver
		);
		--winui-AppBarButtonBackgroundPressed: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundPressed
		);
		--winui-AppBarButtonBackgroundDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundDisabled
		);
		--winui-AppBarButtonForeground: var(--winui-CommandBarFlyoutAppBarButtonForeground);
		--winui-AppBarButtonForegroundPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPointerOver
		);
		--winui-AppBarButtonForegroundPressed: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPressed
		);
		--winui-AppBarButtonForegroundDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundDisabled
		);
		--winui-AppBarButtonInnerBorderMargin: var(
			--winui-CommandBarFlyoutAppBarButtonInnerBorderMargin
		);
		display: flex;
		flex-direction: row;
		justify-content: start;
		height: 40px;
		margin: 3px 0 3px 3px;
	}

	/* `CommandBarFlyoutCommandBarOverflowPresenterStyle` (`:527-562`) repoints named brushes and
	   states three sizes. The compound selector out-specifies the presenter's `.root` rule, so
	   the cascade does not depend on stylesheet emission order. */
	.surface :global(.overflow) {
		/* WD-002, one box over from `.bar`. `:528` points the presenter at
		   `CommandBarFlyoutButtonBackground`, which is `SystemControlTransparentBrush` — literally
		   `transparent` — in both light and dark, because the overflow popup carries its own
		   backdrop link (`CommandBarFlyoutCommandBar.cpp:251-256` and `:737-741`) to the same
		   `SystemBackdrop` the bar uses, and that is the fill the original shows. Redefining the
		   presenter's background property to that brush alone leaves the menu see-through:
		   measured on the built page before this rule, the overflow's `backgroundColor` was
		   `rgba(0, 0, 0, 0)`, its `background-image` was `none`, and the page's own colour change
		   was visible straight through the command rows. So the brush composites over the same
		   fallback `.bar` uses, and a consumer's override still lands on top. */
		background:
			linear-gradient(
					var(--winui-CommandBarFlyoutButtonBackground),
					var(--winui-CommandBarFlyoutButtonBackground)
				)
				padding-box,
			var(--winui-AcrylicBackgroundFillColorDefaultBrush) padding-box;
		/* `:1085` binds the presenter's border thickness at its use site. */
		--winui-CommandBarOverflowPresenterBorderThickness: var(
			--winui-CommandBarFlyoutBorderThemeThickness
		);
		/* `:1085`, `BorderBrush="{TemplateBinding BorderBrush}"`. */
		--winui-CommandBarOverflowPresenterBorderBrush: var(--winui-CommandBarFlyoutBorderBrush);
		/* `:552` supplies the flyout's overflow-only chevron and accelerator foregrounds. */
		--winui-AppBarButtonSubItemChevronForeground: var(
			--winui-CommandBarFlyoutAppBarButtonSubItemChevronForeground
		);
		--winui-AppBarButtonKeyboardAcceleratorTextForeground: var(
			--winui-CommandBarFlyoutAppBarButtonKeyboardTextLabelForeground
		);
		/* `:530`, `:531`, and `:532`; these are layout literals. */
		min-width: 136px;
		max-width: 440px;
		max-height: 480px;
		box-shadow: none;
	}

	/* `:556`, `<ItemsPresenter Margin="3" />`; `.items` is the presenter's only child. */
	.surface :global(.overflow > *) {
		margin: 3px;
	}

	/* `AppBarButton.svelte:162` pins a command at `AppBarButton_themeresources.xaml:136`'s
	   `Width="68"`, the icon-over-label column. This style sets `Width="NaN"` (`:120`) and floors
	   the content at `ContentRoot`'s `MinWidth="40"` (`:285`) instead, so a flyout command is as
	   wide as its icon and no wider. Measured before this rule: three icon-only commands were 68
	   apiece against the template's 40. */
	.primary > :global(.root) {
		width: auto;
		min-width: 40px;
	}

	/* The button itself paints nothing. `:619`'s ContentPresenter is what carries the background
	   and the corner radius, inset by `CommandBarFlyoutAppBarEllipsisButtonInnerBorderMargin`
	   (`:108`, `2,2,6,2` — left, top, right, bottom), so the highlight is a 36 by 36 rounded
	   square two pixels in from the left edge and six from the right, not a 44 by 40 slab.
	   `AppBarButton.svelte:188-193` builds its own inner border the same way. */
	.more {
		position: relative;
		width: 44px;
		min-height: 40px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--winui-CommandBarFlyoutAppBarButtonForeground);
		cursor: pointer;
	}

	.more::before {
		content: '';
		position: absolute;
		inset: var(--winui-CommandBarFlyoutAppBarEllipsisButtonInnerBorderMargin);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-CommandBarFlyoutAppBarButtonBackground);
	}

	.more:hover::before {
		background: var(--winui-CommandBarFlyoutAppBarButtonBackgroundPointerOver);
	}

	.more:hover {
		color: var(--winui-CommandBarFlyoutAppBarButtonForegroundPointerOver);
	}

	.more:active::before {
		background: var(--winui-CommandBarFlyoutAppBarButtonBackgroundPressed);
	}

	.more:active {
		color: var(--winui-CommandBarFlyoutAppBarButtonForegroundPressed);
	}

	.more:disabled::before {
		background: var(--winui-CommandBarFlyoutAppBarButtonBackgroundDisabled);
	}

	.more:disabled {
		color: var(--winui-CommandBarFlyoutAppBarButtonForegroundDisabled);
		cursor: default;
	}

	/* The glyph centres in the inner border rather than in the button, which is what
	   `HorizontalContentAlignment="Center"` (`:570`) means once the ContentPresenter carries the
	   margin: the inner box spans 2 to 38 of the button's 44, so its centre is two pixels left
	   of the button's. */
	.ellipsis {
		position: absolute;
		inset: var(--winui-CommandBarFlyoutAppBarEllipsisButtonInnerBorderMargin);
		display: grid;
		place-items: center;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: CommandBarFlyout_themeresources.xaml:1054, `FontSize="16"` */
		font-size: 16px;
	}

	.ellipsis::after {
		content: '\E712';
	}
</style>
