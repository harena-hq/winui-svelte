<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { MenuFlyoutEntry } from './MenuFlyout.svelte';

	export interface SplitButtonProps {
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. Disables both halves. */
		disabled?: boolean | null;
		/** Content — the primary half's label, as the default snippet. */
		children?: Snippet;
		/**
		 * SplitButton's `Click`, and the primary half only. `SplitButton.cpp:271` raises it
		 * from `OnClickPrimary`; `OnClickSecondary` (`:282`) does nothing but open the flyout.
		 * It is a named prop rather than part of the rest spread because the rest spread
		 * lands on the root, where a click handler would catch both halves.
		 */
		onclick?: (event: MouseEvent) => void;
		/**
		 * Flyout, narrowed to a menu. Unlike `DropDownButton`, which inherits `Button.Flyout`
		 * and leaves it to the consumer, `SplitButton` declares `Flyout` itself
		 * (`SplitButton.cpp:79`) and shows it with an explicit placement
		 * (`OpenFlyout`, `:221`). The control owns it here for the same reason: the placement
		 * is not the consumer's to get wrong, and only half the control is the trigger.
		 */
		items?: MenuFlyoutEntry[];
		/** IsFlyoutOpen — `SplitButton.h:27`. Bindable, per ADR 0009. */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: boolean) => void;
		/** `MenuFlyoutItem.Click`, reported by id — passed through to `MenuFlyout`. */
		onItemInvoked?: (id: string) => void;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/** The root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	type SplitButtonInternalProps = SplitButtonProps & { checked?: boolean; toggle?: boolean };
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	import MenuFlyout from './MenuFlyout.svelte';

	let {
		disabled = false,
		children,
		onclick,
		items,
		open = $bindable(false),
		onOpenChange,
		onItemInvoked,
		class: className,
		style,
		ref = $bindable(null),
		checked = false,
		toggle = false,
		...rest
	}: SplitButtonInternalProps = $props();

	const str = useStrings();

	// `$state`, not a plain `let`: this component is in runes mode, where a plain `let` the
	// template reads is a snapshot rather than a signal — the flag would flip and nothing
	// would re-render, which is how `TouchPressed` silently never appeared.
	let keyDown = $state(false);
	let pressedKey: string | undefined;
	// `dataState` rather than the library's usual `state`: a local binding of that name and the
	// `$state` rune above cannot coexist in one component — svelte-check resolves the rune to
	// the local and reports it used before its declaration.
	const dataState = $derived(
		[checked && 'checked', open && 'flyout-open', keyDown && 'key-down'].filter(Boolean).join(' ')
	);

	function isActivationKey(event: KeyboardEvent) {
		return event.key === ' ' || event.key === 'Enter';
	}

	function keydown(event: KeyboardEvent) {
		// SplitButton.cpp:327 also lists GamepadA, which has no web KeyboardEvent equivalent.
		if (!isActivationKey(event) || event.repeat) return;
		if (event.key === ' ') event.preventDefault();
		pressedKey = event.key;
		keyDown = true;
	}

	function keyup(event: KeyboardEvent) {
		if (event.key !== pressedKey) return;
		pressedKey = undefined;
		keyDown = false;
	}

	function focusout(event: FocusEvent) {
		if (!ref?.contains(event.relatedTarget as Node | null)) {
			pressedKey = undefined;
			keyDown = false;
		}
	}
</script>

<!-- The parameter carries no type annotation on purpose. `svelte-package` preprocesses the
     script bodies to plain JS and `scripts/package/strip-script-lang.mjs` takes the language
     attribute off the tag, but neither of them touches markup — so an annotation here would
     ship to `dist` in a file that no longer claims to hold TypeScript, and every consumer's
     compiler would reject it. -->
{#snippet secondary(triggerProps = {})}
	<!-- SplitButton.cpp:50 reads SR_SplitButtonSecondaryButtonName, “More Options”. -->
	<button
		type="button"
		{...triggerProps}
		class="secondary"
		aria-label={str('SplitButtonSecondaryButtonName')}
		{disabled}
	>
		<span class="chevron" aria-hidden="true">{String.fromCodePoint(0xe96e)}</span>
	</button>
{/snippet}

<!-- WD-019: HTML exposes two real button tab stops and has no keyboard-only secondary span. -->
<!-- eslint-disable svelte/no-unused-svelte-ignore -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={ref}
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	data-state={dataState}
	onkeydown={keydown}
	onkeyup={keyup}
	onfocusout={focusout}
	{...rest}
>
	<button
		type="button"
		class="primary"
		{disabled}
		aria-pressed={toggle ? checked : undefined}
		{onclick}
	>
		{@render children?.()}
	</button>
	<span class="divider" aria-hidden="true"></span>
	{#if items && items.length > 0}
		<!-- `SplitButton::OpenFlyout` (SplitButton.cpp:221) sets
		     FlyoutPlacementMode.BottomEdgeAlignedLeft on the show options rather than
		     letting the flyout use its own placement, so this is not a prop. It also calls
		     `ShowAt(*this, options)` at :227 — the anchor is the whole control, not the
		     chevron half that triggers it — which is what `anchor` carries. -->
		<MenuFlyout
			{items}
			placement="bottomEdgeAlignedLeft"
			anchor={ref}
			bind:open
			{onOpenChange}
			{onItemInvoked}
		>
			{#snippet children(triggerProps)}
				{@render secondary(triggerProps)}
			{/snippet}
		</MenuFlyout>
	{:else}
		{@render secondary()}
	{/if}
</div>

<!-- eslint-enable svelte/no-unused-svelte-ignore -->

<style>
	.root {
		position: relative;
		display: inline-flex;
		align-items: stretch;
		border-radius: var(--winui-ControlCornerRadius);
	}

	.primary,
	.secondary {
		position: relative;
		border: none;
		font: inherit;
		cursor: pointer;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	.primary {
		flex: 1 1 auto;
		min-width: var(--winui-SplitButtonPrimaryButtonSize);
		padding: var(--winui-SplitButtonPadding);
	}

	.divider {
		width: 1px;
		flex: 0 0 1px;
		align-self: stretch;
	}

	.secondary {
		flex: 0 0 var(--winui-SplitButtonSecondaryButtonSize);
		padding: 0 12px 0 0;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	/* The gradient rings are overlay grids upstream, so the fills need no clip keyword. */
	.primary::after,
	.secondary::after {
		content: '';
		position: absolute;
		inset: 0;
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
	}

	/* SplitButton.xaml:238 uses BorderThickness="1,1,0,1" so the halves meet at the divider. */
	.primary::after {
		padding: var(--winui-SplitButtonBorderThemeThickness) 0
			var(--winui-SplitButtonBorderThemeThickness) var(--winui-SplitButtonBorderThemeThickness);
		/* The pin writes 4 here at :238; ControlCornerRadius agrees in every theme. */
		border-radius: var(--winui-ControlCornerRadius) 0 0 var(--winui-ControlCornerRadius);
	}

	/* SplitButton.xaml:239 uses BorderThickness="0,1,1,1". */
	.secondary::after {
		padding: var(--winui-SplitButtonBorderThemeThickness)
			var(--winui-SplitButtonBorderThemeThickness) var(--winui-SplitButtonBorderThemeThickness) 0;
		/* The pin writes 4 here at :239; ControlCornerRadius agrees in every theme. */
		border-radius: 0 var(--winui-ControlCornerRadius) var(--winui-ControlCornerRadius) 0;
	}

	/* The system focus visual belongs to the root, while its focusable controls are its children.
	   `:has(:focus-visible)` matches WinUI's keyboard focus state without drawing after a click. */
	.root:has(:focus-visible)::before {
		content: '';
		position: absolute;
		/* SplitButton.xaml:14, FocusVisualMargin="-1". */
		inset: -1px;
		/* c1-allow: SplitButton.xaml:14, FocusVisualMargin="-1" */
		border-radius: calc(var(--winui-ControlCornerRadius) + 1px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* Normal */
	.primary {
		background: var(--winui-SplitButtonBackground);
		color: var(--winui-SplitButtonForeground);
	}
	.secondary {
		background: var(--winui-SplitButtonBackground);
		color: var(--winui-SplitButtonForegroundSecondary);
	}
	.divider {
		background: var(--winui-SplitButtonBorderBrushDivider);
	}
	.primary::after,
	.secondary::after {
		background: var(--winui-SplitButtonBorderBrush);
	}

	/* Hover: SplitButton.xaml:119's secondary Button border has BorderThickness="0"; no ring changes. */
	.root:not([data-state~='checked']):not([data-state~='flyout-open']):not([data-state~='key-down'])
		.primary:hover {
		background: var(--winui-SplitButtonBackgroundPointerOver);
		color: var(--winui-SplitButtonForegroundPointerOver);
	}
	.root:not([data-state~='checked']):not([data-state~='flyout-open']):not(
			[data-state~='key-down']
		):not(:where(:has(.primary:hover, .primary:active)))
		.secondary:hover {
		background: var(--winui-SplitButtonBackgroundPointerOver);
		/* The pin maps the chevron to the primary pointer-over foreground. */
		color: var(--winui-SplitButtonForegroundPointerOver);
	}

	/* Press */
	.root:not([data-state~='checked']):not([data-state~='flyout-open']):not([data-state~='key-down'])
		.primary:active {
		background: var(--winui-SplitButtonBackgroundPressed);
		color: var(--winui-SplitButtonForegroundPressed);
	}
	.root:not([data-state~='checked']):not([data-state~='flyout-open']):not([data-state~='key-down'])
		.primary:active::after {
		background: var(--winui-SplitButtonBorderBrushPressed);
	}
	.root:not([data-state~='checked']):not([data-state~='flyout-open']):not(
			[data-state~='key-down']
		):not(:where(:has(.primary:hover, .primary:active)))
		.secondary:active {
		background: var(--winui-SplitButtonBackgroundPressed);
		color: var(--winui-SplitButtonForegroundSecondaryPressed);
	}
	.root:not([data-state~='checked']):not([data-state~='flyout-open']):not(
			[data-state~='key-down']
		):not(:where(:has(.primary:hover, .primary:active)))
		.secondary:active::after {
		background: var(--winui-SplitButtonBorderBrushPressed);
	}

	/* Checked */
	.root[data-state~='checked'] .primary,
	.root[data-state~='checked'] .secondary {
		background: var(--winui-SplitButtonBackgroundChecked);
		color: var(--winui-SplitButtonForegroundChecked);
	}
	.root[data-state~='checked'] .divider {
		background: var(--winui-SplitButtonBorderBrushCheckedDivider);
	}
	.root[data-state~='checked'] .primary::after,
	.root[data-state~='checked'] .secondary::after {
		background: var(--winui-SplitButtonBorderBrushChecked);
	}
	.root[data-state~='checked']:not([data-state~='flyout-open']):not([data-state~='key-down'])
		.primary:hover {
		background: var(--winui-SplitButtonBackgroundCheckedPointerOver);
		color: var(--winui-SplitButtonForegroundCheckedPointerOver);
	}
	.root[data-state~='checked']:not([data-state~='flyout-open']):not([data-state~='key-down']):not(
			:where(:has(.primary:hover, .primary:active))
		)
		.secondary:hover {
		background: var(--winui-SplitButtonBackgroundCheckedPointerOver);
		color: var(--winui-SplitButtonForegroundCheckedPointerOver);
	}
	.root[data-state~='checked']:not([data-state~='flyout-open']):not([data-state~='key-down'])
		.primary:active,
	.root[data-state~='checked']:not([data-state~='flyout-open']):not([data-state~='key-down']):not(
			:where(:has(.primary:hover, .primary:active))
		)
		.secondary:active {
		background: var(--winui-SplitButtonBackgroundCheckedPressed);
		color: var(--winui-SplitButtonForegroundCheckedPressed);
	}

	/* FlyoutOpen and TouchPressed have identical setter lists at SplitButton.xaml:80 and :90. */
	.root:not([data-state~='checked'])[data-state~='flyout-open'] .primary,
	.root:not([data-state~='checked'])[data-state~='flyout-open'] .secondary,
	.root:not([data-state~='checked'])[data-state~='key-down'] .primary,
	.root:not([data-state~='checked'])[data-state~='key-down'] .secondary {
		background: var(--winui-SplitButtonBackgroundPressed);
		color: var(--winui-SplitButtonForegroundPressed);
	}
	.root:not([data-state~='checked'])[data-state~='flyout-open'] .secondary,
	.root:not([data-state~='checked'])[data-state~='key-down'] .secondary {
		color: var(--winui-SplitButtonForegroundSecondaryPressed);
	}
	.root:not([data-state~='checked'])[data-state~='flyout-open'] .primary::after,
	.root:not([data-state~='checked'])[data-state~='flyout-open'] .secondary::after,
	.root:not([data-state~='checked'])[data-state~='key-down'] .primary::after,
	.root:not([data-state~='checked'])[data-state~='key-down'] .secondary::after {
		background: var(--winui-SplitButtonBorderBrushPressed);
	}
	.root[data-state~='checked'][data-state~='flyout-open'] .primary,
	.root[data-state~='checked'][data-state~='flyout-open'] .secondary,
	.root[data-state~='checked'][data-state~='key-down'] .primary,
	.root[data-state~='checked'][data-state~='key-down'] .secondary {
		background: var(--winui-SplitButtonBackgroundCheckedPressed);
		color: var(--winui-SplitButtonForegroundCheckedPressed);
	}
	.root[data-state~='checked'][data-state~='flyout-open'] .primary::after,
	.root[data-state~='checked'][data-state~='flyout-open'] .secondary::after,
	.root[data-state~='checked'][data-state~='key-down'] .primary::after,
	.root[data-state~='checked'][data-state~='key-down'] .secondary::after {
		background: var(--winui-SplitButtonBorderBrushCheckedPressed);
	}

	/* Disabled is the inner Button style at SplitButton.xaml:52; its divider stays unchanged. */
	.root:has(.primary:disabled):has(.secondary:disabled) .primary,
	.root:has(.primary:disabled):has(.secondary:disabled) .secondary {
		background: var(--winui-SplitButtonBackgroundDisabled);
		color: var(--winui-SplitButtonForegroundDisabled);
		cursor: default;
	}
	.root:has(.primary:disabled):has(.secondary:disabled) .primary::after,
	.root:has(.primary:disabled):has(.secondary:disabled) .secondary::after {
		background: var(--winui-SplitButtonBorderBrushDisabled);
	}
	.root:has(.primary:disabled):has(.secondary:disabled) .divider {
		background: var(--winui-SplitButtonBorderBrushDivider);
	}

	/* AnimatedIcon's static fallback under WD-006, SplitButton.xaml:230–233. */
	.chevron {
		width: 12px;
		height: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: SplitButton.xaml:233, FontSize="8" on the fallback FontIconSource */
		font-size: 8px;
		line-height: normal;
	}
</style>
