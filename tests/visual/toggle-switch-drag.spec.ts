import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

/**
 * Dragging a `ToggleSwitch` — `SwitchThumb`, a `Thumb` over the switch, the gap and the content
 * (`ToggleSwitch_themeresources.xaml:524-530`), and `ToggleSwitch::MoveCompleted`
 * (`ToggleSwitch_Partial.cpp:592`), which toggles a dragged knob that ended past half its range.
 *
 * Pressed on the reference on 2026-10-01, on the Gallery's two switches: from off, 6px and
 * released stayed off and 14px turned it on; from on, 14px back turned it off; a drag that began
 * on the word "Off" moved the knob too; and through each drag the switch kept the look it started
 * with. A press that moved 1, 2 or 3px in either axis, or 3 in both, was still a tap and turned
 * it on; 4px in either axis was not.
 */

const log = (page: Page) => page.locator('#log');
// The component's own state, which its root carries. A tap leaves the `<input>`'s `checked`
// property behind it — the click's canceled activation restores the property after the
// component has written it — and that is a defect of its own, older than the drag.
const root = (page: Page, id: string) => page.locator(`#${id}`);

async function knobX(page: Page, id: string) {
	return page
		.locator(`#${id} .knob`)
		.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41);
}

/**
 * Press at the knob's centre, or at `from` if given, and move by `steps`, one move each: a number
 * is a horizontal step, a pair is `[x, y]`.
 */
async function press(
	page: Page,
	id: string,
	steps: (number | [number, number])[],
	from?: { x: number; y: number }
) {
	const box = (await page.locator(`#${id} .knob`).boundingBox())!;
	const start = from ?? { x: box.x + box.width / 2, y: box.y + box.height / 2 };
	await page.mouse.move(start.x, start.y);
	await page.mouse.down();
	let { x, y } = start;
	for (const step of steps) {
		const [dx, dy] = typeof step === 'number' ? [step, 0] : step;
		x += dx;
		y += dy;
		await page.mouse.move(x, y);
	}
	return { x, y };
}

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/toggle-switch-drag');
});

test('the knob follows the pointer, clamped to its track, with no easing', async ({ page }) => {
	await press(page, 'starts-off', [2, 2, 2]);
	await expect(page.locator('#starts-off')).toHaveAttribute('data-dragging', 'true');
	expect(await knobX(page, 'starts-off')).toBe(6);
	await page.mouse.move(10_000, 0);
	expect(await knobX(page, 'starts-off')).toBe(20);
	await page.mouse.move(-10_000, 0);
	expect(await knobX(page, 'starts-off')).toBe(0);
	// Mid-drag the switch keeps the look it started with: it is not on until it is released.
	await expect(root(page, 'starts-off')).not.toHaveAttribute('data-checked');
	await page.mouse.up();
});

test('released short of half, the switch stays where it was', async ({ page }) => {
	await press(page, 'starts-off', [2, 2, 2]);
	await page.mouse.up();
	await expect(root(page, 'starts-off')).not.toHaveAttribute('data-checked');
	await expect(page.locator('#starts-off')).not.toHaveAttribute('data-dragging');
	// The click the release goes on to fire is not a tap: it toggled nothing.
	await expect(log(page)).toHaveText('');
});

test('released past half, it toggles once, either way', async ({ page }) => {
	await press(page, 'starts-off', [4, 4, 4, 2]);
	await page.mouse.up();
	await expect(root(page, 'starts-off')).toHaveAttribute('data-checked', 'true');
	await press(page, 'starts-on', [-4, -4, -4, -2]);
	await page.mouse.up();
	await expect(root(page, 'starts-on')).not.toHaveAttribute('data-checked');
	await expect(log(page)).toHaveText('off:true on:false');
});

test('a drag can begin on the content, which the thumb covers', async ({ page }) => {
	const content = (await page.locator('#starts-off .content').boundingBox())!;
	await press(page, 'starts-off', [4, 4, 4, 4], {
		x: content.x + 4,
		y: content.y + content.height / 2
	});
	await page.mouse.up();
	await expect(root(page, 'starts-off')).toHaveAttribute('data-checked', 'true');
	await expect(log(page)).toHaveText('off:true');
});

test('released outside the switch it still decides, and the next click is a tap', async ({
	page
}) => {
	const end = await press(page, 'starts-off', [4, 4, 4, 2]);
	await page.mouse.move(end.x, end.y + 200);
	await page.mouse.up();
	await expect(root(page, 'starts-off')).toHaveAttribute('data-checked', 'true');
	await page.locator('#starts-off .track').click();
	await expect(root(page, 'starts-off')).not.toHaveAttribute('data-checked');
	await expect(log(page)).toHaveText('off:true off:false');
});

test('a press that never moves is a tap', async ({ page }) => {
	await press(page, 'starts-off', []);
	await page.mouse.up();
	await expect(root(page, 'starts-off')).toHaveAttribute('data-checked', 'true');
	await expect(log(page)).toHaveText('off:true');
});

test('a press that moves less than the tap tolerance is still a tap', async ({ page }) => {
	await press(page, 'starts-off', [1, 1, 1]);
	await page.mouse.up();
	await expect(root(page, 'starts-off')).toHaveAttribute('data-checked', 'true');
	await press(page, 'starts-on', [-3]);
	await page.mouse.up();
	await expect(root(page, 'starts-on')).not.toHaveAttribute('data-checked');
	await expect(log(page)).toHaveText('off:true on:false');
});

test('a press that moves the tolerance in either axis is not a tap', async ({ page }) => {
	await press(page, 'starts-off', [4]);
	await page.mouse.up();
	await press(page, 'starts-off', [[0, 4]]);
	await page.mouse.up();
	await expect(root(page, 'starts-off')).not.toHaveAttribute('data-checked');
	await expect(log(page)).toHaveText('');
	// And 3 in both axes is still inside it.
	await press(page, 'starts-off', [[3, 3]]);
	await page.mouse.up();
	await expect(log(page)).toHaveText('off:true');
});

test.describe('by touch', () => {
	test.use({ hasTouch: true });

	test("a drag past the browser's tap slop fires no click, and leaves the keyboard alone", async ({
		page,
		context
	}) => {
		const cdp = await context.newCDPSession(page);
		const box = (await page.locator('#starts-off .knob').boundingBox())!;
		const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
		const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', at: number) =>
			cdp.send('Input.dispatchTouchEvent', {
				type,
				touchPoints: type === 'touchEnd' ? [] : [{ x: at, y }]
			});
		await page.evaluate(() =>
			document.addEventListener('click', () => {
				(window as unknown as { clicks: number }).clicks =
					((window as unknown as { clicks?: number }).clicks ?? 0) + 1;
			})
		);
		await touch('touchStart', x);
		for (let moved = 3; moved <= 30; moved += 3) await touch('touchMove', x + moved);
		await touch('touchEnd', x + 30);
		await expect(log(page)).toHaveText('off:true');
		// A tap's click follows the touch's end by a gesture the browser recognises afterwards, so
		// give it two frames to arrive before saying none did.
		await page.evaluate(
			() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
		);
		expect(await page.evaluate(() => (window as unknown as { clicks?: number }).clicks)).toBe(
			undefined
		);
		await expect(page.locator('#starts-off input')).toBeFocused();
		await page.keyboard.press('Space');
		await expect(log(page)).toHaveText('off:true off:false');
	});

	test('the next press after a drag that fired no click is a tap', async ({ page, context }) => {
		const cdp = await context.newCDPSession(page);
		const box = (await page.locator('#starts-off .knob').boundingBox())!;
		const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
		const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', at: number) =>
			cdp.send('Input.dispatchTouchEvent', {
				type,
				touchPoints: type === 'touchEnd' ? [] : [{ x: at, y }]
			});
		await touch('touchStart', x);
		for (let moved = 3; moved <= 30; moved += 3) await touch('touchMove', x + moved);
		await touch('touchEnd', x + 30);
		await expect(log(page)).toHaveText('off:true');
		// The drag left its suppression armed, with no click to spend it on; the press drops it.
		await page.locator('#starts-off .track').click();
		await expect(log(page)).toHaveText('off:true off:false');
	});
});

test('a lost capture completes the drag, as a release would', async ({ page }) => {
	await page.evaluate(() =>
		document.addEventListener('pointerdown', (event) => {
			(window as unknown as { pointer: number }).pointer = event.pointerId;
		})
	);
	await press(page, 'starts-off', [4, 4, 4, 2]);
	await page.locator('#starts-off .body').evaluate((label) => {
		label.releasePointerCapture((window as unknown as { pointer: number }).pointer);
	});
	await expect(root(page, 'starts-off')).not.toHaveAttribute('data-dragging');
	await expect(root(page, 'starts-off')).toHaveAttribute('data-checked', 'true');
	await page.mouse.up();
	await expect(log(page)).toHaveText('off:true');
});

test('a second pointer neither moves nor ends the drag', async ({ page }) => {
	await press(page, 'starts-off', [2, 2, 2]);
	await page.locator('#starts-off .body').evaluate((label) => {
		const at = label.getBoundingClientRect();
		for (const type of ['pointermove', 'pointerup'])
			label.dispatchEvent(
				new PointerEvent(type, {
					bubbles: true,
					pointerId: 99,
					isPrimary: false,
					clientX: at.right + 100,
					clientY: at.top
				})
			);
	});
	expect(await knobX(page, 'starts-off')).toBe(6);
	await expect(root(page, 'starts-off')).toHaveAttribute('data-dragging', 'true');
	await page.mouse.up();
});
