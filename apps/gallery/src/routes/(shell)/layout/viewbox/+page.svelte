<script lang="ts">
	import {
		Border,
		RadioButton,
		RadioButtons,
		Slider,
		Viewbox,
		type ViewboxProps
	} from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	type StretchName = 'None' | 'Fill' | 'Uniform' | 'UniformToFill';
	type DirectionName = 'UpOnly' | 'DownOnly' | 'Both';

	const item = itemOf('/layout/viewbox');
	if (item === null) throw new Error('Viewbox page has no Gallery item');
	const sample = sampleOf('Viewbox/ContentInsideViewbox.txt');

	const STRETCH: Record<StretchName, NonNullable<ViewboxProps['stretch']>> = {
		None: 'none',
		Fill: 'fill',
		Uniform: 'uniform',
		UniformToFill: 'uniformToFill'
	};
	const DIRECTION: Record<DirectionName, NonNullable<ViewboxProps['stretchDirection']>> = {
		UpOnly: 'upOnly',
		DownOnly: 'downOnly',
		Both: 'both'
	};

	let size = $state(200);
	let stretch = $state<StretchName>('Uniform');
	let stretchDirection = $state<DirectionName>('Both');
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		substitutions={{ Size: String(size), Stretch: stretch, StretchDirection: stretchDirection }}
	>
		<!-- VerticalAlignment="Top", ViewboxPage.xaml:26 -->
		<Viewbox
			data-vertical-alignment="top"
			stretch={STRETCH[stretch]}
			stretchDirection={DIRECTION[stretchDirection]}
			style="width: {size}px; height: {size}px"
		>
			<!-- ViewboxPage.xaml:28-51 — the sample content is repeated here because routes do not import harnesses. -->
			<Border borderBrush="#808080" borderThickness={15}>
				<div class="stack">
					<div class="bars">
						<div class="bar blue"></div>
						<div class="bar green"></div>
						<div class="bar red"></div>
						<div class="bar yellow"></div>
					</div>
					<img src="/Slices.png" alt="" width="90" height="90" />
					<div class="caption">This is text.</div>
				</div>
			</Border>
		</Viewbox>
		{#snippet options()}
			<!-- ViewboxPage.xaml:55 sets the options StackPanel Width="200". -->
			<div class="options">
				<Slider header="Width/Height" min={20} max={300} bind:value={size} />
				<RadioButtons header="Stretch">
					<RadioButton name="viewbox-stretch" value="None" bind:group={stretch}>None</RadioButton>
					<RadioButton name="viewbox-stretch" value="Fill" bind:group={stretch}>Fill</RadioButton>
					<RadioButton name="viewbox-stretch" value="Uniform" bind:group={stretch}
						>Uniform</RadioButton
					>
					<RadioButton name="viewbox-stretch" value="UniformToFill" bind:group={stretch}
						>UniformToFill</RadioButton
					>
				</RadioButtons>
				<RadioButtons header="StretchDirection">
					<RadioButton name="viewbox-direction" value="UpOnly" bind:group={stretchDirection}
						>UpOnly</RadioButton
					>
					<RadioButton name="viewbox-direction" value="DownOnly" bind:group={stretchDirection}
						>DownOnly</RadioButton
					>
					<RadioButton name="viewbox-direction" value="Both" bind:group={stretchDirection}
						>Both</RadioButton
					>
				</RadioButtons>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.stack {
		/* c1-allow: ViewboxPage.xaml:29 — StackPanel Background="DarkGray". */
		background: #a9a9a9;
	}

	/* c1-allow: ViewboxPage.xaml:30 — the inner StackPanel has Orientation="Horizontal". */
	.bars {
		display: flex;
	}

	/* c1-allow: ViewboxPage.xaml:31-46 — rectangles have Width="40" and Height="10". */
	.bar {
		width: 40px;
		height: 10px;
	}

	.blue {
		/* c1-allow: ViewboxPage.xaml:34 — Fill="Blue". */
		background: #0000ff;
	}

	.green {
		/* c1-allow: ViewboxPage.xaml:38 — Fill="Green". */
		background: #008000;
	}

	.red {
		/* c1-allow: ViewboxPage.xaml:42 — Fill="Red". */
		background: #ff0000;
	}

	.yellow {
		/* c1-allow: ViewboxPage.xaml:46 — Fill="Yellow". */
		background: #ffff00;
	}

	/* c1-allow: ViewboxPage.xaml:48 — the image is 90×90; block removes the HTML line box. */
	img {
		display: block;
		/* An Image in a vertical StackPanel is arranged across the panel's width and centres its
		   bitmap in that slot; measured on the original, the 90px image sits mid-way across the
		   160px stack. */
		margin: 0 auto;
	}

	/* c1-allow: ViewboxPage.xaml:49 — TextBlock HorizontalAlignment="Center". */
	.caption {
		text-align: center;
	}

	/* c1-allow: ViewboxPage.xaml:55 — options StackPanel Width="200". */
	.options {
		display: flex;
		flex-direction: column;
		width: 200px;
	}
</style>
