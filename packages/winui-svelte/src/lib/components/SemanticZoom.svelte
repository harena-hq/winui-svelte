<script lang="ts" module>
	import type { Snippet } from 'svelte';

	// Where this control lives is worth stating, because the usual place is empty: there is no
	// `controls/dev/SemanticZoom` directory in the control pin. `SemanticZoom` is a
	// `Microsoft.UI.Xaml.Controls` type implemented on the framework side of the pin —
	// `dxaml/xcp/dxaml/lib/SemanticZoom_Partial.cpp` — with its default style and template in the
	// framework dictionary, `windows-app-sdk/generic.xaml:9641-9786`. Every citation below names
	// one of those two files.
	//
	// Two views of one collection in the same box, one shown at a time, with a cross-fade between
	// them: the zoomed-in view is the detailed one, the zoomed-out view the summary a reader jumps
	// from.

	export interface SemanticZoomProps {
		/** SemanticZoom.ZoomedInView — the detailed view. */
		zoomedInView?: Snippet;
		/** SemanticZoom.ZoomedOutView — the summary view. */
		zoomedOutView?: Snippet;
		/** SemanticZoom.IsZoomedInViewActive. */
		isZoomedInViewActive?: boolean;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. Upstream's own
		 *  ViewChangeCompleted carries the same information in event form. */
		onIsZoomedInViewActiveChange?: ((active: boolean) => void) | undefined;
		/** SemanticZoom.CanChangeViews. */
		canChangeViews?: boolean;
		/** SemanticZoom.IsZoomOutButtonEnabled. */
		isZoomOutButtonEnabled?: boolean;
		/** UIElement.IsEnabled. */
		disabled?: boolean;
		class?: string;
		style?: string;
		/** The SemanticZoom root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// `ViewChangeStarted` and `ViewChangeCompleted`, and the `SemanticZoomViewChangedEventArgs`
	// both carry, are absent. Those args hand a handler a source item and a destination item —
	// `SemanticZoomLocation`s the two views fill in — so that the view being entered can align
	// itself to whatever the view being left was showing. Filling them is the job of
	// `ISemanticZoomInformation`, which upstream's `ListViewBase` implements
	// (`ListViewBase_Partial_SemanticZoomInformation.cpp`); this library has no such interface for
	// a view to implement, so there is nothing to hand them. The two views here are snippets the
	// caller draws, and aligning one to the other is therefore the caller's.
	//
	// `IsTabStop="False"` and `TabNavigation="Once"` (`generic.xaml:9644-9645`) are the template's
	// own. The first is the default for a `<div>` and needs nothing; the second — the whole
	// control being one tab stop, with focus returning to the last-focused child — has no HTML
	// equivalent that does not take the tab stops away from the caller's own content.
	//
	// The template's inner `ScrollViewer` (`:9716`) is not reproduced. The style turns its
	// scrolling off on both axes and its zooming off as well (`:9646-9651`), so what is left is a
	// `ScrollContentPresenter` around the two presenters — a box with no behaviour and no size of
	// its own. The pinch-to-zoom gesture that `ZoomMode` would have carried is upstream's
	// DirectManipulation path (`SemanticZoom_Partial.cpp:813-870`) and has no CSS form.
</script>

<script lang="ts">
	import Button from './Button.svelte';

	let {
		zoomedInView,
		zoomedOutView,
		isZoomedInViewActive = $bindable(true),
		onIsZoomedInViewActiveChange,
		canChangeViews = true,
		isZoomOutButtonEnabled = false, // generic.xaml:9650 — the style's own setter
		disabled = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: SemanticZoomProps = $props();

	/**
	 * The one way the view changes.
	 *
	 * `CanChangeViews` is the gate on every path upstream: `ToggleActiveViewImpl`
	 * (`SemanticZoom_Partial.cpp:637-648`) and `OnKeyDown` (`:1228-1230`) both check it, and the
	 * property-changed callback for `IsZoomedInViewActive` asserts it (`:149-155`). `disabled` is
	 * this library's `IsEnabled`, and a disabled `UIElement` receives no input at all, so it is
	 * the second gate rather than a state the template paints — `SemanticZoomStates`
	 * (`generic.xaml:9658-9673`) has no `Disabled` member and the style sets no disabled brush.
	 */
	function setActiveView(active: boolean) {
		if (!canChangeViews || disabled) return;
		if (active === isZoomedInViewActive) return;
		isZoomedInViewActive = active;
		onIsZoomedInViewActiveChange?.(active);
	}

	/**
	 * `OnKeyDown` (`SemanticZoom_Partial.cpp:1215-1268`) asks
	 * `ScrollViewer::GetKeyboardMessageZoomAction` (`ScrollViewer_Partial.cpp:14470-14494`) what
	 * the combination means: Control with `VirtualKey_Subtract` or the minus key zooms out,
	 * Control with `VirtualKey_Add` or the equals key zooms in, and Shift is masked out of the
	 * modifiers rather than blocking the match. `event.key` is the equivalent reading — the two
	 * minus keys both produce `-`, and the two plus keys produce `=` and `+`, the second being
	 * what the equals key reports once Shift is held. A direction that names the view already
	 * active is not handled, which is why `preventDefault` runs only after a real change.
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (!canChangeViews || disabled) return;
		if (!event.ctrlKey || event.altKey || event.metaKey) return;
		const zoomIn = event.key === '=' || event.key === '+';
		const zoomOut = event.key === '-';
		if (!zoomIn && !zoomOut) return;
		if (zoomIn === isZoomedInViewActive) return;
		setActiveView(zoomIn);
		event.preventDefault();
	}

	// Clicking anything inside the zoomed-out view goes to the zoomed-in view. Upstream this is
	// the zoomed-out `ListViewBase` implementing `ISemanticZoomInformation` and completing the
	// view change from its own item click; here the two views are caller snippets, so the
	// presenter is what watches.
	//
	// **Clicking a group header in the zoomed-in view is deliberately not this control's doing.**
	// Upstream a grouped `ListViewBase` raises the change from its header, again through
	// `ISemanticZoomInformation`. Here the caller draws the header, so the caller calls the
	// callback; a rule here would have to guess which part of the caller's markup is a header.
	function handleZoomedOutClick() {
		setActiveView(true);
	}
</script>

<!-- The template's root `Grid` (`generic.xaml:9655`): both presenters in the same cell, so
     neither reserves space for the other and the box is the same size in both views. -->
<!-- eslint-disable svelte/no-unused-svelte-ignore -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={ref}
	class={['root', className]}
	{style}
	data-zoomed-in-view-active={isZoomedInViewActive}
	aria-disabled={disabled || undefined}
	onkeydown={handleKeydown}
	{...rest}
>
	<!-- `ZoomedInPresenter` (`:9748`). -->
	<div class="presenter" data-active={isZoomedInViewActive}>
		{@render zoomedInView?.()}
	</div>
	<!-- `ZoomedOutPresenter` (`:9757`). The keyboard equivalent of this click is Control with
	     the equals key, which the root handles for the whole control. -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="presenter" data-active={!isZoomedInViewActive} onclick={handleZoomedOutClick}>
		{@render zoomedOutView?.()}
	</div>
	{#if isZoomOutButtonEnabled}
		<!-- `ZoomOutButton` (`:9768-9779`), and `OnZoomOutButtonClick` (`:2268-2273`) toggles the
		     active view. `IsZoomOutButtonEnabled` is `False` on the style (`:9650`), so this is
		     drawn only where a caller asks for it. `IsTabStop="False"` (`:9769`) is the
		     `tabindex` below. The button's box is set through this file's own stylesheet rather
		     than through a class handed to `Button`: a class passed to a component lands on its
		     root without this file's scope hash, so a rule written for it here would match
		     nothing. -->
		<div class="zoom-out">
			<Button tabindex={-1} aria-label="Zoom out" onclick={() => setActiveView(false)}>
				{String.fromCodePoint(0xe0b8)}
			</Button>
		</div>
	{/if}
</div>

<!-- eslint-enable svelte/no-unused-svelte-ignore -->

<style>
	.root {
		/* One cell. `Background="Transparent"` and `BorderThickness="0"` (`:9642-9643`) leave
		   nothing for the root to paint. `minmax(0, 1fr)` on both tracks is what lets a caller
		   who gives the control a height hand that height on to a scrolling view inside it;
		   with no height given the track is the taller presenter, which is `1fr` of `auto`. */
		position: relative;
		display: grid;
		grid-template-rows: minmax(0, 1fr);
		grid-template-columns: minmax(0, 1fr);
	}

	.presenter {
		/* Both `ContentPresenter`s sit in the same cell of the same Grid (`:9748`, `:9757`). */
		grid-area: 1 / 1;
		min-width: 0;
		min-height: 0;
		opacity: 1;
		/* `SemanticZoomStates` (`:9658-9673`) is a pure cross-fade: `ZoomInView` fades the
		   zoomed-out presenter out and the zoomed-in one in, `ZoomOutView` does the reverse, and
		   nothing else in the template changes. `FadeOutThemeAnimation` and
		   `FadeInThemeAnimation` are the platform's own animations — upstream names a theme
		   animation rather than a duration, and this project has no token for one, so the value
		   here is this library's nearest existing duration rather than a transcription. */
		transition:
			opacity var(--winui-ControlFasterAnimationDuration),
			visibility 0s;
	}

	/* `visibility` is what takes the inactive view out of the pointer's and a reader's reach
	   while leaving its box in the cell, which is what keeps the two views the same size. It
	   flips only once the fade has finished, so the leaving view is still painted while it
	   fades; the arriving one becomes visible immediately. */
	.presenter:not([data-active='true']) {
		visibility: hidden;
		opacity: 0;
		transition-delay: 0s, var(--winui-ControlFasterAnimationDuration);
	}

	/* `Margin="0,0,19,19"` with `HorizontalAlignment="Right"` and `VerticalAlignment="Bottom"`
	   (`:9770-9772`) — the bottom-right corner, inset by 19 on both edges. */
	.zoom-out {
		position: absolute;
		right: 19px;
		bottom: 19px;
	}

	/* `Width="12" Height="12" Padding="0" FontSize="4"` and the symbol font (`:9774-9779`). A
	   descendant `:global()` under this file's own element, because the class channel does not
	   cross a component boundary. */
	.zoom-out :global(button) {
		width: 12px;
		height: 12px;
		padding: 0;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: `FontSize="4"` on ZoomOutButton, generic.xaml:9775. */
		font-size: 4px;
	}
</style>
