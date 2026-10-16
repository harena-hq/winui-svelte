# 0018 — The release's own glyphs fall back to Fluent UI System Icons

## Context

ADR 0003 references Segoe Fluent Icons by name and embeds nothing, because Microsoft's terms
for it allow it to be downloaded for design and development and not shipped to another
platform. Its Decision put "a redistributable set behind it for non-Windows viewers" and its
2026-10-16 amendment records that the set was never built. Off Windows, then, every icon the
library draws as whatever the browser substitutes, if anything.

The owner's pass before 0.1.0 asked for icons to appear off Windows without costing the
fidelity on it. Two kinds of icon are involved, and they are not the same problem:

- **The glyphs the release draws for itself.** The eighteen components the package root
  exports, and the ScrollBar part that ScrollView and ScrollViewer render, write eighteen
  Segoe Fluent Icons code points of their own: chevrons, the close and clear crosses, Add,
  the navigation button, Back, More, Settings, the four ScrollBar carets, and InfoBar's
  severity circle with the four symbols drawn over it. A consumer cannot change which glyph
  any of them is.
- **The glyphs a consumer chooses**, through a `glyph` prop. Any of Segoe's points can be
  named, and ADR 0012 already gives a consumer who wants something portable a snippet to
  draw instead.

Fluent UI System Icons (`microsoft/fluentui-system-icons`, on npm as `@fluentui/svg-icons`)
is Microsoft's own set in the same design language, MIT licensed. Its font assigns its icons
its own code points, not Segoe's — its names are like `chevron_down_16_regular` — and no
mapping between the two is published, so its own font placed in the stack would draw the wrong
icon or none.

## Decision

**The icon token names a third face after the two Segoe families,** `'winui-svelte icons'`.
CSS falls back per character: a glyph draws from the first family in the stack that has it.
Segoe Fluent Icons has all eighteen, so where it is installed the third face draws none of
them, and on the reference guest the stack draws the same pixels as Segoe Fluent Icons alone.
Where only MDL2 is, any of the eighteen it lacks would draw from the face; which those are was
not measured.

**The face holds the eighteen release glyphs, and a space,** each glyph at its Segoe code point,
drawn from a Fluent UI System Icons outline. `scripts/icons/fallback.mjs` is the table: the
code point, the Segoe name, the Fluent icon, and the Segoe glyph's ink box as the reference
guest measures it. Each outline is scaled without distortion to fit that box and centred in
it. InfoBar draws its severity icon as Segoe's circle with a symbol over it in another colour,
and Fluent draws the same pair as a filled circle with the symbol cut out of it, so the four
symbols are the cut-out subpaths of Fluent's `info`, `checkmark_circle`, `error_circle` and
`dismiss_circle`, placed with the circle's transform so they sit where Fluent put them.

**The face also holds an empty space**, at Segoe Fluent Icons' advance for one. CSS sizes a
line from its first available font, the first family whose `unicode-range` covers a space, so a
face of icons alone would leave the line to the browser's default text face, whose ascent and
descent are taller than Segoe's em. With the space, the face sizes an icon's line where both
Segoe families are absent, an em tall with the glyph on its baseline, as Segoe does. svg2ttf
writes a line gap of 9% of the span from ascent to descent, here the em, into the OS/2 table and
offers no option to change it, which would make that line 1.09em where a renderer reads those
metrics, as Chromium on Linux does, so the generator zeroes it in the built font.

A consumer's `glyph` is in the face only if it is one of the eighteen; any other code point
still draws whatever the browser substitutes, if anything. Covering all of Segoe's points would
need a mapping for each of some fifteen hundred icons, and most have no Fluent counterpart that
a table could name without choosing one. (The amendment below adds the points `Symbol` names.)

**The face is built, not drawn.** `pnpm icons:extract` copies the outlines the table names
from the installed `@fluentui/svg-icons` into `data/winui-icon-fallback.json`, which is
committed like every other record. The token generator builds a TrueType font from that
record with `svg2ttf`, at a fixed timestamp so the output does not change between runs, and
emits it in `tokens.css` as an `@font-face` with a base64 data URL and a `unicode-range` of the
eighteen points and the space. Conformance C2 regenerates it with the rest of the stylesheet.

**The font is inline rather than a file beside the stylesheet.** About six kilobytes of
base64 reach every consumer of `tokens.css`, the Windows ones included, who never draw from
it. A file would cost them nothing, since a `unicode-range` face is fetched only when a
character it covers falls through the families before it, but it would be the package's first
asset a consumer's bundler has to resolve from inside a stylesheet, and its first binary in the
tree, which C2's text comparison cannot check. A consumer whose Content Security Policy leaves
`data:` out of `font-src`, or out of `default-src` where it has no `font-src`, gets no fallback
face, and the icons draw as they did before.

## Status

Accepted, 2026-10-16. **Amends ADR 0003**, whose redistributable set this is for the glyphs
the release draws itself. ADR 0003's reference by name stands, and nothing of Segoe is
embedded.

**Amended 2026-10-16: the face also holds every glyph `Symbol` names.** The owner's pass found
the Gallery's navigation icons blank off Windows, and asked whether an icon component that
writes each font's own code for a name, as Font Awesome does, would serve better. It would not
remove the table: a name has to be paired with a Segoe point and a Fluent icon either way, and a
component choosing between fonts at run time has to ask whether Segoe is installed, which CSS
cannot and a script answers only after the first paint. The package already exports names, in
`Symbol`, the release's copy of WinUI's `Symbol` enum, whose 197 members draw 196 Segoe points
(`Favorite` and `OutlineStar` share one). So the table's bound moves from what the release
draws to what the release names: `scripts/icons/fallback.mjs` gains a row for each of the
`Symbol` points the eighteen did not have, 189 of them, 207 rows in all, and `font.mjs` fails
the build if a member's point has no row. A `glyph` that `Symbol` does not name still draws
whatever the browser substitutes.

These rows' Fluent icons were chosen by eye, each against the Segoe glyph drawn on the reference
guest, and are the same idea in Fluent's drawing rather than always the same picture:
`Directions` is Fluent's road sign where Segoe draws an arrow, `Scan` an aperture where Segoe
draws a flatbed. Each is fitted to the Segoe glyph's measured box as before. One point is not in
the reference guest's Segoe Fluent Icons at all: `Target` is F5F0 in WinUI's table, and the
browser draws a missing-glyph box for it there, so the stack draws the face's target on Windows
too; that row borrows `Clock`'s box and is marked `absent`, and the spec checks both that Segoe
lacks it and that the stack draws the face. Fluent SVGs drawn as several paths are joined into
one outline, each made absolute first. The SVG paints several paths as a union and the font
fills one outline by nonzero winding, which differ where one path overlaps another wound the
other way; the three joined today draw the same pixels both ways, bar antialiasing at their
edges, and a new one is checked by eye in the overlay a row is chosen against.

The font grows from 4.5 to about 49 kilobytes, about 66 of base64, and `tokens.css` from 541
to 603. The inline decision below stands on the same argument at that size: the cost to a
Windows consumer is a tenth more of a stylesheet already over half a megabyte, against a
bundler asset in every consumer's build.

**Amended again 2026-10-16: the drawn rows are every component's, and C19 holds them.** The
owner's pass on macOS found the Gallery's copy button taller than it is wide. Its success
glyph, hidden until a copy, is U+E73E, which had no row, so it was laid out in a substitute
face whose line is taller than an em. U+E73E is also CheckBox's check, and CheckBox is preview,
outside what the release draws. Reading every component's source found 22 points with no row:
CheckBox's check and indeterminate dash, MenuFlyout's check, radio bullet and sub-item chevron,
the chevrons of DropDownButton, SplitButton and TreeViewItem, PipsPager's dots, PasswordBox's
reveal glyph, SemanticZoom's zoom-out bar, and thirteen MediaTransportControls commands. A
preview component ships in the same package, and drawing nothing off Windows is the same
defect there. So `DRAWN` becomes every point a component in the package writes for itself,
`Symbol` names or not: the 22, chosen and fitted as the amendment above describes, and the
seven `Symbol` points that preview components draw, moved over from the `Symbol` rows, join the
eighteen for 47 rows, 229 in all.
Three of the 22, U+E0B8, U+E627 and U+E628, are in neither of Microsoft's published lists for
Segoe Fluent Icons and Segoe MDL2 Assets, and their rows are named for what draws them.
Conformance C19 reads the components' sources, with comments removed, and the generated tokens,
and fails on a private-use point that is not a `DRAWN` row and on a `DRAWN` row no component
draws. The font
grows to about 53 kilobytes, 71 of base64, and `tokens.css` to 608.

## Alternatives rejected

- **The Fluent font as it ships, after Segoe in the stack.** Its code points are not Segoe's,
  so a Segoe point would draw an unrelated icon or none.
- **Drawing the icons as SVG in the components.** CSS cannot ask whether a font is installed,
  so the SVG would replace Segoe on Windows too, and the fidelity there is the bar.
- **Uno Platform's Fluent and MDL2 replacement fonts, or a community remapping.** Each claims
  Segoe's code points, but they draw from several sets under different licences, and whether
  any glyph was traced from Segoe is not stated. A set of Microsoft's own, MIT licensed,
  needs no such question answered.
- **Redrawing the glyphs**, which ADR 0003 also rejected. Eighteen fitted outlines from a set
  in the same design language need no drawing.

## Downstream impact

- **NOTICE.md**, the package's and the repository's, carries the Fluent UI System Icons
  licence, as `tokens.css` now distributes outlines from it.
- **The package README and changelog** say what draws off Windows and what does not.
- **`tests/visual/icon-fallback.spec.ts`** draws each of the table's rows, 229 since the
  amendments, from the token's stack, from Segoe alone, from the face alone and from an absent
  family, and compares the pixels: on the reference guest the stack must draw Segoe and the face
  something else, except for a row marked `absent`, whose point Segoe must lack and the stack
  draw from the face, and every other row's point must be one Segoe has, an em wide; elsewhere
  the stack must draw the face. It checks each fitted glyph's ink against its Segoe box, each
  InfoBar symbol's against its circle and the Segoe symbol's centre, and that a 16px icon's line
  box is 16px, as Segoe Fluent Icons' is on the reference guest. The gate runs on the reference
  guest, so it compares the stack with Segoe; the comparison of the stack with the face runs on
  the local lane, where Segoe is absent.
- **A component that starts drawing a new glyph of its own** owes the table a row, or it draws
  nothing off Windows. Since the second amendment, C19 fails until it has one, and fails on a
  row no component draws any more. A `Symbol` member is tied the same way: `font.mjs` fails
  the build when one's point has no row.
