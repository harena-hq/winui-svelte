<script lang="ts" module>
	import type { Snippet } from 'svelte';
	export interface HyperlinkButtonProps {
		/** NavigateUri. When set the root is an `<a href>`; when absent it is a `<button>`,
		 *  which is what the Gallery's second example needs. */
		navigateUri?: string;
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. An `<a>` has no `disabled`,
		 *  so a disabled navigating button drops its `href` and takes `aria-disabled`. */
		disabled?: boolean | null;
		/** Content — the label, as the default snippet. */
		children?: Snippet;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/** The interactive root, whose element type depends on `navigateUri`. */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		navigateUri,
		disabled = false,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: HyperlinkButtonProps = $props();
</script>

<svelte:element
	this={navigateUri ? 'a' : 'button'}
	bind:this={ref}
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	href={navigateUri ? (disabled ? undefined : navigateUri) : undefined}
	aria-disabled={navigateUri && disabled ? 'true' : undefined}
	type={navigateUri ? undefined : 'button'}
	disabled={navigateUri ? undefined : disabled}
	{...rest}>{@render children?.()}</svelte:element
>

<style>
	.root {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--winui-ButtonPadding);
		border-style: solid;
		border-color: transparent;
		border-width: var(--winui-HyperlinkButtonBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		/* c1-allow: HyperlinkButton_themeresources.xaml:70, `BrushTransition Duration="0:0:0.083"` on the
		   ContentPresenter's BackgroundTransition — 0.083s is 83ms. */
		transition: background 83ms;
		text-align: center;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		text-decoration: none; /* The original HyperlinkButton has no underline; its accent foreground is the affordance, not a reset. */
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}
	.root::after {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--winui-HyperlinkButtonBorderThemeThickness));
		border-radius: inherit;
		padding: var(--winui-HyperlinkButtonBorderThemeThickness);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		/* c1-allow: HyperlinkButton_themeresources.xaml:70, the same `BrushTransition Duration="0:0:0.083"`; the ring
		   fades with the fill because upstream transitions one painted surface. */
		transition: background 83ms;
	}
	/* `:focus-visible` and not `:focus`: WinUI draws this for `FocusState.Keyboard` only, so
	   a control reached with the pointer shows nothing. */
	.root:focus-visible::before {
		content: '';
		position: absolute;
		/* c1-allow: HyperlinkButton_themeresources.xaml:63, `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: HyperlinkButton_themeresources.xaml:63, the same `-3` inset as the band itself, so the
		   ring stays concentric with the control's own corner */
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
		background: var(--winui-HyperlinkButtonBackground) border-box;
		color: var(--winui-HyperlinkButtonForeground);
	}
	.root::after {
		background: var(--winui-HyperlinkButtonBorderBrush);
	}
	.root:hover {
		background: var(--winui-HyperlinkButtonBackgroundPointerOver) border-box;
		color: var(--winui-HyperlinkButtonForegroundPointerOver);
	}
	.root:hover::after {
		background: var(--winui-HyperlinkButtonBorderBrushPointerOver);
	}
	.root:active {
		background: var(--winui-HyperlinkButtonBackgroundPressed) border-box;
		color: var(--winui-HyperlinkButtonForegroundPressed);
	}
	.root:active::after {
		background: var(--winui-HyperlinkButtonBorderBrushPressed);
	}
	.root:disabled,
	.root[aria-disabled='true'] {
		background: var(--winui-HyperlinkButtonBackgroundDisabled) border-box;
		color: var(--winui-HyperlinkButtonForegroundDisabled);
		cursor: default;
	}
	.root:disabled::after,
	.root[aria-disabled='true']::after {
		background: var(--winui-HyperlinkButtonBorderBrushDisabled);
	}

	/* ADR 0016. A `BrushTransition` runs only while the platform's animations are on. This one is
	   on a `ContentPresenter` (HyperlinkButton_themeresources.xaml:70), which reads the switch
	   before it sets one up (ContentPresenter.cpp:150); with it off, the new brush lands at once. */
	@media (prefers-reduced-motion: reduce) {
		.root,
		.root::after {
			transition-duration: 0s;
		}
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
