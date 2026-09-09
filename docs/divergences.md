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
  and `DropDownButton`'s and `SplitButton`'s chevrons.
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

### WD-012 — a ToolTip casts no drop shadow

- **Control**: `ToolTip` alone. `Flyout`, `MenuFlyout` and `TeachingTip` left this entry when
  the popup depth was measured and fitted, and `ContentDialog` left it when the dialog depth
  was. `Popup` was never in it: it positions a surface the consumer supplies and paints
  nothing, so there is no card of its own to cast a shadow from.
- **WinUI does**: give the popup a `ThemeShadow`, cast onto whatever is under it. Two of its
  three depths are now reproduced from measured profiles — nineteen pixels of ramp for a popup
  and past forty for a dialog. A ToolTip's is the third and the shortest: read once at one
  significant figure, it starts near `#CC` and closes in about eight. The shadow is in none of
  the presenters' templates — `FlyoutPresenter_themeresources.xaml:43` draws one `Border` with
  a background, a border and a corner radius and nothing else — because it is cast by the
  popup host rather than by the presenter.
- **We do**: draw no shadow on a ToolTip.
- **Why accepted**: not a judgement — a capture. A ToolTip has to be raised by hovering, and
  four ways of doing that on the reference guest produced nothing: a direct pointer move onto
  the target, a two-step approach, bringing the window to the front first, and an eight-step
  motion path. No ToolTip capture is stored from the unit that built the control either, and
  the one prose reading that exists is a single theme at one significant figure, which is not
  enough to fit against. The other two depths each needed a four-curve profile in two themes.
- **Would reconsider if**: a ToolTip can be raised and photographed on the guest. The
  measurement and the fit are then the same pass the other two depths went through, and this
  entry closes.

**This entry exists because a citation was pointing at the wrong one.** `ToolTip.svelte`
recorded the missing shadow against WD-006, which is about animated icons and names neither
ToolTip nor shadows. Gate C5 could not see it: it checks that a cited id has an entry and that
an entry is cited, and both were true. Reading the entry a citation points at is the part no
gate does.

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
