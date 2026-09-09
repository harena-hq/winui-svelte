<script lang="ts" module>
	export interface CalendarViewProps {
		/** CalendarView.CalendarIdentifier. */
		calendarIdentifier?: string;
		/** FrameworkElement.Language. */
		language?: string | undefined;
		/** CalendarView.FirstDayOfWeek. Sunday is 0 and Saturday is 6. */
		firstDayOfWeek?: number | undefined;
		/** CalendarView.DayOfWeekFormat. */
		dayOfWeekFormat?: string | undefined;
		/** CalendarView.IsGroupLabelVisible. */
		isGroupLabelVisible?: boolean;
		/** CalendarView.IsOutOfScopeEnabled. */
		isOutOfScopeEnabled?: boolean;
		/** CalendarView.IsTodayHighlighted. */
		isTodayHighlighted?: boolean;
		/** CalendarView.MinDate. */
		minDate?: Date | undefined;
		/** CalendarView.MaxDate. */
		maxDate?: Date | undefined;
		/** CalendarView.SelectionMode. */
		selectionMode?: 'none' | 'single' | 'multiple';
		/** CalendarView.SelectedDates. */
		selectedDates?: Date[];
		/** CalendarView.SelectedDatesChanged. */
		onSelectedDatesChange?: ((dates: Date[]) => void) | undefined;
		class?: string;
		style?: string;
		/** The Calendar.Root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// Appearance properties (CalendarItemBackground, DayItemFontFamily, TodayFontWeight, and
	// the rest) belong to the token cascade under ADR 0002. SelectionMode, SelectedDates, and
	// SelectedDatesChanged belong to unit 3; DisplayMode, DisplayModeChanged, and SetDisplayDate
	// belong to unit 4. CalendarViewDayItemChanging, blackout dates, and density bars have no
	// property surface yet and remain owed. NumberOfWeeksInView is deliberately absent; WD-033.
</script>

<script lang="ts">
	import {
		fromDate,
		getLocalTimeZone,
		isSameDay,
		toCalendar,
		toCalendarDate,
		today,
		type DateValue
	} from '@internationalized/date';
	import { Calendar } from 'bits-ui';
	import { SvelteDate } from 'svelte/reactivity';
	import { calendarOf, formatDate, localeOf, weekStartsOn } from '../internal/datetime';
	import { focusVisual } from '../internal/focus-visual';

	let {
		calendarIdentifier = 'GregorianCalendar',
		language = undefined,
		firstDayOfWeek = undefined,
		dayOfWeekFormat = undefined,
		isGroupLabelVisible = false,
		isOutOfScopeEnabled = true,
		isTodayHighlighted = true,
		// CalendarView clamps against the same ±100-year default (DatePicker_Partial.cpp:31).
		minDate = dateOffsetByYears(-100),
		maxDate = dateOffsetByYears(100),
		selectionMode = 'single',
		selectedDates = $bindable([]),
		onSelectedDatesChange,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: CalendarViewProps = $props();

	const timeZone = getLocalTimeZone();
	const calendar = $derived(calendarOf(calendarIdentifier));

	/* The month on show is today's until the user navigates, and it has to be a date in the
	   calendar the identifier names — a grid built from one calendar's date and another's names
	   throws inside the primitive. Holding the navigated month *with the identifier it was
	   navigated in* is what makes the two change together: on an identifier change the pair no
	   longer matches, the derived falls back to today in the new calendar, and it does so in the
	   same update as the `{#key}` that recreates the grid. A `$state` seeded from `calendar` and
	   an `$effect` that resets it cannot: the effect runs after the DOM has already been rebuilt
	   with the old date. */
	let navigated = $state<{ identifier: string; value: DateValue } | null>(null);
	const placeholder = $derived(
		navigated !== null && navigated.identifier === calendarIdentifier
			? navigated.value
			: toCalendar(today(timeZone), calendar)
	);
	// WD-034: calendar arithmetic changes, while the language still supplies digits and direction.
	const locale = $derived(localeOf(language, calendarIdentifier));
	const firstWeekday = $derived(
		(firstDayOfWeek ?? weekStartsOn(locale)) as 0 | 1 | 2 | 3 | 4 | 5 | 6
	);
	const minValue = $derived(calendarDateOf(minDate));
	const maxValue = $derived(calendarDateOf(maxDate));
	const selectedValues = $derived(selectedDates.map(calendarDateOf));
	const dayNumberFormat = $derived(new Intl.NumberFormat(locale));
	let previousSelectionMode = $state<'none' | 'single' | 'multiple' | undefined>(undefined);

	function dateOffsetByYears(years: number): Date {
		const date = new SvelteDate();
		date.setFullYear(date.getFullYear() + years);
		return date;
	}

	function dateFor(value: { toDate: (timeZone: string) => Date }): Date {
		return value.toDate(timeZone);
	}

	/**
	 * A `Date` becomes a `CalendarDate` in the identifier's calendar, and the day is the whole
	 * of it. The intermediate has to be dropped: `fromDate` returns a `ZonedDateTime`, and a
	 * zoned value reaching the primitive as a placeholder makes it parse every cell's
	 * `data-value` — a plain `YYYY-MM-DD` — as a zoned string, which throws on the first arrow
	 * key. The primitive picks its parser from the placeholder's own type.
	 */
	function calendarDateOf(date: Date): DateValue {
		return toCalendar(toCalendarDate(fromDate(date, timeZone)), calendar);
	}

	function commitSelectedDates(next: Date[]) {
		selectedDates = next;
		onSelectedDatesChange?.(next);
	}

	function changeSelectedDates(next: DateValue[] = []) {
		if (selectionMode === 'none') return;

		if (next.length > selectedValues.length && selectionMode === 'single') {
			const added = next.find((candidate) =>
				selectedValues.every((selected) => !isSameDay(selected, candidate))
			);
			if (added) commitSelectedDates([dateFor(added)]);
			return;
		}

		commitSelectedDates(next.map(dateFor));
	}

	$effect(() => {
		if (previousSelectionMode === undefined) {
			previousSelectionMode = selectionMode;
			return;
		}
		if (selectionMode === previousSelectionMode) return;

		previousSelectionMode = selectionMode;
		if (selectionMode === 'none') {
			commitSelectedDates([]);
		} else if (selectionMode === 'single' && selectedDates.length > 1) {
			commitSelectedDates([selectedDates[0]]);
		}
	});
</script>

{#key calendarIdentifier}
	<Calendar.Root
		bind:ref
		type="multiple"
		bind:value={() => selectedValues, changeSelectedDates}
		{locale}
		bind:placeholder={
			() => placeholder, (value) => (navigated = { identifier: calendarIdentifier, value })
		}
		fixedWeeks
		disableDaysOutsideMonth={false}
		weekdayFormat="short"
		weekStartsOn={firstWeekday}
		{minValue}
		{maxValue}
	>
		{#snippet child({ props, months, weekdays })}
			<div
				{...props}
				class={['calendar-view', className]}
				{style}
				data-out-of-scope-enabled={isOutOfScopeEnabled ? '' : undefined}
				data-today-highlighted={isTodayHighlighted ? '' : undefined}
				data-group-labels={isGroupLabelVisible ? '' : undefined}
				{...rest}
			>
				<div class="header">
					<!-- The month-year formatter follows CalendarView_Partial.cpp:1012-1013. This
					     button has no handler because unit 4 supplies the display-mode transition. -->
					<Calendar.Heading>
						{#snippet child({ props: headingProps })}
							<button {...headingProps} class="title" type="button">
								{formatDate('month year', dateFor(placeholder), locale)}
							</button>
						{/snippet}
					</Calendar.Heading>
					<Calendar.PrevButton>
						{#snippet child({ props: previousProps })}
							<button {...previousProps} class="nav previous">&#xEDDB;</button>
						{/snippet}
					</Calendar.PrevButton>
					<Calendar.NextButton>
						{#snippet child({ props: nextProps })}
							<button {...nextProps} class="nav next">&#xEDDC;</button>
						{/snippet}
					</Calendar.NextButton>
				</div>
				<div class="divider"></div>
				<div class="views">
					<div class="month-view">
						<div class="weekdays">
							{#each weekdays as weekday, index (weekday)}
								<span class="weekday winui-CaptionTextBlockStyle">
									{#if dayOfWeekFormat === undefined}
										<!-- WD-032: Intl has no CLDR short weekday width. -->
										{Array.from(weekday).slice(0, 2).join('')}
									{:else}
										{formatDate(dayOfWeekFormat, dateFor(months[0].weeks[0][index]), locale)}
									{/if}
								</span>
							{/each}
						</div>
						<div class="month-panel">
							{#each months[0].weeks as week (week[0].toString())}
								<Calendar.GridRow>
									{#snippet child({ props: rowProps })}
										<div {...rowProps} class="week">
											{#each week as date (date.toString())}
												<Calendar.Cell {date} month={months[0].value}>
													{#snippet child({ props: cellProps })}
														<div {...cellProps} class="cell">
															<Calendar.Day>
																{#snippet child({ props: dayProps })}
																	<div {...dayProps} class="day" {@attach focusVisual}>
																		{#if isGroupLabelVisible && date.day === 1}
																			<!-- CalendarViewGeneratorMonthViewHost.cpp:121-150 uses the
																			     abbreviated month name on the first day. -->
																			<span class="label"
																				>{formatDate(
																					'month.abbreviated',
																					dateFor(date),
																					locale
																				)}</span
																			>
																		{/if}
																		<span class="main">{dayNumberFormat.format(date.day)}</span>
																	</div>
																{/snippet}
															</Calendar.Day>
														</div>
													{/snippet}
												</Calendar.Cell>
											{/each}
										</div>
									{/snippet}
								</Calendar.GridRow>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/snippet}
	</Calendar.Root>
{/key}

<style>
	.calendar-view {
		display: inline-flex;
		flex-direction: column;
		/* The frame's width is the panel's, not the header's. WinUI computes it — the template's
		   inner Grid takes `MinWidth="{Binding TemplateSettings.MinViewWidth}"`
		   (CalendarView_themeresources.xaml:357) — and without it the header's own text would
		   size the control, because a flex column is as wide as its widest child. Seven 42px
		   cells and the panel's 2px margin either side is a 298px content box, which is the
		   300px border box the original measures on the reference guest: its border columns are
		   x=370 and x=669. */
		width: calc(7 * (40px + 1px * 2) + 2px * 2);
		/* c1-allow: CalendarView_themeresources.xaml:312 — DefaultCalendarViewStyle BorderThickness="1". */
		border: 1px solid var(--winui-CalendarViewBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-CalendarViewBackground);
		overflow: hidden;
	}

	.header {
		display: flex;
	}

	.title,
	.nav {
		border: 0;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-CalendarViewNavigationButtonBackground);
	}

	.title {
		flex: 1 1 auto;
		min-width: 0;
		/* A `<button>` does not inherit the family, and the original's header is the control's
		   own text face. Same trap and same fix as ComboBox's trigger. */
		font-family: inherit;
		/* c1-allow: measured. The original's header row is 49px tall on the reference guest —
		   its top border is row 261 and the divider under it row 311 — which is 13px of margin,
		   15px of padding and a 21px line box. Chromium's `normal` line height for this face at
		   14px is 19, so the row would be 2px short and everything under it 2px high. The two
		   navigation buttons stretch to whatever this one sets, as they do in XAML. */
		line-height: 21px;
		margin: var(--winui-CalendarViewHeaderNavigationButtonMargin);
		padding: var(--winui-CalendarViewHeaderNavigationButtonPadding);
		/* Not `CalendarViewHeaderNavigationButtonForeground`, which the pin defines and applies
		   nowhere: `HeaderNavigationButtonStyle` sets no Foreground, and the HeaderButton takes
		   `Foreground="{TemplateBinding Foreground}"` from the control, whose own style sets
		   `CalendarViewForeground` (CalendarView_themeresources.xaml:295, :335). The key is only
		   read by the three pointer states below. Measured: the original's header ink is the
		   same (27, 27, 27) as its day numbers. */
		color: var(--winui-CalendarViewForeground);
		font-size: var(--winui-CalendarViewHeaderNavigationButtonFontSize);
		font-weight: var(--winui-CalendarViewHeaderNavigationFontWeight);
		text-align: left;
	}

	.title:hover {
		background: var(--winui-CalendarViewNavigationButtonBackgroundPointerOver);
		color: var(--winui-CalendarViewHeaderNavigationButtonForegroundPointerOver);
	}

	.title:active {
		background: var(--winui-CalendarViewNavigationButtonBackgroundPressed);
		color: var(--winui-CalendarViewHeaderNavigationButtonForegroundPressed);
	}

	.title:disabled {
		color: var(--winui-CalendarViewHeaderNavigationButtonForegroundDisabled);
	}

	.nav {
		padding: var(--winui-CalendarViewNavigationButtonPadding);
		/* `NavigationButtonStyle` sets no Foreground either, so the arrows take the ordinary
		   Button's — which is why the original paints them at full text strength rather than in
		   `CalendarViewNavigationButtonForeground`'s grey. That key, like the header's, is read
		   only by the pointer states. */
		color: var(--winui-ButtonForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-CalendarViewNavigationButtonFontSize);
	}

	.previous {
		margin: var(--winui-CalendarViewNavigationPreviousButtonMargin);
	}

	.next {
		margin: var(--winui-CalendarViewNavigationNextButtonMargin);
	}

	.nav:hover {
		background: var(--winui-CalendarViewNavigationButtonBackgroundPointerOver);
		color: var(--winui-CalendarViewNavigationButtonForegroundPointerOver);
	}

	.nav:active {
		background: var(--winui-CalendarViewNavigationButtonBackgroundPressed);
		color: var(--winui-CalendarViewNavigationButtonForegroundPressed);
	}

	.nav:disabled {
		color: var(--winui-CalendarViewNavigationButtonForegroundDisabled);
	}

	.divider {
		height: 1px;
		background: var(--winui-CalendarViewBorderBrush);
	}

	/* c1-allow: CalendarView_themeresources.xaml:363 — WeekDayNames Margin="2,2,2,0". */
	.weekdays {
		display: flex;
		margin: 2px 2px 0;
	}

	.weekday {
		box-sizing: border-box;
		/* c1-allow: CalendarView_themeresources.xaml:363 — each Grid column is 42px; its
		   WeekDayNameStyle margin remains inside that column's allotted outer width. */
		flex: 0 0 calc(42px - var(--winui-CalendarViewWeekDayMargin) * 2);
		margin: var(--winui-CalendarViewWeekDayMargin);
		padding: var(--winui-CalendarViewWeekDayPadding);
		color: var(--winui-CalendarViewCalendarItemForeground);
		font-weight: var(--winui-CalendarViewWeekDayFontWeight);
		text-align: center;
	}

	/* c1-allow: CalendarView_themeresources.xaml:395 — MonthViewScrollViewer Margin="2". */
	.month-panel {
		margin: 2px;
	}

	.week {
		display: flex;
	}

	/* c1-allow: CalendarView_themeresources.xaml:245-248 — a 40px item plus Margin="1"
	   on each side is a 42px panel cell. */
	.cell {
		display: flex;
		flex: 0 0 42px;
		height: 42px;
		align-items: center;
		justify-content: center;
	}

	.day {
		position: relative;
		box-sizing: border-box;
		/* c1-allow: CalendarView_themeresources.xaml:245 — MinWidth="40". */
		width: 40px;
		/* c1-allow: CalendarView_themeresources.xaml:246 — MinHeight="40". */
		height: 40px;
		/* c1-allow: CalendarView_themeresources.xaml:311 — CalendarItemBorderThickness="1". */
		border: 1px solid var(--winui-CalendarViewCalendarItemBorderBrush);
		border-radius: 50%;
		background: var(--winui-CalendarViewCalendarItemBackground);
		color: var(--winui-CalendarViewCalendarItemForeground);
	}

	.main,
	.label {
		position: absolute;
		/* c1-allow: CalendarView_themeresources.xaml:248 — Padding="0,0,0,4". */
		inset: 0 0 4px;
		display: flex;
		justify-content: center;
	}

	.main {
		align-items: center;
		margin: var(--winui-CalendarViewDayItemMargin);
		font-size: var(--winui-CalendarViewDayItemFontSize);
	}

	.label {
		align-items: flex-start;
		margin: var(--winui-CalendarViewFirstOfMonthLabelMargin);
		font-size: var(--winui-CalendarViewFirstOfMonthLabelFontSize);
	}

	.day:hover {
		border-color: var(--winui-CalendarViewHoverBorderBrush);
		background: var(--winui-CalendarViewCalendarItemHoverBackground);
	}

	.day:active {
		border-color: var(--winui-CalendarViewPressedBorderBrush);
		background: var(--winui-CalendarViewCalendarItemPressedBackground);
		color: var(--winui-CalendarViewPressedForeground);
	}

	.calendar-view[data-out-of-scope-enabled] .day[data-outside-month]:not(:hover):not(:active) {
		background: var(--winui-CalendarViewOutOfScopeBackground);
		color: var(--winui-CalendarViewOutOfScopeForeground);
	}

	.calendar-view[data-out-of-scope-enabled] .day[data-outside-month]:hover {
		color: var(--winui-CalendarViewOutOfScopeHoverForeground);
	}

	.calendar-view[data-out-of-scope-enabled] .day[data-outside-month]:active {
		color: var(--winui-CalendarViewOutOfScopePressedForeground);
	}

	.day[data-selected] {
		border-color: var(--winui-CalendarViewSelectedBorderBrush);
		color: var(--winui-CalendarViewSelectedForeground);
	}

	.day[data-selected]:hover {
		border-color: var(--winui-CalendarViewSelectedHoverBorderBrush);
		color: var(--winui-CalendarViewSelectedHoverForeground);
	}

	.day[data-selected]:active {
		border-color: var(--winui-CalendarViewSelectedPressedBorderBrush);
		color: var(--winui-CalendarViewSelectedPressedForeground);
	}

	.day[data-selected][data-disabled] {
		border-color: var(--winui-CalendarViewSelectedDisabledBorderBrush);
		color: var(--winui-CalendarViewSelectedDisabledForeground);
	}

	.calendar-view[data-today-highlighted] .day[data-today] {
		/* The rounded chrome gives today a background ring, not a border brush. */
		border-color: var(--winui-CalendarViewCalendarItemBorderBrush);
		background: var(--winui-CalendarViewTodayBackground);
		color: var(--winui-CalendarViewTodayForeground);
	}

	.calendar-view[data-today-highlighted] .day[data-today]:hover {
		background: var(--winui-CalendarViewTodayHoverBackground);
	}

	.calendar-view[data-today-highlighted] .day[data-today]:active {
		background: var(--winui-CalendarViewTodayPressedBackground);
	}

	.day[data-disabled] {
		background: var(--winui-CalendarViewCalendarItemDisabledBackground);
		color: var(--winui-CalendarViewDisabledForeground);
	}

	.calendar-view[data-today-highlighted] .day[data-disabled][data-today] {
		background: var(--winui-CalendarViewTodayDisabledBackground);
	}

	.calendar-view[data-today-highlighted] .day[data-today][data-selected] {
		/* c1-allow: CalendarViewBaseItemChrome.cpp:26 — TodaySelectedInnerBorderThickness is 2.0f. */
		box-shadow: inset 0 0 0 2px var(--winui-CalendarViewTodaySelectedInnerBorderBrush);
	}

	.day[data-focus-visual]::before {
		content: '';
		position: absolute;
		/* c1-allow: CalendarView_themeresources.xaml:249 — `FocusVisualMargin="-3"`, and a
		   negative focus-visual margin grows the band outward rather than inward: the same
		   reading Slider's `-7,0,-7,0` gets, and what `GetItemFocusVisualMargin` returns for
		   the rounded chrome (CalendarViewGeneratorHost.cpp:227-236). Three pixels is exactly
		   the panel's 2px margin plus the frame's 1px border, so the band on an edge cell
		   stops at the inside of the border instead of being clipped by it. */
		inset: -3px;
		border-radius: 50%;
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-CalendarViewFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-CalendarViewFocusVisualSecondaryBrush);
		pointer-events: none;
	}
</style>
