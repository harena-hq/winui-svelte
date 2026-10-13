<script lang="ts">
	/*
	 * The Gallery's SamplePage1 (SampleSupport/SamplePages/SamplePage1.xaml), the page the
	 * Gallery's navigation samples show for their first item.
	 */
	import { ScrollViewer } from 'winui-svelte/preview';
	import { LOREM } from './lorem';
</script>

<!-- SamplePage1.xaml:9. -->
<ScrollViewer style="height: 100%">
	<!-- :10-23, Auto,*,* columns over Auto,Auto,Auto,* rows. A ScrollViewer measures its
	     content at an unbounded height, so the * row sizes to its text; arranged taller, the
	     row's extra height paints nothing. A star column shrinks below its content as XAML's
	     does, hence minmax(0, …). -->
	<div class="grid">
		<!-- :26-49, four tiles with MinHeight 150 and Margin 6. -->
		<div class="tile dark-gray" style="grid-row: 2; grid-column: 2"></div>
		<div class="tile light-gray" style="grid-row: 2; grid-column: 3"></div>
		<div class="tile light-gray" style="grid-row: 3; grid-column: 2"></div>
		<div class="tile dark-gray" style="grid-row: 3; grid-column: 3"></div>
		<!-- :50-58, SourceElement: rows 1-2 of column 0, MinWidth 250, Margin 5. -->
		<div class="source" style="grid-row: 2 / span 2; grid-column: 1"></div>
		<!-- :60-67, row 3 across all three columns, Margin "6,12". -->
		<p class="text winui-BodyTextBlockStyle" style="grid-row: 4; grid-column: 1 / span 3">
			{LOREM}
		</p>
	</div>
</ScrollViewer>

<style>
	.grid {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);
	}
	.tile {
		/* c1-allow: SamplePage1.xaml:12, TileHeight 150. */
		min-height: 150px;
		/* c1-allow: SamplePage1.xaml:30, Margin="6". */
		margin: 6px;
	}
	.dark-gray {
		/* c1-allow: SamplePage1.xaml:31 and :49, the sample's named DarkGray. */
		background: DarkGray;
	}
	.light-gray {
		/* c1-allow: SamplePage1.xaml:37 and :43, the sample's named LightGray. */
		background: LightGray;
	}
	.source {
		/* c1-allow: SamplePage1.xaml:55, MinWidth="250". */
		min-width: 250px;
		/* c1-allow: SamplePage1.xaml:56, TileHeight 150. */
		min-height: 150px;
		/* c1-allow: SamplePage1.xaml:57, Margin="5". */
		margin: 5px;
		background: var(--winui-SystemAccentColor);
	}
	.text {
		/* c1-allow: SamplePage1.xaml:63, Margin="6,12". */
		margin: 12px 6px;
	}
</style>
