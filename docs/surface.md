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

## What this file does not cover

The sweep reads what a control _draws_. It does not enumerate automation peers, keyboard
protocols, or the parts of a code-behind that only compute layout the browser computes for
us. Those are out of scope for a library whose bar is visual fidelity, and a line here that
mentioned them would imply a decision that was never made.
