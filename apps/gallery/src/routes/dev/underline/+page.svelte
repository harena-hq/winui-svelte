<script lang="ts">
	import { Bold, TextBlock, Underline } from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>Underline — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">Underline</h1>
<h2 class="winui-SubtitleTextBlockStyle">bare</h2>
<TextBlock data-testid="bare-host"
	><Underline data-testid="bare">Underlined text</Underline></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">wrapping Bold</h2>
<TextBlock data-testid="wrapping-bold-host"
	><Underline data-testid="wrapping-bold"><Bold>underlined Bold</Bold></Underline></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">own foreground</h2>
<TextBlock data-testid="own-foreground-host"
	><Underline data-testid="own-foreground" foreground="cornflowerblue">blue underline</Underline
	></TextBlock
>
