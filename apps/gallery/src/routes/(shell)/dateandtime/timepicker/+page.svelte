<script lang="ts">
	import { TimePicker } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/dateandtime/timepicker');
	if (item === null) throw new Error('TimePicker page has no Gallery item');
	const simpleSample = sampleOf('TimePicker/SimpleTimepicker.txt');
	const incrementSample = sampleOf('TimePicker/TimepickerHeaderMinuteIncrements.txt');
	const twentyFourSample = sampleOf('TimePicker/Timepicker24HourClock.txt');
	// TimePickerPage.xaml binds DateTime.Now.TimeOfDay once when this sample is evaluated.
	const currentTime = new Date();
</script>

<ItemPage {item}>
	<ControlExample
		headerText={simpleSample.header ?? undefined}
		xaml={simpleSample.xaml ?? undefined}
	>
		<!-- TimePickerPage.xaml:21-23. -->
		<TimePicker />
	</ControlExample>
	<ControlExample
		headerText={incrementSample.header ?? undefined}
		xaml={incrementSample.xaml ?? undefined}
	>
		<!-- TimePickerPage.xaml:24-29. -->
		<TimePicker header="Arrival time" minuteIncrement={15} />
	</ControlExample>
	<ControlExample
		headerText={twentyFourSample.header ?? undefined}
		xaml={twentyFourSample.xaml ?? undefined}
	>
		<!-- TimePickerPage.xaml:30-33. -->
		<TimePicker clockIdentifier="24HourClock" header="24 hour clock" time={currentTime} />
	</ControlExample>
</ItemPage>
