import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

/**
 * What the picture cannot carry.
 *
 * The route photographs a curve by pausing one animation at eleven negative delays, which
 * makes the duration cancel: a strip shot at 1000ms is pixel-identical to one shot at 100ms.
 * So the snapshot below settles the curves and this table settles everything else about the
 * timing. Every value here was read out of the reference browser before the route was written.
 */
const EXPECTED = {
	markers: 66,
	keyframesName: 'motion-frame',
	durations: [1000],
	playStates: ['paused'],
	delays: [0, -100, -200, -300, -400, -500, -600, -700, -800, -900, -1000],
	timingFunctions: [
		'linear',
		// The strip that reads `var(--winui-ControlFastOutSlowInKeySpline)`. Resolving to this
		// is what proves the emitted token is usable as a timing function at all.
		'cubic-bezier(0, 0, 0, 1)',
		'cubic-bezier(0.8, 0, 0.2, 1)',
		'cubic-bezier(0.1, 0.9, 0.2, 1)',
		'cubic-bezier(0.17, 0.17, 0, 1)',
		'cubic-bezier(0.7, 0, 1, 0.5)'
	]
} as const;

test('Motion in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	// `animations: 'allow'` and not the default. The default finishes every animation before
	// capturing, which sends all eleven markers of every strip to the end frame and photographs
	// six identical single squares. Allowing them is safe *here* and nowhere else: these
	// animations are paused by construction, and re-reading a paused frame across a repaint was
	// measured to move it by exactly zero.
	await snapshotAllThemes(page, 'Motion', '/dev/motion', { animations: 'allow' });
});

test('Motion animation timing is pinned', async ({ page }) => {
	await page.goto('/dev/motion');

	const observed = await page.evaluate(() => {
		const markers = [...document.querySelectorAll<HTMLElement>('.marker')];
		// Collected from the markers rather than by filtering `document.getAnimations()` on a
		// name. Svelte scopes a `@keyframes` name to `svelte-<hash>-motion-frame`, and the hash
		// is derived from the component's own contents — so an assertion carrying the whole name
		// passes today and fails the next time a word in this route changes. Asking the elements
		// also makes a page that rendered no markers fail as `0` rather than silently as an
		// empty filter.
		const animations = markers.flatMap((marker) => marker.getAnimations());
		const scoped = /^svelte-[a-z0-9]+-/;

		return {
			markers: markers.length,
			animations: animations.length,
			names: [
				...new Set(
					animations.map((animation) =>
						animation instanceof CSSAnimation ? animation.animationName.replace(scoped, '') : ''
					)
				)
			],
			durations: [
				...new Set(animations.map((animation) => Number(animation.effect?.getTiming().duration)))
			].sort((a, b) => a - b),
			playStates: [...new Set(animations.map((animation) => animation.playState))].sort(),
			// Descending, because the delays run 0 down to -1000 and that is the order a reader
			// checks them against the strip.
			delays: [
				...new Set(animations.map((animation) => Number(animation.effect?.getTiming().delay)))
			].sort((a, b) => b - a),
			timingFunctions: [...document.querySelectorAll<HTMLElement>('.track')].map((track) => {
				const marker = track.querySelector<HTMLElement>('.marker');
				if (!marker) throw new Error('Motion track has no marker');
				return getComputedStyle(marker).animationTimingFunction;
			})
		};
	});

	expect(observed.markers).toBe(EXPECTED.markers);
	// One animation per marker and not one more: a second would mean the route grew an
	// animation this table does not describe.
	expect(observed.animations).toBe(EXPECTED.markers);
	expect(observed.names).toEqual([EXPECTED.keyframesName]);
	expect(observed.durations).toEqual([...EXPECTED.durations]);
	expect(observed.playStates).toEqual([...EXPECTED.playStates]);
	expect(observed.delays).toEqual([...EXPECTED.delays]);
	expect(observed.timingFunctions).toEqual([...EXPECTED.timingFunctions]);
});
