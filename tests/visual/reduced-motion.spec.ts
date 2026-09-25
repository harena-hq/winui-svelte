import { expect, test } from './fixtures';

type Page = import('@playwright/test').Page;

/**
 * What `prefers-reduced-motion: reduce` stops, per ADR 0016: the motion upstream's animation
 * switch stops, and nothing else. Brush transitions, visual transitions and a state's theme
 * animations go to zero; a state's own storyboard keeps its time.
 *
 * Every element a selector matches on its route is read, not the first, because the rules that
 * set these durations differ in specificity — an open pane, an expanded one, the active
 * calendar view — and a reduce block that loses to one of them is the failure this reaches.
 * `property` pins each selector to the component it is meant to find: `.root` on a route is
 * anything, `.root` whose transition is `background` is the button.
 */

type Reading = { property: string; duration: string; delay: string };

async function readAll(
	page: Page,
	route: string,
	selector: string,
	motion: 'reduce' | 'no-preference',
	pseudo?: string
) {
	await page.emulateMedia({ reducedMotion: motion });
	await page.goto(route);
	// A NavigationView declares no transition until it has settled into its first state, so a
	// reading taken before then is of that, not of the preference.
	await expect(page.locator('[data-overlay]:not([data-settled])')).toHaveCount(0);
	const readings: Reading[] = await page.locator(selector).evaluateAll(
		(els, pseudo) =>
			els.map((el) => {
				const style = getComputedStyle(el, pseudo ?? null);
				return {
					property: style.transitionProperty,
					duration: style.transitionDuration,
					delay: style.transitionDelay
				};
			}),
		pseudo
	);
	expect(readings.length, `${selector} matched nothing on ${route}`).toBeGreaterThan(0);
	return readings;
}

const zero = (list: string) => list.split(', ').every((value) => value === '0s');

/** Sites whose upstream mechanism reads the switch: every duration goes to zero. */
const STOPPED: {
	route: string;
	selector: string;
	pseudo?: string;
	property: string;
	why: string;
	/** `kept` where upstream's switched-off path keeps its `BeginTime`s, `zero` otherwise. */
	delay?: 'kept';
}[] = [
	{ route: '/dev/button', selector: 'button.root', property: 'background', why: 'BrushTransition' },
	{
		route: '/dev/repeat-button',
		selector: 'button.root',
		property: 'background',
		why: 'BrushTransition'
	},
	{
		route: '/dev/toggle-button',
		selector: 'button.root',
		property: 'background',
		why: 'BrushTransition'
	},
	{
		route: '/dev/hyperlink-button',
		selector: '.root',
		property: 'background',
		why: 'BrushTransition'
	},
	{
		route: '/dev/drop-down-button',
		selector: 'button.root',
		property: 'background',
		why: 'BrushTransition'
	},
	{
		route: '/dev/app-bar-button',
		selector: '.fill',
		property: 'background',
		why: 'BrushTransition'
	},
	{
		route: '/dev/app-bar-toggle-button',
		selector: '.fill',
		property: 'background',
		why: 'BrushTransition'
	},
	{
		route: '/dev/button',
		selector: 'button.root',
		pseudo: '::after',
		property: 'background',
		why: 'BrushTransition on the ring'
	},
	{
		route: '/dev/repeat-button',
		selector: 'button.root',
		pseudo: '::after',
		property: 'background',
		why: 'BrushTransition on the ring'
	},
	{
		route: '/dev/toggle-button',
		selector: 'button.root',
		pseudo: '::after',
		property: 'background',
		why: 'BrushTransition on the ring'
	},
	{
		route: '/dev/hyperlink-button',
		selector: '.root',
		pseudo: '::after',
		property: 'background',
		why: 'BrushTransition on the ring'
	},
	{
		route: '/dev/drop-down-button',
		selector: 'button.root',
		pseudo: '::after',
		property: 'background',
		why: 'BrushTransition on the ring'
	},
	{
		route: '/dev/app-bar-toggle-button',
		selector: '.fill',
		pseudo: '::after',
		property: 'background',
		why: 'BrushTransition on the ring'
	},
	{
		route: '/dev/toggle-switch',
		selector: '.knob',
		property: 'transform',
		why: 'RepositionThemeAnimation in a VisualTransition'
	},
	{
		route: '/dev/calendar-view',
		selector: '.view-layer',
		property: 'opacity, transform, visibility',
		why: 'DisplayModeStates VisualTransition'
	},
	{
		route: '/dev/semantic-zoom',
		selector: '.presenter',
		property: 'opacity, visibility',
		why: 'Fade theme animations'
	},
	{
		route: '/dev/split-view',
		selector: '.pane',
		property: 'translate, clip-path, visibility',
		why: 'DisplayModeStates VisualTransition'
	},
	{
		route: '/dev/navigation-view',
		selector: '.pane',
		property: 'translate, clip-path, visibility',
		why: 'DisplayModeStates VisualTransition'
	},
	{
		route: '/dev/navigation-view',
		selector: '.shadow-caster',
		property: 'opacity, translate',
		why: 'PaneOverlayGroup VisualTransition'
	},
	{
		route: '/dev/scroll-bar',
		selector: '.track',
		property: 'opacity',
		why: 'ExpandedWithoutAnimation',
		delay: 'kept'
	},
	{
		route: '/dev/split-view',
		selector: '.root[data-pane-placement]',
		property: 'grid-template-columns',
		why: 'DisplayModeStates VisualTransition'
	},
	{
		route: '/dev/scroll-bar',
		selector: '.arrow',
		property: 'opacity',
		why: 'ExpandedWithoutAnimation',
		delay: 'kept'
	},
	{
		route: '/dev/progress-bar',
		selector: "[data-progress-state='determinate'] .determinate",
		property: 'background-color',
		why: 'the VisualTransition back to Determinate'
	}
];

for (const site of STOPPED) {
	test(`reduced motion stops ${site.selector}${site.pseudo ?? ''} on ${site.route} (${site.why})`, async ({
		page
	}) => {
		const moving = await readAll(page, site.route, site.selector, 'no-preference', site.pseudo);
		// The positive control: the same elements move without the preference.
		expect(moving.some((reading) => !zero(reading.duration))).toBe(true);
		const reduced = await readAll(page, site.route, site.selector, 'reduce', site.pseudo);
		expect(reduced.length).toBe(moving.length);
		reduced.forEach((reading, index) => {
			expect(reading.property.startsWith(site.property), reading.property).toBe(true);
			expect(reading.duration, `${site.selector} still moves under reduced motion`).toMatch(
				/^0s(, 0s)*$/
			);
			// A skipped transition has no delay left either; the scroll bar's switched-off states
			// keep theirs.
			if (site.delay === 'kept') expect(reading.delay).toBe(moving[index].delay);
			else expect(reading.delay).toMatch(/^0s(, 0s)*$/);
		});
	});
}

/** Sites that are a state's own storyboard upstream: reduced motion changes nothing. */
const KEPT: { route: string; selector: string }[] = [
	{ route: '/dev/expander', selector: '.content' },
	{ route: '/dev/radio-button', selector: '.dot' },
	{ route: '/dev/media-transport-controls', selector: '.media-transport-controls' },
	{ route: '/dev/toggle-switch', selector: '.knob-on' },
	{ route: '/dev/toggle-switch', selector: '.knob-off' },
	{ route: '/dev/progress-bar', selector: "[data-progress-state='paused'] .determinate" },
	{ route: '/dev/progress-bar', selector: "[data-progress-state='error'] .determinate" }
];

for (const site of KEPT) {
	test(`reduced motion leaves ${site.selector} on ${site.route} running`, async ({ page }) => {
		const moving = await readAll(page, site.route, site.selector, 'no-preference');
		expect(moving.some((reading) => !zero(reading.duration))).toBe(true);
		expect(await readAll(page, site.route, site.selector, 'reduce')).toEqual(moving);
	});
}

for (const orientation of ['vertical', 'horizontal']) {
	test(`the ${orientation} scroll bar still waits under reduced motion, then snaps`, async ({
		page
	}) => {
		// `ExpandedWithoutAnimation` and `CollapsedWithoutAnimation` keep every `BeginTime` and
		// zero every `Duration` (ScrollBar_themeresources.xaml:600-670). The colour is a Setter
		// in all four states, and keeps the time this library gives it.
		const at = async (motion: 'reduce' | 'no-preference') => {
			await page.emulateMedia({ reducedMotion: motion });
			await page.goto('/dev/scroll-bar');
			const bar = page.locator(`.scroll-bar[data-orientation="${orientation}"]`).first();
			const thumb = bar.locator('.thumb');
			const read = () =>
				thumb.evaluate((el) => {
					const style = getComputedStyle(el);
					return { duration: style.transitionDuration, delay: style.transitionDelay };
				});
			const resting = await read();
			await bar.hover();
			return { resting, hovered: await read() };
		};
		const moving = await at('no-preference');
		const reduced = await at('reduce');
		for (const state of ['resting', 'hovered'] as const) {
			expect(reduced[state].delay, state).toBe(moving[state].delay);
			const [size, transform, colour] = reduced[state].duration.split(', ');
			expect([size, transform], state).toEqual(['0s', '0s']);
			expect(colour, state).toBe(moving[state].duration.split(', ')[2]);
		}
		expect(moving.hovered.delay).not.toBe(moving.resting.delay);
	});
}

/** A scroll upstream asks to animate animates only while the switch is on. */
const SCROLLS: {
	route: string;
	method: string;
	act?: (page: Page) => Promise<void>;
	source: string;
}[] = [
	{
		route: '/dev/tab-view',
		method: 'scrollBy',
		act: (page) => page.getByRole('button', { name: 'Scroll tab list forward' }).first().click(),
		source: '`ChangeView`, ScrollViewer_Partial.cpp:3616'
	},
	{
		route: '/dev/pips-pager',
		method: 'scrollIntoView',
		act: (page) => page.getByRole('button', { name: 'Next Page' }).first().click(),
		source: '`BringIntoViewport`, ScrollViewer_Partial.cpp:8733'
	}
];

for (const site of SCROLLS) {
	test(`${site.method} on ${site.route} is instant under reduced motion (${site.source})`, async ({
		page
	}) => {
		// The behaviour each call asks for, recorded before the page's own script runs. A smooth
		// scroll is not something a reading after the fact can tell from a finished one.
		await page.addInitScript((method) => {
			const calls: (string | undefined)[] = [];
			(window as unknown as { __behaviours: typeof calls }).__behaviours = calls;
			const proto = Element.prototype as unknown as Record<string, (...args: unknown[]) => unknown>;
			const original = proto[method];
			proto[method] = function (this: Element, ...args: unknown[]) {
				calls.push((args[0] as ScrollIntoViewOptions | undefined)?.behavior);
				return original.apply(this, args);
			};
		}, site.method);
		const behaviours = async (motion: 'reduce' | 'no-preference') => {
			await page.emulateMedia({ reducedMotion: motion });
			await page.goto(site.route);
			await site.act?.(page);
			return page.evaluate(
				() => (window as unknown as { __behaviours: (string | undefined)[] }).__behaviours
			);
		};
		const moving = await behaviours('no-preference');
		expect(moving.length).toBeGreaterThan(0);
		expect(new Set(moving)).toEqual(new Set(['smooth']));
		const reduced = await behaviours('reduce');
		expect(reduced.length).toBeGreaterThan(0);
		expect(new Set(reduced)).toEqual(new Set(['auto']));
	});
}
