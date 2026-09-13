<script lang="ts" module>
	import type { InlineProps } from '../internal/inline';

	export interface ItalicProps extends InlineProps {
		ref?: HTMLElement | null;
	}
</script>

<script lang="ts">
	let {
		fontFamily,
		fontSize,
		fontStyle,
		fontWeight,
		foreground,
		characterSpacing,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ItalicProps = $props();
</script>

<!-- Svelte applies directives after `style`, so an inline's props win over that same CSS property. -->
<i
	bind:this={ref}
	class={['root', className]}
	{style}
	{...rest}
	style:font-family={fontFamily}
	style:font-size={typeof fontSize === 'number' ? `${fontSize}px` : fontSize}
	style:font-style={fontStyle}
	style:font-weight={fontWeight}
	style:color={foreground}
	style:letter-spacing={characterSpacing === undefined ? undefined : `${characterSpacing / 1000}em`}
	>{@render children?.()}</i
>

<style>
	/* CItalic::Create sets FontStyle to FontStyle::Italic (Inline.cpp:351-371, `:362`).
	   `<i>`'s user-agent value is already `italic`, and writing it makes the transcription
	   visible at its site rather than borrowed from a stylesheet this library does not own. */
	.root {
		font-style: italic;
	}
</style>
