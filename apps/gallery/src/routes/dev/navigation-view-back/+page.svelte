<script lang="ts">
	import { NavigationView, type NavigationViewEntry } from '@harena-hq/winui-svelte/preview';

	/*
	 * The back button — `IsBackButtonVisible`, `IsBackEnabled` and `BackRequested`.
	 *
	 * **Nothing photographs this page.** Every assertion in `navigation-view-back.spec.ts` is
	 * about where a box sits and what a press did; `/dev/navigation-view` keeps the three tracked
	 * baselines, and its left and top frames leave the member at its default, so the button is in
	 * them.
	 */
	const items: NavigationViewEntry[] = [
		{ id: 'home', content: 'Home', glyph: 'E80F' },
		{ id: 'all', content: 'All', glyph: 'E8A9' }
	];

	let requests = $state(0);
</script>

<svelte:head><title>NavigationView back button — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">NavigationView — the back button</h1>
<p class="winui-BodyTextBlockStyle">
	Upstream defaults the button to Auto, which is Visible everywhere but on an Xbox, and draws it
	disabled until the app says there is somewhere to go back to.
</p>

<h2 class="winui-SubtitleTextBlockStyle">left — the default</h2>
<div class="frame" id="left-default">
	<!-- The handler is here so that a request from the disabled button would be counted. -->
	<NavigationView {items} selected="home" paneDisplayMode="left" onBackRequested={() => requests++}>
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">left — collapsed</h2>
<div class="frame" id="left-collapsed">
	<NavigationView {items} selected="home" paneDisplayMode="left" backButtonVisible="collapsed">
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">compact — enabled</h2>
<div class="frame" id="compact-enabled">
	<NavigationView
		{items}
		selected="home"
		paneDisplayMode="leftCompact"
		backEnabled
		onBackRequested={() => requests++}
	>
		<p class="winui-BodyTextBlockStyle">Content sits beside the rail.</p>
	</NavigationView>
</div>
<pre class="log" id="requests">{requests}</pre>

<!-- The minimal frames carry a header, because the room the buttons take beside it is part of
     what a minimal pane changes. -->
<h2 class="winui-SubtitleTextBlockStyle">minimal — the default</h2>
<div class="frame" id="minimal">
	<NavigationView {items} selected="home" paneDisplayMode="leftMinimal">
		{#snippet header()}Header{/snippet}
		<p class="winui-BodyTextBlockStyle">Content sits under the toggle.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">minimal — collapsed</h2>
<div class="frame" id="minimal-collapsed">
	<NavigationView
		{items}
		selected="home"
		paneDisplayMode="leftMinimal"
		backButtonVisible="collapsed"
	>
		{#snippet header()}Header{/snippet}
		<p class="winui-BodyTextBlockStyle">Content sits under the toggle.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">minimal — enabled</h2>
<div class="frame" id="minimal-enabled">
	<NavigationView {items} selected="home" paneDisplayMode="leftMinimal" backEnabled>
		{#snippet header()}Header{/snippet}
		<p class="winui-BodyTextBlockStyle">Content sits under the toggle.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">minimal — no toggle</h2>
<div class="frame" id="minimal-no-toggle">
	<NavigationView
		{items}
		selected="home"
		paneDisplayMode="leftMinimal"
		paneToggleButtonVisible={false}
	>
		{#snippet header()}Header{/snippet}
		<p class="winui-BodyTextBlockStyle">Content sits under the back button.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">top — the default</h2>
<div class="frame" id="top-default">
	<NavigationView {items} selected="home" paneDisplayMode="top">
		<p class="winui-BodyTextBlockStyle">Content sits below the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">top — collapsed</h2>
<div class="frame" id="top-collapsed">
	<NavigationView {items} selected="home" paneDisplayMode="top" backButtonVisible="collapsed">
		<p class="winui-BodyTextBlockStyle">Content sits below the pane.</p>
	</NavigationView>
</div>

<style>
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

	.log {
		min-height: 2em;
		padding: 12px;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		color: var(--winui-TextFillColorSecondaryBrush);
		white-space: pre-wrap;
		/* c1-allow: a code face is categorical, not a themed value */
		font-family: monospace;
	}
</style>
