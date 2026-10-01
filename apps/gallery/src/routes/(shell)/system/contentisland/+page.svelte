<script lang="ts">
	import { Button, Rectangle } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/system/contentisland');
	if (item === null) throw new Error('ContentIsland page has no Gallery item');
	const sample = sampleOf('ContentIsland/BasicContentIslandContent.txt');
</script>

<ItemPage {item}>
	<ControlExample headerText={sample.header ?? undefined} sourceCodeVisible={false}>
		<!-- ContentIslandPage.xaml:29 — the Grid sets no VerticalAlignment, so it stretches and its
		     third row takes the remaining height. -->
		<div class="content" data-vertical-alignment="stretch">
			<!-- ContentIslandPage.xaml:35 preserves both upstream phrasings: "an ContentIsland" and "Notice now". -->
			<p class="winui-BodyTextBlockStyle">
				Here's an ContentIsland in a ScrollViewer. Notice now the content scrolls and clips
				correctly.
			</p>
			<!-- WD-072: LoadModel_Click and LoadModel (ContentIslandPage.xaml.cs:40-113) require
			     ContentIsland, ChildSiteLink and the composition-hosted HelmetScenario.CreateIsland
			     at :100. The button presses and nothing is hosted. -->
			<Button variant="accent">Load model</Button>
			<div class="rectangles">
				<!-- ContentIslandPage.xaml:45-56 — six Rectangles, all on CardRectangleStyle. -->
				{#each [0, 1, 2, 3, 4, 5] as index (index)}
					<Rectangle
						fill="var(--winui-CardBackgroundFillColorDefaultBrush)"
						stroke="var(--winui-CardStrokeColorDefaultBrush)"
						strokeThickness={1}
						radiusX={8}
						radiusY={8}
						style="width: 400px; height: 400px; margin: 8px"
					/>
				{/each}
			</div>
		</div>
	</ControlExample>
</ItemPage>

<style>
	/* ContentIslandPage.xaml:29 — Grid RowSpacing="8". */
	.content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
	.content p {
		margin: 0;
	}
	/* ContentIslandPage.xaml:41-44 — a left-aligned WrapPanel, which wraps at whatever width
	   its parent gives it. It is given no width here for the same reason: 832 is what two
	   416-wide rectangles happen to need at the reference width, and writing it down would
	   freeze this panel at two per row on a viewport where the original would fit three. */
	.rectangles {
		display: flex;
		flex-wrap: wrap;
		align-content: flex-start;
	}
</style>
