import { expect, test } from './fixtures';

/**
 * No text input in the library offers the browser's own history of the field. Without
 * `autocomplete="off"` Chromium drops a list of past entries under the box — drawn by the
 * browser, outside the page, so no DOM reading can see it — and no WinUI text control has one:
 * the original Gallery's search box shows none where this one did. What can be read is the
 * attribute that stops it, on every text input each route renders.
 */

const ROUTES = [
	'/dev/text-box',
	'/dev/auto-suggest-box',
	'/dev/password-box',
	// NumberBox's input gets the attribute from zag and had it before this change: a guard
	// against losing it, not one of the cases the change fixed.
	'/dev/number-box',
	// Dev fixtures that put a raw input where a consumer's content goes. They carry the
	// attribute too, so a list seen on one of these routes cannot be the fixture's own.
	'/dev/title-bar',
	'/dev/tool-tip-input-mode',
	'/dev/navigation-view-template',
	// The shell's own search box, where the list was first seen.
	'/basicinput/button'
];

for (const route of ROUTES) {
	test(`every text input on ${route} turns the browser's history off`, async ({ page }) => {
		await page.goto(route);
		const inputs = page.locator(
			'input:not([type]), input[type="text"], input[type="password"], input[type="search"]'
		);
		expect(await inputs.count(), `no text input on ${route}`).toBeGreaterThan(0);
		const missing = await inputs.evaluateAll((els) =>
			els
				.filter((el) => el.getAttribute('autocomplete') !== 'off')
				.map((el) => el.outerHTML.slice(0, 120))
		);
		expect(missing).toEqual([]);
	});
}
