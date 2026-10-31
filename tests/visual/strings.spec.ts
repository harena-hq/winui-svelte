/**
 * The text the components write for themselves comes from `strings.ts`, and `provideStrings`
 * replaces it, in place and through a portal: ADR 0020.
 */
import { expect, test } from './fixtures';

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/strings');
});

test('a provider replaces the text, and a key it leaves out keeps the default', async ({
	page
}) => {
	// The InfoBar's and the tip's close buttons.
	const close = page.getByRole('button', { name: 'Schließen', exact: true });
	await expect(close).toHaveCount(2);
	await page.getByRole('textbox').focus();
	await expect(page.getByRole('button', { name: 'Löschen' })).toHaveCount(1);
	await expect(page.locator('.on-content').first()).toHaveText('Ein');
	await expect(page.locator('.off-content').first()).toHaveText('Off');
});

test("the InfoBar's close button has its own tooltip key", async ({ page }) => {
	await page
		.locator('[role=button], button')
		.filter({ has: page.locator('.close-glyph') })
		.hover();
	await expect(page.getByText('Schließen (Hinweis)')).toBeVisible();
});

test('a provider beneath another sets its key and hears the rest', async ({ page }) => {
	const nested = page.locator('[data-nested]');
	await expect(nested.locator('.off-content')).toHaveText('Aus');
	await expect(nested.locator('.on-content')).toHaveText('Ein');
});

test('a table that reads state switches the language in place', async ({ page }) => {
	await page.locator('[data-switch]').click();
	await expect(page.locator('.on-content').first()).toHaveText('On');
	await expect(page.getByRole('button', { name: 'Schließen', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Close', exact: true })).toHaveCount(2);
});

test('a component created inside a portal hears the provider', async ({ page }) => {
	await page.getByRole('button', { name: /Monat/ }).first().click();
	await expect(page.getByRole('button', { name: 'Nächstes' }).first()).toBeAttached();
});

test("a third party's own labels follow the table, and switch with it", async ({ page }) => {
	await expect(page.getByRole('button', { name: 'Mehr', exact: true })).toHaveCount(1);
	await page.locator('[data-switch]').click();
	await expect(page.getByRole('button', { name: 'Increase', exact: true })).toHaveCount(1);
});

test('a format fills its arguments in its own order, on the key the count selects', async ({
	page
}) => {
	// PersonPicture.cpp:368-407's rungs, each with its own value on the page.
	for (const name of [
		'S Ada 1',
		'P7 Ada 2',
		'P2 Ada 3',
		'P2 Ada 4',
		'5 Einträge für Ada',
		'10 Einträge für Ada',
		'P6 Ada 11',
		'P6 Ada 19',
		'P4 Ada 20',
		'P1 Ada 21',
		'P3 Ada 22',
		'P3 Ada 24',
		'P4 Ada 25',
		'Ada, 5 Nachrichten',
		'Ada, icon'
	]) {
		await expect(page.getByLabel(name, { exact: true })).toHaveCount(1);
	}
});

test("a picker's empty fields come from the table, and a key it leaves out keeps the default", async ({
	page
}) => {
	const picker = page.getByRole('button', { name: /Monat/ });
	await expect(picker).toContainText('Monat');
	await expect(picker).toContainText('day');
});

test('a time field and its selector come from the table', async ({ page }) => {
	const picker = page.getByRole('button', { name: /Stunde/ });
	await expect(picker).toContainText('Stunde');
	await expect(picker).toContainText('minute');
	await picker.click();
	await expect(page.getByLabel('Stundenwahl')).not.toHaveCount(0);
});

test("the primitive's labels in a calendar come from the table", async ({ page }) => {
	await expect(page.getByRole('button', { name: 'Zurück', exact: true })).toHaveCount(1);
	await expect(page.locator('[aria-label^="Kalender"]').first()).toBeAttached();
});
