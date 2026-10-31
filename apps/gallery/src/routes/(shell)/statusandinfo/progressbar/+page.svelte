<script lang="ts">
	import { NumberBox, ProgressBar, RadioButton, RadioButtons } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/statusandinfo/progressbar');
	if (item === null) throw new Error('ProgressBar page has no Gallery item');
	const indeterminateSample = sampleOf('ProgressBar/IndeterminateProgressBar.txt');
	const determinateSample = sampleOf('ProgressBar/DeterminateProgressBar.txt');

	let progressState = $state<'running' | 'paused' | 'error'>('running');
	let progressValue = $state<number | null>(0);
	// ProgressBarPage.xaml.cs:15-27: the bar takes the box's value, and a box that is not a
	// number is set back to 0, which raises ValueChanged again and takes the bar to 0. Here
	// the bar is set to 0 directly, rather than resting on whether the box reports the write
	// back. NumberBox reports what is not a number — empty, a lone `-`, `4e` — as null.
	let barValue = $state(0);
	function onValueChange(value: number | null) {
		if (value === null) {
			progressValue = 0;
			barValue = 0;
		} else {
			barValue = value;
		}
	}
</script>

<ItemPage {item}>
	<ControlExample
		headerText={indeterminateSample.header ?? undefined}
		xaml={indeterminateSample.xaml ?? undefined}
		substitutions={{
			ShowPaused: progressState === 'paused' ? 'True' : 'False',
			ShowError: progressState === 'error' ? 'True' : 'False'
		}}
	>
		<!-- ProgressBarPage.xaml:23-29: Width="130", Margin="10,10,0,0", VerticalAlignment="Top".
		     Top and left only: the frame says `Top` with an auto bottom margin, and a `margin`
		     shorthand here would set it back to 0 and centre the bar. -->
		<ProgressBar
			data-vertical-alignment="top"
			indeterminate
			showPaused={progressState === 'paused'}
			showError={progressState === 'error'}
			style="width: 130px; margin-top: 10px; margin-left: 10px"
		/>
		{#snippet options()}
			<RadioButtons header="Progress state">
				<RadioButton name="progress-bar-state" value="running" bind:group={progressState}
					>Running</RadioButton
				>
				<RadioButton name="progress-bar-state" value="paused" bind:group={progressState}
					>Paused</RadioButton
				>
				<RadioButton name="progress-bar-state" value="error" bind:group={progressState}
					>Error</RadioButton
				>
			</RadioButtons>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={determinateSample.header ?? undefined}
		xaml={determinateSample.xaml ?? undefined}
		substitutions={{ DeterminateProgressValue: String(barValue) }}
	>
		<!-- ProgressBarPage.xaml:48-72: a horizontal StackPanel of the bar, an output TextBlock the
		     code-behind never writes, a label and an inline NumberBox. -->
		<div class="row">
			<ProgressBar
				value={barValue}
				aria-label="Determinate ProgressBar example"
				class="bar"
				style="width: 130px"
			/>
			<span class="output winui-BodyTextBlockStyle"></span>
			<span class="label winui-BodyTextBlockStyle">Progress</span>
			<!-- Upstream names the box by LabeledBy and AutomationProperties.Name
			     (ProgressBarPage.xaml:65-66). NumberBox exposes no way to name its input: its rest
			     props reach the wrapper, and its `header` is not associated with the input. -->
			<NumberBox
				bind:value={progressValue}
				{onValueChange}
				min={0}
				max={100}
				spinButtonPlacementMode="inline"
			/>
		</div>
	</ControlExample>
</ItemPage>

<style>
	/* ProgressBarPage.xaml:48 is a StackPanel with Orientation="Horizontal" and no Spacing. Its
	   children take the row's height and place themselves in it: the ProgressBar's style sets
	   VerticalAlignment="Center" (ProgressBar.xaml:11), as the label does on itself. */
	.row {
		display: flex;
		align-items: stretch;
	}

	.row > :global(.bar) {
		align-self: center;
	}

	/* ProgressBarPage.xaml:53-57 with the Gallery's OutputTextBlockStyle (Styles/TextBlock.xaml:3-8):
	   Width="60", and the style's Margin="8,8,0,0". */
	.output {
		/* c1-allow: ProgressBarPage.xaml:55 sets Width="60" on the output TextBlock. */
		width: 60px;
		/* c1-allow: Styles/TextBlock.xaml:7, OutputTextBlockStyle's Margin="8,8,0,0". */
		margin: 8px 0 0 8px;
		text-align: center;
	}

	/* ProgressBarPage.xaml:58-62: Margin="0,0,10,0", VerticalAlignment="Center". */
	.label {
		align-self: center;
		/* c1-allow: ProgressBarPage.xaml:60 sets Margin="0,0,10,0" on the label. */
		margin-right: 10px;
	}
</style>
