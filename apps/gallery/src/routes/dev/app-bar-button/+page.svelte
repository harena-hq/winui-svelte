<script lang="ts">
	import { AppBarButton } from 'winui-svelte/preview';
</script>

<svelte:head><title>AppBarButton — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">AppBarButton</h1>
<p class="winui-BodyTextBlockStyle">
	Full-size, compact, label-on-right, label-collapsed, disabled, flyout, and overflow appearances.
</p>

<h2 class="winui-SubtitleTextBlockStyle">full size</h2>
<div class="row">
	<AppBarButton glyph="E8FB" label="Accept" />
	<AppBarButton glyph="E713" label="Settings" />
	<AppBarButton glyph="E74E" label="A rather long label" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">compact</h2>
<div class="row">
	<AppBarButton glyph="E8FB" label="Accept" compact />
	<AppBarButton glyph="E713" label="Settings" compact />
	<AppBarButton glyph="E74E" label="A rather long label" compact />
</div>

<h2 class="winui-SubtitleTextBlockStyle">label on right</h2>
<div class="row">
	<AppBarButton glyph="E8FB" label="Accept" labelPosition="right" />
	<AppBarButton glyph="E713" label="Settings" labelPosition="right" />
	<AppBarButton glyph="E74E" label="A rather long label" labelPosition="right" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">label collapsed</h2>
<div class="row">
	<AppBarButton glyph="E8FB" label="Accept" labelPosition="collapsed" />
	<AppBarButton glyph="E713" label="Settings" labelPosition="collapsed" />
	<AppBarButton glyph="E74E" label="A rather long label" labelPosition="collapsed" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<AppBarButton glyph="E8FB" label="Accept" disabled />
	<AppBarButton glyph="E713" label="Settings" labelPosition="right" disabled />
</div>

<h2 class="winui-SubtitleTextBlockStyle">with a flyout</h2>
<div class="row">
	<AppBarButton glyph="E8FB" label="Accept" flyout />
	<AppBarButton glyph="E713" label="Settings" labelPosition="right" flyout />
</div>

<h2 class="winui-SubtitleTextBlockStyle">overflow</h2>
<div class="row">
	<div class="menu">
		<AppBarButton label="Accept" inOverflow />
		<AppBarButton label="Settings" inOverflow keyboardAcceleratorTextOverride="Ctrl+S" />
		<AppBarButton label="A rather long label" inOverflow flyout subMenuOpen />
		<AppBarButton label="Disabled" inOverflow disabled />
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">overflow, with icons and toggles</h2>
<div class="row">
	<div class="menu">
		<AppBarButton glyph="E8FB" label="Accept" inOverflow overflowWithMenuIcons />
		<AppBarButton glyph="E713" label="Settings" inOverflow overflowWithMenuIcons />
		<AppBarButton glyph="E74E" label="A rather long label" inOverflow overflowWithMenuIcons />
	</div>
	<div class="menu">
		<AppBarButton label="Accept" inOverflow overflowWithToggleButtons />
		<AppBarButton label="Settings" inOverflow overflowWithToggleButtons />
		<AppBarButton label="A rather long label" inOverflow overflowWithToggleButtons />
	</div>
	<div class="menu">
		<AppBarButton
			glyph="E8FB"
			label="Accept"
			inOverflow
			overflowWithMenuIcons
			overflowWithToggleButtons
		/>
		<AppBarButton
			glyph="E713"
			label="Settings"
			inOverflow
			overflowWithMenuIcons
			overflowWithToggleButtons
		/>
		<AppBarButton
			glyph="E74E"
			label="A rather long label"
			inOverflow
			overflowWithMenuIcons
			overflowWithToggleButtons
		/>
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
