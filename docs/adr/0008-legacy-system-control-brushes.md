# 0008 — the legacy system-control brushes are resolved by a table, not carried as tokens

## Context

v1's four base dictionaries speak one high-contrast vocabulary: the eight
`SystemColor*ColorBrush` names ADR 0005 aliases onto CSS system colors. Every per-control
dictionary from v2 onwards speaks two. Alongside those eight it uses the UWP-era
`SystemControl<Role><Tone>Brush` family, and **it uses them only under high contrast** —
under `Default` and `Light` the same keys alias to the modern palette.

The family is not in the extraction, and not because the extractor misses it. Sixty-one
distinct `SystemControl*` names are referenced by `controls/dev/**/*_themeresources.xaml`
and defined by none of them; the definitions live in the XAML framework dictionary that
ships inside Windows, which is not open source. They are absent from `winui2/main` in the
same repository too — WinUI 2 consumes them from the OS exactly as WinUI 3 does. So there
is no file to read and no pin to add.

v2's shell needs six of them, which between them carry every colour NavigationView and
TitleBar have under high contrast:

| name                                      | uses | where v2 meets it                                     |
| ----------------------------------------- | ---- | ----------------------------------------------------- |
| `SystemControlHighlightAltBaseHighBrush`  | 50   | item foreground when hovered/pressed/selected         |
| `SystemControlDisabledBaseMediumLowBrush` | 48   | every disabled foreground                             |
| `SystemControlForegroundBaseHighBrush`    | 46   | resting item, header and title-bar foreground         |
| `SystemControlBackgroundBaseLowBrush`     | 35   | pane background, resting and disabled item background |
| `SystemControlHighlightListMediumBrush`   | 10   | button background when pressed                        |
| `SystemControlHighlightListLowBrush`      | 10   | button background when hovered                        |

Doing nothing is not available: the generator fails on a reference nothing defines, which
is the correct behaviour and the reason this decision is being made rather than discovered
later.

## Decision

**Resolve each legacy name to a system colour through an explicit table in
`scripts/tokens/manifest.mjs`, and emit no token for the name itself.** A reference to a
mapped name is replaced at emission by `var(--winui-<SystemColor…>)`, so the six do not
appear in the output at all — only the eight names ADR 0005 already established do.

The table is populated as tranches reach the names, not up front. **The generator fails on
an unmapped legacy name**, naming the record that referenced it: a family this large must
not acquire a default, because a default is how a wrong colour becomes a silent one.

### Where the six values come from

Not from Microsoft's documentation, and not from inference over names. From the one place
in the pinned source that states high-contrast values for this exact family:
`controls/dev/Materials/Reveal/RevealBrush_themeresources.xaml`. Its `HighContrast`
dictionary defines 34 `SystemControl<Role><Tone>Reveal<Kind>Brush` keys directly as system
colours, and across them **the tone word does not matter and the role word decides**:

- `Background…` → `SystemColorButtonFaceColor`, 16 of 17. The seventeenth is
  `SystemControlBackgroundTransparentRevealBorderBrush` → `SystemColorButtonTextColor`,
  which is a border on a transparent background rather than a background, so it is a
  different role wearing the same first word.
- `Highlight…` → `SystemColorHighlightColor`, 15 of 15 — including
  `SystemControlHighlightListLowRevealBackgroundBrush` and
  `…HighlightListMediumRevealBackgroundBrush`, which are the Reveal counterparts of two of
  the six and settle them by name rather than by rule.
- `HighlightAlt…` → `SystemColorHighlightTextColor`.
- `Foreground…` → `SystemColorButtonTextColor`.

`Disabled…` has no witness in that dictionary, so it is measured across the whole
extraction instead: of the 64 `*ForegroundDisabled` keys defined under high contrast, 32
resolve to a system colour and 32 to a legacy name. Of the 32 that resolve, **32 are grey
text** — 31 `SystemColorGrayTextColorBrush` and one `SystemColorGrayTextColor`.

So:

| legacy name                               | resolves to                     | evidence                                          |
| ----------------------------------------- | ------------------------------- | ------------------------------------------------- |
| `SystemControlForegroundBaseHighBrush`    | `SystemColorButtonTextColor`    | Reveal `Foreground…`; the most-used HC foreground |
| `SystemControlBackgroundBaseLowBrush`     | `SystemColorButtonFaceColor`    | Reveal `Background…`, 16 of 17                    |
| `SystemControlHighlightAltBaseHighBrush`  | `SystemColorHighlightTextColor` | Reveal `HighlightAlt…`                            |
| `SystemControlHighlightListLowBrush`      | `SystemColorHighlightColor`     | its own Reveal counterpart                        |
| `SystemControlHighlightListMediumBrush`   | `SystemColorHighlightColor`     | its own Reveal counterpart                        |
| `SystemControlDisabledBaseMediumLowBrush` | `SystemColorGrayTextColor`      | 32 of 32 resolving `*ForegroundDisabled` keys     |

The two strongest and the two weakest are named as such on purpose. `HighlightListLow` and
`HighlightListMedium` are settled by their own namesakes. `ForegroundBaseHigh` and
`HighlightAltBaseHigh` each rest on a single Reveal witness plus corroboration from the
same file the shell reads: `NavigationViewSelectionIndicatorForeground` is
`SystemColorHighlightTextColor` under high contrast, which is the selected state that
`HighlightAltBaseHigh` also paints, and the pair leaves highlighted rows reading highlight
text on highlight — which is what high contrast is for.

### Why not a token per name

Three reasons, in order of weight.

1. **They exist only under high contrast.** A token has to be defined in all three themes
   or in none — a rule the generator asserts, because a key themed in part resolves to
   another theme's value where it is missing and reads as a decision. There is no light or
   dark value for these names in any source, and writing one would be inventing a colour
   to satisfy a shape.
2. **The name would outlive its warrant.** `--winui-SystemControlForegroundBaseHighBrush`
   in the output invites a component to use it, and it is not a WinUI 3 resource — it is a
   name WinUI 3 still happens to reference on one theme.
3. **Substitution keeps the uncertainty in one file.** Every value this ADR chose is a
   judgement over evidence rather than a reading of a definition. Confining them to one
   table means a later measurement corrects six lines rather than an emitted vocabulary.

## Status

Permanent as a mechanism. Individual rows are revisable: each is a best reading of the
evidence named above, not a definition, and the two weakest are marked.

Revisit a row if the value becomes measurable — a WinUI app on the reference guest reading
`Application.Current.Resources` under a high-contrast theme would settle all six at once.
That is not available today: `.private/ops.md` makes the guest's theme an untouchable
reference parameter, and the measurement needs it changed.

## Alternatives rejected

- **Emit a token per legacy name.** See the three reasons above. The first is fatal on its
  own.
- **Derive the role → system-colour rule at build time from the Reveal dictionary.** Reads
  as the principled version and is worse: the `Background…Border` exception above shows the
  role word alone does not decide, so a derived rule would be confidently wrong for some
  future key and would look derived rather than chosen. An explicit table is a thing
  someone had to write down and can be argued with.
- **Add a third upstream pin.** There is nothing to pin. The definitions are in Windows,
  not in a repository.
- **Leave the shell's high-contrast theme incomplete.** C4 requires every exported
  component in all three themes, and a NavigationView with no high-contrast colours is a
  component that only works in two.

## Downstream impact

v2's shell needs the six rows above. Later tranches will reach more of the 61: the largest
untouched ones are `SystemControlForegroundTransparentBrush` (30 uses),
`SystemControlPageBackgroundMediumAltMediumBrush` (27) and
`SystemControlHighlightTransparentBrush` (21). Each arrives with its control and is added
with its own evidence line, or the generator stops the unit.
