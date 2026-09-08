<script lang="ts">
	import type { NavigationViewItemData } from './NavigationView.svelte';
	import ToolTip from './ToolTip.svelte';

	interface Props {
		item: NavigationViewItemData;
		selected: string | null;
		onItemInvoked?: (id: string) => void;
		/** `OnTopNavigationPrimary` against `OnTopNavigationOverflow` — NavigationView.xaml:448 and :455. */
		placement: 'primary' | 'overflow';
		/** `UpdateSettingsItemToolTip` — NavigationView.cpp:1921-1937. */
		tooltip?: string;
		/**
		 * The row has moved into the overflow flyout. It stays mounted and hidden rather than
		 * unmounting, because the parent's next measurement reads its width; the attribute is
		 * the parent's to set, and the `<li>` it belongs on is this component's to render.
		 */
		overflowed?: boolean;
	}

	let { item, selected, onItemInvoked, placement, tooltip, overflowed }: Props = $props();
	const isSelected = $derived(selected === item.id);
	const hasIcon = $derived(Boolean(item.glyph));
	const hasContent = $derived(Boolean(item.content));
	const icons = $derived(hasIcon && !hasContent ? 'iconOnly' : hasIcon ? 'both' : 'contentOnly');

	function activate() {
		onItemInvoked?.(item.id);
	}
	function onkeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		activate();
	}
	const EMPTY_TRIGGER_PROPS: Record<string, unknown> = Object.freeze({});
	function withTriggerClick(props: Record<string, unknown>) {
		return (event: MouseEvent) => {
			(props.onclick as ((event: MouseEvent) => void) | undefined)?.(event);
			activate();
		};
	}
	function withTriggerKeydown(props: Record<string, unknown>) {
		return (event: KeyboardEvent) => {
			(props.onkeydown as ((event: KeyboardEvent) => void) | undefined)?.(event);
			onkeydown(event);
		};
	}
</script>

<li role="none" data-overflowed={overflowed || undefined}>
	<!-- The row is written once because a tooltip wraps only icon-only top settings. `props`
	     takes its type from its default value rather than an annotation: svelte-package ships
	     source, where an annotation in markup does not survive consumer parsing. -->
	{#snippet row(props = EMPTY_TRIGGER_PROPS)}
		<div
			{...props}
			role="treeitem"
			class="item"
			aria-selected={isSelected}
			aria-label={!hasContent ? tooltip : undefined}
			aria-level={1}
			tabindex="0"
			data-selected={isSelected}
			data-placement={placement}
			data-icons={icons}
			onclick={withTriggerClick(props)}
			onkeydown={withTriggerKeydown(props)}
		>
			<span class="selection-indicator"></span>
			{#if item.glyph}<span class="icon">{String.fromCodePoint(parseInt(item.glyph, 16))}</span
				>{/if}
			{#if item.content}<span class="content">{item.content}</span>{/if}
		</div>
	{/snippet}
	{#if tooltip}
		<ToolTip content={tooltip}>{#snippet children(props)}{@render row(props)}{/snippet}</ToolTip>
	{:else}
		{@render row()}
	{/if}
</li>

<style>
	/* The row this component owns is the flex item the strip lays out, so it carries the
	   stretch: a flex child with no height of its own fills the 48 the row is, and the item
	   inside it then measures 48 less its own vertical margin. Writing `height: 100%` on the
	   item instead makes it 48 *plus* the margin, which is four pixels taller than the row. */
	li {
		display: flex;
	}

	.item {
		/* XAML minimums include padding; CSS's do not, unless the box is border-box. */
		box-sizing: border-box;
		position: relative;
		display: flex;
		align-items: center;
		margin: var(--winui-NavigationViewItemButtonMargin);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-NavigationViewItemBackground);
		color: var(--winui-TopNavigationViewItemForeground);
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
		/* The user agent's own ':focus-visible' ring is a second one; see Button.svelte. */
		outline: none;
	}
	.item:hover {
		background: var(--winui-TopNavigationViewItemBackgroundPointerOver);
		color: var(--winui-TopNavigationViewItemForegroundPointerOver);
	}
	.item:active {
		background: var(--winui-TopNavigationViewItemBackgroundPressed);
		color: var(--winui-TopNavigationViewItemForegroundPressed);
	}
	/* Nothing in this unit renders a disabled item. The rule is here because the source state exists. */
	.item[aria-disabled='true'] {
		color: var(--winui-TopNavigationViewItemForegroundDisabled);
		cursor: default;
	}
	.item[data-selected='true'] {
		background: var(--winui-TopNavigationViewItemBackgroundSelected);
		color: var(--winui-TopNavigationViewItemForegroundSelected);
	}
	.item[data-selected='true']:hover {
		background: var(--winui-TopNavigationViewItemBackgroundSelectedPointerOver);
		color: var(--winui-TopNavigationViewItemForegroundSelectedPointerOver);
	}
	.item[data-selected='true']:active {
		background: var(--winui-TopNavigationViewItemBackgroundSelectedPressed);
		color: var(--winui-TopNavigationViewItemForegroundSelectedPressed);
	}
	.selection-indicator {
		position: absolute;
		left: 50%;
		translate: -50% 0;
		bottom: 4px;
		width: 16px;
		height: 3px;
		/* c1-allow: NavigationView_themeresources.xaml:905, SelectionIndicator RadiusX/RadiusY="2" */
		border-radius: 2px;
		background: var(--winui-NavigationViewSelectionIndicatorForeground);
		opacity: 0;
		pointer-events: none;
	}
	.item[data-selected='true'] .selection-indicator {
		opacity: 1;
	}
	/* `IconBox` — a Viewbox 16 by 16 at NavigationView_themeresources.xaml:888, so the glyph is
	   centred in a box that neither grows nor shrinks with the row. */
	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 16px;
		height: 16px;
		margin-left: 12px;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: NavigationView_themeresources.xaml:888, IconBox Height="16" Width="16" */
		font-size: 16px;
		line-height: normal;
	}
	.content {
		margin: var(--winui-TopNavigationViewItemContentPresenterMargin);
	}
	/* `IconOnly` — NavigationView_themeresources.xaml:791-800. The one icon-position state whose
	   setters change the box rather than its contents, and the reason the settings button
	   measures 36 by 36 on the reference rather than the 40 its own style names.

	   `align-self: center` is where XAML and CSS part: a XAML element with an explicit Height
	   and `VerticalAlignment="Stretch"` is centred in the space it is given, and a CSS flex
	   child with a definite cross size under `align-items: stretch` sits at the start of it.
	   The reference puts six pixels above the button and six below, which is centred. */
	.item[data-icons='iconOnly'] {
		align-self: center;
		width: 36px;
		height: 36px;
		margin: 2px;
	}
	.item[data-icons='iconOnly'] .icon {
		margin: 0 10px;
	}
	.item[data-icons='iconOnly'] .selection-indicator {
		bottom: 0;
	}
	/* `ContentOnly` — :802-808. Its indicator bottom is still 4, written for completeness. */
	.item[data-icons='contentOnly'] .content {
		margin: var(--winui-TopNavigationViewItemContentOnlyContentPresenterMargin);
	}
	.item[data-icons='contentOnly'] .selection-indicator {
		bottom: 4px;
	}
	.item:focus-visible::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}
	/* Overflow's vertical presenter reads the left-pane brush family — NavigationView_themeresources.xaml:920-1000. */
	.item[data-placement='overflow'] {
		height: 36px;
		width: 100%;
		margin: 0;
		padding-right: 14px;
		border-radius: 0;
		background: var(--winui-NavigationViewItemBackground);
		color: var(--winui-NavigationViewItemForeground);
	}
	.item[data-placement='overflow']:hover {
		background: var(--winui-NavigationViewItemBackgroundPointerOver);
		color: var(--winui-NavigationViewItemForegroundPointerOver);
	}
	.item[data-placement='overflow']:active {
		background: var(--winui-NavigationViewItemBackgroundPressed);
		color: var(--winui-NavigationViewItemForegroundPressed);
	}
	.item[data-placement='overflow'][data-selected='true'] {
		background: var(--winui-NavigationViewItemBackgroundSelected);
		color: var(--winui-NavigationViewItemForegroundSelected);
	}
	.item[data-placement='overflow'][data-selected='true']:hover {
		background: var(--winui-NavigationViewItemBackgroundSelectedPointerOver);
		color: var(--winui-NavigationViewItemForegroundSelectedPointerOver);
	}
	.item[data-placement='overflow'][data-selected='true']:active {
		background: var(--winui-NavigationViewItemBackgroundSelectedPressed);
		color: var(--winui-NavigationViewItemForegroundSelectedPressed);
	}
	.item[data-placement='overflow'] .selection-indicator {
		left: 4px;
		top: 50%;
		bottom: auto;
		translate: 0 -50%;
		width: 2px;
		height: 24px;
		border-radius: var(--winui-ControlCornerRadius);
	}
	.item[data-placement='overflow'] .icon {
		margin-left: 16px;
	}
	.item[data-placement='overflow'] .content {
		margin: var(--winui-TopNavigationViewItemOnOverflowContentPresenterMargin);
	}
	.item[data-placement='overflow'][data-icons='contentOnly'] .content {
		margin: var(--winui-TopNavigationViewItemOnOverflowNoIconContentPresenterMargin);
	}
</style>
