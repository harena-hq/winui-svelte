import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * A `ToggleSwitch` is named as `ToggleSwitchAutomationPeer::GetNameCore` names it.
 *
 * Absent an explicit name, the header's string and the content of the current state only —
 * `OnContent` when on, `OffContent` when off — and that content only when the property has been
 * set. The default "On" adds nothing, since the toggle state already says it; an explicit "On"
 * still counts. Both present are joined by one space, header first; one alone is the name;
 * neither leaves the switch unnamed.
 *
 * Measured before this change, on `/dev/toggle-switch`, every default switch was named "Off On"
 * and the row headed "Toggle work" was named "Do work Working": both contents, and no header.
 */

const ROWS: { id: string; off: string; on: string }[] = [
	{ id: 'neither', off: '', on: '' },
	{ id: 'header-only', off: 'Header only', on: 'Header only' },
	{ id: 'content-only', off: 'Disabled', on: 'Enabled' },
	{ id: 'both', off: 'Toggle work Do work', on: 'Toggle work Working' },
	{ id: 'explicit-default', off: 'Off', on: 'On' },
	{ id: 'on-only', off: '', on: 'Working' },
	// Not upstream's: a snippet is read for its text, as a `TextBlock` header would be. Upstream
	// gives an arbitrary element no string; the component's `labelledBy` comment says why.
	{ id: 'snippet-header', off: 'Bold header', on: 'Bold header' }
];

async function cdpName(page: Page, selector: string) {
	const session = await page.context().newCDPSession(page);
	const { root } = await session.send('DOM.getDocument', { depth: 0 });
	const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
	const { nodes } = await session.send('Accessibility.getPartialAXTree', {
		nodeId,
		fetchRelatives: false
	});
	await session.detach();
	return nodes[0].name?.value ?? '';
}

test.describe('a ToggleSwitch is named as upstream names it, a snippet read for its text', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/dev/toggle-switch-name');
	});

	for (const { id, off, on } of ROWS) {
		test(id, async ({ page }) => {
			const input = page.locator(`#${id}`).getByRole('switch');
			const selector = `#${id} input`;

			await expect(input).toHaveAccessibleName(off);
			expect(await cdpName(page, selector)).toBe(off);

			await input.focus();
			await page.keyboard.press('Space');
			await expect(input).toBeChecked();

			await expect(input).toHaveAccessibleName(on);
			expect(await cdpName(page, selector)).toBe(on);
		});
	}
});

test('the content stays drawn', async ({ page }) => {
	await page.goto('/dev/toggle-switch-name');
	await expect(page.locator('#both .off-content')).toHaveText('Do work');
	await expect(page.locator('#both .on-content')).toHaveText('Working');
	await expect(page.locator('#neither .off-content')).toHaveText('Off');
	await expect(page.locator('#neither .on-content')).toHaveText('On');
});
