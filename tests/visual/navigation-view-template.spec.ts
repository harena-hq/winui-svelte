import { expect, test } from './fixtures';

// ADR 0015's `menuItemTemplate`: the control hands each entry to a snippet the consumer wrote,
// and the snippet draws the row. Nothing here is a screenshot — every assertion is about which
// element drew a row and what an event did. The page's three-theme baseline is
// `navigation-view-item.spec.ts`'s, and `/dev/navigation-view` stays the page the control's own
// three describe.
//
// Two of these are the first tests of decisions taken without a press to measure. The space
// typed into a field inside a row is the case ADR 0015's deferred item 2 exists for and the one
// `docs/keyboard.md`'s entry 9 could not ask of the reference: until a consumer could put an
// element in the content cell, the row's keydown guard had only the expand chevron to be
// observed through. The two clicks below are WD-090, asserted in both directions — the button
// that stops the event does not invoke the row and the field that does not stop it does.
const PAGE = '/dev/navigation-view-template';

test('the template draws every row, and the header too', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#templated');

	// Home, Design, Design's two children while it is expanded, and Commands. Rename draws a
	// field instead of a label, which is why it is not in this count.
	await expect(frame.locator('.tpl-label')).toHaveCount(5);
	await expect(frame.locator('.tpl-rename')).toHaveCount(1);

	// The entry the snippet was handed is the consumer's own record, not a copy narrowed to
	// what the control reads: `note` is a field of the harness's row type and of nothing in
	// the library. Its presence here is the run-time half of `items` being generic; the
	// compile-time half is that `entry.note` type-checks in the page at all.
	await expect(frame.locator('.tpl-label', { hasText: 'Home' })).toHaveAttribute(
		'data-note',
		'plain'
	);

	// The header is the half that reproduces `MenuItemTemplateSelector`: the control draws none
	// of its own once a template is set.
	await expect(frame.locator('.tpl-header')).toHaveText('Consumer rows');
	await expect(frame.locator('.item-header')).toHaveCount(0);

	// And it is not wrapped in a row. WD-091: a snippet that draws something other than a
	// `NavigationViewItem` is rendered as it stands, where upstream's factory would have put it
	// on a generated container (`NavigationViewItemsFactory.cpp:58-69`, `:71-85`). The header
	// branch is that case, reached by the control's own entry rather than by a consumer's
	// mistake.
	await expect(frame.locator('[role="treeitem"]:has(.tpl-header)')).toHaveCount(0);

	// The row the consumer drew is still the control's row: `tag` is what `selected` is matched
	// against, and the page passes `selected='home'`.
	const home = frame.locator('[role="treeitem"]').filter({
		has: page.locator('.tpl-label', { hasText: 'Home' })
	});
	// One attribute, not two: `data-selected` is the same `isSelected` on the same element, so
	// a pair here would be one claim asserted twice.
	await expect(home).toHaveAttribute('aria-selected', 'true');

	// And the control still draws its own when there is no template, which is what makes the
	// prop additive rather than a replacement.
	const plain = page.locator('#untemplated');
	await expect(plain.locator('.item-header')).toHaveText('Consumer rows');
	// Its rows carry the control's own label cell, `data-label` and all. Asserting that
	// `.tpl-label` is absent here would prove nothing — that class is the harness's, written
	// only by a snippet this frame is not given, so no change to the library could make it
	// appear.
	await expect(plain.locator('.content-presenter[data-label]').first()).toHaveText('Home');
});

test('the index is the entry position in the list it came from', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#templated');

	// Top level: Home is 0, Design is 1, the header is 2, Commands is 4.
	await expect(frame.locator('.tpl-label', { hasText: 'Home' })).toHaveAttribute('data-index', '0');
	await expect(frame.locator('.tpl-label', { hasText: 'Design' })).toHaveAttribute(
		'data-index',
		'1'
	);
	await expect(frame.locator('.tpl-header')).toHaveAttribute('data-index', '2');
	await expect(frame.locator('.tpl-label', { hasText: 'Commands' })).toHaveAttribute(
		'data-index',
		'4'
	);

	// A row's children go through the same template — upstream gives an item's own repeater the
	// same factory the control's repeaters get (`NavigationViewItem.cpp:171`) — and the index
	// restarts, because it is the child's position among its siblings.
	await expect(frame.locator('.tpl-label', { hasText: 'Color' })).toHaveAttribute(
		'data-index',
		'0'
	);
	await expect(frame.locator('.tpl-label', { hasText: 'Geometry' })).toHaveAttribute(
		'data-index',
		'1'
	);
});

test("a row takes a consumer's class, style and attributes on its root, and ref on the row", async ({
	page
}) => {
	await page.goto(PAGE);
	const row = page.locator('li[data-tpl-row]').first();
	await expect(row).toHaveClass(/\btpl-row\b/);
	await expect(row).toHaveAttribute('style', /color: inherit/);
	await expect(page.locator('output[data-row-ref]')).toHaveAttribute('data-row-ref', 'treeitem');
	// The name goes to the row, as on the release's other wrapper-rooted controls: ADR 0009.
	await expect(row).not.toHaveAttribute('aria-label');
	await expect(row.getByRole('treeitem', { name: 'Rename row' })).toBeVisible();
});

test('the settings row is never templated', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#templated');

	// `NavigationViewItemsFactory::GetElementCore` returns the settings item ahead of both of
	// its branches — NavigationViewItemsFactory.cpp:39-43.
	// The footer list is where the control renders it, and it is the one list on this page the
	// template never reaches.
	const settings = frame.locator('.footer-items [role="treeitem"]');
	await expect(settings).toHaveCount(1);
	// `data-label` is the marker the row puts on a content cell it drew as a string, so its
	// presence is the row saying it drew this one itself.
	await expect(settings.locator('.content-presenter[data-label]')).toHaveText('Settings');
	await expect(settings.locator('.tpl-label, .tpl-rename, .tpl-command')).toHaveCount(0);
});

test('the expand chevron inside a templated row toggles without invoking', async ({ page }) => {
	await page.goto(PAGE);
	const frame = page.locator('#templated');
	// The row the consumer drew, and the chevron is the control's own element inside it — which
	// is what makes this the one place WD-090's accepted half is already exercised by the
	// library rather than by the harness: `toggle` stops the click so the row's `activate()`
	// does not also run.
	const design = frame.locator('[role="treeitem"]').filter({
		has: page.locator('.tpl-label', { hasText: 'Design' })
	});
	await expect(design).toHaveAttribute('aria-expanded', 'true');

	await design.locator('.expand-chevron').click();

	await expect(design).toHaveAttribute('aria-expanded', 'false');
	await expect(page.locator('#log')).toHaveText('nothing invoked yet');
});

test('the top pane does not call the template — WD-089', async ({ page }) => {
	await page.goto(PAGE);
	const top = page.locator('#top');

	// Upstream sets one factory on all five of its repeaters (`NavigationView.cpp:470`, `:492`,
	// `:511`, `:557`, `:580`). This library's top pane draws `NavigationViewTopItem` instead, so
	// the snippet is never called — and the frame's own template draws a marked element, which
	// is what makes a call visible rather than indistinguishable from the control's own row.
	await expect(top.locator('.tpl-label')).toHaveCount(0);
	// WD-089's third list, the top pane's overflow flyout, is not reached here: it exists only
	// when the items do not fit, and these four do. It draws `NavigationViewTopItem` from the
	// same array this frame's bar does.

	// And the control's own top rows are there, so this is the template being skipped rather
	// than the pane being empty. Four, not five: the menu's header is not a row, and the top
	// pane's settings item is given an empty content, so `NavigationViewTopItem`'s
	// `{#if item.content}` draws no `.content` span for it. (That empty content is deliberate
	// upstream too — it is what puts the presenter in `IconOnly` — but the reason our span is
	// missing is the `{#if}`, not that state.)
	await expect(top.locator('[role="treeitem"] .content')).toHaveCount(4);
});

test('a space typed into a field inside a row reaches the field and does not invoke it', async ({
	page
}) => {
	await page.goto(PAGE);
	const field = page.locator('#templated .tpl-rename');

	// Focused rather than clicked: a click on this field invokes the row, which is the next
	// test and would make this one's log assertion meaningless.
	await field.focus();
	await page.keyboard.press('End');
	await page.keyboard.press('Space');

	// Both halves disagree if the row's keydown guard goes: the row's `preventDefault()` would
	// swallow the space *and* its `activate()` would report an invoke.
	await expect(field).toHaveValue('typed: ');
	await expect(page.locator('#log')).toHaveText('nothing invoked yet');
});

test('a descendant that stops the click does not invoke the row, and one that does not does', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#templated');

	// WD-090's accepted half: the per-row command declines the invoke by stopping the event,
	// which is what this control's own expand chevron does. Upstream's row declines for free —
	// `ButtonBase::OnPointerPressed` marks the press handled (`ButtonBase_Partial.cpp:699`), so
	// the row's own pressed flag is never set — and the stop is what stands in for that.
	await frame.locator('.tpl-command').click();
	await expect(page.locator('#log')).toHaveText('command:commands');

	// And the divergence itself: nothing stops this click, so the row invokes. Whether upstream's
	// row would is the half the pin does not answer directly for a field — `docs/keyboard.md`'s
	// answer 9 has what it does offer — which is why WD-090 is written about the mechanism.
	await frame.locator('.tpl-rename').click();
	await expect(page.locator('#log')).toHaveText('command:commands\nrename');
});
