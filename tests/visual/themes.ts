import type { Page } from '@playwright/test';
import { expect } from './fixtures';

export const THEMES = ['light', 'dark', 'high-contrast'] as const;

/**
 * Screenshot one component in every theme.
 *
 * C4 checks that each exported component is passed to this helper. The helper is what
 * makes that check mean something: a gate that only looked for the words "dark" and
 * "light" somewhere in the suite would be satisfied by a comment.
 */
export async function snapshotAllThemes(
	page: Page,
	component: string,
	path: string,
	options?: { animations?: 'allow' | 'disabled' }
) {
	for (const theme of THEMES) {
		await page.goto(path);
		// Set the theme through the channel the app owns as well as the one the screenshot
		// reads, then prove it stuck. The Gallery's layout applies `theme` to
		// `documentElement.dataset` in an effect that runs on mount and reads `localStorage`
		// first, so a `dataset` write that lands *before* hydration is deleted again by that
		// effect and the page is photographed in the default theme. Writing both makes the two
		// orders converge — hydration reads the value we stored, or finds the attribute we set
		// — and the poll is what makes a render that did neither impossible to photograph.
		// This is not hypothetical: a whole-suite `--update-snapshots` once wrote a light
		// render into `InfoBar-dark.png`, and a baseline written from a wrong render agrees
		// with itself forever after.
		await page.evaluate((t) => {
			localStorage.setItem('winui-svelte:theme', t);
			document.documentElement.dataset.theme = t;
		}, theme);
		await expect
			.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''))
			.toBe(theme);
		// The window is exactly `100vh` and clips (D16), and the dev layout is what
		// scrolls inside it, so `body` is the viewport and a screenshot of it is a crop of
		// the top of the page. That was invisible while every dev page fitted above the
		// fold, and it stopped being invisible the moment one did not: TextBox's header
		// and description rendered, and were photographed by nothing.
		//
		// Growing the viewport to the content is what makes the capture whole without
		// touching the window semantics the shell is judged on. It settles rather than
		// grows: the width does not change, so the content's height does not either, and
		// a page shorter than the viewport reports the box height and is left alone.
		const { width } = page.viewportSize()!;
		const height = await page.locator('.dev').evaluate((el) => el.scrollHeight);
		await page.setViewportSize({ width, height });
		// `options` reaches `toHaveScreenshot` for one setting, `animations`, and the default is
		// Playwright's: `disabled`, which does not merely freeze an animation but **finishes**
		// it — every running animation is seeked to its end and left there, permanently, before
		// the capture. That is the right default for every route photographing a control at
		// rest, and it is why the baselines of the animated controls show their last frame.
		//
		// It is wrong for exactly one kind of page. `/dev/motion` renders a curve as eleven
		// copies of one animation paused at eleven negative delays; under `disabled` all eleven
		// are sent to the end frame and stack into a single marker, and the strip photographs as
		// one square. Nothing catches that on its own: the DOM assertions beside it read the
		// page rather than the picture and pass, and a first baseline written from the wrong
		// render agrees with itself forever after — the same trap the theme comment above
		// describes, reached by a different road. Found by opening the PNG.
		await expect(page.locator('body')).toHaveScreenshot(`${component}-${theme}.png`, options);
	}
}
