<script lang="ts">
	/* The Gallery's SamplePage5 (SampleSupport/SamplePages/SamplePage5.xaml). */
	import { ScrollViewer } from 'winui-svelte/preview';
	import { LOREM } from './lorem';
</script>

<!-- SamplePage5.xaml:10. -->
<ScrollViewer style="height: 100%">
	<!-- :11-24, 1*,1*,4* columns over four Auto rows. An Ellipse of a fixed size is centred in
	     its cell, as Stretch centres an element whose size is set. -->
	<div class="grid">
		<div class="tile khaki" style="grid-row: 1; grid-column: 1"></div>
		<div class="tile dark-khaki" style="grid-row: 1; grid-column: 2"></div>
		<div class="ellipse large dark-sea-green" style="grid-row: 1; grid-column: 3"></div>
		<div class="ellipse small medium-sea-green" style="grid-row: 2; grid-column: 1 / span 2"></div>
		<div class="tile dark-olive-green" style="grid-row: 2; grid-column: 3"></div>
		<!-- :58-63, row 3 across the columns, Margin 5. -->
		<p class="text winui-BodyTextBlockStyle" style="grid-row: 4; grid-column: 1 / span 3">
			{LOREM}
		</p>
	</div>
</ScrollViewer>

<style>
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 4fr);
	}
	.tile {
		/* c1-allow: SamplePage5.xaml:13, TileHeight 150. */
		min-height: 150px;
	}
	.tile,
	.text {
		/* c1-allow: SamplePage5.xaml:31, :37, :55 and :61, Margin="5". */
		margin: 5px;
	}
	.ellipse {
		place-self: center;
		border-radius: 50%;
	}
	.large {
		/* c1-allow: SamplePage5.xaml:42-43, Width="150" Height="150". */
		width: 150px;
		height: 150px;
	}
	.small {
		/* c1-allow: SamplePage5.xaml:48-49, Width="75" Height="75". */
		width: 75px;
		height: 75px;
	}
	.khaki {
		/* c1-allow: SamplePage5.xaml:32, the sample's named Khaki. */
		background: Khaki;
	}
	.dark-khaki {
		/* c1-allow: SamplePage5.xaml:38, the sample's named DarkKhaki. */
		background: DarkKhaki;
	}
	.dark-sea-green {
		/* c1-allow: SamplePage5.xaml:44, the sample's named DarkSeaGreen. */
		background: DarkSeaGreen;
	}
	.medium-sea-green {
		/* c1-allow: SamplePage5.xaml:50, the sample's named MediumSeaGreen. */
		background: MediumSeaGreen;
	}
	.dark-olive-green {
		/* c1-allow: SamplePage5.xaml:56, the sample's named DarkOliveGreen. */
		background: DarkOliveGreen;
	}
</style>
