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

/**
 * A disabled item is neither hovered nor pressed.
 *
 * Upstream's stroke chain does not ask whether a plain item is enabled (`GetItemBorderBrush`,
 * `CalendarViewBaseItemChrome.cpp:1384`, `:1395`); the pointer is kept off a disabled item by hit
 * testing, whose tree walk passes over an element that is not enabled unless its caller asks for
 * disabled elements (`IsEnabledAndVisibleForHitTest`, `uielement.cpp:2353`, called at `:13442`).
 * Within the pinned checkout only diagnostics ask; the pointer input processor that calls the
 * walk is outside it. The component's hover and pressed rules used to set the stroke on every
 * item, so a disabled day took the hover stroke under the pointer and the pressed stroke with
 * the button held.
 *
 * Each day is read at rest, under the pointer, and with the button held. The stroke is what
 * leaked; the fill and the text are read too, because the disabled rule used to hold them only by
 * coming later than the hover and pressed rules at the same specificity, and a reordering would
 * have leaked them. An enabled day in the same calendar is read first, and every value the hover
 * and pressed rules set is asserted to change on it, so each comparison that could leak is able
 * to disagree. The calendar selects on click, after the button is released, so the enabled day's
 * pressed read is the plain pressed state.
 */
test('a disabled item is neither hovered nor pressed', async ({ page }) => {
	await page.clock.setFixedTime(new Date('2026-09-02T12:00:00Z'));
	await page.goto('/dev/calendar-view');
	await page.evaluate(() => {
		localStorage.setItem('winui-svelte:theme', 'light');
		document.documentElement.dataset.theme = 'light';
	});
	await page.reload();
	await expect
		.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''))
		.toBe('light');

	/** The item's top stroke, fill and text at rest, under the pointer, and with the button held. */
	const looks = async (item: Locator) => {
		const look = () =>
			item.evaluate((el) => {
				const style = getComputedStyle(el);
				return {
					stroke: style.borderTopColor,
					fill: style.backgroundColor,
					text: style.color
				};
			});
		await item.scrollIntoViewIfNeeded();
		await page.mouse.move(0, 0);
		const rest = await look();
		await item.hover();
		const hover = await look();
		await page.mouse.down();
		const pressed = await look();
		await page.mouse.up();
		await page.mouse.move(0, 0);
		return { rest, hover, pressed };
	};

	// The fixture's range is the 1st to the 15th, so the 16th onward is disabled.
	const bounded = page
		.locator('h2', { hasText: /^minimum and maximum dates$/ })
		.locator('xpath=following-sibling::div[1]')
		.locator('.calendar-view');
	const enabled = await looks(
		bounded
			.locator(
				'.day:not([data-outside-month]):not([data-today]):not([data-selected]):not([data-disabled])'
			)
			.first()
	);
	expect(enabled.hover.stroke, 'the hover stroke is the resting one').not.toBe(enabled.rest.stroke);
	expect(enabled.hover.fill, 'the hover fill is the resting one').not.toBe(enabled.rest.fill);
	expect(enabled.pressed.stroke, 'the pressed stroke is the resting one').not.toBe(
		enabled.rest.stroke
	);
	expect(enabled.pressed.fill, 'the pressed fill is the resting one').not.toBe(enabled.rest.fill);
	expect(enabled.pressed.text, 'the pressed text is the resting one').not.toBe(enabled.rest.text);

	const disabled = await looks(
		bounded.locator('.day[data-disabled]:not([data-outside-month]):not([data-today])').first()
	);
	expect(disabled, 'a disabled day changed under the pointer').toEqual({
		rest: disabled.rest,
		hover: disabled.rest,
		pressed: disabled.rest
	});
});

/**
 * A hovered or pressed item takes the brush the chrome picks for its state.
 *
 * The chrome walks an item's states in one order for each brush. For the stroke, today first,
 * which in the rounded chrome gives an enabled item no stroke at all, then selected, then pressed
 * and hovered (`GetItemBorderBrush`, `CalendarViewBaseItemChrome.cpp:1342`, `:1373`, `:1377`,
 * `:1388`, `:1399`). For the fill, today, whose hover and press have fills of their own (`:1474`,
 * `:1478`), then out of scope, which under the pointer takes the plain item's hover and pressed
 * fills (`:1489`, `:1493`, `:1497`, and the plain item's at `:1506`, `:1510`). For the text,
 * today (`:1574`), then selected, then pressed, out of scope or not, then hovered out of scope,
 * then the plain item's (`GetTextBlockForeground`, `:1585`, `:1589`, `:1600`, `:1604`, `:1611`,
 * `:1620`). At rest the same walk ends at the resting brushes: `:1381`, `:1414`, `:1482`,
 * `:1501`, `:1514`, `:1574`, `:1593`, `:1615` and `:1620`. The component states each of those
 * as a CSS rule, and which one wins under the pointer is a matter of specificity and source order
 * that a rest-state read does not exercise. Today's missing stroke is drawn as the plain item's,
 * `CalendarItemBorderBrush`, which is transparent in every theme.
 *
 * Each case names a calendar on the route, an item in it, and the three brushes, as theme
 * resources, expected on it at rest, under the pointer and with the button held. The button is
 * released at the page's corner, in the route's gutter, so the click lands on an ancestor of the
 * item and no case selects a day or drills into a month.
 *
 * Each read under the pointer is compared with the brushes that would show if its rule lost to
 * one it outranks or ties: the item's own at rest; the plain item's in the same pointer state;
 * with the button held, the item's own hover brush, since a held button is also hovering and
 * upstream's "Pressed VS Hovered, Pressed wins" (`:1371`, `:1384`) is source order here; and for
 * today selected, the selected item's in the same state, since today wins over selected
 * (`:1342`). Every such pair
 * is asserted to differ in at least one of the three themes, so a comparison that could not
 * disagree fails here rather than passing, and so does trimming the themes to ones where a pair
 * is equal. Two pairs are equal in every theme, are listed by name, and are asserted to stay
 * equal: the selected pressed stroke is the plain pressed stroke, and the selected hover text is
 * the selected resting text, so those two reads cannot tell the selected pressed stroke from the
 * plain one, nor the selected hover text from the resting one.
 */
test('a hovered or pressed item takes the brush the chrome picks for its state', async ({
	page
}) => {
	// The 8th, so that the fixture's "today and selected" calendar has an item in both states.
	await page.clock.setFixedTime(new Date('2026-09-08T12:00:00Z'));

	type Brushes = [stroke: string, fill: string, text: string];
	type State = 'hover' | 'pressed';
	type Case = {
		heading: string;
		item: string;
		previous?: boolean;
		rest: Brushes;
		/** The state this case's rules outrank, if not only the plain item's. */
		outranks?: Record<State, Brushes>;
	} & Record<State, Brushes>;
	const plain: Record<State, Brushes> = {
		hover: ['HoverBorderBrush', 'CalendarItemHoverBackground', 'CalendarItemForeground'],
		pressed: ['PressedBorderBrush', 'CalendarItemPressedBackground', 'PressedForeground']
	};
	const outOfScope: Omit<Case, 'heading' | 'item'> = {
		rest: ['CalendarItemBorderBrush', 'OutOfScopeBackground', 'OutOfScopeForeground'],
		hover: ['HoverBorderBrush', 'CalendarItemHoverBackground', 'OutOfScopeHoverForeground'],
		pressed: ['PressedBorderBrush', 'CalendarItemPressedBackground', 'OutOfScopePressedForeground']
	};
	const selected: Record<State, Brushes> = {
		hover: ['SelectedHoverBorderBrush', 'CalendarItemHoverBackground', 'SelectedHoverForeground'],
		pressed: [
			'SelectedPressedBorderBrush',
			'CalendarItemPressedBackground',
			'SelectedPressedForeground'
		]
	};
	const today: Omit<Case, 'heading' | 'item'> = {
		rest: ['CalendarItemBorderBrush', 'TodayBackground', 'TodayForeground'],
		hover: ['CalendarItemBorderBrush', 'TodayHoverBackground', 'TodayForeground'],
		pressed: ['CalendarItemBorderBrush', 'TodayPressedBackground', 'TodayForeground']
	};
	// In the order they run: the selected day in the month comes before the same calendar goes
	// back a month for the one out of scope.
	const cases: Case[] = [
		{
			heading: 'default',
			item: '.day[data-outside-month]:not([data-today]):not([data-selected]):not([data-disabled])',
			...outOfScope
		},
		{ heading: 'default', item: '.day[data-today]', ...today },
		{
			heading: 'today and selected',
			item: '.day[data-today][data-selected]',
			...today,
			outranks: selected
		},
		{
			heading: 'selectionMode=multiple',
			item: '.day[data-selected]:not([data-outside-month]):not([data-today])',
			rest: ['SelectedBorderBrush', 'CalendarItemBackground', 'SelectedForeground'],
			...selected
		},
		{
			heading: 'selectionMode=multiple',
			item: '.day[data-selected][data-outside-month]',
			previous: true,
			rest: ['SelectedBorderBrush', 'OutOfScopeBackground', 'SelectedForeground'],
			...selected
		},
		{
			heading: 'displayMode="year"',
			item: '.year-decade-cell:not(.out-of-scope) .item-chrome:not([data-today])',
			rest: ['CalendarItemBorderBrush', 'CalendarItemBackground', 'CalendarItemForeground'],
			...plain
		},
		{
			heading: 'displayMode="year"',
			item: '.year-decade-cell.out-of-scope .item-chrome',
			...outOfScope
		},
		{
			heading: 'displayMode="decade"',
			item: '.year-decade-cell.out-of-scope .item-chrome',
			...outOfScope
		}
	];
	/** Pairs of theme resources that are the same colour in every theme. */
	const equalEverywhere = [
		'SelectedPressedBorderBrush = PressedBorderBrush',
		'SelectedHoverForeground = SelectedForeground'
	];

	/** The route's CalendarView whose `.row` follows the heading with this text. */
	const under = (heading: string) =>
		page
			.locator('h2', { hasText: new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })
			.locator('xpath=following-sibling::div[1]')
			.locator('.calendar-view');
	const look = (item: Locator) =>
		item.evaluate((el): Brushes => {
			const style = getComputedStyle(el);
			return [style.borderTopColor, style.backgroundColor, style.color];
		});
	// A name that is not a theme resource resolves to this rather than to the inherited text.
	const UNKNOWN = 'rgb(1, 2, 3)';
	/** Each theme resource as the colour it resolves to beside the item. */
	const resolve = async (item: Locator, names: Brushes) => {
		const colours = await item.evaluate(
			(el, [names, unknown]) =>
				names.map((name) => {
					const probe = document.createElement('div');
					probe.style.color = `var(--winui-CalendarView${name}, ${unknown})`;
					el.parentElement!.append(probe);
					const colour = getComputedStyle(probe).color;
					probe.remove();
					return colour;
				}) as Brushes,
			[names, UNKNOWN] as const
		);
		expect(colours, `${names.join(', ')}: not all theme resources`).not.toContain(UNKNOWN);
		return colours;
	};

	/** Every rival pair, and whether any theme so far has told it apart. */
	const toldApart = new Map<string, boolean>();
	const listedApart = new Map<string, boolean>();
	for (const theme of ['light', 'dark', 'high-contrast'] as const) {
		await page.goto('/dev/calendar-view');
		await page.evaluate((t) => {
			localStorage.setItem('winui-svelte:theme', t);
			document.documentElement.dataset.theme = t;
		}, theme);
		await page.reload();
		await expect
			.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''))
			.toBe(theme);

		for (const c of cases) {
			const view = under(c.heading);
			if (c.previous) {
				await view.locator('.nav.previous').first().click();
				await page.waitForFunction(() =>
					document
						.getAnimations()
						.every(
							(a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity
						)
				);
			}
			const item = view.locator(c.item).locator('visible=true').first();
			const what = `${theme}, ${c.heading}, ${c.item}`;
			await expect(item, `${what}: no such item`).toBeVisible();
			await item.scrollIntoViewIfNeeded();

			await page.mouse.move(0, 0);
			const rest = await resolve(item, c.rest);
			expect(await look(item), `${what}, at rest`).toEqual(rest);
			let hovered: Brushes | undefined;
			for (const state of ['hover', 'pressed'] as const) {
				if (state === 'hover') await item.hover();
				else await page.mouse.down();
				const want = await resolve(item, c[state]);
				expect(await look(item), `${what}, ${state}`).toEqual(want);

				const rivals: [Brushes, Brushes][] = [
					[c.rest, rest],
					[plain[state], await resolve(item, plain[state])]
				];
				if (state === 'pressed') rivals.push([c.hover, hovered!]);
				if (c.outranks) rivals.push([c.outranks[state], await resolve(item, c.outranks[state])]);
				for (const [rival, colours] of rivals)
					for (const i of [0, 1, 2]) {
						if (c[state][i] === rival[i]) continue;
						const pair = `${c[state][i]} = ${rival[i]}`;
						const seen = equalEverywhere.includes(pair) ? listedApart : toldApart;
						const key = `${c.heading}, ${c.item}, ${state}: ${pair}`;
						seen.set(key, (seen.get(key) ?? false) || want[i] !== colours[i]);
					}
				hovered = want;
			}
			await page.mouse.move(0, 0);
			await page.mouse.up();
		}
	}
	expect(toldApart.size, 'no pair was compared').toBeGreaterThan(0);
	expect(
		[...toldApart].filter(([, apart]) => !apart).map(([key]) => key),
		'pairs no theme tells apart'
	).toEqual([]);
	expect(
		[...listedApart].filter(([, apart]) => apart).map(([key]) => key),
		'pairs listed as equal everywhere that a theme told apart'
	).toEqual([]);
	for (const pair of equalEverywhere)
		expect(
			[...listedApart.keys()].some((key) => key.endsWith(`: ${pair}`)),
			`${pair}: listed but never compared`
		).toBe(true);
});
