<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/** One tab. `TabView.TabItems` narrowed to plain records — D26 and NavigationView's narrowing. */
	export interface TabViewItemData {
		/** Stable identity. What `selected` holds and what the callbacks report. */
		id: string;
		/** TabViewItem.Header, narrowed to text. */
		header?: string;
		/** TabViewItem.Header, ADR 0012's general form. Wins over `header`. */
		headerContent?: Snippet;
		/** TabViewItem.IconSource, ADR 0012's shorthand: a Segoe Fluent Icons code point as uppercase hex. */
		glyph?: string | null;
		/** TabViewItem.IconSource, ADR 0012's general form. Wins over `glyph`. */
		icon?: Snippet;
		/** The tab's content. */
		content?: Snippet;
		/** TabViewItem.IsClosable. Defaults to true, as upstream does. */
		closable?: boolean;
		/** IsEnabled on the tab, inverted to the attribute — ADR 0009. */
		disabled?: boolean;
	}

	export interface TabViewProps {
		items: TabViewItemData[];
		/** SelectedItem, narrowed to the `id` of one record. `null` means the first tab. */
		selected?: string | null;
		onSelectionChanged?: (id: string | null) => void;
		/** TabCloseRequested. This requests closure; the consumer edits its own collection. */
		onTabCloseRequested?: (id: string) => void;
		/** IsEnabled on the control, inverted to the attribute — ADR 0009. */
		disabled?: boolean;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// WD-023: dragging, reordering, tear-out, and browser-owned Ctrl+Tab are intentionally absent;
	// see docs/divergences.md. TabStripHeader, TabStripFooter, and add/scroll buttons are the next
	// unit's surface, not divergences. TabViewListView is a template-private items host, so D26 has
	// this component render its records directly. WD-022 also applies here: the label presenter uses
	// `OpticalMarginAlignment="TrimSideBearings"` (`TabView.xaml:575`), which CSS cannot express.
</script>

<script lang="ts">
	let {
		items,
		selected = $bindable(null),
		onSelectionChanged,
		onTabCloseRequested,
		disabled = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: TabViewProps = $props();

	const uid = $props.id();
	// `TabView.xaml:576` writes `Content="&#xE711;"` on the close button — a template
	// literal rather than a resource. Named here because a Private Use Area character
	// written into the source is invisible in a diff and in most editors.
	const closeGlyph = String.fromCodePoint(0xe711);
	const isItemDisabled = (item: TabViewItemData) => disabled || item.disabled === true;
	const isClosable = (item: TabViewItemData) => item.closable !== false;
	const current = $derived(selected ?? items[0]?.id ?? null);
	const currentItem = $derived(items.find((item) => item.id === current) ?? null);
	const tabId = (id: string | null) => `${uid}-tab-${id ?? 'none'}`;
	const panelId = `${uid}-panel`;

	function select(item: TabViewItemData) {
		if (isItemDisabled(item) || item.id === current) return;
		selected = item.id;
		onSelectionChanged?.(item.id);
	}

	const closeId = (id: string) => `${uid}-close-${id}`;

	// The strip's arrow order, measured on the original: Left from the selected tab moves focus
	// to the *previous tab's close button*, and the selection does not follow. So the order is
	// tab, close, tab, close … and Left and Right walk it. `TabView.cpp:1582-1586` handles the
	// two keys; `IsTabStop="False"` on the close button (`TabView.xaml:576`) keeps it out of the
	// Tab order, not out of this one.
	const focusOrder = $derived(
		items.flatMap((item) =>
			isItemDisabled(item)
				? []
				: isClosable(item)
					? [tabId(item.id), closeId(item.id)]
					: [tabId(item.id)]
		)
	);

	function moveFocus(from: string, step: number) {
		const index = focusOrder.indexOf(from);
		const next = index === -1 ? undefined : focusOrder[index + step];
		if (next !== undefined) document.getElementById(next)?.focus();
	}

	function walk(event: KeyboardEvent, here: string) {
		if (event.key === 'ArrowLeft') moveFocus(here, -1);
		else if (event.key === 'ArrowRight') moveFocus(here, 1);
		else if (event.key === 'Home') document.getElementById(focusOrder[0] ?? '')?.focus();
		else if (event.key === 'End') document.getElementById(focusOrder.at(-1) ?? '')?.focus();
		else return false;

		event.preventDefault();
		return true;
	}

	function handleKeydown(event: KeyboardEvent, item: TabViewItemData) {
		if (event.ctrlKey && event.key === 'F4') {
			if (item.id === current && isClosable(item) && !isItemDisabled(item)) {
				event.preventDefault();
				onTabCloseRequested?.(item.id);
			}
			return;
		}

		// A tab is a `div`, so Enter and Space are not free — and they are what selects, because
		// the arrows do not: focus and selection are separate in this strip.
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			select(item);
			return;
		}

		walk(event, tabId(item.id));
	}

	function handleCloseKeydown(event: KeyboardEvent, item: TabViewItemData) {
		if (walk(event, closeId(item.id))) event.stopPropagation();
	}
</script>

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<div class="strip">
		<div class="line"></div>
		<div class="list" role="tablist">
			{#each items as item (item.id)}
				<div
					class="tab"
					role="tab"
					id={tabId(item.id)}
					data-closable={isClosable(item) || undefined}
					tabindex={item.id === current ? 0 : -1}
					aria-selected={item.id === current}
					aria-disabled={isItemDisabled(item) || undefined}
					aria-controls={panelId}
					data-selected={item.id === current || undefined}
					onclick={() => select(item)}
					onkeydown={(event) => handleKeydown(event, item)}
				>
					<div class="body">
						{#if item.icon || item.glyph}
							<!-- `{:else if item.glyph}` rather than a bare `{:else}` with a non-null
							     assertion: a published `.svelte` file's markup expressions are parsed as
							     JavaScript by the consumer's compiler, so a TypeScript `!` in one is a
							     syntax error in their build and not in ours. `pnpm smoke` is what says so. -->
							<span class="icon" aria-hidden="true">
								{#if item.icon}{@render item.icon()}{:else if item.glyph}{String.fromCodePoint(
										Number.parseInt(item.glyph, 16)
									)}{/if}
							</span>
						{/if}
						<span class="label winui-CaptionTextBlockStyle"
							>{#if item.headerContent}{@render item.headerContent()}{:else}{item.header}{/if}</span
						>
						{#if isClosable(item)}
							<button
								type="button"
								class="close"
								tabindex="-1"
								aria-label="Close"
								disabled={isItemDisabled(item)}
								id={closeId(item.id)}
								onkeydown={(event) => handleCloseKeydown(event, item)}
								onclick={(event) => {
									event.stopPropagation();
									onTabCloseRequested?.(item.id);
								}}>{closeGlyph}</button
							>
						{/if}
					</div>
					<span class="separator"></span>
					{#if item.id === current}<span class="flare-right"></span>{/if}
				</div>
			{/each}
		</div>
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
		display: flex;
		flex-direction: column;
	}

	.strip {
		position: relative;
		display: flex;
		/* `TabViewHeaderPadding`, which the template puts on the list's Padding
		   (`TabView.xaml:39`) rather than on the strip. Same pixels, one fewer box. */
		padding: var(--winui-TabViewHeaderPadding);
		background: var(--winui-TabViewBackground);
	}

	/* Upstream draws this line in three places that have to agree — the TabView template's own
	   two Borders (`TabView.xaml:36-37`), the list's 4px stubs (`:118`, `:123`) and each item's
	   own (`:546`) — because the strip is a ScrollViewer inside a ListView inside a Grid. One
	   line behind the tabs cannot disagree with itself, and the selected tab's opaque shape
	   covers it exactly where the item's own is collapsed. */
	.line {
		position: absolute;
		right: 0;
		bottom: 0;
		left: 0;
		/* `TabView.xaml:36`, `Height="1"`. */
		height: 1px;
		background: var(--winui-TabViewBorderBrush);
	}

	.list {
		display: flex;
		min-width: 0;
	}

	.tab {
		/* `TabViewItem.cpp:107` — "Assumes 4px curving-out corners, which are hardcoded in the
		   markup", and `TabView.xaml:547` draws them as 4x4 Paths. */
		position: relative;
		display: flex;
		/* `TabView.cpp`'s Equal width mode, which is the default: every tab gets the same width,
		   capped at TabViewItemMaxWidth and floored at TabViewItemMinWidth.
		   A `width` rather than a `flex-basis`, measured: the strip's Auto column is a flex item
		   sized to its own max-content, and a flex item's basis does not reach that calculation —
		   with `flex: 0 1 240px` the three tabs came out 142px each, their content width. */
		flex: 0 1 auto;
		width: var(--winui-TabViewItemMaxWidth);
		min-width: var(--winui-TabViewItemMinWidth);
		height: var(--winui-TabViewItemMinHeight);
		cursor: pointer;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	.body {
		position: relative;
		display: flex;
		/* A flex item of `.tab` rather than `height: 100%`, so the selected state's
		   `TabViewSelectedItemHeaderMargin` takes its pixel off the bottom the way a XAML Margin
		   does, instead of pushing the body past the tab. */
		flex: 1 1 auto;
		min-width: 0;
		align-items: center;
		box-sizing: border-box;
		/* `TabView.xaml:492-503`: the CloseIconStates group sets the padding in both of its
		   states, and `TabViewItem::UpdateCloseButton` (`TabViewItem.cpp:251-282`) is always in
		   one of them, so the Style's own `TabViewItemHeaderPadding` is never what draws. */
		padding: var(--winui-TabViewItemHeaderPaddingWithCloseButton);
		border: var(--winui-TabViewItemBorderThickness) solid transparent;
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
		background: var(--winui-TabViewItemHeaderBackground);
		color: var(--winui-TabViewItemHeaderForeground);
	}

	.tab:not([data-closable]) .body {
		padding: var(--winui-TabViewItemHeaderPaddingWithoutCloseButton);
	}

	.icon {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: var(--winui-TabViewItemHeaderIconSize);
		height: var(--winui-TabViewItemHeaderIconSize);
		margin: var(--winui-TabViewItemHeaderIconMargin);
		font-family: var(--winui-SymbolThemeFontFamily);
		/* The template scales the icon into a Viewbox of this size (`TabView.xaml:568`), so the
		   glyph's em is the box. */
		font-size: var(--winui-TabViewItemHeaderIconSize);
		line-height: normal;
		color: var(--winui-TabViewItemIconForeground);
	}

	.label {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.close {
		display: grid;
		flex: none;
		place-items: center;
		width: var(--winui-TabViewItemHeaderCloseButtonWidth);
		height: var(--winui-TabViewItemHeaderCloseButtonHeight);
		margin: var(--winui-TabViewItemHeaderCloseMargin);
		padding: 0;
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-TabViewItemHeaderCloseFontSize);
		line-height: normal;
		border: 0;
		border-radius: var(--winui-ControlCornerRadius);
		cursor: pointer;
		background: var(--winui-TabViewItemHeaderCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderCloseButtonForeground);
	}

	.separator {
		position: absolute;
		/* The Thickness emits in CSS order, so `inset` reads it whole — `8px 0px 8px 0px`, which
		   is `TabViewItemSeparatorMargin`. `left: auto` then releases the left edge, so `width`
		   and the inset's own right decide the rest. */
		inset: var(--winui-TabViewItemSeparatorMargin);
		left: auto;
		width: 1px;
		background: var(--winui-TabViewItemSeparator);
	}

	/* `TabView.cpp:217-231` and `TabViewItem.cpp:503-519` hide a separator for its own and its
	   following tab's selected, hover, and pressed states. */
	.tab[data-selected='true'] .separator,
	.tab:has(+ .tab[data-selected='true']) .separator,
	.tab:hover .separator,
	.tab:has(+ .tab:hover) .separator,
	.tab:active .separator,
	.tab:has(+ .tab:active) .separator {
		opacity: 0;
	}

	.tab:not([data-selected='true']):hover:not([aria-disabled='true']) .body {
		background: var(--winui-TabViewItemHeaderBackgroundPointerOver);
		color: var(--winui-TabViewItemHeaderForegroundPointerOver);
	}
	.tab:not([data-selected='true']):hover:not([aria-disabled='true']) .icon {
		color: var(--winui-TabViewItemIconForegroundPointerOver);
	}
	.tab:not([data-selected='true']):hover:not([aria-disabled='true']) .close {
		background: var(--winui-TabViewItemHeaderPointerOverCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderPointerOverCloseButtonForeground);
	}
	.tab:not([data-selected='true']):active:not([aria-disabled='true']) .body {
		background: var(--winui-TabViewItemHeaderBackgroundPressed);
		color: var(--winui-TabViewItemHeaderForegroundPressed);
	}
	.tab:not([data-selected='true']):active:not([aria-disabled='true']) .icon {
		color: var(--winui-TabViewItemIconForegroundPressed);
	}
	.tab:not([data-selected='true']):active:not([aria-disabled='true']) .close {
		background: var(--winui-TabViewItemHeaderPressedCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderPressedCloseButtonForeground);
	}

	.tab[data-selected='true'] {
		z-index: 1;
	}
	.tab[data-selected='true']::before {
		content: '';
		position: absolute;
		inset: 0 -1px 0 -1px;
		z-index: -1;
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
		background: var(--winui-TabViewItemHeaderBackgroundSelected);
	}
	.tab[data-selected='true'] .body {
		/* `TabViewSelectedItemHeaderMargin` — 1px wider on each side, 1px short at the bottom. */
		margin: var(--winui-TabViewSelectedItemHeaderMargin);
		/* `TabViewSelectedItemBorderThickness` is `1,1,1,0`; the emitted Thickness is in CSS
		   order, so it can be read whole. */
		border-width: var(--winui-TabViewSelectedItemBorderThickness);
		/* Transparent here, painted on `::after` below. The width still has to be declared: it
		   is what insets the label, the icon and the close button by the pixel the border
		   occupies, and dropping it would move all three. */
		border-color: transparent;
		background: transparent;
	}

	/* `TabViewSelectedItemBorderBrush` (`TabView_themeresources.xaml:72-80`) is a gradient over
	   four absolute pixels; measured on the original, the left and right borders fade out over
	   the bottom five while the top stays solid. A mask does that and leaves the 8px corners
	   intact — but a mask applies to an element's descendants too, so it goes on a pseudo-element
	   that carries only the border rather than on the body, which also carries the text.
	   `currentColor` is the mask's own alpha source and never renders; a colour literal here
	   would be a colour the component does not paint. */
	.tab[data-selected='true'] .body::after {
		content: '';
		position: absolute;
		/* An absolutely positioned child is placed against the padding box, so a negative inset
		   of the border's own width puts this exactly on the body's border box. */
		inset: -1px -1px 0 -1px;
		border-width: var(--winui-TabViewSelectedItemBorderThickness);
		border-style: solid;
		border-color: var(--winui-TabViewBorderBrush);
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
		pointer-events: none;
		-webkit-mask: linear-gradient(to bottom, currentColor calc(100% - 5px), transparent 100%);
		mask: linear-gradient(to bottom, currentColor calc(100% - 5px), transparent 100%);
	}
	.tab[data-selected='true'] .body,
	.tab[data-selected='true']:hover:not([aria-disabled='true']) .body,
	.tab[data-selected='true']:active:not([aria-disabled='true']) .body {
		color: var(--winui-TabViewItemHeaderForegroundSelected);
	}
	.tab[data-selected='true'] .icon {
		color: var(--winui-TabViewItemIconForegroundSelected);
	}
	.tab[data-selected='true'] .label {
		/* c1-allow: TabView.xaml:351, :370 and :389 each set `ContentPresenter.FontWeight` to
		   `SemiBold` inline — all three selected states do, so hovering a selected tab does not
		   thin its label — and no resource stands behind the value. */
		font-weight: 600;
	}
	.tab[data-selected='true'] .close {
		background: var(--winui-TabViewItemHeaderSelectedCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderSelectedCloseButtonForeground);
	}
	.tab[data-selected='true']:hover:not([aria-disabled='true']) .body {
		color: var(--winui-TabViewItemHeaderForegroundPointerOver);
	}
	.tab[data-selected='true']:hover:not([aria-disabled='true']) .icon {
		color: var(--winui-TabViewItemIconForegroundPointerOver);
	}
	.tab[data-selected='true']:hover:not([aria-disabled='true']) .close {
		background: var(--winui-TabViewItemHeaderPointerOverCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderPointerOverCloseButtonForeground);
	}
	.tab[data-selected='true']:active:not([aria-disabled='true']) .body {
		color: var(--winui-TabViewItemHeaderForegroundPressed);
	}
	.tab[data-selected='true']:active:not([aria-disabled='true']) .icon {
		color: var(--winui-TabViewItemIconForegroundPressed);
	}
	.tab[data-selected='true']:active:not([aria-disabled='true']) .close {
		background: var(--winui-TabViewItemHeaderPressedCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderPressedCloseButtonForeground);
	}

	.tab[data-selected='true']::after,
	.flare-right {
		content: '';
		position: absolute;
		bottom: 0;
		width: 4px;
		height: 4px;
		background:
			radial-gradient(
				circle 4px at 0 0,
				transparent 0 3px,
				var(--winui-TabViewBorderBrush) 3px 4px,
				transparent 4px
			),
			radial-gradient(
				circle 4px at 0 0,
				transparent 0 4px,
				var(--winui-TabViewItemHeaderBackgroundSelected) 4px
			);
	}
	.tab[data-selected='true']::after {
		left: -4px;
	}
	.flare-right {
		right: -4px;
		background:
			radial-gradient(
				circle 4px at 100% 0,
				transparent 0 3px,
				var(--winui-TabViewBorderBrush) 3px 4px,
				transparent 4px
			),
			radial-gradient(
				circle 4px at 100% 0,
				transparent 0 4px,
				var(--winui-TabViewItemHeaderBackgroundSelected) 4px
			);
	}

	.tab:not([aria-disabled='true']) .close:hover {
		background: var(--winui-TabViewItemHeaderCloseButtonBackgroundPointerOver);
		color: var(--winui-TabViewItemHeaderCloseButtonForegroundPointerOver);
	}
	.tab:not([aria-disabled='true']) .close:active {
		background: var(--winui-TabViewItemHeaderCloseButtonBackgroundPressed);
		color: var(--winui-TabViewItemHeaderCloseButtonForegroundPressed);
	}
	.tab[aria-disabled='true'] .body {
		background: var(--winui-TabViewItemHeaderBackgroundDisabled);
		color: var(--winui-TabViewItemHeaderForegroundDisabled);
	}
	.tab[aria-disabled='true'] .icon {
		color: var(--winui-TabViewItemIconForegroundDisabled);
	}
	.tab[aria-disabled='true'] .close {
		background: var(--winui-TabViewItemHeaderDisabledCloseButtonBackground);
		color: var(--winui-TabViewItemHeaderDisabledCloseButtonForeground);
		cursor: default;
	}
	.tab[aria-disabled='true'] {
		cursor: default;
	}

	.tab:focus-visible .body::before {
		content: '';
		position: absolute;
		inset: calc(
			-1 * (var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
		);
		border-radius: calc(
				var(--winui-OverlayCornerRadius) + var(--winui-FocusVisualPrimaryThickness) +
					var(--winui-FocusVisualSecondaryThickness)
			)
			calc(
				var(--winui-OverlayCornerRadius) + var(--winui-FocusVisualPrimaryThickness) +
					var(--winui-FocusVisualSecondaryThickness)
			)
			calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
			calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness));
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	.panel {
		flex-grow: 1;
	}
</style>
