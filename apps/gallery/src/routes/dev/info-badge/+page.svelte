<script lang="ts">
	import { InfoBadge } from 'winui-svelte/preview';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The four
	 * rows below exercise every variant in the dot, value and icon display kinds, followed
	 * by the value edge cases the unit names.
	 */
</script>

<svelte:head><title>InfoBadge — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">InfoBadge</h1>
<p class="winui-BodyTextBlockStyle">
	Four rows, in the order the unit names them: dot, value, icon, and value edge cases.
</p>

<h2 class="winui-SubtitleTextBlockStyle">dot</h2>
<div class="row">
	<InfoBadge variant="default" />
	<InfoBadge variant="attention" />
	<InfoBadge variant="informational" />
	<InfoBadge variant="success" />
	<InfoBadge variant="caution" />
	<InfoBadge variant="critical" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">value</h2>
<div class="row">
	<InfoBadge variant="default" value={10} />
	<InfoBadge variant="attention" value={10} />
	<InfoBadge variant="informational" value={10} />
	<InfoBadge variant="success" value={10} />
	<InfoBadge variant="caution" value={10} />
	<InfoBadge variant="critical" value={10} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">icon</h2>
<div class="row">
	<InfoBadge variant="default" glyph="F13C" />
	<InfoBadge variant="attention" glyph="EA38" />
	<InfoBadge variant="informational" glyph="F13F" />
	<InfoBadge variant="success" glyph="E8FB" />
	<InfoBadge variant="caution" glyph="E171" />
	<InfoBadge variant="critical" glyph="E711" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">value edge cases</h2>
<div class="row">
	<InfoBadge variant="default" value={0} />
	<InfoBadge variant="default" value={5} />
	<InfoBadge variant="default" value={100} />
	<InfoBadge variant="default" value={-1} />
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		/* c1-allow: the harness's own row spacing; no WinUI resource names it */
		gap: 24px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
