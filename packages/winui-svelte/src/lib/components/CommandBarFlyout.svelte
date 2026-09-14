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
		class?: string;
		style?: string;
		/** ADR 0009's `ref` points at the flyout presenter. */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { Popover } from 'bits-ui';
	import { FLYOUT_PLACEMENTS } from '../internal/flyout-placement';
	import { setCommandBarState } from '../internal/command-bar';

	let {
		commands,
		children,
		placement = 'top',
		offset = 4,
		open = $bindable(false),
		onOpenChange,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: CommandBarFlyoutProps = $props();

	const position = $derived(FLYOUT_PLACEMENTS[placement]);

	// `ClosedDisplayMode="Compact"` only makes a bottom-labelled closed bar compact. This bar's
	// `DefaultLabelPosition="Collapsed"` chooses its 40px icon row instead.
	setCommandBarState(() => ({
		compact: false,
		labelPosition: 'collapsed',
		inOverflow: false,
		overflowWithMenuIcons: false,
		overflowWithToggleButtons: false
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
					<!-- `OuterContentRoot`, `ContentRoot` and `PrimaryItemsRoot` (:1021, :1022, :1038)
					     are one element here: nothing between them differs until unit 16 adds the clip
					     and the overflow popup. -->
					<div
						{...props}
						bind:this={ref}
						class={['bar', 'winui-BodyTextBlockStyle', className]}
						{style}
						{...rest}
					>
						<div class="primary">{@render commands?.()}</div>
						<!-- Unit 16 supplies the overflow this opens; until then its click handler is
						     deliberately absent. -->
						<button type="button" class="more" aria-label="See more">
							<!-- `FontWeight="SemiBold"` (:575) styles button text, and this button's only
							     content is a FontIcon. -->
							<span class="ellipsis" aria-hidden="true"></span>
						</button>
					</div>
				</div>
			{/snippet}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>

<style>
	.bar {
		box-sizing: border-box;
		display: grid;
		/* `:1040-1041`'s two columns are `*` and `Auto MinWidth="3"`, and a XAML `Auto` column is
		   content-sized where a CSS `auto` track is stretched by the free-space step. */
		grid-template-columns: auto auto;
		justify-content: start;
		align-items: center;
		max-width: 440px;
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
		box-shadow: var(--winui-PopupShadow);
		color: var(--winui-CommandBarFlyoutForeground);
		/* The focus scope focuses this element from script when the flyout opens, and Chromium
		   grants `:focus-visible` to a scripted focus on a `tabindex="-1"` element. `Flyout.svelte`
		   and `Popup.svelte` carry the same rule for the same reason. */
		outline: none;
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
