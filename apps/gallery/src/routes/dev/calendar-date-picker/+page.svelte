<script lang="ts">
	import { CalendarDatePicker } from 'winui-svelte/preview';

	const date = new Date(2026, 8, 8);
</script>

<svelte:head><title>CalendarDatePicker — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">CalendarDatePicker</h1>

<h2 class="winui-SubtitleTextBlockStyle">header and placeholder</h2>
<div class="row"><CalendarDatePicker header="Calendar" placeholderText="Pick a date" /></div>

<h2 class="winui-SubtitleTextBlockStyle">default placeholder</h2>
<div class="row"><CalendarDatePicker /></div>

<h2 class="winui-SubtitleTextBlockStyle">selected date</h2>
<div class="row"><CalendarDatePicker {date} /></div>

<h2 class="winui-SubtitleTextBlockStyle">formatted date</h2>
<div class="row">
	<CalendarDatePicker {date} dateFormat={'{month.full} {day.integer}, {year.full}'} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row"><CalendarDatePicker {date} disabled /></div>

<h2 class="winui-SubtitleTextBlockStyle">German language</h2>
<div class="row"><CalendarDatePicker {date} language="de-DE" /></div>

<!-- This must be last: its 300 by 352 flyout overlays content below it. -->
<h2 class="winui-SubtitleTextBlockStyle">open flyout</h2>
<div class="row"><CalendarDatePicker isCalendarOpen /></div>
<!-- The flyout is 352 tall and flips above its trigger when it would leave the viewport, which
     is what it should do and which would draw it over the rows above. The spacer gives it room
     to open downward so every row above stays photographable. -->
<div class="flyout-room"></div>

<style>
	/* c1-allow: harness layout, not a WinUI value */
	.flyout-room {
		height: 380px;
	}

	/* c1-allow: harness layout, not a WinUI value */
	.row {
		margin-bottom: 24px;
	}
</style>
