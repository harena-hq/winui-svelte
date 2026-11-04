<script lang="ts">
	/* The Gallery's SamplePage3 (SampleSupport/SamplePages/SamplePage3.xaml). */
	import { ScrollViewer } from '@harena-hq/winui-svelte/preview';
	import { LOREM } from './lorem';
</script>

<!-- SamplePage3.xaml:10. -->
<ScrollViewer style="height: 100%">
	<!-- :11-24, 2*,*,* columns over Auto,Auto,Auto,* rows. -->
	<div class="grid">
		<!-- :27-57, five tiles with MinHeight 150 and Margin 5. -->
		<div class="tile light-gray" style="grid-row: 2 / span 2; grid-column: 1"></div>
		<div class="tile dark-gray" style="grid-row: 2; grid-column: 2"></div>
		<div class="tile gray" style="grid-row: 3; grid-column: 2"></div>
		<div class="tile light-gray" style="grid-row: 2; grid-column: 3"></div>
		<div class="tile dark-gray" style="grid-row: 3; grid-column: 3"></div>
		<!-- :59-64, row 3 across the columns, Margin 5. -->
		<p class="text winui-BodyTextBlockStyle" style="grid-row: 4; grid-column: 1 / span 3">
			{LOREM}
		</p>
	</div>
</ScrollViewer>

<style>
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
	}
	.tile {
		/* c1-allow: SamplePage3.xaml:13, TileHeight 150. */
		min-height: 150px;
	}
	.tile,
	.text {
		/* c1-allow: SamplePage3.xaml:32, :38, :44, :50, :56 and :62, Margin="5". */
		margin: 5px;
	}
	.light-gray {
		/* c1-allow: SamplePage3.xaml:33 and :51, the sample's named LightGray. */
		background: LightGray;
	}
	.dark-gray {
		/* c1-allow: SamplePage3.xaml:39 and :57, the sample's named DarkGray. */
		background: DarkGray;
	}
	.gray {
		/* c1-allow: SamplePage3.xaml:45, the sample's named Gray. */
		background: Gray;
	}
</style>
