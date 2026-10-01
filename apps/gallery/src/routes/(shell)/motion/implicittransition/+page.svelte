<script lang="ts">
	import { Button, CheckBox, NumberBox, Rectangle } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';
	import { theme } from '$lib/theme.svelte';

	const item = itemOf('/motion/implicittransition');
	if (item === null) throw new Error('Implicit Transitions page has no Gallery item');
	const opacitySample = sampleOf(
		'ImplicitTransition/ImplicitTransitionAutomaticallyAnimateChangesOpacity.txt'
	);
	const rotationSample = sampleOf(
		'ImplicitTransition/ImplicitTransitionAutomaticallyAnimateChangesRotation.txt'
	);
	const scaleSample = sampleOf(
		'ImplicitTransition/ImplicitTransitionAutomaticallyAnimateChangesScale.txt'
	);
	const translationSample = sampleOf(
		'ImplicitTransition/ImplicitTransitionAutomaticallyAnimateChangesTranslation.txt'
	);
	const backgroundSample = sampleOf(
		'ImplicitTransition/ImplicitTransitionImplicitlyAnimateBackgroundChanges.txt'
	);
	const gridThemeSample = sampleOf(
		'ImplicitTransition/ImplicitTransitionImplicitlyAnimateGridTheme.txt'
	);

	let opacity = $state<number | null>(0.5);
	let appliedOpacity = $state(0.5);
	// ImplicitTransitionPage.xaml:45-50 starts this substitution at 1.0 although the Rectangle is
	// 0.5. A string, because `Value="1.0"` is one until the first click replaces it with a float —
	// `String(1)` is "1" and the sample pane would read `Opacity = 1` where upstream reads `1.0`.
	let opacityValue = $state('1.0');
	let rotation = $state<number | null>(45);
	let appliedRotation = $state(0);
	let rotationValue = $state(45);
	let scale = $state<number | null>(1);
	let appliedScale = $state(1);
	let scaleValue = $state(1);
	let translation = $state<number | null>(1);
	// ImplicitTransitionPage.xaml:162-168 sets no Translation, so the Rectangle starts at (0,0,0)
	// while its NumberBox and its substitution start at 1. The three are not one number.
	let appliedTranslation = $state(0);
	let translationValue = $state(1);
	let scaleX = $state(true);
	let scaleY = $state(true);
	let scaleZ = $state(true);
	let translateX = $state(true);
	let translateY = $state(true);
	let translateZ = $state(true);
	let backgroundIsBlue = $state(true);

	function valueOrZero(value: number | null, setValue: (value: number) => void) {
		if (value === null) {
			setValue(0);
			return 0;
		}
		return value;
	}

	function applyOpacity() {
		appliedOpacity = valueOrZero(opacity, (value) => (opacity = value));
		opacityValue = String(appliedOpacity);
	}

	function applyRotation() {
		appliedRotation = valueOrZero(rotation, (value) => (rotation = value));
		rotationValue = appliedRotation;
	}

	function applyScale(value?: number) {
		appliedScale = value ?? valueOrZero(scale, (next) => (scale = next));
		scaleValue = appliedScale;
	}

	function applyTranslation(value?: number) {
		appliedTranslation = value ?? valueOrZero(translation, (next) => (translation = next));
		translationValue = appliedTranslation;
	}

	function applyOnEnter(event: KeyboardEvent, apply: () => void) {
		if (event.key === 'Enter') apply();
	}

	function toggleTheme() {
		const dark =
			theme.value === 'dark' ||
			(theme.value === '' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		theme.value = dark ? 'light' : 'dark';
	}
</script>

<ItemPage {item}>
	<!-- ImplicitTransitionPage.xaml.cs:48, :63, :91, :119, :157, :163, :181 call
	     UIHelper.AnnounceActionForAccessibility. This page does not add a live region: these are
	     already-visible visual changes, and no other reproduced Gallery page announces them. -->
	<ControlExample
		headerText={opacitySample.header ?? undefined}
		xaml={opacitySample.xaml ?? undefined}
		csharp={opacitySample.csharp ?? undefined}
		substitutions={{ Opacity: opacityValue }}
	>
		<!-- ImplicitTransitionPage.xaml:17-24 — 50 square accent Rectangle, Margin="45,5,5,5". -->
		<Rectangle
			class="opacity-rectangle"
			fill="var(--winui-SystemAccentColor)"
			style={`opacity: ${appliedOpacity}`}
		/>
		{#snippet options()}
			<!-- ImplicitTransitionPage.xaml:25-43 — StackPanel makes its NumberBox and Button stretch. -->
			<div class="options">
				<NumberBox
					class="option-control"
					header="Opacity (0.0 to 1.0)"
					min={0}
					max={1}
					bind:value={opacity}
					onkeydown={(event: KeyboardEvent) => applyOnEnter(event, applyOpacity)}
				/>
				<Button class="option-control" onclick={applyOpacity}>Set Opacity</Button>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={rotationSample.header ?? undefined}
		xaml={rotationSample.xaml ?? undefined}
		csharp={rotationSample.csharp ?? undefined}
		substitutions={{ Rotation: String(rotationValue) }}
	>
		<!-- ImplicitTransitionPage.xaml:53-65 uses Rectangle with a LinearGradientBrush. Rectangle
		     accepts SVG paint, not CSS gradients, so this div expresses its background instead. -->
		<div class="rotation-rectangle" style={`rotate: ${appliedRotation}deg`}></div>
		{#snippet options()}
			<div class="options">
				<NumberBox
					class="option-control"
					header="Rotation (0.0 to 360.0)"
					min={0}
					max={360}
					bind:value={rotation}
					onkeydown={(event: KeyboardEvent) => applyOnEnter(event, applyRotation)}
				/>
				<Button class="option-control" onclick={applyRotation}>Set Rotation</Button>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={scaleSample.header ?? undefined}
		xaml={scaleSample.xaml ?? undefined}
		csharp={scaleSample.csharp ?? undefined}
		substitutions={{ Scale: String(scaleValue) }}
	>
		<!-- ImplicitTransitionPage.xaml:95-101 — the outer transformed Rectangle has Margin="45,5,5,5"
		     and VerticalAlignment="Top". -->
		<div
			class="scale-axis"
			data-animated={scaleX || undefined}
			data-vertical-alignment="top"
			style={`scale: ${appliedScale} 1 1`}
		>
			<div
				class="scale-axis"
				data-animated={scaleY || undefined}
				style={`scale: 1 ${appliedScale} 1`}
			>
				<!-- ImplicitTransitionPage.xaml.cs:84-86 applies Z. Without perspective it is real DOM
				     state but has no rendered effect for this flat Rectangle. -->
				<div
					class="scale-axis"
					data-animated={scaleZ || undefined}
					style={`scale: 1 1 ${appliedScale}`}
				>
					<Rectangle class="transformed-rectangle" fill="var(--winui-SystemAccentColor)" />
				</div>
			</div>
		</div>
		{#snippet options()}
			<div class="options">
				<Button class="option-control" onclick={() => applyScale(0.5)}
					>Set Scale to (0.5, 0.5, 0.5)</Button
				>
				<Button class="option-control" onclick={() => applyScale(1)}
					>Set Scale to (1.0, 1.0, 1.0)</Button
				>
				<Button class="option-control" onclick={() => applyScale(2)}
					>Set Scale to (2.0, 2.0, 2.0)</Button
				>
				<span class="winui-BodyTextBlockStyle">Components</span>
				<CheckBox bind:checked={scaleX}>Animate X</CheckBox>
				<CheckBox bind:checked={scaleY}>Animate Y</CheckBox>
				<CheckBox bind:checked={scaleZ}>Animate Z</CheckBox>
				<NumberBox
					class="option-control"
					header="Scale (0.0 to 5.0)"
					min={0}
					max={5}
					bind:value={scale}
					onkeydown={(event: KeyboardEvent) => applyOnEnter(event, applyScale)}
				/>
				<Button class="option-control" onclick={() => applyScale()}>Set custom scale</Button>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={translationSample.header ?? undefined}
		xaml={translationSample.xaml ?? undefined}
		csharp={translationSample.csharp ?? undefined}
		substitutions={{ Translation: String(translationValue) }}
	>
		<!-- ImplicitTransitionPage.xaml:161-167 — the outer transformed Rectangle has Margin="45,5,5,5"
		     and VerticalAlignment="Top". -->
		<div
			class="translate-axis"
			data-animated={translateX || undefined}
			data-vertical-alignment="top"
			style={`translate: ${appliedTranslation}px 0 0`}
		>
			<div
				class="translate-axis"
				data-animated={translateY || undefined}
				style={`translate: 0 ${appliedTranslation}px 0`}
			>
				<!-- ImplicitTransitionPage.xaml.cs:112-114 applies Z. Without perspective it is real DOM
				     state but has no rendered effect for this flat Rectangle. -->
				<div
					class="translate-axis"
					data-animated={translateZ || undefined}
					style={`translate: 0 0 ${appliedTranslation}px`}
				>
					<Rectangle class="transformed-rectangle" fill="var(--winui-SystemAccentColor)" />
				</div>
			</div>
		</div>
		{#snippet options()}
			<div class="options">
				<Button class="option-control" onclick={() => applyTranslation(0)}
					>Set Translation to (0, 0, 0)</Button
				>
				<Button class="option-control" onclick={() => applyTranslation(100)}
					>Set Translation to (100, 100, 100)</Button
				>
				<Button class="option-control" onclick={() => applyTranslation(200)}
					>Set Translation to (200, 200, 200)</Button
				>
				<span class="winui-BodyTextBlockStyle">Components</span>
				<CheckBox bind:checked={translateX}>Animate X</CheckBox>
				<CheckBox bind:checked={translateY}>Animate Y</CheckBox>
				<CheckBox bind:checked={translateZ}>Animate Z</CheckBox>
				<NumberBox
					class="option-control"
					header="Translation (0.0 to 200.0)"
					min={0}
					max={200}
					bind:value={translation}
					onkeydown={(event: KeyboardEvent) => applyOnEnter(event, applyTranslation)}
				/>
				<Button class="option-control" onclick={() => applyTranslation()}
					>Set custom Translation</Button
				>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={backgroundSample.header ?? undefined}
		xaml={backgroundSample.xaml ?? undefined}
		csharp={backgroundSample.csharp ?? undefined}
	>
		<!-- ImplicitTransitionPage.xaml:228-235 uses ContentPresenter, which the library has not
		     implemented; it presents no content here, so a plain div is the same visible box. -->
		<div
			class="background-presenter"
			data-vertical-alignment="top"
			style={`background-color: ${backgroundIsBlue ? 'blue' : 'yellow'}`}
		></div>
		{#snippet options()}
			<Button onclick={() => (backgroundIsBlue = !backgroundIsBlue)}>Change Background Color</Button
			>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={gridThemeSample.header ?? undefined}
		xaml={gridThemeSample.xaml ?? undefined}
		csharp={gridThemeSample.csharp ?? undefined}
	>
		<!-- WD-043: the theme flip is the app's, not this Grid's; see docs/divergences.md -->
		<div class="theme-grid" data-vertical-alignment="top">
			<div class="theme-grid-content">
				<div class="winui-SubtitleTextBlockStyle">Lorem Ipsum</div>
				<div>The background of this grid animates when the theme changes.</div>
				<Button>Button</Button>
				<CheckBox>CheckBox</CheckBox>
			</div>
		</div>
		{#snippet options()}
			<Button onclick={toggleTheme}>Change Theme</Button>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	/* ImplicitTransitionPage.xaml:25-43 — each options StackPanel stretches its children; this
	   flex column supplies that stretch for inline-flex NumberBox roots as Easing Functions does. */
	.options {
		display: flex;
		flex-direction: column;
	}

	/* ImplicitTransitionPage.xaml:17-24, :53-65 — Margin="45,5,5,5" on the two boxes that are
	   also VerticalAlignment="Center", which is what a lone child of the example area already is. */
	:global(.opacity-rectangle),
	.rotation-rectangle {
		margin: 5px 5px 5px 45px;
	}

	/* ImplicitTransitionPage.xaml:95-101, :161-167, :228-235 — the same margin on the three boxes
	   that are VerticalAlignment="Top". The bottom is `auto` and not 5: a XAML Top alignment makes
	   the bottom margin reserved space rather than a position, and the element sits at the top.

	   Written here rather than left to `ControlExample`'s own
	   `.example > [data-vertical-alignment='top'] { margin-bottom: auto }`. That rule and a
	   `[data-vertical-alignment='top']` selector in this file are both (0,3,0) once Svelte's scope
	   class is counted, so which one wins is stylesheet order — it happens to be the right one
	   today, and a shorthand `margin` here would silently centre these three boxes the day it is
	   not. Stating `auto` makes both outcomes the same outcome. */
	.background-presenter,
	.scale-axis[data-vertical-alignment='top'],
	.translate-axis[data-vertical-alignment='top'] {
		margin: 5px 5px auto 45px;
	}

	/* ImplicitTransitionPage.xaml:26-43, :68-85, :106-150, :172-217 — these options controls
	   each carry Margin="5". */
	:global(.option-control) {
		margin: 5px;
	}

	:global(.opacity-rectangle),
	.rotation-rectangle,
	.background-presenter,
	:global(.transformed-rectangle) {
		width: 50px;
		height: 50px;
	}

	/* `Rectangle` renders an `<svg>`, which is inline, so the axis wrapper around it is a line box
	   and comes out 54 pixels tall against the 50 it contains — measured on the reference before
	   this line existed. The two examples that wrap the box are the only ones that can see it. */
	:global(.transformed-rectangle) {
		display: block;
	}

	:global(.opacity-rectangle) {
		/* c1-allow: SimplePropertiesMetadata.g.h:370; SharedTransitionAnimations.cpp:22. */
		transition: opacity 300ms cubic-bezier(0.8, 0, 0.2, 1);
	}

	/* ImplicitTransitionPage.xaml.cs:59 sets CenterPoint to ActualWidth / 2 and ActualHeight / 2. */
	.rotation-rectangle {
		/* c1-allow: ImplicitTransitionPage.xaml:63, GradientStop Color="LightGray". */
		background: linear-gradient(to bottom, lightgray, var(--winui-SystemAccentColor));
		transform-origin: center;
		/* c1-allow: SimplePropertiesMetadata.g.h:370; SharedTransitionAnimations.cpp:22. */
		transition: rotate 300ms cubic-bezier(0.8, 0, 0.2, 1);
	}

	/* ImplicitTransitionPage.xaml.cs:84-86 leaves UIElement.CenterPoint at its (0, 0, 0) default. */
	.scale-axis {
		transform-origin: 0 0;
	}

	.scale-axis[data-animated] {
		/* c1-allow: SimplePropertiesMetadata.g.h:426; SharedTransitionAnimations.cpp:22-24. */
		transition: scale 300ms cubic-bezier(0.8, 0, 0.2, 1);
	}

	.translate-axis[data-animated] {
		/* c1-allow: SimplePropertiesMetadata.g.h:426; SharedTransitionAnimations.cpp:22-24. */
		transition: translate 300ms cubic-bezier(0.8, 0, 0.2, 1);
	}

	.background-presenter {
		/* c1-allow: SimplePropertiesMetadata.g.h:363; SharedTransitionAnimations.cpp:15. */
		transition: background-color 150ms linear;
	}

	/* ImplicitTransitionPage.xaml:244-259 — Grid Width="300", MinHeight="200", BorderBrush
	   DimGray, BorderThickness="1", with a StackPanel Margin="12" and Spacing="6". */
	.theme-grid {
		/* A XAML Width is the outer measurement and includes BorderThickness, so 300 with a 1px
		   border is 300 and not 302. CSS counts the other way round by default. */
		box-sizing: border-box;
		width: 300px;
		min-height: 200px;
		/* c1-allow: ImplicitTransitionPage.xaml:250-253, BorderBrush="DimGray". */
		border: 1px solid dimgray;
		background: var(--winui-SolidBackgroundFillColorBaseBrush);
		/* c1-allow: SimplePropertiesMetadata.g.h:363; SharedTransitionAnimations.cpp:15. */
		transition: background-color 150ms linear;
	}

	.theme-grid-content {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 12px;
	}

	/* ADR 0016, applied to this page: each implicit transition the sample sets —
	   `OpacityTransition`, `RotationTransition`, `ScaleTransition`, `TranslationTransition` — plays
	   only while the switch is on, which the property's setter reads
	   (`components/elements/UIElement.cpp`: `SetTranslation` :2146, `SetRotation` :2239, `SetScale`
	   :2319, `BeforeSetLocalOpacity` :2589), and so do the two `BrushTransition`s behind the
	   background samples, one on a `ContentPresenter` and one on a `Grid`
	   (ContentPresenter.cpp:150, panel.cpp:71). So under `prefers-reduced-motion` every change here
	   lands at once. `!important`, because this is one rule for every transitioning element on the
	   page, over rules of every weight. `.opacity-rectangle` is named apart because the Rectangle
	   component renders it. */
	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after,
		:global(.opacity-rectangle) {
			animation-duration: 0s !important;
			animation-delay: 0s !important;
			transition-duration: 0s !important;
			transition-delay: 0s !important;
		}
	}
</style>
