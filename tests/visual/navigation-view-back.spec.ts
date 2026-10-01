import { expect, type Page } from '@playwright/test';
import { test } from './fixtures';

/**
 * The back button — `IsBackButtonVisible`, `IsBackEnabled` and `BackRequested`.
 *
 * Upstream defaults the member to `Auto` (`NavigationView.idl:244`), which is `Visible` except on
 * an Xbox (`NavigationView.cpp:1892-1895`), so a control that says nothing about it draws the
 * button. A left pane that is not overlaying puts it above the toggle and gives the pane a row
 * of its height (`:4730-4746`, `:4935`); a top pane draws it over the row's first column
 * (`NavigationView.xaml:216`); a minimal pane draws it beside the toggle and, while the pane is
 * open, a close button in its place (`NavigationView.cpp:1854-1890`). Each box is read against
 * the control's own top-left corner, and every left-pane figure is compared with the same control
 * at `'collapsed'`, so what is asserted is the 40 the button adds rather than where the rest of
 * the pane happens to sit.
 */

type Box = { left: number; top: number; width: number; height: number };

async function boxes(page: Page, frame: string) {
	return page.locator(`#${frame} [data-pane-display-mode]`).evaluate((root) => {
		const origin = root.getBoundingClientRect();
		const box = (selector: string): Box | null => {
			const element = root.querySelector(selector);
			if (!element) return null;
			const b = element.getBoundingClientRect();
			return {
				left: b.left - origin.left,
				top: b.top - origin.top,
				width: b.width,
				height: b.height
			};
		};
		return {
			back: box('.back-button'),
			close: box('.close-button'),
			header: box('.header-content'),
			toggle: box('.pane-toggle'),
			row: box('.pane [role=treeitem]'),
			placeholder: box('.back-button-placeholder'),
			topItem: box('.top-list > li')
		};
	});
}

test.beforeEach(async ({ page }) => {
	await page.goto('/dev/navigation-view-back');
});

test('a left pane draws the button disabled above the toggle, and everything under it moves 40 down', async ({
	page
}) => {
	const shown = await boxes(page, 'left-default');
	const hidden = await boxes(page, 'left-collapsed');

	// NavigationViewButtonHolderGridMargin's 4 above, the style's 4,2 margin, and a width of
	// SmallerPaneToggleButtonWidth — CompactPaneLength 48 less 8.
	expect(shown.back).toEqual({ left: 4, top: 6, width: 40, height: 36 });
	await expect(page.locator('#left-default .back-button')).toBeDisabled();
	expect(hidden.back).toBeNull();

	expect(shown.toggle!.top - hidden.toggle!.top).toBe(40);
	expect(shown.toggle!.left).toBe(hidden.toggle!.left);
	expect(shown.row!.top - hidden.row!.top).toBe(40);
});

test('an enabled button raises BackRequested from a click and from the keyboard', async ({
	page
}) => {
	const back = page.locator('#compact-enabled .back-button');
	const requests = page.locator('#requests');
	await expect(back).toBeEnabled();
	await expect(requests).toHaveText('0');

	await back.click();
	await expect(requests).toHaveText('1');

	await back.focus();
	await page.keyboard.press('Enter');
	await expect(requests).toHaveText('2');
	await page.keyboard.press('Space');
	await expect(requests).toHaveText('3');

	// The rail keeps the same column: the back button sits above the toggle there too.
	const rail = await boxes(page, 'compact-enabled');
	expect(rail.back).toEqual({ left: 4, top: 6, width: 40, height: 36 });
	expect(rail.toggle!.top).toBe(44);
});

// Both frames have the same handler on the same counter, so a request from the disabled one would
// show; and the enabled one is the control that Shift+Tab from a toggle does reach its back button.
test('a disabled button is no Tab stop and raises nothing, where an enabled one is both', async ({
	page
}) => {
	const requests = page.locator('#requests');
	const back = page.locator('#left-default .back-button');
	const toggle = page.locator('#left-default .pane-toggle');
	await toggle.focus();
	await expect(toggle).toBeFocused();
	await page.keyboard.press('Shift+Tab');
	await expect(back).not.toBeFocused();
	await expect(toggle).not.toBeFocused();
	await back.click({ force: true });
	await expect(requests).toHaveText('0');

	const enabledBack = page.locator('#compact-enabled .back-button');
	const enabledToggle = page.locator('#compact-enabled .pane-toggle');
	await enabledToggle.focus();
	await expect(enabledToggle).toBeFocused();
	await page.keyboard.press('Shift+Tab');
	await expect(enabledBack).toBeFocused();
});

// The header's left edge is `ContentLeftPadding` (`NavigationView.cpp:4704`) less the 24 that
// `NavigationViewMinimalHeaderMargin` takes back: the toggle's 40 alone, or 40 more beside it.
test('a minimal pane draws the button beside the toggle, and the header moves right by it', async ({
	page
}) => {
	const shown = await boxes(page, 'minimal');
	const hidden = await boxes(page, 'minimal-collapsed');

	expect(shown.back).toEqual({ left: 4, top: 6, width: 40, height: 36 });
	await expect(page.locator('#minimal .back-button')).toBeDisabled();
	expect(hidden.back).toBeNull();
	// `NavigationBackButtonSmallStyle`: the right margin goes. Nothing else can see it: the holder
	// is out of flow, and the toggle beside the button sizes its cell.
	await expect(page.locator('#minimal .back-button')).toHaveCSS('margin-right', '0px');
	await expect(page.locator('#left-default .back-button')).toHaveCSS('margin-right', '4px');

	// Beside, not above: the toggle moves right by c_backButtonWidth and not down.
	expect(shown.toggle!.left - hidden.toggle!.left).toBe(40);
	expect(shown.toggle!.top).toBe(hidden.toggle!.top);
	// An overlaying pane keeps no row for the button (`:4736`).
	expect(shown.row!.top).toBe(hidden.row!.top);

	expect(shown.header!.left).toBe(56);
	expect(hidden.header!.left).toBe(16);
	expect(shown.header!.top).toBe(hidden.header!.top);
});

test('an open minimal pane swaps the back button for a close button that closes it', async ({
	page
}) => {
	const frame = page.locator('#minimal');
	const root = frame.locator('[data-pane-display-mode]');
	const close = frame.locator('.close-button');
	await expect(close).toHaveCount(0);

	await frame.locator('.pane-toggle').click();
	await expect(root).toHaveAttribute('data-pane-open', 'true');
	await expect(frame.locator('.back-button')).toHaveCount(0);
	await expect(close).toBeEnabled();
	await expect(close).toHaveAccessibleName('Close');

	// The close button stands where the back button was, so nothing beside it moves.
	const open = await boxes(page, 'minimal');
	expect(open.close).toEqual({ left: 4, top: 6, width: 40, height: 36 });
	expect(open.toggle!.left).toBe(40);
	expect(open.header!.left).toBe(56);

	await close.click();
	await expect(root).toHaveAttribute('data-pane-open', 'false');
	await expect(close).toHaveCount(0);
	await expect(frame.locator('.back-button')).toHaveCount(1);

	// And from the keyboard, since it is a button like the toggle.
	await frame.locator('.pane-toggle').click();
	await close.focus();
	await page.keyboard.press('Enter');
	await expect(root).toHaveAttribute('data-pane-open', 'false');
});

test('a collapsed minimal pane draws neither button, open or closed', async ({ page }) => {
	const frame = page.locator('#minimal-collapsed');
	await expect(frame.locator('.back-button')).toHaveCount(0);
	await expect(frame.locator('.close-button')).toHaveCount(0);
	await frame.locator('.pane-toggle').click();
	await expect(frame.locator('[data-pane-display-mode]')).toHaveAttribute('data-pane-open', 'true');
	await expect(frame.locator('.back-button')).toHaveCount(0);
	await expect(frame.locator('.close-button')).toHaveCount(0);
	const open = await boxes(page, 'minimal-collapsed');
	expect(open.toggle!.left).toBe(0);
	expect(open.header!.left).toBe(16);
});

// The toggle's term leaves `ContentLeftPadding` with it (`NavigationView.cpp:4660-4667`), so the
// back button's 40 is all that is beside the header, and the header sits where the toggle's alone
// would put it.
test('a minimal pane without its toggle keeps the back button and only its width', async ({
	page
}) => {
	const alone = await boxes(page, 'minimal-no-toggle');
	expect(alone.toggle).toBeNull();
	expect(alone.back).toEqual({ left: 4, top: 6, width: 40, height: 36 });
	expect(alone.header!.left).toBe(16);
});

test('a top pane draws the button over a 40-wide first column, which the items start after', async ({
	page
}) => {
	const shown = await boxes(page, 'top-default');
	const hidden = await boxes(page, 'top-collapsed');

	expect(shown.back).toEqual({ left: 4, top: 6, width: 40, height: 36 });
	await expect(page.locator('#top-default .back-button')).toBeDisabled();
	expect(shown.toggle).toBeNull();
	expect(shown.placeholder!.width).toBe(40);
	expect(shown.placeholder!.left).toBe(shown.back!.left);

	expect(hidden.back).toBeNull();
	expect(hidden.placeholder).toBeNull();
	expect(shown.topItem!.left - hidden.topItem!.left).toBe(40);
});

// The column is charged to the row's budget, because upstream measures the whole of `TopNavGrid`
// (`NavigationView.cpp:3657`). Left out, the row keeps an item the column has pushed past the
// items' box, where `.top-items` clips it instead of handing it to the overflow menu. Swept
// rather than pinned to one width, so the assertion does not depend on where the labels'
// widths happen to put the edge. The selected item is left out of it: upstream's walk never
// moves that one to the menu (`NavigationView.cpp:4019-4059`), so at the narrow end the row
// clips it rather than hiding it.
test('a top pane charges the column to the row, so no kept item is clipped', async ({ page }) => {
	const frame = page.locator('#top-default');
	let overflowed = 0;
	for (let width = 200; width <= 420; width += 4) {
		await frame.evaluate((element, w) => (element.style.width = `${w}px`), width);
		const clipped = await frame.evaluate(
			() =>
				new Promise<string[]>((resolve) =>
					requestAnimationFrame(() =>
						requestAnimationFrame(() => {
							const root = document.querySelector('#top-default .top-items')!;
							const edge = root.getBoundingClientRect().right;
							resolve(
								Array.from(root.querySelectorAll<HTMLElement>('.top-list > li'))
									.filter((li) => !li.dataset.overflowed)
									.filter((li) => !li.querySelector("[aria-selected='true']"))
									.filter((li) => li.getBoundingClientRect().right > edge + 0.5)
									.map((li) => li.textContent!.trim())
							);
						})
					)
				)
		);
		expect(clipped, `at ${width}px`).toEqual([]);
		overflowed += await frame.locator('.top-list > li[data-overflowed]').count();
	}
	// The sweep reaches widths where something did move to the menu, or it asserted nothing.
	expect(overflowed).toBeGreaterThan(0);
});
