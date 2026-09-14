import type { Page } from '@playwright/test';
import { expect, hydrated, test } from './fixtures';

// What `RefreshContainer` accepts as a pull is invisible to a screenshot: the container draws
// nothing at rest whether it accepts one or not, which is how it shipped both taking a gesture the
// original does not take and taking one from outside the region it belongs to.
//
// Touch is dispatched over CDP rather than through `test.use({ hasTouch: true })`, because with
// `WINUI_CDP_ENDPOINT` set the browser arrives over `connectOverCDP`, which hands back its own
// existing context and takes no context options. Nothing else is needed: measured, a bare
// `Input.dispatchTouchEvent` already delivers pointers whose `pointerType` is `touch`, and the
// emulation overrides that would otherwise set it are browser-wide state on a browser this suite
// shares with ninety-two snapshot specs.

/** How far each drag travels, against a visualizer whose length is 100. */
const PULL = 96;

async function dragWithTouch(page: Page, x: number, y: number, dy: number) {
	const cdp = await page.context().newCDPSession(page);
	const send = (type: 'touchStart' | 'touchEnd' | 'touchMove' | 'touchCancel', at: number) =>
		cdp.send('Input.dispatchTouchEvent', {
			type,
			touchPoints: type === 'touchEnd' ? [] : [{ x, y: at, id: 1 }]
		});
	await send('touchStart', y);
	for (let d = 8; d <= dy; d += 8) {
		await send('touchMove', y + d);
		await page.waitForTimeout(16);
	}
	return async () => {
		await send('touchEnd', y + dy);
		await cdp.detach();
	};
}

/** How far the container has moved its content down, which is how far the pull has revealed. */
function revealOf(page: Page) {
	return page.evaluate(() => {
		const content = document.querySelector('.container > div');
		return new DOMMatrix(getComputedStyle(content!).transform).m42;
	});
}

test('a touch pull at the start of the region reveals the visualizer', async ({ page }) => {
	await page.goto('/dev/pull-to-refresh');
	await hydrated(page);
	const at = await page.evaluate(() => {
		const list = document.querySelector('.container ul')!;
		list.scrollIntoView({ block: 'center' });
		const r = list.getBoundingClientRect();
		return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + 12) };
	});
	const release = await dragWithTouch(page, at.x, at.y, PULL);
	// The browser cancels the pointer stream three moves in unless the container takes the touch
	// away from it, so a partial reveal here is that cancellation and not a pull.
	expect(await revealOf(page)).toBe(PULL);
	await release();
});

test('a mouse drag at the same place reveals nothing', async ({ page }) => {
	await page.goto('/dev/pull-to-refresh');
	await hydrated(page);
	const at = await page.evaluate(() => {
		const list = document.querySelector('.container ul')!;
		list.scrollIntoView({ block: 'center' });
		const r = list.getBoundingClientRect();
		return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + 12) };
	});
	await page.mouse.move(at.x, at.y);
	await page.mouse.down();
	for (let d = 8; d <= PULL; d += 8) {
		await page.mouse.move(at.x, at.y + d);
		await page.waitForTimeout(16);
	}
	expect(await revealOf(page)).toBe(0);
	await page.mouse.up();
});

test('dragging the list scrollbar scrolls it and pulls nothing', async ({ page }) => {
	// The Gallery's own page, because the dev harness scrolls a bare `ul` with the browser's
	// scrollbar and the defect this covers is about *this library's* — an overlay bar that is the
	// scrolled region's sibling, so a press on it is outside the region.
	await page.goto('/collections/pulltorefresh');
	await hydrated(page);
	await page.waitForSelector(
		'.container [data-scroll-bar][data-orientation="vertical"] [class*="thumb"]'
	);
	const at = await page.evaluate(() => {
		const root = document.querySelector('.container')!;
		const thumb = root.querySelector(
			'[data-scroll-bar][data-orientation="vertical"] [class*="thumb"]'
		)!;
		const r = thumb.getBoundingClientRect();
		return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
	});
	await page.mouse.move(at.x, at.y);
	await page.waitForTimeout(600);
	await page.mouse.down();
	for (let d = 8; d <= 64; d += 8) {
		await page.mouse.move(at.x, at.y + d);
		await page.waitForTimeout(20);
	}
	const after = await page.evaluate(() => ({
		reveal: new DOMMatrix(getComputedStyle(document.querySelector('.container > div')!).transform)
			.m42,
		scrollTop: document.querySelector('.container .viewport')!.scrollTop
	}));
	await page.mouse.up();
	// Measured before the fix: a scrollTop of 20 and a reveal of 64, both from the one drag.
	expect(after.scrollTop).toBeGreaterThan(0);
	expect(after.reveal).toBe(0);
});
