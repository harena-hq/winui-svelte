<script lang="ts" module>
	export interface LineProps {
		/** X1. The first point's x. */
		x1?: number;
		/** Y1. The first point's y. */
		y1?: number;
		/** X2. The second point's x. */
		x2?: number;
		/** Y2. The second point's y. */
		y2?: number;
		/** Stroke. The brush that paints the line. */
		stroke?: string;
		/** StrokeThickness. The line's width. */
		strokeThickness?: number;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: SVGSVGElement | null;
		[key: string]: unknown;
	}

	// Line defaults Stretch to None (core/inc/shape.h:119), so its box is the geometry's right and
	// bottom edges plus half the stroke — `ApplyContentStretch`, shape.cpp:1297-1298 — and the
	// paint is allowed outside that box, which XAML does not clip. `Polygon.svelte` gives the
	// argument in full; the `overflow: visible` below is what it comes to here. For a line those
	// edges are `max(x1, x2)` and `max(y1, y2)`, so a line drawn right-to-left has the same box
	// as the same line drawn left-to-right.
	//
	// Shape.Fill exists on Line because Line derives from Shape, but a line has no interior for a
	// brush to paint, and SVG's `<line>` has no fill either. Adding the prop would publish a
	// member that cannot do anything.
</script>

<script lang="ts">
	let {
		x1 = 0,
		y1 = 0,
		x2 = 0,
		y2 = 0,
		stroke,
		strokeThickness = 1,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: LineProps = $props();

	// 0 unless a Stroke brush is set, and the magnitude — core/core/elements/shape.cpp:116-130.
	const thickness = $derived(stroke === undefined ? 0 : Math.abs(strokeThickness));
	const size = $derived({
		width: Math.max(0, Math.max(x1, x2) + thickness / 2),
		height: Math.max(0, Math.max(y1, y2) + thickness / 2)
	});
	// Private, and deliberately not `--winui-` prefixed: that prefix means a design token and
	// gate C9 walks every token a source file reads.
	const rootStyle = $derived(
		`--shape-stroke-thickness:${thickness}px;` +
			`width:${size.width}px;height:${size.height}px;${style ?? ''}`
	);
</script>

<svg bind:this={ref} class={className} style={rootStyle} {...rest}>
	<line class="geometry" {x1} {y1} {x2} {y2} {stroke}></line>
</svg>

<style>
	svg {
		/* The module comment's rule: the box is the geometry's positive extent and the paint is
		   allowed past it. A UA gives an outermost `<svg>` `overflow: hidden`. */
		overflow: visible;
	}

	.geometry {
		stroke-width: var(--shape-stroke-thickness);
		/* No `stroke-miterlimit` here, and its absence is deliberate: a Line is one segment with
		   no join, so the limit `Polygon.svelte` and `Path.svelte` carry has nothing to decide. */
	}
</style>
