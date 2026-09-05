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

    Slider ships horizontal first. `Orientation="Vertical"` and the three `TickBar`s are a
    second unit rather than a divergence — nothing is being declined, they are simply not
    built yet, and the Gallery's own Slider page uses both, so the acceptance surface wants
    them before this version closes.

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

5.  **Status and feedback** — InfoBar, InfoBadge, ProgressBar, ProgressRing, ToolTip.
6.  **Surfaces** — Expander, ContentDialog, Flyout, MenuFlyout, TeachingTip, Popup.
7.  **Commands and menus** — DropDownButton, SplitButton, ToggleButton, CommandBar, MenuBar,
    AppBar\*.
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

**A release becomes possible from v3 onward**, and one thing has to be built before it is:
C6 as implemented reads the shipped `dist` for preprocessor and Tailwind markers, which proves
the package needs no build tooling but not that a consumer can mount what it exports. The
smoke app the gate description promises does not exist. Building it is the first unit of
whichever version cuts a release, not a prerequisite for writing controls.

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
