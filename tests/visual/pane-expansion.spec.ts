import { expect, test } from './fixtures';

// Behavioural, like theme-switch.spec.ts, and for the same reason: no snapshot can ask
// whether a control that changes state actually changes it. `OnNavigationViewItemInvoked`
// toggles expansion unconditionally (NavigationView.cpp:1062), so one click on a section
// both selects it and collapses it — including from a page inside that section, where the
// shell's seeding effect used to re-expand it in the same tick.
const row = (label: string) => `[role="treeitem"]:has(> .content-presenter:text-is("${label}"))`;

test('a section collapses from a page inside it, and the page stays', async ({ page }) => {
	// `Design` has children and no page of its own, so invoking it must not navigate.
	await page.goto('/design/typography');
	await expect(page.locator(row('Design'))).toHaveAttribute('aria-expanded', 'true');

	await page.locator(row('Design')).click();
	await expect(page.locator(row('Design'))).toHaveAttribute('aria-expanded', 'false');
	expect(new URL(page.url()).pathname).toBe('/design/typography');

	// And it toggles back, rather than being stuck the other way.
	await page.locator(row('Design')).click();
	await expect(page.locator(row('Design'))).toHaveAttribute('aria-expanded', 'true');
});

test('a section with a page of its own navigates and collapses on the same click', async ({
	page
}) => {
	await page.goto('/basicinput/button');
	await expect(page.locator(row('Basic input'))).toHaveAttribute('aria-expanded', 'true');

	await page.locator(row('Basic input')).click();
	await expect(page.locator(row('Basic input'))).toHaveAttribute('aria-expanded', 'false');
	await expect(page).toHaveURL(/\/basicinput$/);
});
