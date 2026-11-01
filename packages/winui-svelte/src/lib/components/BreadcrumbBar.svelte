<script lang="ts" module>
	/**
	 * One crumb. `ItemsSource` narrowed to plain records: the Gallery binds a `string[]` on one
	 * example and a list of one-field objects on the other, so a record with a label is what both
	 * shapes have in common.
	 */
	export interface BreadcrumbBarItemData {
		/** The crumb's label. What `ItemTemplate` binds in both of the Gallery's examples. */
		content: string;
	}

	export interface BreadcrumbBarProps {
		/** ItemsSource, narrowed to plain records — the same narrowing NavigationView applies. */
		items: BreadcrumbBarItemData[];
		/**
		 * ItemClicked. `index` is the crumb's position in `items`, which is what
		 * `BreadcrumbBarItemClickedEventArgs.Index` carries. The last crumb is not a button and
		 * never raises it; a row inside the ellipsis flyout raises it with its own original index.
		 */
		onItemClicked?: (detail: { index: number; item: BreadcrumbBarItemData }) => void;
		/**
		 * No public WinUI member: `BreadcrumbBarItem` opens and closes this flyout from its own
		 * code (`BreadcrumbBarItem.cpp:300-320`). ADR 0009 maps a control's own state to a
		 * bindable prop, which is the same reading that gives `Flyout` its `open`.
		 */
		ellipsisOpen?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onEllipsisOpenChange?: (open: boolean) => void;
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean | null;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// `ItemTemplate` and `ItemTemplateSelector` are absent: snippets select rendering. The RTL
	// chevron and `DefaultRTL`/`EllipsisRTL` states are not built by this unit. Five foreground
	// brushes are deliberately absent: `BreadcrumbBarFocusForegroundBrush` and
	// `BreadcrumbBarCurrentFocusForegroundBrush` paint states `UpdateButtonCommonVisualState`
	// cannot compose (`BreadcrumbBarItem.cpp:390-424`); `BreadcrumbBarCurrentHoverForegroundBrush`,
	// `BreadcrumbBarCurrentPressedForegroundBrush` and `BreadcrumbBarCurrentDisabledForegroundBrush`
	// paint `PART_ItemButton`, which `LastItem` collapses (`BreadcrumbBar.xaml:87-95`).
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	import Flyout from './Flyout.svelte';

	let {
		items,
		onItemClicked,
		ellipsisOpen = $bindable(false),
		onEllipsisOpenChange,
		disabled = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: BreadcrumbBarProps = $props();

	const str = useStrings();

	// BreadcrumbBar.xaml:116-128 sets these six presenter values. The presenter is portalled to
	// `body`, so the ancestor cascade cannot carry the BreadcrumbBar overrides to it.
	const ellipsisFlyoutStyle =
		'--winui-FlyoutPresenterBackground: var(--winui-BreadcrumbBarEllipsisFlyoutPresenterBackground); --winui-FlyoutBorderThemeBrush: var(--winui-BreadcrumbBarEllipsisFlyoutPresenterBorderBrush); --winui-FlyoutBorderThemeThickness: var(--winui-BreadcrumbBarEllipsisFlyoutPresenterBorderThemeThickness); --winui-FlyoutContentPadding: 2px 0; --winui-FlyoutThemeMinHeight: 40px; --winui-FlyoutThemeMinWidth: 0px;';

	let bar: HTMLOListElement | undefined = $state();
	let itemElements: Array<HTMLLIElement | undefined> = [];
	let ellipsisRendered = $state(false);
	let firstVisibleItemIndex = $state(0);

	const hiddenItems = $derived(items.slice(0, firstVisibleItemIndex));

	function recompute() {
		if (!bar || items.length <= 1) {
			if (ellipsisRendered) ellipsisRendered = false;
			if (firstVisibleItemIndex !== 0) firstVisibleItemIndex = 0;
			return;
		}

		const widths = itemElements.map((element) => element?.offsetWidth ?? 0);
		const realCrumbsWidth = widths.slice(1).reduce((total, width) => total + width, 0);
		const nextEllipsisRendered = realCrumbsWidth > bar.clientWidth;
		let nextFirstVisibleItemIndex = 0;

		if (nextEllipsisRendered) {
			let accumulatedWidth = (widths.at(-1) ?? 0) + (widths[0] ?? 0);
			for (let index = items.length - 1; index >= 1; index--) {
				if (accumulatedWidth + (widths[index] ?? 0) > bar.clientWidth) {
					nextFirstVisibleItemIndex = index;
					break;
				}
				accumulatedWidth += widths[index] ?? 0;
			}
		}

		if (ellipsisRendered !== nextEllipsisRendered) ellipsisRendered = nextEllipsisRendered;
		if (firstVisibleItemIndex !== nextFirstVisibleItemIndex)
			firstVisibleItemIndex = nextFirstVisibleItemIndex;
	}

	function closeEllipsisFlyout() {
		ellipsisOpen = false;
		onEllipsisOpenChange?.(false);
	}

	$effect(() => {
		// The list shape changes the DOM references as well as the widths, so it is observed with
		// the list's box rather than treated as a value a `$derived` can calculate.
		// Reading each label is what makes a relabelled crumb re-measure: the array reference
		// alone does not change when a consumer edits one record in place.
		items.forEach((item) => void item.content);
		itemElements.length = items.length + 1;
		const element = bar;
		if (!element) return;
		recompute();
		const observer = new ResizeObserver(recompute);
		observer.observe(element);
		return () => observer.disconnect();
	});
</script>

<nav bind:this={ref} class={['root', className]} {style} {...rest}>
	<ol bind:this={bar} class="bar">
		{#if items.length > 0}
			<li
				bind:this={itemElements[0]}
				class="crumb"
				data-kind="ellipsis"
				data-hidden={!ellipsisRendered || undefined}
			>
				<Flyout
					bind:open={
						() => ellipsisOpen,
						(next) => {
							ellipsisOpen = next;
							onEllipsisOpenChange?.(next);
						}
					}
					style={ellipsisFlyoutStyle}
					content={ellipsisRows}
				>
					{#snippet children(props)}
						<button
							{...props}
							type="button"
							class="item ellipsis"
							{disabled}
							aria-label={str('AutomationNameEllipsisBreadcrumbBarItem')}
						>
							<span class="ellipsis-glyph" aria-hidden="true"></span>
						</button>
					{/snippet}
				</Flyout>
				<span class="chevron" aria-hidden="true"></span>
			</li>
		{/if}
		{#each items as item, index (index)}
			<li
				bind:this={itemElements[index + 1]}
				class="crumb"
				data-kind={index === items.length - 1 ? 'last' : 'default'}
				data-hidden={ellipsisRendered && index < firstVisibleItemIndex ? true : undefined}
			>
				{#if index === items.length - 1}
					<span class="item current" tabindex={disabled ? undefined : 0}>{item.content}</span>
				{:else}
					<button
						type="button"
						class="item"
						{disabled}
						onclick={() => onItemClicked?.({ index, item })}
					>
						<span class="content">{item.content}</span>
					</button>
					<span class="chevron" aria-hidden="true"></span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

{#snippet ellipsisRows()}
	<!-- A flex column rather than the presenter's own block flow, for two reasons that both
	     come from `Margin="5,3"` on the row. Adjacent block siblings collapse their vertical
	     margins and XAML's do not, so plain blocks would sit 3px apart where upstream sits
	     them 6px apart; and a `<button>` shrink-wraps under `width: auto` even as a block, so
	     the row would have needed `width: 100%` and then overflowed its own horizontal margins
	     inside a presenter that scrolls. A flex item stretches to the line minus its margins,
	     which is what the StackPanel does. -->
	<div class="drop-rows">
		{#each hiddenItems as item, index (index)}
			<button
				type="button"
				class="drop-row"
				{disabled}
				onclick={() => {
					onItemClicked?.({ index, item });
					closeEllipsisFlyout();
				}}
			>
				{item.content}
			</button>
		{/each}
	</div>
{/snippet}

<style>
	.root {
		/* c1-allow: BreadcrumbBar.xaml:167 sets `FocusVisualMargin="-3"`, so the band grows by both focus thicknesses */
		--band: calc(
			var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness)
		);
		background: var(--winui-BreadcrumbBarBackgroundBrush);
		border-color: var(--winui-BreadcrumbBarBorderBrush);
		font-family: var(--winui-ContentControlThemeFontFamily);
		font-size: var(--winui-BreadcrumbBarItemThemeFontSize);
		font-weight: var(--winui-BreadcrumbBarItemFontWeight);
	}

	.bar {
		position: relative;
		display: flex;
		align-items: center;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.crumb {
		display: flex;
		align-items: center;
		list-style: none;
		margin: 0;
		padding: 0;
		white-space: nowrap;
	}

	.crumb[data-hidden='true'] {
		position: absolute;
		top: 0;
		left: 0;
		visibility: hidden;
		pointer-events: none;
	}

	.item,
	.drop-row {
		position: relative;
		box-sizing: border-box;
		font-family: var(--winui-ContentControlThemeFontFamily);
		font-size: var(--winui-BreadcrumbBarItemThemeFontSize);
		font-weight: var(--winui-BreadcrumbBarItemFontWeight);
		border-radius: var(--winui-ControlCornerRadius);
	}

	.item {
		padding: 3px 1px;
		background: var(--winui-BreadcrumbBarBackgroundBrush);
		color: var(--winui-BreadcrumbBarNormalForegroundBrush);
		border: 0;
		cursor: pointer;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	.content {
		/* c1-allow: BreadcrumbBar.xaml:262-272 sets `LineHeight="20"` on `PART_ItemContentPresenter` */
		line-height: 20px;
	}

	button.item:hover:not(:disabled) {
		color: var(--winui-BreadcrumbBarHoverForegroundBrush);
	}

	button.item:active:not(:disabled) {
		color: var(--winui-BreadcrumbBarPressedForegroundBrush);
	}

	.item:disabled {
		color: var(--winui-BreadcrumbBarDisabledForegroundBrush);
		cursor: default;
	}

	.item.current {
		display: inline-block;
		padding: 3px 1px;
		background: var(--winui-BreadcrumbBarBackgroundBrush);
		color: var(--winui-BreadcrumbBarCurrentNormalForegroundBrush);
		cursor: default;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
		/* c1-allow: BreadcrumbBar.xaml:285-300 sets `LineHeight="20"` on `PART_LastItemContentPresenter` */
		line-height: 20px;
	}

	.chevron {
		padding: var(--winui-BreadcrumbBarChevronPadding);
		color: var(--winui-BreadcrumbBarNormalForegroundBrush);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-BreadcrumbBarChevronFontSize);
	}

	.chevron::before {
		content: var(--winui-BreadcrumbBarChevronLeftToRight) / '';
	}

	.ellipsis-glyph {
		padding: 3px;
		font-family: var(--winui-SymbolThemeFontFamily);
	}

	/* BreadcrumbBar.xaml:278 writes `Text="&#xE712;"`; it is a template literal, not a resource. */
	.ellipsis-glyph::before {
		content: '\e712' / '';
	}

	.drop-row {
		/* c1-allow: BreadcrumbBar.xaml:33 sets `FocusVisualMargin="-3"`, so the portalled row needs the same two-thickness band as its trigger. */
		--band: calc(
			var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness)
		);
		margin: 3px 5px;
		padding: 7px 11px 9px;
		background: var(--winui-BreadcrumbBarEllipsisDropDownItemBackground);
		color: var(--winui-BreadcrumbBarForegroundBrush);
		border: 0;
		cursor: pointer;
		text-align: left;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	.drop-rows {
		display: flex;
		flex-direction: column;
	}

	.drop-row:hover:not(:disabled) {
		background: var(--winui-BreadcrumbBarEllipsisDropDownItemBackgroundPointerOver);
		color: var(--winui-BreadcrumbBarEllipsisDropDownItemForegroundPointerOver);
	}

	.drop-row:active:not(:disabled) {
		background: var(--winui-BreadcrumbBarEllipsisDropDownItemBackgroundPressed);
		color: var(--winui-BreadcrumbBarEllipsisDropDownItemForegroundPressed);
	}

	.drop-row:disabled {
		background: var(--winui-BreadcrumbBarEllipsisDropDownItemBackgroundDisabled);
		color: var(--winui-BreadcrumbBarEllipsisDropDownItemForegroundDisabled);
		cursor: default;
	}

	.item:focus-visible::before,
	.drop-row:focus-visible::before {
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

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
