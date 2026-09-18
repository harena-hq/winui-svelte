# 0002 — Svelte scoped CSS over a custom-property cascade; no Tailwind

## Context

The library must theme itself three ways (light, dark, high contrast), switch between them
live, and let a control's fill composite over whatever backdrop it lands on. That is a
cascade problem, and WinUI already solves it as one: a theme dictionary rebinds a named
resource, and every control referencing that name follows.

CSS custom properties are the same mechanism. Re-encoding a token cascade as utility classes
loses the indirection that makes the switch work — the utility names the value, where the
token names the _role_, and only the role survives a theme change.

The other constraint is the consumer. `packages/winui-svelte` is publishable, and a library
that requires the consumer to run Tailwind, configure a content glob, and import a preset has
made a build-tool choice on their behalf.

Tailwind 4 would still be reasonable inside `apps/gallery`, whose pages are ordinary layout.
It is declined there too, for a smaller reason: one styling idiom across the workspace means
a component and the page holding it are edited the same way, and the Gallery's page chrome is
not large enough for the utility layer to pay for a second idiom and a second build step.

## Decision

Every visual value lives in a `--winui-*` custom property, defined per theme on a root
attribute selector. Components style themselves with Svelte scoped `<style>` blocks that read
only those properties. No Tailwind, no CSS-in-JS, no runtime style injection, in either
package.

bits-ui-style primitives are styled through their `class` prop and their per-part `data-*`
attributes; state variants (`data-state`, `data-disabled`, `data-orientation`) are the
selectors, not extra classes.

## Status

Permanent for the library. The Gallery half is revisitable if its page chrome grows enough
to justify a second idiom — record it here if it does.

## Alternatives rejected

- **Tailwind 4 across the workspace** — its `@theme` block does map tokens to utilities, so
  this was close. It loses on the consumer-coupling argument, which applies to the library and
  not to the app, and on the fact that WinUI's stateful variants (rest / hover / pressed /
  disabled / focus, times three themes) read better as CSS state selectors than as utility
  strings inside a `class:` expression.
- **CSS-in-JS** — a runtime cost to solve scoping that Svelte already solves at compile time.
- **A single global stylesheet** — no scoping, and it makes tree-shaking a component's styles
  impossible.

## Downstream impact

Conformance gate C1 (no raw visual literals outside the token layer) is one automated form of
this decision. The other is split in two, which this entry originally stated as one. C6 is the
static half: the library's own source may not carry a Tailwind directive or a style
preprocessor, because a directive nothing expands reaches the consumer as CSS the browser
drops and every build on the way stays green. The bare Vite + Svelte consumer named here is
`pnpm smoke`, which packs the library, installs it outside this workspace and builds it in
one — measured on 2026-09-18 as the layer that caught TypeScript reaching a consumer when
the build, `publint` and every conformance gate did not, and as blind to the Tailwind case
C6 holds. Theme switching becomes an attribute flip on the
root element with no reload and no JS beyond setting it.
