import { expect, test } from './fixtures';

// `ChildrenFlyout`: a closed-compact rail draws an expanded row's children in a flyout rather
// than under the row. Before this, the rail hid them outright and a parent row was inert —
// `aria-expanded` flipped and nothing appeared, which `docs/keyboard.md`'s answer 8 records as
// measured. Nothing here is a screenshot; `/dev/navigation-view-rail` carries no baseline.
const PAGE = '/dev/navigation-view-rail';

const row = (label: string) => `[role="treeitem"]:has(> .content-presenter:text-is("${label}"))`;

test('a rail row opens its children in a flyout, at the top level and outside the pane', async ({
	page
}) => {
	await page.goto(PAGE);
	const rail = page.locator('#rail');
	const design = rail.locator(row('Design'));
	await expect(design).toHaveAttribute('aria-expanded', 'false');

	await design.click();

	await expect(design).toHaveAttribute('aria-expanded', 'true');
	const flyout = page.locator('.flyout-children');
	await expect(flyout).toBeVisible();
	// Color and Geometry, and not Color's own two: they are one level further in and the
	// flyout shows one list.
	await expect(flyout.locator('> li > [role="treeitem"]')).toHaveCount(2);

	// `PropagateDepthToChildren(0)` — NavigationViewItem.cpp:883. A flyout's rows are drawn the
	// way top-level rows are, so they carry `aria-level` 1 and no indent.
	await expect(flyout.locator(row('Color'))).toHaveAttribute('aria-level', '1');

	// And nothing is drawn under the row itself: upstream moves the one repeater rather than
	// keeping a second copy (`:875-889`).
	await expect(rail.locator('ul[role="group"]')).toHaveCount(0);

	// `Placement="RightEdgeAlignedTop"` — NavigationView.xaml:469 — with the presenter's own
	// `Margin="0,-4,0,0"` at `:474`, whose comment gives its reason: "to make the flyout align
	// exactly with the button".
	//
	// Measured against the **row**, which is what upstream anchors to (`m_rootGrid`,
	// `NavigationViewItem.cpp:824`), and not against the `<li>` this implementation hangs the
	// popup on. That is the whole point of the numbers: the `<li>` is the row plus the row's
	// own margin, so a placement that looks right against the `<li>` is 2px high and 4px right
	// against the row, and a check that only asked which side the popup was on could not see
	// it. The 4 on the x axis is `Flyout`'s own measured gap, which is its default.
	const anchor = (await design.boundingBox())!;
	const presenter = (await page.locator('.presenter:has(.flyout-children)').boundingBox())!;
	expect(presenter.x - (anchor.x + anchor.width)).toBeCloseTo(4, 0);
	expect(presenter.y - anchor.y).toBeCloseTo(-4, 0);
});

test('a parent inside the flyout draws its children in the flyout, not in a second one', async ({
	page
}) => {
	await page.goto(PAGE);
	await page.locator('#rail').locator(row('Design')).click();
	const flyout = page.locator('.flyout-children');

	await flyout.locator(row('Color')).click();

	// `IsTopLevelItem` is "my parent repeater is one of the control's own"
	// (`NavigationView.cpp:5748-5751`), not a depth — so `color`, drawn at depth 0 inside the
	// flyout, is still not top-level and keeps its children inline. A test that read rootness
	// off `aria-level` would pass with two flyouts on screen.
	await expect(page.locator('.flyout-children')).toHaveCount(1);
	await expect(flyout.locator('ul[role="group"]')).toHaveCount(1);
	await expect(flyout.locator(row('Swatches'))).toHaveAttribute('aria-level', '2');

	// WD-092 reaches all the way down, not just the flyout's first list. `inFlyout` is carried
	// through the placement record, so `Swatches` two levels in is as tooltip-free as `Color`
	// one level in — the row the primitive marks is the one that would take the Escape.
	await expect(flyout.locator('[data-tooltip-trigger]')).toHaveCount(0);
});

test('a second click on the row closes the flyout rather than leaving it open', async ({
	page
}) => {
	await page.goto(PAGE);
	const design = page.locator('#rail').locator(row('Design'));
	await design.click();
	await expect(page.locator('.flyout-children')).toBeVisible();

	await design.click();

	// The expansion is the state and the popup follows it, which is what `anchorOnly` is for:
	// the anchor keeps the primitive's identity and none of its handlers, so the click toggles
	// the expansion once rather than toggling the expansion and the popup separately. With the
	// handlers left on, the two toggles cancel and the flyout stays open.
	await expect(page.locator('.flyout-children')).toHaveCount(0);
	await expect(design).toHaveAttribute('aria-expanded', 'false');
});

test('a leaf inside the flyout invokes through the pane it was portalled out of', async ({
	page
}) => {
	await page.goto(PAGE);
	await page.locator('#rail').locator(row('Design')).click();

	await page.locator('.flyout-children').locator(row('Geometry')).click();

	// The flyout's rows are portalled to the end of the document, so nothing about them is a
	// descendant of the control any more; they reach it through the pane context. What the
	// flyout does *next* is not asserted: answer 8 records a parent with content of its own
	// swapping the content on selection, and says nothing about a leaf, so there is no
	// reference behaviour here to pin.
	// `design` is in the log first because opening the flyout invoked it: `activate()` reports
	// the invoke whether or not the row has somewhere to go, which is
	// `OnNavigationViewItemInvoked` calling `ToggleIsExpandedNavigationViewItem` and raising
	// `ItemInvoked` on the same press (NavigationView.cpp:1062).
	await expect(page.locator('#log')).toHaveText('design\ngeometry');
});

test('a click outside closes the flyout', async ({ page }) => {
	await page.goto(PAGE);
	const design = page.locator('#rail').locator(row('Design'));
	await design.click();
	await expect(page.locator('.flyout-children')).toBeVisible();

	// Beyond answer 8's record rather than in it — measured while building this, and asserted
	// so that the claim in `docs/keyboard.md` has something behind it.
	await page.locator('h1').click();

	await expect(page.locator('.flyout-children')).toHaveCount(0);
	await expect(design).toHaveAttribute('aria-expanded', 'false');
});

test('the flyout takes the padding the rail flyout is given, not a flyout default', async ({
	page
}) => {
	await page.goto(PAGE);
	await page.locator('#rail').locator(row('Design')).click();

	// `NavigationViewItemChildrenMenuFlyoutPadding` is `0,2` — left 0, top 2 — at
	// NavigationView_themeresources.xaml:267, which is 2px 0px as a CSS shorthand. The default
	// a flyout would otherwise take is `FlyoutContentPadding`, which is not this.
	const presenter = page.locator('.presenter:has(.flyout-children)');
	await expect(presenter).toHaveCSS('padding', '2px 0px');
});

test('focus lands on the flyout first row, and Escape takes one press', async ({ page }) => {
	await page.goto(PAGE);
	const design = page.locator('#rail').locator(row('Design'));
	await design.click();

	// `docs/keyboard.md`'s answer 8, pressed on the reference: "Focus lands on the flyout's
	// first item ... Escape closes it."
	const first = page.locator('.flyout-children').locator(row('Color'));
	await expect(first).toBeFocused();

	// One press, not two. WD-092: the focused row's own tooltip used to take the first, because
	// the tooltip primitive dismisses on Escape and WinUI's does not.
	await page.keyboard.press('Escape');
	await expect(page.locator('.flyout-children')).toHaveCount(0);
});

test('dismissing the flyout collapses the row it belongs to', async ({ page }) => {
	await page.goto(PAGE);
	const design = page.locator('#rail').locator(row('Design'));
	await design.click();
	await expect(page.locator('.flyout-children')).toBeVisible();

	await page.keyboard.press('Escape');

	// The expansion is the state and the popup follows it, so a dismissal the popup performs
	// itself has to come back the other way — otherwise the row would still read as expanded
	// and could not be opened again.
	await expect(page.locator('.flyout-children')).toHaveCount(0);
	await expect(design).toHaveAttribute('aria-expanded', 'false');
});

test('closing the pane collapses an expanded top-level row, and opening it puts it back', async ({
	page
}) => {
	await page.goto(PAGE);
	const frame = page.locator('#memory');
	const design = frame.locator(row('Design'));
	const state = page.locator('#pane-state');

	await design.click();
	await expect(state).toHaveText('open / design');

	// `HandleExpansionStateMemory` — NavigationViewItem.cpp:265-281 — with upstream's reason
	// at `:261-264`: "to avoid a compact state with children showing". Here that state would be
	// a flyout opening on its own as the pane shuts.
	await frame.locator('.pane-toggle').click();
	await expect(state).toHaveText('closed / none');
	await expect(design).toHaveAttribute('aria-expanded', 'false');

	await frame.locator('.pane-toggle').click();
	await expect(state).toHaveText('open / design');
	await expect(design).toHaveAttribute('aria-expanded', 'true');
});
