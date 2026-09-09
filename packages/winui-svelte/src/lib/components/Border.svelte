<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface BorderProps {
		/** Background. A CSS colour or image, as the brush. */
		background?: string;
		/** BorderBrush. A CSS colour. */
		borderBrush?: string;
		/** BorderThickness. XAML's own grammar — a number, or `"8"`, `"8,5"`, `"1,2,3,4"`. */
		borderThickness?: number | string;
		/** CornerRadius. XAML's own grammar — a number, or `"4"`, `"4,8,12,16"`. */
		cornerRadius?: number | string;
		/** Padding. XAML's own grammar, as BorderThickness. */
		padding?: number | string;
		/** BackgroundSizing. Whether the background paints under the border; Border's default is InnerBorderEdge. */
		backgroundSizing?: 'innerBorderEdge' | 'outerBorderEdge';
		/** Child — the one element inside, as the default snippet. */
		children?: Snippet;
		class?: string;
		style?: string;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// ChildTransitions and BackgroundTransition are motion, roadmap item 14. Child is not a
	// property here: the default snippet is the child.
</script>

<script lang="ts">
	import { cornerRadiusToCss, thicknessToCss } from '../internal/thickness';

	let {
		background,
		borderBrush,
		borderThickness = 0,
		cornerRadius,
		padding,
		backgroundSizing = 'innerBorderEdge',
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: BorderProps = $props();
</script>

<!-- Svelte applies directives after `style`, so a Border prop wins over that same CSS property. -->
<div
	bind:this={ref}
	class={['root', className]}
	{style}
	style:background
	style:border-color={borderBrush}
	style:border-width={thicknessToCss(borderThickness)}
	style:border-radius={cornerRadius === undefined ? undefined : cornerRadiusToCss(cornerRadius)}
	style:padding={padding === undefined ? undefined : thicknessToCss(padding)}
	style:background-clip={backgroundSizing === 'innerBorderEdge' ? 'padding-box' : 'border-box'}
	{...rest}
>
	{@render children?.()}
</div>

<style>
	/* Border has no theme dictionary upstream: it paints only values supplied by its caller.
	   `display: block` is XAML's HorizontalAlignment="Stretch" default in a stacking parent;
	   it shrinks to content under flex-start/justify-items: start, as the display pane's
	   HorizontalContentAlignment="Left" requires. */
	.root {
		display: block;
		box-sizing: border-box;
		border-style: solid;
		border-width: 0;
	}
</style>
