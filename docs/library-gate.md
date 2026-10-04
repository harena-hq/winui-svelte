# The library gate — run 2026-10-04

`docs/plan.md`'s release bar, run once over the release: every component `index.ts` exports
named against the evidence that sealed it, and every one whose only evidence was a dev route
re-photographed against the original on the reference guest. ADR 0017 fixes the set at eighteen
and leaves to this gate the question of whether what a member still owes blocks the release.

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
  reference draws one whole row on the middle of the indicator's three. `96c58d9` had measured
  the track's box as centred, which it was; the paint was not. Fixed in `c5de3f0`.
- **ToggleSwitch's on knob drew a stroke** upstream binds and never gives a thickness: eight
  solid columns across the knob's middle row where the reference has ten. The unit that built
  it compared the off state. Fixed in `cde77c4`.

The battery for the first of those failed one test that was neither: a snapshot of the
editable ComboBox that `ddab793` had read as a state captured too early. It was the masked
ring's corners rastering differently from run to run, one counted pixel each time, and `7b5dd9e`
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

| component          | against the original                            | re-photographed 2026-10-04                    | owes                                                                   |
| ------------------ | ----------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| Button             | none of its own (see below)                     | passes: fill, height, insets                  | —                                                                      |
| ComboBox           | `0339b3b`, `765d594`                            | passes: height, insets, chevron               | WD-097, WD-098; v4 row: touch and game-controller padding              |
| ContentDialog      | `b5ae995`, `8c9c750`, `4e771d9`                 | passes: 320 x 221                             | WD-014, WD-015                                                         |
| Expander           | `ee8639c`                                       | passes, but for the chevron's phase           | WD-006, WD-010, WD-011; its Gallery page; the chevron                  |
| HyperlinkButton    | none of its own (see below)                     | passes: ink, colour, hover                    | —                                                                      |
| InfoBar            | `790555f`                                       | passes: height, icon and title offsets        | —                                                                      |
| NavigationView     | `091953d`, `f7690c9`, `28c33f2`                 | the shell, photographed on every Gallery page | WD-006, -025, -089, -091, -092, -101; four rows                        |
| NavigationViewItem | through NavigationView's                        | the shell                                     | WD-090, WD-092                                                         |
| ProgressBar        | `96c58d9`                                       | failed; fixed in `c5de3f0`                    | —                                                                      |
| ProgressRing       | `da3f383`                                       | passes: box and stroke at 60px                | —                                                                      |
| ScrollView         | `0b08aa0`                                       | its Gallery page                              | WD-036; two layout rows                                                |
| ScrollViewer       | `0b08aa0`, perhaps (see below)                  | its Gallery page                              | WD-036, through ScrollView                                             |
| TabView            | `0b489d2`, `e7361d3`                            | passes, by eye on enlarged crops              | WD-023; v8 row: tear-out, `CanReorderTabs`, the rest of unit 5's table |
| TeachingTip        | `b5f4d7c`, `b8eca4e`, `c20c85f`                 | passes: 224 x 64, but for border and shadow   | WD-017; v7 row: `icon`; border and shadow                              |
| TextBox            | `474b44a`, `28c33f2`, `bdb9cd8`, `5be0258`      | passes: header gap, height, placeholder       | WD-100 (multi-line)                                                    |
| TitleBar           | `dd04e14`                                       | its Gallery page and the shell                | WD-006, WD-007, WD-099                                                 |
| ToggleSwitch       | `3e863ea` (the off state), `4f97adf` (the drag) | failed on the on knob; fixed in `cde77c4`     | WD-096; the pressed knob's shape                                       |
| ToolTip            | `d793f08`                                       | passes: height, inset, baseline               | WD-094, WD-095                                                         |

NavigationView's four rows: `FooterMenuItems`, the pane's custom content, header, title and
search slot, and `OverflowLabelMode`, in v8's table of what that version left owed; and v7's
`icon` row, which it shares with TeachingTip — both take a `glyph` only. `docs/keyboard.md`
records at least six of its pane questions, or halves of them, as not pressed — where the
fourth Tab press goes, the minimal pane's Left and Right, whether Left collapses, Space after a
press on a chevron, whether the flyout's ring wraps, and question 9 — and the ring's top end as
not measured.

`3ec307d` compared one thing with the original, an AppBarButton row in a CommandBar's
overflow, and swept every other control's focus visual against its own; it is credited to no
member here. That leaves Button and HyperlinkButton with no comparison of their own before
this gate, and this gate's is now theirs.

`0b08aa0` built the ScrollView and ScrollViewer pages together and compared "the first
example's box" crop against crop with the original's; both pages open with a zoomable image,
and the message does not say which page that was. ScrollViewer's own Gallery page is in the
suite either way, which is what the gate's sentence asks.

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
- **The unpressed keyboard questions** are recorded as unpressed, and the answers the library
  gives are the ones its own tests hold it to.

**The gate passes.** Cutting the release — a version, a tag, a publish — is the owner's to do,
and nothing here did it.

## What the evidence itself owed

Read along the way rather than swept for, and recorded rather than rewritten, because a sealed
message is history:

- **No `Reviewed:` trailer at all:** `702b4cb`, and seven NavigationView commits of 2026-09-19
  and -20 — `6c3f184`, `1af479c`, `765bfad`, `4eea44c`, `8c53057`, `7d9f91c`, `73b4496`.
- **A battery count never filled in** ("guest battery NNN passed"): `9d952a2`, `daa5554`,
  `715c0f0`.
- **A trailer cut off mid-sentence:** `b9ca71c`, `bbaff58`. And two, `8a8838b` and `034ca5c`,
  whose `Reviewed:` line git does not parse as a trailer.
- **Two owed rows that were done:** the Slider row of v4's not-yet-built table, all three of
  whose items are built, and the ComboBox chevron row of v14's owed table, settled on
  2026-09-25. Both are struck through in `docs/plan.md` by the commit that adds this record.
