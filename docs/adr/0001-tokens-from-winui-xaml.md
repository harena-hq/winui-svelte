# 0001 — Token values are extracted from microsoft-ui-xaml, not from Fluent 2 web

## Context

WinUI 3 and Fluent 2 for web are the same design language expressed twice. The Fluent 2 web
packages are MIT and well maintained, so reusing them as the token layer looked like the
cheap path. It is not, and the reason is not polish — the two express color differently at
the model level.

WinUI composes controls out of **semi-transparent overlays over whatever is behind them**:
`ControlFillColorDefault` is `#B3FFFFFF` in light (70% white) and `#0FFFFFFF` in dark (6%
white). A control's apparent color is therefore a function of its backdrop, which is what
makes the same button look right on a Mica window, inside a card, and over an image.

Fluent 2 web ships a **flat, fully opaque 16-step neutral ramp** —
`colorNeutralBackground1: #ffffff`, `colorNeutralBackground2: #fafafa` — with no alpha
compositing anywhere in the model. Porting those values gives surfaces that are individually
plausible and collectively wrong, and the error grows exactly where the design language is
most recognisable: over materials.

Other divergences are smaller but consistent. WinUI exposes two corner radii
(`ControlCornerRadius` 4px, `OverlayCornerRadius` 8px); Fluent 2 web has a nine-step ramp
whose 4px and 8px rungs happen to match. Fluent 2's `fontFamilyBase` is classic Segoe UI with
cross-platform fallbacks; WinUI 3 uses Segoe UI Variable, a different face. Accent is a fixed
brand ramp in Fluent 2 and an OS-runtime derivation in WinUI.

The one axis that genuinely aligns is the type ramp: Fluent 2's Hero700/800/900/1000 and
Base500/600 steps match the Windows 11 ramp's 28/32/40/68 sizes and line heights closely
enough that Fluent 2's numbers work as a cross-check.

Nor is there anything finished to adopt. `@fluentui/tokens` (`1.0.0-alpha.24`, alpha for
years) ships TypeScript value modules, not CSS. `@fluentui/web-components` v3 emits its
custom properties from a runtime `setTheme` call rather than a static stylesheet. Griffel is
React-coupled. No maintained WinUI-3-for-CSS project exists — the Windows 11 equivalent of
`98.css` / `XP.css` is simply absent, and `OpenRapid/winui3` is a 49-commit sketch.

## Decision

Derive the token layer from `microsoft/microsoft-ui-xaml` (MIT), extracting numeric values
from the theme-resource dictionaries under `controls/dev/` on `main` — see the scope note
below. Use Fluent 2's type-ramp numbers only as a cross-check. Depend on no Fluent 2 package.

Preserve the alpha-composited model rather than flattening it: fills stay as `rgb(… / α)`
custom properties layered over a backdrop token, because flattening them is the specific
mistake that makes a port look almost right.

**Branch — settled by measurement.** The values gathered before this decision came from
`winui2/main` (`dev/CommonStyles/`), which is WinUI 2 for UWP. Both branches were extracted
and compared, `main` at `79646b4`:

- **No value differs.** Every key present in both carries the same color in all three theme
  dictionaries, and `CornerRadius_themeresources.xaml` carries the same two radii.
- **WinUI 3 adds four colors**, and their brushes, in each theme:
  `ControlFillColorQuarternary`, `CardBackgroundFillColorTertiary`,
  `SolidBackgroundFillColorQuinary`, `SolidBackgroundFillColorSenary`. 83 colors per theme
  against WinUI 2's 79, and 184 entries per theme against 176 — the same counts in all three
  dictionaries.
- **WinUI 3 removes nothing.**

The parity that would have been assumed happens to hold. It was still worth measuring: the
four added keys are exactly the surface on which an assumption fails silently, since a missing
key resolves to nothing rather than to a wrong color. Extraction targets `main`.

**Scope — the dictionaries are not confined to `CommonStyles/`.** 85 `*_themeresources.xaml`
files sit under `controls/dev/**` outside the `perf2026` set, and **78 of them carry theme
dictionaries** — somewhat under 8,000 keyed resource definitions between them.
`controls/dev/CommonStyles/Common_themeresources_any.xaml` holds the base palette; the rest are
per-control derivations from it. An extractor pointed at `CommonStyles/` alone would silently
miss every control-level token, which is why this ADR's original wording is corrected here
rather than left to be discovered by an implementer.

**The other seven carry no theme dictionary, and that is not a failure.** Their resources do
not vary by theme — and one of them is where the type ramp lives:
`TextBlock_themeresources.xaml` defines the seven font sizes (12, 14, 18, 20, 28, 40, 68) at
file level, outside the three-theme model entirely. An extractor must accept a file with no
theme dictionary as ordinary input, and must emit a theme-independent resource once rather
than triplicating it.

**A second, parallel set exists and is token-neutral.** 40 controls also ship
`*_themeresources_perf2026.xaml`. `CommonStyles.vcxitems` declares two page sets, tagged
`<Type>ThemeResources</Type>` and `<Type>ThemeResourcesPerf2026</Type>`, 42 entries each; which
set a running app resolves is decided somewhere that file does not say, so treat the selection
mechanism as unknown rather than as build-time or runtime.

Comparing the resource definitions of all 40 pairs, **38 are identical** and the two that
differ carry no token difference either:

- `TitleBar` renames one key — `TitleBarPaneToggleButtonForegroundDisabled` →
  `TitleBarPaneToggleForegroundDisabled`, same value.
- `ScrollBar` turns five keyed `ControlTemplate`s into five keyed `Style`s under new names.

What the variants change is visual-state mechanics: `Storyboard` with `DiscreteObjectKeyFrame`
becomes `VisualState.Setters`. That is a performance rewrite. **Extract the non-`perf2026` set
and ignore the other** — with the corroboration that 14 of the `perf2026`-tagged pages point at
base filenames anyway, `Common_themeresources_any.xaml`, `CornerRadius_themeresources.xaml` and
`TextBlock_themeresources.xaml` among them. Both sets read the same palette, radii and type
ramp; only the templates fork.

## Status

Permanent.

## Alternatives rejected

- **`@fluentui/tokens` as the source of values** — the wrong color model, and an alpha
  package. Its type ramp survives as a cross-check.
- **`@fluentui/web-components` v3 for its custom properties** — buys a JS runtime dependency
  to obtain values we would otherwise write once as static CSS.
- **Griffel / `@fluentui/react-components`** — React-coupled with no supported extraction
  path.
- **A community CSS port as the base** — nothing maintained or complete enough exists.

## Downstream impact

v1 is an extraction-and-generation task rather than a dependency-wiring task, and owns the
WinUI 2 / WinUI 3 diff. Conformance gate C2 (generated tokens must match committed CSS)
exists because of this decision. O3 (accent derivation) is left open by it: neither source
answers how to reproduce the per-user Windows accent.
