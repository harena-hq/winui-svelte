<script lang="ts" module>
	export interface ColorSelectorProps {
		/**
		 * Color. A CSS colour. Upstream's is a `Windows.UI.Color` dependency property whose
		 * default is `Colors.Transparent` (ColorSelector.xaml.cs:21-32), painted onto the
		 * swatch by `UpdateVisual` (`:55-63`).
		 */
		color?: string;
		/**
		 * AutomationProperties.Name, which ColorSelector.xaml:13 binds from the UserControl
		 * onto the SplitButton. Here it names the swatch, which is the primary half's only
		 * content and therefore that half's accessible name; the chevron half carries
		 * SplitButton's own "More Options".
		 */
		label?: string;
		class?: string;
		style?: string;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// `ColorChanged` (ColorSelector.xaml.cs:45) is deliberately absent, and WD-066 is why:
	// the flyout that would raise it holds a `ColorPicker`, which this library does not have
	// until roadmap item 17. An event nothing can raise is not an API.
</script>

<script lang="ts">
	import { SplitButton } from '@harena-hq/winui-svelte/preview';

	let {
		color = 'transparent',
		label,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ColorSelectorProps = $props();
</script>

<!-- The root is a real element because upstream's is: `ColorSelector.xaml:2-11` is a
     `UserControl` in the visual tree carrying the margin, and the SplitButton sits inside it. -->
<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<!-- WD-066. `SplitButton` is given no `items`, so its chevron half renders in its normal
	     state and opens nothing — which is what keeps the resting render exact. Disabling it
	     would be the honest-looking choice and the wrong one: a disabled half is a different
	     visual state, and the resting state is this project's bar. -->
	<SplitButton>
		<span class="swatch" role="img" aria-label={label} style="background: {color}"></span>
	</SplitButton>
</div>

<style>
	/* ColorSelector.xaml:11 — `Margin="0,2,0,8"` on the UserControl.

	   `display: flex` rather than a plain block, and the reason is a line box: the
	   `SplitButton` root is `inline-flex`, so as inline-level content it would sit in a line
	   box three pixels taller than itself and every row in the options column would inherit
	   the difference. `align-items: flex-start` then keeps the button its own height instead
	   of stretching it. Measured both ways — 36 as a block, 33 as a flex container, against
	   the original's 33. */
	.root {
		display: flex;
		align-items: flex-start;
		margin: 2px 0 8px;
	}

	/* ColorSelector.xaml:14-18. The negative margin is what makes the 64x32 swatch fill the
	   primary half rather than sit inside its padding: `SplitButtonPadding` is
	   `6px 11px 7px 11px`, so `-11` cancels both sides exactly and `-6` cancels the top, which
	   leaves the button 64 wide and 33 tall with one border row showing under the swatch —
	   measured on the reference guest at exactly that, and reproduced at exactly that. */
	.swatch {
		display: block;
		width: 64px;
		height: 32px;
		margin: -6px -11px;
		/* c1-allow: ColorSelector.xaml:17, CornerRadius="4,0,0,4" — the Gallery's own literal,
		   which happens to equal ControlCornerRadius but is not a reference to it */
		border-radius: 4px 0 0 4px;
	}
</style>
