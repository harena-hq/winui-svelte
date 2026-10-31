<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/** One item. `SelectorBar.Items` narrowed to plain records, the narrowing NavigationView applies. */
	export interface SelectorBarItemData {
		/** Stable identity. What `selected` holds and what `onSelectedChange` reports. */
		id: string;
		/** SelectorBarItem.Text. */
		text?: string;
		/** SelectorBarItem.Icon, ADR 0012's shorthand: a Segoe Fluent Icons code point as uppercase hex. */
		glyph?: string | null;
		/** SelectorBarItem.Icon, ADR 0012's general form. Wins over `glyph`. */
		icon?: Snippet;
		/** IsEnabled on the item, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean;
	}

	export interface SelectorBarProps {
		/** Items, narrowed to plain records. */
		items: SelectorBarItemData[];
		/**
		 * SelectedItem, narrowed to the `id` of one record. `null` is upstream's own initial
		 * state: `SelectorBar.cpp:129-139` selects nothing on load, and `OnGotFocus`
		 * (`:98-127`) is what selects the first focusable item, and only when the bar is
		 * focused with nothing selected. The Gallery's first example renders with no pill for
		 * exactly that reason.
		 */
		selected?: string | null;
		/** SelectionChanged. Reports the new `id`. */
		onSelectedChange?: (id: string | null) => void;
		/** IsEnabled on the bar, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean | null;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// `PART_CommonVisual` (`SelectorBar.xaml:216-227`) draws nothing: its fill and stroke are
	// transparent in Default, Light, and HighContrast (`SelectorBar_themeresources.xaml:8-24`,
	// `:39-55`, `:70-86`), so it is absent. `SelectorBarItem.Child`, the
	// `ItemContainer` slot marked “Placeholder for Child UIElement” (`SelectorBar.xaml:171`), is
	// absent because the Gallery and automation peer use `icon` and `text`; `MultiSelectMode` is
	// absent because `ItemContainer.cpp:238-249` enters it but this template declares no states.
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	let {
		items,
		selected = $bindable(null),
		onSelectedChange,
		disabled = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: SelectorBarProps = $props();

	const str = useStrings();

	// The pill's growth on load is keyed on this rather than on `@starting-style` alone. With
	// `@starting-style` alone, the reference machine started no transition at all — not one
	// `transitionrun` — on 6 of 20 loads of `/dev/selector-bar`, for pills already in the
	// prerendered page; the likeliest reading is that an element styled in the document's first
	// style pass has no starting style applied. Two frames after mount, so the pill has been
	// styled at rest once before the flag moves it; see the `.root:not([data-applied])` rule.
	let applied = $state(false);
	$effect(() => {
		let second = 0;
		const first = requestAnimationFrame(() => {
			second = requestAnimationFrame(() => (applied = true));
		});
		return () => {
			cancelAnimationFrame(first);
			cancelAnimationFrame(second);
		};
	});

	const isItemDisabled = (item: SelectorBarItemData) => disabled || item.disabled === true;
	const isSelected = (item: SelectorBarItemData) => item.id === selected;
	const hasSelectedItem = () => items.some((item) => isSelected(item) && !isItemDisabled(item));
	const firstEnabledIndex = () => items.findIndex((item) => !isItemDisabled(item));

	function select(item: SelectorBarItemData) {
		if (isItemDisabled(item)) return;
		selected = item.id;
		onSelectedChange?.(item.id);
	}

	function tabIndexFor(item: SelectorBarItemData) {
		if (isItemDisabled(item)) return -1;
		if (isSelected(item)) return 0;
		return !hasSelectedItem() && items[firstEnabledIndex()] === item ? 0 : -1;
	}

	// `SelectorBar::OnGotFocus` (SelectorBar.cpp:98-127) selects on focus only when there is no
	// selection, and it selects the ItemsView's *current* item before falling back to the first
	// focusable one. Selecting the first unconditionally would fire twice on a pointer press —
	// `focusin` reaches the bar before `click` does — and the intermediate selection is one the
	// original never shows.
	function handleFocusIn(event: FocusEvent) {
		if (selected !== null) return;
		const id = (event.target as HTMLElement | null)
			?.closest<HTMLElement>('[data-selector-bar-id]')
			?.getAttribute('data-selector-bar-id');
		const focused = id === undefined || id === null ? -1 : items.findIndex((i) => i.id === id);
		const index = focused !== -1 && !isItemDisabled(items[focused]) ? focused : firstEnabledIndex();
		if (index !== -1) select(items[index]);
	}

	function handleKeydown(event: KeyboardEvent, index: number) {
		let candidate = -1;
		if (event.key === 'ArrowLeft') {
			for (let next = index - 1; next >= 0; next--) {
				if (!isItemDisabled(items[next])) {
					candidate = next;
					break;
				}
			}
		} else if (event.key === 'ArrowRight') {
			for (let next = index + 1; next < items.length; next++) {
				if (!isItemDisabled(items[next])) {
					candidate = next;
					break;
				}
			}
		} else if (event.key === 'Home') {
			candidate = firstEnabledIndex();
		} else if (event.key === 'End') {
			for (let next = items.length - 1; next >= 0; next--) {
				if (!isItemDisabled(items[next])) {
					candidate = next;
					break;
				}
			}
		} else {
			return;
		}

		event.preventDefault();
		if (candidate === -1) return;
		select(items[candidate]);
		(event.currentTarget as HTMLButtonElement).parentElement
			?.querySelector<HTMLButtonElement>(
				`[data-selector-bar-id="${CSS.escape(items[candidate].id)}"]`
			)
			?.focus();
	}
</script>

<div
	bind:this={ref}
	class={['root', className]}
	{style}
	data-applied={applied || undefined}
	role="listbox"
	aria-orientation="horizontal"
	onfocusin={handleFocusIn}
	{...rest}
>
	{#each items as item, index (item.id)}
		<!-- The icon is hidden, so an item without text would have no name.
		     `SelectorBarItemAutomationPeer::GetNameCore` takes `AutomationProperties.Name`, which
		     this item has no field for, then `Text`, then `ItemContainer.Child`'s string form,
		     which this item does not have (the icon is `Icon`, not `Child`), and last the localized
		     control name `SelectorBarItem`. -->
		<button
			type="button"
			class={['item', 'winui-BodyTextBlockStyle']}
			data-selector-bar-id={item.id}
			data-selected={isSelected(item) || undefined}
			disabled={isItemDisabled(item)}
			role="option"
			aria-label={item.text ? undefined : str('SelectorBarItemDefaultControlName')}
			aria-selected={isSelected(item)}
			aria-disabled={isItemDisabled(item) || undefined}
			tabindex={tabIndexFor(item)}
			onclick={() => select(item)}
			onkeydown={(event) => handleKeydown(event, index)}
		>
			{#if item.icon || item.glyph}
				<span class="content">
					<span class="icon" aria-hidden="true">
						{#if item.icon}
							{@render item.icon()}
						{:else if item.glyph}
							{String.fromCodePoint(parseInt(item.glyph, 16))}
						{/if}
					</span>
					{#if item.text}<span class="label">{item.text}</span>{/if}
				</span>
			{:else if item.text}
				<span class="content"><span class="label">{item.text}</span></span>
			{/if}
			<span class="pill"></span>
		</button>
	{/each}
</div>

<style>
	.root {
		display: flex;
		align-items: flex-start;
		padding: var(--winui-SelectorBarPadding);
	}

	.item {
		/* c1-allow: SelectorBar.xaml:56 sets `FocusVisualMargin="-2"`, so the band grows by both focus thicknesses */
		--band: calc(
			var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness)
		);
		position: relative;
		display: grid;
		grid-template-rows: auto auto;
		box-sizing: border-box;
		padding: 0;
		background: var(--winui-SelectorBarItemBackground);
		/* No border. `SelectorBar.xaml:50-51` sets `BorderBrush` and `BorderThickness` on the
		   item's Style and the item's template binds neither: `PART_ContainerRoot` (`:64`) takes
		   only `Background` and `CornerRadius`, and the one element that names a border brush is
		   `PART_CommonVisual` (`:221`), which draws nothing. A 1px border here is 2px of width
		   per item that the original does not spend — measured as a 6px drift across the
		   Gallery's five-item example before it was removed. */
		border: 0;
		border-radius: var(--winui-ControlCornerRadius);
		color: var(--winui-SelectorBarItemForeground);
		cursor: pointer;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	.content {
		display: flex;
		align-items: center;
		gap: var(--winui-SelectorBarItemSpacing);
		margin: var(--winui-SelectorBarItemPadding);
	}

	.icon {
		display: inline-block;
		margin: var(--winui-SelectorBarItemIconVisualMargin);
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: the reference guest measures SymbolIcon's unscaled em at 20px; its framework default is not in either pinned dictionary. */
		font-size: 20px;
		line-height: normal;
		transform: scale(var(--winui-SelectorBarItemIconScale));
		transform-origin: center;
	}

	.label {
		margin: var(--winui-SelectorBarItemTextVisualMargin);
	}

	.pill {
		/* SelectorBar.xaml:109 scales the resource width by 4 in selected states. */
		justify-self: center;
		width: var(--winui-SelectorBarItemPillWidth);
		height: var(--winui-SelectorBarItemPillHeight);
		margin: var(--winui-SelectorBarItemSelectionVisualMargin);
		background: var(--winui-SelectorBarItemPillFill);
		/* c1-allow: SelectorBar.xaml:204-205 sets `RadiusX="0.5" RadiusY="1"`; CSS retains the 1px vertical radius because it is the limiting radius on this 3px-high pill. */
		border-radius: 1px;
		opacity: 0;
		transform: scaleX(1);
		transform-origin: center;
	}

	.item[data-selected='true'] {
		background: var(--winui-SelectorBarItemBackgroundSelected);
		color: var(--winui-SelectorBarItemForegroundSelected);
	}

	.item[data-selected='true'] .pill {
		opacity: 1;
		transform: scaleX(4);
		/* Each of the three `Selected*` states (SelectorBar.xaml:97, :116, :133) animates
		   `ScaleX` to 4 and `Opacity` to 1 over `ComboBoxItemScaleAnimationDuration` along
		   `KeySpline="0,0,0,1"` — `SelectedNormal`'s keyframes are :109 and :112, the other
		   two carry the same — and `CombinedStates` declares no `VisualTransition`. So
		   selecting animates, moving between the three is a keyframe to where the pill
		   already is, and deselecting ends the storyboard: the pill is back at 1 and 0 in the
		   same frame. The transition is declared here rather than on `.pill` for that last
		   half — on `.pill` it ran on the way out as well, which upstream never does.

		   It also runs on load. `ItemContainer`, which `SelectorBarItem` derives from, calls
		   `UpdateVisualState(true)` from `OnApplyTemplate` (`ItemContainer.cpp:76`), so an item
		   selected when its template applies enters `SelectedNormal` and its storyboard grows the
		   pill from 1 to 4. On load that is the `data-applied` rule below: the pill is held at its
		   rest values until the bar has been styled once, then released. An element inserted later
		   has no earlier style to transition from, and the `@starting-style` below supplies the
		   rest values for it; it wins over this rule by coming after it at the same specificity.
		   The browser has no notion of a template being applied, though, and gives an element no
		   earlier style in two more cases upstream does not re-apply one: coming out of `display:
		   none` (a bar inside a collapsed Expander regrows its pill on every expand, where
		   upstream's grows on the first) and a keyed reorder that moves the node. Both replay the
		   growth. The bar's own baseline is captured with animations finished, so it still shows
		   the pill at 4.

		   Under reduced motion it still runs (ADR 0016): it is the `SelectedNormal` state's own
		   storyboard, and the visual state manager skips transitions, not a state's own
		   keyframes, when the system's animations are off. */
		transition:
			opacity var(--winui-ComboBoxItemScaleAnimationDuration)
				/* c1-allow: SelectorBar.xaml:112, `KeySpline="0,0,0,1"` on the `Opacity` keyframe */
				cubic-bezier(0, 0, 0, 1),
			transform var(--winui-ComboBoxItemScaleAnimationDuration)
				/* c1-allow: SelectorBar.xaml:109, `KeySpline="0,0,0,1"` on the `ScaleX` keyframe */
				cubic-bezier(0, 0, 0, 1);
	}

	@starting-style {
		.item[data-selected='true'] .pill {
			opacity: 0;
			transform: scaleX(1);
		}
	}

	/* Until the bar has been styled once, a selected pill holds the rest values its storyboard
	   starts from; when `data-applied` arrives, the selected rule takes over and the transition
	   runs, on every load. Only where script runs, since only script brings the flag; a page
	   whose script is slow or fails shows the selection by its brushes alone until then. */
	@media (scripting: enabled) {
		.root:not([data-applied]) .item[data-selected='true'] .pill {
			opacity: 0;
			transform: scaleX(1);
		}
	}

	.item:hover:not(:disabled) {
		background: var(--winui-SelectorBarItemBackgroundPointerOver);
		color: var(--winui-SelectorBarItemForegroundPointerOver);
	}

	.item:active:not(:disabled):not([data-selected='true']) {
		background: var(--winui-SelectorBarItemBackgroundPressed);
		color: var(--winui-SelectorBarItemForegroundPressed);
	}

	.item:active:not(:disabled)[data-selected='true'] {
		background: var(--winui-SelectorBarItemBackgroundSelected);
		color: var(--winui-SelectorBarItemForegroundPointerOver);
	}

	.item:disabled {
		background: var(--winui-SelectorBarItemBackgroundDisabled);
		color: var(--winui-SelectorBarItemForegroundDisabled);
		cursor: default;
	}

	.item:disabled[data-selected='true'] .pill {
		background: var(--winui-SelectorBarItemDisabledPillFill);
	}

	.item:focus-visible::before {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--band));
		border-radius: calc(var(--winui-ControlCornerRadius) + var(--band));
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}
</style>
