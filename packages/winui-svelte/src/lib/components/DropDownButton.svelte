<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface DropDownButtonProps {
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean;
		// The upstream `Flyout` property and `IsFlyoutOpen` state are deliberately absent.
		// `MenuFlyout` and `Flyout` own their open state and pass the trigger props through the
		// rest spread, so a DropDownButton is used as that trigger rather than owning a flyout.
		// `aria-expanded` and the open/close handlers therefore arrive through `{...rest}`.
		/** Content — the button's label, as the default snippet. */
		children?: Snippet;
		class?: string;
		style?: string;
		ref?: HTMLButtonElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		disabled = false,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: DropDownButtonProps = $props();
</script>

<button
	bind:this={ref}
	type="button"
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	{disabled}
	{...rest}
>
	{@render children?.()}
	<span class="chevron" aria-hidden="true">{String.fromCodePoint(0xe96e)}</span>
</button>

<style>
	.root {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--winui-ButtonPadding);
		border-style: solid;
		/* `ButtonBorderThemeBrush` resolves to `ControlElevationBorderBrush`, which is a
		   `linear-gradient(...)` in the token layer. The gradient is painted by `.root::after`
		   so it sits on the ring alone; the transparent border reserves the ring's space. */
		border-color: transparent;
		border-width: var(--winui-ButtonBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		/* c1-allow: DropDownButton.xaml:23, `BrushTransition Duration="0:0:0.083"` */
		transition: background 83ms;
		text-align: center;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
	}

	/* The border brush is a gradient, and a gradient cannot be a `border-color`. It is painted
	   on the ring alone by a masked pseudo-element, matching Button's template rendering. */
	.root::after {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--winui-ButtonBorderThemeThickness));
		border-radius: inherit;
		padding: var(--winui-ButtonBorderThemeThickness);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		/* c1-allow: DropDownButton.xaml:23, the same `BrushTransition Duration="0:0:0.083"` */
		transition: background 83ms;
	}

	/* The system focus visual. WinUI draws a 3px band — `FocusVisualPrimaryThickness` outermost,
	   then `FocusVisualSecondaryThickness` inward — whose outer edge sits at the control's border
	   box expanded by `FocusVisualMargin`. `:focus-visible` matches WinUI's keyboard focus state. */
	.root:focus-visible::before {
		content: '';
		position: absolute;
		/* c1-allow: DropDownButton.xaml:15, `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: DropDownButton.xaml:15, the same `-3` inset as the band itself */
		border-radius: calc(var(--winui-ControlCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	.root {
		background: var(--winui-ButtonBackground) padding-box;
		color: var(--winui-ButtonForeground);
	}
	.root::after {
		background: var(--winui-ButtonBorderBrush);
	}
	.root:hover {
		background: var(--winui-ButtonBackgroundPointerOver) padding-box;
		color: var(--winui-ButtonForegroundPointerOver);
	}
	.root:hover::after {
		background: var(--winui-ButtonBorderBrushPointerOver);
	}
	.root:active {
		background: var(--winui-ButtonBackgroundPressed) padding-box;
		color: var(--winui-ButtonForegroundPressed);
	}
	.root:active::after {
		background: var(--winui-ButtonBorderBrushPressed);
	}

	/* `AnimatedIcon` at DropDownButton.xaml:93 is a 12 by 12 second-column child with an
	   8-pixel fallback FontIconSource at :96. The library renders that fallback glyph directly
	   under WD-006. */
	.chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* DropDownButton.xaml:93, `Margin="8,0,0,0"` */
		margin-left: 8px;
		/* DropDownButton.xaml:93, `Width="12"` */
		width: 12px;
		/* DropDownButton.xaml:93, `Height="12"` */
		height: 12px;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: DropDownButton.xaml:96, `FontSize="8"` on the fallback FontIconSource */
		font-size: 8px;
		line-height: normal;
		color: var(--winui-DropDownButtonForegroundSecondary);
	}

	.root:hover .chevron {
		color: var(--winui-DropDownButtonForegroundSecondaryPointerOver);
	}
	.root:active .chevron {
		color: var(--winui-DropDownButtonForegroundSecondaryPressed);
	}
	.root:disabled {
		background: var(--winui-ButtonBackgroundDisabled) padding-box;
		color: var(--winui-ButtonForegroundDisabled);
		cursor: default;
	}
	.root:disabled::after {
		background: var(--winui-ButtonBorderBrushDisabled);
	}
	.root:disabled .chevron {
		/* DropDownButton.xaml:83 explicitly uses `ButtonForegroundDisabled` for the chevron. */
		color: var(--winui-ButtonForegroundDisabled);
	}
</style>
