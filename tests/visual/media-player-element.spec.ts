import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('MediaPlayerElement in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'MediaPlayerElement', '/dev/media-player-element');
});

test('MediaTransportControls in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	// In high contrast only, the reference browser does not rasterise one pixel of this page the
	// same way twice: at the right end of the indeterminate bar in the Buffering row, where the
	// bar's 1.5-pixel corner curves. The capture leaves the bar at rest by cancelling its infinite
	// animation. Measured 2026-09-25 through the comparator, as `path.spec.ts` measures its own, on
	// eighteen runs with no budget: nine failed before 70e9cc4 rounded the bar's widths to whole
	// pixels and three after it, each failure reporting **one pixel** in
	// `MediaTransportControls-high-contrast.png`. The two diffs opened, one from each side, both
	// put it at (712, 1366) of the grown page, and each of the three failures' logs after the
	// rounding shows Playwright's own retries counting 3, then 2, then 1 against the same baseline
	// first. Two planted changes, measured the same way: the Buffering row's wider indicator one
	// pixel shorter, in high contrast and after the rounding, counted **12**; the Playing row's
	// position moved from 6 to 6.1 seconds, in light and before it — that row has no bar for it to
	// touch — counted **305**. Five sits above every count the noise reached and below the smallest
	// planted defect.
	//
	// What it gives up, said exactly: `snapshotAllThemes` hands one set of options to all three
	// captures, so each of this page's three baselines fails on six or more counted pixels, where
	// the pages without a budget fail on one — a budget for noise found in one theme, spent in all
	// three. A size mismatch still fails outright.
	await snapshotAllThemes(page, 'MediaTransportControls', '/dev/media-transport-controls', {
		maxDiffPixels: 5
	});
});
