<script lang="ts">
	import { HyperlinkButton } from 'winui-svelte/preview';
	/* The component's own harness, not part of the Gallery reproduction: `/dev/` is where each control gets a page to be photographed on, and nothing links to it. */
</script>

<svelte:head><title>HyperlinkButton — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">HyperlinkButton</h1>
<p class="winui-BodyTextBlockStyle">
	Four rows, in order: navigating enabled, navigating disabled, click-only enabled, and click-only
	disabled.
</p>
<h2 class="winui-SubtitleTextBlockStyle">navigate enabled</h2>
<div class="row">
	<HyperlinkButton navigateUri="https://www.microsoft.com">Microsoft home page</HyperlinkButton>
</div>
<h2 class="winui-SubtitleTextBlockStyle">navigate disabled</h2>
<div class="row">
	<HyperlinkButton navigateUri="https://www.microsoft.com" disabled
		>Microsoft home page</HyperlinkButton
	>
</div>
<h2 class="winui-SubtitleTextBlockStyle">click enabled</h2>
<div class="row"><HyperlinkButton>Go to ToggleButton</HyperlinkButton></div>
<h2 class="winui-SubtitleTextBlockStyle">click disabled</h2>
<div class="row"><HyperlinkButton disabled>Go to ToggleButton</HyperlinkButton></div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}
</style>
