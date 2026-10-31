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
		/** IsMoreButtonVisible, ADR 0009. Defaults to **false**, as the dependency property does. */ moreButtonVisible?: boolean;
		/** IsColorChannelTextInputVisible, ADR 0009. */ colorChannelTextInputVisible?: boolean;
		/** IsAlphaTextInputVisible, ADR 0009. */ alphaTextInputVisible?: boolean;
		/** IsHexInputVisible, ADR 0009. */ hexInputVisible?: boolean;
		/** Orientation. `ColorPicker.idl:51-52` defaults to Vertical; the Horizontal state is
		 *  `ColorPicker.xaml:142-197`. */ orientation?: 'horizontal' | 'vertical';
		/** MinHue. */ minHue?: number;
		/** MaxHue. */ maxHue?: number;
		/** MinSaturation. */ minSaturation?: number;
		/** MaxSaturation. */ maxSaturation?: number;
		/** MinValue. */ minValue?: number;
		/** MaxValue. */ maxValue?: number;
		/** ColorSpectrumShape. */ colorSpectrumShape?: SpectrumShape;
		/** ColorSpectrumComponents. */ colorSpectrumComponents?: SpectrumComponents;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/** The root, following ADR 0009 — this control's interactive parts are its children. */ ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
	type Hsv = { h: number; s: number; v: number };
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	import { tick } from 'svelte';
	import ComboBox from './ComboBox.svelte';
	import ColorPickerSlider from './ColorPickerSlider.svelte';
	import ColorSpectrum from './ColorSpectrum.svelte';
	import TextBox from './TextBox.svelte';
	import ToggleButton from './ToggleButton.svelte';
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
		moreButtonVisible = false,
		colorChannelTextInputVisible = true,
		alphaTextInputVisible = true,
		hexInputVisible = true,
		orientation = 'vertical',
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

	const str = useStrings();
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
	// `m_textEntryGridOpened` (ColorPicker.cpp:743, :749, :755 — the More button's three
	// handlers at :741-757). Not a public member upstream either.
	let textEntryGridOpened = $state(false);
	// The ComboBox's SelectedIndex, which is the whole of `ColorRepresentationSelected`
	// (ColorPicker.cpp:469). Upstream exposes no property for it.
	let representation = $state<'rgb' | 'hsv'>('rgb');
	const isVerticalOrientation = $derived(orientation === 'vertical');
	// ColorPicker.cpp:464, and the comment upstream puts directly above it at :463: "More button
	// is disabled in horizontal orientation; only respect IsMoreButtonVisible states when
	// switching to Vertical orientation."
	const moreButtonShown = $derived(moreButtonVisible && isVerticalOrientation);
	// ColorPicker.cpp:465. The third disjunct is why a horizontal picker always shows its grid.
	const textEntryGridShown = $derived(
		!moreButtonVisible || textEntryGridOpened || !isVerticalOrientation
	);
	// WinUI's `Color` is an `{A,R,G,B}` struct with no string form at all, and this library
	// represents it as a CSS colour string — the same thing `ColorSpectrum`'s own `color` prop
	// takes, parsed the same way (`seedFromCss` in `ColorSpectrum.svelte`). One hazard follows and
	// the prop's TSDoc repeats it: CSS's eight-digit hex is `#RRGGBBAA`, the reverse of the
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
	type BoxKey = 'r' | 'g' | 'b' | 'h' | 's' | 'v' | 'a' | 'hex';
	// The eight text boxes are more children that report their own text back, and they need
	// `m_updatingControls` for the reason the two sliders do (see the comment at :156).
	// `editing` is that guard: the box the user is typing in shows `draft` and every other box
	// shows the colour. `ColorPicker.cpp:581-636` is the same rule read from the other side —
	// `updateTextBoxes` rewrites every box except the one whose reason it was handed.
	let editing = $state<BoxKey | null>(null);
	let draft = $state('');
	// `m_isFocusedTextBoxValid` (ColorPicker.cpp:800). Nothing reads it on blur: upstream
	// restores `m_previousString` and then immediately calls `UpdateColorControls(ColorPropertyChanged)`
	// (:816), whose reason excludes no box, so the restored text is overwritten by the colour in the
	// same turn. Dropping `editing` does the same thing in one assignment, so there is no
	// `m_previousString` here.
	let invalid = $state(false);
	let alphaRef = $state<HTMLInputElement | null>(null);
	let hexRef = $state<HTMLInputElement | null>(null);
	const rgb = $derived(hsvToRgb(hsv.h, hsv.s, hsv.v));
	const byte = (n: number) => n.toString(16).toUpperCase().padStart(2, '0');
	const displayed = $derived<Record<BoxKey, string>>({
		r: String(rgb.r),
		g: String(rgb.g),
		b: String(rgb.b),
		h: String(Math.round(hsv.h)),
		s: String(Math.round(hsv.s * 100)),
		v: String(Math.round(hsv.v * 100)),
		a: `${Math.round(alpha * 100)}%`,
		// RgbaToHex / RgbToHex, ColorConversion.cpp:295-308 and :256-268. `#AARRGGBB`, alpha
		// first — the reverse of the `#RRGGBBAA` this component's own `color` prop speaks.
		hex: alphaEnabled
			? `#${byte(Math.round(alpha * 255))}${byte(rgb.r)}${byte(rgb.g)}${byte(rgb.b)}`
			: `#${byte(rgb.r)}${byte(rgb.g)}${byte(rgb.b)}`
	});
	const text = (key: BoxKey) => (editing === key ? draft : displayed[key]);
	const rgbKeys = ['r', 'g', 'b'] as const;
	const channelRows = $derived(
		representation === 'rgb'
			? [
					{ key: 'r' as const, label: str('TextRedLabel') },
					{ key: 'g' as const, label: str('TextGreenLabel') },
					{ key: 'b' as const, label: str('TextBlueLabel') }
				]
			: [
					{ key: 'h' as const, label: str('TextHueLabel') },
					{ key: 's' as const, label: str('TextSaturationLabel') },
					{ key: 'v' as const, label: str('TextValueLabel') }
				]
	);
	// `wcstoul` with the whole string required and an explicit nullopt for the empty one
	// (ColorConversion.cpp:26-29, :38-41). It accepts leading whitespace, a sign, and `0x` for
	// explicit base 16; constrained decimal boxes still reject negative values by their ranges.
	function tryParseInt(value: string, base: 10 | 16) {
		const pattern = base === 10 ? /^\s*[+-]?\d+$/ : /^\s*[+-]?(?:0x)?[0-9a-f]+$/i;
		if (!pattern.test(value)) return;
		const source = value.trimStart();
		const negative = source.startsWith('-');
		const parsed = parseInt(source.replace(/^[+-]/, ''), base);
		// Windows `unsigned long` is 32 bits; the text boxes' maximum lengths keep the parsed
		// magnitude within that range, so this is `wcstoul`'s reachable negative conversion.
		return negative ? (2 ** 32 - parsed) % 2 ** 32 : parsed;
	}
	function clampRgbToHsv(next: { r: number; g: number; b: number }) {
		const nextHsv = rgbToHsv(next.r / 255, next.g / 255, next.b / 255);
		return {
			h: Math.min(maxHue, Math.max(minHue, nextHsv.h)),
			s: Math.min(maxSaturation / 100, Math.max(minSaturation / 100, nextHsv.s)),
			v: Math.min(maxValue / 100, Math.max(minValue / 100, nextHsv.v))
		};
	}
	function updateRepresentation(next: string) {
		representation = next === 'hsv' ? 'hsv' : 'rgb';
	}
	function onChannelInput(key: Exclude<BoxKey, 'a' | 'hex'>, next: string) {
		editing = key;
		draft = next;
		const parsed = tryParseInt(next, 10);
		if (parsed === undefined) {
			invalid = true;
			return;
		}
		if (rgbKeys.includes(key as (typeof rgbKeys)[number])) {
			invalid = parsed > 255;
			if (invalid) return;
			const r = tryParseInt(text('r'), 10);
			const g = tryParseInt(text('g'), 10);
			const b = tryParseInt(text('b'), 10);
			if (r === undefined || g === undefined || b === undefined) {
				invalid = true;
				return;
			}
			// ApplyConstraintsToRgbColor converts RGB to HSV, clamps, converts back, then
			// UpdateColor stores HSV (ColorPicker.cpp:1020-1036, :492-499). This component already
			// stores HSV, so clamp that one conversion rather than introducing its extra round trip.
			hsv = clampRgbToHsv({ r, g, b });
			return;
		}
		const limits =
			key === 'h'
				? [minHue, maxHue]
				: key === 's'
					? [minSaturation, maxSaturation]
					: [minValue, maxValue];
		invalid = parsed < limits[0] || parsed > limits[1];
		if (invalid) return;
		const h = tryParseInt(text('h'), 10);
		const s = tryParseInt(text('s'), 10);
		const v = tryParseInt(text('v'), 10);
		if (h === undefined || s === undefined || v === undefined) {
			invalid = true;
			return;
		}
		// HSV text handlers validate their own range and pass the three values through unclamped
		// (ColorPicker.cpp:858-920).
		hsv = { h, s: s / 100, v: v / 100 };
	}
	function onAlphaInput(next: string) {
		if (!next.endsWith('%')) {
			const caret = alphaRef?.selectionStart ?? next.length;
			next += '%';
			// `tick` lands after TextBox has applied its controlled value round-trip.
			tick().then(() => alphaRef?.setSelectionRange(caret, caret));
		}
		editing = 'a';
		draft = next;
		const parsed = tryParseInt(next.slice(0, -1), 10);
		if (parsed === undefined) {
			invalid = true;
			return;
		}
		invalid = parsed > 100;
		if (invalid) return;
		alpha = parsed / 100;
	}
	function onHexInput(next: string) {
		if (!next.startsWith('#')) {
			next = `#${next}`;
			// `tick` lands after TextBox has applied its controlled value round-trip.
			tick().then(() => hexRef?.setSelectionRange(next.length, next.length));
		}
		editing = 'hex';
		draft = next;
		const parsed = tryParseInt(next.slice(1), 16);
		if (parsed === undefined) {
			invalid = true;
			return;
		}
		invalid = false;
		const rgbValue = { r: (parsed >> 16) & 0xff, g: (parsed >> 8) & 0xff, b: parsed & 0xff };
		hsv = clampRgbToHsv(rgbValue);
		// ColorPicker.cpp:977 substitutes alpha 1 while alpha is disabled; preserve that branch
		// even when the picker was seeded with a translucent CSS colour.
		alpha = alphaEnabled ? ((parsed >> 24) & 0xff) / 255 : 1;
	}
	function onBoxFocus(key: BoxKey) {
		editing = key;
		draft = displayed[key];
		invalid = false;
	}
	function onBoxBlur() {
		// Upstream's rollback is immediately overwritten by UpdateColorControls; dropping the
		// editing guard is the same observable result (ColorPicker.cpp:804-817).
		editing = null;
		invalid = false;
	}
	// ColorPicker.xaml:158-162 and :175-179 put a RotateTransform Angle="180" on both background
	// rectangles in the Horizontal state. A XAML LinearGradientBrush runs 0,0 to 1,1, which in a
	// 12-wide upright strip is top to bottom; half a turn makes it bottom to top, which is where
	// the vertical slider's minimum is. In CSS that is the whole of the transform.
	const stripDirection = $derived(isVerticalOrientation ? 'to right' : 'to top');
	const gradient = $derived.by(() => {
		const [min, rawMax] = bounds;
		const max = rawMax <= min ? min : rawMax;
		if (channel === 'saturation')
			return `linear-gradient(${stripDirection}, ${css({ h: hsv.h, s: min / 100, v: 1 })}, ${css({ h: hsv.h, s: max / 100, v: 1 })})`; // ColorPicker.cpp:1074-1075 forces v to 1.
		if (channel === 'value')
			return `linear-gradient(${stripDirection}, ${css({ h: hsv.h, s: hsv.s, v: min / 100 })}, ${css({ h: hsv.h, s: hsv.s, v: max / 100 })})`;
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
		return `linear-gradient(${stripDirection}, ${stops.join(', ')})`;
	});
	const alphaGradient = $derived(
		`linear-gradient(${stripDirection}, ${css(hsv, 0)}, ${css(hsv, 1)})`
	);
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

<div bind:this={ref} class={['root', className]} {style} data-orientation={orientation} {...rest}>
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
			<!-- The inversion is upstream's. ColorPicker.xaml:153 and :166 set both sliders' Orientation
			     to Vertical inside the picker's own Horizontal state: a picker laid out across the page
			     stands its two sliders on end beside the spectrum. -->
			<ColorPickerSlider
				class="picker-slider"
				orientation={isVerticalOrientation ? 'horizontal' : 'vertical'}
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
				orientation={isVerticalOrientation ? 'horizontal' : 'vertical'}
				colorChannel="alpha"
				min={0}
				max={100}
				value={alphaSliderValue}
				onValueChange={updateAlpha}
			/>
		</div>{/if}
	<div class="more-entries">
		{#if moreButtonShown}
			<ToggleButton
				class="more-button"
				bind:checked={textEntryGridOpened}
				aria-expanded={textEntryGridOpened}
			>
				<span class="more-content">
					<span class="more-label"
						>{str(
							textEntryGridOpened ? 'TextMoreButtonLabelExpanded' : 'TextMoreButtonLabelCollapsed'
						)}</span
					>
					<span class="more-glyph" data-open={textEntryGridOpened || undefined}></span>
				</span>
			</ToggleButton>
		{/if}
		{#if textEntryGridShown}
			<!-- WD-086: visible labels have no programmatic association, and no `aria-label` is
			     passed to the TextBoxes and the ComboBox yet; see docs/divergences.md. -->
			<div class:hex-left={!colorChannelTextInputVisible} class="text-entry">
				{#if colorChannelTextInputVisible}
					<ComboBox
						class="representation"
						items={[
							{ value: 'rgb', label: str('ContentRGBComboBoxItem') },
							{ value: 'hsv', label: str('ContentHSVComboBoxItem') }
						]}
						value={representation}
						onValueChange={updateRepresentation}
					/>
				{/if}
				<div class="text-panels">
					{#if colorChannelTextInputVisible}
						<!-- Upstream writes both grids then collapses one. One grid stands for both here: its
						     wrapper has no spacing and exactly one child is ever visible. -->
						<div class="channel-panel">
							{#each channelRows as row, index (row.key)}
								<!-- The three RowDefinitions are content-sized: this grid is in an auto-height
								     StackPanel, so the source's star tracks have that effect (:375-379). -->
								<TextBox
									class="channel-box"
									data-box={row.key}
									style="grid-row: {index + 1}"
									value={text(row.key)}
									onValueChange={(next) => onChannelInput(row.key, next)}
									onfocusin={() => onBoxFocus(row.key)}
									onfocusout={onBoxBlur}
									maxLength={3}
								/>
								<span class="channel-label" style:grid-row={index + 1}>{row.label}</span>
							{/each}
						</div>
					{/if}
					{#if alphaEnabled && alphaTextInputVisible}
						<div class="alpha-panel">
							<TextBox
								class="alpha-box"
								data-box="a"
								bind:ref={alphaRef}
								value={text('a')}
								onValueChange={onAlphaInput}
								onfocusin={() => onBoxFocus('a')}
								onfocusout={onBoxBlur}
								maxLength={4}
							/>
							<span class="channel-label">{str('TextAlphaLabel')}</span>
						</div>
					{/if}
				</div>
				{#if hexInputVisible}
					<TextBox
						class="hex-box"
						data-box="hex"
						bind:ref={hexRef}
						value={text('hex')}
						onValueChange={onHexInput}
						onfocusin={() => onBoxFocus('hex')}
						onfocusout={onBoxBlur}
						maxLength={alphaEnabled ? 9 : 7}
					/>
				{/if}
			</div>
		{/if}
	</div>
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
	.more-entries {
		display: flex;
		flex-direction: column;
		margin-bottom: 12px;
	}
	.more-entries :global(.more-button) {
		align-self: flex-end;
		min-height: 32px;
		min-width: 120px;
		padding: 0;
		justify-content: flex-end;
		/* ColorPicker.xaml:270-295 — the Default dictionary, byte-identical to Light at :322-347.
		   `Color="Transparent"` becomes `SystemControlTransparentBrush`, which is `transparent`
		   in all three themes: C1 permits custom properties outside the token layer only when their
		   values are `var()` calls, and this token is the direct transcription. */
		--winui-ToggleButtonBackground: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonBorderBrush: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonForeground: var(--winui-SystemBaseHighColor);
		--winui-ToggleButtonBackgroundPointerOver: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonBorderBrushPointerOver: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonForegroundPointerOver: var(--winui-SystemBaseMediumColor);
		--winui-ToggleButtonBackgroundPressed: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonBorderBrushPressed: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonForegroundPressed: var(--winui-SystemBaseMediumLowColor);
		--winui-ToggleButtonBackgroundDisabled: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonBorderBrushDisabled: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonForegroundDisabled: var(--winui-SystemBaseMediumLowColor);
		--winui-ToggleButtonBackgroundChecked: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonBorderBrushChecked: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonForegroundChecked: var(--winui-SystemBaseHighColor);
		--winui-ToggleButtonBackgroundCheckedPointerOver: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonBorderBrushCheckedPointerOver: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonForegroundCheckedPointerOver: var(--winui-SystemBaseMediumColor);
		--winui-ToggleButtonBackgroundCheckedPressed: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonBorderBrushCheckedPressed: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonForegroundCheckedPressed: var(--winui-SystemBaseMediumLowColor);
		--winui-ToggleButtonBackgroundCheckedDisabled: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonBorderBrushCheckedDisabled: var(--winui-SystemControlTransparentBrush);
		--winui-ToggleButtonForegroundCheckedDisabled: var(--winui-SystemBaseMediumLowColor);
	}
	/* ColorPicker.xaml:296-321 — the HighContrast dictionary. Backgrounds stay transparent;
	   the other sixteen keys change. */
	:global(:root[data-theme='high-contrast']) .more-entries :global(.more-button) {
		--winui-ToggleButtonBorderBrush: var(--winui-SystemColorButtonTextColor);
		--winui-ToggleButtonForeground: var(--winui-SystemColorButtonTextColor);
		--winui-ToggleButtonBorderBrushPointerOver: var(--winui-SystemColorHighlightColor);
		--winui-ToggleButtonForegroundPointerOver: var(--winui-SystemColorHighlightColor);
		--winui-ToggleButtonBorderBrushPressed: var(--winui-SystemColorHighlightColor);
		--winui-ToggleButtonForegroundPressed: var(--winui-SystemColorHighlightColor);
		--winui-ToggleButtonBorderBrushDisabled: var(--winui-SystemColorGrayTextColor);
		--winui-ToggleButtonForegroundDisabled: var(--winui-SystemColorGrayTextColor);
		--winui-ToggleButtonBorderBrushChecked: var(--winui-SystemColorButtonTextColor);
		--winui-ToggleButtonForegroundChecked: var(--winui-SystemColorButtonTextColor);
		--winui-ToggleButtonBorderBrushCheckedPointerOver: var(--winui-SystemColorHighlightColor);
		--winui-ToggleButtonForegroundCheckedPointerOver: var(--winui-SystemColorHighlightColor);
		--winui-ToggleButtonBorderBrushCheckedPressed: var(--winui-SystemColorHighlightColor);
		--winui-ToggleButtonForegroundCheckedPressed: var(--winui-SystemColorHighlightColor);
		--winui-ToggleButtonBorderBrushCheckedDisabled: var(--winui-SystemColorGrayTextColor);
		--winui-ToggleButtonForegroundCheckedDisabled: var(--winui-SystemColorGrayTextColor);
	}
	.more-content {
		display: flex;
		align-items: center;
		margin: 5px 0 7px;
	}
	.more-glyph {
		margin-left: 8px;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: ColorPicker.xaml:264, FontSize is 12. */
		font-size: 12px;
		line-height: normal;
	}
	/* c1-allow: ColorPicker.xaml:264, collapsed Glyph is \E70D. */
	.more-glyph::after {
		content: '\E70D' / '';
	}
	/* c1-allow: ColorPicker.xaml:264, expanded Glyph is \E70E. */
	.more-glyph[data-open]::after {
		content: '\E70E' / '';
	}
	.text-entry {
		display: grid;
		grid-template-columns: 1fr 5px 1fr;
		grid-template-rows: auto auto auto;
	}
	.text-entry :global(.representation) {
		grid-row: 1;
		grid-column: 1;
		width: 120px;
	}
	.text-panels {
		grid-row: 2;
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
	}
	.text-entry :global(.hex-box) {
		grid-row: 1;
		grid-column: 3;
		justify-self: end;
		align-self: start;
		width: 132px;
	}
	.text-entry.hex-left :global(.hex-box) {
		grid-column: 1;
		justify-self: start;
	}
	.channel-panel {
		display: grid;
		grid-template-columns: auto 8px 1fr;
	}
	.channel-panel :global(.channel-box) {
		grid-column: 1;
		margin-top: 12px;
		width: 120px;
	}
	.channel-label {
		grid-column: 3;
		align-self: center;
		margin-top: 12px;
	}
	.alpha-panel {
		display: grid;
		grid-template-columns: auto 8px 1fr;
		margin-top: 12px;
	}
	.alpha-panel :global(.alpha-box) {
		grid-column: 1;
		width: 120px;
	}
	.alpha-panel .channel-label {
		margin-top: 0;
	}
	/* ColorPicker.xaml:142-197 — the Horizontal state. */
	.root[data-orientation='horizontal'] {
		display: grid;
		grid-template-columns: auto auto auto auto;
		grid-template-rows: auto;
		align-items: stretch;
		/* `:208-211`'s four columns are `Auto`, and a XAML `Auto` column is content-sized and
		   never grows; a CSS `auto` track is stretched by the free-space step unless
		   `justify-content` opts out. Measured without this line, against a root the harness row
		   stretches to 1232: the third-dimension column came out 166 wide instead of 38, and its
		   gradient strip — centred in the column, as :156 says — sat 61 pixels from the thumb it
		   paints under. `:147`'s MaxWidth of 10000 is XAML for "do not cap", not for "fill". */
		justify-content: start;
		/* :144-147. The key names say VerticalOrientation and are read by the Horizontal state;
		   the name is about the sliders, which this state stands on end. */
		min-height: var(--winui-ColorPickerVerticalOrientationMinHeight);
		max-height: var(--winui-ColorPickerVerticalOrientationMaxHeight);
		min-width: 0;
		max-width: none;
	}
	/* :148 */
	.root[data-orientation='horizontal'] .spectrum-grid {
		grid-column: 1;
		margin-bottom: 0;
	}
	/* The collapsed spectrum is the one place the root's columns cannot all be content-sized.
	   `ColorSpectrumCollapsed` (:17-26) unsets the preview's `Width`, gives it `Height="44"` and
	   spans it across both of ColorSpectrumGrid's columns — five setters whose only purpose is to
	   turn a 44-wide upright bar into a wide 44-tall one, and a content-sized track collapses that
	   bar to nothing. Whether a XAML `Auto` column measures its child against the available width
	   or against infinity is what decides it and the pin does not say; what the pin does say is
	   that the same reasoning would collapse the bar in the *vertical* orientation too, where
	   those five setters plainly work. So the first track flexes when, and only when, the spectrum
	   is gone — which is what this library already renders vertically, at the root's own
	   `MaxWidth`. Measured without this rule: the whole spectrum grid was 32 wide and the preview
	   a four-pixel sliver. A capture of a horizontal ColorPicker with `IsColorSpectrumVisible`
	   false would settle it; the Gallery sets that property nowhere. */
	.root[data-orientation='horizontal']:has(.spectrum-grid.collapsed) {
		grid-template-columns: minmax(0, 1fr) auto auto auto;
	}
	/* :149 */
	.root[data-orientation='horizontal'] .preview {
		margin: 0 16px 0 12px;
	}
	/* :150-152 */
	.root[data-orientation='horizontal'] .third {
		grid-column: 2;
		margin: 0 6px 0 0;
	}
	/* :163-165 */
	.root[data-orientation='horizontal'] .alpha {
		grid-column: 3;
		margin: 0 16px 0 0;
	}
	/* :154-157, :167-174 */
	.root[data-orientation='horizontal'] .slider-grid > .checkerboard,
	.root[data-orientation='horizontal'] .slider-grid > .gradient {
		margin: 0 auto;
		width: 12px;
		height: auto;
	}
	.root[data-orientation='horizontal'] .slider-grid :global(.picker-slider) {
		width: auto;
		flex: 1 1 auto;
		/* A flex item with auto width otherwise stretches across its column; the vertical template's
		   fixed 32px container is the XAML slider's actual width. */
		align-self: flex-start;
	}
	/* :180-182 */
	.root[data-orientation='horizontal'] .more-entries {
		grid-column: 4;
		margin-bottom: 0;
	}
	/* :184 */
	.root[data-orientation='horizontal'] .text-entry :global(.representation) {
		grid-row: 2;
	}
	/* :185 */
	.root[data-orientation='horizontal'] .text-panels {
		grid-row: 3;
	}
	/* :186-192 */
	.root[data-orientation='horizontal'] .text-entry :global(.hex-box) {
		grid-row: 1;
		grid-column: 1 / -1;
		justify-self: start;
		width: 120px;
		margin-bottom: 12px;
	}
	/* :193-195. The label column stops being a star and becomes 122, so the TextBox column is
	   the only flexible one left — and it is `Auto` (:371, :389, :408), which does not grow. The
	   same free-space step as the root's needs the same opt-out: measured without it the box
	   column was 242 against the template's 120, which put every label 122 further right than
	   the 122 this token names. */
	.root[data-orientation='horizontal'] .channel-panel,
	.root[data-orientation='horizontal'] .alpha-panel {
		grid-template-columns: auto 8px var(--winui-ColorPickerTextInputHorizontalOrientationMargin);
		justify-content: start;
	}
</style>
