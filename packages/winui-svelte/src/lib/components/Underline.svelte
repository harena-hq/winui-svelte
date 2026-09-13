<script lang="ts" module>
	import type { InlineProps } from '../internal/inline';

	export interface UnderlineProps extends InlineProps {
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
	}: UnderlineProps = $props();
</script>

<!-- Svelte applies directives after `style`, so an inline's props win over that same CSS property. -->
<u
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
	>{@render children?.()}</u
>

<style>
	/* CUnderline::Create sets TextDecorations to TextDecorations::Underline
	   (Inline.cpp:320-340, `:331`). `text-decoration-line` rather than the `text-decoration`
	   shorthand, so that a colour or style set by a caller is not reset by this rule.
	   `EnumDefs.g.h:1873-1877` makes TextDecorations a flags enum whose other member is
	   Strikethrough; no element stands for that one, and nothing in the Gallery writes
	   TextDecorations at all, so this library has no way to spell it yet. See
	   `internal/inline.ts` for the search behind that. */
	.root {
		text-decoration-line: underline;
	}
</style>
