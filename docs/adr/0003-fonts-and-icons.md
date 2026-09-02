# 0003 — Fonts and icons are referenced from the local system, never embedded

## Context

WinUI 3 renders text in **Segoe UI Variable** and glyphs in **Segoe Fluent Icons**. Both ship
with Windows 11 and both carry a Microsoft font EULA that forbids redistribution and web
embedding. Microsoft's own iconography page says the font may be downloaded for design and
development but not shipped to another platform.

Read as "we cannot ship the font", that is a ceiling on fidelity. It is not one here, because
the acceptance environment is Windows 11 and the acceptance environment already has the
fonts. CSS resolves a family by name against installed fonts; naming `Segoe UI Variable Text`
in a stack is a reference, not a redistribution, and it renders identically to the real app on
the machine where fidelity is being judged.

The cost lands elsewhere instead. Off Windows — including the Linux machine this is developed
on — the reference does not resolve, so every screenshot taken in CI shows a substitute face.
That makes the automated snapshot suite an answer about regression and not about fidelity,
which it was going to be anyway.

Fluent System Icons (`@fluentui/react-icons`, MIT) is redistributable and looks similar, but
is an independently maintained set with no guarantee of codepoint parity with Segoe Fluent
Icons. It is a fallback, not a replacement.

## Decision

Reference by name; embed nothing.

- Text: `"Segoe UI Variable Text"`, `"Segoe UI Variable"`, `"Segoe UI"`, then a neutral
  sans-serif fallback. Optical size follows WinUI's mapping — Small for Caption, Text for
  Body through Body Large, Display for Subtitle and above.
- Icons: `"Segoe Fluent Icons"` first, with a redistributable set behind it for non-Windows
  viewers. Glyphs are addressed by their WinUI codepoint.

The type ramp is encoded as tokens — Caption 12/16, Body 14/20, Body Large 18/24, Subtitle
20/28, Title 28/36, Title Large 40/52, Display 68/92 — so a fallback face inherits correct
metrics even when it inherits the wrong shapes.

## Status

Permanent for the Windows-11 target. If the project ever needs to look right off Windows,
that is a new decision and belongs in its own ADR.

## Alternatives rejected

- **Embedding the fonts as webfonts** — prohibited by their EULA.
- **Fluent System Icons as the only icon source** — MIT and safe, but not glyph-identical to
  what the real Gallery renders, so it would introduce a visible difference on the machine
  where fidelity is judged.
- **Redrawing the WinUI glyphs as SVG** — fully ours to redistribute and a real option later
  if off-Windows fidelity matters, but it is weeks of drawing to solve a problem the target
  environment does not have.

## Downstream impact

Open question O1 (what snapshots do about the missing font) exists because of this decision,
and the answer cannot be "install the font in CI" — that is the redistribution this ADR
avoids. The Gallery's Iconography page needs a codepoint table, which comes from Microsoft's
Segoe Fluent Icons documentation rather than from the font file.
