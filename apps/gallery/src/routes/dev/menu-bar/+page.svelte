<script lang="ts">
	import { MenuBar, MenuBarItem, type MenuFlyoutEntry } from 'winui-svelte/preview';

	const fileItems: MenuFlyoutEntry[] = [
		{ id: 'new', text: 'New' },
		{ id: 'open', text: 'Open' },
		{ id: 'save', text: 'Save' },
		{ id: 'exit', text: 'Exit' }
	];

	const editItems: MenuFlyoutEntry[] = [
		{ id: 'undo', text: 'Undo' },
		{ id: 'cut', text: 'Cut' },
		{ id: 'copy', text: 'Copy' },
		{ id: 'paste', text: 'Paste' }
	];

	const helpItems: MenuFlyoutEntry[] = [{ id: 'about', text: 'About' }];

	const acceleratorItems: MenuFlyoutEntry[] = [
		{ id: 'new', text: 'New', keyboardAcceleratorTextOverride: 'Ctrl+N' },
		{ id: 'open', text: 'Open', keyboardAcceleratorTextOverride: 'Ctrl+O' },
		{ id: 'save', text: 'Save', keyboardAcceleratorTextOverride: 'Ctrl+S' }
	];

	let openMenu = $state('open-edit');
</script>

<svelte:head><title>MenuBar — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">MenuBar</h1>
<p class="winui-BodyTextBlockStyle">
	Closed menus, keyboard accelerators, both icon forms, and an open menu.
</p>

<h2 class="winui-SubtitleTextBlockStyle">closed</h2>
<div class="row">
	<MenuBar>
		<MenuBarItem title="File" items={fileItems} />
		<MenuBarItem title="Edit" items={editItems} />
		<MenuBarItem title="Help" items={helpItems} />
	</MenuBar>
</div>

<h2 class="winui-SubtitleTextBlockStyle">with accelerators</h2>
<div class="row open-row">
	<MenuBar open="acc-file">
		<MenuBarItem value="acc-file" title="File" items={acceleratorItems} />
	</MenuBar>
</div>

{#snippet star()}<span class="star">{String.fromCodePoint(0xe735)}</span>{/snippet}

<h2 class="winui-SubtitleTextBlockStyle">with icons</h2>
<div class="row open-row">
	<MenuBar open="icons-edit">
		<MenuBarItem
			value="icons-edit"
			title="Edit"
			items={[
				{ id: 'copy', text: 'Copy', glyph: 'E8A5' },
				{ id: 'paste', text: 'Paste', glyph: 'E8E5' },
				{ id: 'save', text: 'Save', glyph: 'E74E' },
				{ id: 'favorite', text: 'Favorite', icon: star }
			]}
		/>
	</MenuBar>
</div>

<h2 class="winui-SubtitleTextBlockStyle">open</h2>
<div class="row open-row">
	<MenuBar bind:open={openMenu}>
		<MenuBarItem value="open-file" title="File" items={fileItems} />
		<MenuBarItem value="open-edit" title="Edit" items={editItems} />
		<MenuBarItem value="open-help" title="Help" items={helpItems} />
	</MenuBar>
</div>

<style>
	.row {
		/* Gallery sample spacing. */
		margin-bottom: 24px;
	}

	/* A portalled menu is out of flow, so every row that opens one reserves room below its bar.
	   A closed menu bar photographs three words; the rows that demonstrate an accelerator, an
	   icon column or an open item have to be open or the baseline guards nothing. */
	.open-row {
		margin-bottom: 240px;
	}

	.star {
		font-family: var(--winui-SymbolThemeFontFamily);
	}
</style>
