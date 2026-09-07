<script lang="ts">
	import { AppBarButton, CommandBar } from 'winui-svelte';
</script>

<svelte:head><title>CommandBar — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">CommandBar</h1>
<p class="winui-BodyTextBlockStyle">The closed command bar row and its command appearances.</p>

{#snippet commands()}
	<AppBarButton glyph="E710" label="Add" />
	<AppBarButton glyph="E70F" label="Edit" />
	<AppBarButton glyph="E72D" label="Share" />
	<AppBarButton glyph="E713" label="Settings" />
{/snippet}

{#snippet overflowCommands()}
	<AppBarButton glyph="E8FB" label="Accept" />
{/snippet}

<h2 class="winui-SubtitleTextBlockStyle">compact</h2>
<div class="row">
	<div class="bar-fixed">
		<CommandBar
			>{@render commands()}{#snippet secondaryCommands()}{@render overflowCommands()}{/snippet}</CommandBar
		>
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">labels on the right</h2>
<div class="row">
	<div class="bar-fixed">
		<CommandBar defaultLabelPosition="right"
			>{@render commands()}{#snippet secondaryCommands()}{@render overflowCommands()}{/snippet}</CommandBar
		>
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">labels collapsed</h2>
<div class="row">
	<div class="bar-fixed">
		<CommandBar defaultLabelPosition="collapsed"
			>{@render commands()}{#snippet secondaryCommands()}{@render overflowCommands()}{/snippet}</CommandBar
		>
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">with content</h2>
<div class="row">
	<div class="bar-fixed">
		<CommandBar
			>{@render commands()}{#snippet content()}<span>A title in the content slot</span
				>{/snippet}{#snippet secondaryCommands()}{@render overflowCommands()}{/snippet}</CommandBar
		>
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no secondary commands</h2>
<div class="row">
	<div class="bar">
		<CommandBar>{@render commands()}</CommandBar>
	</div>
	<div class="bar-fixed">
		<CommandBar overflowButtonVisibility="visible">{@render commands()}</CommandBar>
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled, minimal, and hidden</h2>
<div class="row">
	<div class="bar-fixed">
		<CommandBar disabled
			>{@render commands()}{#snippet secondaryCommands()}{@render overflowCommands()}{/snippet}</CommandBar
		>
	</div>
	<div class="bar-fixed">
		<CommandBar closedDisplayMode="minimal"
			>{@render commands()}{#snippet secondaryCommands()}{@render overflowCommands()}{/snippet}</CommandBar
		>
	</div>
	<div class="bar-fixed">
		<CommandBar closedDisplayMode="hidden"
			>{@render commands()}{#snippet secondaryCommands()}{@render overflowCommands()}{/snippet}</CommandBar
		>
	</div>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}
	/* Harness furniture: a fixed width gives right-aligned commands room to align against the ellipsis. */
	.bar-fixed {
		width: 480px;
	}
</style>
