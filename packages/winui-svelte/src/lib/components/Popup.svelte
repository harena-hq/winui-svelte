<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface PopupProps {
		/** Child — the content the popup hosts, as the default snippet. */
		children?: Snippet;
		/**
		 * IsOpen, under HTML's name for it — ADR 0009. `open` is in that ADR's closed reserved
		 * set, and it is what bits-ui calls this state.
		 */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: boolean) => void;
		/** HorizontalOffset. Pixels right of the popup's own layout position. */
		horizontalOffset?: number;
		/** VerticalOffset. Pixels below the popup's own layout position. */
		verticalOffset?: number;
		/**
		 * IsLightDismissEnabled. When true, a pointer press outside the popup or the Escape key
		 * closes it. WinUI's default is false and so is this one.
		 */
		lightDismissEnabled?: boolean;
		class?: string;
		style?: string;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// Opened and Closed are recoverable from onOpenChange, which fires with the new state.
	// LightDismissOverlayMode draws a dimming layer behind the popup; this component draws
	// nothing, so the mode belongs with ContentDialog's overlay. ShouldConstrainToRootBounds
	// governs whether the popup may leave the app window, which a browser tab cannot express
	// either way. ChildTransitions is deferred to the motion tranche.
</script>

<script lang="ts">
	import { Popover } from 'bits-ui';

	let {
		children,
		open = $bindable(false),
		onOpenChange,
		horizontalOffset = 0,
		verticalOffset = 0,
		lightDismissEnabled = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: PopupProps = $props();

	let anchor = $state<HTMLSpanElement | null>(null);
	let left = $state('0px');
	let top = $state('0px');

	$effect(() => {
		if (!open || !anchor) return;

		function updatePosition() {
			const rect = anchor?.getBoundingClientRect();
			if (!rect) return;
			left = `${rect.left + window.scrollX + horizontalOffset}px`;
			top = `${rect.top + window.scrollY + verticalOffset}px`;
		}

		updatePosition();
		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);

		return () => {
			window.removeEventListener('scroll', updatePosition, true);
			window.removeEventListener('resize', updatePosition);
		};
	});
</script>

<span class="anchor" bind:this={anchor} aria-hidden="true"></span>

<Popover.Root
	bind:open={
		() => open,
		(next) => {
			open = next;
			onOpenChange?.(next);
		}
	}
>
	<Popover.Portal>
		<Popover.ContentStatic
			escapeKeydownBehavior={lightDismissEnabled ? 'close' : 'ignore'}
			interactOutsideBehavior={lightDismissEnabled ? 'close' : 'ignore'}
			trapFocus={lightDismissEnabled}
		>
			{#snippet child({ props })}
				<div
					{...props}
					bind:this={ref}
					class={['root', 'winui-BodyTextBlockStyle', className]}
					{style}
					{...rest}
					style:left
					style:top
				>
					{@render children?.()}
				</div>
			{/snippet}
		</Popover.ContentStatic>
	</Popover.Portal>
</Popover.Root>

<style>
	.anchor {
		/* The popup is positioned from where it is written, so something has to be written
		   there. It must occupy no space: `Popup` itself has no layout presence in XAML. */
		display: block;
		width: 0;
		height: 0;
	}

	.root {
		position: absolute;
		/* The focus scope focuses this element from script when the popup opens, and Chromium
		   grants `:focus-visible` to a scripted focus on a `tabindex="-1"` element — so the
		   browser drew a ring around the whole popup, which is not something WinUI draws
		   anywhere. Upstream the popup root is never a focus visual; the control that ends up
		   focused inside it is. The element is not reachable by Tab, so nothing is lost by
		   saying so. `internal/focus-visual.ts` documents the same Chromium behaviour from the
		   other side, where the Slider's thumb needed the distinction rather than the removal. */
		outline: none;
		/* Above the page, and above anything a consumer has stacked on it. `Popup` is a
		   top-level surface, so it must not be clipped to its parent. */
		z-index: 1000;
	}
</style>
