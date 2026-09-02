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
context, and two copies in one tree do not share it.

Nothing is exported yet beyond `VERSION`. The roadmap lives in the repository's
`docs/plan.md`.

MIT. An independent reimplementation, not affiliated with or endorsed by Microsoft.
