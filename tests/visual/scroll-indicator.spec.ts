import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * A ScrollView's bars auto-hide (ScrollingIndicatorStates, ScrollView.xaml:28-104): nothing is
 * drawn until the pointer or the view gives a reason, and the bars fade back to nothing once it
 * stops. The delays are the reference guest's, measured on its Gallery; ScrollView.svelte says
 * where each one comes from. The clock is Playwright's, paused, so every delay is stepped over
 * exactly rather than slept through.
 */

const EXAMPLE = '.scroll-example';

/** The first example's vertical bar: what it is drawing, and whether it is fading. */
function state(page: Page) {
	return page.evaluate((selector) => {
		const wrapper = document.querySelector<HTMLElement>(`${selector} .bar-wrapper.vertical`)!;
		return {
			indicator: wrapper.dataset.indicator,
			fading: wrapper.dataset.fading !== undefined,
			rail: wrapper.querySelector("[class~='rail']") !== null,
			panning: wrapper.querySelector("[class~='panning-rail']") !== null
		};
	}, EXAMPLE);
}

const NONE = { indicator: 'none', fading: false, rail: false, panning: false };
const MOUSE = { indicator: 'mouse', fading: false, rail: true, panning: false };
const FADING = { indicator: 'mouse', fading: true, rail: true, panning: false };
const TOUCH = { indicator: 'touch', fading: false, rail: false, panning: true };

/** See scroll-view-scroll.spec.ts: the instant is the page's, and the pause lands after it. */
async function freeze(page: Page) {
	const now = await page.evaluate(() => Date.now());
	await page.clock.install({ time: now });
	await page.clock.pauseAt(now + 10_000);
}

/** A touch contact at a point, which the browser cannot synthesise through Playwright's mouse. */
function touch(page: Page, x: number, y: number, types: string[]) {
	return page.evaluate(
		([px, py, kinds]) => {
			const target = document.elementFromPoint(px as number, py as number)!;
			const init = { bubbles: true, pointerType: 'touch', clientX: px, clientY: py };
			for (const type of kinds as string[]) {
				// An enter does not bubble, so it is dispatched on the control's root.
				const at = type.endsWith('enter') ? target.closest('.scroll-view')! : target;
				at.dispatchEvent(new PointerEvent(type, { ...init, bubbles: !type.endsWith('enter') }));
			}
		},
		[x, y, types] as [number, number, string[]]
	);
}

async function open(page: Page, path = '/dev/scroll-view') {
	await page.goto(path);
	await page.mouse.move(0, 0);
	// The component counts itself drawn two frames after it mounts; frozen sooner, its frames
	// would wait on the paused clock and no view change would ever show the bar.
	await page.evaluate(
		() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
	);
	await freeze(page);
	const box = (await page.locator(EXAMPLE).first().boundingBox())!;
	return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

test('at rest a bar draws nothing and lets the pointer through', async ({ page }) => {
	const { box } = await open(page);
	expect(await state(page)).toEqual(NONE);
	const wrapper = page.locator(`${EXAMPLE} .bar-wrapper.vertical`).first();
	expect(await wrapper.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe('none');
	// The bar's own box, where the pointer lands on the content instead.
	const hit = await page.evaluate(
		([x, y]) => document.elementFromPoint(x, y)?.closest('.bar-wrapper') === null,
		[box.x + box.width - 4, box.y + box.height / 2]
	);
	expect(hit).toBe(true);
});

test('a pointer left still inside fades the bar 3.25s after it moved', async ({ page }) => {
	const { x, y } = await open(page);
	await page.mouse.move(x, y);
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(3249);
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(1);
	expect(await state(page)).toEqual(FADING);
	await page.clock.runFor(83);
	expect(await state(page)).toEqual(NONE);
});

test('every move restarts the delay', async ({ page }) => {
	const { x, y } = await open(page);
	await page.mouse.move(x, y);
	await page.clock.runFor(3000);
	await page.mouse.move(x + 1, y);
	await page.clock.runFor(3000);
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(250);
	expect(await state(page)).toEqual(FADING);
});

test('a pointer that leaves fades the bar two seconds later', async ({ page }) => {
	const { x, y } = await open(page);
	await page.mouse.move(x, y);
	await page.clock.runFor(500);
	await page.mouse.move(0, 0);
	await page.clock.runFor(1999);
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(1);
	expect(await state(page)).toEqual(FADING);
	await page.clock.runFor(83);
	expect(await state(page)).toEqual(NONE);
});

test('a pointer over the bar holds it until the pointer leaves the control', async ({ page }) => {
	const { box } = await open(page);
	const barX = box.x + box.width - 6;
	await page.mouse.move(box.x + box.width / 2, box.y + 40);
	await page.mouse.move(barX, box.y + 40);
	await page.clock.runFor(10_000);
	expect(await state(page)).toEqual(MOUSE);
	await page.mouse.move(0, 0);
	await page.clock.runFor(1999);
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(84);
	expect(await state(page)).toEqual(NONE);
});

/** Sets the first example's offset and waits for the scroll event, the browser's to dispatch. */
function scrollTo(page: Page, top: number) {
	return page.evaluate(
		([selector, offset]) =>
			new Promise((done) => {
				const viewport = document.querySelector<HTMLElement>(`${selector} .viewport`)!;
				viewport.addEventListener('scroll', done, { once: true });
				viewport.scrollTop = offset as number;
			}),
		[EXAMPLE, top] as [string, number]
	);
}

test('a scroll before any mouse input shows the panning indicator', async ({ page }) => {
	await open(page);
	await scrollTo(page, 40);
	expect(await state(page)).toEqual(TOUCH);
	await page.clock.runFor(500 + 83);
	expect(await state(page)).toEqual(NONE);
});

test('a scroll after the mouse has moved over the control shows the mouse indicator', async ({
	page
}) => {
	const { x, y } = await open(page);
	await page.mouse.move(x, y);
	await page.mouse.move(0, 0);
	await page.clock.runFor(2000 + 83);
	expect(await state(page)).toEqual(NONE);
	await scrollTo(page, 40);
	expect(await state(page)).toEqual(MOUSE);
});

test('a key clears the mouse preference, unless the mouse indicator is already up', async ({
	page
}) => {
	const { x, y } = await open(page);
	await page.mouse.move(x, y);
	const viewport = page.locator(`${EXAMPLE} .viewport`).first();
	await viewport.dispatchEvent('keydown', { key: 'ArrowDown' });
	await scrollTo(page, 20);
	// Mouse indicators dominate once they are showing.
	expect(await state(page)).toEqual(MOUSE);
	await page.mouse.move(0, 0);
	await page.clock.runFor(2000 + 83);
	expect(await state(page)).toEqual(NONE);
	await viewport.dispatchEvent('keydown', { key: 'ArrowDown' });
	await scrollTo(page, 60);
	expect(await state(page)).toEqual(TOUCH);
});

test('a move during the fade brings the bar back', async ({ page }) => {
	const { x, y } = await open(page);
	await page.mouse.move(x, y);
	await page.clock.runFor(3250 + 40);
	expect(await state(page)).toEqual(FADING);
	await page.mouse.move(x + 1, y);
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(3249);
	expect(await state(page)).toEqual(MOUSE);
});

test('a drag released over the content leaves the bar to count down two seconds', async ({
	page
}) => {
	const { box } = await open(page);
	await page.mouse.move(box.x + box.width / 2, box.y + 40);
	const thumb = (await page
		.locator(`${EXAMPLE} .bar-wrapper.vertical [class~='thumb']`)
		.first()
		.boundingBox())!;
	await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + 4);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2, thumb.y + 4);
	await page.mouse.up();
	// No move follows the release, so the bar's own leave is the only countdown running.
	await page.clock.runFor(1999);
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(1);
	expect(await state(page)).toEqual(FADING);
});

test('a touch shows the panning indicator, gone half a second later', async ({ page }) => {
	const { x, y } = await open(page);
	await touch(page, x, y, ['pointerdown', 'pointerup']);
	expect(await state(page)).toEqual(TOUCH);
	await page.clock.runFor(499);
	expect(await state(page)).toEqual(TOUCH);
	await page.clock.runFor(1 + 83);
	expect(await state(page)).toEqual(NONE);
});

test('a touch press on a ScrollViewer shows nothing, and neither does a focus after it', async ({
	page
}) => {
	// ScrollViewer's harness, whose first example is the older control, drawn on this one.
	const { x, y } = await open(page, '/dev/scroll-viewer');
	const focusInside = () =>
		page
			.locator(`${EXAMPLE} .viewport`)
			.first()
			.evaluate((element) => element.dispatchEvent(new FocusEvent('focusin', { bubbles: true })));
	// The mouse sets the preference first, so the scroll below tells whether the focus took it.
	await page.mouse.move(x, y);
	await page.mouse.move(0, 0);
	await page.clock.runFor(2000 + 83);
	expect(await state(page)).toEqual(NONE);
	await touch(page, x, y, ['pointerdown', 'pointerup']);
	expect(await state(page)).toEqual(NONE);
	// WD-104: upstream's OnGotFocus shows the panning indicator here.
	await focusInside();
	expect(await state(page)).toEqual(NONE);
	// The focus still took the touch's preference, as upstream's does.
	await scrollTo(page, 40);
	expect(await state(page)).toEqual(TOUCH);
	await page.clock.runFor(500 + 83);
	expect(await state(page)).toEqual(NONE);
	// A focus after a key still shows.
	await page.keyboard.press('Shift');
	await focusInside();
	expect(await state(page)).toEqual(TOUCH);
});

test('a mouse press on a ScrollViewer whose bar faded under it shows nothing', async ({ page }) => {
	const { x, y } = await open(page, '/dev/scroll-viewer');
	await page.mouse.move(x, y);
	await page.clock.runFor(3250 + 83);
	expect(await state(page)).toEqual(NONE);
	await page.mouse.down();
	await page.mouse.up();
	expect(await state(page)).toEqual(NONE);
});

test("a press on a ListView's blank space shows nothing, and a focus on an item does", async ({
	page
}) => {
	await page.goto('/motion/parallaxview');
	await page.mouse.move(0, 0);
	// Two frames, for the component to count itself drawn, as `open` waits.
	await page.evaluate(
		() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
	);
	await freeze(page);
	// The page's ListView overflows, so it draws a vertical bar, and nothing shown is not merely no
	// bar. Its header is inside the scrolling region and takes no focus, so it is blank space.
	const root = page.locator('.sample-list [data-scroll-input="scroll-viewer"]');
	const bar = root.locator('.bar-wrapper.vertical');
	const header = (await root.locator('.list-header').boundingBox())!;
	await page.mouse.move(header.x + header.width / 2, header.y + header.height / 2);
	await page.clock.runFor(3250 + 83);
	expect(await bar.getAttribute('data-indicator')).toBe('none');
	// The browser focuses the root on this press; neither the press nor that focus shows the bar.
	await page.mouse.down();
	await page.mouse.up();
	await expect(root).toBeFocused();
	// Read once, not polled: a polling assertion would pass on the state before any update.
	expect(await bar.getAttribute('data-indicator')).toBe('none');
	await root.locator('[role="option"]').first().focus();
	await expect(bar).toHaveAttribute('data-indicator', 'mouse');
});

test("GridView and TreeView carry the older ScrollViewer's marker, since each is one upstream", async ({
	page
}) => {
	for (const [path, role] of [
		['/dev/grid-view', 'listbox'],
		['/dev/tree-view', 'tree']
	]) {
		await page.goto(path);
		await expect(
			page.locator(`[role="${role}"][data-scroll-input="scroll-viewer"]`).first()
		).toBeAttached();
	}
});

test("NavigationView's pane carries the older ScrollViewer's marker, since it is one upstream", async ({
	page
}) => {
	await page.goto('/dev/navigation-view');
	await expect(page.locator('.items-container-grid').first()).toHaveAttribute(
		'data-scroll-input',
		'scroll-viewer'
	);
});

test('a touch moving over the control does not show the mouse indicator', async ({ page }) => {
	const { x, y } = await open(page);
	await touch(page, x, y, ['pointerenter', 'pointermove']);
	expect(await state(page)).toEqual(NONE);
});

test('only the mouse indicator takes the pointer', async ({ page }) => {
	const { x, y } = await open(page);
	const events = () =>
		page
			.locator(`${EXAMPLE} .bar-wrapper.vertical`)
			.first()
			.evaluate((element) => getComputedStyle(element).pointerEvents);
	await page.mouse.move(x, y);
	expect(await events()).toBe('auto');
	await page.clock.runFor(3250);
	expect(await state(page)).toEqual(FADING);
	expect(await events()).toBe('none');
});

test('the panning indicator lets the pointer through', async ({ page }) => {
	const { x, y } = await open(page);
	await touch(page, x, y, ['pointerdown']);
	expect(await state(page)).toEqual(TOUCH);
	expect(
		await page
			.locator(`${EXAMPLE} .bar-wrapper.vertical`)
			.first()
			.evaluate((element) => getComputedStyle(element).pointerEvents)
	).toBe('none');
});

test('a touch pan prefers the panning indicator after mouse input', async ({ page }) => {
	const { x, y } = await open(page);
	await page.mouse.move(x, y);
	await page.mouse.move(0, 0);
	await page.clock.runFor(2000 + 83);
	await touch(page, x, y, ['pointerdown']);
	// A press keeps the preference: upstream changes it only once the touch pans.
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(3250 + 83);
	expect(await state(page)).toEqual(NONE);
	await scrollTo(page, 40);
	expect(await state(page)).toEqual(TOUCH);
	await touch(page, x, y, ['pointerup']);
});

test('a disabled ScrollViewer shows nothing under the pointer', async ({ page }) => {
	// ScrollViewer's harness: its disabled example keeps a bar, where ScrollView's collapses both.
	await page.goto('/dev/scroll-viewer');
	await page.mouse.move(0, 0);
	const disabled = page.locator('.scroll-view.disabled');
	const box = (await disabled.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.move(box.x + box.width / 2 + 4, box.y + box.height / 2);
	const indicators = await disabled.evaluate((element) =>
		[...element.querySelectorAll<HTMLElement>('.bar-wrapper')].map(
			(wrapper) => wrapper.dataset.indicator
		)
	);
	expect(indicators.length).toBeGreaterThan(0);
	expect(indicators.every((indicator) => indicator === 'none')).toBe(true);
});

test('a drag on the thumb holds the bar off the control, and the release counts down', async ({
	page
}) => {
	const { box } = await open(page);
	await page.mouse.move(box.x + box.width / 2, box.y + 40);
	const thumb = (await page
		.locator(`${EXAMPLE} .bar-wrapper.vertical [class~='thumb']`)
		.first()
		.boundingBox())!;
	await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + 4);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width + 200, thumb.y + 20);
	await page.clock.runFor(10_000);
	expect(await state(page)).toEqual(MOUSE);
	await page.mouse.up();
	await page.clock.runFor(1999);
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(84);
	expect(await state(page)).toEqual(NONE);
});

test('a focus shows the bar, as the kind of what gave it', async ({ page }) => {
	const { x, y } = await open(page);
	const focus = () =>
		page
			.locator(`${EXAMPLE} .viewport`)
			.first()
			.evaluate((element) => element.dispatchEvent(new FocusEvent('focusin', { bubbles: true })));
	// A key before it, as a Tab gives: the panning indicator.
	await page.keyboard.press('Shift');
	await focus();
	expect(await state(page)).toEqual(TOUCH);
	await page.clock.runFor(500 + 83);
	expect(await state(page)).toEqual(NONE);
	// A focus a mouse press gave: the mouse indicator.
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.up();
	await page.mouse.move(0, 0);
	await page.clock.runFor(2000 + 83);
	expect(await state(page)).toEqual(NONE);
	await focus();
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(3250 + 83);
	// A focus a touch press gave, after the mouse had set the preference: the panning indicator.
	await touch(page, x, y, ['pointerdown', 'pointerup']);
	await page.clock.runFor(3250 + 83);
	expect(await state(page)).toEqual(NONE);
	await focus();
	expect(await state(page)).toEqual(TOUCH);
	await page.clock.runFor(500 + 83);
	// A key after a mouse press: the key is what came last, so the panning indicator.
	await page.mouse.move(x, y);
	await page.mouse.down();
	await page.mouse.up();
	await page.mouse.move(0, 0);
	await page.clock.runFor(2000 + 83);
	await page.keyboard.press('Shift');
	await focus();
	expect(await state(page)).toEqual(TOUCH);
});

test('a pointer leaving shows a bar that had faded under it, then counts down', async ({
	page
}) => {
	const { x, y } = await open(page);
	await page.mouse.move(x, y);
	await page.clock.runFor(3250 + 83);
	expect(await state(page)).toEqual(NONE);
	await page.mouse.move(0, 0);
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(1999);
	expect(await state(page)).toEqual(MOUSE);
	await page.clock.runFor(1);
	expect(await state(page)).toEqual(FADING);
});

test('a touch the browser cancels for a pan prefers the panning indicator', async ({ page }) => {
	const { x, y } = await open(page);
	await page.mouse.move(x, y);
	await page.mouse.move(0, 0);
	await page.clock.runFor(2000 + 83);
	// The browser cancels a contact it takes for a pan before the pan's first scroll.
	await touch(page, x, y, ['pointerdown', 'pointercancel']);
	await page.clock.runFor(3250 + 83);
	expect(await state(page)).toEqual(NONE);
	await scrollTo(page, 40);
	expect(await state(page)).toEqual(TOUCH);
});

/** Takes the first example's content away, so its auto bar goes, and then puts it back. */
async function removeAndRestoreBar(page: Page) {
	// The resize observer that sees it runs on the browser's frames, not the paused clock, so the
	// bar's count is polled.
	const tall = page.locator(`${EXAMPLE} .tall`).first();
	const bar = page.locator(EXAMPLE).first().locator('.bar-wrapper.vertical');
	await tall.evaluate((element) => (element.style.display = 'none'));
	await expect(bar).toHaveCount(0);
	await tall.evaluate((element) => (element.style.display = ''));
	await expect(bar).toHaveCount(1);
}

test('a bar removed while it fades leaves no fade behind to end a later show', async ({ page }) => {
	const { x, y } = await open(page);
	await page.mouse.move(x, y);
	await page.clock.runFor(3250);
	expect(await state(page)).toEqual(FADING);
	// The removal hides the bars again while the first fade is still pending.
	await removeAndRestoreBar(page);
	await page.mouse.move(x + 1, y);
	expect(await state(page)).toEqual(MOUSE);
	// A fade timer the second hide had lost track of would end this show here.
	await page.clock.runFor(83);
	expect(await state(page)).toEqual(MOUSE);
});

test('a bar removed from under the pointer stops holding', async ({ page }) => {
	const { box } = await open(page);
	await page.mouse.move(box.x + box.width / 2, box.y + 40);
	await page.mouse.move(box.x + box.width - 6, box.y + 40);
	await removeAndRestoreBar(page);
	await page.mouse.move(box.x + box.width / 2, box.y + 40);
	await page.clock.runFor(3250);
	expect(await state(page)).toEqual(FADING);
});

test("the Gallery's page scroller carries the marker on every page but Settings", async ({
	page
}) => {
	// Upstream's Settings page alone scrolls in a ScrollView; see the shell's layout.
	const scroller = page.locator('.scroll-view.page');
	await page.goto('/settings');
	await expect(scroller).toBeAttached();
	await expect(scroller).not.toHaveAttribute('data-scroll-input');
	// Each way between Settings and Home without a reload, so the marker follows the route rather
	// than the load; the flag on the window would not survive one.
	const row = (label: string) =>
		page.locator(`[role="treeitem"]:has(> .content-presenter:text-is("${label}"))`);
	await page.evaluate(() => ((window as { stayed?: boolean }).stayed = true));
	await row('Home').click();
	await expect(page).toHaveURL(/\/$/);
	await expect(scroller).toHaveAttribute('data-scroll-input', 'scroll-viewer');
	await row('Settings').click();
	await expect(page).toHaveURL(/\/settings$/);
	await expect(scroller).toBeAttached();
	await expect(scroller).not.toHaveAttribute('data-scroll-input');
	expect(await page.evaluate(() => (window as { stayed?: boolean }).stayed)).toBe(true);
	for (const path of ['/scrolling/semanticzoom', '/menusandtoolbars/appbarbutton']) {
		await page.goto(path);
		await expect(scroller).toHaveAttribute('data-scroll-input', 'scroll-viewer');
	}
});

test("SemanticZoom's zoomed-in view carries the marker, since it is a GridView upstream", async ({
	page
}) => {
	await page.goto('/scrolling/semanticzoom');
	await expect(page.locator('.scroll-view.zoomed-in-scroll')).toHaveAttribute(
		'data-scroll-input',
		'scroll-viewer'
	);
});
