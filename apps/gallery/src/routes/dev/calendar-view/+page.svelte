<script lang="ts">
	import { CalendarView } from 'winui-svelte';

	const minimumDate = new Date(2026, 8, 1);
	const maximumDate = new Date(2026, 8, 15);
	const singleSelectedDates = [new Date(2026, 8, 15)];
	const todaySelectedDates = [new Date(2026, 8, 8)];
	const multipleSelectedDates = [
		new Date(2026, 8, 4),
		new Date(2026, 8, 12),
		new Date(2026, 8, 24)
	];
</script>

<svelte:head><title>CalendarView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">CalendarView</h1>

<h2 class="winui-SubtitleTextBlockStyle">default</h2>
<div class="row"><CalendarView /></div>

<h2 class="winui-SubtitleTextBlockStyle">isGroupLabelVisible</h2>
<div class="row"><CalendarView isGroupLabelVisible /></div>

<h2 class="winui-SubtitleTextBlockStyle">isOutOfScopeEnabled=false</h2>
<div class="row"><CalendarView isOutOfScopeEnabled={false} /></div>

<h2 class="winui-SubtitleTextBlockStyle">isTodayHighlighted=false</h2>
<div class="row"><CalendarView isTodayHighlighted={false} /></div>

<h2 class="winui-SubtitleTextBlockStyle">Hebrew calendar with group labels</h2>
<div class="row"><CalendarView calendarIdentifier="HebrewCalendar" isGroupLabelVisible /></div>

<h2 class="winui-SubtitleTextBlockStyle">German language</h2>
<div class="row"><CalendarView language="de-DE" /></div>

<h2 class="winui-SubtitleTextBlockStyle">Monday first</h2>
<div class="row"><CalendarView firstDayOfWeek={1} /></div>

<h2 class="winui-SubtitleTextBlockStyle">minimum and maximum dates</h2>
<div class="row"><CalendarView minDate={minimumDate} maxDate={maximumDate} /></div>

<h2 class="winui-SubtitleTextBlockStyle">day-of-week formatter</h2>
<div class="row"><CalendarView dayOfWeekFormat={'{dayofweek.abbreviated}'} /></div>

<h2 class="winui-SubtitleTextBlockStyle">selectionMode=single</h2>
<div class="row"><CalendarView selectionMode="single" selectedDates={singleSelectedDates} /></div>

<h2 class="winui-SubtitleTextBlockStyle">today and selected</h2>
<div class="row"><CalendarView selectedDates={todaySelectedDates} /></div>

<h2 class="winui-SubtitleTextBlockStyle">selectionMode=multiple</h2>
<div class="row">
	<CalendarView selectionMode="multiple" selectedDates={multipleSelectedDates} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">selectionMode=none</h2>
<div class="row"><CalendarView selectionMode="none" /></div>

<h2 class="winui-SubtitleTextBlockStyle">displayMode="year"</h2>
<div class="row"><CalendarView displayMode="year" /></div>

<h2 class="winui-SubtitleTextBlockStyle">displayMode="decade"</h2>
<div class="row"><CalendarView displayMode="decade" /></div>

<h2 class="winui-SubtitleTextBlockStyle">displayMode="year" with isGroupLabelVisible</h2>
<div class="row"><CalendarView displayMode="year" isGroupLabelVisible /></div>

<style>
	/* c1-allow: harness layout, not a WinUI value */
	.row {
		margin-bottom: 24px;
	}
</style>
