import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// What the thumb waits for is invisible to a screenshot, and no baseline in this suite
// photographs a hovered thumb at all — so this reads the delays off the computed style instead.
// Both orientations are asserted because the two hover rules are separate declarations that can
// regress apart.

type Orientation = 'vertical' | 'horizontal';

const barOf = (orientation: Orientation) => `[data-scroll-bar][data-orientation='${orientation}']`;

/**
 * The thumb's three transition delays, in milliseconds, in the order the rule lists them:
 * the geometry twice, then the colour. `ScrollBarExpandBeginTime` and
 * `ScrollBarContractBeginTime` are written `400ms` and `500ms` in the token layer and a
 * browser may serialise either unit, so each entry is parsed rather than compared as a string.
 */
function delaysOf(page: Page, orientation: Orientation, hovered: boolean) {
	return page.evaluate(
		([selector, isHovered]) => {
			const bar = document.querySelector(selector as string)!;
			// `[class~=]`, not `[class*=]`: the component also renders a `.panning-thumb`, and the
			// substring form matches that too. Svelte adds its scope hash as a second class.
			const thumb = bar.querySelector("[class~='thumb']")!;
			if (bar.matches(':hover') !== isHovered) {
				throw new Error(`Expected the bar's hover state to be ${isHovered}.`);
			}
			return getComputedStyle(thumb)
				.transitionDelay.split(',')
				.map((delay) => {
					const value = delay.trim();
					return value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
				});
		},
		[barOf(orientation), hovered] as [string, boolean]
	);
}

test("the thumb's geometry waits for the contract delay", async ({ page }) => {
	await page.goto('/dev/scroll-bar');
	await page.waitForSelector(`${barOf('vertical')} [class~='thumb']`);
	await page.mouse.move(0, 0);

	// ScrollBarContractBeginTime, twice, and then the colour — which is a VisualState.Setter
	// upstream and so carries no delay at all.
	expect(await delaysOf(page, 'vertical', false)).toEqual([500, 500, 0]);
	expect(await delaysOf(page, 'horizontal', false)).toEqual([500, 500, 0]);
});

test("the thumb's geometry waits for the expand delay", async ({ page }) => {
	await page.goto('/dev/scroll-bar');

	await page.locator(barOf('vertical')).first().hover();
	expect(await delaysOf(page, 'vertical', true)).toEqual([400, 400, 0]);

	await page.locator(barOf('horizontal')).first().hover();
	expect(await delaysOf(page, 'horizontal', true)).toEqual([400, 400, 0]);
});
