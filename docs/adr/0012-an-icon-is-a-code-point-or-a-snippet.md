# 0012 — An icon prop is a code point or a snippet

## Context

ADR 0009 fixed how a WinUI member becomes a Svelte prop: the member name, camelCased, with a
leading `Is`, `Has` or `Can` dropped. It allows exactly one class of departure — "where HTML
already has the attribute, HTML wins" — and it declares that set **closed**, listing it: the
HTML attribute vocabulary, `disabled`, `readonly`, `required`, `checked`, `open`, `hidden`,
`value`, `placeholder`, `name`, `form`.

Three sealed components already carry a prop in neither set. `MenuFlyout`,
`NavigationView` and `TeachingTip` each take `glyph` — a Segoe Fluent Icons code point as
uppercase hex — and `Glyph` is not a member of any of those three controls. It is `FontIcon`'s.
Nothing recorded the departure, so ADR 0009 has been describing a rule the library does not
follow since the first of them shipped.

v7 forces the question rather than creating it. `AppBarButton.Icon` and
`AppBarToggleButton.Icon` are the tranche's central surface, and the Gallery spends most of
both pages' examples on which kind of `IconElement` an icon is.

## What the Gallery's examples actually are

Read rather than assumed, because assuming them is what produced the wrong answer first.

| example                              | how it is written                                          |
| ------------------------------------ | ---------------------------------------------------------- |
| `Icon="Like"`, `Icon="Add"`          | a `Symbol` enum value, not a code point                    |
| `<BitmapIcon UriSource="…"/>`        | a bitmap in `.Icon`                                        |
| `<FontIcon FontFamily="Candara" …/>` | U+03A3 in a **text** font, in `.Icon`                      |
| `<PathIcon Data="…"/>`               | a geometry in `.Content`, inside a `Viewbox` — not `.Icon` |

The third row is the one that settles it. The Gallery chose a Greek sigma in Candara precisely
to demonstrate that a `FontIcon` need not be the icon font, so `glyph` — typed as a Segoe
Fluent Icons code point — expresses none of these four as written, including the one a reader
would assume it covered.

The fourth row is not an icon prop's problem at all. ADR 0009 already routes a
`ContentProperty` to `children`.

## Decision

**`icon` is the prop, and it is a `Snippet`.** The member is `Icon`, of type `IconElement`; an
element-valued member is content, and ADR 0009's "content is snippets — a named content member
is a snippet prop under the mapped name" already governs it. This is not an exception. It is
ADR 0009 applied, and it reproduces every icon kind as written, because the consumer draws it.

**`glyph` is a recorded shorthand, and it is the exception.** It takes a Segoe Fluent Icons
code point as uppercase hex and renders the `FontIcon` that names it. It is kept because it is
what the containing controls use rather than what the icon pages demonstrate: CommandBar's page
writes `Icon="Add"`, `Icon="Edit"`, `Icon="Share"`, `Icon="Setting"`, and a menu row's icon is
a code point far more often than it is a bitmap. Requiring a five-line snippet for one glyph
would be ceremony the calling code pays on every row.

**Where both are given, `icon` wins**, because it is the general case and the shorthand is the
narrowing.

**The rule reaches item-data fields as well as component props.** Two of the three existing
sites are fields on a data object — `MenuFlyout`'s five entry types and
`NavigationViewItemData` — not props on a component. The distinction does not change what an
icon is, and a rule that held for `AppBarButton` but not for the menu that `AppBarButton` opens
would be worse than either rule alone.

**`Symbol` is not carried.** ~~Its name-to-code-point pairs are in the Windows SDK and in none
of the three pinned upstreams, so shipping them would be a transcription of the kind ADR 0001
and ADR 0007 exist to refuse — and a wrong pair would be invisible, because a wrong glyph is
still a glyph. A symbol name is written as the code point it names, read from the reference.~~
**Amended while planning v14 — see "The amendment" below.** The premise is false: the pairs are
in the control pin.

## Status

Accepted. **Amends ADR 0009**, whose exception set was declared closed and is hereby reopened
once, for `glyph`, on the terms above. ADR 0009's naming rule is otherwise unchanged, and
`icon` follows it.

The three sealed components carry `glyph` and not `icon`. `MenuFlyout` gains `icon` in the unit
that builds MenuBar, which needs it; `NavigationView` and `TeachingTip` are owed it and are
recorded in the plan's v7 entry rather than left to be rediscovered.

## Alternatives rejected

- **`glyph` alone, and the other icon kinds become deferrals.** The cheapest and the most
  consistent with what is already shipped. Rejected because three of AppBarButton's four
  icon-kind examples and three of AppBarToggleButton's four would be unbuildable, on pages the
  acceptance gate compares one by one — half a page of empty examples to avoid one prop.
- **A component family — `FontIcon`, `SymbolIcon`, `PathIcon`, `BitmapIcon`, `ImageIcon`.**
  The faithful reproduction, and it closes the Gallery's own `IconElement` page. Rejected for
  `SymbolIcon`, which cannot be built honestly without the enum, and because a snippet already
  admits every one of these shapes without the library owning any of them. **Half of that
  reason has since gone** — the enum's contents are in the pin — and the other half has not: a
  snippet still admits every shape. The family stays rejected on the surviving half, and the
  amendment below says what changes instead.
- **Dropping `glyph` and making every icon a snippet.** Internally consistent and needs no
  amendment to ADR 0009. Rejected on the call site: `MenuFlyout` alone would turn five entry
  types' one-string field into a snippet per row, and the strings it replaces are what the
  original's own markup writes.

## How the claim is checked

It is not, by a gate, and the reason is the one the plan already gave for the portalled-ramp
rule in v4. A gate could require that a component exposing both renders `icon` first, but
identifying which element is the icon is a parse of the template rather than a grep, and a gate
that gets it wrong either passes what it should catch or blocks a correct component. The
precedence is one branch at each site, it is stated here, and it is read by whoever writes the
next one.

What is checked is narrower and already automatic: C1 keeps a code point out of a raw literal
where it would be a visual value, and C4 photographs each component in three themes, so an icon
that stops rendering fails a baseline.

## Downstream impact

Two new components take both props in v7. Three sealed ones take `icon` on the schedule above.
Every later control with an `IconElement` member — `BreadcrumbBar`, `TabView`, the Collections
tranche's item templates — is written to this rule rather than deciding it again.

---

## The amendment — `Symbol` is carried, as a record generated from the pin

Added while planning v14, whose `IconElement` page writes `<SymbolIcon Symbol="Accept"/>` and
whose `AnimatedIcon` page writes `<SymbolIconSource Symbol="Find"/>`.

### What was wrong

The decision above rests on one factual claim — that the name-to-code-point pairs "are in the
Windows SDK and in none of the three pinned upstreams". They are in the control pin.
`CSymbolIcon::ConvertSymbolValueToGlyph`, at
`.upstream/microsoft-ui-xaml/dxaml/xcp/core/core/elements/icon.cpp:461-667`, is a switch of
**197 cases**. Each maps a legacy Segoe UI Symbol code point — the enum's own numeric value —
to the Segoe Fluent Icons code point WinUI actually renders, and carries the member's name in
a trailing comment:

```cpp
case 0xE10B: return static_cast<WCHAR>(0xE8FB); // Accept
```

The comment above the switch gives the reason for the remapping: the E0 to E5 prefix range
"collides" with characters some font sets program there, so the enum's own values are marked
legacy and the recommended points live at E7 and above. That remapping is itself something a
reproduction needs and could not have invented — writing `Symbol="Accept"` as `0xE10B`, the
enum's literal value, would draw the wrong glyph or none.

Two pairs collide by design: `Favorite` (`0xE113`) and `OutlineStar` (`0xE1CE`) both render
`0xE734`. **Five** cases return their own value unchanged, and they are not one thing:
`GlobalNavigationButton` (`0xE700`), `Share` (`0xE72D`), `Print` (`0xE749`) and
`XboxOneConsole` (`0xE990`) already sit at or above E7 and so have nothing to remap, while
`Placeholder` (`0xE18A`) is a legacy point the switch deliberately leaves where it is.
Anything not in the switch falls through unchanged, which is the enum's escape hatch for a
raw code point. **The "one case" this paragraph used to claim was itself a read narrower
than the claim** — the same failure the lesson below is about, committed inside the
correction of it.

### What changes

**The table is carried, and it is generated, not transcribed.** A script under `scripts/`
parses the switch out of the pinned `icon.cpp` and writes `data/` a record of name to rendered
code point, the way `scripts/tokens/` writes `tokens.css` and `scripts/gallery/` writes the
shell and samples records. C8 re-derives it from the pin and fails if it drifts, so it can
never be hand-edited — which is the whole of what ADR 0001 and ADR 0007 were protecting, and
they protect it here by the same mechanism rather than by refusal.

The original objection — "a wrong pair would be invisible, because a wrong glyph is still a
glyph" — is met by the same mechanism and is why generation rather than transcription is the
condition of carrying it at all.

The pin contains three statements of this table: the switch in `icon.cpp`, `enum class Symbol`
in `dxaml/xcp/components/metadata/inc/EnumDefs.g.h`, and the design note at
`docs/design-notes/symbol-enum-spec.md`. The extractor reads all three and emits nothing when
they disagree, so a wrong pair is a failed extraction rather than an invisible glyph. The switch
is authoritative because it is the rendering code; the other two are witnesses, and the design
note is the only second witness to the rendered point, which is why the sparse checkout includes
it. Order is intentionally not compared: the enum is ordered by value while the switch and note
are alphabetical.

**No prop is added, and ADR 0009's exception set stays closed at `glyph`.** The record is
exported as a lookup, so a call site writes `glyph={Symbol.Accept}` and hands `glyph` the same
uppercase-hex string it has always taken. This is deliberate: `glyph` taking either a name or a
code point would put two grammars under one prop, which is exactly what v11's `Thickness` rule
refuses, and a member name that happened to be four hex characters would be ambiguous with no
way to tell.

**`icon` and `glyph` are unchanged**, and so is the precedence between them.

### Why this is an amendment and not a reinterpretation

The rejected alternative above was rejected on this ground, in these words. A reader who found
the pin's switch and then found this ADR would have to decide whether the decision survived its
reason, and that is the question an ADR exists to have already answered.

**And the lesson is not this ADR's.** This is the third claim of the form "not in any pin" that
this project has recorded about something a pin holds — after the two resources v13 found in
the framework dictionary, and the drop-shadow recipe v14's planning found one directory outside
the sparse checkout. Each time the claim was written from a search narrower than the claim, and
each time nothing in the artifact recorded how wide the search had been. **A negative finding
about a pin is worth only as much as the search behind it, so record the search.**

### Status of the amendment

Accepted. `Symbol` is carried as a generated record in v14's unit 7; the IconElement page is
unit 8 and consumes it. D25's row is unchanged — an icon is still a snippet with a code point
as its shorthand — and D36 records the table.
