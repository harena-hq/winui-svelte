# 0021 — A consumer replaces the text stacks through tokens

## Context

ADR 0003 names Segoe in every text stack and ADR 0019 adds a system face after it. The type ramp
wrote those stacks as literals in each class, and `--winui-ContentControlThemeFontFamily` was read
by a handful of components only, so a consumer's trial that set it saw nothing change on a Button.
Its application has a font of its own, and only a `!important` rule on every `winui-*` class
reached the controls. Off Windows a consumer may also have a better substitute than the system
font ADR 0019 names, and on Windows Segoe has no Hangul or Kana, so those characters reach whatever
the machine falls back to.

## Decision

**The ramp reads the stacks through tokens,** set on `:root` after `tokens.css`:

| Token                           | Default                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `FallbackFontFamily`            | `'winui-svelte text', sans-serif`                            |
| `SmallFontFamily`               | `'Segoe UI Variable Small', 'Segoe UI'`, then the fallback   |
| `ContentControlThemeFontFamily` | `'Segoe UI Variable Text', 'Segoe UI'`, then the fallback    |
| `DisplayFontFamily`             | `'Segoe UI Variable Display', 'Segoe UI'`, then the fallback |

**`FallbackFontFamily` keeps Segoe where it is installed.** CSS falls back per character, so a font
named there draws what neither Segoe family has a glyph for and it has one for: on Windows that
leaves Segoe's text alone, and where neither family is installed it is all of the text. The three
stacks replace Segoe outright, one for each optical face the ramp asks for. The icon stack already
was a token, `SymbolThemeFontFamily`, and a replacement has to carry Segoe's code points.

**The fallback works on `:root` only.** A stack's `var()` is resolved where the stack is declared,
so a fallback set on a subtree does not change a stack inherited from `:root`. A stack set on a
subtree does reach the ramp classes there, and not a portalled surface or Pivot's tokens, so
`:root` is the supported place for all of them.

**These names are not WinUI's, but for `ContentControlThemeFontFamily`.** ADR 0006 keeps WinUI's
keys verbatim; WinUI's one family, `XamlAutoFontFamily`, resolves only inside WinUI and has no
optical faces to split. They are this library's, in the same shape.

**The released controls with no ramp class read the token themselves:**
TextBox, PasswordBox and NumberBox on their root, NavigationView's rows on their `<li>`, each
without specificity, so that a consumer's class there still sets the family as FontFamily on the
control does. A font on an ancestor no longer reaches them, as it does not upstream. Their size and
weight still come from the page. A TextBlock with no `textStyle` inherits from the page, and so
do about ten preview controls, CalendarView's days, CalendarDatePicker's date and ColorPicker's
labels among them, which a Gallery page's ramp class hides.

**A control's height stays its font's line.** ADR 0011 made every line box the font's `normal`, and
ADR 0019 rejected an explicit `line-height` for taking 0.379px off every single-line box under
Segoe, so a Button is 32 under Segoe's metrics and something else under another font's. A consumer's
trial measured 33 with Noto Sans KR and Noto Sans JP, on a Windows build that ships them, and 29
under its own font; on the reference guest a Hangul Button draws 32 with no token set. A font that
should keep the controls' sizes carries Segoe's line metrics, in its own tables or as ADR 0019
lays them over a system font, through `ascent-override`, `descent-override` and `line-gap-override`.
`tests/visual/font-tokens.spec.ts` holds a Button at 32 under such a face, and not under the same
font without them.

## Status

Accepted, 2026-11-01. **Amends ADR 0003**, whose stacks become replaceable. Its default stands, and
nothing is embedded. **Amends ADR 0019**, whose face is now the default of a token.
**Amends ADR 0006** with three names of the library's own.

## Alternatives rejected

- **One token that replaces all three stacks.** It would be read as `var(--x, <stack>)`, naming a
  token nothing defines, which C9 refuses. A consumer with optical faces of its own wants the three
  anyway, and three lines of CSS are not worth an exception.
- **A CJK face of the library's own, with Segoe's metrics over Malgun Gothic and Yu Gothic UI.** It
  would hold Korean and Japanese Buttons at 32 for every consumer on Windows, and it replaces the
  face a user's machine chose, which the library has no measurement to justify: what WinUI draws for
  those characters has not been compared here, as the reference guest's language is not changed.
- **An explicit `line-height`.** ADR 0011 and ADR 0019 rejected it, and nothing here changes why.

## Downstream impact

- **`scripts/tokens/generate.mjs`** fails if the fallback stops being ADR 0019's face or a stack
  stops naming its Segoe family and then the fallback.
- **The package README** names the tokens, and that a font without Segoe's metrics changes a
  control's height. This ADR is how to keep it.
