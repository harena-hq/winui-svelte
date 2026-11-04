<script lang="ts">
	import { TextBox } from '@harena-hq/winui-svelte/preview';
	import type { TextBoxProps } from '@harena-hq/winui-svelte/preview';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The seven
	 * rows below exercise the surface the unit names: empty, with text, read-only,
	 * disabled, multi-line, with a header, and with a header and description — seven
	 * states on a single control.
	 */

	let empty: TextBoxProps['value'] = $state('');
	let withText: TextBoxProps['value'] = $state('Hello, world');
	let readOnly: TextBoxProps['value'] = $state('Read-only text');
	let disabled: TextBoxProps['value'] = $state('Disabled text');
	let multiLine: TextBoxProps['value'] = $state('Line one\nLine two');
	let withHeader: TextBoxProps['value'] = $state('');
	let withHeaderDescription: TextBoxProps['value'] = $state('');
	let withHeaderDescriptionDisabled: TextBoxProps['value'] = $state('Prefilled');
</script>

<svelte:head><title>TextBox — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TextBox</h1>
<p class="winui-BodyTextBlockStyle">
	Seven rows, in the order the unit names them: empty with a placeholder, with text, read-only, with
	text disabled, multi-line, with a header, and with a header and a description.
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

<h2 class="winui-SubtitleTextBlockStyle">a header</h2>
<div class="row">
	<TextBox header="Enter your name:" bind:value={withHeader} placeholder="Name" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a header and a description</h2>
<div class="row">
	<TextBox header="Name" description="Your full legal name." bind:value={withHeaderDescription} />
	<TextBox
		header="Name"
		description="Your full legal name."
		bind:value={withHeaderDescriptionDisabled}
		disabled
	/>
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
