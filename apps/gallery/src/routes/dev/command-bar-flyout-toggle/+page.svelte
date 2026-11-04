<script lang="ts">
	import {
		AppBarButton,
		AppBarToggleButton,
		CommandBarFlyout
	} from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>CommandBarFlyout toggle commands — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">CommandBarFlyout toggle commands</h1>
<p class="winui-BodyTextBlockStyle">
	The flyout's skin on AppBarToggleButton, on the bar and in the overflow.
</p>

{#snippet trigger(props: Record<string, unknown>)}
	<button {...props}>Open command bar flyout</button>
{/snippet}

<div class="specimens">
	<CommandBarFlyout open placement="bottom" data-testid="bar-toggles">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarToggleButton glyph="E8DD" label="Bold" labelPosition="collapsed" checked />
			<AppBarToggleButton glyph="E8DB" label="Italic" labelPosition="collapsed" />
			<AppBarButton glyph="E72D" label="Share" labelPosition="collapsed" />
		{/snippet}
		{#snippet secondaryCommands()}
			<AppBarButton label="Select all" />
		{/snippet}
	</CommandBarFlyout>

	<CommandBarFlyout open expanded placement="bottom" data-testid="overflow-plain">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" />
		{/snippet}
		{#snippet secondaryCommands()}
			<AppBarToggleButton label="Word wrap" checked />
			<AppBarToggleButton label="Show ruler" />
			<AppBarButton label="Select all" />
		{/snippet}
	</CommandBarFlyout>

	<CommandBarFlyout open expanded placement="bottom" data-testid="overflow-icons">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarButton glyph="E72D" label="Share" />
		{/snippet}
		{#snippet secondaryCommands()}
			<AppBarToggleButton glyph="E8DD" label="Bold" checked />
			<AppBarToggleButton glyph="E8DB" label="Italic" />
			<AppBarButton glyph="E8AC" label="Rename" />
		{/snippet}
	</CommandBarFlyout>

	<CommandBarFlyout open placement="bottom" data-testid="bar-toggles-labels">
		{#snippet children(props)}{@render trigger(props)}{/snippet}
		{#snippet commands()}
			<AppBarToggleButton glyph="E8DD" label="Bold" checked />
			<AppBarToggleButton glyph="E8DB" label="Italic" />
			<AppBarButton glyph="E72D" label="Share" />
		{/snippet}
		{#snippet secondaryCommands()}
			<AppBarButton label="Select all" />
		{/snippet}
	</CommandBarFlyout>
</div>

<style>
	.specimens {
		display: grid;
		gap: 280px;
		justify-content: start;
		/* A surface is centred on its trigger, so a specimen wider than the trigger is clamped to
		   x = 0 and photographs its shadow against the viewport edge without this inset. */
		padding: 300px 0 300px 160px;
	}
</style>
