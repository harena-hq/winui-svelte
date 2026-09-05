# 0010 — the XAML framework dictionary is a third pinned upstream

## Context

ADR 0008 closed with a rejected alternative:

> **Add a third upstream pin.** There is nothing to pin. The definitions are in Windows, not
> in a repository.

The first sentence is wrong, and the rest of this ADR is what replaces it. The definitions
are in Windows, and they are also in a text file that ships on nuget.org: the Windows App
SDK's design-time `generic.xaml`, inside `Microsoft.WindowsAppSDK.WinUI` at
`lib/native/Microsoft.UI/Themes/generic.xaml`. It is 3 373 914 bytes of plain XAML — the
whole framework dictionary in three theme blocks, `Default`, `HighContrast` and `Light`,
with every `Style` and `ControlTemplate` the framework's own controls are built from.

### What made it worth looking

The `microsoft-ui-xaml` pin holds the controls Microsoft developed in the open, and it
holds them well: the Text tranche's five controls make between 46 and 119 resource
references each, and the pin plus this project's own manifest answer almost all of them.
What is left over is small, and it is the same handful over and over. Counting the
`{ThemeResource …}` and `{StaticResource …}` names each control's pinned dictionary
references that **neither** the pin defines **nor** `manifest.mjs` already supplies as a
system colour, accent, font or legacy substitution:

| control          | references | unresolved | of those, in `generic.xaml` |
| ---------------- | ---------- | ---------- | --------------------------- |
| `Slider`         | 56         | 1          | 1                           |
| `ComboBox`       | 119        | 3          | 3                           |
| `NumberBox`      | 56         | 8          | 5                           |
| `PasswordBox`    | 46         | 8          | 7                           |
| `AutoSuggestBox` | 56         | 14         | 12                          |

Four of the five need `TextControlHeaderForeground`, `TextControlHeaderForegroundDisabled`
and `SystemControlDescriptionTextForegroundBrush`, which is the coupling that made this one
decision rather than three. Beyond those, what is missing is not only colour:
`TextControlThemeMinWidth`, `HelperButtonThemePadding` and four `AutoSuggestList*` sizes have
no pixel to sample, and `ContentControlThemeFontFamily` is the family the whole tranche's
text is set in.

The five names the framework dictionary does not answer either — `QueryButtonStyle`,
`DeleteButtonStyle`, `RevealButtonStyle`, `NumberBoxSpinButtonStyle` and
`NumberBoxPopupSpinButtonStyle` — are `Style` names, which this project reproduces as markup
rather than reading as values. They are each tranche's own problem, and no dictionary would
have solved them.

### Why a design-time file is trusted

It is a copy shipped for the XAML designer, not the dictionary the running framework loads,
and that distinction is exactly the sort a project is wrong about once and then forever. So
it is checked against the running framework rather than assumed, on the reference guest, at
the pinned Gallery's own version.

**Check 1 — a value the file can be wrong about, measured.** `TextControlHeaderForeground`
is the brush TextBox's `Header` is painted in. On the guest's WinUI 3 Gallery, the TextBox
page's `Header="Enter your name:"` renders with 69 fully-covered pixels at exactly
`rgb(0, 0, 0)` on the light card, and with 69 at exactly `rgb(255, 255, 255)` on the same
card switched to dark. `generic.xaml` resolves the key through
`SystemControlForegroundBaseHighBrush` to `SystemBaseHighColor`, which is `#FF000000` under
`Light` and `#FFFFFFFF` under `Default`. Both ends match.

The check has teeth because the obvious guess fails it. In the same capture the Gallery's
own body text bottoms out at `rgb(26, 26, 26)` — `TextFillColorPrimary`, `#E4000000` over a
`#F3F3F3` card — so the header is measurably **not** the modern text brush that a reasonable
person would have assumed, and a transcription from memory would have been wrong on the
first key it touched.

**Check 2 — six values already decided by other evidence.** ADR 0008 resolved six legacy
`SystemControl*Brush` names to system colours through a table, derived from the Reveal
dictionary and from a 32-of-32 count over `*ForegroundDisabled` keys. `generic.xaml`
defines all six under `HighContrast`. It agrees with the table six times out of six:
`ButtonFace`, `GrayText`, `ButtonText`, `HighlightText`, `Highlight`, `Highlight`.

**Check 3 — geometry the file does not carry.** The focus visual's two thicknesses are
`Control` property defaults rather than resources, so `generic.xaml` has no answer for
them. Measured on the guest instead: 1 px inner and 2 px outer, both drawn outside the
control's bounds, in colours matching `FocusStrokeColorInner` and `FocusStrokeColorOuter`
to the pixel. Every `Setter` in the pin that overrides those two properties sets exactly 2
and 1. See WD-008.

Three checks, three sources, no disagreement.

## Decision

**Pin `Microsoft.WindowsAppSDK.WinUI` 2.3.6 and read `generic.xaml` out of it, on the same
footing as the other two pins: fetched on demand, never committed, verified by hash.**

- `scripts/framework/fetch.mjs` holds the pin, downloads the package, checks its sha256,
  reads the one entry out of the zip with `node:zlib`, checks the entry's sha256, and writes
  `.upstream/windows-app-sdk/generic.xaml`. Two hashes rather than one, because a
  re-published package should fail loudly rather than substitute quietly.
- The version is not chosen freely. `.upstream/WinUI-Gallery/standalone.props` declares
  `Microsoft.WindowsAppSDK` 2.4.0, and that metapackage's dependency on
  `Microsoft.WindowsAppSDK.WinUI` is 2.3.6. The framework dictionary is therefore the one
  the pinned Gallery would build against.
- Nothing is transcribed by hand out of it, for ADR 0001's and ADR 0007's reason: a value
  copied into this repository is a value that stops tracking its source.

**On a key defined in both dictionaries, the pin wins.** The two share 2984 keys, and
`generic.xaml` adds 418 the pin does not have. `microsoft-ui-xaml` is checked out at `main`
and is therefore ahead of a released SDK, so preferring it keeps every token this project
already emits exactly where it is: the new source can only add, never move, and the first
generated diff after this lands is reviewable rather than a wall.

## What this does not change

- **ADR 0008 stands.** Its table was independently right six times out of six; only its
  "nothing to pin" line is superseded, and this ADR supersedes just that line. The rows
  keep the evidence they were derived from and now have a second witness. Whether the
  mechanism should become a lookup rather than a table is a separate decision and is not
  taken here.
- **ADR 0006 stands.** A token is still named for its WinUI key, whichever dictionary
  defines it.
- **No token is emitted from `generic.xaml` by the unit that lands this ADR.** The pin is
  made available; teaching the extractor and the generator to read it is the next unit, and
  it is where the C2 diff appears.

## Status

Accepted. The design-time claim is the part with an expiry: **re-run the three checks above
on any re-pin**, because a file shipped for a designer is a file whose relationship to the
runtime is a fact about one version rather than a property of the format.

## Alternatives rejected

- **Transcribe the values as they are needed.** ADR 0001's and 0007's reason, and now with
  a measurement behind it: the first key anyone would have transcribed from memory —
  the header brush as `TextFillColorPrimary` — is wrong.
- **Measure everything on the reference guest.** Colours can be read off a capture; sizes
  cannot, and a font family cannot. `AutoSuggestListMaxHeight`, `TextControlThemeMinWidth`
  and `ContentControlThemeFontFamily` have no pixel to sample. The two measurements that
  _were_ possible are better spent as this ADR's warrant for the file than as a source in
  their own right.
- **Pin `Microsoft.WindowsAppSDK` itself.** 72 KB of dependency declarations. The dictionary
  is in the `…WinUI` sub-package.
- **Read the resources out of the runtime installed on the guest.** They ship as compiled
  XBF inside the package's `resources.pri`. There is no text to read, and writing an XBF
  reader to avoid a 3 MB text file is not a trade.
- **Keep waiting for a measurement pass.** That was this version's plan, and it was written
  when the hole was believed to be three brushes wide. It survives as check 1.

## Downstream impact

- The next unit teaches `scripts/tokens/extract.mjs` and `scripts/tokens/generate.mjs` to
  read the second dictionary, with the pin-wins rule above, and seeds the Text tranche's
  keys from it.
- WD-008 closes in this version rather than "eventually": its four values are now three
  read and one measured.
- Later tranches inherit the same answer: `DatePicker`, `TimePicker`, `CalendarView` and
  every remaining legacy `SystemControl*` name resolve out of this file.
