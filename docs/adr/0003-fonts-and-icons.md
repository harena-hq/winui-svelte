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

- Text: `"Segoe UI Variable Small"` / `"Segoe UI Variable Text"` /
  `"Segoe UI Variable Display"` per ramp step, then `"Segoe UI"`, then a neutral
  sans-serif fallback. Optical size follows WinUI's mapping — Small for Caption, Text for
  Body through Body Large, Display for Subtitle and above.

  **`"Segoe UI Variable"` without an optical-size suffix is not a family name.** Measured
  on the reference guest: it renders at exactly the fallback width, identical to a name
  invented to be absent. Only the three suffixed families are registered, so an
  unsuffixed entry in a stack is inert — and worse than inert, because it reads as a
  working fallback step. `tests/visual/fonts.spec.ts` fails if any of the families the
  token layer names stops resolving.

  **The suffix itself is not portable, which is the same finding on a second platform.**
  Microsoft's design-downloads page — the one this ADR already cites for the EULA — ships
  the same font file for macOS, and Font Book registers it as `"Segoe UI Variable Static
Small"` / `"Static Text"` / `"Static Display"`, not the Windows names. A stack written
  for one platform is silently inert on the other; this project makes no attempt to
  reconcile them, because doing so would mean carrying a second family-name table for a
  platform outside the acceptance environment, or worse, adding the macOS names to the
  Windows stack and quietly widening what a Windows user's browser is allowed to
  substitute. Measured 2026-09-03, reported from a contributor's own machine, not the
  reference guest — recorded here because it is exactly the shape of trap this ADR warns
  about, arriving from an unplanned direction.

- Icons: `"Segoe Fluent Icons"` first, with a redistributable set behind it for non-Windows
  viewers. Glyphs are addressed by their WinUI codepoint.

The type ramp's sizes are encoded as tokens — Caption 12, Body 14, Body Large 18, Subtitle 20,
Title 28, Title Large 40, Display 68 — so a fallback face inherits correct metrics even when it
inherits the wrong shapes. **The line heights this paragraph used to pair with them — 16, 20,
24, 28, 36, 52, 92 — are superseded by ADR 0011**, which found that no ramp `Style` sets
`LineHeight` and that the control draws the font's own spacing instead.

## Status

Permanent for the Windows-11 target. If the project ever needs to look right off Windows,
that is a new decision and belongs in its own ADR.

**Superseded in part by ADR 0011.** The line heights this ADR paired with the ramp's sizes came
from Microsoft's published type ramp, which the pinned dictionary does not carry and the shipped
control does not implement. The sizes stand and the families stand. What the ramp classes now
emit is `line-height: normal` — the spacing of whichever face resolves, computed by the browser.
That changes what this ADR's argument buys off Windows: the ramp used to impose Segoe's metrics
on a substituted face, and now a substituted face keeps its own. Neither is the reference, and
open question O1 is where that is tracked.

**Amended 2026-10-16.** The icon stack is WinUI's own, `Segoe Fluent Icons` then `Segoe MDL2
Assets`, as `data/winui-framework.json` defines `SymbolThemeFontFamily` in all three themes,
and the token generator fails if the two drift apart. The token had named the first family
alone. WinUI draws from MDL2 where Fluent is absent, as it is on a default Windows 10 install;
that was not measured here, as the reference guest is Windows 11, where both resolve. MDL2
also ships with Windows and is referenced by name the same way, never embedded. The
redistributable set the Decision puts behind them was never built: off Windows, no Segoe glyph
resolves, and an icon draws as whatever the browser substitutes, if anything.

**Amended by ADR 0018**, the same day, which builds that set for the eighteen glyphs the
release's own components draw, from Fluent UI System Icons, and by its amendment for the
glyphs `Symbol` names. A consumer's other glyphs are still not in it.

## Alternatives rejected

- **Embedding the fonts as webfonts** — prohibited by their EULA.
- **Fluent System Icons as the only icon source** — MIT and safe, but not glyph-identical to
  what the real Gallery renders, so it would introduce a visible difference on the machine
  where fidelity is judged.
- **Redrawing the WinUI glyphs as SVG** — fully ours to redistribute and a real option later
  if off-Windows fidelity matters, but it is weeks of drawing to solve a problem the target
  environment does not have.

## How the claim is checked

`document.fonts.check()` cannot answer this. It reports whether text _could be rendered_,
not whether a family exists, and returns `true` for a name invented on the spot. The test
measures a glyph run's advance width against such a name instead: a family that resolves
renders at a different width than the fallback does.

## Downstream impact

Open question O1 (what snapshots do about the missing font) exists because of this decision,
and the answer cannot be "install the font in CI" — that is the redistribution this ADR
avoids. The Gallery's Iconography page needs a codepoint table, which comes from Microsoft's
Segoe Fluent Icons documentation rather than from the font file.
