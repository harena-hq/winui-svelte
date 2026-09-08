# 0013 — A collection control is generic, and draws its items through a snippet

## Context

Six controls in this library already take a list of things to draw, and every one of them
narrows that list to a record type this project declared:

| control        | item type                                              |
| -------------- | ------------------------------------------------------ |
| ComboBox       | `ComboBoxItemData`                                     |
| MenuFlyout     | `MenuFlyoutEntry`, a union of six                      |
| NavigationView | `NavigationViewItemData` \| `NavigationViewHeaderData` |
| BreadcrumbBar  | `BreadcrumbBarItemData`                                |
| SelectorBar    | `SelectorBarItemData`                                  |
| TabView        | `TabViewItemData`                                      |

The phrase "narrowed to plain records" appears in five of those files, and the narrowing was
right five times. A menu item really is a glyph, a label, an enabled flag and a callback; the
control draws all of it and the consumer supplies none of the drawing. Where the vocabulary is
closed, publishing it as a type is better than publishing a hole.

The Collections tranche is where it stops being right. `ItemsRepeater` has three members that
matter — `ItemsSource`, `ItemTemplate` and `Layout` (`ItemsRepeater.idl`) — and two of them are
the consumer's. `ItemTemplate` is not a corner of ListView that a thorough reproduction would
also cover: it is what the control is for. A ListView that draws records this library declared
is a different control that happens to share a name.

ADR 0009 settled how a WinUI member becomes a Svelte prop, and it is still the rule here. What
it did not settle is the shape underneath: it assumes each component has a fixed prop set over
concrete types, and says nothing about a component whose item type is the caller's.

## Decision

**A collection control is generic in its item type.** The component opens
`<script lang="ts" generics="T">` and its props interface is declared as `XProps<T>`, exported
generic. The item type is never widened to `unknown` or `any` at the boundary.

**`items` is the prop, whatever upstream calls the member.** ItemsRepeater's member is
`ItemsSource` and ADR 0009's mapping would give `itemsSource`. It does not, here. Six shipped
controls publish `items`, and a library whose actual collection control is the one that spells
it differently teaches nothing to anyone. **This is a recorded departure from ADR 0009 and the
only one this ADR takes**; ADR 0009's closed exception set — the HTML attribute vocabulary —
is untouched, because this is not that kind of exception. Where a control has both `Items` and
`ItemsSource`, `items` was already the mapping of the first and nothing changes.

**`itemTemplate` is a snippet of the item and its index.** ADR 0009 already says a named
content member is a snippet prop under the mapped name, so `ItemTemplate` → `itemTemplate` with
no departure. Its type is `Snippet<[T, number]>`: the item first, then the index, because the
index is what `{#each}` has in hand and what upstream's `ElementPrepared` reports
(`ItemsRepeaterElementPreparedEventArgs`). The snippet renders one element per item; a snippet
emitting two roots is a consumer error the layout cannot correct, and the component says so at
its own site rather than defending against it.

**Identity is a function the caller supplies, not a field this library requires.** `key?: (item:
T, index: number) => string | number`, defaulting to the index. WinUI has no member for it —
the framework keys on object identity, and `ItemsSourceView.KeyFromIndex` exists only for the
unique-id element factories. Svelte's `{#each}` needs one to reuse DOM correctly, so this is a
prop with no WinUI member behind it, the same category ADR 0012 put `glyph` in. It is a
function rather than a field name because the alternative forbids `string[]`, which is what the
Gallery's own first example passes (`ItemsRepeaterPage.xaml:102`).

**A layout is a plain object with a `kind` discriminant, not a component and not a class.**
`<StackLayout Orientation="Horizontal"/>` in XAML is an object assigned to a property, not an
element in the tree, and the reproduction keeps that: `layout={{ kind: 'stack', orientation:
'horizontal', spacing: 8 }}`. `kind` is not a WinUI member; it stands for the upstream class's
own name, and it is the second and last thing in this ADR with nothing behind it upstream.

**What being generic does not change.** D21 still holds in full: `...rest` on the root, `class`
and `style` destructured and merged, `ref` on the interactive element, callbacks `on<Prop>` in
camelCase, bindable props with their `on<Prop>Change`. Tokens are read the same way. A generic
component is an ordinary component with one type parameter.

## How the claim is checked

That the packaging survives a generic component was measured before this ADR was written, not
assumed — an external dependency is verified before anything is built on it, and the toolchain
counts as one. A `<script lang="ts" generics="T">` component placed in
`packages/winui-svelte/src/lib/components/` and built with `pnpm --filter winui-svelte build`:

- reaches `dist` with `generics="T"` intact and `lang="ts"` removed by
  `scripts/package/strip-script-lang.mjs`, which matches on `lang` alone and leaves the rest of
  the opening tag as it found it;
- emits a fully generic `.d.ts` — `declare function $$render<T>()` and an
  `$$IsomorphicComponent` whose call signatures are generic in `T`, so a consumer's item type
  survives into the component's props;
- compiles under `svelte/compiler` from the packaged form, with no warnings, which is the check
  that matters: `generics` is a language-tools attribute and the question was whether the
  runtime compiler minds finding it without `lang="ts"` beside it. It does not;
- passes `publint`, and gate C6 reads the same `dist`.

The one residue is an `export {};` left in the packaged script by the preprocessor. It is inert
and it is not new to generics.

## Alternatives rejected

**`items: unknown[]` with `Snippet<[unknown, number]>`.** Compiles, ships, and hands the
consumer a cast at every use site. The type parameter costs one attribute and removes the cast.

**A child component per item, `{#snippet}`-free — `<ItemsRepeater><Item/>…`.** This is the shape
XAML's own markup suggests and it is wrong twice. It loses the item's type, because a child
component cannot be told what its parent's `T` is; and it forces a wrapper element into the
layout's flow, which changes the geometry the layout produces — the thing this tranche exists
to reproduce.

**Keying on a required `id` field.** It is the six narrowed controls' shape and it would be
familiar. It also forbids `items={['One', 'Two']}`, which the Gallery passes on the very first
example of the very first page in the group.

**A component as the `layout` prop.** Svelte components are not values that can be read for
properties without being rendered, and rendering a layout would put an element in the tree that
XAML does not have.

## Amendment, v9 unit 4c — a control that owns selection tells the template what it decided

`ItemsRepeater` draws items and decides nothing about them, so `Snippet<[T, number]>` is the
whole contract. `ItemsView` is the first control here that decides something: which items are
selected, and whether the container should show a check box. Upstream puts that decision on an
element inside the consumer's own `DataTemplate` — every `ItemsView` example in the Gallery
opens its template with `<ItemContainer>` — and reaches it by walking the visual tree at run
time (`ItemsView.cpp`'s container bookkeeping). A Svelte component cannot reach into a snippet
to set a prop on something the snippet rendered.

So **a collection control that owns selection passes what it decided as the snippet's third
argument**: `Snippet<[T, number, ItemsViewItemState]>`, where the state is a plain object of
the container props the view owns — `selected`, and the `multiSelectMode` the view's own
`selectionMode` implies. The consumer still writes the `ItemContainer`, still sizes it, still
gives it a label, and spreads the view's decision onto it:

```svelte
{#snippet itemTemplate(photo, index, state)}
  <ItemContainer selected={state.selected} multiSelectMode={state.multiSelectMode}>
    <img src={photo.src} alt={photo.title} />
  </ItemContainer>
{/snippet}
```

The alternative — the view rendering the `ItemContainer` itself and the snippet drawing only
its content — was rejected because it takes the container away from the consumer, and the
Gallery's own first template sets `Width`, `Height`, `HorizontalAlignment` and an automation
name on it (`ItemsViewPage.xaml:22-27`). A control whose reproduction silently drops four
attributes of the element the source hands the consumer is a different control.

The state object carries no callback. Selection needs to know whether Ctrl or Shift was down —
`SingleSelector`, `MultipleSelector` and `ExtendedSelector` each branch on them — and
`ItemContainer.onItemInvoked` carries no event, by unit 3's decision and upstream's own event
args. The view therefore listens on its own viewport, where the click and the key press arrive
with their modifiers intact, and finds the index by asking which of the repeater's children
contains the event's target. That also means a consumer's own `onItemInvoked` on the container
still fires: the two are on different elements and the event reaches both.

## Status

Accepted, v9 unit 1. It governs every control in roadmap item 9 and nothing before it: the six
controls above keep their record types, which is D26's neighbouring decision and the same
reasoning — a closed vocabulary is a surface worth publishing.

## Downstream impact

- ADR 0009 gains one recorded departure, `ItemsSource` → `items`, and no new exception class.
- The plan's D27 row points here.
- Every unit of v9 after the first cites this ADR rather than re-deciding it.
