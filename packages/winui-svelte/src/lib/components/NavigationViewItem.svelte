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
	 * The component and this interface are in the release, exported from `index.ts` with
	 * `NavigationView` (ADR 0015, ADR 0017).
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
		getNavigationViewPane,
		getNavigationViewPlacement,
		moveRingFocus,
		RING_ROOT_ATTRIBUTE,
		setNavigationViewPlacement
	} from '../internal/navigation-view';
	import Flyout from './Flyout.svelte';
	import Self from './NavigationViewItem.svelte';
	import ToolTip from './ToolTip.svelte';

	let { tag, content, glyph, items, children }: NavigationViewItemProps = $props();

	// Everything else this row needs is a fact about the pane it sits in, and the pane
	// publishes it — `internal/navigation-view.ts` says why, and why an absent context is
	// a throw rather than a case to render around.
	const pane = getNavigationViewPane();

	// Read first, publish second. Both calls name the same key, so a `setContext` before
	// the `getContext` would hand this row the level it meant for its own children — and the
	// publish is at the foot of this block, because what it publishes depends on everything
	// between.
	const readPlacement = getNavigationViewPlacement();

	/** 1 for a top-level item. Drives both `aria-level` and the left indentation. */
	const level = $derived(readPlacement().level);
	/** `IsTopLevelItem`: this row is in one of the control's own lists, not in a flyout. */
	const topLevel = $derived(readPlacement().topLevel);
	/** The top-level row whose children flyout this row is drawn in, or `null`. */
	const flyoutOwner = $derived(readPlacement().flyoutOwner);
	/** This row is itself drawn inside the rail's children flyout. */
	const withinFlyout = $derived(flyoutOwner !== null);

	const open = $derived(pane().expandedItems.includes(tag));
	const hasChildren = $derived((items?.length ?? 0) > 0);
	const isSelected = $derived(pane().selected === tag);
	/** `ShouldEnableToolTip`: the left pane is the closed-compact icons-only rail. */
	const collapsed = $derived(pane().collapsed);

	/**
	 * Whether Tab stops here. The pane works out which row that is and why — see `tabStops` in
	 * `internal/navigation-view.ts`.
	 *
	 * A row inside the children flyout keeps its own stop. The mechanism upstream does not
	 * reach it either: both halves of `OnRepeaterGettingFocus` test the *root* repeater, and
	 * the flyout's is the reparented children one.
	 */
	const tabStop = $derived.by(() => {
		// One read, held: `pane()` is a getter that builds its record on each call, so a second
		// call is a second object and the narrowing from the null test does not survive it.
		const stops = pane().tabStops;
		return withinFlyout || stops === null || stops.includes(tag);
	});

	/**
	 * `ShouldRepeaterShowInFlyout` — `(m_isClosedCompact && IsTopLevelItem()) || IsOnTopPrimary()`
	 * (`NavigationViewItem.cpp:897`). The rail has no room for a child row: with the label gone
	 * it would be indistinguishable from its parent's, so upstream reparents the children's
	 * repeater into an attached flyout (`:875-889`) and shows it on expand (`:824`).
	 *
	 * Only the first half of that predicate is here. `IsOnTopPrimary()` is the top pane, which
	 * this library draws with `NavigationViewTopItem` and which owes the same flyout — that is
	 * WD-025, and it is not this component's to answer.
	 */
	const childrenInFlyout = $derived(collapsed && topLevel && hasChildren);

	// Depth 0 inside the flyout, one deeper everywhere else: `PropagateDepthToChildren(0)` on
	// the way in and `(1)` on the way out (`NavigationViewItem.cpp:883`, `:891`). A flyout's
	// rows are drawn the way top-level rows are — no indent, `aria-level` 1 — because the
	// flyout is their whole context.
	//
	// `topLevel` is false for every row this one renders, in both branches, and that is the
	// half a depth alone would get wrong: a row inside the flyout is at depth 0 and is still
	// not top-level, so a child of it that has children of its own draws them inline within
	// the flyout rather than opening a second one.
	setNavigationViewPlacement(() => ({
		level: childrenInFlyout ? 1 : level + 1,
		topLevel: false,
		// Once inside the flyout, everything below is too, and the flyout is this row's.
		flyoutOwner: childrenInFlyout ? tag : flyoutOwner
	}));
	/**
	 * The consumer's row template, or nothing. A row's children go through the same template
	 * its parent did, because upstream gives an item's own repeater the same factory the
	 * control's repeaters get (`NavigationViewItem.cpp:171`).
	 */
	const template = $derived(pane().menuItemTemplate);

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
		// `CloseFlyoutIfRequired` (`NavigationView.cpp:360-390`, called last, at `:1065-1068`):
		// a leaf invoked in the flyout collapses the top-level row the flyout belongs to, and
		// the flyout follows the row's expansion. Upstream does it only when the invoke
		// selects, `SelectsOnInvoked`, which this component does not carry, so every leaf's
		// invoke closes it. Its top-pane arm (`:370`) waits on WD-025.
		if (!hasChildren && flyoutOwner !== null) {
			pane().setExpanded(flyoutOwner, false);
		}
	}

	function onkeydown(event: KeyboardEvent) {
		// Only a key aimed at the row itself. `children` is a consumer's content from
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
		// can be targeted at one; and it fixes the chevron below, which is the one focusable box
		// this library puts inside a row and whose Space the row had been taking for itself. The
		// chevron is no longer a *tab* stop — it is reached by pointer, as upstream's is — and
		// that does not make this moot: a click focuses it, so a Space that follows one is still
		// aimed at the chevron rather than at the row.
		//
		// The pointer half is a different test and is decided elsewhere — see the comment on
		// `withTriggerClick` and WD-090. Target identity is the wrong one for it: a click's
		// target is whatever sits under the pointer, so the label would fail it and the row
		// would stop being clickable. What stands in for handledness there is a descendant
		// calling `stopPropagation`, which the chevron below already does.
		if (event.target !== event.currentTarget) return;

		// `HandleKeyEventForNavigationViewItem` — NavigationView.cpp:2733 — is this switch, and
		// the keys it does not name are the answer to three of the questions the reference was
		// asked: Left does not expand a collapsed row, Right does not descend into an expanded
		// one, and typing a letter moves nothing (`docs/keyboard.md`, answers 4 and 5).
		switch (event.key) {
			case 'Enter':
			case ' ':
				// **Alt+Space is upstream's one guard on Space, and it is a guard against
				// swallowing rather than a behaviour of its own.**
				// `HandleKeyEventForNavigationViewItem` reads the Alt key state and handles
				// Space only when it is up (`NavigationView.cpp:2744-2753`), under its own
				// comment: "If Alt+Space is pressed, don't handle it to allow the system menu to
				// be opened". The chord opens the window menu on Windows, which is where the
				// reference browser runs, so the key has somewhere to go here too. Enter has no
				// such guard upstream and gets none here.
				//
				// Read from the pin rather than pressed: the 2026-09-21 sitting did not try this
				// chord, and `docs/keyboard.md` records it as a reading.
				if (event.key === ' ' && event.altKey) return;
				event.preventDefault();
				activate();
				return;
			case 'ArrowUp':
			case 'ArrowDown':
			case 'Home':
			case 'End': {
				const moved = moveRingFocus(event.currentTarget as HTMLElement, event.key);
				// **Home and End are handled whatever they find, and the arrows are handled only
				// when focus moved.** That asymmetry is upstream's and it is measured on both
				// sides. `args.Handled(true)` runs at `:2757` and `:2761` *before* the call, so
				// pressing Home on the first row consumes the key and does nothing — which is
				// what answer 3 pressed. The arrows leave the key alone when they cannot move:
				// at the foot of the ring Down scrolled the page the sample sits on, which is
				// answer 2, and a `preventDefault()` here would have cancelled that scroll.
				if (moved || event.key === 'Home' || event.key === 'End') event.preventDefault();
				return;
			}
		}
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

	// `onkeydown` above has the key half of this row's input contract and WD-090 has the pointer
	// half: a click that reaches the row invokes it, whatever it passed through on the way. Upstream
	// gates the invoke on a press no descendant handled, and the DOM has nothing a row can read
	// that says so — a `<button>`'s click sets no flag — so a descendant that must not invoke
	// the row stops the event, as `toggle` above does. See docs/divergences.md.
	function withTriggerClick(props: Record<string, unknown>) {
		return (event: MouseEvent) => {
			(props.onclick as ((event: MouseEvent) => void) | undefined)?.(event);
			activate();
		};
	}

	/**
	 * The flyout's trigger props with every handler taken out.
	 *
	 * Upstream's is an **attached** flyout — `FlyoutBase.AttachedFlyout` in the template,
	 * shown by `ShowAttachedFlyout` when the item expands (`NavigationViewItem.cpp:824`) and
	 * hidden by `flyout.Hide()` when it collapses (`:844`). Nothing toggles it by being
	 * clicked. The primitive underneath this one is a trigger-driven popover, so its handlers
	 * are what would make a click toggle the popup a second time after the row's own
	 * `activate()` has already toggled the expansion the popup follows. What is kept is the
	 * identity: the ids and ARIA the popup needs to point at its anchor.
	 */
	function anchorOnly(props: Record<string, unknown>) {
		// `Reflect.ownKeys`, not `Object.entries`. The bag carries the primitive's attachment
		// under a **symbol** key — that is how Svelte 5 passes one through a prop object — and
		// `Object.entries` skips symbols silently. Filtering with it produced an anchor the
		// floating layer had never measured: the popup rendered at `translate(0, -200%)` of the
		// document's origin with every one of its own custom properties still `undefined`,
		// which reads as a placement bug rather than as a missing attachment.
		const kept: Record<PropertyKey, unknown> = {};
		for (const key of Reflect.ownKeys(props)) {
			if (typeof key === 'string' && key.startsWith('on')) continue;
			kept[key] = (props as Record<PropertyKey, unknown>)[key];
		}
		return kept as Record<string, unknown>;
	}

	// `NavigationViewItemChildrenMenuFlyoutPadding` (`NavigationView_themeresources.xaml:267`)
	// through the presenter's own padding token, which is how `NavigationView.svelte` already
	// restyles the top-nav overflow flyout.
	//
	// The top margin is upstream's, with its reason beside it in the template — "Set negative
	// top margin to make the flyout align exactly with the button"
	// (`NavigationView.xaml:473-474`), and `Margin="0,-4,0,0"` is the whole of it: upstream
	// writes no horizontal margin at all.
	//
	// **Neither does this, and an earlier version of it did** — `margin-left: -4px`, written as
	// the horizontal half of `NavigationViewItemButtonMargin` given back, because the `<li>`
	// was then the row plus that half. It is not that any more: the margin is the presenter's
	// padding, so the `<li>` is the row on both axes, and it is the box upstream anchors to —
	// `ShowAttachedFlyout(m_rootGrid.get())` (`NavigationViewItem.cpp:824`), `m_rootGrid` being
	// the template's `NVIRootGrid` (named at `:15`, taken at `:86`), which holds the presenter
	// in its first row and the children repeater in its second.
	//
	// **What that number was really cancelling is `offset`, and an earlier version of this set
	// it to zero, reading the placement as flush** — `*pControlPos = anchorPos + anchorSize`
	// (`FlyoutBase_partial.cpp:386`, reached for `MajorPlacementMode::Right` at `:457-464`). That
	// is the first step only: `CalculatePlacementPrivate` then adds `FlyoutMargin`, 4 (`:65`),
	// in the direction the flyout opens, `pControlRect->X += FlyoutMargin` for `Right`
	// (`:2622-2640`). So the gap is `Flyout`'s own 4, which this leaves as it is. The vertical
	// has no such step: `RightEdgeAlignedTop` is `PreferredJustification::Top` (`:99-101`),
	// which is `*pControlPos = anchorPos` (`:331-333`), and the presenter's `Margin="0,-4,0,0"`
	// lifts it the 4 from there.
	const CHILDREN_FLYOUT_STYLE =
		'--winui-FlyoutContentPadding: var(--winui-NavigationViewItemChildrenMenuFlyoutPadding);' +
		/* c1-allow: NavigationView.xaml:474 */
		' margin-top: -4px;';

	function withTriggerKeydown(props: Record<string, unknown>) {
		return (event: KeyboardEvent) => {
			(props.onkeydown as ((event: KeyboardEvent) => void) | undefined)?.(event);
			onkeydown(event);
		};
	}
</script>

<!-- The child rows, written once: the pane draws them under the row and the rail draws them
     in a flyout, and upstream reparents one repeater between the two rather than keeping two
     (`NavigationViewItem.cpp:875-889`). -->
{#snippet childRows()}
	<!-- The index is the child's position among its siblings, which is the index the repeater
	     this reproduces hands its own template. -->
	{#each items ?? [] as child, i (child.id)}
		{#if template}
			{@render template(child, i)}
		{:else}
			<Self tag={child.id} content={child.content} glyph={child.glyph} items={child.children} />
		{/if}
	{/each}
{/snippet}

<!-- `role="tree"` rather than `group`: the flyout is portalled out of the pane, so its list is
     not a subtree of anything in the document any more. The rows inside it are published at
     level 1 for the same reason — see `childrenInFlyout` above. -->
{#snippet flyoutRows()}
	<ul role="tree" class="children flyout-children" {...RING_ROOT_ATTRIBUTE}>
		{@render childRows()}
	</ul>
{/snippet}

{#snippet item(anchor = EMPTY_TRIGGER_PROPS)}
	<li role="none" {...anchor}>
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
			<!-- `NavigationViewItemPresenter`, the element the item's own template marks
			     `Control.IsTemplateFocusTarget` — `NavigationView.xaml:462`. It is the row, and the
			     `4,2` it carries below is a margin on the *presenter's* `LayoutRoot`
			     (`NavigationView_themeresources.xaml:451`), which lies inside this box. The focus
			     visual is drawn at the focus target's bounds, so it covers that margin rather than
			     the fill. -->
			<div class="item-presenter">
				<!-- Upstream's name: `NavigationViewItemAutomationPeer::GetNameCore` takes the
				     string content, visible or not, and never the icon, and falls back to the
				     localized control name `NavigationViewItem`. In that branch the label also keeps
				     the expand chevron's out of the row's name. When `children` fills the content
				     cell the row is named by its contents, and those include the chevron. -->
				<div
					{...props}
					role="treeitem"
					class="item"
					aria-selected={isSelected}
					aria-expanded={hasChildren ? open : undefined}
					aria-level={level}
					aria-label={children ? undefined : content || 'NavigationViewItem'}
					tabindex={tabStop ? 0 : -1}
					data-selected={isSelected}
					data-expanded={hasChildren ? open : undefined}
					onclick={withTriggerClick(props)}
					onkeydown={withTriggerKeydown(props)}
				>
					<span class="selection-indicator"></span>
					<span class="icon-column" data-icon={glyph ? true : undefined}>
						{#if glyph}
							<span class="icon" aria-hidden="true"
								>{String.fromCodePoint(parseInt(glyph, 16))}</span
							>
						{/if}
					</span>
					<!-- `data-label` is the cell drawing a string, which is the only shape the three
			     trimming rules below are for. -->
					<span class="content-presenter" data-label={children ? undefined : true}
						>{#if children}{@render children()}{:else}{content}{/if}</span
					>
					{#if hasChildren}
						<!-- Not a tab stop. `ExpandCollapseChevron` is a `Grid`
					     (`NavigationView_themeresources.xaml:617`), which is not a `Control` and has
					     no `IsTabStop`, and the 2026-09-21 press found it unreachable by key
					     (`docs/keyboard.md`, answer 6). It stays a `<button>` for the pointer and
					     for assistive technology, and `tabindex="-1"` still allows the two keyboard
					     tests that drive it to focus it from script. -->
						<button
							type="button"
							class="expand-chevron"
							aria-label={open ? 'Collapse' : 'Expand'}
							tabindex="-1"
							onclick={toggle}
						></button>
					{/if}
				</div>
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
	     and carries its own tooltip, `UpdateSettingsItemToolTip` at NavigationView.cpp:1921.

	     **Inside the flyout too**, as upstream: the predicate above is pane state, so it stays
	     true for a row drawn in the flyout, and the reference shows a flyout row's tooltip when
	     the keyboard focuses it. It is redundant there, since the flyout shows the label the
	     rail was hiding, and before WD-107 it would have cost a press: the focused row's
	     tooltip took the Escape that `docs/keyboard.md`'s answer 8 measured closing the flyout. -->
		{#if collapsed && content}
			<ToolTip {content}>
				{#snippet children(props)}
					{@render row(props)}
				{/snippet}
			</ToolTip>
		{:else}
			{@render row()}
		{/if}

		{#if hasChildren && open && !childrenInFlyout}
			<ul role="group" class="children">{@render childRows()}</ul>
		{/if}
	</li>
{/snippet}

{#if childrenInFlyout}
	<!-- `ChildrenFlyout` — `NavigationView.xaml:468-469`, `Placement="RightEdgeAlignedTop"`.
	     The anchor is the `<li>` rather than the row inside it, and the reason is measured
	     rather than assumed: the row is already a tooltip trigger on the rail, and the two
	     primitives' trigger props collide on `id`, on `data-state` and on `aria-expanded` —
	     the last of which this row already owns as the tree's own expansion, so a merged bag
	     would not just lose one primitive's identity but overwrite a semantic attribute.
	     **The `<li>` and the row now share three of their four edges, and that is new.** The
	     `<li>` carries no padding, border or margin of its own, so its left, right and top are
	     the presenter's; it is taller, because it also holds the children list when a row is
	     expanded outside a flyout. Three edges is what the placement needs, and they are the
	     three `m_rootGrid` has — that grid holds the presenter in its first row and the
	     children repeater in its second, so it is the same shape. While the row carried
	     `NavigationViewItemButtonMargin` as a CSS `margin` the `<li>` was the row plus the
	     horizontal half of it, and `CHILDREN_FLYOUT_STYLE` gave that half back; the margin is
	     the presenter's padding now, and the compensation is gone with the mismatch it
	     answered.

	     What the `<li>` anchor costs is announcement: the primitive puts `aria-haspopup` and
	     its own `aria-expanded` on the anchor, and an `<li role="none">` is where assistive
	     technology drops them. Putting them on the row instead is what the collision above
	     rules out — the row's `aria-expanded` is the tree's, and it is the attribute that
	     would be overwritten.


	     `open` is the row's expansion, one-way: upstream shows the attached flyout *because*
	     the item expanded, so the expansion is the state and the popup follows it. The
	     callback is the other direction only — a dismiss the popup performs itself, Escape or
	     a click outside, has to collapse the row or the two would disagree and the flyout
	     could not be opened again.

	     **One case does not follow, and it is open.** A top-level id added to `expandedItems`
	     in the flush that mounts a rail, after the control's own effects have run — from a
	     parent's `$effect`, as the Gallery's shell used to — reads `aria-expanded` true and
	     draws no flyout, so its first click collapses a flyout nobody saw. An id passed in
	     before mount does not reach it: the expansion memory files it away for the rail.
	     Upstream's `ShowHideChildren` shows the flyout for a row expanded in the rail, on a
	     deferred callback that skips the show if the item is no longer expanded or no longer
	     in flyout mode, or has no grid or no attached flyout (NavigationViewItem.cpp:805-824,
	     the guard at :821-822); whether that skip is taken at load is what is open. The
	     Gallery's shell no longer seeds this state. -->
	<Flyout
		{open}
		onOpenChange={(next) => {
			if (!next && open) pane().setExpanded(tag, false);
		}}
		placement="rightEdgeAlignedTop"
		style={CHILDREN_FLYOUT_STYLE}
		content={flyoutRows}
	>
		{#snippet children(props)}
			{@render item(anchorOnly(props))}
		{/snippet}
	</Flyout>
{:else}
	{@render item()}
{/if}

<style>
	/* `NavigationViewItemPresenter` — the row, and the box the focus visual is drawn at.
	   `NavigationViewItemButtonMargin` is a margin on the `LayoutRoot` *inside* the presenter
	   (`NavigationView_themeresources.xaml:451`, the Thickness at `:228`), written here as
	   padding rather than on the fill as a margin because two XAML margins add where two CSS
	   margins collapse: with it on the fill, consecutive rows sat 38 apart with 2px between
	   their fills against the original's 40 and 4.

	   `NavigationViewItemMargin`, the item's own margin, is `0` (`:245`), so the row is this
	   box and nothing separates one row from the next.

	   The corner radius is the presenter's `CornerRadius="{TemplateBinding CornerRadius}"`
	   (`NavigationView.xaml:462`) taking the item's `ControlCornerRadius` (`:432`). It paints
	   nothing here; the focus visual inherits it. Upstream then deflates the *inner* stroke's
	   radius by half the primary thickness as it draws that stroke — `AdjustCornerRadius`,
	   `FocusRectManager.cpp:68-88`, clamped at zero per corner — where the two inset shadows
	   below share one radius, so this library's inner stroke rounds a half-thickness wider at
	   the corners. That is the shape `Button.svelte` already carries and not a choice this
	   makes; it is written here because this is the first comment in the file to say anything
	   about the radius, and a sentence that states only the half that matches reads as a
	   sentence that checked both. */
	.item-presenter {
		position: relative;
		padding: var(--winui-NavigationViewItemButtonMargin);
		border-radius: var(--winui-ControlCornerRadius);
	}

	/* **No border, and the resources for one are not an omission here.** The chain that would
	   have rendered it is three hops and stops at the last: the `NavigationViewItem` style sets
	   `BorderBrush` and `BorderThickness` (`NavigationView.xaml:423-424`), its template binds
	   both onto the presenter (`:462`), and the left-pane presenter style sets them again
	   (`NavigationView_themeresources.xaml:443-444`) — but the presenter's own template is where
	   a `Control`'s border has to be consumed, and its `LayoutRoot` `Grid` (`:451`) reads
	   `Background` and `CornerRadius` from the presenter and neither border property. Nor does
	   anything else: no visual state in that template (`:450-631`) targets a border, and no
	   non-XAML file in `controls/dev/NavigationView/` mentions either property at all. So the
	   `1` at `:226` has plenty of setters and no renderer, which is the only sense in which it
	   is unused.

	   The per-state brushes are the same story read from the other end. Every reference to
	   `NavigationViewItemBorderBrushPointerOver` across both pins — `NavigationView.xaml:328`
	   and `:339`, `windows-app-sdk/generic.xaml:17706` and `:17717` — re-keys it as
	   `ButtonBorderBrushPointerOver` for the pane's own buttons, and
	   `NavigationViewItemBorderBrushSelected` has its definitions and no reference.

	   This file drew the border anyway, and it cost two different things. Geometry in every
	   theme: an absolutely-placed child is positioned against the padding box, so the selection
	   indicator started a column right of the fill's edge where the reference puts it flush, the
	   row's content was inset by the same pixel, and `padding-right` measured the ContentGrid's
	   14 from inside the border rather than from the row's own edge, which put it at 15.

	   And a **visible outline in high contrast**, which the reading this unit started from had
	   wrong. The at-rest brush is transparent in all three themes (`:33`, `:99`, `:165`) and
	   that is what the reading generalised from; the selected one is not. `:173` gives
	   `NavigationViewItemBorderBrushSelected` the key
	   `SystemControlBackgroundTransparentRevealBorderBrush`, whose name says transparent and
	   whose HighContrast definition is `SystemColorButtonTextColor`
	   (`windows-app-sdk/generic.xaml:4292`, against `Transparent` at `:1481`). So a selected row
	   carried an opaque 1px outline that the original never draws — found by diffing the
	   high-contrast baseline this change moved, not by reading. */
	.item {
		/* XAML's `MinHeight` and `MinWidth` include the border and the padding; CSS's
		   `min-height` and `min-width` do not, unless the box is `border-box`. Without
		   this line a control whose minimum comes from a WinUI resource renders that
		   minimum *plus* its own padding and border — measured: this box came out 45px
		   tall against the original's 32.

		   That measurement is a bordered text input's and five other controls carry this block
		   verbatim. Here it currently decides nothing: with the border gone and no vertical
		   padding, `min-height` lands on the same box either way, measured. It is kept as the
		   line the siblings carry rather than as a line this rule needs. */
		box-sizing: border-box;
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		min-height: var(--winui-NavigationViewItemOnLeftMinHeight);
		/* c1-allow: NavigationView_themeresources.xaml:604, the item's ContentGrid carries
		   Margin="0,0,14,0" and no resource names the 14 */
		padding-right: 14px;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-NavigationViewItemBackground);
		color: var(--winui-NavigationViewItemForeground);
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
	}

	.item:active {
		background: var(--winui-NavigationViewItemBackgroundPressed);
		color: var(--winui-NavigationViewItemForegroundPressed);
	}

	/* Nothing in this version renders a disabled item. The rule is here because the state
	   exists in the source, and a missing rule reads the same as one decided against. */
	.item[aria-disabled='true'] {
		background: var(--winui-NavigationViewItemBackgroundDisabled);
		color: var(--winui-NavigationViewItemForegroundDisabled);
		cursor: default;
	}

	.item[data-selected='true'] {
		background: var(--winui-NavigationViewItemBackgroundSelected);
		color: var(--winui-NavigationViewItemForegroundSelected);
	}

	.item[data-selected='true']:hover {
		background: var(--winui-NavigationViewItemBackgroundSelectedPointerOver);
		color: var(--winui-NavigationViewItemForegroundSelectedPointerOver);
	}

	.item[data-selected='true']:active {
		background: var(--winui-NavigationViewItemBackgroundSelectedPressed);
		color: var(--winui-NavigationViewItemForegroundSelectedPressed);
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
		content: var(--winui-NavigationViewItemExpandedGlyph) / '';
		display: block;
	}

	.item[data-expanded='true'] .expand-chevron::before {
		rotate: 180deg;
	}

	/* The focus visual; see Button.svelte for the shape.

	   **The band is drawn at the presenter's bounds, not the fill's.** The focused element is
	   the item, and its own template marks the presenter as the focus target
	   (`Control.IsTemplateFocusTarget`, `NavigationView.xaml:462`); the fill is that
	   presenter's `LayoutRoot`, inset by `NavigationViewItemButtonMargin`. Both strokes then
	   land inside the 4px the margin leaves on each side, and the selection indicator — which
	   starts at the fill's left edge — clears the secondary stroke by a pixel. Drawn on the
	   fill instead, the primary stroke ran straight over the indicator.

	   The presenter's own `LayoutRoot` is marked too (`NavigationView_themeresources.xaml:451`)
	   and that does not reach this band, because the property registers upward rather than
	   being looked up downward: a marked element walks to its nearest `Control` ancestor and
	   stores itself in that control's `FocusTargetDescendant` (`framework.cpp:890-905`), so
	   `LayoutRoot` registers on the presenter and the presenter registers on the item, and on
	   focus the item reads only its own descendant (`uielement.cpp:6486-6496`) — one hop.

	   That both strokes are inside the bounds rather than straddling them is upstream's:
	   `CFocusRectManager::ConfigureFocusElement` gives the outer border the bounds it was
	   handed and deflates the inner one by the primary thickness
	   (`FocusRectManager.cpp:434-455`, the two roles named at `:173-174`). The bounds are the
	   target's own because the presenter's style sets no `FocusVisualMargin`
	   (`NavigationView_themeresources.xaml:440-447`), and it is the target's value that is read
	   before the focused element's (`FocusRectManager.cpp:109-110`); a `0` margin leaves
	   `ShrinkRectByThickness` (`FocusRectNudging.h:388`) returning the rect it was given. The
	   four `FocusVisualMargin` setters in `controls/dev/NavigationView/` are all on `Button`
	   styles, and one of them is `-4,0` — a negative horizontal margin is what *would* widen a
	   band, which is why it is worth saying that this row is not the button that has it.

	   `:has()` rather than a rule on the focused element itself, because the element that
	   takes the focus and the element the band is drawn on are two different boxes here, and
	   that is exactly what `IsTemplateFocusTarget` says. `.expand-chevron` below is this
	   library's own tab stop with no upstream counterpart, so it keeps the ordinary shape and
	   draws at its own bounds. */
	.item-presenter:has(> .item:focus-visible)::before {
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

	/* The flyout's list is the same list, drawn outside the pane. It needs a width of its own
	   because the presenter it sits in has none: `FlyoutThemeMinWidth` is the floor every
	   flyout gets and a rail's menu is narrower than nothing else here would make it, so the
	   rows would stretch to that floor with their labels adrift. `CompactPaneLength` is not
	   the answer either — that is the rail's own width, which is what the flyout is *beside*.
	   `max-content` lets the longest label size it, which is what a menu of rows does. */
	.flyout-children {
		width: max-content;
	}
</style>
