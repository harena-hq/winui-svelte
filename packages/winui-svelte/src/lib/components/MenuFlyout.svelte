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
		/**
		 * `Icon`, narrowed to a `FontIcon`: a Segoe Fluent Icons code point as uppercase hex,
		 * e.g. `'E72D'`. `NavigationViewItemData.glyph` spells the same thing the same way.
		 */
		glyph?: string;
		/** KeyboardAcceleratorTextOverride: the label drawn at the right of the row. */
		keyboardAcceleratorTextOverride?: string;
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
		/**
		 * `Icon`, narrowed to a `FontIcon`: a Segoe Fluent Icons code point as uppercase hex,
		 * e.g. `'E72D'`. `NavigationViewItemData.glyph` spells the same thing the same way.
		 */
		glyph?: string;
		/** KeyboardAcceleratorTextOverride: the label drawn at the right of the row. */
		keyboardAcceleratorTextOverride?: string;
	}

	/** A `MenuFlyoutSeparator`. It has no state and no identity, so it has no other field. */
	export interface MenuFlyoutSeparatorData {
		separator: true;
	}

	/**
	 * A `RadioMenuFlyoutItem`. `groupName` is the discriminant and is required: rows that share
	 * one are mutually exclusive, and which of them is selected lives in the parent's `selected`
	 * record rather than here.
	 */
	export interface RadioMenuFlyoutItemData {
		id: string;
		text: string;
		/** GroupName. */
		groupName: string;
		disabled?: boolean;
		/**
		 * `Icon`, narrowed to a `FontIcon`: a Segoe Fluent Icons code point as uppercase hex,
		 * e.g. `'E72D'`.
		 */
		glyph?: string;
		/** KeyboardAcceleratorTextOverride: the label drawn at the right of the row. */
		keyboardAcceleratorTextOverride?: string;
	}

	/**
	 * A `MenuFlyoutSubItem`: a row that opens a menu of its own. `items` is the discriminant and
	 * is required — a sub item with nothing in it is a row that cannot do the one thing it is.
	 */
	export interface MenuFlyoutSubItemData {
		id: string;
		text: string;
		/** The rows of the menu this row opens. Sub items nest to any depth. */
		items: MenuFlyoutEntry[];
		/** IsEnabled, inverted — ADR 0009. */
		disabled?: boolean;
		/**
		 * `Icon`, narrowed to a `FontIcon`: a Segoe Fluent Icons code point as uppercase hex,
		 * e.g. `'E72D'`.
		 */
		glyph?: string;
	}

	/**
	 * A `SplitMenuFlyoutItem`: a row whose left half invokes and whose right half opens a menu.
	 * `split` is the discriminant and `items` alone would not be — a sub item has that too.
	 */
	export interface SplitMenuFlyoutItemData {
		id: string;
		text: string;
		split: true;
		/** The rows the chevron half opens. */
		items: MenuFlyoutEntry[];
		disabled?: boolean;
		/**
		 * `Icon`, narrowed to a `FontIcon`: a Segoe Fluent Icons code point as uppercase hex,
		 * e.g. `'E72D'`.
		 */
		glyph?: string;
	}

	export type MenuFlyoutEntry =
		| MenuFlyoutItemData
		| ToggleMenuFlyoutItemData
		| MenuFlyoutSeparatorData
		| RadioMenuFlyoutItemData
		| MenuFlyoutSubItemData
		| SplitMenuFlyoutItemData;

	export interface MenuFlyoutProps {
		/** Items, narrowed to the six row kinds this unit draws. */
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
		/**
		 * `RadioMenuFlyoutItem.IsChecked`, collected: the selected row's id for each `groupName`.
		 * A group with no entry here has nothing selected.
		 */
		selected?: Record<string, string>;
		onSelectedChange?: (selected: Record<string, string>) => void;
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
		selected = $bindable({}),
		onSelectedChange,
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
	const hasCheckColumn = $derived(items.some((entry) => 'toggle' in entry || 'groupName' in entry));
	const hasIconColumn = $derived(items.some((entry) => 'glyph' in entry && Boolean(entry.glyph)));

	type MenuFlyoutBlock =
		| { kind: 'entry'; entry: MenuFlyoutEntry; key: number }
		| { kind: 'radioGroup'; groupName: string; entries: RadioMenuFlyoutItemData[]; key: number };

	function toBlocks(entries: MenuFlyoutEntry[]): MenuFlyoutBlock[] {
		const out: MenuFlyoutBlock[] = [];
		entries.forEach((entry, key) => {
			if ('groupName' in entry) {
				const last = out.at(-1);
				if (last?.kind === 'radioGroup' && last.groupName === entry.groupName) {
					last.entries.push(entry);
					return;
				}
				out.push({ kind: 'radioGroup', groupName: entry.groupName, entries: [entry], key });
				return;
			}
			out.push({ kind: 'entry', entry, key });
		});
		return out;
	}
</script>

{#snippet rowList(entries = items)}
	{#each toBlocks(entries) as block (block.key)}
		{#if block.kind === 'radioGroup'}
			<DropdownMenu.RadioGroup
				bind:value={
					() => selected[block.groupName] ?? '',
					(next) => {
						const nextSelected = { ...selected, [block.groupName]: next };
						selected = nextSelected;
						onSelectedChange?.(nextSelected);
					}
				}
			>
				{#snippet child({ props })}
					<div {...props} class="radio-group">
						{#each block.entries as entry (entry.id)}
							<DropdownMenu.RadioItem value={entry.id} disabled={entry.disabled}>
								{#snippet child({ props })}
									<div {...props} class="item toggle radio">
										<span class="check" aria-hidden="true"></span>
										<span class="body">
											{#if entry.glyph}<span class="icon" aria-hidden="true"
													>{String.fromCodePoint(parseInt(entry.glyph, 16))}</span
												>{/if}
											<span class="text">{entry.text}</span>
										</span>
										{#if entry.keyboardAcceleratorTextOverride}<span
												class="accelerator winui-CaptionTextBlockStyle"
												>{entry.keyboardAcceleratorTextOverride}</span
											>{/if}
									</div>
								{/snippet}
							</DropdownMenu.RadioItem>
						{/each}
					</div>
				{/snippet}
			</DropdownMenu.RadioGroup>
		{:else}
			{@const entry = block.entry}
			{#if 'separator' in entry}
				<DropdownMenu.Separator>
					{#snippet child({ props })}<div {...props} class="separator"></div>{/snippet}
				</DropdownMenu.Separator>
			{:else if 'split' in entry}
				<DropdownMenu.Sub>
					<div class="item split">
						<div class="split-buttons">
							<DropdownMenu.Item
								disabled={entry.disabled}
								onSelect={() => onItemInvoked?.(entry.id)}
							>
								{#snippet child({ props })}
									<div {...props} class="split-primary" aria-label={entry.text}></div>
								{/snippet}
							</DropdownMenu.Item>
							<span class="split-divider" aria-hidden="true"></span>
							<DropdownMenu.SubTrigger disabled={entry.disabled}>
								{#snippet child({ props })}
									<div {...props} class="split-secondary" aria-label={entry.text}></div>
								{/snippet}
							</DropdownMenu.SubTrigger>
						</div>
						<div class="split-content">
							<span class="body">
								{#if entry.glyph}<span class="icon" aria-hidden="true"
										>{String.fromCodePoint(parseInt(entry.glyph, 16))}</span
									>{/if}
								<span class="text">{entry.text}</span>
							</span>
							<span class="chevron" aria-hidden="true"></span>
						</div>
					</div>
					<DropdownMenu.Portal>
						<DropdownMenu.SubContent side="right" align="start" sideOffset={0} alignOffset={-2}>
							{#snippet child({ props, wrapperProps })}
								<div {...wrapperProps}>
									<div
										{...props}
										class="presenter winui-BodyTextBlockStyle"
										data-gutter={entry.items.some((row) => 'toggle' in row || 'groupName' in row)
											? ''
											: undefined}
										data-icons={entry.items.some((row) => 'glyph' in row && Boolean(row.glyph))
											? ''
											: undefined}
									>
										{@render rowList(entry.items)}
									</div>
								</div>
							{/snippet}
						</DropdownMenu.SubContent>
					</DropdownMenu.Portal>
				</DropdownMenu.Sub>
			{:else if 'items' in entry}
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger disabled={entry.disabled}>
						{#snippet child({ props })}
							<div {...props} class="item sub">
								<span class="body">
									{#if entry.glyph}<span class="icon" aria-hidden="true"
											>{String.fromCodePoint(parseInt(entry.glyph, 16))}</span
										>{/if}
									<span class="text">{entry.text}</span>
								</span>
								<span class="chevron" aria-hidden="true"></span>
							</div>
						{/snippet}
					</DropdownMenu.SubTrigger>
					<DropdownMenu.Portal>
						<DropdownMenu.SubContent side="right" align="start" sideOffset={0} alignOffset={-2}>
							{#snippet child({ props, wrapperProps })}
								<div {...wrapperProps}>
									<div
										{...props}
										class="presenter winui-BodyTextBlockStyle"
										data-gutter={entry.items.some((row) => 'toggle' in row || 'groupName' in row)
											? ''
											: undefined}
										data-icons={entry.items.some((row) => 'glyph' in row && Boolean(row.glyph))
											? ''
											: undefined}
									>
										{@render rowList(entry.items)}
									</div>
								</div>
							{/snippet}
						</DropdownMenu.SubContent>
					</DropdownMenu.Portal>
				</DropdownMenu.Sub>
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
							<span class="body"
								>{#if entry.glyph}<span class="icon" aria-hidden="true"
										>{String.fromCodePoint(parseInt(entry.glyph, 16))}</span
									>{/if}<span class="text">{entry.text}</span></span
							>
							{#if entry.keyboardAcceleratorTextOverride}<span
									class="accelerator winui-CaptionTextBlockStyle"
									>{entry.keyboardAcceleratorTextOverride}</span
								>{/if}
						</div>
					{/snippet}
				</DropdownMenu.CheckboxItem>
			{:else}
				<DropdownMenu.Item disabled={entry.disabled} onSelect={() => onItemInvoked?.(entry.id)}>
					{#snippet child({ props })}
						<div {...props} class="item">
							<span class="body"
								>{#if entry.glyph}<span class="icon" aria-hidden="true"
										>{String.fromCodePoint(parseInt(entry.glyph, 16))}</span
									>{/if}<span class="text">{entry.text}</span></span
							>
							{#if entry.keyboardAcceleratorTextOverride}<span
									class="accelerator winui-CaptionTextBlockStyle"
									>{entry.keyboardAcceleratorTextOverride}</span
								>{/if}
						</div>
					{/snippet}
				</DropdownMenu.Item>
			{/if}
		{/if}
	{/each}
{/snippet}

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
						data-icons={hasIconColumn ? '' : undefined}
						{...rest}
					>
						{@render rowList(items)}
					</div>
				</div>
			{/snippet}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
	/* WD-002: WinUI paints a `DesktopAcrylicBackdrop`, which cannot be represented in CSS;
	   this flat backdrop equivalent is recorded in docs/divergences.md. */
	/* WD-012: WinUI's popup host casts this presenter's ThemeShadow. No pinned resource states
	   its recipe, so this portalled surface deliberately draws no `box-shadow`; see
	   docs/divergences.md. */
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
		/* WD-013: the narrow padding is the only one this row takes. Upstream swaps in
		   `MenuFlyoutItemThemePadding` for a touch-opened menu, and nothing here can tell that
		   a menu was opened by touch; see docs/divergences.md. */
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

	/* Every `.toggle` rule below is about a row with a check cell rather than about a toggle
	   in particular, which is why the radio row carries the class too: upstream's
	   `DefaultRadioMenuFlyoutItemStyle` reads the same sub-item brushes for the same states. */
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

	.item.sub {
		background: var(--winui-MenuFlyoutSubItemBackground);
		border-color: var(--winui-MenuFlyoutSubItemBackgroundBrush);
		border-width: var(--winui-MenuFlyoutSubItemBorderThickness);
		color: var(--winui-MenuFlyoutSubItemForeground);
	}

	.item.sub[data-highlighted]:not([data-disabled]) {
		background: var(--winui-MenuFlyoutSubItemBackgroundPointerOver);
		color: var(--winui-MenuFlyoutSubItemForegroundPointerOver);
	}

	.item.sub[data-highlighted]:not([data-disabled]) .chevron {
		color: var(--winui-MenuFlyoutSubItemChevronPointerOver);
	}

	.item.sub:active:not([data-disabled]) {
		background: var(--winui-MenuFlyoutSubItemBackgroundPressed);
		color: var(--winui-MenuFlyoutSubItemForegroundPressed);
	}

	.item.sub:active:not([data-disabled]) .chevron {
		color: var(--winui-MenuFlyoutSubItemChevronPressed);
	}

	.item.sub[data-state='open']:not([data-disabled]) {
		background: var(--winui-MenuFlyoutSubItemBackgroundSubMenuOpened);
		color: var(--winui-MenuFlyoutSubItemForegroundSubMenuOpened);
	}

	.item.sub[data-state='open']:not([data-disabled]) .chevron {
		color: var(--winui-MenuFlyoutSubItemChevronSubMenuOpened);
	}

	.item.sub[data-disabled] {
		background: var(--winui-MenuFlyoutSubItemBackgroundDisabled);
		color: var(--winui-MenuFlyoutSubItemForegroundDisabled);
	}

	.item.sub[data-disabled] .chevron {
		color: var(--winui-MenuFlyoutSubItemChevronDisabled);
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

	.chevron {
		flex: none;
		/* MenuFlyout_themeresources.xaml:720, `Margin="{StaticResource MenuFlyoutItemChevronMargin}`
		   — `24,0,0,-1`, which the token carries permuted into CSS order. */
		margin: var(--winui-MenuFlyoutItemChevronMargin);
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: MenuFlyout_themeresources.xaml:720, `FontSize="12"` on `SubItemChevron`. */
		font-size: 12px;
		color: var(--winui-MenuFlyoutSubItemChevron);
	}

	.chevron::before {
		/* c1-allow: MenuFlyout_themeresources.xaml:720, `Glyph="&#xE974;"` on `SubItemChevron`. */
		content: '\e974';
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

	.body {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.icon {
		position: absolute;
		left: 0;
		top: 50%;
		/* the Viewbox at MenuFlyout_themeresources.xaml:388 — `Width="16" Height="16"`,
		   `VerticalAlignment="Center"`. `translateY` is what centres an absolutely
		   positioned box on a line whose height is the font's. */
		width: 16px;
		height: 16px;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		/* c1-allow: MenuFlyout_themeresources.xaml:389, the `ContentPresenter` holds the sample's
		   bare `<FontIcon>`, whose default FontSize is 20, scaled by the 16px Viewbox to 16. */
		font-size: 16px;
		font-family: var(--winui-SymbolThemeFontFamily);
		color: inherit;
	}

	/* CheckPlaceholder / IconPlaceholder: one column, so the text clears 28. */
	.presenter[data-gutter]:not([data-icons]) .item:not(.toggle) .text,
	.presenter[data-icons]:not([data-gutter]) .item .text,
	.presenter[data-icons][data-gutter] .item.toggle .text {
		margin: var(--winui-MenuFlyoutItemPlaceholderThemeThickness);
	}

	/* CheckAndIconPlaceholder: a plain row clears both columns. */
	.presenter[data-icons][data-gutter] .item:not(.toggle) .text {
		margin: var(--winui-MenuFlyoutItemDoublePlaceholderThemeThickness);
	}

	/* `IconRoot.Margin` in the same state: the icon clears the check column only. */
	.presenter[data-icons][data-gutter] .item:not(.toggle) .icon {
		margin: var(--winui-MenuFlyoutItemPlaceholderThemeThickness);
	}

	.accelerator {
		flex: none;
		text-align: right;
		/* MenuFlyout_themeresources.xaml:392, `Margin="24,4,0,0"` on the item template. */
		margin: 4px 0 0 24px;
		color: var(--winui-MenuFlyoutItemKeyboardAcceleratorTextForeground);
	}

	.item.toggle .accelerator {
		/* :493, `Margin="24,0,0,0"` — the toggle template's own, 4px different. */
		margin: 0 0 0 24px;
		color: var(--winui-ToggleMenuFlyoutItemKeyboardAcceleratorTextForeground);
	}

	.item[data-highlighted]:not([data-disabled]) .accelerator {
		color: var(--winui-MenuFlyoutItemKeyboardAcceleratorTextForegroundPointerOver);
	}

	.item:active:not([data-disabled]) .accelerator {
		color: var(--winui-MenuFlyoutItemKeyboardAcceleratorTextForegroundPressed);
	}

	.item[data-disabled] .accelerator {
		color: var(--winui-MenuFlyoutItemKeyboardAcceleratorTextForegroundDisabled);
	}

	.item.split {
		/* Upstream's `RootGrid` (:504) stacks two grids in the one cell. `BackgroundGrid` (:598)
		   holds the two buttons and the divider and carries no padding; `LayoutGrid` (:609) holds
		   the icon, the text and the chevron and carries the item's `Padding`. Which one measures
		   the row matters: `BackgroundGrid`'s columns are `*`, `Auto` (the 1px divider) and a fixed
		   38, so it contributes almost nothing, and the row's width is the layout layer's —
		   11 + text + 24 + 12 + 11. A single flex row cannot hold both facts at once. It would
		   measure 11 + 1 + 38 = 50 to the right of the text where upstream measures 24 + 12 + 11 =
		   47, and the card came out 3px wide against the original's 131. So the two layers are
		   reproduced as two layers. */
		display: block;
		position: relative;
		padding: 0;
		background: none;
	}

	.item.split:active {
		/* `:active` matches every ancestor of the pressed element, so the base `.item` pressed rule
		   would paint the whole row when one half is down — and paint it through both halves, whose
		   own background is the transparent `MenuFlyoutItemBackground`. Upstream's `RootGrid` has no
		   `Background` and no pressed state at all: `PrimaryPressed` and `SecondaryPressed` each
		   target one button (:533, :546). */
		background: none;
		color: var(--winui-MenuFlyoutItemForeground);
	}

	.split-buttons {
		/* `BackgroundGrid`. Out of flow, because it must not measure the row. */
		position: absolute;
		inset: 0;
		display: flex;
		/* :605 and :607, `VerticalAlignment="Stretch"` on both buttons. Only the layout layer is
		   tall enough to set the row's height, so without this each half would draw its fills as a
		   box the height of its own empty content. */
		align-items: stretch;
	}

	.split-content {
		/* `LayoutGrid`. In flow, and the only layer that measures. */
		position: relative;
		display: flex;
		align-items: center;
		padding: var(--winui-MenuFlyoutItemThemePaddingNarrow);
		/* `IsHitTestVisible="False"` on the TextBlock (:619) and the chevron (:620): this layer
		   paints and measures, and the pointer passes through it to the buttons underneath. */
		pointer-events: none;
	}

	.split-primary {
		flex: 1;
		min-width: 0;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-MenuFlyoutItemBackground);
	}

	.split-divider {
		flex: none;
		align-self: center;
		width: 1px;
		height: var(--winui-SplitMenuFlyoutItemSeparatorHeight);
		background: var(--winui-SplitMenuFlyoutItemButtonDividerBrush);
	}

	.split-secondary {
		flex: none;
		width: var(--winui-SplitMenuFlyoutItemChevronButtonWidth);
		/* c1-allow: MenuFlyout_themeresources.xaml:607, `CornerRadius="0,4,4,0"` on
		   `SecondaryButton` — a literal 4 upstream, not `ControlCornerRadius`, and reproduced as
		   the literal it is. XAML writes TopLeft,TopRight,BottomRight,BottomLeft and so does CSS. */
		border-radius: 0 4px 4px 0;
		background: var(--winui-MenuFlyoutItemBackground);
	}

	.split-primary[data-highlighted]:not([data-disabled]) {
		background: var(--winui-MenuFlyoutItemBackgroundPointerOver);
	}

	.split-primary:active:not([data-disabled]) {
		background: var(--winui-MenuFlyoutItemBackgroundPressed);
	}

	.split-primary[data-disabled] {
		background: var(--winui-MenuFlyoutItemBackgroundDisabled);
	}

	/* The text and the icon are in the layer above the button, exactly as upstream's are in a
	   different grid from it, so each of these is the `Setter` that reaches across: :527-528,
	   :534-535 and :560,562 target `TextBlock.Foreground` and `IconContent.Foreground` from a
	   state named for the button. The chevron keeps its own colour throughout, so it is excluded
	   here and painted by the four rules below. */
	.item.split:has(.split-primary[data-highlighted]:not([data-disabled])) .body {
		color: var(--winui-MenuFlyoutItemForegroundPointerOver);
	}

	.item.split:has(.split-primary:active:not([data-disabled])) .body {
		color: var(--winui-MenuFlyoutItemForegroundPressed);
	}

	.item.split:has(.split-primary[data-disabled]) .body {
		color: var(--winui-MenuFlyoutItemForegroundDisabled);
	}

	.split-secondary[data-highlighted]:not([data-disabled]) {
		background: var(--winui-MenuFlyoutItemBackgroundPointerOver);
	}

	/* `SubMenuOpened` is declared before `SecondaryPressed` here and the pressed rules come after
	   it, so pressing the chevron of an open submenu shows the pressed fill. A `VisualStateManager`
	   shows the state entered last, and pressing is what happens after opening. */
	.split-secondary[data-state='open']:not([data-disabled]) {
		background: var(--winui-MenuFlyoutSubItemBackgroundSubMenuOpened);
	}

	.split-secondary:active:not([data-disabled]) {
		background: var(--winui-MenuFlyoutItemBackgroundPressed);
	}

	.split-secondary[data-disabled] {
		background: var(--winui-MenuFlyoutItemBackgroundDisabled);
	}

	.item.split:has(.split-secondary[data-highlighted]:not([data-disabled])) .chevron {
		color: var(--winui-MenuFlyoutSubItemChevronPointerOver);
	}

	.item.split:has(.split-secondary[data-state='open']:not([data-disabled])) .chevron {
		color: var(--winui-MenuFlyoutSubItemChevronSubMenuOpened);
	}

	.item.split:has(.split-secondary:active:not([data-disabled])) .chevron {
		color: var(--winui-MenuFlyoutSubItemChevronPressed);
	}

	.item.split:has(.split-secondary[data-disabled]) .chevron {
		color: var(--winui-MenuFlyoutSubItemChevronDisabled);
	}

	.item.toggle[data-highlighted]:not([data-disabled]) .accelerator {
		color: var(--winui-ToggleMenuFlyoutItemKeyboardAcceleratorTextForegroundPointerOver);
	}

	.item.toggle:active:not([data-disabled]) .accelerator {
		color: var(--winui-ToggleMenuFlyoutItemKeyboardAcceleratorTextForegroundPressed);
	}

	.item.toggle[data-disabled] .accelerator {
		color: var(--winui-ToggleMenuFlyoutItemKeyboardAcceleratorTextForegroundDisabled);
	}

	.separator {
		flex: none;
		height: var(--winui-MenuFlyoutSeparatorHeight);
		margin: var(--winui-MenuFlyoutSeparatorThemePadding);
		background: var(--winui-MenuFlyoutSeparatorBackground);
	}

	.radio-group {
		/* The presenter is a column flex container and every row is a flex item of it. The group
		   is a context provider with no box of its own upstream — `ItemsPresenter` stacks the rows
		   flat — so removing its box is what keeps the rows flex items of the presenter. */
		display: contents;
	}

	.item.radio .check::before {
		/* c1-allow: RadioMenuFlyoutItem_themeresources.xaml:94, `Glyph="&#xE915;"` on `CheckGlyph`,
		   where `DefaultToggleMenuFlyoutItemStyle` has `&#xE73E;` and everything else agrees. */
		content: '\e915';
	}
</style>
