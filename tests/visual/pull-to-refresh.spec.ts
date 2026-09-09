import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

// Two calls against the one route, because the route holds two exported components and C4 reads
// the component name as an exact literal argument. The spec for this unit named `PullToRefresh`,
// which is the Gallery's name for the pair and not the name of either control — under it both
// `RefreshContainer` and `RefreshVisualizer` would be reported as uncovered.
test('RefreshVisualizer in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'RefreshVisualizer', '/dev/pull-to-refresh');
});

test('RefreshContainer in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'RefreshContainer', '/dev/pull-to-refresh');
});
