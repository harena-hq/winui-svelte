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
		/* **The popup layer, and this rule is where every other declaration points.** Above the
		   page, and above anything a consumer has stacked on it: `Popup` is a top-level
		   surface, so it must not be clipped to its parent.

		   XAML needs no number for this. A popup lives in the `PopupRoot`, above the whole
		   visual tree, so nothing in an app is above one by default — the paragraph below says
		   what "by default" is doing in that sentence. The CSS analogue is a
		   single layer that every portalled surface declares, and this is its value — equal on
		   purpose, so that between two open popups the DOM order decides, which is the order
		   they were opened in: a tooltip raised from inside a flyout is appended later and
		   sits above it.

		   **That equality is a reproduction and not a convenience**, and the reason it works is
		   that a portal here mounts when its surface opens: nothing in this library passes
		   `forceMount`, so no popup is in the document before it is shown. Upstream's ordinary
		   path resolves two open popups the same way. `Popup.cpp:528` adds a popup's child to
		   the `PopupRoot` at the moment it opens, and `AddChild` appends — `uielement.cpp:6951`
		   is its own "Append a child to the visual" and `:6976` is `m_pChildren->Append`. So
		   open order is child order there as it is here, and siblings paint in that order in
		   both. That is what the default does rather than something nothing can change: XAML
		   has an explicit z-order property, and a popup root's children are not out of its
		   reach.

		   Two limits on that, both worth having. `PopupRoot.cpp:13` and `:43` hold the root's
		   open popups newest-first, so the framework does track recency — but those two sites
		   are a lookup and a closing order, not a paint order, so they corroborate and do not
		   establish. And a **windowed** popup does not take this path at all: `Popup.cpp:509-521`
		   gives it an HWND and a `ContentIsland` before the child is added, and
		   `SetIsWindowedIfNeeded` (`:1043`) turns that on from `ShouldConstrainToRootBounds`,
		   re-evaluated on every open (`:1052`). Such a popup stacks by window order rather than
		   by child order, and a browser tab has nothing to reproduce that with — which is the
		   same ground on which `Flyout.svelte` declines `ShouldConstrainToRootBounds` outright.

		   **Twelve components portal, and eleven of them had no layer at all.** A portalled
		   element lands in `<body>` with `z-index: auto`, which puts it above ordinary content
		   by tree order and *below* any positioned element with a positive z-index — and this
		   library ships those: `NavigationView`'s pane-toggle holder is 100, reproducing
		   `PaneToggleButtonGrid`'s `Canvas.ZIndex="100"` (`NavigationView.xaml:180`), and its
		   pane is 1. Measured on `/dev/navigation-view-rail`: a rail row's tooltip was opaque
		   `#f9f9f9` and the hamburger was drawn on top of it, with `elementFromPoint` at the
		   overlap returning the toggle's own glyph span. The other ten only looked fine
		   because of what they happen to overlap.

		   **Where the declaration goes depends on which of two shapes the surface is, and ten
		   of the twelve are the first.** A floating surface hands its content element to
		   `bits-ui` and gets a positioned wrapper back; the primitive takes
		   `getComputedStyle(content).zIndex` one animation frame after the content mounts
		   (`use-floating-layer.svelte.js:219`) and writes it onto that wrapper (`:137`). So the
		   declaration goes on the content element and is read rather than applied — nine of
		   those ten content elements are `position: static` inside a wrapper that is a plain
		   positioned block, so `z-index` does not apply to them there and creates no stacking
		   context, and the tenth is `TeachingTip`'s `.card`, which is `relative`. **"Static"
		   is not on its own enough to say that**, which
		   `CommandBarOverflowPresenter.svelte`'s rule records: the same element rendered as a
		   grid item takes its `z-index` after all.

		   **The two that are not floating layers are this one and `ContentDialog`**, and theirs
		   applies where it sits. This component renders `Popover.ContentStatic` and writes the
		   `{#snippet child}` below; the snippet that would carry a wrapper is the primitive's
		   own `popper`, one layer in inside bits-ui's `popover-content-static` component, and
		   it hands `props` alone — so no `wrapperProps` reaches here at all. (No line number:
		   C12 requires a cited `.svelte` to resolve and a dependency's does not, which is the
		   boundary that entry's own memory records.) `.root` is positioned
		   by the `left` and `top` this component computes, so the number below is used here and
		   mirrored nowhere. `ContentDialog`'s `.smoke` is `Dialog.Overlay`'s child and its
		   `.layout` is a plain author div, both `position: fixed`, and `Dialog` is not a
		   floating layer either.

		   Thirteen declarations in twelve files, then — `ContentDialog` carries two — though not
		   the same twelve as the twelve that portal: this set drops `CommandBar` and gains
		   `CommandBarOverflowPresenter`. The number matching is a coincidence. And
		   `CommandBar` carries none, because its portal's content is the
		   `CommandBarOverflowPresenter` component and a `c13-layer:` comment beside its portal
		   redirects C13 to that file. C13 is what keeps the set complete, and it follows that
		   redirection rather than accepting it. */
		z-index: 1000;
	}
</style>
