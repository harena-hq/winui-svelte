import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('Path in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	// The reference browser does not rasterise this page the same way twice, and when this was
	// written it was the only page in the suite whose variation the colour tolerance could not
	// absorb; the MediaTransportControls capture in `media-player-element.spec.ts` has joined it
	// since, with a budget of its own. Every number here is what Playwright's own comparator
	// counted at the configured `threshold`, not a difference between bytes: a raw pixel count says
	// nothing, because pixelmatch is called with `includeAA: false` and drops whatever its own
	// heuristic reads as an anti-aliased edge.
	//
	// Measured 2026-09-18, six runs of this spec with no budget: four counted nothing and two
	// counted **two pixels**, at the end of the Gallery's cubic where its `H` segment meets it.
	// Against that, two changes planted in the same page and counted the same way — the filled
	// shape's colour moved four levels on every channel, **51,814**; the first curve moved one
	// pixel sideways, **185**. Ten is five times the noise and a small fraction of either.
	//
	// What the budget gives up, said exactly: the option reaches one `toHaveScreenshot` call, and
	// `snapshotAllThemes` makes three, so **each** of this page's themed baselines fails on eleven
	// or more pixels that pass the configured colour tolerance and survive pixelmatch's
	// anti-aliasing exclusion, where the pages without a budget fail on one. A size
	// mismatch still fails outright. The alternative was a
	// wider colour tolerance, and it is worse here rather than merely different: the noise is
	// absorbed by 0.02 — measured, six runs of this spec at that setting counting nothing — and
	// 0.02 is where the four-level change above passes. A count costs this page ten pixels; a
	// colour tolerance would have cost every page three grey levels.
	await snapshotAllThemes(page, 'Path', '/dev/path', { maxDiffPixels: 10 });
});
