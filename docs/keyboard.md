# A keyboard model is decided by observation

The companion to `docs/surface.md`. That file exists because a control's template was wrong
about the machine and was wrong silently; this one applies the same sentence to the half of a
control that has no pixels.

## The standard

**What Windows 11 actually does decides.** Not the WAI-ARIA Authoring Practices guide, not the
pin's C++, not a primitive library's default, not what the template implies. Each of those is
_evidence about_ the machine's behaviour, and each of them can be wrong about it.

This is not a new rule. The plan's D5 already says visual truth is a human side-by-side against
Windows 11 and that automation gates regression only.

## Whose behaviour counts as evidence

Three authorities get confused in a keyboard argument, and only one of them is the standard
above.

1. **Windows 11** — what the machine does. The standard.
2. **The pin's source** — evidence about the machine, and the best available without it. Still
   silent on much of what a person experiences: `TabView.cpp:1580-1589` says which keys are
   handled and says nothing about where focus lands when the strip is first entered.
3. **The web's own pattern** — WAI-ARIA's, as a primitive library implements it. Very likely
   the more standard behaviour _on the web_, and not evidence about Windows 11 at all.

The third is the one that causes trouble, because a component built on a primitive inherits
that primitive's model silently, and the result then reads afterwards as a considered position.
It is not one. A primitive's ring covers the elements the primitive has; where a control adds
an element the primitive never had, there was nothing to follow and therefore no decision
taken. Read as a vote about Windows 11 it is noise.

**The Goal rules on this, and the ruling has a limit worth reading closely** (`docs/plan.md:15-16`):

> Where a primitive's interaction model disagrees with WinUI, the divergence is recorded and
> accepted rather than forced.

That buys an exemption **only where a primitive is involved**. Of ninety-eight components,
nineteen import bits-ui and one imports Zag; the rest are hand-rolled, and a hand-rolled control
has no primitive whose model to defer to. `NavigationView` and `TabView` are both hand-rolled.
**So neither of the two models in dispute below is covered by the licence** — and WD-004's own
reasoning does not claim it is: it was accepted on cost, because the contract is hard to get
right untested.

**The rule, in one line:** where a primitive is in the way, record and accept; where there is no
primitive, the machine decides, and the machine has to be asked.

## Why this needs saying

Two keyboard models are in dispute, and neither was settled by pressing a key on Windows 11.

- **WD-004** (`docs/divergences.md:145`) — `NavigationView`'s items are each a tab stop, with no
  arrow keys, no typeahead, no Home or End. Its "WinUI does" paragraph is a careful description
  of the WAI-ARIA tree pattern, and its reasoning says so in as many words (`:163-164`): _"the web's own
  keyboard contract for a `role="tree"` is the WAI-ARIA Authoring Practices guide, **which is
  what WinUI follows**"_. That clause is an assumption. It is very probably true. It has not
  been checked, and under the standard above it is exactly the kind of sentence that gets
  checked.
- **`TabView`'s ring** — the close button sits _inside_ the arrow-key order and the add-tab
  button sits outside it, as a tab stop of its own. This one was read from the pin:
  `TabView.cpp:1580-1589` handles the two keys, and `IsTabStop="False"` at `TabView.xaml:576`
  keeps the close button out of the Tab order. That is a much better provenance than WD-004's —
  and it still does not say what a person experiences, because it does not say where focus lands
  when the strip is first entered, what happens at the ends, whether the add button is reachable
  by arrow at all, or whether selection follows focus.

The two entries are not equally weak, and that is the point: **the difference between them is
invisible in the registry.** Both read as settled. Nothing in the format distinguishes a
divergence measured against the machine from one inferred from a document.

**And WD-004 is load-bearing for more than its own control.** The `ItemsView` and `TreeView`
divergence is accepted as "WD-004's situation on a second control, and the same answer"
(`docs/divergences.md:752`), and says it will be re-examined when the roving-tabindex rig
WD-004 is waiting on gets built. Three controls rest on one unchecked clause.

## What in this project can see a keyboard model

Almost nothing. Counted 2026-09-21.

| apparatus             | what it sees                                                                                                                                                                       | keyboard?                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| three-theme snapshots | a resting frame, photographed                                                                                                                                                      | no — a focus ring is at most a still, and only if something put focus there                                                         |
| C1–C11                | literals, generated records, layer separation, the theme matrix, divergence citations, consumer tooling, the acceptance surface, token resolution, commit subjects, template parts | no — every one is structural or textual                                                                                             |
| the visual suite      | 111 specs, of which **6** press a key                                                                                                                                              | partially: `content-dialog-focus`, `command-bar-flyout-focus`, `color-picker`, `color-picker-slider`, `hyperlink`, `rating-control` |
| `surface.md`'s sweep  | four steps: find the `.cpp`, grep it, read the template's states, open the sample page                                                                                             | no — all four are readings                                                                                                          |
| the parts census      | 7 templates, 80 parts, 67 states                                                                                                                                                   | no — and see below                                                                                                                  |

Two rows deserve their own sentence.

**`tab-view.spec.ts` and `navigation-view.spec.ts` contain zero keyboard assertions.** The two
controls whose models are in dispute are the two with no test that presses anything.

**The parts census carries no focus state.** Its 67 states are display modes, pane positions,
visibility groups and separator orientations — `LeftMode`, `PaneOverlaying`, `HeaderCollapsed`,
`ListSizeCompact`. Not one name contains `Focus`, `Press` or `Pointer`. So C11, the newest and
strictest thing in the repository, can be entirely green on a control whose keyboard contract is
wrong, and would be. That is not a defect in C11 — parts and states are what it set out to cover
— but it closes the last place where one might have hoped a keyboard judgement was already being
recorded.

**The precedent is already in the plan.** v4 closed green — nine gates, thirteen baseline sets —
and then a manual pass driving the five controls with a mouse and a keyboard found six defects,
two of which were mechanisms every later control would re-break (`docs/plan.md:744`). The lesson
was written down at the time: _none of that was found by a gate._ This document is that lesson
applied before the fact instead of after it.

## What to observe

Concrete, falsifiable, and short enough to do in one sitting on the guest. Each line is one
question with one answer.

### `NavigationView` — the pane

1. From a control before the pane, how many Tab presses reach the first item — one, or one per
   item until you leave?
2. With focus on an item, does Down move focus to the next item? Does it wrap at the end?
3. Do Home and End jump to the ends?
4. Does typing a letter jump to the next item whose label starts with it?
5. On an item with children: does Right expand, and Left collapse? Where does focus go?
6. Is the expand chevron reachable by Tab, by arrow, or only by pointer?
7. Does moving focus change the selection, or does selection need Enter or Space?
8. With the pane closed-compact, do the same answers hold?
9. With a text field focused _inside_ a row — the shape ADR 0015 makes possible — does typing a
   space invoke the row, or does the field take it? **Half of this is readable from the pin and
   half is not**, and an earlier version of this line said none of it was. The readable half:
   the control subscribes to each item's `KeyDown` plainly — `NavigationView.cpp:3595`, handler
   at `:2709` — and `AddHandler`, the only overload that asks for events something already
   marked handled, appears nowhere in that file. The pin states the consequence in its own
   words where a control wants the opposite: "Ancestor PART_BodyScroller marks nav keys Handled
   before they bubble here; handledEventsToo:true lets us still act on them"
   (`TableView.cpp:271-273`). So a key handled inside the row never reaches the row's handler,
   and ours reaches it always. The half still to observe is whether a focused `TextBox` marks
   Space handled at all — that is what decides the case, and it is in a base class the pin's
   `NavigationView` directory does not carry.

### `TabView` — the strip

1. From a control before the strip, how many Tab presses reach the tabs?
2. With focus on a tab, does Right reach that tab's close button, or the next tab?
3. Is the add-tab button reachable by arrow from the last tab, or only by Tab?
4. At the first and last tab, do the arrows wrap or stop?
5. Does arrowing between tabs change the selected tab, or only focus?
6. With more tabs than fit, does arrowing to an off-screen tab scroll it into view? (This is
   WD-024's subject, and it is a keyboard question as much as a layout one.)

### The rule the list follows

Every question is about **where focus goes and what moves it** — never about what a thing looks
like. Anything answerable from a screenshot belongs to the visual battery and not here.

## How to observe it

The reference guest already runs the original, and `surface.md` records Slider's thumb tooltip
being found exactly this way, by pressing the original and photographing what happened. Nothing
new is needed:

1. Open the original Gallery on the guest, on the control's page.
2. Work the list above by hand, with the keyboard only. Write the answer beside each number.
3. Do the same on our dev route for that control, in the same sitting, on the same machine.
4. Record both columns. **The answers are the artefact**, not the conclusion drawn from them.

There is no rig for this and one should not be built yet. Playwright drives _our_ routes and can
automate step 3; nothing drives a XAML application. A person and a keyboard is the instrument,
and for a dozen questions per control it is the cheap instrument.

## What an observation decides

Three outcomes, and each has a different destination:

- **The original does X and we do X.** Nothing to record except that it was checked — which is
  the change this document actually asks for, below.
- **The original does X, we do Y, and Y is reachable.** A defect. It goes to the punch list, not
  to the divergence registry. A divergence is for what the web cannot do; a roving tabindex is
  not that.
- **The original does X and the web cannot do X.** A `WD-` entry — and now one whose "WinUI
  does" line is a report of an observation rather than a reading, with the date and the machine
  in it.

**WD-004 is a candidate for the second outcome.** Its own reasoning says the loop "is not hard"
and that what is hard is the contract being right without a test — which is an argument for
building the test, and the list above is most of it.

## The one procedural change

`surface.md` earned its place by turning "read the code-behind before sealing" into four steps
that cost minutes. The same move, for the same reason:

> **A control whose surface includes a keyboard contract is not sealed until that contract has
> been pressed on Windows 11, and the unit says what was pressed.**

Not a gate — a gate cannot press a key. A line in the unit, the way a baseline set is a line in
the unit. And for a `WD-` entry about behaviour, a required sentence naming the machine and the
date, so that the registry stops reading the same whether the machine was consulted or not.

Controls already sealed are not re-swept wholesale. The two in dispute are swept when a decision
waits on them; the rest are swept when something asks.

ADR 0015 is the first decision to cite this rule: it makes `NavigationViewItem` a public
component, which publishes the keyboard contract WD-004 describes, so the observation above
comes before that control is sealed.
