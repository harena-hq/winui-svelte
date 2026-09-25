<script lang="ts" module>
	export interface PipsPagerProps {
		/** PipsPager.NumberOfPages. A negative count is the infinite mode described below. */
		numberOfPages?: number;
		/** PipsPager.SelectedPageIndex. */
		selectedPageIndex?: number;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. Upstream's own
		 *  SelectedIndexChanged carries no payload and a handler reads the property back. */
		onSelectedPageIndexChange?: ((index: number) => void) | undefined;
		/** PipsPager.MaxVisiblePips. */
		maxVisiblePips?: number;
		/** PipsPager.Orientation. */
		orientation?: 'horizontal' | 'vertical';
		/** PipsPager.PreviousButtonVisibility (PipsPagerButtonVisibility). */
		previousButtonVisibility?: 'visible' | 'visibleOnPointerOver' | 'collapsed';
		/** PipsPager.NextButtonVisibility (PipsPagerButtonVisibility). */
		nextButtonVisibility?: 'visible' | 'visibleOnPointerOver' | 'collapsed';
		/** PipsPager.WrapMode (PipsPagerWrapMode). */
		wrapMode?: 'none' | 'wrap';
		class?: string;
		style?: string;
		/** The PipsPager root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// `PreviousButtonStyle`, `NextButtonStyle`, `SelectedPipStyle` and `NormalPipStyle`
	// (`PipsPager.idl:61-65`) are absent. They are `Style` properties, and ADR 0002 puts styling
	// in the token cascade rather than in a prop — the same reason CalendarDatePicker has no
	// `CalendarViewStyle`. Every value those four styles set is a `--winui-PipsPager…` token, so
	// the way to restyle a pip is to rebind the token rather than to hand over a style object.
	//
	// `TemplateSettings` (`:69-70`) is absent for D26's reason: it is a template-private items
	// host — one `IVector<Int32>` the template's `ItemsRepeater` binds to — and the pips it
	// carries are derived here from `numberOfPages`, `selectedPageIndex` and `maxVisiblePips`.
	//
	// The two navigation buttons carry `ToolTipService.ToolTip` bound to their own automation
	// name (`PipsPager.xaml:82`, `:95`). The names are here as `aria-label`; the tooltips are not,
	// because a tooltip is a `ToolTip` around each button and that is a change to the shape of
	// this template rather than a value read from it.
	//
	// The four names are upstream's own: `Pager`, `Previous Page`, `Next Page`, and `Page` plus
	// the one-based number (`PipsPager.cpp:73`, `:81`, `:92`, `:356`, and
	// `PipsPager/Strings/en-us/Resources.resw:120-135`). The root carries `role="group"` so that
	// name reaches a reader; `PipsPagerAutomationPeer::GetAutomationControlTypeCore` reports
	// `AutomationControlType::Menu` with the Selection pattern, which has no ARIA form over a run
	// of buttons that would not also take the button role away from each pip.
</script>

<script lang="ts">
	import ScrollView from './ScrollView.svelte';
	import { scrollBehavior } from '../internal/motion';

	let {
		numberOfPages = -1, // PipsPager.idl:44-45
		selectedPageIndex = $bindable(0), // PipsPager.idl:47-48
		onSelectedPageIndexChange,
		maxVisiblePips = 5, // PipsPager.idl:50-51
		orientation = 'horizontal', // PipsPager.idl:53-54
		previousButtonVisibility = 'collapsed', // PipsPager.idl:56-57
		nextButtonVisibility = 'collapsed', // PipsPager.idl:58-59
		wrapMode = 'none', // PipsPager.idl:85-86
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: PipsPagerProps = $props();

	let pipList = $state<HTMLDivElement | null>(null);

	// `UpdatePipsItems` (PipsPager.cpp:310-346). Upstream keeps the items vector and only ever
	// grows it in the infinite case; the count is derived here, so the two clauses that grow it
	// — a minimum length, and one more pip once the selection reaches the end — are read off the
	// current selection rather than off the vector's history.
	const pipCount = $derived.by(() => {
		if (numberOfPages === 0 || maxVisiblePips === 0) return 0;
		if (numberOfPages < 0) {
			const minimum = Math.max(selectedPageIndex + 1, Math.max(0, maxVisiblePips));
			return selectedPageIndex === minimum - 1 ? minimum + 1 : minimum;
		}
		return numberOfPages;
	});

	const pipIndices = $derived(Array.from({ length: pipCount }, (_, index) => index));

	// `CalculateScrollViewerSize` (PipsPager.cpp:274-290): how many pips the area shows at once,
	// which is not how many exist.
	const visiblePipCount = $derived.by(() => {
		const maximum = Math.max(0, maxVisiblePips);
		if (maximum === 0 || numberOfPages === 0) return 0;
		return numberOfPages > 0 ? Math.min(maximum, numberOfPages) : maximum;
	});

	// `defaultPipSize * (n - 1) + selectedPipSize` on the scrolling axis, and the larger of the
	// two pip boxes across it (`SetScrollViewerMaxSize`, PipsPager.cpp:292-308). Upstream measures
	// the normal pip and the selected pip separately; this template gives both the same box
	// (`PipsPager_themeresources.xaml:214`, `:268-269`), so one token stands for both sizes. At
	// `n` of zero the expression is zero, which is the size upstream returns for no pips.
	const pipAreaStyle = $derived(
		orientation === 'horizontal'
			? `max-width: calc(var(--winui-PipsPagerHorizontalOrientationButtonWidth) * ${visiblePipCount - 1} + var(--winui-PipsPagerHorizontalOrientationButtonWidth)); max-height: var(--winui-PipsPagerHorizontalOrientationButtonHeight)`
			: `max-height: calc(var(--winui-PipsPagerVerticalOrientationButtonHeight) * ${visiblePipCount - 1} + var(--winui-PipsPagerVerticalOrientationButtonHeight)); max-width: var(--winui-PipsPagerVerticalOrientationButtonWidth)`
	);

	// `UpdateIndividualNavigationButtonVisualState` (PipsPager.cpp:193-223). The half that depends
	// on the pointer and on focus is CSS below; this is the half that is arithmetic, and it is
	// also what enables or disables the button.
	const isPreviousGenerallyVisible = $derived(
		(selectedPageIndex !== 0 || (wrapMode === 'wrap' && numberOfPages > 1)) &&
			numberOfPages !== 0 &&
			maxVisiblePips > 0
	);
	const isNextGenerallyVisible = $derived(
		(selectedPageIndex !== numberOfPages - 1 || (wrapMode === 'wrap' && numberOfPages > 1)) &&
			numberOfPages !== 0 &&
			maxVisiblePips > 0
	);

	/** `OnSelectedPageIndexChanged`'s coercion (PipsPager.cpp:418-430), and the one way in. */
	function select(index: number) {
		const clamped =
			numberOfPages > 0 ? Math.min(Math.max(0, index), numberOfPages - 1) : Math.max(0, index);
		if (clamped === selectedPageIndex) return;
		selectedPageIndex = clamped;
		onSelectedPageIndexChange?.(clamped);
	}

	// An index written from outside is coerced the same way one this component chooses is:
	// upstream's coercion is a property-changed callback, so it runs whoever set the value.
	$effect(() => {
		select(selectedPageIndex);
	});

	// `ScrollToCenterOfViewport` (PipsPager.cpp:240-253) brings the selected pip to the middle of
	// the pip area with `AnimationDesired(true)` — upstream asks for an animation and names no
	// duration, so this is the browser's own smooth scroll rather than a transcribed timing.
	// `BringIntoViewport` animates only while the platform's animations are on (ADR 0016).
	$effect(() => {
		const pip = pipList?.querySelector(`[data-pip-index="${selectedPageIndex}"]`);
		const behavior = scrollBehavior();
		pip?.scrollIntoView(
			orientation === 'horizontal'
				? { block: 'nearest', inline: 'center', behavior }
				: { block: 'center', inline: 'nearest', behavior }
		);
	});

	// `OnPreviousButtonClicked` (PipsPager.cpp:522-542).
	function goPrevious() {
		if (numberOfPages === 0 || numberOfPages === 1) return;
		const wrapped = wrapMode === 'wrap' && numberOfPages > -1 && selectedPageIndex === 0;
		select(wrapped ? numberOfPages - 1 : Math.max(0, selectedPageIndex - 1));
	}

	// `OnNextButtonClicked` (PipsPager.cpp:544-565).
	function goNext() {
		if (numberOfPages === 0 || numberOfPages === 1) return;
		if (wrapMode === 'wrap' && selectedPageIndex === numberOfPages - 1) {
			select(0);
			return;
		}
		select(
			numberOfPages > -1
				? Math.min(selectedPageIndex + 1, numberOfPages - 1)
				: selectedPageIndex + 1
		);
	}

	// `OnKeyDown` (PipsPager.cpp:161-191) moves focus, not the selection: Left and Up go to the
	// previous pip and Right and Down to the next one, in both orientations. Upstream asks the
	// focus manager for the next element in that direction; the equivalent here is the next pip,
	// because the pips are the only focusable run the direction can mean.
	function handleKeydown(event: KeyboardEvent) {
		const delta =
			event.key === 'ArrowLeft' || event.key === 'ArrowUp'
				? -1
				: event.key === 'ArrowRight' || event.key === 'ArrowDown'
					? 1
					: 0;
		if (delta === 0 || pipList === null) return;
		const pips = [...pipList.querySelectorAll<HTMLButtonElement>('[data-pip-index]')];
		const current = pips.indexOf(event.target as HTMLButtonElement);
		if (current === -1) return;
		const next = pips[current + delta];
		if (next === undefined) return;
		next.focus();
		event.preventDefault();
	}
</script>

<!-- `RootPanel` (PipsPager.xaml:15): the previous button, the pips, the next button, stacked in
     the control's own orientation. -->
<div
	bind:this={ref}
	class={['root', className]}
	{style}
	data-orientation={orientation}
	role="group"
	aria-label="Pager"
	onkeydown={handleKeydown}
	{...rest}
>
	{#if previousButtonVisibility !== 'collapsed'}
		<button
			type="button"
			class="nav"
			data-visibility={previousButtonVisibility}
			data-generally-visible={isPreviousGenerallyVisible}
			disabled={!isPreviousGenerallyVisible}
			aria-label="Previous Page"
			onclick={goPrevious}
		>
			<span class="nav-glyph previous"></span>
		</button>
	{/if}
	<!-- `PipsPagerScrollViewer` (PipsPager.xaml:83): both bars hidden, both modes disabled, and a
	     maximum size on the scrolling axis is the whole of what makes the strip a window. -->
	<ScrollView
		contentOrientation={orientation}
		horizontalScrollBarVisibility="hidden"
		verticalScrollBarVisibility="hidden"
		horizontalScrollMode="disabled"
		verticalScrollMode="disabled"
		style={pipAreaStyle}
	>
		<div bind:this={pipList} class="pips">
			{#each pipIndices as index (index)}
				<button
					type="button"
					class="pip"
					data-pip-index={index}
					data-selected={index === selectedPageIndex || undefined}
					aria-label={`Page ${index + 1}`}
					aria-current={index === selectedPageIndex || undefined}
					onclick={() => select(index)}
				></button>
			{/each}
		</div>
	</ScrollView>
	{#if nextButtonVisibility !== 'collapsed'}
		<button
			type="button"
			class="nav"
			data-visibility={nextButtonVisibility}
			data-generally-visible={isNextGenerallyVisible}
			disabled={!isNextGenerallyVisible}
			aria-label="Next Page"
			onclick={goNext}
		>
			<span class="nav-glyph next"></span>
		</button>
	{/if}
</div>

<style>
	.root {
		/* `HorizontalAlignment="Left"` and `VerticalAlignment="Top"` on the control's own Style
		   (PipsPager.xaml:5-6): the pager is as big as its three children and no bigger, which an
		   inline flex box is and a block one is not. */
		display: inline-flex;
		align-items: center;
	}

	.root[data-orientation='vertical'] {
		flex-direction: column;
	}

	/* ----- the pips (PipsPagerButtonBaseStyle, PipsPager_themeresources.xaml:198-279) ----- */

	.pips {
		display: flex;
	}

	.root[data-orientation='vertical'] .pips {
		flex-direction: column;
	}

	.pip {
		position: relative;
		display: grid;
		box-sizing: border-box;
		width: var(--winui-PipsPagerHorizontalOrientationButtonWidth);
		height: var(--winui-PipsPagerHorizontalOrientationButtonHeight);
		padding: 0;
		background: var(--winui-PipsPagerSelectionIndicatorBackground);
		border: var(--winui-PipsPagerButtonBorderThickness) solid
			var(--winui-PipsPagerSelectionIndicatorBorderBrush);
		place-items: center;
		border-radius: var(--winui-ControlCornerRadius);
		color: var(--winui-PipsPagerSelectionIndicatorForeground);
		font-size: var(--winui-PipsPagerNormalGlyphFontSize);
		cursor: pointer;
		/* The user agent draws a second focus ring of its own; see Button.svelte. */
		outline: none;
	}

	.root[data-orientation='vertical'] .pip {
		width: var(--winui-PipsPagerVerticalOrientationButtonWidth);
		height: var(--winui-PipsPagerVerticalOrientationButtonHeight);
	}

	/* `PipsPagerSelectedGlyph` and `PipsPagerNormalGlyph` are the same code point
	   (PipsPager_themeresources.xaml:100-101); the selected pip differs by size and brush alone. */
	.pip::before {
		content: var(--winui-PipsPagerNormalGlyph);
		font-family: var(--winui-SymbolThemeFontFamily);
		line-height: normal;
	}

	.pip[data-selected]::before {
		content: var(--winui-PipsPagerSelectedGlyph);
	}

	/* `PipsPagerSelectedPipButtonStyle` (:280-286) is the selected pip's base, and the three
	   CommonStates below still apply over it — a XAML state group is mutually exclusive and these
	   four rules are ordered so that the later ones win. */
	.pip[data-selected] {
		background: var(--winui-PipsPagerSelectionIndicatorBackgroundSelected);
		border-color: var(--winui-PipsPagerSelectionIndicatorBorderBrushSelected);
		color: var(--winui-PipsPagerSelectionIndicatorForegroundSelected);
		font-size: var(--winui-PipsPagerSelectedGlyphFontSize);
	}

	/* PointerOver (:218-233) grows the glyph to the selected size whether or not it is selected. */
	.pip:hover:not(:disabled) {
		background: var(--winui-PipsPagerSelectionIndicatorBackgroundPointerOver);
		border-color: var(--winui-PipsPagerSelectionIndicatorBorderBrushPointerOver);
		color: var(--winui-PipsPagerSelectionIndicatorForegroundPointerOver);
		font-size: var(--winui-PipsPagerSelectedGlyphFontSize);
	}

	/* Pressed (:234-249) takes it back to the normal size, selected or not. */
	.pip:active:not(:disabled) {
		background: var(--winui-PipsPagerSelectionIndicatorBackgroundPressed);
		border-color: var(--winui-PipsPagerSelectionIndicatorBorderBrushPressed);
		color: var(--winui-PipsPagerSelectionIndicatorForegroundPressed);
		font-size: var(--winui-PipsPagerNormalGlyphFontSize);
	}

	/* Disabled (:250-262) changes no size. Nothing in this component's surface disables a pip —
	   upstream reaches the state through `IsEnabled` on the pager — so this is the template's
	   fourth CommonState transcribed rather than a state the props can produce. */
	.pip:disabled {
		background: var(--winui-PipsPagerSelectionIndicatorBackgroundDisabled);
		border-color: var(--winui-PipsPagerSelectionIndicatorBorderBrushDisabled);
		color: var(--winui-PipsPagerSelectionIndicatorForegroundDisabled);
		cursor: default;
	}

	/* ----- the navigation buttons (PipsPagerNavigationButtonBaseStyle, :110-191) ----- */

	.nav {
		position: relative;
		display: grid;
		box-sizing: border-box;
		width: var(--winui-PipsPagerNavigationButtonWidth);
		height: var(--winui-PipsPagerNavigationButtonHeight);
		padding: 0;
		place-items: center;
		background: var(--winui-PipsPagerNavigationButtonBackground);
		border: var(--winui-PipsPagerNavigationButtonBorderThickness) solid
			var(--winui-PipsPagerNavigationButtonBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		color: var(--winui-PipsPagerNavigationButtonForeground);
		font-size: var(--winui-PipsPagerNavigationButtonFontSize);
		cursor: pointer;
		outline: none;
		/* Hidden is opacity, not layout (PipsPager.xaml:19-23, :40-44): the box stays, which is
		   what stops the pips from moving when an arrow appears. Collapsed is the absent case and
		   is handled in the markup. */
		opacity: 0;
	}

	/* The `Visible` half of `UpdateIndividualNavigationButtonVisualState` (PipsPager.cpp:203-221):
	   the button is painted when it is generally visible and either its visibility says so
	   outright or the pointer is over the pager — `m_isPointerOver` — or something in it holds
	   focus, which is `m_isFocused` at PipsPager.cpp:205. */
	.nav[data-generally-visible='true'][data-visibility='visible'],
	.root:hover .nav[data-generally-visible='true'],
	.root:focus-within .nav[data-generally-visible='true'] {
		opacity: 1;
	}

	/* `PipsPagerPreviousPageButtonGlyph` and `…NextPageButtonGlyph` are the up and down chevrons
	   (:102-103); horizontal orientation turns each button a quarter turn about its own centre
	   rather than swapping the glyphs (PipsPager.xaml:62-77). */
	.root[data-orientation='horizontal'] .nav {
		transform: rotate(-90deg);
	}

	.nav-glyph {
		display: grid;
		place-items: center;
		font-family: var(--winui-SymbolThemeFontFamily);
		line-height: normal;
		transform: scale(1);
		/* Instant, and the delay is the `0:0:0.016` key time the pressed storyboard holds from
		   (:157-158, :161-162). Only the pressed rule carries it, so the release snaps back the
		   way leaving a Pressed state with no storyboard does. */
		transition: transform 0s;
	}

	.nav-glyph.previous::before {
		content: var(--winui-PipsPagerPreviousPageButtonGlyph);
	}

	.nav-glyph.next::before {
		content: var(--winui-PipsPagerNextPageButtonGlyph);
	}

	.nav:hover:not(:disabled) {
		background: var(--winui-PipsPagerNavigationButtonBackgroundPointerOver);
		border-color: var(--winui-PipsPagerNavigationButtonBorderBrushPointerOver);
		color: var(--winui-PipsPagerNavigationButtonForegroundPointerOver);
	}

	.nav:active:not(:disabled) {
		background: var(--winui-PipsPagerNavigationButtonBackgroundPressed);
		border-color: var(--winui-PipsPagerNavigationButtonBorderBrushPressed);
		color: var(--winui-PipsPagerNavigationButtonForegroundPressed);
	}

	.nav:active:not(:disabled) .nav-glyph {
		/* PipsPager_themeresources.xaml:157 — the `0:0:0.016` key time the pressed scale holds from. */
		transition-delay: 16ms;
		transform: scale(var(--winui-PipsPagerNavigationButtonScalePressed));
	}

	.nav:disabled {
		background: var(--winui-PipsPagerNavigationButtonBackgroundDisabled);
		border-color: var(--winui-PipsPagerNavigationButtonBorderBrushDisabled);
		color: var(--winui-PipsPagerNavigationButtonForegroundDisabled);
		cursor: default;
	}

	/* `UseSystemFocusVisuals` with `FocusVisualMargin="0"` on both styles (:117-118, :206-207), so
	   the band is traced on the border box itself rather than outside it. */
	.pip:focus-visible::after,
	.nav:focus-visible::after {
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
</style>
