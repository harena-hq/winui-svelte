import { expect, type Page } from '@playwright/test';

export const THEMES = ['light', 'dark', 'high-contrast'] as const;

/**
 * Screenshot one component in every theme.
 *
 * C4 checks that each exported component is passed to this helper. The helper is
 * what makes that check mean something: a gate that only looked for the words
 * "dark" and "light" somewhere in the suite would be satisfied by a comment.
 */
export async function snapshotAllThemes(page: Page, component: string, path: string) {
	for (const theme of THEMES) {
		await page.goto(path);
		await page.evaluate((t) => {
			document.documentElement.dataset.theme = t;
		}, theme);
		await expect(page.locator('body')).toHaveScreenshot(`${component}-${theme}.png`);
	}
}
