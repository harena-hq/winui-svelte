import { expect, test } from './fixtures';
import { growViewportToContent } from './themes';

type Locator = import('@playwright/test').Locator;
type Page = import('@playwright/test').Page;

/**
 * When a pointer opens the list.
 *
 * Upstream opens it on the release, not the press. `ComboBox::OnPointerPressed`
 * (ComboBox_Partial.cpp:3310) marks a left press on the control `m_bIsPressed` and draws
 * `Pressed`; `OnPointerReleased` (:3426) opens the list through `PerformPointerUpAction`
 * (:3529) only while that flag holds, and leaving the control clears it (`OnPointerExited`,
 * :3236; `OnPointerMoved`, :3201; `OnPointerEntered` on the way back, :3178). bits-ui 2.19 opens
 * on a mouse `pointerdown`, which is what the component used to inherit.
 *
 * A held press is observable: the list stays closed and the trigger is `:active`. On a trigger
 * the keyboard focused, that is `FocusedPressed` (ComboBox_themeresources.xaml:488), which
 * raises the Pill as `Focused` does (:491 against :476) — a state no pointer could reach while
 * the press itself opened the list, because an open list is `FocusedDropDown` and hides it.
 * What these tests read is that the Pill stays up, not the state's own brushes.
 */

const ROUTE = '/dev/combo-box';

async function firstTrigger(page: Page) {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	const trigger = page.locator('.trigger').first();
	const box = (await trigger.boundingBox())!;
	return {
		trigger,
		x: box.x + box.width / 3,
		y: box.y + box.height / 2,
		below: box.y + box.height + 120
	};
}

const active = (trigger: Locator) => trigger.evaluate((el) => el.matches(':active'));

test('a left press draws Pressed with the list closed, and the release opens it', async ({
	page
}) => {
	const { trigger, x, y } = await firstTrigger(page);
	await page.mouse.move(x, y);
	await page.mouse.down();
	expect(await active(trigger), 'the press did not reach the trigger').toBe(true);
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await page.mouse.up();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect(page.locator('[role=option]').first()).toBeVisible();
});

test('a press that leaves the control does not open it, even if it comes back', async ({
	page
}) => {
	const { trigger, x, y, below } = await firstTrigger(page);
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.move(x, below);
	await page.mouse.up();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	// The press that left has to be forgotten, not only outlived: a release on the trigger with
	// no press of its own in between is the one sequence that would still find it.
	await page.mouse.down();
	await page.mouse.move(x, y);
	await page.mouse.up();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');

	await page.mouse.down();
	await page.mouse.move(x, below);
	await page.mouse.move(x, y);
	await page.mouse.up();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');

	// The control still opens afterwards, so the two readings above are the drag and not a
	// trigger that stopped opening.
	await page.mouse.down();
	await page.mouse.up();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
});

test('a release the control did not see pressed does not open it', async ({ page }) => {
	const { trigger, x, y, below } = await firstTrigger(page);
	await page.mouse.move(x, below);
	await page.mouse.down();
	await page.mouse.move(x, y);
	await page.mouse.up();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');

	// `m_bIsPressed` is set for the left button alone (ComboBox_Partial.cpp:3343).
	await page.mouse.down({ button: 'right' });
	await page.mouse.up({ button: 'right' });
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('a press on a trigger the keyboard focused keeps the list shut and the Pill up', async ({
	page
}) => {
	const { trigger, x, y } = await firstTrigger(page);
	await trigger.focus();
	await page.keyboard.press('Shift+Tab');
	await page.keyboard.press('Tab');
	expect(await trigger.evaluate((el) => el.matches(':focus-visible'))).toBe(true);

	await page.mouse.move(x, y);
	await page.mouse.down();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	expect(await active(trigger)).toBe(true);
	expect(await trigger.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
	const pill = trigger.locator('> .pill');
	expect(
		await pill.evaluate((el) => {
			const style = getComputedStyle(el);
			return style.visibility === 'visible' && style.opacity !== '0';
		}),
		'the held press took the Pill down'
	).toBe(true);
	await page.mouse.up();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
});

test('a press on the trigger while the list is open still closes it', async ({ page }) => {
	const { trigger, x, y } = await firstTrigger(page);
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.up();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await page.mouse.down();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await page.mouse.up();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
