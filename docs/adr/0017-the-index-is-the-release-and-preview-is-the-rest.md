# 0017 — The index is the release, and `preview` is the rest

## Context

D46 says the first release exports a subset of what is built: a component ships when it has been
polished, not when it was sealed, and not exporting is the one move that keeps a prop surface
editable once ADR 0009 has made a published one as unchangeable as a token name. D46 left the
subset to v18's naming unit, and that unit has now run.

Two facts about the package make "not exported" harder than deleting lines from `index.ts`.

- **The Gallery imports everything from the package root.** 160 of its files import from
  `'winui-svelte'`, 171 import statements in all, and between them they reach every one of the
  95 components the index exports, `Symbol`, and some of their types. Shrinking the root's
  exports to a release set breaks the Gallery, which D46 says is not a consumer under this rule
  but which does consume the package through its name.
- **Every built file is already reachable by path.** `package.json` maps `./*` and `./*.svelte`
  onto `dist`, so `winui-svelte/components/Slider.svelte` resolves today whether or not the
  index names `Slider`. Not exporting from the index cannot make a component unreachable; it can
  only say which reach carries a promise.

And one fact about the gates: C4, "every exported component is snapshotted in all three themes",
reads `index.ts`. D46's paragraph expected that to shrink C4's denominator on its own. Read that
way, the components the release holds back would leave the one gate that holds a component to a
three-theme baseline, while every one of them stays in the Gallery.

## Decision

**The release set is eighteen components**, plus `Symbol`, `SymbolName`, `VERSION` and the two
stylesheets:

`Button`, `ComboBox`, `ContentDialog`, `Expander`, `HyperlinkButton`, `InfoBar`,
`NavigationView`, `NavigationViewItem`, `ProgressBar`, `ProgressRing`, `ScrollView`,
`ScrollViewer`, `TabView`, `TeachingTip`, `TextBox`, `TitleBar`, `ToggleSwitch`, `ToolTip`.

Thirteen are what a desktop application's own hand-built UI would replace with this library,
chosen by reading such an application rather than guessed. Four more — `ToolTip`, `ScrollView`,
`ScrollViewer` and `HyperlinkButton` — are what the same reading found one step away: a
hover-revealed command that would want a label, a scrollbar an application leaves to the
browser, a link a screen would carry. `NavigationViewItem` is ADR 0015's: it decided the
item becomes public with `NavigationView` at this unit, because `menuItemTemplate` is written in
terms of it, and it is not in the index today. Each component ships with the types its own
module exports.

**`winui-svelte` is the release.** `index.ts` lists exactly that set, explicitly, and semantic
versioning applies to it and to nothing else.

**`winui-svelte/preview` is the rest.** A second entry, `preview.ts`, exports everything the
index exports — `VERSION`, `Symbol`, `SymbolName` and every type — and every other component a
consumer places, ninety-six in all, explicitly as the index does. It carries no stability
promise: a name in it may change shape or leave in any version. `package.json` maps `./preview`
beside `.`. Two of the library's ninety-eight component files are in neither entry:
`NavigationViewTopItem` and `CommandBarOverflowPresenter` are parts that `NavigationView`, and
`CommandBar` and `CommandBarFlyout`, render for themselves, and a consumer has no reason to place
either.

**A deep path carries no promise either.** `./*` and `./*.svelte` stay, because removing them
would break the Gallery's four deep imports — three of them into `internal/` — for no gain. The
package's README will say that only the root is versioned; today it says nothing is exported
beyond `VERSION`, which stopped being true long ago.

**The Gallery imports from `winui-svelte/preview`**, every one of its 171 statements, so the
release can narrow or widen without touching it.

**C4 reads `preview.ts`**, so every component a consumer places keeps its three-theme baseline
whether or not it is released, and it fails if the index exports a component `preview.ts` does
not. `NavigationViewItem` had no baseline of its own, so the implementing unit gave it one.

**`pnpm smoke` imports from both entries**: it places every one of the release's components from
the root and four held-back ones from `preview`, and a build that imports a held-back component
from the root fails. Placed means compiled, bundled and type-checked against the published
types, so a value of the wrong type fails; the browser bundle is never run, and most props
interfaces take any name, so a misspelled prop still passes.

**A component moves into the index by a recorded decision** — a row in `plan.md`'s table naming
it, with the reason. That is a review convention: no gate ties an index name to a row, and C4's
new check only ties the index to `preview.ts`.

## Status

Accepted, 2026-10-01. **Amends D46** twice. Its selection rule — a component ships when it has
been polished — becomes: the set starts from what a consumer's source would replace, and whether
what a member still owes blocks the release is the library gate's question. And its sentence that
C4 follows the exported set on its own is replaced by the C4 paragraph above. The implementing
unit is the split this record decides.

**Amended 2026-10-14**, recording what the index already held: the release also carries
`ScrollAnimation` and its `ScrollAnimationEasing` and `ScrollVector` types. They entered both
entries on 2026-10-03 with `ScrollView`'s `onScrollAnimationStarting`, which hands a
`ScrollAnimation` out and takes one back, so the animation a released prop's argument carries,
and the one a handler assigns in its place, are ones a consumer of the root can name. Like
`Symbol`, it is not a component, and the rule above for a component's move into the index does
not reach it; this paragraph is its record. The package README and changelog list it with the
rest.

## Alternatives rejected

- **Shrink the index and let C4 shrink with it**, as D46's paragraph expected. It costs the
  baseline gate seventy-eight components the Gallery still renders, and nothing replaces it.
- **Shrink the index and import the rest by deep path.** It rewrites the same 171 statements into
  one path per component, puts the package's file layout into the Gallery's source, and leaves C4
  with nothing to read for the components outside the index.
- **Name the set in the README and change no code.** It keeps every surface one import away from
  a consumer who did not read the README, which is the editability D46 exists to keep.

## Downstream impact

- **`plan.md`** records the set as D54, marks D46's paragraph as amended, and its library-gate
  section points here.
- **What the eighteen still owe is the library gate's to collect**, from the places it is already
  written: their `docs/divergences.md` entries, the rows naming them in each tranche's owed
  table that are not struck through, and the questions `docs/keyboard.md` lists without an
  observation. This record does not copy that list, because a second copy is one that drifts.
- **Two divergences named this unit as their trigger.** WD-089 waits on `NavigationViewTopItem`
  becoming public surface; it is a part neither entry exports, so the trigger has not fired.
  WD-093 waits on the naming unit reaching `AppBarButton` and `AppBarToggleButton` before a
  consumer holds them; both are in `preview`, which promises nothing, so narrowing the union is
  still free and the entry stands.
- **The library gate measures the index**, as D46 already says; C4's coverage is not what it
  measures.
