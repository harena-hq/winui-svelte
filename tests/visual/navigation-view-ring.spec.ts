import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// The pane's keyboard ring. Nothing here is a screenshot: `/dev/navigation-view-ring` carries
// no baseline, for the reason its own comment gives.
//
// The reference was pressed by hand on 2026-09-21 and `docs/keyboard.md` holds the answers.
// Three of them are what this file asserts — the list is one tab stop and the stop is the
// selected row (answer 1), Up and Down walk the visible rows and run into the Settings row
// where Down then scrolls the page instead (answer 2), and Home and End jump to the ends and
// do nothing when pressed again (answer 3) — plus the Up-and-Down clause of answer 8, which
// is the flyout's own ring.
const PAGE = '/dev/navigation-view-ring';

const row = (label: string) => `[role="treeitem"]:has(> .content-presenter:text-is("${label}"))`;

/** What the page says has focus. A name reads better in a diff than an element handle. */
const focused = (page: Page) => page.locator('#focused');

/**
 * Watch whether the row's handler cancelled a key, and answer **for one named key**.
 *
 * The listener is on `document` in the **bubble** phase, so it runs after the row's own
 * handler; a capture-phase listener would read `defaultPrevented` before anything could set
 * it and would report `false` for every press.
 *
 * The answer is per key rather than "the last press", and that is not tidiness: a chord
 * delivers two keydowns — `Alt` and then `' '` — and the modifier's own event is never
 * handled by a row, so a reader that took the last event would report `false` for Alt+Space
 * whether or not the Space ever arrived, and the test built on it would pass against a
 * browser that swallowed the chord. `null` means that key was not seen, which is a failure
 * rather than an answer.
 */
async function watchHandled(page: Page) {
	await page.evaluate(() => {
		const win = window as unknown as { __handled: Record<string, boolean> };
		win.__handled = {};
		document.addEventListener(
			'keydown',
			(event) => void (win.__handled[event.key] = event.defaultPrevented)
		);
	});
	return (key: string) =>
		page.evaluate((wanted) => {
			const win = window as unknown as { __handled: Record<string, boolean> };
			const answer = wanted in win.__handled ? win.__handled[wanted] : null;
			delete win.__handled[wanted];
			return answer;
		}, key);
}

test('Tab crosses the pane in one press, and the stop is the selected row', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');

	// The rule, read off the elements: one stop in the menu and one in the settings list.
	// `Design` is neither the first row nor a row without children, which is the pair of
	// mistakes a single-specimen test cannot separate. Read with focus inside the control,
	// where a Tab reaches the control's own handler and is redirected; the next test has the
	// stop with focus outside it.
	await frame.locator('.pane-toggle').focus();
	await expect(frame.locator(row('Design'))).toHaveAttribute('tabindex', '0');
	for (const label of ['Home', 'Color', 'Geometry', 'All', 'Recent', 'Archive']) {
		await expect(frame.locator(row(label))).toHaveAttribute('tabindex', '-1');
	}
	await expect(frame.locator(row('Settings'))).toHaveAttribute('tabindex', '0');
	// The chevron is this library's own box and upstream's is a `Grid` with no `IsTabStop`;
	// the press found it unreachable by key (`docs/keyboard.md`, answer 6).
	await expect(frame.locator(row('Design')).locator('.expand-chevron')).toHaveAttribute(
		'tabindex',
		'-1'
	);

	// And the same rule as presses, which is the half the attributes cannot show: that nothing
	// else sits between the toggle and the row, and that the chevron is skipped on the way out.
	await expect(focused(page)).toHaveText('selected-mid / pane toggle');
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('selected-mid / Design');
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('selected-mid / Settings');
	await page.keyboard.press('Tab');
	await expect(focused(page)).not.toHaveText(/^selected-mid/);
});

test('with focus outside the control the stop is the first row, unless a Tab is pending', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');
	const stop = async (label: string) => {
		for (const name of ['Home', 'Design']) {
			await expect(frame.locator(row(name))).toHaveAttribute(
				'tabindex',
				name === label ? '0' : '-1'
			);
		}
	};

	// The redirect onto the selected row runs only after a Tab the control's own key handler saw
	// (`m_TabKeyPrecedesFocusChange`, NavigationView.cpp:2947), and nothing has been pressed after
	// the load, so with focus outside the control the menu's stop is its first row.
	await expect(frame.locator(row('Home'))).toHaveAttribute('tabindex', '0');
	for (const label of ['Design', 'Color', 'Geometry', 'All', 'Recent', 'Archive']) {
		await expect(frame.locator(row(label))).toHaveAttribute('tabindex', '-1');
	}
	await expect(frame.locator(row('Settings'))).toHaveAttribute('tabindex', '0');

	// Inside the control, the selected row; moved to another control by script, with no key
	// pressed inside this one, the first row again.
	await frame.locator('.pane-toggle').focus();
	await stop('Design');
	const outside = page.locator('#selected-hidden .pane-toggle');
	await outside.focus();
	await stop('Home');

	// A Tab from the settings row leaves the control for the next frame's, with the Tab still
	// pending, so the stop stays on the selected row: `:3044` clears the flag only when focus
	// arrives in a root list.
	await frame.locator(row('Settings')).focus();
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('selected-hidden / pane toggle');
	await stop('Design');

	// Any other key pressed inside the control clears it as well (`OnPreviewKeyDown` and
	// `OnKeyDown`, `:3087-3126`), with focus on no row so that nothing else does.
	await frame.locator('.pane-toggle').focus();
	await stop('Design');
	await page.keyboard.press('a');
	await outside.focus();
	await stop('Home');

	// Set again, it is cleared by focus arriving on a row, and focus leaving by going nowhere is
	// outside too, the row it left included.
	await frame.locator(row('Settings')).focus();
	await page.keyboard.press('Tab');
	await stop('Design');
	await frame.locator(row('Design')).focus();
	await page.evaluate(() => (document.activeElement as HTMLElement).blur());
	await stop('Home');
});

test('a Tab handled beneath the control sets nothing, a key stopped there clears', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');
	const outside = page.locator('#selected-hidden .pane-toggle');
	// Upstream clears the flag in `OnPreviewKeyDown`, on the way down, and sets it in `OnKeyDown`,
	// which a key handled beneath the control never reaches (NavigationView.cpp:3087-3126). The
	// toggle stands in for that descendant: it cancels a Tab and stops an `a`, and each is
	// pressed once below.
	await frame.locator('.pane-toggle').evaluate((toggle: HTMLElement) => {
		toggle.addEventListener('keydown', (event) => {
			if (event.key === 'Tab') event.preventDefault();
			if (event.key === 'a') event.stopPropagation();
		});
	});

	await frame.locator('.pane-toggle').focus();
	await page.keyboard.press('Tab');
	// The Tab was cancelled, so focus reached no row that could have cleared the flag instead.
	await expect(focused(page)).toHaveText('selected-mid / pane toggle');
	await outside.focus();
	await expect(frame.locator(row('Home'))).toHaveAttribute('tabindex', '0');

	// Set the flag with a Tab nothing cancels, from the settings row into the next frame.
	await frame.locator(row('Settings')).focus();
	await page.keyboard.press('Tab');
	await expect(frame.locator(row('Design'))).toHaveAttribute('tabindex', '0');
	await frame.locator('.pane-toggle').focus();
	await page.keyboard.press('a');
	await outside.focus();
	await expect(frame.locator(row('Home'))).toHaveAttribute('tabindex', '0');
});

test('a Tab from a row that is not the stop leaves the list, in either direction', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');

	// The walk out of the repeater (NavigationView.cpp:3018): a Tab from any row of it finds the
	// next stop outside it, so `Design`, selected and after `Home`, is not where it goes.
	await frame.locator('.pane-toggle').focus();
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('selected-mid / Design');
	await page.keyboard.press('ArrowUp');
	await expect(focused(page)).toHaveText('selected-mid / Home');
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('selected-mid / Settings');

	// Shift+Tab from the settings row comes from another root list, so it is redirected onto
	// the selected row (`:2986`), and from a row before it leaves backwards to the toggle.
	await page.keyboard.press('Shift+Tab');
	await expect(focused(page)).toHaveText('selected-mid / Design');
	await page.keyboard.press('ArrowUp');
	await page.keyboard.press('Shift+Tab');
	await expect(focused(page)).toHaveText('selected-mid / pane toggle');

	// Focus on the toggle is on no row, so the stop is the selected row again rather than the
	// row the focus left.
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('selected-mid / Design');
});

test('a Tab from the Gallery title bar enters at the first row or the selected one', async ({
	page
}) => {
	// The presses measured on the reference: the Gallery's title bar is outside its
	// NavigationView (MainWindow.xaml:23-61, the control at :137), so a Tab from the search box
	// reached `Home` rather than the selected page's row; a Shift+Tab from `Home` back to the
	// search box left the Tab pending, and the next Tab reached the selected row. Every frame
	// on the harness page starts with a pane toggle of its own, inside the control, which is
	// why this is pressed here.
	await page.goto('/basicinput/button');
	// The page focuses its own header once loaded, inside the control; wait for it, so that it
	// cannot take the focus back from the search box.
	await expect(page.getByRole('button', { name: 'API details' })).toBeFocused();
	await page.getByRole('combobox').first().focus();
	await page.keyboard.press('Tab');
	await expect(page.locator(row('Home'))).toBeFocused();
	await page.keyboard.press('Shift+Tab');
	await expect(page.getByRole('combobox').first()).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(page.locator(row('Button'))).toBeFocused();
	await page.keyboard.press('Tab');
	await expect(page.locator(row('Settings'))).toBeFocused();
});

test('Down walks the visible rows, steps over a header, and reaches the settings row', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');
	await frame.locator(row('Design')).focus();

	// Design is expanded, so its two children are in the ring; `More` is a header, which draws
	// no `treeitem` at all; `All` is the row after it and is expanded as well, so the walk
	// descends into it before it reaches the settings row.
	for (const next of ['Color', 'Geometry', 'All', 'Recent', 'Archive', 'Settings']) {
		await page.keyboard.press('ArrowDown');
		await expect(focused(page)).toHaveText(`selected-mid / ${next}`);
	}
	// Up returns across the same boundary, which is what answer 2 pressed — onto the last
	// visible row above it, which is a child rather than the parent it belongs to.
	await page.keyboard.press('ArrowUp');
	await expect(focused(page)).toHaveText('selected-mid / Archive');
});

test('Down on the settings row moves nothing and leaves the key unhandled', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');
	const handled = await watchHandled(page);
	await frame.locator(row('Settings')).focus();

	// Two predictions, and the second is the one that fails if the ring wraps or if every key
	// it recognises is cancelled: focus does not move, **and** the key is left alone. At the
	// foot of the reference's ring Down scrolled the page the sample sits on, which a
	// `preventDefault()` here would have cancelled.
	await page.keyboard.press('ArrowDown');
	await expect(focused(page)).toHaveText('selected-mid / Settings');
	expect(await handled('ArrowDown')).toBe(false);
});

test('a collapsed row is stepped past rather than opened', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-hidden');
	const color = frame.locator(row('Color'));
	await expect(color).toHaveAttribute('aria-expanded', 'false');

	await color.focus();
	await page.keyboard.press('ArrowDown');

	// `Swatches` is inside `Color` and is not in the document while it is shut, so the next
	// visible row is its sibling. Answer 2: "Down does not expand; it steps past."
	await expect(focused(page)).toHaveText('selected-hidden / Geometry');
	await expect(color).toHaveAttribute('aria-expanded', 'false');
});

test('Home and End reach the ends of one root list, and are handled either way', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');
	const handled = await watchHandled(page);
	await frame.locator(row('Geometry')).focus();

	await page.keyboard.press('Home');
	await expect(focused(page)).toHaveText('selected-mid / Home');
	expect(await handled('Home')).toBe(true);

	// **The scope is the list's own rows, and it is wrong in two directions at once.** Three
	// elements are candidates for "the end" here and the test has to reject two of them:
	// `Settings`, which the arrows reach and End does not, because
	// `KeyboardFocusLastItemFromItem` asks one root repeater rather than deferring to
	// directional focus (`NavigationView.cpp:2921`, `:2932`); and `Archive`, the last row
	// *visible* under the menu, because `GetLastFocusableElement` walks that repeater's own
	// `ItemsSourceView` (`:2876`) and never descends into a child repeater. `All` is the last
	// of the list's own rows and is expanded, which is what makes the second rejection
	// possible at all — with a leaf at the foot the two answers are the same element.
	await page.keyboard.press('End');
	await expect(focused(page)).toHaveText('selected-mid / All');

	// Pressed again at the end it does nothing — and is still handled, which is the assertion
	// that separates this from "the key was ignored". `args.Handled(true)` runs before the call
	// at `NavigationView.cpp:2761`, so upstream consumes it whatever the call then finds.
	await page.keyboard.press('End');
	await expect(focused(page)).toHaveText('selected-mid / All');
	expect(await handled('End')).toBe(true);

	// The settings row is a root list of one, so it is both ends of its own.
	await frame.locator(row('Settings')).focus();
	await page.keyboard.press('Home');
	await expect(focused(page)).toHaveText('selected-mid / Settings');
	expect(await handled('Home')).toBe(true);
});

test('a selection inside a collapsed subtree stops at the deepest row on screen', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-hidden');

	// `Swatches` is selected and `Color` is shut, so the selected row is not in the document.
	// `GetContainerForIndexPath(selectedIndex, lastVisible = true)` — NavigationView.cpp:2988 —
	// walks the path while each row above is expanded and stops at the last one reached.
	await expect(frame.locator(row('Swatches'))).toHaveCount(0);
	await frame.locator('.pane-toggle').focus();
	await expect(frame.locator(row('Color'))).toHaveAttribute('tabindex', '0');
	for (const label of ['Home', 'Design', 'Geometry', 'All']) {
		await expect(frame.locator(row(label))).toHaveAttribute('tabindex', '-1');
	}

	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('selected-hidden / Color');
});

test('with no selection every row is an ordinary tab stop', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#no-selection');

	// Both of upstream's branches are guarded by `m_selectionModel.SelectedIndex()`, so with
	// no selection neither fires. This is the pin's own guard rather than a default.
	for (const label of ['Home', 'Design', 'All', 'Settings']) {
		await expect(frame.locator(row(label))).toHaveAttribute('tabindex', '0');
	}

	await frame.locator('.pane-toggle').focus();
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('no-selection / Home');
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('no-selection / Design');

	// The arrows are unaffected: `HandleKeyEventForNavigationViewItem` does not consult the
	// selection, so the ring is the same ring whether or not the list has one.
	await page.keyboard.press('ArrowDown');
	await expect(focused(page)).toHaveText('no-selection / All');
});

test('a rail stops at its selected row and Settings, and rings over its top level', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#rail');

	// A rail force-collapses its top level, so `Design`'s children are not under it — which is
	// why `Home` and `Settings` are the pane's two stops and `Design` and `All` are not. Read
	// from inside the control, because `Home` is also the first row, the stop from outside.
	await frame.locator('.pane-toggle').focus();
	await expect(frame.locator(row('Home'))).toHaveAttribute('tabindex', '0');
	await expect(frame.locator(row('Design'))).toHaveAttribute('tabindex', '-1');
	await expect(frame.locator(row('All'))).toHaveAttribute('tabindex', '-1');
	await expect(frame.locator(row('Settings'))).toHaveAttribute('tabindex', '0');

	// And as presses. The pane toggle is not a pane row and is a stop in every frame on this
	// page — the first test treats it as outside the ring — so it is where the walk starts
	// rather than something this counts.
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('rail / Home');
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('rail / Settings');

	await frame.locator(row('Home')).focus();
	await page.keyboard.press('ArrowDown');
	await expect(focused(page)).toHaveText('rail / Design');
	await page.keyboard.press('ArrowDown');
	await expect(focused(page)).toHaveText('rail / All');
	await page.keyboard.press('ArrowDown');
	await expect(focused(page)).toHaveText('rail / Settings');
});

test('the rail flyout is a ring of its own, and the arrows do not leave it', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#rail');
	await frame.locator(row('Design')).click();

	const flyout = page.locator('.flyout-children');
	await expect(flyout).toBeVisible();
	// Focus lands on the flyout's first row — `navigation-view-rail.spec.ts` asserts that for
	// its own reason; here it is the starting point.
	await expect(focused(page)).toHaveText('flyout / Color');

	// Every row inside the flyout keeps its own tab stop: both halves of
	// `OnRepeaterGettingFocus` test the *root* repeater, and the flyout's is the reparented
	// children one.
	await expect(flyout.locator(row('Color'))).toHaveAttribute('tabindex', '0');
	await expect(flyout.locator(row('Geometry'))).toHaveAttribute('tabindex', '0');

	await page.keyboard.press('ArrowDown');
	await expect(focused(page)).toHaveText('flyout / Geometry');

	// **What each of the two presses above separates, named, because they are not the same
	// question.** The first — Color to Geometry — is what exercises the marker: the flyout is
	// portalled out of the pane, so without a ring root on its own list `closest` finds none
	// and nothing moves at all. The second is about the end: the flyout is the last thing in
	// the document, so a ring rooted anywhere would also find nothing below `Geometry` — what
	// this rejects is a **wrap**, not a wider root.
	await page.keyboard.press('ArrowDown');
	await expect(focused(page)).toHaveText('flyout / Geometry');

	await page.keyboard.press('ArrowUp');
	await expect(focused(page)).toHaveText('flyout / Color');
	await page.keyboard.press('End');
	await expect(focused(page)).toHaveText('flyout / Geometry');
	await page.keyboard.press('Home');
	await expect(focused(page)).toHaveText('flyout / Color');
});

test('a row hidden by visibility is not in the ring', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');

	// **A manufactured specimen, and it is manufactured because the real one is one press
	// away from unreachable.** `moveRingFocus` filters on `checkVisibility` rather than on
	// `offsetParent`, because the only shape in this control that hides a row without taking
	// it out of the document is the minimal pane closed — `visibility: hidden` on `.pane`,
	// which leaves every row laid out and gives each an `offsetParent`. Getting focus onto a
	// row and then closing a minimal pane is a contrivance of its own, and it would test the
	// filter through two mechanisms instead of one. So the row is hidden here directly: the
	// claim under test is "a row hidden this way is not a candidate", and this is that claim
	// with nothing else in it.
	await frame.locator(row('Geometry')).evaluate((el) => (el.style.visibility = 'hidden'));

	await frame.locator(row('Color')).focus();
	await page.keyboard.press('ArrowDown');

	// **Two routes reach this assertion and only one of them is the filter**, which is worth
	// saying because it changes what a failure here means. Without the filter `Geometry` is the
	// next candidate and `focus()` on a `visibility: hidden` element is a no-op, so focus would
	// stay on `Color` — the test fails, but by the browser refusing the focus rather than by
	// the row being skipped. The reading that separates them is the name below: `All` is the
	// row *after* the hidden one, which only a candidate set that omits it can reach.
	await expect(focused(page)).toHaveText('selected-mid / All');
});

test('a rail row is the stop while its flyout is shut, and is not while it is open', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#rail');
	const design = frame.locator(row('Design'));

	await design.click();
	await page.locator('.flyout-children').locator(row('Color')).click();

	// `Color` is now selected and is two levels down, and **no rail row is a stop** while the
	// flyout is open. Focus is on `Color` in the flyout here, so what this half reads is the
	// focused row's answer; the walk, which would land in the flyout too (upstream descends
	// through the row's own repeater, and a rail row's is the one reparented into the flyout),
	// cannot be read past an open flyout, which holds focus.
	await expect(design).toHaveAttribute('tabindex', '-1');
	await expect(frame.locator(row('Home'))).toHaveAttribute('tabindex', '-1');

	// Shut it, and the same selection resolves one level up, because the walk stops at a row
	// that is not expanded. Same rule, same selection, opposite answer — which is what makes
	// this pair a test of the walk rather than of the rail.
	await page.keyboard.press('Escape');
	await expect(page.locator('.flyout-children')).toHaveCount(0);
	// Escape hands focus back to `Design`, and a focused row is its list's stop whatever the
	// walk says, so focus moves to the toggle first: still inside the control, on no row.
	await frame.locator('.pane-toggle').focus();
	await expect(design).toHaveAttribute('tabindex', '0');
});

test('the settings row selected leaves the menu entered at its first row', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');

	await frame.locator(row('Settings')).click();

	// The settings row is a root list of its own, so its index is in the footer block and
	// `rootRepeaterForSelectedItem` (`NavigationView.cpp:2980`) points there. A Tab entering the
	// *menu's* repeater is therefore not redirected onto anything — and the menu is still one
	// press, because the branch that walks the rows out (`:3018`) does not consult the selection.
	// So the menu's stop is its first row, which is not the row that was selected and not the row
	// that was selected before it either.
	await expect(frame.locator(row('Home'))).toHaveAttribute('tabindex', '0');
	await expect(frame.locator(row('Design'))).toHaveAttribute('tabindex', '-1');
	await expect(frame.locator(row('Settings'))).toHaveAttribute('tabindex', '0');

	await frame.locator('.pane-toggle').focus();
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('selected-mid / Home');
});

test('a selection that names no row is not a selection', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-unknown');

	// `m_selectionModel.SelectedIndex()` guards the whole of `OnRepeaterGettingFocus`
	// (`NavigationView.cpp:2947`), and an id that matches no row leaves the model with no index,
	// so neither branch runs. **This is the branch the first draft got wrong**: it treated an
	// unfound id the way it treats the settings row and made the first row the only stop, which
	// is a different rule reached by the same code path.
	for (const label of ['Home', 'Design', 'All', 'Settings']) {
		await expect(frame.locator(row(label))).toHaveAttribute('tabindex', '0');
	}

	await frame.locator('.pane-toggle').focus();
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('selected-unknown / Home');
	await page.keyboard.press('Tab');
	await expect(focused(page)).toHaveText('selected-unknown / Design');
});

test('Alt+Space is left alone, so the system menu can have it', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');
	const design = frame.locator(row('Design'));
	const handled = await watchHandled(page);

	await design.focus();
	await expect(design).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('Alt+ ');

	// Three predictions, and the third is what stops the other two from passing vacuously: the
	// row does not toggle, the key is left unhandled, **and the key arrived at all**. A chord
	// delivers `Alt` first, and a reader that answered for the last press would report the
	// modifier's own unhandled event whether or not the Space followed — so `handled(' ')`
	// returning `null` for "never seen" is the assertion that the browser really does deliver
	// it. `HandleKeyEventForNavigationViewItem` puts `args.Handled(true)` inside the
	// `!isAltPressed` branch (`NavigationView.cpp:2749-2752`), so the chord reaches the window
	// menu with nothing consumed.
	await expect(design).toHaveAttribute('aria-expanded', 'true');
	expect(await handled(' ')).toBe(false);
});

test('an open rail flyout holds focus, so Tab never reaches the pane behind it', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#rail');
	await frame.locator(row('Design')).click();
	await page.locator('.flyout-children').locator(row('Color')).click();

	// **This is the half of upstream's redirect that a different mechanism supplies, and it is
	// measured because reasoning got it wrong.** Upstream's `:2989` puts focus on the flyout's
	// row when a Tab arrives at the rail. `Flyout` wraps a bits-ui popover and passes no
	// `trapFocus`, which defaults on, so focus cannot leave the flyout at all — a stronger
	// condition than the redirect, and the reason a comment that reasoned from document order
	// to "the Tab lands on the settings row" was wrong in both directions.
	await frame.locator('.pane-toggle').focus();
	await expect(focused(page)).toHaveText(/^flyout/);

	// And Tab stays inside, over the flyout's own rows — `Color` is expanded here, so its two
	// children are among them. Where the fourth press goes is the trap's wrap and not the
	// arrows' ring, which does not wrap; the two are different mechanisms over the same rows.
	for (const next of ['Swatches', 'Gradients', 'Geometry', 'Color']) {
		await page.keyboard.press('Tab');
		await expect(focused(page)).toHaveText(`flyout / ${next}`);
	}
});

test('Up from the first row reaches the pane toggle, and Down comes back', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');
	const handled = await watchHandled(page);

	// **The head of the ring, which the 2026-09-21 sitting never measured and the 2026-09-22
	// one did.** Upstream reaches it by *declining*: `FindNextElement(Up)` returns the toggle,
	// which is not a `NavigationViewItem`, so `FocusNextUpItem`'s correction is skipped
	// (`NavigationView.cpp:2786`), `Depth()` is 0 so the climb at `:2822` is skipped, and XAML's
	// own directional navigation moves focus. The web has none, so this moves it explicitly.
	await frame.locator(row('Home')).focus();
	await page.keyboard.press('ArrowUp');
	await expect(focused(page)).toHaveText('selected-mid / pane toggle');
	expect(await handled('ArrowUp')).toBe(true);

	// And back down, pressed in the same sitting: Down on the hamburger enters the first row.
	// Nothing subscribes to the toggle's keys upstream, so the same platform navigation that
	// carries Up out of the pane carries Down back in.
	await page.keyboard.press('ArrowDown');
	await expect(focused(page)).toHaveText('selected-mid / Home');
	expect(await handled('ArrowDown')).toBe(true);
});

test('the walk from the settings row reaches the toggle, crossing every visible row', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#selected-mid');

	// The press the user reported, end to end: from the settings row, Up walks back through
	// every row two expanded subtrees put on screen and then leaves the pane for the toggle.
	// Written as one walk rather than as two tests because what was reported is the walk — a
	// ring that stops one row short is the defect, and only the last step of a traversal can
	// show it.
	await frame.locator(row('Settings')).focus();
	for (const next of ['Archive', 'Recent', 'All', 'Geometry', 'Color', 'Design', 'Home']) {
		await page.keyboard.press('ArrowUp');
		await expect(focused(page)).toHaveText(`selected-mid / ${next}`);
	}
	await page.keyboard.press('ArrowUp');
	await expect(focused(page)).toHaveText('selected-mid / pane toggle');
});

test('the rail reaches its toggle too, over its own three rows', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#rail');

	// A rail's ring is shorter and ends the same way. This is the frame the defect was reported
	// on, and the one where the head is hardest to reach by pointer.
	await frame.locator(row('Settings')).focus();
	for (const next of ['All', 'Design', 'Home']) {
		await page.keyboard.press('ArrowUp');
		await expect(focused(page)).toHaveText(`rail / ${next}`);
	}
	await page.keyboard.press('ArrowUp');
	await expect(focused(page)).toHaveText('rail / pane toggle');
});
