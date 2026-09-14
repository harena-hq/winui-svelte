<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type ColorPickerHsvChannel = 'hue' | 'saturation' | 'value' | 'alpha';

	export interface ColorPickerSliderProps {
		/** Value, from RangeBase. */
		value?: number;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback.
		 *  Upstream signals this as the `ValueChanged` event. */
		onValueChange?: (value: number) => void;
		/** Minimum. ColorPicker.xaml:244 and :257 both set 0. */
		min?: number;
		/** Maximum. ColorPicker.xaml:244 and :257 both set 100. */
		max?: number;
		/** StepFrequency, under the name the primitive and the DOM both use. */
		step?: number;
		/** ColorChannel. ColorPickerSlider.idl:10-11; the default is `Value`. */
		colorChannel?: ColorPickerHsvChannel;
		/** IsDirectionReversed. The value grows leftward. */
		isDirectionReversed?: boolean;
		/** IsEnabled, inverted to HTML's attribute — ADR 0009. */
		disabled?: boolean;
		/** Header. A string or a snippet; nothing is rendered when it is not given. */
		header?: Snippet | string;
		class?: string;
		style?: string;
		/** The thumb, not the root — ADR 0009's `ref` points at the interactive element. */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { Slider } from 'bits-ui';
	import { focusVisual } from '../internal/focus-visual';

	let {
		value = $bindable(0),
		onValueChange,
		min = 0,
		max = 100,
		step = 1,
		colorChannel = 'value',
		isDirectionReversed = false,
		disabled = false,
		header,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ColorPickerSliderProps = $props();

	// WD-084: ColorPicker.xaml:244 and :257 use only the horizontal template; :458, :464 and
	// :471 name HorizontalThumb alone, leaving the vertical variant without state colours.
	// WD-085: ColorPickerSlider.cpp:145-153 opens the template ToolTip part, whose localized
	// colour-name content needs the table this library has not built.
	// `ColorPickerSliderTrackFillDisabled` at ColorPicker.xaml:465-466 only targets the two
	// opacity-zero rectangles at :504-505, and `ColorPickerSliderCornerRadius` in
	// ColorPicker_themeresources.xaml:32 belongs to the ColorPicker's gradient strip at :239/:252.

	function onThumbKeyDown(thumbProps: Record<string, unknown>) {
		return (event: KeyboardEvent) => {
			if (disabled) return;

			if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
				(thumbProps.onkeydown as ((event: KeyboardEvent) => void) | undefined)?.(event);
				return;
			}

			event.preventDefault();
			const large = event.ctrlKey;
			// ColorPickerSlider.cpp:100 makes inversion depend on RTL and not IsDirectionReversed.
			// This component has no FlowDirection prop, so left/down lower and right/up raise.
			const lower = event.key === 'ArrowLeft' || event.key === 'ArrowDown';
			const direction = lower ? -1 : 1;

			// ColorPickerSlider.cpp:75/81/87 round-trips HSV, but it is identity for the slider's
			// own channel value, so the arithmetic stays on `value` directly. WD-083: the source's
			// large colour-channel path needs FindNextNamedColor; use its documented major steps.
			let next: number;
			if (colorChannel === 'alpha' && large) {
				next = lower ? Math.ceil((value - 10) / 10) * 10 : Math.floor((value + 10) / 10) * 10;
			} else {
				const amount = large ? (colorChannel === 'hue' ? 30 : 10) : 1;
				next = value + direction * amount;
			}

			// ColorPickerSlider.cpp:113/:117 passes the parent channel bounds to non-wrapping
			// helpers. This standalone component clamps its own min/max; ColorPicker must pass the
			// channel bounds when that later unit composes it.
			value = Math.min(max, Math.max(min, next));
			onValueChange?.(value);
		};
	}
</script>

<div
	class={['root', 'winui-BodyTextBlockStyle', className]}
	{style}
	data-disabled={disabled || undefined}
	{...rest}
>
	{#if header !== undefined}
		<span class="header">
			{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
		</span>
	{/if}
	<Slider.Root
		type="single"
		bind:value={
			() => value,
			(next) => {
				value = next;
				onValueChange?.(next);
			}
		}
		{min}
		{max}
		{step}
		{disabled}
		orientation="horizontal"
		dir={isDirectionReversed ? 'rtl' : 'ltr'}
	>
		{#snippet child({ props, thumbItems })}
			<!-- bits-ui supplies positioning and ARIA through `child`; rendering the nodes here keeps
			     their class names Svelte-scoped. Passing classes into the primitive would bypass this
			     scope hash and force global selectors whose ordinary names would leak elsewhere. -->
			<span {...props} class="container">
				<span class="track"></span>
				<Slider.Range>
					{#snippet child({ props })}
						<span {...props} class="fill"></span>
					{/snippet}
				</Slider.Range>
				{#each thumbItems as thumb (thumb.index)}
					<Slider.Thumb index={thumb.index}>
						{#snippet child({ props })}
							<span
								{...props}
								bind:this={ref}
								class="thumb"
								onkeydown={onThumbKeyDown(props)}
								{@attach focusVisual}
							>
								<span class="inner"></span>
							</span>
						{/snippet}
					</Slider.Thumb>
				{/each}
			</span>
		{/snippet}
	</Slider.Root>
</div>

<style>
	/* ColorPicker.xaml:428-533, the replacement ColorPickerSliderStyle follows Slider's root. */
	.root {
		display: inline-flex;
		flex-direction: column;
		position: relative;
	}

	/* ColorPicker.xaml:491, HeaderContentPresenter's foreground, weight, margin and wrapping. */
	.header {
		margin: var(--winui-SliderHeaderThemeMargin);
		color: var(--winui-SliderHeaderForeground);
		font-weight: var(--winui-SliderHeaderThemeFontWeight);
		white-space: normal;
	}

	/* ColorPicker.xaml:492-493. The transparent 32px container is the hit area because the
	   track itself is invisible. */
	.container {
		position: relative;
		display: flex;
		align-items: center;
		touch-action: none;
		/* c1-allow: ColorPicker.xaml:493, HorizontalTemplate's MinHeight="32" */
		min-height: 32px;
		background: transparent;
	}

	/* ColorPicker.xaml:504, HorizontalTrackRect remains laid out but paints at opacity zero. */
	.track {
		width: 100%;
		height: var(--winui-SliderTrackThemeHeight);
		opacity: 0;
	}

	/* ColorPicker.xaml:505, HorizontalDecreaseRect remains positioned but paints nothing. */
	.fill {
		height: var(--winui-SliderTrackThemeHeight);
		opacity: 0;
	}

	/* ColorPicker.xaml:441 has no margin: unlike Slider_themeresources.xaml:198's -2 margin,
	   this 18px layout box is the painted outer circle itself. */
	.thumb {
		width: var(--winui-SliderHorizontalThumbWidth);
		height: var(--winui-SliderHorizontalThumbHeight);
		border-radius: var(--winui-SliderThumbCornerRadius);
		display: grid;
		place-items: center;
		cursor: pointer;
		outline: none;
		background: var(--winui-SliderOuterThumbBackground);
	}

	/* ColorPicker.xaml:436's one-pixel BorderThickness must be a masked ring: SliderThumbBorderBrush
	   aliases the ControlElevationBorderBrush gradient, which CSS drops as a border color. */
	.thumb::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		/* c1-allow: ColorPicker.xaml:436, BorderThickness="1" */
		padding: 1px;
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		background: var(--winui-SliderThumbBorderBrush);
	}

	/* ColorPicker.xaml:437/:442. Normal at :455 is empty, so Slider's scaled inner-circle states
	   have no counterpart here: this fixed ellipse never scales. */
	.inner {
		width: var(--winui-ColorPickerSliderInnerThumbWidth);
		height: var(--winui-ColorPickerSliderInnerThumbHeight);
		/* c1-allow: ColorPicker.xaml:442, SliderInnerThumb is an Ellipse */
		border-radius: 50%;
		background: var(--winui-ColorPickerSliderThumbBackground);
	}

	/* ColorPicker.xaml:428-429/:492. No BasedOn means DefaultSliderStyle's -7px focus margin
	   does not arrive; the band is the container box with this style's ControlCornerRadius. */
	.container:has(.thumb[data-focus-visual])::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: var(--winui-ControlCornerRadius);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* ColorPicker.xaml:471, PointerOver. */
	.container:hover .inner {
		background: var(--winui-ColorPickerSliderThumbBackgroundPointerOver);
	}

	/* ColorPicker.xaml:458, Pressed. This and :437 resolve to the same brush in every dictionary,
	   so the state has no visible change upstream either. */
	.container:has(.thumb[data-active]) .inner {
		background: var(--winui-ColorPickerSliderThumbBackgroundPressed);
	}

	/* ColorPicker.xaml:464, Disabled. */
	.root[data-disabled] .inner {
		background: var(--winui-ColorPickerSliderThumbBackgroundDisabled);
	}

	/* ColorPicker.xaml:463, Disabled header foreground. */
	.root[data-disabled] .header {
		color: var(--winui-ColorPickerHeaderContentDisabled);
	}

	/* ColorPicker.xaml:461-468, Disabled state makes the interactive thumb inert. */
	.root[data-disabled] .container .thumb {
		cursor: default;
	}
</style>
