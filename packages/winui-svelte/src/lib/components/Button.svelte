<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ButtonProps {
		/**
		 * No WinUI member: upstream selects the look with `Style="{StaticResource …}"`, and a
		 * Svelte consumer has no `Style`. `'default' | 'accent' | 'subtle'` name the three
		 * styles `Button_themeresources.xaml` defines, at :154, :235 and :297.
		 */
		variant?: 'default' | 'accent' | 'subtle';
		/**
		 * IsEnabled, inverted to the HTML attribute — ADR 0009: where HTML already has the
		 * attribute, HTML's name and polarity win, because the rest props reach a real
		 * `<button>` where `disabled` is already live.
		 */
		disabled?: boolean | null;
		// Two WinUI members are deliberately absent, and a plain comment says so rather than
		// a `/** */` one: a doc comment here would attach itself to `children` below and a
		// consumer hovering that prop would be told about `Click`.
		//
		// `Click` maps to the DOM's own `onclick`, which the rest props already carry to the
		// underlying `<button>` and which fires for keyboard activation as well as pointer.
		// An `onClick` prop beside it would be two names for one event — the thing ADR
		// 0009's `disabled` rule exists to prevent.
		//
		// `BackgroundSizing` is set per variant, as upstream sets it per style:
		// `InnerBorderEdge` for default and subtle, `OuterBorderEdge` for accent.
		/** Content — the button's label, as the default snippet. */
		children?: Snippet;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLButtonElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		variant = 'default',
		disabled = false,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ButtonProps = $props();
</script>

<button
	bind:this={ref}
	type="button"
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	{disabled}
	data-variant={variant}
	{...rest}
>
	{@render children?.()}
</button>

<style>
	.root {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--winui-ButtonPadding);
		border-style: solid;
		/* `ButtonBorderThemeBrush` resolves to `ControlElevationBorderBrush` and
		   `AccentButtonBorderBrush` to `AccentControlElevationBorderBrush`. Both are a
		   `linear-gradient(...)` in two themes of the three and a flat
		   `SystemColorWindowTextColor` in high contrast, so a border-style declaration
		   naming one as its colour is invalid in two of them. The gradient is painted by
		   `.root::after` so it sits on the ring alone — a two-layer background
		   clipped to `border-box` paints across the whole element rather than
		   across the ring, and an opaque fill covers it completely (accent) or
		   shows through at 70% white (default, subtle). The transparent border
		   reserves the ring's space. */
		border-color: transparent;
		border-width: var(--winui-ButtonBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		/* c1-allow: `BrushTransition Duration="0:0:0.083"` at Button_themeresources.xaml:174, :246, :317 — same value all three styles */
		transition: background 83ms;

		/* `ContentControlThemeFontFamily` and `ControlContentThemeFontSize` are undefined
		   in `controls/dev` at standard density — the former not at all, the latter only
		   in `dll/DensityStyles/Compact.xaml:8` — which is the same hole ADR 0008 describes
		   for the legacy brushes. The composed WinUI `Style` ships as a CSS class (D14),
		   applied to the root via the `class={…}` array above — `winui-BodyTextBlockStyle`
		   (the Body ramp's size and weight) stands in for both, and the side-by-side
		   against the original is what confirms the choice. `font-weight: Normal`
		   upstream is the ramp's 400 — no override. */
		text-align: center;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		/* The user agent draws a focus ring of its own for `:focus-visible`, and it is a
		   second focus visual: `-webkit-focus-ring-color auto`, traced on the element's own
		   border box, where the band above sits 3px outside it. Suppressed on every root
		   that draws its own, so the band is the only ring — as it is in WinUI. */
		outline: none;
	}

	/* The border brush is a gradient, and a gradient cannot be a `border-color`. It used to be
	   a second background layer clipped to `border-box`, which paints across the whole element
	   rather than across the ring — invisible under an opaque fill and not under this one, at
	   70% white. This paints it on the ring alone.

	   `inset` is the negative border width because an absolutely positioned child is placed
	   against its parent's padding box; backing it out by exactly the border width makes the
	   ring's box the parent's border box, so `border-radius: inherit` puts the two curves on
	   top of each other with no correction.

	   The mask is two layers, the inner one clipped to the content box, composited so the
	   content box is punched out. `-webkit-mask-composite: xor` is the same operation under
	   the prefixed property, which is what Safari reads. */
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
		/* c1-allow: `BrushTransition Duration="0:0:0.083"` at Button_themeresources.xaml:174, :246, :317 — same value all three styles */
		transition: background 83ms;
	}

	/* The system focus visual. WinUI draws a 3px band — `FocusVisualPrimaryThickness` of
	   `SystemControlFocusVisualPrimaryBrush` outermost, then `FocusVisualSecondaryThickness`
	   of `…SecondaryBrush` inward — whose outer edge sits at the control's border box
	   expanded by `−FocusVisualMargin`. Two inset shadows rather than two outset ones,
	   because an outset pair paints the wider stroke under the narrower and puts the light
	   ring outside the dark one; inset, the first listed wins and the order comes out right.
	   `:focus-visible` and not `:focus`: WinUI draws this for `FocusState.Keyboard` only, so
	   a control reached with the pointer shows nothing. */
	.root:focus-visible::before {
		content: '';
		position: absolute;
		/* c1-allow: Button_themeresources.xaml:167 and :310, both `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: Button_themeresources.xaml:167 and :310, the same `-3` inset as the band
		   itself, so the ring stays concentric with the control's own corner */
		border-radius: calc(var(--winui-ControlCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* ----- default (DefaultButtonStyle at Button_themeresources.xaml:154) ----- */

	.root[data-variant='default'] {
		background: var(--winui-ButtonBackground) padding-box;
		color: var(--winui-ButtonForeground);
	}
	.root[data-variant='default']::after {
		background: var(--winui-ButtonBorderBrush);
	}

	.root[data-variant='default']:hover {
		background: var(--winui-ButtonBackgroundPointerOver) padding-box;
		color: var(--winui-ButtonForegroundPointerOver);
	}
	.root[data-variant='default']:hover::after {
		background: var(--winui-ButtonBorderBrushPointerOver);
	}

	.root[data-variant='default']:active {
		background: var(--winui-ButtonBackgroundPressed) padding-box;
		color: var(--winui-ButtonForegroundPressed);
	}
	.root[data-variant='default']:active::after {
		background: var(--winui-ButtonBorderBrushPressed);
	}

	/* ----- accent (AccentButtonStyle at Button_themeresources.xaml:235) -----
	   The one place `BackgroundSizing` differs upstream: accent sets it to `OuterBorderEdge`
	   (:238), the other two to `InnerBorderEdge`. The fill reaches the outer edge and the
	   border is stroked over it, which is why this variant clips to `border-box` where the
	   other two clip to `padding-box`. As two background layers that was inverted — a layer
	   list paints the first layer on top, so the opaque accent fill covered the border brush
	   and the button had no border at all. Measured before the fix: `#0067c0` from the
	   button's first row to its last. */

	.root[data-variant='accent'] {
		background: var(--winui-AccentButtonBackground) border-box;
		color: var(--winui-AccentButtonForeground);
	}
	.root[data-variant='accent']::after {
		background: var(--winui-AccentButtonBorderBrush);
	}

	.root[data-variant='accent']:hover {
		background: var(--winui-AccentButtonBackgroundPointerOver) border-box;
		color: var(--winui-AccentButtonForegroundPointerOver);
	}
	.root[data-variant='accent']:hover::after {
		background: var(--winui-AccentButtonBorderBrushPointerOver);
	}

	.root[data-variant='accent']:active {
		background: var(--winui-AccentButtonBackgroundPressed) border-box;
		color: var(--winui-AccentButtonForegroundPressed);
	}
	.root[data-variant='accent']:active::after {
		background: var(--winui-AccentButtonBorderBrushPressed);
	}

	/* ----- subtle (SubtleButtonStyle at Button_themeresources.xaml:297) ----- */

	.root[data-variant='subtle'] {
		background: var(--winui-SubtleButtonBackground) padding-box;
		color: var(--winui-SubtleButtonForeground);
	}
	.root[data-variant='subtle']::after {
		background: var(--winui-SubtleButtonBorderBrush);
	}

	.root[data-variant='subtle']:hover {
		background: var(--winui-SubtleButtonBackgroundPointerOver) padding-box;
		color: var(--winui-SubtleButtonForegroundPointerOver);
	}
	.root[data-variant='subtle']:hover::after {
		background: var(--winui-SubtleButtonBorderBrushPointerOver);
	}

	.root[data-variant='subtle']:active {
		background: var(--winui-SubtleButtonBackgroundPressed) padding-box;
		color: var(--winui-SubtleButtonForegroundPressed);
	}
	.root[data-variant='subtle']:active::after {
		background: var(--winui-SubtleButtonBorderBrushPressed);
	}

	/* Disabled — written per variant because each one reads from its own brush family
	   (`*Disabled` keys are not shared between default / accent / subtle), and placed
	   last so the variant rule wins over `:hover` and `:active`. A disabled button
	   must not light up under the pointer. */
	.root[data-variant='default']:disabled {
		background: var(--winui-ButtonBackgroundDisabled) padding-box;
		color: var(--winui-ButtonForegroundDisabled);
		cursor: default;
	}
	.root[data-variant='default']:disabled::after {
		background: var(--winui-ButtonBorderBrushDisabled);
	}

	.root[data-variant='accent']:disabled {
		background: var(--winui-AccentButtonBackgroundDisabled) border-box;
		color: var(--winui-AccentButtonForegroundDisabled);
		cursor: default;
	}
	.root[data-variant='accent']:disabled::after {
		background: var(--winui-AccentButtonBorderBrushDisabled);
	}

	.root[data-variant='subtle']:disabled {
		background: var(--winui-SubtleButtonBackgroundDisabled) padding-box;
		color: var(--winui-SubtleButtonForegroundDisabled);
		cursor: default;
	}
	.root[data-variant='subtle']:disabled::after {
		background: var(--winui-SubtleButtonBorderBrushDisabled);
	}

	/* ADR 0016. A `BrushTransition` runs only while the platform's animations are on. This one is
	   on a `ContentPresenter` (Button_themeresources.xaml:174), which reads the switch before it
	   sets one up (ContentPresenter.cpp:150); with it off, the new brush lands at once. */
	@media (prefers-reduced-motion: reduce) {
		.root,
		.root::after {
			transition-duration: 0s;
		}
	}
</style>
