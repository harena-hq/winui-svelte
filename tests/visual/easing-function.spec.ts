import { ease, EASING_MODES, EASING_NAMES } from '../../apps/gallery/src/lib/easing';
import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

// 256 CSS stops were measured at a maximum 0.187px interpolation error over 200px of travel.
const POSITION_TOLERANCE_PX = 0.25;
// Eleven easing functions in three modes produce thirty-three strips.
const TRACK_COUNT = 33;
// Every strip samples eleven paused frames.
const MARKER_COUNT = 363;
// The route's `@keyframes` translates 0 → 472px, which is its 480px track less an 8px marker.
// A curve's value at a frame is therefore this many pixels of travel.
const TRAVEL_PX = 472;

test('EasingFunction in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'EasingFunction', '/dev/easing-function', { animations: 'allow' });
});

test('EasingFunction curves match their closed forms', async ({ page }) => {
	await page.goto('/dev/easing-function');

	const tracks = page.locator('.track');
	const markers = page.locator('.marker');
	await expect(tracks).toHaveCount(TRACK_COUNT);
	await expect(markers).toHaveCount(MARKER_COUNT);

	const positions = await tracks.evaluateAll((elements) =>
		elements.map((track) => {
			const trackLeft = track.getBoundingClientRect().left;
			return [...track.querySelectorAll<HTMLElement>('.marker')].map(
				(marker) => marker.getBoundingClientRect().left - trackLeft
			);
		})
	);

	let worst: {
		error: number;
		name: (typeof EASING_NAMES)[number];
		mode: (typeof EASING_MODES)[number];
		frame: number;
		actual: number;
		expected: number;
	} = {
		error: -Infinity,
		name: EASING_NAMES[0],
		mode: EASING_MODES[0],
		frame: 0,
		actual: 0,
		expected: 0
	};

	for (const [easingIndex, name] of EASING_NAMES.entries()) {
		for (const [modeIndex, mode] of EASING_MODES.entries()) {
			const track = positions[easingIndex * EASING_MODES.length + modeIndex];
			for (const [frame, actual] of track.entries()) {
				const expected = TRAVEL_PX * ease(name, mode)(frame / 10);
				const error = Math.abs(actual - expected);
				if (!Number.isFinite(actual) || !Number.isFinite(expected) || !Number.isFinite(error)) {
					throw new Error(
						`${name} ${mode} frame ${frame}: rendered ${actual}px, expected ${expected}px, error ${error}px`
					);
				}
				if (error > worst.error) worst = { error, name, mode, frame, actual, expected };
			}
		}
	}

	// Asserted rather than thrown, so a run that somehow measured nothing fails here instead of
	// falling through a comparison against the -Infinity this starts at. The message carries the
	// curve, because "0.31 is not at most 0.25" says nothing about which of thirty-three moved.
	expect(
		worst.error,
		`worst curve: ${worst.name} ${worst.mode} frame ${worst.frame}, rendered ${worst.actual}px against ${worst.expected}px`
	).toBeLessThanOrEqual(POSITION_TOLERANCE_PX);
	expect(Number.isFinite(worst.error)).toBe(true);
});
