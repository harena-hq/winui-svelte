import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

// `NavigationViewItem` is drawn by a consumer's `menuItemTemplate`, and the template harness is
// the one page where that happens; `/dev/navigation-view`'s rows are the control's own.
test('NavigationViewItem in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'NavigationViewItem', '/dev/navigation-view-template');
});
