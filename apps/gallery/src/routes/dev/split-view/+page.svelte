<script lang="ts">
	import { SplitView } from 'winui-svelte';
</script>

<svelte:head><title>SplitView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">SplitView</h1>
<p class="winui-BodyTextBlockStyle">The transitions are not photographed: every row is at rest.</p>

<h2 class="winui-SubtitleTextBlockStyle">overlay, closed</h2>
<div class="frame">
	<SplitView openPaneLength={200} {pane}><div class="content-text">Content</div></SplitView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">overlay, open</h2>
<div class="frame">
	<SplitView openPaneLength={200} paneOpen {pane}><div class="content-text">Content</div></SplitView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">inline, open</h2>
<div class="frame">
	<SplitView openPaneLength={200} displayMode="inline" paneOpen {pane}
		><div class="content-text">Content</div></SplitView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">compactOverlay, closed</h2>
<div class="frame">
	<SplitView openPaneLength={200} displayMode="compactOverlay" {pane}
		><div class="content-text">Content</div></SplitView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">compactOverlay, open</h2>
<div class="frame">
	<SplitView openPaneLength={200} displayMode="compactOverlay" paneOpen {pane}
		><div class="content-text">Content</div></SplitView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">compactInline, closed</h2>
<div class="frame">
	<SplitView openPaneLength={200} displayMode="compactInline" {pane}
		><div class="content-text">Content</div></SplitView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">compactInline, open</h2>
<div class="frame">
	<SplitView openPaneLength={200} displayMode="compactInline" paneOpen {pane}
		><div class="content-text">Content</div></SplitView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">right, inline open</h2>
<div class="frame">
	<SplitView openPaneLength={200} displayMode="inline" panePlacement="right" paneOpen {pane}
		><div class="content-text">Content</div></SplitView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">right, compactOverlay closed</h2>
<div class="frame">
	<SplitView openPaneLength={200} displayMode="compactOverlay" panePlacement="right" {pane}
		><div class="content-text">Content</div></SplitView
	>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a pane background and lengths</h2>
<div class="frame">
	<SplitView
		paneBackground="#FFD700"
		openPaneLength={160}
		compactPaneLength={64}
		displayMode="compactInline"
		{pane}><div class="content-text">Content</div></SplitView
	>
</div>

{#snippet pane()}
	<div class="pane-text">Pane</div>
{/snippet}

<style>
	.frame {
		width: 400px; /* c1-allow: harness layout. */
		height: 200px; /* c1-allow: harness layout. */
	}
	.pane-text,
	.content-text {
		padding: 12px; /* c1-allow: harness layout. */
	}
</style>
