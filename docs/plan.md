# winui-svelte — plan

The living plan. Roadmap, locked decisions, and the current version spec. Updated as
decisions land; superseded rationale is moved to an ADR rather than deleted.

Method: `engineering:principles`. One goal per version. Nothing is sealed without its
Done-when, its conformance gates, and an independent review.

## Goal

Reimplement the WinUI 3 control set as a Svelte 5 component library, and reproduce the
**WinUI 3 Gallery** app on top of it closely enough that a side-by-side comparison against
the real app on Windows 11 reads as the same application.

**Visual fidelity is the bar; behavioural fidelity is not.** Where a primitive's interaction
model disagrees with WinUI, the divergence is recorded and accepted rather than forced. See
`divergences.md`.

## Shape

```
packages/winui-svelte/   the library — Svelte scoped CSS + CSS custom properties only
apps/gallery/            the Gallery reproduction — the acceptance harness
docs/                    this plan, ADRs, the divergence registry
```

pnpm workspace. The library is publishable and imposes no build tooling on its consumers.

## Locked decisions

| #   | Decision                                                                                         | Where                             |
| --- | ------------------------------------------------------------------------------------------------ | --------------------------------- |
| D1  | Library + Gallery showcase, split as above                                                       | this file                         |
| D2  | Token values are extracted from `microsoft-ui-xaml` (MIT), not from Fluent 2 web packages        | ADR 0001                          |
| D3  | Styling is Svelte scoped CSS over a CSS custom-property token cascade. No Tailwind, no CSS-in-JS | ADR 0002                          |
| D4  | Fonts and icons are referenced by name from the local system, never embedded                     | ADR 0003                          |
| D5  | Visual truth is a human side-by-side against Windows 11; automation gates regression only        | this file, "Verification"         |
| D6  | Snapshots run on a local Windows VM runner, not on the Linux host                                | this file, "Verification"         |
| D7  | Out-of-scope Gallery groups keep their pages, implemented where the web allows                   | this file, "Roadmap → v4"         |
| D8  | Accent is six tokens with a baked default, plus an optional derivation from one base             | this file, "Accent"               |
| D9  | bits-ui as the primitive base; individual Zag machines for TreeView, ColorPicker, NumberBox      | ADR 0004                          |
| D10 | High contrast is generated as aliases onto eight system colors, not as a third palette           | ADR 0005                          |
| D11 | A token is named `--winui-` plus the WinUI resource key, unchanged                               | ADR 0006                          |
| D12 | The token layer is a curated closure of four base files plus what the Design pages name          | this file, "Roadmap → v1"         |
| D13 | Gallery page structure and page data are read from the pinned `WinUI-Gallery` source             | ADR 0007                          |
| D14 | A composed WinUI `Style` ships as a CSS class, not as a custom property                          | this file, "Roadmap → v1"         |
| D15 | A control tranche seeds the token selection by key, never by dictionary file                     | this file, "Roadmap → v2"         |
| D16 | The window backdrop paints Mica's solid counterpart; the material is not approximated            | this file, "Roadmap → v2"; WD-003 |
| D17 | A legacy `SystemControl*Brush` resolves through a table to a system colour, and is never emitted | ADR 0008                          |
| D18 | Every menu entry is a route; the path is derived from the record, never hand-written             | this file, "Roadmap → v2"         |
| D19 | The shell is the Gallery's layout, and the selected navigation item is the URL                   | this file, "Roadmap → v2"         |
| D20 | The title bar's search box is the Gallery's own, not a half-built published control              | this file, "Roadmap → v2"         |

## Verification

Two different questions, answered by two different mechanisms. Conflating them is how a
project ends up with a green suite and a wrong-looking app.

- **"Does it still look like it did yesterday?"** — automated. Playwright screenshots of the
  Gallery, committed as baselines, run in CI. This catches regression and nothing else.
- **"Does it look like the real thing?"** — human. A side-by-side against the WinUI 3 Gallery
  running on Windows 11, per version, before that version is sealed. Reference captures live
  in `.private/`, never tracked.

The development machine is Linux and does not have Segoe UI Variable, so a screenshot taken
here does not show what a Windows user sees. **The browser therefore runs on a local Windows
VM**, driven from here over the Chrome DevTools Protocol: Playwright stays on this host and
the guest gets nothing installed, which keeps it the stock machine that makes it worth
measuring on. `WINUI_CDP_ENDPOINT` selects that arrangement.

Baseline directories are named for the browser's environment, not the runner's — with the
browser on Windows and the runner here, a platform-keyed path would file Windows pixels
under `linux/`. Only the Windows set is tracked.

That is also what makes the accent derivation below testable at all.

Installing the fonts on a Linux runner is not an alternative: that is the redistribution
ADR 0003 exists to avoid.

## Accent

WinUI computes `SystemAccentColorLight1..3` and `Dark1..3` from the user's Windows accent at
OS runtime, by an algorithm that is not published. Two layers, so that no later decision has
to be reversed:

- **The surface** — six custom properties, `--winui-accent-light-1..3` and
  `--winui-accent-dark-1..3`. Microsoft's default blue ramp is baked in as their default, so
  the Gallery matches the original with no configuration.
- **A filler** — `deriveAccentPalette(base)` computes the six steps from a single base color
  for consumers who want their own accent.

A consumer picks any of three: the defaults, six explicit values, or one base plus the
derivation. The derivation can be wrong without breaking anyone, because it only ever writes
into the surface.

The derivation is reconstructed from community reverse-engineering, so its correctness has no
authoritative reference — but it does have an observable one: change the accent color on the
Windows VM and compare the six steps WinUI produces against ours. That check is the reason
this is worth building rather than hard-coding.

## Roadmap

Each version has one goal. The next does not start until the current one is met.

### v0 — the repository builds and gates

Goal: **a green pipeline with nothing in it.**

Workspace, both packages, TypeScript strict, lint, format, and the Playwright harness. The
Gallery renders an empty page. Conformance gates C1–C6 exist, and each either passes or
reports itself pending, naming the version that makes it live.

Done-when: `pnpm verify` — build, typecheck, lint, the six gates, the harness — is green from
a clean clone.

The gates come first because a gate added after feature work has to be retrofitted against
code that already violates it.

**No hosted CI.** D6 puts the snapshot runner on a local Windows VM, and there is no remote to
run a workflow against. `pnpm verify` is the gate and it runs wherever the work happens.

**Sequencing note.** The harness runs on the Linux host, but its baselines are untracked there
— only the Windows set is committed, because only there does Segoe UI Variable resolve. Taking
the tracked baselines is the last piece of v0, once the VM's access and start procedure are
known. The rest of v0 does not wait on it.

### v1 — the token layer

Goal: **every WinUI theme resource we need exists as a CSS custom property, in all three
themes, generated rather than hand-written.**

- Extract from `microsoft-ui-xaml` **`main`**, from all 85 `*_themeresources.xaml` under
  `controls/dev/**` — not `CommonStyles/` alone, which holds the base palette but none of the
  per-control derivations. Skip the parallel `*_perf2026.xaml` set: it rewrites visual-state
  mechanics and changes no token. Seven of the 85 carry no theme dictionary at all, the type
  ramp among them — theme-independent resources are emitted once, not triplicated. The WinUI 2
  / WinUI 3 branch question is settled in ADR 0001: no value differs, WinUI 3 adds four colors.
- Colors (light / dark / high contrast), the type ramp, corner radii, the elevation-border
  gradient, motion durations and easings.
- **The type ramp ships as classes, in a file of its own.** A WinUI `Style` bundles a font
  family, size, weight and line height under one name, and its CSS analogue is a class rather
  than a custom property: naming the parts would mean minting `--winui-…StyleFontSize`, which
  names no WinUI resource and costs the token layer the property that makes it auditable —
  every `--winui-X` corresponds to an X in the source. ADR 0006. The one-property alternative,
  a `font` shorthand, was measured and rejected: at roughly 130 characters Prettier wraps it
  by a rule the generator does not implement, and a generator that emits what the formatter
  would rewrite puts `pnpm format` and gate C2 into a fight C2 loses every time.

  Half of each step is read from the XAML and half is not, and the split is worth stating.
  `FontSize` and `FontWeight` come from the `Style`'s own setters, resolved through `BasedOn`.
  Family and line height are in no dictionary — the source says `XamlAutoFontFamily` and sets
  no line height at all — so they come from ADR 0003, and the generator fails if that table
  and the source ever stop naming the same ten styles.

- High contrast is not a third set of values. It is a remapping onto eight system colors, and
  the palette colors the source carries for it are deliberate `#FF0000` tripwires — ADR 0005.
- A generator turns the extracted source into CSS; a parity test fails if the committed CSS
  and the generator's output disagree.
- **Scope is a closure, not the whole extraction.** v1 emits the keys defined in four base
  files — the palette, the small common dictionary, corner radii and the type ramp — plus what
  they transitively reference, **plus every key the acceptance surface names.** Measured: 236
  keys from the four files, closing over exactly 14 names the OS supplies; the Design pages add
  three more from outside them. Per-control tokens otherwise land with their control tranche,
  because emitting all 3074 keys would drag in Acrylic and Reveal, which v1 cannot express and
  must not fake.

  The second clause is the half that keeps the acceptance surface honest. A key the Design
  pages display is either emitted or listed in the generator's exclusions with a reason, and
  the generator fails on any third case — so a page cannot come to show a blank swatch because
  a token silently fell outside a file boundary drawn for an unrelated reason.

#### The acceptance surface

The Gallery's **Design** group: Color, Geometry, Iconography, Spacing, Typography — that
order, which is the order `ControlInfoData.json` lists them in. They render tokens with
almost no control chrome, which is what makes them the cheapest thing to compare against the
original.

"Almost no chrome" was an estimate, and measuring it against the Gallery source
(`microsoft/WinUI-Gallery`) changed the shape of this version's Done-when. Every one of the
five pages is a table of tokens **wrapped in a control from a later version**:

| page        | the table v1 reproduces                              | the frame around it, and where it lands   |
| ----------- | ---------------------------------------------------- | ----------------------------------------- |
| Color       | 130 tiles and 27 captioned examples, in six sections | `SelectorBar` — v4, Navigation            |
| Typography  | 9 type-ramp rows                                     | `ControlExample` — v3                     |
| Geometry    | 3 corner-radius rows                                 | `ControlExample` — v3                     |
| Spacing     | 7 spacing rows                                       | none; two annotated images v1 cannot draw |
| Iconography | 1533 Segoe Fluent Icons tiles                        | `AutoSuggestBox` + `ItemsView` — v4       |

**v1 builds the tables and a plain frame; it does not build the chrome.** The pages are
reachable from a list on the Gallery's index and switch theme from a control the shell later
replaces. Each version that brings a page's real frame moves that page onto it. This is not a
reduction in scope — the tables are the part that shows the tokens, and the chrome shows
controls that do not exist yet — but it does mean these five pages are not a side-by-side
match until v4, and only the tables are compared before then.

Four of the 130 color tiles cannot be reproduced at all in v1: they display the Acrylic
brushes, which need a backdrop this version has nothing to put behind them. Recorded as a
divergence rather than dropped, because a missing tile is indistinguishable from a page that
was never finished.

Done-when: the five Design pages render, each carrying its full table; every token has a value
in all three themes; the parity test passes; and the Color page's tiles compare clean against
Windows 11, tile for tile, ignoring the chrome around them.

**Met.** The real WinUI 3 Gallery, launched on the reference guest and captured over VNC, next
to our Color page captured through the same guest's Edge over CDP at a matching viewport —
the one comparison in this project no automated gate can make. Seven brushes sampled
pixel-for-pixel at matching tile coordinates (`TextFillColorPrimary/Secondary/Tertiary/
DisabledBrush`, `AccentTextFillColorPrimary/Secondary/TertiaryBrush`): six exact matches, one
off by a single bit in one channel, consistent with VNC's framebuffer encoding rather than a
real difference. The comparison itself caught a real defect first — `.gallery-tile-grid` never
set `display: grid`, so all 130 tiles stacked in one column instead of laying out the way the
record's per-grid `columns` field says. Fixed; see the commit history. Captures are in
`.private/captures/`, untracked, sent to the user rather than committed.

### v2 — the app shell

Goal: **the Gallery's frame is navigable and looks right.**

`MainWindow.xaml`'s three parts — the title bar carrying the icon, the title and the search
box; the left NavigationView carrying the menu tree; the content area the pages render into —
plus routing, live theme switching, and the window backdrop. NavigationView and TitleBar are
built from scratch: no primitive library has either.

Seven units, each sealed on its own:

1. **The control templates.** The upstream checkout carries `NavigationView.xaml` and
   `TitleBar.xaml`, not only the theme dictionaries — a control reproduced from scratch is
   reproduced from its `ControlTemplate` rather than from a screenshot.
2. **The shell record.** `MainWindow.xaml`'s menu tree, and the control groups
   `ControlInfoData.json` supplies at runtime, extracted the way the Design pages were.
   D13 and ADR 0007 already govern this; the extractor grows, the rule does not change.
3. **The shell's tokens.** The keys the shell reads, added to the selection under D15.
4. **NavigationView.** The left pane, its items, the selection indicator, the expand
   chevron, and the display modes the pane width selects between.
5. **TitleBar.** The title bar row, the pane-toggle and back buttons, and the slot the
   search box goes in — the box itself is the Gallery's, under D20.
6. **The pane's settings item.** `IsSettingsVisible` defaults to true and the Gallery does
   not turn it off, so the real pane ends in a Settings row that unit 4 does not build.
   The frame needs somewhere to put the theme control, and this is where the Gallery
   puts it.
7. **The frame.** Routing, the search box, live theme switching, the backdrop, and the five
   Design pages rendered inside the shell rather than beside it.

Done-when: the frame reproduces `MainWindow.xaml`'s structure; the left navigation and a page
inside the frame compare clean against Windows 11 in light and dark; the theme control changes
every token live with no reload; `pnpm verify` is green with C4 — which has been pending since
v0 for want of an exported component — live.

**The Gallery's own home page is not in this version.** It is built from `SelectorBar` and
`GridView` over a recently-viewed list, which are the Navigation and Collections tranches;
pulling them forward would make v2 three goals wearing one name. The frame is what v2 is
judged on, and it is judged with the Design pages inside it. The home page lands with its
dependencies.

**D15 — a tranche seeds by key, not by file.** v1 seeded four whole dictionaries because they
are the shared vocabulary. Seeding the shell's four the same way was tried and measured:
the closure reaches the Reveal material brushes, which nothing here can express, and sixteen
names that nothing it walks through defines — the legacy `SystemControl*` brushes and
`ContentControlThemeFontFamily` among them — because the dictionaries also carry whole
`Style` records for controls this version does not build. A per-control dictionary is
therefore a place to look keys up, not a set to take wholesale.

**D18 — every menu entry is a route, and its path comes from the record.** The pane shows
141 selectable rows and this version builds five of their pages. The alternative — a row
that changes a local selection without changing the URL — makes the back button meaningless
and leaves v3 to invent the route scheme it will then have to migrate. So one function turns
a record entry into a path, a catch-all route renders the ones with no page yet, and its
`entries()` come from the record so the set is prerendered rather than guessed. v3 replaces
placeholders; it does not replace the scheme.

**D19 — the shell is the layout, and the selected item is the URL.** The window is a layout,
not a component the pages each mount: a page that drew its own title bar would remount the
pane on every navigation. Selection is derived from the path and never stored, which is what
makes the browser's own back and forward work without a second source of truth to reconcile.
The `/dev/` harness pages sit outside it — they exist to photograph one control against
nothing, and a shell around them would defeat that.

**D20 — the title bar's search box belongs to the Gallery, not to the library.** The
original is an `AutoSuggestBox`, which is the Text tranche's to build. Publishing an
unfinished one now would put it on the library's public surface and into C4's theme matrix,
and the Text tranche would then be rewriting a shipped control rather than writing one. The
Gallery gets a local search box built from the TextBox theme resources instead: it looks
right, which is the bar, and it suggests nothing, which is recorded rather than hidden.

**D16 — the backdrop is Mica's solid counterpart.** Mica's input is the desktop behind the
window, and a web page has no such thing: nothing exposes what is behind the viewport to CSS,
and neither pinned source states the tint and luminosity that would let one be faked
faithfully. The Gallery's own Color page gives `Mica Background / Base` and
`Solid Background / Base` the same caption — "used for the bottom most layer of an
experience" — so the solid pair is the value Microsoft itself names for that role. WD-003 is
amended to this permanent reason rather than deleted.

#### What the side-by-side found

The frame was compared against the real Gallery on the reference guest, both windows the
same width. Eight gaps, in the order they were reported. Each is a unit; none is a
divergence, because every one of them is reproducible.

**F1 — the search box does not stretch.** Settles O-shell1. The original's box keeps its
width when the window is resized and is _clipped from the right_ when the window gets
narrow, so it is sized to its content and not to its column: the `Stretch` override
`MainWindow.xaml` sets does not take. Ours stretches to `MaxWidth="580"`. The width to
reproduce is the box's desired width — for a XAML `TextBox`, the width of its placeholder
text plus the padding and the query button.

**F2 — the pane and the content scroll separately, and the scrollbar is Windows'.** Ours
scrolls the whole document instead, because the window is `min-height: 100vh` and grows.
Two changes: the window is exactly the viewport's height and each region scrolls inside
itself, and the scrollbar is styled — Windows' is a thin overlay, ours is the browser's
default and much wider.

**F3 — the query button's hit area is wider than its glyph.** Ours wraps the glyph;
the original's is a rectangle wider than it is tall. `AutoSuggestBoxQueryButtonPadding`
and the button's own width are already seeded.

**F4 — the Gallery's pages have a gutter and ours have none.** Not the control's:
`NavigationViewContentPresenterMargin` is `0`, and on the reference capture the page
heading starts about 37 pixels inside the content grid. The padding belongs to the
Gallery's own page style, which is where it has to be read from.

**F5 — a parent item toggles on click.** In the original, clicking an item that has
children expands _and collapses_ it, and such an item has no page of its own — `Design`
navigates nowhere. Ours expands on click and collapses only from the chevron, and D18
gives every row a route including the parents. The comment in `NavigationViewItem.svelte`
asserting the opposite is wrong and goes with the fix.

**F6 — a separator sits above the settings item.** It is `VisualItemsSeparator`, and the
condition is not the one this repository's shell unit assumed. `NavigationView.cpp`'s
`UpdatePaneLayout` enters `SeparatorVisible` — `NavigationView.xaml:171` — exactly when the
menu items do not fit beside the footer group, which for a menu of this size is always.

**F7 — the title bar's buttons animate on press.** The glyph scales down on pointer-down
and returns on release. Both the back button and the pane toggle.

**F8 — the icon column is 32 wide, and 8 when the item has no icon.** This is the
mechanism behind the alignment: a child without an icon puts its label almost where its
parent's label is. `NavigationViewItemPresenter.cpp:289` computes
`SmallerIconWidth = CompactPaneLength - 8`, the template binds the icon column to it —
`NavigationView_themeresources.xaml:611` — and the `IconCollapsed` state at `:509` drops
that column to 8. We used `NavigationViewIconBoxWidth` and rendered the column at full
width whether or not there was a glyph. Measured while fixing it: `CompactPaneLength` is
48 at this pin, so `SmallerIconWidth` is 40 and lands on the same number
`NavigationViewIconBoxWidth` carries — the width was right by coincidence and only the
collapsed case was wrong.

**Not counted as gaps.** Page contents and item labels are still being filled in; the
comparison was of the frame.

**Where they landed.** F1 through F6 and F8 are fixed, each in its own commit with the
measurement that closed it. F7 is not a fix and became a divergence instead: the press the
review saw is an `AnimatedIcon` playing its `Pressed` segment, which is the same compiled
Composition data WD-006 already declines to re-author, so that entry widened from the
settings item to the family — the settings gear and both title bar buttons.

Two residuals, recorded rather than guessed. The search box is 227 wide against the
original's 318 now that it is sized by its content instead of stretched; the difference is
`TextControlThemeMinWidth`, referenced by `TextBox_themeresources.xaml:193` and defined
nowhere in this checkout. And the page gutter does not yet shrink to 16 at narrow widths the
way `ItemPage.xaml:87` does.

### v3 — the sample-page frame

Goal: **one control's sample page has the real page structure.**

`ControlExample`'s three panes (example / output / options), and the collapsed "Source code"
Expander containing a SelectorBar with XAML and C# tabs, a syntax-highlighted viewer, and the
floating copy button.

Done-when: a single control's page reproduces the structure; the source-code viewer works;
the page compares clean.

This is deliberately before the bulk of the controls: every later control page reuses it, so
getting it wrong late is expensive.

### v4 onwards — control tranches

The Gallery's 19 groups, ordered so that each tranche's dependencies are already built.

1. **Basic input** (14) — Button, DropDownButton, SplitButton, ToggleSwitch, CheckBox, RadioButton, Slider, ComboBox, ColorPicker, RatingControl, …
2. **Text** (7) — TextBox, AutoSuggestBox, NumberBox, PasswordBox, RichEditBox, TextBlock, RichTextBlock
3. **Status & info** (5) — InfoBar, InfoBadge, ProgressBar, ProgressRing, ToolTip
4. **Layout** (9) — Border, Expander, Grid, SplitView, StackPanel, Viewbox, …
5. **Dialogs & flyouts** (4) — ContentDialog, Flyout, Popup, TeachingTip
6. **Menus & toolbars** (10) — CommandBar, MenuBar, MenuFlyout, AppBar*, …
7. **Navigation** (5) — BreadcrumbBar, Pivot, SelectorBar, TabView, (NavigationView done in v2)
8. **Collections** (7) — ListView, GridView, TreeView, ItemsRepeater, ItemsView, FlipView, …
9. **Date & time** (4) — CalendarView, CalendarDatePicker, DatePicker, TimePicker
10. **Scrolling** (5) — ScrollView, PipsPager, AnnotatedScrollBar, SemanticZoom, …
11. **Styles** (10) — AcrylicBrush, AnimatedIcon, ThemeShadow, System Backdrops, …
12. **Motion** (7) — transitions, easing, connected animation
13. **Media / Windowing / System / Shell** (18) — see open question O2

Each tranche is one version with one goal, sealed independently.

### Final — the acceptance gate

An observed, time-boxed side-by-side of the full Gallery against Windows 11, page by page.

## Conformance gates

Automated, and a unit that fails one cannot be sealed.

- **C1 — no raw visual literals.** No hex color, no px size except through `var(--winui-*)`,
  in the library **and in the Gallery**. The token cascade _is_ the design system; a literal
  is a value that will not follow a theme switch. The Gallery is in scope because its Design
  pages are where the tokens are judged: a color hard-coded there would make the acceptance
  surface match the original for a reason unrelated to the token layer.
- **C2 — tokens are generated.** The committed token CSS must equal the generator's output.
- **C3 — layer separation.** `packages/winui-svelte` must not import from `apps/gallery`.
- **C4 — three themes, always.** Every exported component renders under light, dark and high
  contrast in the snapshot suite. A component that only works in one theme cannot land.
- **C5 — divergences are declared.** Every intentional departure from WinUI behaviour carries
  a `WD-NNN` id in a code comment resolving to an entry in `docs/divergences.md`, and every
  entry is cited by at least one site. Neither direction may dangle.
- **C7 — the acceptance surface is covered.** Every resource the Design pages display is
  emitted by the token layer, or listed in the generator's exclusions with a reason. This is
  D12's second clause made checkable: the first half of the selection is structural and the
  generator enforces it, while the second was a promise kept by hand until the page content
  existed as data to check against.
- **C6 — no consumer build tooling.** A smoke app consuming the built package with bare Vite +
  Svelte and nothing else must render correctly.
- **C8 — the Gallery records are current.** C2's sibling for the other generated pair. The
  records are derived from a checkout that is deliberately not committed, so the gate always
  checks what a fresh clone can — the commit each record names against the pin, and each
  record's census against its own contents — and re-derives both when the checkout is present
  at that pin. The weaker half is the one that catches the failure that actually happens: a
  record edited by hand rather than through the extractor.

C5 is the mechanism for the project's central constraint: WinUI behaviour we choose not to
reproduce is a recorded decision, never a silent one.

**A gate is not trusted until it has been seen to fail.** Each is probed against a planted
violation — and against the evasions that occurred to a reviewer, not only the obvious form —
before it is relied on. A gate that has only ever passed is indistinguishable from one that
cannot fail.

Probe with an empty index. A guard probe commits and resets to prove the guard fired; run with
work staged, that reset discards the work.

## Resolved questions

- **O1 — snapshot fonts.** _Resolved:_ run the snapshot suite on a local Windows VM runner.
  See "Verification".
- **O2 — out-of-scope Gallery groups.** _Resolved:_ keep every page in the navigation tree.
  Implement the ones the web can actually do (Clipboard, notifications in part); render the
  rest as an honest "not applicable on the web" panel in the original's page slot. Dropping
  the pages would change the left navigation, which is exactly what v2 is judged on.
- **O3 — accent color.** _Resolved:_ both layers. See "Accent".
- **O4 — primitive library.** _Resolved:_ bits-ui, with individual Zag machines for the three
  primitives it lacks. See ADR 0004. The survey's headline was that the keyboard limitation
  which prompted it is universal across every candidate, so it never was a selection
  criterion.

## Open questions

Two, both raised by the shell and both of a kind this project settles the same way: by
looking at the two windows side by side rather than by arguing from a screenshot. They are
recorded here so the comparison has a list to work from.

**O-shell1 — the search box's width.** `MainWindow.xaml` gives the `AutoSuggestBox`
`MaxWidth="580"` and `HorizontalAlignment="Stretch"`, and overrides
`TitleBarContentHorizontalAlignment` from `Center` to `Stretch` so it fills its column;
`TitleBar.xaml:186` makes that column `*`. Ours therefore renders 580 wide at a 1600-wide
window. A capture of the shipped app at that width shows the box **318** wide — its content
width — which reads as the override not taking. Settled by putting the two windows side by
side at the same width, not by inferring chrome insets from one screenshot.

**O-shell2 — the search box's height.** The original is 32 pixels, measured. Ours is 38 on
the Linux host, and the difference is not layout: the row's height comes from the query
button's line box, which is a 12-pixel Segoe Fluent Icons glyph at `line-height: normal`,
and the host has a substitute face. XAML sizes the same button from the same font. Measure
it on the guest before changing anything.

## Sources

Design tokens, Gallery structure, and the primitive-library survey are recorded in the ADRs.
Everything numeric traces to `microsoft/microsoft-ui-xaml` (MIT) or
`microsoft/WinUI-Gallery` (MIT); the Gallery's control catalogue is
`WinUIGallery/SampleSupport/Data/ControlInfoData.json`.
