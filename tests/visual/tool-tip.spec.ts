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
