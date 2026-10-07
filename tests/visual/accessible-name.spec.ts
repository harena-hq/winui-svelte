/**
 * The three controls of the release whose root is a wrapper — TextBox, ComboBox in both modes,
 * ToggleSwitch — name and describe their control, not the wrapper.
 *
 * Upstream's order is `AutomationProperties.Name`, then `LabeledBy`, then the control's own
 * (FrameworkElementAutomationPeer_partial.cpp:440): the header for all three, and for a TextBox
 * with no header its placeholder (TextBox_Partial.cpp:1050-1070). An empty source is no source
 * and falls through (FrameworkElementAutomationPeer_partial.cpp:452, :463). Before this, a
 * consumer's `aria-label` landed on the wrapper and named nothing, a TextBox's header named
 * nothing, and a non-editable ComboBox's trigger was named by its selection or placeholder
 * alone.
 *
 * The non-editable trigger is a `<button>`, which has no value beside its name, so its name ends
 * with the selection's text: "Header Red", where upstream's peer reports "Header" and the
 * selection apart. With nothing selected it is "Header", without the placeholder.
 */
import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

const GROUPS = [
	{ testid: 'text-box', control: 'input', selection: '' },
	{ testid: 'combo-box', control: 'button.trigger', selection: ' Red' },
	{ testid: 'combo-box-editable', control: 'input', selection: '' },
	{ testid: 'toggle-switch', control: 'input[role="switch"]', selection: '' }
] as const;

const root = (page: Page, testid: string, which: string) =>
	page.locator(`[data-testid="${testid}"] [data-case="${which}"]`);

function control(page: Page, testid: string, selector: string, which: string): Locator {
	return root(page, testid, which).locator(selector);
}

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/accessible-name');
});

for (const { testid, control: selector, selection } of GROUPS) {
	test.describe(testid, () => {
		test('the header names the control', async ({ page }) => {
			await expect(control(page, testid, selector, 'header')).toHaveAccessibleName(
				`Header${selection}`
			);
		});

		test('an aria-label names it over the header', async ({ page }) => {
			await expect(control(page, testid, selector, 'label')).toHaveAccessibleName(
				`Label${selection}`
			);
		});

		test('an aria-labelledby names it over the header', async ({ page }) => {
			await expect(control(page, testid, selector, 'labelledby')).toHaveAccessibleName(
				`Named from outside${selection}`
			);
		});

		test('an aria-describedby describes it', async ({ page }) => {
			await expect(control(page, testid, selector, 'describedby')).toHaveAccessibleDescription(
				'Described from outside'
			);
		});

		test('an empty aria-label is no name, and the header names it', async ({ page }) => {
			await expect(control(page, testid, selector, 'empty')).toHaveAccessibleName(
				`Header${selection}`
			);
		});

		test('none of the three reaches the wrapper', async ({ page }) => {
			for (const which of ['label', 'labelledby', 'describedby']) {
				const wrapper = root(page, testid, which);
				await expect(wrapper).not.toHaveAttribute('aria-label');
				await expect(wrapper).not.toHaveAttribute('aria-labelledby');
				await expect(wrapper).not.toHaveAttribute('aria-describedby');
			}
		});
	});
}

test('a TextBox with no header is named by its placeholder', async ({ page }) => {
	await expect(control(page, 'text-box', 'input', 'placeholder')).toHaveAccessibleName(
		'Placeholder'
	);
});

test('a multi-line TextBox names its textarea', async ({ page }) => {
	await expect(control(page, 'text-box', 'textarea', 'textarea')).toHaveAccessibleName('Label');
});

test('with nothing selected, the header alone names the trigger', async ({ page }) => {
	await expect(control(page, 'combo-box', 'button.trigger', 'nothing')).toHaveAccessibleName(
		'Header'
	);
});

test('a ComboBox with no name of its own is named by its selection', async ({ page }) => {
	await expect(control(page, 'combo-box', 'button.trigger', 'unnamed')).toHaveAccessibleName('Red');
});

test("the editable ComboBox's group carries the input's name", async ({ page }) => {
	await expect(root(page, 'combo-box-editable', 'label').getByRole('group')).toHaveAccessibleName(
		'Label'
	);
	await expect(root(page, 'combo-box-editable', 'header').getByRole('group')).toHaveAccessibleName(
		'Header'
	);
});
