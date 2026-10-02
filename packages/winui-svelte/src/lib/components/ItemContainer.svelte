<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/*
	 * ItemContainer draws modern selection chrome around caller content. `CanUserSelect` and
	 * `CanUserInvoke` (ItemContainer.idl:77, :80) are MUX_INTERNAL gates for whether input
	 * reaches an owner's selection model, which this container does not have. The three
	 * `ItemContainerInvokedEventArgs` members — `OriginalSource`, `InteractionTrigger`, and
	 * `Handled` (ItemContainer.idl:50-55) are absent because `onItemInvoked` reports an
	 * invocation, not the gesture that produced it. The Multiple state's 167ms opacity fade
	 * (ItemContainer.xaml:93-99) is not carried: a CSS entry animation is the only way to
	 * express it and it would play on the page's first paint as well, where the three
	 * baselines would race it. The two fades that are carried sit on state changes a pointer
	 * makes, so neither runs on load. WD-006: the check glyph is WinUI's static fallback, as
	 * in CheckBox.svelte, rather than its AnimatedIcon.
	 */

	export interface ItemContainerProps {
		/** ItemContainer.Child, the content property — ADR 0009 maps it to `children`. */
		children?: Snippet;
		/**
		 * ItemContainer.IsSelected. The container never sets it — no line of `ItemContainer.cpp`
		 * assigns it. Input reaches `RaiseItemInvoked` (:582-596) and the owner decides, which
		 * is why this is a plain prop rather than a bindable one.
		 */
		selected?: boolean;
		/**
		 * ItemContainer.MultiSelectMode, narrowed to its four members. Only `multiple` shows the
		 * checkbox — `ItemContainer.cpp:236-238` tests the `Multiple` flag alone, so `auto`,
		 * `single` and `extended` all render as `Single`.
		 */
		multiSelectMode?: 'auto' | 'single' | 'extended' | 'multiple';
		/** IsEnabled on the container, inverted to the HTML sense — ADR 0009. */
		disabled?: boolean;
		/** ItemInvoked, without its args. Fires on a click and on Enter or Space. */
		onItemInvoked?: () => void;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		children,
		selected = false,
		multiSelectMode = 'auto',
		disabled = false,
		onItemInvoked,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ItemContainerProps = $props();

	const multiple = $derived(multiSelectMode === 'multiple');

	function invoke() {
		if (disabled) return;
		onItemInvoked?.();
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		// Space scrolls the page unless this keyboard invocation cancels its browser default.
		event.preventDefault();
		invoke();
	}
</script>

<!-- `role="option"` is the closest ARIA match to the automation peer's
     `ISelectionItemProvider` (ItemContainer.idl:100). It precedes the rest spread so an owner
     can supply its own roving tabindex or use this as a static card (IconographyPage.xaml:44). -->
<div
	bind:this={ref}
	class={['root', className]}
	{style}
	role="option"
	tabindex={disabled ? -1 : 0}
	aria-selected={selected}
	aria-disabled={disabled || undefined}
	data-selected={selected || undefined}
	data-disabled={disabled || undefined}
	onclick={invoke}
	onkeydown={onKeyDown}
	{...rest}
>
	<!-- XAML has no wrapper, but a snippet can emit several roots; this keeps all content in one
	     grid cell instead of making each root a separate stacked child. -->
	<div class="content">{@render children?.()}</div>
	<!-- The empty chrome parts carry neither role nor text and use pointer-events: none, the CSS
	     equivalent of upstream's IsHitTestVisible="False". -->
	<div class="selection-visual"></div>
	<div class="common-visual"></div>
	<!-- x:DeferLoadStrategy="Lazy" (ItemContainer.xaml:139): no checkbox exists before Multiple. -->
	{#if multiple}
		<div class="checkbox" data-checked={selected || undefined}></div>
	{/if}
</div>

<style>
	/* XAML's Grid stacks every child in document order; child content sizes its shared cell. */
	.root {
		position: relative;
		display: grid;
		background: var(--winui-ItemContainerBackground);
		border-radius: var(--winui-ControlCornerRadius);
		user-select: none;
	}

	.root > * {
		grid-area: 1 / 1;
	}

	.root:focus-visible {
		outline: none;
	}

	/* No FocusVisualMargin is set upstream, so this focus band stays on the border box. The
	   absolute pseudo-element is not a grid item; position: relative above anchors it here. */
	.root:focus-visible::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: var(--winui-ControlCornerRadius);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	.selection-visual {
		/* c1-allow: controls/dev/ItemContainer/ItemContainer.xaml:120, PART_SelectionVisual's
		   BorderThickness is a literal 3 in the template with no resource behind it */
		border: 3px solid transparent;
		border-radius: var(--winui-ControlCornerRadius);
		opacity: 0;
		pointer-events: none;
	}

	.root[data-selected] .selection-visual {
		border-color: var(--winui-ItemContainerSelectionVisualBackground);
		opacity: 1;
	}

	/* SelectedNormal is instant (ItemContainer.xaml:37); only the pointer states animate. */
	.root[data-selected]:hover .selection-visual,
	.root[data-selected]:active .selection-visual {
		transition: opacity var(--winui-ControlFastAnimationDuration)
			var(--winui-ControlFastOutSlowInKeySpline);
	}

	.root[data-selected]:hover .selection-visual {
		border-color: var(--winui-ItemContainerSelectionVisualPointerOverBackground);
	}

	.root[data-selected]:active .selection-visual {
		border-color: var(--winui-ItemContainerSelectionVisualPressedBackground);
	}

	/* `PART_CommonVisual` is a `Rectangle` (`ItemContainer.xaml:127`), so the note on CheckBox's
	   `.box` carries the argument: a Shape has no `BackgroundSizing`, and
	   `CShape::GetOutlineRect` shrinks the geometry by the stroke (`shape.cpp:867`) so the
	   stroke sits inside the box exactly where a CSS border sits. With
	   `ItemContainerSelectedInnerThickness` 1 (`ItemContainer_themeresources.xaml:58`) the half
	   pixel at issue is the fill's outer edge and not the stroke's, and `border-box` and
	   `padding-box` miss it by the same amount in opposite directions, so the default stands.
	   WD-096 is that half pixel, and carries the measurement of what no CSS at this scale can
	   express.

	   The fill is upstream's own, and the shape of it is why the declared absence is visible:
	   the Rectangle carries a `Stroke` and no `Fill`, and of the six states in `CombinedStates`
	   (`ItemContainer.xaml:13`) five animate `Fill` alongside `Stroke` while the sixth,
	   `UnselectedNormal` (`ItemContainer.xaml:14`), is empty. So the resting container is the
	   one that shows the undeclared fill, which is why the base rule below paints no
	   background and the five state rules each paint one. */
	.common-visual {
		border-style: solid;
		border-width: var(--winui-ItemContainerSelectedInnerThickness);
		border-color: var(--winui-ItemContainerBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		pointer-events: none;
	}

	/* CombinedStates is one group of six mutually exclusive states, so these rules exclude each
	   other rather than layering. Without the `:not([data-selected])` the unselected pointer
	   rule outranks `.root[data-selected]` on specificity and repaints a selected container's
	   inner stroke with `ItemContainerPointerOverBorderBrush`, which is transparent — the ring
	   would stay and the white line inside it would vanish under the pointer.
	   `:not([data-disabled])` is the other exclusion: a disabled container only ever enters a
	   Normal state (ItemContainer.cpp:182-187). */
	.root:not([data-disabled]):not([data-selected]):hover .common-visual {
		background: var(--winui-ItemContainerPointerOverBackground);
		border-color: var(--winui-ItemContainerPointerOverBorderBrush);
	}

	.root:not([data-disabled]):not([data-selected]):active .common-visual {
		background: var(--winui-ItemContainerPressedBackground);
		border-color: var(--winui-ItemContainerPressedBorderBrush);
	}

	/* The three selected states share the inner stroke and margin; only their fill varies. */
	.root[data-selected] .common-visual {
		margin: var(--winui-ItemContainerSelectedInnerMargin);
		background: var(--winui-ItemContainerSelectedBackground);
		border-color: var(--winui-ItemContainerSelectedInnerBorderBrush);
	}

	.root[data-selected]:not([data-disabled]):hover .common-visual {
		background: var(--winui-ItemContainerSelectedPointerOverBackground);
	}

	.root[data-selected]:not([data-disabled]):active .common-visual {
		background: var(--winui-ItemContainerSelectedPressedBackground);
	}

	/* Disabled fades in, then snaps back on Enabled's empty state; its selection ring collapses. */
	.root[data-disabled] {
		opacity: var(--winui-ItemContainerDisabledOpacity);
		transition: opacity var(--winui-ControlFastAnimationDuration)
			var(--winui-ControlFastOutSlowInKeySpline);
	}

	.root[data-disabled] .selection-visual {
		display: none;
	}

	/* HorizontalAlignment="Right" and VerticalAlignment="Top" place this over the top-right
	   corner; ItemContainerCheckboxMargin's negative top value gives it the intended overhang. */
	.checkbox {
		justify-self: end;
		align-self: start;
		margin: var(--winui-ItemContainerCheckboxMargin);
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--winui-CheckBoxSize);
		height: var(--winui-CheckBoxSize);
		border-style: solid;
		border-width: var(--winui-CheckBoxBorderThickness);
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeUnchecked);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-ItemContainerCheckboxBackgroundUnchecked);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-CheckBoxGlyphSize);
		pointer-events: none;
	}

	.checkbox[data-checked] {
		border-color: var(--winui-CheckBoxCheckBackgroundStrokeChecked);
		background: var(--winui-CheckBoxCheckBackgroundFillChecked);
		color: var(--winui-CheckBoxCheckGlyphForegroundChecked);
	}

	/* WD-006: unchecked AnimatedIcon states draw no fallback glyph, so no pseudo-element exists. */
	.checkbox[data-checked]::after {
		content: var(--winui-CheckBoxCheckedGlyph) / '';
		margin: 1px 0 -1px 0;
	}
</style>
