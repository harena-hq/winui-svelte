<script lang="ts" module>
	import type { Snippet } from 'svelte';

	// The placement table moved to `internal/flyout-placement.ts` when `CommandBarFlyout` needed
	// the same one. Aliased rather than re-exported because an `import type` followed by an
	// `export type` of the same name reads as an assignment to `no-import-assign`.
	export type FlyoutPlacement = import('../internal/flyout-placement').FlyoutPlacement;

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
		 * 275 and the button's top border is row 280. No dictionary states it because it is a
		 * constant, `FlyoutBase::FlyoutMargin` (`FlyoutBase_partial.cpp:65`), added in whichever
		 * direction the flyout opens (`:2622-2640`).
		 */
		offset?: number;
		/** IsOpen. `FlyoutBase` exposes this read-only with `ShowAt`/`Hide`; ADR 0009 maps a
		 * control's own state to a bindable prop. */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: boolean) => void;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
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
	// Flyout is a framework control WinUI 3 only restyles, and **the pin does carry its
	// implementation** — `dxaml/xcp/dxaml/lib/Flyout_partial.cpp`, 112 lines. This comment used
	// to say there was none to read and that the dictionary and the recorded measurement were
	// the complete record. That was true when it was written: the sparse checkout held
	// `controls/dev` alone until `7fff31d` widened it, and the sentence was never revisited
	// afterwards. What those 112 lines add here is unswept — `docs/surface.md`'s "The checkout
	// grew and these claims did not" has the measurement and the rest of the list.
</script>

<script lang="ts">
	import { Popover } from 'bits-ui';
	import { FLYOUT_PLACEMENTS } from '../internal/flyout-placement';
	import { createFocusReturn } from '../internal/focus-return';

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

	const position = $derived(FLYOUT_PLACEMENTS[placement]);

	// `FLYOUT_PLACEMENTS` carries the collision-avoidance reasoning and the measurement behind it.

	// The primitive returns the focus on closing to what had it when the flyout opened, and so
	// does this, in the state `createFocusReturn` saved rather than the one a plain `focus()`
	// gives. Upstream returns it only if the popup still holds it or nothing does; here the
	// primitive's focus trap takes back the focus a press outside gives a button, before the
	// close, so the popup always does.
	const focusReturn = createFocusReturn();

	function onCloseAutoFocus(event: Event) {
		const target = focusReturn.saved;
		if (!(target instanceof HTMLElement) || !target.isConnected) return;
		event.preventDefault();
		focusReturn.restore(target, () => true);
	}
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
			{@render children({ ...props, ...focusReturn.trigger })}
		{/snippet}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			side={position.side}
			align={position.align}
			sideOffset={offset}
			onOpenAutoFocus={focusReturn.opened}
			onEscapeKeydown={focusReturn.escaped}
			onInteractOutside={focusReturn.pressedOutside}
			{onCloseAutoFocus}
		>
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
		/* The popup layer. `Popup.svelte`'s `.root` rule carries the whole reason; the short
		   version is that this element is static, so the declaration paints nothing here and
		   is read by the primitive, which mirrors it onto the wrapper it positions. */
		z-index: 1000;
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
