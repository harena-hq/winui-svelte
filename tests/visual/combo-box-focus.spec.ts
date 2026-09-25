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
 * read `ComboBoxTopHeaderMargin` — the four-value Thickness `0px 0px 8px 0px` in tokens.css,
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

/** The triggers on the route that can take focus. Indexes 4 and 8 are disabled and decline. */
const ENABLED = [0, 1, 2, 3, 5, 6, 7];

/**
 * The two the route renders with their drop-down already open. They take focus like any other,
 * and they draw no focus visual while they are open, because `FocusedDropDown` ends the
 * `Focused` state — so a test about what focus draws has to leave them out and a test about the
 * drop-down has to put them back. They were in every loop below until 2026-09-24, when the
 * reproduction started following that state and two rows stopped drawing a highlight.
 */
const OPEN = [5, 7];
const CLOSED = ENABLED.filter((index) => !OPEN.includes(index));

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
	for (const index of CLOSED) {
		const trigger = await light(page, index);
		expect(await highlightOf(trigger), `row ${index}: no highlight on the focused trigger`).toBe(
			await grownBoxOf(trigger)
		);
	}
});

test('the rows whose drop-down is open draw neither visual', async ({ page }) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	// The counterpart to the loops that leave these two out. They take focus like any other
	// row; what they do not do is draw, because the route renders them open and
	// `FocusedDropDown` has ended the `Focused` state before focus ever arrives.
	for (const index of OPEN) {
		const trigger = await light(page, index);
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		expect(await highlightOf(trigger), `row ${index}: an open row drew a highlight`).toBe(null);
		expect(await pillShown(trigger), `row ${index}: an open row raised its pill`).toBe(false);
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
	expect(await pillShown(trigger), 'a click on the trigger raised the pill').toBe(false);

	// A second click closes it and leaves focus where it was, which is the only way to reach
	// pointer-focused-and-closed on this control short of holding the button down: every click
	// opens the drop-down, and while that is open `FocusedDropDown` hides both visuals whatever
	// acquired focus. Without this step nothing here separates `:focus` from `:focus-visible` —
	// the open list hides the difference, and a rule keyed on the wrong one passes.
	await trigger.click();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	expect(await trigger.evaluate((el) => el.matches(':focus-visible'))).toBe(false);
	expect(await highlightOf(trigger), 'a pointer-focused closed trigger drew a visual').toBe(null);
	expect(await pillShown(trigger), 'a pointer-focused closed trigger raised the pill').toBe(false);

	// Escape is the key press that lights it, so one action carries the control and its
	// opposite.
	await page.keyboard.press('Escape');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	expect(await trigger.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
	expect(await highlightOf(trigger)).toBe(await grownBoxOf(trigger));
	// One Storyboard raises both, so the key that lights one has to light the other.
	expect(await pillShown(trigger), 'the key lit the highlight and not the pill').toBe(true);
});

/*
 * The Pill. The same `Focused` state that raises `HighlightBackground` raises a second thing —
 * `ComboBox_themeresources.xaml:476` against `:475` — and `FocusedPressed` raises both again at
 * `:490` and `:491`. It is three pixels wide inside the trigger's left edge, where the highlight
 * is four pixels outside it, so the two share no pixel and each is measured on its own.
 */

/** The offsets a pill covers and the first one past it, from the trigger's left border edge. */
const PILL = [1, 2, 3];
const PAST_PILL = 4;

/** The style's own numbers, read from the layer rather than written here. */
const pillTokens = (page: Page) =>
	page.evaluate(() => {
		const cs = getComputedStyle(document.documentElement);
		return {
			width: cs.getPropertyValue('--winui-ComboBoxItemPillWidth').trim(),
			height: cs.getPropertyValue('--winui-ComboBoxItemPillHeight').trim(),
			radius: cs.getPropertyValue('--winui-ComboBoxItemPillCornerRadius').trim()
		};
	});

/**
 * Whether the trigger's pill is on screen — read as a picture rather than as a property, so that
 * these tests say nothing about *how* it is hidden. The component hides it with `visibility`
 * rather than `opacity` for a measured reason, and the thing that holds that choice is
 * `color-picker-horizontal`'s baseline on the guest, not an assertion here.
 */
const pillShown = (trigger: Locator) =>
	trigger.locator('> .pill').evaluate((el) => {
		const style = getComputedStyle(el);
		return style.visibility === 'visible' && style.opacity !== '0';
	});

test('the pill is the style’s box, one pixel inside the left edge, on every row that focuses', async ({
	page
}) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	const tokens = await pillTokens(page);

	for (const index of CLOSED) {
		const trigger = await light(page, index);
		const box = (await trigger.boundingBox())!;
		const pill = (await trigger.locator('> .pill').boundingBox())!;
		const radius = await trigger
			.locator('> .pill')
			.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);

		expect(`${pill.width}px`, `row ${index} pill width`).toBe(tokens.width);
		expect(`${pill.height}px`, `row ${index} pill height`).toBe(tokens.height);
		expect(radius, `row ${index} pill radius`).toBe(tokens.radius);
		// `Margin="1,0,0,0"` measured from the Grid cell, which is the border box.
		expect(pill.x - box.x, `row ${index} pill inset`).toBe(1);
		// No `VerticalAlignment` and an explicit `Height`, so it centres in that same cell.
		expect(pill.y + pill.height / 2 - (box.y + box.height / 2), `row ${index} pill centre`).toBe(0);
	}
});

test('three pixels light and the fourth does not, in every theme', async ({ page }) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	const trigger = page.locator('.trigger').first();
	const offsets = [...PILL, PAST_PILL];
	const lit: string[] = [];

	for (const theme of THEMES) {
		await setTheme(page, theme);
		await expect
			.poll(() => page.evaluate(() => document.documentElement.dataset.theme ?? ''))
			.toBe(theme);

		const rest = await midline(page, trigger, offsets);
		expect(new Set(rest).size, `${theme}: something already stood where the pill goes`).toBe(1);

		await light(page, 0);
		const focused = await midline(page, trigger, offsets);
		const at = (d: number) => focused[offsets.indexOf(d)];
		const was = (d: number) => rest[offsets.indexOf(d)];
		// `Width` is 3 and the margin puts it at one, so offsets 1, 2 and 3 are the whole pill
		// and offset 4 is the first pixel of the box behind it.
		expect(new Set(PILL.map(at)).size, `${theme}: the pill is not one colour`).toBe(1);
		expect(at(PILL[0]), `${theme}: the pill did not light`).not.toBe(was(PILL[0]));
		expect(at(PAST_PILL), `${theme}: the pill reaches a fourth pixel`).not.toBe(at(PILL[0]));
		lit.push(at(PILL[0]));

		await trigger.evaluate((el: HTMLElement) => el.blur());
	}

	// The control that this was three themes and not one read three times. The fill is
	// `AccentFillColorDefaultBrush` in light and in dark — different accents — and
	// `SystemControlHighlightListAccentLowBrush` under high contrast.
	expect(
		new Set(lit).size,
		`two themes painted the pill alike, so the render did not follow the attribute: ${lit.join(' ')}`
	).toBe(THEMES.length);
});

test('lighting the pill moves no text', async ({ page }) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	// Upstream's Pill and its ContentPresenter share one Grid cell — the trigger's Grid gives
	// row 1 no column split — so the pill overlaps the padding rather than reserving a column,
	// and the label sits at the control's own padding whether the pill is up or not.
	//
	// **Against the padding, not against itself.** Comparing the label's position before and
	// against after cannot see the defect this describes: the pill is in the document at rest
	// too, and `visibility: hidden` leaves its box in place, so a `position: static` pill
	// displaces the label equally in both readings and the difference stays zero.
	const padding = Number(
		(
			await page.evaluate(
				() =>
					getComputedStyle(document.documentElement)
						.getPropertyValue('--winui-ComboBoxPadding')
						.trim()
						.split(/\s+/)[3]
			)
		).replace('px', '')
	);
	const trigger = page.locator('.trigger').first();
	const value = trigger.locator('.value');
	// The label's offset from the control's outer edge is the padding alone — the presenter's
	// margin is measured from the cell, which the stroke does not narrow — and the pill, one
	// pixel in and three wide, is inside it. combo-box-trigger-box.spec.ts measures every row.
	const inset = async () => (await value.boundingBox())!.x - (await trigger.boundingBox())!.x;
	expect(await inset(), 'the label did not start at the control’s padding').toBe(padding);
	await light(page, 0);
	expect(await inset(), 'the label moved when the pill lit').toBe(padding);
});

test('the disabled row carries a pill and never lights it', async ({ page }) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	const trigger = page.locator('.trigger').nth(4);
	await expect(trigger).toBeDisabled();
	// The Rectangle is in the template whatever the state; what a disabled row cannot do is
	// reach `Focused`. Asserting the element exists is what separates "never lights" from
	// "was never rendered", which would pass this for the wrong reason.
	await expect(trigger.locator('> .pill')).toHaveCount(1);
	await trigger.evaluate((el: HTMLElement) => el.focus());
	expect(await trigger.evaluate((el) => el.matches(':focus-visible'))).toBe(false);
	expect(await pillShown(trigger)).toBe(false);
});

test('the pill and the highlight are one state, not two', async ({ page }) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	const trigger = page.locator('.trigger').first();
	// `Focused` raises both in one Storyboard, so a rule that lit one on a different selector
	// would pass every test above and still be wrong. Read them in the same tick.
	const read = async () => ({
		pill: await pillShown(trigger),
		highlight: await trigger.evaluate((el) => getComputedStyle(el, '::before').content)
	});
	const resting = await read();
	await light(page, 0);
	const focused = await read();
	expect(resting.pill).toBe(false);
	expect(resting.highlight, 'the highlight was already generated at rest').toBe('none');
	expect(focused.pill).toBe(true);
	expect(focused.highlight, 'the highlight did not appear with the pill').not.toBe('none');
});

test('the open drop-down ends the focus state, so neither visual is drawn', async ({ page }) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	// `FocusedDropDown` (ComboBox_themeresources.xaml:505) is the fifth state in `FocusStates`,
	// and entering it ends `Focused`'s storyboard: upstream returns both `HighlightBackground`
	// and `Pill` to `Opacity="0"` while the list is open. Focus does not leave the trigger when
	// the popup opens, so a rule keyed on `:focus-visible` alone draws both — which is what this
	// is here to catch.
	const trigger = await light(page, 0);
	expect(await highlightOf(trigger)).toBe(await grownBoxOf(trigger));
	expect(await pillShown(trigger)).toBe(true);

	await page.keyboard.press('Enter');
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	expect(await highlightOf(trigger), 'the highlight survived the drop-down opening').toBe(null);
	expect(await pillShown(trigger), 'the pill survived the drop-down opening').toBe(false);

	await page.keyboard.press('Escape');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	// And back: closing restores the attribute, and with it the state.
	expect(await highlightOf(trigger), 'the highlight did not come back').not.toBe(null);
	expect(await pillShown(trigger), 'the pill did not come back').toBe(true);
});

test('the item’s pill sits on its own left edge and only the selected row shows one', async ({
	page
}) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	const tokens = await pillTokens(page);
	// Row 6 is the one with a selection on this route; a placeholder row raises no pill at all,
	// which would pass the count below for the wrong reason.
	const trigger = await light(page, 6);
	// **Mark the lists that are already open before opening this one.** Rows 5 and 7 render
	// open, so an unscoped `[data-select-content]` spans three popups and ten rows: the count
	// guard below would be satisfied by lists this test never opened, and would promise a
	// guarantee it could not deliver. The trigger carries no `aria-controls` to scope by.
	await page.evaluate(() =>
		document
			.querySelectorAll('[data-select-content]')
			.forEach((el) => el.setAttribute('data-already-open', ''))
	);
	await page.keyboard.press('Enter');
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');

	// `ComboBoxItemThemePadding` is where the label starts, and the pill overlaps it.
	const padding = Number(
		(
			await page.evaluate(
				() =>
					getComputedStyle(document.documentElement)
						.getPropertyValue('--winui-ComboBoxItemThemePadding')
						.trim()
						.split(/\s+/)[3]
			)
		).replace('px', '')
	);
	const items = page.locator('[data-select-content]:not([data-already-open]) .item');
	await expect(items.first()).toBeVisible();
	const count = await items.count();
	expect(count, 'the list rendered no rows, so nothing below is about an item').toBeGreaterThan(1);

	let shown = 0;
	for (let index = 0; index < count; index++) {
		const item = items.nth(index);
		const box = (await item.boundingBox())!;
		const pill = (await item.locator('> .pill').boundingBox())!;
		expect(`${pill.width}px`, `item ${index} pill width`).toBe(tokens.width);
		expect(`${pill.height}px`, `item ${index} pill height`).toBe(tokens.height);
		// `:759` carries no `Margin`, and the item writes no border, so nought is the whole of
		// the offset. This is the assertion the child combinator in the rule needs: if the
		// primitive ever interposes a wrapper, `left` falls back to `auto` and the pill takes a
		// static position at the content edge, which every other test here would let through.
		expect(pill.x - box.x, `item ${index} pill inset`).toBe(0);
		// And the label does not move for it. Upstream's Pill and ContentPresenter share one
		// cell, so the text sits at the item's own padding whether the row is selected or not;
		// this repro inset it by four more until 2026-09-24.
		const label = (await item.locator('> .item-content').boundingBox())!;
		expect(label.x - box.x, `item ${index} label inset`).toBe(padding);
		if (
			await item
				.locator('> .pill')
				.evaluate(
					(el) =>
						getComputedStyle(el).opacity !== '0' && getComputedStyle(el).visibility === 'visible'
				)
		)
			shown++;
	}
	// One row is selected on this route, and `Opacity` is raised by the five `Selected*` states
	// and nothing else.
	expect(shown, 'more than the selected row raised its pill').toBe(1);
});

test('a pressed selected row shrinks its pill over the storyboard and releases at once', async ({
	page
}) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	// Row 1 is plain and has a selection. The lists rows 5 and 7 render open are marked first, so
	// the selected row found below is the one this test opened.
	await page.evaluate(() =>
		document
			.querySelectorAll('[data-select-content]')
			.forEach((el) => el.setAttribute('data-already-open', ''))
	);
	const trigger = page.locator('.trigger').nth(1);
	await trigger.click();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	const selected = page.locator(
		'[data-select-content]:not([data-already-open]) .item[data-selected]'
	);
	await expect(selected).toHaveCount(1);
	const pill = selected.locator('> .pill');
	const transition = () =>
		pill.evaluate((el) => {
			const style = getComputedStyle(el);
			return {
				property: style.transitionProperty,
				duration: style.transitionDuration,
				easing: style.transitionTimingFunction
			};
		});

	// Leaving `SelectedPressed` ends its storyboard — the group declares no `VisualTransition` —
	// so the scale is back at 1 in the frame the press ends. The states a press can be left
	// for are `Selected` and, with the pointer still on the row, `SelectedPointerOver` — a release
	// on this row also selects it and closes the list, so the two are read before the press — and
	// the pill declares no transition in either. The primitive highlights the selected row when the list opens and keeps the
	// highlight until another row takes it, so reaching plain `Selected` means moving the pointer
	// over a different row first.
	const other = page.locator(
		'[data-select-content]:not([data-already-open]) .item:not([data-selected]):not([data-disabled])'
	);
	const otherBox = (await other.first().boundingBox())!;
	await page.mouse.move(otherBox.x + otherBox.width / 2, otherBox.y + otherBox.height / 2);
	await expect(selected).not.toHaveAttribute('data-highlighted');
	expect((await transition()).duration, 'Selected').toBe('0s');
	const box = (await selected.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await expect(selected).toHaveAttribute('data-highlighted');
	expect((await transition()).duration, 'SelectedPointerOver').toBe('0s');

	await page.mouse.down();
	// The press declares one transition, on `scale` alone, with the keyframe's timing: the duration
	// token and `KeySpline="0,0,0,1"` (ComboBox_themeresources.xaml:727). These are computed
	// values, so they do not depend on when they are read. The token is written `167ms` and the
	// build's minifier writes it back as `.167s`, so the comparison is against the token as the
	// page resolves it rather than against either spelling.
	const token = await pill.evaluate((el) =>
		getComputedStyle(el).getPropertyValue('--winui-ComboBoxItemScaleAnimationDuration').trim()
	);
	const seconds = token.endsWith('ms')
		? Number(token.slice(0, -2)) / 1000
		: Number(token.slice(0, -1));
	// `ComboBoxItemScaleAnimationDuration` is `00:00:00.167` at ComboBox_themeresources.xaml:330;
	// pinned here so a mis-converted token cannot pass by agreeing with itself.
	expect(seconds, `the duration token read as ${token}`).toBe(0.167);
	expect(await transition()).toEqual({
		property: 'scale',
		duration: `${seconds}s`,
		easing: 'cubic-bezier(0, 0, 0, 1)'
	});
	// And it arrives where the keyframe does, on one axis.
	await expect.poll(() => pill.evaluate((el) => getComputedStyle(el).scale)).toBe('1 0.625');
	await page.mouse.up();
});

test('under reduced motion the pressed pill still takes the storyboard’s time', async ({
	page
}) => {
	// ADR 0016: a state's own keyframe animations run whatever the system animation setting
	// (`VisualStateManagerActuator.cpp:202`); the skip at :602 is for transition and generated
	// storyboards.
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto(ROUTE);
	await growViewportToContent(page);
	await page.evaluate(() =>
		document
			.querySelectorAll('[data-select-content]')
			.forEach((el) => el.setAttribute('data-already-open', ''))
	);
	const trigger = page.locator('.trigger').nth(1);
	await trigger.click();
	const selected = page.locator(
		'[data-select-content]:not([data-already-open]) .item[data-selected]'
	);
	await expect(selected).toHaveCount(1);
	const pill = selected.locator('> .pill');
	const box = (await selected.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	expect(await pill.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0.167s');
	await expect.poll(() => pill.evaluate((el) => getComputedStyle(el).scale)).toBe('1 0.625');
	await page.mouse.up();
});

/*
 * The focus states' own brushes. A property holds one animation at a time, the one begun last
 * takes it (see the comment on these rules in ComboBox.svelte), and a press on a
 * keyboard-focused trigger begins `Pressed` and then `FocusedPressed`
 * (ComboBox_Partial.cpp:850-905) — so while it is held, the focus state's brushes show.
 */

/** What `var(--winui-<token>)` computes to as a colour, on an element beside `near`. */
const tokenColour = (near: Locator, token: string) =>
	near.evaluate((el, token) => {
		const probe = document.createElement('span');
		probe.style.color = `var(--winui-${token})`;
		el.parentElement!.append(probe);
		const value = getComputedStyle(probe).color;
		probe.remove();
		return value;
	}, token);

const colourOf = (element: Locator) => element.evaluate((el) => getComputedStyle(el).color);

test('a keyboard-focused trigger held down paints FocusedPressed’s three brushes', async ({
	page
}) => {
	await page.goto(ROUTE);
	await growViewportToContent(page);
	// Light, where each of the three differs from `Pressed`'s: the content Primary against
	// Secondary, the placeholder Secondary against Tertiary, the chevron its own brush against
	// none. The first trigger shows its placeholder and the second a selection.
	for (const [index, part, token, pressedToken, restToken] of [
		[
			0,
			'.placeholder',
			'ComboBoxPlaceHolderForegroundFocusedPressed',
			'ComboBoxPlaceHolderForegroundPressed',
			'ComboBoxPlaceHolderForeground'
		],
		[
			1,
			'.value',
			'ComboBoxForegroundFocusedPressed',
			'ComboBoxForegroundPressed',
			'ComboBoxForeground'
		],
		[
			1,
			'.chevron',
			'ComboBoxDropDownGlyphForegroundFocusedPressed',
			'ComboBoxDropDownGlyphForeground',
			'ComboBoxDropDownGlyphForeground'
		]
	] as const) {
		const trigger = await light(page, index);
		const element = trigger.locator(part);
		await expect(element).toHaveCount(1);
		const focusedPressed = await tokenColour(trigger, token);
		expect(focusedPressed, `${part}: nothing here could disagree`).not.toBe(
			await tokenColour(trigger, pressedToken)
		);
		// Focused alone paints what rest does. For the chevron, a rule that forgot the press
		// shows here; `.value` and `.placeholder` alias the same colour focused, pressed or not,
		// so for them that mistake has no pixel to show.
		expect(await colourOf(element), `${part}, focused and not pressed`).toBe(
			await tokenColour(trigger, restToken)
		);
		const box = (await trigger.boundingBox())!;
		await page.mouse.move(box.x + box.width / 3, box.y + box.height / 2);
		await page.mouse.down();
		// The press has to leave the keyboard's focus state in place, or this is `Pressed`.
		expect(await trigger.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
		await expect(trigger).toHaveAttribute('data-pressed');
		expect(await colourOf(element), part).toBe(focusedPressed);
		await page.mouse.move(box.x + box.width / 3, box.y + box.height + 120);
		await page.mouse.up();
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	}
});
