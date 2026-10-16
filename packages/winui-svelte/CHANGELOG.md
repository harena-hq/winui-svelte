# Changelog

Semantic versioning applies to the package root, `winui-svelte`, and to the two stylesheets the
package maps, and to nothing else. Below 1.0, a change a consumer has to adapt to waits for a
minor version, which npm's caret range does not cross: `^0.1.0` stops short of `0.2.0`.

## 0.1.0

The first release. Nothing was published before it, so it has no earlier history to record.

### The release

The package root exports eighteen components, each with the types its own module exports:

`Button`, `ComboBox`, `ContentDialog`, `Expander`, `HyperlinkButton`, `InfoBar`,
`NavigationView`, `NavigationViewItem`, `ProgressBar`, `ProgressRing`, `ScrollView`,
`ScrollViewer`, `TabView`, `TeachingTip`, `TextBox`, `TitleBar`, `ToggleSwitch`, `ToolTip`.

With them it exports the `Symbol` table, WinUI's `Symbol` enum as the code points a `glyph`
takes, and its `SymbolName` type; `ScrollAnimation`, with its `ScrollAnimationEasing` and
`ScrollVector` types, which `ScrollView`'s `onScrollAnimationStarting` hands out and takes back;
and `VERSION`. The stylesheets are `winui-svelte/tokens.css` and `winui-svelte/type-ramp.css`.

### `preview`

`winui-svelte/preview` exports everything the root does and seventy-eight more components, and
promises nothing: a name there may change shape or leave in any version. So may anything
reached by a path into the package other than the root and the two stylesheets. Why the
release is drawn there is the repository's ADR 0017,
`docs/adr/0017-the-index-is-the-release-and-preview-is-the-rest.md`.

### Peers

The package has no runtime dependencies of its own. Each peer's floor is the version the
release was tested with.

- Required: `svelte` `^5.57.0`, `bits-ui` `^2.19.0` and `@internationalized/date` `^3.12.3`,
  the last because `bits-ui` requires it as a peer of its own.
- Optional: `@zag-js/svelte` and `@zag-js/number-input`, both `^1.43.3`. `preview`'s
  `NumberBox` imports them, and a bundler resolves them for any import from `preview`; a
  consumer of the root alone goes without them.

### Fonts and icons

Text and icons are drawn from the Segoe families Windows installs, referenced by name and never
embedded, which is where the release matches WinUI. Off Windows, text draws from a font the
system has, Arial where there is one, with Segoe UI Variable's line metrics laid over it where
the browser supports the descriptors that set them, and the 47 glyphs the package's components
draw themselves, preview ones included, and the 196 that `Symbol` names, 229 in all as
fourteen are both, come from a font in `tokens.css` built from Fluent UI System Icons
outlines, MIT licensed; a code point a consumer passes as `glyph` draws from it only if it is
one of those. The icon stack falls back to Segoe MDL2 Assets, as WinUI's does, before that
font.

### Where it departs from WinUI

Visual fidelity is the bar. Where reproducing a WinUI behaviour would mean fighting a
primitive's own model, the clone departs from the original on purpose. The repository's
`docs/divergences.md` is the register of those departures, each with what would make it worth
closing.
