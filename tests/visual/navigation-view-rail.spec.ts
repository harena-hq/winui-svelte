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
	// The `.item-presenter` step is `NavigationViewItemPresenter`, which the row now sits inside —
	// NavigationView.xaml:462. Keeping the path explicit is the point: a descendant selector
	// here would count the grandchildren this assertion exists to exclude.
	await expect(flyout.locator('> li > .item-presenter > [role="treeitem"]')).toHaveCount(2);

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
	// Measured against the `<li>`, which is the element the popup is anchored to and the box
	// upstream anchors to: `ShowAttachedFlyout(m_rootGrid.get())` (`NavigationViewItem.cpp:824`).
	// It shares its left, right and top with the row inside it and is taller — it also holds
	// the children list — and those three edges are the ones these two numbers read.
	//
	// Not the fill: the fill is inset by `NavigationViewItemButtonMargin`, so asking the same
	// two questions of it moves both answers by that margin — 4 on x and 2 on y — and a check
	// written against the fill cannot tell the two boxes apart.
	//
	// **4 on the x axis.** Upstream's `Right` mode first places the flyout flush,
	// `*pControlPos = anchorPos + anchorSize` (`FlyoutBase_partial.cpp:386`, reached at
	// `:457-464`), and then adds `FlyoutMargin`, 4 (`:65`), towards where it opens (`:2622-2640`).
	// The -4 on the y axis is the presenter style's `Margin="0,-4,0,0"` on top of
	// `PreferredJustification::Top`, which is `*pControlPos = anchorPos` (`:99-101`, `:331-333`),
	// and gets no margin, as the flyout does not open upwards.
	const anchor = (await design.locator('xpath=ancestor::li[1]').boundingBox())!;
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

	// WD-092 reaches all the way down, not just the flyout's first list. `flyoutOwner` is carried
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

test('a leaf inside the flyout invokes through the pane, and closes the flyout', async ({
	page
}) => {
	await page.goto(PAGE);
	const design = page.locator('#rail').locator(row('Design'));
	await design.click();

	await page.locator('.flyout-children').locator(row('Geometry')).click();

	// The flyout's rows are portalled to the end of the document, so nothing about them is a
	// descendant of the control any more; they reach it through the pane context.
	// `design` is in the log first because opening the flyout invoked it: `activate()` reports
	// the invoke whether or not the row has somewhere to go, which is
	// `OnNavigationViewItemInvoked` calling `ToggleIsExpandedNavigationViewItem` and raising
	// `ItemInvoked` on the same press (NavigationView.cpp:1062).
	await expect(page.locator('#log')).toHaveText('design\ngeometry');
	// `CloseFlyoutIfRequired` (NavigationView.cpp:360-390): a leaf collapses the top-level row
	// the flyout belongs to. A parent inside the flyout keeps it open, as the test above shows.
	// Focus goes back to the row the flyout opened from, which stays mounted.
	await expect(page.locator('.flyout-children')).toHaveCount(0);
	await expect(design).toHaveAttribute('aria-expanded', 'false');
	await expect(design).toBeFocused();
});

test('a leaf chosen with the keyboard closes the flyout the same way', async ({ page }) => {
	await page.goto(PAGE);
	const design = page.locator('#rail').locator(row('Design'));
	await design.click();
	const flyout = page.locator('.flyout-children');
	await expect(flyout.locator(row('Color'))).toBeFocused();

	await page.keyboard.press('ArrowDown');
	await expect(flyout.locator(row('Geometry'))).toBeFocused();
	await page.keyboard.press('Enter');

	await expect(page.locator('#log')).toHaveText('design\ngeometry');
	await expect(flyout).toHaveCount(0);
	await expect(design).toHaveAttribute('aria-expanded', 'false');
	await expect(design).toBeFocused();
});

test('a leaf two levels into the flyout closes it too', async ({ page }) => {
	await page.goto(PAGE);
	const design = page.locator('#rail').locator(row('Design'));
	await design.click();
	const flyout = page.locator('.flyout-children');
	await flyout.locator(row('Color')).click();

	await flyout.locator(row('Swatches')).click();

	// Upstream collapses the container at the selection's top-level index
	// (`GetContainerForIndex(selectedIndex.GetAt(1), …)`, NavigationView.cpp:378), whatever the
	// leaf's depth, so the row whose flyout this is folds, not `color`.
	await expect(flyout).toHaveCount(0);
	await expect(design).toHaveAttribute('aria-expanded', 'false');
	await expect(design).toBeFocused();
	// `color` keeps its own expansion, so the flyout opens again on it.
	await design.click();
	await expect(flyout.locator(row('Color'))).toHaveAttribute('aria-expanded', 'true');
	await expect(flyout.locator(row('Swatches'))).toBeVisible();
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

// **The popup layer, asserted where the defect was seen.** A portalled element lands in
// `<body>` with `z-index: auto`, which puts it above ordinary content by tree order and below
// any positioned element carrying a positive one. This control has two — the pane at 1 and the
// pane-toggle holder at 100, reproducing `PaneToggleButtonGrid`'s `Canvas.ZIndex="100"` — and a
// rail row's tooltip opens upwards, over the toggle. Before the layer the toggle was drawn on
// top of an opaque popup, and `elementFromPoint` at the overlap returned the toggle's own glyph
// span rather than the tooltip.
//
// C13 checks that every portalled surface *declares* the layer. This checks that the
// declaration arrives where it has to: for a floating surface the primitive reads the content
// element's computed z-index and mirrors it onto the wrapper it positions, so a value on the
// wrong element inside the portal would satisfy the gate and paint nothing.
//
// **The placement is load-bearing and is this library's, not upstream's.** `ToolTip`'s default
// is `PlacementMode.Mouse`, which puts the popup above the pointer, and that is what carries it
// over the toggle at all. A unit that gave the rail's tooltip the placement WinUI's own rail
// uses would move the overlap somewhere else and this test would need re-aiming rather than
// deleting — the claim is about stacking, and the geometry is only how it is reached.
test('a rail tooltip is painted over the pane toggle, not under it', async ({ page }) => {
	await page.goto(PAGE);

	await page.locator('#rail .item').first().hover();
	const popup = page.locator('.popup:text-is("Home")');
	await expect(popup).toBeVisible();

	// Until Floating UI has placed it the wrapper is parked at `translate(0, -200%)`, which has
	// a real box, so the read waits for two consecutive agreeing positions rather than for
	// visibility.
	let last: string | null = null;
	await expect
		.poll(async () => {
			const now = await popup.evaluate((element) => {
				const box = element.getBoundingClientRect();
				return `${Math.round(box.x)},${Math.round(box.y)}`;
			});
			const settled = now === last;
			last = now;
			return settled;
		})
		.toBe(true);

	const stack = await page.evaluate(() => {
		const popped = [...document.querySelectorAll('.popup')].find(
			(element) => element.textContent?.trim() === 'Home'
		)!;
		const toggle = document.querySelector('#rail .pane-toggle')!;
		const a = popped.getBoundingClientRect();
		const b = toggle.getBoundingClientRect();
		const left = Math.max(a.left, b.left);
		const top = Math.max(a.top, b.top);
		const right = Math.min(a.right, b.right);
		const bottom = Math.min(a.bottom, b.bottom);
		if (!(right > left && bottom > top)) return { overlaps: false, at: null };
		const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
		return { overlaps: true, at: hit?.closest('.popup') ? 'popup' : 'something else' };
	});

	// Asserted, not assumed: a change that moved the tooltip clear of the toggle would leave
	// the check below true of an empty intersection, and this test would stop testing silently.
	expect(stack.overlaps).toBe(true);
	expect(stack.at).toBe('popup');
});
