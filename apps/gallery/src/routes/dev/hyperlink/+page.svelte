<script lang="ts">
	import { Hyperlink, Span, TextBlock } from 'winui-svelte';
</script>

<svelte:head><title>Hyperlink — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Hyperlink</h1>
<h2 class="winui-SubtitleTextBlockStyle">bare</h2>
<TextBlock data-testid="bare-host"
	>Learn more at <Hyperlink
		data-testid="bare"
		navigateUri="https://learn.microsoft.com/windows/apps/">Windows app development</Hyperlink
	>.</TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">no-underline</h2>
<TextBlock data-testid="no-underline-host"
	>Learn more at <Hyperlink
		data-testid="no-underline"
		navigateUri="https://learn.microsoft.com/windows/apps/"
		underlineStyle="none">Windows app development</Hyperlink
	>.</TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">no-uri</h2>
<TextBlock data-testid="no-uri-host"
	>Click-only <Hyperlink data-testid="no-uri">Hyperlink</Hyperlink>.</TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">not-tab-stop</h2>
<TextBlock data-testid="not-tab-stop-host"
	><Hyperlink
		data-testid="not-tab-stop"
		navigateUri="https://learn.microsoft.com/windows/apps/"
		tabStop={false}>Not a tab stop</Hyperlink
	></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">formatted</h2>
<TextBlock data-testid="formatted-host"
	><Hyperlink
		data-testid="formatted"
		navigateUri="https://learn.microsoft.com/windows/apps/"
		fontWeight={700}
		fontSize={20}>Formatted Hyperlink</Hyperlink
	></TextBlock
>
<h2 class="winui-SubtitleTextBlockStyle">in-span</h2>
<TextBlock data-testid="in-span-host"
	><Span foreground="darkgray"
		>Inherited foreground <Hyperlink
			data-testid="in-span"
			navigateUri="https://learn.microsoft.com/windows/apps/">is overridden</Hyperlink
		></Span
	></TextBlock
>
<!-- `UpdateForegroundColor` consults a locally set Foreground in the rest state only
     (Hyperlink.cpp:611-623), and goes straight to the theme resources for pointer-over and
     pressed (:626-640). This row is where that shows: the colour holds until a pointer is over
     it, and then the theme takes it back. An inline `color` would hold in all three. -->
<h2 class="winui-SubtitleTextBlockStyle">own foreground</h2>
<TextBlock data-testid="own-foreground-host"
	><Hyperlink
		data-testid="own-foreground"
		navigateUri="https://learn.microsoft.com/windows/apps/"
		foreground="cornflowerblue">A Hyperlink with its own Foreground</Hyperlink
	></TextBlock
>
