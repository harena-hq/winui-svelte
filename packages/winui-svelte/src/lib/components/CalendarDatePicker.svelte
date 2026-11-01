<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface CalendarDatePickerProps {
		/** CalendarDatePicker.Date. */
		date?: Date | undefined;
		/** CalendarDatePicker.DateChanged. */
		onDateChange?: ((date: Date | undefined) => void) | undefined;
		/** CalendarDatePicker.PlaceholderText. */
		placeholderText?: string;
		/** CalendarDatePicker.Header. */
		header?: Snippet | string | undefined;
		/** CalendarDatePicker.DateFormat. */
		dateFormat?: string | undefined;
		/** CalendarDatePicker.IsCalendarOpen. */
		calendarOpen?: boolean;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. */
		onCalendarOpenChange?: ((open: boolean) => void) | undefined;
		/** UIElement.IsEnabled. */
		disabled?: boolean | null;
		/** FrameworkElement.Language. */
		language?: string | undefined;
		/** CalendarView.CalendarIdentifier. */
		calendarIdentifier?: string;
		/** CalendarView.MinDate. */
		minDate?: Date | undefined;
		/** CalendarView.MaxDate. */
		maxDate?: Date | undefined;
		/** CalendarView.IsTodayHighlighted. */
		todayHighlighted?: boolean;
		/** CalendarView.IsGroupLabelVisible. */
		groupLabelVisible?: boolean;
		/** CalendarView.IsOutOfScopeEnabled. */
		outOfScopeEnabled?: boolean;
		/** CalendarView.FirstDayOfWeek. */
		firstDayOfWeek?: number | undefined;
		/** CalendarView.DayOfWeekFormat. */
		dayOfWeekFormat?: string | undefined;
		/** CalendarView.DisplayMode. */
		displayMode?: 'month' | 'year' | 'decade';
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/** The CalendarDatePicker root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	/* CalendarDatePickerHeaderPlacement="Left" is owed rather than declined. Its two template
	   resources, CalendarDatePickerLeftHeaderMargin and CalendarDatePickerLeftHeaderMaxWidth, are
	   defined in the framework pin's generic.xaml (D23) — a search of controls/dev alone reports
	   them missing, which is what an earlier version of this comment said. What is missing is an
	   original: no Gallery sample sets HeaderPlacement, so a transcription of the LeftHeader state
	   could not be compared against anything. The default
	   PlaceholderText is `select a date`, read from the English Windows platform resource rather
	   than the pin (which names only TEXT_CALENDARDATEPICKER_DEFAULT_PLACEHOLDER_TEXT).
	   CalendarViewStyle is absent under ADR 0002: styling belongs to the token cascade. */
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	import CalendarView from './CalendarView.svelte';
	import Flyout from './Flyout.svelte';
	import { formatDate, localeOf } from '../internal/datetime';

	let {
		date = $bindable(undefined),
		onDateChange,
		placeholderText,
		header = undefined,
		dateFormat = undefined,
		calendarOpen = $bindable(false),
		onCalendarOpenChange,
		disabled = false,
		language = undefined,
		calendarIdentifier = 'GregorianCalendar',
		minDate = undefined,
		maxDate = undefined,
		todayHighlighted = true,
		groupLabelVisible = false,
		outOfScopeEnabled = true,
		firstDayOfWeek = undefined,
		dayOfWeekFormat = undefined,
		displayMode = 'month',
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: CalendarDatePickerProps = $props();

	const str = useStrings();

	const locale = $derived(localeOf(language, calendarIdentifier));
	const text = $derived(
		date === undefined
			? (placeholderText ?? str('TEXT_CALENDARDATEPICKER_DEFAULT_PLACEHOLDER_TEXT'))
			: dateFormat === undefined
				? new Intl.DateTimeFormat(locale).format(date)
				: formatDate(dateFormat, date, locale)
	);

	function setOpen(next: boolean) {
		calendarOpen = next;
		onCalendarOpenChange?.(next);
	}

	function selectDate(dates: Date[]) {
		const next = dates[0];
		// OnSelectedDatesChanged closes first, then writes Date (`dxaml/xcp/dxaml/lib/calendardatepicker_partial.cpp:269-271`).
		setOpen(false);
		date = next;
		onDateChange?.(next);
	}
</script>

<!-- This uses the real Flyout attached by the XAML template. DatePicker and TimePicker instead
     attach PickerFlyoutBase and compose bits-ui Popover themselves. -->
<div
	bind:this={ref}
	class={['calendar-date-picker', className]}
	class:selected={date !== undefined}
	class:disabled
	{style}
	{...rest}
>
	{#if header !== undefined}
		<span class="header winui-BodyTextBlockStyle">
			{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
		</span>
	{/if}
	<Flyout
		placement="bottom"
		bind:open={() => calendarOpen, setOpen}
		style="padding: 0; border-width: 0; border-radius: var(--winui-OverlayCornerRadius)"
	>
		{#snippet children(props)}
			<button {...props} class="box" type="button" {disabled} aria-label={text}>
				<span class="date-text">{text}</span>
				<span class="glyph" aria-hidden="true">&#xE787;</span>
			</button>
		{/snippet}
		{#snippet content()}
			<CalendarView
				{calendarIdentifier}
				{minDate}
				{maxDate}
				{todayHighlighted}
				{groupLabelVisible}
				{outOfScopeEnabled}
				{firstDayOfWeek}
				{dayOfWeekFormat}
				{displayMode}
				{language}
				selectionMode="single"
				selectedDates={date === undefined ? [] : [date]}
				onSelectedDatesChange={selectDate}
			/>
		{/snippet}
	</Flyout>
</div>

<style>
	/* It carries no ramp class, so the text's values are read here: ADR 0021. Without specificity,
	   so a consumer's class on the root still sets them. */
	:where(.calendar-date-picker) {
		font-family: var(--winui-ContentControlThemeFontFamily);
		font-size: var(--winui-ControlContentThemeFontSize);
		font-weight: normal;
		line-height: normal;
	}

	.calendar-date-picker {
		display: inline-grid;
		grid-template-columns: auto auto 32px; /* CalendarDatePicker_themeresources.xaml:213. */
		grid-template-rows: auto auto auto;
	}

	.header {
		grid-column: 2 / span 2;
		grid-row: 1;
		margin: var(--winui-CalendarDatePickerTopHeaderMargin);
		color: var(--winui-CalendarDatePickerHeaderForeground);
	}

	.box {
		display: grid;
		grid-column: 2 / span 2;
		grid-row: 2;
		grid-template-columns: auto 32px;
		box-sizing: border-box;
		position: relative;
		min-height: 32px; /* CalendarDatePicker_themeresources.xaml:217. */
		padding: 0;
		border-style: solid;
		/* `CalendarDatePickerBorderBrush` aliases `ControlElevationBorderBrush`, a gradient, and a
		   gradient named as a `border-color` makes the whole shorthand invalid and silently
		   dropped — the box would have no border at all. The ring below paints it, exactly as
		   DatePicker's button, TextBox's box and PasswordBox's do. */
		border-color: transparent;
		border-width: var(--winui-CalendarDatePickerBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-CalendarDatePickerBackground) padding-box;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
	}

	/* The border brush on the ring alone: the two-layer mask that punches out the content box,
	   which the comment above TextBox.svelte's `.box::after` explains in full. */
	.box::after {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--winui-CalendarDatePickerBorderThemeThickness));
		border-radius: inherit;
		padding: var(--winui-CalendarDatePickerBorderThemeThickness);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		background: var(--winui-CalendarDatePickerBorderBrush);
		pointer-events: none;
	}

	.box:hover::after {
		background: var(--winui-CalendarDatePickerBorderBrushPointerOver);
	}

	.box:active::after {
		background: var(--winui-CalendarDatePickerBorderBrushPressed);
	}

	.box:disabled::after {
		background: var(--winui-CalendarDatePickerBorderBrushDisabled);
	}

	.date-text {
		align-self: center;
		/* The spec's `12px 0 2px` shorthand would set top padding. XAML is Padding="12,0,0,2":
		   the 12px belongs on the left, producing the measured 13px border-to-ink inset. */
		padding: 0 0 2px 12px; /* CalendarDatePicker_themeresources.xaml:218. */
		color: var(--winui-CalendarDatePickerTextForeground);
		text-align: left;
	}

	.glyph {
		align-self: center;
		color: var(--winui-CalendarDatePickerCalendarGlyphForeground);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: 12px; /* c1-allow: CalendarDatePicker_themeresources.xaml:219. */
		text-align: center;
	}

	/* `padding-box` on each state: `background` is a shorthand, so restating the brush resets
	   the clip the base rule sets, and upstream's `BackgroundSizing` is `InnerBorderEdge` in
	   every state. DatePicker.svelte's note above its own three rules carries the mechanism,
	   the citations and the measurement; here the box is a `Border` rather than a presenter
	   (`CalendarDatePicker_themeresources.xaml:217`), with its states at
	   `CalendarDatePicker_themeresources.xaml:103`,
	   `CalendarDatePicker_themeresources.xaml:119` and
	   `CalendarDatePicker_themeresources.xaml:135`. */
	.box:hover {
		background: var(--winui-CalendarDatePickerBackgroundPointerOver) padding-box;
	}

	.box:hover .date-text {
		color: var(--winui-CalendarDatePickerTextForegroundPointerOver);
	}
	.box:hover .glyph {
		color: var(--winui-CalendarDatePickerCalendarGlyphForegroundPointerOver);
	}

	.box:active {
		background: var(--winui-CalendarDatePickerBackgroundPressed) padding-box;
	}

	.box:active .date-text {
		color: var(--winui-CalendarDatePickerTextForegroundPressed);
	}
	.box:active .glyph {
		color: var(--winui-CalendarDatePickerCalendarGlyphForegroundPressed);
	}

	.calendar-date-picker.selected .date-text,
	.calendar-date-picker.selected .glyph {
		color: var(--winui-CalendarDatePickerTextForegroundSelected);
	}

	.calendar-date-picker.disabled .header {
		color: var(--winui-CalendarDatePickerHeaderForegroundDisabled);
	}
	.box:disabled {
		background: var(--winui-CalendarDatePickerBackgroundDisabled) padding-box;
	}
	.box:disabled .date-text {
		color: var(--winui-CalendarDatePickerTextForegroundDisabled);
	}
	.box:disabled .glyph {
		color: var(--winui-CalendarDatePickerCalendarGlyphForegroundDisabled);
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
