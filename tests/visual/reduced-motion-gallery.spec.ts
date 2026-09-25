import { expect, test } from './fixtures';

type Page = import('@playwright/test').Page;

/**
 * ADR 0016 on the Gallery's motion pages: what upstream's animation switch stops, stops here
 * under `prefers-reduced-motion`. Each page's demo is driven once the page's own load motion
 * has finished, and what the drive started is read one frame later: without the preference
 * some of it is still running or still waiting out a delay, and with it none is. Where a page
 * waits for `animationend` to finish its work, the end state is read too — an animation
 * removed rather than shortened would never fire it. Upstream's reasons are beside each page's
 * rule.
 */

type Drive = {
	route: string;
	trigger: string;
	prepare?: (page: Page) => Promise<void>;
	/** What the page looks like once the drive has run to its end. */
	settled?: (page: Page) => Promise<void>;
};

const DRIVES: Drive[] = [
	{ route: '/motion/themetransition', trigger: 'Add five' },
	{ route: '/motion/themetransition', trigger: 'Reposition' },
	{ route: '/motion/themetransition', trigger: 'Refresh data' },
	{ route: '/motion/themetransition', trigger: 'Add' },
	{
		route: '/motion/themetransition',
		trigger: 'Show Popup',
		settled: async (page) => {
			await expect(page.locator('.popup-surface')).toHaveCount(1);
			await page.getByRole('button', { name: 'Close Popup', exact: true }).click();
			await expect(page.locator('.popup-surface')).toHaveCount(0);
		}
	},
	{
		route: '/motion/pagetransition',
		trigger: 'Navigate Forward',
		settled: (page) => expect(page.locator('.layer')).toHaveCount(1)
	},
	{
		route: '/motion/connectedanimation',
		trigger: 'Navigate',
		settled: async (page) => {
			await expect(page.locator('.travel')).toHaveCount(0);
			await expect(page.locator('[style*="visibility: hidden"]')).toHaveCount(0);
		}
	},
	{ route: '/motion/implicittransition', trigger: 'Set Rotation' },
	{
		route: '/motion/implicittransition',
		trigger: 'Set Opacity',
		// The page opens with the opacity it would set, so a value that differs is typed first.
		prepare: (page) => page.getByRole('spinbutton').first().fill('0.9')
	}
];

async function unfinishedAfterDrive(page: Page, { route, trigger, prepare }: Drive) {
	await page.goto(route);
	// The page's load motion first, or the count below could be of that and not the drive.
	// A cancelled animation rejects `finished`, and an endless one never settles; neither is load
	// motion to wait for.
	await page.evaluate(() =>
		Promise.all(
			document
				.getAnimations()
				.filter((a) => Number.isFinite(Number(a.effect?.getComputedTiming().endTime)))
				.map((a) => a.finished.catch(() => undefined))
		)
	);
	await prepare?.(page);
	await page.getByRole('button', { name: trigger, exact: true }).first().click();
	return page.evaluate(
		() =>
			new Promise<number>((resolve) =>
				requestAnimationFrame(() =>
					resolve(
						document.getAnimations().filter((animation) => {
							const target = (animation.effect as KeyframeEffect).target as Element | null;
							return (
								animation.playState === 'running' &&
								// Duration and delay both: a zero-length animation still waiting out a
								// delay is not over.
								Number(animation.effect?.getComputedTiming().endTime) > 0 &&
								// A button's own press and hover motion is the library's, and
								// `reduced-motion.spec.ts` reads it; this counts the sample's.
								!target?.closest('button')
							);
						}).length
					)
				)
			)
	);
}

for (const drive of DRIVES) {
	test(`reduced motion lands ${drive.route}'s ${drive.trigger} at once`, async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		expect(
			await unfinishedAfterDrive(page, drive),
			'the positive control: the drive starts nothing that runs'
		).toBeGreaterThan(0);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		expect(await unfinishedAfterDrive(page, drive)).toBe(0);
		await drive.settled?.(page);
	});
}

test('reduced motion leaves the easing sample running, a storyboard begun from code', async ({
	page
}) => {
	// The sample's `Storyboard.Begin()` is not the visual state manager's, and nothing in the
	// pin's `core/animation` reads the switch, so upstream plays it with the switch off.
	await page.emulateMedia({ reducedMotion: 'reduce' });
	expect(
		await unfinishedAfterDrive(page, {
			route: '/motion/easingfunction',
			trigger: 'Animate rectangle using Standard Easing Function'
		})
	).toBeGreaterThan(0);
});
