<script lang="ts">
	import { RadioButton, RadioButtons } from 'winui-svelte/preview';
</script>

<svelte:head><title>RadioButtons — harness</title></svelte:head>

{#snippet snippetHeader()}<strong>Snippet</strong> header{/snippet}

<h1 class="winui-TitleTextBlockStyle">RadioButtons</h1>

<h2 class="winui-SubtitleTextBlockStyle">a header and three items</h2>
<RadioButtons header="Options:">
	<RadioButton name="one" value="1">Option 1</RadioButton>
	<RadioButton name="one" value="2" checked>Option 2</RadioButton>
	<RadioButton name="one" value="3">Option 3</RadioButton>
</RadioButtons>

<h2 class="winui-SubtitleTextBlockStyle">no header</h2>
<RadioButtons>
	<RadioButton name="no-header" value="1">Option 1</RadioButton>
	<RadioButton name="no-header" value="2" checked>Option 2</RadioButton>
	<RadioButton name="no-header" value="3">Option 3</RadioButton>
</RadioButtons>

<h2 class="winui-SubtitleTextBlockStyle">two columns</h2>
<RadioButtons maxColumns={2}>
	<RadioButton name="two" value="short">Short</RadioButton>
	<RadioButton name="two" value="long">A much longer label</RadioButton>
	<RadioButton name="two" value="mid">Mid</RadioButton>
	<RadioButton name="two" value="x">X</RadioButton>
	<RadioButton name="two" value="another">Another</RadioButton>
</RadioButtons>

<h2 class="winui-SubtitleTextBlockStyle">two groups side by side</h2>
<!-- c1-allow: Samples/Border/BorderPage.xaml:47, the source Grid has ColumnSpacing="8". -->
<div style="display: grid; grid-template-columns: 1fr 1fr; column-gap: 8px">
	<RadioButtons header="Background">
		<RadioButton name="background" value="green">Green</RadioButton>
		<RadioButton name="background" value="yellow">Yellow</RadioButton>
		<RadioButton name="background" value="blue">Blue</RadioButton>
		<RadioButton name="background" value="white" checked>White</RadioButton>
	</RadioButtons>
	<RadioButtons header="BorderBrush">
		<RadioButton name="border-brush" value="green">Green</RadioButton>
		<RadioButton name="border-brush" value="yellow" checked>Yellow</RadioButton>
		<RadioButton name="border-brush" value="blue">Blue</RadioButton>
		<RadioButton name="border-brush" value="white">White</RadioButton>
	</RadioButtons>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<RadioButtons disabled header="Disabled group">
	<RadioButton disabled>Option 1</RadioButton>
	<RadioButton disabled>Option 2</RadioButton>
	<RadioButton disabled>Option 3</RadioButton>
</RadioButtons>

<h2 class="winui-SubtitleTextBlockStyle">a snippet header</h2>
<RadioButtons header={snippetHeader}>
	<RadioButton name="snippet" value="1">Option 1</RadioButton>
	<RadioButton name="snippet" value="2">Option 2</RadioButton>
	<RadioButton name="snippet" value="3">Option 3</RadioButton>
</RadioButtons>
