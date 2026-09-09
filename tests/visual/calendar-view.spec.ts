import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('CalendarView in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	// The control highlights today, so an unfrozen clock writes a different baseline every
	// day. 12:00 UTC on 2026-09-08 is the 8th in both the guest's zone and this host's.
	await page.clock.setFixedTime(new Date('2026-09-08T12:00:00Z'));
	await snapshotAllThemes(page, 'CalendarView', '/dev/calendar-view');
});
