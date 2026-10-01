import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

/**
 * The selected tab is brought into view — `BringSelectedTabIntoView` (`TabView.cpp:748`), on a
 * tab becoming selected (`TabViewItem.cpp:151-154`) and on the items changing size
 * (`TabView.cpp:736-746`), with the target 2 wider than the tab (`TabViewItem.cpp:627-629`).
 *
 * And the focused one, pressed on the reference on 2026-10-01: with twelve tabs in the Gallery's
 * first sample, Right from the first tab walked focus onto tabs past the strip's edge, and the
 * strip scrolled each one fully into view while the selection stayed on the first.
 */

const strip = (page: Page) => page.locator('#strip .viewport');

/** The selected tab's edges against the strip's, once the strip has stopped moving. */
async function selectedInView(page: Page) {
	return strip(page).evaluate((viewport) => {
		const view = viewport.getBoundingClientRect();
		const tab = viewport.querySelector('[role=tab][aria-selected=true]')!.getBoundingClientRect();
		return { left: tab.left - view.left, right: view.right - tab.right };
	});
}

const scrollLeft = (page: Page) => strip(page).evaluate((viewport) => viewport.scrollLeft);

/** The strip's offset over a few frames, so a scroll that starts late is still seen. */
const scrollLeftOverFrames = (page: Page) =>
	strip(page).evaluate(
		(viewport) =>
			new Promise<number[]>((resolve) => {
				const seen: number[] = [];
				const sample = () => {
					seen.push(viewport.scrollLeft);
					if (seen.length < 10) requestAnimationFrame(sample);
					else resolve(seen);
				};
				requestAnimationFrame(sample);
			})
	);

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/tab-view-scroll');
});

test('selecting a tab past the edge scrolls it in, with 2 to spare, and back again', async ({
	page
}) => {
	await expect.poll(() => scrollLeft(page)).toBe(0);

	await page.locator('#select-last').click();
	// The last tab's right edge 2 inside the strip's, the least scroll that shows the target.
	await expect.poll(async () => (await selectedInView(page)).right).toBeCloseTo(2, 0);
	expect(await scrollLeft(page)).toBeGreaterThan(0);

	await page.locator('#select-first').click();
	await expect.poll(async () => (await selectedInView(page)).left).toBeCloseTo(0, 0);
});

// What upstream watches is the items presenter, inside the ScrollViewer: twelve tabs at their
// minimum width overflow 520 and 480 alike, so narrowing the strip does not resize the presenter,
// and nothing brings the selection back.
test('narrowing a strip whose tabs are at their minimum leaves the scroll alone', async ({
	page
}) => {
	await page.locator('#select-last').click();
	await expect.poll(async () => (await selectedInView(page)).right).toBeCloseTo(2, 0);
	await strip(page).evaluate((viewport) => viewport.scrollTo({ left: 0 }));
	await expect.poll(() => scrollLeft(page)).toBe(0);
	const content = () => strip(page).evaluate((viewport) => viewport.scrollWidth);
	const before = await content();

	await page.locator('#strip').evaluate((frame) => (frame.style.width = '480px'));
	expect(await content()).toBe(before);
	expect(await scrollLeftOverFrames(page)).toEqual(Array(10).fill(0));
});

test('adding a tab, which does not select it, brings the selected tab back', async ({ page }) => {
	await page.locator('#select-last').click();
	await expect.poll(async () => (await selectedInView(page)).right).toBeCloseTo(2, 0);
	await strip(page).evaluate((viewport) => viewport.scrollTo({ left: 0 }));
	await expect.poll(() => scrollLeft(page)).toBe(0);

	await page.locator('#strip').getByRole('button', { name: 'Add New Tab' }).click();
	await expect(page.locator('#strip [role=tab]')).toHaveCount(13);
	await expect(page.locator('#strip [role=tab]').nth(11)).toHaveAttribute('aria-selected', 'true');
	await expect.poll(async () => (await selectedInView(page)).right).toBeCloseTo(2, 0);
});

// `m_updateTabWidthOnPointerLeave` (`TabView.cpp:782`): a removal holds the strip still until the
// pointer leaves it (`:620-631`).
test('after a tab is closed, the strip holds still until the pointer leaves it', async ({
	page
}) => {
	await page.locator('#select-last').click();
	await expect.poll(async () => (await selectedInView(page)).right).toBeCloseTo(2, 0);
	await strip(page).evaluate((viewport) => viewport.scrollTo({ left: 0 }));
	await expect.poll(() => scrollLeft(page)).toBe(0);

	// Close the first tab with the pointer: the list shrinks, and nothing scrolls.
	await page.locator('#strip [role=tab]').first().hover();
	await page.locator('#strip [role=tab]').first().getByRole('button', { name: 'Close' }).click();
	await expect(page.locator('#strip [role=tab]')).toHaveCount(11);
	expect(await scrollLeftOverFrames(page)).toEqual(Array(10).fill(0));

	// Leaving re-runs upstream's `UpdateTabWidths`, which changes nothing the removal had not
	// already changed here, so leaving does not scroll either…
	await page.mouse.move(5, 5);
	expect(await scrollLeftOverFrames(page)).toEqual(Array(10).fill(0));
	// …but it ends the hold: the next change in the items' size brings the selection in.
	await page.locator('#strip').getByRole('button', { name: 'Add New Tab' }).click();
	await expect.poll(async () => (await selectedInView(page)).right).toBeCloseTo(2, 0);
});

test('arrowing to a tab past the edge scrolls it in, and the selection stays', async ({ page }) => {
	const tabs = page.locator('#strip [role=tab]');
	const gap = (n: number) =>
		tabs.nth(n).evaluate((tab) => {
			const view = tab.closest('.viewport')!.getBoundingClientRect();
			return Math.round(view.right - tab.getBoundingClientRect().right);
		});
	// The first tab the strip cuts off at its right edge, before any key: arrowed onto, it ends at
	// the edge, the least distance — the browser's own scroll would centre it or leave it.
	let cut = 0;
	while ((await gap(cut)) >= 0) cut++;
	await tabs.first().focus();
	for (let i = 0; i < 2 * cut; i++) await page.keyboard.press('ArrowRight');
	await expect(tabs.nth(cut)).toBeFocused();
	await expect.poll(() => gap(cut)).toBe(0);

	await tabs.first().focus();
	// Right walks tab, close button, next tab — eleven tabs on is the twelfth.
	for (let i = 0; i < 22; i++) await page.keyboard.press('ArrowRight');
	await expect(tabs.last()).toBeFocused();
	await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
	// The last tab reaches the strip's end.
	await expect
		.poll(() =>
			tabs.last().evaluate((tab) => {
				const view = tab.closest('.viewport')!.getBoundingClientRect();
				return Math.round(view.right - tab.getBoundingClientRect().right);
			})
		)
		.toBe(0);
});
