import { defineConfig, devices } from '@playwright/test';

// Snapshots answer "did this change since yesterday", never "does this match WinUI" —
// see docs/plan.md, Verification. Fidelity is judged by a human on Windows 11.
export default defineConfig({
	testDir: 'tests/visual',

	// Keyed by platform because the fonts differ: Segoe UI Variable resolves on the
	// Windows runner and is absent here, so a Linux baseline records a substitute face.
	// Only the Windows set is tracked; see .gitignore.
	//
	// {testFileName} and {projectName} are load-bearing, not decoration: without them
	// two spec files taking a snapshot of the same component name, or the same spec run
	// under a second browser project, silently overwrite each other's baseline.
	snapshotPathTemplate:
		'{testDir}/__screenshots__/{platform}/{projectName}/{testFileName}/{arg}{ext}',

	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? 'list' : 'html',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		// Build, then serve adapter-static's own output. `vite preview` serves
		// `.svelte-kit/output`, which is not the artifact that ships; and serving without
		// building compares new code against old pixels and passes.
		command:
			'pnpm --filter gallery build && pnpm exec sirv apps/gallery/build --port 4173 --single --quiet',
		url: 'http://localhost:4173',
		// Never adopt a running server: it was started from an earlier build, which is
		// the staleness this command exists to remove.
		reuseExistingServer: false,
		timeout: 120_000
	}
});
