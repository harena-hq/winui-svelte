<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface InterimPageProps {
		/** The page's content. */
		children?: Snippet;
		/**
		 * Whether the page scrolls in a `ScrollView` rather than the older `ScrollViewer`, as
		 * upstream's Settings page alone does (SettingsPage.xaml:35).
		 */
		scrollView?: boolean;
	}
</script>

<script lang="ts">
	import { ScrollView, ScrollViewer } from '@harena-hq/winui-svelte/preview';

	let { children, scrollView = false }: InterimPageProps = $props();
</script>

<!-- A page not yet reproduced brings its own scroller as every upstream page does, because the
     shell's page area does not scroll: ItemPage's (ItemPage.xaml:43) and Home's
     (HomePage.xaml:52) are ScrollViewers, and the All controls, section and search pages are
     each a GridView (AllControlsPage.xaml:39, SectionPage.xaml:30, SearchResultsPage.xaml:22),
     whose scrolling is one too. Settings alone scrolls in a ScrollView, below a title that
     stays where it is (SettingsPage.xaml:28-35), which this does not reproduce: the title
     scrolls with the rest. This component's gutter is v2's interim stand-in for ItemPage's
     margins, 36 a side, 24 above and 36 below (ItemPage.xaml:39 and :48), until the page has a
     frame of its own. -->
{#if scrollView}
	<ScrollView class="page-scroller" style="flex: 1 1 auto; min-height: 0">
		<div class="gutter">{@render children?.()}</div>
	</ScrollView>
{:else}
	<ScrollViewer
		class="page-scroller"
		style="flex: 1 1 auto; min-height: 0"
		verticalScrollBarVisibility="auto"
	>
		<div class="gutter">{@render children?.()}</div>
	</ScrollViewer>
{/if}

<style>
	.gutter {
		/* The Gallery's own gutter, not NavigationView's, whose
		   `NavigationViewContentPresenterMargin` is 0. ItemPage's narrow adaptive state drops it
		   to 16 a side and below and 12 above (ItemPage.xaml:87-88), which this does not
		   reproduce. */
		/* c1-allow: ItemPage.xaml:39 and :48, the Gallery's page gutter */
		padding: 24px 36px 36px;
	}
</style>
