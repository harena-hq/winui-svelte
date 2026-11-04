<script lang="ts">
	/* The Gallery's SamplePage6 (SampleSupport/SamplePages/SamplePage6.xaml). */
	import { ScrollViewer } from '@harena-hq/winui-svelte/preview';
	import { LOREM } from './lorem';
</script>

<!-- SamplePage6.xaml:10. -->
<ScrollViewer style="height: 100%">
	<!-- :11-24, 1*,1*,4* columns over four Auto rows; each Ellipse centred in its cell. -->
	<div class="grid">
		<div class="ellipse dot medium-turquoise" style="grid-row: 1; grid-column: 1"></div>
		<div class="ellipse disc steel-blue" style="grid-row: 1; grid-column: 2"></div>
		<div class="tile sky-blue" style="grid-row: 1; grid-column: 3"></div>
		<div class="ellipse disc powder-blue" style="grid-row: 2; grid-column: 1"></div>
		<div class="ellipse dot medium-turquoise" style="grid-row: 2; grid-column: 2"></div>
		<div class="tile steel-blue" style="grid-row: 2; grid-column: 3"></div>
		<!-- :63-68, row 3 across the columns, Margin 5. -->
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
		/* c1-allow: SamplePage6.xaml:13, TileHeight 150. */
		min-height: 150px;
	}
	.tile,
	.text {
		/* c1-allow: SamplePage6.xaml:43, :61 and :66, Margin="5". */
		margin: 5px;
	}
	.ellipse {
		place-self: center;
		border-radius: 50%;
	}
	.dot {
		/* c1-allow: SamplePage6.xaml:30-31 and :54-55, Width="20" Height="20". */
		width: 20px;
		height: 20px;
	}
	.disc {
		/* c1-allow: SamplePage6.xaml:36-37 and :48-49, Width="50" Height="50". */
		width: 50px;
		height: 50px;
	}
	.medium-turquoise {
		/* c1-allow: SamplePage6.xaml:32 and :56, the sample's named MediumTurquoise. */
		background: MediumTurquoise;
	}
	.steel-blue {
		/* c1-allow: SamplePage6.xaml:38 and :62, the sample's named SteelBlue. */
		background: SteelBlue;
	}
	.sky-blue {
		/* c1-allow: SamplePage6.xaml:44, the sample's named SkyBlue. */
		background: SkyBlue;
	}
	.powder-blue {
		/* c1-allow: SamplePage6.xaml:50, the sample's named PowderBlue. */
		background: PowderBlue;
	}
</style>
