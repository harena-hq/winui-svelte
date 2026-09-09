import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('SampleCodePresenter in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'SampleCodePresenter', '/dev/sample-code-presenter');
});
