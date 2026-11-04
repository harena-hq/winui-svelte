<script lang="ts">
	import { Border, RadioButton, RadioButtons, Slider } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/layout/border');
	if (item === null) throw new Error('Border page has no Gallery item');
	const sample = sampleOf('Border/BorderAroundTextblock.txt');

	// BorderPage.xaml.cs:27-42 maps these Background labels to Colors.Green, Yellow, Blue and White.
	const BACKGROUNDS = [
		{ label: 'Green', css: '#008000', xaml: '#FF008000' },
		{ label: 'Yellow', css: '#FFFF00', xaml: '#FFFFFF00' },
		{ label: 'Blue', css: '#0000FF', xaml: '#FF0000FF' },
		{ label: 'White', css: '#FFFFFF', xaml: '#FFFFFFFF' }
	];

	// BorderPage.xaml.cs:50-65 maps these BorderBrush labels to Colors.DarkGreen, Gold, DarkBlue and White.
	const BRUSHES = [
		{ label: 'Green', css: '#006400', xaml: '#FF006400' },
		{ label: 'Yellow', css: '#FFD700', xaml: '#FFFFD700' },
		{ label: 'Blue', css: '#00008B', xaml: '#FF00008B' },
		{ label: 'White', css: '#FFFFFF', xaml: '#FFFFFFFF' }
	];

	let thickness = $state(2);
	let background = $state('White');
	let brush = $state('Yellow');

	const backgroundEntry = $derived.by(() => {
		const entry = BACKGROUNDS.find((candidate) => candidate.label === background);
		if (entry === undefined)
			throw new Error(`Border page: unknown background ${JSON.stringify(background)}`);
		return entry;
	});
	const brushEntry = $derived.by(() => {
		const entry = BRUSHES.find((candidate) => candidate.label === brush);
		if (entry === undefined)
			throw new Error(`Border page: unknown border brush ${JSON.stringify(brush)}`);
		return entry;
	});
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		substitutions={{
			BorderThickness: String(thickness),
			BorderBrush: brushEntry.xaml,
			Background: backgroundEntry.xaml
		}}
	>
		<!-- BorderPage.xaml:24 sets VerticalAlignment="Top" on this display-pane child. -->
		<Border
			data-vertical-alignment="top"
			borderThickness={thickness}
			borderBrush={brushEntry.css}
			background={backgroundEntry.css}
		>
			<span class="text">Text inside a border</span>
		</Border>
		{#snippet options()}
			<div class="stack">
				<Slider header="BorderThickness" min={0} max={10} step={1} bind:value={thickness} />
				<div class="two-columns">
					<RadioButtons header="Background">
						{#each BACKGROUNDS as entry (entry.label)}
							<RadioButton name="border-page-background" value={entry.label} bind:group={background}
								>{entry.label}</RadioButton
							>
						{/each}
					</RadioButtons>
					<RadioButtons header="BorderBrush">
						{#each BRUSHES as entry (entry.label)}
							<RadioButton name="border-page-brush" value={entry.label} bind:group={brush}
								>{entry.label}</RadioButton
							>
						{/each}
					</RadioButtons>
				</div>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	/* c1-allow: BorderPage.xaml:28-31 — the sample's TextBlock: Margin="8,5", FontSize="18", Foreground="Black" */
	.text {
		display: block;
		margin: 5px 8px;
		/* c1-allow: BorderPage.xaml:28-31 — the sample's TextBlock sets FontSize="18". */
		font-size: 18px;
		/* c1-allow: BorderPage.xaml:28-31 — the sample's TextBlock sets Foreground="Black". */
		color: black;
	}

	/* c1-allow: BorderPage.xaml:36 is a StackPanel with no Spacing. */
	.stack {
		display: flex;
		flex-direction: column;
	}

	/* c1-allow: BorderPage.xaml:47 sets ColumnSpacing="8". */
	.two-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		column-gap: 8px;
	}
</style>
