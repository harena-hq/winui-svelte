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
 * A held press is observable: the list stays closed and the trigger carries `data-pressed`. On a trigger
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

const pressed = (trigger: Locator) => trigger.evaluate((el) => el.hasAttribute('data-pressed'));

/** What `var(--winui-<token>)` computes to for `property`, on an element beside the trigger. */
const tokenValue = (trigger: Locator, token: string, property: 'color' | 'background-color') =>
	trigger.evaluate(
		(el, [token, property]) => {
			const probe = document.createElement('span');
			probe.style.setProperty(property, `var(--winui-${token})`);
			el.parentElement!.append(probe);
			const value = getComputedStyle(probe).getPropertyValue(property);
			probe.remove();
			return value;
		},
		[token, property] as const
	);

test('a left press draws Pressed with the list closed, and the release opens it', async ({
	page
}) => {
	const { trigger, x, y } = await firstTrigger(page);
	await page.mouse.move(x, y);
	await page.mouse.down();
	expect(await pressed(trigger), 'the press did not reach the trigger').toBe(true);
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await page.mouse.up();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect(page.locator('[role=option]').first()).toBeVisible();
	// The release ends the press before it opens the list (ComboBox_Partial.cpp:3462, :3485),
	// with the pointer still over the trigger.
	expect(await pressed(trigger), 'Pressed outlived the release').toBe(false);
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
	expect(await pressed(trigger)).toBe(true);
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

test('Pressed is the pointer flag, and it ends when the press leaves the control', async ({
	page
}) => {
	// `CommonStates` picks `Pressed` on `m_bIsPressed` alone (ComboBox_Partial.cpp:859), which
	// leaving the control clears (:3236) and coming back does not restore (:3178). CSS `:active`
	// would hold for the whole press. What is read is the painted background, so a rule keyed
	// on the wrong thing cannot pass on the flag alone.
	const { trigger, x, y, below } = await firstTrigger(page);
	const pressedBrush = await tokenValue(trigger, 'ComboBoxBackgroundPressed', 'background-color');
	const paintsPressed = async () =>
		(await trigger.evaluate((el) => getComputedStyle(el).backgroundColor)) === pressedBrush;
	await page.mouse.move(x, y);
	await page.mouse.down();
	expect(await paintsPressed(), 'the press did not paint Pressed').toBe(true);
	await page.mouse.move(x, below);
	expect(await paintsPressed(), 'Pressed outlived the pointer leaving').toBe(false);
	expect(
		await trigger.evaluate((el) => el.matches(':active')),
		'the positive control: :active still holds here'
	).toBe(true);
	await page.mouse.move(x, y);
	expect(await paintsPressed(), 'Pressed came back with the pointer').toBe(false);
	await page.mouse.up();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('a pressed trigger paints the four Pressed brushes', async ({ page }) => {
	// ComboBox_themeresources.xaml:430-447: the background, the border, the content's
	// foreground and the placeholder's. The first trigger on the route shows its placeholder and
	// the second a selection, so the two foregrounds are read on two triggers. Each pair is
	// checked to differ from its resting colour first, or nothing here could disagree.
	const { trigger } = await firstTrigger(page);
	const colour = (locator: Locator, pseudo?: string) =>
		locator.evaluate(
			(el, [pseudo, property]) => getComputedStyle(el, pseudo).getPropertyValue(property),
			[pseudo ?? null, pseudo ? 'background-color' : 'color'] as const
		);
	const backgroundOf = (locator: Locator) =>
		locator.evaluate((el) => getComputedStyle(el).backgroundColor);
	const press = async (locator: Locator, read: () => Promise<string>) => {
		const box = (await locator.boundingBox())!;
		await page.mouse.move(box.x + box.width / 3, box.y + box.height / 2);
		await page.mouse.down();
		const value = await read();
		await page.mouse.move(box.x + box.width / 3, box.y + box.height + 120);
		await page.mouse.up();
		return value;
	};

	const placeholder = trigger.locator('.placeholder');
	await expect(placeholder).toHaveCount(1);
	const placeholderBrush = await tokenValue(
		trigger,
		'ComboBoxPlaceHolderForegroundPressed',
		'color'
	);
	expect(placeholderBrush).not.toBe(await colour(placeholder));
	const backgroundBrush = await tokenValue(
		trigger,
		'ComboBoxBackgroundPressed',
		'background-color'
	);
	expect(backgroundBrush).not.toBe(await backgroundOf(trigger));
	const borderBrush = await tokenValue(trigger, 'ComboBoxBorderBrushPressed', 'background-color');
	expect(borderBrush).not.toBe(await colour(trigger, '::after'));
	expect(
		await press(trigger, async () =>
			[
				await colour(placeholder),
				await backgroundOf(trigger),
				await colour(trigger, '::after')
			].join(' | ')
		)
	).toBe([placeholderBrush, backgroundBrush, borderBrush].join(' | '));

	const selected = page.locator('.trigger').nth(1);
	const value = selected.locator('.value');
	await expect(selected.locator('.placeholder')).toHaveCount(0);
	const foregroundBrush = await tokenValue(selected, 'ComboBoxForegroundPressed', 'color');
	expect(foregroundBrush).not.toBe(await colour(value));
	expect(await press(selected, () => colour(value))).toBe(foregroundBrush);
});

test('a touch press draws Pressed, a cancel ends it, and the lift opens the list', async ({
	page
}) => {
	// `OnPointerPressed` asks the pointer's `IsLeftButtonPressed` (ComboBox_Partial.cpp:3298),
	// not its device type, so a contact draws `Pressed` too. Opening on the lift is bits-ui's
	// touch path, left as it was. Synthetic events, because the harness has no touch screen;
	// Svelte delegates both handlers to the root, which a bubbling event reaches.
	const { trigger } = await firstTrigger(page);
	const send = (type: string) =>
		trigger.evaluate(
			(el, type) =>
				el.dispatchEvent(
					new PointerEvent(type, {
						pointerType: 'touch',
						pointerId: 7,
						isPrimary: true,
						button: type === 'pointerdown' || type === 'pointerup' ? 0 : -1,
						buttons: type === 'pointerdown' ? 1 : 0,
						bubbles: true,
						cancelable: true
					})
				),
			type
		);
	// bits-ui's touch press handler cancels the event (`select.svelte.js:741`), which is what
	// keeps a real contact from also firing the compatibility mouse events.
	expect(await send('pointerdown'), "bits-ui's touch press handler did not run").toBe(false);
	expect(await pressed(trigger), 'a touch press did not draw Pressed').toBe(true);
	await send('pointercancel');
	expect(await pressed(trigger), 'a cancelled contact kept Pressed').toBe(false);
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');

	await send('pointerdown');
	await send('pointerup');
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	expect(await pressed(trigger)).toBe(false);
});
