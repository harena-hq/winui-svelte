<script lang="ts">
	import { DatePicker } from '@harena-hq/winui-svelte/preview';
	import { SvelteDate } from 'svelte/reactivity';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/dateandtime/datepicker');
	if (item === null) throw new Error('DatePicker page has no Gallery item');
	const simpleSample = sampleOf('DatePicker/SimpleDatepickerHeader.txt');
	const formattedSample = sampleOf('DatePicker/DatepickerDayFormattedYear.txt');
	const currentDate = new SvelteDate();
	const formattedDate = new SvelteDate(currentDate);
	formattedDate.setMonth(formattedDate.getMonth() + 2);
	const minYear = new SvelteDate(currentDate);
	const maxYear = new SvelteDate(currentDate);
	maxYear.setFullYear(maxYear.getFullYear() + 5);
</script>

<ItemPage {item}>
	<ControlExample
		headerText={simpleSample.header ?? undefined}
		xaml={simpleSample.xaml ?? undefined}
	>
		<!-- DatePickerPage.xaml:22-24. -->
		<DatePicker header="Pick a date" />
	</ControlExample>
	<ControlExample
		headerText={formattedSample.header ?? undefined}
		xaml={formattedSample.xaml ?? undefined}
	>
		<!-- DatePickerPage.xaml:27-36 and DatePickerPage.xaml.cs:19-29. Control2Output is never set, so it remains empty. -->
		<div class="example-row">
			<DatePicker
				date={formattedDate}
				dayFormat={'{day.integer} ({dayofweek.abbreviated})'}
				yearVisible={false}
				{minYear}
				{maxYear}
			/>
			<span class="winui-BodyTextBlockStyle"></span>
		</div>
	</ControlExample>
</ItemPage>

<style>
	.example-row {
		display: flex;
		align-items: center;
	}
</style>
