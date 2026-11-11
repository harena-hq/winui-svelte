# Changelog

Semantic versioning applies to the package root, `@harena-hq/winui-svelte`, and to the two
stylesheets the package maps, and to nothing else. Below 1.0, a change a consumer has to adapt to
waits for a minor version, which npm's caret range does not cross: `^0.1.0` stops short of `0.2.0`.

## 0.3.0

### `preview`'s `ListView`

- **`reorderItems` lets a person move an item within the list**, by dragging it with a mouse
  or pen, or with Alt+Shift and an arrow key, as upstream does. The callback
  `onItemReorder(fromIndex, toIndex)` reports the move and the consumer moves the record;
  the selection follows the items it named. Dragging between lists, dragging several selected
  items together, scrolling while dragging and touch drag are not built.

## 0.2.0

### `TabView`

- **An unselected tab's content stays mounted.** Every item's `content` is mounted with its tab
  and hidden while another tab is selected, so its state survives a switch; it was unmounted, and
  upstream does not destroy it either. **Every tab's content now runs at once**: its effects and
  timers keep running while hidden, and an `id` written in two tabs' content is in the document
  twice. When focus is inside the content being replaced, a selection change moves it into the new
  content, or to the tab when that holds nothing focusable, as upstream does; a consumer that moves
  focus itself in the same update keeps it, and focus anywhere else stays put. A tab's
  `aria-controls` now names its own panel, and an item without `content` has none.
- **`stripOnly` renders the strip without its content region**, for a consumer that renders and
  places the panels itself: with other content between strip and panels, the consumer's own
  classes on each, or panels for records that have no tab. Items gain `panelId`, the `id` of the
  consumer's panel, which the tab's `aria-controls` names and for which the component renders no
  panel of its own, and `tabId`, the tab's own `id`, for that panel's `aria-labelledby`. Focus
  does not follow a selection change into a consumer's panel.
- **`onTabKeyDown` reports a key pressed on a tab or its close button before the strip handles
  it**, with the tab's `id`. A handler that calls `preventDefault()` takes the key, and the strip
  selects, closes and moves focus for none of it, nor for a key any earlier listener prevented;
  the key still propagates. A consumer can stop the arrows at either end of the ring and carry
  focus to its own control, or close with Delete, while the ring keeps upstream's wrap by default.
- **Closing or removing the tab that holds focus moves focus to the next enabled tab**, else the
  previous enabled tab, else the add-tab button, as upstream does. In 0.1.0, focus was lost.
- **The strip's Tab stop is always an enabled tab.** In 0.1.0 a selection naming no tab left the
  strip with no stop, and a disabled first tab with no selection was a stop the arrows ignored.
- **Enter or Space on a focused close button now closes its tab.** In 0.1.0 it selected the tab.

## 0.1.0

The first release. Nothing was published before it, so it has no earlier history to record.

### The release

The package root exports twenty components, each with the types its own module exports:

`Button`, `ComboBox`, `ContentDialog`, `Expander`, `Flyout`, `HyperlinkButton`, `InfoBar`,
`MenuFlyout`, `NavigationView`, `NavigationViewItem`, `ProgressBar`, `ProgressRing`,
`ScrollView`, `ScrollViewer`, `TabView`, `TeachingTip`, `TextBox`, `TitleBar`, `ToggleSwitch`,
`ToolTip`.

With them it exports the `Symbol` table, WinUI's `Symbol` enum as the code points a `glyph` takes,
and its `SymbolName` type; `ScrollAnimation`, with its `ScrollAnimationEasing` and `ScrollVector`
types, which `ScrollView`'s `onScrollAnimationStarting` hands out and takes back; `provideStrings`,
which replaces the text the components write for themselves for a subtree, and `defaultStrings`,
that text in English, with the `Strings` and `StringKey` types; and `VERSION`. The stylesheets are
`@harena-hq/winui-svelte/tokens.css` and `@harena-hq/winui-svelte/type-ramp.css`. The text and icon
fonts are tokens a consumer can replace on `:root`, and a Windows contrast theme draws the
high-contrast theme.

### `preview`

`@harena-hq/winui-svelte/preview` exports everything the root does and seventy-six more components,
and promises nothing: a name there may change shape or leave in any version. So may anything reached
by a path into the package other than the root and the two stylesheets. Why the release is drawn
there is the repository's ADR 0017,
`docs/adr/0017-the-index-is-the-release-and-preview-is-the-rest.md`.

### Peers

The package has no runtime dependencies of its own. Each peer's floor is the version the
release was tested with.

- Required: `svelte` `^5.37.0`, `bits-ui` `^2.19.0` and `@internationalized/date` `^3.12.3`,
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
