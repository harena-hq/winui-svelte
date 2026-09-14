<script lang="ts" module>
	export type ColorSpectrumShape = 'box' | 'ring';
	export type ColorSpectrumComponents =
		| 'hueValue'
		| 'valueHue'
		| 'hueSaturation'
		| 'saturationHue'
		| 'saturationValue'
		| 'valueSaturation';

	export interface HsvColor {
		h: number;
		s: number;
		v: number;
		a: number;
	}

	export interface ColorSpectrumProps {
		/** Color. Maps WinUI's `Color`; it seeds `hsvColor` but is not a second bindable state. */
		color?: string;
		/** HsvColor. Maps WinUI's `HsvColor`; the component's bindable source of truth. */
		hsvColor?: HsvColor;
		/** MinHue. */ minHue?: number;
		/** MaxHue. */ maxHue?: number;
		/** MinSaturation. */ minSaturation?: number;
		/** MaxSaturation. */ maxSaturation?: number;
		/** MinValue. */ minValue?: number;
		/** MaxValue. */ maxValue?: number;
		/** Shape. */ shape?: ColorSpectrumShape;
		/**
		 * Components. **The first component is the vertical axis and the second the horizontal
		 * one**, and both run from their maximum at the top or left edge — `FillPixelForBox`
		 * derives every pixel from `yPercent = (d - 1 - y) / (d - 1)` for the first and
		 * `xPercent = (d - 1 - x) / (d - 1)` for the second (`ColorSpectrum.cpp:1108-1160`). The
		 * name reads the other way round, which is why this says so.
		 *
		 * The ring is the other convention: there the first component is angular and the second
		 * radial, with the radial one at its maximum in the centre (`:1284-1295`).
		 */
		components?: ColorSpectrumComponents;
		/** ColorChanged, represented as the current derived CSS color. */
		onColorChange?: (color: string) => void;
		class?: string;
		style?: string;
		/** The interactive input target, following ADR 0009. */ ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// `PressedLarge` is intentionally omitted. WinUI enters that touch/pen-only state, while
	// this library does not currently distinguish contact device types.
</script>

<script lang="ts">
	import { hsvToRgb } from '../internal/color';

	type Channel = 'h' | 's' | 'v';

	let {
		color,
		hsvColor = $bindable({ h: 0, s: 0, v: 1, a: 1 }),
		minHue = 0,
		maxHue = 359,
		minSaturation = 0,
		maxSaturation = 100,
		minValue = 0,
		maxValue = 100,
		shape = 'box',
		components = 'hueSaturation',
		onColorChange,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ColorSpectrumProps = $props();

	let canvas = $state<HTMLCanvasElement>();
	let surface = $state<HTMLDivElement>();
	let side = $state(0);
	let focused = $state(false);
	let lastSeed = $state('');

	const axes = $derived.by((): [Channel, Channel] => {
		switch (components) {
			case 'hueValue':
				return ['h', 'v'];
			case 'valueHue':
				return ['v', 'h'];
			case 'hueSaturation':
				return ['h', 's'];
			case 'saturationHue':
				return ['s', 'h'];
			case 'saturationValue':
				return ['s', 'v'];
			case 'valueSaturation':
				return ['v', 's'];
		}
	});
	const bounds = $derived.by(() => ({
		h: minHue >= maxHue ? [minHue, minHue] : [minHue, maxHue],
		s:
			minSaturation >= maxSaturation
				? [minSaturation, minSaturation]
				: [minSaturation, maxSaturation],
		v: minValue >= maxValue ? [minValue, minValue] : [minValue, maxValue]
	}));
	const rgb = $derived(hsvToRgb(hsvColor.h, hsvColor.s, hsvColor.v));
	const cssColor = $derived(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
	const thumbLight = $derived.by(() => {
		// ColorSpectrum.cpp:1559-1565 keys this on Components, not on the axis order, so
		// `saturationHue` takes the value-forced backdrop exactly as `hueSaturation` does — the
		// same pair the surface is drawn at full value for, twenty lines below.
		const displayed =
			components === 'hueSaturation' || components === 'saturationHue'
				? hsvToRgb(hsvColor.h, hsvColor.s, 1)
				: rgb;
		const linear = (channel: number) =>
			channel <= 10 ? channel / 3294 : Math.pow(channel / 269 + 0.0513, 2.4);
		return (
			0.2126 * linear(displayed.r) + 0.7152 * linear(displayed.g) + 0.0722 * linear(displayed.b) <=
			0.5
		);
	});
	const thumbPosition = $derived.by(() => {
		const first = pointFor(axes[0], hsvValue(axes[0]));
		const second = pointFor(axes[1], hsvValue(axes[1]));
		if (shape === 'box') return { x: 1 - second, y: 1 - first };
		// The inverse of `setFromPoint`'s ring mapping, and it has to be derived from it rather
		// than guessed at. That reads `theta = atan2(radius - y, radius - x) + 180` and
		// `1 - distance / radius` (ColorSpectrum.cpp:1284-1295), so the angle back out is
		// `first * 360` with no offset — the two 180s cancel — and the distance is
		// `(1 - second) * radius`, because the second component is at its maximum in the centre
		// and its minimum at the rim.
		const angle = first * Math.PI * 2;
		const distance = (1 - second) / 2;
		return { x: 0.5 + Math.cos(angle) * distance, y: 0.5 + Math.sin(angle) * distance };
	});

	function range(channel: Channel) {
		return bounds[channel];
	}
	function hsvValue(channel: Channel) {
		return channel === 'h' ? hsvColor.h : hsvColor[channel] * 100;
	}
	function internalValue(channel: Channel, value: number) {
		return channel === 'h' ? value : value / 100;
	}
	function pointFor(channel: Channel, value: number) {
		const [minimum, maximum] = range(channel);
		return maximum === minimum
			? 0
			: Math.min(1, Math.max(0, (value - minimum) / (maximum - minimum)));
	}
	function channelAt(channel: Channel, fraction: number) {
		const [minimum, maximum] = range(channel);
		const value = minimum + (maximum - minimum) * Math.min(1, Math.max(0, fraction));
		return internalValue(channel, value);
	}
	function setFromPoint(x: number, y: number) {
		if (!side) return;
		if (shape === 'ring') {
			const radius = side / 2;
			const dx = x - radius;
			const dy = y - radius;
			const distance = Math.hypot(dx, dy);
			// ColorSpectrum.cpp:528-540 projects an outside point to the circumference.
			if (distance > radius) {
				x = radius + (radius / distance) * dx;
				y = radius + (radius / distance) * dy;
			}
		}
		const denominator = Math.max(1, side - 1);
		const next = { ...hsvColor };
		if (shape === 'ring') {
			const radius = side / 2;
			let theta = (Math.atan2(radius - y, radius - x) * 180) / Math.PI + 180;
			if (theta > 360) theta -= 360;
			next[axes[0]] = channelAt(axes[0], Math.floor(theta) / 360);
			next[axes[1]] = channelAt(axes[1], 1 - Math.hypot(x - radius, y - radius) / radius);
		} else {
			// ColorSpectrum.cpp:1108-1160 — the first component is vertical and the second
			// horizontal, and both are inverted: maximum at the top and at the left.
			next[axes[0]] = channelAt(axes[0], 1 - Math.round(y) / denominator);
			next[axes[1]] = channelAt(axes[1], 1 - Math.round(x) / denominator);
		}
		setHsv(next);
	}
	function setHsv(next: HsvColor) {
		hsvColor = { h: next.h, s: next.s, v: next.v, a: next.a };
		onColorChange?.(toCssColor(hsvColor));
	}
	function toCssColor(value: HsvColor) {
		const next = hsvToRgb(value.h, value.s, value.v);
		return `rgb(${next.r}, ${next.g}, ${next.b})`;
	}
	function updateFromPointer(event: PointerEvent) {
		const rect = surface?.getBoundingClientRect();
		if (!rect) return;
		setFromPoint(event.clientX - rect.left, event.clientY - rect.top);
	}
	function onPointerDown(event: PointerEvent) {
		if (event.button !== 0) return;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		updateFromPointer(event);
	}
	function increment(channel: Channel, direction: 'lower' | 'higher', large: boolean) {
		const [minimum, maximum] = range(channel);
		// WD-083: Ctrl follows WinUI's ColorDisplayNameHelper name table rather than a fixed
		// step. That table is deliberately outside this unit; see docs/divergences.md.
		const amount = large ? (channel === 'h' ? 30 : 10) : 1;
		const current = hsvValue(channel);
		let value = current + (direction === 'higher' ? amount : -amount);
		if (value > maximum) value = current === maximum ? minimum : maximum;
		if (value < minimum) value = current === minimum ? maximum : minimum;
		setHsv({ ...hsvColor, [channel]: internalValue(channel, value) });
	}
	function onKeydown(event: KeyboardEvent) {
		if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
		const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
		const channel = horizontal ? axes[0] : axes[1];
		let lower =
			channel === 'h'
				? event.key === 'ArrowLeft' || event.key === 'ArrowUp'
				: event.key === 'ArrowRight' || event.key === 'ArrowDown';
		const saturationValue = components === 'saturationValue';
		const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
		if (horizontal && rtl !== saturationValue) lower = !lower;
		event.preventDefault();
		increment(channel, lower ? 'lower' : 'higher', event.ctrlKey);
	}
	function seedFromCss(value: string) {
		if (typeof document === 'undefined') return;
		const element = document.createElement('canvas');
		element.width = 1;
		element.height = 1;
		const probe = element.getContext('2d');
		if (!probe) return;
		probe.fillStyle = '#000';
		probe.fillStyle = value;
		probe.fillRect(0, 0, 1, 1);
		const [red, green, blue, alpha] = probe.getImageData(0, 0, 1, 1).data;
		const maximum = Math.max(red, green, blue) / 255;
		const minimum = Math.min(red, green, blue) / 255;
		const chroma = maximum - minimum;
		let hue = 0;
		if (chroma) {
			if (maximum === red / 255) hue = 60 * (((green - blue) / 255 / chroma) % 6);
			else if (maximum === green / 255) hue = 60 * ((blue - red) / 255 / chroma + 2);
			else hue = 60 * ((red - green) / 255 / chroma + 4);
		}
		if (hue < 0) hue += 360;
		setHsv({ h: hue, s: maximum === 0 ? 0 : chroma / maximum, v: maximum, a: alpha / 255 });
	}

	$effect(() => {
		if (color !== undefined && color !== lastSeed) {
			lastSeed = color;
			seedFromCss(color);
		}
	});
	$effect(() => {
		if (!surface) return;
		const target = surface;
		const resize = () => {
			side = Math.max(1, Math.round(Math.min(target.clientWidth, target.clientHeight)));
		};
		resize();
		const observer = new ResizeObserver(resize);
		observer.observe(target);
		return () => observer.disconnect();
	});
	$effect(() => {
		if (!canvas || !side) return;
		const context = canvas.getContext('2d');
		if (!context) return;
		canvas.width = side;
		canvas.height = side;
		const pixels = context.createImageData(side, side);
		// Upstream cross-fades cached slices. Drawing the exact third-dimension slice is exact
		// for value and avoids hue's non-linear RGB interpolation (ColorSpectrum.cpp:844-1000).
		for (let y = 0; y < side; y++)
			for (let x = 0; x < side; x++) {
				const next = { ...hsvColor };
				const radius = side / 2;
				const distance = Math.hypot(x - radius, y - radius);
				if (shape === 'ring' && distance > radius) continue;
				if (shape === 'ring') {
					let theta = (Math.atan2(radius - y, radius - x) * 180) / Math.PI + 180;
					if (theta > 360) theta -= 360;
					next[axes[0]] = channelAt(axes[0], Math.floor(theta) / 360);
					next[axes[1]] = channelAt(axes[1], 1 - distance / radius);
				} else {
					next[axes[0]] = channelAt(axes[0], 1 - y / Math.max(1, side - 1));
					next[axes[1]] = channelAt(axes[1], 1 - x / Math.max(1, side - 1));
				}
				// Hue/Saturation is drawn at full value in the pin; the current value selects
				// the thumb's colour, not this surface's brightness (ColorSpectrum.cpp:1120-1149).
				if (components === 'hueSaturation' || components === 'saturationHue') next.v = 1;
				const pixel = hsvToRgb(next.h, next.s, next.v);
				const index = (y * side + x) * 4;
				pixels.data[index] = pixel.r;
				pixels.data[index + 1] = pixel.g;
				pixels.data[index + 2] = pixel.b;
				pixels.data[index + 3] = 255;
			}
		context.putImageData(pixels, 0, 0);
	});
</script>

<div
	bind:this={ref}
	class={['root', className]}
	{style}
	role="slider"
	aria-valuemin={range(axes[0])[0]}
	aria-valuemax={range(axes[0])[1]}
	aria-valuenow={hsvValue(axes[0])}
	aria-valuetext={cssColor}
	tabindex="0"
	data-color={cssColor}
	data-hsv={`${hsvColor.h},${hsvColor.s},${hsvColor.v},${hsvColor.a}`}
	onkeydown={onKeydown}
	onfocus={() => (focused = true)}
	onblur={() => (focused = false)}
	{...rest}
>
	<div bind:this={surface} class:ring={shape === 'ring'} class="surface">
		<canvas bind:this={canvas} aria-hidden="true"></canvas>
		<div
			role="presentation"
			class="input-target"
			onpointerdown={onPointerDown}
			onpointermove={(event) => event.buttons && updateFromPointer(event)}
		>
			<div
				class:dark={!thumbLight}
				class="thumb"
				style:left={`${thumbPosition.x * 100}%`}
				style:top={`${thumbPosition.y * 100}%`}
			>
				{#if focused}<span class="focus-ring"></span>{/if}
				<span class="selection-ring"></span>
			</div>
		</div>
		<div class="border" aria-hidden="true"></div>
	</div>
</div>

<style>
	/* A `Control`, so `HorizontalAlignment` defaults to `Stretch` and it takes its width from
	   whatever holds it; `ColorPicker.xaml:218` is the only place upstream that gives it one. */
	.root {
		display: block;
	}
	/* `SizingGrid` is square at `min(layoutRoot.ActualWidth(), layoutRoot.ActualHeight())`
	   (`ColorSpectrum.cpp:866-890`), and `:868` draws nothing at all when that is zero — the
	   control never picks a size of its own. `width: 256px` here was ours, not the pin's, and it
	   held: composed into a `ColorPicker` the surface stayed 256 inside a 336 box and left eighty
	   pixels of blank control beside the gradient, which is what the first ColorPicker baseline
	   photographed. The `/dev/` harness is what supplies a width now, as it does for every other
	   control whose size is its parent's to give. */
	.surface {
		position: relative; /* c1-allow: ColorSpectrum's square SizingGrid has no token. */
		width: 100%;
		aspect-ratio: 1;
	}
	canvas,
	.input-target,
	.border {
		position: absolute;
		inset: 0;
	}
	canvas {
		width: 100%;
		height: 100%;
	}
	/* The hit target is square even for a ring, and that is transcribed rather than tidied.
	   `ColorSpectrum.xaml` makes `SpectrumEllipse` and `EllipseBorder` ellipses and leaves
	   `InputTarget` a stretched `Canvas`, so a press in a corner still reaches it — and
	   `ColorSpectrum.cpp:1270-1274` and `:536-540` then project that point onto the
	   circumference rather than discarding it ("bring it back into the circle"). Rounding this
	   element instead makes that projection unreachable: the corner falls through to whatever is
	   behind, and the branch becomes dead code that no test can enter. */
	.ring,
	.ring canvas,
	.ring .border {
		border-radius: 50%;
	}
	.input-target {
		cursor: crosshair;
	}
	.border {
		pointer-events: none; /* c1-allow: ColorPickerBorderStyle sets StrokeThickness=2. */
		border: 2px solid var(--winui-ColorPickerBorderBrush);
	}
	.thumb {
		position: absolute; /* c1-allow: ColorSpectrum.xaml SelectionEllipsePanel is 16×16. */
		width: 16px;
		height: 16px;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}
	.selection-ring,
	.focus-ring {
		position: absolute;
		border-radius: 50%; /* c1-allow: ColorSpectrum.xaml has StrokeThickness=2. */
		border: 2px solid var(--winui-SystemControlBackgroundChromeWhiteBrush);
	}
	.selection-ring {
		inset: 0;
	}
	.thumb.dark .selection-ring {
		border-color: var(--winui-SystemControlBackgroundChromeBlackHighBrush);
	}
	.focus-ring {
		/* c1-allow: ColorSpectrum.xaml FocusEllipse Margin=-2. */
		inset: -2px;
		border-color: var(--winui-SystemControlBackgroundChromeBlackHighBrush);
	}
	.thumb.dark .focus-ring {
		border-color: var(--winui-SystemControlBackgroundChromeWhiteBrush);
	}
	.root:hover .selection-ring {
		opacity: 0.8;
	}
</style>
