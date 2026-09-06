<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { FlyoutPlacement } from './Flyout.svelte';

	/** A `MenuFlyoutItem`: a row that invokes and closes the menu. */
	export interface MenuFlyoutItemData {
		/** Stable identity. What `onItemInvoked` reports. */
		id: string;
		/** Text. */
		text: string;
		/** IsEnabled, inverted — ADR 0009. */
		disabled?: boolean;
	}

	/**
	 * A `ToggleMenuFlyoutItem`. `toggle` is the discriminant and is required; `IsChecked` lives
	 * on the parent's `checked` array rather than here, so that the menu has one source of truth
	 * for it and the consumer has one thing to bind.
	 */
	export interface ToggleMenuFlyoutItemData {
		id: string;
		text: string;
		toggle: true;
		disabled?: boolean;
	}

	/** A `MenuFlyoutSeparator`. It has no state and no identity, so it has no other field. */
	export interface MenuFlyoutSeparatorData {
		separator: true;
	}

	export type MenuFlyoutEntry =
		MenuFlyoutItemData | ToggleMenuFlyoutItemData | MenuFlyoutSeparatorData;

	export interface MenuFlyoutProps {
		/** Items, narrowed to the three row kinds this unit draws. */
		items?: MenuFlyoutEntry[];
		/**
		 * The element that opens the menu. Receives the props it must spread.
		 *
		 * Spread them **first**, before the element's own attributes: they carry the
		 * primitive's event handlers, and a trigger that sets one of the same names after the
		 * spread replaces it rather than adding to it.
		 */
		children: Snippet<[Record<string, unknown>]>;
		/** FlyoutBase.Placement. */
		placement?: FlyoutPlacement;
		/**
		 * No WinUI member: the gap between the menu and its trigger, in pixels. 4 is what the
		 * Gallery's menu measures on the reference guest — the card's bottom border is row 373
		 * and the trigger's top border is row 378 — and no pinned dictionary states it.
		 */
		offset?: number;
		/** IsOpen. `FlyoutBase` exposes this read-only with `ShowAt`/`Hide`; ADR 0009 maps a
		 * control's own state to a bindable prop. */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: boolean) => void;
		/** `ToggleMenuFlyoutItem.IsChecked`, collected: the ids of the checked toggle rows. */
		checked?: string[];
		onCheckedChange?: (checked: string[]) => void;
		/** `MenuFlyoutItem.Click`, reported by id. */
		onItemInvoked?: (id: string) => void;
		class?: string;
		style?: string;
		/** ADR 0009's `ref` points at the interactive element: here, the presenter. */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// `MenuFlyoutPresenterStyle` is absent. A Svelte consumer restyles through `class`, `style`
	// and the token cascade, which is ADR 0002.
	// `LightDismissOverlayMode` is absent: it draws a dimming layer, and this component draws no
	// layer of its own.
	// `ShowMode`, `AllowFocusOnInteraction` and `OverlayInputPassThroughElement` are absent:
	// focus and input-routing policy belong to the primitive.
	// `ShouldConstrainToRootBounds` is absent because a browser tab cannot express it either way.
	// `Opening`, `Opened`, `Closing` and `Closed` are recoverable from `onOpenChange`.
	// `Full` placement is absent: it stretches across the window rather than anchoring.
</script>

<script lang="ts">
	import { DropdownMenu } from 'bits-ui';

	let {
		items = [],
		placement = 'top',
		offset = 4,
		open = $bindable(false),
		onOpenChange,
		checked = $bindable([]),
		onCheckedChange,
		onItemInvoked,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: MenuFlyoutProps = $props();

	// The same placement table as `Flyout.svelte`.
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
	const hasCheckColumn = $derived(items.some((entry) => 'toggle' in entry));
</script>

<DropdownMenu.Root
	bind:open={
		() => open,
		(next) => {
			open = next;
			onOpenChange?.(next);
		}
	}
>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			{@render children(props)}
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Portal>
		<DropdownMenu.Content side={position.side} align={position.align} sideOffset={offset}>
			{#snippet child({ props, wrapperProps })}
				<div {...wrapperProps}>
					<div
						{...props}
						bind:this={ref}
						class={['presenter', 'winui-BodyTextBlockStyle', className]}
						{style}
						data-gutter={hasCheckColumn ? '' : undefined}
						{...rest}
					>
						{#each items as entry, index (index)}
							{#if 'separator' in entry}
								<DropdownMenu.Separator>
									{#snippet child({ props })}
										<div {...props} class="separator"></div>
									{/snippet}
								</DropdownMenu.Separator>
							{:else if 'toggle' in entry}
								<DropdownMenu.CheckboxItem
									disabled={entry.disabled}
									bind:checked={
										() => checked.includes(entry.id),
										(next) => {
											const nextChecked = next
												? checked.includes(entry.id)
													? checked
													: [...checked, entry.id]
												: checked.filter((id) => id !== entry.id);
											checked = nextChecked;
											onCheckedChange?.(nextChecked);
										}
									}
								>
									{#snippet child({ props })}
										<div {...props} class="item toggle">
											<span class="check" aria-hidden="true"></span>
											<span class="text">{entry.text}</span>
										</div>
									{/snippet}
								</DropdownMenu.CheckboxItem>
							{:else}
								<DropdownMenu.Item
									disabled={entry.disabled}
									onSelect={() => onItemInvoked?.(entry.id)}
								>
									{#snippet child({ props })}
										<div {...props} class="item"><span class="text">{entry.text}</span></div>
									{/snippet}
								</DropdownMenu.Item>
							{/if}
						{/each}
					</div>
				</div>
			{/snippet}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
	/* WD-002: WinUI paints a `DesktopAcrylicBackdrop`, which cannot be represented in CSS;
	   this flat backdrop equivalent is recorded in docs/divergences.md. */
	.presenter {
		box-sizing: border-box;
		/* A column flex container, because XAML's stack has no margin collapsing and CSS's
		   normal flow does. Every row carries `MenuFlyoutItemMargin`'s 2px top and bottom, and
		   in normal flow two adjacent 2s collapse to one — which took 2px off each gap and made
		   the card 101 tall against the original's 105. Flex items never collapse their
		   margins, so this is the layout mode that reproduces the dictionary's arithmetic.
		   `flex: none` on the rows keeps a scrolling menu from shrinking them instead, which is
		   what upstream's ScrollViewer does. */
		display: flex;
		flex-direction: column;
		/* The focus scope focuses this element from script when the menu opens, and Chromium
		   grants `:focus-visible` to a scripted focus on a `tabindex="-1"` element — so the
		   browser would draw a ring around the whole presenter, which WinUI draws nowhere. */
		outline: none;
		background:
			linear-gradient(
					var(--winui-MenuFlyoutPresenterBackground),
					var(--winui-MenuFlyoutPresenterBackground)
				)
				padding-box,
			var(--winui-AcrylicBackgroundFillColorDefaultBrush) padding-box;
		border: var(--winui-MenuFlyoutPresenterBorderThemeThickness) solid
			var(--winui-MenuFlyoutPresenterBorderBrush);
		border-radius: var(--winui-OverlayCornerRadius);
		padding: var(--winui-MenuFlyoutPresenterThemePadding);
		min-width: var(--winui-FlyoutThemeMinWidth);
		min-height: var(--winui-MenuFlyoutThemeMinHeight);
		overflow-x: hidden;
		overflow-y: auto;
	}

	.item {
		display: flex;
		flex: none;
		align-items: center;
		margin: var(--winui-MenuFlyoutItemMargin);
		padding: var(--winui-MenuFlyoutItemThemePaddingNarrow);
		border-radius: var(--winui-ControlCornerRadius);
		border: var(--winui-MenuFlyoutItemBorderThickness) solid
			var(--winui-MenuFlyoutItemBackgroundBrush);
		background: var(--winui-MenuFlyoutItemBackground);
		color: var(--winui-MenuFlyoutItemForeground);
		cursor: default;
		user-select: none;
		/* c1-allow: the platform default, as `Flyout.svelte`, `Expander.svelte` and
		   `InfoBar.svelte` take it. The ramp class supplies the family and size, but its 20px
		   line height is the published type ramp rather than what `DefaultMenuFlyoutItemStyle`
		   draws: its TextBlock has no Style. Measured on the reference guest at 14px, the font
		   spacing is 19px; that makes rows 28px and the card 105px. */
		line-height: normal;
	}

	.item[data-highlighted] {
		background: var(--winui-MenuFlyoutItemBackgroundPointerOver);
		color: var(--winui-MenuFlyoutItemForegroundPointerOver);
	}

	/* `:not([data-disabled])` is load-bearing, and only on this rule. A disabled toggle item
	   has no background setter in any of its visual states, so its own disabled rule below
	   sets a colour and nothing else — which left this rule, matching every `.item`, to paint
	   a pressed fill on a row that cannot be pressed. A disabled element still takes `:active`
	   on mousedown. The plain item is safe without the guard, because its disabled rule does
	   set a background and outweighs this one. */
	.item:active:not([data-disabled]) {
		background: var(--winui-MenuFlyoutItemBackgroundPressed);
		color: var(--winui-MenuFlyoutItemForegroundPressed);
	}

	.item:not(.toggle)[data-disabled] {
		background: var(--winui-MenuFlyoutItemBackgroundDisabled);
		color: var(--winui-MenuFlyoutItemForegroundDisabled);
	}

	.item.toggle[data-highlighted]:not([data-disabled]) {
		background: var(--winui-MenuFlyoutSubItemBackgroundPointerOver);
		color: var(--winui-MenuFlyoutItemForegroundPointerOver);
	}

	.item.toggle:active:not([data-disabled]) {
		background: var(--winui-MenuFlyoutSubItemBackgroundPressed);
		color: var(--winui-MenuFlyoutSubItemForegroundPressed);
	}

	.item.toggle[data-disabled] {
		color: var(--winui-MenuFlyoutSubItemForegroundDisabled);
	}

	.check {
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: MenuFlyout_themeresources.xaml:488, `FontSize="12"` on `CheckGlyph`. */
		font-size: 12px;
		width: 12px;
		margin-right: 16px;
		flex: none;
		text-align: center;
		color: var(--winui-MenuFlyoutSubItemChevron);
		opacity: 0;
	}

	.check::before {
		/* c1-allow: MenuFlyout_themeresources.xaml:488, `Glyph="&#xE73E;"` on `CheckGlyph`. */
		content: '\e73e';
	}

	.item.toggle[data-state='checked'] .check {
		opacity: 1;
	}

	.item.toggle[data-highlighted]:not([data-disabled]) .check {
		color: var(--winui-MenuFlyoutItemForegroundPointerOver);
	}

	.item.toggle:active:not([data-disabled]) .check {
		color: var(--winui-MenuFlyoutSubItemForegroundPressed);
	}

	.item.toggle[data-disabled] .check {
		color: var(--winui-MenuFlyoutSubItemForegroundDisabled);
	}

	.text {
		min-width: 0;
	}

	.presenter[data-gutter] .item:not(.toggle) .text {
		margin: var(--winui-MenuFlyoutItemPlaceholderThemeThickness);
	}

	.separator {
		flex: none;
		height: var(--winui-MenuFlyoutSeparatorHeight);
		margin: var(--winui-MenuFlyoutSeparatorThemePadding);
		background: var(--winui-MenuFlyoutSeparatorBackground);
	}
</style>
