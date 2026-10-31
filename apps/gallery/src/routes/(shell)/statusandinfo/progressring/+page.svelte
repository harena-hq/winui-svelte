<script lang="ts">
	import { ComboBox, NumberBox, ProgressRing, ToggleSwitch } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/statusandinfo/progressring');
	if (item === null) throw new Error('ProgressRing page has no Gallery item');
	const indeterminateSample = sampleOf('ProgressRing/IndeterminateProgressRing.txt');
	const determinateSample = sampleOf('ProgressRing/DeterminateProgressRing.txt');

	// ProgressRingPage.xaml:47-48 and :91-92 — two strings, no selection until one is picked.
	const BACKGROUNDS = [
		{ value: 'Transparent', label: 'Transparent' },
		{ value: 'LightGray', label: 'LightGray' }
	];

	/**
	 * ProgressRingPage.xaml.cs:30-50: `Transparent` and `LightGray` set the ring's `Background`,
	 * which is the colour of its track (ProgressRing.cpp:282-303 hands it to the composition,
	 * whose track strokes with it, AnimatedVisuals/ProgressRingDeterminate.cpp:205). The
	 * `Background` substitution is enabled until a pick — a substitution is enabled by default
	 * (ControlExample.xaml.cs:39) and the page sets none at load — so the source reads
	 * `Background="LightGray"` before anything is picked, as the original's does; `Transparent`
	 * disables it and `LightGray` enables it again (ProgressRingPage.xaml.cs:43,
	 * :49). Nothing picked leaves the
	 * ring's own brush. The track colour is the token the ring reads, set on the ring.
	 */
	function background(name: string) {
		if (name === '') return { style: '', xaml: 'Background="LightGray"' };
		if (name === 'Transparent')
			return {
				// Colors.Transparent, which is white at no alpha.
				style: '--winui-ProgressRingBackgroundThemeBrush: #ffffff00;',
				xaml: ''
			};
		if (name === 'LightGray')
			return {
				// Colors.LightGray.
				style: '--winui-ProgressRingBackgroundThemeBrush: #d3d3d3;',
				xaml: 'Background="LightGray"'
			};
		throw new Error(`ProgressRing page: invalid background ${JSON.stringify(name)}`);
	}

	let working = $state(true);
	let background1 = $state('');
	let background2 = $state('');
	const first = $derived(background(background1));
	const second = $derived(background(background2));

	let progressValue = $state<number | null>(0);
	// ProgressRingPage.xaml.cs:18-28: the ring takes the box's value, and a box that is not a
	// number is set back to 0, which raises ValueChanged again and takes the ring to 0. Here
	// the ring is set to 0 directly, rather than resting on whether the box reports the write
	// back. NumberBox reports what is not a number — empty, a lone `-`, `4e` — as null.
	let ringValue = $state(0);
	function onValueChange(value: number | null) {
		if (value === null) {
			progressValue = 0;
			ringValue = 0;
		} else {
			ringValue = value;
		}
	}
</script>

<ItemPage {item}>
	<ControlExample
		headerText={indeterminateSample.header ?? undefined}
		xaml={indeterminateSample.xaml ?? undefined}
		substitutions={{ IsActive: working ? 'True' : 'False', Background: first.xaml }}
	>
		<!-- ProgressRingPage.xaml:24-31: Width="60" Height="60" Margin="10,10,0,0"
		     VerticalAlignment="Top". Top and left only, so the frame's auto bottom margin stays.
		     Its AutomationProperties.Name, "Progress image" (:30, and :69 on the second), has no
		     element to reach: the ring carries no role, as it has no automation peer here. -->
		<ProgressRing
			data-vertical-alignment="top"
			active={working}
			style="width: 60px; height: 60px; margin-top: 10px; margin-left: 10px; {first.style}"
		/>
		{#snippet options()}
			<!-- ProgressRingPage.xaml:33: a StackPanel with no Spacing. -->
			<div class="options">
				<ToggleSwitch
					header="Progress Options"
					onContent="Working"
					offContent="Do work"
					bind:checked={working}
				/>
				<ComboBox
					items={BACKGROUNDS}
					bind:value={background1}
					header="Background color"
					placeholder="Pick a color"
					style="width: 200px"
				/>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={determinateSample.header ?? undefined}
		xaml={determinateSample.xaml ?? undefined}
		substitutions={{ DeterminateProgressValue: String(ringValue), Background: second.xaml }}
	>
		<!-- ProgressRingPage.xaml:63-82: a horizontal StackPanel of the ring and a NumberBox. The
		     box's AutomationProperties.Name, "Progress amount" (:75), is not carried: NumberBox
		     exposes no way to name its input, and its header is not associated with it. -->
		<div class="row">
			<ProgressRing
				indeterminate={false}
				value={ringValue}
				class="determinate-ring"
				style="width: 60px; height: 60px; {second.style}"
			/>
			<NumberBox
				bind:value={progressValue}
				{onValueChange}
				header="Progress"
				min={0}
				max={100}
				spinButtonPlacementMode="inline"
				class="progress-value"
			/>
		</div>
		{#snippet options()}
			<ComboBox
				items={BACKGROUNDS}
				bind:value={background2}
				header="Background color"
				placeholder="Pick a color"
				style="width: 200px"
			/>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.options {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	/* ProgressRingPage.xaml:63 is a StackPanel with Orientation="Horizontal". The ring's style
	   centres it vertically (ProgressRing.xaml:8), and the NumberBox says so itself
	   (ProgressRingPage.xaml:74). */
	.row {
		display: flex;
		align-items: center;
	}

	/* ProgressRingPage.xaml:68, Margin="0,0,60,0" on the ring. */
	.row > :global(.determinate-ring) {
		/* c1-allow: ProgressRingPage.xaml:68 sets Margin="0,0,60,0" on the ring. */
		margin-right: 60px;
	}

	/* ProgressRingPage.xaml:73, MinWidth="120" on the NumberBox. */
	.row > :global(.progress-value) {
		/* c1-allow: ProgressRingPage.xaml:73 sets MinWidth="120" on the NumberBox. */
		min-width: 120px;
	}
</style>
