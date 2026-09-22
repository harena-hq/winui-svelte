# 0015 — NavigationView's menu items are elements a consumer writes

## Context

`NavigationView` takes `items: NavigationViewEntry[]`, and that entry is a union of two records
this project declared (`NavigationView.svelte:20`): a row — an `id`, a `content` string, an
optional `glyph`, `children` (`:5-13`) — or a header, which is a string. ADR 0013 listed this
control among the six that narrow a collection to a record type, and decided those six keep
their record types.

A sidebar this control is meant to replace can do three things in a row past a label and an
icon:

- **inline rename** — the row swaps from a button to a text field on a key, and cancels on
  Escape;
- **per-row commands revealed on hover or focus-within** — open, rename, delete;
- **a drag-and-drop target ring**, driven by a payload hit-tested against rows.

None of the three expresses through the surface as it stands, and the reason is one thing:
nothing a consumer writes can render _inside a row_. `content` is a string drawn as text into
the content cell. `header`, `paneFooter` and `children` are slots of the control, not of a row.
The rest props reach the control's root element. So the question is a surface question, and
ADR 0009 is what makes it urgent rather than interesting: once a prop surface is imported,
changing it costs the consumer a migration.

**Upstream's menu is elements, and a data source is the second way in.** `MenuItems` is an
`IVector<Object>` the markup fills (`NavigationView.idl:203`); `MenuItemsSource` plus
`MenuItemTemplate` (`:204`, `:207`) is the binding path, with `MenuItemTemplateSelector`
(`:208`) beside it. The Gallery's own page writes items directly in **seven of its eight** examples —
`NavigationViewPage.xaml:78`, `:125`, `:160`, `:199`, `:279`, `:371`, `:512` — and binds in
the eighth (`:232`).

Both templates are handed to one element factory (`NavigationView.cpp:4293-4298`), and
`NavigationViewItemsFactory::GetElementCore` then branches:

- if what the template produced **is** a `NavigationViewItemBase`, it is the container and is
  returned as it stands — `NavigationViewItemsFactory.cpp:53-55`;
- otherwise the factory generates its own `NavigationViewItem` (`:58-69`) and passes the
  template down to that container's `ContentPresenter` (`:71-85`).

The Gallery's page recommends the first in prose — "set the `MenuItemTemplate` property and
**use a `NavigationViewItem` as the data template**" (`:223`) — and its own template is a
`NavigationViewItem` (`:16-20`), reached through the selector at `:231` rather than through
`MenuItemTemplate`, which nothing in the Gallery pin sets.

One item is exempt from both branches: the settings row is never templated
(`NavigationViewItemsFactory.cpp:39-43`).

## Decision

**`NavigationViewItem` becomes a public component.** It is what a menu item _is_ upstream:
every item those seven examples write is one. This is **not** the claim that `MenuItems` can
hold nothing else — it is typed `IVector<Object>` (`NavigationView.idl:203`), and the factory
wraps a non-item in a generated container (`NavigationViewItemsFactory.cpp:58-69`), which the
paragraph above already says. It is a claim about what _reproducing_ the member means. A
`menuItems` snippet is possible with nothing of ours to write inside it, and it would reproduce
the member's syntax and none of its content; ADR 0007 makes the Gallery's own markup the thing
to reproduce, and the element is what that markup writes seven times.

Its props map by ADR 0009 from that class's own members — `Icon` (`:328`), `CompactPaneLength`
(`:330`), `SelectsOnInvoked` (`:338`), `IsExpanded` (`:347`), `HasUnrealizedChildren` (`:350`),
`IsChildSelected` (`:352`), `MenuItems` and `MenuItemsSource` (`:355`, `:357`), `InfoBadge`
(`:369`) — and from `IsSelected` on its base (`:315`), which a public item plainly needs and
which "that class's own members" would otherwise exclude by construction. Three of the ten
already have a reproduction in this control's surface: the nested submenu is
`NavigationViewItemData.children` (`NavigationView.svelte:12`), expansion is the control's
`expandedItems`, selection its `selected`. Which of the remaining seven the first
implementation carries is the implementing unit's scope; that the component is public is this
ADR's.

**`menuItems` is a snippet**, reproducing `MenuItems`. `children` is already `Content`, so
ADR 0009's mapping of the named collection stands with nothing dropped — the shape `CommandBar`
already ships, whose `children` is `PrimaryCommands` and whose `secondaryCommands` is the
second collection (`CommandBar.svelte`'s props).

**`menuItemTemplate` is a snippet of the entry and its index**, reproducing `MenuItemTemplate`
in the branch the source recommends: **the snippet draws a `NavigationViewItem`**, not the
label inside one. The template→snippet mapping is ADR 0013's precedent (`ItemTemplate` →
`itemTemplate`, `Snippet<[T, number]>`); ADR 0009 supplies the naming and nothing is dropped.

**The template is handed every entry, headers included.** This is what reproduces
`MenuItemTemplateSelector`, and it is the Gallery's own stated reason for that member: "if you
wish to bind to the header content as well, use data template selectors" (`:223`). XAML needs a
second member because a `DataTemplate` is a value and cannot branch; a snippet is a function
and writes the `{#if}` the selector's `SelectTemplateCore` would have been. So the selector is
reproduced rather than declined, and it gets no prop of its own.

**The settings row is never templated**, reproducing `:39-43`.

**`items` becomes generic, with the record as its bound rather than as its whole type**:
`T extends NavigationViewItemData`, `items: (T | NavigationViewHeaderData)[]`, and the template
typed in `T`. The consumer's rows carry the consumer's own fields — a path, a rename flag — and
the template sees them. Nothing shipped changes: `selected` is still an `id` the consumer
holds, `onItemInvoked` still reports one, and a call site passing plain entries infers `T` as
the record it already had. **The parameter is defaulted — `T = NavigationViewItemData` — and
that is not a convenience.** `NavigationViewProps` is exported (`index.ts:202`), and a consumer
who wrote it without a type argument has written something that stops compiling the moment the
interface takes a parameter. The default is what keeps this widening additive. This is
ADR 0013's "a collection control is generic in its item type" reaching a seventh control
without disturbing its "the six keep their record types", because the record is kept — as the
constraint.

**What the control decided travels as context, not as a third snippet argument.** The mechanism
exists: `internal/command-bar.ts` publishes a container's state and a child→parent registry
through Svelte context, read by six components, and its own header states the constraint that
forces it — "A Svelte parent cannot reach into a snippet, so the same information travels as
context and each command reads it as the default under its own prop: a prop the consumer passes
always wins."

**This is where ADR 0013's v9 unit 4c amendment does not reach, and the difference is `MenuItems`.**
`ItemsView` passes its decision as the template's third argument because it has one way in and
always holds the item. `NavigationView` has two, and an argument cannot reach an item the
control never sees. One fact carried two ways is the surface that drifts. So: per-container
facts — whether the pane is the icons-only rail, the invoke callback, the expansion setter —
are context; per-item facts are resolved by the item from its own identity against what the
container published, which is also how nesting depth reaches a child, each item publishing a
level one deeper than the one it read. **That an item has an identity is what this mechanism
needs; what the identity is called is not**, and the name is deferred below. The two are
separable — any spelling works, and the deferral is about which one — but the dependency is
stated here rather than left for a reader to notice.

## What this leaves for the implementing unit to establish

None of the following is claimed here. Each is a measurement or a test the unit that builds this
takes before it states it: what a dependency does is measured, not assumed, which is why ADR 0013
measured its own packaging rather than assuming it.

1. **A constrained, defaulted type parameter survives `svelte-package`.** ADR 0013 measured
   `generics="T"`. It did not measure `generics="T extends NavigationViewItemData = …"`, and a
   language-tools attribute carrying one is not the same string. Measure it the same way —
   `dist`, the emitted `.d.ts`, a compile from the packaged form, `publint`, `pnpm smoke`.
2. **The keyboard contract becomes public surface, and the reference has said all it can.** Two
   things meet here. The narrow one: the row is a `div[role=treeitem]` with `tabindex="0"` whose
   `keydown` handler calls `preventDefault()` on Space (`NavigationViewItem.svelte:40-46`), so
   a text field a consumer renders inside it cannot receive a space. The DOM has that by
   construction: the event bubbles whether or not anything handled it. **XAML does not have it,
   and that much is readable from the pin** — a claim this ADR first asserted without evidence,
   then withdrew as unreadable, and which the pin answers in its own words. The control
   subscribes to each item's `KeyDown` plainly (`NavigationView.cpp:3595`, handler at `:2709`)
   and never calls `AddHandler`, the overload that asks for already-handled events; where a
   control in the same pin wants the opposite it says why, at `TableView.cpp:271-273`. What the pin
   does not carry is whether a focused `TextBox` marks Space handled in the first place,
   which is what would decide the case. **Both halves were resolved on 2026-09-21 and
   neither is still owed.** The wide one: that handler was WD-004, whose "WinUI does" paragraph
   described the WAI-ARIA tree pattern and assumed WinUI follows it; the assumption was
   pressed and is false, and `docs/keyboard.md` has the record. The entry was
   deleted on 2026-09-22, when the ring that press asked for was built. The narrow one — type into a
   field inside a row of the original and see whether the row invokes — **cannot be asked of
   the reference at all**: the Gallery builds no editable field inside a row, and the pin
   does not carry the editor, so the search stands in for the press. That record is
   `docs/keyboard.md`'s entry 9, with what was searched written into it, and it is the first
   use of the fourth outcome that document now lists.
   So the row's handling of a key aimed at something inside it was a decision rather than a
   measurement, and the unit took it: **the row acts on a key only when the key's `target` is
   the row itself.** The ground is not the pin's routing, and a first draft of this paragraph
   said it was. What the citations above establish is that XAML's row does not see an
   **already-handled** key — a key from a descendant that nothing handled still reaches it —
   and whether a focused `TextBox` marks Space handled is the half entry 9 could not ask. So
   target identity is narrower than upstream's routing rather than a reproduction of it, and
   claiming otherwise would have invented the missing half.
   The ground is about the web instead. `defaultPrevented` is the DOM's analogue of `Handled`
   and the motivating case does not set it — a space typed into a text field is that field's
   _default_ action, so nothing cancels it and a handledness test would let the row swallow
   the key. No faithful test being available, the choice is between two behaviours that each
   diverge somewhere, and they are not symmetric: acting on a key aimed at something else
   certainly breaks a field a consumer put in the cell, while acting only on a key aimed at
   the row costs nothing this control draws today, since a label is not focusable and no key
   can be targeted at one. **The pointer half is a separate decision**, because target identity
   is the wrong test for it: a click's target is whatever sits under the pointer, so the label
   would fail it and the row would stop being clickable. It was owed by the unit that lets a
   consumer put an element in the cell, and that unit took it — by reading the pin rather than
   by reasoning from the paragraph above, which had guessed at the mechanism and named only the
   remedy. **Upstream's gate is handledness, not target.** `NavigationViewItem` subscribes to
   its presenter's `PointerPressed` plainly, under its own comment saying that handlers which
   set flags are skipped once `args.Handled` is true (`NavigationViewItem.cpp:1272-1273`), so
   `m_isPressed` is set only for a press no descendant took; `PointerReleased` is subscribed
   with `handledEventsToo: true` (`:1278-1281`) precisely so the flag is always reset; and the
   release invokes only `if (m_isPressed)` (`:1095`). A `Button` a consumer puts in the content
   marks that press handled — `ButtonBase::OnPointerPressed` calls `put_Handled(TRUE)`
   (`ButtonBase_Partial.cpp:689-699`) — so upstream's row does not invoke. For a text field the
   evidence is indirect and WD-090 says how far it goes. The DOM carries no such
   flag for a pointer — a `<button>`'s click sets no `defaultPrevented`, which is why the
   keyboard half's analogue is no help here — so the decision taken is the remedy this paragraph
   already named: a descendant declines by stopping the event, as the chevron does. The gap that
   leaves is **WD-090**, and it is asserted in both directions by
   `navigation-view-template.spec.ts` — the command button that stops the click does not invoke
   the row, the field that does not stop it does.
   A gate could not press a key when this was written and now one does.
   `navigation-view-keyboard.spec.ts` is this control's first keyboard assertion, and the
   chevron is what made the decision observable without waiting for a consumer's element:
   before it, Space on a focused chevron ran the _row's_ handler, whose `preventDefault()`
   also cancelled the button's own activation, so one press collapsed the section **and**
   navigated away from the page inside it. The section collapses either way — the row's
   `activate()` toggles it too — so the URL is the whole of what separates the two, and
   **one of the file's two tests is what separates them.** The other, Space on the row
   itself, cannot disagree with this guard at all: a focused row is its own event target
   whether the guard is there or not. It stands against a different mistake — an inverted
   test, or an over-broad one keyed on `defaultPrevented` or on `closest()` — and it is
   worth its line for that rather than as evidence for this.
3. **An identity prop collides with the DOM.** `NavigationViewItemData.id` is a data field and
   is untouched, but ADR 0009 spreads the rest props onto the root, where `id` is a live HTML
   attribute — so a public `NavigationViewItem` cannot take `id` to mean "which row this is".
   Upstream's answer is `FrameworkElement.Tag`, and the Gallery's own code-behind reads
   `selectedItem.Tag` to route (`NavigationViewPage.xaml.cs:76-78`, `:96-97`). `tag` is the
   leading answer; the unit picks it or an explicitly routed alternative, and says which.
   **It took `tag`**, typed as the `string` this library's `selected` already is rather than
   as `Tag`'s `IInspectable`. `NavigationViewItemData.id` is untouched: it stays the data
   field, and the control reads it and passes it as the element's `tag`.
4. **Where `.content-presenter`'s label rules go.** `white-space: nowrap`, `overflow: hidden`
   and `text-overflow: ellipsis` (`NavigationViewItem.svelte`'s `.content-presenter` rule —
   named rather than numbered, because the change this item asks for is what moves it) are
   rules for a label,
   on a box that takes arbitrary content once this lands. Upstream has three presenters
   carrying `ContentTemplate` — `NavigationView_themeresources.xaml:616` (left), `:891` (top)
   and `:1062` (top overflow) — and the two top ones carry `TextWrapping="NoWrap"` while the
   left one, which is the one this control reproduces, carries none of the three.
   **The unit put them on the label rather than on the box**: the presenter carries them
   under `[data-label]`, which is the cell drawing the `content` string, and a cell a
   consumer fills with an element gets what upstream's left presenter has, which is nothing.
   That leaves the string the control draws trimmed exactly as before, so no baseline moves —
   the three rules are this library's own addition either way, and the reading above is what
   says they are a label's.
5. **`icon` on `NavigationViewItemData`** is owed separately by ADR 0012 and already recorded
   in the plan as owed. It is adjacent and is not decided again here.

## Alternatives rejected

**The content branch alone — a template that fills the row's content cell.** Cheaper by
everything this ADR spends. **It is not rejected for the reason an earlier draft gave, and the
measurement is worth keeping**: that draft said a ring around the row could not be drawn from
inside the cell, and a probe against the repository's own rules says otherwise.
`.content-presenter` declares no `position` (`NavigationViewItem.svelte`'s rule of that
name), so an
absolutely positioned descendant's containing block is `.item` — which is `position: relative`
deliberately, because `.selection-indicator` is absolute against it (`:255-263`) — and an
`overflow` ancestor clips nothing whose containing block is above it. The ring measured as the
row's own box and hit-tested outside the cell at both ends. So the content branch carries all
three behaviours.

It is rejected on the members instead. All ten listed above belong to the container rather than
to its content, so a content template reaches none of them — including the three this control
already reproduces, which a template could not set either. The seven with no reproduction would
each become a field on the record, and the record would grow into a worse copy of an element
that has to exist anyway for `menuItems` to have anything to hold. The content branch is then a
second way to draw a row, weaker than the first and paid for twice.

**Both branches, resolved at run time by what the snippet rendered.** Faithful; it is what
`GetElementCore` does. Rejected because the test it performs is a type check on a rendered
element, and a Svelte snippet's output is not something its caller can inspect before it is in
the DOM. The XAML factory can ask because it holds an object; we would have to read back from
the tree and behave differently according to markup the control cannot see.

**A state object as the template's third argument, as `ItemsView` has.** Rejected above, on
`MenuItems`: it cannot reach an authored item, so the control would need context as well, and
one decision carried by two mechanisms is the pair that drifts apart.

**Leaving the surface as it stands and letting the consumer reach the row from outside.** The
row publishes `data-selected` and `data-expanded`, and a consumer could match it with a
`:global` rule. Rejected because CSS renders neither a text field nor a command button, and the
identity a drag hit-test needs is not in the DOM at all.

## Status

Accepted. It amends ADR 0013 twice — a seventh control becomes generic, and its record type
becomes a bound rather than a closed type — and takes no departure from ADR 0009.

It is decided before v18's naming unit fixes the exported set, and that order is the point.
`menuItemTemplate` could be added to a shipped control without breaking anyone; `items`
becoming generic, `NavigationViewItem` becoming public, and a menu that can be written as
elements cannot be. The four are one surface.

## Downstream impact

- v18's naming unit exports `NavigationViewItem` alongside `NavigationView`, and the punch list
  gains this control's implementation as a unit of its own.
- Roadmap item 19's remaining Gallery pages include this control's data-binding example, the
  page the evidence above is read from; it becomes buildable rather than deferred.
- `ChildrenFlyout` — the rail's flyout of a parent item's children — renders items too, and is
  built on this rather than beside it. Its **focus** contract is answered:
  `docs/keyboard.md`'s eighth answer was pressed on the reference guest on 2026-09-21 and says
  what the flyout does with focus — where it lands on open, that Up and Down cycle within it,
  that Left does not escape it and Escape closes it. What that answer does not reach is still
  open: where focus returns after Escape, whether Tab or Home and End do anything inside the
  flyout, and what a nested parent within it does.
- `docs/surface.md` gains the two rows this reading found; the sweep that should have found
  them is recorded there with why it did not.
- `TeachingTip` and `NavigationView` still owe `icon` (ADR 0012); this does not discharge it.
