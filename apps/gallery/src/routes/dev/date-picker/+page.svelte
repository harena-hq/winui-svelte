<script lang="ts">
	import { DatePicker } from 'winui-svelte';

	const currentDate = new Date();
</script>

<svelte:head><title>DatePicker — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">DatePicker</h1>

<h2 class="winui-SubtitleTextBlockStyle">no date</h2>
<div class="row"><DatePicker /></div>

<h2 class="winui-SubtitleTextBlockStyle">header and date</h2>
<div class="row"><DatePicker header="Pick a date" date={currentDate} /></div>

<h2 class="winui-SubtitleTextBlockStyle">formatted day, no year</h2>
<div class="row">
	<DatePicker
		date={currentDate}
		dayFormat={'{day.integer} ({dayofweek.abbreviated})'}
		yearVisible={false}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no month</h2>
<div class="row"><DatePicker date={currentDate} monthVisible={false} /></div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row"><DatePicker date={currentDate} disabled /></div>

<h2 class="winui-SubtitleTextBlockStyle">German language</h2>
<div class="row"><DatePicker date={currentDate} language="de-DE" /></div>

<style>
	/* c1-allow: harness layout, not a WinUI value */
	.row {
		margin-bottom: 24px;
	}
</style>
