<script lang="ts">
	import { TitleBar } from 'winui-svelte/preview';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The four
	 * rows below exercise the conditional parts of the template: the back button's
	 * enabled-vs-disabled pair, title and subtitle, the compact-vs-expanded height, and the
	 * case where only the wide content slot is present.
	 */

	let events = $state<string[]>([]);

	function back(from: string) {
		return () => {
			events = [...events, `${from}: back`];
		};
	}

	function paneToggle(from: string) {
		return () => {
			events = [...events, `${from}: pane toggle`];
		};
	}
</script>

<svelte:head><title>TitleBar — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TitleBar</h1>
<p class="winui-BodyTextBlockStyle">
	One row each, in the same order the unit names them: the back button enabled and disabled, then
	title and subtitle, the compact-height case (no content, no right header), then content alone.
</p>

<h2 class="winui-SubtitleTextBlockStyle">everything on</h2>
<div class="frame">
	<TitleBar
		title="WinUI Gallery"
		iconGlyph="E790"
		backButtonVisible
		paneToggleButtonVisible
		onBackRequested={back('row 1')}
		onPaneToggleRequested={paneToggle('row 1')}
	>
		{#snippet content()}
			<input type="search" placeholder="Search" autocomplete="off" />
		{/snippet}
	</TitleBar>
</div>

<h2 class="winui-SubtitleTextBlockStyle">back button disabled</h2>
<div class="frame">
	<TitleBar
		title="WinUI Gallery"
		iconGlyph="E790"
		backButtonVisible
		backButtonEnabled={false}
		paneToggleButtonVisible
		onBackRequested={back('row 2')}
		onPaneToggleRequested={paneToggle('row 2')}
	>
		{#snippet content()}
			<input type="search" placeholder="Search" autocomplete="off" />
		{/snippet}
	</TitleBar>
</div>

<h2 class="winui-SubtitleTextBlockStyle">title and subtitle</h2>
<div class="frame">
	<TitleBar title="WinUI Gallery" subtitle="Preview" iconGlyph="E790">
		{#snippet content()}
			<input type="search" placeholder="Search" autocomplete="off" />
		{/snippet}
	</TitleBar>
</div>

<h2 class="winui-SubtitleTextBlockStyle">title and icon only — compact height</h2>
<div class="frame">
	<TitleBar title="WinUI Gallery" iconGlyph="E790" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">content only</h2>
<div class="frame">
	<TitleBar>
		{#snippet content()}
			<input type="search" placeholder="Search" autocomplete="off" />
		{/snippet}
	</TitleBar>
</div>

<h2 class="winui-SubtitleTextBlockStyle">events</h2>
<pre class="log">{events.length ? events.join('\n') : 'no button pressed yet'}</pre>

<style>
	/* No height, unlike the NavigationView harness's frame: this control sizes its own row
	   from `TitleBarCompactHeight` or `TitleBarExpandedHeight`, and a frame that stretched
	   it would hide the one distinction three of these four rows exist to show. */
	.frame {
		margin-bottom: 24px;
		overflow: hidden;
		border-radius: var(--winui-OverlayCornerRadius);
		/* c1-allow: 1px is the Gallery's card stroke width, not a tokenized theme value */
		border: 1px solid var(--winui-CardStrokeColorDefaultBrush);
	}

	.log {
		min-height: 3em;
		padding: 12px;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		color: var(--winui-TextFillColorSecondaryBrush);
		white-space: pre-wrap;
		/* c1-allow: a code face is categorical, not a themed value */
		font-family: monospace;
	}
</style>
