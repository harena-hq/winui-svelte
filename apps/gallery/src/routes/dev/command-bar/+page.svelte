<script lang="ts">
	import { AppBarButton, AppBarToggleButton, CommandBar } from '@harena-hq/winui-svelte/preview';
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

{#snippet openOverflowCommands()}
	<AppBarButton label="Accept" />
	<AppBarButton label="Decline" />
	<AppBarButton label="Save" />
	<AppBarButton label="Settings" />
{/snippet}

{#snippet openOverflowCommandsWithIconsAndToggle()}
	<AppBarButton glyph="E8FB" label="Accept" />
	<AppBarButton glyph="E711" label="Decline" />
	<AppBarToggleButton glyph="E896" label="Keep offline" checked />
	<AppBarButton glyph="E713" label="Settings" />
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

<h2 class="winui-SubtitleTextBlockStyle">open</h2>
<div class="row overflow-row">
	<div class="bar-fixed">
		<CommandBar open
			>{@render commands()}{#snippet secondaryCommands()}{@render openOverflowCommands()}{/snippet}</CommandBar
		>
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">open, with icons and a toggle</h2>
<div class="row overflow-row">
	<div class="bar-fixed">
		<CommandBar open
			>{@render commands()}{#snippet secondaryCommands()}{@render openOverflowCommandsWithIconsAndToggle()}{/snippet}</CommandBar
		>
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">open and sticky</h2>
<div class="row overflow-row">
	<div class="bar-fixed">
		<CommandBar open sticky
			>{@render commands()}{#snippet secondaryCommands()}{@render openOverflowCommands()}{/snippet}</CommandBar
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
	/* The overflow menu is portalled and out of flow; 260px clears its tallest 198px surface. */
	.overflow-row {
		margin-bottom: 260px;
	}
	/* Harness furniture: a fixed width gives right-aligned commands room to align against the ellipsis. */
	.bar-fixed {
		width: 480px;
	}
</style>
