<script lang="ts" module>
	import type {
		ColorSpectrumComponents as SpectrumComponents,
		ColorSpectrumShape as SpectrumShape
	} from './ColorSpectrum.svelte';
	export type { ColorSpectrumComponents, ColorSpectrumShape } from './ColorSpectrum.svelte';
	export interface ColorPickerProps {
		/**
		 * Color. A CSS colour string, as ColorSpectrum's own `color` is — WinUI's `Color` is an
		 * `{A,R,G,B}` struct and has no string form. **CSS's eight-digit hex is `#RRGGBBAA`**, the
		 * reverse of the `#AARRGGBB` a XAML literal writes, so a colour ported from XAML must be
		 * reordered. The component publishes back in `rgb(r g b / a)` form, which is what
		 * `SetColorAndUpdateControls` does upstream (`ColorPicker.cpp:518-526`).
		 */
		color?: string;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. Upstream signals this as the `ColorChanged` event. */ onColorChange?: (
			color: string
		) => void;
		/** PreviousColor. `null` or absent renders no previous-colour half. */ previousColor?:
			string | null;
		/** IsAlphaEnabled, ADR 0009. */ alphaEnabled?: boolean;
		/** IsColorSpectrumVisible, ADR 0009. */ colorSpectrumVisible?: boolean;
		/** IsColorPreviewVisible, ADR 0009. */ colorPreviewVisible?: boolean;
		/** IsColorSliderVisible, ADR 0009 — the third-dimension slider. */ colorSliderVisible?: boolean;
		/** IsAlphaSliderVisible, ADR 0009. */ alphaSliderVisible?: boolean;
		/** MinHue. */ minHue?: number;
		/** MaxHue. */ maxHue?: number;
		/** MinSaturation. */ minSaturation?: number;
		/** MaxSaturation. */ maxSaturation?: number;
		/** MinValue. */ minValue?: number;
		/** MaxValue. */ maxValue?: number;
		/** ColorSpectrumShape. */ colorSpectrumShape?: SpectrumShape;
		/** ColorSpectrumComponents. */ colorSpectrumComponents?: SpectrumComponents;
		class?: string;
		style?: string;
		/** The root, following ADR 0009 — this control's interactive parts are its children. */ ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
	type Hsv = { h: number; s: number; v: number };
</script>

<script lang="ts">
	import ColorPickerSlider from './ColorPickerSlider.svelte';
	import ColorSpectrum from './ColorSpectrum.svelte';
	import { hsvToRgb, rgbToHsv } from '../internal/color';
	let {
		color = $bindable('#FFFFFFFF'),
		onColorChange,
		previousColor = null,
		alphaEnabled = false,
		colorSpectrumVisible = true,
		colorPreviewVisible = true,
		colorSliderVisible = true,
		alphaSliderVisible = true,
		minHue = 0,
		maxHue = 359,
		minSaturation = 0,
		maxSaturation = 100,
		minValue = 0,
		maxValue = 100,
		colorSpectrumShape = 'box',
		colorSpectrumComponents = 'hueSaturation',
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ColorPickerProps = $props();
	// Seeded here rather than in the effect below, so a server render paints the colour it was
	// given. `parseColor` is a hoisted function declaration and its hex path needs no document,
	// which is the whole reason that path exists; a colour it cannot read without a canvas —
	// a name, `hsl(…)` — still falls back to white until the effect runs.
	const initial = parseColor(color);
	let hsv = $state<Hsv>(
		initial ? rgbToHsv(initial.r / 255, initial.g / 255, initial.b / 255) : { h: 0, s: 0, v: 1 }
	);
	let alpha = $state(initial ? initial.a : 1);
	let seeded = $state(initial !== undefined);
	let publishedColor = '';
	// WinUI's `Color` is an `{A,R,G,B}` struct with no string form at all, and this library
	// represents it as a CSS colour string — the same thing `ColorSpectrum`'s own `color` prop
	// takes, parsed the same way (`ColorSpectrum.svelte:230-240`). One hazard follows and the
	// prop's TSDoc repeats it: CSS's eight-digit hex is `#RRGGBBAA`, the reverse of the
	// `#AARRGGBB` a XAML literal writes, so a colour ported from XAML has to be reordered. Every
	// other CSS notation is unambiguous.
	//
	// The hex fast path is not an optimisation. The canvas below is the only thing that
	// understands `rebeccapurple` or `hsl(…)`, and there is no canvas during a server render, so
	// without it every hex-seeded picker renders white until hydration.
	function parseColor(value: string) {
		const hex = /^#([\da-f]+)$/i.exec(value)?.[1];
		if (hex && [3, 4, 6, 8].includes(hex.length)) {
			const short = hex.length <= 4;
			const channel = (index: number) =>
				parseInt(short ? hex[index].repeat(2) : hex.slice(index * 2, index * 2 + 2), 16);
			const count = short ? hex.length : hex.length / 2;
			return { r: channel(0), g: channel(1), b: channel(2), a: count === 4 ? channel(3) / 255 : 1 };
		}
		if (typeof document === 'undefined') return;
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) return;
		context.fillStyle = '#000';
		context.fillStyle = value;
		context.fillRect(0, 0, 1, 1);
		const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
		return { r, g, b, a: a / 255 };
	}
	function css(value: Hsv, opacity = 1) {
		const rgb = hsvToRgb(value.h, value.s, value.v);
		return `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${opacity})`;
	}
	function seed(value: string) {
		const parsed = parseColor(value);
		if (!parsed) return;
		hsv = rgbToHsv(parsed.r / 255, parsed.g / 255, parsed.b / 255);
		alpha = parsed.a;
	}
	// The guarded input path admits only consumer-originated Color changes. Deriving HSV from this
	// component's own colour would discard hue at black (ColorPicker.cpp:492-526).
	$effect(() => {
		if (!seeded) {
			seed(color);
			seeded = true;
			return;
		}
		if (color !== publishedColor) seed(color);
	});
	$effect(() => {
		if (!seeded) return;
		const next = css(hsv, alpha);
		if (next === publishedColor) return;
		publishedColor = next;
		if (color !== next) {
			color = next;
			onColorChange?.(next);
		}
	});
	const channel = $derived.by(() =>
		colorSpectrumComponents === 'hueValue' || colorSpectrumComponents === 'valueHue'
			? 'saturation'
			: colorSpectrumComponents === 'valueSaturation' ||
				  colorSpectrumComponents === 'saturationValue'
				? 'hue'
				: 'value'
	);
	const bounds = $derived.by(() =>
		channel === 'hue'
			? [minHue, maxHue]
			: channel === 'saturation'
				? [minSaturation, maxSaturation]
				: [minValue, maxValue]
	);
	const value = $derived(
		channel === 'hue' ? hsv.h : channel === 'saturation' ? hsv.s * 100 : hsv.v * 100
	);
	// Both sliders are handed a **rounded** value and both ignore a callback carrying that same
	// number back. `Slider`'s `StepFrequency` is 1, so a slider snaps whatever it is given and
	// reports the snapped figure; upstream drops that report, because `UpdateColorControls` wraps
	// every push into a child in `m_updatingControls` (`ColorPicker.cpp:551`, `:640`) and each
	// child's handler returns early while it is set (`:696`, `:733`). Without the same guard the
	// picker quantises the colour it was seeded with before anything is touched — measured:
	// `#3478F6` in and `rgb(52, 119, 245)` published out, one unit low on two channels, because
	// `v` had been rounded from 0.9647 to 0.96. The colour keeps its full precision and only the
	// slider's own displayed value is whole, which is what the pin does.
	const sliderValue = $derived(Math.round(value));
	const alphaSliderValue = $derived(Math.round(alpha * 100));
	const gradient = $derived.by(() => {
		const [min, rawMax] = bounds;
		const max = rawMax <= min ? min : rawMax;
		if (channel === 'saturation')
			return `linear-gradient(to right, ${css({ h: hsv.h, s: min / 100, v: 1 })}, ${css({ h: hsv.h, s: max / 100, v: 1 })})`; // ColorPicker.cpp:1074-1075 forces v to 1.
		if (channel === 'value')
			return `linear-gradient(to right, ${css({ h: hsv.h, s: hsv.s, v: min / 100 })}, ${css({ h: hsv.h, s: hsv.s, v: max / 100 })})`;
		const minOffset = min / 359,
			maxOffset = max / 359,
			stops = [`${css({ h: min, s: 1, v: 1 })} 0%`];
		for (let sextant = 1; sextant < 6; sextant++) {
			const offset = sextant / 6;
			if (minOffset < offset && maxOffset > offset)
				stops.push(
					`${css({ h: 60 * sextant, s: 1, v: 1 })} ${((offset - minOffset) / (maxOffset - minOffset)) * 100}%`
				);
		}
		stops.push(`${css({ h: max, s: 1, v: 1 })} 100%`);
		return `linear-gradient(to right, ${stops.join(', ')})`;
	});
	const alphaGradient = $derived(`linear-gradient(to right, ${css(hsv, 0)}, ${css(hsv, 1)})`);
	function update(next: number) {
		if (next === sliderValue) return;
		if (channel === 'hue') hsv = { ...hsv, h: next };
		else if (channel === 'saturation') hsv = { ...hsv, s: next / 100 };
		else hsv = { ...hsv, v: next / 100 };
	}
	function updateAlpha(next: number) {
		if (next === alphaSliderValue) return;
		alpha = next / 100;
	}
</script>

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<div class:collapsed={!colorSpectrumVisible} class="spectrum-grid">
		{#if colorSpectrumVisible}<ColorSpectrum
				bind:hsvColor={
					() => ({ ...hsv, a: alpha }), (next) => (hsv = { h: next.h, s: next.s, v: next.v })
				}
				{minHue}
				{maxHue}
				{minSaturation}
				{maxSaturation}
				{minValue}
				{maxValue}
				shape={colorSpectrumShape}
				components={colorSpectrumComponents}
				class="spectrum"
			/>{/if}
		{#if colorPreviewVisible}<div class:wide={!colorSpectrumVisible} class="preview">
				<div class="checkerboard"></div>
				<div
					class:vertical={colorSpectrumVisible && previousColor !== null}
					class:horizontal={!colorSpectrumVisible && previousColor !== null}
					class="current"
					style:background={css(hsv, alpha)}
				></div>
				{#if previousColor !== null}<div
						class:horizontal-previous={!colorSpectrumVisible}
						class="previous"
						style:background={previousColor}
					></div>{/if}
				<div class="border"></div>
			</div>{/if}
	</div>
	{#if colorSliderVisible}<div class="slider-grid third">
			<div class="gradient" style:background-image={gradient}></div>
			<ColorPickerSlider
				class="picker-slider"
				colorChannel={channel}
				min={bounds[0]}
				max={bounds[1]}
				value={sliderValue}
				onValueChange={update}
			/>
		</div>{/if}
	{#if alphaEnabled && alphaSliderVisible}<div class="slider-grid alpha">
			<div class="checkerboard"></div>
			<div class="gradient" style:background-image={alphaGradient}></div>
			<ColorPickerSlider
				class="picker-slider"
				colorChannel="alpha"
				min={0}
				max={100}
				value={alphaSliderValue}
				onValueChange={updateAlpha}
			/>
		</div>{/if}
</div>

<style>
	.root {
		padding: 4px 0;
		min-width: var(--winui-ColorPickerVerticalOrientationMinWidth);
		max-width: var(--winui-ColorPickerVerticalOrientationMaxWidth);
	}
	.spectrum-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		margin-bottom: 16px;
	}
	.spectrum-grid.collapsed {
		grid-template-columns: minmax(0, 1fr);
	}
	/* `ColorPicker.xaml:218` sizes the spectrum, and the selector has to be `:global` for the
	   same reason the slider's below is: a class passed to a component reaches the DOM carrying
	   the **callee's** scope hash, not this component's, so a scoped `.spectrum` matches nothing.
	   Measured before the fix — the element's `class` read `root spectrum svelte-1iv31sh`, which
	   is ColorSpectrum's hash, and its computed `min-width` was `auto`. */
	.spectrum-grid :global(.spectrum) {
		min-width: 256px;
		min-height: 256px;
		max-width: 336px;
		max-height: 336px;
		/* `OnColorSpectrumSizeChanged` (`ColorPicker.cpp:656-664`) sets the spectrum's height to
		   its width on every width change, and says why: "since we want it to always be a
		   square". That is the ColorPicker's doing and not the ColorSpectrum's — the spectrum
		   itself draws at `min(width, height)` (`ColorSpectrum.cpp:866-890`), so a box wider than
		   it is tall leaves the picture floating in the difference. Measured before this line:
		   the element was 336 by 256 and the gradient inside it 256 square, with eighty pixels of
		   empty control between it and the preview. The two maxima are equal, so the ratio can
		   never push the width past the 336 the template allows. */
		aspect-ratio: 1;
	}
	.preview {
		position: relative;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
		width: 44px;
		margin-left: 12px;
		overflow: hidden;
		border-radius: var(--winui-ControlCornerRadius);
	}
	.preview.wide {
		height: 44px;
		width: auto;
		margin-left: 0;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
	}
	.checkerboard {
		grid-area: 1 / 1 / -1 / -1;
		background: repeating-conic-gradient(var(--winui-SystemListLowColor) 0% 25%, transparent 0% 50%)
			/* c1-allow: ColorHelpers.cpp:9, CheckerSize is 4. */ 0 0 / 8px 8px;
	}
	.current,
	.previous,
	.border {
		grid-area: 1 / 1 / -1 / -1;
	}
	.current.vertical {
		grid-row: 1;
	}
	.previous {
		grid-row: 2;
	}
	.current.horizontal {
		grid-column: 1;
	}
	.previous.horizontal-previous {
		grid-column: 2;
		grid-row: 1;
	}
	.border {
		pointer-events: none;
		border-radius: var(
			--winui-ControlCornerRadius
		); /* c1-allow: generic.xaml:33331-33334, StrokeThickness is 2. */
		border: 2px solid var(--winui-ColorPickerBorderBrush);
	}
	.slider-grid {
		position: relative;
		display: flex;
		flex-direction: column;
	}
	.third {
		margin-bottom: 6px;
	}
	.alpha {
		margin-bottom: 16px;
	}
	.slider-grid > .checkerboard,
	.slider-grid > .gradient {
		position: absolute;
		inset: 0;
		margin: auto 0;
		height: 12px;
		border-radius: var(--winui-ColorPickerSliderCornerRadius);
		pointer-events: none;
	}
	.slider-grid > .gradient {
		background-repeat: no-repeat;
	}
	.slider-grid :global(.picker-slider) {
		width: 100%;
	}
</style>
