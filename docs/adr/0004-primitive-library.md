# 0004 — bits-ui as the primitive base, with individual Zag machines for its gaps

## Context

The library needs behaviour — roving tabindex, focus containment, dismissable-layer
stacking, typeahead, anchored positioning — for roughly twenty standard controls, and needs
to own the rendered DOM completely, because WinUI chrome is specific about element structure.

The survey covered bits-ui, Melt (both lines), Skeleton, shadcn-svelte, Zag.js, Ark UI,
svelte-headlessui, svelte-ux and flowbite-svelte, plus the option of building on standalone
behaviour packages with no component library at all.

Two findings collapsed most of the field.

**The keyboard question that prompted the survey is not a differentiator.** A close button
nested inside a tab trigger is excluded from arrow-key navigation in bits-ui, in Zag (and so
in Ark UI and Skeleton), and in Melt next-gen — all three build the candidate list by
querying for elements carrying a specific role or data attribute, which structurally cannot
match a nested child. TabView's arrow-key handling is hand-written whatever we choose.

**The controls that cost the most are absent everywhere.** NavigationView, closable and
reorderable TabView, DataGrid, InfoBar, Breadcrumb, SplitButton, TeachingTip and
virtualisation exist in no candidate. They are built here regardless, so they cannot inform
the choice.

That leaves a narrow real difference: Zag ships machines for **TreeView, ColorPicker and
NumberInput**, which bits-ui lacks and which are genuine WinUI controls, two of them large.

Several candidates ruled themselves out. `@melt-ui/svelte` is dead — eleven months stale,
still pinned to a Svelte 5 prerelease. Its successor `melt` is real but has seventeen
builders and no Menu, Calendar or Checkbox. `svelte-headlessui` is stale in both its
canonical repo and its fork. shadcn-svelte is a copy-in recipe layer that imports bits-ui at
runtime, so it is not a distinct choice. Skeleton v5 is Zag underneath but couples its design
system to Tailwind, which ADR 0002 declines. flowbite-svelte and svelte-ux ship their own
visuals and are the wrong category.

So the decision is bits-ui or Ark UI. This is a greenfield repository, so the usual
tie-breaker — migration cost — does not apply; both start from zero.

Ark's remaining advantage is a uniform `data-scope` / `data-part` attribute convention across
every component, against bits-ui's per-component naming (`data-tabs-trigger`,
`data-accordion-trigger`). That would matter to a design system writing shared cross-component
selectors. **ADR 0002 means we never write one** — every component carries its own Svelte
scoped `<style>` block, so the attribute names are read at exactly one site each and their
consistency buys nothing.

With that argument removed, bits-ui wins on being designed for Svelte rather than ported to
it: runes and snippets are its native idiom, not an adapter over a React-shaped API.

## Decision

Build on **bits-ui** for the standard primitives.

For TreeView, ColorPicker and NumberBox, lift the individual Zag machine —
`@zag-js/tree-view`, `@zag-js/color-picker`, `@zag-js/number-input` — rather than hand-rolling
them or adopting Ark UI wholesale. Each is an independent npm package; using one does not
pull in Ark or the Zag Svelte component layer.

Where bits-ui's element structure fights a specific Fluent control, escape for that control
only: its `child` snippet first, and failing that `@floating-ui/dom` + `focus-trap` +
`tabbable` + `aria-hidden` directly. A wholesale rewrite is never the answer to one
component's structure.

## Status

Permanent for the standard primitives. Revisit only if **the second escape** — dropping to
`@floating-ui/dom`, `focus-trap`, `tabbable` and `aria-hidden` directly, in place of bits-ui —
is needed across many controls rather than one. That is a different finding from the one this
ADR weighed, and would deserve a fresh comparison against Ark UI, which remains the credible
runner-up.

The trigger names the second escape because the first one is not a symptom. Every component
built on bits-ui uses its `child` snippet, and reading that as "the abstraction fights the DOM"
inverts the decision above, which chose `child` as the normal path. Measured at v5's close:
five components import bits-ui and all five use `child` — fifteen sites — while the second
escape has been needed **zero** times. Ark's `asChild` would be used just as universally, since
what drives it is Fluent's specificity about element structure, not the library.

## Alternatives rejected

- **Ark UI** — actively maintained, `asChild` on every component, and it covers the three
  primitives bits-ui lacks. Rejected on Svelte-nativeness once its selector-convention
  advantage turned out to be worthless under ADR 0002. The three primitives are obtainable
  from Zag directly without adopting it.
- **Melt (next-gen)** — too small and volatile; missing Menu, Calendar and Checkbox.
- **`@melt-ui/svelte`, `svelte-headlessui`** — unmaintained.
- **Skeleton v5** — Tailwind-coupled design layer to be stripped before use.
- **shadcn-svelte** — bits-ui with recipes on top; not a separate base.
- **No library at all** — would mean reimplementing dismissable-layer stacking, typeahead and
  roving tabindex across fifteen-plus components for control we only need in a few of them.
  Kept as a per-component escape hatch instead.

## Downstream impact

v0 takes `bits-ui` and `@internationalized/date` as dependencies. The three Zag machines
arrive with their tranches in v4 onwards, not up front. TabView's arrow-key behaviour is a
from-scratch task in the Navigation tranche and gets the project's first `WD-NNN` entry.
Native Popover API and `<dialog>` are available as baseline, but CSS anchor positioning's
`@position-try` is not safely baseline in Safari, so anchored fallback positioning stays on
Floating UI, which bits-ui already depends on.
