import type { Locator } from '@playwright/test';
import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('CalendarView in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	// The control highlights today, so an unfrozen clock writes a different baseline every
	// day. 12:00 UTC on 2026-09-08 is the 8th in both the guest's zone and this host's.
	await page.clock.setFixedTime(new Date('2026-09-08T12:00:00Z'));
	await snapshotAllThemes(page, 'CalendarView', '/dev/calendar-view');
});

/**
 * Out of scope yields to disabled and to today, and to a selected day's text.
 *
 * The chrome picks an item's fill and text by walking its states in one order: disabled, then
 * today, then out of scope for the fill (`GetItemBackgroundBrush`,
 * `CalendarViewBaseItemChrome.cpp:1455`, `:1466`, `:1489`), and disabled, today, selected, then
 * out of scope for the text (`GetTextBlockForeground`, `:1551`, `:1566`, `:1581`, `:1607`). The
 * out-of-scope rules carried the most specific selectors in the component, so they covered all
 * three: today viewed from the month before lost its accent disc, a disabled day on either side
 * of the month took the out-of-scope text, and a selected one lost its accent text.
 *
 * Each case reads an item in both states against an item in the higher-ranked state alone.
 * It runs in light and in high contrast, because the two differ in which brushes can disagree:
 * in light the out-of-scope, disabled and plain fills are all transparent, so only the text and
 * today's fill separate the states, and in high contrast the out-of-scope fill is opaque and the
 * other two are not. Each brush a comparison turns on is asserted to differ from the one that
 * covered it, in the theme where it does, so a token change that made a pair equal fails here
 * rather than leaving the comparison unable to disagree.
 */
test("an out-of-scope item yields to disabled, today and a selected day's text", async ({
	page
}) => {
	// The 2nd rather than the screenshot's 8th: with the week starting on Sunday, as it does for
	// this route's calendars in en-US, August's view ends on the Saturday after the 2nd, the 5th,
	// so the 8th is never out of scope and the 2nd is, a month back.
	await page.clock.setFixedTime(new Date('2026-09-02T12:00:00Z'));

	const look = (item: Locator) =>
		item.evaluate((el) => {
			const style = getComputedStyle(el);
			return { background: style.backgroundColor, color: style.color };
		});
	const one = async (items: Locator, what: string) => {
		expect(await items.count(), `the route renders ${what} not exactly once`).toBe(1);
		return items;
	};
	/** Goes back a month and waits for the view to settle. */
	const previous = async (view: Locator) => {
		await view.locator('.nav.previous').first().click();
		await page.waitForFunction(() =>
			document
				.getAnimations()
				.every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity)
		);
	};
	/** The route's CalendarView whose `.row` follows the heading with this text. */
	const under = (heading: string) =>
		page
			.locator('h2', { hasText: new RegExp(`^${heading}$`) })
			.locator('xpath=following-sibling::div[1]')
			.locator('.calendar-view');
	const PLAIN = ':not([data-today]):not([data-selected]):not([data-disabled])';

	for (const theme of ['light', 'high-contrast'] as const) {
		await page.goto('/dev/calendar-view');
		// Both channels and a reload, then a wait on the attribute the layout's mount effect
		// writes.
		await page.evaluate((t) => {
			localStorage.setItem('winui-svelte:theme', t);
			document.documentElement.dataset.theme = t;
		}, theme);
		await page.reload();
		await expect
			.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''))
			.toBe(theme);
		const fills = theme === 'high-contrast';

		// Today, from the month before, in the route's first CalendarView.
		const first = page.locator('.calendar-view').first();
		const inMonthPlain = await look(
			first.locator(`.day:not([data-outside-month])${PLAIN}`).first()
		);
		const inMonthToday = await look(await one(first.locator('.day[data-today]'), 'today'));
		await previous(first);
		const outToday = await one(
			first.locator('.day[data-today][data-outside-month]'),
			'today out of scope'
		);
		const outPlain = await look(first.locator(`.day[data-outside-month]${PLAIN}`).first());
		expect(inMonthToday.background, `${theme}: today and out of scope share a fill`).not.toBe(
			outPlain.background
		);
		expect(await look(outToday), `${theme}: today out of scope is not drawn as today`).toEqual(
			inMonthToday
		);

		// Disabled: the fixture's range is the 1st to the 15th, so the rest of September and the
		// days of August and October on either side of it are disabled, and only the second are
		// also out of scope.
		const bounded = under('minimum and maximum dates');
		const inMonthDisabled = await look(
			bounded.locator('.day[data-disabled]:not([data-outside-month]):not([data-today])').first()
		);
		expect(
			inMonthDisabled.color,
			`${theme}: disabled and out-of-scope text share a brush`
		).not.toBe(outPlain.color);
		if (fills)
			expect(
				inMonthDisabled.background,
				`${theme}: disabled and out of scope share a fill`
			).not.toBe(outPlain.background);
		expect(
			await look(bounded.locator('.day[data-disabled][data-outside-month]').last()),
			`${theme}: a disabled day out of scope is not drawn as disabled`
		).toEqual(inMonthDisabled);

		// Selected: the 4th is, and a month back it trails into August's view. It keeps the
		// out-of-scope fill, which only high contrast can tell from a plain day's.
		const multiple = under('selectionMode=multiple');
		const inMonthSelected = await look(
			multiple.locator('.day[data-selected]:not([data-outside-month]):not([data-today])').first()
		);
		await previous(multiple);
		const outSelected = multiple.locator('.day[data-selected][data-outside-month]').first();
		const outPlainHere = await look(multiple.locator(`.day[data-outside-month]${PLAIN}`).first());
		expect(
			inMonthSelected.color,
			`${theme}: selected and out-of-scope text share a brush`
		).not.toBe(outPlainHere.color);
		if (fills)
			expect(
				outPlainHere.background,
				`${theme}: out of scope and a plain day share a fill`
			).not.toBe(inMonthPlain.background);
		expect(
			await look(outSelected),
			`${theme}: a selected day out of scope has lost the selected text, or the out-of-scope fill`
		).toEqual({ background: outPlainHere.background, color: inMonthSelected.color });
	}
});
