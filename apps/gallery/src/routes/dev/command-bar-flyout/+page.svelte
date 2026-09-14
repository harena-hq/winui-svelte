<script lang="ts">
	import { AppBarButton, CommandBarFlyout } from 'winui-svelte';
</script>

<svelte:head><title>CommandBarFlyout — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">CommandBarFlyout</h1>
<p class="winui-BodyTextBlockStyle">The closed command row in its flyout surface.</p>

{#snippet trigger(props: Record<string, unknown>)}
	<button {...props}>Open command bar flyout</button>
{/snippet}

<div class="specimens">
	<CommandBarFlyout open data-testid="default">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" />
			<AppBarButton glyph="E105" label="Save" />
			<AppBarButton glyph="E74D" label="Delete" />
		{/snippet}
	</CommandBarFlyout>
	<CommandBarFlyout open data-testid="single">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}<AppBarButton glyph="E72D" label="Share" />{/snippet}
	</CommandBarFlyout>
	<CommandBarFlyout open data-testid="many">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" />
			<AppBarButton glyph="E105" label="Save" />
			<AppBarButton glyph="E74D" label="Delete" />
			<AppBarButton glyph="E710" label="Add" />
			<AppBarButton glyph="E70F" label="Edit" />
			<AppBarButton glyph="E713" label="Settings" />
		{/snippet}
	</CommandBarFlyout>
	<CommandBarFlyout open data-testid="disabled-command">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" />
			<AppBarButton glyph="E105" label="Save" disabled />
			<AppBarButton glyph="E74D" label="Delete" />
		{/snippet}
	</CommandBarFlyout>
</div>

<style>
	.specimens {
		display: grid;
		grid-template-columns: repeat(2, auto);
		justify-content: start;
		gap: 160px 80px;
		padding: 160px 0;
	}
</style>
