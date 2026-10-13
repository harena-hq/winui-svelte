<script lang="ts">
	/* The Gallery's SamplePage4 (SampleSupport/SamplePages/SamplePage4.xaml). */
	import { ScrollViewer } from 'winui-svelte/preview';
	import { LOREM } from './lorem';
</script>

<!-- SamplePage4.xaml:10-11, a StackPanel of two Grids. -->
<ScrollViewer style="height: 100%">
	<!-- :12-44, 2*,*,* columns over a single Auto row (:22). Its tiles name row 1, the
	     first with a span of 2, and a Grid clamps a row past its last to the last, so all three sit in
	     row 0. -->
	<div class="grid wide-first">
		<div class="tile dark-salmon" style="grid-column: 1"></div>
		<div class="tile dark-red" style="grid-column: 2"></div>
		<div class="tile light-coral" style="grid-column: 3"></div>
	</div>
	<!-- :46-85, *,*,2* columns over Auto,Auto,* rows; the tiles in row 1, the text in 2. -->
	<div class="grid wide-last">
		<div class="tile dark-red" style="grid-row: 2; grid-column: 2"></div>
		<div class="tile light-coral" style="grid-row: 2; grid-column: 1"></div>
		<div class="tile indian-red" style="grid-row: 2; grid-column: 3"></div>
		<p class="text winui-BodyTextBlockStyle" style="grid-row: 3; grid-column: 1 / span 3">
			{LOREM}
		</p>
	</div>
</ScrollViewer>

<style>
	.grid {
		display: grid;
	}
	.wide-first {
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);
	}
	.wide-last {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr);
	}
	.tile {
		/* c1-allow: SamplePage4.xaml:14 and :48, TileHeight 150. */
		min-height: 150px;
	}
	.tile,
	.text {
		/* c1-allow: SamplePage4.xaml:30, :36, :42, :65, :71, :77 and :83, Margin="5". */
		margin: 5px;
	}
	.dark-salmon {
		/* c1-allow: SamplePage4.xaml:31, the sample's named DarkSalmon. */
		background: DarkSalmon;
	}
	.dark-red {
		/* c1-allow: SamplePage4.xaml:37 and :66, the sample's named DarkRed. */
		background: DarkRed;
	}
	.light-coral {
		/* c1-allow: SamplePage4.xaml:43 and :72, the sample's named LightCoral. */
		background: LightCoral;
	}
	.indian-red {
		/* c1-allow: SamplePage4.xaml:78, the sample's named IndianRed. */
		background: IndianRed;
	}
</style>
