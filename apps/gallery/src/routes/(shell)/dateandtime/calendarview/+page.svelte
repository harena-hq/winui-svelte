<script lang="ts">
	import {
		CalendarView,
		CheckBox,
		ComboBox,
		type CalendarViewProps,
		type ComboBoxProps
	} from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { languages } from '$lib/languages';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	type SelectionModeName = 'None' | 'Single' | 'Multiple';

	const item = itemOf('/dateandtime/calendarview');
	if (item === null) throw new Error('CalendarView page has no Gallery item');
	const sample = sampleOf('CalendarView/BasicCalendarView.txt');
	const SELECTION_MODES: Record<
		SelectionModeName,
		NonNullable<CalendarViewProps['selectionMode']>
	> = {
		None: 'none',
		Single: 'single',
		Multiple: 'multiple'
	};
	const SELECTION_MODE_ITEMS: ComboBoxProps['items'] = Object.keys(SELECTION_MODES).map(
		(value) => ({
			value,
			label: value
		})
	);
	// WD-031: keep all ten upstream rows although JulianCalendar and KoreanCalendar use Gregorian grids.
	const CALENDAR_IDENTIFIERS = [
		'GregorianCalendar',
		'HebrewCalendar',
		'HijriCalendar',
		'JapaneseCalendar',
		'JulianCalendar',
		'KoreanCalendar',
		'PersianCalendar',
		'TaiwanCalendar',
		'ThaiCalendar',
		'UmAlQuraCalendar'
	];
	const CALENDAR_IDENTIFIER_ITEMS: ComboBoxProps['items'] = CALENDAR_IDENTIFIERS.map((value) => ({
		value,
		label: value
	}));
	const LANGUAGE_ITEMS: ComboBoxProps['items'] = languages.map(({ name, code }) => ({
		value: code,
		label: name
	}));

	let groupLabelVisible = $state(true);
	let outOfScopeEnabled = $state(true);
	let selectionMode = $state<SelectionModeName>('Single');
	let calendarIdentifier = $state('GregorianCalendar');
	// CalendarViewPage.xaml:50-61 — SelectedIndex="0" fires at load, so the control's
	// Language is the first row's code before the user touches anything.
	let language = $state(languages[0].code);
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		substitutions={{
			SelectionMode: selectionMode,
			IsGroupLabelVisible: groupLabelVisible ? 'True' : 'False',
			IsOutOfScopeEnabled: outOfScopeEnabled ? 'True' : 'False',
			Language: language,
			CalendarIdentifier: calendarIdentifier
		}}
	>
		<!-- CalendarViewPage.xaml:15-21. -->
		<CalendarView
			data-vertical-alignment="top"
			{calendarIdentifier}
			{language}
			{groupLabelVisible}
			{outOfScopeEnabled}
			selectionMode={SELECTION_MODES[selectionMode]}
		/>
		{#snippet options()}
			<div class="options">
				<!-- CalendarViewPage.xaml:25-28. -->
				<CheckBox bind:checked={groupLabelVisible}>IsGroupLabelVisible</CheckBox>
				<!-- CalendarViewPage.xaml:29-32. -->
				<CheckBox bind:checked={outOfScopeEnabled}>IsOutOfScopeEnabled</CheckBox>
				<!-- CalendarViewPage.xaml:33-42 — Margin="0,10,0,0". -->
				<ComboBox
					header="SelectionMode"
					items={SELECTION_MODE_ITEMS}
					bind:value={selectionMode}
					style="margin-top: 10px"
				/>
				<!-- CalendarViewPage.xaml:44-48 — Width="220", Margin="0,10,0,0". -->
				<ComboBox
					header="CalendarIdentifier"
					items={CALENDAR_IDENTIFIER_ITEMS}
					bind:value={calendarIdentifier}
					style="width: 220px; margin-top: 10px"
				/>
				<!-- CalendarViewPage.xaml:50-61 — Width="220", Margin="0,10,0,0", the record's rows. -->
				<ComboBox
					header="Language"
					items={LANGUAGE_ITEMS}
					bind:value={language}
					style="width: 220px; margin-top: 10px"
				/>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.options {
		display: flex; /* c1-allow: CalendarViewPage.xaml:24 — StackPanel. */
		flex-direction: column; /* c1-allow: CalendarViewPage.xaml:24 — StackPanel. */
		margin: -5px 0 0; /* c1-allow: CalendarViewPage.xaml:25 — Margin="0,-5,0,0". */
	}
</style>
