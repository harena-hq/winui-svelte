<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { NavigationViewItemData } from './NavigationView.svelte';

	/**
	 * One row of the menu. ADR 0015 makes this the element a consumer writes rather than a
	 * shape the control draws for them, so the row's surface is the item's own props from
	 * here on and not a record the control unpacks.
	 *
	 * **One of the ADR's ten mapped members is here**, and that is not most of this surface:
	 * `items` is `MenuItemsSource` and the rest of the props below map from elsewhere — `tag`
	 * from `FrameworkElement.Tag` (the ADR's deferred item 3), `content` and `children` from
	 * `Content` by ADR 0009, and `glyph` from nothing upstream at all, being this library's
	 * existing narrowing of an icon to a code point, with `Icon` itself owed separately by
	 * ADR 0012. So the nine not carried are `Icon`, `CompactPaneLength`, `SelectsOnInvoked`,
	 * `IsExpanded`, `HasUnrealizedChildren`, `IsChildSelected`, `MenuItems`, `InfoBadge` and
	 * `IsSelected`; the ADR leaves which of them a first implementation takes to the unit, and
	 * this one takes the members the control already draws a row out of and no more.
	 *
	 * `IsSelected` and `IsExpanded` are the two whose absence is a decision rather than a
	 * deferral. This library holds selection and expansion on the control
	 * (`internal/navigation-view.ts` says why), so a prop for either would be a second writer
	 * before there is a second writer to serve.
	 *
	 * The interface is exported and the component is not re-exported from `index.ts`. That is
	 * D46's order rather than an omission — the naming unit fixes the exported set, and the
	 * exports map already resolves a deep import of this file either way.
	 */
	export interface NavigationViewItemProps {
		/**
		 * Which row this is: what `selected` holds, what `ItemInvoked` reports, and what the
		 * pane's expansion list names.
		 *
		 * Upstream's answer is `FrameworkElement.Tag`, and the Gallery's own code-behind reads
		 * `selectedItem.Tag` to route (`NavigationViewPage.xaml.cs:76-78`, `:96-97`). It is not
		 * `id`: ADR 0009 spreads a component's rest props onto its root element, where `id` is a
		 * live HTML attribute, so a row taking `id` to mean "which row" would collide with the
		 * one a consumer sets to point a label at it. `NavigationViewItemData.id` is a data
		 * field and is untouched — the control reads it and passes it here.
		 */
		tag: string;
		/**
		 * `Content`, narrowed to the label — the string arm of a member XAML types as
		 * `IInspectable`. `children` is the other arm and wins the content cell; this one is
		 * still what the rail's tooltip shows, because upstream shows a tooltip only for a
		 * content that is a non-empty string (`NavigationViewItem.cpp:305-316`).
		 */
		content?: string;
		/** A Segoe Fluent Icons code point as uppercase hex, e.g. `'E790'`. */
		glyph?: string | null;
		/**
		 * The nested menu — `MenuItemsSource` (`NavigationView.idl:357`), narrowed to records
		 * exactly as the control narrows its own `items`.
		 *
		 * `MenuItems` (`:355`), the collection markup fills, is the snippet ADR 0015 maps and it
		 * is not here: the control cannot take element children either, so an item that could
		 * would have nowhere to be written. Both arrive together with `menuItemTemplate`.
		 */
		items?: NavigationViewItemData[];
		/**
		 * `Content` as an element — whatever fills the content cell in place of the label.
		 * ADR 0009's mapping of `Content` to `children`.
		 */
		children?: Snippet;
	}
</script>

<script lang="ts">
	import {
		getNavigationViewLevel,
		getNavigationViewPane,
		setNavigationViewLevel
	} from '../internal/navigation-view';
	import Self from './NavigationViewItem.svelte';
	import ToolTip from './ToolTip.svelte';

	let { tag, content, glyph, items, children }: NavigationViewItemProps = $props();

	// Everything else this row needs is a fact about the pane it sits in, and the pane
	// publishes it — `internal/navigation-view.ts` says why, and why an absent context is
	// a throw rather than a case to render around.
	const pane = getNavigationViewPane();

	/** 1 for a top-level item. Drives both `aria-level` and the left indentation. */
	const level = getNavigationViewLevel();
	// Read first, publish second. Both calls name the same key, so a `setContext` before
	// the `getContext` would hand this row the level it meant for its own children.
	setNavigationViewLevel(level + 1);

	const open = $derived(pane().expandedItems.includes(tag));
	const hasChildren = $derived((items?.length ?? 0) > 0);
	const isSelected = $derived(pane().selected === tag);
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
			pane().setExpanded(tag, !open);
		}
		pane().onItemInvoked?.(tag);
	}

	function onkeydown(event: KeyboardEvent) {
		// WD-004: Enter and Space, and no arrow keys — every item is its own tab stop.
		// See docs/divergences.md.
		if (event.key !== 'Enter' && event.key !== ' ') return;
		// And only a key aimed at the row itself. `children` is a consumer's content from
		// here on, so this box can hold a text field, and in the DOM every key pressed in one
		// bubbles to this handler whether or not the field acted on it.
		//
		// **This does not reproduce upstream's routing, and an earlier version of this comment
		// claimed it did.** What the pin establishes is narrower than that claim: the control
		// subscribes to each item's `KeyDown` plainly (`NavigationView.cpp:3595`, handler at
		// `:2709`) and never calls `AddHandler`, the overload that asks for already-handled
		// events — where a control in the same pin wants the opposite it says so, at
		// `TableView.cpp:271-273`. So XAML's row does not see an **already-handled** key; a key
		// from a descendant that nothing handled still reaches it. Whether a focused `TextBox`
		// marks Space handled is exactly the half `docs/keyboard.md`'s entry 9 could not ask of
		// the reference, so what the original does here is unknown, and a reproduction claim
		// would be inventing the half that record says is missing.
		//
		// The ground taken is about this platform instead, and ADR 0015's deferred item 2 is
		// where it is owed from. The DOM's analogue of `Handled` is `defaultPrevented`, and the
		// case this exists for does not set it: a space typed into a text field is that field's
		// *default* action, so nothing cancels it and a handledness test would let the row
		// swallow the key. No faithful test is available, so the choice is between two
		// behaviours that both diverge somewhere, and they are not symmetric. A row acting on a
		// key aimed at something else has a certain cost — it breaks a field a consumer put in
		// the cell, which is the case ADR 0015 exists for. Acting only on a key aimed at the row
		// costs nothing this control draws today, because a label is not focusable and no key
		// can be targeted at one; and it fixes the chevron below, which is this library's own
		// extra tab stop (WD-004) and whose Space the row had been taking for itself.
		//
		// The pointer half is not decided here. A click's target is whatever sits under it,
		// so the label would fail the same test and a row would stop being clickable; the
		// pointer's equivalent is a descendant calling `stopPropagation`, which the chevron
		// below already does. The unit that lets a consumer put an element in the cell is the
		// one that owes the rest.
		if (event.target !== event.currentTarget) return;
		event.preventDefault();
		activate();
	}

	function toggle(event: MouseEvent) {
		// Without this the row's own handler also runs, and collapsing would immediately
		// re-expand.
		event.stopPropagation();
		pane().setExpanded(tag, !open);
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
			<span class="icon-column" data-icon={glyph ? true : undefined}>
				{#if glyph}
					<span class="icon">{String.fromCodePoint(parseInt(glyph, 16))}</span>
				{/if}
			</span>
			<!-- `data-label` is the cell drawing a string, which is the only shape the three
			     trimming rules below are for. -->
			<span class="content-presenter" data-label={children ? undefined : true}
				>{#if children}{@render children()}{:else}{content}{/if}</span
			>
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
	     surface, which docs/surface.md records.

	     The `content &&` is the rest of that same code-behind. `SuggestedToolTipChanged` takes
	     the item's content as the suggested tooltip only when it is a non-empty string
	     (`NavigationViewItem.cpp:305-316`) and leaves the suggestion null otherwise, which is
	     what `UpdateNavigationViewItemToolTip` above then sets. So a row whose cell a consumer
	     filled with an element has no tooltip on the rail upstream either, and that is the
	     branch this reproduces — one upstream reaches because `Content` is an `IInspectable`
	     and this reaches because `children` is the arm that is not a string.

	     It changes nothing the control renders today: every row it draws has a non-empty
	     `content`, the settings row included. The top pane's settings row is the one with an
	     empty content, and it is not this component — `NavigationViewTopItem.svelte` draws it
	     and carries its own tooltip, `UpdateSettingsItemToolTip` at NavigationView.cpp:1921. -->
	{#if collapsed && content}
		<ToolTip {content}>
			{#snippet children(props)}
				{@render row(props)}
			{/snippet}
		</ToolTip>
	{:else}
		{@render row()}
	{/if}

	{#if hasChildren && open}
		<ul role="group" class="children">
			{#each items ?? [] as child (child.id)}
				<Self tag={child.id} content={child.content} glyph={child.glyph} items={child.children} />
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
	}

	/* The three trimming rules are a label's, and they are on the label rather than on the
	   box, which is ADR 0015's deferred item 4 answered. They are this library's own: of
	   upstream's three presenters carrying a `ContentTemplate`, the two top ones carry
	   `TextWrapping="NoWrap"` (`NavigationView_themeresources.xaml:891`, `:1062`) and the left
	   one — the presenter this control reproduces — carries none of the three (`:616`). So a
	   cell a consumer fills with an element gets what upstream's left cell has, which is
	   nothing, and the string the control draws keeps the trim it has always had. */
	.content-presenter[data-label] {
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
