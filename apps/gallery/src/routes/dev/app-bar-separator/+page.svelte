<script lang="ts">
	import { AppBarButton, AppBarSeparator } from 'winui-svelte';
</script>

<svelte:head><title>AppBarSeparator — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">AppBarSeparator</h1>
<p class="winui-BodyTextBlockStyle">Full-size, compact, and overflow appearances.</p>

<h2 class="winui-SubtitleTextBlockStyle">full size</h2>
<div class="row">
	<div class="bar">
		<AppBarButton glyph="E8FB" label="Accept" />
		<AppBarSeparator />
		<AppBarButton glyph="E713" label="Settings" />
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">compact</h2>
<div class="row">
	<div class="bar">
		<AppBarButton glyph="E8FB" label="Accept" compact />
		<AppBarSeparator compact />
		<AppBarButton glyph="E713" label="Settings" compact />
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">overflow</h2>
<div class="row">
	<div class="menu">
		<AppBarButton label="Accept" inOverflow />
		<AppBarSeparator inOverflow />
		<AppBarButton label="Settings" inOverflow />
	</div>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}

	/* A separator stretches to its parent. `AppBarThemeMinHeight` is what an AppBarButton's
	   content root measures, so a row of that height is what a bar command sits in. */
	.bar {
		display: flex;
		height: var(--winui-AppBarThemeMinHeight);
	}

	/* Harness furniture: the dev page gives overflow rows a flyout surface to sit on. The
	   CommandBar overflow presenter this stands in for is not built until v7 unit 6. */
	.menu {
		width: 300px;
		padding: 4px 0;
		/* c1-allow: the harness's own surface, standing in for a presenter this version has
		   not built; no WinUI resource names it */
		border: 1px solid var(--winui-SurfaceStrokeColorFlyout);
		background: var(--winui-FlyoutPresenterBackground);
	}
</style>
