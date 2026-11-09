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
pnpm build && pnpm check && pnpm lint && pnpm conform && pnpm smoke
pnpm --filter gallery dev
```

The second line is what any machine can run: the build, the type check, lint, the conformance
gates and the packed-tarball smoke. `pnpm verify` is that line followed by `pnpm gate`, the
visual acceptance gate, which needs the reference browser below and fails without it. A
contributor without one runs the second line; the maintainer runs the gate before a change is
merged.

The reference browser is Edge on Windows 11, because that is where Segoe UI Variable resolves;
the docs and code call the Windows machine it runs on "the guest". The suite drives it over the
Chrome DevTools Protocol and has to be told what address that browser reaches this host on.
The test server binds to loopback only (`playwright.config.ts`, `webServer`), so the browser
reaches it through a forward to the host's loopback — a VM's user-mode network, as QEMU's
`10.0.2.2` is, or an SSH tunnel — not over the LAN.

```sh
WINUI_CDP_ENDPOINT=http://127.0.0.1:<tunnelled port> \
WINUI_BASE_URL=http://<host as the browser sees it>:4173 \
pnpm gate                          # compares against the tracked baselines
```

`pnpm test --update-snapshots` with the same two variables writes any tracked baseline the run
disagrees with, and any that is missing; that is the maintainer's step for a new or changed
baseline. Without `WINUI_CDP_ENDPOINT`, screenshot comparisons skip: a Linux run has no tracked
baseline to compare against, and writing one would pin a substitute typeface. With it set,
`pnpm test` needs `WINUI_BASE_URL` too.

Read `AGENTS.md` before your first commit from a fresh clone — one line of git config has to
be re-run there, and nothing else will tell you.

Planning, review and commit discipline follow `docs/plan.md` and `AGENTS.md`.

## Status

Published on npm as `@harena-hq/winui-svelte`. The package root is twenty components, and every
other component a consumer places is in `@harena-hq/winui-svelte/preview` (ADR 0017). See
`packages/winui-svelte/CHANGELOG.md` for each release and `docs/plan.md` for what each version
adds.

## License and attribution

MIT. An independent reimplementation — "WinUI", "Fluent", "Segoe" and "Windows" are
trademarks of Microsoft Corporation, and this project is not affiliated with, endorsed by, or
sponsored by Microsoft. Design values are derived from the MIT-licensed `microsoft-ui-xaml`
and `WinUI-Gallery`; fonts and icons are referenced from the local system, never
redistributed. See `NOTICE.md`.
