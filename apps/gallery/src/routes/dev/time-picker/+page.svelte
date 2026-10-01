<script lang="ts">
	import { TimePicker } from 'winui-svelte/preview';

	const fixedTime = new Date(2026, 8, 8, 13, 34);
</script>

<svelte:head><title>TimePicker — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TimePicker</h1>

<h2 class="winui-SubtitleTextBlockStyle">no time</h2>
<div class="row"><TimePicker /></div>

<h2 class="winui-SubtitleTextBlockStyle">header and time</h2>
<div class="row"><TimePicker header="Arrival time" time={fixedTime} /></div>

<h2 class="winui-SubtitleTextBlockStyle">24 hour clock</h2>
<div class="row"><TimePicker clockIdentifier="24HourClock" time={fixedTime} /></div>

<h2 class="winui-SubtitleTextBlockStyle">15 minute increments</h2>
<div class="row"><TimePicker minuteIncrement={15} time={fixedTime} /></div>

<h2 class="winui-SubtitleTextBlockStyle">zero minute increment</h2>
<div class="row"><TimePicker minuteIncrement={0} time={fixedTime} /></div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row"><TimePicker disabled time={fixedTime} /></div>

<h2 class="winui-SubtitleTextBlockStyle">German language</h2>
<div class="row"><TimePicker language="de-DE" time={fixedTime} /></div>

<style>
	.row {
		margin-bottom: 24px;
	}
</style>
