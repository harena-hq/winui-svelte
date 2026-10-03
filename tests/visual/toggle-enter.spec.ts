/**
 * Enter clicks a ToggleButton and an AppBarToggleButton, and does nothing to a CheckBox, a
 * RadioButton or a ToggleSwitch.
 *
 * `ButtonBaseKeyProcess.h` (`KeyPress::ButtonBase::IsPress`): Space and GamepadA always press a
 * button; Enter presses it only when the control's `acceptsReturn` flag is set.
 * `ToggleButton_Partial.cpp` calls `SetAcceptsReturn(true)` in `Initialize`;
 * `CheckBox_Partial.cpp` and `RadioButton_Partial.cpp` call `SetAcceptsReturn(false)`.
 * `AppBarToggleButton` derives from `ToggleButton`. `ToggleSwitch` is not a button.
 * `ToggleSwitch::HandlesKey` (`ToggleSwitch_Partial.cpp`) answers only Space and GamepadA.
 *
 * Observed on the reference Gallery on 2026-10-03: its two-state CheckBox, clicked to checked,
 * stayed checked on Enter and its output line did not change; Space then unchecked it.
 */

import { expect, test } from './fixtures';
import type { Locator, Page } from '@playwright/test';

declare global {
	interface Window {
		__events: string[];
	}
}

/** Record `click`, `input` and `change` at the window, in capture, from this moment on. */
async function listen(page: Page) {
	await page.evaluate(() => {
		window.__events = [];
		for (const type of ['click', 'input', 'change']) {
			window.addEventListener(
				type,
				(event) => {
					window.__events.push(event.type);
				},
				{ capture: true }
			);
		}
	});
}

async function events(page: Page) {
	return page.evaluate(() => window.__events);
}

/** An `<input>` reports `checked`; every other control reports `aria-pressed`. */
async function state(locator: Locator) {
	return locator.evaluate((element) =>
		element instanceof HTMLInputElement
			? String(element.checked)
			: element.getAttribute('aria-pressed')
	);
}

test.describe('Enter is ignored where upstream does not accept it', () => {
	test('CheckBox', async ({ page }) => {
		const locator = page.getByRole('checkbox', { name: 'Unchecked', exact: true });
		await page.goto('/dev/check-box');
		await locator.focus();
		await listen(page);
		expect(await state(locator)).toBe('false');

		await page.keyboard.press('Enter');
		expect(await state(locator)).toBe('false');
		expect(await events(page)).toEqual([]);

		await page.keyboard.press('Space');
		expect(await state(locator)).toBe('true');
		expect(await events(page)).toEqual(['click', 'input', 'change']);
	});

	test('RadioButton', async ({ page }) => {
		const locator = page.getByRole('radio', { name: 'Unselected', exact: true });
		await page.goto('/dev/radio-button');
		await locator.focus();
		await listen(page);
		expect(await state(locator)).toBe('false');

		await page.keyboard.press('Enter');
		expect(await state(locator)).toBe('false');
		expect(await events(page)).toEqual([]);

		await page.keyboard.press('Space');
		expect(await state(locator)).toBe('true');
		expect(await events(page)).toEqual(['click', 'input', 'change']);
	});

	test('ToggleSwitch', async ({ page }) => {
		const locator = page.getByRole('switch').first();
		await page.goto('/dev/toggle-switch');
		await locator.focus();
		await listen(page);
		expect(await state(locator)).toBe('false');

		await page.keyboard.press('Enter');
		expect(await state(locator)).toBe('false');
		expect(await events(page)).toEqual([]);

		await page.keyboard.press('Space');
		expect(await state(locator)).toBe('true');
		expect(await events(page)).toEqual(['click', 'input', 'change']);
	});
});

test.describe('Enter clicks where upstream accepts it', () => {
	test('ToggleButton', async ({ page }) => {
		const locator = page.getByRole('button', { name: 'Unchecked', exact: true }).first();
		await page.goto('/dev/toggle-button');
		await locator.focus();
		await listen(page);
		expect(await state(locator)).toBe('false');

		await page.keyboard.press('Enter');
		expect(await state(locator)).toBe('true');
		expect(await events(page)).toEqual(['click']);

		await page.keyboard.press('Enter');
		expect(await state(locator)).toBe('false');
		expect(await events(page)).toEqual(['click', 'click']);
	});

	test('AppBarToggleButton', async ({ page }) => {
		const locator = page.getByRole('button', { name: 'Unchecked', exact: true }).first();
		await page.goto('/dev/app-bar-toggle-button');
		await locator.focus();
		await listen(page);
		expect(await state(locator)).toBe('false');

		await page.keyboard.press('Enter');
		expect(await state(locator)).toBe('true');
		expect(await events(page)).toEqual(['click']);

		await page.keyboard.press('Enter');
		expect(await state(locator)).toBe('false');
		expect(await events(page)).toEqual(['click', 'click']);
	});
});
