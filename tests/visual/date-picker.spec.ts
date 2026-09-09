import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('DatePicker in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await page.clock.setFixedTime(new Date('2026-09-08T12:00:00Z'));
	await snapshotAllThemes(page, 'DatePicker', '/dev/date-picker');
});
