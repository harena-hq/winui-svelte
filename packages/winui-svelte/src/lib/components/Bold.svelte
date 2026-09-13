<script lang="ts" module>
	import type { InlineProps } from '../internal/inline';

	export interface BoldProps extends InlineProps {
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
	}: BoldProps = $props();
</script>

<!-- Svelte applies directives after `style`, so an inline's props win over that same CSS property. -->
<b
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
	>{@render children?.()}</b
>

<style>
	/* `<b>` is HTML's element for text set apart without added importance, which is what XAML's
	   Bold is, but its user-agent value is `bolder` — relative. Measured in the browser that
	   writes this repository's baselines: inside a container at 600, a bare `<b>` computes 900.
	   CBold::Create writes an absolute value (Inline.cpp:382-403, `:393`
	   `CoreFontWeight::Bold`, which EnumDefs.g.h:673 gives as 700), so the absolute value is
	   written here and the user agent's is not relied on. */
	.root {
		/* c1-allow: Inline.cpp:393 — CBold::Create sets FontWeight to CoreFontWeight::Bold, 700. */
		font-weight: 700;
	}
</style>
