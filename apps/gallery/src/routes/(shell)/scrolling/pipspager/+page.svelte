<script lang="ts">
	import {
		ComboBox,
		FlipView,
		PipsPager,
		type ComboBoxProps,
		type PipsPagerProps
	} from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	type OrientationName = 'Horizontal' | 'Vertical';
	type ButtonVisibilityName = 'Visible' | 'VisibleOnPointerOver' | 'Collapsed';
	type WrapModeName = 'None' | 'Wrap';

	const item = itemOf('/scrolling/pipspager');
	if (item === null) throw new Error('PipsPager page has no Gallery item');
	const flipViewSample = sampleOf('PipsPager/PipspagerIntegratedFlipview.txt');
	const optionsSample = sampleOf('PipsPager/PipspagerOptionsChangeOrientation.txt');

	const ORIENTATIONS: Record<OrientationName, NonNullable<PipsPagerProps['orientation']>> = {
		Horizontal: 'horizontal',
		Vertical: 'vertical'
	};
	const BUTTON_VISIBILITIES: Record<
		ButtonVisibilityName,
		NonNullable<PipsPagerProps['previousButtonVisibility']>
	> = {
		Visible: 'visible',
		VisibleOnPointerOver: 'visibleOnPointerOver',
		Collapsed: 'collapsed'
	};
	const WRAP_MODES: Record<WrapModeName, NonNullable<PipsPagerProps['wrapMode']>> = {
		None: 'none',
		Wrap: 'wrap'
	};
	const orientationItems: ComboBoxProps['items'] = Object.keys(ORIENTATIONS).map((value) => ({
		value,
		label: value
	}));
	const buttonVisibilityItems: ComboBoxProps['items'] = Object.keys(BUTTON_VISIBILITIES).map(
		(value) => ({ value, label: value })
	);
	const wrapModeItems: ComboBoxProps['items'] = Object.keys(WRAP_MODES).map((value) => ({
		value,
		label: value
	}));

	// PipsPagerPage.xaml.cs — the eight `Assets/SampleMedia` pictures the FlipView flips through,
	// and `NumberOfPages="{x:Bind Pictures.Count}"` is this list's length.
	const PICTURES = Array.from({ length: 8 }, (_, index) => `LandscapeImage${index + 1}`);

	let galleryIndex = $state(0);
	let orientation = $state<OrientationName>('Horizontal');
	let previousButtonVisibility = $state<ButtonVisibilityName>('Visible');
	let nextButtonVisibility = $state<ButtonVisibilityName>('Visible');
	let wrapMode = $state<WrapModeName>('None');
</script>

<ItemPage {item}>
	<ControlExample
		headerText={flipViewSample.header ?? undefined}
		xaml={flipViewSample.xaml ?? undefined}
	>
		<!-- PipsPagerPage.xaml:13-33. -->
		<div class="sample-stack" data-vertical-alignment="top">
			<FlipView
				items={PICTURES}
				bind:selectedIndex={galleryIndex}
				class="picture-flip-view"
				{itemTemplate}
			/>
			<!-- `SelectedPageIndex` is bound two-way to the FlipView's index, so turning the
			     FlipView moves the pips and clicking a pip turns the FlipView. -->
			<PipsPager
				class="flip-view-pips"
				numberOfPages={PICTURES.length}
				bind:selectedPageIndex={galleryIndex}
			/>
		</div>
	</ControlExample>

	<ControlExample
		headerText={optionsSample.header ?? undefined}
		xaml={optionsSample.xaml ?? undefined}
		substitutions={{
			Orientation: orientation,
			PrevButton: previousButtonVisibility,
			NextButton: nextButtonVisibility,
			WrapMode: wrapMode
		}}
	>
		<!-- PipsPagerPage.xaml:38-41. -->
		<PipsPager
			numberOfPages={10}
			orientation={ORIENTATIONS[orientation]}
			previousButtonVisibility={BUTTON_VISIBILITIES[previousButtonVisibility]}
			nextButtonVisibility={BUTTON_VISIBILITIES[nextButtonVisibility]}
			wrapMode={WRAP_MODES[wrapMode]}
		/>
		{#snippet options()}
			<!-- PipsPagerPage.xaml:44-79. -->
			<div class="options">
				<ComboBox header="Orientation" items={orientationItems} bind:value={orientation} />
				<ComboBox
					header="Previous Button Visibility"
					items={buttonVisibilityItems}
					bind:value={previousButtonVisibility}
				/>
				<ComboBox
					header="Next Button Visibility"
					items={buttonVisibilityItems}
					bind:value={nextButtonVisibility}
				/>
				<ComboBox header="Wrap Mode" items={wrapModeItems} bind:value={wrapMode} />
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

{#snippet itemTemplate(picture: string)}
	<img class="picture" src={`/${picture}.jpg`} alt={picture} />
{/snippet}

<style>
	.sample-stack {
		display: flex;
		flex-direction: column;
	}

	/* PipsPagerPage.xaml:14-26 — `MaxWidth="400" Height="270"`. */
	:global(.picture-flip-view) {
		max-width: 400px;
		height: 270px;
	}

	.picture {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	/* PipsPagerPage.xaml:27-32 — `HorizontalAlignment="Center"` and `Margin="0,12,0,0"`. */
	:global(.flip-view-pips) {
		align-self: center;
		margin-top: 12px;
	}

	.options {
		/* PipsPagerPage.xaml:44 — a StackPanel of four ComboBoxes. It sets no Spacing, so the rows
		   sit against each other and each ComboBox's own header is the gap between them. */
		display: flex;
		flex-direction: column;
	}
</style>
