# winui-svelte — plan

The living plan. Roadmap, locked decisions, and the current version spec. Updated as
decisions land; superseded rationale is moved to an ADR rather than deleted.

Method: `AGENTS.md` → Engineering method. One goal per version. Nothing is sealed without its
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

| #   | Decision                                                                                             | Where                             |
| --- | ---------------------------------------------------------------------------------------------------- | --------------------------------- |
| D1  | Library + Gallery showcase, split as above                                                           | this file                         |
| D2  | Token values are extracted from `microsoft-ui-xaml` (MIT), not from Fluent 2 web packages            | ADR 0001                          |
| D3  | Styling is Svelte scoped CSS over a CSS custom-property token cascade. No Tailwind, no CSS-in-JS     | ADR 0002                          |
| D4  | Fonts and icons are referenced by name from the local system, never embedded                         | ADR 0003                          |
| D5  | Visual truth is a human side-by-side against Windows 11; automation gates regression only            | this file, "Verification"         |
| D6  | Snapshots run on a local Windows VM runner, not on the Linux host                                    | this file, "Verification"         |
| D7  | Out-of-scope Gallery groups keep their pages, implemented where the web allows                       | this file, "Roadmap → v4"         |
| D8  | Accent is six tokens with a baked default, plus an optional derivation from one base                 | this file, "Accent"               |
| D9  | bits-ui as the primitive base; individual Zag machines for TreeView, ColorPicker, NumberBox          | ADR 0004                          |
| D10 | High contrast is generated as aliases onto eight system colors, not as a third palette               | ADR 0005                          |
| D11 | A token is named `--winui-` plus the WinUI resource key, unchanged                                   | ADR 0006                          |
| D12 | The token layer is a curated closure of four base files plus what the Design pages name              | this file, "Roadmap → v1"         |
| D13 | Gallery page structure and page data are read from the pinned `WinUI-Gallery` source                 | ADR 0007                          |
| D14 | A composed WinUI `Style` ships as a CSS class, not as a custom property                              | this file, "Roadmap → v1"         |
| D15 | A control tranche seeds the token selection by key, never by dictionary file                         | this file, "Roadmap → v2"         |
| D16 | The window backdrop paints Mica's solid counterpart; the material is not approximated                | this file, "Roadmap → v2"; WD-003 |
| D17 | A legacy `SystemControl*Brush` resolves through a table to a system colour, and is never emitted     | ADR 0008                          |
| D18 | Every menu entry is a route; the path is derived from the record, never hand-written                 | this file, "Roadmap → v2"         |
| D19 | The shell is the Gallery's layout, and the selected navigation item is the URL                       | this file, "Roadmap → v2"         |
| D20 | ~~The title bar's search box is the Gallery's own~~ — **retired in v4**, it is the published control | this file, "Roadmap → v4"         |
| D21 | A WinUI member becomes a Svelte prop by one stated rule, and every component takes `...rest`/`ref`   | ADR 0009                          |
| D22 | Tranches are ordered by what an application reaches for; harness scaffolding follows the controls    | this file, "Roadmap → v3"         |
| D23 | The XAML framework dictionary is a third pinned upstream; the control pin wins per key and theme     | ADR 0010                          |
| D24 | The type ramp's line height is `normal`, the font's own spacing, not the published ramp's number     | ADR 0011                          |
| D25 | An icon is a snippet the consumer draws, with a Segoe Fluent Icons code point as its shorthand       | ADR 0012                          |

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
       **One spec, three commits** — they share a template ancestry and are worth specifying
       together, but three controls are three intents, and adjacent intents stay separate commits.
       RepeatButton's repeat is this tranche's first behaviour no screenshot can photograph; its
       commit records how the control was driven instead.
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

8.  **Navigation** — BreadcrumbBar, Pivot, SelectorBar, TabView. NavigationView was v2.
9.  **Collections** — ListView, GridView, TreeView, ItemsRepeater, ItemsView, FlipView.
10. **The sample-page frame** — `ControlExample`'s three panes, `SampleCodePresenter`, the
    copy button, and `ItemPage`'s content root. Its syntax highlighting is ColorCode, pinned by
    the Gallery's own `standalone.props` at 2.0.15; the palette and the XML and C# grammars are
    generated from that source rather than transcribed, as ADR 0001 and 0007 do for the other
    two upstreams. Expander and SelectorBar are already built by here.
    The Gallery's Typography and Geometry pages move onto the frame in this version.
11. **Layout** — Border, SplitView, Viewbox, and the Gallery's Grid and StackPanel pages, which
    are mostly documentation of CSS this library does not need to reimplement.
12. **Date and time** — CalendarView, CalendarDatePicker, DatePicker, TimePicker.
13. **Scrolling** — ScrollView, PipsPager, AnnotatedScrollBar, SemanticZoom.
14. **Styles** (10) and **Motion** (7) — AcrylicBrush, AnimatedIcon, ThemeShadow, System
    Backdrops, transitions, easing, connected animation. WD-006 closes here.
15. **Media / Windowing / System / Shell** (18) — see open question O2.

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

| group            | scheduled by no tranche                                          |
| ---------------- | ---------------------------------------------------------------- |
| Menus & toolbars | CommandBarFlyout, SwipeControl, StandardUICommand, XamlUICommand |
| Basic input      | ColorPicker, RatingControl                                       |
| Collections      | PullToRefresh                                                    |
| Scrolling        | ScrollViewer                                                     |
| Layout           | Canvas, RelativePanel, VariableSizedWrapGrid                     |
| Text             | RichEditBox, RichTextBlock, TextBlock                            |

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

**A release becomes possible from v3 onward, and is deliberately taken after `Final`.** The
capability and the decision are different questions: a release is technically possible now, and
the bar chosen for it is the acceptance gate below rather than any version number. Locked after
weighing the alternative of cutting at v14, which would ship before the Motion tranche's
deferrals close.

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

### Final — the acceptance gate

An observed, time-boxed side-by-side of the full Gallery against Windows 11, page by page.

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

## Sources

Design tokens, Gallery structure, and the primitive-library survey are recorded in the ADRs.
Everything numeric traces to `microsoft/microsoft-ui-xaml` (MIT) or
`microsoft/WinUI-Gallery` (MIT); the Gallery's control catalogue is
`WinUIGallery/SampleSupport/Data/ControlInfoData.json`.
