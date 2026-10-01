import { expect, test } from './fixtures';

// `ContentDialog::SetInitialFocusElement` (`ContentDialog_Partial.cpp:1984`) tries the first
// focusable element of the content (`:1997`), then the default button (`:2027`), then the first
// focusable command button (`:2039`) — each with `FocusState_Programmatic`, which moves focus and
// draws no visual. Content first, so a dialog whose content takes focus never reaches the default
// button: measured on the reference guest 2026-09-18, the Gallery's first example is shown from a
// mouse click, lights nothing, and one Tab lights its accent `Save` button, which places focus on
// the CheckBox above it.
//
// Both Gallery examples have that CheckBox, and so do four of the ten dialogs on this route.
// The last six exist for the branches neither can reach.

type Page = import('@playwright/test').Page;

function focused(page: Page) {
	return page.evaluate(() => {
		const active = document.activeElement as HTMLElement | null;
		if (!active) return null;
		return {
			tag: active.tagName.toLowerCase(),
			className: active.className,
			type: active.getAttribute('type'),
			label: (active.textContent ?? '').trim(),
			inContent: !!active.closest('.content'),
			inCommands: !!active.closest('.commands'),
			focusVisible: active.matches(':focus-visible')
		};
	});
}

/**
 * The dialog's focus lands a frame or more after it opens; read it only once it has.
 *
 * The field is a parameter because `tag` cannot be the one that is waited on everywhere. Opening
 * one of the later dialogs means clicking a `<button>`, which Chromium focuses — so a poll for
 * `tag === 'button'` is satisfied by the trigger before the dialog has focused anything, and the
 * assertions under it would read whichever element happened to hold focus first.
 */
function settlesOn(page: Page, field: 'tag' | 'label', value: string) {
	return expect.poll(async () => (await focused(page))?.[field] ?? null).toBe(value);
}

/**
 * Open one of the later dialogs.
 *
 * The basic dialog is open from the first paint and its smoke layer covers the triggers, so it is
 * dismissed first — by pointer, because a key would be the interaction `:focus-visible` is a
 * heuristic over, and these assertions are about what a dialog opened without one does.
 */
async function open(page: Page, trigger: string) {
	await page.goto('/dev/content-dialog');
	await page.getByRole('button', { name: 'Cancel' }).click();
	await page.getByRole('button', { name: trigger }).click();
}

test('an opening dialog focuses the first focusable element of its content, unlit', async ({
	page
}) => {
	// Nothing has interacted with this page at all: it is served with the dialog already open,
	// which is the case Chromium resolves as focus-visible for a plain `focus()`.
	await page.goto('/dev/content-dialog');
	await settlesOn(page, 'tag', 'input');
	const state = await focused(page);
	expect(state!.type).toBe('checkbox');
	expect(state!.inContent).toBe(true);
	expect(state!.focusVisible).toBe(false);
});

test('the first Tab from there lights the default button', async ({ page }) => {
	await page.goto('/dev/content-dialog');
	await settlesOn(page, 'tag', 'input');
	await page.keyboard.press('Tab');
	const state = await focused(page);
	expect(state!.tag).toBe('button');
	expect(state!.label).toBe('Save');
	expect(state!.focusVisible).toBe(true);
});

test('content that takes no focus falls through to the default button, unlit', async ({ page }) => {
	await open(page, 'Open text only');
	await settlesOn(page, 'label', 'Keep');
	const state = await focused(page);
	expect(state!.inCommands).toBe(true);
	expect(state!.focusVisible).toBe(false);
});

test('with no default button the first command button answers, unlit', async ({ page }) => {
	await open(page, 'Open text no default');
	await settlesOn(page, 'label', 'Replace');
	const state = await focused(page);
	expect(state!.inCommands).toBe(true);
	expect(state!.focusVisible).toBe(false);
});

test('an editable region in the content is a tab stop, whatever it reports', async ({ page }) => {
	await open(page, 'Open editable');
	await settlesOn(page, 'tag', 'p');
	const state = await focused(page);
	expect(state!.inContent).toBe(true);
	expect(state!.focusVisible).toBe(false);
});

test('a positive tabindex in the content is focused before what precedes it', async ({ page }) => {
	// The primitive's own autofocus would pick this element too, so the observation alone does not
	// say which code moved focus. What does: deleting the `sort` in `setInitialFocusElement` makes
	// this the only failing test, and the primitive is cancelled in the same handler.
	await open(page, 'Open tab order');
	await settlesOn(page, 'label', 'Later in the document, first in the order');
	const state = await focused(page);
	expect(state!.inContent).toBe(true);
	expect(state!.focusVisible).toBe(false);
});

test('a disabled default button declines, and the command row answers', async ({ page }) => {
	// What this pins is that a disabled default button declines — and only that. A disabled
	// default can never distinguish step two from step three, because a step that refuses focus
	// leaves the same answer behind as a step that did not run; the test above, whose default
	// button is enabled and is not the first command, is what pins the step itself.
	await open(page, 'Open text disabled default');
	await settlesOn(page, 'label', 'Keep');
	const state = await focused(page);
	expect(state!.inCommands).toBe(true);
	expect(state!.focusVisible).toBe(false);
});

test('a dialog nothing inside can focus keeps focus on the card, unlit', async ({ page }) => {
	// WD-015: upstream has no fourth step and leaves focus where it was, which is outside a
	// dialog that traps it.
	//
	// This is the one branch the rework did not change — the card is where focus already went —
	// so this test is a guard on the fourth step and not evidence of the change. Measured by
	// deleting that step: focus then stays on the trigger and `tag` reads `button`.
	await open(page, 'Open text no buttons');
	await settlesOn(page, 'tag', 'div');
	const state = await focused(page);
	expect(state!.className).toContain('card');
	expect(state!.focusVisible).toBe(false);
});

// `DefaultButtonStates` (`ContentDialog_Partial.cpp:398-440`): the default button is the accent
// one while focus is outside the command area, and inside it only while it holds focus itself.
// Pressed on the reference guest 2026-10-01 on the Gallery's first example: Tab from the CheckBox
// to `Save` kept the accent, on to `Don't Save` and `Cancel` dropped it, and Shift+Tab back to
// `Save` and then to the CheckBox drew it again.

function variantOf(page: Page, label: string) {
	return page
		.getByRole('dialog')
		.getByRole('button', { name: label, exact: true })
		.getAttribute('data-variant');
}

test('the default button is the accent one unless another command button holds focus', async ({
	page
}) => {
	await page.goto('/dev/content-dialog');
	await settlesOn(page, 'tag', 'input');
	const steps: [string, string, string][] = [
		['Tab', 'Save', 'accent'],
		['Tab', "Don't Save", 'default'],
		['Tab', 'Cancel', 'default'],
		['Shift+Tab', "Don't Save", 'default'],
		['Shift+Tab', 'Save', 'accent'],
		['Shift+Tab', '', 'accent']
	];
	expect(await variantOf(page, 'Save')).toBe('accent');
	for (const [key, label, variant] of steps) {
		await page.keyboard.press(key);
		await settlesOn(page, 'label', label);
		expect(await variantOf(page, 'Save'), `${key} to ${label || 'the CheckBox'}`).toBe(variant);
		// Only ever the default button: a focused command button is not drawn as one.
		expect(await variantOf(page, "Don't Save")).toBe('default');
		expect(await variantOf(page, 'Cancel')).toBe('default');
	}
});

test('a disabled default that focus passed over is not drawn as the default', async ({ page }) => {
	// The dialog's initial focus fell through to `Keep` (`:2039`), a command button that is not the
	// default, so upstream's state is `NoDefaultButton` — read from source, not pressed: no Gallery
	// dialog has a disabled default button.
	await open(page, 'Open text disabled default');
	await settlesOn(page, 'label', 'Keep');
	expect(await variantOf(page, 'Replace')).toBe('default');
});

test('a default button that the dialog focused itself stays the accent one', async ({ page }) => {
	// The accent was always drawn before this unit, so this does not tell the rule from its absence;
	// it pins only that a focused default keeps the accent when the focus was the dialog's own
	// (`:2027`), not a key's, which the Tab walk in the accent test above reaches.
	await open(page, 'Open text only');
	await settlesOn(page, 'label', 'Keep');
	expect(await variantOf(page, 'Keep')).toBe('accent');
});
