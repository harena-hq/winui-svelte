<script lang="ts" module>
	export interface PolygonProps {
		/** Fill. The brush that paints the polygon interior. */
		fill?: string;
		/** Stroke. The brush that paints the polygon outline. */
		stroke?: string;
		/** StrokeThickness. The outline width. */
		strokeThickness?: number;
		/** Points. The XAML point-list string. */
		points?: string;
		/** FillRule. The rule used for overlapping polygon regions. */
		fillRule?: 'evenOdd' | 'nonzero';
		class?: string;
		style?: string;
		ref?: SVGSVGElement | null;
		[key: string]: unknown;
	}

	// Polygon defaults Stretch to None (core/inc/shape.h:119). Its desired size is the geometry's
	// right and bottom edges (shape.cpp:597-600), including any offset from the origin. Unlike
	// Fill shapes, it does not inset its coordinates; its size includes the stroke's right/bottom
	// overhang so the painted extent is preserved.
</script>

<script lang="ts">
	let {
		fill,
		stroke,
		strokeThickness = 1,
		points = '',
		fillRule = 'evenOdd',
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: PolygonProps = $props();

	const thickness = $derived(stroke === undefined ? 0 : Math.abs(strokeThickness));
	const size = $derived.by(() => {
		const values = points
			.split(/[\s,]+/)
			.filter(Boolean)
			.map(Number);
		let maxX = 0;
		let maxY = 0;
		let hasPoint = false;
		for (let index = 0; index + 1 < values.length; index += 2) {
			const x = values[index];
			const y = values[index + 1];
			if (Number.isFinite(x) && Number.isFinite(y)) {
				hasPoint = true;
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			}
		}
		if (!hasPoint) return { width: 0, height: 0 };
		return { width: maxX + thickness / 2, height: maxY + thickness / 2 };
	});
	// Private, and deliberately not `--winui-` prefixed: that prefix means a design token and
	// gate C9 walks every token a source file reads.
	const rootStyle = $derived(
		`--shape-stroke-thickness:${thickness}px;` +
			`width:${size.width}px;height:${size.height}px;${style ?? ''}`
	);
</script>

<svg bind:this={ref} class={className} style={rootStyle} {...rest}>
	<!-- An absent `fill` is `none`: SVG's default is black and XAML's is nothing. And SVG's
	     default fill rule is `nonzero` where Polygon's is EvenOdd (core/inc/polygon.h:12), which
	     shows only where the outline crosses itself. -->
	<polygon
		class="geometry"
		{points}
		fill={fill ?? 'none'}
		{stroke}
		fill-rule={fillRule === 'evenOdd' ? 'evenodd' : 'nonzero'}
	></polygon>
</svg>

<style>
	.geometry {
		stroke-width: var(--shape-stroke-thickness);
	}
</style>
