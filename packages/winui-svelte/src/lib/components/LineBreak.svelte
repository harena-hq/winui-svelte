<script lang="ts" module>
	export interface LineBreakProps {
		class?: string;
		style?: string;
		ref?: HTMLBRElement | null;
		[key: string]: unknown;
	}

	// LineBreak carries TextElement's inherited formatting upstream, but the only thing it can
	// change is the height of the line it ends — layout this library takes from the container.
</script>

<script lang="ts">
	let { class: className, style, ref = $bindable(null), ...rest }: LineBreakProps = $props();
</script>

<!-- One element, and no styles at all.

     XAML's LineBreak is one character — CLineBreak::GetRun returns U+2028 LINE SEPARATOR
     (LineBreak.cpp:35) — so a trailing one opens a final line with nothing on it. CSS's `<br>`
     does not: measured on the browser that writes this repository's baselines, a `nowrap` block
     reading `one<br>two<br>` is 38px, exactly as tall as `one<br>two`, where one line is 19px.

     The empty inline box that puts that line back lives on `TextBlock`, not here. It was a
     sibling of this `<br>` first, and that is wrong in a way only the baseline showed: an inline
     box at the start of a line means the whitespace after it is no longer *at* the start of the
     line, so a template that writes a newline after `<LineBreak />` — which is what a wrapped
     paragraph looks like — indents the next line by a space. Measured on the Gallery's own fourth
     example: 3.84px of indent that XAML does not produce. On the block the same box costs
     nothing, because a space after a break is then genuinely first on its line and collapses.

     It also belongs there on the pin's own reading. The break emits a character; the final line
     is the *paragraph layout's* answer to a character at the end of its text. So every container
     that lays out inlines carries the rule, and `RichTextBlock` and `Paragraph` will each need
     their own when they arrive. -->
<br bind:this={ref} class={className} {style} {...rest} />
