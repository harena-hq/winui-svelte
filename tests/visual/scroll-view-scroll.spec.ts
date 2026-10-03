/**
 * ScrollPresenter applies disabled offsets clamped without an animation event;
 * GetPositionAnimation inserts one requested end key frame and clamps the truncated Euclidean
 * distance times 5 ms to 50–1000 ms. RaiseScrollAnimationStarting permits mutation or replacement.
 * ResetAnticipatedView makes ScrollBy relative to the current position. A later request
 * interrupts a running animation, and so does a touch or pen press, which
 * ScrollPresenter::OnPointerPressed hands to the interaction tracker; a mouse press it ignores.
 * Stopping on a scroll the animation did not make is this library's stand-in for upstream's
 * keyboard and offset requests. Composition key frames replace equal progress keys, use
 * the current value when zero is absent, and use the ending key frame's easing per segment;
 * when a step jumps is this library's model, not a measurement.
 * The default easing was measured on the reference WinUI Gallery on 2026-10-03: the curve
 * (0.41, 0.52), (0.00, 0.94) fits two 5000 ms Default runs and Accordion's segments.
 * An added velocity is measured in pixels a second, constant at a decay of 0, and nothing
 * at 30 or less either way; a non-zero decay is this library's model.
 * Time is Playwright's clock, paused before the first request (see `freeze`).
 */
import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

declare global {
	interface Window {
		harness: {
			requestedAt: number;
			lastFrame: number;
			starting: Array<{
				duration: number;
				keyFrameCount: number;
				startPosition: { x: number; y: number };
				endPosition: { x: number; y: number };
				correlationId: number;
			}>;
			onStarting:
				| ((args: {
						animation: {
							duration: number;
							readonly keyFrameCount: number;
							insertKeyFrame(
								progress: number,
								value: { x: number; y: number },
								easing?:
									| { type: 'linear' }
									| {
											type: 'cubic-bezier';
											controlPoint1: { x: number; y: number };
											controlPoint2: { x: number; y: number };
									  }
									| { type: 'step'; stepCount: number }
							): void;
							valueAt(progress: number, start: { x: number; y: number }): { x: number; y: number };
						};
						readonly startPosition: { x: number; y: number };
						readonly endPosition: { x: number; y: number };
						readonly correlationId: number;
				  }) => void)
				| null;
			ScrollAnimation: new () => Parameters<
				NonNullable<Window['harness']['onStarting']>
			>[0]['animation'];
			scrollTo(
				x: number,
				y: number,
				options?: {
					animationMode?: 'enabled' | 'disabled' | 'auto';
					snapPointsMode?: 'default' | 'ignore';
				}
			): number;
			scrollBy(
				x: number,
				y: number,
				options?: {
					animationMode?: 'enabled' | 'disabled' | 'auto';
					snapPointsMode?: 'default' | 'ignore';
				}
			): number;
			addScrollVelocity(
				velocity: { x: number; y: number },
				decay?: { x: number; y: number } | null
			): number;
		};
	}
}

/** A cubic Bézier from (0, 0) to (1, 1), solved for x by bisection. */
function bezier(x1: number, y1: number, x2: number, y2: number, u: number) {
	const at = (a: number, b: number, s: number) =>
		3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
	if (u <= 0) return 0;
	if (u >= 1) return 1;
	let low = 0;
	let high = 1;
	for (let i = 0; i < 60; i++) {
		const middle = (low + high) / 2;
		if (at(x1, x2, middle) < u) low = middle;
		else high = middle;
	}
	return at(y1, y2, (low + high) / 2);
}
const measured = (u: number) => bezier(0.41, 0.52, 0, 0.94, u);

/**
 * Installs Playwright's clock and pauses it, so that only `runFor` advances an animation:
 * installed alone, the clock keeps running in real time. The instant is read from the page
 * rather than from this process, because the gate's browser runs on another host whose clock
 * this one does not share, and a pause has to land after the page's present.
 */
async function freeze(page: Page) {
	const now = await page.evaluate(() => Date.now());
	await page.clock.install({ time: now });
	await page.clock.pauseAt(now + 10_000);
}

async function sample(page: Page) {
	return page.evaluate(() => ({
		top: document.querySelector<HTMLElement>('#sv .viewport')!.scrollTop,
		elapsed: window.harness.lastFrame - window.harness.requestedAt
	}));
}

test.describe('a ScrollView scrolls on request', () => {
	test('the stock animation eases with the measured curve', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		expect(
			await page.evaluate(() => {
				const viewport = document.querySelector<HTMLElement>('#sv .viewport')!;
				return viewport.scrollHeight - viewport.clientHeight;
			})
		).toBe(1844);
		const id = await page.evaluate(() =>
			window.harness.scrollTo(0, 1000, { animationMode: 'enabled' })
		);
		expect(await page.evaluate(() => window.harness.starting)).toEqual([
			{
				duration: 1000,
				keyFrameCount: 1,
				startPosition: { x: 0, y: 0 },
				endPosition: { x: 0, y: 1000 },
				correlationId: id
			}
		]);
		for (const ms of [100, 150, 250]) {
			await page.clock.runFor(ms);
			const { top, elapsed } = await sample(page);
			expect(elapsed).toBeGreaterThan(0);
			expect(elapsed).toBeLessThan(1000);
			expect(Math.abs(top - 1000 * measured(elapsed / 1000))).toBeLessThanOrEqual(1);
		}
		await page.clock.runFor(520);
		expect((await sample(page)).top).toBe(1000);
		await expect(page.locator('#offset')).toHaveText('1000');
	});

	test('the duration is five milliseconds a pixel, from 50 to 1000', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		const records = await page.evaluate(() => {
			const options = { animationMode: 'enabled' } as const;
			window.harness.scrollTo(0, 5, options);
			window.harness.scrollTo(0, 100, options);
			window.harness.scrollTo(0, 100.9, options);
			window.harness.scrollTo(0, 300, options);
			window.harness.scrollTo(30, 40, options);
			return window.harness.starting;
		});
		expect(records.map((record) => record.duration)).toEqual([50, 500, 500, 1000, 250]);
		expect(records[4].endPosition).toEqual({ x: 30, y: 40 });
		expect(records.map((record) => record.correlationId)).toEqual(
			records.map((_, index) => records[0].correlationId + index)
		);
	});

	test('a handler can lengthen the stock animation', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => {
			window.harness.onStarting = (args) => {
				args.animation.duration = 3000;
			};
			window.harness.scrollTo(0, 1000, { animationMode: 'enabled' });
		});
		expect(await page.evaluate(() => window.harness.starting[0].duration)).toBe(1000);
		await page.clock.runFor(1500);
		const { top, elapsed } = await sample(page);
		expect(Math.abs(top - 1000 * measured(elapsed / 3000))).toBeLessThanOrEqual(1);
		expect(top).toBeLessThan(990);
		await page.clock.runFor(1600);
		expect((await sample(page)).top).toBe(1000);
	});

	test('a handler can replace the animation with its own key frames', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => {
			window.harness.onStarting = (args) => {
				const a = new window.harness.ScrollAnimation();
				a.duration = 1000;
				a.insertKeyFrame(0.5, { x: 0, y: 200 }, { type: 'linear' });
				a.insertKeyFrame(1, { x: 0, y: 400 }, { type: 'step', stepCount: 1 });
				args.animation = a;
			};
			window.harness.scrollTo(0, 1000, { animationMode: 'enabled' });
		});
		await page.clock.runFor(250);
		const { top, elapsed } = await sample(page);
		expect(Math.abs(top - 400 * (elapsed / 1000))).toBeLessThanOrEqual(1);
		await page.clock.runFor(500);
		expect((await sample(page)).top).toBe(200);
		await page.clock.runFor(300);
		expect((await sample(page)).top).toBe(400);
	});

	test('a ScrollAnimation evaluates its key frames', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		const values = await page.evaluate(() => {
			const a = new window.harness.ScrollAnimation();
			const zero = { x: 0, y: 0 };
			const empty = a.valueAt(0.5, { x: 3, y: 7 });
			a.insertKeyFrame(1, { x: 0, y: 100 });
			const defaults = [0.1, 0.25, 0.5, 0.75, 0.9].map((p) => a.valueAt(p, zero).y);
			const below = a.valueAt(-1, zero);
			const above = a.valueAt(2, zero);
			a.insertKeyFrame(1, { x: 0, y: 50 });
			const replacedCount = a.keyFrameCount;
			const replaced = a.valueAt(1, zero);
			a.insertKeyFrame(0, { x: 0, y: 20 });
			a.insertKeyFrame(1, { x: 0, y: 120 }, { type: 'linear' });
			const explicitStart = a.valueAt(0.5, zero).y;
			const b = new window.harness.ScrollAnimation();
			b.insertKeyFrame(0.5, { x: 0, y: 10 }, { type: 'linear' });
			const held = b.valueAt(0.75, zero).y;
			const c = new window.harness.ScrollAnimation();
			c.insertKeyFrame(
				1,
				{ x: 0, y: 100 },
				{
					type: 'cubic-bezier',
					controlPoint1: { x: 1, y: 0 },
					controlPoint2: { x: 1, y: 0 }
				}
			);
			const custom = c.valueAt(0.5, zero).y;
			c.insertKeyFrame(1, { x: 0, y: 100 }, { type: 'step', stepCount: 4 });
			const step = c.valueAt(0.3, zero).y;
			const stepEnd = c.valueAt(1, zero).y;
			let error = '';
			try {
				c.insertKeyFrame(1.5, zero);
			} catch (caught) {
				error = (caught as Error).name;
			}
			return {
				empty,
				defaults,
				below,
				above,
				replacedCount,
				replaced,
				explicitStart,
				held,
				custom,
				step,
				stepEnd,
				error
			};
		});
		expect(values.empty).toEqual({ x: 3, y: 7 });
		[0.1, 0.25, 0.5, 0.75, 0.9].forEach((p, index) => {
			expect(values.defaults[index]).toBeCloseTo(100 * measured(p), 6);
		});
		expect(values.below).toEqual({ x: 0, y: 0 });
		expect(values.above).toEqual({ x: 0, y: 100 });
		expect(values.replacedCount).toBe(1);
		expect(values.replaced).toEqual({ x: 0, y: 50 });
		expect(values.explicitStart).toBe(70);
		expect(values.held).toBe(10);
		expect(values.custom).toBeCloseTo(100 * bezier(1, 0, 1, 0, 0.5), 6);
		expect(values.step).toBe(25);
		expect(values.stepEnd).toBe(100);
		expect(values.error).toBe('RangeError');
	});

	test('a disabled request lands at once, clamped, and raises no event', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => window.harness.scrollTo(0, 99999, { animationMode: 'disabled' }));
		expect((await sample(page)).top).toBe(1844);
		await page.evaluate(() => window.harness.scrollBy(0, -100, { animationMode: 'disabled' }));
		expect((await sample(page)).top).toBe(1744);
		await page.evaluate(() => window.harness.scrollTo(0, -5, { animationMode: 'disabled' }));
		expect((await sample(page)).top).toBe(0);
		expect(await page.evaluate(() => window.harness.starting)).toEqual([]);
	});

	test('auto animates unless motion is reduced', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.evaluate(() => window.harness.scrollTo(0, 500));
		expect(await page.evaluate(() => window.harness.starting)).toHaveLength(1);
		expect((await sample(page)).top).toBe(0);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.evaluate(() => window.harness.scrollTo(0, 800));
		expect((await sample(page)).top).toBe(800);
		expect(await page.evaluate(() => window.harness.starting)).toHaveLength(1);
		await page.clock.runFor(1100);
		expect((await sample(page)).top).toBe(800);
	});

	test('a scrollBy during an animation starts from where the view is', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => window.harness.scrollTo(0, 1000, { animationMode: 'enabled' }));
		await page.clock.runFor(250);
		const { elapsed } = await sample(page);
		const expected = 1000 * measured(elapsed / 1000);
		await page.evaluate(() => window.harness.scrollBy(0, 100, { animationMode: 'enabled' }));
		const record = await page.evaluate(() => window.harness.starting[1]);
		expect(record.startPosition.y).toBeCloseTo(expected, 6);
		expect(record.endPosition.y).toBeCloseTo(expected + 100, 6);
		expect(record.duration).toBe(5 * Math.trunc(record.endPosition.y - record.startPosition.y));
		expect([495, 500]).toContain(record.duration);
		await page.clock.runFor(1100);
		expect(Math.abs((await sample(page)).top - (expected + 100))).toBeLessThanOrEqual(1);
	});

	test('a touch or pen press stops the animation, and a mouse press does not', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => window.harness.scrollTo(0, 1000, { animationMode: 'enabled' }));
		await page.clock.runFor(100);
		const box = (await page.locator('#sv .viewport').boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.up();
		await page.clock.runFor(1000);
		expect((await sample(page)).top).toBe(1000);

		await page.evaluate(() => window.harness.scrollTo(0, 0, { animationMode: 'enabled' }));
		await page.clock.runFor(100);
		const before = (await sample(page)).top;
		expect(before).toBeLessThan(1000);
		await page.evaluate(() =>
			document
				.querySelector('#sv .viewport')!
				.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }))
		);
		await page.clock.runFor(1000);
		expect((await sample(page)).top).toBe(before);

		await page.evaluate(() => window.harness.scrollTo(0, 1000, { animationMode: 'enabled' }));
		await page.clock.runFor(100);
		const penBefore = (await sample(page)).top;
		expect(penBefore).toBeGreaterThan(before);
		await page.evaluate(() =>
			document
				.querySelector('#sv .viewport')!
				.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'pen', bubbles: true }))
		);
		await page.clock.runFor(1000);
		expect((await sample(page)).top).toBe(penBefore);
	});

	test('a scroll the animation did not make stops it', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => window.harness.scrollTo(0, 1000, { animationMode: 'enabled' }));
		await page.clock.runFor(100);
		await page.evaluate(() => {
			document.querySelector<HTMLElement>('#sv .viewport')!.scrollTop = 50;
		});
		// The scroll event, which is what notices, comes on a rendering frame and not on the clock.
		await expect(page.locator('#offset')).toHaveText('50');
		await page.clock.runFor(1000);
		expect((await sample(page)).top).toBe(50);
	});

	test('a request a handler makes replaces the one it is handling', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => {
			window.harness.onStarting = (args) => {
				if (args.endPosition.y === 1000) {
					window.harness.scrollTo(0, 300, { animationMode: 'enabled' });
				}
			};
		});
		await page.evaluate(() => window.harness.scrollTo(0, 1000, { animationMode: 'enabled' }));
		const records = await page.evaluate(() => window.harness.starting);
		expect(records.map((record) => record.endPosition.y)).toEqual([1000, 300]);
		await page.clock.runFor(250);
		const { top, elapsed } = await sample(page);
		expect(Math.abs(top - 300 * measured(elapsed / 1000))).toBeLessThanOrEqual(1);
		await page.clock.runFor(1000);
		expect((await sample(page)).top).toBe(300);
	});

	test('a duration that is not a positive finite number ends at the first frame', async ({
		page
	}) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => {
			window.harness.onStarting = (args) => {
				args.animation.duration = Infinity;
			};
		});
		await page.evaluate(() => window.harness.scrollTo(0, 600, { animationMode: 'enabled' }));
		await page.clock.runFor(20);
		expect((await sample(page)).top).toBe(600);
	});
});

test.describe('a ScrollView takes an added velocity', () => {
	test('above 30 pixels a second it moves at that speed and raises no animation event', async ({
		page
	}) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: 40 }, { x: 0, y: 0 }));
		await page.clock.runFor(1000);
		{
			const { top, elapsed } = await sample(page);
			expect(Math.abs(top - (40 * elapsed) / 1000)).toBeLessThanOrEqual(1);
		}
		await page.clock.runFor(2000);
		{
			const { top, elapsed } = await sample(page);
			expect(Math.abs(top - (40 * elapsed) / 1000)).toBeLessThanOrEqual(1);
		}
		expect(await page.evaluate(() => window.harness.starting)).toEqual([]);
	});

	test('at 30 or less it does not move', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: 30 }, { x: 0, y: 0 }));
		await page.clock.runFor(1000);
		expect((await sample(page)).top).toBe(0);
		await page.evaluate(() => window.harness.scrollTo(0, 500, { animationMode: 'disabled' }));
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: -30 }, { x: 0, y: 0 }));
		await page.clock.runFor(1000);
		expect((await sample(page)).top).toBe(500);
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: 31 }, { x: 0, y: 0 }));
		await page.clock.runFor(1000);
		const { top, elapsed } = await sample(page);
		expect(Math.abs(top - (500 + (31 * elapsed) / 1000))).toBeLessThanOrEqual(1);
	});

	test('it reaches the edge it moves towards', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => window.harness.scrollTo(0, 100, { animationMode: 'disabled' }));
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: -200 }, { x: 0, y: 0 }));
		await page.clock.runFor(1000);
		expect((await sample(page)).top).toBe(0);
		await page.evaluate(() => window.harness.scrollTo(0, 1800, { animationMode: 'disabled' }));
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: 200 }, { x: 0, y: 0 }));
		await page.clock.runFor(1000);
		expect((await sample(page)).top).toBe(1844);
	});

	test('a decay slows it as each second keeps the rest of the velocity', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: 200 }, { x: 0, y: 0.5 }));
		await page.clock.runFor(1000);
		{
			const { top, elapsed } = await sample(page);
			const t = elapsed / 1000;
			expect(Math.abs(top - (200 * (Math.pow(0.5, t) - 1)) / Math.log(0.5))).toBeLessThanOrEqual(1);
		}
		// No rate, a null one and one that is not a number all take the 0.95 default.
		for (const decay of [undefined, null, { x: 0, y: Number.NaN }]) {
			await page.goto('/dev/scroll-view-scroll');
			await freeze(page);
			await page.evaluate(
				(rate) => window.harness.addScrollVelocity({ x: 0, y: 200 }, rate),
				decay
			);
			await page.clock.runFor(1000);
			const { top, elapsed } = await sample(page);
			const t = elapsed / 1000;
			expect(Math.abs(top - (200 * (Math.pow(0.05, t) - 1)) / Math.log(0.05))).toBeLessThanOrEqual(
				1
			);
			await page.clock.runFor(5000);
			expect(Math.abs((await sample(page)).top - (200 * -1) / Math.log(0.05))).toBeLessThanOrEqual(
				1
			);
		}
	});

	test('a disabled scrollBy of nothing stops it, which is how the reference Gallery cancels', async ({
		page
	}) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: 40 }, { x: 0, y: 0 }));
		await page.clock.runFor(500);
		const before = (await sample(page)).top;
		await page.evaluate(() => window.harness.scrollBy(0, 0, { animationMode: 'disabled' }));
		await page.clock.runFor(1000);
		expect((await sample(page)).top).toBe(before);
	});

	test('an added velocity adds to a running one', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: 40 }, { x: 0, y: 0 }));
		await page.clock.runFor(500);
		const first = await sample(page);
		const start = (40 * first.elapsed) / 1000;
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: 40 }, { x: 0, y: 0 }));
		await page.clock.runFor(1000);
		const { top, elapsed } = await sample(page);
		expect(Math.abs(top - (start + (80 * elapsed) / 1000))).toBeLessThanOrEqual(1);
	});

	test('reduced motion does not stop it', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: 40 }, { x: 0, y: 0 }));
		await page.clock.runFor(1000);
		const { top, elapsed } = await sample(page);
		expect(Math.abs(top - (40 * elapsed) / 1000)).toBeLessThanOrEqual(1);
		// The preference is in force: an `auto` scrollTo lands at once.
		await page.evaluate(() => window.harness.scrollTo(0, 500));
		expect((await sample(page)).top).toBe(500);
	});

	test('its correlation id follows the others', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		const a = await page.evaluate(() =>
			window.harness.scrollTo(0, 10, { animationMode: 'disabled' })
		);
		const b = await page.evaluate(() =>
			window.harness.addScrollVelocity({ x: 0, y: 40 }, { x: 0, y: 0 })
		);
		expect(b).toBe(a + 1);
	});

	test('reaching the edge ends it, so a later velocity carries none of it', async ({ page }) => {
		await page.goto('/dev/scroll-view-scroll');
		await freeze(page);
		await page.evaluate(() => {
			window.harness.scrollTo(0, 1800, { animationMode: 'disabled' });
			window.harness.addScrollVelocity({ x: 0, y: 200 }, { x: 0, y: 0 });
		});
		await page.clock.runFor(1000);
		expect((await sample(page)).top).toBe(1844);
		await page.evaluate(() => window.harness.addScrollVelocity({ x: 0, y: -40 }, { x: 0, y: 0 }));
		await page.clock.runFor(1000);
		const { top, elapsed } = await sample(page);
		expect(Math.abs(top - (1844 - (40 * elapsed) / 1000))).toBeLessThanOrEqual(1);
	});
});
