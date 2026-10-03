<script lang="ts">
	import { AutoSuggestBox, PasswordBox, TextBox } from 'winui-svelte/preview';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. Every row
	 * below lets its controls take their own width rather than the row's, which is the case
	 * WD-100 was about: a box sized by its content is as wide as its text, or its placeholder
	 * while it has none, and no narrower than `TextControlThemeMinWidth`.
	 */

	let empty = $state('');
	let placeholder = $state('');
	let typed = $state('Hello world, this is typed');
	let withHeader = $state('');
	let password = $state('');
	let query = $state('');
	let longQuery = $state('');
	let narrow = $state('A line of text longer than the row that holds it');
	let floor = $state('');
</script>

<svelte:head><title>Text control widths — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Text control widths</h1>
<p class="winui-BodyTextBlockStyle">
	Each control sits in a row that does not stretch it: empty, with a placeholder, with text, with a
	header wider than its placeholder, and each of the other two single-line text controls; then a box
	whose text is wider than its row, and one in a row narrower than the floor.
</p>

<h2 class="winui-SubtitleTextBlockStyle">TextBox</h2>
<div class="row">
	<TextBox data-testid="empty" bind:value={empty} />
	<TextBox
		data-testid="placeholder"
		bind:value={placeholder}
		placeholder="Search controls and samples..."
	/>
	<TextBox data-testid="typed" bind:value={typed} />
	<TextBox
		data-testid="header"
		header="Enter your name:"
		bind:value={withHeader}
		placeholder="Name"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">PasswordBox and AutoSuggestBox</h2>
<div class="row">
	<PasswordBox data-testid="password" bind:value={password} placeholder="Enter your password" />
	<AutoSuggestBox data-testid="query" bind:value={query} placeholder="Search" queryIcon="E721" />
	<AutoSuggestBox
		data-testid="long-query"
		bind:value={longQuery}
		placeholder="Search controls and samples..."
		queryIcon="E721"
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">text wider than its row</h2>
<div class="row narrow">
	<TextBox data-testid="narrow" bind:value={narrow} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a row narrower than the floor</h2>
<div class="row narrower">
	<TextBox data-testid="floor" bind:value={floor} />
</div>

<style>
	.row {
		display: flex;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}
	.narrow {
		max-width: 240px;
	}
	.narrower {
		max-width: 40px;
	}
</style>
