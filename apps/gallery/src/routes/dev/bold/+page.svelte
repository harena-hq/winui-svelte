<script lang="ts">
	import { Bold, Italic, Span, TextBlock } from 'winui-svelte';
</script>

<svelte:head><title>Bold — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">Bold</h1>
<h2 class="winui-SubtitleTextBlockStyle">in body</h2>
<TextBlock data-testid="in-body" textStyle="BodyTextBlockStyle"
	><Bold>Bold body text</Bold></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">in strong</h2>
<TextBlock data-testid="in-strong" textStyle="BodyStrongTextBlockStyle"
	><Bold data-testid="component-bold">component Bold</Bold>
	<b data-testid="ua-bold">raw b</b></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">nested</h2>
<TextBlock data-testid="nested"
	><Span><Bold>bold <Italic>and italic</Italic></Bold></Span></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">own foreground</h2>
<TextBlock data-testid="own-foreground-host"
	><Bold data-testid="own-foreground" foreground="cornflowerblue">blue Bold</Bold></TextBlock
>
