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

| #   | Decision                                                                                         | Where                     |
| --- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| D1  | Library + Gallery showcase, split as above                                                       | this file                 |
| D2  | Token values are extracted from `microsoft-ui-xaml` (MIT), not from Fluent 2 web packages        | ADR 0001                  |
| D3  | Styling is Svelte scoped CSS over a CSS custom-property token cascade. No Tailwind, no CSS-in-JS | ADR 0002                  |
| D4  | Fonts and icons are referenced by name from the local system, never embedded                     | ADR 0003                  |
| D5  | Visual truth is a human side-by-side against Windows 11; automation gates regression only        | this file, "Verification" |
| D6  | Snapshots run on a local Windows VM runner, not on the Linux host                                | this file, "Verification" |
| D7  | Out-of-scope Gallery groups keep their pages, implemented where the web allows                   | this file, "Roadmap → v4" |
| D8  | Accent is six tokens with a baked default, plus an optional derivation from one base             | this file, "Accent"       |
| D9  | bits-ui as the primitive base; individual Zag machines for TreeView, ColorPicker, NumberBox      | ADR 0004                  |

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
- A generator turns the extracted source into CSS; a parity test fails if the committed CSS
  and the generator's output disagree.

Acceptance surface: the Gallery's **Design** pages — Color, Typography, Geometry, Spacing,
Iconography. These render tokens with almost no control chrome, which makes them the
cheapest possible thing to compare against the original.

Done-when: the five Design pages render; every token has a value in all three themes; the
parity test passes; the Color page compares clean against Windows 11.

### v2 — the app shell

Goal: **the Gallery's frame is navigable and looks right.**

NavigationView (built from scratch — no primitive library has it), title bar, search box,
routing, theme switching, and a Mica approximation for the window backdrop.

Done-when: home page and left navigation compare clean against Windows 11 in light and dark;
theme switch changes every token live with no reload.

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

- **C1 — no raw visual literals.** No hex color, no px size in a component's CSS except
  through `var(--winui-*)`. The token cascade _is_ the design system; a literal is a value
  that will not follow a theme switch.
- **C2 — tokens are generated.** The committed token CSS must equal the generator's output.
- **C3 — layer separation.** `packages/winui-svelte` must not import from `apps/gallery`.
- **C4 — three themes, always.** Every exported component renders under light, dark and high
  contrast in the snapshot suite. A component that only works in one theme cannot land.
- **C5 — divergences are declared.** Every intentional departure from WinUI behaviour carries
  a `WD-NNN` id in a code comment resolving to an entry in `docs/divergences.md`, and every
  entry is cited by at least one site. Neither direction may dangle.
- **C6 — no consumer build tooling.** A smoke app consuming the built package with bare Vite +
  Svelte and nothing else must render correctly.

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

None. The remaining input is operational rather than a decision: the Windows VM's access and
start procedure, needed to wire v0's snapshot job.

## Sources

Design tokens, Gallery structure, and the primitive-library survey are recorded in the ADRs.
Everything numeric traces to `microsoft/microsoft-ui-xaml` (MIT) or
`microsoft/WinUI-Gallery` (MIT); the Gallery's control catalogue is
`WinUIGallery/SampleSupport/Data/ControlInfoData.json`.
