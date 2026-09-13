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

- **Control**: the token layer, the four `*AcrylicBackgroundFillColor*Brush` keys, and `AcrylicInAppFillColorDefaultBrush`.
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

`MenuFlyout` reaches the same place by a longer route, and joins this entry rather than opening
its own. `MenuFlyoutPresenterBackground` is `DesktopAcrylicTransparentBrush`, `#00000000` in all
three themes: the presenter paints nothing, and what a menu card actually shows is its
`SystemBackdrop`, `AcrylicBackgroundFillColorDefaultBackdrop` — a bare `<DesktopAcrylicBackdrop
/>` element at `AcrylicBrush_themeresources.xaml:54` with no value a stylesheet could carry. The
surface therefore paints `AcrylicBackgroundFillColorDefaultBrush`, one of this entry's four keys,
and composites the presenter's own brush over it, which keeps the consumer's override point. On
the reference guest the original's card measures a flat 249 down its middle and the brush emits
`#f9f9f9`, so the visible result agrees to the byte; over a different backdrop it would not, for
exactly the reason above.

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
  `CheckBox`'s check glyph, `ItemContainer`'s multi-select check glyph, `Expander`'s chevron,
  and `DropDownButton`'s and `SplitButton`'s chevrons, and the AnimatedIcon page's two
  examples.
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
  title bar glyphs, CheckBox's E73E and E9AE, Expander's E70D and E70E, and
  DropDownButton's and SplitButton's E96E — with no transition between pointer states.

  **The glyph is not always the same shape as the animation's frame, and Expander is where
  that was first measured.** Its chevron is `AnimatedChevronUpDownSmallVisualSource`, which
  morphs between the two directions rather than swapping glyphs; at 12px on the reference
  guest the original's resting ink is 8x4 pixels and the fallback glyph's is 9x5. Both are
  centred in the same 32px button, so the difference is the glyph's own outline against the
  composition's, not a placement error.

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

  **The AnimatedIcon page is where the difference is largest, because there the icon is the
  subject rather than a detail of a control.** `AnimatedIconPage.xaml:30` puts an
  `AnimatedIcon` alone in a `Button` of width 75. `AnimatedIcon::MeasureOverride`
  (`AnimatedIcon.cpp:112`) measures the running composition — every one of these sources
  reports a `Size()` of 48 by 48, as at
  `AnimatedIcon/AnimatedVisuals/AnimatedFindVisualSource.cpp:607` — and falls through to the
  base measure only when there is no visual (`:148-152`), which is the fallback icon at its
  own size. Measured on the reference machine at the reference window width, the original's
  button is **75 by 64** around **38 by 38** of ink; ours is **75 by 33** around a 20 by 20
  glyph, because `g_ClientCoreFontSize` is 20 (`icon.cpp:13`, applied to `SymbolIcon` at
  `:318`). The two buttons' top edges agree to a pixel and the whole difference is height.
  It cascades: the second example sits 30 pixels higher than the original's for this reason
  alone, and nothing else on the page moves.

  A 20-pixel glyph centred in a 48 by 48 box would close that gap and is not written, because
  it is a state WinUI never renders — with a visual the fallback is removed from the root
  panel (`AnimatedIcon.cpp:546`), and without one there is no 48 by 48 box.

  **The page's `Kind` combo box changes the sample source and nothing on screen.** All seven
  visual sources share one `FallbackIconSource` (`AnimatedIconPage.xaml:31-33`), so the icon
  it selects between is the same Find symbol every time.

- **Why accepted**: not because the motion cannot be read. **That was this entry's stated
  reason, and it was false** — correcting it is what v14 owes this entry. The pin ships
  LottieGen's output as C++ that spells the timeline out. In
  `AnimatedIcon/AnimatedVisuals/AnimatedChevronUpDownSmallVisualSource.cpp`, `:104` declares
  `c_durationTicks{ 43333333L }` — 4.3333 seconds; `:352`, `:357`, `:362` and `:367` create
  four cubic Bézier easing functions with their control points written out; an
  `InsertKeyFrame` carries each keyframe's progress and value from `:428`; and `:784` returns
  a `Markers()` map naming every state transition's start and end as a fraction of that
  timeline, of which `NormalOnToPointerOverOn` runs 0.115577 to 0.150192 — 150 milliseconds.
  None of that needs re-authoring by eye against a running copy of Windows.

  What is true is the cost, and the ordering. The same file carries path morphs, expression
  animators and geometry that a keyframe list alone does not describe, so reproducing one of
  these is a transcription of a scene graph rather than of a timeline — and this library has
  no motion vocabulary to transcribe it into. **D34 splits roadmap item 14 for that reason**:
  Styles is v14, Motion is v15, and the easing set, the transition primitives and the
  connected-animation machinery all arrive there. Meanwhile the glyph we render is not an
  approximation — it is the icon WinUI itself paints, through `FallbackIconSource`, wherever
  the animated source cannot run.

- **Would reconsider if**: v15 lands the motion vocabulary these can be expressed in. The
  entry is deleted rather than amended, because by then each of them animates the way the
  original does. This bullet used to name the Styles tranche, which is the second thing it
  had wrong: Styles is where the page lands, not where the motion does.

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

_Eight entries. The next is expected to be TabView's arrow-key traversal. Every surveyed
primitive library — bits-ui, Zag and therefore Ark, and Melt — builds its roving-focus
candidate set by querying for a role or data attribute, which cannot match a close button
nested inside a tab trigger. So the button is reachable by Tab and not by arrow keys, and that
is a property of the standard roving-tabindex pattern rather than of any one library.
Recorded here once the control is built and the behaviour is observed rather than predicted._

---

### WD-010 — changing ExpandDirection while expanded redraws both corners

- **Control**: `Expander`.
- **WinUI does**: leave the header's corner radius filtered for the direction it was
  expanded in. `Expander.cpp:129`'s `OnExpandDirectionPropertyChanged` calls
  `UpdateExpandDirection` and nothing else, so the `ExpandDirectionStates` group moves and the
  `ExpandStates` group — which is where the header's `CornerRadius` filter lives, at
  `Expander.xaml:62` and `:33` — keeps the state it was already in. Driven on the reference
  guest at the Gallery's own example: a Down-expanded Expander switched to Up drew the content
  rounded on top and square below, and the header rounded on top and square below too, so the
  seam between them had a notch on one side. A collapse and re-expand corrected it.
- **We do**: derive both corner radii from the current direction and open state together, so
  the two agree at every moment and the seam is always square on both sides.
- **Why accepted**: the divergence is that we do not reproduce a defect. Reproducing it would
  mean holding a copy of the direction as of the last open/close and rendering from the stale
  copy — inventing state to be wrong with, in a control that has none. It is recorded rather
  than left silent because a later reader comparing against a mis-driven original would
  otherwise "fix" the component to match the notch.
- **Would reconsider if**: upstream makes the stale filter deliberate — a `ThemeResource` or a
  state that names it — rather than a missing call.

---

### WD-011 — collapsing upward removes the content 33ms earlier than upstream hides it

- **Control**: `Expander`.
- **WinUI does**: hide the content at a different moment in each direction. `CollapseUp`, the
  state a downward Expander enters when it closes, sets `Visibility="Collapsed"` at
  `Expander.xaml:82`, 167ms in, exactly as its slide finishes. `CollapseDown`, the state an
  upward Expander enters, sets it at `:53`, 200ms in — 33ms after its own slide, which runs
  for the same 167ms, has ended.
- **We do**: remove the content when its transition finishes, in both directions. bits-ui's
  presence layer keeps the node mounted until `getAnimations()` resolves and unmounts it then,
  so the upward case loses the extra 33ms of a fully translated, fully clipped panel.
- **Why accepted**: what the 33ms delays is the moment the control's box shrinks back to the
  header, and it delays it by two frames at 60Hz with nothing drawn in the gap. Holding it
  would mean either a second timer racing the primitive's own unmount, or a dummy transition
  declared only to be waited on — both of which put a mechanism in the component to reproduce
  what reads as an unrounded number in one of four visual states.
- **Would reconsider if**: the two values are found to differ on purpose — the symmetry of
  every other value in this template says they do not — or a later surface control needs a
  general way to hold a primitive's content past its own animation, in which case this becomes
  its first user rather than its only one.

---

### WD-013 — a menu item's padding never widens for touch

- **Control**: `MenuFlyout`, and every item in it.
- **WinUI does**: switch a menu item's padding on the input device that opened the flyout.
  `MenuFlyout_themeresources.xaml` carries two: `MenuFlyoutItemThemePadding` `11,8,11,9` and
  `MenuFlyoutItemThemePaddingNarrow` `11,4,11,5`. The template's `PaddingSizeStates` group
  picks between them, and the comment above it states the rule — "Narrow padding is only
  applied when flyout was invoked with pen, mouse or keyboard. Default padding is applied for
  all other cases including touch." A menu opened by touch is 8px taller per item.
- **We do**: draw the narrow padding always. Measured on the reference guest with a mouse, an
  item box is 28 tall — 4 + 19 + 5 — inside a 32px row, and the card that holds three of them
  and one separator is 105 tall. That is the form this control reproduces, and
  `MenuFlyoutItemThemePadding` is not seeded, because a control that cannot reach the state is
  not a control that reads the token.
- **Why accepted**: the state has no input to switch on. A `PointerEvent`'s `pointerType` says
  how the _current_ event arrived, not how the flyout was opened, and it is absent entirely
  when the menu is opened from the keyboard or programmatically — so the branch would be
  guessing on the majority of opens. `@media (pointer: coarse)` asks a different question, of
  the device rather than the gesture: it would widen every item on a touchscreen laptop whose
  user is holding a mouse, which is the case WinUI's rule is written to get right.
- **Would reconsider if**: the trigger's own opening event is threaded into the surface, which
  makes `pointerType === 'touch'` answerable for pointer-opened menus and leaves only the
  keyboard case — where narrow is the correct answer anyway.

---

### WD-014 — the command row is laid out in the dialog's width, and does not set it

- **Control**: `ContentDialog`.
- **WinUI does**: give `CommandSpace` five columns — star, spacer, star, spacer, star — and
  size them the way a XAML `Grid` sizes star columns: an equal share each, but never below what
  the child in the column needs. Measured on the reference guest at `ContentDialogMinWidth`,
  where the three buttons have 254px between them: `Replace` / `Keep` / `Cancel` all fit their
  84.67 share and come out **85 / 85 / 84**, and `Save` / `Don't Save` / `Cancel` come out
  **85 / 91 / 78**, because the middle one needs 91 and the other two absorb the difference. The
  Grid also _measures_ that way: it asks each button for its natural width and reports the sum,
  which is what a `Border` with `MinWidth` 320 and `MaxWidth` 548 then clamps.
- **We do**: reproduce the layout and not the measurement. `grid-template-columns: repeat(n, 1fr)`
  is the same distribution rule — an `fr` track's floor is its content's minimum — and it
  reproduces the fitting case exactly: **84.66 / 84.67 / 84.66** against the original's
  85 / 85 / 84. CSS sizes an `fr` track set differently from XAML when asked for an intrinsic
  width, though: it takes the largest contribution and multiplies by the track count, so the row
  asked for 3 x 90.34 and grew the card to 337 against the original's 320. `contain: inline-size`
  takes the row out of that measurement, and the card is 320 x 221 to the pixel.
  Two things follow. A dialog is never widened by its buttons, only by its content — and in the
  non-fitting case the slack is redistributed equally rather than by the second pass XAML makes,
  so `Save` / `Don't Save` / `Cancel` come out **81.83 / 90.34 / 81.83** where the original is
  85 / 91 / 78. The row's total, the gaps and the button that overflows its share are all right;
  the two that give way are each about 3px out.
- **Why accepted**: the two facts cannot both live on one box. The row must be measured from the
  sum of its children's natural widths and laid out from an equal division of the width that
  measurement produced, and a CSS box has one inline size. The alternative is the two-layer shape
  `MenuFlyout`'s split item uses — a hidden measuring row beside the laid-out one — which is a
  second copy of every button, kept in sync, to move two edges by three pixels.
- **Would reconsider if**: a dialog turns up whose buttons genuinely need more than 548px, where
  not widening stops being invisible and starts being an overflow.

---

### WD-015 — an opening dialog focuses itself, not its default button

- **Control**: `ContentDialog`.
- **WinUI does**: move focus into the dialog when it is shown — to `DefaultButton` when one is
  set, and to the dialog itself when `DefaultButton` is `None` — and draw a focus visual only
  if the focus arrived from the keyboard. `FocusState` carries that distinction:
  `FocusState.Programmatic` and `FocusState.Pointer` light nothing. Measured on the reference
  guest, the first Gallery example is shown from a mouse click and its accent `Save` button has
  no band around it.
- **We do**: focus the dialog's own root in every case, through `onOpenAutoFocus`. Focus is
  inside the trap, Tab reaches the three buttons in order, and no control is lit. The card is
  `tabindex="-1"` and outside the tab order, so nothing but the open handler ever focuses it,
  and its own outline is suppressed for the same reason WinUI's dialog draws none.
- **Why accepted**: `:focus-visible` is a heuristic over the user's last interaction, and there
  is no way to ask for focus without it. A page that loads with a dialog already open has had no
  interaction at all, and Chromium resolves that as focus-visible — so focusing the default
  button paints a band the original does not have, and focusing the CheckBox in the Gallery's
  content, which is what the primitive does unaided, paints the CheckBox's. The behaviour lost is
  Enter-activates-the-default-button from the moment the dialog opens; the behaviour kept is that
  focus is inside the dialog, which is the part a keyboard user cannot work around.
- **Would reconsider if**: the open transition can be attributed to a keyboard interaction, which
  makes focusing the default button correct rather than merely faithful — at that point the ring
  is what WinUI would draw too.

---

### WD-016 — TeachingTip does not honour its minimum width

- **Control**: `TeachingTip`.
- **WinUI does**: declare `TeachingTipMinWidth` as 320 in
  `TeachingTip_themeresources.xaml:73`, then set it as `MinWidth` on the outer and tail-occlusion
  grids at `TeachingTip.xaml:282` and `:297`. With the two 8px tail tracks, that would floor the
  card at 304px.
- **We do**: set no minimum width. The card is sized by its content and capped at 320px, which is
  `TeachingTipMaxWidth` minus the two 8px tail tracks.
- **Why accepted**: the shipped control on the reference machine does not honour the declared
  floor. Two independent Gallery examples measured 224px and 248px, both below it, while
  `TeachingTipMaxWidth` on the same two elements is honoured — the hero example measures exactly
  336px minus two 8px tracks. Reproducing the dictionary would make every tip wider than the
  control being copied.
- **Would reconsider if**: the shipped control starts honouring the floor. This entry is a
  disagreement between the pin and the build, not between WinUI and this library, so the test
  is a measurement rather than a decision: a Gallery tip measuring 304 or more on the reference
  machine closes it. Until then a consumer who wants the documented floor sets `min-width`
  through `style` or `class`, and sees a tip narrower than 320px if they do not.

---

### WD-017 — TeachingTip leaves its content slot directly under the subtitle

- **Control**: `TeachingTip`.
- **WinUI does**: the `Content` state in `ContentStates` (`TeachingTip.xaml:64`) sets
  `MainContentPresenter.Margin` to `TeachingTipMainContentPresentMargin`, whose value is
  `0,12,0,0` in `TeachingTip_themeresources.xaml:78`, putting 12px above content.
- **We do**: put no margin above the content slot.
- **Why accepted**: the shipped control on the reference machine does not apply that state. The
  Gallery's hero example measures 16px between the subtitle and description, exactly the
  Gallery TextBlock's own `Margin="0,16,0,0"`; with the upstream state live, the gap would be
  28px and the card would be 322px tall instead of its measured 310px.
- **Would reconsider if**: the shipped control starts applying the state — the same measurement
  test as WD-016, and on the same control. A Gallery hero tip measuring 322 rather than 310
  closes it. Until then content sits directly under the subtitle, and a consumer who wants the
  documented gap puts it on their own content, which is where the reference Gallery's own 16px
  comes from.

---

### WD-018 — a wrapped paragraph's later lines sit a fraction of a pixel low

- **Control**: every control that draws text through a type-ramp class.
- **WinUI does**: advance the baseline within one `TextBlock` by the font's unrounded line
  spacing — `(hhea.ascender - hhea.descender + hhea.lineGap) / head.unitsPerEm`, which is
  18.621px at Body size — and let each baseline land where it falls on the pixel grid. Measured on
  the reference guest: the Typography page's own description wraps to three lines with baselines
  19 then 18 apart, and to two lines with baselines 18 apart when the window is maximised. Only a
  fractional advance produces both from the same font at the same size.
- **We do**: give the ramp classes `line-height: normal`, which Chromium computes as
  `round(ascent_px) + round(descent_px)` — an integer, 19 at Body size, identical on every line.
  A second line is 0.379px low, a third 0.758px, and so on.
- **Why accepted**: CSS has one `line-height` and WinUI has two behaviours. The other one is that
  a single-line `TextBlock` occupies a whole number of pixels, because `UseLayoutRounding` is on
  by default — the pins opt fifty-one individual elements out of it and the one that opts in
  restates the default — and a unitless ratio, which would fix this entry, takes 0.379px off every
  one of those boxes
  instead. Measured on TeachingTip's card, which stacks three of them: 310.469 with `normal`
  against the original's 310, and 309.297 with the ratio. This library is overwhelmingly
  single-line boxes stacked inside containers whose height is the thing being compared, and
  wrapped paragraphs are rare, so the error is put where there is less of it. ADR 0011 has the
  measurements and the arithmetic.
- **Would reconsider if**: CSS grows a way to say "the font's spacing, unrounded, but round the
  element box" — `text-box-trim` and `text-box-edge` are the shape that could get there — or if a
  control lands whose reproduction turns on a wrapped paragraph of four or more lines, where the
  drift reaches a pixel and a half and a local `line-height` on that one element becomes worth its
  cost.

---

### WD-019 — a split button is two tab stops, and its keyboard press does not span

- **Control**: `SplitButton` and `ToggleSplitButton`.
- **WinUI does**: put `IsTabStop="True"` on the control and `IsTabStop="False"` on both inner
  buttons (`SplitButton.xaml:15`, `:227`, `:228`), so the whole control is one tab stop; Space,
  Enter and GamepadA invoke the primary half (`SplitButton.cpp:334`–`:349`), Alt+Down (`:350`)
  and F4 (`:362`) open the flyout. While a key is held, `SecondaryButtonSpan`
  (`SplitButton.xaml:211`) moves the secondary button to column 0 with `ColumnSpan="3"` so it
  covers the control.
- **We do**: render two real `<button>` elements, which is two tab stops, each activated by Space
  and Enter in its own right; no Alt+Down and no F4; and no span, because it is visible only while
  a key is physically held and `TouchPressed` — which we do implement, and which fires in the
  same breath — is what paints that moment.
- **Why accepted**: HTML's two native buttons provide the two independently operable halves and
  their browser keyboard behavior without inventing a composite focus model solely for a
  momentary hit-testing overlay.
- **Would reconsider if**: a web primitive supplies one tab stop with two native-action regions
  and the same keyboard routing without replacing the controls' ordinary semantics.

---

### WD-020 — the touch and game-controller input modes are not reproduced

- **Control**: `AppBarButton` and `AppBarToggleButton`, in the overflow appearance
  (`AppBarButton_themeresources.xaml:324`–`:335`,
  `AppBarToggleButton_themeresources.xaml:445`–`:458`).
- **WinUI does**: use three input-mode states. Touch and game-controller input both replace the
  overflow label's default padding with `0,9,0,12`; the toggle row also replaces its check
  glyph margin with `12,10,12,10`. Those changes make an overflow row eight pixels taller.
- **We do**: always use the default overflow-label padding and, for toggle rows, the default
  check-glyph margin.
- **Why accepted**: WinUI chooses the state from the device of the last input event, a global
  framework signal. A coarse-pointer media query instead describes a static capability and is
  wrong in both directions on hybrid hardware; game-controller input has no equivalent web
  signal.
- **Would reconsider if**: the library gains a shared last-input-device signal for another
  reason, or CommandBar overflow is measured against the original on a touch-only device.

---

### WD-021 — the pivot's header row is static, and does not carousel

- **Control**: `Pivot`.
- **WinUI does**: carry a second, dynamic header. `Pivot_themeresources.xaml:298-311` declares
  `HeaderDynamic` and `HeaderStatic`; the dynamic one keeps the selected header pinned at the
  left and slides the rest under a clip, `UnselectedLocked` (`:519`) translates a header out by
  `PivotHeaderItemLockedTranslation` (40) and fades it, and the `NavigationButtonsVisibility`
  group (`:259`) reveals two 20x36 arrow buttons at `:429` and `:430` that step the carousel.
- **We do**: render the static header only. Every header is drawn in place, the selection moves
  the pipe and nothing else, no arrows exist, and a row wider than the control is clipped
  (`overflow: hidden`) with no way to reach the part past the cut.
- **Why accepted**: the carousel is the phone-era interaction the control was designed around,
  and the original does not show it on the acceptance surface — selecting a later header on
  Windows moves the pipe and leaves the labels where they are, which was photographed and is
  what `HeaderStatic` does. Building the dynamic header would mean reproducing a snap-point
  scroll and a per-header translation storyboard for a state the Gallery never enters, and the
  arrows are a fifth control's worth of template for a row of four labels that fits.
- **Would reconsider if**: a page puts more headers in a Pivot than its width holds. The clip is
  what makes that unreachable rather than merely ugly, so the first such page is the trigger,
  and the arrows are the smaller half of the work — the dynamic header is the rest.

---

### WD-022 — a header's glyphs keep their side bearings, so the ink sits a pixel or two right

- **Control**: `Pivot`, where it was first measured; the attribute it comes from is on text
  parts across the pinned source.
- **WinUI does**: set `OpticalMarginAlignment="TrimSideBearings"` on the parts that draw the
  header and the title — `Pivot_themeresources.xaml:586` for the header item's
  `ContentPresenter` and `:231` for the one every title inherits. XAML then pulls the first
  glyph's left side bearing out of the layout, so the ink of `All` starts exactly where its
  content box does.
- **We do**: nothing, because CSS has no equivalent. `text-indent` with a negative value would
  need the bearing of whatever glyph happens to be first, which is a font measurement a
  stylesheet cannot take. The declaration has been dropped project-wide since v1 —
  `scripts/tokens/generate.mjs` lists `OpticalMarginAlignment` among the type-ramp's ignored
  setters — and this is the first unit that measured the difference rather than assuming none.
- **Why accepted**: measured on the original against ours, the box is identical and only the
  ink moves. The selected pipe under `All` is 26px wide in both and under `Flagged` 82px in
  both; the ink is 23px and 78px wide in both; every header's box sits at the same x in both.
  What differs is the offset from the pipe's left edge to the first ink pixel: 0 and 0 on
  Windows, 1 and 2 in the browser, which is the left side bearing of `A` and `F` at 24px. It
  does not accumulate — the next header starts at the same place either way — so the cost is a
  one- to two-pixel shift of a label inside a box that is in the right place.
- **Would reconsider if**: a control puts trimmed text against a hard edge where the bearing is
  the whole margin, rather than inside a 12px padding. A per-glyph measurement in script, run
  once per label, is the mechanism; it costs a layout pass per header and buys back one pixel.

---

### WD-023 — tabs cannot be dragged, reordered or torn out

- **Control**: `TabView`, `TabViewItem`.
- **WinUI does**: make the strip a drag source and a drop target. `CanReorderTabs`, `CanDragTabs`
  and `AllowDropTabs` are three properties on the control (`TabView.xaml:39`); `TabViewItem`'s
  template carries a `ReorderHintStates` group of five states and a `DragStates` group of eleven
  (`TabView.xaml:411-472`), a `TabDragVisualContainer` painted in
  `TabViewItemHeaderDragBackground` (`:554`), and `TabView.cpp:338-356` turns all three bottom
  border lines off together while a drag is in flight. Dragging a tab out of the strip raises
  `TabDroppedOutside`, which the Gallery's windowing sample answers by opening a second OS window.
- **We do**: none of it. A tab is selected and closed and nothing else; the reorder and drag
  state groups have no counterpart, and `Control+Tab` is left to the browser, which owns that
  chord.
- **Why accepted**: two different reasons that both hold on their own. Tear-out needs a second
  top-level window, which a page cannot open — the same wall `WD-020` and the TitleBar deferrals
  meet. Reordering does not need one, and is declined for its weight rather than its possibility:
  the drop indicator, the eleven drag states and the three-way border-line suppression are a
  second unit's worth of work for an interaction the acceptance surface never shows in a still
  frame, and the Gallery demonstrates it in prose rather than in a state the gate can compare.
- **Would reconsider if**: reordering is asked for as a feature rather than as fidelity. The HTML
  drag-and-drop API expresses it, the drop indicator is one absolutely positioned rule, and the
  honest cost is the eleven states — not the drag.

---

### WD-024 — the strip does not scroll a newly selected tab into view

- **Control**: `TabView`'s tab strip.
- **WinUI does**: `TabView::BringSelectedTabIntoView` (`TabView.cpp:748`) scrolls the selected
  tab fully into the viewport whenever the selection or the layout changes.
- **We do**: change what is drawn for selection and leave the scroll offset where the user put
  it; the two scroll buttons and the wheel are the only things that move it.
- **Why accepted**: the visual contract of the strip does not require selection to move the
  viewport, while reproducing it needs per-tab geometry and a scroll operation on every
  selection and layout change.
- **Would reconsider if**: a selected tab outside the viewport becomes a required interaction
  path, at which point the selected tab's bounds can drive the same scroll adjustment.

---

### WD-025 — top-pane children are not rendered

- **Control**: NavigationView
- **WinUI does**: a top-pane item with children draws a chevron and opens its subtree in a
  `Flyout` — `NavigationView.xaml:469`, the `ChildrenFlyout`; the Gallery demonstrates it on
  its hierarchical sample's `Top mode` radio (`NavigationViewPage.xaml:316-336`).
- **We do**: the top pane renders top-level entries only. An entry's `children` are not drawn
  and no chevron appears; the same entry in the left pane still expands.
- **Why accepted**: the subtree is a second portalled surface per item, with its own placement,
  dismissal and keyboard contract, on top of the one this unit already opens for the overflow
  row. It is a mechanism rather than a value, and the overflow flyout is the one this version's
  Done-when compares against the original.
- **Would reconsider if**: the Gallery's hierarchical sample enters the acceptance comparison,
  which happens when roadmap item 10 puts these pages on `ControlExample`.

---

### WD-026 — a collection renders every item, and nothing is virtualised

- **Control**: ItemsRepeater, and every collection control this tranche builds on it.
- **WinUI does**: realise only the elements inside the viewport plus a cache buffer, recycle
  them as the viewport moves, and publish that machinery — `HorizontalCacheLength` and
  `VerticalCacheLength` default to 2.0 viewport-lengths each
  (`.upstream/microsoft-ui-xaml/controls/dev/Repeater/ItemsRepeater.idl`), `ElementPrepared`,
  `ElementClearing` and `ElementIndexChanged` report each realisation, and `GetElementIndex`,
  `TryGetElement` and `GetOrCreateElement` reach the realized elements. Virtualisation is the
  reason `ItemsRepeater` exists upstream at all.
- **We do**: render every item into the DOM, in order, and carry none of those eight members.
- **Why accepted**: the largest collection any page in the Gallery's Collections group builds
  is 1 000 recipes (`.upstream/WinUI-Gallery/WinUIGallery/Samples/ItemsRepeater/ItemsRepeaterPage.xaml.cs:346-347`)
  and the next largest is 500 integers (the same file, line 26); a browser lays out a thousand
  rows without complaint, so the acceptance surface never reaches the size the machinery is
  for.
- **Would reconsider if**: a page in this reproduction is given a collection large enough to
  drop frames on the reference machine, which no page in the pinned Gallery's Collections group
  is.

---

### WD-027 — ItemsView and TreeView items are each a tab stop, and there is no current item

- **Control**: `ItemsView` and `TreeView`.
- **WinUI does**: the view is a single tab stop — `IsTabStop="False"` and
  `TabNavigation="Once"` on its Style, `ItemsView.xaml:6-7`. Tab enters it and lands on one
  item; arrow keys move a _current item_ between items, which `CurrentItemIndex`
  (`ItemsView.idl:47`) reports and which `OnFocusedAction` on each selector can turn into a
  selection; Tab leaves the whole view. A tree also moves with Left and Right, which collapse
  and expand a branch and step to a parent or first child (`TreeViewItem::IsExpandCollapse`,
  `TreeViewItem.cpp:527`).
- **We do**: every `ItemContainer` a consumer's template renders is a tab stop of its own,
  which is `ItemContainer`'s own default. Tab walks the items in document order. There are no
  arrow keys, no Home or End, and no `CurrentItemIndex`, because without focus management the
  property would report nothing the view actually knows. A TreeView branch opens by clicking
  its chevron and by Enter or Space on a row that has one.
- **Why accepted**: it is WD-004's situation on a second control, and the same answer. The
  keyboard contract for a grid of items is a roving-tabindex state machine whose candidate set
  changes with the layout — a stack moves by one, a uniform grid by a row, a lined flow by a
  line whose length is measured — and getting it wrong is worse than not having it, because a
  half-working arrow key is a trap where a Tab key is merely a longer road. The visual bar this
  project sets is met either way: focus draws the same band on the same element.
- **Would reconsider if**: the tranche's `TreeView` unit builds the roving-tabindex rig WD-004
  is already waiting on, at which point both rows are re-examined together and this one is
  deleted if the rig fits a two-dimensional candidate set.

---

### WD-028 — a FlipView moves by its buttons, and does not scroll

- **Control**: `FlipView`.
- **WinUI does**: the panel is inside a `ScrollViewer` whose snap points are `MandatorySingle` on both axes (`FlipView_themeresources.xaml:297`), so a drag, a wheel or a touch swipe moves the carousel and lands on an item; the flip buttons are one way in.
- **We do**: move a transform by one item's width when a flip button is pressed, and nothing else. There is no drag, no wheel and no swipe, and the panel cannot be left between two items.
- **Why accepted**: the resting visual is the same — an item filling the viewport with a button at each end — and what differs is the motion between two states rather than either state. Reproducing it needs a scroll container with snap points and a scroll handler that writes `selectedIndex` back, which is a scroll-position feedback loop of exactly the kind v8's sixth unit paid for; the Scrolling tranche is where the container it needs gets built.
- **Would reconsider if**: the Scrolling tranche lands a `ScrollView` this control can sit in, at which point the transform becomes a scroll offset and this row is deleted.

---

### WD-029 — the annotated image above each design table is absent

- **Control**: the Gallery's Typography and Geometry pages.
- **WinUI does**: put two things in one `ControlExample`. Above, a `Canvas` holding one
  annotated PNG from `Assets/Design/` with `TeachingTip` buttons pinned over it at fixed
  coordinates — `TypographyPage.xaml:54-160` and `GeometryPage.xaml:51-150`. Below it, in a
  second `ScrollViewer`, the table of rows: nine type-ramp rows at `TypographyPage.xaml:162-265`
  and three corner-radius rows at `GeometryPage.xaml:151-249`.
- **We do**: draw the table and not the image. The table is the original's own, row for row —
  v1 read the type ramp's nine rows out of that markup and they are what
  `data/winui-gallery-design.json` carries.
- **Why accepted**: the images are Microsoft binaries inside `.upstream/`, which this repository
  deliberately does not track, and every annotation on them is a coordinate measured against
  their pixels. Nothing about the token layer or the frame is shown by them that the table below
  does not show, which is why the pages were built this way in v1 — what was missing until now
  is this entry.
- **Would reconsider if**: the assets become redistributable and their annotation coordinates
  are recorded as data. The renderer is the cheap half; a tracked image and a list of tip
  positions is what does not exist.

### WD-030 — a Viewbox sized on one axis does not follow its scale on the other

- **Control**: Viewbox.
- **WinUI does**: measure the child unconstrained and, when only one axis of the box is
  constrained, take that axis's scale for both and report the scaled size on the free axis —
  `CViewbox::ComputeScaleFactor` in `dxaml/xcp/core/core/elements/Viewbox.cpp:99-108` at the
  pin's commit, outside the sparse checkout. A Viewbox with `Width="200"` and no `Height` is
  therefore 200 wide and as tall as the child scaled to 200.
- **We do**: scale from whatever box CSS gives the root. With both axes given by the caller the
  scale is the original's; with neither the box is the child's natural size at scale 1; with one
  axis the child is scaled by that axis and the other axis keeps the child's own size, so the box
  is the wrong height (or width) by the scale.
- **Why accepted**: the component would have to know which axis the caller left free, and CSS
  reports a resolved length for both; the Gallery's page and every sample this library shows
  size both axes. Setting the free axis from the measurement is a feedback loop through the
  `ResizeObserver` that this version did not want to build blind.
- **Would reconsider if**: a consumer sizes one axis, or the page does. The mechanism is to
  observe the child's natural size and set the root's free axis to it times the scale, breaking
  the loop by writing only when the value changes.

### WD-031 — two of the ten calendar identifiers render a Gregorian grid

- **Control**: CalendarView, and every control that carries a `CalendarIdentifier` through to
  it.
- **WinUI does**: resolve `CalendarIdentifier` against `Windows.Globalization`, which
  implements every identifier the Gallery's page offers, including `JulianCalendar` and
  `KoreanCalendar` — the Julian reckoning that ran until the Gregorian reform, and the Korean
  calendar that counts years from 2333 BC. Each has its own month lengths, leap rule and era.
- **We do**: map both to `gregory`, so a page that asks for either gets the Gregorian grid
  under a Gregorian header. The other eight identifiers are exact: `@internationalized/date`
  implements Hebrew, Islamic civil, Islamic Umm al-Qura, Japanese, Persian, Minguo, Buddhist
  and Gregorian, and D31 puts the month grid on a primitive that computes it in whatever
  calendar the date carries.
- **Why accepted**: the two missing systems are not a formatting gap, they are two calendar
  implementations — a `toJulianDay`/`fromJulianDay` pair, month lengths and an era table each,
  written against a package's interface and verifiable against nothing this project has. The
  Gallery's page offers the identifier in a ComboBox and every other page in the tranche uses
  the default, so what a reader sees is a list of ten whose eighth and ninth entries redraw
  the grid they already had.
- **Would reconsider if**: `@internationalized/date` gains either calendar, or a consumer
  needs one. The mechanism is that package's `Calendar` interface, which the grid already
  consumes generically — a correct implementation drops in with no change to any component.
  The page keeps both rows meanwhile, because dropping them would change the page the
  acceptance gate compares.

### WD-032 — the weekday row's two-letter names are derived, not looked up

- **Control**: CalendarView.
- **WinUI does**: ask the calendar for the shortest weekday string (`DayOfWeekAsString(1)`,
  `CalendarView_Partial.cpp:2239-2243`), CLDR's _short_ width — `Su`, `Mo` in en-US, distinct
  from both abbreviated (`Sun`) and narrow (`S`).
- **We do**: take the abbreviated `Intl.DateTimeFormat` weekday name's first two characters,
  **unless that leaves two weekdays with the same label**, in which case the abbreviated names
  are used whole. Intl exposes the abbreviated and narrow widths and not CLDR's short one, so the
  truncation is exact for en-US and for the Latin-script locales whose short width is the
  abbreviated name truncated, and it is wrong elsewhere: `ar` abbreviates every weekday to a name
  beginning `ال`, and seven identical labels are a worse answer than seven long ones. Measured by
  driving the control through five languages. `DayOfWeekFormat` formats without truncation and is
  the escape hatch.
- **Why accepted**: the primitive supplies the correctly ordered abbreviated names, while the
  missing Intl width leaves no native string to look up.
- **Would reconsider if**: Intl exposes that width, or a consumer needs a locale it gets wrong.

### WD-033 — the month view is always six weeks

- **Control**: CalendarView.
- **WinUI does**: default `NumberOfWeeksInView` to 6 and accept 2 through 8
  (`CalendarView_Partial.h:364-367`), where counts other than six make a scrolling window over
  a continuous run of weeks.
- **We do**: use bits-ui's `fixedWeeks`, which renders the weeks spanning the month padded to
  six. `NumberOfWeeksInView` is absent rather than accepted and ignored.
- **Why accepted**: six is the WinUI default and every state the Gallery page reaches; a
  scrolling panel is a different component shape from a shorter grid.
- **Would reconsider if**: a consumer needs another count. The needed mechanism is a continuous
  week-window panel rather than a `fixedWeeks` option.

### WD-034 — the calendar identifier changes arithmetic, not numerals or direction

- **Control**: CalendarView.
- **WinUI does**: render `CalendarIdentifier="HebrewCalendar"` with `Language="English"` as
  Hebrew numerals right to left, deriving numbering system and reading direction from both the
  calendar and language.
- **We do**: format in the language's numbering system and lay out left to right, so that same
  grid is a Hebrew month with Western digits.
- **Why accepted**: the mechanism to append `-nu-` to the locale and set `dir` from the
  identifier is one line each, but Windows' rule for choosing them is not published where this
  project can read it.
- **Would reconsider if**: the Windows rule becomes available, or a consumer needs it.

### WD-035 — a pull is a pointer drag, where the original takes only touch

- **Control**: RefreshContainer.
- **WinUI does**: redirect to its interaction tracker only for a touch pointer
  (`ScrollViewerIRefreshInfoProviderAdapter.cpp:159`) with a redirection mode of
  `CapableTouchpadOnly` (`:311`). A mouse never manipulates, so the visualizer never leaves
  `Idle`. The Gallery's page offers no button and the control has no automation peer, so on a
  mouse-only desktop the original's page cannot be provoked at all.
- **We do**: accept a pointer drag at the start of the scrolled content, which a mouse
  satisfies.
- **Why accepted**: this is a divergence in the direction the project rarely takes — ours does
  more rather than less — and the alternative is a control no reachable input can reach. At rest
  the two agree exactly, which is what the page compares.
- **Would reconsider if**: a touch-capable reference host makes the original's own gesture
  observable, at which point the two can be compared rather than only ours described.

### WD-036 — a wheel over a scrollbar does not scroll what it belongs to

- **Control**: ScrollView, and every region built on it.
- **WinUI does**: scroll the content when the wheel turns over the scrollbar's own strip, as
  every Windows scroller does.
- **We do**: nothing. The bar is a sibling of the viewport rather than inside it, so the event
  reaches a root whose overflow is hidden.
- **Why accepted**: the bar is 14 pixels wide and the pointer is over it only while the reader is
  about to drag the thumb, which works. Nothing in either pinned page depends on it.
- **Would reconsider if**: the cost of a wheel handler that forwards to the viewport is ever
  weighed against a reader who notices. It is three lines; what stopped it here is that no unit
  of this version had it in scope.

---

### WD-037 — a NavigationView draws no back button

- **Control**: `NavigationView`.
- **WinUI does**: default `IsBackButtonVisible` to `NavigationViewBackButtonVisible::Auto` —
  the `MUX_DEFAULT_VALUE` at `NavigationView.idl:244`, above the property at `:245` — so a
  `NavigationView` that says nothing about it renders a back button in its own pane, above the
  pane toggle. The button is disabled while `IsBackEnabled` is false, which is that property's
  own default (`:246` carries no `MUX_DEFAULT_VALUE`, so a `Boolean`'s zero), and activating it
  raises `BackRequested` (`:248`).
- **We do**: render no back button, and take no prop for one. The pane opens at the toggle, so
  every row below moves up one place. Measured on the reference machine at the reference window
  width, against the original rendered on the same screen: the control is **94 pixels tall
  against the original's 133**; our pane toggle's row is centred 25 pixels below the control's
  top, where the original's back chevron is centred 23.5 and its toggle 63.5; and our one menu
  item is centred 67 below the top against the original's 104. The remaining two or three
  pixels — by which 39, 37 and the back button's own 40 fail to agree — are margin, not a
  second missing element: our pane toggle's row measures 36, which is what
  `PaneToggleButtonHeight` (`NavigationView_themeresources.xaml:205`) says it should be.
- **Why accepted**: the Gallery's own window has never shown it, so the gap has been invisible
  rather than absent. `MainWindow.xaml:142` sets `IsBackButtonVisible="Collapsed"` on the
  `NavigationView` and puts the back button in the title bar instead, bound to the frame's
  `CanGoBack` at `MainWindow.xaml:27` — and this library's `TitleBar` already draws that one.
  The AnimatedIcon page is the first place in the reproduction where a `NavigationView` appears
  with the member left at its default. Adding it is a component change — a visibility prop
  whose XAML type is a three-member enum rather than a boolean, an enabled prop, a
  `BackRequested` equivalent, the button's own template region, and a baseline for each — which
  is its own unit and not a page's.
- **Would reconsider if**: a page or a consumer needs a `NavigationView` that navigates back.
  Nothing was decided against here; this is a member the control has not been given yet, and
  the entry exists so that the next reader finds that written down rather than inferring a
  decision from an absence.

---

### WD-038 — the gradient origin is inert, because a CSS gradient has no focal point

- **Control**: `RadialGradientBrush`, on the Gallery's RadialGradientBrush page.
- **WinUI does**: give the brush a `GradientOrigin` distinct from its `Center` — the point the
  first gradient stop is drawn at, from which the ramp runs outward to the ellipse that
  `Center`, `RadiusX` and `RadiusY` describe. It reaches Composition as a
  `GradientOriginOffset`, the vector from the centre to the origin
  (`RadialGradientBrush.cpp:180`), and the page's own two sliders drive it
  (`RadialGradientBrushPage.xaml:90-102` and `RadialGradientBrushPage.xaml.cs:80`). Moving it
  pulls the yellow core off centre while the blue rim stays where it is.
- **We do**: paint the sample with a CSS `radial-gradient`, which has one centre and no second
  point. The GradientOrigin.X and GradientOrigin.Y sliders move, and the XAML in the Source
  code expander follows them, because the two substitutions are live — but nothing in the
  painted rectangle changes. At rest the gap is invisible and the page is exact: the load-time
  reset at `RadialGradientBrushPage.xaml.cs:64-71` puts all six numbers at 0.5, so the origin
  sits on the centre. Every other member is reproduced. `Center` and the two radii are the
  gradient's position and its two radii; `MappingMode` is the unit those numbers carry, a
  percentage of the box or a pixel; and `SpreadMethod` is a plain gradient for Pad, a repeating
  one over the ellipse for Repeat, and a repeating one over twice the ellipse with the stops run
  back again for Reflect — which are the three extend modes `RadialGradientBrush.cpp:211-230`
  maps them to.
- **Why accepted**: the alternative is not a CSS one, so the trade is not between two ways of
  writing this page. SVG's own `radialGradient` does carry a focal point, and a spread method,
  and a choice of units, and it would answer this brush member for member. What it costs is a
  paint server: a defs subtree carrying a document-global id, referenced out of a fill by that
  id, which is a shape of markup this tree has nowhere else and which exactly one page would
  use. D35 has already settled what a brush is here — a value, not a component — and a CSS
  gradient is a value. Weighed against that, what is given up is two controls out of eight, on a
  page whose rest state, which is the state this project is judged in, is identical either way.
- **Would reconsider if**: a second surface needs a focal gradient — another page, or a token.
  One call site is a page's own stylesheet; two is a paint server that has earned its defs, and
  at that point the focal point arrives with it at no extra cost.

---

### WD-039 — the tint controls change the sample code and not the rectangle

- **Control**: the AcrylicBrush page's three examples, and `AcrylicBrush` wherever a page
  declares one of its own rather than reading a token.
- **WinUI does**: compose a material — the backdrop behind the element, blurred, luminosity-
  blended, tint-blended and covered with a noise layer — and paint a flat `FallbackColor`
  instead whenever it cannot, which transparency-disabled, battery saver and a remote session
  each cause. `TintColor`, `TintOpacity` and `TintLuminosityOpacity` are the material's
  parameters and have no effect once it is falling back.
- **We do**: paint the `FallbackColor`, always. Example 1 reads it from the token layer, where
  `AcrylicInAppFillColorDefaultBrush` already emits the `FallbackColor` of the `AcrylicBrush`
  that key names; Examples 3 and 4 paint the colour their page-declared brush names. So the
  Tint Opacity, Tint Color and Tint Luminosity Opacity controls change the sample code the
  Source code expander shows and nothing in the rectangle, while the Fallback Color control
  changes the rectangle, because a fallback colour is what the rectangle is.
- **Why accepted**: the reference machine paints the fallback too, and this is measured rather
  than assumed — all three rectangles are one colour with zero pixel variance, the magenta
  ellipse behind them entirely hidden, Example 3 reading `#008000` and Example 1 `#f9f9f9`.
  So the reproduction and the original agree to the pixel. The web's nearest equivalent is
  `backdrop-filter`, and what it samples is whatever the browser has painted under the element
  — here, the three shapes. A `backdrop-filter` recipe would therefore show the shapes through
  the panel, and the original as photographed shows none of them, so it would move this page
  away from the reference rather than towards it.
- **Would reconsider if**: the reference machine composes the material — at which point the
  original's own rendering changes, this entry's evidence changes with it, and there is
  something to measure a `backdrop-filter` recipe against.

WD-002 is the same mechanism one layer down, and the two divide by who declares the brush.
That entry's subject is the token layer — the four `*AcrylicBackgroundFillColor*Brush` keys and
`AcrylicInAppFillColorDefaultBrush`, whose emitted value is each `AcrylicBrush`'s own
`FallbackColor`. This one's subject is a brush a page declares for itself, and the controls a
page gives it to drive: Example 1 above is WD-002's territory reached through a page, and
Examples 3 and 4 are this entry's.

---

### WD-040 — Mica Alt falls back to the solid Base Alt, which is not the colour the reference shows

- **Control**: `SystemBackdropElement` with `systemBackdrop="micaAlt"`, one of the three
  choices on the Gallery's SystemBackdropElement page.
- **WinUI does**: compose the Mica Alt material — a once-sampled desktop wallpaper tinted more
  strongly than Mica Base — and paint a flat fallback whenever composition is unavailable. The
  reference guest measures that light-theme fallback as `#e8e8e8`.
- **We do**: paint `SolidBackgroundFillColorBaseAltBrush`, `#dadada` in the light theme, fourteen
  levels darker than the reference. The other choices are exact: Acrylic reads
  `AcrylicBackgroundFillColorDefaultBrush`, whose `#f9f9f9` is the measurement, and Mica reads
  `SolidBackgroundFillColorBaseBrush`, whose `#f3f3f3` is the measurement and D16's choice.
- **Why accepted**: no pinned source states Mica Alt's fallback. `MicaBackdrop.cpp:8-17` only
  constructs a `MicaController` and sets its `Kind`; that controller is a
  `Microsoft.UI.Composition.SystemBackdrops` Windows App SDK type, in none of the three pins.
  `grep -rni e8e8e8 .upstream/` matches no pin. D16's evidence does not extend to this pair:
  the Gallery Color page gives Mica Background / Base and Solid Background / Base the same
  caption, while the Base Alt captions differ — "Default tab band background color" and "Used
  for the bottom most layer of an experience". `SolidBackgroundFillColorBaseAlt` is instead the
  only pinned solid that stands to Base as Mica Alt stands to Mica Base: darker in both themes.
  This extends D16's shape without borrowing its evidence. A measured literal would be
  light-theme-only: the guest theme is a fixed reference parameter, so neither dark nor high
  contrast can be measured, and a one-theme colour cannot enter a component.
- **Would reconsider if**: the Windows App SDK enters the pin set, or a pinned source states the
  three controllers' default `FallbackColor`s. All three could then become cited token values,
  and this entry would be deleted rather than amended.

---

### WD-041 — the three Show window buttons open nothing

- **Control**: the three `Show window` buttons on the System Backdrops page.
- **WinUI does**: open a second window with the chosen backdrop. The first opens
  `SampleBuiltInSystemBackdropsWindow` set to Mica; the second and third open
  `SampleSystemBackdropsWindow` with Mica/Mica Alt/None and Acrylic/Acrylic Thin/None,
  respectively (`SystemBackdropsPage.xaml.cs:17-48`). Each new window is the demonstration;
  the page itself shows no material.
- **We do**: render all three buttons and take no action when they are pressed.
- **Why accepted**: a web page has no second window in the sense a WinRT `Window` is one:
  `window.open` creates a browser-chrome window that can be blocked as a popup, a different
  object rather than a smaller version of the same one. D16 also decides not to approximate the
  window material. A second window whose entire content is that material would paint the same
  solid the first page already paints, so a popup would demonstrate nothing new. The three source
  expanders retain the code that performs the original action, which is what the examples are for.
- **Would reconsider if**: this reproduction gains a real window shell; then a second window
  would be real and its backdrop would be whatever D16 says.

---

### WD-042 — four text controls floor at 318 pixels, where WinUI floors at 64

- **Control**: `TextBox`, `AutoSuggestBox`, `PasswordBox`, `NumberBox`.
- **WinUI does**: bind `MinWidth` to `TextControlThemeMinWidth`
  (`TextBox_themeresources.xaml:193`, `PasswordBox_themeresources.xaml:190`), which the
  framework dictionary defines as **64** in all three themes (`generic.xaml:100`, `:3727`,
  `:5709`). A text control narrower than 64 is what upstream refuses; anything above it is
  the container's business, because the default style sets no `Width` and leaves
  `HorizontalAlignment` at Stretch.
- **We do**: write `min-width: 318px`, so none of the four can be narrower than 318 whatever
  its container says.
- **Why accepted**: only until the unit that removes it. This is a defect rather than a
  choice, and it is recorded here rather than fixed in place because the fix moves the four
  controls' baselines in three themes each and wants its own measurement pass.
- **Where 318 came from**: it is the width the Gallery's title-bar `AutoSuggestBox` has at
  the reference window size. That control is `HorizontalAlignment="Stretch"` with
  `MaxWidth="580"` (`MainWindow.xaml:42-45`), so 318 is the space it was given, not a floor it
  asserts — the two were conflated when the value was first measured. The comments that
  carried that measurement also cited a file which no longer exists: the Gallery's own
  `SearchBox` component, deleted when the title bar started using the published control.
- **What it costs, measured**: the Compact Sizing page shows it. Upstream that page's form is
  296 wide, because `ControlExample`'s presenter aligns its content left, the StackPanel is
  therefore content-sized, and the widest child asking for a width is the DatePicker at 296 —
  the first TextBox runs x370 to x666 on the reference. Ours comes out 318, and the DatePicker
  beside those text boxes, still at 296, is the proof that 318 is the intruder. Every other
  geometry on that page matches: the same x370 origin, the same 75-pixel field pitch, the same
  32-pixel control height.

  The Easing Functions page is a second witness, and a wider one. There the two `NumberBox`es
  live in `ControlExample`'s options pane, whose width is its content's, so the 318 does not
  merely widen a form — it widens the pane and takes the space out of the example beside it.
  Upstream's exponent box is about 62 pixels; ours is 316, and the pane grows from roughly 95
  to 334. The unit that removes the floor therefore has two kinds of site to measure, not one:
  a control inside a content-sized panel, and a control that is itself sizing its container.

- **Would reconsider if**: nothing — the direction is settled, and the question of whether any
  Gallery page laid itself out around the 318 is answered: none does, and one is laid out
  wrongly by it. `var(--winui-TextControlThemeMinWidth)` is what the four declarations become.
  What the unit that makes that change still owes is the dev-route baselines — twelve move, and
  an unconstrained `TextBox` at a 64-pixel floor may leave a harness route no longer catching
  what it was built to catch, so those routes may need an explicit width first. That is why
  this is a unit and not a one-line edit.

---

### WD-043 — the local theme example changes the whole page's theme

- **Control**: the Implicit Transitions Gallery page, `Implicitly animate when the Grid's theme
changes`.
- **WinUI does**: set `RequestedTheme="Light"` on one `Grid`
  (`ImplicitTransitionPage.xaml:253`) and flip it between Light and Dark from the button
  (`ImplicitTransitionPage.xaml.cs:179`). A XAML element themes its own subtree, so that card is
  light against a dark app and dark against a light one, and only it moves.
- **We do**: flip the app's theme. The Grid reads
  `var(--winui-SolidBackgroundFillColorBaseBrush)` like every other themed surface, so at rest it
  matches the page instead of contrasting with it.
- **Why accepted**: the token layer scopes a theme to `:root` — `:root[data-theme='dark']` and
  its siblings — and nothing addresses a subtree. Giving one to a single Gallery example means
  re-emitting the whole token set under a descendant selector in three themes, which is a
  token-layer unit with its own cascade problem (a scoped block has to out-specify every theme
  block or it loses silently) and its own measurement pass. `RequestedTheme` appears ten times
  in the whole pinned Gallery and nine of them are window- or dialog-level; this example is the
  only page subtree that uses it.
- **What survives**: the animation, which is what the example demonstrates and what its own
  caption names. The `BrushTransition` runs on the Grid's background at its 150ms default while
  the card behind it snaps. Measured on the reference machine 75ms after the button: the Grid is
  `rgb(126, 126, 126)` and the card behind it is already `rgb(32, 32, 32)`, both `rgb(243, 243,
243)` a moment earlier.
- **Would reconsider if**: a second page needs a subtree theme, or the token layer grows a
  scoped theme for another reason. Then this becomes one attribute on the Grid.

---

### WD-044 — this page's five transitions are the modern relative's shape, not their own

- **Control**: the five examples on the Theme Transitions Gallery page.
- **WinUI does**: route Entrance, Reposition, Content, Add/Delete, and Popup through
  `ThemeGenerator::AddTimelinesForThemeAnimation` (`LayoutTransition_partial.cpp:353`, `:748`,
  `:758`, `:1067`, `:1072`, `:1443`, `:1552`, `:1666`), which opens Windows theme animation
  data (`ThemeGenerator.cpp:727-728`) and reads keyframes with `GetThemeAnimationProperty`
  (`:742`).
- **We do**: use the modern `LinedFlowLayoutItemCollectionTransitionProvider` shape for Entrance,
  Reposition, Content, and Add/Delete, and `ContentDialogOpenCloseThemeTransition` for Popup.
  Entrance's visible per-item 83ms stagger has no counterpart even in that relative: the provider
  delays a whole batch (`LinedFlowLayoutItemCollectionTransitionProvider.cpp:79`, `:84`) and never
  one item against the next, so the 83 is borrowed from
  `ContentDialogOpenCloseThemeTransition_Partial.h:31` as the smallest unit in the vocabulary.
  `IsStaggeringEnabled="True"` (`ThemeTransitionPage.xaml:15`) is the XAML's one explicit setting
  on any of the five, so the stagger has to be visible; its size is the least-supported number on
  the page.
- **Why accepted**: the `TAS_*`/`TA_*` constants and `GetThemeAnimationProperty` are used but not
  defined in any of the three pins; `uxtheme.h`, `vssym32.h`, and `vsstyle.h` are absent. Offsets
  do not fill the gap: `DefaultValues.cpp:14-17` leaves them at zero and the Gallery sets none.
  The nearest modern relatives supply an explicit shape and the library's existing 167/250/83ms
  vocabulary without inventing a Windows resource.
- **What survives**: slide-in, scale-in/out, translation, and surface open/close all retain the
  pinned modern relatives' durations and curves, explicitly declared as approximate.
- **Would reconsider if**: the pin carries the animation table, or a reference frame sequence is
  measured with an instrument this project does not yet have.

---

### WD-045 — a deleted row's neighbours jump rather than sliding up

- **Control**: the Add/Delete Theme Transition example.
- **WinUI does**: use `AddDeleteThemeTransition` to reposition the rows that remain after one is
  deleted.
- **We do**: scale the departing row out in place and close the remaining gap in one frame when
  that row leaves the array.
- **Why accepted**: CSS cannot transition an arbitrary layout change. Example 2 spends the known
  85px delta on one element; an n-row list has n non-constant deltas and would need a page-owned
  FLIP pass.
- **What survives**: scale-out at 167ms under the ease-out curve, plus the delete-then-add
  ordering of `Add and Del`.
- **Would reconsider if**: a reusable container-level FLIP transition is needed by another page.

---

### WD-046 — the animated visual in the two list examples is the row's content, not its container

- **Control**: the Content Refresh and Add/Delete Theme Transition examples.
- **WinUI does**: attach transitions to `ListView.ItemContainerTransitions`
  (`ThemeTransitionPage.xaml:111-115`, `:130-134`), so the `ListViewItem` and its chrome animate.
- **We do**: animate the element supplied as the item template, leaving the generated container's
  padding and background still.
- **Why accepted**: a page cannot address a container `ListView` builds. `ItemContainerTransitions`
  is a transition system on `ListView`, not a prop; adding it is a separate library unit and no
  other Gallery page needs it.
- **Would reconsider if**: a second page needs container-level item transitions.

---

### WD-047 — the turnstile's perspective distance is derived from the projection's parameters, not transcribed from it

- **Control**: the Common `NavigationTransitionInfo` mode on the Page Transitions page.
- **WinUI does**: project the rotating page through `CPlaneProjection`'s fixed perspective
  matrix, built by `CMILMatrix4x4::SetToPerspective` from a near plane of 1, a far plane of
  1001, a 57° field of view, a unit aspect ratio and a right-handed convention, then normalised
  and moved back by a z-offset of −999
  (`dxaml/xcp/components/transforms/PlaneProjection.cpp:16-40`,
  `dxaml/xcp/core/inc/PlaneProjection.h:139-143`).
- **We do**: give the frame `perspective: 999px`, derived from that z-offset — the plane at z=0
  sits 999 units from the eye, and the normalising scale at `PlaneProjection.cpp:30-34` cancels
  the field of view so that plane renders 1:1.
- **Why accepted**: `SetToPerspective` is used and never defined in any of the three pins — it
  is called at `PlaneProjection.cpp:22` and named in a comment at
  `dxaml/xcp/core/core/elements/perspectiveplane.cpp:451`, and nothing in the checkouts defines
  it — so the matrix cannot be read, only reconstructed from the arguments. Everything else
  about this mode is transcribed: the rotation angles, the times, the easing and the centre of
  rotation are all literals.
- **What survives**: the −80°/50° turnstile, the 128ms hold and the 556ms rotation under
  `ExponentialEase(6)`, and the rotation centre at `-10% 50% -100px`.
- **What the reconstruction costs, measured**: upstream's projection carries a near plane at 1
  against an object plane at 999, and CSS `perspective` has no near plane at all. Measured on the
  reference guest, the incoming page's projected box is 62287px wide at the −80° pose it holds
  until 128ms, against 1235px at −25°; the pose is on screen for roughly one frame, because
  `ExponentialEase(6) EaseOut` has already carried the rotation to −55° by 135ms and to −14° by
  180ms. What is visible in that frame is an empty clip rather than a smear, since the frame
  clips and the magnified content falls outside it.
- **Would reconsider if**: a pin carries the matrix builder, or the projected page is measured
  against a reference frame.

---

### WD-048 — the travelling element is live markup, where WinUI travels a rasterised snapshot

- **Control**: all four examples on the Connected Animation page.
- **WinUI does**: capture the source and destination as composition surface brushes
  (`ConnectedAnimation.cpp:787-1044`), put both in one `CrossFadeEffect` brush on one host
  visual, and scale that visual, so the images stretch as pixels.
- **We do**: travel a live DOM subtree holding stacked source and destination markup, and scale
  its box.
- **Why accepted**: CSS cannot rasterise an element. The closest mechanisms — `element-capture`
  and a canvas redraw — are unavailable in a stylesheet and would need a per-example screenshot
  path.
- **What this costs**: text inside the travelling box reflows as it scales where upstream's
  stretches. This is visible in example 1's detail panel and example 2's card, and invisible in
  example 3's flat accent fills.
- **Would reconsider if**: a capture API lands that a stylesheet can reach.

---

### WD-049 — Gravity's depth is not reproduced: neither the Z dip nor the cast shadow

- **Control**: the Default and Gravity configurations, on all four examples.
- **WinUI does**: dip the travelling visual by 32 units in **Z** as well as 80 in Y
  (`GravityConnectedAnimationConfiguration_partial.cpp:10-11`, `:66`) and make it a
  `CThemeShadow` caster throughout the flight
  (`GravityConnectedAnimationConfiguration_partial.h:15`, `:21`; `ConnectedAnimation.cpp:678-693`).
- **We do**: animate the Y dip alone, with no Z component and no shadow.
- **Why accepted**: the Z dip needs `perspective` on every travel frame, and the shadow needs a
  projected-shadow treatment this library does not have. Its three shadow tokens name ToolTip,
  Popup, and Dialog roles, so borrowing one would invent a resource upstream does not have.
- **What survives**: the 80px dip, its 0.66 peak, and its two splines, which are what the
  configuration reads as.
- **Would reconsider if**: a projected-shadow treatment lands in the library, or a page measures
  the Z dip against a reference frame.

---

### WD-050 — the spring's curve is a model, not a transcription

- **Control**: the first three examples on the Animation interop Gallery page.
- **WinUI does**: drive them with a `SpringVector3NaturalMotionAnimation`
  (`XamlCompInteropPage.xaml.cs:24`, `:35`), whose `DampingRatio` and `Period` the page's own
  options set.
- **We do**: sample the standard damped-harmonic-oscillator step response — natural frequency
  `2*pi/Period`, the given damping ratio, zero initial velocity — into a `linear()` easing, and
  run it for as long as the envelope takes to fall to a thousandth of the displacement.
- **Why accepted**: the compositor's natural-motion implementation is in neither pinned
  checkout. Searched for `SpringVector3`, `SpringScalar`, `DampingRatio`, `NaturalMotion` and
  `CreateSpringVector3Animation` across `.upstream/microsoft-ui-xaml` and
  `.upstream/windows-app-sdk`: zero files each. The only occurrence anywhere under `.upstream/`
  is the Gallery's own call site. So there is no value to transcribe, and the page's three
  options remain live rather than inert.
- **Would reconsider if**: a pin ever carries the composition animation's own solver.

---

### WD-051 — three brushes the token layer does not emit

- **Control**: the fifth example on the Animation interop Gallery page, the popup, and the
  ParallaxView Gallery page's ListView rows.
- **WinUI does**: paint it `FlyoutBackgroundThemeBrush` over a 2px
  `SystemControlForegroundChromeGrayBrush` border (`XamlCompInteropPage.xaml:172-173`).
- **We do**: use `FlyoutPresenterBackground` and `FlyoutBorderThemeBrush`. For
  `SystemControlForegroundAltHighBrush`, use `TextOnAccentFillColorPrimaryBrush`: it is the same
  `#ffffff` in Light and `#000000` in Dark, differing only in High Contrast where upstream uses
  `SystemColorButtonTextColor` and this token uses `SystemColorWindowTextColor`.
- **Why accepted**: both of upstream's keys are defined only in
  `.upstream/windows-app-sdk/generic.xaml` (`:1113`, `:3927`, `:6723`; `:276`, `:2903`, `:5887`;
  and `:264`, `:2889`, `:5873` respectively), and the token extractor reads only
  `microsoft-ui-xaml/controls/dev/**/*_themeresources*.xaml` — `scripts/tokens/extract.mjs:12`.
  Widening that source set is a change to the token layer, not to a page. The two substitutes
  are the modern flyout pair, defined in all three themes.
- **Would reconsider if**: the token layer grows a source for the app SDK's own dictionary.

---

### WD-052 — ParallaxView takes the source zoom factor as one

- **Control**: `ParallaxView`.
- **WinUI does**: multiply its source-offset expressions by `source.<scale>`
  (`ParallaxView.cpp:383`, `:393`, `:407`, `:475`, `:487`, `:513`, `:517`, `:526`, `:530`), read
  from the scroller's property set and re-evaluated as the source zooms.
- **We do**: measure source and target offsets in CSS pixels and compute them at scale one. A
  `ParallaxView` over a `ScrollView` whose `zoomFactor` is not one therefore parallaxes as though
  it were unzoomed. Neither Gallery example zooms its source.
- **Why accepted**: CSS scroll timelines expose scroll offsets but no source zoom factor. The
  library's parallax interpolation remains compositor-driven, while a second per-frame
  measurement path would be an approximation rather than the scalar the browser does not expose.
- **Would reconsider if**: a browser exposes the source zoom factor to a scroll timeline or a
  future ScrollView implementation supplies that scalar without a per-frame listener.

---

### WD-053 — an animated GIF plays, and cannot be paused

- **Control**: `Image`, and the Gallery's Image page, example 6.
- **WinUI does**: put playback on the source rather than the element. `BitmapImage` carries
  `AutoPlay`, `Play()` and `Stop()`, and `IsAnimatedBitmap` once `ImageOpened` has fired; the
  Gallery's example renders one auto-playing image, one with `AutoPlay="False"`, and one driven
  by two buttons (`AnimatedGif.txt`, `ImagePage.xaml:92-123`).
- **We do**: render all three as `<img>` elements, which play their GIF from the first frame and
  offer no way to stop. The two buttons are rendered, because they are part of what the original
  draws, and are disabled.
- **Why accepted**: an `<img>` gives a page no control over GIF playback at all — there is no
  property, method or CSS for it, and the only way to hold a frame is to decode the file and paint
  it to a canvas, which is a GIF decoder this library would own.
- **Would reconsider if**: the platform exposes animation control on `HTMLImageElement`, or a
  page in this reproduction needs a still frame of an animated source for a reason other than this
  one example.

---

### WD-054 — the decode size is the browser's

- **Control**: `Image`, and the Gallery's Image page, example 2.
- **WinUI does**: let a `BitmapImage` say what size to decode to. `DecodePixelWidth` and
  `DecodePixelHeight` set the decoded surface's dimensions, so a large file drawn small costs the
  memory of the small one; the Gallery's example sets `DecodePixelHeight="100"` on an image it
  draws 100 tall (`ImageDecodedRenderingSize.txt`).
- **We do**: take the URI alone and let the browser decide. The page's second example is therefore
  the same markup as its first, and a comment on it says so.
- **Why accepted**: the property has no rendered consequence to diverge on — measured on the
  reference guest, the original's two examples differ by a mean absolute 0.14 over their 151x100
  boxes, which is noise. What it controls is decode memory, which no web API exposes: `decoding`
  and `fetchPriority` schedule the decode, and `sizes` picks among sources, but nothing states a
  decode size for a single source.
- **Would reconsider if**: the platform exposes a decode size for `HTMLImageElement`, or this
  library grows a reason to care about decode memory rather than about pixels.

---

### WD-055 — `Stretch="None"` anchors an image at the start even when the element is larger

- **Control**: `Image`.
- **WinUI does**: switch alignment on which is bigger. `mediabase.cpp:497-504` — "There is an
  odd behavior with Stretch=NONE. If the element is smaller than the image natural dimensions,
  then use Top/Left alignment. If it is larger use Center/Center." — so an unscaled image smaller
  than its element is centred in it.
- **We do**: write `object-position: left top` for `none`, which anchors at the start in both
  directions. The overflow half is exact, measured against the original at a mean absolute
  difference of 0; the underflow half diverges, and an unscaled image smaller than its element
  sits at its top-left rather than in its middle.
- **Why accepted**: `object-position` is one value and this rule needs two, chosen per axis from
  a comparison CSS cannot make. Reproducing it means measuring the element and the source in
  script and toggling the property, which is a `ResizeObserver` per image for a case no page in
  this reproduction has: every `Stretch="None"` in the pinned Gallery is smaller than its source.
- **Would reconsider if**: a page needs `Stretch="None"` with an element larger than its source,
  or CSS grows a positioning keyword that behaves like `safe` alignment for replaced content.

---

### WD-056 — a nine grid is painted Uniform, whatever the stretch mode says

- **Control**: `Image`, when `nineGrid` is set.
- **WinUI does**: compose the two. `Stretch` decides the rectangle the brush paints into —
  `CMediaBase::ComputeScaleFactor`, `mediabase.cpp:124-170` — and `NineGrid` decides how the
  source maps onto that rectangle, through the four insets at `WUCBrushManager.cpp:319-326`. All
  four stretch modes are available to a nine-grid image.
- **We do**: paint the nine grid into a box whose width comes from the source's ratio against the
  element's height, which is `Uniform` and nothing else. `nineGrid` and `stretch` therefore do
  not compose: setting both uses the nine grid and ignores the mode.
- **Why accepted**: the nine grid is a `border-image`, which only a non-replaced box can carry, and
  `object-fit` — the one declaration that expresses all four modes — applies to replaced content
  only. Expressing `Uniform` for a non-replaced box is `aspect-ratio` against one definite axis;
  expressing the other three as well means measuring the element against the source in script and
  choosing a rule per frame. Nothing needs it: `NineGrid` appears on three images in the pinned
  Gallery and all three take the default `Uniform`.
- **Would reconsider if**: a page needs a nine grid under `Fill`, `None` or `UniformToFill`, or CSS
  grows an `object-fit` that applies to a border image.

---

### WD-057 — the Lottie composition is one frame, and the transport buttons move nothing

- **Control**: `AnimatedVisualPlayer`, and the Gallery's AnimatedVisualPlayer page.
- **WinUI does**: play `LottieLogo1`, an After Effects animation translated by LottieGen into
  Composition calls — `Assets/AnimatedVisuals/LottieLogo1.cs`, 236KB, `IAnimatedVisual.Size`
  375x667 at `:5042` and `c_durationTicks` 59,670,000 at `:27`, which is 5.967 seconds.
  `AutoPlay="False"` holds it at progress 0 and the four transport buttons play, pause, stop and
  reverse it.
- **We do**: build the player whole — progress advances, `playing` goes true, the four buttons do
  what their handlers say — and give the page a source that draws the frame the original rests on
  at every progress: the composition's own `#00D1C1` filling its 375x667. What the buttons do not
  change is the picture.
- **Why accepted**: the generated source is 236KB, the same decline as WD-006 at a different
  scale. Neither pin carries the Lottie JSON a runtime could play, and the one frame the page is
  judged against is the one this source draws exactly.
- **Would reconsider if**: the pinned Gallery ships the composition's source JSON, or a page in
  this reproduction needs more than one frame of a Lottie animation.

---

### WD-058 — element sounds do not play

- **Control**: the Gallery's Sound page.
- **WinUI does**: use `ElementSoundPlayer.State`, `SpatialAudioMode` and
  `Play(ElementSoundKind)` over seven kinds; with the player On every control sounds on focus and
  invoke.
- **We do**: render all three examples whole and reproduce the page's own UI state — the toggle
  enables the checkbox and turning sound off clears it — while nothing makes a sound.
- **Why accepted**: the sounds are the shipped framework's own resources and neither pin carries
  one; searches for `.wav`, `.mp3`, `.m4a` and `.ogg` returned nothing. This is not D42's case:
  `AudioContext` and `PannerNode` are available on the guest, so what is missing is the audio
  rather than a web capability, and nothing here turns on the serving origin. Synthesising seven
  sounds would put this project's invention where the original's assets are.
- **Would reconsider if**: the pinned sources carry the element sounds, or this reproduction
  gains a sound set it can cite.
