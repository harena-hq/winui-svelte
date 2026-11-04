<script lang="ts">
	import { CalendarDatePicker } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/dateandtime/calendardatepicker');
	if (item === null) throw new Error('CalendarDatePicker page has no Gallery item');
	const sample = sampleOf('CalendarDatePicker/CalendardatepickerHeaderPlaceholderText.txt');
</script>

<ItemPage {item}>
	<ControlExample headerText={sample.header ?? undefined} xaml={sample.xaml ?? undefined}>
		<!-- CalendarDatePickerPage.xaml:8-10. -->
		<CalendarDatePicker placeholderText="Pick a date" header="Calendar" />
	</ControlExample>
</ItemPage>
