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
		/** CalendarView.DisplayMode. */
		displayMode?: 'month' | 'year' | 'decade';
		/** CalendarView.DisplayModeChanged. */
		onDisplayModeChange?: ((mode: 'month' | 'year' | 'decade') => void) | undefined;
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
		displayMode = $bindable('month'),
		onDisplayModeChange,
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
	const todayValue = $derived(toCalendar(today(timeZone), calendar));
	const yearScopeStart = $derived(placeholder.set({ month: 1, day: 1 }));
	const decadeScopeStart = $derived(
		placeholder.set({ year: placeholder.year - (placeholder.year % 10), month: 1, day: 1 })
	);
	const activeScopeStart = $derived(displayMode === 'year' ? yearScopeStart : decadeScopeStart);
	const yearItems = $derived(itemsForScope(yearScopeStart, 'month'));
	const decadeItems = $derived(itemsForScope(decadeScopeStart, 'year'));
	let previousSelectionMode = $state<'none' | 'single' | 'multiple' | undefined>(undefined);

	function dateOffsetByYears(years: number): Date {
		const date = new SvelteDate();
		date.setFullYear(date.getFullYear() + years);
		return date;
	}

	/**
	 * The weekday row's labels. WinUI asks the calendar for the shortest weekday string, which is
	 * CLDR's *short* width — `Su`, `Mo` — and `Intl` exposes only the abbreviated (`Sun`) and
	 * narrow (`S`) widths, so the first two characters of the abbreviated name stand in. That is
	 * exact wherever the short width is the abbreviated name truncated, and it collapses where it
	 * is not: `ar` abbreviates every weekday to a name beginning `ال`, and seven identical labels
	 * are worse than seven long ones. So the truncation is kept only while it leaves the seven
	 * distinct. WD-032.
	 */
	function weekdayLabels(weekdays: string[]): string[] {
		const short = weekdays.map((weekday) => Array.from(weekday).slice(0, 2).join(''));
		return new Set(short).size === short.length ? short : weekdays;
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

	function setDisplayMode(mode: 'month' | 'year' | 'decade') {
		if (displayMode === mode) return;
		displayMode = mode;
		onDisplayModeChange?.(mode);
	}

	function itemsForScope(scopeStart: DateValue, unit: 'month' | 'year'): DateValue[] {
		const index = unit === 'month' ? monthOffset(scopeStart) : scopeStart.year - minValue.year;
		const firstCellIndex = Math.floor(index / 4) * 4;
		return Array.from({ length: 16 }, (_, offset) =>
			minValue.add(
				unit === 'month' ? { months: firstCellIndex + offset } : { years: firstCellIndex + offset }
			)
		);
	}

	function monthOffset(scopeStart: DateValue): number {
		let months = 0;
		for (let year = minValue.year; year < scopeStart.year; year++) {
			if (year - minValue.year >= 4000) {
				throw new Error('CalendarView month offset exceeds 4000 calendar years.');
			}
			months += calendar.getMonthsInYear(minValue.set({ year }));
		}
		return months + scopeStart.month - minValue.month;
	}

	function unitStart(value: DateValue, unit: 'month' | 'year'): DateValue {
		return unit === 'month' ? value.set({ day: 1 }) : value.set({ month: 1, day: 1 });
	}

	function unitEnd(value: DateValue, unit: 'month' | 'year'): DateValue {
		return unitStart(value, unit)
			.add(unit === 'month' ? { months: 1 } : { years: 1 })
			.subtract({ days: 1 });
	}

	function isDisabled(value: DateValue, unit: 'month' | 'year'): boolean {
		return (
			unitEnd(value, unit).compare(minValue) < 0 || unitStart(value, unit).compare(maxValue) > 0
		);
	}

	function isOutOfScope(value: DateValue, unit: 'month' | 'year'): boolean {
		return unit === 'month'
			? value.year !== yearScopeStart.year
			: value.year < decadeScopeStart.year || value.year > decadeScopeStart.year + 9;
	}

	function isPlaceholder(value: DateValue, unit: 'month' | 'year'): boolean {
		return unit === 'month'
			? value.year === placeholder.year && value.month === placeholder.month
			: value.year === placeholder.year;
	}

	function isToday(value: DateValue, unit: 'month' | 'year'): boolean {
		return unit === 'month'
			? value.year === todayValue.year && value.month === todayValue.month
			: value.year === todayValue.year;
	}

	function scopeCanNavigate(direction: -1 | 1): boolean {
		const unit = displayMode === 'year' ? 'month' : 'year';
		const amount = displayMode === 'year' ? 1 : 10;
		const target = activeScopeStart.add({ years: direction * amount });
		const targetItems = itemsForScope(target, unit);
		return direction < 0
			? unitStart(targetItems[0], unit).compare(minValue) >= 0
			: unitEnd(targetItems.at(-1)!, unit).compare(maxValue) <= 0;
	}

	function navigateScope(direction: -1 | 1) {
		if (!scopeCanNavigate(direction)) return;
		const amount = displayMode === 'year' ? 1 : 10;
		navigated = {
			identifier: calendarIdentifier,
			value: placeholder.add({ years: direction * amount })
		};
	}

	function chooseItem(value: DateValue, unit: 'month' | 'year') {
		if (isDisabled(value, unit)) return;
		navigated = {
			identifier: calendarIdentifier,
			value:
				unit === 'month'
					? value.set({ day: placeholder.day })
					: placeholder.set({ year: value.year })
		};
		setDisplayMode(unit === 'month' ? 'month' : 'year');
	}

	function moveItemFocus(event: KeyboardEvent, index: number, unit: 'month' | 'year') {
		if (event.ctrlKey) return;
		const movement =
			event.key === 'ArrowLeft'
				? -1
				: event.key === 'ArrowRight'
					? 1
					: event.key === 'ArrowUp'
						? -4
						: event.key === 'ArrowDown'
							? 4
							: 0;
		if (movement === 0) return;
		const next = index + movement;
		if (next < 0 || next >= 16) return;
		event.preventDefault();
		const nextValue = (unit === 'month' ? yearItems : decadeItems)[next];
		navigated = {
			identifier: calendarIdentifier,
			value:
				unit === 'month'
					? nextValue.set({ day: placeholder.day })
					: placeholder.set({ year: nextValue.year })
		};
		(event.currentTarget as HTMLButtonElement)
			.closest('.year-decade-panel')
			?.querySelector<HTMLButtonElement>(`[data-calendar-unit="${unit}"][data-index="${next}"]`)
			?.focus();
	}

	function handleRootKeydown(event: KeyboardEvent) {
		if (!event.ctrlKey) return;
		if (event.key === 'ArrowUp' && displayMode !== 'decade') {
			event.preventDefault();
			setDisplayMode(displayMode === 'month' ? 'year' : 'decade');
		} else if (event.key === 'ArrowDown' && displayMode !== 'month') {
			event.preventDefault();
			setDisplayMode(displayMode === 'decade' ? 'year' : 'month');
		}
	}

	function rootKeydown(node: HTMLElement) {
		// bits-ui owns the root's bubbling keyboard listener. Capture keeps Ctrl+Up/Down at this
		// control boundary before that primitive handles the ordinary calendar arrows.
		node.addEventListener('keydown', handleRootKeydown, true);
		return () => node.removeEventListener('keydown', handleRootKeydown, true);
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
			{@const labels = weekdayLabels(weekdays)}
			<div
				{...props}
				class={['calendar-view', className]}
				{style}
				data-display-mode={displayMode}
				data-out-of-scope-enabled={isOutOfScopeEnabled ? '' : undefined}
				data-today-highlighted={isTodayHighlighted ? '' : undefined}
				data-group-labels={isGroupLabelVisible ? '' : undefined}
				{@attach rootKeydown}
				{...rest}
			>
				<div class="header">
					<Calendar.Heading>
						{#snippet child({ props: headingProps })}
							<button
								{...headingProps}
								class="title"
								type="button"
								{@attach focusVisual}
								disabled={displayMode === 'decade'}
								onclick={() => setDisplayMode(displayMode === 'month' ? 'year' : 'decade')}
							>
								{displayMode === 'month'
									? formatDate('month year', dateFor(placeholder), locale)
									: displayMode === 'year'
										? formatDate('year', dateFor(placeholder), locale)
										: `${formatDate('year', dateFor(decadeScopeStart), locale)} - ${formatDate('year', dateFor(decadeScopeStart.add({ years: 9 })), locale)}`}
							</button>
						{/snippet}
					</Calendar.Heading>
					{#if displayMode === 'month'}
						<!-- bits-ui owns month navigation because it also owns its date-bound disabled state. -->
						<Calendar.PrevButton>
							{#snippet child({ props: previousProps })}
								<button {...previousProps} class="nav previous" {@attach focusVisual}
									>&#xEDDB;</button
								>
							{/snippet}
						</Calendar.PrevButton>
						<Calendar.NextButton>
							{#snippet child({ props: nextProps })}
								<button {...nextProps} class="nav next" {@attach focusVisual}>&#xEDDC;</button>
							{/snippet}
						</Calendar.NextButton>
					{:else}
						<button
							class="nav previous"
							type="button"
							{@attach focusVisual}
							disabled={!scopeCanNavigate(-1)}
							onclick={() => navigateScope(-1)}
						>
							&#xEDDB;
						</button>
						<button
							class="nav next"
							type="button"
							{@attach focusVisual}
							disabled={!scopeCanNavigate(1)}
							onclick={() => navigateScope(1)}
						>
							&#xEDDC;
						</button>
					{/if}
				</div>
				<div class="divider"></div>
				<div class="views">
					<div class="view-layer month-view" aria-hidden={displayMode !== 'month'}>
						<div class="weekdays">
							{#each weekdays as weekday, index (weekday)}
								<span class="weekday winui-CaptionTextBlockStyle">
									{#if dayOfWeekFormat === undefined}
										<!-- WD-032: Intl has no CLDR short weekday width. -->
										{labels[index]}
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
																	<div {...dayProps} class="day item-chrome" {@attach focusVisual}>
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
					<div class="view-layer year-view" aria-hidden={displayMode !== 'year'}>
						<div class="year-decade-panel">
							{#each yearItems as item, index (item.toString())}
								<button
									class="year-decade-cell"
									class:out-of-scope={isOutOfScope(item, 'month')}
									data-calendar-unit="month"
									data-index={index}
									disabled={isDisabled(item, 'month')}
									tabindex={isPlaceholder(item, 'month') ? 0 : -1}
									onclick={() => chooseItem(item, 'month')}
									onkeydown={(event) => moveItemFocus(event, index, 'month')}
									{@attach focusVisual}
								>
									<div
										class="month-year-item item-chrome"
										data-today={isToday(item, 'month') ? '' : undefined}
										data-disabled={isDisabled(item, 'month') ? '' : undefined}
									>
										{#if isGroupLabelVisible && item.month === 1}
											<span class="year-decade-label"
												>{formatDate('year', dateFor(item), locale)}</span
											>
										{/if}
										<span class="year-decade-main"
											>{formatDate('month.abbreviated', dateFor(item), locale)}</span
										>
									</div>
								</button>
							{/each}
						</div>
					</div>
					<div class="view-layer decade-view" aria-hidden={displayMode !== 'decade'}>
						<!-- BackgroundLayer has no Background in style C, so its opacity animation paints nothing. -->
						<div class="year-decade-panel">
							{#each decadeItems as item, index (item.toString())}
								<button
									class="year-decade-cell"
									class:out-of-scope={isOutOfScope(item, 'year')}
									data-calendar-unit="year"
									data-index={index}
									disabled={isDisabled(item, 'year')}
									tabindex={isPlaceholder(item, 'year') ? 0 : -1}
									onclick={() => chooseItem(item, 'year')}
									onkeydown={(event) => moveItemFocus(event, index, 'year')}
									{@attach focusVisual}
								>
									<div
										class="month-year-item item-chrome"
										data-today={isToday(item, 'year') ? '' : undefined}
										data-disabled={isDisabled(item, 'year') ? '' : undefined}
									>
										<span class="year-decade-main">{formatDate('year', dateFor(item), locale)}</span
										>
									</div>
								</button>
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
		position: relative;
		border: 0;
		/* The user agent's own focus ring is not WinUI's, and it appears wherever a script moves
		   focus — a CalendarDatePicker's flyout focuses this button as it opens. The band below
		   is the one the item style declares, on the same attachment the day cell uses. */
		outline: none;
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

	.views {
		position: relative;
		/* c1-allow: the three views are stacked, so the box needs a height of its own, and all
		   three fill the same one: the month view's 44px weekday row plus its 252px of six rows
		   and 4px of margin, and the year view's four 74px rows plus the same 4px. Measured on
		   the reference guest, where the control is 300 by 352 in every mode. */
		height: 300px;
		/* A layer resting at scale 1.29 overflows the frame; the original clips it too, with a
		   Grid.Clip bound to TemplateSettings.ClipRect (CalendarView_themeresources.xaml:356). */
		overflow: hidden;
	}

	.view-layer {
		position: absolute;
		inset: 0;
		opacity: 0;
		pointer-events: none;
		visibility: hidden;
		/* c1-allow: CalendarView_themeresources.xaml:495-667 — every DisplayModeStates transition
		   fades the outgoing view out by KeyTime 0:0:0.150 on ControlFastOutSlowInKeySpline,
		   whose value is the string `0,0,0,1` (Common_themeresources_any.xaml:602). The
		   visibility change waits for that fade rather than cutting it short. */
		transition:
			opacity 150ms cubic-bezier(0, 0, 0, 1),
			transform 150ms cubic-bezier(0, 0, 0, 1),
			visibility 0s linear 150ms;
	}

	.month-view {
		transform: scale(0.84);
	}

	.year-view,
	.decade-view {
		transform: scale(1.29);
	}

	.calendar-view[data-display-mode='month'] .month-view,
	.calendar-view[data-display-mode='year'] .year-view,
	.calendar-view[data-display-mode='decade'] .decade-view {
		transform: scale(1);
		opacity: 1;
		pointer-events: auto;
		visibility: visible;
		/* c1-allow: CalendarView_themeresources.xaml:495-667 — the arriving view holds its
		   starting scale and zero opacity until KeyTime 0:0:0.150 and reaches 1 at 0:0:0.500,
		   which is a 350ms transition after a 150ms delay. */
		transition:
			opacity 350ms 150ms cubic-bezier(0, 0, 0, 1),
			transform 350ms 150ms cubic-bezier(0, 0, 0, 1),
			visibility 0s linear 0s;
	}

	.calendar-view[data-display-mode='year'] .month-view,
	.calendar-view[data-display-mode='decade'] .month-view,
	.calendar-view[data-display-mode='decade'] .year-view {
		transform: scale(0.84);
	}

	/* c1-allow: four columns and four rows is the year and decade default
	   (CalendarView_Partial.cpp:40-42); 74 is the item's 56 plus the 9px margin
	   CalendarViewGeneratorHost::GetItemMargin returns for the rounded chrome
	   (CalendarViewGeneratorHost.cpp:215-224); the panel's own 2px margin is
	   CalendarView_themeresources.xaml:395, the same one the month panel takes. */
	.year-decade-panel {
		display: grid;
		grid-template-columns: repeat(4, 74px);
		grid-template-rows: repeat(4, 74px);
		margin: 2px;
	}

	.year-decade-cell {
		box-sizing: border-box;
		width: 74px;
		height: 74px;
		/* c1-allow: CalendarViewGeneratorHost.cpp:215-224 — the item's margin is 9 under the
		   rounded chrome, and it is the cell's padding here because the cell is the button. */
		padding: 9px;
		border: 0;
		background: transparent;
		/* A `<button>` does not inherit the family; without this the months and years render in
		   the user agent's face. The same trap the header title carries. */
		font-family: inherit;
		font-size: inherit;
		color: inherit;
	}

	/* c1-allow: 74 less the 9px margin on each side. The four rows of 74 are the same 296 the
	   month view fills with six rows of 42 and its weekday row, which is why the control does
	   not resize between views — measured at 300 by 352 in all three on the reference guest. */
	.month-year-item {
		width: 56px;
		height: 56px;
	}

	/* Every item in every view is the same chrome at a different size: a circle whose radius is
	   half its side (CalendarViewBaseItemChrome.cpp:2102-2115), one border, and the brush chains
	   below. The day cell and the month-year cell carry this class and declare only their size. */
	.item-chrome {
		position: relative;
		box-sizing: border-box;
		/* c1-allow: CalendarView_themeresources.xaml:311 — CalendarItemBorderThickness="1". */
		border: 1px solid var(--winui-CalendarViewCalendarItemBorderBrush);
		border-radius: 50%;
		/* The chrome draws its circle as a `CBorder` it creates itself and never gives a
		   `BackgroundSizing` (`EnsureOuterBorder`, CalendarViewBaseItemChrome.cpp:1730), so the
		   fill stops at the stroke's inner edge, and `background` is a shorthand: every rule
		   below that sets it restates the clip. Today's rules are the exception and say why. */
		background: var(--winui-CalendarViewCalendarItemBackground) padding-box;
		color: var(--winui-CalendarViewCalendarItemForeground);
	}

	.item-chrome:hover {
		border-color: var(--winui-CalendarViewHoverBorderBrush);
		background: var(--winui-CalendarViewCalendarItemHoverBackground) padding-box;
	}

	.item-chrome:active {
		border-color: var(--winui-CalendarViewPressedBorderBrush);
		background: var(--winui-CalendarViewCalendarItemPressedBackground) padding-box;
		color: var(--winui-CalendarViewPressedForeground);
	}

	/* Out of scope ranks below disabled and today in the chrome's own order: its fill is chosen
	   after both (`GetItemBackgroundBrush`, CalendarViewBaseItemChrome.cpp:1455, :1466, :1489)
	   and so is its text (`GetTextBlockForeground`, :1551, :1566, :1607), and the text of a
	   selected item too (:1581). These rules outrank the ones for those states, so each passes
	   over an item in one of them rather than covering it; a month or a year is never selected. */
	.calendar-view[data-out-of-scope-enabled]
		.year-decade-cell.out-of-scope
		.item-chrome:not([data-disabled]):not(.calendar-view[data-today-highlighted] [data-today]):not(
			:hover
		):not(:active) {
		background: var(--winui-CalendarViewOutOfScopeBackground) padding-box;
		color: var(--winui-CalendarViewOutOfScopeForeground);
	}

	.calendar-view[data-out-of-scope-enabled]
		.year-decade-cell.out-of-scope
		.item-chrome:not([data-disabled]):not(
			.calendar-view[data-today-highlighted] [data-today]
		):hover {
		color: var(--winui-CalendarViewOutOfScopeHoverForeground);
	}

	.calendar-view[data-out-of-scope-enabled]
		.year-decade-cell.out-of-scope
		.item-chrome:not([data-disabled]):not(
			.calendar-view[data-today-highlighted] [data-today]
		):active {
		color: var(--winui-CalendarViewOutOfScopePressedForeground);
	}

	.calendar-view[data-today-highlighted] .item-chrome[data-today] {
		/* The rounded chrome gives today a background ring, not a border brush. With no brush
		   it gives the circle no thickness either (`SetOuterBorderThickness`,
		   CalendarViewBaseItemChrome.cpp:1899), so today's fill reaches the outer edge and
		   these three rules clip to the border box. */
		border-color: var(--winui-CalendarViewCalendarItemBorderBrush);
		background: var(--winui-CalendarViewTodayBackground) border-box;
		color: var(--winui-CalendarViewTodayForeground);
	}

	.calendar-view[data-today-highlighted] .item-chrome[data-today]:hover {
		background: var(--winui-CalendarViewTodayHoverBackground) border-box;
	}

	.calendar-view[data-today-highlighted] .item-chrome[data-today]:active {
		background: var(--winui-CalendarViewTodayPressedBackground) border-box;
	}

	.item-chrome[data-disabled] {
		background: var(--winui-CalendarViewCalendarItemDisabledBackground) padding-box;
		color: var(--winui-CalendarViewDisabledForeground);
	}

	.calendar-view[data-today-highlighted] .item-chrome[data-disabled][data-today] {
		/* Disabled, today does get a brush, `SelectedDisabledBorderBrush`
		   (CalendarViewBaseItemChrome.cpp:1349), so its circle has a thickness again and the
		   fill stops inside it. */
		border-color: var(--winui-CalendarViewSelectedDisabledBorderBrush);
		background: var(--winui-CalendarViewTodayDisabledBackground) padding-box;
	}

	.year-decade-main,
	.year-decade-label {
		position: absolute;
		inset: 0;
		display: flex;
		justify-content: center;
	}

	.year-decade-main {
		align-items: center;
		margin: var(--winui-CalendarViewMonthYearItemMargin);
		font-size: var(--winui-CalendarViewMonthYearItemFontSize);
	}

	.year-decade-label {
		align-items: flex-start;
		margin: var(--winui-CalendarViewFirstOfYearDecadeLabelMargin);
		font-size: var(--winui-CalendarViewFirstOfYearDecadeLabelFontSize);
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
		/* c1-allow: CalendarView_themeresources.xaml:245 — MinWidth="40". */
		width: 40px;
		/* c1-allow: CalendarView_themeresources.xaml:246 — MinHeight="40". */
		height: 40px;
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

	/* The same order as the year-decade rules above, and a day can be selected, so the fill and
	   the text are separate rules: a selected day out of scope takes the out-of-scope fill and
	   the selected text. */
	.calendar-view[data-out-of-scope-enabled]
		.day[data-outside-month]:not([data-disabled]):not(
			.calendar-view[data-today-highlighted] [data-today]
		):not(:hover):not(:active) {
		background: var(--winui-CalendarViewOutOfScopeBackground) padding-box;
	}

	.calendar-view[data-out-of-scope-enabled]
		.day[data-outside-month]:not([data-disabled]):not(
			.calendar-view[data-today-highlighted] [data-today]
		):not([data-selected]):not(:hover):not(:active) {
		color: var(--winui-CalendarViewOutOfScopeForeground);
	}

	.calendar-view[data-out-of-scope-enabled]
		.day[data-outside-month]:not([data-disabled]):not(
			.calendar-view[data-today-highlighted] [data-today]
		):not([data-selected]):hover {
		color: var(--winui-CalendarViewOutOfScopeHoverForeground);
	}

	.calendar-view[data-out-of-scope-enabled]
		.day[data-outside-month]:not([data-disabled]):not(
			.calendar-view[data-today-highlighted] [data-today]
		):not([data-selected]):active {
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

	.calendar-view[data-today-highlighted] .day[data-today][data-selected] {
		/* c1-allow: CalendarViewBaseItemChrome.cpp:26 — TodaySelectedInnerBorderThickness is 2.0f. */
		box-shadow: inset 0 0 0 2px var(--winui-CalendarViewTodaySelectedInnerBorderBrush);
	}

	.title[data-focus-visual]::after,
	.nav[data-focus-visual]::after {
		content: '';
		position: absolute;
		/* c1-allow: CalendarView_themeresources.xaml:252 —
		   `FocusVisualMargin="{StaticResource CalendarViewNavigationButtonFocusVisualMargin}"` is
		   -2, so the band grows two pixels beyond the button. */
		inset: -2px;
		border-radius: var(--winui-ControlCornerRadius);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-CalendarViewFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-CalendarViewFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	.day[data-focus-visual]::before,
	.year-decade-cell[data-focus-visual] .item-chrome::before {
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

	/* ADR 0016. Every change of view is a `DisplayModeStates` `VisualTransition`
	   (CalendarView_themeresources.xaml:495-667), which the visual state manager skips to its
	   end when the system's animations are off, delays included: the new view is simply
	   there. */
	@media (prefers-reduced-motion: reduce) {
		.view-layer,
		.calendar-view[data-display-mode='month'] .month-view,
		.calendar-view[data-display-mode='year'] .year-view,
		.calendar-view[data-display-mode='decade'] .decade-view {
			transition-duration: 0s;
			transition-delay: 0s;
		}
	}
</style>
