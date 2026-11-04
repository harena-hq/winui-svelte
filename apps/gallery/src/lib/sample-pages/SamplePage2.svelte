<script lang="ts">
	/* The Gallery's SamplePage2 (SampleSupport/SamplePages/SamplePage2.xaml). */
	import { ScrollViewer } from '@harena-hq/winui-svelte/preview';
	import { LOREM } from './lorem';
</script>

<!-- SamplePage2.xaml:9. -->
<ScrollViewer style="height: 100%">
	<!-- :10-20, Auto,* columns over two Auto rows; everything sits in row 1. -->
	<div class="grid">
		<!-- :23-32, DestinationElement: 150 by 200, Margin 12, top-aligned. -->
		<div class="destination" style="grid-row: 2; grid-column: 1"></div>
		<!-- :34-46, ContentPanel: MinHeight 200, Margin 12. -->
		<div class="content" style="grid-row: 2; grid-column: 2">
			<!-- :40-44, TitleTextBlockStyle, Margin="0,0,0,12". -->
			<p class="title winui-TitleTextBlockStyle">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit
			</p>
			<!-- :45. -->
			<p class="winui-BodyTextBlockStyle">{LOREM}</p>
		</div>
	</div>
</ScrollViewer>

<style>
	.grid {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
	}
	.destination {
		/* c1-allow: SamplePage2.xaml:27-28, Width="150" Height="200". */
		width: 150px;
		height: 200px;
		/* c1-allow: SamplePage2.xaml:30, Margin="12". */
		margin: 12px;
		align-self: start;
		background: var(--winui-SystemAccentColor);
	}
	.content {
		/* c1-allow: SamplePage2.xaml:38, MinHeight="200". */
		min-height: 200px;
		/* c1-allow: SamplePage2.xaml:39, Margin="12". */
		margin: 12px;
	}
	p {
		margin: 0;
	}
	.title {
		/* c1-allow: SamplePage2.xaml:41, Margin="0,0,0,12". */
		margin-bottom: 12px;
	}
</style>
