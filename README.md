# winui-svelte

WinUI 3 controls for Svelte 5, and a reproduction of the WinUI 3 Gallery built on them.

The bar is visual: side by side with the real Gallery on Windows 11, it should read as the
same application. Behavioural fidelity is not the bar — where a primitive's interaction model
disagrees with WinUI, the divergence is recorded in `docs/divergences.md` rather than forced.

```
packages/winui-svelte/   the library
apps/gallery/            the Gallery reproduction, and the acceptance harness
docs/plan.md             roadmap, locked decisions, conformance gates
```

## Working here

```sh
pnpm install
pnpm verify          # build + typecheck, the gate
pnpm --filter gallery dev
```

Read `AGENTS.md` before your first commit from a fresh clone — one line of git config has to
be re-run there, and nothing else will tell you.

Planning, review and commit discipline follow `docs/plan.md` and `AGENTS.md`.

## Status

v0. The pipeline is green and there is nothing in it yet. See `docs/plan.md` for what each
version adds.

## License and attribution

MIT. An independent reimplementation — "WinUI", "Fluent", "Segoe" and "Windows" are
trademarks of Microsoft Corporation, and this project is not affiliated with, endorsed by, or
sponsored by Microsoft. Design values are derived from the MIT-licensed `microsoft-ui-xaml`
and `WinUI-Gallery`; fonts and icons are referenced from the local system, never
redistributed. See `NOTICE.md`.
