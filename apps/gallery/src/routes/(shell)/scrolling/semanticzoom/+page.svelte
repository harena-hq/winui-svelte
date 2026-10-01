<script lang="ts">
	import { ListView, ScrollView, SemanticZoom } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { groups, itemOf, type GalleryGroup } from '$lib/shell';

	const item = itemOf('/scrolling/semanticzoom');
	if (item === null) throw new Error('SemanticZoom page has no Gallery item');
	const sample = sampleOf('SemanticZoom/SimpleSemanticzoom.txt');

	// `cvsGroups` (SemanticZoomPage.xaml:23-28) is a grouped CollectionViewSource over
	// `ControlInfoDataSource.Instance.Groups` (SemanticZoomPage.xaml.cs:31) — the Gallery's own
	// navigation groups, which this repository already holds as a record.
	const GROUPS: GalleryGroup[] = [...groups];

	let isZoomedInViewActive = $state(true);
</script>

<ItemPage {item}>
	<ControlExample headerText={sample.header ?? undefined} xaml={sample.xaml ?? undefined}>
		<!-- SemanticZoomPage.xaml:59-80 — `Height="500"`. -->
		<SemanticZoom class="sample-zoom" bind:isZoomedInViewActive {zoomedInView} {zoomedOutView} />
	</ControlExample>
</ItemPage>

<!-- Upstream's zoomed-in view is a `GridView` with a `GroupStyle` (SemanticZoomPage.xaml:61-70),
     and **the grouping is this page's rather than the control's**: this library's `GridView` has
     no grouping and this unit adds none, so the headings and the items under them are drawn here
     directly — the way v11's Grid and StackPanel pages draw layouts that are not components. The
     `ScrollView` is the scrolling the GridView would have brought with it. -->
{#snippet zoomedInView()}
	<ScrollView class="zoomed-in-scroll" contentOrientation="vertical">
		<div class="groups">
			{#each GROUPS as group (group.uniqueId)}
				<section>
					<!-- `ZoomedInGroupHeaderTemplate` (SemanticZoomPage.xaml:42-47). Clicking a group
					     header is what takes upstream's grouped ListViewBase to the zoomed-out view,
					     through `ISemanticZoomInformation`; this library has no such interface, so
					     the page wires the control's callback itself. A `<button>` rather than a
					     `<div>`, so the header is reachable from the keyboard as the header item
					     upstream is. -->
					<button
						type="button"
						class="group-header winui-SubtitleTextBlockStyle"
						onclick={() => (isZoomedInViewActive = false)}
					>
						{group.title}
					</button>
					<div class="group-items">
						{#each group.items as groupItem (groupItem.uniqueId)}
							<!-- `ZoomedInTemplate` (SemanticZoomPage.xaml:30-40). -->
							<div class="tile">
								<span class="winui-BaseTextBlockStyle">{groupItem.title}</span>
								<span class="tile-subtitle winui-BodyTextBlockStyle">{groupItem.subtitle}</span>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	</ScrollView>
{/snippet}

<!-- The zoomed-out view needs no grouping, so it is the `ListView` upstream uses
     (SemanticZoomPage.xaml:74-78). Clicking a group name goes back to the zoomed-in view, and
     that one is the control's own rule rather than this page's: SemanticZoom watches its
     zoomed-out presenter for a click. -->
{#snippet zoomedOutView()}
	<ListView
		class="zoomed-out-list"
		items={GROUPS}
		selectionMode="none"
		key={(group) => group.uniqueId}
		itemTemplate={groupItemTemplate}
	/>
{/snippet}

<!-- `ZoomedOutTemplate` (SemanticZoomPage.xaml:49-54). -->
{#snippet groupItemTemplate(group: GalleryGroup)}
	<span class="winui-SubtitleTextBlockStyle">{group.title}</span>
{/snippet}

<style>
	/* SemanticZoomPage.xaml:59 — `Height="500"`. The control is a one-cell grid, so both views
	   are this box and the swap changes nothing about its bounds. */
	:global(.sample-zoom) {
		width: 100%;
		height: 500px;
	}

	:global(.zoomed-in-scroll),
	:global(.zoomed-out-list) {
		height: 100%;
	}

	.groups {
		display: flex;
		flex-direction: column;
	}

	/* The group header TextBlock also carries
	   `Foreground="{ThemeResource ApplicationForegroundThemeBrush}"`
	   (SemanticZoomPage.xaml:44). That key is in the framework pin but is not one the token
	   layer emits, and it is the page's default text colour in every theme, so the header
	   inherits rather than naming a token that does not exist. The rest of these declarations
	   only take the browser's button chrome off text that upstream draws as a TextBlock. */
	.group-header {
		align-self: flex-start;
		padding: 0;
		background: none;
		border: 0;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	/* A GridView lays its items out in a wrapping row (`ItemsWrapGrid`), which is what makes the
	   zoomed-in view a grid rather than a list. */
	.group-items {
		display: flex;
		flex-wrap: wrap;
	}

	/* SemanticZoomPage.xaml:31 — `MinWidth="200" Margin="12,6,12,6"` on the item's StackPanel. */
	.tile {
		display: flex;
		flex-direction: column;
		min-width: 200px;
		margin: 6px 12px;
	}

	/* SemanticZoomPage.xaml:33-38 — `Width="300"`, `HorizontalAlignment="Left"` and
	   `TextWrapping="Wrap"`. A fixed width rather than a maximum, which is what `Width` is. */
	.tile-subtitle {
		width: 300px;
		align-self: flex-start;
	}
</style>
