import { createCalendar, type Calendar } from '@internationalized/date';

/**
 * WinUI's DateTimeFormatter accepts a format template such as `month year`, whose tokens let
 * the locale choose their order and punctuation, as well as a brace-delimited pattern whose
 * literal text is preserved. The date controls share that small grammar here so their calendar
 * arithmetic and their visible names cannot drift apart.
 */

/** WinUI's `CalendarIdentifiers` mapped to `@internationalized/date` calendar identifiers. */
export const CALENDAR_IDENTIFIERS = {
	GregorianCalendar: 'gregory',
	HebrewCalendar: 'hebrew',
	HijriCalendar: 'islamic-civil',
	JapaneseCalendar: 'japanese',
	// @internationalized/date has no Julian calendar; WD-031 is owed for this Gregorian fallback.
	JulianCalendar: 'gregory',
	// @internationalized/date has no Korean calendar; WD-031 is owed for this Gregorian fallback.
	KoreanCalendar: 'gregory',
	PersianCalendar: 'persian',
	TaiwanCalendar: 'roc',
	ThaiCalendar: 'buddhist',
	UmAlQuraCalendar: 'islamic-umalqura'
} as const satisfies Record<string, string>;

/** A WinUI `Windows.Globalization.CalendarIdentifiers` member. */
export type CalendarIdentifier = keyof typeof CALENDAR_IDENTIFIERS;

/** The `@internationalized/date` calendar named by WinUI's `CalendarView.CalendarIdentifier`. */
export function calendarOf(identifier: string): Calendar {
	return createCalendar(calendarIdentifier(identifier));
}

// `Object.hasOwn` rather than a lookup against `undefined`: every one of these tables is an
// object literal, so `Object.prototype`'s own names — `constructor`, `toString`, `valueOf` —
// are keys that return something truthy, and a format string or an identifier is a value a
// consumer passes in. Without the guard, `calendarOf('constructor')` resolves to Gregorian,
// because `createCalendar` falls back to Gregorian for anything it does not know.
function calendarIdentifier(identifier: string): (typeof CALENDAR_IDENTIFIERS)[CalendarIdentifier] {
	if (!Object.hasOwn(CALENDAR_IDENTIFIERS, identifier)) {
		throw new Error(`unknown CalendarIdentifier ${JSON.stringify(identifier)}`);
	}
	return CALENDAR_IDENTIFIERS[identifier as CalendarIdentifier];
}

/**
 * The BCP-47 locale for WinUI `Language` and `CalendarView.CalendarIdentifier`, including the
 * calendar extension so `Intl` names the same calendar that supplies the grid.
 */
export function localeOf(language: string | undefined, identifier?: string): string {
	const locale = language ?? new Intl.DateTimeFormat().resolvedOptions().locale;
	const baseLocale = locale.replace(/-u(?:-[a-z0-9]{2,8})+/gi, '');
	if (identifier === undefined || identifier === 'GregorianCalendar') return baseLocale;
	return `${baseLocale}-u-ca-${calendarIdentifier(identifier)}`;
}

/** Format one `Date` by a WinUI `DateTimeFormatter` template or pattern. */
export function formatDate(format: string, date: Date, locale: string): string {
	if (!format.includes('{')) {
		const options: Intl.DateTimeFormatOptions = {};
		for (const token of format.trim().split(/\s+/)) {
			Object.assign(options, parseToken(token).options);
		}
		return new Intl.DateTimeFormat(locale, options).format(date);
	}

	let output = '';
	let cursor = 0;
	while (cursor < format.length) {
		const start = format.indexOf('{', cursor);
		if (start === -1) return output + format.slice(cursor);
		output += format.slice(cursor, start);
		const end = format.indexOf('}', start + 1);
		if (end === -1) {
			throw new Error(`unterminated token in date format ${JSON.stringify(format)}`);
		}
		const token = parseToken(format.slice(start + 1, end));
		const value = new Intl.DateTimeFormat(locale, token.options)
			.formatToParts(date)
			.filter((part) => part.type === token.partType)
			.map((part) => part.value)
			.join('');
		output += token.width === undefined ? value : value.padStart(token.width, '0');
		cursor = end + 1;
	}
	return output;
}

/**
 * The field order used by WinUI `DatePicker::GetOrder`
 * (`DatePicker_Partial.cpp:1798-1885`).
 */
export function fieldOrder(locale: string): ('day' | 'month' | 'year')[] {
	return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
		.formatToParts(new Date(2001, 1, 3))
		.flatMap((part) =>
			part.type === 'day' || part.type === 'month' || part.type === 'year' ? [part.type] : []
		);
}

/** The first weekday used by WinUI's calendar grid, Sunday `0` through Saturday `6`. */
export function weekStartsOn(locale: string): number {
	const intlLocale = new Intl.Locale(locale);
	if (typeof intlLocale.getWeekInfo !== 'function') return 0;
	return intlLocale.getWeekInfo().firstDay % 7;
}

/**
 * Whether WinUI `TimePicker.ClockIdentifier` selects a twelve-hour clock; its default follows
 * `TimePicker_Partial.cpp:229-239` by reading the locale formatter's resolved hour cycle.
 */
export function isTwelveHourClock(locale: string, clockIdentifier?: string): boolean {
	if (clockIdentifier === '12HourClock') return true;
	if (clockIdentifier === '24HourClock') return false;
	if (clockIdentifier)
		throw new Error(`unknown ClockIdentifier ${JSON.stringify(clockIdentifier)}`);
	const hourCycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions()
		.hourCycle;
	return hourCycle === 'h11' || hourCycle === 'h12';
}

type Token = {
	options: Intl.DateTimeFormatOptions;
	partType: Intl.DateTimeFormatPartTypes;
	width?: number;
};

function parseToken(token: string): Token {
	const match = /^(?<unit>[a-z]+)(?:\.(?<modifier>[a-z]+)(?:\((?<width>\d+)\))?)?$/.exec(token);
	const unit = match?.groups?.unit;
	const modifier = match?.groups?.modifier;
	const width = match?.groups?.width;
	const key = (modifier === undefined ? unit : `${unit}.${modifier}`) ?? '';
	const definition = Object.hasOwn(TOKEN_DEFINITIONS, key) ? TOKEN_DEFINITIONS[key] : undefined;
	if (definition === undefined || (width !== undefined && modifier !== 'integer')) {
		throw new Error(`unsupported date format token ${JSON.stringify(token)}`);
	}
	return { ...definition, width: width === undefined ? undefined : Number(width) };
}

const TOKEN_DEFINITIONS: Record<string, Omit<Token, 'width'>> = {
	year: { options: { year: 'numeric' }, partType: 'year' },
	'year.full': { options: { year: 'numeric' }, partType: 'year' },
	'year.abbreviated': { options: { year: '2-digit' }, partType: 'year' },
	month: { options: { month: 'long' }, partType: 'month' },
	'month.full': { options: { month: 'long' }, partType: 'month' },
	'month.abbreviated': { options: { month: 'short' }, partType: 'month' },
	'month.numeric': { options: { month: 'numeric' }, partType: 'month' },
	'month.integer': { options: { month: 'numeric' }, partType: 'month' },
	day: { options: { day: 'numeric' }, partType: 'day' },
	'day.integer': { options: { day: 'numeric' }, partType: 'day' },
	dayofweek: { options: { weekday: 'long' }, partType: 'weekday' },
	'dayofweek.full': { options: { weekday: 'long' }, partType: 'weekday' },
	'dayofweek.abbreviated': { options: { weekday: 'short' }, partType: 'weekday' },
	hour: { options: { hour: 'numeric' }, partType: 'hour' },
	'hour.integer': { options: { hour: 'numeric' }, partType: 'hour' },
	minute: { options: { minute: 'numeric' }, partType: 'minute' },
	'minute.integer': { options: { minute: 'numeric' }, partType: 'minute' },
	second: { options: { second: 'numeric' }, partType: 'second' },
	'second.integer': { options: { second: 'numeric' }, partType: 'second' },
	period: { options: { hour: 'numeric', hour12: true }, partType: 'dayPeriod' },
	'period.abbreviated': { options: { hour: 'numeric', hour12: true }, partType: 'dayPeriod' },
	era: { options: { era: 'short' }, partType: 'era' },
	'era.abbreviated': { options: { era: 'short' }, partType: 'era' },
	'era.full': { options: { era: 'long' }, partType: 'era' }
};
