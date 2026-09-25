<script lang="ts" module>
	import type { Snippet } from 'svelte';
	export interface RepeatButtonProps {
		/** Delay, in milliseconds: the wait after a press before repeating starts. */
		delay?: number;
		/** Interval, in milliseconds: the time between repetitions once repeating starts. */
		interval?: number;
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean;
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
		delay = 250,
		interval = 250,
		disabled = false,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: RepeatButtonProps = $props();
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let repeating: ReturnType<typeof setInterval> | undefined;
	// A real `<button>` fires its own click on release, while WinUI fires on press instead.
	// This flag swallows that later native click so the two activation models reconcile.
	let suppressNativeClick = false;

	function call(handler: unknown, event: Event) {
		if (typeof handler === 'function') handler(event);
	}

	function stop() {
		if (timeout !== undefined) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (repeating !== undefined) {
			clearInterval(repeating);
			repeating = undefined;
		}
	}
	function fire() {
		ref?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
	}
	function start() {
		stop();
		suppressNativeClick = true;
		fire();
		timeout = setTimeout(() => {
			timeout = undefined;
			repeating = setInterval(fire, interval);
		}, delay);
	}
	function pointerdown(event: PointerEvent) {
		call(rest.onpointerdown, event);
		if (disabled) return;
		start();
	}
	function keydown(event: KeyboardEvent) {
		call(rest.onkeydown, event);
		if (disabled || event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
		event.preventDefault();
		start();
	}
	function click(event: MouseEvent) {
		if (suppressNativeClick && event.isTrusted) {
			event.preventDefault();
			event.stopPropagation();
			suppressNativeClick = false;
			return;
		}
		call(rest.onclick, event);
	}
	function finish(handler: unknown, event: Event) {
		call(handler, event);
		stop();
	}
	function finishWithoutClick(handler: unknown, event: Event) {
		finish(handler, event);
		suppressNativeClick = false;
	}
	$effect(() => {
		if (disabled) stop();
		return stop;
	});
</script>

<button
	bind:this={ref}
	type="button"
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	{disabled}
	{...rest}
	onpointerdown={pointerdown}
	onpointerup={(event) => finish(rest.onpointerup, event)}
	onpointerleave={(event) => finishWithoutClick(rest.onpointerleave, event)}
	onkeyup={(event) => finish(rest.onkeyup, event)}
	onblur={(event) => finishWithoutClick(rest.onblur, event)}
	onkeydown={keydown}
	onclick={click}>{@render children?.()}</button
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
		border-width: var(--winui-ButtonBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		/* c1-allow: RepeatButton_themeresources.xaml:98, `BrushTransition Duration="0:0:0.083"` on the
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
		/* c1-allow: RepeatButton_themeresources.xaml:98, the same `BrushTransition Duration="0:0:0.083"`; the ring
		   fades with the fill because upstream transitions one painted surface. */
		transition: background 83ms;
	}
	/* `:focus-visible` and not `:focus`: WinUI draws this for `FocusState.Keyboard` only, so
	   a control reached with the pointer shows nothing. */
	.root:focus-visible::before {
		content: '';
		position: absolute;
		/* c1-allow: RepeatButton_themeresources.xaml:91, `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: RepeatButton_themeresources.xaml:91, the same `-3` inset as the band itself, so the
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
		background: var(--winui-RepeatButtonBackground) padding-box;
		color: var(--winui-RepeatButtonForeground);
	}
	.root::after {
		background: var(--winui-RepeatButtonBorderBrush);
	}
	.root:hover {
		background: var(--winui-RepeatButtonBackgroundPointerOver) padding-box;
		color: var(--winui-RepeatButtonForegroundPointerOver);
	}
	.root:hover::after {
		background: var(--winui-RepeatButtonBorderBrushPointerOver);
	}
	.root:active {
		background: var(--winui-RepeatButtonBackgroundPressed) padding-box;
		color: var(--winui-RepeatButtonForegroundPressed);
	}
	.root:active::after {
		background: var(--winui-RepeatButtonBorderBrushPressed);
	}
	.root:disabled {
		background: var(--winui-RepeatButtonBackgroundDisabled) padding-box;
		color: var(--winui-RepeatButtonForegroundDisabled);
		cursor: default;
	}
	.root:disabled::after {
		background: var(--winui-RepeatButtonBorderBrushDisabled);
	}

	/* ADR 0016. A `BrushTransition` runs only while the platform's animations are on. This one is
	   on a `ContentPresenter` (RepeatButton_themeresources.xaml:98), which reads the switch before
	   it sets one up (ContentPresenter.cpp:150); with it off, the new brush lands at once. */
	@media (prefers-reduced-motion: reduce) {
		.root,
		.root::after {
			transition-duration: 0s;
		}
	}
</style>
