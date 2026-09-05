<script lang="ts">
	import { Button } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The four
	 * rows below exercise the three variants WinUI defines — `DefaultButtonStyle` at
	 * Button_themeresources.xaml:154, `AccentButtonStyle` at :235 and `SubtleButtonStyle`
	 * at :297 — in the four states each template names (Normal, PointerOver, Pressed,
	 * Disabled), plus the two template-bound edge cases: a long label to show the
	 * default variant does not clip, and a glyph-only content to show the root does not
	 * assume its content is text.
	 */

	// E8C8 is `Cancel` in Segoe Fluent Icons; the icon column reads it as `String.fromCodePoint`
	// the way `NavigationViewItem.svelte` reads `E8A7` and friends.
	const GLYPH = 'E8C8';
</script>

<svelte:head><title>Button — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Button</h1>
<p class="winui-BodyTextBlockStyle">
	Four rows, in the order the unit names them: the three variants enabled, the three variants
	disabled, a long label to show nothing clips it, and a glyph-only content to show the root does
	not assume its content is text.
</p>

<h2 class="winui-SubtitleTextBlockStyle">variants enabled</h2>
<div class="row">
	<Button>Default</Button>
	<Button variant="accent">Accent</Button>
	<Button variant="subtle">Subtle</Button>
</div>

<h2 class="winui-SubtitleTextBlockStyle">variants disabled</h2>
<div class="row">
	<Button disabled>Default</Button>
	<Button variant="accent" disabled>Accent</Button>
	<Button variant="subtle" disabled>Subtle</Button>
</div>

<h2 class="winui-SubtitleTextBlockStyle">long label</h2>
<div class="row">
	<Button>A very long label that the default variant does not clip</Button>
</div>

<h2 class="winui-SubtitleTextBlockStyle">glyph content</h2>
<div class="row">
	<Button variant="accent" aria-label="Cancel">
		<span class="glyph">{String.fromCodePoint(parseInt(GLYPH, 16))}</span>
	</Button>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;
	}

	.glyph {
		font-family: var(--winui-SymbolThemeFontFamily);
		/* `CaptionTextBlockFontSize` lands the glyph inside the padding the way the rest
		   of the Gallery's icon column does — see `NavigationViewItem.svelte` for the
		   same shape with a measurement of its own. */
		font-size: var(--winui-CaptionTextBlockFontSize);
		line-height: normal;
	}
</style>
