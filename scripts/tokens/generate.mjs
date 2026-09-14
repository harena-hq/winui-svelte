import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	ACCENT_COLORS,
	ADDITIONAL_KEYS,
	AUTOSUGGESTBOX_KEYS,
	BUTTON_KEYS,
	CHECKBOX_KEYS,
	COMBOBOX_KEYS,
	EXCLUDED,
	PLATFORM_FONTS,
	PLATFORM_METRICS,
	PLATFORM_SHADOWS,
	RADIOBUTTON_KEYS,
	RADIOBUTTONS_KEYS,
	SPLITVIEW_KEYS,
	SLIDER_KEYS,
	SOURCE_FILES,
	DOUBLE_LENGTHS,
	DOUBLE_RATIOS,
	GLYPHS,
	STRING_FONT_SIZES,
	SHELL_KEYS,
	PLATFORM_BRUSHES,
	SYSTEM_COLORS,
	TEXTBOX_KEYS,
	TOGGLESWITCH_KEYS,
	PASSWORDBOX_KEYS,
	NUMBERBOX_KEYS,
	TOOLTIP_KEYS,
	INFOBADGE_KEYS,
	PROGRESSBAR_KEYS,
	PROGRESSRING_KEYS,
	INFOBAR_KEYS,
	EXPANDER_KEYS,
	BREADCRUMBBAR_KEYS,
	CALENDARVIEW_KEYS,
	CALENDARDATEPICKER_KEYS,
	DATETIMEPICKERFLYOUT_KEYS,
	DATEPICKER_KEYS,
	TIMEPICKER_KEYS,
	SELECTORBAR_KEYS,
	PIVOT_KEYS,
	TABVIEW_KEYS,
	FLYOUT_KEYS,
	CONTENTDIALOG_KEYS,
	MENUFLYOUT_KEYS,
	MENUBAR_KEYS,
	TEACHINGTIP_KEYS,
	TOGGLEBUTTON_KEYS,
	HYPERLINK_KEYS,
	RATINGCONTROL_KEYS,
	COLORPICKER_KEYS,
	HYPERLINKBUTTON_KEYS,
	DROPDOWNBUTTON_KEYS,
	SPLITBUTTON_KEYS,
	APPBARBUTTON_KEYS,
	APPBARTOGGLEBUTTON_KEYS,
	APPBARSEPARATOR_KEYS,
	COMMANDBAR_KEYS,
	COMMANDBARFLYOUT_KEYS,
	REPEATBUTTON_KEYS,
	ITEMCONTAINER_KEYS,
	LISTVIEWITEM_KEYS,
	GRIDVIEWITEM_KEYS,
	TREEVIEWITEM_KEYS,
	FLIPVIEW_KEYS,
	SCROLLBAR_KEYS,
	SCROLLVIEW_KEYS,
	PIPSPAGER_KEYS,
	ANNOTATEDSCROLLBAR_KEYS,
	PULLTOREFRESH_KEYS,
	PERSONPICTURE_KEYS,
	MEDIATRANSPORTCONTROLS_KEYS,
	DEFINED_BY,
	TYPE_RAMP
} from './manifest.mjs';

/**
 * The v1 token CSS, generated from the committed extraction.
 *
 * `generate()` returns file contents rather than writing them, so C2 can ask what the
 * output should be without a disk write of its own — a parity gate that had to write
 * first would be reporting on its own side effect.
 *
 * Everything this file cannot convert is a stop. A generator that guesses produces a
 * stylesheet that looks complete and is wrong somewhere nobody is looking, which is
 * the one failure mode a token layer cannot afford: a dropped declaration is invisible
 * until a control is built on top of it.
 */

// `new URL(...).pathname` is a URL component — percent-encoded, and on Windows
// `file:///C:/repo` yields `/C:/repo`, which no `readFile` can open. D6 puts a Windows
// runner in the plan, so this is not hypothetical.
const ROOT = fileURLToPath(new URL('../../', import.meta.url)).replace(/[\\/]$/, '');

const RECORD = 'data/winui-tokens.json';
const FRAMEWORK_RECORD = 'data/winui-framework.json';
const OUTPUT = 'packages/winui-svelte/src/lib/tokens/tokens.css';
const RAMP_OUTPUT = 'packages/winui-svelte/src/lib/tokens/type-ramp.css';
const COMPACT_DENSITY_FILE = 'controls/dev/dll/DensityStyles/Compact.xaml';

const fail = (message) => {
	throw new Error(message);
};

/** Where a record came from, for a failure message that can be acted on. */
const at = (record) => `${record.key} (${record.file}:${record.line})`;

// `Default` is the dark theme, not a neutral fallback: WinUI's fallback dictionary
// holds the dark values, and every file carrying a `Default` also carries an explicit
// `Light`. ADR 0005.
const DARK = 'Default';
const LIGHT = 'Light';
const HIGH_CONTRAST = 'HighContrast';
const THEMED = [DARK, LIGHT, HIGH_CONTRAST];

// `{ThemeResource X}` and `{StaticResource X}` differ only in when XAML re-evaluates
// the lookup, and `var()` re-evaluates unconditionally — so both become `var(--winui-X)`
// and the distinction has nowhere to go.
const REFERENCE = /^\{(?:Theme|Static)Resource\s+([^}]+)\}$/;

// The colors XAML spells by name. An allowlist rather than a passthrough: a XAML color
// name CSS does not share would otherwise become a declaration the browser drops, which
// is indistinguishable from a token nobody defined.
const NAMED_COLORS = new Set(['transparent', 'white', 'black', 'lightgray']);

// Prettier formats this file like every other tracked one, so the generator has to emit
// what Prettier would. It measures a tab as `tabWidth`.
const PRINT_WIDTH = 100;
const TAB_WIDTH = 2;

/* -------------------------------------------------------------------------- value conversion */

function color(raw, where) {
	const value = raw.trim();

	if (!value.startsWith('#')) {
		if (!NAMED_COLORS.has(value.toLowerCase())) fail(`${where}: unknown color name \`${value}\``);
		return value.toLowerCase();
	}

	const digits = value.slice(1);
	if (!/^[0-9a-fA-F]{6}$/.test(digits) && !/^[0-9a-fA-F]{8}$/.test(digits))
		fail(`${where}: \`${value}\` is not a 6- or 8-digit hex color`);

	// WinUI writes `#AARRGGBB`, alpha first; CSS 8-digit hex is `#RRGGBBAA`, alpha last.
	// The conversion is a reordering — no channel is recomputed, so the alpha-composited
	// model ADR 0001 exists to preserve arrives intact.
	//
	// Lower case because Prettier lower-cases hex. Emitting upper case would make
	// `pnpm format` rewrite the file and C2 then report the generator as stale.
	const hex = digits.toLowerCase();
	return digits.length === 6 ? `#${hex}` : `#${hex.slice(2)}${hex.slice(0, 2)}`;
}

function percent(opacity, where) {
	const value = Number(opacity);
	if (!Number.isFinite(value) || value < 0 || value > 1)
		fail(`${where}: opacity \`${opacity}\` is not a number between 0 and 1`);

	// `0.9 * 100` is `90.00000000000001` in binary floating point. Six decimals is exact
	// for any opacity a stylesheet can express, and `Number` then drops the zeros.
	return `${Number((value * 100).toFixed(6))}%`;
}

// The eight `SystemColor*ColorBrush` keys, each mapped to the system color it names.
// Derived from the manifest rather than matched by shape, because the rule is these eight
// keys and nothing else: a name that merely looks like one of them is not one.
const SYSTEM_COLOR_BRUSHES = new Map(Object.keys(SYSTEM_COLORS).map((key) => [`${key}Brush`, key]));

// The light-and-dark half of WinUI's tripwire pair. Evidence, never the rule — see below.
const MAGENTA = '#FF00FF';

/**
 * One of the eight system-color brushes, always as an alias to a system color.
 *
 * Under `HighContrast` the source already writes that alias and this returns what it
 * writes, so nothing there changes. Under `Default` and `Light` it writes `#FF00FF`.
 */
function systemColorBrush(record, reference, where) {
	// WD-001: `#FF00FF` is what a system color is worth in the two dictionaries that never
	// read one, exactly as `#FF0000` is what a palette color is worth in the one that never
	// reads those — so these eight alias what HighContrast already binds them to, and light
	// and dark stop disagreeing with it; see docs/divergences.md.
	const referenced = reference?.[1].trim();
	if (referenced && referenced in SYSTEM_COLORS) return `var(--winui-${referenced})`;

	// Keyed on the resource name, and only then checked against the tripwire value. Were it
	// the other way round, an upstream change of the literal would quietly turn these eight
	// back into magenta rather than stopping here.
	if (record.color.trim().toUpperCase() !== MAGENTA)
		fail(
			`${where}: a system-color brush whose color is \`${record.color.trim()}\` — neither ` +
				'the tripwire nor a reference to a system color. Upstream may have given it a real ' +
				'value; decide what it means before aliasing it away.'
		);

	return `var(--winui-${SYSTEM_COLOR_BRUSHES.get(record.key)})`;
}

/**
 * One resource reference as the `var()` that reads it.
 *
 * Every reference goes through here rather than being interpolated at the site that found
 * it, because a name Windows supplies and no dictionary defines has to be substituted
 * before it reaches the output — see `PLATFORM_BRUSHES` and ADR 0008. A site that builds
 * its own `var(--winui-…)` from a source reference is a site that would emit one of those
 * names as though it were a token.
 *
 * `theme` is the scope the *reference* was written in, not the scope of what it names: the
 * mapping is warranted per theme and applying a high-contrast reading to a light record is
 * exactly the silent wrongness a table of ten hand-chosen values could produce.
 */
function ref(key, theme, where) {
	const platform = PLATFORM_BRUSHES[key];
	if (!platform) return `var(--winui-${key})`;
	if (!platform.themes.includes(theme))
		fail(
			`${where}: references \`${key}\` from the ${theme ?? 'theme-independent'} scope, ` +
				`which ADR 0008 maps under ${platform.themes.join(', ')} only`
		);
	return `var(--winui-${platform.to})`;
}

function brush(record) {
	const where = at(record);
	if (record.color === undefined) fail(`${where}: brush with no Color`);

	const reference = REFERENCE.exec(record.color.trim());
	let base;
	if (SYSTEM_COLOR_BRUSHES.has(record.key)) base = systemColorBrush(record, reference, where);
	else if (reference) base = ref(reference[1].trim(), record.theme, where);
	else base = color(record.color, where);
	if (record.opacity === undefined) return base;

	// `color-mix` interpolates premultiplied by default, so mixing towards `transparent`
	// scales alpha without shifting hue — which is what XAML's `Opacity` does to a brush.
	return `color-mix(in srgb, ${base} ${percent(record.opacity, where)}, transparent)`;
}

const number = (text, where) => {
	if (!/^-?\d+(?:\.\d+)?$/.test(text)) fail(`${where}: \`${text}\` is not a number`);
	return text;
};

/**
 * A XAML length list as a CSS shorthand. `order.four` maps the four-part form into CSS
 * order; `order.two` maps the two-part form, and a caller that omits it is a caller for
 * which two parts have no agreed meaning.
 *
 * Three-part forms fail everywhere, and two-part ones fail wherever `order.two` is
 * absent, rather than being guessed at. XAML's two-part Thickness is
 * (horizontal, vertical) and CSS's is (vertical, horizontal), so the value that looks
 * most convertible is exactly the one worth stopping on.
 */
function lengths(value, where, order) {
	const parts = value.split(',').map((part) => number(part.trim(), where));
	if (parts.length === 1) return `${parts[0]}px`;
	if (parts.every((part) => part === parts[0])) return `${parts[0]}px`;
	const map = parts.length === 4 ? order.four : parts.length === 2 ? order.two : undefined;
	if (!map)
		fail(`${where}: \`${value}\` has ${parts.length} parts, which this type does not convert`);
	return map(parts)
		.map((part) => `${part}px`)
		.join(' ');
}

/** `hh:mm:ss.fff` — a XAML TimeSpan — in milliseconds. */
function duration(value, where) {
	const parts = /^(\d+):(\d+):(\d+)(?:\.(\d+))?$/.exec(value);
	if (!parts) fail(`${where}: \`${value}\` is not an hh:mm:ss.fff duration`);

	const [, hours, minutes, seconds, fraction] = parts;
	const ms =
		((Number(hours) * 60 + Number(minutes)) * 60 + Number(seconds)) * 1000 +
		Number(`0.${fraction ?? 0}`) * 1000;
	// `0.083 * 1000` is `83.00000000000001`; the same rounding as `percent`, for the
	// same reason.
	return `${Number(ms.toFixed(4))}ms`;
}

/** `x1,y1,x2,y2` as the CSS timing function with the same control points. */
function keySpline(value, where) {
	const parts = value.split(',').map((part) => part.trim());
	if (parts.length !== 4) fail(`${where}: \`${value}\` is not a four-part key spline`);
	return `cubic-bezier(${parts.map((part) => number(part, where)).join(', ')})`;
}

/**
 * A single glyph as a CSS string, for a component to put in `content`.
 *
 * Six hex digits always, never the character itself and never a shorter escape. The
 * character would make the stylesheet's bytes depend on an editor's encoding, and a CSS
 * escape shorter than six digits ends at the next space — which is fine here and is a trap
 * the day one of these is concatenated with anything.
 */
function glyph(value, where) {
	if ([...value].length !== 1)
		fail(`${where}: glyph is ${[...value].length} code points; expected 1`);
	return `'\\${value.codePointAt(0).toString(16).padStart(6, '0')}'`;
}

function scalar(record) {
	const where = at(record);
	const value = record.value.trim();

	switch (record.type) {
		case 'x:Double':
			// A length unit is not right for every double — an opacity, a ratio and a line
			// count are spelled the same way — so `*FontSize` is the only suffix taken
			// on trust and every other length is named in `DOUBLE_LENGTHS`. The next
			// double to appear gets read rather than assumed.
			// A ratio is one of the things this comment warns about, and `DOUBLE_RATIOS` is
			// where one is named. It emits unitless, because a scale factor with `px` on it
			// is a number every reader has to divide back out at the point of use.
			if (record.key in DOUBLE_RATIOS) return number(value, where);
			if (!record.key.endsWith('FontSize') && !(record.key in DOUBLE_LENGTHS))
				fail(
					`${where}: an x:Double that is neither a FontSize, a DOUBLE_LENGTHS length ` +
						'nor a DOUBLE_RATIOS ratio; decide what it measures before emitting it'
				);
			return `${number(value, where)}px`;

		case 'CornerRadius':
			// WinUI writes TopLeft,TopRight,BottomRight,BottomLeft, and so does CSS
			// `border-radius`. Here the orders agree and this is only a unit suffix.
			return lengths(value, where, { four: (parts) => parts });

		case 'Thickness':
			// WinUI writes Left,Top,Right,Bottom; the CSS shorthand is Top,Right,Bottom,Left.
			// The two agree on nothing except the uniform case, which is what makes an
			// unpermuted four-part value look plausible in review.
			return lengths(value, where, {
				four: ([left, top, right, bottom]) => [top, right, bottom, left],
				two: ([horizontal, vertical]) => [vertical, horizontal]
			});

		// A `FontWeight` resource carries a named weight — `Normal`, `SemiBold` — that the
		// type-ramp converter also reads. The ramp produces font-weight rules directly from
		// these names; here the value lands on a stand-alone token the same way an
		// `x:Double` length does.
		case 'FontWeight':
			if (!FONT_WEIGHTS.has(value))
				fail(
					`${where}: FontWeight \`${value}\` is not one of ` +
						`${[...FONT_WEIGHTS.keys()].map((n) => `\`${n}\``).join(', ')}; ` +
						'add a mapping rather than mapping it silently'
				);
			return FONT_WEIGHTS.get(value);

		case 'x:String':
			// `BeginTime` and `Delay` are the same `hh:mm:ss.fff` TimeSpan as `Duration` and reach
			// CSS as the same milliseconds: ScrollBar's expand and collapse are each a delay plus a
			// duration, and the delay half has no other name upstream.
			if (
				record.key.endsWith('Duration') ||
				record.key.endsWith('BeginTime') ||
				record.key.endsWith('Delay')
			)
				return duration(value, where);
			if (record.key.endsWith('KeySpline')) return keySpline(value, where);
			if (record.key in GLYPHS) return glyph(value, where);
			// A font size upstream spelled as a string. `STRING_FONT_SIZES` names the two,
			// and they emit `px` the way the `x:Double` arm's FontSize suffix does.
			if (record.key in STRING_FONT_SIZES) return `${number(value, where)}px`;
			return fail(
				`${where}: x:String that is neither a Duration, a BeginTime, a Delay, a KeySpline, ` +
					'a glyph nor a STRING_FONT_SIZES font size'
			);

		default:
			return fail(`${where}: no conversion for the scalar type \`${record.type}\``);
	}
}

/**
 * The high-contrast value of a palette color, which the dictionary does not carry.
 *
 * `siblings` is the HighContrast dictionary keyed by resource name.
 */
function highContrastColor(record, siblings) {
	// WD-001: HighContrast defines all 83 palette colors as `#FF0000`, a tripwire its own
	// brushes never read, so each one is resolved through the brush that does have a value.
	// `systemColorBrush` is the same substitution in the other direction; see
	// docs/divergences.md.
	const sibling = siblings.get(`${record.key}Brush`);
	if (sibling?.kind === 'brush' && sibling.color !== undefined) {
		const reference = REFERENCE.exec(sibling.color.trim());
		return reference
			? ref(reference[1].trim(), 'HighContrast', at(sibling))
			: color(sibling.color, at(sibling));
	}

	// `SolidBackgroundFillColorTransparent` is the one poisoned key with no sibling brush
	// to ask. Its light and dark values are `#00F3F3F3` and `#00202020`, both zero-alpha,
	// so nothing is being invented here.
	if (record.key === 'SolidBackgroundFillColorTransparent') return 'transparent';

	return fail(`${at(record)}: high-contrast tripwire with no sibling brush to resolve it`);
}

const POISON = '#FF0000';

/**
 * A color attribute resolved the way `brush()` resolves a `Color`: a `{…Resource}` is an
 * alias, a literal is a literal. Shared by gradient stops and by an acrylic brush's
 * fallback, which is why it is not named for either.
 */
function resolvedColor(raw, where, theme) {
	const reference = REFERENCE.exec(raw.trim());
	return reference ? ref(reference[1].trim(), theme, where) : color(raw, where);
}

/**
 * One XAML `LinearGradientBrush` as a CSS `linear-gradient()`.
 *
 * XAML and CSS both order stops by offset and both default to Pad; everything else
 * needs an explicit conversion. `RelativeTransform` and `MappingMode` are two
 * independent axes — a transform on a bounding-box gradient, or absent — and both
 * axes must agree before the value is emitted.
 */
function gradient(record) {
	const where = at(record);

	// XAML supplies defaults for all three when they are absent — a bounding-box gradient
	// running corner to corner — so a record missing one is a diagonal this file has never
	// seen and cannot convert. Named here rather than left to throw on `undefined.split`,
	// because a TypeError names a line of this file and not the resource that caused it.
	for (const field of ['mappingMode', 'startPoint', 'endPoint'])
		if (record[field] === undefined) fail(`${where}: gradient with no ${field}`);

	const [startX] = record.startPoint.split(',').map((part) => part.trim());
	if (startX !== '0') fail(`${where}: gradient StartPoint x is \`${startX}\`, not 0`);

	const [endX, endY] = record.endPoint.split(',').map((part) => part.trim());
	if (endX !== '0') fail(`${where}: gradient EndPoint x is \`${endX}\`, not 0`);

	const flip =
		record.relativeTransform?.scaleY === '-1' && record.relativeTransform.centerY === '0.5';
	if (record.relativeTransform && !flip)
		fail(
			`${where}: gradient RelativeTransform is \`${JSON.stringify(record.relativeTransform)}\`, ` +
				'not the single flip the source uses. A transform that does not flip is one we ' +
				'do not know how to invert, so emit a value rather than ignore it.'
		);

	if (record.mappingMode === 'Absolute') {
		if (endY === '0')
			fail(`${where}: gradient EndPoint y is 0, which has no length to draw across`);
	} else if (record.mappingMode === 'RelativeToBoundingBox') {
		if (endY !== '1')
			fail(
				`${where}: gradient EndPoint y is \`${endY}\`, not 1. A bounding-box gradient that ` +
					'does not span the full height cannot be expressed without a length that is the ' +
					"element's own, which CSS does not expose at value time."
			);
	} else {
		fail(
			`${where}: gradient MappingMode is \`${record.mappingMode}\`, not Absolute or RelativeToBoundingBox`
		);
	}

	if ((record.stops ?? []).length < 2) fail(`${where}: gradient has fewer than two stops`);

	// Stable sort by offset: a stop below its predecessor in offset is a hard edge in
	// CSS, because the spec clamps its position. `CircleElevationBorderBrush` in the
	// `Default` dictionary writes its stops in descending order; without this sort the
	// light and dark values would disagree. Two stops at the same offset keep source
	// order — `Array.prototype.sort` is stable, and `TextControlElevationBorderFocusedBrush`
	// relies on that to put the accent band ahead of the stroke.
	const stops = [...record.stops]
		.map((stop, i) => ({ offset: Number(stop.offset), sourceIndex: i, color: stop.color }))
		.sort((a, b) => a.offset - b.offset || a.sourceIndex - b.sourceIndex);

	for (const stop of stops) {
		if (!Number.isFinite(stop.offset) || stop.offset < 0 || stop.offset > 1)
			fail(`${where}: gradient stop offset \`${stop.offset}\` is not in [0, 1]`);
	}

	const unit = record.mappingMode === 'Absolute' ? 'px' : '%';
	const position = (offset) =>
		`${Number((offset * (unit === 'px' ? Number(endY) : 100)).toFixed(6))}${unit}`;

	// `to bottom` and `to top` are the only two directions the source uses; a third
	// direction would mean a relative transform we cannot model, which would have
	// failed at the flip check above.
	const direction = flip ? 'to top' : 'to bottom';

	return `linear-gradient(${direction}, ${stops
		.map((stop) => `${resolvedColor(stop.color, where, record.theme)} ${position(stop.offset)}`)
		.join(', ')})`;
}

/**
 * One XAML `AcrylicBrush` as the color WinUI paints when it cannot compose the
 * material. WD-002.
 */
function acrylic(record) {
	const where = at(record);
	if (record.fallbackColor === undefined) fail(`${where}: acrylic brush with no FallbackColor`);
	return resolvedColor(record.fallbackColor, where, record.theme);
}

// The three `FontWeight` names the ramp and the ComboBox placeholder use. Anything else
// stops here rather than guessing at a weight the next one to appear should be read for,
// not assumed — see `FONT_WEIGHTS` below for the contrast with the XAML's full set.
//
// `SemiLight` is the weight `ComboBoxPlaceholderTextThemeFontWeight` declares; the
// ComboBox tranche is the first one that reads it. `Bold` arrived the same way, four
// tranches later: `PivotTitleThemeFontWeight` (`Pivot_themeresources.xaml:18`) is the
// first key this project reads that declares it.
//
// The XAML weight names, as the numbers CSS and OpenType use. No dictionary in either pin
// states them numerically — they are `FontWeights` enum members — so this map is the one
// place the correspondence is written down, and it is written to keep names the platform
// distinguishes distinct: `Light` is 300 and `SemiLight` is 350, and collapsing the second
// onto the first would render the ComboBox's placeholder at a weight the source does not
// ask for. Add a row when a tranche reaches a name that is not here; the generator stops on
// one it does not know rather than guessing a number.
const FONT_WEIGHTS = new Map([
	['Normal', 400],
	['SemiBold', 600],
	['SemiLight', 350],
	['Bold', 700]
]);

/**
 * The six setter properties the type-ramp converter deliberately ignores.
 *
 * `FontFamily` is `XamlAutoFontFamily` in the source — the OS default with automatic
 * optical sizing — and `TYPE_RAMP` replaces it with an explicit per-step family,
 * because Windows registers Segoe UI Variable as three families rather than one with
 * an `opsz` axis. ADR 0003. The other five are layout behaviour of a `TextBlock`
 * element rather than font values — and
 * `TextTrimming="CharacterEllipsis"` with `TextWrapping="Wrap"` cannot both hold
 * in CSS, which is a component's problem to resolve and not a stylesheet's.
 */
const IGNORED_SETTERS = new Set([
	'FontFamily',
	'TextTrimming',
	'TextWrapping',
	'LineStackingStrategy',
	'TextLineBounds',
	'OpticalMarginAlignment'
]);

/**
 * Flatten a `Style`'s `BasedOn` chain into the effective list of setters.
 *
 * A derived style's own setters win over the ones it inherits — same property,
 * the later one replaces the earlier — and a cycle in the chain fails rather than
 * recursing until the stack dies. Tracking the path explicitly is what names the
 * cycle in the failure; `Set.has` would say "seen before" without naming where.
 */
function flattenStyle(record, byKey) {
	const flattened = [];
	const seen = new Set();
	const visit = (node, path) => {
		if (seen.has(node.key)) fail(`${at(node)}: BasedOn cycle: ${path.join(' -> ')} -> ${node.key}`);
		seen.add(node.key);
		const next = [...path, node.key];

		if (node.basedOn !== undefined) {
			const reference = REFERENCE.exec(node.basedOn.trim());
			if (!reference)
				fail(
					`${at(node)}: BasedOn \`${node.basedOn}\` is not a {StaticResource X} or {ThemeResource X}`
				);
			const baseKey = reference[1].trim();
			const baseRecord = byKey.get(baseKey);
			if (!baseRecord) fail(`${at(node)}: BasedOn references \`${baseKey}\`, which is not a Style`);
			const baseNode = baseRecord.get(null);
			if (!baseNode)
				fail(
					`${at(node)}: BasedOn references \`${baseKey}\`, which has no theme-independent record`
				);
			visit(baseNode, next);
		}

		for (const setter of node.setters ?? []) flattened.push(setter);
	};
	visit(record, []);
	return flattened;
}

/**
 * One `Style` record as the four declarations its CSS class carries.
 *
 * Resolves the BasedOn chain, then resolves `FontSize` and `FontWeight` from the
 * flattened setters and ignores everything else — see `IGNORED_SETTERS` for why
 * the choice not to error on them is the rule rather than a shortcut. The two
 * values the XAML does not carry are filled in from the manifest: `font-family`
 * from `TYPE_RAMP`'s per-step face, and `line-height` from the platform: `normal`,
 * one keyword for every step, because no ramp `Style` sets `LineHeight` and what a
 * `TextBlock` draws without one is a property of the font rather than of the step.
 * ADR 0011.
 */
function style(record, byKey) {
	const where = at(record);
	const ramp = TYPE_RAMP[record.key];
	if (!ramp) {
		// The reverse check lives in `typeRamp()`, which knows the selection. This one
		// is "the generator was asked to convert a style it has no TYPE_RAMP entry for",
		// which would only happen if a `convert()` caller was wrong.
		fail(`${where}: no TYPE_RAMP entry for \`${record.key}\``);
	}

	const setters = flattenStyle(record, byKey);

	let fontSizeKey;
	let fontWeight;
	for (const setter of setters) {
		if (IGNORED_SETTERS.has(setter.property)) continue;
		if (setter.property === 'FontSize') {
			// A FontSize that is not a `{…Resource X}` would be a second source of truth
			// for the same number the seven `*FontSize` tokens already name, and the
			// token layer cannot hold that without silently disagreeing with the source.
			const reference = setter.value === undefined ? null : REFERENCE.exec(setter.value.trim());
			if (!reference)
				fail(
					`${where}: FontSize setter is \`${setter.value}\`, not a {StaticResource X} or ` +
						'{ThemeResource X}; a literal would be a second source of truth for the size'
				);
			fontSizeKey = reference[1].trim();
		} else if (setter.property === 'FontWeight') {
			if (setter.value === undefined || !FONT_WEIGHTS.has(setter.value))
				fail(
					`${where}: FontWeight setter is \`${setter.value}\`, not one of ` +
						`${[...FONT_WEIGHTS.keys()].map((n) => `\`${n}\``).join(', ')}; ` +
						'add a mapping rather than mapping it silently'
				);
			fontWeight = FONT_WEIGHTS.get(setter.value);
		} else if (setter.unsupported !== undefined) {
			// Element-form setters the type-ramp converter does not interpret are
			// recorded rather than ignored, so a later unit that needs one finds it
			// listed — same principle as `unsupported` in the census.
			fail(
				`${where}: setter \`${setter.property}\` holds an unsupported value of shape ` +
					`\`${setter.unsupported ?? 'no child element'}\`; the type-ramp converter does not ` +
					'interpret it'
			);
		} else {
			fail(
				`${where}: setter \`${setter.property}\` is not a FontSize, FontWeight, or an ` +
					`ignored name; add a converter or list it in IGNORED_SETTERS`
			);
		}
	}
	if (fontSizeKey === undefined) fail(`${where}: no FontSize in the flattened setter chain`);
	if (fontWeight === undefined) fail(`${where}: no FontWeight in the flattened setter chain`);

	const face = ramp.face;
	if (face !== 'Small' && face !== 'Text' && face !== 'Display')
		fail(
			`TYPE_RAMP[${record.key}].face is \`${face}\`, not Small, Text, or Display; the three ` +
				'registered Segoe UI Variable families are the only valid faces — ADR 0003'
		);

	return {
		fontFamily: `'Segoe UI Variable ${face}', 'Segoe UI', sans-serif`,
		fontSize: ref(fontSizeKey, record.theme, where),
		fontWeight,
		lineHeight: 'normal'
	};
}

/**
 * The type-ramp file's source, run through the cross-checks that keep
 * `TYPE_RAMP` and the XAML from drifting.
 *
 * `extraEmitted` is the set of keys emitted here, for the completeness check in
 * `stylesheet()` to count as emitted rather than flag as a hole. Building this
 * file first is what makes that possible: the other file has to know what the
 * one not yet built already emitted, and the only answer is to build it first.
 */
function typeRamp(records, byKey, commit) {
	const styles = records.filter(
		(record) => record.kind === 'style' && record.targetType === 'TextBlock'
	);

	// A `*TextBlockStyle` in the selection that `TYPE_RAMP` does not name. Without
	// this check an upstream rename leaves a class emitting a stale face and line
	// height while looking entirely healthy.
	for (const record of styles) {
		if (!(record.key in TYPE_RAMP))
			fail(`${at(record)}: a TextBlock Style in the selection that TYPE_RAMP does not name`);
	}
	// The reverse direction: a TYPE_RAMP entry whose key the selection does not
	// define. The cross-check is what stops a deleted upstream style from leaving
	// a class that no source backs.
	for (const key of Object.keys(TYPE_RAMP)) {
		if (!byKey.has(key)) fail(`TYPE_RAMP[${key}] is not defined in the selection`);
	}

	const lines = [
		'/*',
		' * WinUI 3 type ramp, generated by scripts/tokens/generate.mjs from',
		` * ${RECORD} — microsoft/microsoft-ui-xaml @ ${commit}.`,
		' *',
		' * Generated file — do not edit. Run `pnpm tokens:build`.',
		' */',
		''
	];

	const emitted = new Set();
	for (const record of styles) {
		const values = style(record, byKey);
		lines.push(
			`.winui-${record.key} {`,
			`\tfont-family: ${values.fontFamily};`,
			`\tfont-size: ${values.fontSize};`,
			`\tfont-weight: ${values.fontWeight};`,
			`\tline-height: ${values.lineHeight};`,
			'}',
			''
		);
		emitted.add(record.key);
	}

	// Each rule pushes a blank line after itself, which leaves one too many at the end.
	// Trimming it makes the file end at `}\n`, the way `tokens.css` does and the way
	// Prettier would rewrite it to — a blank line before EOF is the kind of difference
	// that turns `pnpm format` into a fight C2 loses.
	return {
		css: `${lines.join('\n').replace(/\n$/, '')}\n`,
		emitted
	};
}

function convert(record, siblings) {
	switch (record.kind) {
		case 'color':
			return record.theme === HIGH_CONTRAST && record.value.trim().toUpperCase() === POISON
				? highContrastColor(record, siblings)
				: color(record.value, at(record));

		case 'brush':
			return brush(record);

		case 'alias':
			return ref(record.to, record.theme, at(record));

		case 'scalar':
			return scalar(record);

		case 'gradient':
			return gradient(record);

		case 'acrylic':
			return acrylic(record);

		default:
			return fail(`${at(record)}: no conversion for a \`${record.kind}\` resource`);
	}
}

/* ------------------------------------------------------------------------------- selection */

/** The keys a record refers to: an alias's target, and any `{…Resource X}` color. */
function references(record) {
	const out = [];
	const reference = (raw) => {
		const found = raw === undefined ? null : REFERENCE.exec(raw.trim());
		if (found) out.push(found[1].trim());
	};

	if (record.kind === 'alias') out.push(record.to);
	if (record.kind === 'brush') reference(record.color);
	if (record.kind === 'gradient') for (const stop of record.stops ?? []) reference(stop.color);
	if (record.kind === 'acrylic') {
		// The walk is over the record, not today's emission: `tintColor` is not converted,
		// but a later unit that reads it must not find a dangling name.
		reference(record.fallbackColor);
		reference(record.tintColor);
	}
	if (record.kind === 'style') {
		// `basedOn` keeps its braces through extraction, so the same regex that resolves a
		// brush color resolves the inheritance edge — the closure then walks through it.
		reference(record.basedOn);
		for (const setter of record.setters ?? []) reference(setter.value);
	}
	return out;
}

/**
 * The v1 selection: every record defined in the four base files, plus every key the
 * acceptance surface names, indexed by key and theme, with the invariants the rest of
 * this file relies on already asserted.
 */
function select(resources, framework) {
	// Compact.xaml redefines standard resources for a merged subtree. Its records cannot enter
	// `byKey`: they share the theme-independent scope with the standard records, and the
	// selection's duplicate check correctly refuses to choose between those two definitions.
	const densityRecords = resources.filter((record) => record.file === COMPACT_DENSITY_FILE);
	const standardResources = resources.filter((record) => record.file !== COMPACT_DENSITY_FILE);
	const compactByKey = new Map();
	for (const record of densityRecords) {
		if (compactByKey.has(record.key)) fail(`${at(record)}: compact density defines this key twice`);
		compactByKey.set(record.key, record);
	}

	// Compact.xaml:5 is an implicit TextBlock Style, which has no x:Key and therefore no
	// record. That is intentional: this reproduction has no equivalent unstyled TextBlock
	// population, and its ramp classes already set font-size in both densities.
	const files = new Set(SOURCE_FILES);

	// D23: on a key both dictionaries define, the control pin wins. The framework
	// dictionary answers only for a key the pin does not define **at all** — never
	// theme by theme, because merging one key's themes across two dictionaries would
	// produce a definition neither of them makes and no source could be cited for it.
	// D23: the control pin wins, per key **and theme**. Where the pin defines a key in a
	// theme, that record is used; where it leaves a theme out, the framework dictionary
	// answers for that theme alone.
	//
	// The rule read "per key" until the Text tranche measured what that cost. XAML resolves
	// per theme itself — a theme dictionary that omits a key falls through to the framework
	// dictionary for that theme and no other — so "per key" was the reading that disagreed
	// with the platform, and its stated reason, that a per-theme merge invents a definition
	// neither source makes, does not hold: the framework's value for the missing theme is a
	// definition the framework makes. Twenty selected keys are affected and the framework
	// covers every missing theme of all twenty; `SliderContainerBackground` had no `Default`
	// and the whole `TextControl*` family had no `HighContrast`. See ADR 0010 and O-merge1.
	const definitionsOf = (key) => {
		// `DEFINED_BY` settles the keys more than one dictionary defines, before anything
		// else looks at them. Filtering here rather than at each of the three call sites is
		// deliberate: the closure reaches records the seed pass never names, and a rule that
		// held for named keys only would let a duplicate back in through the walk.
		const chosen = DEFINED_BY[key];
		const kept = chosen
			? standardResources.filter((record) => record.key !== key || record.file === chosen)
			: standardResources;
		if (chosen && !kept.some((record) => record.key === key))
			fail(`DEFINED_BY reads \`${key}\` from ${chosen}, which defines no record of it`);
		const own = kept.filter((record) => record.key === key);
		if (own.length === 0) return framework.filter((record) => record.key === key);
		const themes = new Set(own.map((record) => record.theme));
		// Only a themed scope is filled. A key the pin defines outside any theme dictionary
		// is theme-independent and complete by definition; adding themed records beside it
		// would make it two different things at once.
		if (themes.has(null)) return own;
		const missing = framework.filter(
			(record) => record.key === key && THEMED.includes(record.theme) && !themes.has(record.theme)
		);
		return [...own, ...missing];
	};
	// One seed map per surface that reads its own keys: the Design pages name theirs as
	// page content, and the shell and each control tranche read theirs in component CSS.
	// Each stays deletable with the thing that needs it, and they merge here because the
	// closure does not care which surface asked.
	//
	// The pairwise check was written out by hand for the first four and would have been
	// ten hand-written pairs at five; a tranche per version makes that the wrong shape, so
	// the sets are named once here and the pairs derived. Order matters only for
	// `seedMap`'s answer, which is the first set that claims a key.
	const SEED_SETS = [
		['ADDITIONAL_KEYS', ADDITIONAL_KEYS],
		['SHELL_KEYS', SHELL_KEYS],
		['BUTTON_KEYS', BUTTON_KEYS],
		['TEXTBOX_KEYS', TEXTBOX_KEYS],
		['PASSWORDBOX_KEYS', PASSWORDBOX_KEYS],
		['CHECKBOX_KEYS', CHECKBOX_KEYS],
		['RADIOBUTTON_KEYS', RADIOBUTTON_KEYS],
		['RADIOBUTTONS_KEYS', RADIOBUTTONS_KEYS],
		['CALENDARVIEW_KEYS', CALENDARVIEW_KEYS],
		['CALENDARDATEPICKER_KEYS', CALENDARDATEPICKER_KEYS],
		['DATETIMEPICKERFLYOUT_KEYS', DATETIMEPICKERFLYOUT_KEYS],
		['DATEPICKER_KEYS', DATEPICKER_KEYS],
		['TIMEPICKER_KEYS', TIMEPICKER_KEYS],
		['SPLITVIEW_KEYS', SPLITVIEW_KEYS],
		['TOGGLESWITCH_KEYS', TOGGLESWITCH_KEYS],
		['SLIDER_KEYS', SLIDER_KEYS],
		['COMBOBOX_KEYS', COMBOBOX_KEYS],
		['AUTOSUGGESTBOX_KEYS', AUTOSUGGESTBOX_KEYS],
		['NUMBERBOX_KEYS', NUMBERBOX_KEYS],
		['TOOLTIP_KEYS', TOOLTIP_KEYS],
		['INFOBADGE_KEYS', INFOBADGE_KEYS],
		['PROGRESSBAR_KEYS', PROGRESSBAR_KEYS],
		['PROGRESSRING_KEYS', PROGRESSRING_KEYS],
		['INFOBAR_KEYS', INFOBAR_KEYS],
		['EXPANDER_KEYS', EXPANDER_KEYS],
		['BREADCRUMBBAR_KEYS', BREADCRUMBBAR_KEYS],
		['SELECTORBAR_KEYS', SELECTORBAR_KEYS],
		['PIVOT_KEYS', PIVOT_KEYS],
		['TABVIEW_KEYS', TABVIEW_KEYS],
		['FLYOUT_KEYS', FLYOUT_KEYS],
		['MENUFLYOUT_KEYS', MENUFLYOUT_KEYS],
		['CONTENTDIALOG_KEYS', CONTENTDIALOG_KEYS],
		['TEACHINGTIP_KEYS', TEACHINGTIP_KEYS],
		['TOGGLEBUTTON_KEYS', TOGGLEBUTTON_KEYS],
		['HYPERLINK_KEYS', HYPERLINK_KEYS],
		['RATINGCONTROL_KEYS', RATINGCONTROL_KEYS],
		['COLORPICKER_KEYS', COLORPICKER_KEYS],
		['HYPERLINKBUTTON_KEYS', HYPERLINKBUTTON_KEYS],
		['REPEATBUTTON_KEYS', REPEATBUTTON_KEYS],
		['DROPDOWNBUTTON_KEYS', DROPDOWNBUTTON_KEYS],
		['SPLITBUTTON_KEYS', SPLITBUTTON_KEYS],
		['APPBARBUTTON_KEYS', APPBARBUTTON_KEYS],
		['APPBARTOGGLEBUTTON_KEYS', APPBARTOGGLEBUTTON_KEYS],
		['APPBARSEPARATOR_KEYS', APPBARSEPARATOR_KEYS],
		['COMMANDBAR_KEYS', COMMANDBAR_KEYS],
		['COMMANDBARFLYOUT_KEYS', COMMANDBARFLYOUT_KEYS],
		['MENUBAR_KEYS', MENUBAR_KEYS],
		['ITEMCONTAINER_KEYS', ITEMCONTAINER_KEYS],
		['LISTVIEWITEM_KEYS', LISTVIEWITEM_KEYS],
		['GRIDVIEWITEM_KEYS', GRIDVIEWITEM_KEYS],
		['TREEVIEWITEM_KEYS', TREEVIEWITEM_KEYS],
		['FLIPVIEW_KEYS', FLIPVIEW_KEYS],
		['SCROLLBAR_KEYS', SCROLLBAR_KEYS],
		['SCROLLVIEW_KEYS', SCROLLVIEW_KEYS],
		['PIPSPAGER_KEYS', PIPSPAGER_KEYS],
		['ANNOTATEDSCROLLBAR_KEYS', ANNOTATEDSCROLLBAR_KEYS],
		['PULLTOREFRESH_KEYS', PULLTOREFRESH_KEYS],
		['PERSONPICTURE_KEYS', PERSONPICTURE_KEYS],
		['MEDIATRANSPORTCONTROLS_KEYS', MEDIATRANSPORTCONTROLS_KEYS]
	];
	for (let i = 0; i < SEED_SETS.length; i++)
		for (let j = i + 1; j < SEED_SETS.length; j++) {
			const [firstName, first] = SEED_SETS[i];
			const [secondName, second] = SEED_SETS[j];
			for (const key of Object.keys(second))
				if (key in first)
					fail(`\`${key}\` is seeded by both ${firstName} and ${secondName}; it belongs to one`);
		}
	const seedNames = Object.assign({}, ...SEED_SETS.map(([, set]) => set));
	const seedMap = (key) => SEED_SETS.find(([, set]) => key in set)?.[0] ?? 'no seed set';
	const seeds = new Set(Object.keys(seedNames));

	// A key the acceptance surface names is a seed even when it lives outside the four
	// base files; its records join the initial pass by key rather than by file. The
	// file-based filter is what the closure then extends through — a reference to a
	// key the seeds do not define lands on a record in the full `resources` array, and
	// that record joins the selection on its own merits.
	const initial = standardResources.filter((record) => files.has(record.file));
	for (const key of seeds)
		if (!definitionsOf(key).length)
			fail(`${seedMap(key)} lists \`${key}\`, which neither record file contains`);
	// Unconditional, and not `&& seeds.size === 0`: the seeds cannot stand in for the base
	// files. A record file that matches none of them is a re-pin that moved or renamed
	// something, and the seeds being non-empty would otherwise let this run produce a
	// stylesheet of nine keys and call it a selection.
	if (initial.length === 0) fail(`${RECORD} holds no records from any of the base files`);

	const byKey = new Map();
	for (const record of initial) {
		const themes = byKey.get(record.key) ?? new Map();
		// The extractor merges nothing, so two definitions of one key in one theme arrive
		// as two records. Keeping the last would be a precedence decision made silently,
		// in the one place nobody would think to look for it.
		if (themes.has(record.theme))
			fail(`${at(record)}: defined twice in the ${record.theme ?? 'theme-independent'} scope`);
		themes.set(record.theme, record);
		byKey.set(record.key, themes);
	}

	for (const key of seeds) {
		// The base files already reaching a seed is not a duplicate definition, it is a
		// stale list — and saying `defined twice in the Light scope` would send the reader
		// looking through the XAML for a conflict that is not there.
		if (byKey.has(key))
			fail(`${seedMap(key)} lists \`${key}\`, which the base files already define`);
		for (const record of definitionsOf(key)) {
			const themes = byKey.get(record.key) ?? new Map();
			if (themes.has(record.theme))
				fail(`${at(record)}: defined twice in the ${record.theme ?? 'theme-independent'} scope`);
			themes.set(record.theme, record);
			byKey.set(record.key, themes);
		}
	}

	// The transitive closure. A reference that resolves to nothing has to be one of the
	// names the OS supplies; anything else means the four base files no longer close over
	// themselves, and emitting a `var()` nobody defines would hide that inside a
	// declaration the browser silently drops.
	// The names the OS supplies, from all four places this file knows one. `PLATFORM_FONTS`
	// belonged here from the moment it existed and was not: nothing in v1's selection
	// referenced `SymbolThemeFontFamily`, so the omission was unreachable rather than
	// harmless, and the first shell dictionary to reference it would have failed the walk
	// on a name the generator itself writes into the output.
	const external = new Set([
		...Object.keys(SYSTEM_COLORS),
		...Object.keys(ACCENT_COLORS),
		...Object.keys(PLATFORM_FONTS),
		...Object.keys(PLATFORM_BRUSHES),
		...Object.keys(PLATFORM_SHADOWS)
	]);
	const reached = new Set();
	const queue = [...byKey.keys()];
	while (queue.length) {
		const key = queue.pop();
		if (reached.has(key)) continue;
		reached.add(key);
		for (const record of (byKey.get(key) ?? new Map()).values()) {
			for (const target of references(record)) {
				if (!byKey.has(target) && !external.has(target)) {
					// A reference the seeds do not define may still be a real record in
					// either record file — pull it in, and the walk continues from there.
					const pulled = definitionsOf(target);
					if (pulled.length === 0)
						fail(`${at(record)} references \`${target}\`, which nothing in the selection defines`);
					for (const record of pulled) {
						const themes = byKey.get(record.key) ?? new Map();
						// The same stop as the other two passes, and the one most likely to
						// fire: this path reaches both record files, where a key the pin
						// defines in one theme and the framework defines in another would
						// land two records on the same theme — a definition neither of them
						// makes. Keeping the first would answer a precedence question by
						// whichever filename sorts earlier.
						if (themes.has(record.theme))
							fail(
								`${at(record)}: defined twice in the ${record.theme ?? 'theme-independent'} ` +
									'scope, and reached by the closure rather than named — decide which ' +
									'definition v1 means before emitting either.'
							);
						themes.set(record.theme, record);
						byKey.set(record.key, themes);
					}
				}
				if (!reached.has(target)) queue.push(target);
			}
		}
	}

	// Measured, and asserted rather than trusted: no key in this selection is themed in
	// part. A partially themed key would resolve to another theme's value on the themes it
	// is missing from, which reads as a design decision rather than as a hole.
	//
	// This assertion used to carry an exception, and the exception is gone because its cause
	// is. The `TextControl*` family is defined in `Default` and `Light` and almost entirely
	// absent from the per-control `HighContrast` dictionary, because Windows supplies those
	// records from the framework dictionary rather than from `controls/dev`. With no
	// framework dictionary to read, the generator let such a key through on the argument
	// that a page in high contrast would fall back to the `:root` declaration and that the
	// alias there would resolve correctly — and the comment that carried the exception said
	// plainly that nothing was checking the last clause. It was not correct:
	// `TextControlBackground` resolved to `#ffffffb3` under high contrast, a translucent
	// white from the light theme, where the framework dictionary says the system window
	// colour. Reading the framework dictionary per theme (D23, above) supplies every missing
	// theme of all twenty affected keys, so no key is partially themed any more and the
	// exception has nothing left to permit.
	for (const [key, themes] of byKey) {
		const names = [...themes.keys()];
		const independent = names.length === 1 && names[0] === null;
		const complete = names.length === THEMED.length && THEMED.every((name) => themes.has(name));
		if (!independent && !complete)
			fail(
				`${key} is defined in ${names.map((name) => name ?? 'no theme').join(', ')} only; ` +
					'every key must be theme-independent or defined in all three themes'
			);
	}

	for (const key of Object.keys(EXCLUDED))
		if (!byKey.has(key)) fail(`EXCLUDED lists \`${key}\`, which this selection does not contain`);

	// The emission order is the record file's own order: a key pulled in late lands
	// where its file does rather than at the end, so the cascade reads as it did before
	// the closure was extended. A key the extraction defines twice — once in a base
	// file and once outside it — has both records in `resources`; only the one the
	// selection actually kept joins the rebuild.
	//
	// A framework-sourced key emits after every pin key, in framework document order.
	// Pinning a fallback after the cascade means a key the pin does not define cannot
	// reorder one the pin already emits.
	const records = [...standardResources, ...framework].filter(
		(record) => byKey.get(record.key)?.get(record.theme) === record
	);

	return { records, byKey, compactByKey, external: reached.size - byKey.size };
}

/* --------------------------------------------------------------------------------- emission */

/**
 * One custom-property declaration, as the lines Prettier would print it on.
 *
 * A generator that emits a line Prettier would rewrite puts `pnpm format` and C2 in a
 * fight C2 loses every time: the format pass edits the committed file, and the gate then
 * reports the generator as stale. Prettier breaks a function value at its top-level
 * commas once the line passes `printWidth`.
 */
function declaration(name, value, depth) {
	const indent = '\t'.repeat(depth);
	const text = `--winui-${name}: ${value};`;
	if (depth * TAB_WIDTH + text.length <= PRINT_WIDTH) return [`${indent}${text}`];

	// Only `var()` and `color-mix()` values are long enough to wrap, and both are a
	// single call. A long value of another shape means this has stopped describing
	// Prettier, and guessing at the rest of its algorithm is how that goes unnoticed.
	const call = /^([\w-]+)\((.*)\)$/s.exec(value);
	if (!call) fail(`--winui-${name}: value is too long for one line and is not a function call`);

	const parts = topLevelParts(call[2]);
	return [
		`${indent}--winui-${name}: ${call[1]}(`,
		...parts.map((part, i) => `${indent}\t${part}${i === parts.length - 1 ? '' : ','}`),
		`${indent});`
	];
}

/**
 * How many declarations a run of emitted lines holds.
 *
 * Counted from the printed lines rather than tracked alongside them, so the summary
 * describes the file that was written instead of the intention behind it. A wrapped
 * declaration's continuation lines carry no colon and are not counted twice.
 */
const declared = (lines) => lines.filter((line) => /^\t+--winui-\w+:/.test(line)).length;

/** `args` split at its top-level commas. */
function topLevelParts(args) {
	const parts = [];
	let depth = 0;
	let current = '';
	for (const char of args) {
		if (char === '(') depth++;
		else if (char === ')') depth--;
		else if (char === ',' && depth === 0) {
			parts.push(current.trim());
			current = '';
			continue;
		}
		current += char;
	}
	parts.push(current.trim());
	return parts;
}

function stylesheet(doc, framework, selection, extraEmitted) {
	const { records, byKey, compactByKey, external } = selection;

	// The HighContrast dictionary, keyed by resource name, for the palette resolution
	// WD-001 describes.
	const siblings = new Map(
		records.filter((record) => record.theme === HIGH_CONTRAST).map((record) => [record.key, record])
	);

	// The type-ramp file is built first, and the keys it emitted join the
	// completeness check here — without this set, every `*TextBlockStyle` would
	// look like a hole the moment it was no longer in `EXCLUDED`. Styles are
	// skipped at this layer: they have a class analogue, not a custom-property
	// analogue, and `convert()` has no case for them — see `typeRamp()`.
	const emitted = new Set(extraEmitted);
	const forThemes = (themes, depth) => {
		const out = [];
		for (const record of records) {
			if (record.kind === 'style') continue;
			if (record.key in EXCLUDED || !themes.includes(record.theme)) continue;
			emitted.add(record.key);
			out.push(...declaration(record.key, convert(record, siblings), depth));
		}
		return out;
	};

	const systemColors = (depth, of) =>
		Object.entries(SYSTEM_COLORS).flatMap(([key, entry]) =>
			declaration(key, of(entry, key), depth)
		);
	const literal = (entry, key) => color(entry.value, `SYSTEM_COLORS.${key} in manifest.mjs`);

	// Light is the default theme, so it and the theme-independent keys are the `:root`
	// block. Records keep the order the extractor read them in, which is source order.
	const light = [
		'\tcolor-scheme: light;',
		'',
		'\t/* Supplied by Windows rather than by the XAML — see scripts/tokens/manifest.mjs. */',
		'\t/* Nothing in light or dark reads a system color, but a token that references */',
		'\t/* one still has to resolve here, or an unresolved var() reads as a theme bug. */',
		...systemColors(1, literal),
		...Object.entries(ACCENT_COLORS).flatMap(([key, value]) =>
			declaration(key, color(value, `ACCENT_COLORS.${key} in manifest.mjs`), 1)
		),
		// Theme-independent, so `:root` only — the same treatment the accent ramp gets, and
		// for the same reason: a family that changed with the theme would be a different
		// decision than the one ADR 0003 made.
		...Object.entries(PLATFORM_FONTS).flatMap(([key, value]) => declaration(key, value, 1)),
		// Same shape as `PLATFORM_FONTS` and for the same reason: `FocusVisualPrimaryThickness`
		// and `FocusVisualSecondaryThickness` are `Control` property defaults rather than
		// theme resources, so the value has nowhere to be read from — see manifest.mjs.
		...Object.entries(PLATFORM_METRICS).flatMap(([key, value]) => declaration(key, value, 1)),
		// Unlike the two platform families above, the measured popup shadow is per theme.
		...Object.entries(PLATFORM_SHADOWS).flatMap(([key, value]) => declaration(key, value.light, 1)),
		'',
		...forThemes([LIGHT, null], 1)
	];

	// The dark values are emitted twice, under the explicit selector and under the
	// preference query. The two can never disagree — they are the same array — and
	// generated duplication costs bytes rather than maintenance.
	const dark = (depth) => [
		`${'\t'.repeat(depth)}color-scheme: dark;`,
		'',
		...systemColors(depth, literal),
		'',
		...forThemes([DARK], depth),
		...Object.entries(PLATFORM_SHADOWS).flatMap(([key, value]) =>
			declaration(key, value.dark, depth)
		)
	];

	const highContrast = [
		...systemColors(1, literal),
		'',
		...forThemes([HIGH_CONTRAST], 1),
		...Object.entries(PLATFORM_SHADOWS).flatMap(([key, value]) =>
			declaration(key, value.highContrast, 1)
		)
	];

	const forcedColors = systemColors(2, (entry) => entry.keyword);
	const compact = [];
	const compactSkipped = [];
	for (const [key, record] of compactByKey) {
		if (!byKey.has(key)) {
			compactSkipped.push(`${key}: standard key not in the selection`);
			continue;
		}
		compact.push(...declaration(key, convert(record, siblings), 1));
	}

	// Built before the completeness check below, so that every block has had its say
	// about which keys it emitted. A lazily built block would make the check pass by
	// never having run.
	const darkRoot = dark(1);
	const darkQuery = dark(2);

	for (const key of byKey.keys()) {
		if (emitted.has(key) || key in EXCLUDED) continue;
		fail(`${key} is selected but neither emitted nor excluded; give it a reason in manifest.mjs`);
	}

	const lines = [
		'/*',
		' * WinUI 3 design tokens, generated by scripts/tokens/generate.mjs from',
		` * ${RECORD} — microsoft/microsoft-ui-xaml @ ${doc.source.commit}, and`,
		` * ${FRAMEWORK_RECORD} — ${framework.source.package} ${framework.source.version}.`,
		' *',
		' * Generated file — do not edit. Run `pnpm tokens:build`.',
		' */',
		'',
		':root {',
		...light,
		'}',
		'',
		":root[data-theme='dark'] {",
		...darkRoot,
		'}',
		'',
		'@media (prefers-color-scheme: dark) {',
		"\t:root:not([data-theme='light']):not([data-theme='high-contrast']) {",
		...darkQuery,
		'\t}',
		'}',
		'',
		'/* High contrast is a remapping onto the eight system colors, not a third palette */',
		'/* of values — ADR 0005. */',
		":root[data-theme='high-contrast'] {",
		...highContrast,
		'}',
		'',
		'/* In forced-colors mode the browser fills the same eight from the actual Windows */',
		'/* theme, which is the one place these values are measured rather than ours. */',
		'@media (forced-colors: active) {',
		'\t:root {',
		...forcedColors,
		'\t}',
		'}',
		'',
		'/* The compact density, as DensityStyles/Compact.xaml declares it, scoped to a subtree',
		'   the way a merged ResourceDictionary is. Four selectors and not one: five of these',
		'   keys are declared in four theme scopes above, and the strongest of those,',
		'   `:root:not([data-theme=...]):not([data-theme=...])`, is (0,3,0). A lone',
		'   `:root[data-density=...]` is (0,2,0) and would lose to it under a system dark',
		'   preference — silently, and in two themes of three. Each selector here carries one',
		'   more attribute than the theme scope it mirrors.',
		'',
		'   Written outside the preference media query on purpose: the third selector matches',
		'   more broadly than that query does, which is harmless only because every value below',
		'   is a size rather than a colour. A density key that is a colour must not use this',
		'   rule. */',
		":root [data-density='compact'],",
		":root[data-theme='dark'] [data-density='compact'],",
		":root:not([data-theme='light']):not([data-theme='high-contrast']) [data-density='compact'],",
		":root[data-theme='high-contrast'] [data-density='compact'] {",
		...compact,
		'}'
	];

	return {
		css: `${lines.join('\n')}\n`,
		stats: {
			selected: byKey.size,
			emitted: emitted.size,
			excluded: Object.keys(EXCLUDED).length,
			external,
			light: declared(light),
			dark: declared(darkRoot),
			highContrast: declared(highContrast),
			forcedColors: declared(forcedColors),
			compact: declared(compact),
			compactSkipped,
			lines: lines.length
		}
	};
}

async function build() {
	const doc = JSON.parse(await readFile(join(ROOT, RECORD), 'utf8'));
	const framework = JSON.parse(await readFile(join(ROOT, FRAMEWORK_RECORD), 'utf8'));

	// One selection, computed here and handed to both writers. Selecting twice would
	// read the same records twice to answer the same question, and would leave two
	// callers able to drift apart on which one they asked. The order matters:
	// `stylesheet()`'s completeness check has to know which keys the other file
	// already emitted, and the only way to know is to build that one first.
	const selection = select(doc.resources, framework.resources);
	const { css: rampCss, emitted: rampEmitted } = typeRamp(
		selection.records,
		selection.byKey,
		doc.source.commit
	);
	const { css, stats } = stylesheet(doc, framework, selection, rampEmitted);
	const rampLines = rampCss.split('\n').length - 1;
	return {
		files: { [OUTPUT]: css, [RAMP_OUTPUT]: rampCss },
		stats: { ...stats, rampLines }
	};
}

/** Repo-relative path to file content, for the caller to write or to compare. */
export async function generate() {
	return (await build()).files;
}

async function main() {
	const { files, stats } = await build();
	for (const [path, content] of Object.entries(files)) {
		await mkdir(dirname(join(ROOT, path)), { recursive: true });
		await writeFile(join(ROOT, path), content);
	}

	console.log(
		[
			`source            ${RECORD} + ${FRAMEWORK_RECORD}, ${SOURCE_FILES.length} base files`,
			`selection         ${stats.selected} keys, closing over ${stats.external} OS-supplied names`,
			`emitted           ${stats.emitted} keys`,
			`excluded          ${stats.excluded} keys`,
			`declarations      light ${stats.light}, dark ${stats.dark}, high contrast ${stats.highContrast}, forced-colors ${stats.forcedColors}`,
			`compact density   ${stats.compact} declarations`,
			...stats.compactSkipped.map((entry) => `compact skipped   ${entry}`),
			`written           ${OUTPUT} (${stats.lines} lines)`,
			`written           ${RAMP_OUTPUT} (${stats.rampLines} lines)`
		].join('\n')
	);
}

// Only when run as a CLI: importing this module must not write anything, because C2
// imports it to ask what the output should be.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	try {
		await main();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
