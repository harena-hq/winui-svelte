<script lang="ts">
	import { AppBarButton, CommandBarFlyout } from 'winui-svelte';
</script>

<svelte:head><title>CommandBarFlyout overflow — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">CommandBarFlyout overflow</h1>
<p class="winui-BodyTextBlockStyle">Expanded command rows and their secondary-command surface.</p>

{#snippet trigger(props: Record<string, unknown>)}
	<button {...props}>Open command bar flyout</button>
{/snippet}

<div class="specimens">
	<CommandBarFlyout open expanded placement="bottom" data-testid="expand-down">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" />
			<AppBarButton glyph="E105" label="Save" />
			<AppBarButton glyph="E74D" label="Delete" />
		{/snippet}
		{#snippet secondaryCommands()}
			<AppBarButton glyph="E8B3" label="Select all" />
			<AppBarButton glyph="E8AC" label="Rename" />
			<AppBarButton glyph="E7AC" label="Open with" />
		{/snippet}
	</CommandBarFlyout>

	<CommandBarFlyout open expanded placement="top" data-testid="expand-up">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" />
			<AppBarButton glyph="E105" label="Save" />
			<AppBarButton glyph="E74D" label="Delete" />
		{/snippet}
		{#snippet secondaryCommands()}
			<AppBarButton glyph="E8B3" label="Select all" />
			<AppBarButton glyph="E8AC" label="Rename" />
			<AppBarButton glyph="E7AC" label="Open with" />
		{/snippet}
	</CommandBarFlyout>

	<CommandBarFlyout open expanded placement="bottom" data-testid="wide-overflow">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}<AppBarButton glyph="E72D" label="Share" />{/snippet}
		{#snippet secondaryCommands()}
			<AppBarButton glyph="E8DE" label="Move to a folder somewhere else entirely" />
			<AppBarButton glyph="E8AC" label="Rename" />
		{/snippet}
	</CommandBarFlyout>

	<CommandBarFlyout open expanded placement="bottom" data-testid="chevron">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" flyout />
			<AppBarButton glyph="E105" label="Save" />
		{/snippet}
		{#snippet secondaryCommands()}
			<AppBarButton glyph="E8AC" label="Rename" flyout />
			<AppBarButton glyph="E7AC" label="Open with" />
		{/snippet}
	</CommandBarFlyout>

	<CommandBarFlyout open placement="bottom" data-testid="collapsed">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" />
			<AppBarButton glyph="E105" label="Save" />
			<AppBarButton glyph="E74D" label="Delete" />
		{/snippet}
		{#snippet secondaryCommands()}
			<AppBarButton glyph="E8B3" label="Select all" />
			<AppBarButton glyph="E8AC" label="Rename" />
			<AppBarButton glyph="E7AC" label="Open with" />
		{/snippet}
	</CommandBarFlyout>

	<CommandBarFlyout open expanded placement="top" data-testid="secondary-only-up">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet secondaryCommands()}
			<AppBarButton glyph="E8B3" label="Select all" />
			<AppBarButton glyph="E8AC" label="Rename" />
			<AppBarButton glyph="E7AC" label="Open with" />
		{/snippet}
	</CommandBarFlyout>

	<CommandBarFlyout open expanded placement="bottom" data-testid="secondary-only">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet secondaryCommands()}
			<AppBarButton glyph="E8B3" label="Select all" />
			<AppBarButton glyph="E8AC" label="Rename" />
			<AppBarButton glyph="E7AC" label="Open with" />
		{/snippet}
	</CommandBarFlyout>

	<CommandBarFlyout
		open
		expanded
		placement="bottom"
		overflowButtonVisibility="visible"
		data-testid="primary-only-forced"
	>
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" />
			<AppBarButton glyph="E105" label="Save" />
		{/snippet}
	</CommandBarFlyout>
</div>

<style>
	.specimens {
		display: grid;
		/* `expand-down` grows downward from its trigger and `expand-up` upward from its, so the
		   two reach toward each other and the gap has to clear both. At 320 and a 46-pixel bar
		   they were 24 apart; `HasPrimaryLabels` made each bar 58 and they met — measured on the
		   sealed light baseline, one surface ended at y 626 and the next began at 627. */
		gap: 400px;
		justify-content: start;
		/* The left inset is not decoration: a surface is centred on its trigger, and
		   `wide-overflow`'s is 313 wide against a trigger of 169, so with no inset it is clamped
		   to x = 0 and its shadow is photographed against the viewport edge. */
		padding: 320px 0 320px 160px;
	}
</style>
