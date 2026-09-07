<script lang="ts">
	import { SplitButton } from 'winui-svelte';

	const items = [
		{ id: 'red', text: 'Red' },
		{ id: 'green', text: 'Green' },
		{ id: 'blue', text: 'Blue' }
	];

	/* The component's own harness, not part of the Gallery reproduction: `/dev/` is where each control gets a page to be photographed on, and nothing links to it. */
</script>

<svelte:head><title>SplitButton — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">SplitButton</h1>
<p class="winui-BodyTextBlockStyle">Four rows: text label, glyph content, disabled, and open.</p>

<h2 class="winui-SubtitleTextBlockStyle">text label</h2>
<div class="row">
	<SplitButton {items} onclick={() => {}}>Choose colour</SplitButton>
</div>

<h2 class="winui-SubtitleTextBlockStyle">glyph content</h2>
<div class="row">
	<SplitButton {items} aria-label="Choose colour" onclick={() => {}}>
		<span class="glyph" aria-hidden="true">{String.fromCodePoint(0xe790)}</span>
	</SplitButton>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row"><SplitButton disabled>Disabled</SplitButton></div>

<h2 class="winui-SubtitleTextBlockStyle">open</h2>
<div class="row clear-below">
	<SplitButton {items} open onclick={() => {}}>Choose colour</SplitButton>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}

	/* SplitButton places its menu BottomEdgeAlignedLeft (SplitButton.cpp:226), so a portalled
	   menu needs room below rather than above. This last row only needs to keep the surface
	   inside the 720px viewport at which the baselines are photographed. */
	.clear-below {
		margin-bottom: 160px;
	}

	.glyph {
		font-family: var(--winui-SymbolThemeFontFamily);
	}
</style>
