import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';

// The defect this covers: the toggle used to be rendered inside the pane, so a minimal pane
// that is closed had no way to be opened from the control. NavigationView.xaml:180 anchors
// PaneToggleButtonGrid to RootGrid, where nothing about the pane's visibility reaches it.
const minimal = '.root[data-pane-display-mode="leftMinimal"]';

// `getAnimations()` is typed as returning the base `Animation`, and only the `CSSTransition`
// subtype names the property it animates — which is the whole of what these tests read.
type CSSTransitionLike = Animation & { transitionProperty: string };

test('a closed minimal pane can be opened from the control itself', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const root = page.locator(minimal).first();
	await expect(root).toHaveAttribute('data-pane-open', 'false');
	// Hidden rather than absent: the pane is a template part with a `Visibility`, kept in the
	// document so the open and close transitions have something to run on.
	await expect(root.locator('.pane')).toBeHidden();

	const toggle = root.locator('.pane-toggle');
	await expect(toggle).toBeVisible();
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');

	await toggle.click();

	await expect(root).toHaveAttribute('data-pane-open', 'true');
	await expect(root).toHaveAttribute('data-overlay', 'true');
	await expect(root.locator('.pane')).toBeVisible();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');

	// And back, rather than being stuck the other way. `toBeHidden` waits, which is what the
	// close transition needs: `visibility` flips at the end of its 120ms, not at the start.
	await toggle.click();
	await expect(root).toHaveAttribute('data-pane-open', 'false');
	await expect(root.locator('.pane')).toBeHidden();
});

// The harness's second minimal frame is opened from the page after mount, because the control
// closes its own pane on entering minimal and that is the state the first frame photographs.
// This is what holds the ordering that rests on: a child's `onMount` runs before its parent's,
// so the page's write lands after the control's. If that ever reverses, the frame renders a
// closed pane, the visual baseline it exists for photographs nothing, and only the reference
// lane would notice — and that lane is skipped on every browser but the guest's.
test('the harness opens its second minimal pane, and it stays open', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const root = page.locator(minimal).nth(1);
	await expect(root).toHaveAttribute('data-pane-open', 'true');
	await expect(root).toHaveAttribute('data-overlay', 'true');
	await expect(root.locator('.pane')).toBeVisible();
});

/**
 * Click a point inside a control's content area, the way a finger does.
 *
 * `locator.click()` is the wrong instrument for exactly this test. Playwright checks that the
 * element it was given is the one that receives a pointer event at that point, and when the
 * dismiss layer is doing its job it is not — so the call waits for an actionability that will
 * never arrive and the test hangs rather than failing. That is worth writing down, because the
 * hang is the first evidence the layer works: it intercepts the pointer. `page.mouse` makes no
 * such check, which is what a real click is.
 */
async function clickContent(page: Page, root: Locator) {
	// `page.mouse` takes viewport coordinates and does none of the work `locator.click()` does
	// first, scrolling included. This harness is about 4,700px tall inside a window that is
	// `100vh` and clips (D16), so a frame below the fold has a box the mouse cannot reach — and
	// a click at coordinates nothing occupies is silent, not an error.
	await root.scrollIntoViewIfNeeded();
	const box = await root.locator('.content-grid').boundingBox();
	if (!box) throw new Error('the content grid has no box to click in');
	await page.mouse.click(box.x + box.width - 40, box.y + 40);
}

// `LightDismissLayer` (SplitView_themeresources.xaml:723) is transparent, so no capture can ask
// whether it is there; only driving it can. The second minimal frame renders an open overlaying
// pane at rest, so this is one click and not a toggle followed by one.
test('a click outside an overlaying pane closes it', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const root = page.locator(minimal).nth(1);
	await expect(root).toHaveAttribute('data-overlay', 'true');

	// Far from the pane and far from the toggle button: both sit above the layer and close the
	// pane through their own handlers, so hitting either would pass with no layer at all.
	await clickContent(page, root);

	await expect(root).toHaveAttribute('data-pane-open', 'false');
	await expect(root.locator('.pane')).toBeHidden();
});

// The expanded pane is not light-dismissible — `NavigationView::IsLightDismissible`
// (NavigationView.cpp:1842) is false while the SplitView is `Inline` — so the same click on the
// first frame, whose pane sits beside the content, must leave it open. Without this the layer
// could be rendered unconditionally and the test above would not notice.
test('a click on the content leaves a pane that is not overlaying alone', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const root = page.locator('.root[data-pane-display-mode="auto"]').first();
	await expect(root).toHaveAttribute('data-overlay', 'false');

	await clickContent(page, root);

	await expect(root).toHaveAttribute('data-pane-open', 'true');
});

// `OpenCompactOverlayLeft` (SplitView_themeresources.xaml:635) keeps `ColumnDefinition1` at
// `CompactPaneGridLength` and moves `ContentRoot` into the second column, so a rail that opens
// over the content leaves the content exactly where it was. No capture can ask this: both
// arrangements are a pane over content, and the difference is where the content's box starts.
test('opening a compact rail does not move or resize the content', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const root = page.locator('.root[data-pane-display-mode="leftCompact"]').first();
	const content = root.locator('.content-grid');
	await expect(root).toHaveAttribute('data-pane-open', 'false');

	const before = await content.boundingBox();
	if (!before) throw new Error('the content grid has no box before the pane opens');

	await root.locator('.pane-toggle').click();
	await expect(root).toHaveAttribute('data-overlay', 'true');

	const after = await content.boundingBox();
	if (!after) throw new Error('the content grid has no box after the pane opens');

	// Width and left edge both, because reserving nothing moves one and widens the other.
	expect(after.width).toBe(before.width);
	expect(after.x).toBe(before.x);
});

// The durations, read off the states rather than timed. A transition that is declared and never
// reached is the failure this guards: the selectors carry the whole mapping from a display mode
// to a duration, and a wrong one is invisible in every other test here, which only ever waits
// for the end state.
test('each shape carries the duration its transition is given', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	// The computed value is one duration per transitioned property, and a rule that sets them
	// all at once collapses to a single entry — so compare the distinct values, not the string.
	const duration = async (root: Locator) => {
		const declared = await root
			.locator('.pane')
			.evaluate((el) => getComputedStyle(el).transitionDuration);
		return [...new Set(declared.split(',').map((d) => d.trim()))];
	};

	// Minimal, closed: the overlay close pair, 0:0:0.12 (SplitView_themeresources.xaml:177).
	const minimalRoot = page.locator(minimal).first();
	await expect(minimalRoot).toHaveAttribute('data-pane-open', 'false');
	expect(await duration(minimalRoot)).toEqual(['0.12s']);

	// Minimal, open: the overlay open pair, 0:0:0.35 (`:55`).
	await minimalRoot.locator('.pane-toggle').click();
	await expect(minimalRoot).toHaveAttribute('data-pane-open', 'true');
	expect(await duration(minimalRoot)).toEqual(['0.35s']);

	// Expanded is inline and always open, so it can only reach the open resource, 200ms
	// (`SplitViewPaneAnimationOpenDuration`).
	const expandedRoot = page.locator('.root[data-pane-display-mode="auto"]').first();
	await expect(expandedRoot).toHaveAttribute('data-display-mode', 'expanded');
	expect(await duration(expandedRoot)).toEqual(['0.2s']);
});

// And that one actually runs. `getAnimations()` reports a `CSSTransition` only while it is in
// flight, so this is the difference between a rule that is declared and a rule that fires — the
// distinction no other test in this file can make, because each of them waits for the end state
// and the end state is the same either way.
test('opening an overlaying pane starts a transition', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const root = page.locator(minimal).first();
	await root.locator('.pane-toggle').click();

	// Read inside the 350ms the open transition lasts. A round trip is single-digit ms.
	const running = await root.locator('.pane').evaluate((el) =>
		el.getAnimations().map((animation) => ({
			property: (animation as CSSTransitionLike).transitionProperty,
			duration: animation.effect?.getTiming().duration
		}))
	);

	// All three, and the exact duration. The strictness is the assertion: a transition that is
	// reversing one already in flight is given a *shortened* duration in proportion to the
	// progress made, so anything under 350 here means something was running that should not have
	// been — which is how the settling defect above was found, as a reading of 347.06.
	expect(running.map((a) => a.property).sort()).toEqual(['clip-path', 'translate', 'visibility']);
	expect(new Set(running.map((a) => a.duration))).toEqual(new Set([350]));
});

// The guard that keeps the control's own settling from animating. It earns a test because a
// green suite cannot tell a suppressed transition from one that never had a reason to run: every
// other test here acts first and reads after, and by then the page has settled either way.
// Measured against a component without the guard: three of this harness's panes animate on load,
// the rail's clip over 120ms and two overlay panes over 120 and 350.
test('nothing animates while the control is still settling', async ({ page }) => {
	await page.goto('/dev/navigation-view');

	const running = await page.evaluate(() =>
		[...document.querySelectorAll('.pane')].flatMap((el) =>
			el
				.getAnimations()
				.map(
					(a) => `${(a as CSSTransitionLike).transitionProperty}:${a.effect?.getTiming().duration}`
				)
		)
	);

	expect(running).toEqual([]);
});

test('the top display mode has no pane toggle', async ({ page }) => {
	await page.goto('/dev/navigation-view');
	const top = page.locator('.root[data-pane-display-mode="top"]').first();
	await expect(top.locator('.pane-toggle')).toHaveCount(0);
});
