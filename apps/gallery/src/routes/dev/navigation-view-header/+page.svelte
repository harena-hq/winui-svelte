<script lang="ts">
	import { NavigationView, type NavigationViewEntry } from '@harena-hq/winui-svelte/preview';

	/*
	 * The header — `Header`, drawn in `HeaderContent` by
	 * `NavigationViewTitleHeaderContentControlTextStyle`.
	 *
	 * **Nothing photographs this page.** `navigation-view-header.spec.ts` reads where the header
	 * sits and what it is set in. The first two frames are the Gallery's own: its first sample is
	 * an `Auto` pane, drawn expanded on the reference (photographed 2026-10-01), whose code-behind sets the header to
	 * "Sample Page " and the selected item's number (`NavigationViewPage.xaml.cs:136`), and its
	 * second is a top pane with "This is Header Text" (`NavigationViewPage.xaml:121`). The last
	 * frame's header is shorter than the toggle, so the floor under it is what sets its height.
	 */
	const items: NavigationViewEntry[] = [
		{ id: 'home', content: 'Home', glyph: 'E80F' },
		{ id: 'all', content: 'All', glyph: 'E8A9' }
	];
</script>

<svelte:head><title>NavigationView header — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">NavigationView — the header</h1>

<h2 class="winui-SubtitleTextBlockStyle">left</h2>
<div class="frame" id="left">
	<NavigationView {items} selected="home" paneDisplayMode="left">
		{#snippet header()}Sample Page 1{/snippet}
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">top</h2>
<div class="frame" id="top">
	<NavigationView {items} selected="home" paneDisplayMode="top">
		{#snippet header()}This is Header Text{/snippet}
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">minimal</h2>
<div class="frame" id="minimal">
	<NavigationView {items} selected="home" paneDisplayMode="leftMinimal">
		{#snippet header()}Header{/snippet}
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">short</h2>
<div class="frame" id="short">
	<NavigationView {items} selected="home" paneDisplayMode="left">
		{#snippet header()}<span class="short">Short</span>{/snippet}
	</NavigationView>
</div>

<style>
	/* A block of its own, so the header's height is this element's and not a line box built on
	   the header's own 28-pixel font. */
	.short {
		display: block;
		/* c1-allow: a header deliberately smaller than the 36 floor, not a themed value */
		font-size: 12px;
	}

	.frame {
		height: 240px;
		margin-bottom: 24px;
		overflow: hidden;
		border-radius: var(--winui-OverlayCornerRadius);
		/* c1-allow: 1px is the Gallery's card stroke width, not a tokenized theme value */
		border: 1px solid var(--winui-CardStrokeColorDefaultBrush);
	}

	.frame :global(> *) {
		height: 100%;
	}
</style>
