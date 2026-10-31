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
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/** ADR 0009's `ref` points at the flyout presenter. */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	import { Popover } from 'bits-ui';
	import CommandBarOverflowPresenter from './CommandBarOverflowPresenter.svelte';
	import { FLYOUT_PLACEMENTS } from '../internal/flyout-placement';
	import {
		setCommandBarRegistry,
		setCommandBarState,
		type CommandBarCommandShape
	} from '../internal/command-bar';

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

	const str = useStrings();

	const position = $derived(FLYOUT_PLACEMENTS[placement]);
	// `AvailableCommandsStates` (`:859`-`:875`), chosen the way `CommandBar_Partial.cpp:589`-`:590`
	// chooses it — including the ordering, which asks about secondary commands first and so puts a
	// bar with neither kind into `PrimaryCommandsOnly` rather than a fourth state. Upstream reads
	// `HasVisibleElements` over two live command collections; a Svelte parent cannot look inside a
	// snippet, so this reduces to whether the snippet was passed at all — the same reduction
	// `showOverflowButton` makes for `secondaryCommands`, and the reduction that
	// `CommandBarFlyoutCommandBar.cpp:670` already is, since it asks `PrimaryCommands().Size()`
	// rather than walking for visibility. A `commands` snippet that renders nothing therefore
	// counts here as a primary command.
	//
	// It is deliberately not derived from `shapes`, which does count the bar's commands: a command
	// registers from an `$effect`, so `shapes` is empty for the first frame after mount and a
	// registry-derived predicate would paint every ordinary flyout's bar collapsed before
	// correcting itself. The snippet's presence is right from the first frame.
	const hasPrimaryCommands = $derived(commands !== undefined);
	const hasSecondaryCommands = $derived(secondaryCommands !== undefined);
	const availableCommands = $derived(
		hasPrimaryCommands && hasSecondaryCommands
			? 'both-commands'
			: !hasSecondaryCommands
				? 'primary-commands-only'
				: 'secondary-commands-only'
	);
	// CommandBar.svelte's `showOverflowButton` reduces `EffectiveOverflowButtonVisibility`
	// (`CommandBarFlyout_themeresources.xaml:1050`) the same way, for the same three cases.
	const showOverflowButton = $derived(
		overflowButtonVisibility === 'visible' ||
			(overflowButtonVisibility === 'auto' && hasSecondaryCommands)
	);
	// `:863`, `PrimaryCommandsOnly` collapses `OverflowContentRoot`. It is written against the
	// state rather than against `secondaryCommands` so that the one place the overflow is decided
	// names the line that decides it: a bar with no secondary commands has no overflow even where
	// `overflowButtonVisibility="visible"` has put an ellipsis on it.
	const overflowShown = $derived(expanded && availableCommands !== 'primary-commands-only');
	let shapes = $state<Array<() => CommandBarCommandShape>>([]);
	setCommandBarRegistry((shape) => {
		shapes.push(shape);
		return () => {
			shapes = shapes.filter((current) => current !== shape);
		};
	});
	const hasPrimaryLabels = $derived(shapes.some((shape) => shape().label));

	function setExpanded(next: boolean) {
		if (expanded === next) return;
		expanded = next;
		onExpandedChange?.(next);
	}

	// `CommandBarFlyoutCommandBar.cpp:33`-`:34`: the primary commands if there are any at all,
	// else the secondary commands, else nothing. The collection is chosen by size and not by
	// focusability, so a bar whose primary commands are all disabled focuses nothing rather than
	// falling through to the menu. `SecondaryCommands()` is `.overflow`, a sibling of `.bar`
	// rather than a child, so it is reached through the surface; it is only in the DOM while the
	// flyout is expanded.
	//
	// `:1381` walks the whole collection and `:1390` counts a command as focused only when the
	// focus call succeeded. That success check is load-bearing rather than defensive: `.focus()`
	// on a hidden element is a silent no-op, and `:enabled` does not test visibility the way
	// `IsControlFocusable` (`:1303`) does. Reading `document.activeElement` back is what closes
	// that gap without a second visibility predicate.
	//
	// `:enabled` matches no `<div>`, which is how upstream's explicit `AppBarSeparator` exclusion
	// at `:1305` falls out of the selector. Two clauses of `:1304` are not reproduced and are not
	// needed by any control here: `AllowFocusWhenDisabled`, and an `aria-disabled` command.
	function focusFirstCommand() {
		const primary = ref?.querySelectorAll<HTMLElement>('.primary > .root') ?? [];
		const secondary = ref?.parentElement?.querySelectorAll<HTMLElement>('.overflow .root') ?? [];
		const commands = primary.length > 0 ? primary : secondary;
		for (const command of commands) {
			if (!command.matches(':enabled')) continue;
			command.focus({ focusVisible: false });
			if (document.activeElement === command) return true;
		}
		return false;
	}

	// `ClosedDisplayMode="Compact"` only makes a bottom-labelled closed bar compact, and `:638`'s
	// `DefaultLabelPosition="Collapsed"` is not what chooses the icon row either: this style's
	// command templates implement no label-position states at all, and collapse `TextLabel` in the
	// markup (`:299`, `:514`) for `PrimaryLabelStates` alone to reverse. So the label position
	// this bar publishes is `PrimaryLabelStates` restated in the vocabulary the commands already
	// speak — `bottom` is `HasPrimaryLabels` and `collapsed` is `NoPrimaryLabels`.
	setCommandBarState(() => ({
		compact: false,
		labelPosition: hasPrimaryLabels ? 'bottom' : 'collapsed',
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
		<Popover.Content
			side={position.side}
			align={position.align}
			sideOffset={offset}
			onOpenAutoFocus={(event) => {
				// `CommandBarFlyoutCommandBar.cpp:49` and `:62` focus a command when the bar opens,
				// both with `FocusState::Programmatic`; the only `FocusState::Keyboard` paths are
				// `:1183` and `:1278`, which are Tab. `Programmatic` moves focus and draws no visual,
				// so upstream's opening flyout has a focused command with no ring on it and the ring
				// appears on the first Tab. `focus({ focusVisible: false })` is that distinction
				// rather than a workaround for it: measured on both engines this project uses, it
				// suppresses `:focus-visible` where a plain `focus()` grants it.
				//
				// `:34` yields `nullptr` for a flyout with neither kind of command and `:36` then does
				// nothing at all. The primitive instead focuses its scope root in that case, which is a
				// different focus move and can pull focus from a later open flyout in the Gallery's
				// multi-flyout harness. Cancel it whether or not a command accepted focus, so the
				// observable result remains the upstream no-op.
				//
				// `:31` gates all of this on `FlyoutShowMode::Standard`; this component has no
				// `ShowMode`, so that condition is not reproduced.
				focusFirstCommand();
				event.preventDefault();
			}}
		>
			{#snippet child({ props, wrapperProps })}
				<div {...wrapperProps}>
					<!-- `{...props}` carries `bits-ui`'s focus scope, and it belongs on the element that
					     holds both command collections. `SecondaryCommands()` (`:34`) is `.overflow`, a
					     sibling of `.bar`, so a scope bound to `.bar` treats focusing a secondary
					     command as focus escaping and pulls it back with a plain `focus()` — which is
					     what draws the visual this unit exists to remove. `.surface` is
					     `OuterContentRoot`/`ContentRoot` (`:1021`, `:1022`), which is upstream's own
					     container for the bar and the overflow together; `PrimaryItemsRoot` (`:1038`)
					     remains `.bar`. -->
					<div
						{...props}
						class={['surface', overflowShown && 'expanded']}
						data-view-state={availableCommands}
					>
						<div
							bind:this={ref}
							class={['bar', 'winui-BodyTextBlockStyle', className]}
							{style}
							{...rest}
						>
							<div
								class="primary"
								data-view-state={hasPrimaryLabels ? 'has-primary-labels' : 'no-primary-labels'}
							>
								{@render commands?.()}
							</div>
							{#if showOverflowButton}
								<button
									type="button"
									class="more"
									aria-label={str('UIA_MORE_BUTTON')}
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
		/* The popup layer. `Popup.svelte`'s `.root` rule carries the whole reason; the short
		   version is that this element is static, so the declaration paints nothing here and
		   is read by the primitive, which mirrors it onto the wrapper it positions. */
		z-index: 1000;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		width: max-content;
		max-width: 440px;
		border-radius: var(--winui-OverlayCornerRadius);
		box-shadow: var(--winui-PopupShadow);
	}

	/* The focus scope focuses its own element from script when the flyout opens and Chromium
	   grants `:focus-visible` to a scripted focus on a `tabindex="-1"` element. That element is
	   now `.surface`. `Flyout.svelte` and `Popup.svelte` carry the same rule for the same
	   reason. */
	.surface:focus {
		outline: none;
	}

	/* `SecondaryCommandsOnly` (`:866`-`:874`). The template's own comment at `:868` says why
	   `PrimaryItemsRoot` is hidden three ways instead of being collapsed: the overflow popup is
	   anchored to it, so it has to keep its place in the layout. `.bar` is `PrimaryItemsRoot`, and
	   `.overflow` is its sibling rather than its child, so hiding it leaves the menu untouched.
	   The border is not zeroed here because `:870` does not zero it — at zero height and zero
	   opacity the two remaining pixels are `box-sizing: border-box`'s floor and nothing sees them.
	   `:988`'s unfiltered `PrimaryItemsRoot.CornerRadius` needs no rule either: it is the radius
	   `.bar` already carries, and the four `both-commands` seam rules below are what stop it being
	   filtered. */
	.surface[data-view-state='secondary-commands-only'] .bar {
		height: 0;
		opacity: 0;
		pointer-events: none;
	}

	/* `:649`–`:651` declare implicit command styles in `LayoutRoot.Resources`, which reaches
	   both the bar and `OverflowPopup`. These resource redefinitions therefore belong on this
	   common `.surface` ancestor rather than on `.primary`. */
	.surface {
		/* `CommandBarFlyoutAppBarButtonStyleBase`, `:111`–`:309`. */
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
		--winui-AppBarButtonInnerBorderOverflowMargin: var(
			--winui-CommandBarFlyoutAppBarButtonInnerBorderMargin
		);
		--winui-AppBarButtonSubItemChevronForeground: var(
			--winui-CommandBarFlyoutAppBarButtonSubItemChevronForeground
		);
		--winui-AppBarButtonSubItemChevronForegroundPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonSubItemChevronPointerOverForeground
		);
		--winui-AppBarButtonSubItemChevronForegroundPressed: var(
			--winui-CommandBarFlyoutAppBarButtonSubItemChevronPressedForeground
		);
		--winui-AppBarButtonSubItemChevronForegroundDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonSubItemChevronDisabledForeground
		);
		--winui-AppBarButtonKeyboardAcceleratorTextForeground: var(
			--winui-CommandBarFlyoutAppBarButtonKeyboardTextLabelForeground
		);
		--winui-AppBarButtonKeyboardAcceleratorTextForegroundPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonKeyboardTextLabelForegroundPointerOver
		);
		--winui-AppBarButtonKeyboardAcceleratorTextForegroundPressed: var(
			--winui-CommandBarFlyoutAppBarButtonKeyboardTextLabelForegroundPressed
		);
		--winui-AppBarButtonKeyboardAcceleratorTextForegroundDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundDisabled
		);

		/* `CommandBarFlyoutAppBarToggleButtonStyleBase`, `:313`–`:523`. */
		--winui-AppBarToggleButtonBackground: var(--winui-CommandBarFlyoutAppBarButtonBackground);
		--winui-AppBarToggleButtonBackgroundPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundPointerOver
		);
		--winui-AppBarToggleButtonBackgroundPressed: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundPressed
		);
		--winui-AppBarToggleButtonBackgroundDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundDisabled
		);
		--winui-AppBarToggleButtonBackgroundChecked: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundChecked
		);
		--winui-AppBarToggleButtonBackgroundCheckedPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundCheckedPointerOver
		);
		--winui-AppBarToggleButtonBackgroundCheckedPressed: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundCheckedPressed
		);
		/* `:407` sets no checked-disabled inner-border background. */
		--winui-AppBarToggleButtonBackgroundCheckedDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonBackground
		);
		--winui-AppBarToggleButtonBackgroundHighLightOverlayPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundPointerOver
		);
		--winui-AppBarToggleButtonBackgroundHighLightOverlayPressed: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundPressed
		);
		--winui-AppBarToggleButtonBackgroundHighLightOverlayCheckedPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundPointerOver
		);
		--winui-AppBarToggleButtonBackgroundHighLightOverlayCheckedPressed: var(
			--winui-CommandBarFlyoutAppBarButtonBackgroundPressed
		);
		--winui-AppBarToggleButtonForeground: var(--winui-CommandBarFlyoutAppBarButtonForeground);
		--winui-AppBarToggleButtonForegroundPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPointerOver
		);
		--winui-AppBarToggleButtonForegroundPressed: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPressed
		);
		--winui-AppBarToggleButtonForegroundDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundDisabled
		);
		--winui-AppBarToggleButtonForegroundChecked: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundChecked
		);
		--winui-AppBarToggleButtonForegroundCheckedPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundCheckedPointerOver
		);
		--winui-AppBarToggleButtonForegroundCheckedPressed: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundCheckedPressed
		);
		--winui-AppBarToggleButtonForegroundCheckedDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundDisabled
		);
		/* The border ring remains transparent in every theme, so C1's forbidden literal zero is unnecessary. */
		--winui-AppBarToggleButtonBorderBrush: var(--winui-CommandBarFlyoutAppBarButtonBorderBrush);
		--winui-AppBarToggleButtonBorderBrushPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonBorderBrush
		);
		--winui-AppBarToggleButtonBorderBrushPressed: var(
			--winui-CommandBarFlyoutAppBarButtonBorderBrush
		);
		--winui-AppBarToggleButtonBorderBrushDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonBorderBrush
		);
		--winui-AppBarToggleButtonBorderBrushChecked: var(
			--winui-CommandBarFlyoutAppBarButtonBorderBrush
		);
		--winui-AppBarToggleButtonBorderBrushCheckedPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonBorderBrush
		);
		--winui-AppBarToggleButtonBorderBrushCheckedPressed: var(
			--winui-CommandBarFlyoutAppBarButtonBorderBrush
		);
		--winui-AppBarToggleButtonBorderBrushCheckedDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonBorderBrush
		);
		--winui-AppBarToggleButtonCheckGlyphForeground: var(
			--winui-CommandBarFlyoutAppBarButtonForeground
		);
		--winui-AppBarToggleButtonCheckGlyphForegroundPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPointerOver
		);
		--winui-AppBarToggleButtonCheckGlyphForegroundPressed: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPressed
		);
		--winui-AppBarToggleButtonOverflowLabelForegroundPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPointerOver
		);
		--winui-AppBarToggleButtonOverflowLabelForegroundPressed: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPressed
		);
		--winui-AppBarToggleButtonOverflowLabelForegroundDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundDisabled
		);
		--winui-AppBarToggleButtonOverflowLabelForegroundCheckedPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPointerOver
		);
		--winui-AppBarToggleButtonOverflowLabelForegroundCheckedPressed: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPressed
		);
		--winui-AppBarToggleButtonOverflowLabelForegroundCheckedDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundDisabled
		);
		--winui-AppBarToggleButtonKeyboardAcceleratorTextForeground: var(
			--winui-CommandBarFlyoutAppBarButtonKeyboardTextLabelForeground
		);
		--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonKeyboardTextLabelForegroundPointerOver
		);
		--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundPressed: var(
			--winui-CommandBarFlyoutAppBarButtonKeyboardTextLabelForegroundPressed
		);
		--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundDisabled
		);
		--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundCheckedPointerOver: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPointerOver
		);
		--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundCheckedPressed: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundPressed
		);
		--winui-AppBarToggleButtonKeyboardAcceleratorTextForegroundCheckedDisabled: var(
			--winui-CommandBarFlyoutAppBarButtonForegroundDisabled
		);
	}

	/* `:285` and `:500` are both `<Grid x:Name="ContentRoot" MinWidth="40">` — a width floor and
	   no height floor at all, where the library's own templates floor the content box at
	   `AppBarThemeCompactHeight` once labels are collapsed. That token is 48, and a 48-pixel
	   content box inside this control's 40-pixel command row overhangs it by eight and carries
	   everything in it four below the row's centre. Measured on the sealed light baseline before
	   this rule: the bar's icon ink spanned rows 260-275 inside a bar interior of 241-286 — a
	   centre of 267.5 against the row's 263.5, in every theme. */
	.primary :global(.root .content) {
		min-height: 0;
	}

	/* `:296` and `:511`: the Viewbox carries no margin in either flyout template, where the
	   library's templates place it with `AppBarButtonContentViewboxCollapsedMargin`
	   (`16,0,2,0`). With the content box no longer floored at 48 this is the whole of the
	   icon's placement, and both command kinds land on the row's centre.

	   `:506` top-aligns the toggle's `IconAndLabelPanel` where `:291` centres the button's, and
	   that asymmetry is deliberately not reproduced. It is observable only with primary labels
	   collapsed, and no reference render of that combination exists: every original that puts a
	   toggle on this bar is the text selection flyout, whose Bold, Italic and Underline carry
	   labels and are therefore in `HasPrimaryLabels`, where `:488` and the button's `:273` both
	   say `Top` and the two agree again. Photographed on the reference guest at 1600x900 from
	   the Gallery's RichEditBox page. Honouring `:506` here would push a toggle's icon twelve
	   pixels above the button's beside it on the strength of a line with no picture behind it;
	   `HasPrimaryLabels` aligns both kinds to `Top` through `align-content: start`, so `:488` and
	   `:273` agree and the asymmetry `:506` would introduce is confined to the collapsed-label
	   bar, which no original render shows. */
	.primary :global(.root .icon) {
		margin: 0;
	}

	/* `:313`'s style states no `BorderThickness` where `:115` states `0` for the button, and
	   `Control.BorderThickness` defaults to zero — so a toggle command in this flyout paints no
	   ring at all and `:316`'s `BorderBrush` never reaches the screen. The library's own template
	   binds `AppBarToggleButtonBorderThemeThickness`, which
	   `AppBarToggleButton_themeresources.xaml:200` defines as 1 in every theme, and C1 will not
	   take a `0` as a custom-property value because that is not a `var()` call — so the zero is
	   said in CSS instead.

	   It is visible in exactly one theme, which is why it was nearly missed: `:32` and `:66` give
	   light and dark `SubtleFillColorTransparentBrush`, where a one-pixel ring is invisible, but
	   `:100` gives high contrast `SystemControlForegroundTransparentBrush` — which despite the
	   name resolves to the system button text colour and drew a box around every toggle command.
	   Photographed on the reference guest before this rule. It also widens the checked command's
	   accent square from 34 to the 36 the two-pixel inner-border margin asks for, in all three. */
	.surface :global(.root .fill) {
		/* c1-allow: CommandBarFlyout_themeresources.xaml:313, the style states no BorderThickness */
		border-width: 0;
	}

	/* `content: none` rather than a zero inset and padding: the ring is an xor of two masks, and
	   at zero width their rounded corners still disagree by a subpixel — photographed in high
	   contrast as four corner marks around every unchecked toggle with the straight edges gone.
	   A pseudo-element that is never generated has no corners to disagree about. */
	.surface :global(.root .fill::after) {
		content: none;
	}

	/* `:301` and `:516`, `Padding="0,6,0,7"`. */
	.surface :global(.overflow-label) {
		padding: 6px 0 7px 0;
	}

	/* `:152`, `:166`, and `:516`: rows reserving a check column indent by 39. */
	.surface :global(.root[data-view-state='overflow-with-toggle-buttons'] .overflow-label),
	.surface :global(.root[data-view-state='overflow-with-menu-icons'] .overflow-label) {
		margin: 0 12px 0 39px;
	}

	/* `:180` and `:356`: rows reserving both columns indent by 67. */
	.surface
		:global(.root[data-view-state='overflow-with-toggle-buttons-and-menu-icons'] .overflow-label) {
		margin: 0 12px 0 67px;
	}

	/* ToggleButton exposes only the two overflow states it owns; its `.check` distinguishes it
	   from the button states that reserve the same check column. */
	.surface :global(.root[data-view-state='overflow']:has(.check) .overflow-label) {
		margin: 0 12px 0 39px;
	}

	.surface :global(.root[data-view-state='overflow-with-menu-icons']:has(.check) .overflow-label) {
		margin: 0 12px 0 67px;
	}

	/* `:177` and `:353`, `ContentViewbox.Margin="39,0,12,0"`. */
	.surface :global(.root[data-view-state='overflow-with-toggle-buttons-and-menu-icons'] .icon),
	.surface :global(.root[data-view-state='overflow-with-menu-icons'][data-checked] .icon) {
		margin: 0 12px 0 39px;
	}

	/* `:505`: no fixed glyph box, a twelve-point glyph, and `15,4,14,4` thickness. */
	.surface :global(.check) {
		width: auto;
		height: auto;
		margin: 4px 14px 4px 15px;
		/* c1-allow: CommandBarFlyout_themeresources.xaml:505, `FontSize="12"` */
		font-size: 12px;
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
	}

	/* `ExpandedUp` (`:837`) puts the overflow above the primary row and `ExpandedDown` (`:849`)
	   below it. `bits-ui` publishes the placed side, after collision handling, as `data-side` on
	   the props handed to this snippet. `ExpandedUpWithPrimaryCommands` (`:966`) removes the
	   overflow's bottom edge; no setter changes the bar's four border edges.

	   The `both-commands` qualifier on all four selectors is `ExpandedUpWithoutPrimaryCommands`
	   (`:984`) and `ExpandedDownWithoutPrimaryCommands` (`:993`), which are one shape and not
	   two: every setter in both is the unfiltered `CornerRadius` and the uniform
	   `CommandBarFlyoutBorderThemeThickness`, which is to say the template's defaults, so the two
	   states exist only to undo the two above. Ours are already the defaults — `.overflow` takes
	   `CommandBarOverflowPresenter.svelte`'s `border` and `border-radius`, `.bar` its own radius —
	   so the transcription is that these four stop matching, and a rule restating the defaults
	   would be decoration. A XAML state group is exclusive and a CSS rule is not; the attribute is
	   what supplies the exclusivity. */
	.surface[data-view-state='both-commands'].expanded[data-side='top'] .bar {
		border-radius: 0 0 var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius);
	}

	.surface[data-view-state='both-commands'].expanded[data-side='top'] :global(.overflow) {
		order: -1;
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
		border-width: var(--winui-CommandBarFlyoutBorderUpThemeThickness);
	}

	/* `ExpandedDownWithPrimaryCommands` (`:975`), the mirror image, removes the top edge. */
	.surface[data-view-state='both-commands'].expanded[data-side='bottom'] .bar {
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
	}

	.surface[data-view-state='both-commands'].expanded[data-side='bottom'] :global(.overflow) {
		border-radius: 0 0 var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius);
		border-width: var(--winui-CommandBarFlyoutBorderDownThemeThickness);
	}

	.primary {
		display: flex;
		flex-direction: row;
		justify-content: start;
		height: 40px;
		margin: 3px 0 3px 3px;
	}

	/* `:1015` and `:1016`: `PrimaryItemsControl.MinHeight` becomes 52 and its `Height` becomes
	   `NaN`, which is XAML for unset — a fixed 40-pixel row becomes an auto one with a 52 floor,
	   so a wrapped label grows the bar instead of spilling out of it. */
	.primary[data-view-state='has-primary-labels'] {
		height: auto;
		min-height: 52px;
	}

	/* `:274` and `:489`, `IconAndLabelPanel.Width="60"`. The panel is `ContentRoot`'s `*` column
	   (`:287`, `:502`) and the only other thing in that grid on the bar is
	   `KeyboardAcceleratorTextLabel`, which `AppBarButtonHelpers.h:204` shows only when the command
	   is drawn with the overflow style — so on the bar the panel's 60 is the whole of the content
	   box's width, and a fixed 60 on the command reproduces it for both command kinds without
	   restating either one's column list.

	   The `display` is `:273`'s and `:488`'s `VerticalAlignment="Top"`, and it is here because a
	   `<button>` does not treat its content as an ordinary block: Chromium centres a button's
	   anonymous content box whenever the button is taller than it, and this row stretches every
	   command to the bar's height. Measured without these two declarations: the content box sat
	   2.5 below the command's top — half of 52 less its 47 — and the icon landed at 11.5 where
	   the template says 9. Making the command a column flex container gives the content box a
	   real `flex-start` instead of the anonymous centring, and leaves it stretched to the 60
	   above. It is deliberately scoped to this state: that same centring is what reproduces
	   `:291`'s `VerticalAlignment="Center"` in `NoPrimaryLabels`, and the same two declarations
	   applied there move the icon to the top of a 40-pixel row. */
	.primary[data-view-state='has-primary-labels'] > :global(.root) {
		width: 60px;
		display: flex;
		flex-direction: column;
	}

	/* `:272` and `:487`, `IconAndLabelPanel.Margin="0,9,0,0"` — a Thickness is left,top,right,bottom,
	   so this is nine at the top and nothing else. The panel has no element of its own here: it is
	   the icon and the label in rows 1 and 2 of `.content`, whose `align-content: start` packs
	   them to the top edge that `:273`'s and `:488`'s `VerticalAlignment="Top"` asks for — the
	   rule above is what makes that edge the command's own. The icon is the panel's first row, so
	   the panel's top margin is the icon's, and putting it here rather than on
	   `.content` leaves the accelerator — vertically centred in `ContentRoot`, not in the panel —
	   where the template puts it. It overrides the `margin: 0` two rules above, which is `:296`'s
	   and `:511`'s unmargined Viewbox and still correct in `NoPrimaryLabels`. */
	.primary[data-view-state='has-primary-labels'] :global(.root .icon) {
		margin: 9px 0 0 0;
	}

	/* `:299` and `:514`, `TextLabel.Margin="0,6,0,2"`, against the library's own
	   `AppBarButtonTextLabelMargin` of `2,0,2,8`. The label's font size needs no rule: this
	   template's `CaptionTextBlockStyle` and the library's `AppBarButtonLabelFontSize` are both 12
	   in every theme. */
	.primary[data-view-state='has-primary-labels'] :global(.root .label) {
		margin: 6px 0 2px 0;
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

	/* AppBarButton.svelte's `.root` pins a command at `AppBarButton_themeresources.xaml:136`'s
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
	   AppBarButton.svelte's `.fill` builds its own inner border the same way. */
	.more {
		position: relative;
		width: 44px;
		min-height: 40px;
		/* `:573`, `VerticalAlignment="Stretch"` — the button is `:569`'s 40 at minimum and otherwise
		   as tall as the bar's interior, which is what makes its hover highlight the full height of
		   the row rather than a 36-pixel band inside a 58-pixel bar. */
		align-self: stretch;
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
		content: '\E712' / '';
	}
</style>
