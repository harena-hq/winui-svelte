# 0009 — How a WinUI member becomes a Svelte prop

## Context

The library is the product; the Gallery is the harness that judges it. A consumer installs
`winui-svelte` and writes `<Button …>` — so the prop surface is as public as the token names
ADR 0006 fixed, and just as unchangeable once shipped.

Two components exist, and they were written before any rule. Their surfaces disagree with each
other and with the ecosystem:

| site                     | shape                         | what it disagrees with                     |
| ------------------------ | ----------------------------- | ------------------------------------------ |
| `paneOpen`               | `IsPaneOpen`, prefix dropped  | nothing — this one is right                |
| `paneToggleVisible`      | `IsPaneToggleButtonVisible`   | drops `Button` as well as `Is`             |
| `onselect`               | all-lowercase callback        | the DOM owns lowercase `on*`               |
| `onback`, `onpanetoggle` | all-lowercase callback        | and `BackRequested` is the member's name   |
| `expanded: SvelteSet`    | a mutable object prop         | there is no way to observe it, only mutate |
| everything               | no `class`, no rest, no `ref` | a consumer cannot place or extend it       |

That last row is the one that matters most. Nothing in the library today can be given a class,
an `aria-label`, a `data-*` hook, or an id. A component that cannot be positioned by its
consumer is a demo, not a library.

D9 locks bits-ui as the primitive base, so a consumer will hold both surfaces at once. Its
conventions are therefore not merely one option among several — a disagreement with them is a
cost paid by every consumer, on every component, forever. Read from `bits-ui@2.19.0`: booleans
are bare and DOM-polarised (`disabled`, `readonly`, `required`, `checked`); state callbacks are
`on<Prop>Change` in camelCase; content is the `children` snippet; the root element takes `ref`
and spreads the rest of the attributes.

## Decision

**Property names.** A prop is the WinUI member name, camelCased, with a leading `Is`, `Has` or
`Can` dropped and the polarity kept — `IsPaneOpen` → `paneOpen`, `IsBackButtonVisible` →
`backButtonVisible`, `PaneDisplayMode` → `paneDisplayMode`. Nothing else is dropped:
`IsPaneToggleButtonVisible` → `paneToggleButtonVisible`, not `paneToggleVisible`.

**Where HTML already has the attribute, HTML wins — name and polarity.** `IsEnabled` is exposed
as `disabled`, not as `enabled`, because the rest props reach a real `<button>` and `disabled`
is already live there; two names for one state is a bug waiting for a consumer to set both. The
exception set is closed and is the HTML attribute vocabulary itself: `disabled`, `readonly`,
`required`, `checked`, `open`, `hidden`, `value`, `placeholder`, `name`, `form`.

**Callbacks are camelCase after `on`; lowercase `on*` is the DOM's and is never ours.**
`onclick` reaches the underlying element through the rest props and keeps its DOM meaning. A
change to a bindable prop is `on<Prop>Change` called with the new value — `onPaneOpenChange`.
An event that is not a prop change takes the WinUI event name — `BackRequested` →
`onBackRequested`, `ItemInvoked` → `onItemInvoked`.

**A prop the control mutates itself is `$bindable()`, and always has its `on<Prop>Change`.**
Binding and observing are different needs and a consumer should not have to bind to learn.

**Content is snippets.** The XAML `ContentProperty` is `children`. A named content member is a
snippet prop under the mapped name — `PaneFooter` → `paneFooter`.

**Every component takes the escape hatch, on its root element:** `...rest` spread (so `id`,
`aria-*`, `data-*` and DOM handlers all work). Restyling beyond that is the token cascade — set
`--winui-*` on an ancestor — which is ADR 0002 and needs no per-component surface.

**`ref` points at the interactive element, which is the root only when the root is the
control.** Button's root is its `<button>` and the two coincide; TextBox's root is a wrapper
whose `<input>` is the control, and its `ref` is the input. The rest props stay on the root
either way, because that is where a `data-*` hook, an `id` and a pointer handler have to land
to reach the whole control — a hidden or inner element would receive `onmouseenter` for a
region the consumer cannot see. Written down after the fact: TextBox shipped this way in v3's
third unit without the rule being stated, so the rule follows the code rather than the code
following the rule.

**An HTML attribute from the reserved set that belongs on an inner element is declared as a
prop rather than left to the rest spread.** `name`, `value`, `required` and `form` on a
CheckBox belong on its `<input>`, and the rest props do not go there. This is the second half
of why the exception set is closed: reserving those names keeps them available to be routed,
instead of a consumer's `name` landing silently on a `<label>`.

**`class` and `style` are destructured out of the rest and merged, never spread.** Left in, they
do not merge — they replace, and silently. Measured on Svelte 5.57.0: a component whose root is
`<div class="root" style="color: red" {...rest}>`, given `class="consumer" style="margin: 4px"`,
renders `class="consumer svelte-4q5ttb" style="margin: 4px;"`. Its own `root` class is gone and
every rule keyed on it stops applying, while the scoping hash Svelte injects stays — so the
component still looks styled, and is not. The form that works is
`let { class: className, style, ...rest } = $props()` with `class={['root', className]}`, which
composes to `class="root consumer svelte-4psua6"`; Svelte's array form does the merging and
keeps the scope.

**`ref` is populated on the first effect flush, not when `mount()` returns.** Same as
`bind:this`, which is what it is; a consumer reading it during its own initialisation reads
`null`. Stated because it is invisible until someone measures at the wrong moment.

**A prop's TSDoc names the WinUI member it maps to**, so a reader can diff the surface against
the IDL without a registry to maintain. A prop with no WinUI member says so instead.

## Status

Permanent for the names. The two existing components are migrated as v3's first unit; after
that a rename is a breaking change.

**Amended by ADR 0012.** The exception set above is declared closed and was reopened once, for
`glyph`, a shorthand for an `IconElement` that is a Segoe Fluent Icons code point. Three
components had already shipped it unrecorded when that was noticed. The naming rule is
otherwise unchanged, and the `icon` prop ADR 0012 introduces follows this ADR rather than
excepting itself from it.

## Alternatives rejected

- **Keep the WinUI name verbatim, as ADR 0006 does for tokens.** The symmetry is false. A token
  name is looked up mechanically against Microsoft's documentation, which is exactly ADR 0006's
  argument; a prop is typed by hand next to `disabled` and `onclick`. `IsPaneOpen` as a prop
  reads as a foreign object in Svelte source, and the ecosystem's own vocabulary is right there.
- **All-lowercase callbacks (`onselect`), as the two existing components have.** It collides
  head-on with the DOM handlers the rest props carry, and the collision is silent: whichever is
  destructured last wins.
- **bits-ui's `child` snippet (`asChild`).** It hands the consumer the root element to replace.
  Our root element _is_ the WinUI template's outer border — its classes, its corner radius, its
  visual states. Letting it be swapped forfeits the only thing this library sells.
- **Exposing template parts as CSS selectors (`::part`).** Freezes the internal structure into
  the public surface, and the structure is dictated by WinUI's templates, which change between
  WinUI releases. The token cascade reaches the same values without pinning the tree.

## Downstream impact

The five controls of v3 are the first written under this rule, and the two from v2 are brought
onto it before them — cheapest now, at two components, and the cost is linear in the count from
here on. It is also the first version whose output is worth installing: a consumer can place,
label and extend what the package exports.
