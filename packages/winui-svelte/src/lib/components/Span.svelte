<script lang="ts" module>
	import type { InlineProps } from '../internal/inline';

	export interface SpanProps extends InlineProps {
		ref?: HTMLSpanElement | null;
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
	}: SpanProps = $props();
</script>

<!-- Svelte applies directives after `style`, so an inline's props win over that same CSS property. -->
<span
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
	>{@render children?.()}</span
>

<style>
	/* A Span is a grouping element, and its only job is to be a place where inherited formatting
	   can be set for everything nested inside it — which is what a bare inline `<span>` already
	   is. The declaration below writes that down; everything visible arrives through the props. */
	.root {
		display: inline;
	}
</style>
