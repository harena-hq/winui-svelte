# The library gate — run 2026-10-04

`docs/plan.md`'s release bar, run once over the release: every component `index.ts` exports
named against the evidence that sealed it, and every one whose only evidence was a dev route
re-photographed against the original on the reference guest. ADR 0017 fixed the set at
eighteen, and its amendment of 2026-10-28 at twenty; both leave to this gate the question of
whether what a member still owes blocks the release.

## How it was run

- **The evidence.** For each component, every commit that built or fixed it, read for whether
  its `Reviewed:` trailer cites a comparison against the original or only gates, mutants and
  agents; the specs and baselines that photograph it; and what it owes — its entries in
  `docs/divergences.md`, the unstruck rows naming it in `docs/plan.md`'s owed tables, and the
  questions `docs/keyboard.md` lists for it without an observation. "Owed tables" includes the
  tables of what a version would not build, where a row names a member and is still true.
- **Which reference.** The guest runs WinUI 3 Gallery 2.9.3.0. Of the seventeen sample pages
  the eighteen have, sixteen are unchanged between that release's tag and the pin; TitleBar's
  differs by WinUI-Gallery `9a14fa5`, whose effect on the shell's search box is recorded in
  `apps/gallery/src/routes/(shell)/+layout.svelte`.
- **Re-photographed.** Thirteen components have no Gallery page in this repository, only a
  dev route: Button, ComboBox, ContentDialog, Expander, HyperlinkButton, InfoBar, ProgressBar,
  ProgressRing, TabView, TeachingTip, TextBox, ToggleSwitch and ToolTip. Each was captured on
  the reference's own Gallery page and on its dev route in the guest's Edge at the same width,
  in light, and compared by measurement: box edges, insets, fill and stroke values, ink extents.
  The other five are drawn by Gallery pages the suite already photographs — NavigationView and
  NavigationViewItem are the shell on every page, and ScrollView, ScrollViewer and TitleBar have
  pages of their own.

## What it found, and what was done

Two defects, both missed by the unit that built the control — one a raster its measurement of
the layout could not see, one a state it never compared:

- **ProgressBar's track sat on a half pixel** — two rows of grey at half strength where the
  reference draws one whole row on the middle of the indicator's three. `9140949` had measured
  the track's box as centred, which it was; the paint was not. Fixed in `83b8bff`.
- **ToggleSwitch's on knob drew a stroke** upstream binds and never gives a thickness: eight
  solid columns across the knob's middle row where the reference has ten. The unit that built
  it compared the off state. Fixed in `2523d0e`.

The battery for the first of those failed one test that was neither: a snapshot of the
editable ComboBox that `f24dad9` had read as a state captured too early. It was the masked
ring's corners rastering differently from run to run, one counted pixel each time, and `b32cc26`
gives that picture a budget sized between the noise and a planted defect.

Three smaller defects, measured and not fixed here; they are this record's to carry until the
session that drives the Gallery takes them, and the owes column names them:

- Expander's chevron is drawn at another sub-pixel phase — nine columns by five against eight
  by four — and the collapsed header is 228 wide against 229.
- TeachingTip's card border reads 196 against the reference's 188, and its shadow one pixel
  out to the side 228 against 237.
- ToggleSwitch's pressed knob is an ellipse where upstream's `CornerRadius="7"` on 17x14 makes a
  stadium. Found in review, not photographed.

## The eighteen

"Against the original" names the commits whose review cites a comparison with the original
app; the rest of a component's history was reviewed by gates, mutants and agents.

| component          | against the original                            | re-photographed 2026-10-04                    | owes                                                                                      |
| ------------------ | ----------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Button             | none of its own (see below)                     | passes: fill, height, insets                  | —                                                                                         |
| ComboBox           | `65d0719`, `76ede81`                            | passes: height, insets, chevron               | WD-097, WD-098; v4 row: touch and game-controller padding                                 |
| ContentDialog      | `9608de0`, `ddf52df`, `b17cd85`                 | passes: 320 x 221                             | WD-014, WD-015                                                                            |
| Expander           | `34f4ceb`                                       | passes, but for the chevron's phase           | WD-006, WD-010, WD-011; its Gallery page; the chevron                                     |
| HyperlinkButton    | none of its own (see below)                     | passes: ink, colour, hover                    | —                                                                                         |
| InfoBar            | `2ae9dbe`                                       | passes: height, icon and title offsets        | —                                                                                         |
| NavigationView     | `53c6c80`, `a846afa`, `2b585b0`                 | the shell, photographed on every Gallery page | WD-006, -025, -089, -091, -101; four rows; six more                                       |
| NavigationViewItem | through NavigationView's                        | the shell                                     | WD-090                                                                                    |
| ProgressBar        | `9140949`                                       | failed; fixed in `83b8bff`                    | —                                                                                         |
| ProgressRing       | `ee2f763`                                       | passes: box and stroke at 60px                | —                                                                                         |
| ScrollView         | `99c02d8`                                       | its Gallery page                              | WD-036; two layout rows                                                                   |
| ScrollViewer       | `99c02d8`, perhaps (see below)                  | its Gallery page                              | WD-036, through ScrollView                                                                |
| TabView            | `45dd13c`, `7790165`                            | passes, by eye on enlarged crops              | WD-023, tear-out included; v8 row: `CanReorderTabs`, the rest of unit 5's table; two more |
| TeachingTip        | `adec259`, `1bf4e92`, `ce28cb8`                 | passes: 224 x 64, but for border and shadow   | WD-017; v7 row: `icon`; border and shadow                                                 |
| TextBox            | `9ecf440`, `2b585b0`, `80c7176`, `351987f`      | passes: header gap, height, placeholder       | WD-100 (multi-line)                                                                       |
| TitleBar           | `fb980a5`                                       | its Gallery page and the shell                | WD-006, WD-007, WD-099                                                                    |
| ToggleSwitch       | `62f011d` (the off state), `69efa8c` (the drag) | failed on the on knob; fixed in `2523d0e`     | WD-096; the pressed knob's shape                                                          |
| ToolTip            | `70b0c29`                                       | passes: height, inset, baseline               | WD-094, WD-095, WD-107; `PlacementRect`, `VerticalOffset`                                 |

NavigationView's four rows: `FooterMenuItems`, the pane's custom content, header, title and
search slot, and `OverflowLabelMode`, in v8's table of what that version left owed; and v7's
`icon` row, which it shares with TeachingTip — both take a `glyph` only. `docs/keyboard.md`
records at least six of its pane questions, or halves of them, as not pressed — where the
fourth Tab press goes, the minimal pane's Left and Right, whether Left collapses, Space after a
press on a chevron, whether the flyout's ring wraps, and question 9 — and the ring's top end as
not measured.

Added 2026-10-13, after the run: NavigationView's Gallery page uses six things no row names, and
the library has none of them. Four are the control's members: `SelectionFollowsFocus` (its
fourth and eighth examples), `AlwaysShowHeader`, and the threshold widths
`ExpandedModeThresholdWidth` and `CompactModeThresholdWidth`, which the control holds at 1008
and 641. One is the item's: `SelectsOnInvoked`, one of the nine members
`NavigationViewItem.svelte`'s module comment lists as not carried, which the page reproduces by
leaving the selection alone when an item that sets it False is invoked, the selection being the
consumer's. And one is the attached `ToolTipService.ToolTip` on a row, where the control gives a
row on the closed rail its content as a tooltip and nothing else. The page draws each example
without them and names this paragraph where it does. It also puts two NavigationViewItems in a
`PaneFooter`, which the library's item cannot stand in: there it would claim a top-level tree
row's role and place outside the control's tree, and it takes no name of its own, so the page
draws the two as their icons.

Added 2026-10-14, after the run: TabView's Gallery page uses two things no row names, and the
library has neither. One is a tab's `ContextFlyout`: every tab on the page but the third example's,
whose template sets none, opens the page's `MenuFlyout`, which the Gallery fills with "Move tab
left", "Move tab right" or both as the tab's place allows, and hides when it holds neither
(`TabViewHelper.cs:61-101`, `TabViewPage.xaml.cs:275-284`), moving the tab in its collection; the
library's `TabViewItemData` takes no flyout. Since 2026-10-28 TabView reports a tab's context
request through `onTabContextRequested`, with the pointer's point in the tab or none from the
keyboard, and MenuFlyout opens at a `position` in its `anchor`, so the page draws the menu with one
MenuFlyout, as upstream does; until then it drew the tabs without one. The other is
`KeyboardAccelerators` on the TabView, a member every UIElement has and no component here carries;
the page reproduces its eleven accelerators on the window, where an accelerator on a visible element
is invoked whatever has the focus, as pressing Control+T on the reference with another example's tab
focused showed, and a browser keeps two of them, Control+T and Control+W (`WD-102`). The page names
this paragraph where it draws the accelerators. Tear-out, which this row listed as v8's, is
`WD-023`'s, settled by the same page.

Added 2026-10-13, after the run: ToolTip's Gallery page found the two members ToolTip's cell
names, and the pin explains what the guest shows of both. A tooltip's popup is windowed where
the platform supports it (`ToolTip_Partial.cpp:147-153`, `:739-748`), despite the stale note at
`:1146`; the guest's measurements are what the windowed path produces and the other does not.
Any placement but `Mouse` takes the windowed directional path (`:1433-1458`), which for a mouse
docks to the pointer before anything else (`:1667-1683`). A pointer inside a non-empty
`PlacementRect` is first moved to the rectangle's edge on the placement's side (`:1791-1820`),
so the page's third tooltip, `Placement="Right"`, keeps the pointer's height. The dock point is
then inflated by the two offsets (`:1768`), each 20 for a mouse when it is not set
(`:1712-1751`, `ToolTip_Partial.h:11`): the 20 the third tooltip stands clear of the rectangle.
The second sets `VerticalOffset` to -80, which inflates the point by -80 and turns it inside
out, so a tooltip above it ends 80 below the pointer; with the one-line tooltip's 32 that
`ToolTip.svelte` measured, its top is 48 below, which the guest shows at two pointer heights
(503 and 510 for 455 and 462). Neither is built here. `PlacementRect` is absent, and this
library's one `offset` at -80 put the popup's top at the pointer, measured.

`deaaf2d` compared one thing with the original, an AppBarButton row in a CommandBar's
overflow, and swept every other control's focus visual against its own; it is credited to no
member here. That leaves Button and HyperlinkButton with no comparison of their own before
this gate, and this gate's is now theirs.

`99c02d8` built the ScrollView and ScrollViewer pages together and compared "the first
example's box" crop against crop with the original's; both pages open with a zoomable image,
and the message does not say which page that was. ScrollViewer's own Gallery page is in the
suite either way, which is what the gate's sentence asks.

## The two added on 2026-10-28

D58 adds `Flyout` and `MenuFlyout`, after the run. Neither has a Gallery page in this
repository, only a dev route, so each was re-photographed as the run's thirteen were: the
reference's own Gallery page and the dev route in the guest's Edge, both 1600 wide, in light,
compared by box edges, insets and ink. Both pages, their samples' directories whole, are
unchanged between Gallery 2.9.3.0's tag and the pin.

- **Flyout**, its page's one example: the card is 366 by 97 on both, 4 above its trigger and
  centred on it; the message's ink starts 21 below the card's top edge, and the button inside
  sits 17 in from the left edge and 47 down, 32 tall, on both. That button is 139 wide against
  140, its label's advance a pixel short.
- **MenuFlyout**, two of its page's seven examples: the toggle example's card is 103 by 105 on
  both, its separator 36 below the top edge, and its three rows' ink in the same boxes to a
  column; the cascading example's card is 116 by 70 on both, and its submenu opens 111 right of
  and 35 below the card's corner, 102 tall, on both, and 167 wide against 168, its chevron a
  column left.

Neither width is fixed here; like the three above, they are this record's to carry. Both
members also keep bits-ui's light dismiss, which only a primary press performs: a right press
outside an open `Flyout`, measured in Chromium, leaves it open, where upstream's light dismiss
takes any button (`CPopupRoot::OnPointerPressed`). `MenuFlyout` opened without a trigger closes
on one since `aa0f33d`; opened from its trigger, it does not.

| component  | against the original                                                                   | re-photographed 2026-10-28               | owes                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Flyout     | `67a546b`, `ce28cb8`                                                                   | passes: 366 x 97, gap, insets            | its Gallery page; the button's width; the right press                                                                       |
| MenuFlyout | `f463031`, `117aecd`, `edf2deb` (driven on the guest), `df99a73`, `c1080a5`, `aa0f33d` | passes: 103 x 105, 116 x 70, the submenu | WD-002, WD-013; its Gallery page; the submenu's width; the right press, from a trigger; the LOWs of `12b04b9` and `aa0f33d` |

## Whether what they owe blocks the release

It does not, and the reasons differ by kind.

- **The divergences** are accepted ones, each with what it is worth written down and what
  would reopen it. None of them is a defect waiting on a fix.
- **The two defects this gate found** were fixed rather than carried.
- **The three it carries** are small and local: a glyph's sub-pixel phase that moves a header
  one pixel, a border eight levels light and a shadow nine levels dark beside it, and the
  corners of a knob that is pressed for as long as a press lasts. A consumer sees the control
  the original draws; a side-by-side at a magnification finds them, which is how two of them
  were found.
- **The owed rows** are surface not yet built: a consumer reaching for `FooterMenuItems` or an
  `icon` finds it absent and nothing drawn wrong. D46, as ADR 0017 amends it, chose the release
  by what a consumer's source would replace rather than by completeness, and the gate holds
  that a member may ship with surface still to build, because building it later breaks nothing
  a consumer already wrote.
- **What the two added on 2026-10-28 carry** is of the same kinds: two widths a pixel short,
  one of them from a label's advance; and a light dismiss that a primary press outside
  performs and a right press does not, except on the menu opened without a trigger. Such a
  press leaves the popup open. Over a menu it lands on the root, since the page's body takes no
  pointer events while a menu is open, and the browser draws its own menu there; a Flyout locks
  nothing, so the press reaches what lies under it. That is behaviour owed rather than
  accepted, and it has no divergence entry; the table names it. It does not block the release
  for the reason the owed rows do not: nothing a consumer writes against it breaks when it is
  fixed.
- **The unpressed keyboard questions** are recorded as unpressed, and the answers the library
  gives are the ones its own tests hold it to.

**The gate passes.** Cutting the release — a version, a tag, a publish — is the owner's to do,
and nothing here did it.

## What the evidence itself owed

Read along the way rather than swept for, and recorded rather than rewritten, because a sealed
message is history. The history was rewritten once since, on 2026-10-05 before publication, and
the two items it could settle are marked:

- **No `Reviewed:` trailer at all:** `61767d8`, and seven NavigationView commits of 2026-09-19
  and -20 — `2463380`, `a1e5cbc`, `37424f9`, `154d028`, `117a7b2`, `d978d5e`, `4ea6cf5`.
- **A battery count never filled in** ("guest battery NNN passed"): `9230f3d`, `7b7eaec`,
  `70e9cc4`, and a fourth. _Settled by the 2026-10-05 rewrite_: the count is not known, and each
  now says it was not recorded.
- **A trailer cut off mid-sentence:** `16cef0a`, `1549641`. And two, `7a74bfd` and `cdea038`,
  whose `Reviewed:` line git did not parse as a trailer. _Settled by the 2026-10-05 rewrite_, with
  three more of the same shape: a blank line now separates the prose from the trailer block, and
  none is left inside it.
- **Two owed rows that were done:** the Slider row of v4's not-yet-built table, all three of
  whose items are built, and the ComboBox chevron row of v14's owed table, settled on
  2026-09-25. Both are struck through in `docs/plan.md` by the commit that adds this record.
