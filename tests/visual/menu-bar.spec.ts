import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('MenuBar in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'MenuBar', '/dev/menu-bar');
});
