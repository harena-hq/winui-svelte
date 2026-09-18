import { defineConfig, devices } from '@playwright/test';

// Snapshots answer "did this change since yesterday", never "does this match WinUI" —
// see docs/plan.md, Verification. Fidelity is judged by a human against Windows 11.

const CDP = process.env.WINUI_CDP_ENDPOINT;

// The address the *browser* fetches from. When the browser is on a guest VM, the host is
// not localhost to it, so the base URL is supplied rather than assumed.
const BASE_URL = process.env.WINUI_BASE_URL ?? 'http://localhost:4173';

export default defineConfig({
	testDir: 'tests/visual',

	// Keyed by project, not by `{platform}`. With the browser on a Windows guest the
	// runner's platform is still linux, so `{platform}` would file Windows-rendered
	// pixels under `linux/` — the one confusion these baselines exist to prevent.
	//
	// {testFileName} and {projectName} are both load-bearing: without them two specs
	// snapshotting the same component name overwrite each other's baseline.
	snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFileName}/{arg}{ext}',

	// One worker, and one only, when the browser is on the guest. Every spec drives the same
	// Edge instance over one CDP connection, so parallel workers buy no wall clock — they open
	// concurrent tabs in one browser. That was harmless until a spec put a modal dialog on the
	// page: a focus trap refocuses whenever focus leaves its content, a background tab loses
	// focus whenever another worker's tab takes it, and the two fight until the renderer stops
	// answering. Measured: the full suite went 4 of 26 with the ContentDialog spec present and
	// 26 of 26 without it, then 26 of 26 with it at one worker — in 36.7s against the parallel
	// run's 42.8s, because the parallelism was never buying anything to begin with.
	//
	// Sixteen, and not the core count, when the browser is local. Playwright's default is half
	// the cores, which on this host is 96 workers against one preview server. At 155 tests that
	// was green six consecutive times; at 165 two consecutive full runs failed seven and then
	// five tests, with a different set each time and every one of them passing when its own spec
	// was run alone — a `page.hover()` that had not settled by the time the assertion read it,
	// keyboard presses that never landed. None of them were product defects, and a battery that
	// fails differently each run is a gate that has stopped meaning anything.
	//
	// Sixteen costs nothing to buy that back: three consecutive full runs at 27.3s, against
	// 27.2s for the run that failed five. The parallelism above sixteen was never buying wall
	// clock either, for the same reason the CDP lane's never did.
	workers: CDP ? 1 : 16,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	// `list` whenever stdout is not a TTY, and not only under `CI`. The html reporter writes a file
	// and prints nothing to stdout, so a run whose output is captured — which is how an agent reads
	// one — reports a failure as silence plus an exit code. Measured here: a local run failed one
	// CommandBarFlyout assertion and its captured output carried no trace of it.
	//
	// The test is the descriptor's and not the reader's, in both directions: `| tee` makes stdout a
	// pipe with a person watching, which costs nothing, and a PTY transcript keeps it a TTY while
	// capturing anyway, which hides a failure again. Pass `--reporter=list` where that matters.
	//
	// `lane-summary` last, so its account of the run is the final thing printed. It reports and does
	// not enforce: the gate is `pnpm gate`, a command rather than a flag, for the reasons in
	// `scripts/gate/acceptance.mjs`.
	reporter: [
		[process.env.CI || !process.stdout.isTTY ? 'list' : 'html'],
		['./tests/visual/lane-summary.ts']
	],
	use: {
		baseURL: BASE_URL,
		trace: 'on-first-retry'
	},

	// One project at a time, named for where the pixels are produced. Only `edge-win32`
	// is tracked; see .gitignore.
	projects: CDP
		? [{ name: 'edge-win32', use: { ...devices['Desktop Chrome'] } }]
		: [{ name: 'chromium-linux', use: { ...devices['Desktop Chrome'] } }],

	webServer: {
		// Build, then serve adapter-static's own output. `vite preview` serves
		// `.svelte-kit/output`, which is not the artifact that ships; and serving without
		// building compares new code against old pixels and passes.
		//
		// `--filter gallery...` with the trailing dots, not `--filter gallery`. The Gallery
		// imports the library from `packages/winui-svelte/dist`, and building only the
		// Gallery leaves that untouched — so a change to a component would be photographed
		// against the previous build of it, which is the failure the paragraph above says
		// this command exists to prevent, one layer further down. Found by editing a
		// component, building the Gallery, and watching the rule stay absent from `dist`.
		//
		// `--host 127.0.0.1`, even though the browser producing the pixels runs on another
		// machine. The Windows guest reaches this host as `10.0.2.2`, and QEMU's SLIRP
		// proxies that over the host's loopback rather than over the host's interfaces — so
		// the guest reads a loopback-bound server fine. Verified from inside the guest.
		// `0.0.0.0` was the first thing that worked and was never narrowed; on a host with a
		// public address it publishes the build to that address for the length of a run.
		command:
			'pnpm --filter gallery... build && pnpm exec sirv apps/gallery/build --port 4173 --host 127.0.0.1 --single --quiet',
		// Checked from here, whatever the browser reaches it as.
		url: 'http://localhost:4173',
		// Never adopt a running server: it was started from an earlier build, which is the
		// staleness this command exists to remove.
		reuseExistingServer: false,
		timeout: 180_000
	}
});
