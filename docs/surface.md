# The half of a control that is not in its template

Every control in this library was derived from a XAML template: the `ControlTemplate` in
`generic.xaml` or in one of the pin's `*_themeresources.xaml` files, plus the resources it
names. That reading is exact and it is incomplete. A WinUI control's surface is its
template **plus its code-behind**, and a template says nothing about the parts the control
builds, shows, hides or re-shapes from code.

The gap was found the expensive way. `IsThumbToolTipEnabled` defaults to `True` and puts
the current value in a tooltip while the Slider's thumb is dragged; nothing in
`Slider_themeresources.xaml` mentions it, the unit that built Slider read only that file,
and the omission surfaced when a person dragged the control and compared it with the
original. This file is the sweep that followed, and the procedure that keeps the next
control from needing one.

## Where the second half lives

Three sources, and which controls each one can answer for:

| source                                                 | covers                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| the control pin's C++ (`controls/dev/<Control>/*.cpp`) | AutoSuggestBox, ComboBox, NavigationView, NumberBox, TitleBar — five of twelve |
| the Gallery's sample page (`Samples/<C>/<C>Page.xaml`) | all twelve                                                                     |
| Microsoft's published API reference                    | all twelve, and the only source for behaviour in neither of the above          |

**Seven of the twelve controls have no implementation in the pin at all.** Button,
CheckBox, RadioButton, ToggleSwitch, TextBox, PasswordBox and Slider are
`Windows.UI.Xaml` controls that WinUI 3 restyles; `microsoft-ui-xaml` carries their
`*_themeresources.xaml` and nothing else. This is not the sparse checkout narrowing the
tree — it already takes every `.cpp`, `.h` and `.idl` under `controls/dev` — it is what
the repository contains. For those seven the template is the whole of what the pin can
say, and the other two sources are the only way to see the rest.

Two of the five that do have code have only a **helper**: `AutoSuggestBoxHelper` and
`ComboBoxHelper` are attached properties WinUI adds to controls it cannot edit, and each
carries exactly one behaviour. The remaining three — NavigationView, NumberBox, TitleBar —
are full implementations.

**The Gallery's sample page is the acceptance surface, not a suggestion.** The final gate
compares this library's Gallery against Microsoft's, page by page, so every example a page
demonstrates is something that has to exist. `Samples/<Control>/<Control>Page.xaml` names
them: one `ControlExample` per feature, each with the properties it sets.

## How to sweep a control

Do this **before** sealing a control, from now on. It costs minutes.

1. `ls .upstream/microsoft-ui-xaml/controls/dev/<Control>/` — if there is no `.cpp`, the
   pin has no second half for this control and steps 2 and 3 do not apply. Say so in the
   unit rather than leaving the absence unexplained.
2. Grep the implementation for the ways code changes what is drawn:
   `GoToState` (a visual state the template defines but the code decides),
   `Visibility(`, `CornerRadius(`, `Opacity(`, `Foreground(`, `Background(`,
   `ToolTip`, `SetToolTip`, and any `GetTemplateChildT` followed by a property set.
   Each hit is either a behaviour to build or a line for the deferral table.
3. Read the states the template declares but never enters on its own. A
   `VisualStateGroup` with no `VisualState` trigger in XAML is driven from code, and the
   code is where its condition lives.
4. Open `Samples/<Control>/<Control>Page.xaml` and list its `ControlExample`s and the
   properties they set. Anything there this component cannot do is a deferral, and it is
   on the page the acceptance gate will compare.

The grep in step 2 is a filter, not a reading: it is how this sweep covered
NavigationView's implementation, which is several thousand lines, without claiming to have
read all of it.

## What the sweep found

Per control, what the second half adds beyond the template this library already read.

| control            | second half says                                                                                                                                                        | state                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| AutoSuggestBox     | `AutoSuggestBoxHelper.cpp:104` squares the interior corners while the list is open — the box's bottom corners and the popup's top corners, swapped when it opens upward | fixed in `5d3f84a`                                                                |
| NumberBox          | `NumberBox.cpp:680` disables the up button at `Maximum` and the down button at `Minimum`, which is what drives the template's `UpSpinButtonEnabledStates`               | fixed in `19e89b6`                                                                |
| ComboBox           | `ComboBoxHelper.cpp:93` does the same corner squaring as AutoSuggestBox — but only `if (comboBox.IsEditable())`, and this library does not build the editable ComboBox  | nothing owed until `IsEditable` is built                                          |
| NavigationViewItem | `NavigationViewItem.cpp:743` shows a tooltip carrying the item's content, and only when the left pane is closed-compact                                                 | closed in `b43e677`                                                               |
| TitleBar           | `TitleBar.cpp:881` and `:906` attach tooltips to the back and pane-toggle buttons                                                                                       | closed in `0ad515f`                                                               |
| TitleBar           | `TitleBar.cpp:210-251` dims every part to `TitleBarDeactivatedForegroundBrush` / `TitleBarDeactivatedOpacity` when the window is not the active one                     | divergence candidate — a browser tab has no window activation to read             |
| TitleBar           | `TitleBar.cpp:174-186` collapses the title and subtitle when the content no longer fits, and re-expands past the width it collapsed at                                  | deferred                                                                          |
| TitleBar           | `TitleBar.cpp`'s `UpdateHeight` picks compact or expanded height from which slots are filled                                                                            | already built — the one code-behind rule this project had read before the sweep   |
| NavigationView     | pane, header, back-button, settings and auto-suggest visibility states, all decided in code                                                                             | already built as display modes                                                    |
| Slider             | `IsThumbToolTipEnabled` — the value in a tooltip while the thumb is dragged                                                                                             | closed in `1c20909`; **not in the pin** — measured on the reference guest instead |
| the other six      | no implementation in the pin                                                                                                                                            | see the Gallery column below                                                      |

And what the Gallery's own pages demonstrate that this library cannot do yet:

| control        | the page's example                                 | ours                                                                              |
| -------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| TextBox        | `IsSpellCheckEnabled` on the multi-line example    | not set — the browser's own default applies                                       |
| PasswordBox    | `PasswordRevealMode` switched by a check box       | reveal is press-and-hold `Peek` only                                              |
| PasswordBox    | `PasswordChar`                                     | the browser's mask character                                                      |
| RadioButton    | every example is inside a `RadioButtons` container | not built — it is its own control, with its own code in the pin                   |
| ComboBox       | `ComboBoxEditable`                                 | deferred with `IsEditable`                                                        |
| Slider         | vertical, tick marks, `SmallChange`                | deferred                                                                          |
| NumberBox      | `AcceptsExpression`, formatting that rounds        | deferred                                                                          |
| AutoSuggestBox | `TextChanged` filtering the list as the user types | the dev page shows a fixed list; the contract exists and the page does not use it |

Button, CheckBox and ToggleSwitch have no gap against their Gallery pages.

One thing the sweep saw and did not act on. The AutoSuggestBox's popup overlaps its
box by 1.7px, because bits-ui anchors the popup to the `<input>` and the input's bottom
sits inside the box's padding. Upstream nudges the same join by hand — `Margin="0,-0.5,0,-1"`
on `SuggestionsContainer` — against a different positioner, which is why the component
declines to reproduce that margin. The overlap is small, it is now hidden by the squared
corners, and correcting it would mean measuring the join against the original on the
reference guest. It is written down here rather than guessed at.

**The three tooltip rows are closed, and closing them paid for the sweep.** v5's second
unit built each one on the `ToolTip` from its first, and the three together bought two
props that unit had left open: `offset`, because the gap above the Slider's thumb measured
20 — the same 20 already measured between a pointer-anchored tooltip and the pointer — and
`openOnHover`, because WinUI's Slider raises its thumb tooltip itself rather than through
`ToolTipService`, so hover must not open it. Neither number nor behaviour is in any
dictionary. They came from pressing the original's thumb and photographing what happened,
which is what this file exists to make routine.

## Swept before sealing

The section above is the retrospective sweep of the twelve controls that already existed.
Everything below is the procedure being run in its intended order — **before** a control is
sealed — one entry per control, added by the unit that sealed it.

### ToolTip — v5 unit 1

There is no `controls/dev/ToolTip/` at all — step 1's stronger answer. ToolTip is a
`Windows.UI.Xaml` control that WinUI 3 only restyles, so its resources sit in
`controls/dev/CommonStyles/ToolTip_themeresources.xaml`, 77 lines, with the other restyled
controls' dictionaries; there is no implementation anywhere in the pin, and steps 2 and 3
of the procedure do not apply. The Gallery's page and Microsoft's
published reference are the whole of the second half. What that left open —
`PlacementRect`, and a `VerticalOffset` whose effect on the guest did not reduce to a
simple delta — is deferred in `plan.md` rather than guessed at.

### InfoBadge — v5 unit 3

`InfoBadge.cpp` is 103 lines and **all four of its behaviours are outside the template**.
The control is small enough that the grep in step 2 was a whole reading.

| second half says                                                                                                                                                                                                                            | state                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `InfoBadge.cpp:59` chooses the display kind — `Value >= 0` is the value badge, else an `IconSource` is the icon badge, else the dot. The template's four `DisplayKindStates` have no XAML trigger at all; the order is entirely in the code | built, in the same order                                                                                                         |
| `InfoBadge.cpp:90` computes the pill radius as `ActualHeight / 2` and hands it to the template through `InfoBadgeTemplateSettings`. **There is no corner-radius resource for this control**                                                 | built — CSS clamps a radius to half the shorter side, so half of `InfoBadgeMaxHeight` reproduces every height the badge can take |
| `InfoBadge.cpp:29`'s `MeasureOverride` returns `{ height, height }` for a badge measured narrower than it is tall, which is what makes a one-digit value badge a circle                                                                     | built as a `min-width` in the two content states                                                                                 |
| `InfoBadge.cpp:48` throws `hresult_out_of_bounds` when `Value` is set below -1                                                                                                                                                              | not reproduced; every value below 0 is the dot state, and a comment at the site says why                                         |

And against the Gallery's own page:

| the page's example                                                              | ours                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NavigationViewItem.InfoBadge` — a badge carried in an item's own slot          | not built; the slot belongs to NavigationViewItem, not here                                                                                                                                                                                                                                                                              |
| `Style="{StaticResource <Severity><Kind>InfoBadgeStyle}"`, fifteen named styles | one `variant` prop. The Dot/Value/Icon third of each name carries no styling — the display kind is already decided by `Value` and `IconSource` — so six backgrounds cover all sixteen. The five `…Icon…` styles additionally bake in a default glyph; a consumer passes the code point instead, and the component's TSDoc lists all five |

**What the sweep did not catch, and measurement did.** The two icon styles that use a
`FontIconSource` also set `Padding="0,4,0,2"`, and the spec for this unit read that padding
as sizing — it shrinks the `Viewbox`, so setting the glyph's `font-size` directly makes it
redundant. It is not redundant. The inset is _asymmetric_, and 4 above with 2 below is not
the same as centring: dropping it drew every severity's glyph one pixel high, which the
whole battery was green on. It was found by reading the icon's box off the reference guest
and comparing it with the original's — 4 above and 4 below, against ours at 3 and 5. **A
resource that looks like it only sets a size can be setting a position**, and the way to
tell is to measure the box rather than the badge.

### ProgressBar — v5 unit 4

`ProgressBar.cpp` is 270 lines, and the template's `CommonStates` group declares eight
states with **no XAML trigger of any kind**. Every one of them is entered from code.

| second half says                                                                                                                                                         | state                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProgressBar.cpp:87`'s `UpdateStates` picks one of six resting states from `IsIndeterminate`, `ShowError` and `ShowPaused`, with `ShowError` winning over `ShowPaused`   | built, in that precedence                                                                                                                             |
| `:186-198` sizes the determinate indicator: `maxIndicatorWidth * (Value - Minimum) / (Maximum - Minimum)`, and 0 when the range is empty                                 | built as a percentage width, which resolves against the same content box                                                                              |
| `:172-183` sizes the two indeterminate rectangles at 40% and 60% of the bar, and `:226-232` computes every storyboard position as a multiple of those two widths         | built — see below; it needs no width measurement at all                                                                                               |
| `:181` widens the second rectangle to 100% when the bar is paused or in error while indeterminate, so both states rest as one full-width bar rather than as motion       | built                                                                                                                                                 |
| `Normal`, `Updating` and `UpdatingError` are declared and are never resting states — the last two are entered and left inside one call to `SetProgressBarIndicatorWidth` | not built, and a comment at the site says why three template states are unaccounted for                                                               |
| the `RepositionThemeAnimation` at `ProgressBar.xaml:22` and the `FadeInThemeAnimation` at `:42-44`                                                                       | deferred to the Motion tranche: both are platform theme animations whose curves are nowhere in the template, so reproducing them means inventing them |

Against the Gallery's own page there is **no gap**. It demonstrates two examples — an
indeterminate bar with the three progress states, and a determinate bar driven by a
NumberBox — and both are reachable.

**The find worth keeping is that the indeterminate animation needs no measured pixel.**
The two rectangles are 40% and 60% of the bar, and the C++ writes each storyboard position
as a multiple of the rectangle it moves: the comments beside them read "Position at -100%",
"300%", "-150%" and "166%". Those are percentages of each rectangle's own width, which is
exactly what a CSS `translateX` percentage resolves against — so the whole animation is two
`@keyframes` blocks with no `ResizeObserver`, no measured width and no JavaScript. The
`KeySpline="0.4, 0.0, 0.6, 1.0"` is a `cubic-bezier` with the same four numbers, and the
two `KeyTime`s divide into the 2-second cycle as 75% and 37.5%. A control whose animation
looked like the part that would have to be approximated turned out to be the part that
transcribes exactly.

**One thing the capture does that a reader will otherwise mistake for a defect.** The
harness page's plain indeterminate bar photographs as a still 60%-wide bar. Playwright's
`toHaveScreenshot` disables animations by default, and it _cancels_ an infinite animation
rather than parking it at a keyframe, so both indicators render untransformed at the left
edge and the wider covers the narrower. It is deterministic — two independent runs against
the same baseline agree — and the page says so at the site.

### ProgressRing — v5 unit 5

ProgressRing is the case the sweep was written for and the case it cannot reach. Its
template is one `<AnimatedVisualPlayer/>`; there is no visual tree to derive from. The
drawing lives in two generated Lottie compositions under `AnimatedVisuals/`, so **the
generated C++ is the dictionary** for this control.

| second half says                                                                                                                                        | state                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `ProgressRing.cpp:327` picks `Active`, `DeterminateActive` or `Inactive` from `IsActive` and `IsIndeterminate`                                          | built, same three states                                                                             |
| `:420`'s `CoerceValue` clamps a value outside `[Minimum, Maximum]` onto the nearer bound                                                                | built                                                                                                |
| `ProgressRingDeterminate.cpp:269-278` maps progress to the arc's `TrimEnd` through six keyframes — piecewise linear, and **not** the identity           | built; see below                                                                                     |
| `:155` scales the arc's container to `(0, 0)` and `:161` steps it to `(1, 1)` at progress `0.00833`, so a value under 0.833% of the range draws nothing | built; see below                                                                                     |
| `:305`'s `UpdateLottieProgress` plays the composition from the old value to the new when the value rises, and snaps when it falls                       | deferred to the Motion tranche: CSS cannot express a duration proportional to the distance travelled |
| `ProgressRingTemplateSettings`' `EllipseDiameter`, `EllipseOffset` and `MaxSideLength`, which `ProgressRing.idl:9` marks as WUXC back-compat            | not built; the current template binds none of them                                                   |

Against the Gallery's own page there is **no gap**: an indeterminate ring with an
`IsActive` toggle and a background picker, and a determinate ring driven by a NumberBox.

**The two compositions disagree with each other, and the disagreement is real.** The
indeterminate ring is radius 7 and stroke 1.5 under a scale of 5 in an 80-unit viewport;
the determinate ring is radius 8 and stroke 1.5 under a scale of 1.77 in a 32-unit one.
Normalised to 32 that is radius 14 / stroke 3 against radius 14.16 / stroke 2.655 — close
enough to look like rounding, far enough to measure. On the reference guest at 60px the two
draw a 6px and a 5px stroke. They were generated separately from separate source art, and
each state was given its own numbers rather than one set being picked as correct.

**`pathLength="1"` collapses the upstream two-shape trick into one element.** A Lottie trim
cannot move both ends at once, so the indeterminate composition crossfades two shapes
through the opacity animations at `:138` and `:152`. Setting `pathLength="1"` on an SVG
circle makes `stroke-dasharray` and `stroke-dashoffset` read in the same units as
`TrimStart` and `TrimEnd`, so the pair transcribes literally onto one `<circle>` with no
circumference arithmetic anywhere.

**Why 900 degrees and not 720.** At the end of the cycle the arc is a zero-length round cap
at path position 0.5 with the container rotated 900 degrees, which is 180. At the start it
is a cap at position 0 with no rotation. Half a turn of rotation and half a turn of path
position cancel, so the repeat is seamless. The number is load-bearing, not decorative.

**The find worth keeping is that the determinate arc's length is not the value's fraction
of the range, and a review that only checks the endpoints will not see it.** The six
`TrimEnd` keyframes track the value to 0.75, then fall behind — 0.98333 maps to 0.96667 —
and close the ring at 0.991667. Every eased segment uses control points `(0.167, 0.167)`
and `(0.833, 0.833)`; both lie on `y = x`, so each segment is exactly linear and the whole
mapping is piecewise linear. Measured on the reference guest at 60px against a two-point
model calibrated on Values 50 and 75, Value 90 predicts 835 accent pixels under the
keyframe mapping and 845 under the identity; the original draws 835.

The same composition also gates visibility. Below progress 0.00833 the arc's container is
scaled to zero, so **Value 0 draws nothing** — where a naive `stroke-dasharray: 0 1` with
the round line cap the arc needs paints a dot at twelve o'clock. The original leaves no ink
at Value 0 and draws a 6x5 cap at Value 1. Both halves passed every gate and every snapshot
before they were found, because a baseline written from the same wrong render agrees with
itself.

## What this file does not cover

The sweep reads what a control _draws_. It does not enumerate automation peers, keyboard
protocols, or the parts of a code-behind that only compute layout the browser computes for
us. Those are out of scope for a library whose bar is visual fidelity, and a line here that
mentioned them would imply a decision that was never made.
