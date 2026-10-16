/**
 * The glyphs the release's own components draw, and what each draws off Windows. ADR 0018.
 *
 * Every row is a Segoe Fluent Icons code point that one of the eighteen components the package
 * root exports, or the ScrollBar part ScrollView and ScrollViewer render, writes for itself:
 * a chevron, a close button, a caret. A code point a consumer passes as `glyph` draws from this
 * font off Windows only if it is one of these; any other draws whatever the browser
 * substitutes, if anything.
 *
 * `fluent` names the Fluent UI System Icons SVG whose shape stands in for it. `box` is the
 * Segoe Fluent Icons glyph's ink, `[left, right, bottom, top]` in thousandths of an em: left and
 * right from the glyph's origin, bottom and top above the baseline. It was measured on the
 * reference guest with a canvas's `measureText` at 1000px, where the font's ascent is 1000 and
 * its descent 0, which `font.mjs` gives this one too. The stand-in is scaled, without
 * distortion, to fit that box and centred in it.
 *
 * `part: 'holes'` takes the subpaths after a filled circle's first, the symbol the circle has
 * knocked out of it, and places them with the transform the row named by `with` was fitted
 * with. InfoBar draws its severity icon as two glyphs, the circle `StatusCircleOuter` and a
 * symbol over it in another colour, and Fluent draws the same pair as one circle with the
 * symbol cut out; sharing the circle's transform keeps the symbol where Fluent put it. Such a
 * row's `box` is the Segoe symbol's, measured the same way; nothing is fitted to it, and
 * `tests/visual/icon-fallback.spec.ts` holds the symbol drawn here near its centre.
 */
export const FALLBACK_GLYPHS = [
	{
		point: 'E700',
		segoe: 'GlobalNavButton',
		fluent: 'navigation_16_regular',
		box: [0, 1000, 188, 875]
	},
	{
		point: 'E70D',
		segoe: 'ChevronDown',
		fluent: 'chevron_down_16_regular',
		box: [125, 875, 281, 688]
	},
	{ point: 'E70E', segoe: 'ChevronUp', fluent: 'chevron_up_16_regular', box: [125, 875, 313, 719] },
	{ point: 'E710', segoe: 'Add', fluent: 'add_16_regular', box: [63, 875, 125, 938] },
	{ point: 'E711', segoe: 'Cancel', fluent: 'dismiss_16_regular', box: [125, 813, 188, 875] },
	{ point: 'E712', segoe: 'More', fluent: 'more_horizontal_16_regular', box: [109, 891, 422, 578] },
	{ point: 'E713', segoe: 'Settings', fluent: 'settings_16_regular', box: [16, 984, 0, 1000] },
	{ point: 'E72B', segoe: 'Back', fluent: 'arrow_left_16_regular', box: [0, 1000, 63, 1000] },
	{ point: 'E894', segoe: 'Clear', fluent: 'dismiss_16_regular', box: [125, 813, 188, 875] },
	{
		point: 'EDD9',
		segoe: 'CaretLeftSolid8',
		fluent: 'caret_left_16_filled',
		box: [125, 875, 0, 1000]
	},
	{
		point: 'EDDA',
		segoe: 'CaretRightSolid8',
		fluent: 'caret_right_16_filled',
		box: [125, 875, 0, 1000]
	},
	{ point: 'EDDB', segoe: 'CaretUpSolid8', fluent: 'caret_up_16_filled', box: [0, 1000, 125, 875] },
	{
		point: 'EDDC',
		segoe: 'CaretDownSolid8',
		fluent: 'caret_down_16_filled',
		box: [0, 1000, 125, 875]
	},
	{ point: 'F136', segoe: 'StatusCircleOuter', fluent: 'circle_16_filled', box: [0, 938, 0, 938] },
	{
		point: 'F13C',
		segoe: 'StatusCircleExclamation',
		fluent: 'error_circle_16_filled',
		part: 'holes',
		with: 'F136',
		box: [422, 516, 250, 656]
	},
	{
		point: 'F13D',
		segoe: 'StatusCircleErrorX',
		fluent: 'dismiss_circle_16_filled',
		part: 'holes',
		with: 'F136',
		box: [313, 625, 313, 625]
	},
	{
		point: 'F13E',
		segoe: 'StatusCircleCheckmark',
		fluent: 'checkmark_circle_16_filled',
		part: 'holes',
		with: 'F136',
		box: [250, 688, 313, 625]
	},
	{
		point: 'F13F',
		segoe: 'StatusCircleInfo',
		fluent: 'info_16_filled',
		part: 'holes',
		with: 'F136',
		box: [422, 516, 281, 688]
	}
];

/** The family the token layer names after the two Segoe families. */
export const FALLBACK_FAMILY = 'winui-svelte icons';
