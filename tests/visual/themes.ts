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
export async function snapshotAllThemes(page: Page, component: string, path: string) {
	for (const theme of THEMES) {
		await page.goto(path);
		await page.evaluate((t) => {
			document.documentElement.dataset.theme = t;
		}, theme);
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
		await expect(page.locator('body')).toHaveScreenshot(`${component}-${theme}.png`);
	}
}
