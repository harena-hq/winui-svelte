# winui-svelte

WinUI 3 controls for Svelte 5.

Styling is a CSS custom-property token cascade plus Svelte scoped styles — no Tailwind, no
CSS-in-JS, and no build tooling required of consumers. Fonts and icons are referenced from
the local system rather than embedded, so text renders exactly as WinUI does on Windows 11
and falls back elsewhere.

```sh
pnpm add winui-svelte bits-ui @internationalized/date
```

`bits-ui` is a peer dependency rather than a bundled one: it carries state through Svelte
context, and two copies in one tree do not share it. `@internationalized/date` is required because
`bits-ui` requires it as a peer of its own; `preview`'s date components take its types too.

`winui-svelte` is the release, and semantic versioning applies to it alone. It exports
eighteen components — `Button`, `ComboBox`, `ContentDialog`, `Expander`, `HyperlinkButton`,
`InfoBar`, `NavigationView`, `NavigationViewItem`, `ProgressBar`, `ProgressRing`, `ScrollView`,
`ScrollViewer`, `TabView`, `TeachingTip`, `TextBox`, `TitleBar`, `ToggleSwitch`, `ToolTip` —
with their types, the `Symbol` table, `VERSION`, and the two stylesheets
`winui-svelte/tokens.css` and `winui-svelte/type-ramp.css`.

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
