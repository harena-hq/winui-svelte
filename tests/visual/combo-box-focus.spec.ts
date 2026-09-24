import { expect, test } from './fixtures';
import { growViewportToContent, THEMES } from './themes';

type Locator = import('@playwright/test').Locator;
type Page = import('@playwright/test').Page;

/**
 * What a ComboBox looks like when the keyboard reaches it.
 *
 * It is not a band. `DefaultComboBoxStyle` sets `UseSystemFocusVisuals` to
 * `{ThemeResource IsApplicationFocusVisualKindReveal}` at ComboBox_themeresources.xaml:380, and
 * that resource is `False` in all three of generic.xaml's dictionaries (:331, :2956, :5940), so
 * the framework draws no focus rect on this control. `DefaultComboBoxItemStyle` sets the same
 * property to a literal `True` at :608, which is why the popup item does take one.
 *
 * What the template draws instead is the `HighlightBackground` Border at :570 — `Margin="-4"`,
 * declared before the `Background` Border that covers it, and taken from `Opacity="0"` to 1 by
 * the `Focused` state at :475. Four pixels outside the box: two of stroke, then two of fill.
 *
 * Until 2026-09-24 this component drew neither. It carried a band on `.root::before` whose `top`
 * read `ComboBoxTopHeaderMargin` — the four-value Thickness `0px 0px 8px 0px` (tokens.css:177),
 * not a length, so the declaration was invalid at computed-value time and `top` fell back to its
 * initial `auto`; with `bottom: 0` and an empty pseudo-element it solved to 0px tall. Nothing in
 * the suite said so, because the only ComboBox capture is the resting route and no test had
 * focused the control.
 *
 * Every test grows the viewport to the route's content first. At 720 this page settles with
 * `scrollY` at 340 and the first trigger sits above the fold at `y = -158`, which is a clip a
 * page screenshot refuses outright; grown, there is no scroll to depend on and the geometry is
 * the one `snapshotAllThemes` photographs. `inner-border-edge.spec.ts:960` reaches the same
 * route the same way.
 *
 * The readings below are shapes and differences, never values, so one assertion covers three
 * themes — which matters here because the three do not agree: in high contrast the stroke is
 * `SystemControlHighlightTransparentBrush` (:143) and the fill carries the whole highlight.
 */

const ROUTE = '/dev/combo-box';

/** The triggers on the route that can take focus. Index 4 is the disabled row, which declines. */
const ENABLED = [0, 1, 2, 3, 5, 6, 7];

/**
 * The only row whose root is not its trigger: it carries a header above and a description below,
 * so `.root` is the flex column of all three. It is named because on every other row the two
 * boxes coincide, and a highlight measured against the wrong one of them would read as correct.
 */
const HEADERED = 2;

/** How far outside the box `Margin="-4"` puts the highlight. */
const MARGIN = 4;

/** An element's border box in page coordinates, rounded, as `x,y,w,h`. */
const boxOf = (element: Locator) =>
	element.evaluate((el) => {
		const b = el.getBoundingClientRect();
		return [b.x, b.y, b.width, b.height].map(Math.round).join(',');
	});

/**
 * The highlight's own border box in page coordinates, or `null` when none is generated.
 *
 * A computed style reports an absolutely positioned pseudo-element's offsets against its
 * containing block, which for a child of a `position: relative` element is that element's
 * *padding* box — so the host's border widths are added back to get a figure comparable with
 * `getBoundingClientRect`. The pseudo's computed `width` and `height` are its content box, and
 * it carries a border, so the border widths are added to those too.
 */
const highlightOf = (trigger: Locator) =>
	trigger.evaluate((el) => {
		const band = getComputedStyle(el, '::before');
		if (band.content === 'none') return null;
		const host = el.getBoundingClientRect();
		const own = getComputedStyle(el);
		const side = parseFloat(band.borderLeftWidth) + parseFloat(band.borderRightWidth);
		const ends = parseFloat(band.borderTopWidth) + parseFloat(band.borderBottomWidth);
		return [
			host.x + parseFloat(own.borderLeftWidth) + parseFloat(band.left),
			host.y + parseFloat(own.borderTopWidth) + parseFloat(band.top),
			parseFloat(band.width) + side,
			parseFloat(band.height) + ends
		]
			.map(Math.round)
			.join(',');
	});

/** That same box grown by `MARGIN` on every side, which is what the highlight should be. */
const grownBoxOf = async (element: Locator) => {
	const [x, y, w, h] = (await boxOf(element)).split(',').map(Number);
	return [x - MARGIN, y - MARGIN, w + MARGIN * 2, h + MARGIN * 2].join(',');
};

/**
 * Focus one trigger the way a keyboard would.
 *
 * A scripted `focus()` resolves as `:focus-visible` in Chromium while nothing has been clicked —
 * the same heuristic `content-dialog-focus.spec.ts` relies on. That is a heuristic and not a
 * guarantee, so the state is asserted rather than assumed: a browser resolving it the other way
 * would otherwise measure a resting trigger and every reading below would be of the wrong thing.
 */
async function light(page: Page, index: number) {
	const trigger = page.locator('.trigger').nth(index);
	await trigger.evaluate((el: HTMLElement) => el.focus());
	await expect(trigger).toBeFocused();
	expect(
		await trigger.evaluate((el) => el.matches(':focus-visible')),
		`trigger ${index} took focus without :focus-visible, so nothing below is about a focus visual`
	).toBe(true);
	return trigger;
}

/**
 * Pixels along the trigger's horizontal midline, keyed by their offset from its left border edge:
 * negative is outside. Read from a page screenshot rather than an element one, because the whole
 * subject of this spec lies outside the element.
 *
 * The horizontal edges of this layout are on integers — `inner-border-edge.spec.ts:375` records
 * the vertical half-pixel that is not — so a column offset addresses one device pixel. The
 * midline keeps every reading clear of the corner radius.
 */
async function midline(page: Page, trigger: Locator, offsets: number[]) {
	const pad = 12;
	const box = (await trigger.boundingBox())!;
	const width = pad + Math.max(...offsets) + 2;
	expect(
		box.x % 1,
		'the trigger no longer starts on a whole pixel, so a column offset straddles two of them'
	).toBe(0);
	const shot = await page.screenshot({
		clip: { x: box.x - pad, y: box.y, width, height: box.height }
	});
	return page.evaluate(
		async ([url, padding, xs]) => {
			const image = new Image();
			image.src = url as string;
			await image.decode();
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext('2d')!;
			context.drawImage(image, 0, 0);
			const y = Math.floor(image.naturalHeight / 2);
			return (xs as number[]).map((d) => {
				const [r, g, b] = context.getImageData((padding as number) + d, y, 1, 1).data;
				return `${r},${g},${b}`;
			});
		},
		[`data:image/png;base64,${shot.toString('base64')}`, pad, offsets] as const
	);
}

const setTheme = (page: Page, theme: string) =>
	page.evaluate((t) => {
		localStorage.setItem('winui-svelte:theme', t);
		document.documentElement.dataset.theme = t;
	}, theme);

test('the highlight is the trigger’s box grown by four, on every row that takes focus', async ({
	page
}) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	for (const index of ENABLED) {
		const trigger = await light(page, index);
		expect(await highlightOf(trigger), `row ${index}: no highlight on the focused trigger`).toBe(
			await grownBoxOf(trigger)
		);
	}
});

test('no pseudo-element is generated on the root', async ({ page }) => {
	// The band this replaced lived there, and there is where the arithmetic was wrong: the root
	// is the flex column the header, the trigger and the description share.
	await page.goto(ROUTE);
	await growViewportToContent(page);
	for (const index of ENABLED) {
		await light(page, index);
		expect(
			await page
				.locator('.root')
				.nth(index)
				.evaluate((el) => [
					getComputedStyle(el, '::before').content,
					getComputedStyle(el, '::after').content
				]),
			`row ${index}: the root generates a pseudo-element while its trigger has focus`
		).toEqual(['none', 'none']);
	}
});

test('the row with a header and a description grows its trigger, not the column', async ({
	page
}) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	const trigger = await light(page, HEADERED);
	const root = page.locator('.root').nth(HEADERED);

	// The positive control for the two tests above: on this route only this row can tell the
	// trigger's box from the root's, so if the two ever coincide they stop measuring anything.
	expect(await boxOf(root), 'this row no longer has a root taller than its trigger').not.toBe(
		await boxOf(trigger)
	);
	expect(await highlightOf(trigger)).toBe(await grownBoxOf(trigger));
});

test('four pixels appear outside the box and the fifth is untouched, in every theme', async ({
	page
}) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	const trigger = page.locator('.trigger').first();
	const offsets = [-5, -4, -3, -2, -1, 0, 1];
	const resting: Record<string, string[]> = {};

	for (const theme of THEMES) {
		await setTheme(page, theme);
		await expect
			.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''))
			.toBe(theme);

		const rest = await midline(page, trigger, offsets);
		resting[theme] = rest;

		await light(page, 0);
		const lit = await midline(page, trigger, offsets);
		const at = (d: number) => lit[offsets.indexOf(d)];
		const was = (d: number) => rest[offsets.indexOf(d)];

		// `Margin="-4"` exactly: the fourth pixel out is the highlight and the fifth is whatever
		// the page was already painting there.
		expect(at(-1), `${theme}: nothing appeared beside the box`).not.toBe(was(-1));
		expect(at(-4), `${theme}: the highlight stops short of four pixels`).not.toBe(was(-4));
		expect(at(-5), `${theme}: the highlight reaches a fifth pixel`).toBe(was(-5));

		// `ComboBoxBackgroundBorderThicknessFocused` is 2 and the margin is 4, so the four split
		// two and two: the stroke outside, its fill inside. Stated as equalities because the two
		// are the same colour in high contrast, where the stroke is transparent.
		expect(at(-4), `${theme}: the outer two pixels are not one stroke`).toBe(at(-3));
		expect(at(-2), `${theme}: the inner two pixels are not one fill`).toBe(at(-1));

		await trigger.evaluate((el: HTMLElement) => el.blur());
	}

	// The control that those were three themes and not one theme three times. This is the box's
	// own border pixel at rest, and no two themes paint it the same.
	expect(
		new Set(THEMES.map((theme) => resting[theme][offsets.indexOf(0)])).size,
		'two themes painted the resting border alike, so the render did not follow the attribute'
	).toBe(THEMES.length);
});

test('the stroke is a separate colour in light and dark, and absent in high contrast', async ({
	page
}) => {
	// `ComboBoxBackgroundBorderBrushFocused` is `FocusStrokeColorOuterBrush` under Default and
	// Light and `SystemControlHighlightTransparentBrush` under HighContrast
	// (ComboBox_themeresources.xaml:38, :143, :248), so there the four pixels are one colour.
	// Without this the equalities in the test above are satisfied by a highlight that lost its
	// stroke everywhere.
	await page.goto(ROUTE);
	await growViewportToContent(page);
	const trigger = page.locator('.trigger').first();

	for (const [theme, distinct] of [
		['light', true],
		['dark', true],
		['high-contrast', false]
	] as const) {
		await setTheme(page, theme);
		await expect
			.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''))
			.toBe(theme);
		await light(page, 0);
		const [stroke, fill] = await midline(page, trigger, [-4, -1]);
		if (distinct) expect(stroke, `${theme}: the stroke and the fill are one colour`).not.toBe(fill);
		else expect(stroke, `${theme}: the stroke paints where it should be transparent`).toBe(fill);
		await trigger.evaluate((el: HTMLElement) => el.blur());
	}
});

test('in high contrast the box keeps its own fill under the highlight', async ({ page }) => {
	// This is what says the highlight went *under* the box rather than over it, and high contrast
	// is the only theme that can say it. There the highlight's fill is opaque — it resolves
	// through `ComboBoxBackgroundUnfocused` (ComboBox_themeresources.xaml:142) to
	// `SystemControlHighlightListAccentLowBrush` — so a highlight painted on top covers the
	// control: measured, 9540 of the trigger's 10560 pixels move instead of 368, and the 368 are
	// its corners, where the page used to show through the radius. In light and dark the fill is
	// translucent and the same mistake moves 517 and 250 pixels, which no single reading tells
	// from the second fill layer that arriving legitimately underneath already adds.
	//
	// The box's own border is no help here: the ring is `.trigger::after`, later in the tree than
	// the highlight and painted over it either way.
	await page.goto(ROUTE);
	await growViewportToContent(page);
	await setTheme(page, 'high-contrast');
	await expect
		.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''))
		.toBe('high-contrast');

	const trigger = page.locator('.trigger').first();
	const middle = Math.round((await trigger.boundingBox())!.width / 2);
	const [restingMiddle] = await midline(page, trigger, [middle]);

	await light(page, 0);
	const [litMiddle, halo] = await midline(page, trigger, [middle, -3]);

	expect(litMiddle, 'the highlight is painting over the middle of the box').toBe(restingMiddle);
	expect(halo, 'the highlight is not painting beside the box at all').not.toBe(litMiddle);
});

test('the highlight takes upstream’s corner and not a concentric one', async ({ page }) => {
	// `ControlCornerRadius` is 4 and this box is 4 outside it, so a concentric corner would be 8;
	// `ComboBoxHiglightBorderCornerRadius` is 7 (ComboBox_themeresources.xaml:343). Read from the
	// computed style rather than a corner pixel: an element screenshot can sit half a device
	// pixel off vertically — `inner-border-edge.spec.ts:375` — which moves a corner reading by a
	// row, and differently on the two browsers.
	await page.goto(ROUTE);
	await growViewportToContent(page);
	const trigger = await light(page, 0);
	const [own, highlight, token] = await trigger.evaluate((el) => [
		getComputedStyle(el).borderRadius,
		getComputedStyle(el, '::before').borderRadius,
		getComputedStyle(document.documentElement)
			.getPropertyValue('--winui-ComboBoxHiglightBorderCornerRadius')
			.trim()
	]);
	expect(highlight, 'the highlight rounds like the box it grows from').not.toBe(own);
	expect(highlight, 'the highlight rounds by something other than its own resource').toBe(token);
});

test('a pointer lights nothing and a key lights it', async ({ page }) => {
	// `PointerFocused` (ComboBox_themeresources.xaml:504) is an empty visual state where
	// `Focused` (:473) is not, so a pointer-acquired focus shows nothing at all. That is what
	// `:focus-visible` models, and it is why no band in this library keys on `:focus`.
	await page.goto(ROUTE);
	await growViewportToContent(page);
	const trigger = page.locator('.trigger').first();

	await trigger.click();
	await expect(trigger).toBeFocused();
	expect(await trigger.evaluate((el) => el.matches(':focus-visible'))).toBe(false);
	expect(await highlightOf(trigger), 'a click on the trigger drew a focus visual').toBe(null);

	// The click opened the dropdown; Escape closes it and is also the key press that lights the
	// trigger, so one action carries the control and its opposite.
	await page.keyboard.press('Escape');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	expect(await trigger.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
	expect(await highlightOf(trigger)).toBe(await grownBoxOf(trigger));
});
