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
   silent on much of what a person experiences: `TabViewItem.cpp:578-597` and
   `TabView.cpp:1578-1591` say which keys are handled and say nothing about where focus lands
   when the strip is first entered.
3. **The web's own pattern** — WAI-ARIA's, as a primitive library implements it. Very likely
   the more standard behaviour _on the web_, and not evidence about Windows 11 at all.

The third is the one that causes trouble, because a component built on a primitive inherits
that primitive's model silently, and the result then reads afterwards as a considered position.
It is not one. A primitive's ring covers the elements the primitive has; where a control adds
an element the primitive never had, there was nothing to follow and therefore no decision
taken. Read as a vote about Windows 11 it is noise.

**The Goal rules on this, and the ruling has a limit worth reading closely** (`docs/plan.md`, under
**Goal**):

> Where a primitive's interaction model disagrees with WinUI, the divergence is recorded and
> accepted rather than forced.

That buys an exemption **only where a primitive is involved**. Of ninety-eight components,
nineteen import bits-ui and one imports Zag; the rest are hand-rolled, and a hand-rolled control
has no primitive whose model to defer to. `NavigationView` and `TabView` are both hand-rolled.
**So neither of the two models in dispute below is covered by the licence** — and WD-004's own
reasoning did not claim it was: it was accepted on cost, because the contract is hard to get
right untested.

**The rule, in one line:** where a primitive is in the way, record and accept; where there is no
primitive, the machine decides, and the machine has to be asked.

## Why this needs saying

Two keyboard models are in dispute, and neither was settled by pressing a key on Windows 11.
The two bullets below are the state that motivated this list. The first of them has since been
answered — the record is under "The `NavigationView` observation" — and is left standing here
because what it argued for is what the answer then cost.

- **WD-004** — `NavigationView`'s items are each a tab stop, with no arrow keys, no typeahead,
  no Home or End. **The entry is deleted**: it was closed on 2026-09-22 by the unit that built
  the ring, so every mention of it in this document names a registry entry that no longer
  exists and is history rather than a pointer. `docs/divergences.md`'s preamble is what makes
  that the right ending — an entry nothing cites is a divergence that was fixed, and the
  registry would be lying if it stayed. Its "WinUI does" paragraph was a careful description
  of the WAI-ARIA tree pattern, and its **Why accepted** said so in as many words: _"the web's
  own keyboard contract for a `role="tree"` is the WAI-ARIA Authoring Practices guide, **which
  is what WinUI follows**"_. That clause is an assumption. It is very probably true. It has not
  been checked, and under the standard above it is exactly the kind of sentence that gets
  checked. **It was checked on 2026-09-21, and it is false** — the tree pattern's Right-expands,
  Left-collapses and typeahead are not what the original does.
- **`TabView`'s ring** — the close button sits _inside_ the arrow-key order and the add-tab
  button sits outside it, as a tab stop of its own. This one was read from the pin:
  `TabView.cpp:1580-1589` handles the two keys, and `IsTabStop="False"` at `TabView.xaml:576`
  keeps the close button out of the Tab order. That is a much better provenance than WD-004's —
  and it still does not say what a person experiences, because it does not say where focus lands
  when the strip is first entered, what happens at the ends, whether the add button is reachable
  by arrow at all, or whether selection follows focus. **Pressed on 2026-10-01**: that the add
  button is outside the arrow order is false — it is in the arrow order as well as the Tab order,
  and the range cited was the add button's own arrow handler, which says so
  (`TabView.cpp:1578-1591`); a tab's is `TabViewItem.cpp:578-597`. The ends wrap, and re-entry
  lands on the last focused tab — see the `TabView` observation below.

The two entries are not equally weak, and that is the point: **the difference between them is
invisible in the registry.** Both read as settled. Nothing in the format distinguishes a
divergence measured against the machine from one inferred from a document.

**And WD-004 was load-bearing for more than its own control.** WD-027, the `ItemsView` and
`TreeView` divergence, was accepted in its **Why accepted** as "WD-004's situation on a second
control, and the same answer", and said it would be re-examined when the roving-tabindex rig
WD-004 was waiting on got built. Both halves of that have now happened — the clause was checked
and the rig was built — and WD-027 was rewritten on 2026-09-22 to stand on its own reading
rather than on a borrowed one. Three controls rested on one unchecked clause; the clause has
now been checked for one of the three, and the other two inherit the answer only as far as
`NavigationView`'s pane resembles them.

## What in this project can see a keyboard model

Almost nothing. Counted 2026-09-21; a row a later unit moved carries the date it was last
recounted, and a row without one is from the original count. Naming the rows and their date,
as this sentence used to, made it wrong the moment one of the two it named was recounted
again.

| apparatus             | what it sees                                                                                                                                                                                                                                                                                                                                            | keyboard?                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| three-theme snapshots | a resting frame, photographed                                                                                                                                                                                                                                                                                                                           | no — a focus ring is at most a still, and only if something put focus there                                                                                                                                                                                     |
| C1–C17                | literals, generator parity, layer separation, the theme matrix, divergence citations, consumer tooling, the acceptance surface, generated-record parity, token resolution, commit subjects, template parts, resolving citations, the popup layer, gradients in colour properties, positions in generated output, positions in held files, the gate list | no — every one is structural or textual (recounted 2026-09-26)                                                                                                                                                                                                  |
| the visual suite      | 131 specs, of which **13** press a key (recounted 2026-09-26)                                                                                                                                                                                                                                                                                           | partially: `content-dialog-focus`, `command-bar-flyout-focus`, `combo-box-focus`, `combo-box-open`, `color-picker`, `color-picker-slider`, `hyperlink`, `rating-control`, `tool-tip`, and `navigation-view`'s four — `-keyboard`, `-rail`, `-template`, `-ring` |
| `surface.md`'s sweep  | four steps: find the `.cpp`, grep it, read the template's states, open the sample page                                                                                                                                                                                                                                                                  | no — all four are readings                                                                                                                                                                                                                                      |
| the parts census      | 7 templates, 80 parts, 67 states                                                                                                                                                                                                                                                                                                                        | no — and see below                                                                                                                                                                                                                                              |

Two rows deserve their own sentence.

**`tab-view.spec.ts` and `navigation-view.spec.ts` contain zero keyboard assertions.** The two
controls whose models are in dispute are the two with no test that presses anything.

**The parts census carries no focus state.** Its 67 states are display modes, pane positions,
visibility groups and separator orientations — `LeftMode`, `PaneOverlaying`, `HeaderCollapsed`,
`ListSizeCompact`. Not one name contains `Focus`, `Press` or `Pointer`. So C11, strict as it is
about parts and states, can be entirely green on a control whose keyboard contract is
wrong, and would be. That is not a defect in C11 — parts and states are what it set out to cover
— but it closes the last place where one might have hoped a keyboard judgement was already being
recorded.

**The precedent is already in the plan.** v4 closed green — nine gates, thirteen baseline sets —
and then a manual pass driving the five controls with a mouse and a keyboard found six defects,
two of which were mechanisms every later control would re-break (`docs/plan.md`, "What closing it
did not catch"). The lesson was written down at the time: _none of that was found by a gate._ This
document is that lesson applied before the fact instead of after it.

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
   and ours reaches it always. The half the pin does not answer is whether a focused `TextBox`
   marks Space handled at all — that is what would decide the case. An earlier version of this
   line put that in a base class the pin's `NavigationView` directory does not carry, which was too
   generous: it is not in the pin at all, and the observation below records the search.

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

## The `NavigationView` observation

Pressed by hand on the reference guest on 2026-09-21, on the `NavigationView` page's
hierarchical sample — `Home` / `Account` / `Document options`
(`NavigationViewPage.xaml:364-415`), with the three `PanePosition` radios beside it
(`:322-337`). Two sittings, both on that date: the eight answers below, then two follow-ups —
which instance had been pressed, and what the foot of the ring does. Our column was measured on
`/dev/navigation-view` by pressing the same keys. **Question 5 is answered in part** — its
collapsing half was not pressed. **Question 9 was not pressed either, and on 2026-09-21 it
stopped being a press that is owed**: entry 9 below records why the reference cannot be
asked it. The record is the eight pressed answers, with that gap named where it falls, and
then the ninth entry, which is a search rather than a press and says so.

1. **The list is one stop, and the stop is the selected item.** Tab walks the pane toggle, then
   the selected item, then the Settings row at the foot of the pane; one press leaves the list
   rather than one press per item. Where the fourth press goes was not pressed. Up and Down
   move among the items once the list is entered. The entry point being the _selected_ item,
   not the first, is the part of a roving tabindex that is easy to get wrong.
   **We** made every item its own stop and every chevron another. On `/dev/navigation-view`'s
   `#menu-fits` frame, the open-pane specimen: toggle, `Home`, `Design`,
   `Design`'s chevron, `Accessibility`, its chevron, `All`, `Basic input`, `Collections`,
   `Settings`.
   **Built on 2026-09-22.** The pane works out which row Tab lands on and every other row
   carries `tabindex="-1"`; the entry is the selected row, or its deepest ancestor still on
   screen when the selection sits inside a collapsed subtree, and the settings row is a stop of
   its own because it is a root list of its own. `navigation-view-ring.spec.ts` presses the
   sequence on each of those branches. **Where the fourth press goes is still not pressed**,
   and this implementation sends it to whatever follows the pane in the document.
2. **Down does not expand; it steps past.** On a collapsed parent Down moves to the next item
   rather than opening it, and past the last item it reaches the Settings row, from which Up
   returns to the list. **At the foot, Down scrolls the page the sample sits on** — that is the
   press. The ring therefore does not wrap, which is a conclusion and not a further
   observation: what closes it is focus staying on the Settings row, and the record reports the
   scroll without reporting where focus went. Up on the pane toggle does the same, but the
   toggle is outside the ring to begin with (1 above), so that press measures a non-ring
   element and **the ring's top end is not measured at all**. A collapsed row toggles open and
   shut on Enter and on Space.
   **We** did nothing on any arrow key. Enter and Space toggle a parent open and shut, and
   report the invoke — the one half of this question that matched.
   **Built on 2026-09-22.** Up and Down walk the visible rows in document order, step over a
   header, step past a collapsed parent rather than opening it, and cross into the settings row
   and back. At the foot the key is **left unhandled**, which is how the page's own scroll is
   reproduced rather than swallowed, and the test asserts the absent `preventDefault()` as well
   as the absent move — the assertion that separates "the ring ends here" from "every arrow is
   consumed".
   **The head was pressed later the same day, and the first build got it wrong.** Up from the
   first row reaches the **pane toggle**, and Down from the toggle comes back to the first row.
   This answer's own note that "the ring's top end is not measured at all" was right when it was
   written, and the ring shipped stopping at the first row on the strength of it. Upstream
   reaches the toggle by _declining_ the key: `FindNextElement(Up)` returns the toggle, which is
   not a `NavigationViewItem`, so `FocusNextUpItem`'s correction is skipped
   (`NavigationView.cpp:2786`), `Depth()` is 0 so the climb at `:2822` is skipped too, and
   XAML's directional navigation finishes the move. **The web has no directional focus
   navigation, so declining moves nothing** — which is the whole of the defect, and the reason
   this one place has to name the element that upstream never names. What makes the declining
   work upstream is one line of code-behind rather than the template:
   `rootGrid.XYFocusKeyboardNavigation(Enabled)` (`NavigationView.cpp:681`), with the content
   grid switched off beside it at `:686`.

   **Press this on the page's own sample and not on the Gallery's shell pane.** Re-pressed on
   2026-09-22 on both: the sample answers as above in both directions, and the shell's pane
   does neither — Up from its first row stays on the row and Down from its hamburger stays on
   the hamburger, in the open pane and in the rail alike. The shell draws its toggle in the
   app's own title bar rather than at the top of the pane, which is the obvious suspect and is
   **not** established here; what is established is that the shell is not a specimen of this
   behaviour. Read off the shell alone, the press says the ring has no head, which is how a
   correct build came within one edit of being reverted.

3. **Home and End jump to the ends**, and pressing them again does nothing.
   **We** did nothing on either.
   **Built on 2026-09-22**, and with a scope of their own: they reach the ends of the row's own
   root list rather than of the ring the arrows use, because
   `KeyboardFocus{First,Last}ItemFromItem` ask one repeater for its ends while Up and Down
   defer to directional focus. Pressed again at an end they move nothing and are still handled,
   which is `args.Handled(true)` running before the call, and the test asserts both halves.
   **Which ends is a reading, not a press, and the answer above does not contain it.** "Jump to
   the ends" does not say whether End stops at the last row of the list or at the last row
   visible under it, and the two differ whenever the last top-level row is expanded — which the
   hierarchical sample can be made to show. What is built is the pin's answer:
   `GetLastFocusableElement` (`NavigationView.cpp:2876`) walks one repeater's own
   `ItemsSourceView` and never descends, while `FocusNextUpItem` asks
   `FindLastFocusableElement(childRepeater)` (`:2799`) and does. The first implementation took
   the last visible row, and no specimen on the harness could tell the two apart until the last
   top-level row there was given children. **One press answers both halves of this**: End
   from a menu row lands on the last top-level row, on the last row visible under the menu, or
   on the settings row, and the three are mutually exclusive.
4. **There is no typeahead.** Typing a letter does not move focus.
   **We** have none either. This one matches, and it is one of the places where the registry
   said otherwise.
5. **Left does not expand a collapsed row, and Right does not descend into an expanded one.**
   **Whether Left collapses an expanded row was not pressed** — half of this question is still
   open.
   **We** do nothing on any of the three. Matches as far as the two answers reach.
   By-catch, not from the list. Pressed: holding keyboard focus on a parent of the hierarchical
   sample for a moment raises its tooltip, and the Gallery's own shell pane, pressed in the
   follow-up sitting, raises none. Deduced from those two presses and two readings: **the
   tooltip belongs to the sample rather than to the control.** The readings are that the
   sample sets `ToolTipService.ToolTip` on every item (`NavigationViewPage.xaml:376-410`) while
   the shell sets none, and that a custom tooltip is never replaced —
   `UpdateNavigationViewItemToolTip` substitutes the suggested one only under
   `if (!toolTipContent || toolTipContent == m_suggestedToolTipContent.get())`,
   `NavigationViewItem.cpp:287-288`, commented "no custom tooltip, then use suggested
   tooltip". Without that second reading the two panes would not be separable at all. So the
   two panes differ exactly where their markup differs, which leaves `ShouldEnableToolTip` —
   `IsOnLeftNav() && m_isClosedCompact`, `NavigationViewItem.cpp:743` — standing: an open pane
   shows none of its own. Our reading of that line was already what the component implements,
   and nothing here contradicts it — which is as far as this goes. It is not an observation of
   `ShouldEnableToolTip`: no press can see a line of C++, and this one is consistent with the
   reading rather than a test of it.

   Pressed again on 2026-09-22, **with the pane collapsed to the rail this time**, and it does
   raise one: an arrow key onto a rail row opens that row's own tooltip, after a wait, and the
   popup stands 12px clear of the row's 48x40 bounds. Pressed on the shell's pane and on the
   page's own sample, which agree to the pixel — the two disagree about the arrow keys
   themselves (answer 2) and not about this. The earlier press found none on this
   pane, and the two readings sit together only if that one was taken with the pane open, which
   the note does not say — so the honest account is that the shell pane has now been pressed in
   both states and shows a tooltip in one of them. That makes it the first press to see
   `ShouldEnableToolTip`'s second conjunct at all, which the paragraph above says no press had:
   an open pane shows none, the same pane collapsed shows one.

   **What this press establishes about the tooltip itself is one thing and one measurement**, and
   the `ToolTip` input-mode unit that used them says which is which. The press establishes only
   _that there is a wait_ — a capture taken in the same breath as the key catches no tooltip and
   one taken a second later has it; **800ms is read from the pin**, not measured here
   (`GetInitialShowDelay`, `ToolTipService_Partial.cpp:1788-1838`). The 12 is the measurement,
   taken twice on two rows and once again on the page's own sample; `surface.md` carries 12 as
   `DEFAULT_KEYBOARD_OFFSET`, which is the pin's number for it, and the measurement that agrees
   with it lives in `ToolTip.svelte`'s comment on the offset constants.

6. **The chevron is reachable by pointer only**, and it is not needed: invoking anywhere on the
   row toggles the subtree.
   **We** rendered it as a `<button>`, which put it in the tab order — the extra stops in 1
   above — and only while the pane is open. Measured: walking the closed-compact rail gives
   seven stops, the top-level rows and `Settings`, with no chevron among them. Read, not
   measured: the rule that causes it is the `display: none` on
   `.root[data-collapsed='true'] .pane :global(.item .expand-chevron)` in
   `NavigationView.svelte`, which hides the chevron and the label together.
   **Changed on 2026-09-22**: the chevron carries `tabindex="-1"` and no Tab reaches it, which
   is what the press found of upstream's. It stays a `<button>` for the pointer and for
   assistive technology, so one difference survives and it is not a keyboard one — a click
   focuses ours and cannot focus a `Grid`, so a Space pressed after a click toggles here and
   would invoke whatever held focus there. Nothing has been pressed on that, and it is the web
   doing what the web does rather than something the web cannot do, so it is a punch-list
   question and not a registry entry.
7. **Focus alone does not move the selection.** Enter or Space is required.
   **We** behave the same way. Matches.
8. **Closed-compact opens a flyout for a row with children.** Focus lands on the flyout's first
   item; Up and Down cycle within the flyout and nothing else; Left does not escape it; Escape
   closes it. A parent that has content of its own swaps the content on selection immediately,
   so Escape-and-stay and pick-a-child are both available from there. Everything else answers as
   above.
   **We** had no flyout, and no children either. Measured at the time: invoking a parent in the
   rail set `aria-expanded` and drew nothing — the child rows had no box, no popup appeared —
   and Escape had nothing to close. The rule that caused it was `display: none` on a collapsed
   pane's `.children`, whose own comment already said the children belonged in a flyout.
   **That is built.** A rail row now opens its children in a `Flyout` anchored to it, drawn at
   depth 0 as upstream draws them, and `navigation-view-rail.spec.ts` asserts the flyout, its
   level, that nothing is left under the row, that a parent _inside_ it keeps its own children
   inline, and that a dismissal collapses the row.
   **Three of this paragraph's four clauses are matched and one is not.** Focus lands on the
   flyout's first item; Escape closes it; and Left does not escape it. The first two are
   asserted; the third is read from the code rather than pressed, and holds for a weaker reason
   than the original's — no arrow key in this control does anything, so the observable agrees
   while the mechanism does not. **Up and Down were the clause that failed**:
   every row was its own tab stop and no arrow key moved focus, which was WD-004 for the pane
   and was WD-004 for the flyout too. **Built on 2026-09-22**, and the flyout is a ring of its
   own rather than part of the pane's: its list carries the ring marker, so the arrows inside it
   reach its two rows and stop, and the settings row behind it is not reachable from there.
   **Whether it wraps is the half still owed** — this record's word is "cycle", which reads as a
   wrap, and the only end behaviour measured anywhere in this control is the pane's, which does
   not wrap. Built without one, and the press is owed.
   **And the rail's own entry is reproduced by two mechanisms rather than one.** Upstream's
   redirect (`NavigationView.cpp:2989`) does two things when the flyout is open and a Tab
   arrives at the rail: it takes the entry away from the rail's rows, and it puts focus on the
   flyout's row. `tabStops` supplies the first. The second comes from the primitive instead —
   `Flyout` passes no `trapFocus` and bits-ui defaults it on — and it is **stronger** than
   upstream's: focus cannot leave the flyout at all, where upstream traps nothing and a second
   Tab leaves. Measured, not reasoned: focusing the pane toggle is undone and Tab cycles over
   the flyout's rows. An earlier draft of this paragraph reasoned from document order to "the
   Tab lands on the settings row", which the press refutes in both of its halves. **What is
   owed is the reference's behaviour after the entry press**, which this record never covered. Escape needed a decision of its own to arrive at one press
   — the focused row's tooltip was taking the first — and that is WD-092. One behaviour beyond
   this record was measured while building it and is asserted: a click outside closes the
   flyout.
   What stays unreached from this answer is what it never covered: where focus returns after
   Escape, whether Tab or Home and End do anything inside the flyout, and what a parent that has
   content of its own does on selection.

9. **Not pressed, and not pressable here.** The shape the question needs is an editable field
   _inside_ a `NavigationViewItem`, and the Gallery never builds one. `NavigationViewPage.xaml`
   does carry two `TextBox`es and an `AutoSuggestBox` — `:451` and `:461` are the sample's own
   options panel, the `Header` and `PaneTitle` properties, and `:550` is
   `NavigationView.AutoSuggestBox`, the pane's search slot. All three sit outside every item, and
   the control subscribes to each _item_'s `KeyDown` (`NavigationView.cpp:3595`), so none of them
   routes through the handler the question is about. Across every `.xaml` in the pin, none puts a
   `TextBox` or an `AutoSuggestBox` inside a `ListViewItem`, `GridViewItem`, `Expander`,
   `SettingsCard`, `NavigationViewItem`, `TreeViewItem` or `DataTemplate`; the 22 files that
   carry one at all put it inside a `Grid` or a `StackPanel`, which is what says the search was
   looking rather than failing — 22 is every candidate in the pin, by an element-tree walk of
   all 188 `.xaml` files and by `grep -rl` independently.
   The pin does not answer it either, and the load-bearing part of that search is structural
   rather than a count: **`CTextBoxBase` is named by the pin and never defined in it.** Every
   `class CTextBoxBase` is a forward declaration — `IBackingStore.h:9`, `RichEditGripper.h:9`,
   `RichEditGripperChild.h:11`, `DependencyObjectTraits.g.h:2900` — no `textboxbase.cpp`
   exists, and both uses of `CTextBoxBase::` are comments pointing at code that is absent
   (`PointerInputProcessor.cpp:739`, `InputPaneProcessor.cpp:142`). Around it,
   `TextBox_Partial.cpp:432-436` forwards `OnKeyDown` straight to `RaiseNative`, and
   `core/text/TextBox/` holds three files — `PlainTextPosition.cpp`, `TextBoxHelpers.cpp`,
   `TextSelection.cpp` — in which `VirtualKey`, `KeyEventArgs`, `OnKeyDown` and `VK_` do not
   appear at all. The editing is RichEdit and TSF, which this repository does not carry, and
   that is the pin's own account rather than a convention: `KeyboardInputProcessor.cpp:703-707`
   says a handled `WM_CHAR` is "passed to TextServiceFramework (TSF)" by calling
   "OnCharacterReceived event handler for TextBoxBase" — the class it then declares at `:709`
   and the pin never defines.
   **One count here is not evidence, and is recorded so it is not mistaken for some.**
   `VK_SPACE` occurs in exactly two files pin-wide — `Hyperlink.cpp:418` and
   `KeyboardAccelerator_Partial.cpp:360` — which reads as decisive and is not:
   `VirtualKey_Space` is the spelling most of the C++ uses, and that one is in 33 files.
   **What this does not say** is what WinUI's row would do. It says the reference cannot be asked,
   which is a fact about the instrument and not about the control — the distinction the answer
   would have turned on.
   Three near-misses are worth recording so they are not re-derived. `ComboBox_Partial.cpp:369`
   and `:374` hook their own editable `TextBox`'s `PointerPressed` and `Tapped` with
   `handledEventsToo`, so that field does mark **pointer** events handled; it says nothing
   about keys. The same file's `:124` does ask for already-handled events on the key side —
   but for `CharacterReceived`, on the ComboBox itself, which is a different event from the
   `KeyDown` an item's handler reads, so it narrows the gap without closing it. And `AutoSuggestBox_Partial.cpp:623` takes `VirtualKey_Space`, with
   `:646-649` calling `put_Handled(TRUE)` — a text-entry control marking Space handled, in
   the very control this page puts in the pane at `:550`. It is still not an answer, and the
   pin says why directly above the handler: it "is only for Gamepad or Remote cases" and
   "is never invoked for Keyboard cases since Focus stays on the TextBox" (`:574-576`).
   Reading either of the two as though it settled the keyboard is the move this document
   exists to stop.
   **We** invoked on Space from the row's own `keydown` and called `preventDefault()`
   (`NavigationViewItem.svelte`), which a field inside the row would have felt. That was a
   decision to take on other grounds rather than a measurement to wait for, and it has been
   taken: the row acts on a key only when the key's `target` is the row itself. **That is not
   a reproduction of the routing above and must not be read as one** — what the pin
   establishes is that the row does not see an _already-handled_ key, and the half this entry
   could not get is the half that would say whether the field handles it. Target identity is
   narrower, and it was chosen on a web ground: `defaultPrevented` is the DOM's `Handled` and
   a space typed into a field does not set it, so no faithful test exists and the two
   available behaviours are not equally costly. ADR 0015's deferred item 2 carries the
   argument and `navigation-view-keyboard.spec.ts` asserts the result, on the chevron — the
   one box inside a row that a key could reach when that was written. **That clause is now out
   of date, and the decision's own case is pressed.** `menuItemTemplate` gave a consumer's
   element a place in the content cell, and `navigation-view-template.spec.ts` types a space
   into a field inside a row: the space reaches the field and no invoke is reported, and
   removing the guard fails both halves of that assertion. Nothing above becomes knowable —
   the reference still cannot be asked and what WinUI's row does is still unrecorded — but
   this platform's half is no longer only argued. **This entry is what let that be decided
   at all**, which is the fourth outcome doing the work it was added for: the search says
   what cannot be known, and a unit was sealed with that stated rather than blocked on it.

### What this decided

Behavioural claims of WD-004's that fell, each a reading rather than an observation: that Left
and Right move focus among items, that Left and Right drive expand and collapse, that typing
jumps to a matching label, and that the chevron is reached by the arrow keys. No count is
offered — the old paragraph does not separate into countable claims the same way for two
readers, and a number a reader has to agree with adds nothing the list does not already say.
One more, that Tab leaves the pane into the next focusable element, is neither confirmed nor
refuted here. The expand-and-collapse one falls on its expanding half
— Left does not expand and Right does not descend — while whether Left collapses is still
unpressed, so what replaces it is smaller than the claim but not yet nothing.

What the original asks for, on this record, is Up and Down over a ring that includes the
Settings row, Home and End, Enter and Space to invoke and to toggle, and in closed-compact a
flyout with a ring of its own and an Escape. No typeahead, no focusable chevron, and at most a
collapse on Left rather than a Left/Right state machine. **And Down at the foot scrolls the
page rather than moving within the list**, which an implementation reproduces by declining to
prevent the key's default there rather than by swallowing it to make the ring tidy. That the
ring does not wrap is the conclusion drawn from that press, not a further observation — the
answer reports the scroll and not where focus went — and the top end is not measured at all.

**Question 9 closes without a press, and closing it is not the same as answering it.** What
the reference can be asked is bounded by what the Gallery builds, and it builds no editable
field inside a row. So the row's handling of a key aimed at something inside it is decided
on other grounds — the pin's asymmetry is one of them, and naming the rest belongs to the
unit that makes `NavigationViewItem` public rather than to this record. What this removes is
a gate, not a question: ADR 0015 waited on an observation that cannot be taken.

WD-004's **Why accepted** rested on exactly the difficulty two of the fallen claims supplied.
The entry was corrected in place on the day of the press, and **deleted on 2026-09-22** when the
ring was built. Which outcome it was is the second one below, and it was already named there as
a candidate: a roving tabindex is not something the web cannot do.

## The `TabView` observation

Pressed by hand on the reference guest on 2026-10-01, on the `TabView` page's first sample
(`TabViewPage.xaml:18-25`, its three documents added at `TabViewPage.xaml.cs:38-41` and named at
`:65`): `Document 0` selected, and the add-tab button. Each step was photographed. Our column was
measured on `/dev/tab-view`'s first strip, the Gallery's own, by pressing the same keys. No key
was pressed that closes or adds a tab, so **question 6 was not pressed**: answering it needs more
tabs than fit, and the reference's sample does not have them until one is added.

1. **One press reaches the strip, and it lands on a tab.** From the page's last header button,
   Tab lands on `Document 0`, the next on the add-tab button, the next leaves the sample.
   `Document 0` was both the first tab and the selected one, so that press does not say which
   rule picked it. **Re-entry is the last focused tab, not the selected one**: with
   `Document 1` selected by clicking it and focus then arrowed to `Document 2`, Tab to the add
   button and Shift+Tab back lands on `Document 2`. **We** land on the selected tab both times —
   on re-entry, on `Document 1`.
2. **Right from a tab reaches that tab's close button**, and the next Right the next tab.
   **We** do the same.
3. **The add-tab button is in the arrow order as well as the Tab order.** Right from the last
   tab's close button reaches it. **We** stop on that close button.
4. **The arrows wrap at both ends.** Right from the add button reaches the first tab, and Left
   from the first tab reaches the add button, then the last tab's close button. **We** stop at
   both ends.
5. **No arrow press changed the selection.** **We** do the same.
6. Not pressed; see above.

The pin says the same order in a comment: tab, its close button, the next tab and so on, then the
add-tab button, then back to the first tab (`TabView.cpp:1439`), with the wrap at `:1487-1494`. A
tab's Left and Right reach it through `TabViewItem.cpp:578-597`, the add button's through
`OnAddButtonKeyDown` (`TabView.cpp:1578`). Selection not following focus is
`SingleSelectionFollowsFocus="False"` (`TabView.xaml:56`). The re-entry is `TabNavigation="Once"`
on the tab list (`TabView.xaml:54`), which `ListViewBase` implements as tabbing into the
previously visited item, if any, and otherwise the first selectable item, or the last one going
backward (`ListViewBase_Partial.cpp:1361-1364`). `Document 0` was the first selectable item too,
so the first press fits that rule as well. That is a remembered item rather than a remembered
element, so focus that left from a close button would, on that reading, come back to its tab;
that case was not pressed. A selection change also moves the remembered item, by focusing the
newly selected one (`Selector_Partial.cpp:990`); the only press bearing on it was the click on
`Document 1`, which focused the tab as well, so that was not separated either.

### What this decided

The three differences are all the second outcome below: the original's model is reachable on
the web, so each is a defect for the release's punch list rather than a divergence to record.

## What an observation decides

Four outcomes, and each has a different destination. The fourth was added on 2026-09-21,
by the first question that produced it:

- **The original does X and we do X.** Nothing to record except that it was checked — which is
  the change this document actually asks for, below.
- **The original does X, we do Y, and Y is reachable.** A defect. It goes to the punch list, not
  to the divergence registry. A divergence is for what the web cannot do; a roving tabindex is
  not that.
- **The original does X and the web cannot do X.** A `WD-` entry — and now one whose "WinUI
  does" line is a report of an observation rather than a reading, with the date and the machine
  in it.
- **The reference cannot be asked.** The shape the question needs does not exist in the
  Gallery, and the pin does not carry the code that would answer it instead. It goes into the
  record as a search rather than a press, with what was searched written down, and the
  decision it was gating moves to other grounds. Entry 9 above is the first of these.

**WD-004 was a candidate for the second outcome, and that is what it turned out to be.** Its
own reasoning said the loop "is not hard" and that what is hard is the contract being right
without a test — which is an argument for building the test, and the list above was most of it.
Built on 2026-09-22: `moveRingFocus` in `internal/navigation-view.ts`, the pane's `tabStops`
in `NavigationView.svelte`, and `navigation-view-ring.spec.ts` over a harness with one frame
per branch of the rule.

Fourteen mutations were run against that spec's fifteen tests and each killed at least one, re-measured against the spec as it stands rather than as it stood when the mutation
was first written. Listed by the edit rather than by a description of it, because two rows of
an earlier version of this table named an edit loosely enough to read two ways and the counts
then matched the other reading:

| the edit                                                            | tests killed |
| ------------------------------------------------------------------- | ------------ |
| the flyout's list loses the ring marker                             | 1            |
| the pane loses the ring marker                                      | 5            |
| Home and End read the ring marker instead of `role="tree"`          | 1            |
| End takes the last row visible under the list, not the list's own   | 1            |
| the arrows `preventDefault` whether or not focus moved              | 1            |
| Space is handled with Alt down                                      | 1            |
| the walk ignores expansion, so the stop is the path's deepest row   | 2            |
| the stop is the list's first row                                    | 3            |
| the stop is the path's top-level row and never deeper               | 2            |
| the walk stops at the top level while the pane is collapsed         | 1            |
| an id naming no row is answered the way the settings row is         | 1            |
| the list's first row is `items[0]` rather than its first non-header | 1            |
| the visibility filter is removed                                    | 1            |
| the chevron is a tab stop again                                     | 3            |

**And the ring shipped with a defect none of that could see.** It stopped at the first row,
because the head had never been pressed and this document said so; a user driving the rail
found it the same day. Every mutation above is an edit to code that already agreed with the
ring as specified, and the specification was what was short — which is the limit of the whole
method stated as plainly as it can be: **a suite measures a build against its specification,
and no amount of it reaches a specification with a hole in it.** The press is what reached
this one, and the hole was marked on the page: this document had already written "the ring's
top end is not measured at all" and the unit sealed anyway.

**What the table does not show is where the defects came from, and it is not from here.**
Three were found by a cold read of the diff — End's scope, the split in the `!path` branch, and
a claim about where Tab lands with the rail's flyout open — and each was a case of the comment
stating upstream's rule correctly while the code beside it did something else. **Mutation
cannot find that**, because it measures the tests against the code as written: mutating code
that is already wrong produces code that is differently wrong, and a test that agreed with the
first agrees with neither or with both for reasons that say nothing. Each of those three became
a row above only _after_ the reading produced the specimen that separates the two rules; two of
them needed a change to the harness before any test could disagree at all.

What no mutation could land on is recorded with them: the `settingsVisible` test in `tabStops`
is belt-and-braces, because an id naming no rendered row changes nothing.

## The one procedural change

`surface.md` earned its place by turning "read the code-behind before sealing" into four steps
that cost minutes. The same move, for the same reason:

> **A control whose surface includes a keyboard contract is not sealed until that contract has
> been pressed on Windows 11, and the unit says what was pressed.**

One exception, and it is narrow enough to state in a sentence: where the reference cannot be
made to show the behaviour at all, the unit says **that**, with the search behind it, and
seals. A rule that admits no such case is a rule that blocks a unit on a press nobody can
take, which is worse than the drift it was written against.

Not a gate — a gate cannot press a key. A line in the unit, the way a baseline set is a line in
the unit. And for a `WD-` entry about behaviour, a required sentence naming the machine and the
date, so that the registry stops reading the same whether the machine was consulted or not.

Controls already sealed are not re-swept wholesale. The two in dispute are swept when a decision
waits on them; the rest are swept when something asks.

ADR 0015 is the first decision to cite this rule: it makes `NavigationViewItem` a public
component, which publishes the keyboard contract WD-004 described, so the observation above
comes before that control is sealed. That is the eight presses of 2026-09-21, and the ninth
entry, which is the exception above rather than a press still owed.
