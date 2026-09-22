import type { Locator, Page } from '@playwright/test';

import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('ToolTip in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ToolTip', '/dev/tool-tip');
});

/**
 * The pointer-anchored row's trigger. Every trigger on this page is 580 wide, not just this
 * one — `.row` is a flex column capped there and `Button`'s inline-flex root has no width of
 * its own, so `align-items: normal` stretches each of them to it. That width is what lets two
 * hover points 120 apart both land inside one trigger, which is what separates "anchored to
 * the pointer" from "anchored to the element".
 */
const TRIGGER = 'button:has-text("Button with a simple ToolTip.")';
/**
 * This row's popup, and not any popup. The harness keeps a sixth tooltip open for the
 * snapshot's sake, so `.popup` matches one before the pointer has gone anywhere near this
 * trigger — and a "wait for it to close" written that way waits for something that never
 * closes.
 */
const POPUP = '.popup:text-is("Simple ToolTip")';

/** Hover `x` pixels in from the trigger's left edge and return the popup's box. */
/**
 * The popup's box once Floating UI has placed it, which `toBeVisible()` does not wait for:
 * until it is positioned bits-ui parks the wrapper at `translate(0, -200%)`
 * (`use-floating-layer.svelte.js:135`), and that has a real box and no `visibility: hidden`,
 * so a read that races the placement returns a position the popup never held. The *second*
 * open is the one that races — the provider's skip-delay opens it synchronously on
 * `pointerenter` — which is the same ordering the component's own fix turns on.
 */
async function placed(popup: Locator) {
	let last: { x: number; y: number; width: number; height: number } | null = null;
	await expect
		.poll(async () => {
			const now = await popup.boundingBox();
			const settled = !!now && now.y >= 0 && !!last && now.x === last.x && now.y === last.y;
			last = now;
			return settled;
		})
		.toBe(true);
	return last!;
}

async function openAt(page: Page, x: number) {
	const trigger = page.locator(TRIGGER).first();
	const box = (await trigger.boundingBox())!;
	// Away first, so that each call is a fresh open rather than a move inside a trigger the
	// pointer is already on — which is the very thing the second test holds still for.
	await page.mouse.move(box.x + box.width + 200, box.y + 200);
	await expect(page.locator(POPUP)).toHaveCount(0);
	await page.mouse.move(box.x + x, box.y + box.height / 2);
	const popup = page.locator(POPUP);
	await expect(popup).toBeVisible();
	return { popup, box: await placed(popup), trigger: box };
}

// Both directions, because a control that is wrong in one of them passes the other. An
// element-anchored tooltip opens in the same place both times — delta 0 — so it fails the
// first test and sails through the second; a pointer-*following* tooltip opens centred on the
// pointer and keeps up with it, so it passes the first and fails the second.
//
// Which of the two guards the fix below it: the second. Revert the component and only that
// one goes red. The first guards the two implementations that were written for this and
// rejected — both pinned every tooltip after the first to the first one's position, which is
// a delta of 0, and neither was caught by anything else.
//
// Measured on the reference guest against the original, on the Gallery's own pane-toggle
// button: opened from two pointer positions 28px apart, the popup's centre moved by exactly
// 28; moved 21 across and 20 down while open, the popup did not change by a pixel.
test('the pointer-anchored tooltip opens centred on the pointer', async ({ page }) => {
	await page.goto('/dev/tool-tip');

	const near = await openAt(page, 40);
	const far = await openAt(page, 160);

	const delta = far.box.x + far.box.width / 2 - (near.box.x + near.box.width / 2);
	// 120 is the distance between the two hover points. Both popups render the same string and
	// are the same width, so the halves cancel and an exact 120 is what this should be; the
	// pixel is slack against subpixel layout rather than a bound anything computes.
	expect(Math.abs(delta - 120)).toBeLessThanOrEqual(1);
});

test('and then stays where it opened while the pointer moves under it', async ({ page }) => {
	await page.goto('/dev/tool-tip');

	const { popup, box, trigger } = await openAt(page, 40);

	// Three moves, all inside the trigger, none of them leaving it: a single move could be
	// swallowed by a throttle and read as "it did not follow".
	for (const dx of [20, 45, 70]) {
		await page.mouse.move(trigger.x + dx, trigger.y + trigger.height / 2);
		await expect(popup).toBeVisible();
		const now = (await popup.boundingBox())!;
		expect(now.x).toBe(box.x);
		expect(now.y).toBe(box.y);
	}
});

// The other end of the same claim, and the one the rail found. The two tests above both keep
// the pointer *on* the trigger; what happens when it leaves is a third case, and the anchor was
// changing there — `pointerInside` went false, `customAnchor` fell back to the trigger, and the
// popup that was still on screen moved to the new answer before it closed. Measured on
// `/dev/navigation-view-rail`, where the row is 36 tall and the jump was its half, 18px.
//
// Sampled rather than read once, and the live reads are counted: the popup closes about 200ms
// after the leave, so a single read that lands after it would pass against either component.
test('and does not re-anchor to the trigger when the pointer leaves it', async ({ page }) => {
	await page.goto('/dev/tool-tip');

	const { box, trigger } = await openAt(page, 40);

	// `.popup` by its text rather than the `POPUP` locator: this read has to be able to come
	// back empty, and a locator that matches nothing throws instead.
	const rectNow = () =>
		page.evaluate(() => {
			const el = [...document.querySelectorAll('.popup')].find(
				(e) => e.textContent?.trim() === 'Simple ToolTip'
			);
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return { x: r.x, y: r.y };
		});

	// Off the trigger altogether, which is what a pointer crossing onto the next row does.
	await page.mouse.move(trigger.x + trigger.width / 2, trigger.y + trigger.height + 60);

	let seen = 0;
	for (let i = 0; i < 15; i++) {
		const now = await rectNow();
		if (!now) break;
		expect(Math.abs(now.x - box.x)).toBeLessThanOrEqual(0.5);
		expect(Math.abs(now.y - box.y)).toBeLessThanOrEqual(0.5);
		seen++;
		await page.waitForTimeout(20);
	}
	// Otherwise the loop above asserted nothing: every read came back after the close.
	expect(seen).toBeGreaterThan(0);
});

// The pointer is not the only thing that opens one. `onfocus` reaches the trigger whenever
// `openOnHover` is true, so a keyboard user tabbing onto it opens a tooltip with no pointer
// anywhere near — and a pointer-anchored popup has nothing to anchor to. The original's answer
// is the element, and so is this one's: with no pointer over the trigger there is no pointer
// position to honour, so `customAnchor` falls back to the trigger.
//
// Before the fallback the popup froze at the pointer's initial `{0, 0}` and stayed in the
// corner for the whole open, because only a close releases the anchor.
test('a tooltip opened by the keyboard is anchored to the trigger, not to a pointer that never came', async ({
	page
}) => {
	await page.goto('/dev/tool-tip');

	const trigger = page.locator(TRIGGER).first();
	const box = (await trigger.boundingBox())!;
	await trigger.focus();

	const popup = page.locator(POPUP);
	await expect(popup).toBeVisible();
	const now = await placed(popup);

	// Centred on the trigger, which is what `align="center"` against the element means — and
	// nowhere near the viewport's corner, which is where `{0, 0}` puts it.
	expect(Math.abs(now.x + now.width / 2 - (box.x + box.width / 2))).toBeLessThanOrEqual(1);
});

// The enter half of the same invariant, and the one a review found rather than a probe. The
// test above opens by focus and reads the popup at the open, before any pointer arrives; this
// brings a pointer in afterwards. `pointerInside` was going false to true under a popup already
// on screen, `customAnchor` flipped from the trigger to the pointer, and the popup jumped —
// and once the leave stopped releasing the flag, nothing put it back until the close.
//
// The pin decides this by the open too, and says so in its own words at
// `ToolTip_Partial.cpp:815`: "PlacementMode.Mouse only makes sense for automatic ToolTips
// opened by touch or mouse". The mode that test reads is latched at
// `ToolTipService_Partial.cpp:480` and cleared on the close at `ToolTip_Partial.cpp:405`.
test('and stays on the trigger when a pointer arrives after a keyboard open', async ({ page }) => {
	await page.goto('/dev/tool-tip');

	const trigger = page.locator(TRIGGER).first();
	const box = (await trigger.boundingBox())!;
	// Off every trigger first. A pointer already resting on this one would have latched the
	// anchor before the focus, and this would be a test of the hover path instead.
	await page.mouse.move(box.x + box.width + 200, box.y + 200);
	await trigger.focus();

	const popup = page.locator(POPUP);
	await expect(popup).toBeVisible();
	const at = await placed(popup);

	// 40 in from the left edge: the offset the two pointer tests use, and 250 from where the
	// element anchor centres the popup on this 580-wide trigger.
	await page.mouse.move(box.x + 40, box.y + box.height / 2);

	// Sampled rather than read once, for the same reason the leave test samples: the flip is a
	// frame or two after the move and a single read can land before it.
	for (let i = 0; i < 10; i++) {
		const now = (await popup.boundingBox())!;
		expect(Math.abs(now.x - at.x)).toBeLessThanOrEqual(0.5);
		expect(Math.abs(now.y - at.y)).toBeLessThanOrEqual(0.5);
		await page.waitForTimeout(30);
	}
});
