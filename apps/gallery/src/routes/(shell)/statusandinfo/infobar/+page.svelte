<script lang="ts">
	import {
		Button,
		CheckBox,
		ComboBox,
		HyperlinkButton,
		InfoBar
	} from '@harena-hq/winui-svelte/preview';
	import type { InfoBarProps } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/statusandinfo/infobar');
	if (item === null) throw new Error('InfoBar page has no Gallery item');
	const severitySample = sampleOf('InfoBar/ClosableInfobarOptionsChange.txt');
	const longShortSample = sampleOf('InfoBar/ClosableInfobarLongShort.txt');
	const displaySample = sampleOf('InfoBar/ClosableInfobarOptionsDisplay.txt');

	// InfoBarPage.xaml:27 and :110.
	const MESSAGE =
		'Essential app message for your users to be informed of, acknowledge, or take action on.';

	// The CheckBox's IsChecked.Value, as the substitutions write it (InfoBarPage.xaml:53).
	const bool = (value: boolean) => (value ? 'True' : 'False');

	// InfoBarPage.xaml:41-47, each name mapped to its InfoBarSeverity
	// (InfoBarPage.xaml.cs:23-46).
	const SEVERITIES: {
		value: string;
		label: string;
		severity: NonNullable<InfoBarProps['severity']>;
	}[] = [
		{ value: 'Informational', label: 'Informational', severity: 'informational' },
		{ value: 'Success', label: 'Success', severity: 'success' },
		{ value: 'Warning', label: 'Warning', severity: 'warning' },
		{ value: 'Error', label: 'Error', severity: 'error' }
	];
	let open1 = $state(true);
	let severityName = $state<string>('Informational');
	const severity = $derived(SEVERITIES.find((s) => s.value === severityName)!.severity);

	// InfoBarPage.xaml:86-87 and the messages each one sets (InfoBarPage.xaml.cs:52-62).
	const LENGTHS = [
		{
			value: 'Short',
			label: 'Short',
			message: 'A short essential app message.',
			display: 'A short essential app message.'
		},
		{
			value: 'Long',
			label: 'Long',
			message:
				'A long essential app message for your users to be informed of, acknowledge, or take action on. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin dapibus dolor vitae justo rutrum, ut lobortis nibh mattis. Aenean id elit commodo, semper felis nec.',
			display: 'A long essential app message...'
		}
	];
	// InfoBarPage.xaml:95-97 and the source each one writes (InfoBarPage.xaml.cs:69-93), the
	// verbatim strings' line breaks and indentation kept, the Button's trailing space with them.
	const ACTIONS = [
		{ value: 'None', label: 'None', display: '' },
		{
			value: 'Button',
			label: 'Button',
			display:
				'<InfoBar.ActionButton>\n            <Button Content="Action" Click="InfoBarButton_Click" />\n    </InfoBar.ActionButton> '
		},
		{
			value: 'Hyperlink',
			label: 'Hyperlink',
			display:
				'<InfoBar.ActionButton>\n            <HyperlinkButton Content="Informational link" NavigateUri="https://www.example.com" />\n    </InfoBar.ActionButton>'
		}
	];
	let open2 = $state(true);
	// SelectedIndex="1" and "0" (InfoBarPage.xaml:84 and :93).
	let length = $state(LENGTHS[1].value);
	let action = $state(ACTIONS[0].value);
	const lengthItem = $derived(LENGTHS.find((l) => l.value === length)!);
	const actionItem = $derived(ACTIONS.find((a) => a.value === action)!);

	let open3 = $state(true);
	// IsClosable="True" and IsIconVisible="True" (InfoBarPage.xaml:107-108).
	let iconVisible = $state(true);
	let closable = $state(true);
</script>

<!-- The action buttons InfoBarPage.xaml.cs:76-89 constructs, the link to its URI at :87. -->
{#snippet actionButton()}
	{#if action === 'Button'}
		<Button>Action</Button>
	{:else}
		<HyperlinkButton navigateUri="http://www.microsoft.com/" target="_blank" rel="noreferrer"
			>Informational link</HyperlinkButton
		>
	{/if}
{/snippet}

<ItemPage {item}>
	<ControlExample
		headerText={severitySample.header ?? undefined}
		xaml={severitySample.xaml ?? undefined}
		substitutions={{ Severity: severityName, IsOpen: bool(open1) }}
	>
		<!-- InfoBarPage.xaml:23-28. The control stretches down the example and its template
		     draws the bar at the top of it (InfoBar.xaml:15, VerticalAlignment="Top" on
		     ContentRoot); here the bar is the root, so the root says top. -->
		<InfoBar
			title="Title"
			bind:open={open1}
			message={MESSAGE}
			{severity}
			data-vertical-alignment="top"
		/>
		{#snippet options()}
			<!-- InfoBarPage.xaml:32-48: a 150-wide StackPanel, the ComboBox stretched across it. -->
			<div class="options-stack">
				<CheckBox bind:checked={open1}>Is Open</CheckBox>
				<ComboBox items={SEVERITIES} bind:value={severityName} header="Severity" />
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={longShortSample.header ?? undefined}
		xaml={longShortSample.xaml ?? undefined}
		substitutions={{
			IsOpen: bool(open2),
			DisplayMessage: lengthItem.display,
			DisplayButton: actionItem.display
		}}
	>
		<!-- InfoBarPage.xaml:58-61, with the message and action button the code-behind sets
		     (InfoBarPage.xaml.cs:48-94). The Button's sample names a Click handler the code
		     attaches nothing for, and the HyperlinkButton links microsoft.com where its sample
		     says example.com; the page is what is reproduced. Its link opens a new tab, as the
		     HyperlinkButton page's does. Wrapped, the long message's bar is as wide as the
		     example here, where the original's is as wide as its widest wrapped line: CSS has
		     no length for the width a wrapped box used. -->
		<InfoBar
			title="Title"
			bind:open={open2}
			message={lengthItem.message}
			actionButton={action === 'None' ? undefined : actionButton}
			data-vertical-alignment="top"
		/>
		{#snippet options()}
			<!-- InfoBarPage.xaml:75-99. -->
			<div class="options-stack">
				<CheckBox bind:checked={open2}>Is Open</CheckBox>
				<ComboBox items={LENGTHS} bind:value={length} header="Message Length" />
				<ComboBox items={ACTIONS} bind:value={action} header="Action Button" />
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={displaySample.header ?? undefined}
		xaml={displaySample.xaml ?? undefined}
		substitutions={{
			IsOpen: bool(open3),
			IsIconVisible: bool(iconVisible),
			IsClosable: bool(closable)
		}}
	>
		<!-- InfoBarPage.xaml:104-110. -->
		<InfoBar
			title="Title"
			bind:open={open3}
			message={MESSAGE}
			{iconVisible}
			{closable}
			data-vertical-alignment="top"
		/>
		{#snippet options()}
			<!-- InfoBarPage.xaml:113-126. -->
			<div class="options-stack">
				<CheckBox bind:checked={open3}>Is Open</CheckBox>
				<CheckBox bind:checked={iconVisible}>Is Icon Visible</CheckBox>
				<CheckBox bind:checked={closable}>Is Closable</CheckBox>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	/* StackPanel Width="150", stretching its children across that width. */
	.options-stack {
		display: flex;
		flex-direction: column;
		/* c1-allow: InfoBarPage.xaml:32, :75 and :113, Width="150". */
		width: 150px;
	}
</style>
