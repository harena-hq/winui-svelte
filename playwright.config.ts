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

	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? 'list' : 'html',
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
		command:
			'pnpm --filter gallery... build && pnpm exec sirv apps/gallery/build --port 4173 --host 0.0.0.0 --single --quiet',
		// Checked from here, whatever the browser reaches it as.
		url: 'http://localhost:4173',
		// Never adopt a running server: it was started from an earlier build, which is the
		// staleness this command exists to remove.
		reuseExistingServer: false,
		timeout: 180_000
	}
});
