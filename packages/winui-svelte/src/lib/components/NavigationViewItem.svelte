<script lang="ts">
	import type { NavigationViewItemData } from './NavigationView.svelte';
	import {
		getNavigationViewLevel,
		getNavigationViewPane,
		setNavigationViewLevel
	} from '../internal/navigation-view';
	import Self from './NavigationViewItem.svelte';
	import ToolTip from './ToolTip.svelte';

	interface Props {
		item: NavigationViewItemData;
	}

	let { item }: Props = $props();

	// Everything else this row needs is a fact about the pane it sits in, and the pane
	// publishes it — `internal/navigation-view.ts` says why, and why an absent context is
	// a throw rather than a case to render around.
	const pane = getNavigationViewPane();

	/** 1 for a top-level item. Drives both `aria-level` and the left indentation. */
	const level = getNavigationViewLevel();
	// Read first, publish second. Both calls name the same key, so a `setContext` before
	// the `getContext` would hand this row the level it meant for its own children.
	setNavigationViewLevel(level + 1);

	const open = $derived(pane().expandedItems.includes(item.id));
	const hasChildren = $derived((item.children?.length ?? 0) > 0);
	const isSelected = $derived(pane().selected === item.id);
	/** `ShouldEnableToolTip`: the left pane is the closed-compact icons-only rail. */
	const collapsed = $derived(pane().collapsed);

	function activate() {
		// `OnNavigationViewItemInvoked` calls `ToggleIsExpandedNavigationViewItem`
		// unconditionally — NavigationView.cpp:1062 — so invoking a row opens *and* closes
		// it, and a row with no children has nothing to toggle. An earlier comment here
		// claimed the chevron was the only way to collapse one; the side-by-side against
		// the original said otherwise.
		//
		// The invoke is still reported. Whether the id is somewhere to go is the caller's
		// question, and in the Gallery a row with children is not.
		if (hasChildren) {
			pane().setExpanded(item.id, !open);
		}
		pane().onItemInvoked?.(item.id);
	}

	function onkeydown(event: KeyboardEvent) {
		// WD-004: Enter and Space, and no arrow keys — every item is its own tab stop.
		// See docs/divergences.md.
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		activate();
	}

	function toggle(event: MouseEvent) {
		// Without this the row's own handler also runs, and collapsing would immediately
		// re-expand.
		event.stopPropagation();
		pane().setExpanded(item.id, !open);
	}

	// The row renders with no tooltip when the pane is expanded, and then there are no
	// trigger props to spread or compose. One frozen empty object rather than a fresh `{}`
	// per render, which would make the spread a new value every time.
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

<li role="none">
	<!-- The row is written once and rendered through a snippet, because the collapsed pane
	     wraps it in a `ToolTip` and the expanded pane must have no wrapper and no extra
	     element at all. `props` is the tooltip's trigger props in the first case and the
	     frozen empty object in the second, which is why every use of it tolerates being
	     absent. The parameter takes its type from its default value rather than from an
	     annotation, and that is not a flourish: `svelte-package` ships this file's source,
	     a type annotation in markup is a parse error in every consumer's build while this
	     package's own `check` stays green, and without either one `check` fails on an
	     implicit `any`. A default is plain JavaScript and types it. -->
	{#snippet row(props = EMPTY_TRIGGER_PROPS)}
		<div
			{...props}
			role="treeitem"
			class="item"
			aria-selected={isSelected}
			aria-expanded={hasChildren ? open : undefined}
			aria-level={level}
			tabindex="0"
			data-selected={isSelected}
			data-expanded={hasChildren ? open : undefined}
			onclick={withTriggerClick(props)}
			onkeydown={withTriggerKeydown(props)}
		>
			<span class="selection-indicator"></span>
			<span class="icon-column" data-icon={item.glyph ? true : undefined}>
				{#if item.glyph}
					<span class="icon">{String.fromCodePoint(parseInt(item.glyph, 16))}</span>
				{/if}
			</span>
			<span class="content-presenter">{item.content}</span>
			{#if hasChildren}
				<button
					type="button"
					class="expand-chevron"
					aria-label={open ? 'Collapse' : 'Expand'}
					onclick={toggle}
				></button>
			{/if}
		</div>
	{/snippet}

	<!-- `ShouldEnableToolTip` at NavigationViewItem.cpp:743 is `IsOnLeftNav() && m_isClosedCompact`:
	     the tooltip exists only while the pane is the icons-only rail, because an expanded pane
	     already shows the label. `UpdateNavigationViewItemToolTip` at :283 sets its content to
	     the item's own. Neither is in the template — the code-behind half of a control's
	     surface, which docs/surface.md records. -->
	{#if collapsed}
		<ToolTip content={item.content}>
			{#snippet children(props)}
				{@render row(props)}
			{/snippet}
		</ToolTip>
	{:else}
		{@render row()}
	{/if}

	{#if hasChildren && open}
		<ul role="group" class="children">
			{#each item.children ?? [] as child (child.id)}
				<Self item={child} />
			{/each}
		</ul>
	{/if}
</li>

<style>
	.item {
		/* XAML's `MinHeight` and `MinWidth` include the border and the padding; CSS's
		   `min-height` and `min-width` do not, unless the box is `border-box`. Without
		   this line a control whose minimum comes from a WinUI resource renders that
		   minimum *plus* its own padding and border — measured: this box came out 45px
		   tall against the original's 32. */
		box-sizing: border-box;
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		min-height: var(--winui-NavigationViewItemOnLeftMinHeight);
		margin: var(--winui-NavigationViewItemButtonMargin);
		/* c1-allow: NavigationView_themeresources.xaml:604, the item's ContentGrid carries
		   Margin="0,0,14,0" and no resource names the 14 */
		padding-right: 14px;
		border-style: solid;
		border-width: var(--winui-NavigationViewItemBorderThickness);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-NavigationViewItemBackground);
		color: var(--winui-NavigationViewItemForeground);
		border-color: var(--winui-NavigationViewItemBorderBrush);
		cursor: pointer;
		user-select: none;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	/* One `c_itemIndentation` per level below the top, on the item's padding rather than on
	   the list that holds it: in the original the row's background runs the full width of
	   the pane and only its contents move right.

	   WinUI multiplies without a bound and this enumerates four levels. The Gallery's
	   deepest menu is two, and a fifth level sharing the fourth's inset is a stated limit
	   rather than a silent truncation — add a rule when a menu needs one. */
	.item[aria-level='2'] {
		padding-left: var(--nav-indentation);
	}

	.item[aria-level='2'] .selection-indicator {
		left: var(--nav-indentation);
	}

	.item[aria-level='3'] {
		padding-left: calc(var(--nav-indentation) * 2);
	}

	.item[aria-level='3'] .selection-indicator {
		left: calc(var(--nav-indentation) * 2);
	}

	.item[aria-level='4'] {
		padding-left: calc(var(--nav-indentation) * 3);
	}

	.item[aria-level='4'] .selection-indicator {
		left: calc(var(--nav-indentation) * 3);
	}

	/* The states `MUX_NavigationViewItemPresenterStyleWhenOnLeftPane` names, in the order
	   its VisualStateManager names them. Two of the seven transpose the words between the
	   state and the resource: the `PointerOverSelected` state reads
	   `…BackgroundSelectedPointerOver`. */
	.item:hover {
		background: var(--winui-NavigationViewItemBackgroundPointerOver);
		color: var(--winui-NavigationViewItemForegroundPointerOver);
		border-color: var(--winui-NavigationViewItemBorderBrushPointerOver);
	}

	.item:active {
		background: var(--winui-NavigationViewItemBackgroundPressed);
		color: var(--winui-NavigationViewItemForegroundPressed);
		border-color: var(--winui-NavigationViewItemBorderBrushPressed);
	}

	/* Nothing in this version renders a disabled item. The rule is here because the state
	   exists in the source, and a missing rule reads the same as one decided against. */
	.item[aria-disabled='true'] {
		background: var(--winui-NavigationViewItemBackgroundDisabled);
		color: var(--winui-NavigationViewItemForegroundDisabled);
		border-color: var(--winui-NavigationViewItemBorderBrushDisabled);
		cursor: default;
	}

	.item[data-selected='true'] {
		background: var(--winui-NavigationViewItemBackgroundSelected);
		color: var(--winui-NavigationViewItemForegroundSelected);
		border-color: var(--winui-NavigationViewItemBorderBrushSelected);
	}

	.item[data-selected='true']:hover {
		background: var(--winui-NavigationViewItemBackgroundSelectedPointerOver);
		color: var(--winui-NavigationViewItemForegroundSelectedPointerOver);
		border-color: var(--winui-NavigationViewItemBorderBrushSelectedPointerOver);
	}

	.item[data-selected='true']:active {
		background: var(--winui-NavigationViewItemBackgroundSelectedPressed);
		color: var(--winui-NavigationViewItemForegroundSelectedPressed);
		border-color: var(--winui-NavigationViewItemBorderBrushSelectedPressed);
	}

	/* Absolutely placed, because in the template it lives in its own grid stacked over the
	   content rather than in a column of it — an indicator that took a column would push
	   every icon three pixels right of where WinUI draws it. */
	.selection-indicator {
		position: absolute;
		/* Absolute positioning is relative to the padding box, so the indentation has to be
		   applied to `left` as well as to the item's padding — on the reference capture a
		   child's indicator sits exactly one `c_itemIndentation` right of its row's left
		   edge, and one rule setting both keeps the two from drifting apart. */
		left: 0;
		top: 50%;
		translate: 0 -50%;
		width: var(--winui-NavigationViewSelectionIndicatorWidth);
		height: var(--winui-NavigationViewSelectionIndicatorHeight);
		border-radius: var(--winui-NavigationViewSelectionIndicatorRadius);
		background: var(--winui-NavigationViewSelectionIndicatorForeground);
		opacity: 0;
	}

	.item[data-selected='true'] .selection-indicator {
		opacity: 1;
	}

	/* `IconColumn.Width` binds `TemplateSettings.SmallerIconWidth` —
	   NavigationView_themeresources.xaml:611 — which
	   `NavigationViewItemPresenter::UpdateCompactPaneLength` computes as
	   `CompactPaneLength - 8`. At this pin that is `48 - 8`, so it lands on the same 40 as
	   `NavigationViewIconBoxWidth` and the two are indistinguishable on screen. They are
	   still different quantities, and the expression is the one the template evaluates. */
	.icon-column {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* c1-allow: NavigationViewItemPresenter.cpp:289, `SmallerIconWidth` is
		   `CompactPaneLength - 8` */
		width: calc(var(--winui-NavigationViewCompactPaneLength) - 8px);
		height: var(--winui-NavigationViewItemOnLeftIconBoxHeight);
	}

	/* `IconCollapsed` — NavigationView_themeresources.xaml:509. The box goes away and the
	   column keeps 8, which is the gap that stays between the indentation and the label. */
	.icon-column:not([data-icon]) {
		/* c1-allow: NavigationView_themeresources.xaml:510, IconColumn.Width Value="8" */
		width: 8px;
	}

	.icon {
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-NavigationViewItemOnLeftIconBoxHeight);
		line-height: normal;
	}

	/* `NavigationViewItemContentPresenterMargin` is `4,-1,8,-1` — a *margin*, and it has
	   negative parts, so writing it as padding is not a near miss: CSS drops the whole
	   declaration and the label sat flush against the icon column with nothing between them.

	   The presenter also binds the item's `Padding`, and that is 0 here: the only `Padding`
	   setter naming `NavigationViewItemButtonMargin` is on `PaneToggleButtonStyle` — the
	   hamburger — at NavigationView_themeresources.xaml:282, not on the item's presenter
	   style at :440. Adding it put the label four pixels past where the original draws it. */
	.content-presenter {
		min-width: 0;
		margin: var(--winui-NavigationViewItemContentPresenterMargin);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.expand-chevron {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		/* c1-allow: NavigationView_themeresources.xaml:617, ExpandCollapseChevron Width="40" */
		width: 40px;
		/* c1-allow: NavigationView_themeresources.xaml:618, the chevron's own 12 by 12 box */
		height: 12px;
		margin: var(--winui-NavigationViewItemExpandChevronMargin);
		padding: 0;
		background: transparent;
		border: 0;
		color: inherit;
		cursor: pointer;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* WD-006: what the original draws here is an `AnimatedIcon` in a 12 by 12 box —
		   NavigationView_themeresources.xaml:617 — and
		   `NavigationViewItemExpandedGlyphFontSize` is 8, the size of the *fallback* glyph
		   inside it. Drawing the fallback at 8 leaves a chevron visibly smaller and fainter
		   than the original's, so it is drawn at the box the icon occupies instead. */
		/* c1-allow: NavigationView_themeresources.xaml:617, AnimatedIcon Width="12" Height="12" */
		font-size: 12px;
		line-height: normal;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	/* `NavigationViewItemExpandedGlyph` is ChevronDown, and the token is already a quoted
	   CSS string. WinUI animates between a down and an up chevron and only falls back to
	   this one glyph when the animation cannot run, so the rotation is ours: down while
	   collapsed, up while expanded. Which way the real control points in each state is one
	   of the things v2's side-by-side against Windows 11 is for. */
	.expand-chevron::before {
		content: var(--winui-NavigationViewItemExpandedGlyph);
		display: block;
	}

	.item[data-expanded='true'] .expand-chevron::before {
		rotate: 180deg;
	}

	/* The focus visual; see Button.svelte for the shape.

	   No `FocusVisualMargin` is set on `NavigationViewItem` anywhere in
	   `controls/dev/NavigationView/`, so the band is drawn inside the item's own bounds.
	   `.expand-chevron` is this library's own tab stop and has no upstream counterpart,
	   so it takes the same default. */
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

	/* `::before` is the chevron glyph above; the focus visual sits on `::after` so the two
	   pseudo-elements do not collide. The band stays at the framework-default `FocusVisualMargin`
	   of `0` and inherits the chevron's own corner radius. */
	.expand-chevron:focus-visible::after {
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

	.children {
		list-style: none;
		margin: 0;
		padding: 0;
	}
</style>
