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

Four sources, and which controls each one can answer for:

| source                                                   | covers                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| the control pin's C++ (`controls/dev/<Control>/*.cpp`)   | AutoSuggestBox, ComboBox, NavigationView, NumberBox, TitleBar — five of twelve |
| the framework's C++ (`dxaml/xcp/…`, `dxaml/phone/lib/…`) | the controls WinUI only restyles, which is most of the Gallery                 |
| the Gallery's sample page (`Samples/<C>/<C>Page.xaml`)   | all twelve                                                                     |
| Microsoft's published API reference                      | all twelve, and the only source for behaviour in none of the above             |

**The second row is v12's, and it corrects what the first three said before it.** This
section used to end by saying that seven of the twelve controls have "no implementation in
the pin at all" — Button, CheckBox, RadioButton, ToggleSwitch, TextBox, PasswordBox and
Slider are `Windows.UI.Xaml` controls WinUI 3 restyles, and `controls/dev` carries their
`*_themeresources.xaml` and nothing else — and then that this was "what the repository
contains" rather than the checkout narrowing the tree. **The first half is true and the
second was wrong.** The repository carries `dxaml/`, the framework those controls are
implemented in: `Slider_Partial.cpp`, `ToolTip_Partial.cpp`, `ListViewItem_Partial.cpp`,
`Popup_Partial.cpp` and the rest all exist at the pin's commit. v11 read five of them by
fetching raw URLs; since v12 the sparse checkout takes four `dxaml` directories and they
are on disk, so the sweep greps for them like any other file.

Two of the five that do have control-pin code have only a **helper**: `AutoSuggestBoxHelper`
and `ComboBoxHelper` are attached properties WinUI adds to controls it cannot edit, and each
carries exactly one behaviour. The remaining three — NavigationView, NumberBox, TitleBar —
are full implementations.

**The Gallery's sample page is the acceptance surface, not a suggestion.** The final gate
compares this library's Gallery against Microsoft's, page by page, so every example a page
demonstrates is something that has to exist. `Samples/<Control>/<Control>Page.xaml` names
them: one `ControlExample` per feature, each with the properties it sets.

## How to sweep a control

Do this **before** sealing a control, from now on. It costs minutes.

1. `find .upstream/microsoft-ui-xaml -iname '<Control>*.cpp' -o -iname '<Control>*.h'` — the
   whole checkout, case-insensitively, because the framework's files are not all named the
   way the control is (`calendardatepicker_partial.cpp` is lower case, `Flyout_partial.cpp`
   is mixed). Only if that finds nothing does the pin have no second half for this control,
   and then steps 2 and 3 do not apply. Say so in the unit rather than leaving the absence
   unexplained.

   **Search the whole checkout, not `controls/dev`.** This step used to search only the
   control pin's own tree, on the belief that a control absent from it is a control the
   repository does not implement. It is not: a `Windows.UI.Xaml` control WinUI 3 restyles is
   implemented in `dxaml/`, in the same repository at the same commit, and since v12 the
   sparse checkout takes it. Every "no second half" verdict recorded in this file below was
   reached under the narrower search and none has been re-taken — **treat them as open, not
   as findings**, and re-run this step before relying on one. Slider is the clearest case:
   the tooltip that started this document is in `dxaml/xcp/dxaml/lib/Slider_Partial.cpp`,
   which was on disk in neither the sweep that missed it nor the sweep that followed.

   **Search for the file, not for a directory of that name.** This step used to read
   `ls controls/dev/<Control>/`, and a control that lives in a sibling's directory has no
   directory of its own, so the lookup returned nothing and the step reported a control
   with a second half as having none. Three of the Gallery's controls are in exactly that
   position and all three are still ahead of this project — `ToggleSplitButton` under
   `SplitButton/`, `BreadcrumbBar` under `Breadcrumb/`, `ItemsRepeater` under `Repeater/` —
   and the failure is silent, because a wrong "no second half" verdict reads in the unit
   exactly like a right one. `MenuBarItem` under `MenuBar/` only escapes it by being
   swept alongside the control it is named after.

   **A "no second half" verdict is where the sweep is most useful, not least.** Pivot has no
   `.cpp` in `controls/dev` — WinUI 3 restyles a control the XAML framework implements — and its
   template writes the title part as `Visibility="Collapsed"` with nothing in the file reversing
   it. The original renders the title. **A part a template collapses is not therefore an absent
   part**, and where no code can be read the picture is the only place the rest of the control is
   written down: step 4 and the reference machine were the whole sweep for Pivot, which is why
   skipping it would have cost most there. What has changed since is where the code is —
   `dxaml/phone/lib/Pivot_Partial.*` is in the checkout as of v12 and Pivot has not been re-swept.

   **And a control can have no first half either.** This step assumes the template is the
   half that is readable and the code the half that is not. `ListViewItem` breaks the
   assumption: it has no `.cpp` in `controls/dev`, and its template
   (`generic.xaml:27524`) contains exactly one element — a `ListViewItemPresenter` set up
   through fifty-odd properties, with no `ControlTemplate` of its own anywhere in either pin,
   because the framework draws it in C++. The brushes are resources and the geometry is
   nowhere. When step 1 finds no code **and** the template bottoms out in a presenter, both of
   the sweep's readable sources are gone at once and step 4 is not a supplement to the reading —
   it is the reading. That was the position when v9 built the control. It is not the position
   now: `ListViewItem_Partial.cpp` and `ListViewItemPresenter_Partial.cpp` are both in the
   checkout as of v12, so the geometry is somewhere after all, and the control has not been
   re-swept.

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

| control            | second half says                                                                                                                                                                                                                                                                                                                                                                            | state                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| AutoSuggestBox     | `AutoSuggestBoxHelper.cpp:104` squares the interior corners while the list is open — the box's bottom corners and the popup's top corners, swapped when it opens upward                                                                                                                                                                                                                     | fixed in `5d3f84a`                                                                |
| NumberBox          | `NumberBox.cpp:680` disables the up button at `Maximum` and the down button at `Minimum`, which is what drives the template's `UpSpinButtonEnabledStates`                                                                                                                                                                                                                                   | fixed in `19e89b6`                                                                |
| ComboBox           | `ComboBoxHelper.cpp:93` does the same corner squaring as AutoSuggestBox — but only `if (comboBox.IsEditable())`, and this library does not build the editable ComboBox                                                                                                                                                                                                                      | nothing owed until `IsEditable` is built                                          |
| NavigationViewItem | `NavigationViewItem.cpp:743` shows a tooltip carrying the item's content, and only when the left pane is closed-compact                                                                                                                                                                                                                                                                     | closed in `b43e677`                                                               |
| TitleBar           | `TitleBar.cpp:881` and `:906` attach tooltips to the back and pane-toggle buttons                                                                                                                                                                                                                                                                                                           | closed in `0ad515f`                                                               |
| TitleBar           | `TitleBar.cpp:210-251` dims every part to `TitleBarDeactivatedForegroundBrush` / `TitleBarDeactivatedOpacity` when the window is not the active one                                                                                                                                                                                                                                         | divergence candidate — a browser tab has no window activation to read             |
| TitleBar           | `TitleBar.cpp:174-186` collapses the title and subtitle when the content no longer fits, and re-expands past the width it collapsed at                                                                                                                                                                                                                                                      | deferred                                                                          |
| TitleBar           | `TitleBar.cpp`'s `UpdateHeight` picks compact or expanded height from which slots are filled                                                                                                                                                                                                                                                                                                | already built — the one code-behind rule this project had read before the sweep   |
| NavigationView     | pane, header, back-button, settings and auto-suggest visibility states, all decided in code                                                                                                                                                                                                                                                                                                 | already built as display modes                                                    |
| NavigationView     | `NavigationView.cpp:5028` puts a `ThemeShadow` on the `ShadowCaster` grid at `PaneOverlayShadowDepth` while the pane is open and overlaying, and `UnsetDropShadow` (`:5046`) runs a storyboard to take it away                                                                                                                                                                              | built — `.shadow-caster`, faded in and out by the same group transitions          |
| NavigationView     | the menu is elements, and `MenuItems` (`NavigationView.idl:203`) is the collection the markup fills; a `MenuItemTemplate` that produces a `NavigationViewItem` _is_ the container and is returned as it stands (`NavigationViewItemsFactory.cpp:53-55`), anything else is put on a generated container's `ContentPresenter` (`:71-85`), and the settings row is exempt from both (`:39-43`) | decided by ADR 0015; not built                                                    |
| Slider             | `IsThumbToolTipEnabled` — the value in a tooltip while the thumb is dragged                                                                                                                                                                                                                                                                                                                 | closed in `1c20909`; **not in the pin** — measured on the reference guest instead |
| Pivot              | no implementation in the pin, and the template collapses `TitleContentControl` (`Pivot_themeresources.xaml:316`) — the framework shows it, and the original draws it                                                                                                                                                                                                                        | built in `9844c14`, from the photograph rather than from the pin                  |
| the other six      | no implementation in the pin                                                                                                                                                                                                                                                                                                                                                                | see the Gallery column below                                                      |

And what the Gallery's own pages demonstrate that this library cannot do yet:

| control        | the page's example                                                                                                                                                                                                                    | ours                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| TextBox        | `IsSpellCheckEnabled` on the multi-line example                                                                                                                                                                                       | not set — the browser's own default applies                                                                               |
| PasswordBox    | `PasswordRevealMode` switched by a check box                                                                                                                                                                                          | reveal is press-and-hold `Peek` only                                                                                      |
| PasswordBox    | `PasswordChar`                                                                                                                                                                                                                        | the browser's mask character                                                                                              |
| RadioButton    | every example is inside a `RadioButtons` container                                                                                                                                                                                    | not built — it is its own control, with its own code in the pin                                                           |
| ComboBox       | `ComboBoxEditable`                                                                                                                                                                                                                    | deferred with `IsEditable`                                                                                                |
| Slider         | vertical, tick marks, `SmallChange`                                                                                                                                                                                                   | deferred                                                                                                                  |
| NumberBox      | `AcceptsExpression`, formatting that rounds                                                                                                                                                                                           | deferred                                                                                                                  |
| NavigationView | seven of eight examples write `<NavigationView.MenuItems>` directly (`NavigationViewPage.xaml:78`, `:125`, `:160`, `:199`, `:279`, `:371`, `:512`); the eighth binds `MenuItemsSource` with a `MenuItemTemplateSelector` (`:231-232`) | `items` is a closed record of this project's own and nothing a consumer writes draws a row — ADR 0015 decides the surface |
| AutoSuggestBox | `TextChanged` filtering the list as the user types                                                                                                                                                                                    | the dev page shows a fixed list; the contract exists and the page does not use it                                         |

Button, CheckBox and ToggleSwitch have no gap against their Gallery pages.

**The two NavigationView rows above were added in 2026-09, and neither is a second half —
which is the interesting part.** `MenuItems` is an ordinary IDL member (`NavigationView.idl:203`)
and the Gallery's own page fills it in four examples out of five. Nothing hid it. What hid it
is that this library reproduced the member under a narrowing — `items`, a record collection —
and a member that has _a_ reproduction does not read as a gap on any of the four steps. The
second half proper is thinner and sits where a grep over `NavigationView.cpp` would not land
it: the element factory is `NavigationViewItemsFactory.cpp`, named after neither the control
nor its item.

So: **a member reproduced in a narrower form is the case all four steps are blind to**, because
each of them asks whether something is missing rather than whether what is there is the same
shape. Step 4 in particular compares against the properties an example _sets_, and an example
that fills a collection with elements sets nothing at all.

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

### InfoBar — v5 unit 6

`InfoBar.cpp` is 307 lines and decides almost nothing about how the control looks. All six of
its `GoToState` sites pick a visual state, and the **state carries the visuals**, declared in
the template.

| second half says                                                                                                                                         | state                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `:223` `UpdateSeverity` maps `Severity` onto one of four states, and each sets the root background, the icon's disc colour, its glyph and its foreground | built as `data-severity`, all four                                                                                                             |
| `:261` `UpdateIconVisibility` picks `StandardIconVisible`, `UserIconVisible` or `NoIconVisible` from `IsIconVisible` and whether an `IconSource` is set  | built as `data-icon-state`                                                                                                                     |
| `:266` `UpdateCloseButton` and `:175` `UpdateVisibility`                                                                                                 | built as `closable` and `open`                                                                                                                 |
| `:282` `UpdateContentPosition` moves the content presenter from grid row 1 to row 0 when there is no title, no message and no action button              | built as `data-content-position`                                                                                                               |
| `:56-59` gives the close button a tooltip built in code, not in the template                                                                             | built, composing this library's own `ToolTip`                                                                                                  |
| `:276` `UpdateForeground` copies a locally-set `Foreground` onto Title and Message                                                                       | not built: a consumer's `style` or `class` colour already cascades to both, and inventing a `foreground` prop is what ADR 0002 exists to avoid |
| `Closing` is cancellable                                                                                                                                 | not built; it is behaviour, and its only visual output is the collapsed state `open` already produces                                          |

Against the Gallery's own page there is **no gap**. Its three `ControlExample`s are a severity
picker, a Short/Long message crossed with None/Button/Hyperlink action buttons, and an
icon/close-button pair of checkboxes — every one of which this component can reach.

**The find worth keeping is `InfoBarPanel`, and it is the one part of this control that is not
a transcription.** It is a custom measure/arrange panel holding Title, Message and the action
button, and it lays all three out **either as one row or as one column, together**, with
different margins per orientation. `InfoBarPanel.cpp:69` goes vertical if any of three things
holds: only one child has a non-zero desired size, the children in a row would be wider than
the space available, or the tallest child in a row would exceed the parent's `MinHeight`.

No CSS expresses that. `flex-wrap` wraps per item, so a message that fits beside the title but
not beside the action button gives a two-line row where the original gives three stacked rows;
container queries and the `calc((THRESHOLD - 100%) * 999)` flex-basis trick both switch on the
**container's** width, and this switch is on the **content's** — the Gallery's Short and Long
samples sit in containers of identical width. So the panel measures, and the library's second
`ResizeObserver` is here.

**The trap is the one `NavigationView.svelte:225` already documents, in its sharper form.**
There the observer writes a value nothing in the effect reads back. Here the value _is_ the
layout being measured: measure the row, flip to the column, and the row is gone, so the next
measurement says it fits and the panel oscillates forever. The fix is that the measurement
must not depend on the orientation it produces — a `[data-measuring]` attribute overrides the
orientation to a row of natural widths, the answer is read inside one synchronous block, and
the attribute is removed before the browser can paint. **A measurement whose subject its own
result changes is not a slow measurement; it is a loop.**

**One thing the transcription nearly got wrong, and the arithmetic that caught it.** The
Title and Message TextBlocks at `InfoBar.xaml:113-114` set `FontSize` and `FontWeight` and no
`Style`, so neither takes the Body ramp's 20px line height — they take the platform default,
which measures 18px here. Applying the ramp class would have made every vertical bar 3px too
tall. The check that settles it is the vertical bar's content height: 14 top padding + title

- 4 + two message lines + 18 bottom padding. The original measures 93px on the reference
  guest, and so does this.

### Expander — v6 unit 1

`controls/dev/Expander/` carries a `.cpp`, and it is short: `Expander.cpp` is 185 lines and
does four things. It hands the header ToggleButton's automation peer the Expander's own
events source so a screen reader hears "expanded" rather than "on"; it applies a composition
inset clip to `ExpanderContentClip`; it measures the content and writes the height into
`TemplateSettings` for the storyboards to read; and it maps `IsExpanded` and `ExpandDirection`
onto four visual states. None of the four is a drawing decision the template does not also
state, which is why this control transcribes cleanly.

**The one place the code-behind and the template disagree is a defect, and it is visible.**
`OnExpandDirectionPropertyChanged` at `Expander.cpp:129` calls `UpdateExpandDirection` and
never `UpdateExpandState`, so changing `ExpandDirection` on an already-expanded Expander moves
the `ExpandDirectionStates` group and leaves `ExpandStates` where it was. The header's corner
radius is filtered by the `ExpandStates` group — `ExpandDown` at `Expander.xaml:62` takes the
top two corners, `ExpandUp` at `:33` the bottom two — so the header keeps the filter for the
direction it is no longer expanding in. Driven on the reference guest: a Down-expanded
Expander switched to Up drew its content rounded on top and square below, and its header
rounded on top and square below as well, leaving a notch at the seam; one collapse/expand
cycle corrected it. `WD-010` records that this reproduction draws the corrected state.

**Two visual-state groups, and only one of them is about expansion.** `ExpandStates` holds
four states rather than two, because collapsing is a different animation from expanding and
each direction has its own pair. They are named for the direction the _content travels_, not
for `ExpandDirection`, which is why `UpdateExpandState` sends a collapsing downward Expander
to `CollapseUp`. Reading those four names as if they were `ExpandDirection` values inverts
the whole control.

**The header is one button, not two.** The chevron looks like a separate control and is a
`Border` with an `AnimatedIcon` in it, inside the header's own template. Measured on the
guest: the keyboard focus band surrounds the whole header, and the pointer changes only the
chevron's fill — the header's own background has no `PointerOver` or `Pressed` resource to
change to, which is unusual enough to be worth stating, because every other button-shaped
control in this library has three.

**What the Gallery page asks for.** `ExpanderPage.xaml` has two `ControlExample`s: a text
header and content with an `ExpandDirection` selector, and a second with `Width="500"`,
`Padding="0"` and `HorizontalContentAlignment="Left"`. The second exists to vary the content
alignment, which is the only reason this component exposes a `Control` member as a prop —
and the measurement that made it necessary is that the default is **Center**, not the left
alignment a reader assumes.

### Popup — v6 unit 2

**There is nothing to sweep, and saying so is the entry.** `controls/dev/` has no `Popup`
directory: `Popup` is a `Windows.UI.Xaml.Controls.Primitives` control that WinUI 3 neither
reimplements nor restyles, so there is no `.cpp`, no template and no dictionary of its own —
the first control in this project with none of the three. `docs/surface.md`'s procedure names
the no-`.cpp` case; this is the case where the procedure returns nothing at all, which is a
result rather than a gap.

What that means for the reproduction is that **the control draws nothing.** The box in the
Gallery's screenshot belongs to the sample, not to the Popup: `PopupPage.xaml:26-31` declares
a `Grid` inside it with `MinWidth="240"`, `Padding="16"`, an acrylic background, a 1px
`SurfaceStrokeColorDefaultBrush` border and `OverlayCornerRadius`. So the unit emits no colour,
no border and no padding, and the harness page owns the chrome.

**The whole contract is one line of arithmetic, and it was measured rather than derived.** With
the Gallery's defaults — `HorizontalOffset="200"`, `VerticalOffset="0"` — the declaring
element's border box starts at x 370 and the popup's at x 570, with both tops at y 280. The
popup is drawn at its own layout position translated by the two offsets. There is no
anchoring to a trigger, no preferred side, no flip when it would overflow and no collision
padding; a large enough offset pushes it off the window and WinUI lets it go.

That is why this unit does not use the floating content layer that the rest of the tranche
does. `Popover.Content` hands placement to Floating-UI, which would then have to be argued out
of flipping, shifting and offsetting. `Popover.ContentStatic` is the same layer stack with the
floating one removed, and it is what a `Popup` actually is: a portal, an escape layer, a
dismissible layer and a focus scope, positioned by whoever mounted it.

**One property of the dismissible layer is worth carrying into the rest of the tranche.** Open
surfaces form a stack, and `interactOutsideBehavior: 'ignore'` — which is what a Popup with
`IsLightDismissEnabled` false compiles to — does not merely decline to close its own layer, it
blocks every layer beneath it. Six open popups with a non-dismissable one on top survive both
an outside click and Escape. The harness page declares its light-dismiss pair in the order
that makes both halves reachable, and says so.

### Flyout — v6 unit 3

Like Popup, a framework control WinUI 3 only restyles: no `.cpp` in the pin, so the dictionary
and the measurement are the whole record. Unlike Popup, the dictionary is the control.
`FlyoutPresenter_themeresources.xaml`'s `DefaultFlyoutPresenterStyle` at `:22` sets every
visual property, and the template at `:43` is one `Border` with a background, a border, a
corner radius and `BackgroundSizing="InnerBorderEdge"` around a `ScrollViewer` whose
`ContentPresenter` takes the padding as its `Margin`. Nothing is computed anywhere.

Placement, measured against the Gallery's only example and then against the reproduction:
the flyout is centred on its trigger (centres 414.5 against 414 upstream; 268.66 against
268.97 here), sits above it, and leaves a 4px gap that no pinned resource states.

**Collision avoidance is on for every placement, and that was decided by driving it.**
`FlyoutPlacementMode` is a _preferred_ placement upstream and the popup hosting a flyout keeps
itself inside the window; with avoidance off, the Gallery's own example — a 355px flyout
centred on a trigger near the left edge — rendered at x = -109, a hundred pixels outside the
viewport. The consequence is that `auto` and `top` resolve alike here, which is not a
collapse: upstream `Auto` asks the framework to choose and for a button flyout it chooses Top.

**The find worth keeping is not about Flyout at all.** The Gallery's sample styles its message
`Style="{ThemeResource BaseTextBlockStyle}"`, and reproducing that with the generated ramp
class made the flyout a pixel too tall. Upstream's `BaseTextBlockStyle` —
`TextBlock_themeresources.xaml:10-18`, and the framework dictionary's copy at
`generic.xaml:11133` for its siblings — sets FontFamily, FontSize, FontWeight, TextTrimming,
TextWrapping, LineStackingStrategy and TextLineBounds, and **no LineHeight**. None of the ten
ramp styles sets one. The line heights in the generated ramp classes come from the published
type ramp, which `scripts/tokens/manifest.mjs` is explicit about — "the two columns the XAML
does not carry" — but a design document is not what the shipped styles do, and a WinUI
TextBlock with no `LineHeight` draws the font's own spacing.

Measured: the Gallery's Base-styled flyout message is 19 tall and its flyout 97; the ramp's
20px makes them 20 and 98. That is one step of ten, measured once, which is why nothing has
been changed in the ramp — but it is another control needing `line-height: normal` to match
the original after `InfoBar` and `Expander` did, and by this point the override is the rule
rather than the exception. No ordinal is given: the running count this file used to keep was
wrong every time it was checked, because the controls that carry a ramp class on their root
and override it there — `Button`, `CheckBox`, `RadioButton`, `ToggleSwitch` among them — were
never in it.

### MenuFlyout — v6 unit 4a

`MenuFlyout_themeresources.xaml` is 1050 lines and the four styles this unit reproduces —
`DefaultMenuFlyoutPresenterStyle` at `:270`, `DefaultMenuFlyoutItemStyle` at `:298`,
`DefaultToggleMenuFlyoutItemStyle` at `:398` and the `MenuFlyoutSeparator` style at `:727` —
are about a fifth of it. The rest is the sub-item, split-item and accelerator vocabulary that
unit 4b reads, plus three families no unit will: the `*Reveal*` sets, the pre-Fluent
`*ThemeBrush` set at `:51-58`, and `MenuFlyoutLightDismissOverlayBackground`.

**The item padding's names are the wrong way round, and only the ruler says so.**
`MenuFlyoutItemThemePadding` is `11,8,11,9` and `MenuFlyoutItemThemePaddingNarrow` is
`11,4,11,5`, and it is the _narrow_ one a desktop menu draws: the template's
`PaddingSizeStates` comment says narrow padding applies "when flyout was invoked with pen,
mouse or keyboard" and the wide one to "all other cases including touch". Measured on the
guest, an item box is 28 tall — 4 + 19 + 5 — inside a 32px row, and the Gallery's three-item
card with one separator is 105. The wide form would give 36 and 129. WD-013 records that no
input the web offers distinguishes the two cases the way WinUI's does.

**Two things paint the card and neither is the presenter's own brush.**
`MenuFlyoutPresenterBackground` resolves to `DesktopAcrylicTransparentBrush`, `#00000000` in
all three themes. What shows is the presenter's `SystemBackdrop`,
`AcrylicBackgroundFillColorDefaultBackdrop`, which `AcrylicBrush_themeresources.xaml:54`
defines as a bare `<DesktopAcrylicBackdrop />` — an element with no value to convert. Its flat
equivalent, `AcrylicBackgroundFillColorDefaultBrush`, is `#f9f9f9`, which is the measured fill
to the byte. WD-002 gained the paragraph.

**The gutter is stated twice and the two agree.** `MenuFlyoutItemPlaceholderThemeThickness` is
`28,0,0,0`, the left margin a plain item takes when the menu also holds a check; the toggle
template's own check column is a `FontIcon` at `FontSize="12"` with `Margin="0,0,16,0"`, and
12 + 16 is 28. Measured, every row's text starts at the same x whether it carries a check or
not — 44 from the card's border in the original and 44 in the reproduction.

**Margin collapsing is what the sweep would not have caught.** XAML's stack has none; CSS's
normal flow has. Every row carries `MenuFlyoutItemMargin`'s 2px top and bottom, and adjacent
2s collapse to one — so the first reproduction was 101 tall against the original's 105, with
every individual number in it correct. Only the total was wrong, and only against the original.
The presenter is a column flex container for that reason.

### MenuFlyout — v6 unit 4b

The icon and the accelerator label are both cells of the item template that unit 4a already
drew, and both are governed by `CheckPlaceholderStates` at
`MenuFlyout_themeresources.xaml:342` — a group whose states the control enters **for every row
at once**. Measured: in the Gallery's icons example, `Rename` and `Select` carry no icon and
their text starts at exactly the same x as `Share`'s. A row without an icon in a menu that has
icons still reserves the column, which is why the reproduction keys the gutter off the whole
`items` array rather than off the row.

`IconRoot` and `TextBlock` sit in the _same_ Grid column and overlap: the `Viewbox` is
left-aligned at the column origin and the TextBlock is pushed right by a margin. That is why
`MenuFlyoutItemPlaceholderThemeThickness` and `…DoublePlaceholderThemeThickness` are `Margin`
values rather than column widths, and it is reproduced with a positioned wrapper so both
margins still measure from one edge.

**The accelerator row is a pixel taller than a plain one, and the Gallery hides it.** The label
is `CaptionTextBlockStyle` with `Margin="24,4,0,0"` — 16 of line box plus 4 of top margin is
20, against the item text's 19 — so a row carrying one is 29 tall and pitches at 33. The
original cannot be used to confirm that directly: `MenuFlyoutPage.xaml`'s `Example5` sets
`FontFamily="Segoe UI"` on the whole `ControlExample`, and every row in that menu measures 33
whether it carries a label or not. The icons example, which sets no font, measures 169 tall for
five 32-pitch rows and one separator — and the reproduction measures 169 too.

The toggle template's own label carries `Margin="24,0,0,0"` at `:493`, 4px different from the
item template's at `:392`. Both are in the source; neither is a resource.

### MenuFlyout — v6 unit 4c

`RadioMenuFlyoutItem_themeresources.xaml` is 204 lines and defines **no brush of its own**:
`DefaultRadioMenuFlyoutItemStyle` at `:4` reads MenuFlyout's dictionary throughout. Read side
by side against `DefaultToggleMenuFlyoutItemStyle`, the only difference that draws anything is
one character — `Glyph="&#xE915;"` at `:94` where the toggle has `&#xE73E;`, at the same
`FontSize="12"` and the same `Margin="0,0,16,0"`. The padding, the margin, the corner radius,
the three common states with their sub-item brushes, the three-column Grid, the icon Viewbox
and the accelerator label are all the toggle row.

So the class the reproduction hangs the shared rules on is not about toggling. A radio row
carries `toggle` as well as `radio`, and the comment above those rules says what the class
means: a row with a check cell. Naming it after the first control that needed it is what would
have made the next control copy the rules instead of reusing them.

**The group is a context provider with no box.** Upstream's `ItemsPresenter` stacks rows flat
and `GroupName` is a property on the row, not a container. `bits-ui`'s `RadioGroup` is a real
element, and the presenter is a column flex container, so the group would have become the flex
item and the rows its children. `display: contents` is what keeps the rows flex items of the
presenter — the same layout upstream has, arrived at by removing a box the primitive needs and
the visual does not.

Driven on the guest: choosing `Landscape` deselects `Portrait` and leaves the second group's
`Medium icons` alone; the card is 169 tall, five 32-pitch rows and one separator.

### MenuFlyout — v6 unit 4d

`DefaultMenuFlyoutSubItemStyle` at `MenuFlyout_themeresources.xaml:628` differs from the item
row in three ways and no others: a chevron in a second column, a **fourth common state**, and
no accelerator label. The fourth state — `SubMenuOpened` at `:662`, held for as long as the
submenu is open, with its own background, text and chevron colour — is the reason the sub-item
brush family exists apart from the item one, and nothing else in the dictionary has it.

Two placement facts were read off the ruler rather than out of a document, because no pinned
resource states either. The submenu's left border sits exactly on the trigger _row's_ right
edge — the row spans x 366..471 inside a card whose border is at 476, so the 5px by which the
submenu overlaps the card is `MenuFlyoutItemMargin` plus the border rather than a gap anyone
chose. And its top border sits 2px above the row's border box, which is that margin's top: the
submenu aligns with the row's margin box. Reproduced: 0.28 and -2.

**The submenu has to be portalled, and the reason is a rule this component set itself.**
`.presenter` carries `overflow-x: hidden` so the separator's negative margins are clipped at
the border — unit 4a's answer to a `Rectangle` 8px wider than its container. A `SubContent`
rendered in place is a descendant of that presenter and gets clipped with it, so it goes
through `DropdownMenu.Portal` to the document, which is where the original's is.

**A type annotation in a `{#snippet}` header ships.** The rows had to become a recursive
snippet to be reachable from both the root menu and every submenu, and the parameter was
specified with a type. `svelte-package` strips TypeScript from `<script>` blocks and from
nothing else, so `{#snippet rowList(entries: MenuFlyoutEntry[])}` reached the published source
and was a parse error in every consumer's build — while this package's own `check` and `lint`
stayed green. The project already had a rule about type annotations in markup _expressions_;
this is the same rule, and a snippet header is markup too. The parameter takes a default
instead and TypeScript infers from it.

### MenuFlyout — v6 unit 4e

`DefaultSplitMenuFlyoutItemStyle` at `MenuFlyout_themeresources.xaml:499` is the only row in
the dictionary that is two controls. Its template stacks **two grids in one cell**, and which
of them measures the row is the whole of the unit. `BackgroundGrid` at `:598` holds the two
buttons and the divider between them; its columns are `*`, an `Auto` that fits a 1px `Border`,
and a fixed `SplitMenuFlyoutItemChevronButtonWidth` of 38, so it contributes 39 and no more.
`LayoutGrid` at `:609` holds the icon, the text and the chevron, carries the item's `Padding`,
and is marked `IsHitTestVisible="False"` on the parts that would otherwise take the pointer.
The row's width is therefore the layout layer's — `11 + text + 24 + 12 + 11` — and the chevron
is measured even though it is drawn over a button 38 wide that does not measure it.

A single flex row cannot hold both of those facts. It puts `11 + 1 + 38 = 50` to the right of
the text where upstream puts `24 + 12 + 11 = 47`, which is a card 3px too wide — 133.67 against
the original's 131, with every individual token correct. So the two layers are reproduced as
two layers, and every other number then falls out rather than being fitted: the divider lands
39 from the row's right edge, the chevron's box ends 11 from it, and the card measures 130.67 x
70 against 131 x 70. That the residue is a third of a pixel rather than zero is the same
residue the cascading card shows (115.72 against 116) and is text metrics, not layout.

Splitting the row across two layers moves the text out of the button that highlights it.
Upstream has the same split and answers it with `Setter`s that reach across — `:527`, `:534`
and `:560` target `TextBlock.Foreground` and `IconContent.Foreground` from states named for a
button — so the reproduction answers it with `:has()`, as `Slider.svelte` already does for a
thumb that colours its track. The chevron is excluded from those rules and painted by four of
its own, because upstream never lets it take the item foreground.

**`:active` matches the ancestors of the pressed element.** The row is an ordinary `div` here
and each half is a primitive, so the base `.item` pressed rule painted the whole row — through
both halves, whose own background is the transparent `MenuFlyoutItemBackground` — whenever one
half went down. Upstream's `RootGrid` has no `Background` and no pressed state at all. This is
the second leak of this exact shape in MenuFlyout: unit 4a's was a pressed fill reaching a
disabled toggle. Both were found by driving the control, and neither would have shown in a
baseline photographed from the same render.

**The disabled split row is not in the harness**, the same way unit 4d left the disabled sub
item out. Its four rules are read off the template's `Disabled` state at `:556` rather than off
a picture.

### ContentDialog — v6 unit 045

Fifteen records in `ContentDialog_themeresources.xaml` and no state family among them. A dialog
has no pointer-over, no pressed and no disabled: nothing in it is interactive except the three
command buttons, and those read the Button dictionary. What the fifteen describe instead is a
stack of three fills, which is what the first measurement pass saw without being able to name.
The smoke layer dims the window; `ContentDialogBackground` paints the card; and
`ContentDialogTopOverlay` paints the title and content area only. That is why the original is
white above the separator and 243 below it out of a single `Background` setter — the 243 is the
card showing through where the overlay stops.

The separator is not an element. It is `BorderThickness="{ThemeResource ContentDialogSeparatorThickness}"`,
`0,0,0,1`, on the same Grid that carries the overlay and the padding (`:233`), so the rule and
the white area are one box.

**The title is not a type-ramp step.** `:238` sets `FontSize="20"`, `FontWeight="SemiBold"` and
`FontFamily="{StaticResource ContentControlThemeFontFamily}"` on the `Title` ContentControl
directly. `SubtitleTextBlockStyle` is also 20 and SemiBold, and is not the same thing: it names
the Display family where this names the Text family, and its line box is 28 where the original's
title measures 27. Both the title and the content need `line-height: normal` over the ramp
class, which by this unit is what every control in the tranche that draws text has needed —
an argument for the type-ramp unit `docs/plan.md` carries rather than a note beside it.

**The command row's five columns are rewired per combination, not hidden.** `CommandSpace`
(`:248`) declares `*`, a spacer, `*`, a spacer, `*`, and `ButtonsVisibilityStates` (`:144`)
moves buttons between columns and changes the spacers' widths. Three visible buttons give three
equal columns with two 8px gaps; two give two equal columns with one gap. One gives **two equal
columns with the button in the right one** — a lone Close button is half the width, not full,
because `PrimaryColumn` is still a star column with nothing in it. Reproduced as a grid whose
column count is the visible-button count, with the one-button case placing its child in column 2.

`ContentDialogButtonSpacing` is the first `GridLength` any tranche has reached. It is not a
length: it is one of the tracks a Grid divides itself into, and the CSS analogue is a value
inside `grid-template-columns` or `gap` rather than a custom property. It is seeded into the
manifest so the completeness check counts it and then excluded from emission, which makes its
absence from `tokens.css` a recorded decision rather than a hole.

**Two behaviours live entirely in `ContentDialog_Partial.cpp` and neither is visible in the
template.** `SetInitialFocusElement` (`:1984`) moves focus in when the dialog is shown, and it
tries the content's first focusable element (`:1997`) before `DefaultButton` (`:2027`) and the
first command button (`:2039`) — so a dialog whose content takes focus never reaches its default
button, which is both Gallery examples. All three are `FocusState_Programmatic`, which draws no
visual. This library reproduces the order and declines the visual with
`focus({ focusVisible: false })`; WD-015 records the fourth step it adds.

`ProcessLayoutRootKey` (`:1736`) is the other, and it is a **layout-root** handler rather than a
focus one: Escape runs `ExecuteCloseAction` (`:2063`), which invokes the close button so that
`CloseButtonClick` fires and the result is `None`, and Enter clicks `DefaultButton` if it is
enabled (`:1761`) — from anywhere in the dialog, whatever holds focus. Neither is reproduced.
Measured 2026-09-18 on `/dev/content-dialog`: Enter leaves the dialog open, and Escape closes it
through the primitive's own handler, which does not run `onCloseButtonClick`. That is the
outstanding half of this control and it is a unit of its own, not a divergence — nothing about
it has been declined.

### TeachingTip — v6 unit 046a

`TeachingTip_themeresources.xaml` carries fifty-one records and seven of them are dead.
`TeachingTipContentBorderThicknessTop`, `Bottom`, `Left` and `Right` describe a card whose
border is open on the side the tail leaves from; nothing assigns any of them. The Style sets
`BorderThickness` to `...Untargeted` once (`TeachingTip.xaml:8`), no visual state replaces it,
and `TeachingTip.cpp` never touches it. `TeachingTipTopHighlightBrush`, `...Height` and
`...OffsetForBorder` are the same story one step further on: the `TopHighlightLeft` and
`TopHighlightRight` parts they would paint are gone from the template and survive only as
names in `TeachingTip.h:298`.

The template is a **5x5 grid whose outer ring is the tail's** — `8 | 10 | * | 10 | 8` on both
axes (`:282`), with the card at rows and columns 1 through 3 and the tail placed into one of
the four 8px tracks by `PlacementStates`. Two consequences the reproduction inherits. The
distance between the card and the thing it points at is that 8px track and nothing else, which
is what the reference measures. And `TeachingTipMaxWidth` 336 is on the outer grid, so the
widest card it can produce is 320 — which is exactly what the Gallery's hero example measures,
and is why the reproduction's cap is `MaxWidth − 2 × TailShortSideLength` rather than
`MaxWidth`.

**`TeachingTipMinWidth` is not honoured by the shipped control** and the reproduction does not
apply it either; WD-016 carries the decision. It is declared 320 and set as `MinWidth` on the
same two grids the maximum is set on, so the narrowest card the template can produce is 304.
Two independent Gallery examples measure 224 and 248. No mechanism was found — the code never
touches a width and the `perf2026` variant of the dictionary differs only in
Storyboard-versus-Setter form — so this is recorded as a disagreement between the pin and the
build rather than explained.

**The tail is not an ornament under the card; it is a hole in it.** `TailPolygon` (`:353`)
fills with the card's `Background` and strokes with its `BorderBrush`, and it is painted after
`ContentRootGrid`, so where it meets the card it paints out the card's own border for the
sixteen pixels it crosses. Three details only measurement gives. Its base is **not** stroked,
so nothing draws a line across the join — a `polyline`, which fills as though closed and
strokes only the segments it is given, is the CSS-side primitive for that and a `polygon` is
not. Nothing of it is painted inside the card: the two slanted strokes begin at the top of the
card's border row and not one pixel higher, which is what `TailOcclusionGrid` is named for.
And the split is three pixels inside the card and seven outside, where the template's own
arithmetic — a 10-tall polygon bottom-aligned in an 8px track with a −1 top margin — argues
for two and eight. The reproduction clips an `svg` viewport to the outer seven and pulls it
one pixel back over the border, which lands the measured rows exactly.

The header close button belongs to `NonHeroContentRootGrid` (`:319`) rather than to the card,
so it sits against the top-right corner of whatever is below the hero and not of the card
itself. Its `AlternateCloseButtonStyle` (`TeachingTip_themeresources.xaml:101`) puts a
`Padding` of 4 on a transparent outer `Border` and the fill, border and radius on the
`ContentPresenter` inside it: a 40x40 hit target with a 32x32 painted box, which is visible the
moment it is hovered and invisible at rest.

The icon is centred against the _pair_ of text lines rather than aligned to the first —
measured, the icon's ink centre and the title-plus-subtitle block's centre are both 257.5, and
a top-aligned icon would be nine pixels out. Its 20x20 box is `SymbolIcon`'s own default
FontSize; no TeachingTip resource states it, which is this unit's one `c1-allow`.

Every line box on all three examples measures 19 where the generated
`winui-BodyTextBlockStyle` imposes 20, so the title and the subtitle both need
`line-height: normal` over the ramp class. Five of this tranche's six controls have needed the
override somewhere; Popup is the exception, and it draws no text at all. The running total
this file used to carry is gone: it was incremented rather than derived and had drifted below
the real number.

### TeachingTip — v6 unit 046b

Three of the tip's states are declared in the template and not honoured by the shipped
control. Unit 046a's section carries the first, `TeachingTipMinWidth`. The other two are here,
and both were found the same way: by decomposing a card that measured one number and finding
the template's arithmetic gave another.

**The command row's two columns behave as `Auto`, not as `*`.** The template declares two star
columns (`TeachingTip.xaml:336`). Two star columns over the untargeted example's 222px content
area are 111 each, which would make both buttons 107 wide. They measure 110 and 104 — their
natural widths — and the card is 248 rather than 254, because it is sized by the _sum_ of the
two naturals rather than by twice the larger. Reproduced with `grid-template-columns: auto
auto`, which is the same shape in both directions: content-width when the row is tight, an
equal share of the surplus when the card is wider, which is what two star columns would give.
`1fr 1fr` would have been the literal translation and is wrong by six pixels.

**`TeachingTipMainContentPresentMargin` is not applied.** WD-017. The hero example puts 16
between the subtitle and the description, which is exactly the `Margin="0,16,0,0"` the Gallery
sets on its own `TextBlock`; with the `Content` state (`:64`) live it would be 28 and the card
would be twelve taller than the 310 it measures. The reproduction's content slot takes no
margin, and the harness's description carries the 16 the Gallery's does.

The hero band fills the card's inner box exactly — 318 x 211 inside a 320 x 310 card whose
border is 1 — and its top corners round against that inner corner rather than the outer one:
the image's left edge by row fits a radius-7 circle and not a radius-8 one, 7 being
`OverlayCornerRadius` minus the border. The card cannot do that clipping with `overflow:
hidden`, which is the obvious way and would take the tail with it, so the radius is written on
the band.

`HeroContentPlacementStates` (`:101`) moves the band between the first and last rows, which is
`order` in a column flex container. `Auto` upstream puts the band away from the tail; only the
tail-at-the-bottom case is on the reference machine, so the rule for the other side is read off
the state's name rather than measured, and the component's comment says which is which.

The header close button is not a fixture. `CloseButtonLocations` (`:75`) removes it whenever
the command row supplies a close button, and the titles' 28px right margin goes with it — the
`FooterCloseButton` state resets that margin to `0,0,0,0`. Both were confirmed on the second
Gallery example, which has two commands and no X.

The content slot needs `line-height: normal` too, which makes three in this control alone.
Nothing upstream sets a line height on `MainContentPresenter` (`:335`); a `TextBlock` there
uses the font's own spacing, which measures 19 where the ramp class imposes 20. The card came
out 311 tall against the original's 310 until it did.

An untargeted tip is anchored to the window, which is `position: fixed` here — a zero-height
element spanning the viewport's bottom edge, handed to the primitive as its anchor so that one
markup tree serves both modes. Its bottom sits `PlacementMargin` above the viewport edge. On
the reference machine the same tip sits 51 above the app's client bottom where `PlacementMargin`
of 20 plus the 8px tail track account for 28; the remaining 23 has no rule behind it that this
sweep could find, and is not reproduced.

### The shadow a portalled surface casts — unit 047

WD-012 declined this and named its own reversal condition: a measured profile at two or more
z-distances, on both themes. The condition was met, and the argument it rested on turned out to
be wrong in its first clause. `Common_themeresources.xaml:48` sets
`ThemeShadowIsUsingDropShadows` to **True**, so what the popup host casts here is a plain drop
shadow rather than the composition receiver-list projection the entry described — and a drop
shadow is exactly what `box-shadow` is. The depths are in the pin too: `TeachingTip.h:230` and
`:231` put the tip's card at z = 32 and its tail at 0, and
`NavigationView_themeresources.xaml:207`, `NumberBox_themeresources.xaml:33` and
`TabView_themeresources.xaml:265` each state a popup depth of 16. What the pin does not state
is the depth-to-blur recipe, and that is the only part that had to be measured.

**Three depths, and two are fitted.** A popup's ramp closes in nineteen pixels, a
ContentDialog's has not closed forty out, and a ToolTip's is about eight. Flyout, MenuFlyout
and TeachingTip take the fitted popup value and ContentDialog its own; WD-012 narrows to
ToolTip, and what blocks it is a capture rather than a judgement — four ways of raising a
ToolTip by hover on the guest produced nothing, and the one prose reading that exists is a
single theme at one significant figure.

**The dialog depth's dark multiplier was read differently from the popup's, on purpose.** The
popup's 1.78 came off the whole 19-point curve. A dialog's ramp is long enough to cross onto
whatever the Gallery page has underneath it, so its tail measures two things at once — the
curve suggested 2.1 and the edge suggested 2.36, and they cannot both be the shadow. The light
fit, taken against a clean 170 backdrop, lands within 0.013 alpha end to end and settles which
half to trust: the first rows out, which are the least contaminated and the ones anyone sees.
At 2.36 the rendered edge alpha is 0.429 against the original's 0.429.

**Dark is not light.** At the popup depth the shadow measures 0.123 alpha at the card's edge in
light and 0.219 in dark — 1.78x — and the same ratio holds when the dark recipe is rendered
back. A single-theme measurement would have licensed reusing the light value and drawn every
portalled surface half as dark as the original in the theme where the error is hardest to see.

**It is not a Fluent shadow token.** WinUI's depths are 16 and 32 and Fluent 2 publishes
`shadow16` and `shadow28`, so the obvious move was to cite rather than fit. Rendered and
measured, every Fluent token darkens the pixels _above_ the card — 229 and 228 against a 243
backdrop — because each carries a symmetric ambient ring, and the original darkens nothing
above to the pixel. Recorded because the next reader will have the same idea.

The value lives in `PLATFORM_SHADOWS` in the token manifest, beside `PLATFORM_METRICS` and for
the same reason: it is a platform value with no resource to be read from. It is the first such
family that is **per theme**, which the generator had no path for — the hand-supplied families
before it were all `:root`-only.

**The suite could not see any of it.** Adding a whole drop shadow to three surfaces changed no
test: the largest pixel change is 30 levels out of 255, and `toHaveScreenshot`'s default
threshold is 0.2 in YIQ. Twenty-seven of twenty-seven passed against baselines that show no
shadow at all. The images had to be deleted before Playwright would write new ones. This is the
second time in two units that a real visual change has been invisible to the gate, and it is
the strongest argument yet that a green suite means _no pixel moved by more than the threshold_
and nothing else.

**Amended in v14 unit 0 — the pin does state the recipe.** `GetDropShadowRecipe` in
`dxaml/xcp/components/graphics/inc/DropShadowRecipe.h` became available when v14 widened the
sparse checkout to include `dxaml/xcp/components`, and all three depths are now derived rather
than fitted. The only measured quantity left is the composition-blur-to-CSS-blur constant,
`2 / 3`, with RMS alpha residual 0.0016 and worst residual 1.74 levels.

## An unspent measurement — the Design pages' Typography rows

Measuring the ramp for ADR 0011 produced a number the Gallery has not been given. The reference
Typography page's ramp rows clamp at a 68px minimum and grow past it for the two largest steps,
where they measure 78 and 115 down a column clear of text. Those are satisfied by 25px of
vertical padding around the sample.

`apps/gallery/src/routes/(shell)/design/typography/+page.svelte:33` sets `padding: 12px 16px`,
so ours is 24. The clamped rows are unaffected — `gallery-styles.css:31` gives them the same 68 —
but Title Large comes out 77 against 78 and Display 114 against 115.

Not fixed here, because 25 is an odd number for a symmetric pad and the fit cannot say whether
the original is 12 over 13, a 12.5 pair, or 12 plus something the fit absorbed. Closing it wants
one more look at the reference, not a guess. Recorded so the measurement is not lost with the
unit that made it.

## What this file does not cover

The sweep reads what a control _draws_. It does not enumerate automation peers, keyboard
protocols, or the parts of a code-behind that only compute layout the browser computes for
us. Those are out of scope for a library whose bar is visual fidelity, and a line here that
mentioned them would imply a decision that was never made.
