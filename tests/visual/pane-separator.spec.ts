import type { Locator } from '@playwright/test';

import { expect, test } from './fixtures';

// `PaneSeparatorStates`. The condition this covers is not the one it looks like: the separator
// is not "shown when the menu scrolls". `UpdatePaneLayout` collapses it outright when the
// footer holds no menu item and no settings item (`NavigationView.cpp:1588`), and collapses it
// again when the menu and the footer group both fit (`:1599`). Only where they do not
// (`:1610`, `:1617`, `:1624`) is it drawn. That pair is the test, and not whether anything is
// below the rule: `FooterContentBorder` is in the grid whether or not an app fills it. One more
// collapse sits between the two: a menu with no entry (`:1593`) draws no rule even when the
// footer it leaves the whole row to does not fit. No specimen here has an empty menu, so
// `navigation-view-footer.spec.ts` holds that branch. These specimens set no `footerItems`, so
// the first test is `settingsVisible` alone, and a filled `paneFooter` does not stand in for
// one: upstream counts the pane footer's height when it divides the pane's space and never when
// it decides the separator.
//
// Every test here asserts the overrun as well as the rule. Each specimen overruns because its
// menu is a few rows taller than a 360-pixel frame leaves room for, which is a property of the
// harness rather than of the control — so a harness edit that stops the overrun would otherwise
// leave these passing against a question no longer being asked.
//
// The fifth test is the only row where all three inputs are true at once. `paneFooter` is
// filled in exactly one of the other four specimens, and that row expects the rule to be
// absent — so a condition that read a filled pane footer as a reason to *collapse* would look
// right in every one of them. Test 3 says a pane footer does not bring the rule back; this one
// says it does not take it away, which is the other half of the claim that `PaneFooter` does
// not enter the decision at all.
//
// The fourth test is the one that makes the condition a conjunction rather than a claim about
// `settingsVisible` alone. The three specimens that overrun are the only frames where the menu
// overruns at all, and in the two where the separator must be absent the settings row is absent
// too — so dropping the overrun from the condition entirely would pass the other three. The
// frame whose menu fits and whose settings row is present is what fails then, and nothing else
// in this suite asserts the separator's absence under a visible settings row.

/** The box that scrolls is the `ScrollView`'s viewport, not the component's outer element. */
function overrun(frame: Locator) {
	return frame
		.locator('.pane .items-container-grid .viewport')
		.evaluate((element) => element.scrollHeight - element.clientHeight);
}

test('a menu that overruns draws the separator when a settings row sits under it', async ({
	page
}) => {
	await page.goto('/dev/navigation-view');
	const frame = page.locator('#seeded-expansion');

	await expect.poll(() => overrun(frame)).toBeGreaterThan(0);
	await expect(frame.locator('.footer-items')).toBeVisible();
	await expect(frame.locator('.items-separator')).toBeVisible();
});

test('a menu that overruns draws no separator when the footer holds no item', async ({ page }) => {
	await page.goto('/dev/navigation-view');
	const frame = page.locator('#menu-overruns-without-settings');

	await expect.poll(() => overrun(frame)).toBeGreaterThan(0);
	await expect(frame.locator('.footer-items')).toHaveCount(0);
	await expect(frame.locator('.items-separator')).toHaveCount(0);
});

// This one cannot fail while the test above passes, for any condition of the form
// `f(settingsVisible, menuOverflows)` — both specimens hide the settings row, and `paneFooter`
// reaches the derived not at all. It is here for the implementation it discriminates against:
// `(settingsVisible || paneFooterFilled) && menuOverflows`, which is the reading of `:1588`
// this unit exists to rule out and the one a reader who has not opened `:852` will reach for.
test('a filled pane footer is not a footer item, and brings no separator back', async ({
	page
}) => {
	await page.goto('/dev/navigation-view');
	const frame = page.locator('#menu-overruns-with-pane-footer');

	await expect.poll(() => overrun(frame)).toBeGreaterThan(0);
	// The slot is filled, which is the whole point of the specimen — an empty
	// `FooterContentBorder` would make the assertion below true for the wrong reason.
	await expect(frame.locator('.footer-content-border')).not.toBeEmpty();
	await expect(frame.locator('.footer-items')).toHaveCount(0);
	await expect(frame.locator('.items-separator')).toHaveCount(0);
});

test('a menu that fits draws no separator under a settings row', async ({ page }) => {
	await page.goto('/dev/navigation-view');
	const fits = page.locator('#menu-fits');

	// Waited for on a different frame on purpose. `toBe(0)` on a page that has not laid out yet
	// is true before it is meaningful, and so is `toHaveCount(0)` over an element that has not
	// been rendered — both would pass on an empty document. The seeded frame's overrun is the
	// cheapest proof that every `ScrollView` on this page has measured, and it is the same
	// measurement these assertions then read as zero.
	await expect.poll(() => overrun(page.locator('#seeded-expansion'))).toBeGreaterThan(0);

	await expect(fits.locator('.footer-items')).toBeVisible();
	expect(await overrun(fits)).toBe(0);
	await expect(fits.locator('.items-separator')).toHaveCount(0);
});

test('a filled pane footer does not take the separator away either', async ({ page }) => {
	await page.goto('/dev/navigation-view');
	const frame = page.locator('#menu-overruns-with-settings-and-pane-footer');

	await expect.poll(() => overrun(frame)).toBeGreaterThan(0);
	await expect(frame.locator('.footer-content-border')).not.toBeEmpty();
	await expect(frame.locator('.footer-items')).toBeVisible();
	await expect(frame.locator('.items-separator')).toBeVisible();
});
