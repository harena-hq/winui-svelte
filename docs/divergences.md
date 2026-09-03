# Accepted divergences from WinUI behaviour

Visual fidelity is this project's bar. Behavioural fidelity is not — where reproducing a
WinUI interaction would mean fighting a primitive's own model, the divergence is accepted.

**Accepted, not silent.** Every entry here has an id, and every site that departs cites that
id in a code comment:

```svelte
<!-- WD-002: arrow keys skip the close button; see docs/divergences.md -->
```

Conformance gate C5 fails if a cited id has no entry, or if an entry is cited nowhere. The
second direction matters as much as the first: an entry nothing cites is a divergence that was
fixed, or one that was never real, and either way the registry is lying.

An entry records what WinUI does, what we do, why the gap was accepted, and what would make it
worth closing. "Would be hard" is not a reason — the reason is always a specific mechanism.

## Format

### WD-NNN — <short title>

- **Control**:
- **WinUI does**:
- **We do**:
- **Why accepted**:
- **Would reconsider if**:

---

### WD-001 — the two color tripwires are aliased rather than carried forward

- **Control**: the token layer, all three themes.
- **WinUI does**: poison each theme's unreachable vocabulary with a color nothing there reads.
  In the `HighContrast` dictionary all 83 palette `<Color>` keys are `#FF0000`, while that
  dictionary's brushes bind to OS system colors instead. Mirrored, in `Default` and `Light`
  the eight `SystemColor*ColorBrush` keys are `#FF00FF`, while everything there resolves to
  the palette. A palette color read under high contrast renders red; a system color read under
  light or dark renders magenta. Both are diagnostics, and neither is a value.
- **We do**: alias in both directions, always to what the source itself binds elsewhere.
  Under high contrast each poisoned palette key takes the system color its own `<Key>Brush`
  resolves to — 79 of the 83 that way; three whose sibling brush is literally `Transparent`
  emit `transparent`, and `SolidBackgroundFillColorTransparent`, which has no sibling brush at
  all, emits `transparent` because its light and dark values are zero-alpha. Under light and
  dark each `SystemColor*ColorBrush` takes `var(--winui-SystemColor*Color)`, which is exactly
  what the `HighContrast` dictionary already writes for the same eight keys. No color is
  invented in either direction.
- **Why accepted**: both tripwires are runtime mechanisms and we have a build-time one. C1
  forbids literals in component styles, so the mistake WinUI catches with a loud pixel is
  caught here before the code runs. Carrying the colors forward would instead put red into the
  token layer's own high-contrast snapshots and magenta into its light and dark ones, turning
  a diagnostic into a defect in the one artifact that exists to show the tokens.
- **Would reconsider if**: a component is found reading a palette color in a way C1 cannot see
  — a computed property name, or a value crossing a JavaScript boundary. Red pixels would then
  be earning their keep again.

---

### WD-002 — AcrylicBrush emits its FallbackColor rather than the material it cannot compose

- **Control**: the token layer, the four `*AcrylicBackgroundFillColor*Brush` keys.
- **WinUI does**: composes a material — a blurred, tinted, noise-textured sample of whatever
  is behind the element — and falls back to a flat `FallbackColor` when it cannot, which
  happens under transparency-disabled, battery saver, and a remote session, among others.
  The value WinUI itself paints under that documented condition is the one the XAML carries
  as `FallbackColor` on every `AcrylicBrush`.
- **We do**: emit `FallbackColor` in every theme, with no attempt to reproduce the material.
  The high-contrast theme takes `SystemColorWindowColor` for these four keys, matching the
  flat `SolidColorBrush` that `AcrylicBrush_themeresources.xaml` writes itself for the
  high-contrast dictionary — under high contrast the source does not compose the material
  either.
- **Why accepted**: the material samples a backdrop the web does not expose to a custom
  property — `backdrop-filter` exists but the thing it samples is whatever the browser has
  drawn under the element, and a layer the project has not put there is not a value a token
  can name. A `backdrop-filter` recipe is a component with a backdrop under it, and that
  belongs to whatever builds `AcrylicBrush` in the Styles tranche. The color emitted here
  is the one WinUI itself shows under a documented condition rather than an approximation
  of the one it does not, so nothing is being invented.
- **Would reconsider if**: the Styles tranche builds an acrylic component, at which point
  the token becomes that component's fallback and this entry is deleted rather than amended.

---

### WD-003 — the two Mica Background tiles on the Color page render without a fill

- **Control**: the token layer, the two `Mica Background / Base` and
  `Mica Background / Base Alt` tiles on `/design/color`.
- **WinUI does**: fill them with a live Mica backdrop — a tinted, blurred sample of the
  desktop behind the window — sampled by the OS at composition time.
- **We do**: render the tile with no fill at all, leaving it transparent over the page
  background.
- **Why accepted**: Mica is a window material. It samples whatever the OS has drawn
  behind the window, and v1 has no window shell — no title bar, no backdrop region,
  nothing for a Mica approximation to read. A flat fill would not be Mica, and
  reproducing the material is the shell's job. v2 builds a Mica approximation, at
  which point the divergence closes.
- **Would reconsider if**: v2 lands. This entry is deleted rather than amended, because
  by then the tile is rendered correctly, and a divergence that names a working site
  is a divergence that has stopped being real.

---

### WD-004 — NavigationView items are each a tab stop; arrow keys do not move focus

- **Control**: `NavigationView`'s menu tree.
- **WinUI does**: the pane is a single tab stop. Tab enters it; arrow keys (Up/Down,
  Left/Right — Left/Right also drive expand and collapse) move focus among items,
  Home/End jump to the ends, typing jumps to the next item whose label starts with the
  pressed character; Tab leaves the pane and walks into the next focusable element in
  tab order. The chevron is reached by the same arrow keys, not by Tab.
- **We do**: every item is `tabindex="0"` and is reached by Tab. There is no arrow-key
  navigation among items, no typeahead, no Home/End. Tab walks through them in document
  order, which is also the visual order.
- **Why accepted**: the tree is built from scratch, not on top of a primitive. ADR 0004
  notes that no surveyed primitive library ships a tree, and the one this project would
  adopt for it — `@zag-js/tree-view` — arrives with the Collections tranche. A
  hand-rolled roving-tabindex loop is not hard; what is hard is the keyboard contract
  being right without it being tested: each tree interaction is a state machine with
  collapsed children, headers, an expand chevron that is focusable in WinUI but lives
  inside an item that is, and three display modes that each close the pane and change
  the candidate set. The web's own keyboard contract for a `role="tree"` is the WAI-ARIA
  Authoring Practices guide, which is what WinUI follows, and reproducing it requires
  the same test rig the Collections tranche will build for TreeView. Until then, every
  item being a tab stop is the behaviour the keyboard already reaches, and the cost of
  the gap is a Tab key rather than an arrow key — a real loss, and a recorded one.
- **Would reconsider if**: the Collections tranche lands with a tree that the navigation
  pane can adopt, or the Gallery's own page structure makes hand-rolling the contract
  cheap enough to do without that. Either way the entry is deleted, because the
  behaviour it names is the one WinUI ships.

---

_Four entries. The next is expected to be TabView's arrow-key traversal. Every surveyed
primitive library — bits-ui, Zag and therefore Ark, and Melt — builds its roving-focus
candidate set by querying for a role or data attribute, which cannot match a close button
nested inside a tab trigger. So the button is reachable by Tab and not by arrow keys, and that
is a property of the standard roving-tabindex pattern rather than of any one library.
Recorded here once the control is built and the behaviour is observed rather than predicted._
