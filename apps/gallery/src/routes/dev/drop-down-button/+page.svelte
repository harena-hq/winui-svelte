<script lang="ts">
	import { DropDownButton, MenuFlyout } from '@harena-hq/winui-svelte/preview';

	const items = [
		{ id: 'send', text: 'Send', glyph: 'E725' },
		{ id: 'reply', text: 'Reply', glyph: 'E8CA' },
		{ id: 'reply-all', text: 'Reply All', glyph: 'E8C2' }
	];

	/* The component's own harness, not part of the Gallery reproduction: `/dev/` is where each control gets a page to be photographed on, and nothing links to it. */
</script>

<svelte:head><title>DropDownButton — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">DropDownButton</h1>
<p class="winui-BodyTextBlockStyle">Four rows: text label, glyph content, disabled, and open.</p>

<h2 class="winui-SubtitleTextBlockStyle">text label</h2>
<div class="row">
	<MenuFlyout {items}>
		{#snippet children(props)}
			<DropDownButton {...props}>Email</DropDownButton>
		{/snippet}
	</MenuFlyout>
</div>

<h2 class="winui-SubtitleTextBlockStyle">glyph content</h2>
<div class="row">
	<MenuFlyout {items}>
		{#snippet children(props)}
			<DropDownButton {...props} aria-label="Email">
				<span class="glyph" aria-hidden="true">{String.fromCodePoint(0xe715)}</span>
			</DropDownButton>
		{/snippet}
	</MenuFlyout>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row"><DropDownButton disabled>Disabled</DropDownButton></div>

<h2 class="winui-SubtitleTextBlockStyle">open</h2>
<div class="row clear-above">
	<MenuFlyout {items} open>
		{#snippet children(props)}
			<DropDownButton {...props}>Email</DropDownButton>
		{/snippet}
	</MenuFlyout>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}

	/* `MenuFlyout`'s default placement is Top, and a portalled menu is out of flow, so the
	   open sample reserves room above itself or its surface lands on the rows before it.
	   The same 160px the MenuFlyout harness reserves. */
	.clear-above {
		margin-top: 160px;
	}

	.glyph {
		font-family: var(--winui-SymbolThemeFontFamily);
	}
</style>
