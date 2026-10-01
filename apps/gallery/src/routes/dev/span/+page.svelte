<script lang="ts">
	import { Run, Span, TextBlock } from 'winui-svelte/preview';
</script>

<svelte:head><title>Span — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">Span</h1>
<h2 class="winui-SubtitleTextBlockStyle">bare</h2>
<TextBlock data-testid="bare"><Span>Span groups text.</Span></TextBlock>
<h2 class="winui-SubtitleTextBlockStyle">inherited</h2>
<TextBlock data-testid="inherited"
	><Span foreground="cornflowerblue" fontStyle="italic"
		>outer <Run data-testid="span-nested">nested Run</Run></Span
	></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">nested span</h2>
<TextBlock data-testid="nested-span"
	><Span fontWeight={700}><Span fontStyle="italic">nested formatting</Span></Span></TextBlock
>
