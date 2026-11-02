# winui-svelte

WinUI 3 controls for Svelte 5.

Styling is a CSS custom-property token cascade plus Svelte scoped styles — no Tailwind, no
CSS-in-JS, and no build tooling required of consumers. The Segoe fonts are referenced from
the local system rather than embedded, so text and icons render exactly as WinUI does on
Windows 11. Elsewhere text draws from a font the system has, such as Arial, with Segoe's line
metrics laid over it where the browser supports that, and the glyphs the components draw
themselves, such as chevrons and close buttons, come from an embedded font of Fluent UI System
Icons outlines, as do the glyphs `Symbol` names; a glyph code point a consumer passes draws from
it only if it is one of those. The icon font is a `data:` URL, which a Content Security Policy's
`font-src`, or its `default-src` where it has none, has to allow.

The fonts are tokens, set on `:root` in CSS loaded after `tokens.css`. `--winui-FallbackFontFamily`
names what draws after Segoe, so it draws any character neither Segoe family has and it has itself,
which off Windows is all of the text, and on Windows leaves Segoe's alone.
`--winui-SmallFontFamily`, `--winui-ContentControlThemeFontFamily` and `--winui-DisplayFontFamily`
replace Segoe. `--winui-SymbolThemeFontFamily` is the icon font, whose replacement has to carry
Segoe's code points. A control's height follows its font's line. A font that replaces Segoe, or
draws all the text off Windows, changes it unless its `@font-face` sets
`ascent-override: 107.91015625%`, `descent-override: 25.09765625%` and `line-gap-override: 0%`. On
Windows a font after Segoe draws only what Segoe lacks, and in Edge, at or below those three values,
it did not grow a line at any of the type ramp's sizes; Malgun Gothic, unset, adds a pixel to a line
it draws in at 18, 40 and 68px. The descriptors settle the line and nothing else, and widths move:
one string measures differently in `Segoe UI` and in each of `Segoe UI Variable Small`, `Text` and
`Display`. The name `Segoe UI Variable` with no optical suffix resolves to no font in Edge on
Windows, so name a suffix.

```sh
pnpm add winui-svelte bits-ui @internationalized/date
```

`bits-ui` is a peer dependency rather than a bundled one: it carries state through Svelte
context, and two copies in one tree do not share it. `@internationalized/date` is required because
`bits-ui` requires it as a peer of its own; `preview`'s date components take its types too.

`winui-svelte` is the release, and semantic versioning applies to it and its two stylesheets
alone. It exports twenty components — `Button`, `ComboBox`, `ContentDialog`, `Expander`,
`Flyout`, `HyperlinkButton`, `InfoBar`, `MenuFlyout`, `NavigationView`, `NavigationViewItem`,
`ProgressBar`, `ProgressRing`, `ScrollView`, `ScrollViewer`, `TabView`, `TeachingTip`, `TextBox`,
`TitleBar`, `ToggleSwitch`, `ToolTip` —
with their types, the `Symbol` table and its `SymbolName` type, `ScrollAnimation` and its two
types, `VERSION`, and the two stylesheets `winui-svelte/tokens.css` and
`winui-svelte/type-ramp.css`.

`winui-svelte/preview` exports the release and every other component a consumer places, and
promises nothing: a name there may change shape or leave in any version. So does any path into
the package that is not one of those entries. It needs two peers the release does not, which
its `NumberBox` imports and a bundler resolves for any import from `preview`. They are optional
peers, so a consumer of the release alone goes without them; install them to use `preview`:

```sh
pnpm add @zag-js/svelte @zag-js/number-input
```

The roadmap lives in the repository's `docs/plan.md`.

MIT. An independent reimplementation, not affiliated with or endorsed by Microsoft. Its tokens
and `Symbol` table are generated from microsoft-ui-xaml, also MIT; `NOTICE.md` carries that
notice.
