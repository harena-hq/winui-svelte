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

### WD-083 — ColorSpectrum Ctrl+Arrow does not navigate named colours

- **Control**: `ColorSpectrum` and `ColorPickerSlider` keyboard input.
- **WinUI does**: sends Ctrl+Arrow through `FindNextNamedColor`, which requires the
  `ColorDisplayNameHelper` colour-name table (`ColorHelpers.cpp:52-77`).
- **We do**: use the documented 30-degree hue / 10-percent saturation-or-value major step.
  `ColorPickerSlider` uses the same major steps: 30 for hue and 10 for saturation and value.
  Alpha is unaffected because `IncrementAlphaChannel` (`ColorHelpers.cpp:308-352`) never
  consults the name table.
- **Why accepted**: the name table and colour-name tooltip are explicitly a later unit; adding a
  private incomplete copy here would make both controls disagree.
- **Would reconsider if**: the `ColorDisplayNameHelper` unit lands.

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

`CommandBarFlyout` is the third arrival and needs no argument of its own, because the two keys
are the same two: `CommandBarFlyoutBackground` is `DesktopAcrylicTransparentBrush`
(`CommandBarFlyout_themeresources.xaml:5`) and `CommandBarFlyoutSystemBackdrop` is
`AcrylicBackgroundFillColorDefaultBackdrop` (`:110`, applied at `:626`). It composites the same
way, for the same reason, and is listed here rather than opening a fourth entry so that the day
an acrylic component lands, one deletion closes all of them.

That control arrives twice, in fact. Its overflow popup carries a second backdrop link to the
same `SystemBackdrop` (`CommandBarFlyoutCommandBar.cpp:251-256` and `:737-741`), and the brush
its presenter is pointed at, `CommandBarFlyoutButtonBackground`
(`CommandBarFlyout_themeresources.xaml:528`), is `SystemControlTransparentBrush` in both light
and dark. The overflow composites over the same fallback as the bar, so the two boxes of one
surface are painted the same way.

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

### WD-006 — an animated icon renders as the static glyph WinUI falls back to

- **Control**: `NavigationView`'s settings item and back button, `TitleBar`'s back and
  pane-toggle buttons, `CheckBox`'s check glyph, `ItemContainer`'s multi-select check glyph,
  `Expander`'s chevron, and `DropDownButton`'s and `SplitButton`'s chevrons, and the
  AnimatedIcon page's two examples.
- **WinUI does**: give each of them an `AnimatedIcon` with a `FallbackIconSource` — the
  settings item in `CreateAndHookEventsToSettings`, `NavigationView.cpp:1319`; its back button
  in its style, `NavigationBackButton.xaml:58-63`; the two title bar buttons in theirs,
  `TitleBar_themeresources.xaml:160` and `:230`. The title bar buttons' styles drive
  `AnimatedIcon.State` to `PointerOver` at `:132` and `:202` and to `Pressed` at `:145` and
  `:215`, which is the press the review saw: the glyph shrinks on pointer-down and returns on
  release. Each visual source is a Composition scene graph generated by
  LottieGen and shipped as C++; the settings gear's — `AnimatedSettingsVisualSource.cpp` —
  is 63 `CompositionObject`s driven by seven expression animators and six keyframe
  animators, and its `Markers()` map at `:730` names six segments between `Normal`,
  `PointerOver` and `Pressed`.
- **We do**: render each `FallbackIconSource`'s glyph — `Symbol::Setting` as E713, the
  navigation back and close buttons' E72B, the two title bar glyphs, CheckBox's E73E and
  E9AE, Expander's E70D and E70E, and DropDownButton's and SplitButton's E96E — with no
  transition between pointer states.

  **The glyph is not always the same shape as the animation's frame, and Expander is where
  that was first measured.** Its chevron is `AnimatedChevronUpDownSmallVisualSource`, which
  morphs between the two directions rather than swapping glyphs; at 12px on the reference
  guest the original's resting ink is 8x4 pixels and the fallback glyph's is 9x5. Both are
  centred in the same 32px button, so the difference is the glyph's own outline against the
  composition's, not a placement error. The navigation back button is the same case at 16px:
  measured on 2026-10-01 on the reference guest, light theme, the original's disabled arrow on
  the AnimatedIcon and NavigationView pages is 12x12 pixels of ink and ours on the AnimatedIcon
  page 16x15, their centres within a pixel of each other in a 40 by 36 button.

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

_Eight entries. The next is expected to be TabView's arrow-key traversal. Every surveyed
primitive library — bits-ui, Zag and therefore Ark, and Melt — builds its roving-focus
candidate set by querying for a role or data attribute, which cannot match a close button
nested inside a tab trigger. So the button is reachable by Tab and not by arrow keys, and that
is a property of the standard roving-tabindex pattern rather than of any one library.
Recorded here once the control is built and the behaviour is observed rather than predicted._

_It was not recorded, because it did not happen: TabView was built without a primitive, and
its arrow order is the original's, close buttons and add-tab button included — pressed on the
reference on 2026-10-01 (`docs/keyboard.md`, the `TabView` observation)._

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

### WD-015 — a dialog nothing inside can focus keeps focus on the card

- **Control**: `ContentDialog`.
- **WinUI does**: `SetInitialFocusElement` (`ContentDialog_Partial.cpp:1984`) tries three things
  in order and stops at the first that takes focus — the first focusable element of the content
  (`:1997`), then `DefaultButton` (`:2027`), then the first focusable command button (`:2039`).
  Each is `FocusState_Programmatic` (`:2023`, `:2035`, `:2056`), which moves focus and draws no
  visual. **Where none of the three accepts focus it does nothing at all**: `wasFocusSet` stays
  false and focus is left on whatever the caller had it on, which for a dialog shown from a
  button is that button — outside the dialog.
- **We do**: reproduce the three steps, and add a fourth that focuses the card. The card is
  `tabindex="-1"`, which is `IsTabStop="False"` on the dialog itself
  (`ContentDialog_themeresources.xaml:62`), so it is out of the tab order and only script reaches
  it — this handler, and the primitive's focus scope, which is the paragraph below. Its outline
  is suppressed for the same reason WinUI's dialog draws none.
- **Why accepted**: the dialog is modal and its primitive traps focus, and the trap's own
  correction is a plain `focus()` — which is what grants `:focus-visible`. Measured 2026-09-18
  with the fourth step deleted, on a dialog with text content and no buttons: focus stays on the
  trigger, which the smoke layer has covered; the first Tab lands on `body`; and the second is
  where the scope pulls focus to the card and **lights it**. So the step is not a courtesy. It
  moves the same focus the trap would move two keystrokes later, and moves it unlit. It is
  reached only by a dialog whose content takes no focus and which has no command buttons. Both
  Gallery examples stop at step one; the harness route carries one dialog for each of the other
  three steps, because nothing that reproduces the Gallery reaches them.
- **Would reconsider if**: the primitive stops pulling focus back, or gains a way to be told
  where to pull it back to. Then leaving focus where upstream leaves it costs nothing, and the
  entry closes.

This entry replaced a different one on 2026-09-18. What that one claimed is worth keeping, because
it was wrong in three places and each of them was one source read away. It said WinUI focuses
`DefaultButton` when one is set — the default button is the _fallback_, and neither Gallery example reaches it.
It said there is no way to ask for focus without `:focus-visible` — `focus({ focusVisible: false })`
is that way, and `CommandBarFlyout` in this same package had been using it for a day. And it said
the behaviour lost was Enter-activates-the-default-button, which never depended on focus:
`ProcessLayoutRootKey` (`:1761`) handles Enter at the layout root and clicks the default button if
it is enabled, wherever focus is — unless focus is on something that takes Enter itself. That
last one was a real gap; it was recorded in `docs/surface.md` with the rest of this control's
code-behind, not here, because nothing about it had been declined, and it was built on 2026-10-01.

---

### WD-017 — TeachingTip content set after its template applies lacks upstream's 12px margin

- **Control**: `TeachingTip`.
- **WinUI does**: the `Content` state in `ContentStates` (`TeachingTip.xaml:64`) sets
  `MainContentPresenter.Margin` to `TeachingTipMainContentPresentMargin`, `0,12,0,0`
  (`TeachingTip_themeresources.xaml:78`). Only `OnContentChanged` enters that state
  (`TeachingTip.cpp:249-258`); `OnApplyTemplate` (`:45`) sets the title, subtitle, button,
  light-dismiss, icon and hero-placement states (`:70-71`, `:124-127`) and not this one.
  Content declared with the tip is set before the template exists, so that call
  finds no state to go to and the margin never appears — which is what the reference measures:
  16 between the hero example's subtitle and description, the Gallery `TextBlock`'s own
  `Margin="0,16,0,0"`, in a card 310 tall where the margin would make it 322. Content set or
  replaced once the template is applied does get the 12.
- **We do**: put no margin above the content slot in either case. Content a tip is declared
  with matches upstream; content that arrives later sits 12px higher than upstream's.
- **Why accepted**: scope. Svelte can see the `content` snippet prop change identity after
  mount, which is the case upstream re-enters the state for, but no Gallery example replaces a
  tip's content, and tracking it is state kept for a case nobody has asked for.
- **Would reconsider if**: a consumer replaces a tip's content in place and expects the gap,
  or upstream enters `ContentStates` in `OnApplyTemplate`, at which point every tip takes the 12
  and this entry becomes the opposite one.

This entry once read as the shipped control ignoring its own template, and rested on a rule
that the render is the specification where the dictionary disagrees. Both were wrong: the
render is the pin's code doing what it says. WD-016, opened on the same rule for
`TeachingTipMinWidth`, was deleted on 2026-10-03 — the Gallery lowers that resource to 48 for
the whole app (`App.xaml:62`), and the control honours whatever it is given.

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
- **Why accepted**: the keyboard contract for a grid of items is a roving-tabindex state
  machine whose candidate set changes with the layout — a stack moves by one, a uniform grid by a row, a lined flow by a
  line whose length is measured — and getting it wrong is worse than not having it, because a
  half-working arrow key is a trap where a Tab key is merely a longer road. The visual bar this
  project sets is met either way: focus draws the same band on the same element.
- **Would reconsider if**: the tranche's `TreeView` unit builds a roving tabindex over a
  two-dimensional candidate set, at which point this row is deleted.

  **This entry used to rest on another.** It was accepted as "WD-004's situation on a second
  control, and the same answer", and WD-004 — `NavigationView`'s pane, every row a tab stop and
  no arrow keys — **is gone**: it was pressed on the reference on 2026-09-21, came back much
  smaller than it had been described, and the ring it asked for was built on 2026-09-22. So the
  shared rationale is no longer shared, and what is left here has to stand on its own: it does,
  because the argument above is about a candidate set whose **shape** changes with the layout —
  a stack moves by one, a uniform grid by a row, a lined flow by a measured line — and that is
  the half `NavigationView` never had. Its pane is a tree rather than a flat list, so its
  candidate set does change with expansion; what it never becomes is two-dimensional, and one
  dimension is what made the ring a loop over document order rather than a state machine. What does not carry over is the borrowed
  authority. No key has been pressed on `ItemsView` or `TreeView`, this row's reading is of
  their two templates, and the rule `docs/keyboard.md` set on that date — a control whose
  surface includes a keyboard contract is not sealed until the contract has been pressed —
  reaches both of them before either is re-examined.

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

### WD-035 — a precision touchpad's pan does not pull

- **Control**: RefreshContainer.
- **WinUI does**: take two inputs. Its adapter's `PointerPressed` handler calls
  `TryRedirectForManipulation` when the pointer's device type is `Touch`
  (`ScrollViewerIRefreshInfoProviderAdapter.cpp:155-159`), and the visual interaction source it
  builds carries `ManipulationRedirectionMode::CapableTouchpadOnly` (`:311`), which hands the
  tracker a precision touchpad's pan as well. A mouse drives neither, so on a mouse-only desktop
  the original's page cannot be provoked at all.
- **We do**: take the touch pointer, and nothing else. There is no second gesture to take: a
  precision touchpad's two-finger pan reaches a web page as a `wheel` event and never as a
  pointer, so no handler of pointers can see it.
- **Why accepted**: reaching it would mean taking the wheel over at the start of the scrolled
  region and driving both the pull and the scroll by hand from there, which is a scroller of our
  own — a large piece of work for an input the original's own page is not documented for. At
  rest the two agree exactly, which is what the page compares.
- **Would reconsider if**: a wheel-driven overscroll is ever wanted for its own sake, at which
  point this comes with it rather than justifying it.

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
  `microsoft-ui-xaml/controls/dev/**/*_themeresources*.xaml` — `SOURCE` in
  `scripts/tokens/extract.mjs`.
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

---

### WD-059 — the sample videos are re-encoded

- **Control**: the Gallery's MediaPlayerElement page.
- **WinUI does**: play `Assets/SampleMedia/ladybug.wmv` and `fishes.wmv` — VC-1 video at
  512x288 with WMA Pro audio in an ASF container, 12.144 s and 12.480 s of playable content
  behind a 5.000 s preroll.
- **We do**: serve the same frames at the same 512x288 as H.264 in MP4 with AAC audio,
  `apps/gallery/static/ladybug.mp4` and `fishes.mp4`. Ladybug reads 12.19 s, which the panel's
  whole-second display renders identically.
- **Why accepted**: no browser plays VC-1 in ASF, and WMV is the only asset in the pinned
  Gallery that has to be converted — its images are JPEG, PNG, GIF and SVG, which Edge decodes
  unchanged. The bytes are not the pin's; the pixels and the timing are.
- **Would reconsider if**: a browser ships VC-1, or the pinned Gallery replaces its sample media
  with a web codec.

---

### WD-060 — cast, captions, audio tracks and track navigation do nothing

- **Control**: `MediaTransportControls`.
- **WinUI does**: `CastButton` opens the system's Miracast picker; `CCSelectionButton` and
  `AudioTracksSelectionButton` list the source's closed-caption and audio tracks and switch
  between them; `PreviousTrackButton` and `NextTrackButton` move through a `MediaPlaybackList`.
- **We do**: render all five buttons, give them their glyphs, labels and focus behaviour, and
  have them change nothing.
- **Why accepted**: one HTML video element has one source rather than a `MediaPlaybackList`; the
  Remote Playback API is the nearest cast equivalent and is unavailable on the reference origin;
  and the two sample sources carry neither a caption track nor a second audio track, so every
  track list this reproduction renders is empty.
- **Would reconsider if**: the library adds a browser-backed playlist or text/audio-track source,
  or the reference origin exposes Remote Playback.

---

### WD-061 — rewind steps the rate down, it does not play backwards

- **Control**: `MediaTransportControls`.
- **WinUI does**: `RewindButton` plays the source backwards, stepping through negative playback
  rates.
- **We do**: step the rate one place down `AvailablePlaybackRateList`
  (`MediaTransportControls_partial.cpp:63`), the mirror of what fast forward does upward, and
  stop at 0.25.
- **Why accepted**: Chromium rejects a negative `HTMLMediaElement.playbackRate`; playing
  backwards would require decoding and presenting frames in reverse by hand.
- **Would reconsider if**: Chromium supports negative playback rates, or a browser supplies a
  native reverse-playback primitive.

---

### WD-062 — the page WebView2's example hosts refuses this origin

- **Control**: `WebView2`, and the Gallery's WebView2 page.
- **WinUI does**: host `https://learn.microsoft.com/windows/apps/winui/winui3/` inside the app
  through a `WebView2`, which is a browser in its own right and not a frame in another page.
- **We do**: render the not-applicable panel in that slot. The control ships — `WebView2.svelte`
  is an `<iframe>` — and frames any document whose host permits it.
- **Why accepted**: measured on the reference guest. That URL answers `x-frame-options: SAMEORIGIN`
  and a `content-security-policy` whose `frame-ancestors` names Microsoft's own hosts and
  `localhost:3000`; framed from this origin the `load` event fires, `contentDocument` is `null`,
  and the frame paints the browser's refusal page. This is a third thing from either half of D42:
  the web has the capability, this harness permits it, and the particular resource the original
  names declines it.
- **Would reconsider if**: the example's URL starts permitting arbitrary `frame-ancestors`, or the
  page is pointed at one that does.

---

### WD-063 — MapControl draws no map

- **Control**: the Gallery's MapControl page.
- **WinUI does**: render an Azure Maps surface, and with no `MapServiceToken` set draws a white
  rectangle carrying the Azure wordmark — measured on the reference guest, 1181 × 400.
  `MapControlPage.xaml.cs:48-51` writes the token from the `PasswordBox` onto the control.
- **We do**: render the not-applicable panel at the slot's 400px height, and the "Set token"
  button takes the value and does nothing with it.
- **Why accepted**: the map is a paid hosted tile service reached with a key the reader supplies,
  not a control's own drawing. The page's `MapExample.png` — its own screenshot of a map — is
  reproduced exactly, and it is what the page actually shows a reader.
- **Would reconsider if**: this project acquires a tile source it may redistribute.

---

### WD-064 — Capture Element previews no camera

- **Control**: the Gallery's Capture Element / Camera Preview page.
- **WinUI does**: enumerate `MediaFrameSourceGroup`s, initialise a `MediaCapture` over the chosen
  one, and show its frames through a `MediaPlayerElement`
  (`CaptureElementPreviewPage.xaml.cs:88-124`).
- **We do**: the same, through `navigator.mediaDevices.enumerateDevices()` and `getUserMedia`,
  with the frames written onto the video element's `srcObject`. Where `navigator.mediaDevices` is
  absent the page writes the original's own "No camera devices found." message.
- **Why accepted**: **this is D42's second kind — a demonstration declined by the harness, not a
  capability the web lacks.** `navigator.mediaDevices` is gated on a secure context and this
  Gallery is served over plain HTTP, so on the reference guest it is absent entirely; separately,
  that guest has no camera and no microphone, which is why the original reaches its own
  empty-enumeration branch there. Served over HTTPS or from `localhost`, on a machine with a
  camera, this page previews and captures.
- **Would reconsider if**: nothing — the condition is the serving origin, and the row names it.

---

### WD-065 — Windowing's pages open no second window

- **Control**: the Gallery's AppWindow, AppWindowTitleBar, TitleBar and Multiple windows pages.
- **WinUI does**: open a real top-level window from each of thirteen buttons — AppWindow's seven
  (`AppWindowPage.xaml.cs:17-39`, `:59-75`), AppWindowTitleBar's three
  (`AppWindowTitleBarPage.xaml.cs:31-49`, `:159-167`, `:201-207`), TitleBar's two
  (`TitleBarPage.xaml.cs:19-29`) and Multiple windows' one (`CreateMultipleWindowsPage.xaml.cs:19-44`) —
  and configures it through `Microsoft.UI.Windowing`: three presenters, `OverlappedPresenter`'s six
  switches, preferred minimum and maximum size, a position, modality, and the title bar's twelve colours.
- **We do**: render every one of those pages whole, and leave every button inert.
- **Why accepted**: this is **D42's first kind**, and the row has to be careful about which.
  `window.open` is present and works — measured on the reference guest, at the Gallery's own plain-HTTP
  origin, returning a live window even without a user gesture — so "the web cannot open a second window"
  is false and is not what this row says. What has no web analogue is `AppWindow` itself: a browser window
  carries the browser's chrome, takes no presenter, has no modality against its opener, and exposes no title
  bar to colour. The one page whose whole demonstration is just _opening_ a window, Multiple windows, opens
  one that `ExtendsContentIntoTitleBar` over a `MicaBackdrop` at a 500 × 500 client size, and none of those
  three is reachable either. So what every one of the thirteen declines is the demonstration, not the act.
- **Would reconsider if**: a page in this group gains something a popup can actually show. The row is then
  narrowed to the buttons that still decline, rather than deleted.

---

### WD-066 — ColorSelector's flyout holds no colour picker

- **Control**: the Gallery's own `ColorSelector` (`WinUIGallery/Controls/ColorSelector.xaml`), used twelve
  times by the AppWindowTitleBar page.
- **WinUI does**: put a `ColorPicker` in the `SplitButton`'s flyout — ring spectrum, a colour slider, alpha
  enabled with its slider, and no hex or channel text input (`ColorSelector.xaml:19-32`) — and write the
  chosen colour back onto the swatch (`ColorSelector.xaml.cs:47-63`).
- **We do**: render the swatch and the chevron half exactly, and open nothing. The chevron is left in its
  normal state rather than disabled, because a disabled half is a different visual state and the resting state
  is this project's bar.
- **Why accepted**: `ColorPicker` is one of the four controls roadmap item 17 owes, and D9 schedules it as
  its own Zag machine rather than a bits-ui primitive. Separately, this library's `SplitButton` narrows WinUI's
  `Flyout` to a menu (`SplitButton.svelte`'s `items`, after `SplitButton.cpp:79` and `:221` which give the
  control its own flyout and placement), so arbitrary flyout content is not something a consumer can pass today.
  Neither is difficulty; together they are the mechanism. Nothing on the page moves in consequence: the twelve
  colours are the page's own constants, the `AppWindowTitleBar` they would have coloured is WD-065's, and the
  substituted sample code shows those constants either way.
- **Would reconsider if**: item 17 ships `ColorPicker` and `SplitButton` grows a content flyout. The entry is
  deleted then, because the control it names is upstream's and reachable.

---

### WD-067 — the Clipboard page copies and pastes nothing at this origin

- **Control**: the Gallery's Clipboard page.
- **WinUI does**: read or write the system clipboard from nine handlers —
  `CopyText_Click` (`ClipboardPage.xaml.cs:30`), `PasteText_Click` (`:59`), `CopyImage_Click`
  (`:77`), `PasteImage_Click` (`:101`), `CopyFiles_Click` (`:139`), `PasteFiles_Click` (`:174`),
  `CopyWithOptions_Click` (`:219`), `ShowFormats_Click` (`:271`) and `ClearClipboard_Click`
  (`:292`).
- **We do**: render their resting controls and leave their buttons inert.
- **Why accepted**: this is D42's origin-gated kind. The Gallery is served over plain HTTP at a
  gateway address, not a secure context: `navigator.clipboard` is absent there although it is
  present at a secure origin in the same browser session.
- **Would reconsider if**: the Gallery is served from a secure origin, where the Clipboard API
  is exposed and user-gesture clipboard operations can be implemented.

---

### WD-068 — clipboard history, roaming and content-change monitoring have no web analogue

- **Control**: the Gallery's Clipboard page.
- **WinUI does**: query `Clipboard.IsHistoryEnabled()` and `IsRoamingEnabled()`
  (`ClipboardPage.xaml.cs:260-263`), set a `DataPackage`'s history and roaming options
  (`:219-254`), and subscribe to `Clipboard.ContentChanged` (`:305`).
- **We do**: render empty history and roaming status lines, and leave the monitoring switch
  inert. The empty lines follow upstream's unavailable-API path: its catch at
  `ClipboardPage.xaml.cs:265-268` leaves both `TextBlock`s empty. The reference guest has the
  API and consequently shows its two disabled lines.
- **Why accepted**: browser clipboard access has no equivalent for OS clipboard history,
  cross-device roaming, or system-wide content-change observation at any origin.
- **Would reconsider if**: browsers expose equivalents for those OS clipboard services.

---

### WD-069 — the Clipboard page's editor is a `TextBox`, not a `RichEditBox`

- **Control**: the Gallery's Clipboard page editor.
- **WinUI does**: use a `RichEditBox` (`ClipboardPage.xaml:38-42`) and drive its
  `ITextDocument` through `richEditBox.Document` (`ClipboardPage.xaml.cs:26`, `:37`).
- **We do**: render the resting editor with `TextBox`.
- **Why accepted**: the two default styles carry the same resting foreground, background,
  border, thickness, font family, font size, padding, corner-radius, and minimum-size setters.
  The only resting-visible template difference is TextBox's DeleteButton, collapsed unless the
  box is focused and non-empty. Rich text formatting and the `ITextDocument` surface are not this
  page's to supply, and under D47 they are nobody's: roadmap item 17 declines `RichEditBox`,
  because what is missing is a document model rather than a template. This row's own reading is
  what makes that affordable — the same stand-in reproduces the `RichEditBox` page's editors at
  rest.
- **Would reconsider if**: this library ever takes on a rich-text document model. D47 declines
  one, so the condition that used to sit here — item 17 supplying it — can no longer fire.

---

### WD-070 — the Storage pickers page opens no picker at this origin

- **Control**: the Gallery's Storage pickers page.
- **WinUI does**: open Windows storage pickers from five handlers —
  `PickSingleFileButton_Click` (`StoragePickersPage.xaml.cs:27`),
  `PickMultipleFilesButton_Click` (`:76`), `SaveFileButton_Click` (`:147`),
  `PickFolderButton_Click` (`:214`) and `SelectSuggestedFolderButton_Click` (`:313`).
- **We do**: render their controls and live source substitutions, with inert picker buttons.
- **Why accepted**: this is D42's origin-gated kind. At the Gallery's plain-HTTP gateway origin
  the three File System Access picker functions are `undefined`; in the same browser they are
  functions at a secure origin.
- **Would reconsider if**: the Gallery is served from a secure origin where the File System
  Access picker APIs are available.

---

### WD-071 — a shell thumbnail has no web analogue

- **Control**: the Storage pickers page's File thumbnail example.
- **WinUI does**: call `StorageFile.GetThumbnailAsync` (`StoragePickersPage.xaml.cs:276`, from
  `PickFileForThumbnailButton_Click` at `:243`) to ask the Windows shell for a rendered
  thumbnail in one of six `ThumbnailMode`s at a requested pixel size, and draw it into the
  example's `Image` (`StoragePickersPage.xaml:171`).
- **We do**: render the pin's source-less thumbnail slot empty. This is the post-v2.9.3 example
  the reference guest does not ship, so its resting render follows the pinned source.
- **Why accepted**: browsers do not offer an API that asks the operating system shell to render a
  file thumbnail in a chosen shell mode, at any origin.
- **Would reconsider if**: the web platform exposes a shell-thumbnail primitive with comparable
  mode and size inputs.

---

### WD-072 — ContentIsland hosts no island

- **Control**: the Gallery's ContentIsland page.
- **WinUI does**: create a `ChildSiteLink` for its `XamlRoot.ContentIsland`
  (`ContentIslandPage.xaml.cs:70`), keep its transform in sync with the host rectangle's
  (`:76-88`), and connect the 3D helmet `ContentIsland` returned by
  `HelmetScenario.CreateIsland` (`:100`), one per press of Load model (`:40-44`).
- **We do**: render the six host rectangles and leave Load model inert.
- **Why accepted**: `ContentIsland`, `ChildSiteLink`, and their composition connection have no
  browser analogue at any origin.
- **Would reconsider if**: the web platform provides a composited child-island API with the same
  cross-surface hosting and transform relationship.

---

### WD-073 — the App notifications page shows no notification at this origin

- **Control**: the Gallery's App notifications page.
- **WinUI does**: call `AppNotificationManager.Default.Show(...)` from all five handlers —
  `ShowInformationalNotificationWithLogoButton_Click` (`AppNotificationPage.xaml.cs:41`),
  `ShowVisualNotificationWithHeroImageButton_Click` (`:53`), `ShowNotificationButton_Click`
  (`:63`), `ShowNotificationWithControlsButton_Click` (`:83`) and
  `ShowNotificationWithProgressBarButton_Click` (`:100`).
- **We do**: render the five buttons wired to nothing.
- **Why accepted**: this is D42's origin-gated kind. At the Gallery's plain-HTTP gateway origin
  `Notification.permission` is `denied`: the constructor is present and refused, which is a
  property of how the Gallery is served rather than of this page. In the same browser it reads
  `default` at a secure origin.
- **Would reconsider if**: the Gallery is served from a secure origin. Example 1 could then be
  shown after a permission grant; examples 2–5 would still be WD-074.

---

### WD-074 — a toast's logo crop, sound event, timestamp, hero image, attribution, inputs and progress bar have no web analogue

- **Control**: the App notifications page's four non-basic notification examples.
- **WinUI does**: crop the logo to a circle with `SetAppLogoOverride`
  (`AppNotificationPage.xaml.cs:36`), name a system sound with `SetAudioEvent` (`:37`), and
  stamp a time with `SetTimeStamp` (`:38`); set a hero image with `SetHeroImage` (`:49`) and
  an attribution line with `SetAttributionText` (`:50`); add a combo box, a text box and a
  button with `AddComboBox`/`AddTextBox`/`AddButton` (`:71-80`); and add a progress bar with
  `AddProgressBar` (`:91-97`).
- **We do**: render each example's button, the one options pane the four carry between them,
  and the live source substitution — and no notification.
- **Why accepted**: this is D42's second kind. The web `Notification` carries `icon`, `image`,
  and `badge`, but has no crop, named system sound, attribution line, input controls, or
  progress bar. Its actions are honoured only from `ServiceWorkerRegistration.showNotification`
  and cap at `maxActions` 2.
- **Would reconsider if**: the web notification surface grows any of those counterparts.

---

### WD-075 — the Badge notifications page sets no badge at this origin

- **Control**: the Gallery's Badge notifications page.
- **WinUI does**: set or clear the badge from `SetBadgeCountButton_Click`
  (`BadgeNotificationManagerPage.xaml.cs:24`), `ClearBadgeButton_Click` (`:33`),
  `SetBadgeGlyphButton_Click` (`:41`), `BadgeCountBox_ValueChanged` (`:50`), and
  `BadgeNotificationGlyphsCombo_SelectionChanged` (`:61`). Each is already guarded by
  `NativeMethods.IsAppPackaged` upstream (`:26`, `:35`, `:43`, `:52`, `:63`).
- **We do**: render the controls, live substitutions, and inert buttons.
- **Why accepted**: this is D42's origin-gated kind. At the Gallery's plain-HTTP gateway origin
  `navigator.setAppBadge` and `navigator.clearAppBadge` are `undefined`; in the same browser
  `setAppBadge` is a function at a secure origin. The original likewise declines the effect
  when it is not packaged.
- **Would reconsider if**: the Gallery is served from a secure origin where the Badging API is
  available.

---

### WD-076 — a badge glyph has no web analogue

- **Control**: the Badge notifications page's glyph example.
- **WinUI does**: call `SetBadgeAsGlyph` (`BadgeNotificationManagerPage.xaml.cs:45`) with one of
  thirteen `BadgeNotificationGlyph` values.
- **We do**: render the thirteen glyph names in the options pane and the live source
  substitution, but no badge effect.
- **Why accepted**: this is D42's second kind. The web Badging API takes
  `setAppBadge(contents?: number)` and nothing else; the selector is visual, while the effect
  has no counterpart.
- **Would reconsider if**: the Badging API accepts named glyphs or an equivalent badge visual.

---

### WD-077 — the JumpList page changes no jump list, at any origin

- **Control**: the Gallery's JumpList page.
- **WinUI does**: change the jump list from `AddTasksButton_Click` (`JumpListPage.xaml.cs:19`),
  `ClearTasksButton_Click` (`:42`), and `AddCustomGroupButton_Click` (`:54`). Each returns early
  when `!NativeMethods.IsAppPackaged` (`:21-24`, `:44-47`, `:56-59`), and the page carries its
  own warning `InfoBar` (`JumpListPage.xaml:12-14`).
- **We do**: reproduce that warning and render inert buttons.
- **Why accepted**: this is D42's second kind. There is no `navigator.jumpList`,
  `navigator.shortcuts`, or `navigator.getInstalledRelatedApps`. The nearest web relative is
  the Web App Manifest's static `shortcuts` member, which an installed PWA's user agent reads,
  not a runtime API a page can call.
- **Would reconsider if**: browsers expose a runtime jump-list API with add, clear, and grouped
  item operations.

---

### WD-078 — `TextTrimming` reaches unwrapped text only, and has one ellipsis for XAML's two

- **Control**: `TextBlock` and `RichTextBlock`.
- **WinUI does**: two things this row collapses into one. It trims wrapping text as well as
  unwrapped text — a `TextBlock` with `TextWrapping="Wrap"` fills the height it is given and
  ellipsizes the last line that fits — and it distinguishes `CharacterEllipsis`, which cuts at
  whatever character the line ends on, from `WordEllipsis`, which backs up to the last whole word
  so that no partial word precedes the ellipsis.
- **We do**: implement all four modes with `overflow: hidden` and `text-overflow`, which trims a
  **line box** that overflows its own width. Under `textWrapping="wrap"` no line box ever
  overflows, so nothing is trimmed and the whole text renders; measured in Chromium at a 220px
  width, the same string is 48px tall and untrimmed under `wrap` and 16px tall with an ellipsis
  under `noWrap`. And both ellipsis modes compile to one rule, so `wordEllipsis` shows the
  partial word `WordEllipsis` would have dropped.
- **Why accepted**: CSS trims a line, not a block. What WinUI does under `Wrap` is trim the last
  line that fits in the available **height**, and CSS has no height-driven ellipsis — the only
  mechanism that ellipsizes a block is a line **clamp**, which takes a count rather than a
  height. So reproducing it means measuring: resolving the element's content height and its line
  height on every resize and every font load, dividing, and feeding the quotient to the clamp.
  The escape is that the count is usually known to the caller — `maxLines` reaches the clamp
  directly, and that is WD-079. The word-versus-character half is the same shape of cost at a
  smaller scale: a binary search over substring widths, per element, for one partial word.
- **What this costs in this Gallery**: the pin sets `TextTrimming="WordEllipsis"` in three
  templates, and two of them pair it with `TextWrapping="Wrap"` —
  `Samples/GridView/GridViewPage.xaml:55-56` and `Samples/ItemsView/ItemsViewPage.xaml:98-99`.
  Those two reproduce untrimmed unless their page also passes `maxLines`, which is what the unit
  that builds them should do. The third, `Styles/ItemTemplates.xaml:55`, sets no `TextWrapping`,
  so it takes XAML's `NoWrap` default and trims here exactly as it does upstream — apart from the
  word boundary.
- **Would reconsider if**: a height-driven block ellipsis reaches CSS, or a side-by-side against
  the original shows the difference at one of the three sites above.

---

### WD-079 — `MaxLines` ellipsizes its last line, because the clamp that counts lines is the one that draws it

- **Control**: `TextBlock`.
- **WinUI does**: treat `MaxLines` and `TextTrimming` as two properties. `MaxLines` limits the
  line count and cuts the rest off; whether the last line ends in an ellipsis is
  `TextTrimming`'s answer, and its default is `None`.
- **We do**: implement `MaxLines` with `-webkit-line-clamp`, which always draws an ellipsis on
  the clamped line. A `maxLines` `TextBlock` with no `textTrimming` therefore ends in an
  ellipsis WinUI would not draw.
- **Why accepted**: the alternative is `max-height` at `maxLines × line-height`, which needs a
  resolved line height — and `LineHeight`'s own default is `0`, meaning "from the font", so the
  number is not available without measuring. `-webkit-line-clamp` counts the lines the browser
  actually laid out, which is the property XAML is expressing; the ellipsis is the cost of
  having the count.
- **Would reconsider if**: a standard line clamp ships that separates the count from the
  ellipsis, which is the shape CSS Overflow has been drafting. Not "a page sets `MaxLines`
  without a trimming mode" — that condition is already met and the trade is taken with it met.
  `SampleSupport/SamplePages/CardPage.xaml:86-92` and
  `Samples/ConnectedAnimation/ConnectedAnimationElementsSame.txt:49-52` are both `MaxLines` with
  `TextWrapping="Wrap"` and no trimming, and so is WinUI's own ContentDialog title
  (`ContentDialog_themeresources.xaml:241`).

---

### WD-080 — `FlowDirection` on a `Run` is always an embedding, where WinUI picks between an embedding and a mark

- **Control**: `Run`.
- **WinUI does**: turn `Run.FlowDirection` into a Unicode directional control character emitted at
  the run's edges, and **choose between two of them by comparing the run's direction with its
  parent's**. `ParagraphTextSource.cpp:508` is the comparison. Different from the parent, and it
  pushes `LeftToRightEmbedding` or `RightToLeftEmbedding` (`:514-521`) and pops with
  `PopDirectionalFormatting` (`:510-512`) — U+202A, U+202B and U+202C, per
  `TextSegment.cpp:20-22` and the switch at `TextSegment.cpp:1074-1093`. **The same as the
  parent, and it pushes a mark instead** — `LeftToRightMark` or `RightToLeftMark` (`:525-532`),
  U+200E or U+200F, which is one character before the content and no closing character at all.
  Unset, it emits nothing: `:474` is `DirectionalControl::None` and `:478-479` is the test that
  gets there.
- **We do**: emit `dir` together with `unicode-bidi: embed` whenever `flowDirection` is set, and
  nothing when it is not. That reproduces the embedding exactly — measured against the pin's own
  characters on the browser that writes this repository's baselines, `Label: <run rtl>שלום
עולם</run> (123)` renders the parenthesised digits to the left of the Hebrew under both, and to
  the right under `dir` alone, which is HTML's `unicode-bidi: isolate` default for any element
  carrying a valid `dir`. It does not reproduce the mark: where the pin would emit one, this
  emits an embedding whose direction happens to match its surroundings.
- **Why accepted**: the pin makes the choice by reading the **parent** `TextElement`'s
  `m_nFlowDirection` (`ParagraphTextSource.cpp:496-506`, falling back to the owning control's
  direction when the run is top-level). A component renders without knowing the resolved
  `direction` of the element it is about to be inserted into; getting it would mean a DOM read
  and a second pass, on every Run, to choose between two mechanisms whose difference is confined
  to how the neutral characters immediately outside the run resolve. The mark is expressible —
  it is a literal U+200E or U+200F before the content — so what is missing is the condition, not
  the mechanism.
- **What this costs in this Gallery**: nothing. The pinned Gallery writes `FlowDirection` twice,
  both times on a `GridView` (`Samples/GridView/GridViewPage.xaml:230` and its code-behind at
  `GridViewPage.xaml.cs:153-161`), and on no `Run` anywhere. The prop is built from the pin
  rather than from a site.
- **Would reconsider if**: a page sets `flowDirection` on a `Run` whose container already has
  that direction and a side-by-side against the original shows the neutrals beside it resolving
  differently — at which point the fix is the literal mark character and a way to know the
  parent's direction, not a different CSS property.

---

### WD-081 — a Hyperlink with no NavigateUri can be clicked but not reached

- **Control**: `Hyperlink`.
- **WinUI does**: make every `Hyperlink` focusable and keyboard-invokable, whether or not it has
  a `NavigateUri`. `CHyperlink::IsFocusable` (`Hyperlink.h:81-89`) tests `m_isTabStop` and
  nothing else, and `m_isTabStop` defaults to true (`:118`). `IsLinkNavigationKey`
  (`Hyperlink.cpp:416-418`) is `VK_RETURN || VK_SPACE`; the keydown listener (`:369-384`) puts
  the link into `HYPERLINK_PRESSED` while the key is held, and the keyup listener (`:343-364`)
  returns it to normal and calls `Navigate()`. `Navigate()` (`:543-581`) raises the `Click` event
  without consulting `m_strNavigateUri` at all, which is why the Click-only shape works upstream.
- **We do**: render it as an `<a>` with no `href`, which the browser does not put in the tab
  order. Measured on the reference guest, tabbing through `/dev/hyperlink` reaches every
  specimen except that one. A pointer click still works, because `onclick` reaches the element
  through the rest props.
- **Why accepted**: the attribute half is one line and it is the wrong half to ship alone.
  Measured: adding `tabindex="0"` to the href-less anchor restores focus and `:focus-visible`,
  and **Enter fires no click and neither does Space**, while the same key on a link with an
  `href` does. It would produce a stop in the tab order that does nothing, which is worse for a
  keyboard user than not being in it. Parity needs three more pieces — a keydown/keyup pair for
  both keys synthesising the click, a pressed colour the keyboard can reach (CSS `:active` does
  not fire from the keyboard on an hrefless anchor; measured, the colour never moved), and
  `role="link"`, since an `<a>` without `href` carries no implicit role. The first two are a
  keyboard-activation mechanism rather than a transcription, and this project's bar is the
  visual one.
- **What this costs in this Gallery**: eight sites, which is every `<Hyperlink>` in the pinned
  checkout that writes `Click` and no `NavigateUri` —
  `Controls/DesignGuidance/ColorSections/BackgroundSection.xaml:362`, `:363`, `:375`, `:376`,
  `Samples/XamlResources/XamlResourcesPage.xaml:108`,
  `Samples/AppWindowTitleBar/AppWindowTitleBarPage.xaml:14`, `Samples/Acrylic/AcrylicPage.xaml:45`
  and `Samples/TitleBar/TitleBarPage.xaml:26`. Seven of the eight are on pages this reproduction
  has not built. The eighth is built and costs nothing: `AcrylicPage.xaml:45` navigates to
  another Gallery item, so `styles/acrylic` reproduces it as an anchor with a real `href`, and an
  anchor with an `href` is a tab stop. That is the shape of the escape — a `Click` whose handler
  navigates is a `NavigateUri` in this reproduction, and only a `Click` that does something else
  lands in this row.
- **Would reconsider if**: the unit that builds any of those pages needs its links reachable, at
  which point the fix is the attribute **and** the handler together and it is worth its own pass.
  Not "a page uses the Click-only shape" — six already do, and the trade is taken with them
  there.

---

### WD-082 — the stars do not swell under the pointer

- **Control**: `RatingControl`.
- **WinUI does**: scale each star by a Composition expression animation driven by the pointer's
  horizontal distance from that star's centre — `max(-0.0005 · p · (starCenterX − focal)² + p, 0.5)`
  at `RatingControl.cpp:380-388`, with `p` 0.8 for a mouse (`c_mouseOverScale`, `:19`) and 1.0
  for touch (`:20`). The star under the pointer grows and its neighbours grow less, continuously.
- **We do**: keep every star at the resting size and change only the colours the template's visual
  states change.
- **Why accepted**: the expression is a function of a live pointer coordinate, evaluated per star
  per frame by the composition engine. CSS has no expression of that shape; reproducing it means a
  pointermove handler writing a transform on each of `maxRating` elements, which is a behavioural
  mechanism rather than a transcription. The resting scale of 0.5 — the expression's own floor —
  **is** reproduced, and it is what every baseline photographs.
- **Would reconsider if**: a side-by-side against the original shows the hover state mattering to
  the page's read, rather than to a pointer that is not in the picture.

---

### WD-084 — the vertical thumb keeps the horizontal thumb's state colours

- **Control**: `ColorPickerSlider`, vertical orientation.
- **WinUI does**: give the vertical thumb no pointer-over, pressed or disabled colour at all.
  `ColorPickerSliderStyle`'s `CommonStates` names `HorizontalThumb` and nothing else
  (`ColorPicker.xaml:458`, `:464`, `:471`), and `ColorPicker` reaches the vertical template in
  its own `Horizontal` orientation (`:153`, `:166`), so a vertical `ColorPickerSlider` upstream
  is a thumb that does not react to the pointer.
- **We do**: apply the same three state colours in both orientations. The selectors that carry
  them are written on the container and on the root's `data-disabled`
  (`ColorPickerSlider.svelte`), neither of which has an orientation in it.
- **Why accepted**: reproducing the gap means adding an orientation qualifier to three
  selectors purely to make a control stop responding to the pointer. No baseline can hold a
  pointer, so the divergence is invisible to every gate this project has, and the behaviour we
  would be transcribing is a template that names one thumb by hand and misses the other.
- **Would reconsider if**: a reference capture of a hovered vertical `ColorPickerSlider` shows
  the difference, or upstream gives the vertical thumb its own setters.

---

### WD-085 — the focus tooltip is not built

- **Control**: `ColorPickerSlider`.
- **WinUI does**: open the template's `ToolTip` part on focus
  (`ColorPickerSlider.cpp:145-153`) and re-render it after value changes (`:163-173`).
  `GetToolTipString()` (`:208-273`) produces a localized resource string that, for hue,
  saturation and value, interpolates `ColorDisplayNameHelper::ToDisplayName(…)` (`:249`).
- **We do**: render no tooltip and expose no `thumbToolTipEnabled` prop.
- **Why accepted**: the tooltip needs both localized resources and the colour-name table already
  deferred by WD-083. Showing only the number would be a different tooltip, not a partial
  reproduction of WinUI's.
- **Would reconsider if**: the colour-name unit lands, at which point this divergence and WD-083
  can close together.

---

### WD-086 — the text-entry controls carry no accessible name

- **Control**: `ColorPicker`'s text-entry grid.
- **WinUI does**: set `AutomationProperties.Name` on each of the eight `TextBox`es and the
  `ComboBox` (`ColorPicker.cpp:126`, `:135`, `:144`, `:153`, `:162`, `:171`, `:180`, `:189`,
  `:198`), and swap the hex box's between "RGB hex" and "HSV hex" with the representation
  (`:775-791`).
- **We do**: render the visible label beside each box with no programmatic association.
  `TextBox` spreads `...rest` onto its root `<div>` (`TextBox.svelte`'s markup) and `ComboBox`
  onto its root `<div>` (`ComboBox.svelte`'s), so an `aria-label` passed from `ColorPicker`
  reaches a wrapper with no role rather than the `<input>` or the trigger.
- **Why accepted**: naming them means giving `TextBox` and `ComboBox` a way to forward
  attributes to their inner interactive element, which changes two shipped components' public
  surface and belongs to a unit of its own.
- **Would reconsider if**: either component gains attribute forwarding to its input.

---

### WD-087 — CommandBarFlyout expansion has no animation

- **Control**: `CommandBarFlyout`.
- **WinUI does**: `ExpansionStates` (`CommandBarFlyout_themeresources.xaml:697`) carries four
  `VisualTransition`s. Collapsed-to-expanded runs for `ControlNormalAnimationDuration`, 250ms;
  expanded-to-collapsed uses `ControlFastAnimationDuration`, 167ms, with a third key frame at
  `ControlFastAnimationAfterDuration`, 168ms. The curve is `ControlFastOutSlowInKeySpline`,
  `0,0,0,1`; the storyboards drive `ContentRoot.Width` to `ExpandedWidth` and translate the more
  button and clip transforms from values `CommandBarFlyoutCommandBar.cpp:886-926` measures.
- **We do**: render the final expanded and collapsed states without an animation.
- **Why accepted**: the web width is an intrinsic `max-content` value in a clamped grid column,
  deliberately avoiding script measurement, so it has no numeric endpoints to interpolate.
- **Would reconsider if**: `interpolate-size: allow-keywords` is adopted after testing here. It
  can transition to and from an intrinsic size in the reference Chromium guest, but it has not
  been tested for this control. Screenshots would not show the difference because Playwright
  finishes animations before capture; it affects pointer-driven interaction only.

---

### WD-088 — the linked text container, and the line budget that makes one

- **Control**: `RichTextBlock`.
- **WinUI does**: let text that does not fit one element continue in another. `OverflowContentTarget`
  names a `RichTextBlockOverflow`, `HasOverflowContent` says whether anything is left, and
  `MaxLines` is the count that decides. One mechanism produces all three: `PageNode::Measure`
  starts `availableLinesCount` at `MaxLines` (`PageNode.cpp:369`), subtracts each paragraph's
  measured lines (`:531-535`), and creates a `PageNodeBreak` when the budget or available height
  runs out with blocks still to measure (`:585-592`). That break is the overflow.
- **We do**: build none of the four. `RichTextBlock` has no `overflowContentTarget`, no
  `hasOverflowContent`, no `maxLines`, and there is no `RichTextBlockOverflow` component.
- **Why accepted**: flowing one element's leftovers into a named element elsewhere in the tree is
  CSS Regions, withdrawn from every engine; the JavaScript alternative is a line-breaking engine
  measuring substrings per element on every resize and font load. The line budget cannot be
  clamped per element either: `-webkit-line-clamp` counts only its own box and needs
  `display: -webkit-box`, which stops the `<p>` children being blocks; standard `line-clamp`
  likewise counts one element's lines. CSS has no expression for a budget spent across siblings.
- **What this costs in this Gallery**: one example. `Samples/RichTextBlock/RichTextBlockPage.xaml:50-71`
  is a `RichTextBlock` and two chained `RichTextBlockOverflow`s in three grid columns, on item 19's
  page. `MaxLines` occurs once in the pinned Gallery XAML and not on a `RichTextBlock`, and no
  `.xaml` in the control pin contains `<RichTextBlock`.
- **Would reconsider if**: a CSS fragmentation mechanism reaches Chromium that flows one element's
  overflow into a **named other element**. Not columns: this example's three equal columns would
  make `columns: 3` fit one page, but a target is a separate element with its own size, margin and
  position anywhere in the tree.

---

### WD-089 — `menuItemTemplate` draws the left pane's rows and not the top pane's

- **Control**: `NavigationView`, `MenuItemTemplate` (`NavigationView.idl:207`).
- **WinUI does**: hand one element factory to every repeater that draws menu items — the left
  nav (`NavigationView.cpp:470`), the top nav (`:492`), the top overflow (`:511`), the left
  footer (`:557`) and the top footer (`:580`) — and to each realized item's own children
  repeater as well (`NavigationViewItem.cpp:171`). One template therefore draws a row wherever
  the row appears, and a top-pane item is a `NavigationViewItem` exactly as a left-pane one is.
- **We do**: apply `menuItemTemplate` to the left pane's menu and to a row's children at every
  depth. The top pane's items, the top pane's overflow flyout and both settings rows are drawn
  by the control as before. The settings rows are not a divergence — upstream exempts the
  settings item from templating too (`NavigationViewItemsFactory.cpp:39-43`) — the top pane is.
- **Why accepted**: this library draws a top-pane row with a different component.
  `NavigationViewTopItem` exists because the top presenter carries its own template and its own
  states (`NavigationView_themeresources.xaml:891`, and the `NavigationViewIconPositionStates`
  group at `:789` whose `IconOnly` is `:791` and whose `ContentOnly` is `:802`), which is a
  different element with a different surface, not a styled
  `NavigationViewItem`. ADR 0015 decided that the snippet draws a `NavigationViewItem`, so a
  template applied to the top pane would put a left-pane row in a horizontal strip. Reaching the
  top pane means first deciding what element a top-pane snippet draws, which is a surface
  question ADR 0015 did not take and a prop this control cannot infer from the entry alone.
- **Would reconsider if**: `NavigationViewTopItem` becomes public surface — D46's naming unit is
  where the exported set is fixed — or the two components converge on one element, at which
  point the template has one answer for both panes instead of two.

---

### WD-090 — a click on a consumer's control inside a row still invokes the row

- **Control**: `NavigationViewItem` pointer input.
- **WinUI does**: gate the invoke on a press nothing else handled. The item subscribes to its
  presenter's `PointerPressed` plainly and says why in its own comment — "Handlers that set
  flags are skipped when args.Handled is already True" (`NavigationViewItem.cpp:1272-1273`) — so
  `m_isPressed` is set only for a press no descendant took. `PointerReleased` is subscribed with
  `handledEventsToo: true` (`:1278-1281`), under the comment at `:1277` stating the opposite
  rule for handlers that _reset_ flags, and the release invokes only `if (m_isPressed)`
  (`:1095`) before marking itself handled (`:1105`). A `Button` a consumer puts in the row's
  content marks that press handled — `ButtonBase::OnPointerPressed` calls `put_Handled(TRUE)`
  for an enabled left-button press whose `ClickMode` is not `Hover`
  (`ButtonBase_Partial.cpp:689-699`), having itself returned early if the press arrived already
  handled (`:677-681`) — so the row above it never invokes. A text field is the same case
  argued more weakly, and weakly in the same place the keyboard half is: `TextBox`'s own
  `OnPointerPressed` forwards straight to its generated base (`TextBox_Partial.cpp:130-134`)
  and the editing is native, so what the pin offers is indirect — `ComboBox_Partial.cpp:369`
  and `:374` hook their own editable `TextBox`'s `PointerPressed` and `Tapped` with
  `handledEventsToo`, which `docs/keyboard.md`'s answer 9 reads as that field marking pointer
  events handled.
- **We do**: invoke on any click that reaches the row. A descendant suppresses it by calling
  `stopPropagation`, which is what this control's own expand chevron does — `toggle` in
  `NavigationViewItem.svelte`, whose comment already says the row would otherwise re-expand what
  the chevron just collapsed.
- **Why accepted**: the DOM has no `Handled` for a pointer event. `defaultPrevented` is the
  analogue the keyboard half of this control uses, and a `<button>`'s click does not set it —
  activating a button is not a cancellable default action the way a space typed into a text
  field is, so the flag that separates the two cases for a key carries nothing for a click.
  What is left is a list, and there are two of them, because a click's target is whatever sits
  under the pointer and the row's own label is a descendant as surely as a consumer's button
  is. A **negative** list — tag names and roles the row treats as "would have handled it" — is
  a guess about elements the control has never seen, and a wrong entry is a row that silently
  stops being clickable, in a control whose whole job is being clicked. A **positive** list —
  invoke only for a target inside the parts the control drew — cannot be wrong about a
  consumer's element, and has no marker to key on either: the row's `data-label` is written
  only when `children` is absent, so on the very rows this would govern the attribute is gone.
  It is wrong about upstream as well: the factory's second branch puts non-item template output on a
  generated container's `ContentPresenter` (`NavigationViewItemsFactory.cpp:71-85`), and a
  `TextBlock` there does not mark the press handled — `CTextBlock::OnPointerPressed`
  (`dxaml/xcp/core/text/TextBlock/TextBlock.cpp:3543`) sets `m_bHandled` only when the hit test
  found a `Hyperlink` (`:3593-3595`), and the managed layer adds no override of its own
  (`TextBlock_Partial.cpp` carries neither `OnPointerPressed` nor `put_Handled`, a negative run
  against `ButtonBase_Partial.cpp`, where the same query returns one). Text selection is a third
  path and is not claimed about here: an `IsTextSelectionEnabled` block hands the press to
  `m_pSelectionManager` (`:3586-3592`, the call at `:3588-3591`) and what that does with the flag was not read. So
  upstream's row **does** invoke for a click on an ordinary label a consumer templated, and a
  positive list breaks exactly the template a consumer writes first.
  `stopPropagation` avoids both lists: it states the fact at the one site that already knows
  it, and it is the idiom the control itself uses one element away.
- **Would reconsider if**: the platform grows a way for an element to mark a pointer event
  handled without stopping its propagation, or a consumer with per-row commands reports paying
  for this at every command it draws — the second is a measurement about a real menu, and it is
  the one likely to arrive first.

---

### WD-091 — a template that does not draw a row is not wrapped in one

- **Control**: `NavigationView`, `menuItemTemplate`.
- **WinUI does**: branch on what the template produced.
  `NavigationViewItemsFactory::GetElementCore` returns the produced element as the container
  when it already derives from `NavigationViewItemBase` (`NavigationViewItemsFactory.cpp:53-55`);
  otherwise it takes a `NavigationViewItem` from its own pool or creates one (`:58-69`) and puts
  the template's output on that container's `ContentPresenter` (`:71-85`). So `MenuItemTemplate`
  works whether it draws a row or draws what goes inside one.
- **We do**: render the snippet's output where the row would have gone, unwrapped. A snippet
  that draws a `NavigationViewItem` is the branch this reproduces — the one the Gallery's own
  page recommends in prose, "use a `NavigationViewItem` as the data template"
  (`NavigationViewPage.xaml:223`). A snippet that draws anything else produces that markup
  where a row would have been, at both depths: as a child of the pane's `<ul role="tree">`
  (`NavigationView.svelte`'s menu list) and as a child of a row's `<ul role="group">`
  (`NavigationViewItem.svelte`'s children list). No row around it, no `treeitem` role, and no
  selection, invoke or expansion — and, unless the snippet writes its own `<li>`, an element a
  `<ul>` may not have as a child, which is the part accessibility tooling notices first. **The
  control reaches this branch itself**: a header entry is handed to the template like any other
  and has no row to be, which is why `/dev/navigation-view-template` exercises it without a
  consumer writing anything odd.
- **Why accepted**: the test the factory performs is a type check on a rendered element, and a
  Svelte snippet's output is not something its caller can inspect before it is in the DOM. The
  XAML factory can ask because it holds the object it created; reproducing the branch here means
  reading back from the tree after the fact and then behaving differently according to markup the
  control cannot see. ADR 0015 rejected that on this ground and took the other branch.
- **Would reconsider if**: a consumer wants the content branch — a template that fills a row
  rather than drawing one. The answer is additive and needs no run-time test: a second prop
  naming that branch, whose snippet the control renders into a `NavigationViewItem` it draws
  itself. That is what the factory's second branch produces, arrived at by being told rather than
  by inspecting.

---

### WD-092 — a row inside the rail's children flyout carries no tooltip

- **Control**: `NavigationViewItem` in `NavigationView`'s `ChildrenFlyout`.
- **WinUI does**: attach one. `ShouldEnableToolTip` is `IsOnLeftNav() && m_isClosedCompact`
  (`NavigationViewItem.cpp:743`), and `m_isClosedCompact` is pane state — the pane shut, with
  the SplitView in either compact mode (`:253-255`) — so it stays true for a row the control has
  reparented into the flyout. The tooltip is redundant there, because the flyout shows the label
  the rail was hiding, but upstream does not switch it off.
- **We do**: draw no tooltip for any row inside the flyout, at any depth. The rail's own rows keep
  theirs.
- **Why accepted**: the tooltip primitive dismisses on Escape, which the WAI-ARIA tooltip pattern
  asks for and WinUI's `ToolTip` does not do. That second half is a negative and the search
  behind it is this: `VK_ESCAPE` and `VirtualKey_Escape` occur in **none** of the pin's
  tooltip-named sources — `ToolTip_Partial.cpp`, `ToolTipService_Partial.cpp`,
  `ToolTipAutomationPeer_Partial.cpp` and their headers, plus the four generated
  `winrtgeneratedclasses/ToolTip*.g.cpp` — run as a file walk over every `*tooltip*` `.cpp` and
  `.h` in the checkout. The positive control for the same query is
  `ComboBox_Partial.cpp`, which matches five times, so the query finds the thing when it is
  there. Focus lands inside the flyout when it opens, so the
  focused row's tooltip is open, and its Escape handler runs first: measured before this entry,
  dismissing a rail flyout took **two** presses — the first closed the tooltip, the second the
  flyout. `docs/keyboard.md`'s answer 8 was pressed on the reference and records one. Keeping the
  tooltip would trade a behaviour that was measured against the original for one that was
  inferred from a predicate, and the redundant tooltip is what the trade would buy.
- **Would reconsider if**: the tooltip stops consuming Escape — which is a decision about every
  tooltip in the library and not about this control, and would be taken against the WAI-ARIA
  pattern rather than against WinUI. `ToolTip.svelte` is where it would land, and this entry is
  the first site that would notice.

---

### WD-093 — a command's own `labelPosition` can ask for Right, where upstream's cannot

- **Control**: `AppBarButton` and `AppBarToggleButton`.
- **WinUI does**: split the question across two enums. An item carries `CommandBarLabelPosition`,
  which has exactly two members — `Default` and `Collapsed`
  (`dxaml/xcp/components/metadata/inc/EnumValueTable.g.h:468-472`) — and a bar carries
  `CommandBarDefaultLabelPosition`, which is where `Right` lives.
  `AppBarButton::GetEffectiveLabelPosition` (`AppBarButton_Partial.cpp:451`, and
  `AppBarToggleButton_Partial.cpp:294` for the toggle) returns the item's own value when it is
  `Collapsed` and the **bar's** default otherwise. So Right is a decision a bar takes for all of
  its commands, and an item may only opt out of its label entirely.
- **We do**: type the item's prop as `'bottom' | 'right' | 'collapsed'` and resolve it as
  `labelPosition ?? bar's ?? 'bottom'`. Two shapes follow that upstream has no way to express: a
  single command can be told to put its label on the right while its bar does not, and a single
  command can be pulled back to the bottom while its bar says right.
- **Why accepted**: it was written before the split was read, and what is here is the _bar's_
  enum — `Bottom`, `Right`, `Collapsed` (`EnumValueTable.g.h:455-460`) — offered per item, with
  an absent prop standing in for `Default`. The two upstream enums are **not** nested, which an
  earlier draft of this bullet claimed: `Default` is in neither the bar's set nor this union, and
  it means _defer to the bar_, which is what optionality expresses here. Narrowing the union now
  is a breaking change to a prop already in the module graph — the package is at `0.0.0` and no
  consumer holds it, so that is a shape rather than a bill, and the bullet below says when the
  bill would start. The **reachable state set is unaffected**: the effective position feeds the
  same Right → Collapsed → Compact → FullSize chain the pin runs
  (`AppBarButtonHelpers.h:171-188`), every value this prop can take is one that chain already
  handles, and no state exists here that upstream's template lacks. What is new is the _pairing_
  — a command given `'right'` inside a bottom-labelled bar renders `label-on-right`, which
  upstream cannot produce for that command. Saying the behaviour was unaffected would deny the
  shape the bullet above names.
- **Would reconsider if**: the naming unit that fixes the exported set reaches these two controls
  before a consumer holds them, which is the one moment narrowing the union costs nothing. Until
  then this entry is what says the extra member is ours.

---

### WD-094 — a tooltip reshown within 200ms waits the full delay, not the shorter one

- **Control**: `ToolTip`.
- **WinUI does**: shorten the wait for a tooltip raised soon after the last one closed.
  `GetInitialShowDelay` (`ToolTipService_Partial.cpp:1795-1838`) takes the input mode and an
  `isReshow` flag and multiplies `SPI_GETMOUSEHOVERTIME` — 400ms by default
  (`ToolTipService_Partial.h:18`). A reshow is an open within `BETWEEN_SHOW_DELAY_MS`, 200ms, of
  the last one (`ToolTipService_Partial.h:17`), measured against a static on the service
  (`:659`).

  **The multipliers are 1x for a mouse reshow and 2x for a keyboard one, and the first of those
  is not what the function's own comment says.** The comment prints 1.5x (`:1791`); the code is
  `ulSPIGetMouseHoverTimeTicks *= static_cast<INT64>(isReshow ? 1.5 : 2)` (`:1825`), and the
  conditional's common type is `double`, so a reshow multiplies by `static_cast<INT64>(1.5)` —
  1. Upstream's mouse reshow is 400ms. The other cells are integer arithmetic and survive the
     cast (`:1822-1823`, `:1828-1829`). A review caught this entry quoting the comment; the number
     below is the code's.

- **We do**: wait 800ms for every open, in both modes this library reaches. That is 400ms longer
  than upstream's mouse reshow, and exactly upstream's keyboard one — upstream's keyboard row is
  the same 2x as its normal one, so that half is right by not being a special case.
- **Why accepted**: the clock the row needs does not exist here. The reshow window is a static on
  `ToolTipService`, one per application, and this library composes bits-ui, whose nearest
  mechanism is per **provider** — and `ToolTip.svelte` renders one provider per tooltip, so no
  two tooltips in a page share a "last shown" moment to measure a reshow against. What bits-ui
  does offer in that window is not a shorter delay but **no delay at all**
  (`skipDelayDuration`, default 300ms, `tooltip.svelte.js:141-151`).

  For the mouse the two available answers are equidistant: the full delay is 400ms long and the
  skip is 400ms short. **The keyboard breaks the tie** — the full delay is exactly upstream's
  800 and the skip is the whole 800 short of it — and withholding the skip also makes the delay
  a function of the input mode alone, which is the property the rest of the unit rests on.

- **Would reconsider if**: the providers are hoisted to one per application, which is what a
  shared clock would need and which nothing else asks for today. A tooltip primitive that exposed
  the reshow delay as a number rather than as a skip would settle it without that.

---

### WD-095 — a programmatic focus opens a tooltip here, where upstream wants UIA behind it

- **Control**: `ToolTip`.
- **WinUI does**: open a tooltip on a focus that is `FocusState::Keyboard`, or that is
  `FocusState::Programmatic` **and** followed a UIA-driven focus set — the test is
  `focusState == Keyboard || (focusState == Programmatic && GetWasUIAFocusSetSinceLastInput())`
  (`ToolTipService_Partial.cpp:1706-1707`), and `OnOwnerEnterInternal` is reached only under it
  (`:1714`). An ordinary `element.Focus(FocusState::Programmatic)` from application code opens
  nothing.
- **We do**: open one for any focus that matches `:focus-visible` and did not follow a pointer
  press. Chromium grants `:focus-visible` to a scripted `focus()` whenever the last user input
  was a keypress or there has been none — measured with a scripted `focus()` after each kind of
  input — so a consumer calling `.focus()` raises a tooltip that upstream would not.
- **Why accepted**: the distinction upstream draws does not exist in the DOM. `FocusState` is
  three-valued and carries how the focus was set; a `focus` event carries nothing, and
  `:focus-visible` is the platform's own heuristic for the same question — which is why it is
  the right stand-in for `Keyboard` and cannot be made into a stand-in for "not
  `Programmatic`". Nor is there a UIA flag to ask: an assistive technology moving focus on the
  web arrives as an ordinary focus. Of the two ways to be wrong, opening one tooltip too many
  matches upstream's _intent_ for the UIA case, which is the case the property exists for.

  The neighbouring half is **not** a divergence and is reproduced: a focus that follows a mouse
  press is declined, by the `pointerDown` latch `ToolTip.svelte` keeps for it. Chromium grants
  `:focus-visible` to a pressed text input, so the pseudo-class alone would have opened one
  there and upstream calls that focus `Pointer`.

- **Would reconsider if**: the platform gains a way to tell a scripted focus from a user's, or
  the library grows a prop for it. A consumer that must not raise a tooltip programmatically can
  set `openOnHover={false}` today and drive `open` itself.

### WD-096 — a Shape's fill stops on a half pixel, and no CSS at this scale can

- **Control**: CheckBox, ItemContainer, RadioButton, ToggleSwitch and PersonPicture — every
  element whose upstream counterpart is a `Shape` carrying both a `Fill` and a `Stroke`.
- **WinUI does**: shrink the render geometry by the stroke thickness before drawing either.
  `CShape::GetOutlineRect` (`shape.cpp:841`) returns `(t/2, t/2, w - t, h - t)`, and its own
  comment at `shape.cpp:861` gives the reason — so that the stroked shape fits within the
  element's width and height. `CRectangle::UpdateRenderGeometry` hands that rect straight to the
  geometry (`rectangle.cpp:235`), `CEllipse` takes the same rect with the degenerate-stroke
  check off (`ellipse.cpp:107`), and nothing
  downstream moves it: `Stretch` defaults to `Fill` for both (`rectangle.h:30`, `ellipse.h:15`),
  whose branch of `UpdateRectangleBoundsForStretchMode` is a no-op (`shape.cpp:903`). For a
  20x20 box with `StrokeThickness` 1 that is the rect `(0.5, 0.5, 19, 19)`. The **stroke** is
  centred on it and therefore spans 0 to 1, which is exactly where a 1px CSS border sits, and is
  why this is not a stroke-placement divergence. The **fill** fills the geometry, so it stops at
  the stroke's centreline, half a pixel into the band the stroke occupies. That the edge is
  antialiased rather than snapped is upstream's own account of it: `CShape::GetStrokeThickness`
  returns zero when no `Stroke` brush is set, and the comment at `shape.cpp:121` gives the
  reason — otherwise "the fill region of the shape will be deflated, and the edge will be
  antialiased". Deflating the fill region is exactly what a stroke does here, so the antialiased
  edge is the documented consequence rather than an inference. And it does reach the screen. Measured on a capture of the original
  taken for this control, at a CheckBox whose box is twenty device pixels square with a
  one-pixel ring: the card behind it reads 243 and the box's own fill reads 229, which makes the
  three candidate rings 127 if the fill runs under the whole band, 134 if it stops before it,
  and 130 if it covers half. **All four edges of the ring read 130**, on every row and column of
  the straight runs. So the half is on the screen rather than only in the arithmetic, and it is
  the shipped render's 127 that is wrong.
- **We do**: paint the fill to the border box, CSS's default, which runs it the whole way
  through the band instead of stopping halfway. `background-clip: padding-box` is the other
  reachable value and stops it before the band entirely. The two are wrong by the same half
  pixel in opposite directions, so the default is kept and nothing in the components clips.
- **Why accepted**: the half pixel is not expressible at the rig's scale, and that was measured
  rather than assumed. `tests/visual/fonts.spec.ts`'s family test asserts that the lane's
  `devicePixelRatio` is one, so a CSS pixel is a device pixel and the fill's edge has nowhere to
  land between the two ends of the band. Seven constructions were tried against one specimen: a
  pseudo-element inset by half the stroke with and without a negative `z-index`, a background
  gradient positioned there, an inset `box-shadow`, a transform, and a gradient hard stop. Every one
  rasterised onto the same pixel as one of the two `background-clip` values, with nothing in
  between. The query is live rather than dead: a hard stop at `0.25px` lands on the `border-box`
  value and one at `0.75px` on the `padding-box` value, so the renderer does resolve the offset and
  then rounds it.
- **What it is worth**: measured on CheckBox's own states, as the distance between the two
  `background-clip` values at the box's left and right edges on its horizontal midline. Light: 3
  levels at rest unchecked, 7 hovered, 17 pressed, 22 hovered checked and 39 pressed checked. Dark:
  1, 5, 13, 20 and 36. Checked at rest is 0 in both, because there the stroke and the fill are the
  same opaque accent and there is nothing for the band to differ about. Upstream's value is the
  midpoint of each pair, the fill covering half the band, so the shipped render is about half of
  each figure away from it — up to 20 levels, against a gate that admits 2
  (`playwright.config.ts:112`). The capture above pins the hovered state rather than the mildest —
  the box fill in it reads 229, which is `ControlAltFillColorTertiaryBrush`, the pointer-over one
  (`CheckBox_themeresources.xaml:54`), against `ControlAltFillColorSecondaryBrush` at rest (`:53`).
  So the pair it measures is the 7, and the shipped render sits half of that from the original: 127
  against 130. **Halving is what the comparison with the gate has to use**, and it puts the bottom
  of the range inside the tolerance rather than over it — under 2 levels at rest in light and under
  1 in dark, about 3 at dark hover, and clear of it from light hover upward. **The battery still
  could not see it if the baselines came from the original**, and that is the part worth saying:
  Playwright calls pixelmatch with `includeAA: false`, so a pixel the heuristic reads as an
  anti-aliased edge is dropped before the tolerance is consulted (`playwright.config.ts:103`).
  Every pixel of this difference is the outermost ring of a rounded rectangle, which is that
  heuristic's own subject. Baselines taken from this render are the second reason it is unseen,
  not the first.
- **Would reconsider if**: the lane's `devicePixelRatio` becomes 2, where half a CSS pixel is a
  whole device pixel and every construction tried above becomes expressible. That would make the
  half **reproducible**, which is the reason to act on it — it would not make it visible to the
  battery, because a one-device-pixel edge ring is discarded by `includeAA: false` at any ratio,
  so no baseline is going to raise this entry on its own. A construction that lands the edge
  between two device pixels at a ratio of one would do the same; the seven tried do not, and the
  gradient-stop control shows why, but the search was of constructions rather than a proof that
  none exists.

### WD-097 — a centred line with an odd pixel left over paints on whichever row the page decides

- **Control**: ComboBox's trigger, in both densities, and in principle any single line centred
  in a slot whose leftover is an odd number of pixels.
- **WinUI does**: round the arranged offset. The trigger's `ContentPresenter` binds its
  `VerticalAlignment` to `VerticalContentAlignment` (`ComboBox_themeresources.xaml:577`), which
  the style never sets, so it takes `Control`'s default, `Center` (`CControl.h:272`).
  `CFrameworkElement::ComputeAlignmentOffset` gives a centred child `(client − ink) / 2`
  (`framework.cpp:2228`), and with `UseLayoutRounding` on — the default, ADR 0011 — the arrange
  adds the row origin and the margin and rounds the sum through `LayoutRound`
  (`framework.cpp:2107`), which is `XcpRound` (`uielement.cpp:4942`), which is `floor(x + 0.5)`
  (`inlined.cpp:129`). The ink is 19, because the desired size is rounded too
  (`framework.cpp:1762`) and Body's 18.62 rounds to it; unrounded it would give 5.69 and the
  same answer. In the standard density `ComboBoxPadding` leaves a 20-pixel slot in a 32-pixel
  row, so the offset is 5 + 0.5 and lands on 6; in the compact density the slot is 20 again,
  inside 24 with 1 above, and 1.5 lands on 2. That is on every trigger on every page at the
  rig's scale of one (asserted in `tests/visual/fonts.spec.ts`); `LayoutRoundHelper` rounds in
  physical pixels, so at other scales the figure differs but is still whole.
- **We do**: centre it with flexbox, which computes the same 5.5 and keeps it. Chromium has no
  layout rounding, so the half pixel reaches paint, and which row the glyphs land on then
  follows the label's absolute position. Measured on the ComboBox dev route on the reference
  browser, the eight labels' absolute tops end in .1875, .78125, .375, .96875, .5625, .15625,
  .34375 and .9375, and on the route's light baseline, of the seven triggers without an item
  template, the three whose fraction is under a half paint a row high and the four others do
  not. The first four paint their ink, counted as any pixel with a channel under 200, on rows
  10–19, 11–20, 10–19 and 11–20 of their own box, and the first and fourth show the same
  placeholder. Before 2026-09-25 all seven painted on 11–20, the rows an offset of 6 gives. The old trigger was 33 tall with a border
  counted into its height, which made the slot 21 and the remainder even; fixing the height is
  what exposed this.
- **Why accepted**: the rounding needs three numbers CSS does not have at that declaration — the
  text's height, and the top and the bottom padding separately, where `ComboBoxPadding` is one
  shorthand token. A static half-pixel bias (`margin-top` half a pixel more, `margin-bottom` half
  a pixel less) was considered and rejected: it lands the reference browser's 19-pixel text on 6
  and puts every even remainder — this lane's 16-pixel text, a forced tall line — onto the half
  pixel instead. That is fitting one font's metrics rather than reproducing the rule.
- **What it is worth**: one row, on the triggers whose labels sit less than half a pixel past a
  whole one. `tests/visual/combo-box-trigger-box.spec.ts` asserts the layout's unrounded top —
  5.5 standard and 1.5 compact on the reference browser, 7 and 3 on this lane — which is what
  the CSS computes; the painted row is not asserted, and the baselines hold whatever the page
  decided.
- **Would reconsider if**: the token layer emits `ComboBoxPadding`'s four sides separately, and
  `1lh` is confirmed to resolve to the used `normal` line height in Chromium — together they are
  the three numbers `round()` would need to put the offset on 6 itself.

### WD-098 — a touch that slides off a ComboBox stays pressed, and its lift still opens the list

- **Control**: ComboBox's trigger, under touch only. Mouse and pen follow upstream.
- **WinUI does**: end the press as the contact leaves the control. `OnPointerMoved` clears
  `m_bIsPressed` when the pointer stops being over the control (`ComboBox_Partial.cpp:3222-3228`),
  and `OnPointerExited` clears it too (:3236). `CommonStates` then leaves `Pressed` (:859), and a
  release that finds the flag cleared does not open the list (:3458, :3529).
- **We do**: keep the press. bits-ui 2.19's trigger leaves a touch pointer its implicit capture —
  its press handler returns for touch before it releases capture (`select.svelte.js:740-746`) —
  so the trigger hears no `pointerleave` while the contact is down, and `Pressed` holds until the
  finger lifts. By the same capture the lift is delivered to the trigger wherever it lands, and
  bits-ui's touch release opens the list (:758-769). All of that holds only while the browser does
  not take the slide as a pan: the trigger sets no `touch-action`, and bits-ui's `preventDefault`
  on the press does not stop one, so where the page can scroll along the slide the browser sends
  `pointercancel`, the press is cleared, no release follows, and the result is upstream's. None
  of this was observed: the harness has no touch screen.
- **Why accepted**: releasing the capture ourselves would reach into the one branch bits-ui keeps
  for touch, whose purpose is to keep a list from opening under a finger that meant to scroll,
  and the reference machine has no touch input to check the result against.
- **What it is worth**: a finger that lands on a trigger and slides off it before lifting, where
  the page cannot scroll that way or an ancestor sets a `touch-action` that forbids that pan,
  leaves the trigger drawn pressed and then opens the list, where upstream would do neither. A
  cancelled contact clears `Pressed` (`tests/visual/combo-box-open.spec.ts`). A touch that lifts
  where it landed matches upstream: for the non-editable ComboBox this library renders, upstream
  opens on the release under touch as under a mouse (`PerformPointerUpAction`, :3529); its
  open-on-focus path for touch (:2365-2369) is inside the editable-only branch of `OnGotFocus`
  (:2308).
- **Would reconsider if**: a touch device can drive the reference Gallery, or bits-ui releases the
  capture for touch itself.

### WD-099 — a title set while the bar is compact stays hidden here, where upstream shows it

- **Control**: TitleBar, in its `Compact` display mode.
- **WinUI does**: show the title when a non-empty `Title` is set while the bar is compact, and the
  subtitle when `Subtitle` is. Two visual state groups set the title's visibility:
  `TitleTextGroup`'s `TitleTextVisible` sets it `Visible` (`TitleBar.xaml:80-84`) and
  `DisplayModeGroup`'s `Compact` sets it `Collapsed` (:149-156). The subtitle's groups do the same
  (`SubtitleTextGroup`, :93-106, and `Compact` at :152). A state's setters are applied as the
  property's animated value (`VisualStateSetterHelper.cpp:186`), and a property has one animated
  value, which the next setter overwrites (`ModifiedValue.cpp:57-71`), so the last one applied is
  the one that shows. A non-empty `Title` reaches `UpdateTitle` (`TitleBar.cpp:128-133`, then
  `HandleTitleChange` at :100), which goes to `TitleTextVisible` with no check for compact (:515),
  and `Subtitle` reaches `UpdateSubtitle` the same way (:135-137, :554). Whichever state the group
  was in, `Visible` is applied after `Compact`'s `Collapsed`: from another state,
  `ChangeVisualState` applies it (`VisualStateManagerActuator.cpp:199`), and the left state's setter
  on the same property is not cleared after it (:243-249); from `TitleTextVisible` itself, going to
  it again without transitions applies its setters again (`CVisualStateManager2.cpp:131-142`), on
  the next tick (`VisualStateManagerActuator.cpp:378`, `VisualStateSetterHelper.cpp:174-177`,
  :207-215). That the deferred set runs rests on the header's own description
  (`DeferredAnimationOperation.h:12-14`); its body is not in the pin.
- **We do**: keep them hidden. The compact rule hides the title and the subtitle from the display
  mode alone, whatever their text.
- **Why accepted**: every other path upstream takes while the bar is compact keeps them hidden. The
  window-activation handler, which goes to the title's and subtitle's visible or deactivated states,
  checks `m_isCompact` first (`TitleBar.cpp:224-236`); `OnApplyTemplate` calls `UpdateTitle` and
  `UpdateSubtitle` unguarded (:80-81), but runs before the bar can go compact, or after a new
  template has dropped the `Compact` state; and leaving `Compact` calls `UpdateTitle` and
  `UpdateSubtitle` (:185-186), without which the title would stay hidden: leaving a state clears its
  setters' animated value (`VisualStateManagerActuator.cpp:249`, `VisualStateSetterHelper.cpp:192`),
  which drops the title to its template value, `Collapsed` (`TitleBar.xaml:235`, and :250 for the
  subtitle). The unguarded path reads as an omission, and reproducing it would give the title back
  the room the bar went compact to give the content.
- **What it is worth**: an app that sets `Title` or `Subtitle` while its bar is compact sees the
  text upstream, beside a narrower content column, until the bar is widened past its threshold, and
  sees nothing here. Not observed on the reference machine. The Gallery's shell sets its title once
  (`MainWindow.xaml:25`, in the pinned Gallery), but its TitleBar sample binds both to text boxes
  and gives the bar content (`TitleBarPage.xaml:40-46`, :61-68), so if narrowing that page makes the
  bar compact, typing a title would show it; that was not tried.
- **Would reconsider if**: that page shows the title staying hidden, or upstream adds the check to
  `UpdateTitle` — either way this entry is deleted — or upstream is seen to show it on purpose.

### WD-100 — a multi-line TextBox sized by its content takes its textarea's default size

- **Control**: `TextBox` with `acceptsReturn`, wherever the container lets the control size to
  its content rather than stretching it. The single-line text controls — `TextBox`,
  `PasswordBox`, `AutoSuggestBox` — are no longer in this entry: they size to their text, or to
  their placeholder while they have none, as below. `NumberBox` never was: its input is
  `width: 0`, so content-sized it comes out at its floor, 64, or 120 with inline spin buttons.
- **WinUI does**: measure the text view at the text's natural size, against the width offered
  when the text wraps and against an infinite one when it does not, plus a pixel for the caret,
  when the box is empty, first laid out or growing to wrap (`TextBoxView.cpp:1674-1677`,
  `:1723`, `:1740`); otherwise at the extent RichEdit requests (`:1683-1686`); either way capped
  at the width offered (`:1692`). The placeholder `TextBlock` shares the text's grid cell,
  spanning the delete button's column too, and is collapsed once there is text
  (`TextBox_themeresources.xaml:337`, `:338`; `TextBox_Partial.cpp:965-982`). A multi-line box therefore comes out as wide as its longest
  paragraph up to the width offered, and as tall as its lines. The width of the text itself is
  RichEdit's, which the pin does not carry.
- **We do**: give the single-line inputs `field-sizing: content`, which gives the same result
  where it was measured — the same seven pixels between the last glyph and the border, and a
  header that widens the box to the reference's 105 — and leave the `<textarea>` at its intrinsic width of about twenty characters and
  `rows="3"`. The same declaration on a `<textarea>` grows its height with its lines as well,
  which is upstream's behaviour and a change to every multi-line box this library draws, not
  only to content-sized ones. `field-sizing` was read as supported in Chromium 151, Firefox
  153 and WebKit 26.5 on the development host; an engine without it keeps the old twenty
  characters for the single-line controls too. Two differences remain in the single-line
  case and are not this entry's: the same text is 170 wide here against 176 on the reference,
  all of it inside the run of glyphs (150 pixels of ink against 156), which is how the font is
  rendered rather than how the box is measured; and focusing a box with text adds the delete
  button's 30 here and 32 there, the other two being RichEdit's requested extent.
- **Why accepted**: the height is the larger change and has not been measured against the
  reference: whether an `AcceptsReturn` box grows by a whole line at a time, from what minimum,
  and how the vertical scroll bar the template allows enters into it.
- **What it is worth**: a multi-line `TextBox` in a content-sized container comes out at twenty
  characters' width and three lines' height whatever it holds.
- **Would reconsider if**: a unit measures a growing `AcceptsReturn` box on the reference, at
  which point the `<textarea>` takes the declaration and its `rows` go.

### WD-101 — NavigationView's back, close and pane-toggle buttons show no tooltip

- **Control**: `NavigationView`'s back button, close button and pane toggle.
- **WinUI does**: give all three a tooltip. The back button's is a `ToolTip` part in the
  template (`NavigationView.xaml:188-190`) whose content is set to the localized "Back"
  on applying the template (`NavigationView.cpp:643-647`); the close button's is another
  (`NavigationView.xaml:193-195`), set to "Close Navigation"
  (`NavigationView.cpp:657-661`); the toggle's is created in
  `SetPaneToggleButtonAutomationName` (`:1900-1919`) with the same text as its automation
  name, which changes with `IsPaneOpen`.
- **We do**: give each an `aria-label` — "Back", "Close", and "Open navigation" or "Close
  navigation" — and no tooltip.
- **Why accepted**: the toggle had none before the back button existed, and the back
  button was given the toggle's treatment rather than a second one, and the close button
  the back button's. Wrapping all three in this library's `ToolTip` is a change to how the
  three buttons take their pointer and focus events, which is its own unit, with the
  keyboard and pointer tests that `ToolTip`'s other triggers have.
- **Would reconsider if**: the next NavigationView unit, or a consumer whose users meet an
  unlabelled glyph button.
