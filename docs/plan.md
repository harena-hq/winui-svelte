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

**The library is the product; the Gallery is the harness that judges it.** Both sentences of
the goal are load-bearing, and their order is too. Work that leaves nothing in
`packages/winui-svelte` buys only a better test rig, so it is scheduled behind work that does,
and the control order is what an application reaches for rather than what the Gallery's
navigation happens to list first. The harness earns its keep by being the only honest measure
of fidelity — not by being finished.

## Shape

```
packages/winui-svelte/   the library — Svelte scoped CSS + CSS custom properties only
apps/gallery/            the Gallery reproduction — the acceptance harness
docs/                    this plan, ADRs, the divergence registry
```

pnpm workspace. The library is publishable and imposes no build tooling on its consumers.

## Locked decisions

| #   | Decision                                                                                               | Where                             |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------- |
| D1  | Library + Gallery showcase, split as above                                                             | this file                         |
| D2  | Token values are extracted from `microsoft-ui-xaml` (MIT), not from Fluent 2 web packages              | ADR 0001                          |
| D3  | Styling is Svelte scoped CSS over a CSS custom-property token cascade. No Tailwind, no CSS-in-JS       | ADR 0002                          |
| D4  | Fonts and icons are referenced by name from the local system, never embedded                           | ADR 0003                          |
| D5  | Visual truth is a human side-by-side against Windows 11; automation gates regression only              | this file, "Verification"         |
| D6  | Snapshots run on a local Windows VM runner, not on the Linux host                                      | this file, "Verification"         |
| D7  | Out-of-scope Gallery groups keep their pages, implemented where the web allows                         | this file, "Roadmap → v4"         |
| D8  | Accent is six tokens with a baked default, plus an optional derivation from one base                   | this file, "Accent"               |
| D9  | bits-ui as the primitive base; individual Zag machines for TreeView, ColorPicker, NumberBox            | ADR 0004                          |
| D10 | High contrast is generated as aliases onto eight system colors, not as a third palette                 | ADR 0005                          |
| D11 | A token is named `--winui-` plus the WinUI resource key, unchanged                                     | ADR 0006                          |
| D12 | The token layer is a curated closure of four base files plus what the Design pages name                | this file, "Roadmap → v1"         |
| D13 | Gallery page structure and page data are read from the pinned `WinUI-Gallery` source                   | ADR 0007                          |
| D14 | A composed WinUI `Style` ships as a CSS class, not as a custom property                                | this file, "Roadmap → v1"         |
| D15 | A control tranche seeds the token selection by key, never by dictionary file                           | this file, "Roadmap → v2"         |
| D16 | The window backdrop paints Mica's solid counterpart; the material is not approximated                  | this file, "Roadmap → v2"; WD-003 |
| D17 | A legacy `SystemControl*Brush` resolves through a table to a system colour, and is never emitted       | ADR 0008                          |
| D18 | Every menu entry is a route; the path is derived from the record, never hand-written                   | this file, "Roadmap → v2"         |
| D19 | The shell is the Gallery's layout, and the selected navigation item is the URL                         | this file, "Roadmap → v2"         |
| D20 | ~~The title bar's search box is the Gallery's own~~ — **retired in v4**, it is the published control   | this file, "Roadmap → v4"         |
| D21 | A WinUI member becomes a Svelte prop by one stated rule, and every component takes `...rest`/`ref`     | ADR 0009                          |
| D22 | Tranches are ordered by what an application reaches for; harness scaffolding follows the controls      | this file, "Roadmap → v3"         |
| D23 | The XAML framework dictionary is a third pinned upstream; the control pin wins per key and theme       | ADR 0010                          |
| D24 | The type ramp's line height is `normal`, the font's own spacing, not the published ramp's number       | ADR 0011                          |
| D25 | An icon is a snippet the consumer draws, with a Segoe Fluent Icons code point as its shorthand         | ADR 0012                          |
| D26 | A control's internal items host is template-private; the tranche renders its items directly            | this file, "Roadmap → v8"         |
| D27 | A collection control is generic in its item type and draws it through a snippet the caller writes      | ADR 0013                          |
| D28 | The sample-page frame is the Gallery's own harness around WinUI, so it is Gallery code                 | this file, "Roadmap → v10"        |
| D29 | Syntax highlighting is ColorCode's rules and palette as data, applied by an engine of ours             | ADR 0014                          |
| D30 | Grid and StackPanel are Gallery pages drawn in CSS, not components; Border stays a component           | this file, "Roadmap → v11"        |
| D31 | CalendarView's month grid is bits-ui's `Calendar`; its year and decade grids are ours                  | this file, "Roadmap → v12"        |
| D32 | A date-valued prop is a native `Date`; the arithmetic is `@internationalized/date`, the strings `Intl` | this file, "Roadmap → v12"        |
| D33 | A scrollbar is elements rather than `::-webkit-scrollbar`, and its viewport is not bits-ui's           | this file, "Roadmap → v13"        |
| D34 | Roadmap item 14 becomes two versions: Styles is photographable at rest and Motion is not               | this file, "Roadmap → v14"        |
| D35 | A shape is a component and a brush or a shadow is a value; the Gallery record's base class decides     | this file, "Roadmap → v14"        |
| D36 | The `Symbol` name-to-glyph table is a record generated from the control pin, never transcribed         | ADR 0012, "The amendment"         |
| D37 | The release object is the library, cut after v18; the Gallery's page-by-page gate follows it           | this file, "Roadmap → v17, v18"   |
| D38 | A WinUI control this library claims is a component, `TextBlock` included; a ramp class is its output   | this file, "Roadmap → v17"        |
| D39 | A motion value transcribed from a source site is a `c1-allow`'d literal citing it, not a token         | this file, "Roadmap → v15"        |
| D40 | Theme Transitions takes its shape from the pin's nearest modern relative; the numbers are approximate  | this file, "Roadmap → v15"        |
| D41 | Animation interop reproduces all five of its expressions; only the spring's curve is declined          | this file, "Roadmap → v15"        |
| D42 | A capability the web has and this harness withholds is a different WD row from one the web lacks       | this file, "Roadmap → v16"        |
| D43 | The not-applicable panel is a stand-in for a declined element, built when one is first needed          | this file, "Roadmap → v16"        |
| D44 | The pinned sample video is re-encoded to H.264; WMV is the one asset no browser plays                  | this file, "Roadmap → v16"        |
| D45 | AnimatedVisualPlayer ships whole and its Gallery page draws the composition's resting frame            | this file, "Roadmap → v16"        |
| D46 | The first release exports a subset of what is built; a component ships when polished, not when sealed  | this file, "The library gate"     |

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
  no line height at all. The family comes from ADR 0003's per-step mapping, and the generator
  fails if that table and the source ever stop naming the same ten styles. The line height is
  `normal`, which is the font's own spacing and is what a `TextBlock` with no `LineHeight`
  draws — ADR 0011, and WD-018 for the one thing that spelling gives up.

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
| Color       | 130 tiles and 27 captioned examples, in six sections | `SelectorBar` — v8                        |
| Typography  | 9 type-ramp rows                                     | `ControlExample` — v10                    |
| Geometry    | 3 corner-radius rows                                 | `ControlExample` — v10                    |
| Spacing     | 7 spacing rows                                       | none; two annotated images v1 cannot draw |
| Iconography | 1533 Segoe Fluent Icons tiles                        | `AutoSuggestBox` v4 + `ItemsView` v9      |

**v1 builds the tables and a plain frame; it does not build the chrome.** The pages are
reachable from a list on the Gallery's index and switch theme from a control the shell later
replaces. Each version that brings a page's real frame moves that page onto it. This is not a
reduction in scope — the tables are the part that shows the tokens, and the chrome shows
controls that do not exist yet — but it does mean these five pages are not a side-by-side
match until the version that brings each one's frame — v4 through v10 — and only the tables
are compared before then.

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

**D20 — the title bar's search box belongs to the Gallery, not to the library.**
**Retired in v4**: the Text tranche built the control, and the shell now mounts it. What
follows is why it was true while it was true. The
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

#### The second pass

Five more, four of them fixed and one measured and left alone.

- **The title bar had shrunk to 41.** A regression from constraining the window: a height
  on a flex child is a starting offer unless the child says otherwise. Fixed.
- **The chevron was smaller and fainter than the original's.**
  `NavigationViewItemExpandedGlyphFontSize` is 8 and that is the _fallback_ glyph inside an
  `AnimatedIcon` the template gives a 12 by 12 box — NavigationView_themeresources.xaml:617.
  Drawn at the box now.
- **The scrollbar was still the browser's.** `scrollbar-width: thin` silently disables every
  `::-webkit-scrollbar` rule on the same element, so the styling never applied. Removed, and
  both scrollers now draw `ScrollBarSize` 12 with an 8-wide thumb.
- **`Basic input` has children and a page**, unlike `Design`. The earlier fix made every row
  with children open rather than go, which is right for exactly the three special sections
  and wrong for the sixteen groups. And such a row keeps the pane's selection while the page
  stays put, because `SelectsOnInvoked` is true and WinUI selects what it does not navigate
  to.
- **The query button's glyph is not too small.** The original's magnifier measures 11 by 11
  of ink on the reference capture, which is what a 12-pixel Segoe Fluent Icons magnifier
  draws, and `AutoSuggestBoxIconFontSize` is 12. What changed around it is the button: it is
  now a stretched rectangle rather than a box drawn tight to the glyph, which makes the same
  glyph read as smaller. Left alone.

**Where the search box sits, and why it is still not the original's x.** The box is centred
in the title bar's `*` column, in both. Ours ends 36 pixels right of the original's, and the
two halves of that are accounted for rather than open: the original's row reserves its
window's caption-button inset on the right — `TitleBarRightPaddingWidth`, which the theme
resource sets to 0 and `TitleBar::UpdatePadding` fills at run time from the `AppWindow`, and
a web page has no `AppWindow` — while ours draws no icon on the left, which is WD-007. Half
of the first pushes ours right, half of the second pulls it left, and the arithmetic closes
to the pixel. Reproducing either would mean drawing chrome this window does not have.

One residual: the page gutter does not yet shrink to 16 at narrow widths the way
`ItemPage.xaml:87` does.

The search box's width was briefly a second one and is not. Sized by its content it came
out 227 against the original's 318, which is a gap in the other direction and just as
visible. The original's placeholder ends about seventy pixels short of its query button, so
its width is a floor rather than a measure of the text — `TextControlThemeMinWidth`, bound
at `TextBox_themeresources.xaml:193` and defined nowhere in `controls/dev`, measured as 318
on the reference capture the same way `TextControlThemeMinHeight` was measured as 32.

### v3 — the component contract, and five controls that prove it — **done**

Goal: **the package is worth installing.**

An earlier draft of this version built `ControlExample` and the source-code viewer first, on
the argument that every later control page reuses the frame. Costed unit by unit, six of its
eight units left nothing in `packages/winui-svelte` — that argument holds only while the
Gallery is the deliverable, and it is not. The frame moves to v10, where it is also cheaper:
its Expander and SelectorBar are real WinUI controls that this roadmap now builds on their own
account, so the frame no longer has to drag them forward.

What this version adds instead is the thing two versions of components were written without: a
stated rule for how a WinUI member becomes a Svelte prop, and an escape hatch. Today nothing
the library exports can be given a class, an id, an `aria-label` or a `ref`; a component a
consumer cannot place is a demo. ADR 0009 is that rule, and D21 locks it.

Units:

1. **The contract, applied to what exists.** NavigationView, NavigationViewItem and TitleBar
   migrated onto ADR 0009 — names, `on<Prop>Change` callbacks, `...rest` and `ref` — and the
   Gallery updated to the new surface. First, because the cost of this migration is linear in
   the number of components and this is the cheapest it will ever be.
2. **Button.** Also the base every later button variant and the Gallery's own chrome stands on.
3. **TextBox.**
4. **CheckBox.**
5. **RadioButton**, and the group that owns the selection.
6. **ToggleSwitch.**

The five are chosen for the shapes they force the contract through — a command, free text, a
binary state, a grouped exclusive choice, a bound toggle — not for count. ComboBox and Slider
are deliberately not here: a popup and a drag gesture would test the contract's edges before
its middle is settled.

Done-when: each control renders under the three themes in the snapshot suite; each compares
clean against the original on the reference guest; and every prop follows D21 with its TSDoc
naming the WinUI member.

The comparison surface is the control, not the page. Each gets a Gallery route with a plain
frame — the original shows it inside `ControlExample`, and ours will not until v10 — which is
the same arrangement v1 used for the Design pages and for the same reason: the chrome shows
controls that do not exist yet.

#### What the five controls cost, and what they settled

Sealed. Seven exported components, nineteen tracked baselines, and a token layer that has
grown from the shared vocabulary to five control dictionaries taken whole.

Each control's tokens were selected by asserting the selection **equal** to the set of keys
its upstream dictionary defines — 95 for CheckBox, 59 for RadioButton, 62 for ToggleSwitch,
with 19, 18 and 23 of those named in `EXCLUDED` — so a key missed and a key invented both
fail. That check replaced the cold read for the manifest half of each unit, and it is
stronger than one: a table resolving names to colours cannot be reviewed by reading its rows,
which is what the Button near-miss demonstrated. What a reader still has to do by hand is
resolve the pairs a control actually **paints**, per theme, and that found the one thing
worth recording — a pressed unselected RadioButton takes the same brush for its ring stroke
and its ring fill under high contrast, upstream's mapping, left faithful.

Three questions came up that the resources alone could not answer, and each was settled by
running the original on the reference guest rather than by reasoning:

- **CheckBox's three-state cycle** — unchecked, checked, indeterminate — because `IsThreeState`
  lives in system XAML, not in the pin.
- **CheckBox's unchecked glyph.** The resources define four brushes for it; the animated
  original draws nothing. They exist for the down-level path, which hides the glyph by
  painting it the colour of the fill — a trick that holds in Light and Dark and breaks under
  high contrast. WD-006 accepts the fallback glyph, not a state the original never shows.
- **ToggleSwitch's default content** — "On" and "Off", which the control's own code supplies
  and the pin does not carry.

The contract itself needed two amendments, both written after the code rather than before it:
`ref` points at the interactive element rather than at the root, which TextBox had already
done without saying so; and an HTML attribute from the reserved set that belongs on an inner
element is declared as a prop rather than left to the rest spread, which is the second half
of why that set is closed.

Two gaps were recorded rather than closed. WD-008: no control draws the system focus visual,
because its four brushes are in the framework dictionary that also holds TextBox's header —
one measurement pass will close both. WD-009: the toggle switch cannot be dragged.

### v4 onwards — control tranches

Ordered by what an application reaches for (D22), not by the Gallery's navigation. Each tranche
is one version with one goal, sealed independently. Counts in parentheses are the Gallery's
group sizes, which no longer line up one-to-one with a version.

4.  **The rest of input** — ComboBox, Slider, NumberBox, PasswordBox, AutoSuggestBox. The last
    of these also retires D20: the title bar's search box becomes the published control.

    **Closed.** All five exist and are exported; twelve components now render under the
    three themes in the snapshot suite, thirteen baseline sets pass on the reference guest,
    and the nine gates are green. The version's own Done-when is v3's, applied to five more
    controls: each control snapshotted in three themes, each compared against the original
    on the guest, each prop following D21 with its TSDoc naming the WinUI member.

    What the version cost that its goal did not predict: a third pinned upstream, because
    four of the five controls read resources the control pin does not carry; a rewrite of
    the merge rule from per-key to per-key-and-theme, which found every text control drawing
    light-theme colours in high contrast; and a gate, C9. Three of the five controls also
    turned out to have been shipped 13px too tall since v3, on a `box-sizing` the resources
    had been saying all along. None of that was found by a gate — all of it by measuring a
    rendered control against the resource it claims to read.

    **What this version still owes, once its five controls exist.** Each is a later unit and
    none is a divergence: nothing here is being declined, it is simply not built yet, and
    every one of them is on the Gallery page the acceptance gate will compare against.

    | control        | not yet built                                                               |
    | -------------- | --------------------------------------------------------------------------- |
    | Slider         | `Orientation="Vertical"`, the three `TickBar`s, and `IsThumbToolTipEnabled` |
    | ComboBox       | `IsEditable="True"` and the `EditableModeStates` group                      |
    | NumberBox      | `SpinButtonPlacementMode="Compact"`, `AcceptsExpression`, `ValidationMode`  |
    | AutoSuggestBox | non-text suggestions, `LightDismissOverlayMode`                             |
    | all four       | the touch and game-controller padding variants                              |

    Three of the deferrals carry a note. AutoSuggestBox renders its own suggestion rows from
    the `ComboBoxItem*` families because this library has no ListView; the Collections
    tranche replaces them, and the component says so at the site. And `AcceptsExpression`
    is the one that is a behaviour rather than a shape — if it is ever declined rather than
    postponed, it becomes a `WD-` entry, not a line in this table.

    `IsThumbToolTipEnabled` was added to this table after the version closed, and how it was
    missed is the point. Every other row came from reading the control's template; this one
    is not in the template. WinUI's Slider builds the thumb's value tooltip in the control's
    own code, so a reader who derives the surface from `Slider_themeresources.xaml` — which
    is what the unit did, and what every unit before it did — cannot see it. The default is
    `True`, so it is not an opt-in a user has to find: dragging the original's thumb shows
    the value and dragging ours shows nothing. **A control's surface is its template plus
    its code-behind, and this project has only ever read the first half.** The same hole is
    open on every control sealed so far.

    **It has since been swept, and the sweep is `docs/surface.md`.** That file carries what
    the second half of each sealed control adds, the finding that seven of the twelve have
    no implementation in the pin at all — they are `Windows.UI.Xaml` controls WinUI 3 only
    restyles, so their Gallery sample page is the only enumeration of their surface — and,
    the part that matters going forward, the four steps that sweep a control **before** it
    is sealed rather than after. Two defects came out of it and are fixed; the rest are
    recorded there, including the ones that belong to controls the table below does not
    reach — v2's NavigationView and TitleBar, and v3's five.

    **What closing it did not catch.** A manual pass over the five controls, driving them
    with a mouse and a keyboard rather than photographing them, found six defects the whole
    battery had been green on. Each was then reproduced by measurement, so none of these is
    a report of an impression:

    | control        | defect                                                                                  | measured                                                                                                                                                   |
    | -------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | Slider         | the focus visual appears on a mouse drag; WinUI draws it for `FocusState.Keyboard` only | `:focus-visible` is `true` on the thumb after a drag — the primitive focuses it programmatically and the browser grants focus-visible to a `role="slider"` |
    | Slider         | a second ring is drawn around the round thumb                                           | `.thumb` has no `outline: none`, so the UA ring shows: `outline: auto 1px`. Every other component sets it                                                  |
    | PasswordBox    | revealing moves the caret and does not put it back                                      | changing an `<input>`'s `type` resets `selectionStart`/`End`                                                                                               |
    | AutoSuggestBox | no left padding inside the box                                                          | `.input` sets `padding: var(--winui-TextControlThemePadding)` and then `padding: 0` five lines later in the same rule; only the second reaches the browser |
    | AutoSuggestBox | the suggestion list is in the wrong font, much too large                                | the popup is portalled to `<body>` and neither `.popup` nor `.item` sets a font, so it inherits nothing: `Times New Roman 16px` against the ramp's 14px    |
    | AutoSuggestBox | the clear button has no hover fill                                                      | `.delete` changes only its foreground; TextBox's delete button and this control's own query button both paint the fill on `::before`                       |

    **Two of the six are not this version's to fix, and doing them first is cheaper than
    interleaving them.** Focus modality and the font a portalled popup inherits are
    mechanisms, not component bugs: every later control that takes a focus visual or opens a
    popup re-breaks both, and ComboBox already carries the second. They are sealed before
    the next tranche starts. The other four are single lines in single components.

    **All six are closed.** The four single-component fixes are `d2363bb`, `bd4f202`,
    `7bfc14b` and `e57b3af`; the two mechanisms are `c7b2e0f` and `8021c8d`. Two of the
    four were not the one-liners this paragraph predicted. The caret was not moved by the
    `type` change at all — Chromium resets a password field's selection at the end of the
    task that dispatched the pointer event, so a restore has to wait a frame and `tick()`
    is early by one task. And the clear button's missing fill was caused by a note in the
    token manifest: the key it needed was listed as a deliberate omission because "the
    button paints no fill at rest", which is true of one of its four states and made the
    absence read as settled. What each mechanism leaves behind is a rule the next control
    reads rather than rediscovers:

    - **Focus modality.** `:focus-visible` is the right selector for an element the user
      agent focuses itself, and every component here that has one was measured and is
      correct. It is wrong for an element a primitive focuses with a script, which the
      browser cannot distinguish from a keyboard focus. `internal/focus-visual.ts` is the
      attachment that makes the distinction, and its doc comment carries the test for when
      to adopt it. It is this library's first attachment.
    - **A portalled element carries the type ramp itself.** CSS inheritance follows the
      DOM, and a portal moves the element out of the root that holds the ramp class.
      Upstream has no equivalent break — the popup is inside the control's template, so
      the font reaches it by property inheritance. Both popups now carry
      `winui-BodyTextBlockStyle`. Every surface in v6 is a portal, and so is every flyout
      and menu after it.

    No gate is proposed for either. The first is a behaviour no static reader can see and
    no still image can photograph. The second could in principle be checked — every
    component that portals must put a ramp class on the portalled element — but the check
    needs to identify _which_ element the portal wraps, which is a parse of the template
    rather than a grep, and a gate that gets that wrong either passes what it should catch
    or blocks a correct component. It is recorded here instead, which is where the reader
    who is about to write the next popup will be.

    **What this says about the Done-when.** It read "each control compares clean against the
    original on the reference guest", and the comparison it authorises is a screenshot of a
    page that nobody is touching. Four of the six are invisible in a still image — they are a
    caret, a hover, a focus ring after a drag, and a popup that is only open while a key is
    held. The fifth and sixth are visible but were photographed wrong on the first exposure,
    which is the failure mode already named against C4. A visual-fidelity bar that is checked
    only by snapshots is a bar on the resting state. Nothing here proposes a gate for it: the
    honest version is that the controls need driving, and a person did it.

    **The measurement this version owed has been made, and it found a bigger hole than the
    one it was sent to close.** The plan here was to read seven values off the reference
    guest: the three brushes TextBox's `Header` and `Description` need, and WD-008's four.
    Two of the seven were never missing — `SystemControlFocusVisualPrimaryBrush` and its
    sibling are defined in `Common_themeresources.xaml` and have been in `tokens.css` since
    v1. Two more are not resources at all, and were measured on the guest instead: the focus
    visual is 1 px inner and 2 px outer, outside the control's bounds, recorded in WD-008.
    The remaining three are in the XAML framework dictionary, and they are not alone
    there. Counting what each of this version's controls references that neither the pin
    defines nor the manifest already supplies: Slider 1, ComboBox 3, NumberBox 8,
    PasswordBox 8, AutoSuggestBox 14. Four of the five need the same three text-control
    brushes, which is the coupling that made this one decision rather than three, and the
    rest is not only colour — `TextControlThemeMinWidth`, `HelperButtonThemePadding` and
    four `AutoSuggestList*` sizes have no pixel to sample.

    So the dictionary is pinned rather than sampled. ADR 0010 records it and the three
    independent checks that the design-time `generic.xaml` in the Windows App SDK is the
    dictionary the running framework loads — one of which is the guest measurement this
    version set out to make, which now serves as the file's warrant instead of as a source.
    D23 locks it. **The first two units of this version are therefore the pin and the
    pipeline**, and the five controls follow; WD-008 closes here rather than eventually,
    since its four values are now three read and one measured.

5.  **Status and feedback** — InfoBar, InfoBadge, ProgressBar, ProgressRing, ToolTip. — **done**

    Goal: **the application can tell the user what is happening.**

    Swept before the first line was written, which is what `docs/surface.md` is for. Four of
    the five have a full implementation in the pin; **ToolTip has only theme resources** —
    it is a `Windows.UI.Xaml` control, so its 78-line dictionary and the Gallery's page are
    the whole of what can be read. What the sweep changed about this version's shape:

    - **ProgressRing has no template to derive from.** Its `ControlTemplate` is one
      `AnimatedVisualPlayer` and nothing else: both the determinate and the indeterminate
      ring are Lottie compositions, shipped as generated C++ under
      `ProgressRing/AnimatedVisuals/`. That is not a wall — the two files are 425 and 448
      lines and the geometry reads straight off them: an ellipse of radius 8 scaled 1.77
      and centred in a 32×32 box, `StrokeThickness` 1.5, round caps, and `TrimEnd` bound to
      progress, which is what an SVG `stroke-dasharray` does. The indeterminate cycle is
      2.0s (`c_durationTicks` 20,000,000), rotating 0→450°→900° while `TrimEnd` runs 0→0.5
      and then `TrimStart` follows it. The unit reads the keyframes; it does not approximate
      them by eye.
    - **InfoBadge's corner radius is computed**, not a resource: the pill's radius comes from
      `InfoBadgeTemplateSettings` in the control's code. Its Gallery page also demonstrates
      sixteen named styles — four severities plus a default, in dot, icon and value modes.
    - **InfoBar's severity picks a visual state, and the state carries the visuals.** The
      four glyphs and the eight severity brushes are in the template; `UpdateSeverity` only
      chooses between them. The code does own the icon-visibility states, the close button's
      tooltip, and whether there is banner content.
    - **ProgressBar's eight `CommonStates` are entered from code**, from `IsIndeterminate`,
      `ShowPaused` and `ShowError` in combination.

    Units:

    1. **ToolTip.** First, because three sealed controls already owe one — the Slider's
       thumb value, a NavigationViewItem's content while the pane is closed-compact, and the
       TitleBar's two buttons — and because it is a portalled surface, so it is the first
       control to be built with `docs/surface.md`'s portal rule in hand rather than against
       it.
    2. **The three tooltips those controls owe**, paid with the control from unit 1. This
       retires three rows from the deferral tables and is the reason ToolTip goes first.
    3. **InfoBadge.**
    4. **ProgressBar.**
    5. **ProgressRing.**
    6. **InfoBar.**

    Done-when: v3's, applied to five more controls — each snapshotted in three themes, each
    compared against the original on the reference guest, each prop following D21 with its
    TSDoc naming the WinUI member — **plus** the sweep in `docs/surface.md` run and recorded
    per control before it is sealed, rather than after the version closes.

    **Closed.** All five controls exist and are exported; twenty-one baseline sets pass on the
    reference guest and the nine gates are green. The sweep ran per unit before sealing, as the
    Done-when required, and `docs/surface.md` carries an entry for each.

    What the version cost that its goal did not predict: ProgressRing turned out to have no
    template at all, so its two generated Lottie compositions had to be read as the dictionary,
    and they disagree with each other on geometry in a way that is real rather than rounding.
    InfoBar needed the library's second `ResizeObserver`, because `InfoBarPanel` switches all
    three of its children between a row and a column together and no CSS expresses that: the
    switch is on the content's width, which `flex-wrap`, container queries and the flex-basis
    albatross all fail to see.

    **The finding that matters more than any control here is about the seal gate.** Four
    defects in this version passed all nine gates and every snapshot, and none of them could
    have done otherwise:

    | defect                                                                      | found by                                        |
    | --------------------------------------------------------------------------- | ----------------------------------------------- |
    | ProgressRing drew a round cap at `Value` 0 where the original draws nothing | measuring the original's ink at the same values |
    | ProgressRing's determinate arc used `value / max`, not the keyframe curve   | the same measurement, at `Value` 90             |
    | InfoBadge's digits sat a pixel high                                         | the user, looking at the live page              |
    | InfoBar's panel went vertical and never came back                           | the user, resizing the live page                |

    A baseline written from a wrong render agrees with itself, so a snapshot suite can only
    catch a change, never an error. The first two were caught because measuring the original
    is already in the Done-when. The last two were not, and they share a shape: **both are
    invisible until someone drives the control.** v4 closed with the same sentence — "the
    controls need driving, and a person did it" — and nothing was added to the seal procedure
    then. It has now cost two more. Adding a driving step is not a gate and cannot be
    automated into one; what it needs is a place in the per-unit loop, which it does not have.

6.  **Surfaces** — Expander, ContentDialog, Flyout, MenuFlyout, TeachingTip, Popup. — **done**

    Goal: **the application can reveal contextual content without leaving the current task.**

    The controls are built in dependency order rather than Gallery order:

    0. **Packed-package consumer smoke.** Pack the library and install that tarball into a
       project outside the workspace, with Svelte and every peer supplied by the consumer.
       This closes the gap already recorded under C6 before six more public prop surfaces are
       fixed by use.

       **Closed, and then widened.** The consumer app mounted four controls and its SSR entry
       rendered `Button` alone; it now mounts all six of this tranche's. What that adds is not
       template compilation — `index.ts` re-exports every component with a static
       `export { default as X } from './components/X.svelte'`, so the bundler resolves and
       transforms all 23 modules to work out the entry's exports and only then tree-shakes,
       which means a shipped `{#snippet name(x: Type)}` annotation was already reachable by
       this step. What it adds is the usage site: each control's prop names, snippet names and
       required members are now exercised by a consumer rather than merely parsed.

    1. **Expander.** An in-flow disclosure control, not a portal. It is built on bits-ui's
       `Collapsible`, which supplies the open state, the trigger's `aria-expanded` contract
       and a presence layer that keeps the content mounted for the duration of its exit
       transition.
    2. **Popup.** The lowest-level portalled surface: explicit open state, offsets, and
       optional light dismiss. It establishes the positioning and portal-font evidence used
       by the remaining surface controls.
    3. **Flyout.** An anchored popup built on bits-ui `Popover`, including programmatic hide
       and focus return.
    4. **MenuFlyout.** A menu surface built on bits-ui `DropdownMenu`; its unit includes the
       Gallery's item, toggle, radio, separator, icon, accelerator, split-item and cascading
       submenu examples rather than treating the first example as the whole control.
    5. **ContentDialog.** A modal surface built on bits-ui `Dialog`, with primary, secondary
       and close results and both Gallery default-button paths.
    6. **TeachingTip.** An anchored or untargeted teaching surface built on bits-ui `Popover`,
       after Popup and Flyout have established placement and light-dismiss behaviour. Its
       unit includes action, close, icon, hero content and tail placement.

    No new overlay framework is introduced for the tranche. The chosen bits-ui primitives
    already own focus, dismissal, keyboard and portal lifetimes; a local abstraction is due
    only if the completed controls expose repeated project-specific code that can be named
    without erasing their different contracts. Every portalled visual root carries its own
    type ramp because CSS inheritance follows the DOM after the portal moves it under
    `body`. Expander is explicitly outside that rule.

    **The driving step gets its number here.** v5 closed by observing that two of its four
    defects were invisible to every gate and were found only by a person using the control,
    and that the loop had nowhere to put that. From this version the per-unit loop is seven
    steps, not six, and the fifth is _drive the control_ — open it, close it, resize it,
    tab to it, watch it animate — before the unit is sealed. It cannot be a gate; a step
    with a number is the only other thing it can be.

    **Units are built in parallel worktrees, one per in-flight unit.** Measured on this
    host, `git worktree add` costs 0.04s and a full `pnpm install` in the new tree 3.7s and
    156 MB, so isolation is close to free — which means the author lane can write into its
    own tree while this one keeps measuring, specifying and reviewing. What that buys is a
    pipeline, not a fan-out: the reference measurement, the visual suite and the review are
    single-resource and stay sequential no matter how many lanes run. The generated token
    layer is the one shared file that cannot take two writers, so a unit that adds token
    keys takes them in this tree before its lane is dispatched.

    **One debt this version found and did not pay.** The generated type-ramp classes carry a
    `line-height` for each of the ten steps, taken from Microsoft's published type ramp;
    none of the ten `Style` records in `TextBlock_themeresources.xaml` sets `LineHeight`, so a
    WinUI TextBlock draws the font's own spacing instead. Measured at one step: a
    `BaseTextBlockStyle` message in the Gallery's flyout is 19 tall where the class gives 20.
    **Five of this tranche's six controls have had to write `line-height: normal` over the ramp
    class somewhere**, and TeachingTip needed it three times — its title, its subtitle and its
    content slot. Popup is the exception, and not because it escapes the debt: it carries
    `winui-BodyTextBlockStyle` on its root like every other portalled surface here, so it
    imposes the ramp's line height on whatever a consumer puts inside it. It needed no override
    only because it draws no text of its own to have measured against the original. The running
    total this plan used to carry is deliberately gone: it was incremented rather than derived
    and had drifted below the real number. What the unit rests on is not a count but that every
    control here with text of its own has needed the override. Fixing the ramp moves every
    baseline in the project, so it is a unit of its own and it needs the other nine steps
    measured first — the Gallery's Typography design page is where they are all on screen at
    once.

    **Paid, after v6 closed.** ADR 0011 and D24. The ten steps were measured, and the answer
    was not the one this paragraph expected: the ramp now carries `line-height: normal` rather
    than a corrected number, because the font's spacing is fractional and a `TextBlock`'s box is
    not. What this paragraph got right is that the debt was real and that every baseline moved.
    What it got wrong is the framing — the override was not five controls' problem but the
    ramp's, and the four components that never wrote one were the evidence, not the exception.
    Popup's entry here is sound and turned out to generalise: a control that imposes the ramp
    on a consumer's content without drawing text of its own has nothing to measure and so
    reports nothing.

    Done-when: v5's per-control seal loop applies to all six controls — source and Gallery
    sweep recorded before sealing, three-theme Windows baselines, direct comparison with the
    original at the same state and dimensions, and the control driven through open, close,
    resize, keyboard and dismissal paths that apply to it. The packed consumer builds and
    mounts an exported component without workspace links or package-owned peer resolution.
    The full build, check, lint, conformance and Windows visual suite are green at tranche
    close.

    **Closed.** All six controls exist and are exported. Twenty-three components are
    snapshotted in three themes, all twenty-seven tests of the Windows suite are green on the
    reference guest, the nine gates pass, and the packed-package consumer smoke builds and
    renders outside the workspace.

    **The list above says six controls and the branch sealed eleven control units.**
    MenuFlyout is one line here and was sealed as five: the measurement pass that followed
    the sweep showed its
    item vocabulary is four separate controls, each with its own template and its own intent
    line, so the icon-and-accelerator columns, the radio row, the sub item and the split item
    are units rather than examples. TeachingTip is one line and was sealed as two. Neither
    is a scope change — the sealed units together cover every Gallery example these lines
    name — and both are the same finding: **a Gallery page is a poor estimator of a control's
    unit count, and the measurement pass is what corrects it.** The correction only arrives
    after the sweep, which is an argument for sweeping before committing to a plan of units
    rather than for writing a longer list here.

    **What the version cost that its goal did not predict.** Three of the six controls turned
    out to hold a fact in XAML that CSS cannot express in one box, and each needed a shape
    rather than a value: MenuFlyout's split item measures in one layer and paints in another
    and is reproduced as two; ContentDialog's command row is laid out in the dialog's width
    and does not set it, which `contain: inline-size` reaches and WD-014 records the residue
    of; and TeachingTip's tail is a hole in the card rather than an ornament under it, which
    is an SVG `polyline` clipped by its own viewport and not a `polygon`. None of the three is
    visible in the dictionary. All three were found by decomposing a measured box and finding
    the template's arithmetic gave a different number.

    **Eight divergences opened here, WD-010 through WD-017, and two of them are a kind this
    project had not met before.** The other six are six different mechanisms rather than a
    bucket: WD-010 declines to reproduce an upstream defect rather than invent state to be
    wrong with, WD-011 is a primitive's own presence timing, WD-012 is a Composition effect
    with no pinned recipe, WD-013 is an input distinction the platform cannot make, WD-014 is
    a measurement and a layout CSS cannot put on one box, and WD-015 is a focus ring the
    browser grants to a scripted focus. **WD-016 and WD-017 are the new kind**: a minimum
    width and a content margin that the control's own pinned template declares and the shipped
    control ignores. Neither is a behaviour being declined; in both the render and the
    dictionary disagree and the render wins. The rule
    the version settled on is that **the render is the specification and the dictionary is
    the explanation**, because a reproduction faithful to the dictionary would be visibly
    wrong beside the control it copies. Every one was found by measuring the original, and
    none by a gate.

    **The seal gate learned one thing.** `--update-snapshots` over the whole suite wrote a
    light render into a dark baseline and nothing failed; the suite then agreed with the
    corrupted image on every later run. `tests/visual/themes.ts` now proves the theme was
    applied before it photographs anything, and the standing rule is to name the spec being
    added rather than update the suite. This is the third time this project has recorded that
    a baseline written from a wrong render agrees with itself, and the first time the gate
    was changed rather than the practice.

7.  **Commands and menus** — ToggleButton, HyperlinkButton, RepeatButton, DropDownButton,
    SplitButton, ToggleSplitButton, AppBarButton, AppBarToggleButton, AppBarSeparator,
    CommandBar, MenuBar. — **done**

    Goal: **the application can offer a command, and gather commands into a bar.**

    **Closed.** All eleven exist and are exported; thirty-three components render under the
    three themes in the snapshot suite, thirty-nine baseline sets pass on the reference guest,
    the nine gates are green and the smoke consumer builds. Every unit's Done-when is the one
    this entry states: the control snapshotted in all three themes and compared against the
    original on the guest, every prop following D21 as ADR 0012 amends it, and the surface
    sweep's step-1 verdict recorded before the seal — which for eight of the eleven controls
    is _the pin carries no implementation at all_. `AppBarButton`, `AppBarToggleButton`,
    `AppBarSeparator` and `CommandBar` join the seven this file already listed: `find
controls/dev -name 'AppBar*'` matches three `*_themeresources.xaml` files and nothing
    else, and there is no `CommandBar.cpp` either.

    **What the version cost that its goal did not predict.** Six of the eight things that
    changed a control were found by a browser or by the guest, and none by a gate:

    - **A plain `let` a template reads is not reactive in runes mode.** SplitButton's
      `keyDown` flipped correctly and `TouchPressed` never once appeared. Build, check, lint,
      nine gates and a cold diff read were all green; the declaration is well-formed.
    - **A TypeScript annotation in _markup_ does not survive packaging.** `svelte-package`
      preprocesses script bodies and `strip-script-lang.mjs` takes the attribute off the tag;
      neither touches a `{#snippet}` parameter's type. `pnpm check` reads `src` and passes.
    - **A part with no explicit grid placement does not stay in the cell its template gives
      it.** `ContentViewbox`, `OverflowTextLabel` and `OverflowCheckGlyph` carry no `Grid.Row`
      or `Grid.Column`, which in XAML means row 0 column 0 and in CSS means the next free
      cell. An overflow label measured 245px from its row's left edge where it belongs at 12.
    - **`content` on a real element renders nothing.** Both AppBarButton chevrons carried
      their glyph token on the element rather than on a pseudo-element and neither drew.
    - **A `$effect` that writes to a parent's `$state` list depends on that list**, so a
      registration written inside one registers and then unregisters itself as its peers
      arrive. A four-command overflow menu left its presenter holding one shape.
    - **The closed command bar's height is a clip**, which the reference settled and no
      reading of the template would have: the row is 48 and the commands in it are 64.

    The three baselines this version threw away and re-photographed were each thrown away
    because the review pass read the image rather than trusting the suite that had just
    written it — a checked overflow row painted accent blue with a tofu box where its
    checkmark belongs, an ellipsis eight pixels below the icons beside it, and two harness
    rows demonstrating a column while their menus were shut. Every gate and every probe row
    was green on all three. **None of that is D5's human side-by-side**, which this version
    did not have: it is the reviewing agent reading its own output, which catches a wrong
    render and cannot tell a right one from the original.

    **What this version leaves owed, beyond the table below.** `SplitButtonCommandBarStyle`
    (`SplitButton_themeresources.xaml:104`), which `CommandBar_themeresources.xaml:108` and
    `:109` rebase `SplitButton` and `ToggleSplitButton` on inside a bar, is defined and
    unbuilt: nothing on the Gallery's CommandBar page uses a SplitButton, so it is off the
    acceptance surface and belongs with CommandBarFlyout. `KeyboardAcceleratorTextMinWidth`
    (`AppBarButton_themeresources.xaml:374`) is the width a CommandBar computes once for a
    whole menu so its accelerators align down the column; that arithmetic is in code the pin
    does not carry, and the component records the omission where the rule is. And the older
    components' focus bands carry a `c1-allow` on `inset`, which C1's scope excludes and which
    it therefore never reads — a sweep, noted rather than done.

    Eleven controls, and every one of them is a button or a container of buttons. The tranche
    is `Button`'s surface widened in two directions — what a single button can be, and how a
    row of them is held — which is why it is one version rather than three.

    Three of the eleven were not in this entry when the roadmap was written. ToggleSplitButton
    is `SplitButton.xaml:246`, a `Style` whose entire body is
    `BasedOn="{StaticResource SplitButtonStyle}"`: it is the same template, and building
    SplitButton without it would leave a control on the table for the price of a checked
    state. HyperlinkButton and RepeatButton are the two remaining `ButtonBase` restyles in
    `CommonStyles/`, and until this version no tranche named them at all — see the roadmap gap
    recorded after this list.

    **What the pin can and cannot say**, which is `docs/surface.md`'s step 1. Four of the
    eleven have an implementation under `controls/dev` — DropDownButton, SplitButton,
    ToggleSplitButton and MenuBar. The other seven are `Windows.UI.Xaml` controls WinUI 3
    restyles, and `CommonStyles/*_themeresources.xaml` is the whole of what the pin carries
    for them — the position seven of the twelve earlier controls are already in. For those
    seven the Gallery's sample page is the only enumeration of the surface and the sweep's
    steps 2 and 3 do not apply; each unit says so rather than leaving the absence
    unexplained.

    The fourth of the four was nearly missed, and the near-miss was the procedure's fault
    rather than the reader's. Step 1 as written was `ls controls/dev/<Control>/`, and
    ToggleSplitButton has no directory: it lives in `SplitButton/`, and its resources are in
    `SplitButton/SplitButton_themeresources.xaml` rather than in `CommonStyles/`. A directory
    lookup answers "no second half" for it, and a wrong verdict of that shape reads in a unit
    exactly like a right one. Two more controls are in the same position and both are still
    ahead of this project — `BreadcrumbBar` under `Breadcrumb/` in v8, `ItemsRepeater` under
    `Repeater/` in v9. Step 1 now searches for the file rather than for a directory of that
    name, and `docs/surface.md` records why.

    Of the four that do have code, three say something visual and one says nothing:

    - **DropDownButton is its template.** `DropDownButton.cpp` registers the flyout's opened
      and closed events, tracks a bool, and raises an automation property. No `GoToState`, no
      visibility, no template child, nothing drawn. The chevron and every state are XAML.
    - **SplitButton's visual state machine is in code.** `SplitButton.xaml` declares
      twenty-one `VisualState`s, seventeen of them on the control itself —
      `PrimaryPointerOver`, `SecondaryPressed`, `CheckedFlyoutOpen`, `SecondaryButtonSpan`
      among them — and `SplitButton.cpp:123-215` enters all seventeen by name while no XAML
      trigger enters any. The code decides which half the pointer is over, whether the flyout
      is open, and, through `m_isKeyDown`, that a keyboard press lights **both** halves where
      a pointer press lights one. This is step 3 of the sweep in its pure form: a unit reading
      only the template would ship a control with a dead state machine and a green baseline,
      because the resting state is the one a screenshot photographs. The other four
      declarations, at `:41-52`, are on the nested inner `Button` style, are entered by the
      framework's own `ButtonBase` machinery rather than by SplitButton, and do one thing —
      set `AnimatedIcon.State` on the chevron.
    - **ToggleSplitButton supplies the condition SplitButton branches on.**
      `ToggleSplitButton.cpp:60-63` implements `InternalIsChecked()`, the virtual
      `SplitButton.cpp:149,190` tests to reach the seven `Checked*` states; `:53-58` overrides
      `OnClickPrimary` so the primary half toggles before it clicks; `:20-27` re-runs the
      state update on every `IsChecked` change. Unit 3 reads both files or it gets the checked
      half of a shared template wrong.
    - **MenuBarItem drives its own selection.** `MenuBarItem.cpp:409-423` enters `Pressed`,
      `PointerOver` and `Selected`, where `Selected` means this item's own menu is open.

    **Two chevrons in this tranche are animated icons, and WD-006 already holds the
    decision.** DropDownButton's is an `AnimatedIcon` at `DropDownButton.xaml:93` and
    SplitButton's at `SplitButton.xaml:230`, both `AnimatedChevronDownSmallVisualSource`, and
    both state their own `FallbackIconSource` in the template —
    `SymbolThemeFontFamily`, `FontSize="8"`, `Glyph="&#xE96E;"`. That is the position
    Expander's chevron is already in, and the registry's answer is to render the fallback,
    which is not an approximation but the icon WinUI itself paints wherever the animated
    source cannot run. So units 2 and 3 owe **two more names on WD-006's `Control` line**
    rather than a new entry — and they owe the measurement Expander's row made a habit of,
    because the fallback glyph's ink is not always the animation's resting frame and this
    chevron, at eight pixels against Expander's twelve, has never been measured.
    AppBarButton's `SubItemChevron` is a plain `FontIcon` and needs none of this.

    **The icon surface, decided once for the tranche — D25, and ADR 0012 carries it.**
    `AppBarButton.Icon` and `AppBarToggleButton.Icon` take an `IconElement`, and the Gallery
    spends four of AppBarButton's six examples and three of AppBarToggleButton's four on which
    kind it is. Reading those examples rather than assuming them is what settled the decision:
    the `FontIcon` one is `FontFamily="Candara" Glyph="&#x03A3;"` on both pages — a Greek sigma
    in a text font, chosen to show that a `FontIcon` need not be the icon font — and both
    `PathIcon` examples set `.Content` inside a `Viewbox` rather than `.Icon` at all. So this
    library's existing `glyph`, a Segoe Fluent Icons code point, expresses **none** of them as
    written, including the one a reader would assume it covered.

    `icon?: Snippet` is therefore the prop, and it is ADR 0009 applied rather than excepted
    from: an element-valued member is content, and content is a snippet. `glyph?: string`
    stays as the recorded shorthand, because it is what the **bars** use rather than what the
    icon pages demonstrate — CommandBar's page writes `Icon="Add"`, `Icon="Edit"`,
    `Icon="Share"`, `Icon="Setting"`. Where both are given, `icon` wins.

    Two things follow that this version owes rather than assumes. ADR 0009 declared its
    exception set **closed**, and `glyph` is in neither that set nor the WinUI member
    vocabulary — so three sealed components have been outside the stated rule since the first
    of them shipped, unrecorded. ADR 0012 reopens the set once and says so. And the rule
    reaches item-data fields, not only component props, because `MenuFlyout`'s five entry types
    and `NavigationViewItemData` are where two of the three existing `glyph`s live: unit 7
    gives `MenuFlyout` its `icon`, since a MenuBar menu can hold any `IconElement`, and
    `NavigationView` and `TeachingTip` are owed theirs and are listed below rather than left
    to be rediscovered.

    The units, in dependency order:

    1. **ToggleButton, HyperlinkButton, RepeatButton.** Three restyles of `Button`, each that
       control's template with one thing changed: a checked and an indeterminate state, an
       accent foreground with no border, and a press that repeats. **No bits-ui primitive**,
       which the spec stage established rather than the plan: bits-ui `Toggle` carries a
       boolean `pressed`, and WinUI's ToggleButton is three-state — four of its twelve visual
       states are `Indeterminate*`, and `IsThreeState` is a member. HTML has the three-valued
       spelling already, `aria-pressed="true|false|mixed"`, and `CheckBox.svelte` set the
       precedent by taking `checked`, `indeterminate` and `threeState` over a native element
       rather than over a two-state primitive. Button itself uses no primitive either.
       **One spec, three commits** — they share a template ancestry and are worth specifying together, but
       three controls are three intents and §7 does not bend for adjacency. RepeatButton's
       repeat is this tranche's first behaviour no screenshot can photograph; its commit
       records how the control was driven instead.
    2. **DropDownButton.** A `Button` with a chevron that shows a flyout. Its unit supplies
       the flyout from this library's existing MenuFlyout and Flyout rather than inventing a
       host: upstream's `Flyout` property takes either, and both are built.
    3. **SplitButton and ToggleSplitButton.** One template, two controls, and the unit's real
       work is the state machine the C++ holds rather than the two boxes. Three things in it
       are not guessable from the template:

       - **Touch and keyboard both light both halves.** `SplitButton.cpp:152` and `:186` test
         `m_lastPointerDeviceType == Touch || m_isKeyDown`, so `TouchPressed` and
         `CheckedTouchPressed` are entered by a touch press _and_ a key press. The mouse is
         the one input that lights a single half.
       - **A key press also moves which half is clicked.** `m_isKeyDown` enters
         `SecondaryButtonSpan` (`SplitButton.cpp:121-123`), which at `SplitButton.xaml:211-216`
         sets the secondary button's `Grid.Column` to 0 and `Grid.ColumnSpan` to 3 — it covers
         the whole control. So while a key is held the flyout half _is_ the button. That is a
         hit-target change, not a paint change, and no screenshot of a resting control shows it.
       - **Gamepad A rides the keyboard path.** `SplitButton.cpp:324-332` sets `m_isKeyDown`
         for `Space`, `Enter` and `GamepadA` alike, so a game controller is not wholly deferred
         here the way the input-mode row below might suggest.

    4. **AppBarButton, AppBarToggleButton, AppBarSeparator.** The three things a command bar
       holds — and each of the first two has **two appearances**, which is this unit's real
       size rather than its icon and label.
       `CommonStyles/AppBarButton_themeresources.xaml` gives `ApplicationViewStates` four
       states for the button as a bar command — `FullSize`, `Compact`, `LabelOnRight`,
       `LabelCollapsed` at `:149-185` — and four more for the same button drawn as a row in an
       overflow menu at `:195-228`, which `CommonStates` then serves with its own
       `OverflowNormal`, `OverflowPointerOver`, `OverflowPressed` and `OverflowSubMenuOpened`
       at `:278-310`. A `FlyoutStates` group at `:345-347` shows or hides a `SubItemChevron`,
       the control's own submenu affordance, which is on the acceptance page at
       `AppBarButtonPage.xaml:106`.

       **The overflow appearance belongs to this unit, not to unit 6.** It is a state of the
       button; the bar only decides where the button is. A unit 4 that sealed the bar
       appearance alone would hand unit 6 a control it cannot put in an overflow menu, and
       unit 6's "secondary commands as menu rows" is precisely those eight states.

    5. **CommandBar, closed.** The row itself: primary commands, `ClosedDisplayMode`,
       `DefaultLabelPosition`, `OverflowButtonVisibility`, and the bar's own metrics. Built on
       bits-ui `Toolbar`.
    6. **CommandBar, open.** The overflow surface: secondary commands as menu rows, `IsOpen`,
       `IsSticky`, and the portalled presenter carrying its own ramp class per the rule v4 left
       behind.

       **The split is because of the weight, and the entry would be dishonest to name the
       weight and not act on it** — 1031 lines of theme resources against the next control's
       495, plus AppBarButton's eight overflow states arriving from unit 4. v6 split MenuFlyout,
       a smaller control, across five sweep entries. One cold review of all of it is a review
       that skims.

       **The five properties come from three sources, and the entry should not have listed
       them as one.** `ClosedDisplayMode` (`CommandBar_themeresources.xaml:86`) and
       `OverflowButtonVisibility` (`:838`, through
       `CommandBarTemplateSettings.EffectiveOverflowButtonVisibility`) are in the pin and not
       on the acceptance page. `IsOpen` and `DefaultLabelPosition` are on the page
       (`CommandBarPage.xaml:51` and `:50`) and not in CommandBar's resources —
       `DefaultLabelPosition` appears only in CommandBarFlyout's and MediaTransportControls'.
       `IsSticky` is in neither: it exists on the page as a code substitution at `:108-111`
       that no option control ever sets, so it is never true there. It is read from the
       reference or it is not read at all, and no baseline can photograph it.

       **Unnamed scope, on the acceptance page.** `CommandBarPage.xaml.cs:63` and `:116` add
       and remove secondary commands at runtime. The deferral table below declines
       _width-driven_ overflow; commands appearing and disappearing under a button is a
       different thing and unit 6 builds it.

    7. **MenuBar and MenuBarItem.** A row of items, each opening a MenuFlyout, with the
       hover-crossing behaviour a menu bar has and a single flyout does not — moving the
       pointer to a sibling item while a menu is open switches menus without a click. Built on
       bits-ui `Menubar`, which owns exactly that. This unit also gives `MenuFlyout` the `icon`
       prop ADR 0012 defines, because a MenuBar menu can hold any `IconElement`.

    **Done-when**, applied per unit: the control is snapshotted in all three themes and
    compared against the original on the reference guest; every prop follows D21 as ADR 0012
    amends it, with its TSDoc naming the WinUI member — or, for `glyph`, naming ADR 0012; the
    surface sweep is done and recorded **before** the seal, including its step-1 verdict for
    the seven controls that have no second half; and the nine gates are green.

    **Five things in this tranche no screenshot can reach**, and for each the unit records how
    the control was driven instead, because v4 established that a snapshot suite is a bar on
    the resting state and nothing since has widened it:

    - RepeatButton's repeat, which is a timer;
    - SplitButton's key-down `SecondaryButtonSpan`, which changes the hit target rather than
      any pixel of the resting control;
    - SplitButton's touch press, which needs a touch pointer to reach `TouchPressed` at all;
    - CommandBar's `IsSticky`, which the acceptance page never sets true and the pin never
      mentions — it is read from the reference or it is not read;
    - MenuBar's hover crossing, which exists only while a menu is open.

    **What this version will not build.**

    | control                          | not yet built                                                        |
    | -------------------------------- | -------------------------------------------------------------------- |
    | AppBarButton, AppBarToggleButton | `KeyboardAccelerator` as an input; the label draws the override text |
    | AppBarButton, AppBarToggleButton | `InputModeStates`, which is narrower than it sounds — **WD-020**     |
    | CommandBar                       | dynamic overflow: commands moving into the menu as the bar narrows   |
    | CommandBar                       | `AppBarElementContainer`, which hosts a non-command element          |
    | MenuBar                          | `KeyboardAccelerator` as an input, as AppBarButton                   |
    | NavigationView, TeachingTip      | `icon`, ADR 0012's general form — both carry `glyph` only today      |

    **The input-mode row is narrow, and an earlier draft of it was a trap.** Only AppBarButton
    and AppBarToggleButton declare `InputModeStates`; the other nine controls have no such
    group. And what its two states do is one thing: `TouchInputMode` and
    `GameControllerInputMode` both set `OverflowTextLabel.Padding` to
    `AppBarButtonOverflowTextTouchMargin`, `AppBarButton_themeresources.xaml:324-336`, and only
    on the overflow appearance. So it is not eleven controls' padding, it is one label's, in
    one of two appearances, under a condition the web half-expresses — `@media (pointer: coarse)`
    is `TouchInputMode`, and a game controller driving a fine pointer is not a case a browser
    has. Unit 4 decided it: **WD-020**, declined. The condition is the device of the last
    input _event_, which the XAML framework keeps as one global mode; `pointer: coarse`
    describes a device capability instead and is wrong in both directions on hybrid hardware,
    and a game controller has no web analogue at all.

    The draft this replaced said "all eleven — the touch and game-controller padding
    variants", and SplitButton has `TouchPressed` and `CheckedTouchPressed` at
    `SplitButton.xaml:90,153`, entered at `SplitButton.cpp:156,190`. Those are two of the
    seventeen states unit 3 exists to build, they change a background rather than a padding,
    and they have nothing to do with `InputModeStates`. A blanket row would have told unit 3's
    author to skip them, and the baseline would have agreed.

    **Every row above needs a destination, and this is where the roadmap gap bites.** This
    entry was written as though it closed "Menus & toolbars", and it does not: four of that
    group's ten pages are in the unscheduled list below, and CommandBarFlyout is the natural
    home of both `KeyboardAccelerator` rows, because a command bar flyout is where an
    accelerator is drawn at its largest. These are therefore deferrals to a version that does
    not yet exist rather than to one that does — a weaker promise than v4's deferral table
    made, and the honest one, because a deferral whose destination is unnamed is a decline
    that has not admitted it. Naming the destination is what the list below is for.
    Scheduling it is a decision for whoever plans v8.

8.  **Navigation** — BreadcrumbBar, Pivot, SelectorBar, TabView, and NavigationView's top
    display mode. NavigationView itself was v2.

    Goal: **the application can say where the user is, and move them between peers.**

    **This is the first tranche that empties a Gallery group.** The Navigation group holds
    five pages — `data/winui-gallery-shell.json:645` — and NavigationView is v2's, so the
    group closes when this version does. Every tranche before it took a slice of one group or
    reached across two, which is D22 working as designed and is also why none of them could be
    checked against a group boundary. This one can, and the check is worth stating as a
    Done-when rather than as an observation: **every control the five entries demonstrate
    exists in the library at the end of v8**, read off the five sample pages rather than off
    this heading.

    **What that check is not, corrected after two of the units were already sealed.** The
    entry first wrote it as "a page still rendering the placeholder frame at the end of v8 is
    a failure of it", which is not reachable from here and was not reachable when it was
    written. No control page in the shell renders anything but the placeholder frame today,
    for every tranche and not only this one, because the frame those pages are built on —
    `ControlExample`'s three panes and `SampleCodePresenter` — is **roadmap item 10**, and
    that item names SelectorBar and Expander as controls it finds already built. A group of
    pages therefore cannot close before item 10 regardless of which controls exist, and a
    Done-when that says otherwise fails every version that meets it. **A group boundary is a
    property of the component library; a page is a property of the frame.** The two are one
    sentence apart in the roadmap and belong to versions two apart, which is how the
    conflation survived being written down and read back twice.

    **A fifth deliverable is already owed, and this entry is where it surfaces.**
    `scripts/tokens/manifest.mjs:66` defers "every `Top*` key, `NavigationViewTopPane*`, and
    the two overflow-button styles" by name to _the Navigation tranche_, which is this one.
    Nothing in this file recorded it until this entry — the string `PaneDisplayMode` occurs
    nowhere above — and the Gallery's own page sets `PaneDisplayMode="Top"` on two samples
    (`NavigationViewPage.xaml:123,196`) and switches three more into it from code (`:309-320`).
    The top pane is on the surface the acceptance gate walks, and it is v8's.

    **The component states a reason for the absence, and it is not the reason.**
    `NavigationView.svelte:31` says `Top` is missing from `NavigationViewPaneDisplayMode` "for
    the same reason it is absent from `NavigationViewDisplayMode`". The two enums are not in
    the same position. `NavigationViewDisplayMode` is the mode the control _computed_ and
    upstream gives it three members — `Minimal | Compact | Expanded` — with no `Top` to leave
    out; `PaneDisplayMode` is the one the consumer _sets_ and `Top` is a member of it. One
    enum is complete and the other is short by one, and the comment reads them as the same
    fact. **A deferral written as a completeness claim is invisible to the reader who would
    otherwise schedule it**, which is how this one survived from v2 to v7: it was found by
    reading the token manifest, not by reading the component that carries the gap.

    The units, in dependency order. The first three are independent of each other and of
    everything else in the library; the last three are ordered last for three different
    reasons.

    1. **BreadcrumbBar, BreadcrumbBarItem, and the ellipsis flyout.** The control template is
       one line — an `ItemsRepeater`, `BreadcrumbBar.xaml:334` — and every visual is in
       `DefaultBreadcrumbBarItemStyle` at `:3-326`, where one template carries the crumb in
       four appearances: an inline crumb with a chevron, the last crumb with neither chevron
       nor button (`PART_LastItemContentPresenter`, `:285`), the ellipsis crumb itself
       (`PART_EllipsisTextBlock`, `:273`), and a row inside the flyout the ellipsis opens
       (the `EllipsisDropDown` item-type state, `:25`). The chevron is `&#xE974;` at 12px with
       `2,0` padding, and `BreadcrumbBarChevronRightToLeft` is its mirror for RTL.
       **The dropping is not in the template.** `BreadcrumbLayout.cpp:101-110` accumulates
       crumb widths from the right against the available width and returns the first index it
       can still arrange; `:139-184` then arranges the ellipsis before it. Nothing in the XAML
       says a crumb is ever hidden. This is the sweep's step 3 in the same pure form
       SplitButton's state machine was, and it is this version's one real measurement job:
       the web equivalent is a `ResizeObserver` and the unit says so, or it declines the
       collapse and writes a `WD-`. It does not get to leave the question unasked, because
       the resting state of a bar that fits is identical either way and the baseline agrees
       with both.
       The flyout's presenter is styled inline at `:113-152` over
       `BreadcrumbBarEllipsisFlyoutPresenterBackground`, which aliases
       `AcrylicBackgroundFillColorDefaultBrush` — already emitted, already read by MenuFlyout,
       so no new material question and nothing WD-003 reaches.

    2. **SelectorBar and SelectorBarItem.** The smallest control in the tranche and the one
       carrying its trap; see below. Its selected item draws an accent pill, and the pill is
       the one number in this tranche a reader will get wrong from the resources alone:
       `SelectorBarItemPill` sizes the rectangle 4 wide by 3 tall
       (`SelectorBar_themeresources.xaml:96-97`) at `Opacity="0"`, and the three `Selected*`
       states fade it in and scale it to **4x on X** over 167ms
       (`SelectorBar.xaml:108-113`) — so what is on screen under a selected item is 16px
       wide, and the resource says 4. `SelectorBarItemPadding` is `12,10,12,7`, asymmetric
       top to bottom, and that bottom 7 is the room the pill sits in.

    3. **Pivot, PivotItem and PivotHeaderItem.** The odd control of the four in every respect.
       Its whole template is in `CommonStyles/Pivot_themeresources.xaml:207` to the end of
       that file — WinUI 3 restyles it and carries no implementation — and its brushes are
       `SystemControl*` legacy names almost without exception (`:19-63`), which is D17 and
       ADR 0008's table rather than anything new. Its header is 24px `SemiLight` with `-25`
       character spacing, a ramp entry nothing else in this library uses.
       Three groups in that template are behaviour a still image cannot photograph and the
       unit decides each on the record rather than by feel: `HeaderStatic` against
       `HeaderDynamic` (`:299-300`), the `PreviousButtonVisible`/`NextButtonVisible` carousel
       arrows (`:277-298`), and `Portrait` against `Landscape` (`:244-259`). The Gallery
       demonstrates exactly one Pivot, four headers wide, in one example
       (`PivotPage.xaml:14-27`) — so the acceptance surface is the static header row, and
       everything else is a decision to declare, not to build silently.

    4. **TabView and TabViewItem** — the strip and the tab. The largest unit this project has
       specified: a 649-line template, 270 lines of resources, and `TabViewItem.cpp` entering
       eleven states by name against `TabView.cpp`'s four. The tab's own geometry is settled
       and small — `TabViewItemHeaderPadding` `8,3,4,3`, the selected tab one pixel wider on
       three sides at `9,3,5,4`, `TabViewItemMinWidth` 100 and `TabViewItemMaxWidth` 240 — and
       what makes the unit large is that the close button is a fifth control with its own
       eight-brush family and its own visibility state machine (`TabViewItem.cpp:255-277`).
       The bottom border line is drawn in three places that must agree (`TabView.xaml:36-37`,
       `:118-123`, `:155-156`) and `TabView.cpp:343-354` turns all three off together while a
       tab is being dragged.

    5. **The strip's chrome** — the add button, the two scroll buttons, `TabWidthMode` and
       `CloseButtonOverlayMode`. Split from unit 4 because they are a second intent and §7 does
       not bend for adjacency, and because the scroll buttons are not part of any collections
       control: they are two `RepeatButton`s inside the `ScrollViewer` style at
       `TabView.xaml:157-165`, which this library already has the control for. The Gallery
       gives `TabWidthMode` and `CloseButtonOverlayMode` an options pane each
       (`TabViewPage.xaml:239-249`, `:285-297`), so both are on the surface with every value
       shown — three and three. The first pane is labelled `TabWidthBehavior` and the member
       is `TabWidthMode`; the spec uses the member, and the harness row uses the label,
       because the acceptance gate compares what the page says.

    6. **NavigationView's top pane.** Last, because it re-opens a control whose baselines four
       versions of work already photograph, and a widening that lands mid-tranche makes every
       intervening failure ambiguous. It is `NavigationViewPaneDisplayMode` gaining `'top'`,
       the `Top*` and `NavigationViewTopPane*` keys manifest.mjs is holding, and the overflow
       button that takes the items the top row cannot fit — which is the same width-driven
       collapse unit 1 solves for crumbs, and the two units should agree rather than each
       invent one.

    **What the pin carries — `docs/surface.md` step 1, and it is the reverse of v7's answer.**
    Three of the four controls have a full implementation under `controls/dev`: `Breadcrumb/`
    (found by file, not by directory name — the near-miss v7 recorded), `SelectorBar/` and
    `TabView/`. Only Pivot has none, and unlike v7's seven that is not because the Gallery
    page is the sole enumeration: the pin carries Pivot's whole template in `CommonStyles/`,
    so the missing half is code, not shape. Where v7 had to say "the pin says nothing" eight
    times, v8 has to read three C++ implementations, and `TabView.cpp` alone is 2301 lines.
    **Budget the sweep, not the template.**

    **The trap in this tranche is SelectorBarItem, and it is ToggleSplitButton's shape again.**
    `SelectorBarItem.cpp` contains no `GoToState` and no `VisualStateManager` — a reader
    grepping the control's own file concludes its eight `CombinedStates` are entered by XAML
    triggers, and ships a control that never leaves `UnselectedNormal`. `SelectorBarItem.h:12`
    derives it from `ItemContainer`, and `ItemContainer.cpp:185-220` is what enters
    `SelectedPointerOver`, `UnselectedPressed` and the rest. The sweep's step 1 has to follow
    the base class, and `docs/surface.md` gets that sentence the way it got "search for the
    file, not the directory".

    **D26 — a template's internal items host is not this library's surface.** Three of the four
    controls hold a collections control inside their own template: `ItemsRepeater`
    (`BreadcrumbBar.xaml:334`), `ItemsView` (`SelectorBar.xaml:30`) and `TabViewListView`
    (`TabView.xaml:39`). None is a member a consumer sets, each is template-private, and each
    is there for virtualisation that a bar of five crumbs and a strip of eight tabs does not
    need. v8 renders the items directly, and the Collections tranche does not come back to
    retrofit them. The rejected alternative was to reorder the roadmap and build v9 first,
    which buys correctness this tranche cannot spend: what these hosts contribute visually is
    padding and a scroll viewport, and both are cheaper to write than to inherit.
    This does not cover a collections control a **page** uses as content — SelectorBar's third
    example is an `ItemsView` of `ItemContainer` colour swatches
    (`SelectorBarPage.xaml:59-79`) and that is genuinely v9's; the page carries the deferral.

    **What this version is likely to decline, decided in the units and not here.** TabView's
    tear-out sample opens a second OS window (`TabViewWindowingSamplePage`), which a page
    cannot do; Pivot's carousel arrows and its `PivotHeaderItemLockedTranslation` of 40 are
    Windows-Phone-era behaviour the Gallery never demonstrates; and `CanReorderTabs` is a drag
    the web can express and may still not be worth its weight. Each is a `WD-` with a
    measurement behind it or it is built — the one thing none of them may be is unmentioned.

    Done-when is v7's, applied to five controls and one widening: each snapshotted in three
    themes, each compared against the original on the reference guest, every prop following
    D21 as ADR 0012 amends it, the surface sweep's step-1 verdict recorded before the seal —
    and, this version only, every control named by the Navigation group's five sample pages
    present in `packages/winui-svelte/src/lib/index.ts`. The pages themselves are item 10's.

    **The question v7 left for whoever planned v8, answered: no.** That entry closed by
    handing on four unscheduled Menus & toolbars pages — CommandBarFlyout, SwipeControl,
    StandardUICommand, XamlUICommand — and the two `KeyboardAccelerator` rows whose natural
    home is the first of them. v8 does not take them. They are not navigation, they would
    make this the second tranche in a row about commands, and the honest reason the question
    was asked at all is that the roadmap has no version to hand them to. That is still true,
    and it is still recorded in the gap list below rather than resolved here. What v8 owes
    the next planner is the same courtesy in a narrower form: **the destination is a
    scheduling decision, and a tranche that inherits one and neither takes it nor re-states
    it is how a deferral becomes a decline nobody made.**

    **Closed.** Five controls and one widening exist and are exported. `PaneDisplayMode` now
    carries all five members its IDL declares, the `Top*` and `NavigationViewTopPane*` keys
    `scripts/tokens/manifest.mjs` had been deferring since v2 are seeded, and the Navigation
    group's five sample pages name no control the library does not have — which was this
    version's own extra Done-when and the first time a group boundary has been checkable at
    all. Thirty-nine components render under the three themes, forty-three baseline sets pass
    on the reference guest, the nine gates are green and the packed consumer builds.

    **What the version cost that its goal did not predict.** Four findings, and three of them
    are one finding growing a clause per unit.

    - **The rule about reading an upstream `Style` now has four clauses, and each cost a
      unit.** A `Style` setter is not layout until some element in the template binds it (u2,
      `SelectorBarItemBorderThickness`). Binding it is not enough if an always-entered visual
      state overwrites it (u4, `TabViewItemHeaderPadding`). A value can be layout while
      appearing in no setter, no binding and no state at all (u5, the eight pixels before the
      strip's first tab, composed from four boxes none of which is a resource). And **a
      `Style` can be defined in the pin and applied by nothing in it** (u6):
      `MUX_NavigationViewSettingsItemStyleWhenOnTopPane` sizes the top pane's settings button
      40 by 40 and the reference measures 36 by 36, because nothing applies that style and the
      item goes through the ordinary presenter's `IconOnly` state instead. Every one of the
      four was found by measuring the original, and none by reading the template.
    - **Three of the four controls hold a collections control inside their own template**, and
      D26 is the decision not to inherit it. What those hosts contribute visually is padding
      and a scroll viewport, and both were cheaper to write than to inherit.
    - **A group boundary and a page are two different things, and this entry conflated them**
      until two units had already sealed. No control page renders anything but the placeholder
      frame in any tranche, because that frame is roadmap item 10. What survives is a claim
      about the library, which is the claim the Done-when above now makes.
    - **A deferral written as a completeness claim is invisible to whoever would schedule
      it.** The top pane was owed from v2 and appeared in no plan for five versions, because
      `NavigationView.svelte` stated its absence as a fact about an enum rather than as work
      not done. It was found by reading the token manifest, not by reading the component that
      carried the gap.

    **What this version leaves owed.** None of these is a divergence; each is simply not
    built, and each is on a page the acceptance gate will eventually walk.

    | control        | not yet built                                                                     |
    | -------------- | --------------------------------------------------------------------------------- |
    | NavigationView | `FooterMenuItems` — a second item list, in either pane                            |
    | NavigationView | `PaneCustomContent`, `PaneHeader`, `PaneTitle`, and the pane's `AutoSuggestBox`   |
    | NavigationView | `OverflowLabelMode`, whose two styles differ by a glyph size and drop both labels |
    | TabView        | tear-out, `CanReorderTabs`, and the rest of unit 5's table                        |

    `WD-025` is the one thing declined rather than postponed: an item's children are not
    expanded on the top pane, because that subtree is a second portalled surface per item and
    the overflow flyout is the one this version's Done-when compares against the original.

    **The debt unit 1 opened is half paid.** The collapsed BreadcrumbBar was still not
    photographed against the original, but the obstacle is now measured rather than unknown.
    The Gallery's window can be resized from here after all — `Alt+Space`, `s`, `Right`, then a
    run of `Left` presses chained into one VNC invocation — and its minimum width is about 625,
    which is wider than the point at which either the top pane's four items or the bar's crumbs
    stop fitting. The technique exists; the window is the wall.

9.  **Collections** — ItemsRepeater, ItemsView, ListView, GridView, TreeView and FlipView,
    plus the two item containers that carry every one of their pixels.

    **The goal, in one line: a collection is the consumer's own items drawn by a template the
    consumer writes.** Every items-taking control this library has shipped narrows that away.
    `MenuFlyoutEntry`, `NavigationViewItemData`, `TabViewItemData`, `SelectorBarItemData` and
    the rest are plain records with a fixed set of fields, and the phrase "narrowed to plain
    records" appears in five components because the narrowing was right five times: a menu item
    really is a glyph, a label and a callback. It is wrong here. `ItemTemplate` is not a corner
    of ListView, it is the whole of what ListView does, and a control that only draws records
    this library declared is not the control the Gallery page shows.

    So the tranche opens by widening the contract rather than by drawing anything, and
    **ADR 0013** is where that lands: a collection control is generic in its item type, takes
    `items: T[]` and an `item` snippet, and identifies an item by a caller-supplied key rather
    than by a field named `id`. The escape it replaces is `unknown[]`, which type-checks and
    tells the consumer nothing.

    That the packaging survives it was verified before this entry was written, not assumed —
    `principles` §9, on the toolchain rather than on a dependency. A `<script lang="ts"
generics="T">` component through `pnpm --filter winui-svelte build` reaches `dist` with
    `generics="T"` intact and `lang="ts"` stripped by `scripts/package/strip-script-lang.mjs`,
    emits a fully generic `.d.ts`, compiles under `svelte/compiler` with zero warnings, and
    passes `publint`. The one residue is an `export {};` left in the packaged script, which is
    inert. Had any of that failed, the ADR would have had to choose differently, and it would
    have found out in unit 9 rather than here.

    **What the pins carry — `docs/surface.md` step 1, and this group answers in three ways
    where the file's table has two.**

    | control                                                                            | pin C++     | XAML visual tree                       |
    | ---------------------------------------------------------------------------------- | ----------- | -------------------------------------- |
    | ItemsRepeater, StackLayout, UniformGridLayout, LinedFlowLayout                     | `Repeater/` | none needed — a layout draws nothing   |
    | ItemsView, ItemContainer                                                           | yes         | `ItemsView.xaml`, `ItemContainer.xaml` |
    | TreeView, TreeViewItem                                                             | yes         | `TreeView.xaml`, `TreeViewItem.xaml`   |
    | ListView, GridView, FlipView, FlipViewItem, ListViewHeaderItem, GridViewHeaderItem | none        | `generic.xaml`, in full                |
    | **ListViewItem, GridViewItem**                                                     | none        | **none, in either pin**                |

    The last row is this version's headline risk and it is a category `docs/surface.md` does not
    yet name. `DefaultListViewItemStyle` (`generic.xaml:27524`) has exactly one element in its
    template: a `ListViewItemPresenter` configured by some fifty brush, opacity and enum
    properties. That presenter has no `ControlTemplate` anywhere in either pin — it is drawn by
    the framework's own C++, which is not in `microsoft-ui-xaml` because ListViewItem is a
    `Windows.UI.Xaml` control. **Every number in the item's chrome — where the selection
    indicator sits and how big it is, how far the check mark insets the content, what the hover
    fill's inset is — exists in no file this project can read.** The brushes and a handful of
    sizes are in `ListViewItem_themeresources.xaml`; the geometry is not, and step 4 with the
    reference machine is the only source for it. Unit 5 exists because of this row, and its
    spec cannot be written before the measuring is done.

    **The trap is `ListViewItemExpanded`, and it is v8's fourth clause with a costume on.**
    `ListViewItem_themeresources.xaml:261` holds a complete, readable, tempting XAML tree for
    exactly the item unit 5 has to invent: `BorderBackground`, a `ContentPresenter`, a
    `MultiSelectSquare` 20 by 20 with a 2px border at `Margin="12,0,0,0"`, six named common
    states. Nothing in either pin applies it — `grep -rn ListViewItemExpanded .upstream/`
    returns the definition and nothing else — and its design is a generation older than the
    control on screen, which has a rounded 3px check box, a 4px corner radius and a selection
    indicator bar the old tree has no element for. Transcribing it would produce a Windows-8-era
    item that passes every gate. **Read it for the state names; take no number from it.**

    **The units, in dependency order.**

    1. **ItemsRepeater, StackLayout, and the item-template contract.** First because it is the
       contract with nothing else attached: a repeater has no chrome, no selection, no scroll
       viewport and no states — it is items, a template and a layout, which is exactly what
       ADR 0013 has to get right. The ADR is written in this unit and cited by the eight that
       follow. `StackLayout` is two properties, `Orientation` and `Spacing`
       (`ItemsRepeater.idl:481-483`), and it is a flex line with a gap.

    2. **UniformGridLayout.** Split out of unit 1 after reading it, and the reading is the
       argument: this layout is not "the grid version of a stack". Every cell in it is one
       uniform size, and where `MinItemWidth`/`MinItemHeight` are unset that size is **measured
       from the first item** — `UniformGridLayoutState::SetSize` takes item 0's desired size
       whenever the layout's own value is `NaN`, which is what the member defaults to
       (`UniformGridLayout.h:144`) whatever the IDL's `MUX_DEFAULT_VALUE` says. So a faithful
       reproduction measures item 0 the way upstream does, and that is a second intent with its
       own failure modes, not a second value on unit 1's prop. On top of it sit `ItemsStretch`'s
       three members — `Fill` adds the leftover pixels of a line to every item, `Uniform` adds
       them and the matching major-axis pixels to keep the ratio — `ItemsJustification`'s six,
       and `MaximumRowsOrColumns`, which is a cap on a line rather than a count and therefore
       is not `repeat(N, …)`.

    3. **ItemContainer.** The modern selection chrome, and the one piece of this tranche that
       is fully written down: `ItemContainer.xaml` is 150 readable lines with a
       `PART_SelectionVisual` at `BorderThickness="3"`, a `PART_CommonVisual` stroked at
       `ItemContainerSelectedInnerThickness` 1 inset by `ItemContainerSelectedInnerMargin` 2,
       and a lazily-loaded check box for multiple selection. Third because unit 4 hosts it and
       because `SelectorBarItem` already derives from it upstream — v8 found that the hard way
       (`ItemContainer.cpp:185-220` is what enters SelectorBarItem's states) and this is the
       unit that makes the base class a real component rather than a footnote.

    4. **ItemsView — three units, and the split is the layouts.** `ItemsView.xaml:19-38` is a
       `ScrollView` wrapping an `ItemsRepeater`, so the control itself is composition plus the
       part neither of its pieces has: selection. But the Gallery's page asks for two things
       that are not the control and are not each other, and each is its own intent:

       - **4a. `UniformGridLayout.MaximumRowsOrColumns`**, which the options pane at
         `ItemsViewPage.xaml:301-304` sets and unit 2 left owed.
       - **4b. `LinedFlowLayout`**, the layout the page's second example opens on and the third
         layout in ADR 0013's union.
       - **4c. `ItemsView` itself**: `SelectionMode`'s four members, item invocation, and the
         `ItemContainer` states driven from the view rather than from the container.

       4c is also what closes v8's one page-level deferral — `SelectorBarPage.xaml:59-79`'s
       colour swatches are an `ItemsView` of `ItemContainer`s, and after it the control
       exists.

    5. **ListViewItem and GridViewItem — the chrome that has to be measured.** Its own unit,
       ahead of the two controls that host it, because the row above says its geometry is in no
       file, and because two controls depending on a guess is worse than one. What the pin does
       give: `ListViewItemMinWidth` 88, `ListViewItemMinHeight` 40, `ListViewItemCornerRadius`
       4, `ListViewItemCheckBoxCornerRadius` 3, `ListViewItemSelectionIndicatorCornerRadius`
       1.5, `ListViewItemContentOffsetX` -40.5, `CheckMode` `Inline`, and both
       `SelectionCheckMarkVisualEnabled` and `SelectionIndicatorVisualEnabled` true
       (`ListViewItem_themeresources.xaml:5-60`). What it does not give is where any of it goes.
       **The spec for this unit is written after the measurements, from the measurements.**

    6. **ListView.** The control around the item: `generic.xaml:9000-9026`'s border, scroll
       viewport and `ItemsPresenter`, the `Header`/`Footer` slots, `SelectionMode`, and grouped
       headers — `ListViewHeaderItem` (`generic.xaml:9131`) is fully readable, a padded
       `ContentPresenter` over a half-pixel divider inset 12 on both sides. The scrollbar is the
       treatment `NavigationView.svelte:782-830` already worked out against
       `ScrollBar_themeresources.xaml`; the ScrollBar control itself stays roadmap item 13.

    7. **GridView and GridViewItem.** The same presenter with its own 45-key family and its own
       geometry, plus the wrapping panel. Split from unit 6 rather than folded into it because
       `GridViewItem`'s numbers are measured separately — sharing a presenter upstream is not
       evidence that two controls share a pixel — and because §7 does not bend for adjacency.

    8. **TreeView and TreeViewItem.** Fully readable and self-contained: `TreeViewItem.xaml`
       overrides the template it inherits from `DefaultListViewItemStyle`, so this unit depends
       on unit 5's token family but on none of its geometry. The indentation is the one number
       that is code — `TreeViewItem.cpp:515-524`, `depth * 16` — and the chevron, the 3-by-16
       selection indicator at `RadiusX="2"`, and the multi-select check box are all in the file.
       **D9 names TreeView as one of three controls to build on its own Zag machine, and this
       unit is where that is honoured or deviated from with a reason**; the deviation, if any,
       is a `Directive:` trailer, and the decision is made against `@zag-js/tree-view`'s actual
       surface rather than against the row's memory of it.

    9. **FlipView and FlipViewItem.** Last because it is the only one that is not a list: a
       viewport of one item with a previous and a next button, both readable at
       `generic.xaml:30284-30539` — four `FontIcon` glyphs, `EDD9` and `EDDA` horizontally and
       `EDDB` and `EDDC` vertically, on a `FlipViewNextPreviousButton*` brush family — with
       `Orientation="Vertical"` as the page's third sample.

    **D27 — inside this tranche, composition is real; outside it, D26 still stands.** ItemsView
    is built on this library's own ItemsRepeater and ItemContainer because `ItemsView.xaml` is
    literally those two elements and both are public controls a consumer sets properties on.
    That is the opposite of D26, and the distinction is exactly the one D26 draws: a
    template-private host nobody can name is not a surface, and a control the Gallery gives its
    own page to is. **v9 does not go back and rebuild BreadcrumbBar, SelectorBar or TabView on
    their upstream hosts.** D26 rejected that already, on the grounds that what those hosts
    contribute is padding and a viewport; that reason does not expire because the hosts now
    exist.

    **Nothing here virtualises, and that is a `WD-` with a number behind it.** ItemsRepeater's
    reason to exist upstream is virtualisation, and this library renders every item into the
    DOM. The measurement that makes it affordable is the acceptance surface's own: the largest
    collection any Collections page builds is 1 000 recipes
    (`ItemsRepeaterPage.xaml.cs:346-347`), and the next is 500 integers (`:26`). A browser lays
    out a thousand rows without complaint. The divergence says that, names the sizes, and does
    not claim the control would hold up at a million.

    **PullToRefresh moves to the Scrolling tranche, and this is a scheduling decision rather
    than another deferral.** v8's closing entry asked the next planner not to inherit an
    unscheduled page and leave it unscheduled, so: `RefreshContainer` and `RefreshVisualizer`
    belong with `ScrollView` and `AnnotatedScrollBar` in roadmap item 13. Three reasons, none of
    them "later". Its templates are two empty `Grid`s — `RefreshContainer.xaml:11-13` and
    `RefreshVisualizer.xaml:11` — so every pixel it draws is code, the same wall unit 5 hits and
    with no reference state to photograph: **at rest the control is invisible**, and a
    three-theme snapshot of it is a snapshot of a ListView. The gesture that reveals it is a
    touch or pen pull, which `WD-020` already declines. And the surface it attaches to is a
    scroll viewport, which is item 13's subject. The gap list above loses its Collections row.

    **What this version is likely to decline, decided in the units and not here.** Drag-and-drop
    reordering appears on three of the seven pages and is the same web-expressible-but-heavy
    question `WD-023` answered for tabs; ListView's `ScrollIntoView` and its restore-scroll
    sample are behaviour with no resting visual; `ItemsView`'s `LinedFlowLayout` has an
    items-info fast path that exists for virtualisation this version does not do; and grouped
    headers may or may not carry the sticky behaviour upstream's `ItemsStackPanel` gives them.
    Each is a `WD-` with a measurement behind it or it is built — the one thing none of them may
    be is unmentioned.

    **What this version leaves owed.** None of these is a divergence; each is simply not built,
    and each is on a page the acceptance gate will eventually walk.

    | control                    | not yet built                     |
    | -------------------------- | --------------------------------- |
    | UniformGridLayout          | `ItemsStretch="Uniform"`          |
    | ListViewItem, GridViewItem | the inline multi-select check box |

    The check box is owed to the ListView page's selection-support example, which offers
    Multiple among its four modes. Everything about it that is written down is in the pin —
    `ListViewItemCheckMode` is `Inline`, `ListViewItemCheckBoxCornerRadius` is 3, and there is
    a brush for every state of it — and the one thing that is not is where it goes. That is
    drawn by the native `ListViewItemPresenter`, and `ListViewItemContentOffsetX` of -40.5 is
    the only number near it. Unit 5 measured the reference machine for everything else this
    tranche needed and could not reach a multiple-selection example on it: the Gallery's page
    would not scroll to the second sample under the wheel this host can send. The measurement
    is the blocker, not the drawing, and whoever can scroll that page can write the unit.

    `MaximumRowsOrColumns` was in that table when unit 2 wrote it, and the prose beneath it
    said it was not — a row and its own paragraph disagreeing inside one commit. Unit 4a
    settled the disagreement by building it, and the difference the paragraph was drawing is
    still the right one: both members need the width a line actually resolved to fed back into
    a track size, `Uniform` scaling a cell's height by the ratio the extra width added and
    `MaximumRowsOrColumns` capping a count `auto-fill` computes for itself. What separates them
    is the acceptance surface. `ItemsStretch` is set twice in the pinned Gallery and both are
    `Fill` on a `LinedFlowLayout`, and `ItemsJustification` is set nowhere, so `Uniform` is owed
    to no page; `MaximumRowsOrColumns` is set on a `UniformGridLayout` inside an `ItemsView`
    (`ItemsViewPage.xaml:346`) with a `NumberBox` options pane beside it (`:301-304`), which by
    v8's rule puts it on the surface with every value shown. It turned out not to need the
    JavaScript pass either member was assumed to need: without `ItemsStretch` the cap is the
    line's own extent taken away from `auto-fill`, and with it the cap is each track's minimum
    raised to the share a capped line would give.

    Done-when is v8's, applied to nine units: each control snapshotted in three themes, each
    compared against the original on the reference guest, every prop following D21 as ADR 0012
    amends it, ADR 0013 written in unit 1 and cited by the rest, the surface sweep's step-1
    verdict recorded before each seal — and, this version only, **every number in unit 5 and
    unit 7 traceable to either a pinned line or a recorded measurement of the original**, since
    those are the two units where no file can be cited and a plausible guess is indistinguishable
    from a reading.

    **Closed.** Eleven controls and three layouts exist and are exported: ItemsRepeater with
    StackLayout, UniformGridLayout and LinedFlowLayout, ItemContainer, ItemsView, ListViewItem,
    GridViewItem, ListView, GridView, TreeView, TreeViewItem, FlipView and FlipViewItem. Fifty
    baseline sets pass on the reference guest, the nine gates are green and the packed consumer
    builds. `SelectorBarPage.xaml:59-79`'s colour swatches — v8's one page-level deferral —
    became buildable at unit 4c, and AutoSuggestBox's borrowing of the `ComboBoxItem*` families
    stops being forced at unit 6.

    **The version's fourth unit became three, and its fifth was easier than its plan.** Unit 4
    was written as one entry and is three commits, because `MaximumRowsOrColumns`,
    `LinedFlowLayout` and `ItemsView` are three intents that share a page rather than one unit.
    And unit 5, this tranche's named headline risk, was not the risk: the plan said
    `ListViewItem`'s geometry was nowhere, and in fact `generic.xaml:27524` carries its Padding,
    its two minimums, its focus band and every brush. What was genuinely nowhere was the native
    presenter's own inset — 2 above and below, 4 either side, in a 40-tall row — and one
    afternoon on the reference machine produced it.

    **What the version cost that its goal did not predict.**

    - **A visual-state group is mutually exclusive and a CSS rule is not.** Unit 3 shipped
      `ItemContainer`'s six `CombinedStates` as five rules, and the unselected pointer-over
      rule — one attribute selector heavier than the selected rule — repainted a selected
      container's inner stroke transparent. Nine gates were green and three baselines showed
      nothing, because no baseline can hold a pointer. Every control after it writes its
      exclusions out, and every one of them needed to.
    - **The count of harness rows a unit needs is the count of branches its implementation
      has.** Unit 2 sealed with `itemsJustification` exercised by nothing; unit 4a's spec asked
      for one row and the property had three code paths; unit 4b's had four. This is v7's
      "open the PNG" lesson one level down: a baseline can only catch what a row renders.
    - **The reference machine answers questions no file can, and the driving is the cost.**
      Unit 5's four numbers, unit 9's two rules and the fill of a flip button all came from
      pixel scans of the original. What that afternoon could not reach was the ListView page's
      second sample, because the Gallery's page would not scroll under the wheel this host can
      send — which is why the inline check box is owed rather than measured.
    - **A refactor is verified by replay, not by assertion.** Unit 6 moved four selectors out
      of `ItemsView` into `internal/selection.ts`; what says the move changed nothing is that
      the twenty interactions unit 4c drove produce byte-identical selections after it.
    - **The baselines cannot photograph a scrollbar.** The reference guest drives a headless
      Edge, and headless Chromium uses overlay scrollbars on every platform: they take no
      layout space, they are hidden at rest, and `::-webkit-scrollbar` rules do not paint them.
      Three components now carry the same scrollbar block and none of it appears in any
      baseline. The Scrolling tranche is where one `ScrollView` replaces all three.

    **What this version declined.** WD-026, that a collection renders every item and nothing is
    virtualised. WD-027, that every item is a tab stop and there is no current item, extended
    from ItemsView to TreeView and still waiting on the roving-tabindex rig WD-004 named.
    WD-028, that a FlipView moves by its buttons and does not scroll.

10. **The sample-page frame** — `ControlExample`'s three panes, `SampleCodePresenter`, the
    copy button, and `ItemPage`'s content root. Its syntax highlighting is ColorCode, pinned by
    the Gallery's own `standalone.props` at 2.0.15; the palette and the XML and C# grammars are
    generated from that source rather than transcribed, as ADR 0001 and 0007 do for the other
    two upstreams. Expander and SelectorBar are already built by here.
    The Gallery's Typography and Geometry pages move onto the frame in this version.

    **The title bar's search box starts working here.** The control in the shell layout is
    already the published `AutoSuggestBox` — v4 retired D20 and put the real control there —
    so nothing about the control changes: what is missing is the two props that make it a
    search box, `items` and the submit callback, and a route to navigate to on submit. The
    corpus is the committed Gallery records, which D18 already treats as the source of every
    menu entry and its path, so a suggestion carries the route it opens rather than a title
    that then has to be matched back to one. **The decision this version has to make is how
    far past the page titles the search reaches** — titles only, titles plus the group each
    page sits in, or the sample text as well. The original's own reach is the thing to
    measure on the guest before choosing, not to infer from the record.

    **The goal, in one line: a sample page is a frame that the Gallery's own source fills.**
    Nine versions have built controls and given each one a bare harness route. What the original
    shows is never a bare control: it is a header, a display pane, an options pane beside it,
    and — one `Expander` below — the source that produced what is on screen. Until that frame
    exists a control page can be compared against the original as a control and not as a page,
    which is exactly what v8's entry found when it wrote a group-level Done-when it could not
    meet.

    **None of the five pieces is a WinUI control**, and that is this version's first decision.
    `ControlExample`, `SampleCodePresenter`, `CopyButton`, `PageHeader` and `ItemPage` are
    `WinUIGallery.Controls` and `WinUIGallery.Pages` — the harness Microsoft wrote around WinUI,
    not WinUI. **D28**: they are built in `apps/gallery/src/lib/frame/` and nothing about them is
    exported from the package. That is not a lighter standard. C1 and C9 already walk
    `apps/gallery/src`, so the frame is written under the same rules as a component: no visual
    literal without a citation, and every `var(--winui-…)` it reads has to be emitted.

    **What the pin carries.** Every piece is fully written down — this is the first version since
    v3 with no measuring in its critical path, and the risk moves accordingly to the one thing
    that is not in the Gallery's own repository at all.

    | piece                 | source                                          | what it is                                                                        |
    | --------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
    | `ControlExample`      | `Controls/ControlExample.xaml`, `.xaml.cs`      | three panes at `CornerRadius="8"`, an `Expander` under them, two adaptive layouts |
    | `SampleCodePresenter` | `Controls/SampleCodePresenter.xaml`, `.xaml.cs` | the code pane, its scroller, `$(Key)` substitution, and three sample types        |
    | `CopyButton`          | `Controls/CopyButton.xaml`, `.xaml.cs`          | a `Button` style with `E8C8`, and a success animation that swaps the glyph        |
    | `PageHeader`          | `Controls/PageHeader.xaml`, `.xaml.cs`          | the title, the API-details flyout, the Documentation and Source drop-downs        |
    | `ItemPage`            | `Pages/ItemPage.xaml`                           | header margin `36,24,36,0`, content padding `36,0,36,36`, a `1028` wide frame     |
    | the samples           | `Samples/**/*.txt`                              | 480 files, 316 of them in the `--- header` / `--- xaml` / `--- csharp` shape      |

    **The sample code is data, and this is where it lands.** `SampleDefinition` names a `.txt`
    under `WinUIGallery/Samples/`, which `ParseSampleCodeSections` splits on its `--- ` lines
    (`ControlExample.xaml.cs`). Both shapes in the pin are read mechanically and neither needs a
    judgement, so **`data/winui-gallery-samples.json` is a third Gallery record**, extracted by
    `scripts/gallery/extract.mjs` and checked by C8 the same way as the other two — the pin it
    names, plus a census against its own contents. `$lib/samples.ts` imports it whole, the way
    `$lib/design.ts` imports the 287 KB design record: the Gallery is a prerendered static site
    whose bundle size is not a deliverable here, and a second reading mechanism invented before a
    page needs one is the speculative build §8 warns about.

    **The highlighter is generated data plus an engine of ours, and two mechanisms force that
    split — ADR 0014.** ColorCode is not vendored in the Gallery pin: `standalone.props` names
    version `2.0.15` and NuGet supplies it, so it is a **fourth pinned upstream**
    (`CommunityToolkit/ColorCode-Universal`, tag `v2.0.15`, MIT). What can be generated from it is
    the data — `StyleDictionary.DefaultLight` and `DefaultDark`, and the rule tables of
    `Compilation/Languages/Xml.cs` and `CSharp.cs`, each rule a pattern and a map from capture
    index to scope name, in the order the file lists them. What cannot be carried across is the
    engine, for two reasons that are both in `ColorCode.Core`:

    - `LanguageCompiler.CompileRules` joins every rule into one alternation under `(?x)`, wrapping
      each in `(?-xis)(?m)(…)(?x)`. Inline option scopes are a .NET regex feature; JavaScript has
      never had `(?x)` at all. Trying each rule's own pattern in order at each position, sticky,
      is the same thing the alternation means — leftmost match, first alternative that matches
      there — and it needs no option scopes to say it.
    - `LanguageParser.GetCapturedStyles` iterates `regexGroup.Captures`. .NET keeps every
      iteration of a group inside a quantifier; JavaScript keeps the last one only. The XML tag
      rule is `(?: … attribute … )*` with twelve captures inside the repetition, so under
      JavaScript's semantics a tag with four attributes would colour one of them. The engine
      recovers the rest by rescanning the matched span, and the residue is measured against the
      original rather than asserted.

    One value in the pin is not a colour: `VSDarkXMLName` is `"#FF#E6E6E6"`, seven hex digits and
    a stray `#`. The Gallery replaces `XmlName` in dark with `#FF5F82E8`
    (`SampleCodePresenter.xaml.cs`), so the broken value is reachable from neither of the two
    grammars this version renders. The extractor records it as it stands and the generator refuses
    to emit anything that is not `#AARRGGBB`, which is what makes a later grammar reaching it a
    build failure instead of a silent black run.

    **High contrast is not a third palette here, and that is upstream's answer rather than ours.**
    ColorCode consults no system colour: it holds two dictionaries of literal `#AARRGGBB` strings
    and picks between them on `ActualTheme`, which under a high-contrast Windows theme is still
    Light or Dark. So the original paints a high-contrast code pane in the same literals, and so
    do we. The colours arrive as data rather than as CSS, so C1 does not see them, and D10's
    remapping has nothing to remap. This one is derived from the source and not measured: the
    guest's theme is a reference parameter that stays where it is.

    **What the two design pages keep.** Upstream's Typography and Geometry examples are a `Canvas`
    holding one annotated PNG from `Assets/Design/` with `TeachingTip` buttons pinned over it at
    fixed coordinates. Those images are Microsoft binaries inside an untracked pin; v1 reproduced
    both pages as tables instead, and it is the table that moves onto the frame — as the display
    pane's content, with the page's prose above it and `TypographyTypeRamp.txt` and `Geometry.txt`
    in the source pane below, which is what the original shows there. **WD-029** records the
    substitution. Nothing has recorded it in the nine versions these two pages have existed.

    **The units.**

    1. **The ColorCode pin, and the palette and the two grammars as a record.**
       `scripts/colorcode/fetch.mjs` and `extract.mjs` on the pattern the other three pins already
       have, `data/colorcode.json`, ADR 0014, and C8 extended to a third record. Nothing renders
       in this unit: it is the version's one external dependency and §9 says to settle it before
       anything is built on it.

    2. **The engine.** `apps/gallery/src/lib/highlight/`: the record's rules applied to a string,
       producing the scope tree `RichTextBlockFormatter` walks, and the spans that tree paints.
       Verified on a dev route that renders the same sample text the original shows, in all three
       themes, and compared against the original's own pane on the guest — colour by colour, which
       is the only comparison that says the two engines agree.

    3. **`SampleCodePresenter`, and the copy button.** The pane, its horizontal scroller, the
       Consolas-then-Cascadia face, `$(Key)` substitution, the three sample types, and
       `CopyButton` with its success state. The copy button is the one piece here that touches an
       API the browser gates — `navigator.clipboard` needs a secure context, which
       `http://10.0.2.2:4173` is not — so what it does when the write is refused is part of the
       unit rather than a discovery during the seal.

    4. **`ControlExample`.** The three panes, the header, the `Expander` at
       `CardBackgroundFillColorSecondaryBrush` with the `SelectorBar` of XAML and C# inside it, the
       rule that a tab with no code is hidden and the first visible one is selected, and the
       `PhoneLayout` state that moves the options pane under the display below 740.

    5. **`PageHeader`, and `ItemPage`'s content root.** The title, the API-details flyout, the
       Documentation and Source drop-downs, the description, and the padding and the 1028 ceiling
       the page's own grid carries. The shell record's items hold `uniqueId` and `title` and
       nothing else today, so `scripts/gallery/extract.mjs` gains the subtitle, the description,
       the docs, the API namespace and the base classes — with C8's census extended to match,
       because a record that grows a field its census does not count is a record that can be
       hand-edited afterwards.

    6. **Typography and Geometry onto the frame.** Both pages, their tables inside the display
       pane, their sample definitions in the source pane, WD-029, and the baselines re-photographed
       for every shell page whose body the new frame changes.

    7. **The title bar's search.** `items` and the submit callback on the `AutoSuggestBox` v4 put
       there, over the corpus D18 already treats as the source of every menu entry and its path.
       **How far past the page titles the reach goes is measured on the guest first** — typing into
       the original's box and reading what comes back — and the entry above says why that is not
       inferred from the record.

    Done-when: a control page's route renders the frame rather than the placeholder for the two
    pages this version moves onto it; each of the two compares clean against the original on the
    reference guest, as a page and not only as a table; the source pane's colouring matches the
    original's colour for colour on the same sample text; the copy button puts the sample on the
    clipboard where the browser allows it and says what it did where it does not; the search box
    opens the page a suggestion names; and the nine gates stay green with C8 covering three records.

    **Closed.** Eleven commits. Five Gallery components in `apps/gallery/src/lib/frame/` —
    `CopyButton`, `SampleCodePresenter`, `ControlExample`, `PageHeader`, `ItemPage` — plus the
    highlighter in `$lib/highlight/`, a fourth pinned upstream, two more generated records, and
    the Typography and Geometry pages rendering the way the original renders them. 57 spec
    files, 58 tests green on the guest, nine gates green with C8 now covering four records.

    **Its Done-when, met, and the two clauses that changed on contact.** The two design pages
    render the frame and compare clean against the original as pages. The colouring was checked
    against the original's own pane rather than against itself: the Gallery's FlipView page on
    the reference guest paints `#0000FF` delimiters, `#A31515` tag names, `#FF0000` attribute
    names, `#0000FF` values and `#000000` quotes on a `#F7F7F7` pane, and ours emits the same
    five. The search opens the page a suggestion names, driven through the real control.
    Two clauses read differently at the end than at the start. "C8 covering three records" is
    four — the samples record was the third and the ColorCode record the fourth. And the copy
    button's clause asked what it does where the clipboard is refused: the answer is that the
    reference harness is served over `http://10.0.2.2:4173`, which is not a secure context, so
    `navigator.clipboard` is undefined on the one machine this project measures itself on, and
    the button writes through `execCommand` there and plays its success animation only when a
    write reported success.

    **What the version cost that its goal did not predict.** The plan said this version had "no
    measuring in its critical path" because every piece of the frame is written down. Four of
    the seven units still ended up measured on the guest, and three defects came out of it that
    nothing else would have caught: the sample control stretched to the height of its pane where
    the original centres it, the page gutter was applied twice once `ItemPage` brought its own,
    and the display pane laid several roots side by side. The frame being written down settles
    what to build; it does not settle what it looks like next to the original.

    **The two channels, and the class that is neither.** A `class` handed to a component lands
    on that component's root without the caller's scope hash, so a rule written for it matches
    nothing and no gate says so — `pnpm check` reports an unused selector only when the compiler
    can see the element, which it cannot across a component boundary. Styling a library control
    from outside it therefore has exactly two channels: its `style` prop, and the tokens it
    reads, declared on a wrapper and inherited. `ControlExample` restyles the `Expander` through
    both, and the one value that needs neither — the Expander's own `--corner`, declared on its
    root where an inherited value cannot reach — needs a rule that outranks that declaration.

    **What this version owes.** None of it is declined; each is a later unit.

    | owed                                                     | what it needs                                                                                                                                                                           |
    | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | the page header's theme button                           | the token layer emitting its theme blocks for any `[data-theme]` subtree, including a light one — today light is the bare `:root` default, and the file is 400 KB before duplicating it |
    | `SearchResultsPage`, which submitted text opens upstream | a page of the Gallery, and a decision about what it lists                                                                                                                               |
    | the Source drop-down when an item has neither source     | upstream always renders the button; ours renders it only when a section has content, and every one of the 120 items has one, so the branch never shows                                  |
    | Color, Iconography and Spacing on the frame              | nothing new — they were not in this version's scope                                                                                                                                     |
    | the narrow states of `ControlExample` and `ItemPage`     | a viewport the snapshot suite does not photograph at                                                                                                                                    |

    **What this version declined.** WD-029, the annotated image above each design table. The
    entry is worth reading for how it was written rather than for what it says: the markup made
    it look as though our table stood in for the image, and the original on screen showed the
    image _and_ the same table below it. The table is the original's own rows; what is absent is
    the image and the tips pinned to its pixels.

    **What v10 leaves for whoever picks this up.**

    - **Prototype the mechanism the spec is about.** The highlighter's spec asks for one check
      that no other check implies — that a tag with four attributes colours four — and it exists
      because a throwaway prototype of the algorithm, written before the spec, coloured only the
      last attribute of every tag and produced output that reads as correct. .NET keeps a capture
      per iteration of a group inside a quantifier and JavaScript keeps the last.
    - **Measure the baseline you just wrote.** A fix landed, the photograph after it still showed
      the old render, and the file only changed once the baselines were deleted and re-taken.
      `--update-snapshots` does overwrite a changed baseline — verified by moving a padding and
      watching the pixels move — so what went stale was the build behind it.
    - **The reference machine runs the shipped Gallery and the pin is a commit.** They are not
      the same app: the guest's pane lists a ListBox page the pin does not have, and its search
      does not reach tags where the pinned code does. Check the pin before chasing a difference.
    - **A private-use code point is written as an escape.** Two glyphs arrived as literal
      U+E8C8 and U+E73E, which grep, the diff and the review all read as an empty span.
    - **A container built for one child has not been tried with two.** Every harness row passed
      a single control into the display pane, so every branch of the component was covered and
      the defect was not.
    - Captures: `.private/captures/066-frame/` — the original's FlipView page with its source
      pane open, its Button page, its Typography page, and its search box answering three
      queries; ours beside them. Probes added: `.private/probes/control-example-measure.mjs`,
      `control-example-shot.mjs`, `control-example-theme.mjs`, `design-page-shot.mjs`,
      `flipview-page-shot.mjs`, `search-drive.mjs`.

11. **Layout** — Border, SplitView, Viewbox, and the Gallery's Grid and StackPanel pages, which
    are mostly documentation of CSS this library does not need to reimplement.

    **The goal, in one line: the Layout group's five roadmap pages render on the frame, and the
    three controls they demonstrate exist in the library.** This is the first version to put a
    _control_ page on the frame v10 built — the two pages v10 moved were Design pages, tables in a
    display pane with no options pane beside them. Every control page in the shell still renders
    the placeholder, and what these five need that the frame has never been asked for is the
    thing v10's closing entry named: a container built for one child, tried with an options pane
    full of controls that drive it.

    **The five pages, read on the reference guest before anything was decided.** Each is one
    `ControlExample` with an options pane, and the display pane holds exactly what the roadmap
    line says.

    | page       | display pane                                                                          | options pane                                                                                |
    | ---------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
    | Border     | a `Border` around a TextBlock, `VerticalAlignment="Top"` (`BorderPage.xaml:24`)       | a Slider and two `RadioButtons` side by side in a Grid with `ColumnSpacing="8"` (`:47`)     |
    | SplitView  | a `SplitView` in a 400×300 Grid (`SplitViewPage.xaml:53`)                             | a ToggleButton, a ToggleSwitch, two ComboBoxes and two Sliders, each 196 wide (`:123-163`)  |
    | Viewbox    | a `Viewbox` sized by a Slider, `VerticalAlignment="Top"` (`ViewboxPage.xaml:24-26`)   | a StackPanel 200 wide: a Slider and two `RadioButtons` (`:55`)                              |
    | Grid       | a 240×160 Grid of four Rectangles (`GridPage.xaml:24-25`), no alignment set           | two horizontal Sliders and **two vertical, direction-reversed** ones (`:89-93`, `:122-126`) |
    | StackPanel | four Rectangles in a StackPanel, `VerticalAlignment="Top"` (`StackPanelPage.xaml:27`) | a `RadioButtons` and a Slider in a StackPanel with `Spacing="12"` (`:41`)                   |

    Three things the library does not have are on that table, and none of them is a Layout
    control. **`RadioButtons`** — the group control with a header and a column-major layout,
    `controls/dev/RadioButtons/RadioButtons.xaml` — was never built: v3's unit 5 built
    `RadioButton` "and the group that owns the selection", and the group it built is the native
    one a shared `name` makes, which is the right selection model and not the control. Three of
    the five options panes are made of it. **A vertical `Slider`** — the `VerticalTemplate` at
    `Slider_themeresources.xaml:418-434` — was deferred by the Slider unit with a comment saying
    so, and the Grid page's `RowSpacing` and `Grid.Row` sliders are vertical and reversed. And
    **the display pane has no way to put a child at the top.** v10's u6a made the pane a grid
    column with `align-content: center`, which is where a XAML child with a fixed height and the
    default `VerticalAlignment="Stretch"` lands, and three of these five samples say
    `VerticalAlignment="Top"` instead. In CSS that is the container's property; in XAML it is the
    child's. The mechanism was prototyped before this entry was written, per v10's lesson: the
    pane becomes a flex column with `justify-content: center`, and a direct child carrying
    `data-vertical-alignment="top"` takes `margin-bottom: auto`, which the flex algorithm
    resolves before `justify-content` does. Measured in a scratch page — top lands at the
    padding edge, centre where it landed before, `stretch` fills, and a column of rows still
    stacks. The attribute is read on the pane's direct children only, and a second child after a
    `top` one is pushed to the bottom by the same auto margin — a caveat for a page that stacks
    two aligned samples, which none of these five does. Symbol icons need nothing: D25 already
    says an icon is a code point the consumer draws, and the SplitView page draws four.

    **D30 — Grid and StackPanel are pages, not components.** The roadmap line said so and the
    reading confirms it: `Grid` with `ColumnDefinitions="50, 50, 50"` and `RowSpacing` is CSS
    grid with `grid-template-columns` and `row-gap`; `StackPanel` with `Orientation` and
    `Spacing` is a flex column or row with `gap`. A component whose whole body is one CSS
    declaration per prop would give a consumer a worse grid than the one the browser already
    has, and a Gallery page that shows the XAML beside a CSS rendering of it is the documentation
    the roadmap line describes. The two pages draw their samples in page-local CSS, cited to
    the sample, and the options drive it through custom properties on the page's own element —
    C1 walks `apps/gallery/src`, so each declaration carries its citation like a component's.
    Border is not in that sentence, and it stays a component: it is a `FrameworkElement` with
    its own `Thickness` grammar, its page names it as a control, and a consumer porting XAML
    reaches for it by name.

    **A `Thickness` or `CornerRadius` prop takes XAML's own string.** `BorderThickness="2"`,
    `Margin="8,5"`, `Padding="1,2,3,4"` — one, two or four numbers, in XAML's order, which is
    left, top, right, bottom and not CSS's. D21 maps the member; the value grammar has had no
    rule until now because no component has taken one of these types as a prop. A shared reader
    in `packages/winui-svelte/src/lib/internal/` turns the string into CSS's four values, and
    a number is the one-value form. The alternative — CSS strings on a prop named after a XAML
    member — puts two grammars under one name, and a page substituting `$(BorderThickness)`
    into XAML text would then show a value the XAML could not parse.

    **Sample media is copied from the pin, as v9 did.** `apps/gallery/static/sunset.jpg` is
    byte-identical to the Gallery's `Assets/SampleMedia/sunset.jpg`; the Viewbox sample's
    `Slices.png` (`ViewboxPage.xaml:48`, 90×90) goes in beside it the same way. WD-029's images
    are a different case and stay one — what makes them unreproducible is the annotation
    coordinates measured against their pixels, not the bytes.

    **Viewbox, measured rather than recalled.** The guest was driven through all four `Stretch`
    values at 200×200. The child is scaled from the **top-left corner**, not centred: under
    `Uniform` a 190×150 child becomes 200×158 and sits at the pane's padding edge with the
    remaining 42 pixels empty below it. `Fill` scales the axes independently — the disc becomes
    an ellipse. `UniformToFill` **clips**: the child scales to 253 wide and the box shows its
    left 200 pixels. `None` is scale 1. So the component is a box with `overflow: hidden` whose
    child is laid out at its natural size and transformed from origin `0 0`, with the scale
    computed from a `ResizeObserver` on both; `StretchDirection` clamps the scale to at least
    or at most 1. A size comes from the caller through `style`, as XAML's `Width`/`Height` do.

    **SplitView is a template with eleven states and no code in the pin.** `SplitView` is a
    `Windows.UI.Xaml` control WinUI restyles; the pin carries `SplitView_themeresources.xaml`
    and nothing else, so its behaviour is the template's setters plus the published API. The
    template is a two-column grid: `PaneRoot` spans both columns, is `OpenPaneLength` wide,
    aligned left or right, at `Canvas.ZIndex="1"`, and carries the pane's background and a
    border whose brush is `SystemControlForegroundTransparentBrush` — transparent in light and
    dark, `SystemColorButtonTextColor` in high contrast (`:700`); `ContentRoot` spans both
    columns too until a state gives it one (`:718`). The display modes are the states
    (`:542-683`): the inline ones give the content its own column, the overlay ones leave the
    content where it is and show the pane over it with a `LightDismissLayer` over the content
    (`:723`); the compact ones keep the pane visible when closed, its column
    `CompactPaneLength` wide and the pane clipped to that width — `PaneClipRectangle`
    translated by the difference, which is `clip-path: inset(…)` here. Six of those states were
    photographed on the guest: an overlay pane covers the content text; a closed compact pane is
    a 48-pixel strip of icons; placed right, it is the strip at the right edge and the pane opens
    over the content from there. The inline shapes open in 200 ms on a `0.0,0.35 0.15,1.0`
    spline and close in 100 ms, both resources; the overlay shapes open in 350 ms and close in
    120 ms on a `0.1,0.9 0.2,1.0` spline, both literals in the transitions (`:64`, `:186`) —
    corrected at close; the entry first said 200 and 100 for everything. All four are
    transcribed. Light dismiss —
    a click on the layer closing an overlay pane — is one line, and the layer's fill stays
    transparent because `LightDismissOverlayMode` defaults to `Auto`, which is off on desktop.

    **The pages carry their substitutions live.** Every `$(Key)` in the five sample texts is
    bound upstream to the option that drives it, and `SampleCodePresenter` throws on a key the
    page does not supply, so each page passes the whole set in the strings XAML would show:
    `Colors.Gold` is `#FFFFD700`, a bool is `True`, an enum is its member name, a double is
    its number. The Border page's radio groups name their colours the way the code-behind does
    (`BorderPage.xaml.cs`): the background is `Yellow`/`Green`/`Blue`/`White` and the brush is
    `Gold`/`DarkGreen`/`DarkBlue`/`White` behind the same four labels.

    **Not taken, and where each goes.** The Layout group has nine pages; this version takes
    the five the roadmap names. `Expander` is built and its page is not moved: whose version
    moves the pages of the controls built before v10 is open question O-pages below, and
    answering it for one page here would answer it by accident. Canvas, RelativePanel and
    VariableSizedWrapGrid stay in the unscheduled table. `RadioButtons.SelectedIndex` and
    `SelectedItem` are not reproduced — selection is the children's native group, which is what
    v3 decided and what the keyboard already does right — and the layout's habit of dropping
    columns when the width runs out (`ColumnMajorUniformToLargestGridLayout.cpp:132-162`) is
    not either; `MaxColumns` is honoured as written.

    Seven units, in dependency order:

    1. **The display pane's vertical alignment.** The prototype above, into
       `ControlExample`. Authored directly: ten lines, measured before this entry, and nothing
       about timing or lifetime in it.
    2. **`RadioButtons`.** Header (`RadioButtons.xaml`, `RadioButtonsTopHeaderMargin` 0,0,0,8),
       and the column-major layout uniform to the largest child
       (`ColumnMajorUniformToLargestGridLayout.cpp:16-42`; `RadioButtonsColumnSpacing` 7,
       `RadioButtonsRowSpacing` 8), `MaxColumns` defaulting to 1 (`RadioButtons.idl:24`). Children
       are `RadioButton`s the caller writes with a shared `name`.
    3. **Border, and its page.** The component, the `Thickness` reader, the harness; then the
       page, which is the first control page on the frame and the first options pane with two
       groups side by side. Sealed as two commits.
    4. **Slider's vertical template.** `orientation` and `isDirectionReversed`, from
       `Slider_themeresources.xaml:418-434` and the three `SliderVertical*` keys the manifest
       excluded by name. bits-ui's `orientation` is verified against its documentation before the
       spec is written, and whether it can reverse a vertical track is the thing to verify.
    5. **The Grid and StackPanel pages.** D30 — CSS in the page, four sliders on one and a radio
       group on the other, every substitution live.
    6. **Viewbox, and its page.** The mechanism above; the page copies `Slices.png` and draws
       the four Rectangles and the text the sample stacks inside a Border.
    7. **SplitView, and its page.** The template above, the ten `SplitView*` and framework keys
       it reads, the transitions; then the page — a `ListView` of four code-point icons in the
       pane, the two item templates the placement toggles between, and six options.

    Done-when: each of the five routes renders the frame with its options pane rather than the
    placeholder, and each compares clean against the original on the reference guest as a page,
    the display pane's child at the top where the sample puts it there; every option on every
    page moves the sample and its substitution — the Border page's thickness and two colours,
    the Viewbox page's size and eight radio states, the Grid page's four sliders, the StackPanel
    page's orientation and spacing, the SplitView page's four display modes, both placements,
    the toggle and the two lengths; Border, Viewbox, SplitView and RadioButtons render in the
    three themes in the snapshot suite with the vertical Slider in Slider's; and the nine gates
    stay green.

    **Closed.** Fourteen commits. Four library components — `RadioButtons`, `Border`, `Viewbox`,
    `SplitView` — a vertical `Slider` with tick marks, XAML's `Thickness` grammar as a reader,
    and the Layout group's five roadmap pages on the frame: the first control pages to render
    it, each compared against the original on the reference guest as a page. WD-030. 62 tests
    green on the guest, nine gates green.

    **Its Done-when, met.** The five routes render the frame with an options pane, and each
    compares clean as a page — Border's description, example header and sample text on the
    same pixel rows as the original's; Grid's grey box and four thumb centres within a pixel;
    StackPanel's rectangles and divider on the same pixels; Viewbox's box on the same pixels with
    the child at 200×157 against 200×156; SplitView driven through the six states the original
    was photographed in, pane, strip, content offset and icons matching in each. Every option
    moves its sample and its substitution. One residue: Border's options pane is 281 wide against
    273, because the RadioButton's `MinWidth="120"` reaches both of our star columns and the
    shipped Gallery lets its first column go to 112.

    **What the reading found that the entry did not know.** Two things, both on the Grid page,
    both because the original was zoomed into rather than read. Its sliders draw **tick marks**:
    `TickPlacement` defaults to `Inline` and every slider on that page and the StackPanel one sets
    `TickFrequency="1"`, so unit 4 grew a second deliverable — and the ticks are not where a
    naive frequency puts them. WinUI's `TickBar` refuses to draw ticks closer than 20px and
    thins to a multiple, the first tick under the thumb's resting centre; transcribed from
    `TickBar_Partial.cpp`, the rule reproduces the original's tick pixels on all three slider
    shapes the page has. And under a wide header a vertical slider's track sits 14px from the
    left edge, not centred: a XAML Grid does not spread fixed columns across a wider slot.

    **The pin's repository carries the code the sparse checkout does not.** The entry said
    SplitView has "no code in the pin", which is true of `controls/dev` and false of the
    repository: `dxaml/xcp/dxaml/lib/SplitView_Partial.cpp`, `Slider_Partial.cpp`,
    `TickBar_Partial.cpp` and `dxaml/xcp/core/core/elements/Viewbox.cpp` and `SplitView.cpp`
    exist at the pinned commit and were read from it. They settled five things this version
    would otherwise have guessed: the tick rule; the vertical thumb tooltip's placement (left,
    for a right-handed user); the light-dismiss condition (open, and a mode that is not Inline
    or CompactInline); that `SplitViewRightBorderThemeThickness` is defined and never applied,
    so the pane's border stays on its right edge in both placements; and Viewbox's scale and
    clamp order, arrange at `(0, 0)`, and the one-axis behaviour WD-030 declines. Widening the
    sparse checkout to `dxaml/xcp/dxaml/lib` and `dxaml/xcp/core` is a build-unit's worth of
    work and is owed below; until then a file is fetched by URL at the pin's commit.

    **The transition timings, corrected.** The entry said the open transition is 200 ms and the
    close 100 ms, "both in the template". The two resource durations time the inline shapes;
    the overlay shapes open in 350 ms and close in 120 ms on a different spline, and both
    numbers are literals in the transitions (`:64`, `:186`) rather than resources. The component
    carries all four.

    **XAML margins add and CSS margins collapse.** Two sites in the frame transcribed their
    margins exactly and were wrong beside their neighbours: the example header's 12 collapsed
    through the control's 16, and the description's 4 into the page header's 12. Every page
    since v10 had the description 4px high and the example header 12px high, and nothing said
    so until a page put the original's own content under the frame. Both roots are formatting
    context roots now, and a third case turned up the same day — a TextBlock's margin on an
    inline span. The lesson is on the seal of `db96ae9` and in the harness fix that followed.

    **The one-column layout has a pre-count state, and it is the default's own.** `RadioButtons`
    counts its children in the DOM to know its row count; before the count exists, a
    column-flow grid would put every child in its own column. The pre-count rendering is a
    single column with uniform implicit rows, which is exactly what `MaxColumns="1"` renders at
    any count, so the default case never changes shape at hydration and only a wider group
    reflows once. The same `1fr`-on-a-shrink-wrapped-grid mechanism failed once at review, when
    the grid was a stretched flex item and the tracks split the parent's width instead — measured
    on the harness, and the reason the prototype had been shrink-wrapped.

    **What this version owes.**

    | owed                                                                      | what it needs                                                                                                                           |
    | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
    | the sparse checkout widened to `dxaml/xcp/dxaml/lib` and `dxaml/xcp/core` | a `tokens:fetch` change and a note in ADR 0001's successor about what the extra paths are for; five files were read by URL this version |
    | `RadioButtons` dropping columns when the width runs out                   | `ColumnMajorUniformToLargestGridLayout.cpp:132-162`, and a measurement of a group that hits it                                          |
    | Border's first star column going under `MinWidth`                         | a reading of how the shipped Gallery resolves star columns against a child's minimum; 8px on one page                                   |
    | the SplitView content's slide in the inline transition                    | `SplitViewPaneAnimationOpenPreDuration` and a translation of the content; the column interpolates instead                               |
    | Expander's page, and the Layout group's three unscheduled pages           | O-pages for the first; Canvas, RelativePanel and VariableSizedWrapGrid stay in the unscheduled table                                    |

    **What this version declined.** WD-030: a Viewbox sized on one axis keeps the child's own
    size on the other where XAML follows the scale. Every sample in the Gallery sizes both.

    **What v11 leaves for whoever picks this up.**

    - **Zoom into the original before writing the unit.** Both of this version's surprises were
      visible in the first capture at 2× and invisible at 1×: the tick marks and the track's
      left offset. The reading that plans a page is not the same as the reading that plans a
      control on it.
    - **A transcribed margin is right alone and wrong beside its neighbour.** Three sites this
      version; make the parent a formatting-context root, or measure the stacked pair.
    - **The code is in the repository.** `controls/dev` is the sparse checkout, not the pin;
      a `*_Partial.cpp` or a core element exists for every Windows.UI.Xaml control WinUI
      restyles, and reading it beats recalling WPF.
    - **Drive the page, not only the harness.** SplitView's six states were compared by driving
      our page with the same clicks the original was given; the harness photographs rest states
      only, and the pane's clip is only right when the state before it was.
    - Captures: `.private/captures/067-layout/` — the five originals, the Viewbox in four
      stretches, the SplitView in six states, ours beside each. Probes added:
      `valign-proto.mjs`, `rb-layout-proto.mjs`, `radio-buttons-measure.mjs`, `page-measure.mjs`,
      `slider-ticks-measure.mjs`, `grid-thumbs.mjs`, `splitview-drive.mjs`.

12. **Date and time** — CalendarView, CalendarDatePicker, DatePicker, TimePicker.

    **The goal, in one line: the Date & time group's four pages render on the frame, and the
    four controls they demonstrate exist in the library.** All four are `Windows.UI.Xaml`
    controls WinUI 3 only restyles, so the control pin carries a `*_themeresources.xaml` for
    each and no implementation — and, as v11 found, the pin's _repository_ carries the
    implementation anyway, outside the sparse checkout. This is the first tranche where that is
    true of every control in it, which is why the first unit widens the checkout instead of
    fetching five more files by URL.

    **The four pages, read on the reference guest before anything was decided.**

    | page               | display pane                                                                                                      | options pane                                                                       |
    | ------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
    | CalendarView       | one `CalendarView`, `VerticalAlignment="Top"` (`CalendarViewPage.xaml:15-21`)                                     | two CheckBoxes and three ComboBoxes in a StackPanel `Margin="0,-5,0,0"` (`:24-60`) |
    | CalendarDatePicker | one `CalendarDatePicker`, `Header="Calendar"`, `PlaceholderText="Pick a date"` (`CalendarDatePickerPage.xaml:9`)  | none                                                                               |
    | DatePicker         | two examples — a `Header`ed picker, then a `DayFormat`/`YearVisible="False"` picker (`DatePickerPage.xaml:22-37`) | none                                                                               |
    | TimePicker         | three examples — bare, `MinuteIncrement="15"`, `ClockIdentifier="24HourClock"` (`TimePickerPage.xaml:22-35`)      | none                                                                               |

    Three of the four pages have no options pane at all, which makes this tranche the opposite
    shape of v11's: nearly all the work is inside the controls and the pages are thin. The
    CalendarView page is the exception, and its options pane is the widest in the version — a
    `SelectionMode` ComboBox, a `CalendarIdentifier` ComboBox of ten calendars, and a `Language`
    ComboBox of eighty-six languages from `Helpers/Language/LanguageList.cs`.

    **What the library does not have.** Four controls, and two things under them that are not
    controls. `CalendarView` is a header, a weekday row and a panel that renders three different
    grids. `CalendarDatePicker` is a button whose flyout is a `CalendarView`. `DatePicker` and
    `TimePicker` are each a three-column button whose flyout is three scrolling columns over an
    accept/dismiss bar, and that column is `LoopingSelector`, a
    `Windows.UI.Xaml.Controls.Primitives` type both of them create in code and neither exposes.
    The other missing piece is a formatter: `DayFormat`, `MonthFormat`, `YearFormat` and
    `DateFormat` take Windows' `DateTimeFormatter` template grammar, the Gallery's own DatePicker
    sample passes `"{day.integer} ({dayofweek.abbreviated})"`, and nothing here parses it.

    **D31 — CalendarView's month grid is bits-ui's `Calendar`; its year and decade grids are
    ours.** The month grid is what that primitive already computes: the weeks spanning the
    month padded to six rows, a roving tabindex over the day cells, `minValue`/`maxValue`
    disabling cells rather than removing them, single and multiple selection. It computes all of
    it through the `DateValue`'s own `calendar` object and never assumes Gregorian, so eight of
    the ten identifiers the Gallery's ComboBox lists arrive with the primitive rather than being
    written here. The year and decade grids are sixteen flat cells with no week structure and no
    month rollover; there is no primitive to borrow for them, and bits-ui's `MonthSelect` and
    `YearSelect` are `<select>` elements, which is the wrong shape entirely. Every element is
    drawn through `child` snippets, which ADR 0004 calls the normal path.

    **D32 — a date-valued prop is a native `Date`; the arithmetic behind it is
    `@internationalized/date` and every string comes from `Intl`.** A consumer writes
    `date={new Date()}` and imports no date package. Inside, the value becomes a `CalendarDate`
    in whichever calendar `CalendarIdentifier` names, and the weekday names, month names, header
    title, day numerals and looping-selector items are all produced by `Intl.DateTimeFormat`
    with the `Language` locale and the `-u-ca-<identifier>` extension that names the calendar —
    the extension is required, because the grid's shape follows the date's calendar while
    `Intl`'s names follow the locale, and without it the numbers and the names disagree. WinUI's
    format templates are read by a parser in `packages/winui-svelte/src/lib/internal/`, one
    `{unit.modifier}` at a time, mapped onto `Intl.DateTimeFormatOptions`, with the template's
    literal text kept between the parts. `@internationalized/date` is already a peer dependency,
    because bits-ui requires it, so the version adds no dependency.

    **The day item has no template, and its chrome is C++.** `CalendarViewDayItem`'s
    `ControlTemplate` is empty (`CalendarView_themeresources.xaml:256`): the today circle, the
    selection ring, the group label, the blackout strikethrough and the density bars are painted
    by `CalendarViewBaseItemChrome`, and the item's state is not a visual-state group at all but
    six booleans read by two brush-selection functions with a stated precedence — disabled,
    today, blackout, out-of-scope, pressed, hovered, normal
    (`dxaml/xcp/core/core/elements/CalendarViewBaseItemChrome.cpp:1446-1531` for the background,
    `:1543-1622` for the foreground). The XAML gives only the setters: `MinWidth`/`MinHeight` 40,
    `Margin` 1, `Padding` `0,0,0,4`, and two focus-visual brushes. Year and decade items have no
    template _and_ no style — their margin is 9 with rounded chrome enabled and 1 without
    (`CalendarViewGeneratorHost.cpp:215-224`), which is the 74-pixel pitch the guest measures.

    **The decade view opens two years early, and the reason is the row the scroll lands on.**
    Driven on the guest: the decade view first shows `2018 … 2033` under the header
    `2020 - 2029`, and one press of the next button shows `2030 … 2045` with `2030` in the first
    cell. Sixteen cells, four to a row, and the row boundary does not move with the scope — it
    is fixed by the start of the whole range, which is `MinDate`, a hundred years back from
    today. `2018` starts a row because `2018 - 1926` divides by four, and so does `2030 - 1926`.
    The year view opens on `Jan` for the same reason and not because a year starts a row:
    twelve hundred months from January 1926 divides by four too. The rule to implement is
    _scroll to the row holding the scope's first item_, and the scope's own bounds are what
    `IsOutOfScopeEnabled` dims — each item is tested against the scope independently
    (`CalendarView_Partial.cpp:1818`), so out-of-scope cells appear before, after or on both
    sides of the in-scope run.

    **What the guest measured.** The CalendarView is 297 wide with a 1px border, a header row
    closed by a full-width 1px divider, and a 7×6 grid of 40×40 day items on a 42 pitch. The
    title button is left-aligned 16px from the border and its text is the `"month year"`
    template in month view, `"year"` in year view, and a `"YYYY - YYYY"` concatenation in decade
    view (`CalendarViewGeneratorDecadeViewHost.cpp:260-277`); it zooms out one level per click
    and is disabled at decade level. The two navigation buttons carry `EDDB` and `EDDC` at
    `CalendarViewNavigationButtonFontSize` 8 and move a whole scope at a time. Today is a filled
    accent circle with white text. With `IsOutOfScopeEnabled` clear, out-of-scope days render in
    the ordinary foreground and stay selectable — the property is purely visual
    (`CalendarView_Partial.cpp:1903-1930`). `IsGroupLabelVisible` draws an 8px label on the first
    day of each month in month view and on the first month of each year in year view, and
    nothing in decade view. The DatePicker is 296 wide (`DatePickerThemeMinWidth`) in three star
    columns — `78*`, `132*`, `78*` with a 1px spacer between — and its flyout is the same width
    and 398 tall, holding three looping selectors under a 40-high highlight and over a 41-high
    accept/dismiss row. The TimePicker is 242 wide in three equal columns.

    **The flyout is placed by its own highlight, not by an anchor.** Both pickers compute the
    open position so that the presenter's `HighlightRect` is centred over the control
    (`dxaml/phone/lib/DateTimePickerFlyoutHelper.cpp:9-77`) and force the presenter to the
    control's width on open (`DatePickerFlyout_Partial.cpp:202-206`) — which is why the flyout
    the guest photographs sits _on_ the control rather than under it. Month and day loop and
    year does not; hour and minute loop and the period does not
    (`DatePickerFlyoutPresenter_Partial.cpp:337-367`,
    `TimePickerFlyoutPresenter_Partial.cpp:298-317`). A column change writes nothing to the
    control: the presenter holds a pending value and only Accept commits it
    (`DatePickerFlyout_Partial.cpp:104-130`). The column _order_ is read out of a formatter
    rather than declared — WinUI formats the literal pattern `"day month.full year"` and takes
    the order the result puts them in (`DatePicker_Partial.cpp:1798-1885`), which on the web is
    `Intl.DateTimeFormat(locale).formatToParts()`. `MinYear`/`MaxYear` default to a hundred
    years either side of today (`DatePicker_Partial.cpp:31`, `:1003-1035`), `ClockIdentifier`
    defaults to the system clock read back off a formatter (`TimePicker_Partial.cpp:229-239`),
    and `MinuteIncrement="0"` means the minute column holds only `00`
    (`TimePicker_Partial.cpp:39`).

    **The version's globalization is `Intl`'s, and Windows' is deeper.** With
    `CalendarIdentifier="HebrewCalendar"` and `Language="English"` the original renders Hebrew
    numerals right to left: the identifier changes the numeral system and the reading direction,
    not only the arithmetic. `@internationalized/date` has no Julian or Korean calendar at all.
    Both are declined here and written up as divergences rather than deferred, and the page's
    ComboBox keeps all ten rows with the two unimplemented ones rendering the Gregorian grid —
    dropping the rows would change the page the acceptance gate compares.

    **The units.**

    | #   | unit                                                                                                          |
    | --- | ------------------------------------------------------------------------------------------------------------- |
    | 0   | the sparse checkout carries the second half — `dxaml/` in `tokens:fetch`, and `surface.md`'s step 1 rewritten |
    | 1   | the format-template parser and the calendar map, with a harness page that renders a table of cases            |
    | 2   | CalendarView's frame and month grid — border, header, divider, weekday row, day items, today, out of scope    |
    | 3   | CalendarView's selection — `SelectionMode` None/Single/Multiple, the selected chrome, the keyboard            |
    | 4   | CalendarView's year and decade views, the title button, and the transition between the three                  |
    | 5   | the CalendarView page, and the language list as a fourth Gallery record                                       |
    | 6   | `LoopingSelector` — the column, its items, its up and down buttons, its snap and its looping                  |
    | 7   | DatePicker, its flyout, and the two examples on its page                                                      |
    | 8   | TimePicker, its flyout, and the three examples on its page                                                    |
    | 9   | CalendarDatePicker and its page                                                                               |

    Units 6 and 7 each turn on a mechanism no document settles — the column's scroll snap and
    the flyout's alignment onto the control's own row — so both are prototyped in a scratch page
    before their specs are written, which is v10's lesson and v11's practice.

    Done-when: each of the four routes renders the frame rather than the placeholder, and each
    compares clean against the original on the reference guest as a page; the CalendarView page's
    five options each move the sample and its substitution, including a non-Gregorian identifier
    and a non-English language, and the calendar opens on the same three views as the original
    with the same cells in each; the DatePicker and TimePicker flyouts open with their selected
    row over the control and their columns hold the original's items, the second DatePicker
    example rendering `{day.integer} ({dayofweek.abbreviated})` with no year column and the third
    TimePicker example two columns; the CalendarDatePicker's flyout is a CalendarView centred
    under its button and picking a date closes it; all four controls render in the three themes
    in the snapshot suite; and the nine gates stay green.

    **Closed.** Twelve commits. Four controls — `CalendarView`, `CalendarDatePicker`,
    `DatePicker`, `TimePicker` — the `LoopingSelector` two of them are made of, WinUI's date
    format grammar as a reader, the Gallery's language list as a fourth record, and the Date and
    time group's four pages on the frame, each compared against the original on the reference
    guest as a page. WD-031 to WD-034. 68 tests green on the guest, nine gates green.

    **Its Done-when, met.** The four routes render the frame rather than the placeholder, and each
    compares clean as a page: CalendarView's control is 300 by 352 at the same pixel with its
    options pane on the same column; the two DatePicker examples and the three TimePicker examples
    are 296 by 30 and 242 by 30 at the same three rows as the original's; CalendarDatePicker's
    button is 113 by 32 against 111, the two pixels being the text's advance width between
    DirectWrite and Chromium. The CalendarView page's five options each move the sample and its
    substitution, including a Hebrew calendar and a German language. Both pickers' flyouts open
    with their highlight centred on the control, to the pixel. The second DatePicker example
    renders `{day.integer} ({dayofweek.abbreviated})` with two fields, and the third TimePicker
    example two. CalendarDatePicker's flyout is a CalendarView four pixels under its button and
    centred on it, and picking a day closes it. All four controls render in the three themes.

    **What the checkout hid, and what it cost to open it.** Unit 0 widened the sparse checkout to
    four `dxaml` directories — 3.4k files, 35 MB to 78 MB, 2.8 seconds — and rewrote
    `surface.md`'s step 1, which had been reading "no `.cpp` under `controls/dev`" as "no second
    half" and saying so in as many words. The correction is not cosmetic: `IsThumbToolTipEnabled`,
    the omission that whole document exists because of, is handled in `Slider_Partial.cpp`, which
    was on disk during neither the sweep that missed it nor the sweep that followed. Every "no
    second half" verdict in that file is now marked open rather than quietly rewritten.

    **The measurements that stand.** CalendarView is 300 by 352 in all three display modes,
    because a 74px year cell is a 56px item plus the 9px margin the rounded chrome uses and four
    of them equal six 42s plus the weekday row. Below the header, our month view and the
    original's differ in 2852 pixels of 105,600 above a threshold of 30, all of it on glyph edges;
    the year and decade views differ in 2125 and 1974, the same way. The DatePicker is 296 wide in
    134 / 79 / 79, which is 132 : 78 : 78 of what its two 1px spacers leave, and with the year
    hidden the two that remain are 184 and 109 — the same weights, because the columns travel with
    the fields rather than with the positions.

    **The decade view opens two years before its scope**, and the reason is that the panel indexes
    every item from `MinDate` rather than from the scope and lays them out four to a row, so the
    row boundary never moves; navigation lands on the row holding the scope's first item. Measured
    by driving the original, then found in `CalculateOffsetFromMinDate`. The same rule puts the
    year view's January in the first cell, which had looked like the obvious behaviour and is a
    coincidence of arithmetic.

    **A resource can be defined for a role and applied by nothing.** Neither of CalendarView's
    button styles carries a `Foreground` setter and neither template binds one, so the arrows take
    the ordinary `ButtonForeground` and the title takes the control's own `CalendarViewForeground`
    — and ours drew them in the grey those two keys name until the original's ink was sampled at
    (27, 27, 27). v11 found the same shape in `SplitViewRightBorderThemeThickness`. Two versions
    running makes it a category: **grep for a key's use before believing its name.**

    **Three defects a green battery hid, and what saw each.**

    - A `<button>` inherits neither `font-family` nor `font-size` nor `color`. The CalendarView
      header rendered in Arial, and two units later the month-year cells did the same. Seen by
      reading the computed style on the guest, not by any gate.
    - `fromDate` returns a `ZonedDateTime`; bits-ui writes the placeholder to the last selected
      value; and it picks its date parser from the placeholder's type. So one click on a date
      broke the arrow keys for the life of the page, with an exception inside a keydown handler
      that `check`, `conform` and every screenshot were blind to. Seen by a `page.on('pageerror')`
      listener, which every drive probe now attaches.
    - A gradient named as a `border-color` makes the whole `border` shorthand invalid, and it is
      dropped silently. Three of this tranche's controls had no border at all until it was
      measured: DatePicker's button came out 28 tall instead of 30, and because the flyout's
      placement is computed from the button's height, the flyout moved with it. TextBox has
      carried the ring that fixes this since v4.

    **What this version owes.**

    | owed                                                                  | what it needs                                                                                                                              |
    | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
    | re-sweeping the controls `surface.md` cleared under the narrow search | step 1 re-run against the widened checkout for Pivot, ListViewItem, Slider and the seven `Windows.UI.Xaml` controls before them            |
    | CalendarView's blackout dates and density bars                        | a property surface WinUI does not have either — both are set through `CalendarViewDayItemChanging`, which this library has no analogue for |
    | `DatePicker.CalendarIdentifier`                                       | the three columns in the identifier's own calendar; no Gallery sample sets it                                                              |
    | TimePicker's right-to-left column correction                          | `GetOrder`'s swap of hour and minute under RTL, and a locale to test it against                                                            |
    | CalendarDatePicker's `HeaderPlacement="Left"`                         | an original to compare against; no Gallery sample sets it. Its two resources are defined, in the framework pin rather than the control's   |
    | the four pages' narrow adaptive states                                | v10's owed row, unchanged                                                                                                                  |

    **What this version declined.** WD-031, two of the ten calendar identifiers render a Gregorian
    grid because `@internationalized/date` implements neither Julian nor Korean. WD-032, the
    weekday row's two-letter names are derived from the abbreviated ones and kept only while the
    seven stay distinct — `ar` abbreviates every weekday to a name beginning `ال`, and the entry
    said only that the rule "can differ elsewhere" until it was run there. WD-033,
    `NumberOfWeeksInView` is absent and the month view is always six weeks. WD-034, the calendar
    identifier changes the arithmetic and not the numerals or the reading direction, where Windows
    derives all three from it.

    **What v12 leaves for whoever picks this up.**

    - **Attach `page.on('pageerror')` to every drive probe.** Three lines, and the only thing that
      saw this version's worst defect.
    - **A divergence entry that says a rule "can differ elsewhere" has not been run elsewhere.**
    - **Carry the previous unit's corrections into the next unit's spec.** Unit 7 paid for six
      details of the picker flyout; unit 8's spec listed all six and the review found none of them
      repeated.
    - **A second author lane is not a substitute by default.** With the usual lane unavailable,
      unit 5 went to another: it wrote plausible files, no report, and three defects a cold read
      caught in a minute. It was reverted whole and re-dispatched an hour later. Waiting was
      cheaper than repairing.
    - Captures: `.private/captures/068-datetime/` — the four originals, the CalendarView in three
      views and five states, both picker flyouts in three states, and a crop comparison beside each.
      Probes added: `calendar-measure.mjs`, `calendar-measure-guest.mjs`, `calendar-drive.mjs`,
      `calendar-select-drive.mjs`, `calendar-views-drive.mjs`, `calendarview-page-drive.mjs`,
      `looping-drive.mjs`, `date-picker-drive.mjs`, `date-picker-guest.mjs`, `dp-page-guest.mjs`,
      `tp-page-guest.mjs`, `cdp-page-guest.mjs`, `clock-check.mjs`, and the three prototypes
      `proto-calendar.mjs`, `loop-proto.mjs`, `proto-flyout.mjs`.

13. **Scrolling** — ScrollView, ScrollViewer, PipsPager, AnnotatedScrollBar, SemanticZoom, and
    **PullToRefresh**, moved here from Collections by v9 for the reasons its entry gives:
    the control draws nothing at rest, everything it does draw is code rather than template,
    and the surface it attaches to is a scroll viewport this tranche is already building.

    **The goal, in one line: the Scrolling group's five pages and PullToRefresh's render on the
    frame, and the controls they demonstrate exist in the library.** Six pages, not five: the
    roadmap's own unscheduled table lists `ScrollViewer` under this group, and building the group
    around it would leave a page nothing schedules inside the version that schedules the group.

    **The six pages, read on the reference guest before anything was decided.** Captures in
    `.private/captures/069-scrolling/`.

    | page               | display pane                                                                                                                     | options pane                                                                                                                       |
    | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
    | ScrollView         | one `ScrollView` 400 by 266 over one image, then two 400 by 300 over a column of four (`ScrollViewPage.xaml:24`, `:183`, `:250`) | ZoomMode, ZoomFactor, two ScrollModes, two ScrollbarVisibilities; then a velocity; then an animation type, a duration and a button |
    | ScrollViewer       | one example, the same box over the same image (`ScrollViewerPage.xaml`)                                                          | ZoomMode, a Zoom `Slider`, two ScrollModes, two ScrollBarVisibilities                                                              |
    | PipsPager          | a `FlipView` 400 by 270 with a pager under it, then a bare ten-page pager (`PipsPagerPage.xaml:14`, `:38`)                       | Orientation, Previous button visibility, Next button visibility                                                                    |
    | AnnotatedScrollBar | a `ScrollView` 800 by 500 over 250 tiles with the bar beside it (`AnnotatedScrollBarPage.xaml:21-53`)                            | a paragraph and a `Slider` for the bar's maximum height                                                                            |
    | SemanticZoom       | one `SemanticZoom` 500 tall over a grouped `GridView` and a `ListView` of the group titles (`SemanticZoomPage.xaml:59-80`)       | none                                                                                                                               |
    | PullToRefresh      | two examples, each a `RefreshContainer` around a bordered `ListView` 200 tall (`PullToRefreshPage.xaml:13-24`)                   | none                                                                                                                               |

    **This tranche is the one whose subject the acceptance harness cannot photograph, and that is
    written down already.** v9's closing entry says it: the reference guest drives a headless
    Edge, headless Chromium uses overlay scrollbars on every platform, and `::-webkit-scrollbar`
    rules do not paint them. Six components carry the same block of those rules today —
    `ListView`, `GridView`, `ItemsView`, `TreeView`, `NavigationView`'s pane and the Gallery
    shell's page area — and three of them carry a comment naming this tranche as where the copying
    stops. None of the six appears in any baseline.

    **D33 — the scrollbar is elements, not `::-webkit-scrollbar`.** A pseudo-element scrollbar
    cannot express what the original draws and cannot be seen by what judges it. It cannot: hold
    the two arrow buttons the expanded bar has, carry the four `ConsciousStates`
    (`ScrollBar_themeresources.xaml:528-670`), or animate between them on the pin's own timings;
    and in the browser that takes the baselines it paints nothing at all. Elements can do all of
    it, and a `div` photographs like any other content. Unit 0 measured both halves of that on the
    guest before unit 1 was specified.

    **D33's second clause was that bits-ui's `ScrollArea` would be the primitive underneath, and
    it was struck before unit 2 was written.** Reading the installed package rather than its
    documentation is what struck it. `getThumbSize` floors the thumb at a hard-coded 18
    (`bits-ui@2.19.0`, `dist/bits/scroll-area/scroll-area.svelte.js:742-747`) where WinUI floors
    it at 30; it divides by the scrollbar box less its padding where WinUI divides by the rail's
    own length; it has none of WinUI's three conditions for drawing no thumb at all; and it writes
    the thumb's position into `style.transform` on every scroll (`:335-337`), which is the same
    channel the collapsed state's `ScrollBarThumbOffset` needs. None of the three is reachable
    from outside the primitive.

    What that would have cost is a thumb of the wrong length in every scrolling region in the
    library, largest exactly where it shows most — a long list gives 18 where the original gives
    30 — and no gate would have seen it. So the viewport is an ordinary `overflow: auto` box with
    `scrollbar-width: none`, which unit 0 showed is the whole of what the primitive was wanted
    for, and the bar beside it is this version's own `ScrollBar` driven from the viewport's
    `scrollTop` and `scrollHeight`. ADR 0004 already allows this shape: it names bits-ui the base
    and names the controls that get their own machine instead. Its test is whether the primitive
    computes what the control needs, and here it computes something else.

    **The scrollbar, measured on the original before any of that was decided.** On the ScrollView
    page's first example, whose content ends at x=769:

    | state                                    | what is drawn                                                                                                    |
    | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
    | pointer inside the viewport, off the bar | a 2px thumb at x=764..765 and nothing else, over the content and darkening it                                    |
    | pointer on the bar                       | a 12px track at x=757..768 in `#f9f9f9`, an arrow at each end, and a rounded grey thumb `rgb(150,150,150)` in it |

    Neither state narrows the viewport. The framework pin agrees with the ruler: `ScrollBarSize`
    12, `ScrollBarVerticalThumbMinWidth` 8, `ScrollBarThumbStrokeThickness` 6,
    `ScrollBarCornerRadius` 3, `ScrollBarButtonArrowIconFontSize` 8, expand and contract 167ms
    each, the expand beginning 400ms after the pointer arrives and the collapse 500ms after it
    leaves, and 4px of margin at the leading and trailing end.

    Two of those numbers are the pin disagreeing with itself, and both times the themeless block
    is the one the guest draws. Its themed blocks carry an older `ScrollBarSize` of 16 against the
    12 that is measured. And the collapse is governed by `ScrollBarContractBeginTime`, 500ms in
    the themeless block against 2s in the themed ones — **not** by the key called
    `ScrollBarContractDelay`, whose 2s belongs to the indicator transitions in `ScrollView`'s own
    template. A key named for the thing you are looking for is not evidence that it is the one
    applied, which is `a-key-can-name-a-role-nothing-fills` arriving by a third route.

    **`ScrollingScrollBarVisibility` is not the conscious state.** Driven on the guest: setting
    the vertical bar to `Visible` leaves the mini 2px thumb exactly where `Auto` left it. The
    enum decides whether the bar exists; the pointer decides which of its two shapes is drawn.

    **A visibility property is not the last word on the second page either.** PipsPager's
    navigation buttons have an edge rule above their visibility: at the first page the previous
    button goes to `PreviousPageButtonHidden` however `PreviousButtonVisibility` is set, and that
    state sets `Opacity` to 0 rather than `Visibility` to `Collapsed`, so the button keeps its
    24 by 24 box and the pips do not move when it appears. Measured on the guest's second
    example, whose options pane says `Visible`: nothing at all is painted left of the first pip,
    and the first pip is where it is with the arrow shown or hidden.

    **What the library does not have.** Six controls and one internal. `ScrollView` and the older
    `ScrollViewer` are the same box over the same content with different property names —
    `ScrollView` is the modern pin's own (`controls/dev/ScrollView/ScrollView.xaml`), `ScrollViewer`
    a `Windows.UI.Xaml` control WinUI 3 restyles (`CommonStyles/ScrollViewer_themeresources.xaml`,
    implemented in `dxaml/xcp/dxaml/lib/ScrollViewer_Partial.cpp`), and both put the same
    `ScrollBar` inside. That `ScrollBar` is the internal: WinUI publishes it, the Gallery gives it
    no page, and every one of its appearances in this tranche is as a template part, so it is
    built as `internal/ScrollBar.svelte` and exported by nothing. `PipsPager` is a repeater of
    glyph buttons between two navigation buttons. `AnnotatedScrollBar` is a rail of labels that
    drives a `ScrollView` through what upstream calls an `IScrollController`. `SemanticZoom` lives
    only in `dxaml` and swaps two views in the same bounds. `RefreshContainer` and
    `RefreshVisualizer` are the modern pin's own, and the visualizer's template is an empty `Grid`
    100 tall whose entire content is a `SymbolIcon(Symbol::Refresh)` inserted from C++
    (`RefreshVisualizer.cpp:61-65`, `:229-231`) and rotated by state.

    **`ScrollViewer` is built rather than deferred, and the reason is that it costs a rename.**
    Its page is in this group, its template draws the same box and the same bar, and the two
    controls differ in their property names and in nothing the eye can find. The one difference
    that reaches a page is the visibility enum: `ScrollBarVisibility` has a fourth member,
    `Disabled`, and `ScrollingScrollBarVisibility` has three (`ScrollViewerPage.xaml:145-148`
    against `ScrollViewPage.xaml`'s three-row combo), and the older page spends a `Slider` on the
    zoom where the newer spends a `NumberBox`. Rejected: a placeholder page, which would leave the
    version's own group incomplete; and folding the page onto `ScrollView`, which would render a
    page the acceptance gate compares against a different original.

    **The page's grouping is the page's, not the control's.** SemanticZoom's zoomed-in view is a
    `GridView` with a `GroupStyle` and a `CollectionViewSource`; this library's `GridView` has no
    grouping and this version does not add it. `SemanticZoom` takes two snippets and swaps them,
    which is what the control does; the page draws its own headings above its own tiles, the way
    v11's Grid and StackPanel pages draw layouts D30 says are not components.

    **PullToRefresh can be drawn and cannot be provoked.** Both examples draw nothing of the
    control at rest, so both compare clean at rest against the original; neither page offers a
    button, and the reference host has no touch digitiser, so no capture of the original's
    visualizer in any state can be taken from here. The control is built, its states are
    exercised on a dev route rather than on the page, and the gesture that reaches them is a
    pointer drag — which the original does not accept. That is a divergence in the direction this
    project rarely records, and it is recorded rather than quietly enjoyed.

    **A resource key can be too generic to be a token, and five of them are.**
    `AnnotatedScrollBar_themeresources.xaml` names `ThumbHeight` 3, `ThumbWidth` 30,
    `LabelsGridMinWidth` 44, `ScrollButtonFontSize` 8 and `ThumbCornerRadius` 1.5 — unprefixed,
    and D11 emits a token as `--winui-` plus the key unchanged. No other dictionary in either pin
    defines any of them, so nothing collides and the rule stands as written; the risk is that
    `--winui-ThumbHeight` reads like Slider's and is AnnotatedScrollBar's, so the manifest's
    comment says which control owns them.

    **The units.**

    | #   | unit                                                                                                                    |
    | --- | ----------------------------------------------------------------------------------------------------------------------- |
    | 0   | a prototype: a DOM scrollbar drawn on a scratch page and photographed on the guest, proving the baselines can see it    |
    | 1   | `internal/ScrollBar.svelte` — the track, the two arrows, the thumb, and the four conscious states on the pin's timings  |
    | 2   | `ScrollView` — the viewport over bits-ui's `ScrollArea`, the two bars, the corner, and the scroll and visibility modes  |
    | 3   | the six copies retired: `ListView`, `GridView`, `ItemsView`, `TreeView`, `NavigationView`'s pane, the shell's page area |
    | 4   | `ScrollViewer`, and its page                                                                                            |
    | 5   | the ScrollView page — three examples, and the options that move them                                                    |
    | 6   | `PipsPager`, and its two examples                                                                                       |
    | 7   | `AnnotatedScrollBar` — the rail, the labels, the detail tooltip — and its page                                          |
    | 8   | `SemanticZoom`, and its page                                                                                            |
    | 9   | `RefreshContainer` and `RefreshVisualizer`, and their page                                                              |

    Unit 0 is a prototype before a spec, which is v10's lesson: the mechanism this whole version
    turns on is whether an element-drawn scrollbar survives the round trip to a baseline, and no
    document settles it. Unit 3 is the debt four components' comments already name, and it is
    sealed inside this version rather than after it, because a `ScrollView` nothing consumes has
    not been tried against two children — v10's lesson again.

    Done-when: each of the six routes renders the frame rather than the placeholder, and each
    compares clean against the original on the reference guest as a page; a `ScrollView`'s bar
    draws 2px at rest and a 12px track with two arrows under the pointer, in a baseline rather
    than only in a live browser; the ScrollView page's six options each move the sample and its
    substitution, including a `ScrollbarVisibility` of `Hidden` that removes the bar and a
    `ZoomMode` of `Enabled` that zooms; the PipsPager page's three options each move it, and its
    pips measure 6 selected and 4 unselected at a 12px pitch; the AnnotatedScrollBar's rail
    carries the five labels at the offsets the original puts them and raises a tooltip on hover;
    SemanticZoom swaps its two views in the same bounds on a click of a group heading; the two
    PullToRefresh examples draw nothing at rest and their visualizer runs through its states on a
    dev route; the six components render in the three themes in the snapshot suite; and the nine
    gates stay green.

    **Closed.** Eleven commits. Six controls — `ScrollView`, `ScrollViewer`, `PipsPager`,
    `AnnotatedScrollBar`, `SemanticZoom`, and the `RefreshContainer`/`RefreshVisualizer` pair — the
    internal `ScrollBar` all of them are made of, and five of the six pages on the frame. WD-035 and
    WD-036. 76 tests green on the guest, nine gates green.

    **Its Done-when, met, and one clause it could not meet.** Five routes render the frame:
    `/scrolling/scrollview`, `/scrolling/scrollviewer`, `/scrolling/pipspager`,
    `/scrolling/annotatedscrollbar`, `/scrolling/semanticzoom`, and `/collections/pulltorefresh` is
    the sixth. A `ScrollView`'s bar draws 2 pixels at rest and a 12-pixel track with two arrows
    under the pointer, in a baseline rather than only in a live browser. The ScrollView page's six
    ComboBoxes each move the sample and its substitution and the ZoomFactor NumberBox moves the
    sample alone, which is what its record declares. PipsPager's pips measure 6 selected and 4
    unselected at a 12-pixel pitch, and its four options move both. AnnotatedScrollBar's rail
    carries five labels, drops two of them at a rail of 140, and raises a tooltip naming the colour
    under the pointer. SemanticZoom swaps its two views in a box that measures 1181 by 500 in
    either. The two PullToRefresh examples draw nothing at rest.

    **The clause it could not meet is "compares clean as a page", and twice for one reason.** Our
    ScrollView page's options pane is 37 pixels wider than the original's, because our `NumberBox`
    measures 240 against about 120; and our AnnotatedScrollBar page lays its tiles out in six
    columns against the original's five, because the sample ScrollView is 758 wide against about 604. Both frames cap the options pane at the 320 upstream sets, so what differs is the width
    the pane's own content asks for — and that is a question about controls four versions old
    rather than about either page, which may not override a control's width.

    **What the version was really about.** The scrollbar, and the fact that **the acceptance
    harness cannot photograph one**. v9 recorded it and nothing had acted on it: the guest drives a
    headless Edge, headless Chromium uses overlay scrollbars, and `::-webkit-scrollbar` rules paint
    nothing there. Six components carried a copy of those rules and none of it appeared in any
    baseline. Unit 0 measured both halves of that side by side before unit 1 was specified — the
    pseudo-element box reserved no gutter and drew nothing; the element box drew a 12-pixel track,
    both arrow glyphs and the thumb — and unit 3 retired all six copies into one control.

    **D33 was decided, then half of it was struck, and reading the primitive is what struck it.**
    bits-ui's `ScrollArea` floors its thumb at a hard-coded 18 where WinUI floors it at 30, divides
    by a different length, has none of WinUI's three conditions for drawing no thumb, and writes the
    thumb's position into `style.transform` on every scroll — the channel the collapsed offset
    needs. The cost of not catching it would have been a thumb of the wrong length in every
    scrolling region in the library, largest where it shows most, and no gate would have seen it.
    ADR 0004 gained the category: a primitive that exists and computes something else.

    **The measurements that stand.** The rail is 12 wide; the collapsed thumb paints 2 pixels at
    rail-relative 7..9 and the expanded one 6 at 3..9, against the original's 764..766 and 760..766
    in a rail ending at 769. The track is `#f9f9f9` and the thumb `rgb(138,138,138)` over it, which
    is `ControlStrongFillColorDefault` at 0.447 on that ground to the digit. PipsPager's selected
    pip is 6 and its unselected 4 at a 12-pixel pitch. `interacting` at a ratio of 0.4 gives opacity
    0.4, half a turn and five pixels of parallax.

    **Three transcriptions that look like mistakes and are not.** PipsPager's selected and normal
    glyphs are the same code point and differ only in size. RefreshVisualizer holds its opacity at
    0.4 through the whole pull because upstream builds the ramp and then does not start it — the
    line is commented out. And AnnotatedScrollBar's label template carries a negative margin that
    subtracts seven pixels from every measured label height, which loosens every collision
    comparison by the same amount: the margin is layout, not decoration.

    **What the pin says twice and differently.** `ScrollBarSize` is 12 in the themeless block and 16
    in the themed ones, and the guest draws 12. The collapse is timed by `ScrollBarContractBeginTime`
    at 500ms, not by the key actually named `ScrollBarContractDelay`, whose 2 seconds belong to a
    different template. Both times the themeless block is the one that renders, and both times the
    name was the misleading evidence.

    **Four defects a green battery hid, and what saw each.**

    - A `background` shorthand resets `background-clip`, so the disabled thumb painted its whole
      eight-pixel box where the original paints two. Seen by reading the baseline image.
    - A XAML stroke straddles the edge, so a border-box border of the whole thickness consumed the
      thumb entirely. Seen by measuring the rendered thumb against the original's own pixels.
    - The zoom anchored at the top left where upstream anchors at the centre of the viewport — its
      `ZoomTo` takes a centre point and the Gallery passes null. Ours showed the sky above a bay
      where the original showed the bay. Seen by putting the two pages side by side.
    - `--update-snapshots` re-photographed a fixed render and wrote the old pixels. v10 recorded
      this and it was paid again; the file changed only after the PNGs were deleted.

    **What this version owes.**

    | owed                                                                                      | what it needs                                                                                                      |
    | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
    | ~~`NumberBox` is 240 wide where the original is about 120~~ — **read while planning v14** | one line, and the reading is below                                                                                 |
    | the AnnotatedScrollBar page's tile grid is six columns, not five                          | the same question, from the other end: what the sample ScrollView's width should be when the pane is content-sized |
    | `ScrollView`'s programmatic scroll — `ScrollTo`, `ScrollBy`, `AddScrollVelocity`          | two of the ScrollView page's three examples render fully and do nothing, which is what those members are for       |
    | `ContentOrientation="None"` with content that cannot shrink                               | a rule this project has not needed: the Gallery's own use of that value is an image that fits                      |
    | the six pages' narrow adaptive states                                                     | v10's owed row, unchanged                                                                                          |

    **The `NumberBox` row, read while planning v14, and it is one line.**
    `NumberBox.xaml:114` gives the inner `InputBox` the `NumberBoxTextBoxStyle`, which is
    `BasedOn="{StaticResource DefaultTextBoxStyle}"` and overrides only `Template` — so the
    InputBox inherits `MinWidth = TextControlThemeMinWidth`, the 318 every text box has. The
    `SpinButtonsVisible` state at `NumberBox.xaml:33` then **lowers** it to `NumberBoxMinWidth`,
    120 (`NumberBox_themeresources.xaml:34`), and because `InputBox` is `Grid.ColumnSpan="3"`
    that minimum is the whole control's.

    Ours puts the 318 on the outer box (`NumberBox.svelte:244`) and the 120 on the inner input
    (`:353`), where the outer minimum dominates and the state setter can never take effect. The
    comment above it reads the setter backwards — it says the 120 is there so the box is wide
    _enough_, where upstream's purpose is to let a NumberBox be narrower than a text box.

    **Two sentences of the paragraph above are wrong, and v14's closing entry corrects them.**
    `TextControlThemeMinWidth` is 64, not 318 — the 318 was this reproduction's own hardcode,
    read back as though it were the resource's value — so the `SpinButtonsVisible` setter
    raises the InputBox's floor to 120 rather than lowering it to it. Everything else here
    holds, including that our outer minimum keeps the setter from ever taking effect. See
    WD-042 and v14 below; the unit that removes the 318 settles this row with it.

    **A state setter that lowers a minimum is invisible behind an outer minimum transcribed from
    the same resource**, and nothing catches it: both numbers are cited, both citations are
    correct, and the control renders. The fix is a unit of v14, and the AnnotatedScrollBar row
    above is the same question from the other end.

    **What this version declined.** WD-035, a pull is a pointer drag where the original takes only
    touch — a divergence in the direction this project rarely records, because the alternative is a
    control no reachable input can reach. WD-036, a wheel over a scrollbar scrolls nothing, because
    the bar is a sibling of the viewport rather than a child of it.

    **What v13 leaves for whoever picks this up.**

    - **Read a primitive's shipped arithmetic before adopting it.** Its documentation says what it
      is for, not what it computes, and D33's second clause survived a plan, a review and a seal on
      the strength of the former.
    - **A spec line is wrong more often than an author is.** Three units running, the author stopped
      or corrected against the source and was right each time: a substitution the record does not
      declare, a button in the wrong corner with the wrong glyph, a translation the source gives a
      value for. Ask what the file says before writing what it should say.
    - **The author lane can be a subagent.** Both external lanes were unavailable for four of the
      nine units, and a context-free Claude subagent given the spec and nothing else satisfied what
      the loop actually requires, which is that the agent that writes is not the agent that reads.
    - Captures: `.private/captures/069-scrolling/` — the six originals, the scrollbar in both
      conscious states with a crop beside each, and unit 0's two-box prototype. Probes added:
      `proto-scrollbar.mjs`, `scrollbar-measure.mjs`, `scrollview-measure.mjs`,
      `scrollview-unsized.mjs`, `scrollview-none.mjs`, `scrollviewer-measure.mjs`, `zoom-drive.mjs`,
      `sv-page-guest.mjs`, `sv-page-measure.mjs`, `pips-measure.mjs`, `pips-page-guest.mjs`,
      `pips-flip2.mjs`, `pips-options.mjs`, `asb-page-guest.mjs`, `asb-page2.mjs`,
      `sz-page-guest.mjs`, `sz-drive.mjs`.

14. **Styles** (10) — the drawing vocabulary WinUI has and this library has never built: shapes,
    icons, two brushes, a density axis, and a shadow the pin states as a formula.

    **The goal, in one line: the Styles group's ten pages render on the frame, and the drawing
    primitives they demonstrate exist in the library.**

    **The ten pages, read on the reference guest before anything was decided.** Captures in
    `.private/captures/070-styles-motion/`.

    | page                  | examples                                                         | display pane                                                                                            | options pane                                                                                                 |
    | --------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
    | AcrylicBrush          | 3 (`AcrylicPage.xaml:48`, `:78`, `:156`)                         | three coloured shapes under a rectangle filled with an acrylic brush                                    | none; then a tint opacity, a tint colour and a fallback colour; then a tint opacity and a luminosity opacity |
    | AnimatedIcon          | 2 (`AnimatedIconPage.xaml:14`, `:60`)                            | a button carrying an animated icon, then a `NavigationView` whose settings item carries one             | a `Kind` ComboBox; then none                                                                                 |
    | Compact Sizing        | 1 (`CompactSizingPage.xaml:57`)                                  | a form of nine controls at one density                                                                  | a Standard/Compact radio pair                                                                                |
    | IconElement           | 6 (`IconElementPage.xaml:11`, `:39`, `:54`, `:72`, `:81`, `:96`) | six buttons — a bitmap icon, a font icon in a text font, two image icons, a path icon and a symbol icon | a Monochrome check box on the first                                                                          |
    | Line                  | 4 (`LinePage.xaml:25`, `:95`, `:159`, `:227`)                    | a line, a polyline, a path and a geometry group                                                         | end points and stroke thickness; a show-points toggle; and so on                                             |
    | Shape                 | 3 (`ShapePage.xaml:23`, `:68`, `:134`)                           | an ellipse, a rectangle and a polygon                                                                   | height, width, stroke thickness, and the rectangle's two radii                                               |
    | RadialGradientBrush   | 1 (`RadialGradientBrushPage.xaml:19`)                            | one filled rectangle                                                                                    | mapping mode, centre, two radii, gradient origin, spread method                                              |
    | System Backdrops      | 3 (`SystemBackdropsPage.xaml:24`, `:44`, `:56`)                  | running prose and a `Show window` button                                                                | none on the first                                                                                            |
    | SystemBackdropElement | 1 (`SystemBackdropElementPage.xaml:11`)                          | a rounded rectangle carrying a backdrop material, and a button                                          | a backdrop type and a corner radius                                                                          |
    | ThemeShadow           | 1 (`ThemeShadowPage.xaml:11`)                                    | one 200 by 200 card casting a shadow                                                                    | a Z-translation `Slider`, 0 to 64, initial 32                                                                |

    Twenty-five examples over ten pages, which is what the version is sized against rather than
    the page count.

    **D34 — item 14 becomes two versions, and Motion is the second.** As written it was
    seventeen pages against a tranche average of five, which alone would only be an argument
    about size. What decides it is that the two halves have different acceptance problems.
    Every page in Styles shows its whole subject in a still frame. **No page in Motion shows
    any of its subject in a still frame**: photographed at rest, Easing Functions is three
    Animate buttons and three identical blue squares, and Theme Transitions is five pale
    squares, three coloured ones and a row of buttons. A baseline of our reproduction would
    match the original's whether the motion were right, wrong or absent.

    So Motion needs an instrument before it needs a control, which is principle 2's "sequence
    foundations" applied to a verification method rather than to a feature. Splitting gives
    each half one goal line and lets that instrument be v15's first unit. `Media / Windowing /
System / Shell` moves to item 16; `item 15` occurs once in the whole of `docs/`, in the
    roadmap line itself, so the renumbering costs one edit.

    **The version's find is that WinUI states its drop shadow as a formula, and this project
    fitted it by eye instead.** `scripts/tokens/manifest.mjs` says so in as many words above
    `PLATFORM_SHADOWS`: "No pinned dictionary states this recipe: it was measured on the
    reference guest and fitted against the browser's own blur." One does. It was outside the
    control pin's sparse checkout, which carried `controls/dev`, `dxaml/xcp/dxaml/lib`,
    `dxaml/xcp/core/core/elements` and `dxaml/xcp/core/inc` and not
    `dxaml/xcp/components`. Adding the last of those — 17 MB — brings in
    `graphics/inc/DropShadowRecipe.h`, whose `GetDropShadowRecipe(translationZ, theme)` is the
    whole recipe, taken, its own comment says, "from the shell team implementation of the
    ThemeNineGridShadowBrush":

    ```
    Elevation = min(64, Z / 2)
    Elevation < 2         ambient 0,  directional 0
    2 <= Elevation <= 16  ambient 0,  directional light min(Elevation/100 + 0.06, 0.14), dark 0.26
    Elevation > 16        ambient light 0.15 dark 0.37, directional light 0.19 dark 0.37,
                          ambient blur Elevation/3, ambient Y offset 2
    directional blur = Elevation, directional Y offset = Elevation / 2, both black
    ```

    and `graphics/ThemeShadow.cpp:190`, whose hand-tuned tight insets are 4/1/4/8 for a
    ToolTip's depth and 10/2/10/18 for everything else's. The three depths the platform
    actually uses are `ToolTip_Partial.cpp:647` (Z 16), `ElevationHelper.cpp:19` (Z 32, the
    base for every other elevated control) and `ContentDialog_Partial.cpp:1165` (Z 128).

    **The fit and the formula agree on the shadow's extent and disagree on its shape.** The
    measured `PopupShadow` reaches 8 pixels to each side and 18 below, against the pin's
    10/2/10/18 — a cross-check, not a contradiction. But it is two layers where the recipe
    says a popup casts one, because a popup sits at Elevation 16, the last value before the
    ambient layer switches on.

    **The ThemeShadow page is the instrument that settles the one number the source does not
    give**, which is what a composition `BlurRadius` is in CSS pixels of `box-shadow` blur.
    Two depths are photographed on the guest, light theme, a 200 by 200 card of `#fbfbfb` on a
    `#f3f3f3` ground:

    | slider | Elevation | bottom peak | right peak | top peak | extents (b/r/t) |
    | ------ | --------- | ----------- | ---------- | -------- | --------------- |
    | 32     | 16        | 0.1235      | 0.0494     | 0.0082   | 19 / 11 / 3     |
    | 64     | 32        | 0.2346      | 0.1276     | 0.0412   | 39 / 23 / 7     |

    The top edge is the row that proves the formula rather than merely fitting it. At Elevation
    16 the single directional layer is offset 8 pixels down and almost nothing shows above the
    card. At Elevation 32 the ambient layer switches on with an offset of 2, and the peak above
    the card is five times larger. Nothing else in the recipe produces that jump, and no fit
    taken at one depth could have found it.

    **WD-012 closes here, and its own condition was met by accident.** The entry says it would
    be reconsidered "if a ToolTip can be raised and photographed on the guest", after four ways
    of raising one produced nothing. One is stuck on the reference guest's screen through all
    seventeen captures — an orphaned popup the ScrollView page left behind — sitting over a
    `#f9f9f9` page, and its shadow reads 0.078 at the peak and dies in seven rows against the
    tight bottom inset of 8. The condition is now beside the point either way: a ToolTip is
    `DropShadowDepthClass::Small` at Z 16, and the recipe gives its shadow without a photograph.

    **The reference draws every backdrop material as its fallback colour, and two pages say
    so.** On the AcrylicBrush page the default in-app rectangle is opaque near-white and the
    custom one is solid `Green`, its declared `FallbackColor`; the magenta ellipse behind both
    is entirely hidden. On the SystemBackdropElement page, with `Acrylic` selected, the element
    is a plain near-white rounded rectangle. The page's own text warns that this happens.

    That is not a problem to solve but a bar to state. Fidelity here is against the original as
    the reference renders it, and the reference renders a solid fill — which is what this
    library already emits for `AcrylicInAppFillColorDefaultBrush` and its family, because the
    Fluent palette defines those as solids. What is not reproduced is the material on a machine
    with a compositor, and that becomes a divergence with the reference's own rendering as its
    evidence.

    **WD-006 does not close here, and the roadmap line saying it would is the second thing this
    planning pass corrected.** The entry's own condition names "the Styles tranche lands
    `AnimatedIcon` with a motion vocabulary these three can be expressed in", and the motion
    vocabulary is v15's by D34. What this version owes it is smaller and overdue: **its stated
    reason is not true.** WD-006 says the motion "exists here only as a compiled Composition
    graph, which is not a format CSS can read and not one this repository can re-derive a
    keyframe list from." The pin carries the LottieGen output as C++ that spells the keyframe
    list out — `AnimatedChevronUpDownSmallVisualSource.cpp` has a duration of 43,333,333 ticks
    (4.3333s) at `:104`, four cubic Bézier easings with their control points at `:352-367`, an
    `InsertKeyFrame` per keyframe with its progress and its value from `:428`, and a `Markers()`
    map at `:784` that names each state transition's start and end as a fraction of the
    timeline. `NormalOnToPointerOverOn` runs 0.1156 to 0.1502, which is 150ms.

    That does not make the animation cheap — the same file carries path morphs, expression
    animators and geometry that a keyframe list alone does not describe — but "cannot be read"
    and "is expensive to reproduce" are different claims, and the entry makes the first one. It
    is corrected in this version and decided in the next.

    **Compact Sizing is a density scope, and the first draft of this entry overstated it.** It
    was written as "a second set of resource values across eleven controls" and named a version
    of its own, on the assumption that the dictionary was large and not in the checkout. It is
    `controls/dev/dll/DensityStyles/Compact.xaml`, twenty-three lines, and it has been in the
    checkout all along: one implicit `TextBlock` style at font size 14 and sixteen keys, of
    which **eleven are already emitted** by the token layer and five are not
    (`ControlContentThemeFontSize`, `ContentControlFontSize`, `TextControlThemeMinHeight`,
    `TreeViewItemMultiSelectCheckBoxMinHeight`, `ComboBoxEditableTextPadding`).

    What that costs is small precisely because of the token architecture: a density is a scoped
    block redefining the same custom properties, so **no component changes at all** — a
    `[data-density='compact']` block is to density what the theme blocks are to theme. What it
    does cost is the five missing keys and, more interestingly, the hardcodes that stand where
    two of them belong. `TextBox`'s `height: 32px` and `min-width: 318px` carry a `c1-allow`
    saying `controls/dev` "defines only for compact density" — and this file is where. Those
    become tokens, which is the same defect family as unit 1's.

    **What the library does not have, and what it turns out it does not need.** Shapes and
    lines are genuinely absent — `Rectangle`, `Ellipse`, `Polygon`, `Line`, `Polyline`, `Path`
    and a geometry group, which are seven of the version's twenty-five examples between them.
    They are also what the AcrylicBrush page draws under its brush, so Shape comes before
    Acrylic and not after it. `RadialGradientBrush` is absent. `ParallaxView` is filed under
    Motion by the Gallery and goes to item 15 with it.

    **Canvas is scheduled by no tranche and five of this version's examples need it.** The
    roadmap's own unscheduled table lists it under Layout, and the Line page draws all four of
    its examples inside one — `Canvas.Left`, `Canvas.Top` and `Canvas.ZIndex` on labelled
    points — as does the Shape page's polygon. This is the shape v13 hit with `ScrollViewer`:
    a page nothing schedules, inside a version that needs it. D30 answers what it is without a
    new decision, because a `Canvas` is absolute positioning and its whole body would be one
    CSS declaration per prop; it is drawn in the page like Grid and StackPanel, and its row is
    struck with the reason written down. Its own Gallery page stays unscheduled.

    **The icon family is the one that looks absent and is not.** ADR 0012 already decided this
    and already rejected building it: `icon` is a `Snippet` and `glyph` is a recorded shorthand,
    and the ADR's rejected alternative is named, in those words, "a component family — `FontIcon`,
    `SymbolIcon`, `PathIcon`, `BitmapIcon`, `ImageIcon`", rejected because "a snippet already
    admits every one of these shapes without the library owning any of them". The IconElement
    page is six buttons over five icon kinds, and a snippet draws every one of them. So it is a
    page unit and not a component unit, and the only thing it needs that the library lacks is
    the code point behind `<SymbolIcon Symbol="Accept"/>`, read from the reference — which is
    exactly the procedure ADR 0012 prescribes for a symbol name.

    **And the procedure ADR 0012 prescribes rests on a claim that is false.** The ADR says
    `Symbol` "is not carried" because "its name-to-code-point pairs are in the Windows SDK and
    in none of the three pinned upstreams, so shipping them would be a transcription of the
    kind ADR 0001 and ADR 0007 exist to refuse." They are in the control pin, and have been:
    `CSymbolIcon::ConvertSymbolValueToGlyph` at
    `dxaml/xcp/core/core/elements/icon.cpp:461-667` is a switch of **197 cases**, each mapping
    a legacy Segoe UI Symbol code point to the recommended Segoe Fluent Icons one and carrying
    the member's name in a trailing comment. The header comment above it explains the
    remapping: the E0 to E5 range collides with characters some font sets program there.

    That is the third time this project has recorded "not in any pin" about something a pin
    holds — after the two keys v13 found and the shadow recipe above — and each time the search
    was narrower than the claim. The disposition changes with the reason: a table _generated_
    from the pin by a script in `scripts/` and re-derived by C8 is not a transcription at all,
    it is the pipeline `tokens.css` and the Gallery records already use. ADR 0012 is amended
    rather than reinterpreted, because its rejected alternative was rejected on this ground.

    **D35 — a shape is a component; a brush and a shadow are values.** D30 settled the same
    question for Grid and StackPanel and left a test behind: not a component where "a component
    whose whole body is one CSS declaration per prop would give a consumer a worse grid than the
    one the browser already has"; a component where it "is a `FrameworkElement` with its own
    `Thickness` grammar, its page names it as a control, and a consumer porting XAML reaches for
    it by name". The Gallery's own record answers the first clause without argument, because it
    carries each page's base classes: `Shape` and `Line` derive from `FrameworkElement`, and
    `AcrylicBrush`, `RadialGradientBrush` and `ThemeShadow` derive from `Brush`, `Brush` and
    `Shadow`. **An element a consumer places is a component; a value it assigns is a token or a
    string.**

    The second clause decides it the same way. A `Path` takes `Data="F1 M 16,12 20,2L 20,16
1,16"` (`IconElementPathiconButton.txt`) — XAML's path grammar, whose `F0`/`F1` prefix names
    a fill rule that SVG spells as an attribute instead. That is a grammar under a member's
    name, which is exactly what made `Thickness` library code in v11 rather than a string handed
    to CSS, and the reader belongs beside `internal/thickness.ts` for the same reason.

    So this version adds six components and no brush: `Rectangle`, `Ellipse`, `Polygon`,
    `Line`, `Polyline` and `Path` are six names over two families, `RadialGradientBrush` is a
    `radial-gradient` in a page's own CSS, and `ThemeShadow` is what unit 0 puts in the token
    layer.

    **Seven, and the seventh was missed by this survey rather than added to it.** Unit 12 found
    `SystemBackdropElement` in the control pin — `controls/dev/SystemBackdropElement/`, a
    `FrameworkElement` with two properties and no template — and D35's own test returns
    _component_ on four clauses: it is a `FrameworkElement`, `CornerRadius` is a grammar under a
    member's name, its page names it as a control, and a consumer porting XAML reaches for it by
    name. Its negative clause does not fire, because what a page would otherwise hardcode is a
    mapping from a backdrop kind to a fallback colour, which is knowledge rather than markup.
    The survey above missed it because the two backdrop pages were read as pages about a
    material this project has already declined, and D16 declines the material without saying
    anything about the element that hosts it.

    **The units.**

    0. **The drop-shadow recipe becomes the token layer's, and WD-012 closes.**
       `GetDropShadowRecipe` transcribed into the manifest as a function of Z and theme, the
       three depths emitted from it, and the one free parameter — a composition `BlurRadius` in
       CSS pixels of blur — fitted against the two photographed depths and stated as a number
       with its residual. `ToolTip` gains the shadow it has been missing since v6.
    1. **`NumberBox`'s minimum is the state setter's, not the text box's.** v13's owed row, one
       line and a corrected comment, with the two pages whose panes move re-photographed.
    2. **The shape family** — `Rectangle`, `Ellipse`, `Polygon`, and the geometry reader that
       `Data` needs.
    3. **The Shape page**, three examples.
    4. **The line family** — `Line`, `Polyline`, `Path`, and a geometry group.
    5. **The Line page**, four examples.
    6. **The ThemeShadow page**, one example, driven by unit 0's function rather than by a
       second transcription of it.
    7. **The `Symbol` table, generated from the pin**, and ADR 0012 amended on the ground its
       rejected alternative was rejected on.
    8. **The IconElement page**, six examples, drawn with snippets under ADR 0012.
    9. **The AnimatedIcon page**, two examples at their resting frames, and WD-006's stated
       reason corrected.
    10. **The RadialGradientBrush page**, one example, the brush in the page's own CSS.
    11. **The AcrylicBrush page**, three examples over the shapes unit 2 builds, and the
        divergence that says what a fallback colour is and is not.
    12. **The two backdrop pages**, read against D16 and WD-003, which already say the window's
        material is not approximated. Split, as unit 11 was: **12a** the
        `SystemBackdropElement` component the pages need, **12b** the pages themselves.
    13. **The compact density**, as a scoped block over the five keys the layer does not yet
        emit and the two `TextBox` hardcodes that stand where two of them belong.
    14. **The Compact Sizing page**, one example, which is a frame the density radio swaps.

    **Four traps the upstream survey found, recorded here so no unit spec has to rediscover
    them.**

    - **Every slider on the Shape and Line pages starts at its `Minimum`**, because not one of
      them authors a `Value`, and several minima are not zero — the line's end point X starts at
      200, its stroke thickness at 5, the geometry group's two radii at 30. A reproduction that
      starts a slider at zero or at the middle is wrong before it is touched.
    - **RadialGradientBrush is the opposite case.** Its markup says `Center="0.25,0.25"` and
      `GradientOrigin="0.5,.25"`, and `InitializeSliders()` overwrites all six to 0.5 on load
      (`RadialGradientBrushPage.xaml.cs:48-73`). What the page shows at rest is the slider state,
      not the markup state. Its `GradientOrigin` is also a focal point, which CSS's
      `radial-gradient` has no expression for, and `SpreadMethod` `Reflect` and `Repeat` are
      `Mirror` and `Wrap` in Composition.
    - **Two of AcrylicBrush's own constants are dead.** `sc_saturation` 1.25 and
      `sc_exclusionColor` are declared at `AcrylicBrush.h:64-67` and referenced nowhere in the
      checkout; the shipping graph is a blur at radius 30, a luminosity blend, a tint blend and
      a 2% noise layer. A spec that asks for a saturation step is describing the pre-19H1 recipe.
      The noise texture is a 256x256 PNG the checkout does not contain.
    - **The IconElement page's fourth example loads an image over the network** — a raw
      githubusercontent URL, not a local asset (`IconElementPage.xaml:75`). Its only local asset
      is `Assets/SampleMedia/Slices.png`, 90 by 90, used three times.

    **Done-when.**

    - The ten routes render `ItemPage` from the record rather than the placeholder, and each of
      the twenty-five examples shows its header, its source and its options pane where the
      original has one.
    - Seven new components are exported, each with a dev route and a visual spec, each passed
      to `snapshotAllThemes` by literal name, and each compared against the original on the
      guest. Six were surveyed before the version opened; `SystemBackdropElement` is the
      seventh, and the paragraph above says why the survey missed it.
    - The shadow recipe reproduces both photographed depths — all four ramps at each — within a
      tolerance this version states before it fits, and the two existing shadow tokens change or
      do not change with the reason recorded either way.
    - WD-012 is deleted, WD-006's reason is corrected, and every new declaration is cited in
      code.
    - The `Symbol` record is generated from `icon.cpp` and re-derived by C8, never hand-edited,
      and ADR 0012 carries the amendment rather than a reinterpretation.
    - The compact density is a scoped block, and adding it changes no component's code — if a
      component has to change, a value it hardcodes should have been a token and that is the
      finding.
    - Nine gates green, `check` clean, both builds succeeding, every baseline photographed on
      the reference guest.

    **Closed.** Fifteen units, plus two out-of-band commits. Ten pages, seven components, one
    density.

    **What the version cost that its plan did not price.** Three of the fifteen units were
    larger than their line said, and all three for the same reason: the line described the
    artifact and not the path the values reach it by.

    - **Unit 12 was two units**, because `SystemBackdropElement` turned out to be a control in
      the pin rather than markup on a page — the paragraph above unit 12's line records that.
    - **Unit 13 was not "a scoped block".** The block is nine lines. What was not priced is that
      `DensityStyles/Compact.xaml` is not a theme dictionary, so the extractor could not see it
      at all, and the density values had to reach the record before a block could emit them.
      Two of the five keys the line names do not vary by density, and one is in neither pin's
      reachable set.
    - **Unit 14's page transcribes two upstream Pages into one.** `Frame.Navigate` destroys the
      page it leaves, which is why upstream needs `CopyState`; a Svelte component that is never
      unmounted needs nothing, so the mechanism vanishes rather than being reproduced.

    **The trap unit 13 nearly walked into, recorded because it would have passed every gate.**
    The token layer emits five scopes, and the strongest of their selectors —
    `:root:not([data-theme='light']):not([data-theme='high-contrast'])`, inside the
    preference media query — is (0,3,0). Five of the compact keys are declared in four of those
    scopes. A density block written the obvious way, `:root[data-density='compact']`, is
    (0,2,0) and would have been overridden in the dark and high-contrast themes only, silently,
    with nine gates green and every visual baseline unmoved, because no baseline holds a
    density. The rule that shipped is a four-selector list, each selector carrying one more
    attribute than the theme scope it mirrors, and the emitted comment says why so that nobody
    simplifies it back. It was verified by measurement in all four scopes on the guest, with
    the preference scope emulated rather than assumed and proved live by reading the palette
    back as `#202020`.

    **What this version owes.**

    | owed                                                                                                      | what it needs                                                                                                            |
    | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
    | the System Backdrops prose runs 0.379px per line below the reference's, 353 against 348 over twelve lines | WD-018's own remedy — a local `line-height` on that one element — and that page's baseline                               |
    | WD-042 — four text controls floor at 318 where WinUI floors at 64                                         | the four declarations, and the dev-route baselines that a 64-pixel floor would collapse                                  |
    | C9 does not follow a token whose value is a bare `var()`                                                  | one resolution step in the gate; three declarations were invalid for four versions and nothing noticed                   |
    | the ComboBox chevron column is fixed at 38 upstream, ours is 12 plus 14                                   | the same measurement pass as its trigger height, 34 against WinUI's 32                                                   |
    | `ControlExample`'s options pane is 233 wide at x 1330 against 232 at x 1331, `#fcfcfc` against `#fbfbfb`  | `.options` is content-box with `border-width: 0 0 0 1px`; three baselines move, and it does not show at every pane width |
    | unstyled text is the browser's 16px in both densities                                                     | XAML's own TextBlock default, which is in neither pin                                                                    |

    **A correction to this entry's own first reading of the line height.** It called the line
    height "the version's one unexplained geometry" and put it in the table above as a fix still
    to be derived. It is neither unexplained nor owed: **ADR 0011 decided it and WD-018 records
    it**, both of them before this version opened, and this entry cited neither. XAML advances a
    baseline within one `TextBlock` by the font's unrounded spacing, `(2210 + 514 + 0) / 2048` =
    1.330078125 of the font size, 18.621px at Body; Chromium's `normal` is
    `round(ascent_px) + round(descent_px)`, an integer 19. The ADR chose `normal` knowing it
    loses the within-block advance, because the alternative — a unitless ratio — takes the same
    0.379px off every **single-line** box instead, and those sum inside a container that measures
    them: TeachingTip's card comes out 310.469 with `normal` against the original's 310, and
    309.297 with the ratio. A library made almost entirely of stacked single-line boxes puts the
    error where there is less of it.

    **The number this entry reported was read off the wrong feature.** It gives the reference
    advancing 18.25px against the ADR's derived 18.621. The two disagree because this version
    measured **ink tops** from a capture — which move with whether a line happens to carry a
    capital or an ascender — where ADR 0011 measured **baselines**, and said in as many words why
    a single wrapped block cannot settle the question on its own. 18.25 is not a competing value
    for the font's spacing. It is the same spacing read off a feature that does not track it.

    **What is actually owed is small, and WD-018 already names it.** That entry's "would
    reconsider if" clause anticipates this page exactly — "a control whose reproduction turns on a
    wrapped paragraph of four or more lines, where the drift reaches a pixel and a half and a
    local `line-height` on that one element becomes worth its cost". The System Backdrops prose is
    twelve lines and its first example's pane comes out 353 tall against 348, which is why every
    other geometry on both backdrop pages matched to the pixel and that one did not. The remedy is
    one declaration on one element and that page's baseline — not a change to the ramp, and not a
    version of its own.

    **A correction to v13's closing entry.** That entry's `NumberBox` row calls
    `TextControlThemeMinWidth` "the 318 every text box has". It is **64**, defined only in the
    framework dictionary (`generic.xaml:100`, `:3727`, `:5709`); the control pin references the
    key in six templates and defines it nowhere, and the token layer has emitted 64 all along.
    The 318 was this reproduction's own hardcode, read back as though it were the resource's
    value. The consequence inverts the row's reading: `NumberBoxMinWidth` is 120, so the
    `SpinButtonsVisible` setter **raises** the InputBox's floor rather than lowering it, and its
    purpose is that a NumberBox showing two spin buttons needs a wider floor than a plain text
    box — not, as the row says, that a NumberBox may be narrower than one. WD-042 carries the
    evidence, and the unit that removes the 318 settles both rows at once.

15. **Motion** (7) — Animation interop, Connected Animation, Easing Functions, Implicit
    Transitions, Page Transitions, Theme Transitions, and **ParallaxView**, which the Gallery
    files under Motion and which is the group's one ordinary control.

    **The goal, in one line: the Motion group's seven pages render on the frame, and the
    animations they demonstrate can be judged by something.**

    The second clause is the version, and D34 is why it is a clause at all. This tranche's
    acceptance problem is v13's one level further out. There, the harness could not photograph
    the subject because headless Chromium paints no `::-webkit-scrollbar`; the answer was to
    make the scrollbar out of elements, and a `div` photographs. Here the subject is not a thing
    but an interval, and no still frame of any of these pages contains it.

    The instrument is v15's first unit and the rest of the version waits on it. What it has to
    do is turn an interval into a still: a page that renders a fixed set of samples of an
    animation's own curve, so that a baseline compares the curve rather than the resting frame.
    CSS gives two handles for that — a paused animation with a negative delay names one frame
    exactly, and `linear()` expresses any closed-form easing to whatever precision the sampling
    asks for — and XAML's easing functions are closed forms rather than compiled data, which is
    the difference between this tranche and WD-006's Lottie sources.

    The framework's own motion vocabulary is four durations and one spline
    (`generic.xaml:23271-23275`), and the token layer emits all five:
    `ControlNormalAnimationDuration` 250ms, `ControlFastAnimationDuration` 167ms,
    `ControlFastAnimationAfterDuration` 168ms, `ControlFasterAnimationDuration` 83ms and
    `ControlFastOutSlowInKeySpline` as `cubic-bezier(0, 0, 0, 1)`. An earlier draft of this
    entry said the After duration was emitted by nothing; `tokens.css:849` has it, and the
    claim was stale rather than wrong when written.

    **The seven pages, read in the pinned Gallery before anything was decided.**

    | page                 | examples                          | what it shows                                                                    | what actually moves                               |
    | -------------------- | --------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
    | Animation interop    | 5 (`XamlCompInteropPage.xaml`)    | a natural-motion animation and four `ExpressionAnimation`s                       | composition expressions, re-evaluated every frame |
    | Connected Animation  | 4 (`ConnectedAnimationPage.xaml`) | one element travelling between two layouts, three times across a page navigation | that element's position and size                  |
    | Easing Functions     | 4 (`EasingFunctionPage.xaml`)     | three Animate buttons and three squares, then a gallery of XAML's own curves     | one translation, under each curve in turn         |
    | Implicit Transitions | 6 (`ImplicitTransitionPage.xaml`) | a square whose opacity, rotation, scale, translation or background you set       | whichever property was just set                   |
    | Page Transitions     | 1 (`PageTransitionPage.xaml`)     | a `Frame` and eight radio-selected `NavigationTransitionInfo` modes              | a page entering and the one before it leaving     |
    | Theme Transitions    | 5 (`ThemeTransitionPage.xaml`)    | items added, repositioned, refreshed and deleted, and a popup opening            | the platform's own five classic transitions       |
    | ParallaxView         | 2 (`ParallaxViewPage.xaml`)       | an image behind a `ListView`, then behind a `ScrollView`                         | the image, at a fraction of the scroller's offset |

    Twenty-seven examples over seven pages, which is what the version is sized against rather
    than the page count.

    **Where the numbers are, and it is not one answer for all seven.** This was searched before
    the units were written, because the tranche's acceptance problem made it look uniform and it
    is not.

    | page                 | the numbers                                                                                                                                                                                                                                                                                                                                                   |
    | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | Easing Functions     | XAML's easing classes are closed forms, so the curve is the definition                                                                                                                                                                                                                                                                                        |
    | Connected Animation  | `ConnectedAnimationService.cpp:26-28` — 300ms and `cubic-bezier(0.8, 0, 0.2, 1)`, literal                                                                                                                                                                                                                                                                     |
    | Page Transitions     | `dxaml/phone/lib/ThemeTransitions.cpp:1545-1552` — offsets 150 and −200, two control-point pairs, 150ms and 300ms                                                                                                                                                                                                                                             |
    | ParallaxView         | `controls/dev/ParallaxView/` — a control with a real source, and `ScrollInputHelper.cpp` beside it                                                                                                                                                                                                                                                            |
    | Implicit Transitions | the page sets none, so the defaults are the numbers, and they are not one number: `ScalarTransition` and `Vector3Transition` are 3000000 ticks = 300ms (`SimplePropertiesMetadata.g.h:370`, `:426`) under `cubic-bezier(0.8, 0, 0.2, 1)`, and `BrushTransition` is 1500000 ticks = **150ms** (`:363`) under `linear` (`SharedTransitionAnimations.cpp:15-24`) |
    | Theme Transitions    | **in no pin.** See D40                                                                                                                                                                                                                                                                                                                                        |
    | Animation interop    | the four expressions are literals in the page's own code-behind; the spring's curve is in **no pin**. See D41                                                                                                                                                                                                                                                 |

    **Theme Transitions' five are in Windows, not in the pin, and here is the search behind that
    negative.** `LayoutTransition_partial.cpp:1443` calls
    `ThemeGenerator::AddTimelinesForThemeAnimation(TAS_ENTERPAGE, TA_ENTERPAGE_TARGET, …)`, and
    `ThemeGenerator.cpp:742` implements that by calling `OpenThemeData(NULL, L"Animations")` and
    `GetThemeAnimationProperty` — the Windows visual-theme system, reading keyframes out of the
    running theme at runtime. Across all three pins the `TAS_*` and `TA_*` constants and
    `GetThemeAnimationProperty` are **used and never defined**, and neither `uxtheme.h` nor
    `vssym32.h` is present. This is a different gap from WD-006's: there the numbers are in the
    pin and expensive to transcribe; here they are not in the pin at all.

    The newer transitions are the opposite. `DrillInThemeAnimation` carries
    `Cubic-Bezier (0.1, 0.9, 0.2, 1.0)` for scale and `(0.17, 0.17, 0.0, 1.0)` for opacity as
    literals with those comments (`ThemeAnimations.cpp:1091-1099`), and
    `MenuPopupThemeTransition`, `SplitOpen/CloseThemeAnimation`, `PickerFlyoutThemeTransition`
    and `ContentDialogOpenCloseThemeTransition` each carry `s_OpenDuration` 250,
    `s_CloseDuration` 167 and `s_OpacityChangeDuration` 83 as named constants. Those three
    numbers are the motion vocabulary this library already emits, which is the strongest
    evidence yet that the vocabulary is the right one.

    **D39 — a motion value transcribed from a source site is a `c1-allow`'d literal citing that
    site, not a token.** Tokens come from dictionaries (ADR 0001) and these come from `.cpp`
    files, so a token would be inventing a resource upstream does not have. The precedent is
    already in the library: `Button.svelte:83` writes `transition: background 83ms` under a
    `c1-allow` naming `Button_themeresources.xaml:174`, rather than reading
    `ControlFasterAnimationDuration`, because the XAML binds a duration and not the resource.

    **D40 — Theme Transitions takes its shape from the pin's nearest modern relative, and the
    numbers are declared approximate.** Measuring the five off the reference guest would mean
    fitting a curve to a frame sequence, which is an instrument this project does not have and
    which the version's goal does not need. Each of the five has a counterpart in the newer
    family whose control points and durations are literal, and that counterpart's shape is what
    the page transcribes. A WD row records that the numbers are the relative's and not the
    transition's, with this search as its evidence.

    **D41 — Animation interop reproduces all five of its expressions and declines only the
    spring's curve.** Two of the five reference `ActualSize` and `ActualOffset` to position one
    element against another, which is a layout statement CSS makes directly. This entry used to
    decline the other three, on the grounds that a composition `ExpressionAnimation` is a
    per-frame evaluator and nothing else in this library needs one. **That was a claim about
    CSS, written without testing it, and it is wrong.** A registered custom property
    transitioned on a common ancestor _is_ the evaluator: every descendant that reads it through
    `calc()` is re-resolved on each of those frames. Prototyped on the reference guest before
    the unit's spec was written — with the ancestor's property at 1.27772 mid-transition, the
    sibling computing `calc(1 / var(...))` gave 0.782644; the four-button chain's `rem()`
    arithmetic reproduced, on all three followers, the +25px the reference guest itself moved
    them by; and the circle's `cos()`, `sin()` and `pi` agreed with the closed form to four
    decimal places across sixteen positions at two radii. So the page demonstrates what its own
    headers say it demonstrates, rather than showing three inert examples beside a row
    explaining why.

    What is left is the spring itself. `SpringVector3NaturalMotionAnimation` is in neither pin —
    five of its names searched across both, zero files each, the Gallery's own call site the
    only occurrence anywhere under `.upstream/` — so its curve is a sampled model of the
    standard damped-oscillator step response rather than a transcription, and one WD row carries
    that with the search behind it. A second carries two brushes the token extractor's source
    set does not reach.

    **The units.**

    1. **The instrument**, and the rest of the version waits on it. A `dev/motion` route that
       renders an animation as a strip of frames — one element per sample, each
       `animation-play-state: paused` with `animation-delay` at `−k × duration / n` — so that a
       baseline compares the curve rather than the resting frame. Verified available on the
       reference guest (Edge 151): `linear()`, `animation-timeline: scroll()` and `view()`, a
       paused animation at a negative delay, and `document.getAnimations()`.
    2. **Easing Functions** (4). The instrument's own subject, so it goes first among the pages.
    3. **Implicit Transitions** (6). The most CSS-native page of the seven: `ScalarTransition`,
       `Vector3Transition` and `BrushTransition` at their defaults are a `transition` with one
       duration and one curve. The scalar and vector defaults — 300ms under
       `cubic-bezier(0.8, 0, 0.2, 1)` — are the same numbers Connected Animation's service
       carries, so the two pages demonstrate one platform curve and a divergence in either would
       have to be a divergence in both. `BrushTransition` is not on that pair: it is **150ms**
       and `linear`, which the table above now states separately because reading the row as one
       duration with two curves is the mistake it invited.
    4. **Theme Transitions** (5), under D40.
    5. **Page Transitions** (1 example, 8 modes).
    6. **Connected Animation** (4). Three of the four cross a page navigation — this entry said
       two, which was read off the page listing before the sample pages were; only the card
       example (`CardPage.xaml`) travels within one page, over a smoke layer. So the unit owes a
       decision about what "a page" is in the Gallery shell before it owes any motion.
    7. **Animation interop** (5), under D41 — which this unit rewrote. All five examples are
       live, because a registered custom property is the per-frame evaluator the entry had said
       CSS does not have.
    8. **`ParallaxView`**, the group's one ordinary control: a component and its page (2).
       `animation-timeline: scroll()` is supported on the guest, so this is CSS rather than a
       scroll listener.

    **What the instrument photographs, and what it cannot.** Prototyped on the reference guest
    before this entry was written, both halves exact and both drift-free. A declared animation
    paused at a negative delay names one frame to within 0.0004px of the numerically solved
    curve, and re-reading it across 300ms and a forced paint moves it not at all. A CSS
    transition — which `animation-play-state` cannot pause, and which Implicit Transitions is six
    examples of — is reached instead through `getAnimations()`, paused and seeked by
    `currentTime`, with an error and a drift of exactly zero. `linear()` carries XAML's
    non-bezier easings to whatever precision is asked, and **how much is asked is decided by the
    worst curve rather than by a typical one**. Unit 1's figure — thirty-two stops erring by
    0.17px over 200px of travel — is `QuinticEase` sampled at eleven points, which is the
    easiest of the eleven easings read at the coarsest useful grid. Measured across all thirty-
    three curves at forty-one sample points, thirty-two stops err by **14.2px**, and the binding
    curve is `BounceEase` rather than any polynomial. The count that puts every curve inside a
    quarter of a pixel is **256**, where the worst is 0.187px and `ElasticEase` decides it.

    **The instrument is blind to duration, and this is structural.** It samples at `k / n` of the
    animation's own duration, so that duration cancels and a strip photographed at 250ms is
    identical to one at 2500ms. The curve is judged by the picture; the duration has to be judged
    by a number, read off `getAnimations()[0].effect.getTiming()` in the spec beside the
    snapshot. Neither substitutes for the other, and a unit that ships only the strip has
    verified half of what it claims.

    **The harness finishes animations before it photographs them, and unit 1 found out the
    expensive way.** `toHaveScreenshot` defaults to `animations: 'disabled'`, which does not
    freeze a running animation but seeks it to its **end** and leaves it there. The instrument's
    eleven paused frames were all sent to the end frame and stacked, so six different curves
    photographed as six identical single squares — with every gate green, because the DOM
    assertions beside the snapshot read the page rather than the picture, and a _first_ baseline
    written from a wrong render agrees with itself forever after. `snapshotAllThemes` now takes
    the setting as a fourth argument and `/dev/motion` passes `'allow'`; the default stays
    `disabled`, which is right for every route photographing a control at rest.

    Two things follow that later units should use. Every animated control already in the
    library — `ProgressBar`, `ProgressRing`, `RefreshVisualizer` — has been photographed at its
    animation's **last frame** for fourteen versions, so their motion has never been
    photographed at all and the instrument is now the thing that could. And Svelte scopes a
    `@keyframes` name to `svelte-<content-hash>-<name>`, so a test collects animations from the
    elements rather than filtering `document.getAnimations()` by a name that changes whenever a
    word in the component does.

    **A conformance change considered and declined.** C1's `SIZED_PROPS` covers `transition`,
    `transition-duration`, `animation` and `animation-duration` and not
    `animation-timing-function` or `transition-timing-function`, which is why
    `ProgressBar.svelte:222` writes a `cubic-bezier` with no exemption — twenty-one such
    declarations stand across the library and the Gallery frame. Extending the gate would mean
    retrofitting twenty-one citations, and what it buys is bookkeeping: C1 asks whether a literal
    carries a comment, not whether it is right. For this one class of value the instrument above
    is the stronger check, because it photographs the curve and a wrong one fails a baseline.
    Reopen if v15 finishes and the timing functions have proved hard to keep cited.

    **Done-when.** Seven routes exist and are registered; twenty-seven examples render; the
    instrument photographs every curve the version claims; the nine gates pass; and every
    declined behaviour is a WD row cited from the page that declines it.

    **v15 closes.** Its eight units are sealed in ten commits — the instrument, the eleven-easing
    library, seven pages and one control, plus one that is none of those and is the most useful
    thing the version found — beside five that correct the plan rather than add to it.
    Twenty-seven examples render on the frame and every one of them can be judged by something,
    which was the version's second clause and the reason it was a version at all.

    **What the plan priced wrongly, three times, and each time in the same direction.** Every
    one of the three was a claim about what CSS can do, written without running CSS.

    - **D41 declined three of Animation interop's five examples** because a composition
      `ExpressionAnimation` is a per-frame evaluator "and nothing else in this library needs
      one". A registered custom property transitioned on a common ancestor _is_ that evaluator.
      One prototype turned three dead examples into three live ones and left only the spring's
      curve, which is in neither pin, as a real divergence. The entry is rewritten at its own
      site.
    - **Unit 1's instrument was right and the harness undid it.** `toHaveScreenshot` does not
      freeze a running animation, it seeks it to its end — so eleven frames of one curve stacked
      into one square, with every gate green and a first baseline agreeing with itself forever
      after.
    - **"`animation-timeline: scroll()` is supported on the guest, so this is CSS rather than a
      scroll listener"** is true and was read as more than it says. `ParallaxView`'s own source
      is a layout pass that measures five scalars and an expression the compositor evaluates
      from them (`ParallaxView.cpp:483-489`), and the reproduction has to split at the same
      seam: TypeScript measures on resize, the timeline evaluates per frame. A reading that
      hears "no JavaScript" builds the wrong control.

    The common shape is that a planning sentence about a capability is a hypothesis, and the
    cheapest moment to run it is before the spec that inherits it. This version ran it three
    times and the sentence was incomplete three times.

    **The version's most useful finding is not motion.** `ListView`, `GridView`, `TreeView` and
    `ItemsView` each passed `class="viewport"` to the `ScrollView` they render, and a class
    handed to a component lands on its root without the caller's scope hash — so `ScrollView`'s
    own `.viewport` rule matched that root and four controls shipped a scroller whose root was
    `overflow: auto` where their own stylesheet said `hidden`. Nothing moved when it was
    removed, because the root never actually scrolls; what made it visible was the first control
    that had to _find_ somebody else's scroll box.

    **What v15 owes.** Ten `WD` rows, WD-043 to WD-052, each cited from the page that declines
    it. Two of them are the same sentence about the same limit, and it is worth naming once:
    **CSS has no length for the width a wrapped box actually used.** A `TextBlock` with
    `MaxWidth` and `TextWrapping` reports the widest line it wrapped to; `width: max-content`
    under a `max-width` reports the cap. Animation interop's popup came out 200 where upstream
    draws 185, and ParallaxView's two captions sit eighteen pixels left of where Windows draws
    them. No third mechanism was found; both pages state the reading at their own site.

    Three things this version measured and did not act on. `text-box-trim` is available on the
    reference guest, which is the clause WD-018 said it would reconsider on. The library's
    `ScrollViewer` reserves no layout width for its always-visible bar where upstream reserves
    fourteen. And the library's `Slider` gives its control no accessible name from its `header`,
    so a probe cannot address one by role — filed for the driving session rather than for a unit
    loop, along with the rest of D5's lane.

16. **Media / Windowing / System / Shell** (18) — the four groups the roadmap took by count
    rather than by name. Every other tranche reproduces chrome around a control; these pages are
    chrome around an operating system, and that is the whole of the version's difficulty.

    **The goal, in one line: the four groups' eighteen pages render on the frame, and where the
    web will not do what a page demonstrates, the page says so at its own site.**

    O2 resolved the disposition long before there was a page to apply it to — keep every page in
    the navigation tree, implement what the web can actually do, and render the rest as an honest
    panel in the original's slot. What O2 did not say is which pages are which, and answering
    that is what this entry had to do before it could size anything.

    **The eighteen pages, read in the pinned Gallery before anything was decided.** Fifty-one
    examples, one `ControlExample` per sample file on every one of the eighteen, which is what
    the version is sized against rather than the page count.

    | group     | page                             | ex. | what it demonstrates                                                          | what this library lacks                               |
    | --------- | -------------------------------- | --- | ----------------------------------------------------------------------------- | ----------------------------------------------------- |
    | Media     | Image                            | 6   | a local file, stretching, nine-grid, decode-to-render-size, SVG, animated GIF | the control                                           |
    | Media     | PersonPicture                    | 1   | initials, display name, picture and badge, under eleven option toggles        | the control                                           |
    | Media     | AnimatedVisualPlayer             | 1   | playback of a Lottie animation                                                | the control, and the composition it plays             |
    | Media     | MediaPlayerElement               | 2   | a video that autoplays, and one with transport controls                       | the control, and `MediaTransportControls`             |
    | Media     | WebView2                         | 1   | a page hosted inside the app                                                  | the control                                           |
    | Media     | Capture Element / Camera Preview | 1   | a `MediaCapture` preview displayed through a `MediaPlayerElement`             | the control, and a camera                             |
    | Media     | Sound                            | 3   | element sound on and off, spatial audio, one named system sound               | nothing structural — the sounds themselves            |
    | Media     | MapControl                       | 1   | a pin on a map, behind a service token the reader supplies                    | nothing: the page's own default state is a screenshot |
    | Windowing | AppWindow                        | 7   | three presenters, size limits, centring, creation from a `Window`, a modal    | a second window                                       |
    | Windowing | AppWindowTitleBar                | 3   | colour customisation, preferred theme and height, extending content           | a title bar that belongs to the system                |
    | Windowing | TitleBar                         | 3   | the end-to-end sample, configuration, drag regions                            | nothing — `TitleBar` is v2's and the shell draws it   |
    | Windowing | Multiple windows                 | 1   | a second single-threaded top-level window                                     | a second window                                       |
    | System    | Clipboard                        | 6   | copy and paste text, an image and files; history and roaming; the rest        | the clipboard                                         |
    | System    | Storage pickers                  | 5   | pick one file, many, a folder; save; a file's thumbnail                       | the picker                                            |
    | System    | ContentIsland                    | 1   | a 3D model island clipping and scrolling inside a `ScrollViewer`              | the island                                            |
    | Shell     | App notifications                | 5   | basic, logo and custom audio, a progress bar, a hero image, controls          | the toast                                             |
    | Shell     | Badge notifications              | 2   | a count, and a glyph                                                          | the badge                                             |
    | Shell     | JumpList                         | 2   | tasks, and a custom group                                                     | the jump list                                         |

    **The last column is not the disposition, and reading it as one would size this version at
    four times what it is.** The Goal's second paragraph makes visual fidelity the bar and
    behavioural fidelity explicitly not it. Most of these pages are a `StackPanel` of buttons,
    text boxes, radio buttons and an `InfoBar` around one API call, and all of that reproduces at
    full fidelity with no capability whatsoever — what the missing capability decides is whether
    pressing the button does anything, which is the half this project does not chase. Six pages
    need a control that does not exist and are ordinary control work; the other twelve are
    ordinary page work with a behavioural hole, and the hole is a `WD` row.

    **The capability readings, measured on the reference guest rather than asserted.** v15 closed
    on the finding that a planning sentence about a capability is a hypothesis in both
    directions; this tranche is made of such sentences, so they were run first. Both columns were
    read in the same browser in the same session — the left at a trusted origin, the right at the
    Gallery's own.

    | what four of these pages turn on                                  | a secure origin                      | the Gallery as we serve it |
    | ----------------------------------------------------------------- | ------------------------------------ | -------------------------- |
    | `window.isSecureContext`                                          | `true`                               | `false`                    |
    | `navigator.clipboard`                                             | present, `read` a function           | the property is absent     |
    | `showOpenFilePicker`, `showSaveFilePicker`, `showDirectoryPicker` | three functions                      | three `undefined`          |
    | `navigator.setAppBadge`                                           | a function                           | `undefined`                |
    | `navigator.mediaDevices`                                          | an object, `getUserMedia` a function | `undefined`                |
    | `window.documentPictureInPicture`                                 | an object with `requestWindow`       | `undefined`                |
    | `Notification.permission`                                         | `default`                            | `denied`                   |

    **Every capability that would decide four of the eighteen pages is present in Edge 151 and
    absent from our harness, and the difference is the origin and not the browser.** The Gallery
    is served to the guest over plain HTTP at a gateway address, which is not a secure context;
    a secure context is the precondition on all of them. Had the split been read off the Gallery
    origin — the obvious place to read it, and the one a probe lands on by default — Clipboard,
    Storage pickers, Badge notifications and the camera page would each have been declined on
    evidence that measured our own serving script. This is the v15 lesson recurring with the
    trap moved: the measurement was the hypothesis this time, not the prose.

    What is present regardless of origin, and therefore genuinely available: `Notification` as a
    constructor with `maxActions` 2 and `image` on its prototype; `requestFullscreen` with
    `document.fullscreenEnabled` true; `window.open`; `AudioContext` and `PannerNode`;
    `navigator.windowControlsOverlay`; H.264, VP9, AAC and MP3 all `probably`; and
    `border-image-slice: 5 fill`, `object-fit` and `aspect-ratio` all supported — which is
    Image's nine-grid, its stretching, and MediaPlayerElement's video, whole.

    And one reading that belongs to this VM rather than to the web: `enumerateDevices()` returns
    an **empty array**. The guest has no camera and no microphone, so Capture Element has nothing
    to preview even from a secure origin, and no still frame of that page can show it working.
    That is the same shape of acceptance problem as v13's scrollbar and v15's interval, and it
    is the only page in the tranche that has it.

    **D42 — a capability the web has and this harness withholds is a different record from one
    the web does not have.** Both end as a `WD` row and the two say different things: one
    declines a behaviour, the other declines a demonstration and names the condition under which
    it would work. Collapsing them would put "the web cannot read the clipboard" into the record,
    which is false, and would make the row unfixable by anything except a rewrite. The rows that
    turn on the serving origin say so and cite this reading.

    **D43 — the not-applicable panel is a stand-in for a declined element, and the unit that
    first needs one builds it.** O2 called for "an honest panel" and left its shape open. An
    earlier draft of this entry made it the replacement for an example's example pane and made
    building it the version's first unit; reading the twelve pages' resting states corrected
    both halves.

    **At rest these pages are ordinary XAML.** Clipboard is thirteen `StackPanel`s of
    `TextBlock`, `Button`, `ToggleSwitch`, `TextBox` and `Image`; Storage pickers is eleven
    `ComboBox`es, seven `TextBox`es and six `Button`s; AppWindow is seventeen `TextBlock`s,
    eight `NumberBox`es and seven `Button`s; JumpList is two `Button`s and a paragraph under a
    warning `InfoBar` the page itself carries (`JumpListPage.xaml:12-14`), which is upstream's
    own vocabulary for "this does not work here"; and ContentIsland at rest is a `Button` and
    six 400-square card `Rectangle`s, because the islands appear only once "Load model" is
    pressed. Every one of those controls exists in this library. **What these pages decline is
    almost never a pane — it is what happens after a click**, and a declined behaviour is a `WD`
    row, which this project has had since v4.

    So the panel's real users are the few examples where a control this reproduction does not
    have would occupy a box: MapControl's map behind its token, and whatever of Media's five
    survives its own unit. It is one component in `apps/gallery/src/lib/frame/`, it carries the
    reason and the row number and nothing else, and it is built when the first such box appears
    rather than in advance — a component whose users are hypothetical is designed against
    hypothetical users. A panel that argues in prose would be a second copy of
    `docs/divergences.md` that nothing keeps in step.

    **Two page-level dependencies the same reading found.** `AppWindowTitleBarPage.xaml` uses
    twelve `ColorSelector`s, which is the Gallery's own control (`WinUIGallery/Controls/`) and
    not WinUI's, so Windowing's unit builds it the way v10 built `ControlExample`. **That
    sentence was written without opening the control, and it is half wrong.** Building
    `ColorSelector` is not self-contained: `ColorSelector.xaml:19-32` puts a `ColorPicker` in
    the `SplitButton`'s flyout, and `ColorPicker` is one of the four components item 17 owes.
    Measured in the unit rather than argued: at rest the control is a 64x32 swatch and a
    chevron half, 100x33 together, and that reproduces exactly — so the page cost nothing extra
    and the flyout became WD-066. What the miss would have cost is the estimate, not the work,
    and the lesson is the one the `pair-workflow` states about API surfaces: a planning
    sentence naming a dependency is a claim about a file, and reading the file is cheaper than
    any of its consequences. And four of
    these pages write their prose as `RichTextBlock` with `Paragraph`, `Run`, `Hyperlink` and
    `Underline` — item 17's components, which this version does not wait for: `styles/acrylic`,
    `styles/compactsizing` and `motion/easingfunction` already reproduce exactly that shape as
    HTML under a citing comment, and these pages follow the precedent.

    **D44 — the sample video is re-encoded, and it is the only asset in the pinned set that has
    to be.** `Assets/SampleMedia` carries `fishes.wmv` and `ladybug.wmv`, and WMV is the one
    container no browser plays; the images these pages draw are JPEG, PNG, GIF and SVG, which
    Edge decodes as they are. H.264 in MP4 reads `probably` on the guest, so the transcode is
    to that, and a `WD` row records that the bytes are not the pin's while the frames are.

    **D45 — AnimatedVisualPlayer ships, and what its Gallery page draws is the pinned
    composition's own resting frame.** The page's source is `LottieLogo1.cs`, 236KB of
    LottieGen-generated Composition calls, and transcribing it is WD-006's problem at full scale
    — WD-006 declined 63 `CompositionObject`s for one settings gear. An earlier draft of this
    entry read the page's prose as a description of what it renders:
    `AnimatedVisualPlayerPage.xaml:26` says the player "falls back to an Image when its Source is
    unavailable", so the plan was to render `FallbackContent` (`AnimatedVisualPlayer.idl:86`) and
    leave `IsAnimatedVisualLoaded` (`:91`) false. Photographed on the reference guest, that is not
    what the page shows. The composition loads, and `AutoPlay="False"` holds it at progress 0 — a
    flat #00D1C1 rectangle, the visual's 375x667 scaled Uniform to 223.8x398 and centred in the
    example's 400x400 card. The page sets no `FallbackContent` at all, so upstream's fallback
    path would draw nothing there. That sentence in the prose is a condition the reference guest
    never meets, and it is the sentence this entry mistook for a measurement.

    So the control is built whole — `Stretch`, the transport methods, `FallbackContent` and
    `IsAnimatedVisualLoaded` included — `Source` takes an object carrying the visual's size, its
    duration and a progress-indexed snippet, the way `IAnimatedVisualSource` creates an
    `IAnimatedVisual`, and the Gallery page's source draws the one frame the original rests on. A
    `WD` row carries what that declines: the 5.967-second wordmark the transport buttons reveal,
    with the size of the codegen behind it.

    **Eight units, and the control work comes first.** The Goal's third paragraph schedules
    work that leaves something in `packages/winui-svelte` ahead of work that only improves the
    harness, and this tranche splits along that line more sharply than any before it: six pages
    need a control and twelve need none. So Media is built first and its five units carry every
    component the version adds, and the twelve pages that are pages follow.

    1. **Image** — the control and its six examples. `Stretch`'s four modes, `NineGrid` as
       `border-image-slice`, `DecodePixelWidth`/`Height`, an SVG source and an animated GIF. The
       one page in the tranche that is an ordinary control unit from end to end.
    2. **PersonPicture** — the control and its page: initials derived from a display name, a
       profile picture, the badge in its three forms, and the eleven option toggles the single
       example carries.
    3. **AnimatedVisualPlayer**, under D45, **and the Sound page**, the one Media page asking
       for no control this library lacks. Sound's three examples are a `ToggleSwitch`, a
       `CheckBox` and seven `Button`s around `ElementSoundPlayer`, and what they play is not
       reproducible from what is pinned: neither pin carries a single `.wav`, because the sounds
       are the shipped framework's own resources. `AudioContext` and `PannerNode` are present on
       the guest and have nothing to play through them, so the page reproduces whole and a `WD`
       row declines the audio.
    4. **MediaPlayerElement**, under D44, with `MediaTransportControls` — a template, not a
       `<video controls>` attribute, and the unit's real work.
    5. **WebView2, Capture Element and MapControl.** Media closes. Two of the three are one HTML
       element with a WinUI surface on it; MapControl is a page whose default state is a
       screenshot, which makes it the tranche's cheapest page rather than its most declined.
    6. **Windowing's four.** `TitleBar`'s page is a page for a control v2 already built, which no
       other page in this tranche is.
    7. **System's three.**
    8. **Shell's three.**

    **Done-when.** Eighteen routes exist and are registered; no page in the four groups still
    resolves to the catch-all placeholder; fifty-one examples render; the nine gates pass; and
    every declined behaviour is a `WD` row cited from the page that declines it, with the rows
    that turn on the serving origin saying so.

17. **The components a 1.0 owes** (4) — `TextBlock` and the `Inlines` model under it,
    `RichTextBlock`, `CommandBarFlyout`, `ColorPicker`. Its **first unit builds nothing**: it
    dispositions the eighteen pages still scheduled by no tranche, in or out of the 1.0 surface,
    with the reason recorded. Deciding late is what makes that expensive, and a public API is
    where it is most expensive — `CLAUDE.md` makes the same argument about git history.

    `Hyperlink` arrives with `TextBlock` rather than on its own. It is not a Gallery page; it is
    an inline, and three sites already carry a comment saying this library has no control for it
    — `design/typography/+page.svelte:14`, `styles/animatedicon/+page.svelte:183`, and the two
    anchors on `styles/acrylic/+page.svelte`. `TextBlock`'s `Inlines` is where it belongs.

    **`TextBlock` is a component, and that is D38.** The library already emits the type ramp as
    classes — `winui-BodyTextBlockStyle` and its siblings — and every page in this reproduction
    puts one on a plain `<p>` or `<span>`. That was never a decision that `TextBlock` is a class
    rather than a control; it is what the ramp needed and nothing more was asked. Read as an
    API it says _for this one control, add a class instead_ — a rule with exactly one member,
    which is the shape of a hole rather than of a design.

    So the component wraps the class rather than replacing it: `TextBlock` renders the ramp
    class its style names, the classes stay public and documented as what it emits, and a
    consumer who wants the class alone still has it. The members that make it more than a
    `<span>` are the ones with no CSS one-liner — `TextTrimming`, `MaxLines`, `TextWrapping`,
    `IsTextSelectionEnabled` — and `Inlines`, which is where `Hyperlink`, `Run`, `Bold` and
    `LineBreak` live. The last of those has already cost this project a fix twice: XAML's
    trailing `LineBreak` makes an empty line and CSS's `<br>` makes none, and two pages carry a
    `::after` rule to put it back.

18. **What the versions owe** — the punch list, drained. Every `what this version still owes`
    table from v4 onward, and `docs/surface.md`, which is the sweep of the half of each control
    that is in its code-behind rather than in its template. This version's own goal line is that
    no sealed control has an unbuilt second half.

    **Its last unit is the library gate below**, which is the release bar.

19. **The Gallery's remaining pages** — every item page no version builds. This version exists
    because `Final` needs all 120 and the roadmap stops at 55: counted when v16 closed, the
    Gallery has **55 of its 120 item pages** and the sixty-five that remain are owned by
    nothing. Eight groups are whole and empty — Fundamentals 7, Menus & toolbars 10, Basic
    input 14, Status & info 5, Dialogs & flyouts 4, Navigation 5, Text 7, Accessibility 3 —
    and two are partial, Collections with six left and Layout with four.

    **It is listed as a version rather than left to `Final` because the two do different
    work.** `Final` is an observed side-by-side that reports; this is the build that gives it
    something to observe. Under D37 it sits after the release, which is what makes its size
    affordable to state honestly rather than a reason to compress it.

    **What it does not do is invent components.** Every one of the eight empty groups is a
    group whose controls exist — which is why they are pages rather than tranches — except
    Fundamentals and Accessibility, whose ten pages are prose and samples about the platform
    rather than about a control, and whose disposition D7 already settles. Item 17's first
    unit dispositions the eighteen unscheduled _controls_; this version builds _pages_, and
    the two lists overlap only where a control that unit builds also owes a page.

**Twenty-four Gallery pages are scheduled by no tranche, and planning v7 is what found
them.** The roadmap enumerates by name where a tranche schedules controls, and by count where
it takes a whole group at once — Styles's ten, Motion's seven, and the eighteen O2 resolves.
Two things fall between the two habits.

**Two whole groups are absent.** The words "Fundamentals" and "Accessibility" do not occur in
this file at all. That is ten pages — the Gallery's seven Fundamentals items and its three
Accessibility ones — with no tranche, no count and no O2 disposition. They are not controls,
which is presumably why they were never listed; but D7 resolves what such a page _renders_, not
who builds it or when, and the acceptance gate walks the navigation tree page by page.

**And fourteen individual pages sit inside groups the roadmap does enumerate by name.**

| group            | scheduled by no tranche                                                               |
| ---------------- | ------------------------------------------------------------------------------------- |
| Menus & toolbars | CommandBarFlyout, SwipeControl, StandardUICommand, XamlUICommand                      |
| Basic input      | ColorPicker, RatingControl                                                            |
| Collections      | ~~PullToRefresh~~ — item 13 takes it, decided in v9's entry                           |
| Scrolling        | ~~ScrollViewer~~ — item 13 takes it, decided in v13's entry                           |
| Layout           | ~~Canvas~~ — v14 draws it in the page under D30, RelativePanel, VariableSizedWrapGrid |
| Text             | RichEditBox, RichTextBlock, TextBlock                                                 |

Two of those look scheduled and are not, which is why the count was wrong the first time it was
taken. **ColorPicker** occurs in this file exactly once, in D9's row: the plan has decided
_how_ to build it — its own Zag machine, because bits-ui lacks the primitive — and has never
said _when_. **TextBlock** occurs three times, all of them prose about line height in v1 and
v6. A decision about a control reads like a plan for it, and a control used as an example reads
like one too. Neither is.

Listing them is not scheduling them, and this version does not schedule them. v7 takes
HyperlinkButton, RepeatButton and ToggleSplitButton because they are templates it is already
building, and it leaves CommandBarFlyout alone because that is a flyout of a bar which does not
exist until this version closes. The two `*UICommand` entries may not be controls at all —
they are command objects with no template — so their honest disposition is a `WD-` entry or a
page that says so, decided when the group is reached rather than now. What the list is for is
that this gap was found by planning one tranche carefully, three tranches later than it could
have been, and it would be found the same way again if it were not written down.

**Two rows have been struck, and striking them is what the list is for.** Planning v9 read the
Collections group as seven pages rather than the six its roadmap line named, found
PullToRefresh sitting in this table, and moved it to item 13 with a reason rather than leaving
it where it was. Planning v13 read this table before writing its entry and found `ScrollViewer`
sitting in the group that entry is about — a page the version would have built the whole of
Scrolling around and left behind. It goes to item 13 for the reason that entry gives, which is
that its page draws the same box as `ScrollView`'s and differs from it in property names.
Twenty-two pages remained unscheduled until item 17 took four of them — `TextBlock`,
`RichTextBlock`, `CommandBarFlyout` and `ColorPicker`. **Eighteen remain, and item 17's first
unit is what dispositions them.**

**A release becomes possible from v3 onward, and is cut after v18.** The capability and the
decision are different questions: a release is technically possible now, and the bar chosen for
it is a gate rather than a version number. This paragraph used to name `Final` as that gate and
it no longer does — the change is D37 and the reason is that `Final` had come to gate the wrong
artifact.

**What is released is the library, and `Final` is a gate on the Gallery.** Those were the same
thing while the roadmap read as one project; they are not the same thing now. `Final` is an
observed side-by-side of the **full** Gallery, and the Gallery is at 55 of its 120 item pages —
`apps/gallery/build/basicinput/button.html` is still a placeholder, thirteen versions after the
`Button` component was sealed, because v4 through v9 built controls and the pages began landing
only in v13. v15 and v16 between them took that count from 26 to 55, and v17 adds the Text
group's; what they leave behind is the Basic input, Menus & toolbars, Collections, Status &
info, Dialogs & flyouts and Navigation groups — whose components all exist — still on
placeholders, plus the ten Fundamentals and Accessibility pages that are about the platform
rather than a control. **Item 19 above is where that gap is owned**; this paragraph used to end
by saying nothing closed it, which was true when it was written and stopped being a plan the
moment the count moved twice without the sentence moving.

So the gate splits, and the two halves are below. The **library gate** is the release bar and
v18's last unit runs it. **`Final` keeps its own bar unchanged and moves after the release**,
which makes the Gallery's remaining pages the next gate rather than an unfinished part of this
one.

**What this costs is a claim, and the claim is worth stating exactly.** A release cut here says
_this library matches WinUI on the surfaces that were photographed against it_, not _this
library matches WinUI_. The evidence for the first is real and already written down: every
component was compared against the original on the reference guest inside its own unit, and the
`Reviewed:` trailer of its commit says what was measured. The evidence for the second is
`Final`, and `Final` has not run.

**A Gallery page is not redundant with a dev route, and v14 paid to learn it.** The `ComboBox`
defects sealed in v14 — a chevron column fixed at 38 where this library reserves 26, and a
trigger that stacks its border where WinUI's does not — were both invisible on
`dev/combo-box`, whose rows sit in a 320-wide column, and both obvious on the Gallery pages
that let a `ComboBox` size to its content. `IsThumbToolTipEnabled` was found the same way, by
using the control rather than by photographing it. **v18's last unit therefore lists every
exported component against the evidence that sealed it and re-photographs the ones whose only
evidence is a dev route.** That is a sweep of commit trailers plus a handful of captures, not
120 pages.

One thing has to be built before a release, and it is not scheduled with it. C6 as implemented
reads the shipped `dist` for preprocessor and Tailwind markers, which proves the package needs
no build tooling but not that a consumer can mount what it exports. The smoke app the gate
description promises does not exist, and the Gallery is not it: the Gallery does consume
`dist`, but through a pnpm workspace symlink, so the `peerDependencies` are satisfied by the
library's own `devDependencies` and have never once been supplied by a consumer, and the
compiler treats the package as first-party source rather than as a dependency. **Build it now
rather than at the release**, as its own unit: waiting means the whole prop surface — as
unchangeable once shipped as ADR 0006's token names, and ADR 0009 says so — is locked in one
step with no consumer having exercised it. The smoke app is that consumer, and it can exist
from any version onward.

**The Gallery is not built to be reused as an app.** `apps/gallery` is a judgement instrument,
and its only reason to exist is being compared with the original page by page. An app carries
the opposite obligation — to be good — and the first change made for an app's sake that the
original does not have would cost this project its one bar. Its pages also reach
`$lib/frame/ItemPage`, `$lib/shell` and `$lib/samples`, all app-local, so an app built from them
would take that frame as a second published package or write the pages again; the choice is
cheap while the pages are few. `packages/winui-svelte` is the published part, and the smoke app
above is what proves it.

**The Windows-only limitation is accepted rather than solved.** Chromium on Windows, as Edge or
WebView2, is the engine this project's baselines are photographed in, so the fidelity carries
there.
Elsewhere, and more decisively, **Segoe UI Variable and Segoe Fluent Icons exist only on
Windows** — ADR 0003's type ramp and every icon in the library assume them. A consumer is
faithful on Windows and degrades off it, and that degradation is out of scope here rather than a
divergence this registry owes an entry for.

### The library gate — the release bar

Every exported component named against the evidence that sealed it, and any whose only evidence
is a dev route re-photographed against the original on the reference guest. v18's last unit runs
it; a release is cut when it passes. D37.

**The first release exports a subset of what is built, and that is D46.** The gate's sentence
above was written when "exported" and "built" were the same set; they are not, and the release
is not the moment every sealed control becomes public. A component ships when it has been
polished, which is a later and stricter bar than the one that sealed it — sealing says _this
matches the original on the surface that was photographed_, and shipping says _a consumer can
hold this_. The two were only ever the same because nothing had been deliberately held back.

**Why hold anything back, when it is already written.** ADR 0009 makes a prop surface as
unchangeable as ADR 0006 makes a token name: once a consumer imports it, changing it costs them
a migration. Not exporting is the one move that keeps a surface editable, and it costs nothing
this project can measure — the Gallery reaches the library through a workspace symlink and
`apps/gallery` is not a consumer under this rule. So the default inverts: a component is private
until there is a reason to publish it, rather than public until there is a reason not to.

**What this changes mechanically, and what it does not.** The gate's scope narrows to the
exported set, which is what makes v18's last unit affordable. C4 follows on its own — it reads
"every exported component is snapshotted in all three themes", so a component that is not
exported leaves its numerator without the gate script changing; the count drops from 79 to
whatever the first release holds. Nothing about a held-back component's own unit changes: it is
still sealed against the original, still photographed in three themes, still carries its
`Reviewed:` trailer. It is only not in `index.ts`.

**The list is not decided here, and deciding it now would be deciding it twice.** Which
components clear the polish bar is a function of what v18's punch list turns up — every `what
this version owes` table from v4 onward, plus `docs/surface.md`'s sweep of the half of each
control that lives in its code-behind. A list written before that sweep is a list the sweep
invalidates. **v18 names the set**, as the unit before the gate runs, and the gate then measures
against it.

### Final — the acceptance gate

An observed, time-boxed side-by-side of the full Gallery against Windows 11, page by page. The
bar is unchanged; what changed is where it sits. It is the Gallery's gate, it needs all 120
pages, and under D37 it follows the release rather than blocking it. **Item 19 is what builds
the sixty-five it does not yet have**; this gate observes, and needs a version that builds.

## Conformance gates

Automated, and a unit that fails one cannot be sealed.

- **C1 — no raw visual literals.** No hex color, no px size except through `var(--winui-*)`,
  in the library **and in the Gallery**. The token cascade _is_ the design system; a literal
  is a value that will not follow a theme switch. The Gallery is in scope because its Design
  pages are where the tokens are judged: a color hard-coded there would make the acceptance
  surface match the original for a reason unrelated to the token layer.

  **A `c1-allow` proves a citation exists, not that the value follows from it.** The gate
  reads the comment above a literal and checks that it names an upstream file and line; it
  cannot read that file, so a real citation attached to a wrong reading passes. Unit 031
  wrote `border-bottom-width: 1px` citing `NumberBoxSpinButtonBorderThickness` — "(`0,1,1,1`),
  the bottom value". The resource exists, the line is right, and the bottom value is indeed
  1; the border it drew is a divider between two stacked spin buttons, and upstream's two
  spin buttons are side by side, so upstream has no such edge. C1 was green. What found it
  was opening `NumberBox.xaml:174` and measuring the rendered buttons. The gate's floor is
  that a literal must be argued for; it was never going to be that the argument is sound.

- **C2 — tokens are generated.** The committed token CSS must equal the generator's output.

  **What it does not check is the layer beneath it.** C2 compares the CSS with the
  generator, and the generator's inputs are two committed record files; nothing gates
  either record against the checkout it was read from. Both extractors have a `--check`
  mode that does exactly this, and neither is wired into `pnpm conform` — so a
  hand-edited record would pass every gate, which is the failure C8 exists to catch for
  the Gallery's records. It is one gate, running both `--check` modes, and it is written
  down here rather than added in the unit that noticed it because the unit that noticed
  it was adding the second record file and would have been sealing its own gate.

- **C3 — layer separation.** `packages/winui-svelte` must not import from `apps/gallery`.
- **C4 — three themes, always.** Every exported component renders under light, dark and high
  contrast in the snapshot suite. A component that only works in one theme cannot land.

  **It says nothing about engines, and that gap has already cost a defect.** Baselines are
  taken on Edge because that is where the fonts resolve (D6), so every snapshot is Chromium.
  TextBox's clear button was dead in Firefox and Safari and green here: the button renders
  only while the box has focus, Chromium focuses a `<button>` on mousedown and the following
  `focusin` cancels the `focusout`, and the other two engines do not — so the button unmounted
  before `click` fired. Found by running it in a browser during review, not by any gate. A
  library sold to consumers eventually needs an engine matrix; until it has one, anything
  whose correctness depends on focus order, pointer sequence or event timing is reviewed by
  running it, not by reading it.

  **A first engine matrix exists as review evidence, not as a gate.** Firefox and WebKit are
  installed beside Chromium on the development host, and the gradient-border unit was verified
  by rendering the real components in all three and reading the computed geometry and the
  border pixels out of each. That is enough to answer "does this CSS technique hold", which
  was the question, and it is not enough to be a gate: the host has none of the Windows fonts,
  so its pixels cannot be compared against a tracked baseline, and only Chromium can be driven
  where the fonts are. Promoting it means either baselines per engine on a Windows runner, or
  assertions about geometry and computed style rather than pictures. Neither is decided.

  **A third gap was what the baselines could see at all, and it was much larger than the
  page that exposed it.** `snapshotAllThemes` photographs `body`; `/dev/`'s layout scrolls
  inside a `.dev` element with `overflow-y: auto`, and the window above it is exactly
  `100vh` by D16 — so `body` was always the viewport and every tracked baseline was a
  1280×720 crop of the top of a page. TextBox's header and description were the first
  content the suite rendered and never photographed, but measuring the rest found six of
  the seven component pages already cropped: NavigationView by 1786 pixels, which is 71% of
  it, and TextBox, CheckBox, RadioButton, TitleBar and ToggleSwitch by 439, 173, 77, 21 and 4. Three quarters of the NavigationView harness had never been in a picture. C4 was true
  the whole time — every component did render in three themes — and what it checked was the
  top of each page.

  Closed by growing the viewport to the content before the capture rather than by changing
  the layout: the window semantics the shell is judged on stay exactly as D16 wrote them.
  The visible region did not move — five of the six pages were pixel-identical over their
  old 720 rows, and RadioButton differed in 24 pixels along row 714 to 719, which is the
  antialiasing of a ring the old crop cut in half.

  **A fourth was the suite building the wrong half of the tree.** Its webServer ran
  `pnpm --filter gallery build`, which does not rebuild `packages/winui-svelte/dist` — and
  the Gallery imports the library from there. A change to a component was therefore liable
  to be photographed against the previous build of that component, which is the failure the
  command's own comment says it exists to prevent, one layer further down. Caught by editing
  a component, building the Gallery and watching the rule stay absent from `dist`. The fix
  is the trailing dots, `--filter gallery...`; it was checked by deleting `dist` outright and
  watching the suite rebuild it and still pass 11 of 11, which also establishes that the
  tracked baselines match a library built from current source rather than from whatever was
  last left on disk.

  **A second gap sits in the suite itself: `--update-snapshots` does not rewrite a baseline
  whose difference falls under Playwright's default per-pixel threshold.** The gradient-border
  fix moved a button's face by four levels — the exact defect a user had spotted by eye on
  Windows — and the suite passed, wrote nothing, and left the tracked baseline a picture of
  the defective render. Deleting the file first is what forces a write. So a change small
  enough to be tolerated is also a change the baselines will never record, and a regression
  back to it would pass. The threshold has not been tightened here because doing so makes
  every baseline sensitive to antialiasing noise across a re-pin; it is written down so the
  next person to trust a green suite about a small colour shift knows not to.

- **C9 — every token a component reads is one the layer emits.** C1's opposite direction,
  and the one nothing was checking. C1 fails a value written without a token; C9 fails a
  token written without a value. A browser drops a declaration whose custom property is
  undefined — silently, no console message, no build error — so the rule is simply absent at
  runtime and the element keeps whatever it inherited. Four such references existed across
  two components when the gate was written, and all eight other gates were green. It covers
  the Gallery for C1's reason: the Design pages are where the token layer is judged.

  **What it cannot see is a token used where its type does not fit.** Three components have
  now hit the same one: `ControlElevationBorderBrush` and its relatives are
  `linear-gradient(…)` in the token layer, and a gradient named as a `border-color` is
  invalid CSS. The browser drops the declaration and `border-color` falls back to
  `currentColor` — the text colour — so the control gains a heavy black edge where the
  original has a subtle one. Button documented it, TextBox hit it again and documented it
  again, and NumberBox's spin buttons hit it a third time with all nine gates green: C1
  passes because a token was used, C9 passes because the token exists, and the snapshot
  suite passes because it was the baseline's first photograph.

  The fix each time is the same masked-`::before` ring, which means the defect is
  mechanical enough to check for. The gate is a tenth: resolve each token to its final
  value in the generated CSS, and fail any `border-color`, `color`, `outline-color` or
  `caret-color` whose token bottoms out in a `gradient(`. Not written yet, and written down
  here so the fourth occurrence is not discovered by eye either.

- **C5 — divergences are declared.** Every intentional departure from WinUI behaviour carries
  a `WD-NNN` id in a code comment resolving to an entry in `docs/divergences.md`, and every
  entry is cited by at least one site. Neither direction may dangle.
- **C7 — the acceptance surface is covered.** Every resource the Design pages display is
  emitted by the token layer, or listed in the generator's exclusions with a reason. This is
  D12's second clause made checkable: the first half of the selection is structural and the
  generator enforces it, while the second was a promise kept by hand until the page content
  existed as data to check against.
- **C6 — no consumer build tooling.** The shipped `dist` may contain no preprocessor `lang=`
  attribute and no Tailwind directive, so a consumer with bare Vite + Svelte and nothing else
  can build it. What it does not yet do is mount the result: the smoke app that would close
  that half is unbuilt, and until it exists the gate proves buildability, not usability.
- **C8 — the Gallery records are current.** C2's sibling for the other generated pair. The
  records are derived from a checkout that is deliberately not committed, so the gate always
  checks what a fresh clone can — the commit each record names against the pin, and each
  record's census against its own contents — and re-derives both when the checkout is present
  at that pin. The weaker half is the one that catches the failure that actually happens: a
  record edited by hand rather than through the extractor.

- **C10 — a self-drawn focus visual suppresses the user agent's.** Proposed, not built. A
  component that draws WinUI's focus band on a `:focus-visible` pseudo-element must also set
  `outline: none` on the element that takes focus, or the browser paints a second ring on that
  element's own border box. Thirteen components shipped without it, and the reason no gate and
  no baseline caught it is worth stating plainly: the band is drawn 3px outside the control, so
  on a control with room around it the two rings overlap and the defect reads as a slightly
  heavier ring. It only separates where the control has no room — an overflow menu row, whose
  border box is flush with the menu's own border — and there it reads as the ring breaking out
  of the menu. The check is a static one of the same shape as C1: a stylesheet that matches
  `:focus-visible` names an element, and that element's own rule must carry `outline: none`.
  The three controls whose focusable element is an `<input>` at `opacity: 0` are outside it,
  and the gate has to say so rather than exempt them silently.

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
  Implement the ones the web can actually do; render the rest as an honest "not applicable on
  the web" panel in the original's page slot. Dropping the pages would change the left
  navigation, which is exactly what v2 is judged on.

  **Its two examples were wrong, and D42 is what corrected them.** This entry named Clipboard
  and notifications as the ones the web can do. Measured in v16 at the origin the Gallery is
  actually served from, `navigator.clipboard` is absent and `Notification.permission` reads
  `denied` — both are present at a secure origin in the same browser, so what decides them is
  the serving script rather than the web. Neither page ended up implementing its behaviour:
  Clipboard is WD-067 and WD-068, App notifications is WD-073 and WD-074. The resolution above
  stands; "what the web can actually do" is a reading to take, not a list to assume, and D42 is
  the rule that keeps the two kinds of `WD` row apart.

- **O3 — accent color.** _Resolved:_ both layers. See "Accent".
- **O4 — primitive library.** _Resolved:_ bits-ui, with individual Zag machines for the three
  primitives it lacks. See ADR 0004. The survey's headline was that the keyboard limitation
  which prompted it is universal across every candidate, so it never was a selection
  criterion.

## What the second-reviewer lane is worth

A second model (`Hermes:solar-pro4` in the trailers) reads each unit's diff cold against a
written rule list, in its own sandbox, as a finder that never gates. Three units in, its range
is narrow enough to state:

| unit     | real defects | it found | false positives |
| -------- | ------------ | -------- | --------------- |
| Button   | 4            | 1        | 2               |
| TextBox  | 1            | 0        | 0               |
| CheckBox | 3            | 0        | 1               |

The one it found was a comment contradicting the line directly beneath it. The one it missed
was the cross-engine focus defect above — and it missed that on a control run against the
_unfixed_ file, with the mechanism spelled out in its rule list and its attention pointed at
focus order. Both of Button's false positives came from the rule list compressing a real rule
into a sentence that was stricter than the gate it described.

CheckBox's false positive is a different and more expensive shape: not a rule mis-stated but a
platform fact asserted wrongly with an argument attached. It reported that a comment about
`preventDefault()` on a checkbox click described a mechanism that does not exist — that the
browser does not toggle `checked` before the handler runs, so there is nothing to put back.
The HTML activation behaviour says otherwise and a browser confirms it: inside the handler an
unchecked box reads `checked === true`, a checked one reads `false`, `indeterminate` reads
`false`, and after `preventDefault()` all three hold their original value. A finding of that
shape costs a measurement to dismiss, where a mis-stated rule costs a re-read. It is also the
one that would do real damage if taken on trust, because the "fix" is to delete the line the
control's correctness rests on.

So: it catches local textual contradiction, misses anything that requires simulating behaviour, and
can assert a platform fact it has not checked. It is useful as a second pair of eyes on comments,
citations and stated rules, not as coverage, and never a gate. Keeping the table honest matters more
than keeping the lane — a finder credited with more than it finds is worse than no finder.

## Open questions

**O-merge1 — does the pin win per key, or per key and theme? _Resolved: per key and theme._**
D23 first said the pin wins on any key it defines, and that the framework dictionary answers
only for a key the pin does not define at all — never theme by theme, because merging one
key's themes across two dictionaries would produce a definition neither of them makes.

The count the question asked for: **20 selected keys** are defined by the pin in some themed
scopes and not all, and the framework dictionary supplies **every missing theme of all 20**.
`SliderContainerBackground` has no `Default`; the whole `TextControl*` family has no
`HighContrast`.

That settles it two ways. XAML resolves per theme itself — a theme dictionary that omits a
key falls through to the framework dictionary for that theme and no other — so "per key" was
the reading that disagreed with the platform. And the rule's stated reason does not hold: the
framework's value for the missing theme is a definition the framework makes.

What it fixed is larger than the rule. The generator carried an exception for exactly these
keys, letting a `Default`/`Light` key through on the argument that a page in high contrast
falls back to the `:root` declaration and resolves correctly there — and the comment carrying
it said plainly that nothing checked the last clause. Nothing did, and it was wrong:
`TextControlBackground` resolved under high contrast to `#ffffffb3`, a translucent white from
the light theme, where the framework dictionary says the system window colour, and the
foreground was near-black where the system says button text. **Every text control had been
drawing light-theme colours in high contrast.** Reading per theme gives all twenty their
missing values, moves no value that already resolved, and the exception is deleted along with
its cause.

Two more, both raised by the shell and both of a kind this project settles the same way: by
looking at the two windows side by side rather than by arguing from a screenshot. They are
recorded here so the comparison has a list to work from.

**O-shell1 — the search box's width. _Resolved: 318, and the override does not take._**
`MainWindow.xaml` gives the `AutoSuggestBox` `MaxWidth="580"` and
`HorizontalAlignment="Stretch"`, and overrides `TitleBarContentHorizontalAlignment` from
`Center` to `Stretch`; the shipped app nonetheless renders the box 318 wide at a 1600-wide
window, which is `TextControlThemeMinWidth` rather than the ceiling. The published control
now sits in that slot and renders 318 too, from the same resource. The ceiling stays at the
call site, where the window's own markup puts it, and does nothing at this width — which is
what the original does.

**O-shell2 — the search box's height. _Resolved: 32, and the discrepancy was ours._** The
original is 32 pixels. The stand-in read 38 on the Linux host and that was blamed on the
substitute icon face; it was not that. The published control first rendered **41** in the
title bar on the reference guest, and the cause was structural:
`TextControlThemePadding` had been put on the box, where the query button's `Height="28"` at
`AutoSuggestBox_themeresources.xaml:242` stacks with it. Upstream puts that padding on the
`TextBox` inside the control and leaves both buttons outside it. Moved, and the box measures
32 — top border on row 8 and bottom on row 39 in the original's capture and in ours, the
same height at the same place in the row.

**O-pages — whose version moves a pre-v10 control page onto the frame?** Every control built
from v3 to v9 has a harness route and a placeholder page, because the frame those pages need
is v10's and the tranches that built the controls closed before it existed. v11 puts its own
five pages on the frame as it builds their controls, and every tranche from here on does the
same; that leaves some fifty pages whose controls exist and whose pages do not, and the
acceptance gate walks them. Not resolved here. The candidates are one pages-only version per
closed group, or a page folded into the next version that touches its control; the cost of
either is one page-unit each, and the order should follow what the driving session finds
worst rather than the group list.

## Sources

Design tokens, Gallery structure, and the primitive-library survey are recorded in the ADRs.
Everything numeric traces to `microsoft/microsoft-ui-xaml` (MIT) or
`microsoft/WinUI-Gallery` (MIT); the Gallery's control catalogue is
`WinUIGallery/SampleSupport/Data/ControlInfoData.json`.
