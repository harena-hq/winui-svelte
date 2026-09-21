import { expect, test } from './fixtures';

// The control's first keyboard assertion, and ADR 0015's deferred item 2 is why it is here:
// the row's `keydown` handler used to act on every key that reached it, and a row that is
// about to hold a consumer's content reaches a great many. The row now acts only on a key
// aimed at the row itself, which is what upstream's routing does — `NavigationView`
// subscribes to each item's `KeyDown` plainly (`NavigationView.cpp:3595`) and never asks for
// already-handled events.
//
// The chevron is what makes that observable today. It is the one focusable box inside a row,
// it is a `<button>`, and its own job is to toggle without invoking — which is what a pointer
// already gets, because its click handler stops the event. Before this, Space on a focused
// chevron ran the *row's* handler instead: the row's `preventDefault()` also cancelled the
// button's own activation, so one press both collapsed the section and navigated away from
// the page inside it. Both presses below collapse; only the URL tells them apart.
//
// Driven on the shell rather than on `/dev/navigation-view`, as `pane-expansion.spec.ts` is
// and for the same reason: the shell is where invoking a row has a consequence a test can
// read without the harness reporting on itself.
const row = (label: string) => `[role="treeitem"]:has(> .content-presenter:text-is("${label}"))`;

test('Space on the expand chevron collapses the section and does not invoke it', async ({
	page
}) => {
	await page.goto('/basicinput/button');
	const section = page.locator(row('Basic input'));
	await expect(section).toHaveAttribute('aria-expanded', 'true');

	await section.locator('.expand-chevron').focus();
	await page.keyboard.press('Space');

	await expect(section).toHaveAttribute('aria-expanded', 'false');
	expect(new URL(page.url()).pathname).toBe('/basicinput/button');
});

// This one cannot disagree with the guard above it, and that is not a defect in it: a focused
// row satisfies `target === currentTarget` whether the guard is there or not. It is here for
// the mistakes the guard could have been instead — an inverted test, or an over-broad one
// keyed on `defaultPrevented` or on `closest()` — each of which this would catch and the
// chevron test would not.
test('Space on the row itself still invokes it', async ({ page }) => {
	await page.goto('/basicinput/button');
	const section = page.locator(row('Basic input'));

	await section.focus();
	await page.keyboard.press('Space');

	// `OnNavigationViewItemInvoked` toggles expansion unconditionally, so the same press does
	// both — NavigationView.cpp:1062, which pane-expansion.spec.ts asserts for the pointer.
	await expect(section).toHaveAttribute('aria-expanded', 'false');
	await expect(page).toHaveURL(/\/basicinput$/);
});
