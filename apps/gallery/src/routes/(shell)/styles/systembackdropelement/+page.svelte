<script lang="ts" module>
	import type { ComboBoxProps } from '@harena-hq/winui-svelte/preview';

	type BackdropType = 'acrylic' | 'mica' | 'micaAlt';

	// SystemBackdropElementPage.xaml:35-37 — the ComboBox items, in source order, map each Tag
	// onto the lower-camel systemBackdrop value that SystemBackdropElement publishes.
	const BACKDROP_TYPES: ComboBoxProps['items'] = [
		{ value: 'acrylic', label: 'Acrylic' },
		{ value: 'mica', label: 'Mica' },
		{ value: 'micaAlt', label: 'Mica Alt' }
	];

	// SystemBackdropElementPage.xaml.cs:19-55 — SelectionChanged replaces XamlSource with the
	// source file for the selected backdrop.
	const XAML_SOURCES: Record<BackdropType, string> = {
		acrylic: 'SampleCode/SystemBackdropElement/SystemBackdropElementAcrylic_xaml.txt',
		mica: 'SampleCode/SystemBackdropElement/SystemBackdropElementMica_xaml.txt',
		micaAlt: 'SampleCode/SystemBackdropElement/SystemBackdropElementMicaAlt_xaml.txt'
	};
</script>

<script lang="ts">
	import { Button, ComboBox, Slider, SystemBackdropElement } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf, textOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/styles/systembackdropelement');
	if (item === null) throw new Error('SystemBackdropElement page has no Gallery item');

	const sample = sampleOf('SystemBackdropElement/SystembackdropelementSample.txt');

	// SystemBackdropElementPage.xaml:33 and :46 — SelectedIndex 0 is Acrylic and Value is 8.
	let backdropType = $state<BackdropType>('acrylic');
	let cornerRadius = $state(8);
	// SystemBackdropElementPage.xaml.cs:19-55 — unlike WD-039's inert AcrylicBrush tint controls,
	// this ComboBox changes both this sample's XAML and SystemBackdropElement's painted backdrop;
	// that is the original behaviour, so no divergence is owed.
	const xaml = $derived(textOf(XAML_SOURCES[backdropType]));
</script>

<!-- SystemBackdropElementPage.xaml:10-60 — the root StackPanel is supplied by ItemPage's
     content frame, while this component supplies the Gallery item header and trailing note. -->
<ItemPage {item}>
	<!-- SystemBackdropElementPage.xaml:11-55 — the one ControlExample, its separately supplied
	     XamlSource, and the live CornerRadius substitution. -->
	<ControlExample
		headerText={sample.header ?? undefined}
		{xaml}
		substitutions={{ CornerRadius: String(cornerRadius) }}
	>
		<!-- SystemBackdropElementPage.xaml:13-26 — Grid, 300 by 200, with both children in its
		     sole cell. HorizontalAlignment="Center" is deliberately absent: ControlExample's
		     default left presenter gives this fixed-width Grid no extra space in which to centre. -->
		<div class="frame">
			<!-- SystemBackdropElementPage.xaml:17-21 — SystemBackdropElement stretches to the Grid
			     cell and follows the selected SystemBackdrop and CornerRadius. With Mica selected it
			     is intentionally invisible because it and the example pane use the same base token. -->
			<SystemBackdropElement class="backdrop" systemBackdrop={backdropType} {cornerRadius} />
			<!-- SystemBackdropElementPage.xaml:22-25 — Button centred in the Grid cell. -->
			<Button class="frame-button">Click Me</Button>
		</div>
		{#snippet options()}
			<!-- SystemBackdropElementPage.xaml:29-47 — StackPanel with a 12-pixel Spacing and its two
			     header-bearing controls. -->
			<div class="options">
				<!-- SystemBackdropElementPage.xaml:30-38 — ComboBox, its Header, SelectedIndex, and items. -->
				<ComboBox header="Backdrop Type" items={BACKDROP_TYPES} bind:value={backdropType} />
				<!-- SystemBackdropElementPage.xaml:39-46 — Slider, Header, 0–50 range, unit step, and
				     authored Value. -->
				<Slider header="Corner radius" min={0} max={50} step={1} bind:value={cornerRadius} />
			</div>
		{/snippet}
	</ControlExample>

	<!-- SystemBackdropElementPage.xaml:56-59 — this note was added in pinned Gallery commit
	     e7be0cc (2026-08-13, #2186), after the shipped reference guest capture. The pin is what
	     this reproduction transcribes, so the extra line relative to the reference is intentional. -->
	<p class="theme-note winui-BodyTextBlockStyle">
		Theme updates for SystemBackdropElement are triggered by app or OS theme changes, not by setting
		theme directly on the element or a parent control.
	</p>
</ItemPage>

<style>
	/* SystemBackdropElementPage.xaml:13-16 — Grid with Width 300 and Height 200. */
	.frame {
		display: grid;
		/* c1-allow: SystemBackdropElementPage.xaml:14 — Grid Width. */
		width: 300px;
		/* c1-allow: SystemBackdropElementPage.xaml:15 — Grid Height. */
		height: 200px;
	}

	/* SystemBackdropElementPage.xaml:17-25 — both Grid children have no row or column, so they
	   share the first cell. */
	.frame > :global(*) {
		grid-area: 1 / 1;
	}

	/* SystemBackdropElementPage.xaml:17-21 — SystemBackdropElement has XAML's default Stretch
	   alignment in both axes. */
	.frame > :global(.backdrop) {
		justify-self: stretch;
		align-self: stretch;
	}

	/* SystemBackdropElementPage.xaml:22-25 — Button HorizontalAlignment and VerticalAlignment
	   are both Center. */
	.frame > :global(.frame-button) {
		justify-self: center;
		align-self: center;
	}

	/* SystemBackdropElementPage.xaml:29 — StackPanel Spacing="12". */
	.options {
		display: flex;
		flex-direction: column;
		/* c1-allow: SystemBackdropElementPage.xaml:29 — StackPanel Spacing. */
		gap: 12px;
	}

	/* SystemBackdropElementPage.xaml:56-59 — TextBlock Margin="0,12,0,0" with no browser
	   paragraph margin. */
	.theme-note {
		/* c1-allow: SystemBackdropElementPage.xaml:57 — TextBlock top margin. */
		margin: 12px 0 0;
	}
</style>
