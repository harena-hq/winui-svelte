<script lang="ts" module>
	export interface EllipseProps {
		/** Fill. The brush that paints the interior. */
		fill?: string;
		/** Stroke. The brush that paints the outline. */
		stroke?: string;
		/** StrokeThickness. The outline width. */
		strokeThickness?: number;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: SVGSVGElement | null;
		[key: string]: unknown;
	}

	// Ellipse defaults Stretch to Fill (core/inc/ellipse.h:15), so it fills the box the caller
	// sizes. The size comes from `style` or `class` and is not a prop — Viewbox.svelte's rule.
	//
	// The stroke is inset by half its thickness for the reason Rectangle.svelte gives in full:
	// XAML draws it inside the element's bounds and SVG centres it on them, so a 100x100 ellipse
	// with a 2px stroke paints exactly 100x100 rather than 102x102.
</script>

<script lang="ts">
	let {
		fill,
		stroke,
		strokeThickness = 1,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: EllipseProps = $props();

	// 0 unless a Stroke brush is set, and the magnitude — core/core/elements/shape.cpp:116-130.
	const thickness = $derived(stroke === undefined ? 0 : Math.abs(strokeThickness));

	// Private, and deliberately not `--winui-` prefixed: that prefix means a design token and
	// gate C9 walks every token a source file reads.
	const rootStyle = $derived(`--shape-stroke-thickness:${thickness}px;${style ?? ''}`);
</script>

<svg bind:this={ref} class={className} style={rootStyle} {...rest}>
	<!-- An absent `fill` is `none`: SVG's default is black and XAML's is nothing. -->
	<ellipse class="geometry" fill={fill ?? 'none'} {stroke}></ellipse>
</svg>

<style>
	.geometry {
		cx: 50%;
		cy: 50%;
		rx: calc(50% - var(--shape-stroke-thickness) / 2);
		ry: calc(50% - var(--shape-stroke-thickness) / 2);
		stroke-width: var(--shape-stroke-thickness);
	}
</style>
