<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface DatePickerProps {
		/** DatePicker.SelectedDate. `DatePicker.Date` is absent: unlike SelectedDate it cannot express the initial no-date state. */
		date?: Date | undefined;
		/** DatePicker.SelectedDateChanged. */
		onDateChange?: ((date: Date | undefined) => void) | undefined;
		/** DatePicker.Header. */
		header?: Snippet | string | undefined;
		/** DatePicker.DayFormat. */
		dayFormat?: string;
		/** DatePicker.MonthFormat. */
		monthFormat?: string;
		/** DatePicker.YearFormat. */
		yearFormat?: string;
		/** DatePicker.DayVisible. */
		dayVisible?: boolean;
		/** DatePicker.MonthVisible. */
		monthVisible?: boolean;
		/** DatePicker.YearVisible. */
		yearVisible?: boolean;
		/** DatePicker.MinYear. */
		minYear?: Date;
		/** DatePicker.MaxYear. */
		maxYear?: Date;
		/** UIElement.IsEnabled. */
		disabled?: boolean;
		/** FrameworkElement.Language. */
		language?: string | undefined;
		class?: string;
		style?: string;
		/** The DatePicker root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// CalendarIdentifier is owed rather than declined: WinUI uses it to choose the month and day
	// columns, but neither Gallery sample configures it. This unit therefore exposes Gregorian dates only.
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	import {
		fromDate,
		getLocalTimeZone,
		toCalendarDate,
		today,
		type CalendarDate
	} from '@internationalized/date';
	import { Popover } from 'bits-ui';
	import { formatDate, fieldOrder, localeOf } from '../internal/datetime';
	import LoopingSelector from '../internal/LoopingSelector.svelte';

	type Field = 'day' | 'month' | 'year';
	type PendingDate = { year: number; month: number; day: number };
	const timeZone = getLocalTimeZone();

	let {
		date = $bindable(undefined),
		onDateChange,
		header = undefined,
		dayFormat = '{day.integer}',
		monthFormat = '{month.full}',
		yearFormat = '{year.full}',
		dayVisible = true,
		monthVisible = true,
		yearVisible = true,
		minYear = dateOffsetByYears(-100),
		maxYear = dateOffsetByYears(100),
		disabled = false,
		language = undefined,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: DatePickerProps = $props();

	const str = useStrings();

	const locale = $derived(localeOf(language));
	const order = $derived(fieldOrder(locale));
	const visibleFields = $derived(
		order.filter(
			(field) =>
				(field === 'day' && dayVisible) ||
				(field === 'month' && monthVisible) ||
				(field === 'year' && yearVisible)
		)
	);
	const gridColumns = $derived(
		visibleFields
			.flatMap((field, index) => [index === 0 ? '' : '1px', `${field === 'month' ? 132 : 78}fr`])
			.filter(Boolean)
			.join(' ')
	);
	const minCalendarDate = $derived(calendarDateOf(minYear));
	const maxCalendarDate = $derived(calendarDateOf(maxYear));
	const years = $derived(
		Array.from(
			{ length: Math.max(0, maxCalendarDate.year - minCalendarDate.year + 1) },
			(_, offset) => minCalendarDate.year + offset
		)
	);

	let open = $state(false);
	let button = $state<HTMLButtonElement | null>(null);
	let buttonWidth = $state(296);
	let buttonHeight = $state(32);
	let pending = $state<PendingDate>(partsOf(date ?? today(timeZone).toDate(timeZone)));
	const pendingDate = $derived(dateFromParts(pending));
	const months = $derived(
		Array.from({ length: 12 }, (_, index) =>
			formatDate(monthFormat, dateFor(2000, index + 1, 1), locale)
		)
	);
	const days = $derived(
		Array.from({ length: daysInMonth(pending.year, pending.month) }, (_, index) =>
			formatDate(dayFormat, dateFor(pending.year, pending.month, index + 1), locale)
		)
	);
	const yearLabels = $derived(
		years.map((year) => formatDate(yearFormat, dateFor(year, 1, 1), locale))
	);
	/**
	 * The list's height, and the number the placement is computed from. The presenter's style caps
	 * it at 398 (`DatePicker_themeresources.xaml:263`) and that 398 includes its 1px border either
	 * side, so the grid inside is 396 and the list is what the 41-high accept row leaves of it:
	 * 355. Measured on the reference guest, where the flyout's own box is 398 tall and its list
	 * area runs 355 rows.
	 */
	const listHeight = 398 - 2 - 41;
	/**
	 * Where the flyout opens. WinUI computes a point such that the presenter's `HighlightRect` is
	 * **centred over the control** (`DateTimePickerFlyoutHelper.cpp:40`), which on the web is a
	 * negative side offset: the presenter's top must be half the button above the list's centre,
	 * plus the presenter's own border. Written out, every term but the border cancels into
	 * `buttonHeight / 2 + border + listHeight / 2`, and the item height does not appear — the
	 * highlight is centred whatever its own height is. Measured on the reference guest: a 30-high
	 * button, a 355-high list, and the flyout's top edge 195 pixels above the button's bottom.
	 */
	const sideOffset = $derived(-(buttonHeight / 2 + 1 + listHeight / 2));

	$effect(() => {
		if (!button) return;
		const observer = new ResizeObserver(() => {
			const bounds = button?.getBoundingClientRect();
			buttonWidth = bounds?.width ?? 296;
			buttonHeight = bounds?.height ?? 32;
		});
		observer.observe(button);
		buttonWidth = button.getBoundingClientRect().width;
		buttonHeight = button.getBoundingClientRect().height;
		return () => observer.disconnect();
	});

	function dateOffsetByYears(years: number): Date {
		return today(timeZone).add({ years }).toDate(timeZone);
	}

	function calendarDateOf(value: Date): CalendarDate {
		return toCalendarDate(fromDate(value, timeZone));
	}

	function partsOf(value: Date): PendingDate {
		const calendarDate = calendarDateOf(value);
		return { year: calendarDate.year, month: calendarDate.month, day: calendarDate.day };
	}

	function dateFor(year: number, month: number, day: number): Date {
		return today(timeZone).set({ year, month, day }).toDate(timeZone);
	}

	function dateFromParts(value: PendingDate): Date {
		return dateFor(
			value.year,
			value.month,
			Math.min(value.day, daysInMonth(value.year, value.month))
		);
	}

	function daysInMonth(year: number, month: number): number {
		return today(timeZone).set({ year, month, day: 1 }).add({ months: 1 }).subtract({ days: 1 })
			.day;
	}

	function openFlyout() {
		if (disabled) return;
		pending = partsOf(date ?? today(timeZone).toDate(timeZone));
		open = true;
	}

	function dismiss() {
		open = false;
	}

	function accept() {
		const next = pendingDate;
		date = next;
		onDateChange?.(next);
		open = false;
	}

	function setPending(field: Field, index: number) {
		if (field === 'month') pending = { ...pending, month: index + 1 };
		else if (field === 'day') pending = { ...pending, day: index + 1 };
		else pending = { ...pending, year: years[index] ?? pending.year };
	}

	function selectedIndex(field: Field): number {
		if (field === 'month') return pending.month - 1;
		if (field === 'day') return Math.min(pending.day - 1, days.length - 1);
		return Math.max(0, years.indexOf(pending.year));
	}

	function labels(field: Field): string[] {
		return field === 'month' ? months : field === 'day' ? days : yearLabels;
	}

	function closedText(field: Field): string {
		if (!date) {
			return str(
				field === 'month'
					? 'TEXT_DATEPICKER_MONTH_PLACEHOLDER'
					: field === 'day'
						? 'TEXT_DATEPICKER_DAY_PLACEHOLDER'
						: 'TEXT_DATEPICKER_YEAR_PLACEHOLDER'
			);
		}
		return formatDate(
			field === 'month' ? monthFormat : field === 'day' ? dayFormat : yearFormat,
			date,
			locale
		);
	}

	function onButtonKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') {
			event.preventDefault();
			dismiss();
			return;
		}
		if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
			event.preventDefault();
			openFlyout();
		}
	}

	function onFlyoutKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			dismiss();
		} else if (
			event.key === 'Enter' ||
			event.key === ' ' ||
			(event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown'))
		) {
			event.preventDefault();
			accept();
		}
	}
</script>

<div bind:this={ref} class={['date-picker', className]} {style} {...rest}>
	{#if header !== undefined}
		<span class="header winui-BodyTextBlockStyle">
			{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
		</span>
	{/if}
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<button
					{...props}
					bind:this={button}
					class:has-no-date={!date}
					class="flyout-button"
					type="button"
					{disabled}
					onclick={openFlyout}
					onkeydown={onButtonKeydown}
				>
					<div class="fields" style:grid-template-columns={gridColumns}>
						{#each visibleFields as field, index (field)}
							{#if index > 0}<i class="spacer" aria-hidden="true"></i>{/if}
							<span class:month={field === 'month'} class:field class={field}
								>{closedText(field)}</span
							>
						{/each}
					</div>
				</button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content side="bottom" align="center" avoidCollisions={false} {sideOffset}>
				{#snippet child({ props, wrapperProps })}
					<div {...wrapperProps}>
						<div
							{...props}
							class="presenter winui-BodyTextBlockStyle"
							style:width={`${buttonWidth}px`}
							onkeydown={onFlyoutKeydown}
						>
							<div class="content">
								<div class="host" style:grid-template-columns={gridColumns}>
									<div class="highlight" aria-hidden="true"></div>
									{#each visibleFields as field, index (field)}
										{#if index > 0}<i class="spacer flyout-spacer" aria-hidden="true"></i>{/if}
										<!-- The wrapper is the grid item, because a `class` handed to a component
										     lands on its root without this file's scope hash and matches nothing. -->
										<div class="selector" class:month={field === 'month'}>
											<LoopingSelector
												items={labels(field)}
												selectedIndex={selectedIndex(field)}
												onSelectedIndexChange={(index) => setPending(field, index)}
												shouldLoop={field !== 'year'}
												itemHeight={40}
												label={str(
													field === 'month'
														? 'UIA_AP_DATEPICKER_MONTHNAME'
														: field === 'day'
															? 'UIA_AP_DATEPICKER_DAYNAME'
															: 'UIA_AP_DATEPICKER_YEARNAME'
												)}
											/>
										</div>
									{/each}
								</div>
								<div class="accept-dismiss">
									<i class="separator" aria-hidden="true"></i>
									<button
										class="accept"
										type="button"
										aria-label={str('UIA_DIALOG_ACCEPT')}
										onclick={accept}>&#xE8FB;</button
									>
									<button
										class="dismiss"
										type="button"
										aria-label={str('UIA_DIALOG_DISMISS')}
										onclick={dismiss}>&#xE711;</button
									>
								</div>
							</div>
						</div>
					</div>
				{/snippet}
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
</div>

<style>
	.date-picker {
		box-sizing: border-box;
		display: grid;
		grid-template-rows: auto auto;
		width: fit-content;
	}
	.header {
		max-width: var(--winui-DatePickerThemeMaxWidth);
		margin: var(--winui-DatePickerTopHeaderMargin);
		color: var(--winui-DatePickerHeaderForeground);
	}
	.flyout-button {
		position: relative;
		box-sizing: border-box;
		min-width: var(--winui-DatePickerThemeMinWidth);
		max-width: var(--winui-DatePickerThemeMaxWidth);
		border-style: solid;
		/* `DatePickerButtonBorderBrush` aliases `ControlElevationBorderBrush`, a gradient, and a
		   gradient named as a `border-color` is invalid CSS that is silently dropped — taking the
		   whole `border` shorthand with it, which left the button two pixels short and moved the
		   flyout with it, because the flyout's placement is computed from the button's height.
		   The ring below paints the gradient; this keeps the geometry. Same shape and same reason
		   as the `.box` rules of TextBox.svelte and PasswordBox.svelte. */
		border-color: transparent;
		border-width: var(--winui-DatePickerBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		padding: 0;
		background: var(--winui-DatePickerButtonBackground) padding-box;
		color: var(--winui-DatePickerButtonForeground);
		font: inherit;
	}

	/* The border brush painted on the ring alone: a two-layer mask that punches out the content
	   box, exactly as the comment above TextBox.svelte's `.box::after` explains. `inset` is the
	   negative border width because an absolutely positioned child is placed against its parent's
	   padding box. */
	.flyout-button::after {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--winui-DatePickerBorderThemeThickness));
		border-radius: inherit;
		padding: var(--winui-DatePickerBorderThemeThickness);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		background: var(--winui-DatePickerButtonBorderBrush);
		pointer-events: none;
	}
	.flyout-button.has-no-date {
		color: var(--winui-DatePickerButtonForegroundDefault);
	}
	.flyout-button:hover:not(:disabled)::after {
		background: var(--winui-DatePickerButtonBorderBrushPointerOver);
	}

	/* `padding-box` again on each state, and it is not a repetition. `background` is a
	   shorthand, so a rule that restates the brush resets `background-clip` to `border-box`
	   along with it, and the base rule's clip is gone for that state alone.

	   Upstream's state storyboards change `Background`, `Foreground` and `BorderBrush` on the
	   presenter and never `BackgroundSizing` (the three states at
	   `DatePicker_themeresources.xaml:155`, `DatePicker_themeresources.xaml:168` and
	   `DatePicker_themeresources.xaml:181`, against the presenter at
	   `DatePicker_themeresources.xaml:200`). It is stronger than that: the string
	   `BackgroundSizing` does not occur in that file at all — no attribute, no setter, no key
	   frame, and no `{TemplateBinding BackgroundSizing}` on the presenter, where
	   `Button_themeresources.xaml:244`, `ToggleButton_themeresources.xaml:198` and
	   `AppBarToggleButton_themeresources.xaml:469` all carry one. So nothing a consumer sets
	   on the control can reach the presenter, and the value is the property's default in every
	   state: it is not among the exceptions the switch at `DependencyProperty.cpp:120`
	   enumerates, so it takes the zero value of its enum (`EnumDefs.g.h:552`).

	   The pin cannot show the renderer reading that value. `HWWalk.cpp` is not in the
	   checkout, and the geometry read that is — `framework.cpp:3842`, choosing at
	   `framework.cpp:3950` — is reachable only from the print path (`Border.cpp:451`,
	   `ContentPresenter.cpp:1403`, `panel.cpp:208`). `Border.cpp:668` is a hit test. The
	   template settles the value on its own; those two readings agree about what it means.

	   Without the clip the fill paints into the 1px ring where `::after` draws the stroke, and
	   the stroke composites over our own fill instead of over the page. Measured on this build
	   in the dark theme, the ring pixel at the button's left edge: 64 hovered, 54 pressed, 56
	   disabled — against 47 for all three once clipped, which is what the button already paints
	   at rest. The light theme moves 3, 1 and 1. That the four agree once clipped is not one
	   brush read four times: rest and hover alias `ControlElevationBorderBrush` and pressed
	   and disabled alias `ControlStrokeColorDefaultBrush`
	   (`DatePicker_themeresources.xaml:15`), and the gradient sits at that same stop on the
	   midline. `CalendarDatePicker.svelte` and
	   `TimePicker.svelte` carry the same three rules for the same reason. */
	.flyout-button:hover:not(:disabled) {
		background: var(--winui-DatePickerButtonBackgroundPointerOver) padding-box;
		color: var(--winui-DatePickerButtonForegroundPointerOver);
	}
	.flyout-button:active:not(:disabled)::after {
		background: var(--winui-DatePickerButtonBorderBrushPressed);
	}

	.flyout-button:active:not(:disabled) {
		background: var(--winui-DatePickerButtonBackgroundPressed) padding-box;
		color: var(--winui-DatePickerButtonForegroundPressed);
	}
	.flyout-button:disabled::after {
		background: var(--winui-DatePickerButtonBorderBrushDisabled);
	}

	.flyout-button:disabled {
		background: var(--winui-DatePickerButtonBackgroundDisabled) padding-box;
		color: var(--winui-DatePickerButtonForegroundDisabled);
	}
	.flyout-button:disabled + * {
		color: var(--winui-DatePickerHeaderForegroundDisabled);
	}
	.fields,
	.host {
		display: grid;
	}
	.field {
		box-sizing: border-box;
		min-width: 0;
		padding: var(--winui-DatePickerHostPadding);
		text-align: center;
		/* c1-allow: measured. The original's button is 30 tall on the reference guest — a 1px
		   border either side and 9px of `DatePickerHostPadding` around a 19px line box. Chromium's
		   `normal` for this face at 14px is 17, and the two pixels would move the flyout with it,
		   because the flyout's placement is computed from the button's height. */
		line-height: 19px;
	}
	.field.month {
		margin-left: 1px;
		padding: var(--winui-DatePickerHostMonthPadding);
		text-align: left;
	}
	.spacer {
		display: block;
		width: var(--winui-DatePickerSpacerThemeWidth);
		background: var(--winui-DatePickerSpacerFill);
	}
	.presenter {
		/* The popup layer. `Popup.svelte`'s `.root` rule carries the whole reason; the short
		   version is that this element is static, so the declaration paints nothing here and
		   is read by the primitive, which mirrors it onto the wrapper it positions. */
		z-index: 1000;
		box-sizing: border-box;
		/* c1-allow: DatePicker_themeresources.xaml:263 — the presenter's style sets MaxHeight 398,
		   and the flyout always fills it. Border box, because that 398 is the outer box on the
		   reference guest. */
		height: 398px;
		overflow: hidden;
		border: var(--winui-DateTimeFlyoutBorderThickness) solid
			var(--winui-DatePickerFlyoutPresenterBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		/* `padding-box`, and the flyout button's note above carries why a fill that stops at the
		   inner border edge is the faithful one. What is different here is that no state rule
		   took the clip away — it was never written. Upstream's presenter is one
		   `<Border x:Name="Background">` binding `Background`, `BorderBrush` and
		   `BorderThickness` together (`DatePicker_themeresources.xaml:276`, under the style at
		   `DatePicker_themeresources.xaml:260`), and `BackgroundSizing` does not occur in that
		   file at all, so the Border takes the property's default. Nor is there a route to it
		   from outside: that Border binds four properties from the templated parent and
		   `BackgroundSizing` is not among them, so a setter on the presenter — or on anything
		   it derives from — reaches the control and stops there.

		   The default is `InnerBorderEdge`, and for a `Border` the chain is its own:
		   `CBorder::GetBackgroundSizing` reads the property itself
		   (`Border.cpp:952`), not the base-class fallback at `framework.cpp:2711` that applies
		   to types without it; the property is registered sparse with no default
		   (`StaticMetadata.g.cpp:28973`) and is not among the exceptions the switch at
		   `DependencyProperty.cpp:120` enumerates, so it takes the zero value of its enum,
		   `EnumDefs.g.h:552`. Upstream writes that value out explicitly on the presenter next
		   door — `MenuFlyout_themeresources.xaml:289` sets
		   `BackgroundSizing="InnerBorderEdge"` on the template root of `MenuFlyoutPresenter` —
		   and the `.presenter` rules of Flyout.svelte and MenuFlyout.svelte already clip their own,
		   so the idiom is not new here.

		   It is not that these were the last two. ComboBox's dropdown painted its fill under a
		   stroke upstream clips *explicitly* — `ComboBox_themeresources.xaml:590` writes
		   `BackgroundSizing="InnerBorderEdge"` on `PopupBorder` — and TeachingTip.svelte's `.card`
		   has no clip either. Both were invisible to the survey that found these two, because
		   they write the border in longhands where it read the `border` shorthand. The dropdown
		   has since been closed and `ComboBox.svelte`'s `.popup` rule carries its reading; the
		   TeachingTip card is still open. They are a wider class than this unit's and need
		   their own reading; what is settled here is the case where upstream
		   states nothing and the Border takes the default.

		   Unclipped, the 1px `SurfaceStrokeColorFlyout` stroke composites over the presenter's
		   own fill and so reads the same everywhere. Measured on this build at the presenter's
		   left edge, midline: 234 light and 35 dark, against 211 and 21 once clipped, where what
		   the stroke lies over is the page and this element's own shadow. At the top edge the
		   same two readings are 234/35 against 226/24 — a different pair, because the shadow is
		   not the same there.

		   That the two clipped edges differ is a fact about `PopupShadow` and not about the
		   clip, which is why the test does not assert it: with `box-shadow: none` and the clip
		   exactly as it is here, both edges read one value again, 228 light and 25 dark. What
		   the clip is responsible for is the pair that moved — 234 to 211 and 35 to 21 — and
		   that pair is what `inner-border-edge.spec.ts` pins. `TimePicker.svelte` carries the
		   same rule. */
		background: var(--winui-DatePickerFlyoutPresenterBackground) padding-box;
		padding: var(--winui-DateTimeFlyoutBorderPadding);
		box-shadow: var(--winui-PopupShadow);
		outline: none;
	}
	.content {
		display: grid;
		grid-template-rows: 1fr auto;
		height: 100%;
	}
	.host {
		position: relative;
		/* One row, exactly the host's own height. Without it the row is implicit and auto-sized,
		   so a column of a thousand items sizes the row rather than the row sizing the column —
		   the selectors were three hundred thousand pixels tall inside a 355-pixel box, and the
		   highlight, which is placed at half the host's height, landed 2px off the button. */
		grid-template-rows: minmax(0, 1fr);
		overflow: hidden;
	}
	.highlight {
		z-index: 0;
		position: absolute;
		top: 50%;
		/* c1-allow: DatePicker_themeresources.xaml:293 — HighlightRect's own Margin="4,2,4,2".
		   The horizontal 4 is an inset here; the vertical 2 is not, and writing it as a margin
		   moved the highlight down by two pixels. In XAML the rectangle is `VerticalAlignment`
		   `Center` with a fixed height, so its equal top and bottom margins shrink the box it is
		   centred in and leave it centred; an absolutely positioned box at `top: 50%` takes a top
		   margin as an offset instead. */
		left: 4px;
		right: 4px;
		height: var(--winui-DatePickerFlyoutPresenterHighlightHeight);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-DatePickerFlyoutPresenterHighlightFill);
		pointer-events: none;
		transform: translateY(-50%);
	}
	.flyout-spacer {
		z-index: 2;
		background: var(--winui-DatePickerFlyoutPresenterSpacerFill);
	}
	.selector {
		z-index: 1;
		min-width: 0;
		height: 100%;
	}

	.selector > :global(*) {
		height: 100%;
	}
	.host :global([data-looping-selector-item][data-selected] .item-content) {
		color: var(--winui-DatePickerFlyoutPresenterHighlightForegroundColor);
	}

	/* The flyout's month column is left aligned and indented, as the closed control's month field
	   is: `DatePickerFlyoutPresenterMonthPadding` is `9,3,0,6` against the other columns'
	   `DatePickerFlyoutPresenterItemPadding` of `0,3,0,6` (DatePicker_themeresources.xaml:119-120).
	   Measured on the reference guest, where the flyout's months start at the column's left edge
	   and its days and years are centred. The rule reaches across the component boundary because
	   the padding is the presenter's, not the column's. */
	.selector.month :global([data-looping-selector-item] .item-content) {
		justify-content: flex-start;
		/* c1-allow: DatePicker_themeresources.xaml:120 — `DatePickerFlyoutPresenterMonthPadding`
		   is `9,3,0,6` where the other columns' item padding is `0,3,0,6`, and 9 is the whole of
		   the difference. The other three sides are not applied: the item is a fixed 40 and
		   centres its text, which is what the original renders. */
		padding-left: 9px;
	}
	.accept-dismiss {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		height: var(--winui-DatePickerFlyoutPresenterAcceptDismissHostGridHeight);
	}
	.separator {
		position: absolute;
		top: 0;
		width: 100%;
		height: var(--winui-DatePickerSpacerThemeWidth);
		background: var(--winui-DatePickerFlyoutPresenterSpacerFill);
	}
	.accept,
	.dismiss {
		z-index: 1;
		/* `DateTimePickerFlyoutButtonStyle` puts `DateTimePickerFlyoutButtonBorderBrush` on its
		   presenter with `BorderThickness="{ThemeResource DateTimeFlyoutButtonBorderThickness}"`.
		   That key is in neither control dictionary and *is* in the framework pin, where it is 0
		   in Default and Light and 1 under HighContrast — so the buttons show no border in the
		   themes the original was photographed in, which is what the guest shows, and a one-pixel
		   one in high contrast, which a hard-coded zero would have lost. */
		border: var(--winui-DateTimeFlyoutButtonBorderThickness) solid
			var(--winui-DateTimePickerFlyoutButtonBorderBrush);
		padding: 4px;
		background: var(--winui-DateTimePickerFlyoutButtonBackground);
		color: inherit;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: DatePicker_themeresources.xaml:305 — the two buttons set FontSize="16"
		   directly, and no resource names it. */
		font-size: 16px;
	}
	.accept {
		margin: var(--winui-DatePickerFlyoutPresenterAcceptMargin);
	}
	.dismiss {
		margin: var(--winui-DatePickerFlyoutPresenterDismissMargin);
	}
	.accept:hover,
	.dismiss:hover {
		border-color: var(--winui-DateTimePickerFlyoutButtonBorderBrushPointerOver);
		background: var(--winui-DateTimePickerFlyoutButtonBackgroundPointerOver);
		color: var(--winui-DateTimePickerFlyoutButtonForegroundPointerOver);
	}
	.accept:active,
	.dismiss:active {
		border-color: var(--winui-DateTimePickerFlyoutButtonBorderBrushPressed);
		background: var(--winui-DateTimePickerFlyoutButtonBackgroundPressed);
		color: var(--winui-DateTimePickerFlyoutButtonForegroundPressed);
	}
</style>
