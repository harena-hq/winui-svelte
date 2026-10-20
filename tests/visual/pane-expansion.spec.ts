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

/** Compact, the pane shut: a section's children open in a flyout beside its row. */
async function rail(page: import('@playwright/test').Page, path: string) {
	await page.setViewportSize({ width: 900, height: 800 });
	await page.goto(path);
	const root = page.locator('[data-display-mode][data-pane-open]');
	await expect(root).toHaveAttribute('data-display-mode', 'compact');
	await expect(root).toHaveAttribute('data-pane-open', 'false');
}

// The seeding effect runs in the task that moves the URL: SvelteKit pushes the history entry
// and then, through microtasks only while nothing registers `onNavigate` and preloads are not
// forked (`kit.experimental.forkPreloads`, off), updates `page`, and Svelte flushes effects in
// a microtask. So any check made after the URL reads the new path runs after a re-seed.
test('a page chosen in the rail’s flyout closes it, and the shell does not reopen it', async ({
	page
}) => {
	await rail(page, '/');
	await page.locator(row('Basic input')).click();
	// `Basic input` has a page of its own, and the click goes there as it opens the flyout.
	await expect(page).toHaveURL(/\/basicinput$/);
	await expect(page.locator(row('Basic input'))).toHaveAttribute('aria-expanded', 'true');
	const button = page.locator(row('Button'));
	await expect(button).toBeVisible();

	await button.click();
	await expect(page).toHaveURL(/\/basicinput\/button$/);
	await expect(page.locator(row('Basic input'))).toHaveAttribute('aria-expanded', 'false');
	await expect(button).toBeHidden();
});

test('the page already shown, chosen in the rail’s flyout, closes it too', async ({ page }) => {
	// `Design` has no page of its own, so opening its flyout leaves the URL where it is, and
	// choosing `Typography` there navigates to the page already shown.
	await rail(page, '/design/typography');
	const back = page.locator('.back-button');
	await expect(back).toBeHidden();
	const design = page.locator(row('Design'));
	const typography = page.locator(row('Typography'));
	// The deep link seeded `Design` open while the pane was shut, which draws no flyout; the
	// first click collapses it and the second opens the flyout.
	await design.click();
	await expect(design).toHaveAttribute('aria-expanded', 'false');
	await design.click();
	await expect(typography).toBeVisible();

	await typography.click();
	// The URL does not move, so the back button `afterNavigate` shows is what says it landed.
	await expect(back).toBeVisible();
	expect(new URL(page.url()).pathname).toBe('/design/typography');
	await expect(design).toHaveAttribute('aria-expanded', 'false');
	await expect(typography).toBeHidden();
});
