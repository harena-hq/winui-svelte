import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

/**
 * A host owns the selection through a Svelte function binding: the getter returns its catalog,
 * and the setter records a pending request. Mouse and keyboard activation must leave the shown
 * selection alone until the host confirms; refusing keeps the old selection.
 *
 * `onSelectedChange` reports the requested id after the component writes to the setter, even
 * when the getter still returns the old id. Confirming or refusing outside the strip reports
 * nothing further. Removing the selected tab also writes and reports its next enabled tab.
 */

const strip = (page: Page) => page.getByTestId('confirm');
// A tab's own name takes its close button's in too ("First Close Tab").
const tab = (page: Page, name: string) => strip(page).getByRole('tab', { name });
const panel = (page: Page, name: string) => strip(page).getByRole('tabpanel', { name });
const pending = (page: Page) => page.getByTestId('pending');
const reported = (page: Page) => page.getByTestId('reported');

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/tab-view-confirm');
});

test('an activation the host has not confirmed leaves the strip on the old tab', async ({
	page
}) => {
	await tab(page, 'Second').click();
	await expect(pending(page)).toHaveText('c-2');
	await expect(tab(page, 'First')).toHaveAttribute('aria-selected', 'true');
	await expect(tab(page, 'Second')).toHaveAttribute('aria-selected', 'false');
	await expect(panel(page, 'First')).toBeVisible();
	await expect(panel(page, 'First')).toHaveText('First tab content.');
	await expect(reported(page)).toHaveText('c-2');
});

test('a confirmed activation moves the selection', async ({ page }) => {
	await tab(page, 'Second').click();
	await expect(pending(page)).toHaveText('c-2');
	await expect(reported(page)).toHaveText('c-2');
	await page.getByRole('button', { name: 'Confirm', exact: true }).click();
	await expect(tab(page, 'Second')).toHaveAttribute('aria-selected', 'true');
	await expect(tab(page, 'First')).toHaveAttribute('aria-selected', 'false');
	await expect(panel(page, 'Second')).toBeVisible();
	await expect(panel(page, 'Second')).toHaveText('Second tab content.');
	await expect(pending(page)).toHaveText('');
	await expect(reported(page)).toHaveText('c-2');
});

test('a refused activation leaves the old tab selected', async ({ page }) => {
	await tab(page, 'Third').click();
	await expect(pending(page)).toHaveText('c-3');
	await expect(reported(page)).toHaveText('c-3');
	await page.getByRole('button', { name: 'Refuse', exact: true }).click();
	await expect(tab(page, 'First')).toHaveAttribute('aria-selected', 'true');
	await expect(tab(page, 'Third')).toHaveAttribute('aria-selected', 'false');
	await expect(pending(page)).toHaveText('');
	await expect(reported(page)).toHaveText('c-3');
});

test('Enter on a focused tab asks the host the same way', async ({ page }) => {
	await tab(page, 'Second').focus();
	await tab(page, 'Second').press('Enter');
	await expect(pending(page)).toHaveText('c-2');
	await expect(tab(page, 'First')).toHaveAttribute('aria-selected', 'true');
	await expect(tab(page, 'Second')).toHaveAttribute('aria-selected', 'false');
	await expect(reported(page)).toHaveText('c-2');
});

/**
 * The component's selection move after a removal uses the same setter as activation. A consumer
 * whose setter calls its host must tell this case apart from an activation request: First is
 * already gone when the component asks for Second. This is the behaviour, not a defect.
 */
test('closing the selected tab asks the host for the next one', async ({ page }) => {
	await tab(page, 'First').locator('button.close').click({ force: true });
	await expect(tab(page, 'First')).toHaveCount(0);
	await expect(pending(page)).toHaveText('c-2');
	await expect(reported(page)).toHaveText('c-2');
});
