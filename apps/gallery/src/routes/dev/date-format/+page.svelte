<script lang="ts">
	import {
		CALENDAR_IDENTIFIERS,
		fieldOrder,
		formatDate,
		isTwelveHourClock,
		localeOf,
		weekStartsOn
	} from 'winui-svelte/internal/datetime.js';

	const DATE = new Date(2026, 8, 8, 23, 4, 0);
	const templateCases = [
		['month year', 'en-US'],
		['month year', 'de-DE'],
		['month year', 'ja-JP'],
		['year', 'en-US'],
		['day month.full year', 'en-US'],
		['day month.full year', 'de-DE']
	] as const;
	const patternCases = [
		['{day.integer} ({dayofweek.abbreviated})', 'en-US'],
		['{month.abbreviated} {day.integer}, {year.full}', 'en-US'],
		['{hour.integer(1)}:{minute.integer(2)} {period.abbreviated}', 'en-US'],
		['{minute.integer(2)}', 'en-US']
	] as const;
	const locales = ['en-US', 'de-DE', 'ja-JP', 'ar-EG'];
</script>

<svelte:head><title>Date format — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Date format</h1>

<h2 class="winui-SubtitleTextBlockStyle">templates</h2>
<table>
	<thead
		><tr class="winui-CaptionTextBlockStyle"><th>format</th><th>locale</th><th>output</th></tr
		></thead
	>
	<tbody>
		{#each templateCases as [format, locale] (`${format}-${locale}`)}
			<tr><td>{format}</td><td>{locale}</td><td>{formatDate(format, DATE, locale)}</td></tr>
		{/each}
	</tbody>
</table>

<h2 class="winui-SubtitleTextBlockStyle">patterns</h2>
<table>
	<thead
		><tr class="winui-CaptionTextBlockStyle"><th>format</th><th>locale</th><th>output</th></tr
		></thead
	>
	<tbody>
		{#each patternCases as [format, locale] (format)}
			<tr><td>{format}</td><td>{locale}</td><td>{formatDate(format, DATE, locale)}</td></tr>
		{/each}
	</tbody>
</table>

<h2 class="winui-SubtitleTextBlockStyle">calendars</h2>
<table>
	<thead
		><tr class="winui-CaptionTextBlockStyle"><th>identifier</th><th>format</th><th>output</th></tr
		></thead
	>
	<tbody>
		{#each Object.keys(CALENDAR_IDENTIFIERS) as identifier (identifier)}
			<tr
				><td>{identifier}</td><td>month year</td><td
					>{formatDate('month year', DATE, localeOf('en-US', identifier))}</td
				></tr
			>
		{/each}
	</tbody>
</table>

<h2 class="winui-SubtitleTextBlockStyle">locale queries</h2>
<table>
	<thead
		><tr class="winui-CaptionTextBlockStyle"
			><th>locale</th><th>field order</th><th>week starts on</th><th>12-hour</th></tr
		></thead
	>
	<tbody>
		{#each locales as locale (locale)}
			<tr
				><td>{locale}</td><td>{fieldOrder(locale).join(', ')}</td><td>{weekStartsOn(locale)}</td><td
					>{isTwelveHourClock(locale) ? 'yes' : 'no'}</td
				></tr
			>
		{/each}
	</tbody>
</table>

<style>
	/* c1-allow: harness layout, not a WinUI value */
	table {
		border-collapse: collapse;
	}

	/* c1-allow: harness layout, not a WinUI value */
	th,
	td {
		/* c1-allow: harness layout, not a WinUI value */
		padding: 4px 8px;
		/* c1-allow: harness layout, not a WinUI value */
		border: 1px solid currentcolor;
	}
</style>
