# 0019 — Text off Windows keeps Segoe's line metrics

## Context

ADR 0003 names Segoe UI Variable and Segoe UI in every text stack and embeds neither, so off
Windows a stack falls through to `sans-serif`. ADR 0011 then made every line box the font's own
`normal`, which is Segoe's where Segoe resolves and, everywhere else, whatever face the machine
substitutes: it recorded that as self-consistent and not the reference, and left it there.

The owner's pass on macOS found what that costs. On the Gallery's Button page, the "Disable
button" CheckBox drew its label above the middle of its box. A CheckBox places its label from
the top, `VerticalContentAlignment="Top"` with the control's padding as its margin, so where
the label sits depends on how tall its line is. At 14px Segoe UI Variable Text draws a 19px line
with the baseline 15px down, which puts the label's middle 1.5px above the box's, as WinUI
draws it. On the Linux machine this is developed on, `sans-serif` is DejaVu Sans and draws 16,
which puts it 3px above, twice as far. Every control that places a single line from the top of
its box draws the same displacement, and every control sized from its text draws a different
size. Which browser the owner used on macOS was not recorded.

## Decision

**Every text stack names a face after the two Segoe families,** `'winui-svelte text'`, before
`sans-serif`. It is a font the system already has, named by `local()` and embedded nowhere,
with Segoe UI Variable's vertical metrics laid over its own by the `ascent-override`,
`descent-override` and `line-gap-override` descriptors: `hhea` ascender 2210 and descender 514
over 2048 units with no line gap, as ADR 0011 records them, so 107.91015625%, 25.09765625% and
0%. A line box and the baseline in it are then where Segoe puts them, and only the shapes and
the advances are another font's.

**The face is four `@font-face` rules,** regular for weights 1 to 500 and bold for 501 to 1000,
each upright and italic, so that the weights the ramp and the components ask for, 350, 400,
600 and 700, and italic text each draw a real face rather than one the browser synthesizes.
Each names the same families, by full name and by PostScript name, as `local()` matches
either: Arial, which Windows and macOS both install, Helvetica Neue, which macOS does, then
Liberation Sans, Arimo and DejaVu Sans, one of which most Linux distributions do. Arial is
first because macOS installs it by default, as Linux machines with the core fonts do, so the
substitute is one font wherever it can be; the Linux machine this is developed on has no
Arial and draws Liberation Sans, where `sans-serif` drew DejaVu Sans. A rule none of whose
fonts is installed fails to load, and text asking for it falls through to `sans-serif` and
that font's own line, so a system with a regular face and no bold one draws the two weights in
different line boxes. `TEXT_FACE` in `scripts/tokens/manifest.mjs` is the definition, the
token generator emits it at the top of `tokens.css` after the icon face, and it fails if a text
stack in `PLATFORM_FONTS` stops ending in the face and `sans-serif`; the type ramp's stacks are
built from the same name.

**On Windows nothing changes for a character either Segoe family has.** CSS falls back per
character, so the face draws only a character neither has: such a character reaches the face
first now, and where Arial has it, draws with Segoe's metrics where it had Arial's own, while
one Arial lacks goes on to `sans-serif` as before. The reference guest
draws the stack and Segoe UI Variable Text alone the same: the same line box, baseline and
advance at 400, 600 and italic, and the tracked baselines, which are taken there, are
unchanged.

**Where the descriptors are not supported the face draws with its own metrics,** which are now
Arial's where they were the system sans-serif's. Chromium supports them, measured on both
lanes here: on the reference guest the face alone, Arial there, draws the 19px line with the
baseline 15px down too. A report from November 2024 (phpied.com, "@supports and @font-face
troubles"), found when this was written, says Safari did not; neither Safari nor Firefox was
measured here. Where Safari still does not, the CheckBox's label stays where the substitute's
line puts it, and the owner's case is fixed only if the owner's browser was not Safari.

## Status

Accepted, 2026-10-16. **Amends ADR 0003**, whose stacks gain the face before `sans-serif`; its
reference by name stands, and nothing is embedded. **Amends ADR 0011** off Windows only: the line
height is still `normal`, and `normal` is now computed from Segoe's metrics there too, wherever
the descriptors are supported.

## Alternatives rejected

- **An explicit `line-height` on the stacks or the ramp.** ADR 0011 measured that the original
  draws the font's own spacing and reverted a pinned metric for taking 0.379px off every
  single-line box; anything set here would apply on Windows too, where fidelity is the bar.
- **A `@font-face` named `Segoe UI` over a local font.** A face a stylesheet defines takes
  precedence over an installed family of the same name, so it would replace Segoe on Windows.
- **Embedding a metric-compatible webfont.** It would add the package's first text font, and a
  licence, to every consumer, the Windows ones included, for shapes that are not Segoe's either.
- **Leaving it, as ADR 0011 did.** The owner's pass found the result.

## Downstream impact

- **`tests/visual/text-face.spec.ts`** draws Body-sized text from the stack at 400, 600 and 400
  italic and requires a 19px line box with the baseline 15px down on both lanes. On the
  reference guest the stack must draw what Segoe UI Variable Text draws alone, at each of the
  three, and differ from the face, and the face alone must draw the same line box and baseline;
  on the local lane all four rules must have loaded, the stack must draw the face, and a family
  installed nowhere must draw a different line.
- **Text in the Gallery that names a family of its own** rather than a token keeps the line of
  whatever that family resolves to off Windows; this decision reaches only the stacks the tokens and the type
  ramp write. Among the samples are the TextBox page's transcribed `Arial` and the ComboBox
  page's font picker, and code faces such as Consolas and `monospace` are in the page frame,
  several pages and the `dev/` fixtures. `font-family` and `fontFamily` across
  `apps/gallery/src` find them.
- **A consumer's Content Security Policy** needs nothing for this: `local()` fetches nothing.
- **The package README and changelog** say what text draws off Windows.
