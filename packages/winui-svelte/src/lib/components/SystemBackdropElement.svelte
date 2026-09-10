<script lang="ts" module>
	export interface SystemBackdropElementProps {
		/** SystemBackdrop. Which of the three reachable materials this element hosts; absent
		 * is upstream's null, and paints nothing. */
		systemBackdrop?: 'mica' | 'micaAlt' | 'acrylic';
		/** CornerRadius. XAML's own grammar — a number, or `"8"`, `"4,8,12,16"`. */
		cornerRadius?: number | string;
		class?: string;
		style?: string;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// Upstream clips a composition visual rather than rounding a box. Here the element paints its
	// own background and has no children to clip, so CSS border-radius is the same result.
	// SystemBackdropElement.cpp:158-167 reduces radii exceeding the box following
	// HWCompTreeNodeWinRT::UpdateRoundedCornerClipVisual; CSS performs that reduction natively.
</script>

<script lang="ts">
	import { cornerRadiusToCss } from '../internal/thickness';

	let {
		systemBackdrop,
		cornerRadius,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: SystemBackdropElementProps = $props();
</script>

<!-- Svelte applies directives after `style`, so a SystemBackdropElement prop wins over that same CSS property. -->
<div
	bind:this={ref}
	class={['root', className]}
	{style}
	data-backdrop={systemBackdrop}
	style:border-radius={cornerRadius === undefined ? undefined : cornerRadiusToCss(cornerRadius)}
	{...rest}
></div>

<style>
	/* `display: block` is XAML's HorizontalAlignment="Stretch" default: this element has no
	   intrinsic size, so its caller or a stretching parent sizes it. */
	.root {
		display: block;
		box-sizing: border-box;
	}

	/* These are fallback colours, not the materials: SystemBackdropElement.cpp paints nothing
	   itself, while the composition SystemBackdrop paints its linked visual. D16 supplies the
	   Mica Base and solid Base correspondence. */
	.root[data-backdrop='acrylic'] {
		background: var(--winui-AcrylicBackgroundFillColorDefaultBrush);
	}
	.root[data-backdrop='mica'] {
		background: var(--winui-SolidBackgroundFillColorBaseBrush);
	}
	/* WD-040: Mica Alt's fallback is not in any pin; see docs/divergences.md */
	.root[data-backdrop='micaAlt'] {
		background: var(--winui-SolidBackgroundFillColorBaseAltBrush);
	}
</style>
