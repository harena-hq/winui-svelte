<script lang="ts">
	import { Bold, Italic, TextBlock } from 'winui-svelte/preview';
</script>

<svelte:head><title>Italic — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">Italic</h1>
<h2 class="winui-SubtitleTextBlockStyle">bare</h2>
<TextBlock data-testid="bare-host"><Italic data-testid="bare">Italic text</Italic></TextBlock>
<h2 class="winui-SubtitleTextBlockStyle">in bold</h2>
<TextBlock data-testid="in-bold-host"
	><Bold><Italic data-testid="in-bold">Bold italic text</Italic></Bold></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">own font</h2>
<TextBlock data-testid="own-font-host"
	><Italic data-testid="own-font" fontFamily="Times New Roman" fontSize={20}
		>Times New Roman italic</Italic
	></TextBlock
>
