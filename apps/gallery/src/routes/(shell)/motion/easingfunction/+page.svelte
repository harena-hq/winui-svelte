<script lang="ts">
	import {
		Button,
		ComboBox,
		NumberBox,
		Paragraph,
		RadioButton,
		RadioButtons,
		Rectangle,
		RichTextBlock
	} from 'winui-svelte/preview';
	import {
		EASING_MODES,
		EASING_NAMES,
		linearEasing,
		type EasingMode,
		type EasingName
	} from '$lib/easing';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/motion/easingfunction');
	if (item === null) throw new Error('Easing Functions page has no Gallery item');
	const standardSample = sampleOf('EasingFunction/StandardEasingFunction.txt');
	const accelerateSample = sampleOf('EasingFunction/AccelerateEasingFunction.txt');
	const decelerateSample = sampleOf('EasingFunction/DecelerateEasingFunction.txt');
	const otherSample = sampleOf('EasingFunction/OtherXamlEasingFunctions.txt');

	// EasingFunctionPage.xaml:28 — CircleEase with EasingMode="EaseInOut".
	const STANDARD_CURVE = linearEasing('CircleEase', 'EaseInOut');
	// EasingFunctionPage.xaml:92 — the initial NumberBox value and our empty-box fallback.
	const ACCELERATE_EXPONENT = 4.5;
	// EasingFunctionPage.xaml:139 — the initial NumberBox value and our empty-box fallback.
	const DECELERATE_EXPONENT = 7;
	// EasingFunctionPage.xaml.cs:24-37 — the ComboBox's named easing functions in source order.
	const easingItems = EASING_NAMES.map((value) => ({ value, label: value }));

	let standardX = $state(0);
	let accelerateX = $state(0);
	let decelerateX = $state(0);
	let otherX = $state(0);
	let accelerateExponent = $state<number | null>(ACCELERATE_EXPONENT);
	let decelerateExponent = $state<number | null>(DECELERATE_EXPONENT);
	let selectedEasing = $state<EasingName>('BackEase');
	let selectedMode = $state<EasingMode>('EaseOut');

	// The source has no empty NumberBox fallback; `linear()` cannot contain NaN, so this is ours.
	const accelerateCurve = $derived(
		linearEasing('ExponentialEase', 'EaseIn', {
			exponent: accelerateExponent ?? ACCELERATE_EXPONENT
		})
	);
	// The source has no empty NumberBox fallback; `linear()` cannot contain NaN, so this is ours.
	const decelerateCurve = $derived(
		linearEasing('ExponentialEase', 'EaseOut', {
			exponent: decelerateExponent ?? DECELERATE_EXPONENT
		})
	);
	const otherCurve = $derived(linearEasing(selectedEasing, selectedMode));
</script>

<ItemPage {item}>
	<!-- EasingFunctionPage.xaml:13-17 — BodyRichTextBlockStyle and three zero-margin Paragraphs.

	     The class is the TextBlock name because the two are the same class. generic.xaml:11150-11152
	     and :11133-11135 each add FontWeight="Normal" to a base, and the two bases — :11140-11149
	     and :11106-11114 — differ only in TextTrimming, OpticalMarginAlignment, and a FontSize
	     written literally as 14 rather than through BodyTextBlockFontSize, which is 14. The first
	     two are in the ramp converter's IGNORED_SETTERS (scripts/tokens/generate.mjs), so a
	     generated winui-BodyRichTextBlockStyle would emit bytes that already exist under this name. -->
	<RichTextBlock class="winui-BodyTextBlockStyle">
		<Paragraph>- Use the Standard easing function for animating general property changes.</Paragraph
		>
		<Paragraph
			>- Use the Accelerate easing function to animate objects that are exiting the scene.</Paragraph
		>
		<Paragraph
			>- Use the Decelerate easing function to animate objects that are entering the scene.</Paragraph
		>
	</RichTextBlock>

	<ControlExample
		headerText={standardSample.header ?? undefined}
		xaml={standardSample.xaml ?? undefined}
	>
		<!-- EasingFunctionPage.xaml:33-49 — two Grid columns, Button, and accent Rectangle.
		     The button keeps its own height and centres against the rectangle; see the style block. -->
		<div class="animation-grid standard-animation">
			<!-- EasingFunctionPage.xaml.cs:60 — toggles Translation1.X between 0 and 200. -->
			<Button
				aria-label="Animate rectangle using Standard Easing Function"
				onclick={() => (standardX = standardX > 0 ? 0 : 200)}>Animate</Button
			>
			<Rectangle
				class="animated-rectangle"
				fill="var(--winui-SystemAccentColor)"
				style={`translate: ${standardX}px; --curve: ${STANDARD_CURVE}`}
			/>
		</div>
	</ControlExample>

	<!-- EasingFunctionPage.xaml:90, :137, :153 — not reproduced: AutomationProperties.Name on
	     the Accelerate and Decelerate NumberBoxes and the easing ComboBox. Those components pass
	     rest props to a wrapper div, not their input or trigger, so aria-label would mislabel it. -->
	<ControlExample
		headerText={accelerateSample.header ?? undefined}
		xaml={accelerateSample.xaml ?? undefined}
		substitutions={{
			AccelerateEasingExponent: accelerateExponent === null ? 'NaN' : String(accelerateExponent)
		}}
	>
		<!-- EasingFunctionPage.xaml:68-85 — two Grid columns, Button, and accent Rectangle.
		     The button keeps its own height and centres against the rectangle; see the style block. -->
		<div class="animation-grid accelerate-animation">
			<!-- EasingFunctionPage.xaml.cs:67 — toggles Translation2.X between 0 and 200. -->
			<Button
				aria-label="Animate rectangle using Accelerate Easing Function"
				onclick={() => (accelerateX = accelerateX > 0 ? 0 : 200)}>Animate</Button
			>
			<Rectangle
				class="animated-rectangle"
				fill="var(--winui-SystemAccentColor)"
				style={`translate: ${accelerateX}px; --curve: ${accelerateCurve}`}
			/>
		</div>
		{#snippet options()}
			<!-- EasingFunctionPage.xaml:87-93 — NumberBox Header="Exponent", Value="4.5". -->
			<NumberBox header="Exponent" bind:value={accelerateExponent} />
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={decelerateSample.header ?? undefined}
		xaml={decelerateSample.xaml ?? undefined}
		substitutions={{
			DecelerateEasingExponent: decelerateExponent === null ? 'NaN' : String(decelerateExponent)
		}}
	>
		<!-- EasingFunctionPage.xaml:115-131 — two Grid columns, Button, and accent Rectangle.
		     The button keeps its own height and centres against the rectangle; see the style block. -->
		<div class="animation-grid decelerate-animation">
			<!-- EasingFunctionPage.xaml.cs:74 — toggles Translation3.X between 0 and 200. -->
			<Button
				aria-label="Animate rectangle using Decelerate Easing Function"
				onclick={() => (decelerateX = decelerateX > 0 ? 0 : 200)}>Animate</Button
			>
			<Rectangle
				class="animated-rectangle"
				fill="var(--winui-SystemAccentColor)"
				style={`translate: ${decelerateX}px; --curve: ${decelerateCurve}`}
			/>
		</div>
		{#snippet options()}
			<!-- EasingFunctionPage.xaml:134-140 — NumberBox Header="Exponent", Value="7". -->
			<NumberBox header="Exponent" bind:value={decelerateExponent} />
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={otherSample.header ?? undefined}
		xaml={otherSample.xaml ?? undefined}
		substitutions={{ EasingFunction: selectedEasing }}
	>
		<!-- EasingFunctionPage.xaml:171-200 — two Grid columns, Button, and accent Rectangle.
		     The button keeps its own height and centres against the rectangle; see the style block. -->
		<div class="animation-grid other-animation">
			<!-- EasingFunctionPage.xaml.cs:94 — toggles Translation4.X between 0 and 200. -->
			<Button
				aria-label="Animate rectangle using an Easing Function"
				onclick={() => (otherX = otherX > 0 ? 0 : 200)}>Animate</Button
			>
			<Rectangle
				class="animated-rectangle"
				fill="var(--winui-SystemAccentColor)"
				style={`translate: ${otherX}px; --curve: ${otherCurve}`}
			/>
		</div>
		{#snippet options()}
			<!-- EasingFunctionPage.xaml:148-170 — ComboBox followed by three RadioButtons. -->
			<div class="options">
				<ComboBox items={easingItems} bind:value={selectedEasing} />
				<RadioButtons>
					{#each EASING_MODES as mode (mode)}
						<RadioButton name="easing-function-mode" value={mode} bind:group={selectedMode}
							>{mode}</RadioButton
						>
					{/each}
				</RadioButtons>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	/* EasingFunctionPage.xaml:149 — a StackPanel with no Spacing, so the ComboBox and the
	   RadioButtons sit against each other with nothing between them, and each stretches to the
	   pane's width the way a StackPanel's children do. The stretch is not free: `ComboBox`'s
	   own root is `inline-flex`, so inside a plain block it comes out at its content width —
	   96px against the pane's 121 here — and only a flex column's default `align-items:
	   stretch` fills it. Same rule, same reason, as the options pane on the PipsPager page. */
	.options {
		display: flex;
		flex-direction: column;
	}

	/* EasingFunctionPage.xaml:33-36, :68-71, :115-118, :181-184 — Grid's Auto and star
	   columns, with the star column's MinWidth="300". */
	.animation-grid {
		display: grid;
		grid-template-columns: auto minmax(300px, 1fr);
	}

	/* generic.xaml:27630-27631 — `DefaultButtonStyle` sets `HorizontalAlignment="Left"` and
	   `VerticalAlignment="Center"`, so a WinUI Button never stretches to the cell it is given.
	   It keeps its own height and centres against the taller rectangle beside it. CSS grid
	   stretches by default and had the button 50px tall, which is what the reference disproves:
	   there the rectangle spans y317-366 and the button y326-357, the same 9px inset at both
	   ends of a 32px control in a 50px row. Read out of the pin rather than reasoned from
	   XAML's general rule, which on its own predicts the stretch. */
	.animation-grid :global(button) {
		place-self: center start;
	}

	/* EasingFunctionPage.xaml:43-45, :78-80, :125-127, :193-195 — each rectangle is 50 square
	   and filled with SystemAccentColor.

	   `place-self: center` is the other half of that: a XAML element given an explicit size
	   under the default `Stretch` alignment is centred in the space it was allotted, not pinned
	   to its start. The star column here is its 300px minimum and begins at x446 on the
	   reference, where the rectangle sits at x571 — 446 + 150 - 25, centred to the pixel. */
	.animation-grid :global(.animated-rectangle) {
		place-self: center;
		width: 50px;
		height: 50px;
	}

	.standard-animation :global(.animated-rectangle),
	.other-animation :global(.animated-rectangle) {
		/* c1-allow: EasingFunctionPage.xaml:26 and :177 — both transitions use Duration="0:0:0.5". */
		transition: translate 500ms var(--curve);
	}

	.accelerate-animation :global(.animated-rectangle) {
		/* c1-allow: EasingFunctionPage.xaml:61 — Duration="0:0:0.15". */
		transition: translate 150ms var(--curve);
	}

	.decelerate-animation :global(.animated-rectangle) {
		/* c1-allow: EasingFunctionPage.xaml:108 — Duration="0:0:0.3". */
		transition: translate 300ms var(--curve);
	}
</style>
