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

**`Symbol` is not carried.** Its name-to-code-point pairs are in the Windows SDK and in none of
the three pinned upstreams, so shipping them would be a transcription of the kind ADR 0001 and
ADR 0007 exist to refuse — and a wrong pair would be invisible, because a wrong glyph is still
a glyph. A symbol name is written as the code point it names, read from the reference.

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
  admits every one of these shapes without the library owning any of them.
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
