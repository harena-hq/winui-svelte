<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/** One item. `Pivot.Items` narrowed to plain records — D26 and the narrowing NavigationView applies. */
	export interface PivotItemData {
		/** Stable identity. What `selected` holds and what `onSelectionChanged` reports. */
		id: string;
		/** PivotItem.Header, narrowed to text. */
		header?: string;
		/** PivotItem.Header, ADR 0012's general form. Wins over `header`. */
		headerContent?: Snippet;
		/** The item's content. */
		content?: Snippet;
		/** IsEnabled on the item, inverted to the attribute — ADR 0009. */
		disabled?: boolean;
	}

	export interface PivotProps {
		items: PivotItemData[];
		/**
		 * SelectedItem, narrowed to the `id` of one record. `null` means "the control's own
		 * default", which for Pivot is the first item — unlike SelectorBar, whose upstream
		 * selects nothing until it is focused.
		 */
		selected?: string | null;
		onSelectionChanged?: (id: string | null) => void;
		/** Pivot.Title, narrowed to text. */
		title?: string;
		/** Pivot.Title, the general form. Wins over `title`. */
		titleContent?: Snippet;
		/** IsEnabled on the control, inverted to the attribute — ADR 0009. */
		disabled?: boolean;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// The title is built although `Pivot_themeresources.xaml:316` hard-codes it Collapsed and
	// nothing in the file reverses that: the original renders it, so that code is in the XAML
	// framework; `docs/surface.md` records that Pivot has no .cpp in the control pin. LeftHeader,
	// RightHeader and their templates are absent: the ContentPresenters at `:407` and `:431` are
	// unused on the acceptance surface. The template's ItemsPresenter and PivotHeaderPanel are
	// template-private hosts; D26 has this component render items directly. PivotItem's Pivot group
	// (`:462`, Left/Center/Right) declares no setters or storyboards, so it changes nothing.
	// WD-021: the dynamic carousel is declined; see docs/divergences.md.
	// WD-022: `OpticalMarginAlignment="TrimSideBearings"` on the header's ContentPresenter
	// (`:586`) and on the title's (`:231`) has no CSS equivalent, so a label's ink sits one to
	// two pixels right of where Windows puts it inside an identically placed box.
</script>

<script lang="ts">
	let {
		items,
		selected = $bindable(null),
		onSelectionChanged,
		title,
		titleContent,
		disabled = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: PivotProps = $props();

	const uid = $props.id();
	const isItemDisabled = (item: PivotItemData) => disabled || item.disabled === true;
	// The first item, not the first *enabled* one. `SelectedIndex` defaults to 0 and neither
	// `IsEnabled` on the control nor on the item moves it, so a disabled Pivot still shows its
	// first panel and its first header still reads as selected — with the pipe collapsed, which
	// is the Disabled state's own setter (`Pivot_themeresources.xaml:498-501`) and not a
	// consequence of the selection.
	const current = $derived(selected ?? items[0]?.id ?? null);
	const currentItem = $derived(items.find((item) => item.id === current) ?? null);
	const tabId = (id: string | null) => `${uid}-tab-${id ?? 'none'}`;
	const panelId = `${uid}-panel`;

	function select(item: PivotItemData) {
		if (isItemDisabled(item) || item.id === current) return;
		selected = item.id;
		onSelectionChanged?.(item.id);
	}

	function handleKeydown(event: KeyboardEvent) {
		const currentIndex = items.findIndex((item) => item.id === current);
		let candidate = -1;
		if (event.key === 'ArrowLeft') {
			for (let index = currentIndex - 1; index >= 0; index--) {
				if (!isItemDisabled(items[index])) {
					candidate = index;
					break;
				}
			}
		} else if (event.key === 'ArrowRight') {
			for (let index = currentIndex + 1; index < items.length; index++) {
				if (!isItemDisabled(items[index])) {
					candidate = index;
					break;
				}
			}
		} else if (event.key === 'Home') {
			candidate = items.findIndex((item) => !isItemDisabled(item));
		} else if (event.key === 'End') {
			for (let index = items.length - 1; index >= 0; index--) {
				if (!isItemDisabled(items[index])) {
					candidate = index;
					break;
				}
			}
		} else {
			return;
		}

		event.preventDefault();
		if (candidate !== -1) select(items[candidate]);
	}
</script>

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	{#if titleContent || title}
		<div class="title">
			{#if titleContent}{@render titleContent()}{:else}{title}{/if}
		</div>
	{/if}
	<div
		class="header"
		role="tablist"
		tabindex={disabled ? -1 : 0}
		aria-activedescendant={current === null ? undefined : tabId(current)}
		aria-disabled={disabled || undefined}
		onkeydown={handleKeydown}
	>
		{#each items as item (item.id)}
			<!-- Headers are divs, not buttons: the row is the one focus target and a button can move pointer focus off it, silently breaking the row's arrow-key contract. -->
			<div
				class="item"
				role="tab"
				id={tabId(item.id)}
				aria-selected={item.id === current}
				aria-disabled={isItemDisabled(item) || undefined}
				aria-controls={panelId}
				data-selected={item.id === current || undefined}
				onclick={() => select(item)}
			>
				<span class="label"
					>{#if item.headerContent}{@render item.headerContent()}{:else}{item.header}{/if}</span
				>
				<span class="pipe"></span>
			</div>
		{/each}
	</div>
	<div
		class="panel"
		role="tabpanel"
		id={panelId}
		aria-labelledby={current === null ? undefined : tabId(current)}
	>
		{#if currentItem?.content}{@render currentItem.content()}{/if}
	</div>
</div>

<style>
	.root {
		/* A flex column, for the two things `RootElement`'s Grid (`Pivot_themeresources.xaml:223`)
		   does that a block box does not. The title's `Margin` is inside the Grid, and CSS
		   collapses a block child's top margin through a parent with no padding or border — which
		   put 14 of the title's 46px row above the control instead of inside it, measured on the
		   guest before this was a flex container. And the template's row heights are `Auto` then
		   `*`, which is `flex-grow` on the panel below. */
		display: flex;
		flex-direction: column;
		background: var(--winui-PivotBackground);
	}
	.title {
		/* `PivotPortraitThemePadding` and `PivotLandscapeThemePadding` are the same value — `12,14,0,13` — in all three dictionaries (Pivot_themeresources.xaml:13 and :16, :117 and :120, :147 and :150), so Orientation (`:243`) cannot change a pixel and only Portrait is read. */
		margin: var(--winui-PivotPortraitThemePadding);
		font-family: var(--winui-PivotTitleFontFamily);
		font-size: var(--winui-PivotTitleFontSize);
		font-weight: var(--winui-PivotTitleThemeFontWeight);
		line-height: normal;
	}
	.header {
		position: relative;
		display: flex;
		/* HeaderClipper (`Pivot_themeresources.xaml:408`) clips a wider row; WD-021 makes the cut part unreachable. */
		overflow: hidden;
		background: var(--winui-PivotHeaderBackground);
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}
	.item {
		display: grid;
		box-sizing: border-box;
		/* Pivot_themeresources.xaml:483, `Height="48"` on the item's Style. */
		height: 48px;
		padding: var(--winui-PivotHeaderItemMargin);
		background: var(--winui-PivotHeaderItemBackgroundUnselected);
		color: var(--winui-PivotHeaderItemForegroundUnselected);
		font-family: var(--winui-PivotHeaderItemFontFamily);
		font-size: var(--winui-PivotHeaderItemFontSize);
		font-weight: var(--winui-PivotHeaderItemThemeFontWeight);
		line-height: normal;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
	}
	/* The Grid's ContentPresenter and pipe share one cell (`Pivot_themeresources.xaml:586-587`), so the pipe stretches across the padding box: the label width, not the padded item width. */
	.item > * {
		grid-area: 1 / 1;
	}
	.label {
		align-self: center;
	}
	.pipe {
		align-self: end;
		/* Pivot_themeresources.xaml:587, `Height="3"` with `Margin="0,0,0,2"`. */
		height: 3px;
		margin-bottom: 2px;
		background: var(--winui-PivotHeaderItemSelectedPipeFill);
		border-radius: var(--winui-PivotHeaderItemSelectedPipeCornerRadius);
		visibility: hidden;
	}
	.item[data-selected='true'] .pipe {
		visibility: visible;
	}
	.item[data-selected='true'] {
		background: var(--winui-PivotHeaderItemBackgroundSelected);
		color: var(--winui-PivotHeaderItemForegroundSelected);
	}
	.item:hover:not([aria-disabled='true']) {
		background: var(--winui-PivotHeaderItemBackgroundUnselectedPointerOver);
		color: var(--winui-PivotHeaderItemForegroundUnselectedPointerOver);
	}
	.item[data-selected='true']:hover:not([aria-disabled='true']) {
		background: var(--winui-PivotHeaderItemBackgroundSelectedPointerOver);
		color: var(--winui-PivotHeaderItemForegroundSelectedPointerOver);
	}
	.item:active:not([aria-disabled='true']) {
		background: var(--winui-PivotHeaderItemBackgroundUnselectedPressed);
		color: var(--winui-PivotHeaderItemForegroundUnselectedPressed);
	}
	.item[data-selected='true']:active:not([aria-disabled='true']) {
		background: var(--winui-PivotHeaderItemBackgroundSelectedPressed);
		color: var(--winui-PivotHeaderItemForegroundSelectedPressed);
	}
	.item[aria-disabled='true'] {
		background: var(--winui-PivotHeaderItemBackgroundDisabled);
		color: var(--winui-PivotHeaderItemForegroundDisabled);
		cursor: default;
	}
	/* The Disabled state collapses SelectedPipe even for a selected item (`Pivot_themeresources.xaml:498-501`). */
	.item[aria-disabled='true'] .pipe {
		visibility: hidden;
	}
	.panel {
		/* `RowDefinition Height="*"` on the row the ItemsPresenter sits in
		   (`Pivot_themeresources.xaml:397` and `:432`): the panel takes what the header leaves. */
		flex-grow: 1;
		margin: var(--winui-PivotItemMargin);
		background: var(--winui-PivotItemBackground);
	}
	.header:focus-visible::before {
		content: '';
		position: absolute;
		/* Other components paint outside their element. FocusFollower (`Pivot_themeresources.xaml:426`) is clipped inside HeaderClipper, and the measured stroke occupies this row's outermost pixels. */
		inset: 0;
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}
</style>
