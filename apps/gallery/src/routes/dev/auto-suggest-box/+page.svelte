<script lang="ts">
	import { AutoSuggestBox } from 'winui-svelte/preview';
	import type { AutoSuggestBoxProps } from 'winui-svelte/preview';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The six
	 * rows below exercise the surface the unit names: empty, with text (so the delete
	 * button is in the snapshot), a query icon, a header and a description, disabled, and
	 * the suggestion list open so it reaches the snapshot.
	 */

	const suggestions: AutoSuggestBoxProps['suggestions'] = [
		'The quick brown fox',
		'jumps over the lazy dog',
		'The five boxing wizards',
		'jump quickly at dawn'
	];

	let empty: AutoSuggestBoxProps['value'] = $state('');
	let withText: AutoSuggestBoxProps['value'] = $state('The quick brown fox');
	let withQueryIcon: AutoSuggestBoxProps['value'] = $state('');
	let headerDescription: AutoSuggestBoxProps['value'] = $state('');
	let disabled: AutoSuggestBoxProps['value'] = $state('Disabled');
	let openValue: AutoSuggestBoxProps['value'] = $state('The');
	let open = $state(true);
</script>

<svelte:head><title>AutoSuggestBox — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">AutoSuggestBox</h1>
<p class="winui-BodyTextBlockStyle">
	Six rows, in the order the unit names them: empty with a placeholder, with text (so the delete
	button is in the snapshot), a query icon, a header and a description, disabled, and the suggestion
	list open so it reaches the snapshot.
</p>

<h2 class="winui-SubtitleTextBlockStyle">empty</h2>
<div class="row">
	<AutoSuggestBox bind:value={empty} placeholder="Type a query" {suggestions} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">with text</h2>
<div class="row">
	<AutoSuggestBox bind:value={withText} placeholder="Type a query" {suggestions} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a query icon</h2>
<div class="row">
	<AutoSuggestBox bind:value={withQueryIcon} placeholder="Search" queryIcon="E721" {suggestions} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a header and a description</h2>
<div class="row">
	<AutoSuggestBox
		header="Query"
		description="Find anything in the catalogue."
		bind:value={headerDescription}
		placeholder="Type a query"
		{suggestions}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<AutoSuggestBox bind:value={disabled} placeholder="Type a query" {suggestions} disabled />
</div>

<h2 class="winui-SubtitleTextBlockStyle">open</h2>
<div class="row">
	<AutoSuggestBox bind:value={openValue} bind:open placeholder="Type a query" {suggestions} />
</div>

<div class="tail"></div>

<style>
	/* The last row's popup is open in the snapshot; without room below it Floating UI
	   flips it upward over the row above, which would hide that row from the baseline. */
	.tail {
		height: 220px;
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
		max-width: 320px;
	}
</style>
