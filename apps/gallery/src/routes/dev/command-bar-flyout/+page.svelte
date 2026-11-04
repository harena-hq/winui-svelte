<script lang="ts">
	import { AppBarButton, CommandBarFlyout } from '@harena-hq/winui-svelte/preview';
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
	<CommandBarFlyout open data-testid="labels-collapsed">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" labelPosition="collapsed" />
			<AppBarButton glyph="E105" label="Save" labelPosition="collapsed" />
			<AppBarButton glyph="E74D" label="Delete" labelPosition="collapsed" />
		{/snippet}
	</CommandBarFlyout>
	<CommandBarFlyout open data-testid="wrapped-label">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" />
			<AppBarButton glyph="E105" label="Save a copy" />
		{/snippet}
	</CommandBarFlyout>
	<CommandBarFlyout open data-testid="one-label">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" />
			<AppBarButton glyph="E105" />
			<AppBarButton glyph="E74D" label="Delete" />
		{/snippet}
	</CommandBarFlyout>
	<CommandBarFlyout open data-testid="no-commands">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
	</CommandBarFlyout>
	<CommandBarFlyout open data-testid="disabled-command">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<!-- The disabled command is first so this specimen exercises the walk in
			     `CommandBarFlyoutCommandBar.cpp:1381`: focus goes to the first command that can
			     take it, not to the first command. -->
			<AppBarButton glyph="E105" label="Save" disabled />
			<AppBarButton glyph="E72D" label="Share" />
			<AppBarButton glyph="E74D" label="Delete" />
		{/snippet}
	</CommandBarFlyout>
</div>

<style>
	.specimens {
		display: grid;
		grid-template-columns: repeat(2, auto);
		justify-content: start;
		/* A surface is centred on its trigger and is wider than it, so the column pitch has to
		   clear half of each neighbour rather than just the triggers. Measured at the previous
		   80 and with no left inset: the six-command specimen spanned x 0 to 365 — clamped at
		   the viewport edge on one side and painted over by the next column's specimen, which
		   starts at 266, on the other. */
		gap: 160px 160px;
		padding: 160px 0 160px 120px;
	}
</style>
