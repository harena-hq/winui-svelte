<script lang="ts" module>
	export interface ImageProps {
		/** Source, as the URI an `ImageSource` would carry. */
		source?: string;
		/** Stretch. Image's default is Uniform — `mediabase.h:145`. */
		stretch?: 'none' | 'fill' | 'uniform' | 'uniformToFill';
		/** NineGrid. XAML's Thickness grammar — a number, or `"3"`, `"3,3"`, `"30,20,30,20"`. */
		nineGrid?: number | string;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// No CImage implementation is in the pin: `class CImage;` appears in
	// ImageAutomationPeer.h:6, while the readings below come from CMediaBase and from measuring
	// the original. ComputeScaleFactor maps Uniform to the minimum scale (mediabase.cpp:161),
	// UniformToFill to the maximum (:164), Fill to both (:167), and None to no scale (:136).
	// The reference guest's 100x100 Image over a 400x268 source draws None as the top-left
	// 100x100 (mean absolute difference 0), Uniform as a vertically centred 100x67 image
	// (16px above, 17px below), and UniformToFill as the left 100px of a 149x100 cover (5.65
	// mean absolute difference, against 34.58 for the centre crop). Overflow is clipped from
	// the start; underflow is centred.
	//
	// Deliberately absent: Source as an ImageSource object. XAML's BitmapImage and SvgImageSource
	// carry UriSource, DecodePixelWidth, DecodePixelHeight, AutoPlay, Play() and Stop(); this
	// component takes the URI alone. DecodePixelWidth and DecodePixelHeight are WD-054; AutoPlay,
	// Play() and Stop() are WD-053.
	//
	// ImageOpened and ImageFailed (Image.g.h:63-68) are the element's DOM load and error events,
	// which pass through `...rest` unchanged, so props would be second names for published events.
	// GetAsCastingSource and GetAlphaMask (Image_Partial.h:21, :23) are its only two methods:
	// Miracast and an alpha channel handed to Composition. Neither has a web counterpart, and no
	// Gallery page calls either.
</script>

<script lang="ts">
	import { thicknessToCss } from '../internal/thickness';

	let {
		source,
		stretch = 'uniform',
		nineGrid,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ImageProps = $props();

	const gridWidth = $derived(nineGrid === undefined ? undefined : thicknessToCss(nineGrid));
	// `border-image-slice` counts source pixels and takes no unit, so it is the same four values
	// with `px` dropped rather than a second reading of the same thickness.
	const gridSlice = $derived(gridWidth?.replaceAll('px', ''));

	let aspect = $state<number | null>(null);

	$effect(() => {
		if (nineGrid === undefined || source === undefined) return;
		// `new Image()` inside a component called `Image` resolves to this module's own export,
		// so the probe is created through the document instead.
		const probe = document.createElement('img');
		const done = () =>
			(aspect = probe.naturalHeight > 0 ? probe.naturalWidth / probe.naturalHeight : null);
		probe.addEventListener('load', done);
		probe.src = source;
		return () => probe.removeEventListener('load', done);
	});

	// The painted rectangle, not the element. Upstream composes the two: `Stretch` decides the
	// rectangle the brush paints into and `NineGrid` decides how the source maps onto it. Measured
	// on the reference guest, where a StackPanel stretches the Image to 196 and the nine-grid
	// example still paints 164 wide, 16px in from each edge — Uniform inside a stretched slot.
	const paintStyle = $derived(
		`border-width:${gridWidth};border-image-source:url(${JSON.stringify(source ?? '')});` +
			`border-image-slice:${gridSlice} fill;` +
			`border-image-width:${gridWidth};` +
			`aspect-ratio:${aspect ?? 'auto'}`
	);
</script>

{#if nineGrid === undefined}
	<img
		bind:this={ref}
		alt=""
		src={source}
		class={className}
		{style}
		data-stretch={stretch}
		{...rest}
	/>
{:else}
	<div bind:this={ref} class={['nine-grid', className]} {style} role="img" {...rest}>
		<div class="paint" style={paintStyle}></div>
	</div>
{/if}

<style>
	/* Stretch is `object-fit`: ComputeScaleFactor takes the minimum of the two axis scales for
	   Uniform (mediabase.cpp:161), the maximum for UniformToFill (:164), both for Fill (:167),
	   and returns early for None (:136).

	   `object-position` is the other half, and it is measured rather than read: the original
	   clips an overflowing image from its start and centres an underflowing one. On the reference
	   guest a 100x100 Image over a 400x268 source draws the top-left 100x100 under None — an exact
	   match, mean absolute difference 0 — and the left 100 of the 149x100 cover under
	   UniformToFill, which fits at 5.65 against 34.58 for the centre crop.

	   Uniform never overflows, so it keeps the initial centred `object-position`. Measured there
	   too: the original splits a 33px remainder 16 above and 17 below, and CSS's centring splits it
	   17 and 16. One pixel, in one direction, only when the remainder is odd. */
	img {
		display: block;
	}
	img[data-stretch='fill'] {
		object-fit: fill;
	}
	img[data-stretch='uniform'] {
		object-fit: contain;
	}
	img[data-stretch='uniformToFill'] {
		object-fit: cover;
		object-position: left top;
	}
	/* WD-055: `left top` is right for the overflow this mode always has, and wrong for the one
	   case `mediabase.cpp:497-504` centres — an element larger than the source. */
	img[data-stretch='none'] {
		object-fit: none;
		object-position: left top;
	}

	/* NineGrid is a Composition nine-grid brush upstream — WUCBrushManager.cpp:319-326 sets one
	   inset per side and an inverse realization scale, so the corners keep their source size while
	   the edges and centre stretch. `border-image` with `stretch` and `fill` is the same
	   construction; the four border widths are what reserve the corners, so `border-box` is what
	   keeps the painted box the size it computed. `border-color` is never painted — the border
	   image replaces it — but a border with no style is not painted at all.

	   Two boxes, because a nine-grid Image is still an Image: the outer one is the element the
	   caller sizes and a parent may stretch, and the inner one is the rectangle the brush paints.
	   The inner box takes its width from the source's ratio against the element's height, which is
	   Uniform — the only stretch mode this reproduction composes with a nine grid, WD-056. */
	.nine-grid {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.paint {
		box-sizing: border-box;
		height: 100%;
		border-style: solid;
		border-color: transparent;
		border-image-repeat: stretch;
	}
</style>
