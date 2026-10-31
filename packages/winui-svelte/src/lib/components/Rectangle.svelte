<script lang="ts" module>
	export interface RectangleProps {
		/** Fill. The brush that paints the interior. */
		fill?: string;
		/** Stroke. The brush that paints the outline. */
		stroke?: string;
		/** StrokeThickness. The outline width. */
		strokeThickness?: number;
		/** RadiusX. The horizontal corner radius. */
		radiusX?: number;
		/** RadiusY. The vertical corner radius. */
		radiusY?: number;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: SVGSVGElement | null;
		[key: string]: unknown;
	}

	// Rectangle defaults Stretch to Fill (core/inc/rectangle.h:30), so it fills the box the
	// caller sizes rather than drawing at coordinates of its own. The size comes from `style`
	// or `class` and is not a prop, which is the rule Viewbox.svelte states.
	//
	// **XAML draws the stroke inside the element and SVG centres it on the edge.** The geometry
	// is laid on a rect deflated by half the stroke thickness — `m_rc = GetOutlineRect(TRUE)`,
	// core/core/elements/rectangle.cpp:235 — so a 100x100 rectangle with a 2px stroke paints
	// exactly 100x100, which is what the reference machine's own Shape page measures. The same
	// SVG without the inset paints 102x102. The inset is expressed as CSS on the geometry rather
	// than computed here, which is what lets the caller keep the sizing.
	//
	// The corner radii apply to that inset rect unchanged, clamped to half its width and height
	// (rectangle.cpp:820-827). The browser clamps `rx` the same way, so nothing clamps them here.
</script>

<script lang="ts">
	let {
		fill,
		stroke,
		strokeThickness = 1,
		radiusX = 0,
		radiusY = 0,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: RectangleProps = $props();

	// StrokeThickness is 0 unless a Stroke brush is set, and its magnitude is used —
	// core/core/elements/shape.cpp:116-130, whose own comment gives the reason: otherwise the
	// fill region is deflated and the edge is antialiased against nothing.
	const thickness = $derived(stroke === undefined ? 0 : Math.abs(strokeThickness));

	// Three private channels, deliberately without the `--winui-` prefix: that prefix means a
	// design token, gate C9 walks every token a source file reads, and these are per-instance
	// values the token layer neither defines nor should.
	const rootStyle = $derived(
		`--shape-stroke-thickness:${thickness}px;--shape-radius-x:${radiusX}px;` +
			`--shape-radius-y:${radiusY}px;${style ?? ''}`
	);
</script>

<svg bind:this={ref} class={className} style={rootStyle} {...rest}>
	<!-- SVG's default fill is black and XAML's is nothing, so an absent `fill` is `none` here
	     and never omitted. -->
	<rect class="geometry" fill={fill ?? 'none'} {stroke}></rect>
</svg>

<style>
	.geometry {
		x: calc(var(--shape-stroke-thickness) / 2);
		y: calc(var(--shape-stroke-thickness) / 2);
		width: calc(100% - var(--shape-stroke-thickness));
		height: calc(100% - var(--shape-stroke-thickness));
		rx: var(--shape-radius-x);
		ry: var(--shape-radius-y);
		stroke-width: var(--shape-stroke-thickness);
	}
</style>
