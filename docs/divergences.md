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
- **Why accepted**: Mica's input is the desktop behind the window, and nothing exposes
  what is behind a web page to it. Neither pinned source states the tint and luminosity
  that would let one be faked faithfully. The Gallery's own Color page gives
  `Mica Background / Base` and `Solid Background / Base` the same caption — "used for
  the bottom most layer of an experience" — so the solid pair is the value Microsoft
  itself names for that role, and v2's window paints it as the backdrop. D16.
- **Would reconsider if**: a future browser exposes what is behind the viewport to CSS,
  at which point the material can be sampled directly and this entry is deleted
  rather than amended, because the tile will then render the way the original does.

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

### WD-005 — TitleBar never collapses its title to make room for content

- **Control**: `TitleBar`.
- **WinUI does**: switch into a `Compact` visual state when the content's desired width
  exceeds its column's actual width. `TitleBar::OnSizeChanged` watches the two values and,
  once the gap closes, collapses the title and the subtitle and re-aligns the content to
  the left with the `TitleBarCompactContentMargin`. The control returns to its default
  state when the gap reopens. There is no threshold width anywhere — the rule is a
  comparison performed at layout time.
- **We do**: render the title and the content together, always, regardless of how tight the
  row gets. `data-height` is the only row-level state we emit, and it answers a different
  question (`Content`, `LeftHeader` and `RightHeader` are all absent → compact, else
  expanded); it is not a function of the title fitting.
- **Why accepted**: the comparison WinUI performs requires reading the content's desired
  width against its column's actual width, which means measuring one element against the
  layout the others have already taken. In flex that is a `ResizeObserver` on the content
  cell, a second pass of width accounting, and the new width pushed through every layout-
  dependent declaration on the title and the subtitle. That is the cost of a feature whose
  visible result on the Gallery's own pages is none — the search box the Gallery places in
  the content slot is narrow enough not to push the title out under every breakpoint the
  page ships at. Building it now means adding a ResizeObserver and a state machine to a
  page that renders correctly without them.
- **Would reconsider if**: a viewport this project cares about gets narrow enough for the
  content to push the title out. The Gallery's search box has a maximum width and the
  window a minimum one, so today the two never meet; the day they do, the title is clipped
  where WinUI would have hidden it, and that is a fidelity loss a user can reach. The entry
  is then deleted rather than amended, because the comparison WinUI performs is the fix.

---

### WD-006 — an animated icon renders as the static glyph WinUI falls back to

- **Control**: `NavigationView`'s settings item, `TitleBar`'s back and pane-toggle buttons,
  and `CheckBox`'s check glyph.
- **WinUI does**: give each of them an `AnimatedIcon` with a `FallbackIconSource` — the
  settings item in `CreateAndHookEventsToSettings`, `NavigationView.cpp:1319`; the two title
  bar buttons in their styles, `TitleBar_themeresources.xaml:160` and `:230`. The buttons'
  styles drive `AnimatedIcon.State` to `PointerOver` at `:132` and `:202` and to `Pressed`
  at `:145` and `:215`, which is the press the review saw: the glyph shrinks on pointer-down
  and returns on release. Each visual source is a Composition scene graph generated by
  LottieGen and shipped as C++; the settings gear's — `AnimatedSettingsVisualSource.cpp` —
  is 63 `CompositionObject`s driven by seven expression animators and six keyframe
  animators, and its `Markers()` map at `:730` names six segments between `Normal`,
  `PointerOver` and `Pressed`.
- **We do**: render each `FallbackIconSource`'s glyph — `Symbol::Setting` as E713, the two
  title bar glyphs, and CheckBox's E73E and E9AE — with no transition between pointer states.

  **Where the fallback's own visibility differs from the animated original's, the original
  wins.** CheckBox is the case that forced the distinction. Its `CheckGlyph` is an
  `AnimatedIcon` whose four unchecked visual states set `AnimatedIcon.State` to an `…Off`
  value, so the animated original draws no glyph at all on an unchecked box.
  `AnimatedIcon::SetRootPanelChildToFallbackIcon` — `AnimatedIcon.cpp:579` — puts a static
  `IconElement` in the root panel and `OnStatePropertyChanged` at `:214` only ever drives
  `m_animatedVisual`, which is null there; so the down-level path draws the checkmark in
  every state and hides it by painting it the colour of the fill. That works in Light and
  Dark, where `TextOnAccentFillColorPrimary` on `ControlAltFillColorSecondary` is white on
  near-white and black on near-black. It does not work under high contrast, where
  pointer-over pairs a `SystemColorHighlight` glyph with a `SystemColorHighlightText` fill
  and the down-level path would show a checkmark on an unchecked box. This library draws no
  glyph when unchecked, and the four
  `CheckBoxCheckGlyphForegroundUnchecked*` brushes are not emitted.

- **Why accepted**: `AnimatedIcon` is a control in the Styles group and arrives with that
  tranche, so the animation has no home yet. The gap is not one of effort but of input: the
  motion exists here only as a compiled Composition graph, which is not a format CSS can
  read and not one this repository can re-derive a keyframe list from. Reproducing it means
  re-authoring the motion by eye against a running copy of Windows, which is a different
  activity from reproducing a template, and a scale-on-press written from memory of what it
  looked like is exactly the invention this registry exists to avoid. Meanwhile the glyph we
  render is not an approximation — it is the icon WinUI itself paints, through
  `FallbackIconSource`, wherever the animated source cannot run.
- **Would reconsider if**: the Styles tranche lands `AnimatedIcon` with a motion vocabulary
  these three can be expressed in. The entry is deleted rather than amended, because by then
  each of them animates the way the original does.

---

### WD-007 — the title bar's icon is absent

- **Control**: the Gallery's title bar.
- **WinUI does**: `MainWindow.xaml` gives `TitleBar.IconSource` an `ImageIconSource` whose
  `ImageSource` is `/Assets/Tiles/GalleryIcon.ico`, and the row draws that image left of
  the title.
- **We do**: render no icon there.
- **Why accepted**: `TitleBar` takes `iconGlyph`, a Segoe Fluent Icons code point, and has
  no image slot — an app icon is a bitmap, not a glyph, so the slot would be a new
  feature of the control rather than a value to pass. The file itself is Microsoft's
  artwork in a checkout this project reads as source and copies nothing out of. Neither
  of those is difficulty; together they are the mechanism.
- **Would reconsider if**: `TitleBar` grows an image slot — a URL and a rendered `<img>`
  beside the icon glyph — and this project settles how a reproduction ships an app icon
  that is not the original's artwork. The entry is amended rather than deleted in that
  case: the row would carry an icon, and it would still not be the one the original
  draws.

---

### WD-008 — no control draws the system focus visual

- **Control**: every control this library exports. `Button`, `TextBox` and `CheckBox` are
  where it is cited; the entry covers the ones that follow.
- **WinUI does**: set `UseSystemFocusVisuals="{StaticResource UseSystemFocusVisuals}"` on each
  style and inset the visual with `FocusVisualMargin` — `-3` for Button
  (`Button_themeresources.xaml:167`, `:310`), `-7,-3,-7,-3` for CheckBox
  (`CheckBox_themeresources.xaml:276`), RadioButton (`:196`) and ToggleSwitch (`:200`). The
  XAML framework then draws a two-tone rectangle around the keyboard-focused control: an
  outer stroke in `SystemControlFocusVisualPrimaryBrush` and an inner one in
  `…SecondaryBrush`, at a thickness the framework owns rather than the control's dictionary.
- **We do**: draw nothing. A keyboard-focused control is not visually distinguished from an
  unfocused one, except where the control's own template already changes — TextBox's focused
  border does, Button and CheckBox do not.
- **Why accepted**: the visual is not in any control's dictionary. It was recorded as four
  values none of which `controls/dev` defines. **That count was wrong, and the correction is
  why this entry now carries numbers instead of a wait.** Two of the four are defined:
  `Common_themeresources.xaml:15` and `:16` alias
  `SystemControlFocusVisualPrimaryBrush` and `…SecondaryBrush` onto `FocusStrokeColorOuterBrush`
  and `FocusStrokeColorInnerBrush` in all three themes, and both have been emitted in
  `tokens.css` since v1. The other two are not resources at all — `FocusVisualPrimaryThickness`
  and `FocusVisualSecondaryThickness` are `Control` property defaults, which is why the
  framework dictionary has no entry for them either and why measurement, not a second
  dictionary, is what settles them.

  **Measured on the reference guest** (WinUI 3 Gallery, light theme, a keyboard-focused
  split button): outward from the control's border box, 1 px of `FocusStrokeColorInner` then
  2 px of `FocusStrokeColorOuter`, on all four edges, with the corner radius growing with the
  offset so the two rings stay concentric with the control. Both are drawn **outside** the
  control's bounds — the neighbours do not move, and the button's own border is untouched
  underneath. The colours are exact: the outer band reads `rgb(26, 26, 26)`, which is
  `#E4000000` over the `#F9F9F9` page, and the inner band `rgb(253, 253, 253)`, which is
  `#B3FFFFFF` over the same. The two thicknesses agree with every `Setter` in the pin that
  overrides them — 2 and 1, at `GridViewItem_themeresources.xaml:151`, `:153` and four other
  sites.

  In CSS that is one `box-shadow` with two rings, or an `::after` at a negative inset; it
  costs no layout and it is the same shape on every control, which is the reason it is one
  entry rather than one per control.

- **Would reconsider if**: nothing further — the values are in hand and the entry closes in
  this version. It is deleted rather than amended when a control draws the visual, along
  with every `WD-008` citation, because the citations and the entry have to go in the same
  commit for C5 to stay green in both directions.

---

### WD-009 — the toggle switch cannot be dragged

- **Control**: `ToggleSwitch`.
- **WinUI does**: make the knob draggable. `ToggleSwitch_themeresources.xaml:191` sets
  `ManipulationMode="System,TranslateX"`; the template carries a `SwitchThumb` whose own
  template is a transparent rectangle spanning the whole switch area; and `ToggleStates` has
  a third state, `Dragging`, with two transitions of its own — `DraggingToOnTransition` and
  `DraggingToOffTransition` — that carry the knob to whichever end it was released nearest.
  Pressing the knob and moving the pointer therefore drags it along the track, and releasing
  it commits or reverts.
- **We do**: toggle on click and on keyboard activation. A press-and-drag is a click that
  toggles once, from wherever the pointer is released inside the control.
- **Why accepted**: the drag is not a style, it is a gesture with its own state machine —
  a pointer capture, a per-frame offset, a release threshold, and three
  `TemplateSettings.Knob*Offset` values that WinUI computes in C++ from the knob's measured
  position. None of those is in the dictionary this project reads. Reproducing it means
  writing the state machine from scratch and inventing the threshold, which is the class of
  invention this registry exists to keep out of the code. The visible result of a drag —
  the switch ends on or off — is reachable by the click that this does implement.
- **Would reconsider if**: this library grows a gesture layer for the controls that need one
  on their own account — Slider's thumb and ScrollView's panning are the same shape — and
  the release threshold can be measured against the original rather than chosen. The entry
  is deleted then; a switch that drags is a switch that drags.

---

_Seven entries. The next is expected to be TabView's arrow-key traversal. Every surveyed
primitive library — bits-ui, Zag and therefore Ark, and Melt — builds its roving-focus
candidate set by querying for a role or data attribute, which cannot match a close button
nested inside a tab trigger. So the button is reachable by Tab and not by arrow keys, and that
is a property of the standard roving-tabindex pattern rather than of any one library.
Recorded here once the control is built and the behaviour is observed rather than predicted._
