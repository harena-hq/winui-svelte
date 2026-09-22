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
 * so a read that races the placement returns a position the popup never held.
 *
 * The race used to belong to the *second* open, which the provider's skip-delay opened
 * synchronously on `pointerenter`; the component withholds that window now
 * (`skipDelayDuration={0}`), and the wait is still needed — Floating UI measures a frame after
 * the mount however the mount was reached.
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
// changing there — the input mode went to `'none'`, `customAnchor` fell back to the trigger, and
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
// brings a pointer in afterwards. The input mode was going to `'mouse'` under a popup already
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

// ---------------------------------------------------------------------------------------
// The input mode, which decides two things: how long the tooltip waits and how far it sits.
//
// `m_inputMode` is one field upstream and it is read three times — for the anchor
// (`ToolTip_Partial.cpp:815`), for the delay (`GetInitialShowDelay`,
// `ToolTipService_Partial.cpp:1795-1838`) and for the offset (`:1229-1255`, and `:1722-1748`
// on the windowed path). The tests above cover the first. These cover the other two.
//
// Measured on the reference guest before any of this was written, with the Gallery's own pane
// collapsed to the rail and a row reached by an arrow key: the tooltip's border box stood
// exactly 12px clear of the row's bounds, twice, on two rows; and a capture taken in the same
// breath as the key press caught no tooltip at all, where one taken a second later had it.
// Ours opened on the focus itself and stood 20 clear.
//
// `/dev/tool-tip-input-mode` rather than the page above, and the harness says why: no snapshot
// is taken of it, so these specimens cost no baseline.
const MODE_PAGE = '/dev/tool-tip-input-mode';

/**
 * Arm two clocks in the page and return a reader for the distance between them: `t0` is stamped
 * by the trigger's own `focus` or `pointerenter`, `t1` by the first mutation that puts the popup
 * in the document.
 *
 * Both are taken inside the page deliberately. A `t0` read over CDP before driving the input
 * counts the round trip as part of the delay and reports it longer than it is — and every bound
 * below is a floor, so an inflated measurement is the direction that passes a component that
 * opens too soon.
 */
async function armDelay(
	page: Page,
	triggerId: string,
	event: 'focus' | 'pointerenter',
	text: string
) {
	await page.evaluate(
		({ triggerId, event, text }) => {
			const win = window as unknown as { __t0: number | null; __t1: number | null };
			win.__t0 = null;
			win.__t1 = null;
			document.getElementById(triggerId)!.addEventListener(event, () => {
				if (win.__t0 === null) win.__t0 = performance.now();
			});
			new MutationObserver(() => {
				if (win.__t1 !== null) return;
				const shown = [...document.querySelectorAll('.popup')].some(
					(element) => element.textContent?.trim() === text
				);
				if (shown) win.__t1 = performance.now();
			}).observe(document.body, { childList: true, subtree: true });
		},
		{ triggerId, event, text }
	);

	return async () =>
		page.evaluate(() => {
			const win = window as unknown as { __t0: number | null; __t1: number | null };
			return win.__t0 === null || win.__t1 === null ? null : win.__t1 - win.__t0;
		});
}

// **The margin is on one side only, and that is why the floor is 780 rather than 750.** A timer
// never fires early, so 800 measures at 800 or more and the floor is free of it; 700 measures at
// 700 *plus whatever the machine adds*, and a floor of 750 would pass the primitive's own
// default on any run that spent 50ms getting there. 780 keeps the guarantee and leaves the
// overhead 80ms to eat. The ceiling is not the claim at all — it says only that the popup opened
// because of this input rather than because of something a second later.
//
// The two tests below are not interchangeable: only the hover one can see the provider's
// `delayDuration`. The Tab one reads `SHOW_DELAY` through `onFocus`'s own `setTimeout`, so it
// stays green against a component that never set the provider at all.
const FLOOR = 780;
const CEILING = 3000;

test('a tooltip reached by Tab waits the show delay instead of opening on the focus', async ({
	page
}) => {
	await page.goto(MODE_PAGE);
	const read = await armDelay(page, 'default-trigger', 'focus', 'Default offset');

	// A real press, not `focus()`. `:focus-visible` is what stands in for `FocusState::Keyboard`
	// here, and a press is how a user grants it; the scripted call grants it too, but only while
	// nothing has been clicked, which is a premise this test should not be resting on.
	await page.locator('#before').focus();
	await page.keyboard.press('Tab');

	await expect(page.locator('.popup:text-is("Default offset")')).toBeVisible();
	const delay = await read();
	expect(delay).toBeGreaterThan(FLOOR);
	expect(delay).toBeLessThan(CEILING);
});

test('and a hover waits that same delay, not the primitive default it used to', async ({
	page
}) => {
	await page.goto(MODE_PAGE);
	const read = await armDelay(page, 'default-trigger', 'pointerenter', 'Default offset');

	await page.locator('#default-trigger').hover();

	await expect(page.locator('.popup:text-is("Default offset")')).toBeVisible();
	const delay = await read();
	expect(delay).toBeGreaterThan(FLOOR);
	expect(delay).toBeLessThan(CEILING);
});

test('a focus that leaves before the delay elapses opens nothing', async ({ page }) => {
	await page.goto(MODE_PAGE);

	await page.locator('#default-trigger').focus();
	await page.waitForTimeout(200);
	await page.locator('#before').focus();

	// Past the whole delay from the first focus, so a timer nothing cancelled has fired by now.
	await page.waitForTimeout(1200);
	await expect(page.locator('.popup:text-is("Default offset")')).toHaveCount(0);
});

// `FocusState::Keyboard`, in the only form the web offers. Upstream's focus handler opens for a
// keyboard focus or a UIA-driven programmatic one and declines everything else
// (`ToolTipService_Partial.cpp:1706-1714`). Replacing the primitive's `onfocus` dropped its
// `#isPointerDown` guard with it, and `:focus-visible` is what took over — so the press has to
// be pressed, not reasoned about.
test('a focus that follows a mouse press opens nothing either', async ({ page }) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#default-trigger');
	const box = (await trigger.boundingBox())!;

	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	// Off the trigger afterwards, or the hover path opens one on its own and this would be
	// measuring that. The leave stops the primitive's pending open.
	await page.mouse.move(box.x + box.width + 300, box.y + 300);
	// Asserted rather than assumed: with the focus gone there is nothing here to have declined,
	// and this test would pass against a component that never looked.
	await expect(trigger).toBeFocused();

	await page.waitForTimeout(1500);
	await expect(page.locator('.popup:text-is("Default offset")')).toHaveCount(0);
});

// The offsets. `DEFAULT_KEYBOARD_OFFSET` is 12 and `DEFAULT_MOUSE_OFFSET` is 20
// (`ToolTip_Partial.h:10-11`); upstream inflates the placement target by the number and docks
// the popup against the inflated rect (`ToolTip_Partial.cpp:1275`), so the gap it leaves is the
// number itself. Both directions are pressed, because a component that answered 12 everywhere
// would pass a test that only looked at the keyboard.
test('a tooltip opened by the keyboard stands 12 clear of its trigger', async ({ page }) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#default-trigger');
	await trigger.focus();

	const popup = page.locator('.popup:text-is("Default offset")');
	await expect(popup).toBeVisible();
	const at = await placed(popup);
	const box = (await trigger.boundingBox())!;

	expect(Math.round(box.y - (at.y + at.height))).toBe(12);
});

test('and one opened by a pointer still stands 20 clear of the pointer', async ({ page }) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#default-trigger');
	const box = (await trigger.boundingBox())!;
	const at = { x: box.x + 40, y: box.y + box.height / 2 };

	await page.mouse.move(at.x, at.y);
	const popup = page.locator('.popup:text-is("Default offset")');
	await expect(popup).toBeVisible();
	const shown = await placed(popup);

	expect(Math.round(at.y - (shown.y + shown.height))).toBe(20);
});

// The third combination, and the one neither of the two above reaches: a named placement is
// anchored to the element in every mode, so a mouse open measures `DEFAULT_MOUSE_OFFSET`
// against the element rather than the 20 the pointer-anchored default measures against the
// pointer. The two numbers agree and their reasons do not — the component's own comment on the
// constants is about exactly this.
test('a named placement keeps 20 against the element a pointer opened it on', async ({ page }) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#named-trigger');
	await trigger.hover();

	const popup = page.locator('.popup:text-is("Named placement")');
	await expect(popup).toBeVisible();
	const at = await placed(popup);
	const box = (await trigger.boundingBox())!;

	expect(Math.round(box.y - (at.y + at.height))).toBe(20);
});

// `IsPropertyLocal` (`ToolTip_Partial.cpp:1220`): the mode decides the offset only where the
// consumer has not. Both modes, because "local wins" is a claim about each of them and a
// component that honoured the prop in one would pass a test that pressed the other.
test('an offset the consumer fixes survives a keyboard open', async ({ page }) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#explicit-trigger');
	await trigger.focus();

	const popup = page.locator('.popup:text-is("Explicit offset")');
	await expect(popup).toBeVisible();
	const at = await placed(popup);
	const box = (await trigger.boundingBox())!;

	expect(Math.round(box.y - (at.y + at.height))).toBe(4);
});

test('and survives a pointer open', async ({ page }) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#explicit-trigger');
	const box = (await trigger.boundingBox())!;
	const at = { x: box.x + 40, y: box.y + box.height / 2 };

	await page.mouse.move(at.x, at.y);
	const popup = page.locator('.popup:text-is("Explicit offset")');
	await expect(popup).toBeVisible();
	const shown = await placed(popup);

	expect(Math.round(at.y - (shown.y + shown.height))).toBe(4);
});

// `IsEnabled`. Replacing the primitive's `onfocus` dropped its `#isDisabled()` guard with it,
// and `Tooltip.Root` does not refuse an `open` set from outside — `disabled` reaches only the
// trigger's own handlers and the data attributes — so the component has to test it itself. A
// hover is declined by the primitive either way; the keyboard is the path that needed the line.
test('a disabled tooltip declines a keyboard focus as well as a hover', async ({ page }) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#disabled-trigger');
	await trigger.focus();
	await expect(trigger).toBeFocused();

	await page.waitForTimeout(1500);
	await expect(page.locator('.popup:text-is("Disabled tooltip")')).toHaveCount(0);

	await trigger.hover();
	await page.waitForTimeout(1500);
	await expect(page.locator('.popup:text-is("Disabled tooltip")')).toHaveCount(0);
});

// The two ways a pending keyboard open outlived what asked for it. Both were a review's, and
// both open a tooltip a keyboard focus asked for **in the mouse's mode** — `sideOffset` 20
// where the whole unit is about 12 — because the mode is cleared by the close and the timer
// was not. Upstream has neither: its focus handler does nothing at all when the tooltip is
// already up (`ToolTipService_Partial.cpp:1692-1700`), each enter restarts the one
// service-level timer rather than adding a second (`:657-662`), and a cancel stops it
// (`:720`).
//
// Each test waits out the whole delay past the close and asserts that nothing arrived. Without
// the fix the popup is back on screen by then.
test('a focus that lands on a tooltip already open schedules nothing behind it', async ({
	page
}) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#default-trigger');
	const popup = page.locator('.popup:text-is("Default offset")');
	const box = (await trigger.boundingBox())!;

	await trigger.hover();
	await expect(popup).toBeVisible();

	// A move does not take `:focus-visible` away — only a press does — so this focus is a
	// keyboard focus as far as the component can tell, which is what makes it the hard case.
	await trigger.focus();

	await page.mouse.move(box.x + box.width + 300, box.y + 300);
	await expect(popup).toHaveCount(0);

	await page.waitForTimeout(1200);
	await expect(popup).toHaveCount(0);
});

test('and a pointer entry replaces a keyboard open that had not fired yet', async ({ page }) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#default-trigger');
	const popup = page.locator('.popup:text-is("Default offset")');
	const box = (await trigger.boundingBox())!;

	await trigger.focus();
	// Straight onto it, well inside the delay the focus just armed.
	await trigger.hover();
	// And straight off again, which cancels the open the entry armed in its place.
	await page.mouse.move(box.x + box.width + 300, box.y + 300);

	// Past both delays. Two pending opens rather than one and the focus's own fires here.
	await page.waitForTimeout(1500);
	await expect(popup).toHaveCount(0);
});

// A press cancels the open it interrupts, and a press does not move focus off the trigger it
// lands on — so `onBlur` never runs and nothing else was left to cancel it. bits-ui cancels its
// own pending open here (`tooltip.svelte.js:461-479`) and upstream cancels through
// `CancelAutomaticToolTip` (`ToolTipService_Partial.cpp:703-726`); between them this component
// had a timer neither reached, and a tooltip pressed away at t=150 came back at t=800.
test('a press inside the delay cancels the open the focus scheduled', async ({ page }) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#default-trigger');
	const box = (await trigger.boundingBox())!;

	// **The pointer arrives first and the focus second**, which is the whole of the case. An
	// entry cancels a pending keyboard open, so a press reached by moving onto the trigger after
	// the focus is cancelled by the move and says nothing about the press. Here the entry
	// happens before there is anything to cancel.
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await trigger.focus();
	await page.waitForTimeout(150);

	await page.mouse.down();
	await page.mouse.up();
	// Off the trigger, or the hover path opens one of its own and this measures that instead.
	await page.mouse.move(box.x + box.width + 300, box.y + 300);

	await page.waitForTimeout(1500);
	await expect(page.locator('.popup:text-is("Default offset")')).toHaveCount(0);
});

// `IsEnabled` is a prop and the delay is 800ms long, so the two overlap. Testing it only where
// the timer is armed leaves the whole of that window untested, and the disabled row above cannot
// reach it because its `disabled` never changes.
test('a tooltip disabled inside the delay does not open when the delay elapses', async ({
	page
}) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#latent-trigger');
	await trigger.focus();
	await page.waitForTimeout(150);

	// Dispatched rather than clicked: a real click would move focus off the trigger and cancel
	// the open through the blur, which is a different claim and one the test above already makes.
	await page.locator('#make-latent-disabled').dispatchEvent('click');
	await expect(trigger).toBeFocused();

	await page.waitForTimeout(1500);
	await expect(page.locator('.popup:text-is("Latent tooltip")')).toHaveCount(0);
});

// The one input where `:focus-visible` and upstream's rule part company, and the reason the
// `pointerDown` latch exists rather than being argued away. Chromium grants `:focus-visible` to
// a text input or a `contenteditable` **however it was focused**, so a pressed text-entry
// trigger matches the pseudo-class while upstream calls that focus `FocusState::Pointer` and
// opens nothing (`ToolTipService_Partial.cpp:1706-1707`). Both directions are pressed, because
// a latch that never cleared would pass the first half and fail nobody.
test('a pressed text-entry trigger opens nothing, and the same trigger reached by Tab does', async ({
	page
}) => {
	await page.goto(MODE_PAGE);
	const trigger = page.locator('#text-trigger');
	const popup = page.locator('.popup:text-is("Text tooltip")');
	// Sixth of six rows on a page with room above each of them for a top-placed popup: this one
	// starts below the fold, and `page.mouse` clicks the viewport rather than the document.
	await trigger.scrollIntoViewIfNeeded();
	const box = (await trigger.boundingBox())!;

	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	await expect(trigger).toBeFocused();
	// Off the trigger, or the hover path opens one and this measures that instead.
	await page.mouse.move(box.x + box.width + 300, box.y + 300);
	await page.waitForTimeout(1500);
	await expect(popup).toHaveCount(0);

	// And the latch let go: the same element, reached by a press of the key rather than of the
	// pointer, opens one.
	await page.locator('#before').focus();
	await page.keyboard.press('Tab');
	await expect(trigger).not.toBeFocused();
	await trigger.focus();
	await expect(popup).toBeVisible();
});
