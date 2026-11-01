# 0006 — Token names keep the WinUI key verbatim

## Context

Every extracted resource has to become a CSS custom property, and the name is the library's
widest public surface: a consumer writes `var(--winui-…)` and a component author reads it back.
Once shipped it cannot be changed without breaking everyone.

Two shapes were available. Kebab-case is the CSS convention —
`--winui-control-fill-color-default`. Verbatim keeps the source name —
`--winui-ControlFillColorDefault`.

Kebab-case is not free. The transform is lossy at the edges: `ControlAAStrokeColorDefault`
has no obvious kebab form, and a rule that produces `control-a-a-stroke-color-default` is
neither guessable nor reversible. Every consumer then holds two names for one thing — the one
Microsoft's documentation uses and the one we emit — and translates between them by hand. A
mistranslation is silent: `var(--winui-control-fill-colour-default)` resolves to nothing and
the declaration is simply dropped.

Microsoft's own web implementation of this design language does not kebab-case either.
Fluent 2's tokens ship as `--colorNeutralBackground1`, source casing preserved.

## Decision

A token's name is `--winui-` followed by the WinUI resource key, unchanged:
`--winui-ControlFillColorDefault`, `--winui-BodyTextBlockFontSize`,
`--winui-ControlCornerRadius`.

Custom property names are case-sensitive, so this is well defined. The prefix is the only
thing added, and it exists so a consumer's own properties cannot collide with ours.

## Status

Permanent. Changing it later is a breaking change to every consumer.

**Amended by ADR 0021**, 2026-11-01: `FallbackFontFamily`, `SmallFontFamily` and
`DisplayFontFamily` are this library's names, as WinUI has no key for what they hold.

## Alternatives rejected

- **Kebab-case.** CSS-idiomatic, and it buys a permanent translation step between our names
  and the documentation everyone will read. The acronym cases have no good answer.
- **Kebab-case with an exceptions table.** Now there are two rules and a list, and the list is
  the thing nobody remembers.
- **No prefix.** `--ControlFillColorDefault` reads as though it belongs to the page rather than
  to a library, and collides with a consumer's own naming.

## Downstream impact

Grepping the WinUI source for a token name finds our emission of it, and grepping ours finds
the XAML. That is worth more here than convention, because this project's every question is
"what does WinUI do with this exact resource".
