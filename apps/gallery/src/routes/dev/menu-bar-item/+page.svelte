<script lang="ts">
	import { MenuBar, MenuBarItem, type MenuFlyoutEntry } from '@harena-hq/winui-svelte/preview';

	const items: MenuFlyoutEntry[] = [
		{ id: 'cut', text: 'Cut' },
		{ id: 'copy', text: 'Copy' },
		{ id: 'paste', text: 'Paste' }
	];

	let openItem = $state('open-item');
</script>

<svelte:head><title>MenuBarItem — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">MenuBarItem</h1>
<p class="winui-BodyTextBlockStyle">Plain, disabled, and open menu bar items.</p>

<h2 class="winui-SubtitleTextBlockStyle">plain</h2>
<div class="row">
	<MenuBar><MenuBarItem title="Edit" {items} /></MenuBar>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<MenuBar><MenuBarItem title="Edit" {items} disabled /></MenuBar>
</div>

<h2 class="winui-SubtitleTextBlockStyle">open</h2>
<div class="row open-row">
	<MenuBar bind:open={openItem}>
		<MenuBarItem value="open-item" title="Edit" {items} />
	</MenuBar>
</div>

<style>
	.row {
		/* Gallery sample spacing. */
		margin-bottom: 24px;
	}

	/* A portalled menu is out of flow, so the open sample reserves room below its bar. */
	.open-row {
		margin-bottom: 240px;
	}
</style>
