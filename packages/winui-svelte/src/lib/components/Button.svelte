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
		disabled?: boolean;
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
		class?: string;
		style?: string;
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--winui-ButtonPadding);
		border-style: solid;
		/* `ButtonBorderThemeBrush` resolves to `ControlElevationBorderBrush` and
		   `AccentButtonBorderBrush` to `AccentControlElevationBorderBrush`. Both are
		   `linear-gradient(...)` in the token layer — tokens.css:252 and :262 — and a
		   border-style declaration that named one of them as its colour would be invalid
		   and silently dropped (a CSS gradient is not a `border-color`). The two-layer
		   background form `apps/gallery/src/lib/SearchBox.svelte` already uses for
		   exactly this reason carries the gradient under a transparent border: the fill
		   clipped to the padding box on `InnerBorderEdge` variants, to the border box on
		   `OuterBorderEdge`. The fill is written as a two-stop gradient of one colour
		   because a background layer takes an image, not a colour. */
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
		line-height: normal;
		text-align: center;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
	}

	/* ----- default (DefaultButtonStyle at Button_themeresources.xaml:154) ----- */

	.root[data-variant='default'] {
		background:
			linear-gradient(var(--winui-ButtonBackground), var(--winui-ButtonBackground)) padding-box,
			var(--winui-ButtonBorderBrush) border-box;
		color: var(--winui-ButtonForeground);
	}

	.root[data-variant='default']:hover {
		background:
			linear-gradient(
					var(--winui-ButtonBackgroundPointerOver),
					var(--winui-ButtonBackgroundPointerOver)
				)
				padding-box,
			var(--winui-ButtonBorderBrushPointerOver) border-box;
		color: var(--winui-ButtonForegroundPointerOver);
	}

	.root[data-variant='default']:active {
		background:
			linear-gradient(var(--winui-ButtonBackgroundPressed), var(--winui-ButtonBackgroundPressed))
				padding-box,
			var(--winui-ButtonBorderBrushPressed) border-box;
		color: var(--winui-ButtonForegroundPressed);
	}

	/* ----- accent (AccentButtonStyle at Button_themeresources.xaml:235) -----
	   The one place `BackgroundSizing` differs upstream: accent sets it to
	   `OuterBorderEdge` (:238), the other two to `InnerBorderEdge`. In CSS that is the
	   fill clipped to the border box rather than the padding box — the border colour is
	   still transparent so the gradient layer shows through. */

	.root[data-variant='accent'] {
		background:
			linear-gradient(var(--winui-AccentButtonBackground), var(--winui-AccentButtonBackground))
				border-box,
			var(--winui-AccentButtonBorderBrush) border-box;
		color: var(--winui-AccentButtonForeground);
	}

	.root[data-variant='accent']:hover {
		background:
			linear-gradient(
					var(--winui-AccentButtonBackgroundPointerOver),
					var(--winui-AccentButtonBackgroundPointerOver)
				)
				border-box,
			var(--winui-AccentButtonBorderBrushPointerOver) border-box;
		color: var(--winui-AccentButtonForegroundPointerOver);
	}

	.root[data-variant='accent']:active {
		background:
			linear-gradient(
					var(--winui-AccentButtonBackgroundPressed),
					var(--winui-AccentButtonBackgroundPressed)
				)
				border-box,
			var(--winui-AccentButtonBorderBrushPressed) border-box;
		color: var(--winui-AccentButtonForegroundPressed);
	}

	/* ----- subtle (SubtleButtonStyle at Button_themeresources.xaml:297) ----- */

	.root[data-variant='subtle'] {
		background:
			linear-gradient(var(--winui-SubtleButtonBackground), var(--winui-SubtleButtonBackground))
				padding-box,
			var(--winui-SubtleButtonBorderBrush) border-box;
		color: var(--winui-SubtleButtonForeground);
	}

	.root[data-variant='subtle']:hover {
		background:
			linear-gradient(
					var(--winui-SubtleButtonBackgroundPointerOver),
					var(--winui-SubtleButtonBackgroundPointerOver)
				)
				padding-box,
			var(--winui-SubtleButtonBorderBrushPointerOver) border-box;
		color: var(--winui-SubtleButtonForegroundPointerOver);
	}

	.root[data-variant='subtle']:active {
		background:
			linear-gradient(
					var(--winui-SubtleButtonBackgroundPressed),
					var(--winui-SubtleButtonBackgroundPressed)
				)
				padding-box,
			var(--winui-SubtleButtonBorderBrushPressed) border-box;
		color: var(--winui-SubtleButtonForegroundPressed);
	}

	/* Disabled — written per variant because each one reads from its own brush family
	   (`*Disabled` keys are not shared between default / accent / subtle), and placed
	   last so the variant rule wins over `:hover` and `:active`. A disabled button
	   must not light up under the pointer. */
	.root[data-variant='default']:disabled {
		background:
			linear-gradient(var(--winui-ButtonBackgroundDisabled), var(--winui-ButtonBackgroundDisabled))
				padding-box,
			var(--winui-ButtonBorderBrushDisabled) border-box;
		color: var(--winui-ButtonForegroundDisabled);
		cursor: default;
	}

	.root[data-variant='accent']:disabled {
		background:
			linear-gradient(
					var(--winui-AccentButtonBackgroundDisabled),
					var(--winui-AccentButtonBackgroundDisabled)
				)
				border-box,
			var(--winui-AccentButtonBorderBrushDisabled) border-box;
		color: var(--winui-AccentButtonForegroundDisabled);
		cursor: default;
	}

	.root[data-variant='subtle']:disabled {
		background:
			linear-gradient(
					var(--winui-SubtleButtonBackgroundDisabled),
					var(--winui-SubtleButtonBackgroundDisabled)
				)
				padding-box,
			var(--winui-SubtleButtonBorderBrushDisabled) border-box;
		color: var(--winui-SubtleButtonForegroundDisabled);
		cursor: default;
	}
</style>
