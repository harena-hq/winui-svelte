<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ToggleButtonProps {
		/** IsChecked's boolean half, under HTML's polarity — ADR 0009. A checked button is never also indeterminate. */
		checked?: boolean | null;
		/** The change callback ADR 0009 pairs with `checked`. */
		onCheckedChange?: (checked: boolean) => void;
		/** IsChecked's null, spelled the way ARIA spells it: `aria-pressed="mixed"`. */
		indeterminate?: boolean;
		/** No WinUI member: the change callback ADR 0009 pairs with `indeterminate`. */
		onIndeterminateChange?: (indeterminate: boolean) => void;
		/** IsThreeState. True makes a click cycle through the indeterminate state. */
		threeState?: boolean;
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean | null;
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
		checked = $bindable(false),
		onCheckedChange,
		indeterminate = $bindable(false),
		onIndeterminateChange,
		threeState = false,
		disabled = false,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ToggleButtonProps = $props();

	const state = $derived(indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked');

	function set(nextChecked: boolean, nextIndeterminate: boolean) {
		if ((checked ?? false) !== nextChecked) {
			checked = nextChecked;
			onCheckedChange?.(nextChecked);
		}
		if (indeterminate !== nextIndeterminate) {
			indeterminate = nextIndeterminate;
			onIndeterminateChange?.(nextIndeterminate);
		}
	}

	function click(event: MouseEvent) {
		const handler = rest.onclick;
		if (typeof handler === 'function') handler(event);
		if (disabled) return;
		if (indeterminate) set(false, false);
		else if (checked) set(false, threeState);
		else set(true, false);
	}
</script>

<button
	bind:this={ref}
	type="button"
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	{disabled}
	aria-pressed={indeterminate ? 'mixed' : (checked ?? false)}
	data-state={state}
	{...rest}
	onclick={click}
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
		border-color: transparent;
		border-width: var(--winui-ToggleButtonBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		/* c1-allow: ToggleButton_themeresources.xaml:200, `BrushTransition Duration="0:0:0.083"` on the
		   ContentPresenter's BackgroundTransition — 0.083s is 83ms. */
		transition: background 83ms;
		text-align: center;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}
	/* The gradient brush is painted on a masked pseudo-element, as Button does, so it occupies the border ring rather than the opaque fill. */
	.root::after {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--winui-ToggleButtonBorderThemeThickness));
		border-radius: inherit;
		padding: var(--winui-ToggleButtonBorderThemeThickness);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		/* c1-allow: ToggleButton_themeresources.xaml:200, the same `BrushTransition Duration="0:0:0.083"`; the ring
		   fades with the fill because upstream transitions one painted surface. */
		transition: background 83ms;
	}
	/* `:focus-visible` and not `:focus`: WinUI draws this for `FocusState.Keyboard` only, so
	   a control reached with the pointer shows nothing. */
	.root:focus-visible::before {
		content: '';
		position: absolute;
		/* c1-allow: ToggleButton_themeresources.xaml:193, `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: ToggleButton_themeresources.xaml:193, the same `-3` inset as the band itself, so the
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
	.root[data-state='unchecked'] {
		background: var(--winui-ToggleButtonBackground) padding-box;
		color: var(--winui-ToggleButtonForeground);
	}
	.root[data-state='unchecked']::after {
		background: var(--winui-ToggleButtonBorderBrush);
	}
	.root[data-state='unchecked']:hover {
		background: var(--winui-ToggleButtonBackgroundPointerOver) padding-box;
		color: var(--winui-ToggleButtonForegroundPointerOver);
	}
	.root[data-state='unchecked']:hover::after {
		background: var(--winui-ToggleButtonBorderBrushPointerOver);
	}
	.root[data-state='unchecked']:active {
		background: var(--winui-ToggleButtonBackgroundPressed) padding-box;
		color: var(--winui-ToggleButtonForegroundPressed);
	}
	.root[data-state='unchecked']:active::after {
		background: var(--winui-ToggleButtonBorderBrushPressed);
	}
	/* Checked fills use `ToggleButtonCheckedStateBackgroundSizing` — OuterBorderEdge in every theme — so they sit beneath the border ring. */
	.root[data-state='checked'] {
		background: var(--winui-ToggleButtonBackgroundChecked) border-box;
		color: var(--winui-ToggleButtonForegroundChecked);
	}
	.root[data-state='checked']::after {
		background: var(--winui-ToggleButtonBorderBrushChecked);
	}
	.root[data-state='checked']:hover {
		background: var(--winui-ToggleButtonBackgroundCheckedPointerOver) border-box;
		color: var(--winui-ToggleButtonForegroundCheckedPointerOver);
	}
	.root[data-state='checked']:hover::after {
		background: var(--winui-ToggleButtonBorderBrushCheckedPointerOver);
	}
	.root[data-state='checked']:active {
		background: var(--winui-ToggleButtonBackgroundCheckedPressed) border-box;
		color: var(--winui-ToggleButtonForegroundCheckedPressed);
	}
	.root[data-state='checked']:active::after {
		background: var(--winui-ToggleButtonBorderBrushCheckedPressed);
	}
	.root[data-state='indeterminate'] {
		background: var(--winui-ToggleButtonBackgroundIndeterminate) padding-box;
		color: var(--winui-ToggleButtonForegroundIndeterminate);
	}
	.root[data-state='indeterminate']::after {
		background: var(--winui-ToggleButtonBorderBrushIndeterminate);
	}
	.root[data-state='indeterminate']:hover {
		background: var(--winui-ToggleButtonBackgroundIndeterminatePointerOver) padding-box;
		color: var(--winui-ToggleButtonForegroundIndeterminatePointerOver);
	}
	.root[data-state='indeterminate']:hover::after {
		background: var(--winui-ToggleButtonBorderBrushIndeterminatePointerOver);
	}
	.root[data-state='indeterminate']:active {
		background: var(--winui-ToggleButtonBackgroundIndeterminatePressed) padding-box;
		color: var(--winui-ToggleButtonForegroundIndeterminatePressed);
	}
	.root[data-state='indeterminate']:active::after {
		background: var(--winui-ToggleButtonBorderBrushIndeterminatePressed);
	}
	.root[data-state='unchecked']:disabled {
		background: var(--winui-ToggleButtonBackgroundDisabled) padding-box;
		color: var(--winui-ToggleButtonForegroundDisabled);
		cursor: default;
	}
	.root[data-state='unchecked']:disabled::after {
		background: var(--winui-ToggleButtonBorderBrushDisabled);
	}
	.root[data-state='checked']:disabled {
		background: var(--winui-ToggleButtonBackgroundCheckedDisabled) padding-box;
		color: var(--winui-ToggleButtonForegroundCheckedDisabled);
		cursor: default;
	}
	.root[data-state='checked']:disabled::after {
		background: var(--winui-ToggleButtonBorderBrushCheckedDisabled);
	}
	.root[data-state='indeterminate']:disabled {
		background: var(--winui-ToggleButtonBackgroundIndeterminateDisabled) padding-box;
		color: var(--winui-ToggleButtonForegroundIndeterminateDisabled);
		cursor: default;
	}
	.root[data-state='indeterminate']:disabled::after {
		background: var(--winui-ToggleButtonBorderBrushIndeterminateDisabled);
	}

	/* ADR 0016. A `BrushTransition` runs only while the platform's animations are on. This one is
	   on a `ContentPresenter` (ToggleButton_themeresources.xaml:200), which reads the switch before
	   it sets one up (ContentPresenter.cpp:150); with it off, the new brush lands at once. */
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
