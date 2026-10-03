# 0016 — Reduced motion stops what upstream's animation switch stops

## Context

Windows has one switch for this: Settings' "Animation effects". WinUI reads it as
`UISettings.AnimationsEnabled`, through `DXamlCore::IsAnimationEnabled` (DXamlCore.cpp:4838).
The browser's nearest equivalent is `prefers-reduced-motion`.

Before this record, four of the library's components answered that query, each on its own
reasoning, and nothing said what the query should stop. They disagreed with upstream in both
directions. Expander, SelectorBar and ComboBox stopped motion that upstream keeps.
NavigationView named the right motion, but its block came before some of the rules it meant
to undo and was lighter than others. On its own route, under the preference, it held on 2 of
the 9 panes and on none of the 9 shadows. Seven buttons, the toggle switch's knob, the
calendar's view changes, the semantic zoom, the split view, the scroll bar, the progress bar's
return to its resting colour, and two smooth scrolls kept motion that upstream stops.

Upstream's switch does not stop "all motion". It stops a list of mechanisms, and each one
reads the switch for itself:

- **Visual transitions.** When animations are off, the visual state manager skips a
  `VisualTransition`'s storyboard, and a generated one, to its end frame
  (`VisualStateManagerActuator.cpp:598-606`). A destination state's theme animations are
  settled rather than run (:390-397).
- **Not a state's own storyboard.** That is started as `StoryboardType::State` (:202), and the
  skip at :602 tests for `Transition` and `Dynamic` only. A state's keyframes run with the
  switch off.
- **Brush transitions.** A `BackgroundTransition` is set up only while the switch is on
  (`ContentPresenter.cpp:150`, `Border.cpp:45`, `panel.cpp:71`).
- **Controls that branch on it in code.**
  - The ScrollBar asks for `ExpandedWithoutAnimation` and `CollapsedWithoutAnimation`
    (ScrollBar_Partial.cpp:754-775). Those keep every `BeginTime` and zero every `Duration`
    (ScrollBar_themeresources.xaml:600-670).
  - NavigationView skips its selection indicator's move (NavigationView.cpp:2043).
  - The ScrollViewer does not animate a view change: `ChangeViewInternal` sets
    `disableAnimation` from the switch (ScrollViewer_Partial.cpp:3616), and `BringIntoViewport`
    passes `animate && IsAnimationEnabled()` (:8733).

## Decision

**Under `prefers-reduced-motion: reduce`, a transition goes to zero duration where upstream's
mechanism for it reads the switch, and nowhere else.** Each reduce block cites the mechanism
it follows. A site that keeps its motion says why, beside its transition.

**A reduce block comes last in its stylesheet and names every rule it undoes.** An `@media`
block adds no specificity. A lighter selector loses to a heavier rule that sets the same
duration, and an equal one loses to a rule written after it. NavigationView's block lost both
ways.

## Consequences

| Component                                                               | Motion                                | Upstream mechanism                                                                                             | Under reduce                                                |
| ----------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Button, RepeatButton, ToggleButton, HyperlinkButton                     | background, 83ms                      | `BrushTransition` on a `ContentPresenter`                                                                      | stops                                                       |
| AppBarButton, AppBarToggleButton                                        | background, 83ms                      | `BrushTransition` on a `Border`                                                                                | stops                                                       |
| DropDownButton                                                          | background, 83ms                      | `BrushTransition` on a `Grid`                                                                                  | stops                                                       |
| ToggleSwitch                                                            | knob slide                            | `RepositionThemeAnimation` in the `OffToOn`/`OnToOff` transitions (ToggleSwitch_themeresources.xaml:418, :423) | stops                                                       |
| ToggleSwitch                                                            | knob size                             | `CommonStates` storyboards                                                                                     | runs                                                        |
| CalendarView                                                            | view change                           | `DisplayModeStates` transitions (CalendarView_themeresources.xaml:495-667)                                     | stops, delays too                                           |
| SemanticZoom                                                            | cross-fade                            | fade theme animations in the zoom states (`generic.xaml:9658-9673`)                                            | stops, delay too                                            |
| SplitView, NavigationView                                               | pane open and close                   | `DisplayModeStates` transitions (SplitView_themeresources.xaml:54-541)                                         | stops                                                       |
| NavigationView                                                          | overlay shadow                        | `PaneOverlayGroup` transitions (NavigationView.xaml:95, :109)                                                  | stops                                                       |
| NavigationView                                                          | selection indicator                   | skipped in code (NavigationView.cpp:2043)                                                                      | not reproduced: the library does not move it                |
| ScrollBar                                                               | expand and contract                   | the `*WithoutAnimation` states                                                                                 | durations stop, delays stay                                 |
| ProgressBar                                                             | back to `Determinate`                 | `VisualTransition`s (ProgressBar.xaml:30, :35)                                                                 | stops                                                       |
| ProgressBar                                                             | into `Paused`, `Error`, indeterminate | states' own storyboards                                                                                        | runs                                                        |
| TabView                                                                 | scroll buttons                        | `ChangeView` (TabView.cpp:1107, :1115)                                                                         | instant                                                     |
| PipsPager                                                               | scroll to the selected pip            | `StartBringIntoView` with `AnimationDesired` (PipsPager.cpp:251)                                               | instant                                                     |
| ScrollView                                                              | `scrollTo`, `scrollBy`                | `GetComputedAnimationMode` turns `Auto` into `Disabled` when `SharedHelpers::IsAnimationsEnabled` is false     | instant under `auto`, the default; `enabled` still animates |
| Expander                                                                | content slide                         | `ExpandStates` storyboards (Expander.xaml:33-90)                                                               | runs                                                        |
| SelectorBar                                                             | selected pill                         | `SelectedNormal`'s storyboard (SelectorBar.xaml:109)                                                           | runs                                                        |
| ComboBox                                                                | pressed pill                          | `SelectedPressed`'s storyboard (ComboBox_themeresources.xaml:727)                                              | runs                                                        |
| RadioButton, ItemContainer, MediaTransportControls                      | state changes                         | states' own storyboards                                                                                        | runs                                                        |
| ProgressRing, RefreshContainer, RefreshVisualizer, AnimatedVisualPlayer | spin, settle, playback                | composition animations started in code, which read no switch                                                   | runs                                                        |
| ParallaxView                                                            | scroll-linked offset                  | an expression tied to the scroll position, not a timed animation                                               | n/a                                                         |

**The Gallery's motion pages follow the same rule.** Their samples run on the same mechanisms:

- The theme-transition samples are layout transitions, whose registration the switch gates
  (LayoutTransition.cpp:219-245). So is the page-transition sample's `NavigationThemeTransition`:
  the sample's Frame declares it in `ContentTransitions`, and it reaches each page through the
  inherited collection (:1513-1527, :1590-1596).
- With the switch off, a connected animation still plays, at 1ms, so that its `Completed`
  fires (ConnectedAnimationService.cpp:317-323).
- Each implicit transition — opacity, rotation, scale, translation — plays only while the
  switch is on, which the property's setter reads (`components/elements/UIElement.cpp` :2146,
  :2239, :2319, :2589). So do the two brush transitions in the background samples.
- The easing sample and the Gallery's copy button begin their storyboards from code.
  `Storyboard.Begin` is not the visual state manager's, and none of the pin's
  `core/animation` sources (29 files, fetched at the pinned commit) reads the switch, so they
  run.
- The composition sample starts its animations with `UIElement.StartAnimation`
  (`components/elements/UIElement.cpp:2690`), which hands them to `FacadeAnimationHelper`.
  Neither reads the switch, so they run too.

The theme-transition, page-transition, connected-animation and implicit-transition pages carry
a reduce block. The easing sample, the copy button and the composition sample keep their
motion. The dev routes' capture aids are test harness, not reproduction, and are outside this
record.

`tests/visual/reduced-motion.spec.ts` reads the computed transition on every element each
selector matches, under both preferences, delays included. It records the behaviour each smooth
scroll asks for. The ComboBox and SelectorBar pill specs read their own states.
`tests/visual/reduced-motion-gallery.spec.ts` drives each Gallery demo and counts what is still
running a frame later, with and without the preference. Where a page finishes its work on
`animationend`, it also reads the end state, which an animation removed rather than shortened
would never reach.

**Not verified:**

- That Chromium on Windows derives `prefers-reduced-motion` from the same setting. The
  reference guest's settings are not changed, so the battery never exercises the switch-off
  path against the original. The tests read computed styles under an emulated media query.
- That nothing else in the library reads the switch.

## Status

Accepted.

## Alternatives rejected

- **Everything to zero.** This is stronger for a reader who asked for less motion. But it is a
  second motion model that no Windows application on the same machine follows. It would need
  a divergence entry at every site that keeps motion upstream, and its tests would pin
  behaviour that upstream does not have.
- **Upstream by default, plus a consumer switch to force everything off.** This is new public
  surface with no consumer asking for it. It stays open if one does.

## Downstream impact

A new transition cites its mechanism when it is written, and gets a reduce block exactly when
that mechanism reads the switch.
