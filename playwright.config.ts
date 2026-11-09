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
	// Playwright's own default when the browser is local, which is half the cores.
	//
	// It was sixteen from `de8745f` (2026-09-14) until this line, and the reason recorded there
	// was wrong. The suite had begun failing a handful of tests on each full run, a different
	// handful each time, every one of them passing when its own spec was run alone; it stopped at
	// sixteen workers and was read as a contention ceiling. What it was racing is the page's own
	// startup, and the worker count moves only how often that race is lost — which is why the
	// number held until the suite grew from 165 tests to 263 and then stopped holding.
	// `tests/visual/fixtures.ts` waits for the page's own JavaScript on every navigation now, and
	// that is what the cap was standing in for.
	//
	// Measured 2026-09-18 at 263 tests and ninety-six workers, three full runs each way: without
	// that wait, 23, 22 and 25 tests failed and passed on retry; with it, three green runs, no
	// retries, 34.9s against sixteen workers' 41.7s. Contention is therefore not sufficient to
	// produce the failures — the same ninety-six workers produce none of them once the wait is
	// there — and a number tuned at one suite size was going to be wrong at the next, so the
	// answer here is not a larger number. What that measurement does not establish is anything
	// about a machine unlike this one; the default at least scales with whatever it finds.
	workers: CDP ? 1 : undefined,
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
	// Baselines are compared with a per-pixel colour tolerance of 0.01, against Playwright's
	// default of 0.2.
	//
	// The number is a fraction of pixelmatch's YIQ distance and not of a channel: a pixel counts
	// as different only once `0.5053·dY² + 0.299·dI² + 0.1957·dQ²` passes `35215 · threshold²`.
	// A change with no hue in it — every pixel a shade lighter or darker — is pure dY, so what
	// the tolerance admits is `sqrt(35215 · threshold² / 0.5053)` grey levels out of 255: **52 at
	// the default, and 2 here.** It is not a budget spent across the picture: `maxDiffPixels` is
	// unset, so every pixel may move by that much and none of them is counted. A count could not
	// have narrowed it either, because the count is applied to the pixels this test has already
	// passed, and a change inside the tolerance is zero pixels however much of the page it covers.
	//
	// **Two changes the default let through, both of them this repository's own.** Three trigger
	// buttons added to `/dev/content-dialog` on 2026-09-18 failed the light and dark baselines and
	// *passed* the high-contrast one, after which `--update-snapshots` declined to rewrite an
	// image the comparison believed and the spec reported green against a picture three buttons
	// out of date. And a gradient-border fix moved a button's face by four levels — the defect a
	// person had reported by eye — with the suite green and nothing written. Both were re-run
	// against this line: the stale dialog baseline restored passes at 0.2 and fails here at
	// **3,571 counted pixels**; a four-level shift planted in `/dev/path`'s filled shape passes at
	// 0.2 and fails here at **51,814**. High contrast is where the first surfaced, because that
	// palette moves in the steps the default covers, but the blindness was every theme's.
	//
	// **What tightening costs was measured before the number was chosen.** Run with no colour
	// tolerance at all, this lane does not repeat itself: over four full runs at `threshold: 0`,
	// 265 of 271 tests passed and the failing set changed between runs. Hashing the captures
	// rather than comparing them says the same thing at the byte level — twenty captures of one
	// page in one session, twice over, gave `/dev/path` three distinct images, `/dev/progress-bar`
	// two and `/dev/item-page` two. At 0.01, two full runs failed the same two specs and nothing
	// else, and both were stale baselines rather than noise. The arithmetic boundary underneath
	// any choice is about 0.003788, where a single grey level stops being admitted; that is a
	// property of the comparator and not a measurement of this lane, and 0.01 sits above it
	// deliberately, because this lane's own noise is a channel level on the pages that move.
	//
	// **What no tolerance here reaches.** Playwright calls pixelmatch with `includeAA: false`, and
	// nothing in the protocol's screenshot parameters can change it — they are `threshold`,
	// `maxDiffPixels`, `maxDiffPixelRatio` and a comparator name. A pixel the heuristic reads as
	// an anti-aliased edge is dropped before this line is consulted. That takes most of the
	// evidence off a change that moves ink rather than recolouring it — a curve moved one pixel
	// sideways counted 185 pixels — but not the failure, because `maxDiffPixels` is unset and one
	// surviving pixel is enough. What disappears outright is a difference whose every pixel is
	// read as an edge, which is exactly this lane's own rasterisation noise: `/dev/path` differs
	// from itself by up to 72 pixels between renders and the comparator counts none of them.
	expect: { toHaveScreenshot: { threshold: 0.01 } },
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
