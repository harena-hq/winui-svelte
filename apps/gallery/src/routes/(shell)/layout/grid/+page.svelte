<script lang="ts">
	import { Slider } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/layout/grid');
	if (item === null) throw new Error('Grid page has no Gallery item');
	const sample = sampleOf('Grid/3x3GridControl.txt');

	let columnSpacing = $state(8);
	let rowSpacing = $state(8);
	let column = $state(0);
	let row = $state(0);
</script>

{#snippet rowSpacingHeader()}<span class="vertical-header">RowSpacing</span>{/snippet}
{#snippet rowHeader()}<span class="vertical-header">Grid.Row</span>{/snippet}

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		substitutions={{
			Column: String(column),
			Row: String(row),
			ColumnSpacing: String(columnSpacing),
			RowSpacing: String(rowSpacing)
		}}
	>
		<!-- XAML Grid.Column/Grid.Row are 0-based; CSS grid-column/grid-row are 1-based. -->
		<!-- DOM order is paint order in both XAML and CSS grid, so the first red rectangle paints under a later rectangle when cells overlap. -->
		<div class="sample" style:column-gap={`${columnSpacing}px`} style:row-gap={`${rowSpacing}px`}>
			<div class="rect red" style:grid-column={column + 1} style:grid-row={row + 1}></div>
			<div class="rect blue" style="grid-row: 2"></div>
			<div class="rect green" style="grid-column: 2"></div>
			<div class="rect yellow" style="grid-column: 2; grid-row: 2"></div>
		</div>
		{#snippet options()}
			<div class="options">
				<span class="label winui-BodyTextBlockStyle">Grid</span>
				<!-- GridPage.xaml:76 — Margin="16,0,0,0". -->
				<Slider
					style="margin-left: 16px"
					header="ColumnSpacing"
					min={0}
					max={16}
					step={1}
					tickFrequency={1}
					bind:value={columnSpacing}
				/>
				<!-- GridPage.xaml:88 — Height="100"; VerticalAlignment="Top" is represented by the page's layout. -->
				<Slider
					style="height: 100px"
					orientation="vertical"
					isDirectionReversed
					header={rowSpacingHeader}
					min={0}
					max={16}
					step={1}
					tickFrequency={1}
					bind:value={rowSpacing}
				/>
				<span class="label winui-BodyTextBlockStyle">Red block</span>
				<!-- GridPage.xaml:110 — Margin="16,0,0,0". -->
				<Slider
					style="margin-left: 16px"
					header="Grid.Column"
					min={0}
					max={2}
					step={1}
					tickFrequency={1}
					bind:value={column}
				/>
				<!-- GridPage.xaml:121 — Height="100"; VerticalAlignment="Top" is represented by the page's layout. -->
				<Slider
					style="height: 100px"
					orientation="vertical"
					isDirectionReversed
					header={rowHeader}
					min={0}
					max={2}
					step={1}
					tickFrequency={1}
					bind:value={row}
				/>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	/* c1-allow: GridPage.xaml:24-28 — Width="240" Height="160" Background="Gray",
	   ColumnDefinitions="50, 50, 50" RowDefinitions="50, 50, 50" */
	.sample {
		display: grid;
		grid-template-columns: repeat(3, 50px);
		grid-template-rows: repeat(3, 50px);
		width: 240px;
		height: 160px;
		/* c1-allow: GridPage.xaml:26 — Background="Gray". */
		background: #808080;
	}

	/* c1-allow: GridPage.xaml:41-59 — every Rectangle is Width="50" Height="50". */
	.rect {
		width: 50px;
		height: 50px;
	}

	/* c1-allow: GridPage.xaml:43, :46, :51, :57 — Fill="Red", "Blue", "Green", "Yellow". */
	.red {
		/* c1-allow: GridPage.xaml:43 — Fill="Red". */
		background: #ff0000;
	}

	.blue {
		/* c1-allow: GridPage.xaml:46 — Fill="Blue". */
		background: #0000ff;
	}

	.green {
		/* c1-allow: GridPage.xaml:51 — Fill="Green". */
		background: #008000;
	}

	.yellow {
		/* c1-allow: GridPage.xaml:57 — Fill="Yellow". */
		background: #ffff00;
	}

	/* c1-allow: GridPage.xaml:63-67 — the options Grid has ColumnSpacing="12" and RowSpacing="12". */
	.options {
		display: grid;
		grid-template-columns: auto auto;
		column-gap: 12px;
		row-gap: 12px;
		align-items: start;
	}

	/* c1-allow: GridPage.xaml:68-105 — labels occupy the full options row before the two sliders. */
	.label {
		grid-column: 1 / -1;
	}

	/* c1-allow: GridPage.xaml:99 and :131 — Slider headers use Margin="0,0,0,10". A block,
	   because an inline span's vertical margin is ignored and the TextBlock's is not. */
	.vertical-header {
		display: block;
		margin-bottom: 10px;
	}
</style>
