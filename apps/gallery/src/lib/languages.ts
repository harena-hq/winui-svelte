import record from '../../../../data/winui-gallery-languages.json' with { type: 'json' };

/**
 * The Gallery's own language list, extracted from `Helpers/Language/LanguageList.cs` at the
 * commit `record.source.commit` names.
 *
 * The CalendarView page's third ComboBox is this list: it shows each `name` and hands the
 * control the matching `code`, which is what `calendarLanguages_SelectionChanged` does
 * upstream. The order is the source's, because the ComboBox's first row is its default.
 *
 * Five of the names end in a space. That is the source's, it is what the original's ComboBox
 * displays, and trimming it here would make the page disagree with the page it is compared
 * against.
 */
export interface Language {
	/** The row's display text. */
	name: string;
	/** The BCP-47 language the control is given. */
	code: string;
}

export const languages: Language[] = record.languages;
