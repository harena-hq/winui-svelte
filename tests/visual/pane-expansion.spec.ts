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
	// The deep link leaves a top-level row shut in the rail, so one click opens the flyout.
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

// Measured on the reference guest with the pane shut into its rail: a page opened from a Home
// card leaves its section's row shut with no flyout drawn, one click on the row opens the
// flyout, and opening the pane shows the section collapsed. The original's own deep links,
// protocol and jump-list activation, were not measured; the shell treats a deep link as it
// does that card. The shell's layout has the mechanism.
test('a deep link in the rail leaves its section shut, and one click opens it', async ({
	page
}) => {
	await rail(page, '/basicinput/button');
	const section = page.locator(row('Basic input'));
	const button = page.locator(row('Button'));
	await expect(section).toHaveAttribute('aria-expanded', 'false');
	await expect(button).toBeHidden();

	// Opening the pane shows it collapsed too: a row the shell had seeded, and the control had
	// collapsed for the rail, would be put back here.
	const toggle = page.locator('.pane-toggle-button');
	const root = page.locator('[data-display-mode][data-pane-open]');
	await toggle.click();
	await expect(root).toHaveAttribute('data-pane-open', 'true');
	await expect(section).toHaveAttribute('aria-expanded', 'false');
	await toggle.click();
	await expect(root).toHaveAttribute('data-pane-open', 'false');

	await section.click();
	await expect(page).toHaveURL(/\/basicinput$/);
	await expect(section).toHaveAttribute('aria-expanded', 'true');
	await expect(button).toBeVisible();
});

/** Chooses a page from the title bar's search box, as a person does. */
async function search(page: import('@playwright/test').Page, name: string) {
	const box = page.locator('.search input');
	await box.click();
	await box.pressSequentially(name);
	const option = page.getByRole('option', { name, exact: true });
	await expect(option).toBeVisible();
	await option.click();
}

test('a page found by search in the rail opens its section’s flyout, the page in it', async ({
	page
}) => {
	// Measured on the reference guest as well: the flyout opens and stays open, the page selected
	// in it. Upstream's search expands the section and lays it out before it selects the page
	// (MainWindow.xaml.cs:521-525); the shell's layout says why that differs from a Home card.
	await rail(page, '/');
	await search(page, 'TabView');
	await expect(page).toHaveURL(/\/navigation\/tabview$/);
	const tabView = page.locator(row('TabView'));
	await expect(page.locator(row('Navigation'))).toHaveAttribute('aria-expanded', 'true');
	await expect(tabView).toBeVisible();
	await expect(tabView).toHaveAttribute('aria-selected', 'true');
	// Still open once the navigation has settled, not only on the frame it opened.
	await page.waitForTimeout(500);
	await expect(tabView).toBeVisible();
});

test('a deep link with the minimal pane shut shows its section open in the pane', async ({
	page
}) => {
	// A shut minimal pane is not a rail: nothing of it is drawn, and it has no flyout. This
	// passed before the rail was left unseeded too; it guards the minimal branch of that rule.
	await page.setViewportSize({ width: 500, height: 800 });
	await page.goto('/navigation/tabview');
	const root = page.locator('[data-display-mode][data-pane-open]');
	await expect(root).toHaveAttribute('data-display-mode', 'minimal');
	await expect(root).toHaveAttribute('data-pane-open', 'false');

	await page.locator('.pane-toggle-button').click();
	await expect(root).toHaveAttribute('data-pane-open', 'true');
	await expect(page.locator(row('Navigation'))).toHaveAttribute('aria-expanded', 'true');
	await expect(page.locator(row('TabView'))).toBeVisible();
});

// The reference's rail is the wide window's pane shut by its toggle, not a compact window, and
// the navigation it was measured on is one the pane did not make. Going back is one here:
// upstream's back reaches the page's `OnNavigatedTo`, which seeds as the Home card's does.
test('a page gone back to in a wide window’s shut pane leaves its section shut', async ({
	page
}) => {
	await page.setViewportSize({ width: 1600, height: 900 });
	await page.goto('/basicinput/button');
	const root = page.locator('[data-display-mode][data-pane-open]');
	await expect(root).toHaveAttribute('data-display-mode', 'expanded');
	await page.locator('.pane-toggle-button').click();
	await expect(root).toHaveAttribute('data-pane-open', 'false');
	await search(page, 'TabView');
	await expect(page).toHaveURL(/\/navigation\/tabview$/);
	// The search opened its section's flyout; Escape shuts it and collapses the row.
	await page.keyboard.press('Escape');
	await expect(page.locator(row('TabView'))).toBeHidden();

	await page.goBack();
	await expect(page).toHaveURL(/\/basicinput\/button$/);
	const section = page.locator(row('Basic input'));
	const button = page.locator(row('Button'));
	await expect(section).toHaveAttribute('aria-expanded', 'false');
	await expect(button).toBeHidden();
	await section.click();
	await expect(button).toBeVisible();
	// Not the measured pane-open case: this section was expanded before the toggle shut the
	// pane, so the control remembers it and opening the pane would put it back.
});

// The shell keeps the mode the control last reported, so the report has to follow a resize.
test('a page gone back to after the rail narrows to minimal shows its section open', async ({
	page
}) => {
	await rail(page, '/basicinput/button');
	await search(page, 'TabView');
	await expect(page).toHaveURL(/\/navigation\/tabview$/);
	await page.keyboard.press('Escape');
	await expect(page.locator(row('TabView'))).toBeHidden();
	await page.setViewportSize({ width: 500, height: 800 });
	const root = page.locator('[data-display-mode][data-pane-open]');
	await expect(root).toHaveAttribute('data-display-mode', 'minimal');

	await page.goBack();
	await expect(page).toHaveURL(/\/basicinput\/button$/);
	await page.locator('.pane-toggle-button').click();
	await expect(root).toHaveAttribute('data-pane-open', 'true');
	await expect(page.locator(row('Basic input'))).toHaveAttribute('aria-expanded', 'true');
	await expect(page.locator(row('Button'))).toBeVisible();
});
