<script lang="ts">
	import { RadioButton, RadioButtons, Slider } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/layout/stackpanel');
	if (item === null) throw new Error('StackPanel page has no Gallery item');
	const sample = sampleOf('StackPanel/StackpanelControl.txt');

	let orientation = $state('Vertical');
	let spacing = $state(8);
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		substitutions={{ Spacing: String(spacing), Orientation: orientation }}
	>
		<!-- VerticalAlignment="Top", StackPanelPage.xaml:27 -->
		<div
			class="sample"
			data-vertical-alignment="top"
			data-orientation={orientation}
			style:gap={`${spacing}px`}
		>
			<div class="rect red"></div>
			<div class="rect blue"></div>
			<div class="rect green"></div>
			<div class="rect yellow"></div>
		</div>
		{#snippet options()}
			<!-- StackPanelPage.xaml:41 sets Spacing="12". -->
			<div class="options">
				<RadioButtons header="Orientation">
					<RadioButton name="stackpanel-orientation" value="Horizontal" bind:group={orientation}
						>Horizontal</RadioButton
					>
					<RadioButton name="stackpanel-orientation" value="Vertical" bind:group={orientation}
						>Vertical</RadioButton
					>
				</RadioButtons>
				<Slider header="Spacing" min={0} max={16} step={1} tickFrequency={1} bind:value={spacing} />
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.sample {
		display: flex;
		flex-direction: column;
	}

	.sample[data-orientation='Horizontal'] {
		flex-direction: row;
	}

	/* c1-allow: StackPanelPage.xaml:29-32 — the Rectangle style sets Height="40" and Width="40". */
	.rect {
		width: 40px;
		height: 40px;
	}

	/* c1-allow: StackPanelPage.xaml:34-37 — Fill="Red", "Blue", "Green", "Yellow". */
	.red {
		/* c1-allow: StackPanelPage.xaml:34 — Fill="Red". */
		background: #ff0000;
	}

	.blue {
		/* c1-allow: StackPanelPage.xaml:35 — Fill="Blue". */
		background: #0000ff;
	}

	.green {
		/* c1-allow: StackPanelPage.xaml:36 — Fill="Green". */
		background: #008000;
	}

	.yellow {
		/* c1-allow: StackPanelPage.xaml:37 — Fill="Yellow". */
		background: #ffff00;
	}

	/* c1-allow: StackPanelPage.xaml:41 — the options StackPanel sets Spacing="12". */
	.options {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>
