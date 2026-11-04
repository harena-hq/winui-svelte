<script lang="ts">
	import { Button, ToolTip } from '@harena-hq/winui-svelte/preview';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The six
	 * rows below exercise the surface the unit names — the pointer-anchored default, each
	 * of the four named placements, and one that is open and stays open so the control
	 * reaches a snapshot at all.
	 */

	let openByDefault = $state(true);
</script>

<svelte:head><title>ToolTip — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ToolTip</h1>
<p class="winui-BodyTextBlockStyle">
	Six rows, in the order the unit names them: the pointer-anchored default, each of the four named
	placements, and one that is open and stays open so the control reaches a snapshot at all.
</p>

<h2 class="winui-SubtitleTextBlockStyle">pointer-anchored</h2>
<div class="row">
	<ToolTip content="Simple ToolTip">
		{#snippet children(props)}
			<Button {...props}>Button with a simple ToolTip.</Button>
		{/snippet}
	</ToolTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">placement: top</h2>
<div class="row">
	<ToolTip content="On the top side" placement="top">
		{#snippet children(props)}
			<Button {...props}>Top</Button>
		{/snippet}
	</ToolTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">placement: bottom</h2>
<div class="row">
	<ToolTip content="On the bottom side" placement="bottom">
		{#snippet children(props)}
			<Button {...props}>Bottom</Button>
		{/snippet}
	</ToolTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">placement: left</h2>
<div class="row">
	<ToolTip content="On the left side" placement="left">
		{#snippet children(props)}
			<Button {...props}>Left</Button>
		{/snippet}
	</ToolTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">placement: right</h2>
<div class="row">
	<ToolTip content="On the right side" placement="right">
		{#snippet children(props)}
			<Button {...props}>Right</Button>
		{/snippet}
	</ToolTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">open by default</h2>
<div class="row">
	<ToolTip content="Stays open" placement="top" bind:open={openByDefault}>
		{#snippet children(props)}
			<Button {...props}>Open</Button>
		{/snippet}
	</ToolTip>
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
		max-width: 580px;
	}
</style>
