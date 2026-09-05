<script lang="ts">
	import { TextBox } from 'winui-svelte';
	import type { TextBoxProps } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The five
	 * rows below exercise the surface the unit names: empty, with text, read-only,
	 * disabled, and multi-line — five states on a single control.
	 */

	let empty: TextBoxProps['value'] = $state('');
	let withText: TextBoxProps['value'] = $state('Hello, world');
	let readOnly: TextBoxProps['value'] = $state('Read-only text');
	let disabled: TextBoxProps['value'] = $state('Disabled text');
	let multiLine: TextBoxProps['value'] = $state('Line one\nLine two');
</script>

<svelte:head><title>TextBox — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TextBox</h1>
<p class="winui-BodyTextBlockStyle">
	Five rows, in the order the unit names them: empty with a placeholder, with text, read-only, with
	text, disabled, and multi-line.
</p>

<h2 class="winui-SubtitleTextBlockStyle">empty</h2>
<div class="row">
	<TextBox bind:value={empty} placeholder="Type here" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">with text</h2>
<div class="row">
	<TextBox bind:value={withText} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">read-only</h2>
<div class="row">
	<TextBox bind:value={readOnly} readonly />
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<TextBox bind:value={disabled} disabled />
</div>

<h2 class="winui-SubtitleTextBlockStyle">multi-line</h2>
<div class="row">
	<TextBox bind:value={multiLine} placeholder="Multi-line" acceptsReturn />
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
		max-width: 580px;
	}
</style>
