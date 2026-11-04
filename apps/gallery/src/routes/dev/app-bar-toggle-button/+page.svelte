<script lang="ts">
	import { AppBarToggleButton } from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>AppBarToggleButton — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">AppBarToggleButton</h1>
<p class="winui-BodyTextBlockStyle">
	Full-size, compact, label-on-right, label-collapsed, disabled, indeterminate, and overflow
	appearances.
</p>

<h2 class="winui-SubtitleTextBlockStyle">full size — unchecked and checked</h2>
<div class="row">
	<AppBarToggleButton glyph="E8FB" label="Unchecked" />
	<AppBarToggleButton glyph="E8FB" label="Checked" checked />
</div>

<h2 class="winui-SubtitleTextBlockStyle">label on right — unchecked and checked</h2>
<div class="row">
	<AppBarToggleButton glyph="E8FB" label="Unchecked" labelPosition="right" />
	<AppBarToggleButton glyph="E8FB" label="Checked" labelPosition="right" checked />
</div>

<h2 class="winui-SubtitleTextBlockStyle">compact</h2>
<div class="row">
	<AppBarToggleButton glyph="E8FB" label="Unchecked" compact />
	<AppBarToggleButton glyph="E8FB" label="Checked" compact checked />
</div>

<h2 class="winui-SubtitleTextBlockStyle">label collapsed</h2>
<div class="row">
	<AppBarToggleButton glyph="E8FB" label="Unchecked" labelPosition="collapsed" />
	<AppBarToggleButton glyph="E8FB" label="Checked" labelPosition="collapsed" checked />
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled — unchecked and checked</h2>
<div class="row">
	<AppBarToggleButton glyph="E8FB" label="Disabled" disabled />
	<AppBarToggleButton glyph="E8FB" label="Checked disabled" disabled checked />
</div>

<h2 class="winui-SubtitleTextBlockStyle">indeterminate vs unchecked</h2>
<div class="row">
	<AppBarToggleButton glyph="E8FB" label="Indeterminate" indeterminate threeState />
	<AppBarToggleButton glyph="E8FB" label="Unchecked" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">overflow</h2>
<div class="row">
	<div class="menu">
		<AppBarToggleButton label="Checked" inOverflow checked />
		<AppBarToggleButton label="Unchecked" inOverflow />
		<AppBarToggleButton glyph="E8FB" label="With icon" inOverflow overflowWithMenuIcons />
		<AppBarToggleButton label="Disabled" inOverflow disabled />
	</div>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}

	/* Harness furniture: the dev page gives overflow rows a flyout surface to sit on. The
	   CommandBar overflow presenter this stands in for is not built until v7 unit 6. */
	.menu {
		width: 300px;
		padding: 4px 0;
		/* c1-allow: the harness's own surface, standing in for a presenter this version has not
		   built; no WinUI resource names it */
		border: 1px solid var(--winui-SurfaceStrokeColorFlyout);
		background: var(--winui-FlyoutPresenterBackground);
	}
</style>
