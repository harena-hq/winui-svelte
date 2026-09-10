<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type FlyoutPlacement =
		| 'top'
		| 'bottom'
		| 'left'
		| 'right'
		| 'topEdgeAlignedLeft'
		| 'topEdgeAlignedRight'
		| 'bottomEdgeAlignedLeft'
		| 'bottomEdgeAlignedRight'
		| 'leftEdgeAlignedTop'
		| 'leftEdgeAlignedBottom'
		| 'rightEdgeAlignedTop'
		| 'rightEdgeAlignedBottom'
		| 'auto';

	export interface FlyoutProps {
		/** Content. The flyout's body, as a snippet. */
		content?: Snippet;
		/**
		 * The element the flyout is attached to. Receives the props it must spread.
		 *
		 * Spread them **first**, before the element's own attributes: they carry the
		 * primitive's event handlers, and a trigger that sets one of the same names after the
		 * spread replaces it rather than adding to it.
		 */
		children: Snippet<[Record<string, unknown>]>;
		/** FlyoutBase.Placement. */
		placement?: FlyoutPlacement;
		/**
		 * No WinUI member: the gap between the flyout and its trigger, in pixels. 4 is what the
		 * Gallery's flyout measures on the reference guest — the flyout's bottom border is row
		 * 275 and the button's top border is row 280 — and no pinned dictionary states it.
		 */
		offset?: number;
		/** IsOpen. `FlyoutBase` exposes this read-only with `ShowAt`/`Hide`; ADR 0009 maps a
		 * control's own state to a bindable prop. */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: boolean) => void;
		class?: string;
		style?: string;
		/** ADR 0009's `ref` points at the interactive element: here, the presenter. */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// `FlyoutPresenterStyle` is absent. A Svelte consumer restyles through `class`, `style`
	// and the token cascade, which is ADR 0002.
	// `ShowMode`, `AllowFocusOnInteraction` and `OverlayInputPassThroughElement` are absent:
	// focus and input-routing policy belong to the primitive.
	// `LightDismissOverlayMode` is absent for Popup's reason: it draws a dimming layer, and
	// this component draws no layer of its own. ContentDialog owns that tranche.
	// `ShouldConstrainToRootBounds` is absent because a browser tab cannot express it either way.
	// `Opening`, `Opened`, `Closing` and `Closed` are recoverable from `onOpenChange`.
	// `Full` placement is deferred: it stretches across the window rather than anchoring, so
	// it is not a placement the floating layer computes.
	// Flyout is a framework control WinUI 3 only restyles: there is no implementation in the
	// pin to read, so its dictionary and the recorded measurement are the complete record.
</script>

<script lang="ts">
	import { Popover } from 'bits-ui';

	let {
		content,
		placement = 'top',
		offset = 4,
		open = $bindable(false),
		onOpenChange,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: FlyoutProps = $props();

	const placements = {
		top: { side: 'top', align: 'center' },
		bottom: { side: 'bottom', align: 'center' },
		left: { side: 'left', align: 'center' },
		right: { side: 'right', align: 'center' },
		topEdgeAlignedLeft: { side: 'top', align: 'start' },
		topEdgeAlignedRight: { side: 'top', align: 'end' },
		bottomEdgeAlignedLeft: { side: 'bottom', align: 'start' },
		bottomEdgeAlignedRight: { side: 'bottom', align: 'end' },
		leftEdgeAlignedTop: { side: 'left', align: 'start' },
		leftEdgeAlignedBottom: { side: 'left', align: 'end' },
		rightEdgeAlignedTop: { side: 'right', align: 'start' },
		rightEdgeAlignedBottom: { side: 'right', align: 'end' },
		auto: { side: 'top', align: 'center' }
	} as const;

	const position = $derived(placements[placement]);

	// Collisions are avoided for every placement, not only for `auto`. `FlyoutPlacementMode`
	// is a *preferred* placement upstream, and the popup hosting a flyout has
	// `ShouldConstrainToRootBounds` true by default, so a flyout that will not fit is moved
	// until it does rather than drawn off the edge. Measured here with avoidance off: the
	// Gallery's own example — a 355px flyout centred on a button 60px from the left of the
	// dev page — rendered at x = -109, a hundred pixels outside the viewport and unreachable.
	// The consequence is that `auto` and `top` resolve to the same behaviour in this
	// reproduction. That is not a collapse of two different things: upstream `Auto` asks the
	// framework to choose, and for a button flyout it chooses Top, which is also why Top is
	// the default.
</script>

<Popover.Root
	bind:open={
		() => open,
		(next) => {
			open = next;
			onOpenChange?.(next);
		}
	}
>
	<Popover.Trigger>
		{#snippet child({ props })}
			{@render children(props)}
		{/snippet}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content side={position.side} align={position.align} sideOffset={offset}>
			{#snippet child({ props, wrapperProps })}
				<div {...wrapperProps}>
					<div
						{...props}
						bind:this={ref}
						class={['presenter', 'winui-BodyTextBlockStyle', className]}
						{style}
						{...rest}
					>
						{@render content?.()}
					</div>
				</div>
			{/snippet}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>

<style>
	/* The popup host casts this shadow at `Translation.Z` 32 (`ElevationHelper.cpp:19`).
	   `GetDropShadowRecipe` in dxaml/xcp/components/graphics/inc/DropShadowRecipe.h defines it;
	   `PLATFORM_SHADOWS` derives the value and records the one composition-to-CSS blur constant. */
	.presenter {
		box-sizing: border-box;
		/* The focus scope focuses this element from script when the flyout opens, and Chromium
		   grants `:focus-visible` to a scripted focus on a `tabindex="-1"` element — so the
		   browser drew a ring around the whole presenter, which WinUI draws nowhere. The
		   control that ends up focused inside is what shows a visual. `Popup.svelte` carries
		   the same rule for the same reason. */
		outline: none;
		background: var(--winui-FlyoutPresenterBackground) padding-box;
		border: var(--winui-FlyoutBorderThemeThickness) solid var(--winui-FlyoutBorderThemeBrush);
		border-radius: var(--winui-OverlayCornerRadius);
		box-shadow: var(--winui-PopupShadow);
		padding: var(--winui-FlyoutContentPadding);
		min-width: var(--winui-FlyoutThemeMinWidth);
		max-width: var(--winui-FlyoutThemeMaxWidth);
		min-height: var(--winui-FlyoutThemeMinHeight);
		max-height: var(--winui-FlyoutThemeMaxHeight);
		overflow: auto;
	}
</style>
