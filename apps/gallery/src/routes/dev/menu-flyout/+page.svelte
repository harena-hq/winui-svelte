<script lang="ts">
	import { Button, MenuFlyout, type MenuFlyoutEntry } from 'winui-svelte';

	let checked = $state(['repeat', 'shuffle']);

	const galleryItems: MenuFlyoutEntry[] = [
		{ id: 'reset', text: 'Reset' },
		{ separator: true },
		{ id: 'repeat', text: 'Repeat', toggle: true },
		{ id: 'shuffle', text: 'Shuffle', toggle: true }
	];

	const plainItems: MenuFlyoutEntry[] = [
		{ id: 'cut', text: 'Cut' },
		{ id: 'copy', text: 'Copy' },
		{ separator: true },
		{ id: 'paste', text: 'Paste' }
	];

	const disabledItems: MenuFlyoutEntry[] = [
		{ id: 'enabled', text: 'Enabled item' },
		{ id: 'disabled', text: 'Disabled item', disabled: true },
		{ id: 'toggle', text: 'Toggle item', toggle: true },
		{ id: 'disabled-toggle', text: 'Disabled toggle item', toggle: true, disabled: true }
	];

	const iconItems: MenuFlyoutEntry[] = [
		{ id: 'share', text: 'Share', glyph: 'E72D' },
		{ id: 'copy', text: 'Copy', glyph: 'E8C8' },
		{ id: 'delete', text: 'Delete', glyph: 'E74D' },
		{ separator: true },
		{ id: 'rename', text: 'Rename' },
		{ id: 'select', text: 'Select' }
	];

	const iconAndAcceleratorItems: MenuFlyoutEntry[] = [
		{ id: 'share', text: 'Share', glyph: 'E72D', keyboardAcceleratorTextOverride: 'Ctrl+S' },
		{ id: 'copy', text: 'Copy', glyph: 'E8C8', keyboardAcceleratorTextOverride: 'Ctrl+C' },
		{ id: 'delete', text: 'Delete', glyph: 'E74D', keyboardAcceleratorTextOverride: 'Delete' },
		{ separator: true },
		{ id: 'rename', text: 'Rename' },
		{ id: 'select', text: 'Select' },
		{
			id: 'toggle',
			text: 'Toggle',
			toggle: true,
			glyph: 'E72D',
			keyboardAcceleratorTextOverride: 'Ctrl+T'
		}
	];

	const placementItems = [{ id: 'item', text: 'Menu item' }];
	const placements = [
		'top',
		'bottom',
		'left',
		'right',
		'topEdgeAlignedLeft',
		'topEdgeAlignedRight',
		'bottomEdgeAlignedLeft',
		'bottomEdgeAlignedRight',
		'leftEdgeAlignedTop',
		'leftEdgeAlignedBottom',
		'rightEdgeAlignedTop',
		'rightEdgeAlignedBottom',
		'auto'
	] as const;

	/* Portalled menus are out of flow, so each open sample reserves room for its own surface. */
</script>

<svelte:head><title>MenuFlyout — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">MenuFlyout</h1>
<p class="winui-BodyTextBlockStyle">
	The Gallery example, plain rows without a check column, disabled rows, and every placement.
</p>

<h2 class="winui-SubtitleTextBlockStyle">the Gallery example</h2>
<div class="row clear-above indent">
	<MenuFlyout open items={galleryItems} bind:checked>
		{#snippet children(props)}
			<Button {...props}>Options</Button>
		{/snippet}
	</MenuFlyout>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no check column</h2>
<div class="row clear-above indent">
	<MenuFlyout open items={plainItems}>
		{#snippet children(props)}
			<Button {...props}>Edit</Button>
		{/snippet}
	</MenuFlyout>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row clear-above indent">
	<MenuFlyout open items={disabledItems}>
		{#snippet children(props)}
			<Button {...props}>Actions</Button>
		{/snippet}
	</MenuFlyout>
</div>

<h2 class="winui-SubtitleTextBlockStyle">icons</h2>
<div class="row clear-above indent">
	<MenuFlyout open items={iconItems}>
		{#snippet children(props)}
			<Button {...props}>Edit Options</Button>
		{/snippet}
	</MenuFlyout>
</div>

<h2 class="winui-SubtitleTextBlockStyle">icons and accelerators</h2>
<div class="row clear-above indent">
	<MenuFlyout open items={iconAndAcceleratorItems}>
		{#snippet children(props)}
			<Button {...props}>Edit Options with accelerators</Button>
		{/snippet}
	</MenuFlyout>
</div>

<h2 class="winui-SubtitleTextBlockStyle">placement</h2>
<div class="row placement-row">
	{#each placements as placement (placement)}
		<MenuFlyout open={false} items={placementItems} {placement}>
			{#snippet children(props)}
				<Button {...props}>{placement}</Button>
			{/snippet}
		</MenuFlyout>
	{/each}
</div>

<style>
	.row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 24px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	.clear-above {
		margin-top: 160px;
	}

	/* Keep a centred 100px menu inside the viewport before collision avoidance is needed. */
	.indent {
		padding-left: 100px;
	}

	.placement-row {
		flex-wrap: wrap;
		margin-bottom: 24px;
	}
</style>
