# 0005 — High contrast is a system-color remapping, not a third palette

## Context

Measured on `microsoft-ui-xaml` `main` at `79646b4`,
`controls/dev/CommonStyles/Common_themeresources_any.xaml`.

The file carries three theme dictionaries: `Default` — which is the **dark** theme, not a
neutral fallback — `Light`, and `HighContrast`. Each holds 184 entries. In `Default` and
`Light` that is 83 `<Color>` values plus 98 `SolidColorBrush`es and 3 `LinearGradientBrush`es
derived from them. `HighContrast` holds the same 83 color keys and 101 solid brushes and no
gradients at all — the three elevation-border gradients are flattened to flat brushes there,
which is the same substitution this ADR is about, applied one level up.

`HighContrast` defines the same 83 color keys, and **every one of them is `#FF0000`**. All
83, in a dictionary whose own brushes never read them.

That is a tripwire rather than a palette. Pure red is what appears if anything resolves a raw
palette color under high contrast; the brushes in that dictionary bypass the colors entirely
and bind to eight OS-supplied values:

| key                             | references |
| ------------------------------- | ---------- |
| `SystemColorWindowColor`        | 33         |
| `SystemColorWindowTextColor`    | 27         |
| `SystemColorButtonFaceColor`    | 21         |
| `SystemColorButtonTextColor`    | 9          |
| `SystemColorGrayTextColor`      | 5          |
| `SystemColorHighlightColor`     | 1          |
| `SystemColorHighlightTextColor` | 1          |
| `SystemColorHotlightColor`      | 1          |

Those eight are the Win32 system colors, and the web platform exposes the same eight as CSS
system colors — which, under `forced-colors: active`, the browser populates from the user's
actual Windows high-contrast theme:

| WinUI                           | Win32                 | CSS             |
| ------------------------------- | --------------------- | --------------- |
| `SystemColorWindowColor`        | `COLOR_WINDOW`        | `Canvas`        |
| `SystemColorWindowTextColor`    | `COLOR_WINDOWTEXT`    | `CanvasText`    |
| `SystemColorButtonFaceColor`    | `COLOR_BTNFACE`       | `ButtonFace`    |
| `SystemColorButtonTextColor`    | `COLOR_BTNTEXT`       | `ButtonText`    |
| `SystemColorGrayTextColor`      | `COLOR_GRAYTEXT`      | `GrayText`      |
| `SystemColorHighlightColor`     | `COLOR_HIGHLIGHT`     | `Highlight`     |
| `SystemColorHighlightTextColor` | `COLOR_HIGHLIGHTTEXT` | `HighlightText` |
| `SystemColorHotlightColor`      | `COLOR_HOTLIGHT`      | `LinkText`      |

The correspondence is exact and one-to-one. Nothing had to be invented to make it fit, which
is the reason this is a decision worth recording rather than an implementation detail.

**The tripwire runs both ways, which is what settles the reading.** The same file defines eight
`SystemColor*ColorBrush` aliases in all three dictionaries. Under `HighContrast` each binds to
its `SystemColor*Color` — a value the file never defines, because the OS supplies it. Under
`Default` and `Light` all eight are `#FF00FF`. So a palette color read under high contrast
renders red, and a system color read under light or dark renders magenta, and neither is an
accident: the two dictionaries are disjoint vocabularies, and the source says so in the loudest
way a stylesheet can.

## Decision

**The high-contrast theme is generated as aliases, not as values.** Every `--winui-*` token
under `[data-theme='high-contrast']` resolves to one of eight `--winui-system-color-*`
custom properties, and only those eight carry a literal. They default to the values of
Windows' own High Contrast theme so the theme is inspectable on any machine, and are
overridden from the CSS system colors under `@media (forced-colors: active)`.

**The 83 `#FF0000` values are not ported.** Copying them faithfully would reproduce a tripwire
that only works in a runtime that never reads it, and would make the token layer's own
regression baselines red.

## Status

Permanent.

## Alternatives rejected

- **Port the 83 high-contrast colors as extracted.** Faithful to the source and wrong in
  effect: the source's own brushes are written so that those values are never observed.
- **Hand-pick a high-contrast palette.** Invents values Windows does not use, and pins a
  single appearance where Windows ships four built-in high-contrast themes plus a custom
  editor. Every one of them would then be wrong except by accident.
- **Rely on `@media (forced-colors: active)` alone, with no explicit theme.** The theme could
  then not be selected on a machine that is not in forced-colors mode — and D5 makes a human
  side-by-side the acceptance mechanism, so the theme has to be selectable on demand.

## Downstream impact

- **C4 gains its meaning from this.** "Three themes, always" is not three sets of numbers; the
  third theme is a different mechanism, so a component that hardcodes anything fails there
  first and fails visibly.
- **C1's token-layer exemption stays confined to `src/lib/tokens/`.** The eight system-color
  literals are the only colors written by hand in the project, and that is where they live.
- **An unresolved reference must be an extraction error, not a dropped token.** The name space
  is wider than the base palette: `ControlAAStrokeColorDefault`, referenced by
  `TextBox_themeresources.xaml`, is defined only in `Deprecated_themeresources_any.xaml`. An
  extractor resolving against `Common_themeresources_any.xaml` alone finds nothing there and,
  if it is forgiving, emits nothing — so it must fail loudly on a name it cannot resolve.

## One anomaly, recorded rather than resolved

`TextBox_themeresources.xaml`'s `HighContrast` dictionary defines
`TextControlElevationBorderBrush` and `TextControlElevationBorderFocusedBrush` as gradients
whose stops resolve `ControlStrokeColorDefault` — `#FF0000` in that dictionary. Their other
stops are fine: `ControlAAStrokeColorDefault` is `#8BFFFFFF` under high contrast in
`Deprecated_themeresources_any.xaml`, and `SystemAccentColorLight2` is an OS value. Those two
lines are the only places in all 85 theme-resource files where a high-contrast resource reads
one of the 83 poisoned colors.

Whether a TextBox actually shows a red edge under high contrast has not been observed, so
this is not being called a defect. Our port resolves those stops to system colors like
everything else. If the original does render red there, that is a deliberate departure and
earns a `WD-` id at the point it can be seen side by side.

## Amended 2026-11-01: a contrast theme turns the theme on, and the browser's forcing off

The Decision above filled the eight from the system colours under `forced-colors: active`, and
that was all that happened there. The tokens were still the page's light or dark ones unless the
page also set `data-theme`, and the browser forces those: on an element it forces, a colour that is
not a system colour is replaced, and `box-shadow` and a gradient are dropped. A consumer's trial
under a real Windows contrast theme found an on ToggleSwitch with neither track nor knob, an off
one with no knob, an InfoBar's icon without its disc, and an accent Button the same as a default
one. The theme matrix sets `data-theme`, in a browser that is not forcing, so it had never seen
any of them.

**In forced-colors mode the tokens are the high-contrast theme, whatever `data-theme` says,** with
the eight read from the system. The block is the high-contrast block emitted a second time, as
the dark one is for its media query; it costs 133 KB of CSS and 10 KB gzipped.

That alone brings the fills back, as a system colour is not replaced: measured in the local
Chromium, an on ToggleSwitch draws its track and knob under the browser's forcing once the tokens
are these. It does not bring back what is forced whatever its colour, which is every focus visual.

**So a component's elements take `forced-color-adjust: none`,** by a scoped `*` in that component's
styles, so each one reaches its own template and no further. What the page draws then is what the
three-theme baselines already photograph, from the system's eight colours, and
`tests/visual/forced-colors.spec.ts` compares the two pixel for pixel, on thirteen pages' first
1265 by 720, at rest, in the one palette the browser's emulation has. C22 refuses a component
without the rule, and names the ones that draw what the consumer asked for. The two component
rules keyed on `data-theme`, ColorPicker's and Hyperlink's, are written a second time under the
media query.

**The property is inherited, so a slot takes it from its wrapper.** A label in a Button stays
unforced, as forcing its colour over a Highlight fill could hide it. A wrapper that holds the
consumer's layout sets `auto` again, and C22 holds the list. Three of these wrappers also draw
the surface, Flyout's, Expander's and SplitView's pane, and the browser leaves that alone because
those tokens are system colours. What a consumer draws there is forced as the rest of its page is.
A consumer's own colour inside any other slot is not, a list row's for one, as it may sit on a
selection's Highlight; setting `forced-color-adjust: auto` on it is how to ask. A token a consumer
sets below `:root` is not forced either: it reaches a component's parts as it would anywhere.

Rejected: **`forced-color-adjust: none` on `:root`.** One rule, but it takes the forcing off the
consumer's whole page, which never asked to lose it. **Fixes part by part, for each fill.** Every
state of every control would need its own reading of the upstream dictionaries, which the tokens
have already done. **Emitting light and dark inside `@media not (forced-colors: active)`** with
the high-contrast values as the base would save the second block, and rewrites the selector of
every theme for 10 KB.

**Not measured:** no WinUI app has been compared in a contrast theme, because the reference guest's
theme is not changed. The values are the upstream's high-contrast dictionaries, read, and this
drawing of them has been seen only under Chromium's emulation.
