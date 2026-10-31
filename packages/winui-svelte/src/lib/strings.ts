/**
 * The text the components write for themselves: ADR 0020.
 *
 * Upstream reads every one of these from a resource table that Windows localizes, so a key here is
 * upstream's name for the string where the pins hold one, from a control's
 * `Strings/en-us/Resources.resw` or, as `TEXT_*` and `UIA_*`, an id the core or the phone library
 * asks for. The pins hold no value for those ids, so the value here is what this package wrote
 * before it had a table. `WinUISvelte*` keys have no upstream name.
 *
 * A value with `%1!s!` in it is upstream's own format, and `formatString` fills it. A translation
 * may reorder the arguments, which is why the format is the string rather than its pieces.
 */
import { getContext, setContext } from 'svelte';

const table = {
	// Controls' Resources.resw.
	AutomationNameEllipsisBreadcrumbBarItem: 'More',
	BadgeIcon: '%1!s!, icon',
	BadgeIconTextOverride: '%1!s!, %2!s!',
	BadgeItemPlural1: '%1!s!, %2!u! items',
	BadgeItemPlural2: '%1!s!, %2!u! items',
	BadgeItemPlural3: '%1!s!, %2!u! items',
	BadgeItemPlural4: '%1!s!, %2!u! items',
	BadgeItemPlural5: '%1!s!, %2!u! items',
	BadgeItemPlural6: '%1!s!, %2!u! items',
	BadgeItemPlural7: '%1!s!, %2!u! items',
	BadgeItemSingular: '%1!s!, %2!u! item',
	BadgeItemTextOverride: '%1!s!, %2!u! %3!s!',
	ContentHSVComboBoxItem: 'HSV',
	ContentRGBComboBoxItem: 'RGB',
	GroupName: 'Group',
	InfoBarCloseButtonName: 'Close',
	InfoBarCloseButtonTooltip: 'Close',
	NavigationBackButtonName: 'Back',
	NavigationBackButtonToolTip: 'Back',
	NavigationButtonClosedName: 'Open Navigation',
	NavigationButtonOpenName: 'Close Navigation',
	NavigationButtonToggleName: 'Toggle Navigation',
	NavigationCloseButtonName: 'Close',
	NavigationOverflowButtonName: 'More',
	NavigationViewItemDefaultControlName: 'NavigationViewItem',
	NumberBoxDownSpinButtonName: 'Decrease',
	NumberBoxUpSpinButtonName: 'Increase',
	PersonName: 'Person',
	PipsPagerNameText: 'Pager',
	PipsPagerNextPageButtonText: 'Next Page',
	PipsPagerPageText: 'Page',
	PipsPagerPreviousPageButtonText: 'Previous Page',
	SelectorBarItemDefaultControlName: 'SelectorBarItem',
	SettingsButtonName: 'Settings',
	SplitButtonSecondaryButtonName: 'More Options',
	TabViewAddButtonName: 'Add New Tab',
	TabViewCloseButtonName: 'Close Tab',
	TabViewScrollDecreaseButtonTooltip: 'Scroll tab list backward',
	TabViewScrollIncreaseButtonTooltip: 'Scroll tab list forward',
	TeachingTipAlternateCloseButtonName: 'Close',
	TextAlphaLabel: 'Opacity',
	TextBlueLabel: 'Blue',
	TextGreenLabel: 'Green',
	TextHueLabel: 'Hue',
	TextMoreButtonLabelCollapsed: 'More',
	TextMoreButtonLabelExpanded: 'Less',
	TextRedLabel: 'Red',
	TextSaturationLabel: 'Saturation',
	TextValueLabel: 'Value',

	// The core's resource ids.
	TEXT_CALENDARDATEPICKER_DEFAULT_PLACEHOLDER_TEXT: 'select a date',
	TEXT_DATEPICKER_DAY_PLACEHOLDER: 'day',
	TEXT_DATEPICKER_MONTH_PLACEHOLDER: 'month',
	TEXT_DATEPICKER_YEAR_PLACEHOLDER: 'year',
	TEXT_TIMEPICKER_HOUR_PLACEHOLDER: 'hour',
	TEXT_TIMEPICKER_MINUTE_PLACEHOLDER: 'minute',
	TEXT_TIMEPICKER_PERIOD_PLACEHOLDER: 'AM',
	TEXT_TOGGLESWITCH_OFF: 'Off',
	TEXT_TOGGLESWITCH_ON: 'On',
	UIA_AP_DATEPICKER_DAYNAME: 'day',
	UIA_AP_DATEPICKER_MONTHNAME: 'month',
	UIA_AP_DATEPICKER_YEARNAME: 'year',
	UIA_AP_TIMEPICKER_HOURNAME: 'hour',
	UIA_AP_TIMEPICKER_MINUTENAME: 'minute',
	UIA_AP_TIMEPICKER_PERIODNAME: 'period',
	UIA_AUTOSUGGESTBOX_QUERY: 'Submit query',
	UIA_DIALOG_ACCEPT: 'Accept',
	UIA_DIALOG_DISMISS: 'Dismiss',
	UIA_FLIPVIEW_NEXT: 'Next',
	UIA_FLIPVIEW_PREVIOUS: 'Previous',
	UIA_MEDIA_ASPECTRATIO: 'Aspect ratio',
	UIA_MEDIA_AUDIO_SELECTION: 'Audio tracks',
	UIA_MEDIA_CAST: 'Cast to device',
	UIA_MEDIA_CC_SELECTION: 'Closed captions',
	UIA_MEDIA_FASTFORWARD: 'Fast forward',
	UIA_MEDIA_MUTE: 'Mute',
	UIA_MEDIA_NEXTRACK: 'Next',
	UIA_MEDIA_PAUSE: 'Pause',
	UIA_MEDIA_PLAY: 'Play',
	UIA_MEDIA_PLAYBACKRATE: 'Playback rate',
	UIA_MEDIA_PREVIOUSTRACK: 'Previous',
	UIA_MEDIA_REWIND: 'Rewind',
	UIA_MEDIA_SKIPBACKWARD: 'Back 10 seconds',
	UIA_MEDIA_SKIPFORWARD: 'Forward 30 seconds',
	UIA_MEDIA_STOP: 'Stop',
	UIA_MEDIA_UNMUTE: 'Unmute',
	UIA_MEDIA_VOLUME: 'Volume',
	UIA_MORE_BUTTON: 'See more',
	UIA_PASSWORDBOX_REVEAL: 'Show password',
	UIA_TEXTBOX_DELETE: 'Clear text',

	// No upstream name: a part upstream names no other way, or leaves to its automation peer.
	WinUISvelteCalendarViewName: 'Event',
	WinUISvelteLoopingSelectorNextName: 'Next item',
	WinUISvelteLoopingSelectorPreviousName: 'Previous item',
	WinUISvelteMediaRepeatName: 'Repeat',
	WinUISvelteMediaTransportControlsName: 'Media transport controls',
	WinUISvelteNavigationViewItemCollapseName: 'Collapse',
	WinUISvelteNavigationViewItemExpandName: 'Expand',
	WinUISveltePasswordBoxHidePasswordName: 'Hide password',
	WinUISvelteSemanticZoomOutName: 'Zoom out'
};

export type StringKey = keyof typeof table;
export type Strings = Record<StringKey, string>;

export const defaultStrings: Readonly<Strings> = Object.freeze(table);

type Read = (key: StringKey) => string;

// `Symbol.for`, so that a second copy of the package in one bundle still hears a provider.
const CONTEXT = Symbol.for('winui-svelte.strings');

/**
 * Supplies the text for this component and those below it, from its initialisation, as Svelte's
 * context does. Keys left out fall to an enclosing provider and then to `defaultStrings`. A
 * function is read whenever a component draws the text, so one that reads `$state` switches a
 * language in place.
 */
export function provideStrings(strings: Partial<Strings> | (() => Partial<Strings>)) {
	const parent = getContext<Read | undefined>(CONTEXT);
	const read = typeof strings === 'function' ? strings : () => strings;
	const resolve: Read = (key) => read()[key] ?? parent?.(key) ?? defaultStrings[key];
	setContext(CONTEXT, resolve);
}

/**
 * Fills upstream's `%1!s!`, `%2!u!` format from its arguments, in the format's own order. An
 * argument the key does not have draws nothing, and a bare `%1` without its `!s!` draws as written.
 */
export function formatString(format: string, ...values: (string | number)[]) {
	return format.replace(/%(\d)!\w+!/g, (_, index) => String(values[Number(index) - 1] ?? ''));
}

/** The reader a component draws its text with. Not exported from the package. */
export function useStrings(): Read {
	return getContext<Read | undefined>(CONTEXT) ?? ((key) => defaultStrings[key]);
}
