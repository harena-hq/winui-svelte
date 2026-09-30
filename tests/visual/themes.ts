import type { Page } from '@playwright/test';
import { expect } from './fixtures';

export const THEMES = ['light', 'dark', 'high-contrast'] as const;

/**
 * Grow the viewport to the dev page's own content height.
 *
 * The window is exactly `100vh` and clips (D16), and the dev layout is what scrolls inside it,
 * so `body` is the viewport and a screenshot of it is a crop of the top of the page. That was
 * invisible while every dev page fitted above the fold, and it stopped being invisible the
 * moment one did not: TextBox's header and description rendered, and were photographed by
 * nothing.
 *
 * Growing the viewport to the content is what makes the capture whole without touching the
 * window semantics the shell is judged on. A page shorter than the viewport reports the box
 * height and is left alone.
 *
 * **It turns the dev layout's scroller off, so that the measurement and the capture share a
 * width.** A scrollbar on the reference browser takes 15px of layout space, so a scrollable
 * `.dev` is 15px narrower than the same `.dev` once the viewport fits its content, and measuring
 * one to photograph the other photographs a layout that was never measured:
 * `/dev/radio-button`'s description wraps onto a second line at 1265 and onto one line at 1280,
 * so the viewport was set to 810 for a page 791 tall at the width it is shot at, and the capture
 * carried 19 blank rows under its content. Nothing about the page had changed, which is
 * why its baseline read as drift.
 *
 * Neither growing twice nor measuring once with the scrollbar hidden is enough, and the second
 * failure is the instructive one. `scrollHeight` never reports less than `clientHeight`, so a
 * second pass at 810 reads 810 and agrees with itself; and `scrollHeight` is rounded, so a page
 * whose content is 791.4 tall is measured as 791, overflows a 791px viewport by four tenths of a
 * pixel, gets its scrollbar back, and relayouts to 810. A fraction of a pixel is enough, which is
 * why the scroller is turned off rather than reasoned around.
 *
 * It is exported because an assertion about a portalled surface has to reach the same state the
 * baseline was photographed in. A flyout is placed with collision avoidance on, so a specimen
 * below the fold of the default viewport is legitimately flipped to the other side and is not in
 * the state its test id claims; and Playwright's own auto-scroll before a click moves a trigger,
 * which moves its anchored popup. Both are the same problem, and this is the one answer.
 */
export async function growViewportToContent(page: Page) {
	const { width } = page.viewportSize()!;
	const dev = page.locator('.dev');
	// Reading `scrollHeight` flushes layout, so the height comes back for the full width and no
	// frame is ever painted with a scroller this capture will not have.
	const height = await dev.evaluate((element) => {
		element.style.overflowY = 'hidden';
		return element.scrollHeight;
	});
	await page.setViewportSize({ width, height });
	// `height` came back as an integer from the width this is about to be photographed at, so the
	// box is now exactly as tall as its own content reports itself to be and the difference is
	// zero, rounding included. Any margin here would pass a capture that is genuinely short.
	await expect
		.poll(() => dev.evaluate((element) => element.scrollHeight - element.clientHeight))
		.toBe(0);
}

/**
 * Screenshot one component in every theme.
 *
 * C4 checks that each exported component is passed to this helper. The helper is what
 * makes that check mean something: a gate that only looked for the words "dark" and
 * "light" somewhere in the suite would be satisfied by a comment.
 */
export async function snapshotAllThemes(
	page: Page,
	component: string,
	path: string,
	options?: { animations?: 'allow' | 'disabled'; maxDiffPixels?: number }
) {
	// Every theme starts from the viewport the page was given, not the one the previous pass grew
	// it to. Left grown, only the first theme loaded at the default size and the other two loaded
	// at the page's full height, and that is not the same page: `Viewbox-dark.png` went 664
	// pixels different by a raw compare (18 past the comparator's anti-aliasing allowance),
	// deterministically, at the edges of the bitmap the Viewbox samples scale, while light passed.
	// Measured on the reference guest by loading the dark route both ways, with nothing else
	// changed: 0 pixels against the baseline from the default size, 664 from the full height.
	// Why the load-time size reaches a scaled bitmap's filtering — the order of image decode
	// against the control applying its transform is the likely answer — is not measured.
	const initial = page.viewportSize()!;
	for (const theme of THEMES) {
		await page.setViewportSize(initial);
		await page.goto(path);
		// Set the theme through the channel the app owns as well as the one the screenshot
		// reads, then prove it stuck. The Gallery's layout applies `theme` to
		// `documentElement.dataset` in an effect that runs on mount and reads `localStorage`
		// first, so a `dataset` write that lands *before* hydration is deleted again by that
		// effect and the page is photographed in the default theme. Writing both makes the two
		// orders converge — hydration reads the value we stored, or finds the attribute we set
		// — and the poll is what makes a render that did neither impossible to photograph.
		// This is not hypothetical: a whole-suite `--update-snapshots` once wrote a light
		// render into `InfoBar-dark.png`, and a baseline written from a wrong render agrees
		// with itself forever after.
		await page.evaluate((t) => {
			localStorage.setItem('winui-svelte:theme', t);
			document.documentElement.dataset.theme = t;
		}, theme);
		await expect
			.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''))
			.toBe(theme);
		await growViewportToContent(page);
		// `options` reaches `toHaveScreenshot` for two settings. `animations` first: the default is
		// Playwright's: `disabled`, which does not merely freeze an animation but **finishes**
		// it — every running animation is seeked to its end and left there, permanently, before
		// the capture. That is the right default for every route photographing a control at
		// rest, and it is why the baselines of the animated controls show their last frame.
		//
		// It is wrong for exactly one kind of page. `/dev/motion` renders a curve as eleven
		// copies of one animation paused at eleven negative delays; under `disabled` all eleven
		// are sent to the end frame and stack into a single marker, and the strip photographs as
		// one square. Nothing catches that on its own: the DOM assertions beside it read the
		// page rather than the picture and pass, and a first baseline written from the wrong
		// render agrees with itself forever after — the same trap the theme comment above
		// describes, reached by a different road. Found by opening the PNG.
		//
		// `maxDiffPixels` second, and it is for a page this browser does not rasterise the same way
		// twice. The colour tolerance in `playwright.config.ts` is set close enough to one channel
		// level that a page whose anti-aliasing genuinely moves between renders cannot be absorbed
		// there without re-opening the hole that line closes. A count is the narrower instrument:
		// it raises how many differing pixels this one page may carry, leaving what counts as a
		// differing pixel where every other page has it. Two pages carry one, `path.spec.ts` and
		// the MediaTransportControls capture in `media-player-element.spec.ts`, and each states
		// the noise it was measured against and what it gives up.
		await expect(page.locator('body')).toHaveScreenshot(`${component}-${theme}.png`, options);
	}
}
