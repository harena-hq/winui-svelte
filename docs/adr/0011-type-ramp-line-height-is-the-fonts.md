# 0011 — The type ramp's line height is the font's, not the published ramp's

## Context

ADR 0003 encoded the Windows type ramp as seven size/line-height pairs — Caption 12/16, Body
14/20, Body Large 18/24, Subtitle 20/28, Title 28/36, Title Large 40/52, Display 68/92 — and
`TYPE_RAMP` carried the second number of each pair so the generated ramp classes could emit a
`line-height`. The argument was that a fallback face should inherit correct metrics even when it
inherits the wrong shapes.

The numbers came from Microsoft's published type ramp. They are not in the pinned dictionary.
`controls/dev/CommonStyles/TextBlock_themeresources.xaml` contains no `LineHeight` at all. Across
`controls/dev` the word appears eighteen times in XAML, six of which are the value inside
`LineStackingStrategy="BlockLineHeight"` rather than a line height being set. The twelve real ones
are three distinct sites doubled: InkToolbar's three, which appear under both `CommonStyles/` and
`InkToolbar/`, and BreadcrumbBar's two and ComboBox's header presenter's one, each of which the
pin carries again in a `_perf2026` copy. None is a ramp `Style`.
A `TextBlock` with no `LineHeight` draws the font's own spacing, so the ten ramp styles draw
something the published table does not describe.

Eighteen of the twenty-three exported components carried a `line-height` override written to
escape that. The other side of that number is what makes this a defect rather than a nuisance:
`ComboBox` puts `winui-BodyTextBlockStyle` on its root and its popup, `TitleBar` puts
`winui-CaptionTextBlockStyle` on its title, `NavigationView` puts `winui-BodyStrongTextBlockStyle`
on its item headers and `Slider` puts the Body class on its root, none of them overrides anything,
and all four have been drawing text at a line height the original does not use. The override was
not containing the debt. It was being paid one control at a time, by whichever control had been
measured against the original closely enough to notice.

## What the font says

`SegUIVar.ttf` — one variable font with `wght` and `opsz` axes, from which Windows registers
Small, Text and Display as three families.

|                                       |                 |
| ------------------------------------- | --------------- |
| `head.unitsPerEm`                     | 2048            |
| `hhea` ascender / descender / lineGap | 2210 / −514 / 0 |
| `OS/2.fsSelection` USE_TYPO_METRICS   | clear           |
| `MVAR` value records                  | `xhgt` only     |

USE_TYPO_METRICS being clear puts the hhea metrics in force rather than the sTypo ones. `MVAR`
varying only `xhgt` makes the three optical faces share these vertical metrics, so the spacing is
a function of size alone and not of which face a step names.

Natural line spacing = (2210 + 514 + 0) / 2048 = **1.330078125** of the font size. `segoeui.ttf`,
the next family in every stack the ramp emits, carries the identical 2210 / −514 / 0 over 2048, so
a fallback does not move the line box.

| size                 | 12    | 14    | 18    | 20    | 28    | 40    | 68    |
| -------------------- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| the font's spacing   | 15.96 | 18.62 | 23.94 | 26.60 | 37.24 | 53.20 | 90.45 |
| `normal` in Chromium | 16    | 19    | 24    | 27    | 37    | 53    | 90    |
| the published ramp   | 16    | 20    | 24    | 28    | 36    | 52    | 92    |

Chromium's `normal` is `round(ascent_px) + round(descent_px)`, which reproduces all seven. It is an
integer, the same on every line — measured over 101 lines, so accumulation would have shown.

## What the original draws, which is two different things

Measured on the reference guest at its stock theme, accent, DPI and display language.

**Within one text block the advance is fractional.** The Typography page's own description, at a
size established rather than assumed: its accent-coloured `Segoe UI Variable` link measures 109px
of ink on screen against 109.34 for Text at 14px in the same browser — 13px gives 101, 15px gives
117, Small at 14px gives 113 — and the run of text before the link measures 545 against 545.1.
Body's face, size and weight.

Maximised, it wraps to two lines with baselines **18** apart. Snapped to half width it wraps to
three, with baselines **19 then 18** apart, and a three-line paragraph on the Color contrast page
gives the same 19 then 18.

The three-line capture settles it on its own, and it does so without any assumption about where
the block starts. Under a constant integer advance `N`, `round(b + kN)` is `round(b) + kN` for
every origin `b`, so every gap is exactly `N` from anywhere. One 19 and one 18 in the same font at
the same size therefore refute every integer advance, `normal`'s 19 included. Only a fractional
one produces both.

The two-line capture corroborates rather than adds: its first line's ink profile corresponds to
the three-line one row for row, within two per cent on every row, and lands one row lower, so the
two blocks start at different origins. An origin pair reproducing both observations exists — 185.6
gives 186 then 204, and 184.9 gives 185, 204, 222 — but those are an illustration fitted to the
data, not a second measurement.

**Across sibling elements the box is rounded.** `UseLayoutRounding` is on by default for every
`FrameworkElement`, which is why the pins opt individual elements out of it — thirty-two
`UseLayoutRounding="False"` in the control dictionaries and nineteen more in the framework
dictionary ADR 0010 pins — while the one `="True"` among them, `generic.xaml:11988`, restates the
default it is already getting. A single-line `TextBlock` therefore occupies a
whole number of pixels, and that whole number is the font's spacing rounded — 19 at Body size,
which is what `docs/surface.md` records from the reference for every control that measured one.

**Neither behaviour is negotiable and CSS expresses one at a time.** A unitless
`line-height: 1.330078125` reproduces the fractional advance and loses the rounding; `normal`
reproduces the rounding and loses the advance.

## Why no single-line measurement can settle it, and what did

At every one of the seven ramp sizes, `round(size × 1.330078125)` is exactly the integer `normal`
produces. So a single line inside integer padding lands on the same pixel under both models and no
such measurement discriminates. Expander's 52px content box is 16 + 18.62 + 16 + 1 = 51.62 under
one model and 16 + 19 + 16 + 1 = 52 under the other, and both paint 52. ContentDialog's 27px title
is 26.60 or 27, and both paint 27. The Typography page's ramp table is the same: its rows clamp at
68 until the sample outgrows them, and the two that do — Title Large at 78, Display at 115 — are
satisfied by a padding of 25 under either model. That table refutes the published numbers, which
need 26 for Title Large and then predict 118 for Display. It leaves the other two standing.

The models separate only where fractions **sum** before rounding. There are two such places and
they point opposite ways.

- _Several lines in one block._ The wrapped paragraph above. The advance is fractional, so the
  ratio is right and `normal` drifts by 0.379px per Body line.
- _Several single-line boxes in one measured container._ TeachingTip's card stacks a title, a
  subtitle and a content slot. `docs/surface.md` records the original at 310 and our card at 311
  until each of the three took the font's own spacing. Measured in our own Gallery: **310.469 with
  `normal`, 309.297 with the ratio.** The original is 310. Every smaller card on that page moves
  the same way — 64 to 63.219, 108 to 106.828.

## Decision

The generated ramp classes carry **`line-height: normal`**. `TYPE_RAMP` keeps its per-step face
and loses its per-step line height; nothing replaces the number, because the value is a property
of the font and the browser already computes it from the font.

This is chosen knowing it is wrong about the within-block advance. It is the right trade for this
library, which is made almost entirely of single-line boxes stacked inside containers whose height
is the thing compared against Windows. The error `normal` makes is 0.379px on the second and later
lines of a wrapped paragraph, of which there are few. The error the ratio makes is 0.379px on
**every** single-line box in every control, and those sum: a three-box card is a pixel short, and
this project has spent whole units closing pixels of exactly that size.

`normal` needs no manifest entry and no token, because C1 exempts the bare keyword. That is a
consequence of the decision, not a reason for it.

## Status

Accepted. **Supersedes in part ADR 0003**, which stated the ramp's line heights as part of its
font-reference decision; that ADR's size column stands and its line-height column does not.

## Alternatives rejected

- **A unitless ratio, `1.330078125`, emitted as a `--winui-FontLineHeight` token** — the font's own
  metric, pinned rather than delegated to a browser, and exactly right for wrapped text. It was
  built, measured and reverted: it takes 0.379px off every single-line box, which surfaces as a
  whole pixel wherever a container measures three of them, and it would have been photographed
  into the baselines as the new truth by the same unit that introduced it. WD-018 is what is left
  of it.
- **Per-step `line-height` in pixels — 16, 19, 24, 27, 37, 53, 90** — the same integers `normal`
  computes, pinned rather than delegated, and not at the mercy of a browser's rounding rule.
  Rejected because it is ten numbers restating one rule; because it says nothing about a size
  outside the ramp, and ToolTip draws at 12px and ContentDialog's title at 20px through their own
  templates rather than through a ramp class; and because it would silently stop matching the
  moment a fallback face resolved. The rule is worth writing down. `normal` is where the browser
  already writes it.
- **Keeping the published numbers and the per-component overrides** — the status quo. Rejected
  because four components had no override and were wrong, and nothing in the build would have
  found the fifth.

## How the claim is checked

`pnpm tokens:build` regenerates both files, and C2 fails if the committed CSS and the generator's
output disagree. The value itself is checked against the reference guest, and the measurement
lives in this ADR rather than in a test, because the reference is a screenshot of another
operating system and not something the suite can reach.

## Downstream impact

Every baseline in the project moves, because every line box does. They are deleted and
re-photographed rather than updated in place, because `--update-snapshots` declines to rewrite a
file it considers a match and this project has twice watched a real change pass that way. The
suite is not as blind as that history suggests: `playwright.config.ts` sets neither
`maxDiffPixels` nor `maxDiffPixelRatio`, so a single pixel over the 0.2 YIQ threshold fails a
spec, and a shifted glyph edge clears that easily. What it cannot see is a context it does not
photograph, which is where the risk actually lives.

Most of the per-component overrides written to escape the published value become exact duplicates
of what the ramp class now says, and those come out in the unit after this one. The test is not
what a declaration says but whether the element can reach `normal` without it, from inside the
library: an element carrying or descended from a ramp class can, and one whose nearest source of
`line-height` is the consumer's page cannot. `TextBox`, `PasswordBox` and `NumberBox` put no ramp
class on their roots, so their `font: inherit` inputs are in the second group and keep theirs.
A glyph box keeps its own declaration even where it is redundant, because `normal` on an icon span
is a statement about a different font; and `Expander.svelte`'s and `InfoBadge.svelte`'s
`line-height: 1` and `InfoBar.svelte`'s `var(--winui-InfoBarIconFontSize)` are not `normal` at all.
`ComboBox.svelte`'s `line-height: 20px` stays because `ComboBox_themeresources.xaml:569` sets
`LineHeight="20"` on the header presenter explicitly.

Off Windows, where ADR 0003's open question O1 already applies, `normal` is now computed from
whichever face the machine substitutes. That is a change of kind rather than a regression: the ramp
used to impose Segoe's metrics on a face that was not Segoe. Neither is right, and the new one is
at least self-consistent.
