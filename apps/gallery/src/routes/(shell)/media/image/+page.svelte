<script lang="ts">
	import { Button, Image, RadioButton, RadioButtons, type ImageProps } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	type StretchName = 'None' | 'Fill' | 'Uniform' | 'UniformToFill';

	const item = itemOf('/media/image');
	if (item === null) throw new Error('Image page has no Gallery item');
	const basicSample = sampleOf('Image/BasicImageLocalFile.txt');
	const decodedSample = sampleOf('Image/ImageDecodedRenderingSize.txt');
	const stretchingSample = sampleOf('Image/ImageStretching.txt');
	const nineGridSample = sampleOf('Image/NineGridImages.txt');
	const svgSample = sampleOf('Image/SvgImage.txt');
	const animatedGifSample = sampleOf('Image/AnimatedGif.txt');

	const STRETCH: Record<StretchName, NonNullable<ImageProps['stretch']>> = {
		None: 'none',
		Fill: 'fill',
		Uniform: 'uniform',
		UniformToFill: 'uniformToFill'
	};

	let stretch = $state<StretchName>('None');
</script>

<ItemPage {item}>
	<ControlExample headerText={basicSample.header ?? undefined} xaml={basicSample.xaml ?? undefined}>
		<!-- ImagePage.xaml:10-14 — Image Height="100" and its local source. -->
		<Image source="/treetops.jpg" style="height: 100px" />
	</ControlExample>

	<ControlExample
		headerText={decodedSample.header ?? undefined}
		xaml={decodedSample.xaml ?? undefined}
	>
		<!-- WD-054: DecodePixelHeight changes decode memory, not this example's rendered pixels. The
		     original's two 151x100 boxes differ by a mean absolute 0.14, so this is the same markup
		     as the basic image. -->
		<Image source="/treetops.jpg" style="height: 100px" />
	</ControlExample>

	<ControlExample
		headerText={stretchingSample.header ?? undefined}
		xaml={stretchingSample.xaml ?? undefined}
		substitutions={{ Stretch: stretch }}
	>
		<!-- ImagePage.xaml:26-63 — a 100x100 Image and its stretch-mode RadioButtons. -->
		<Image source="/valley.jpg" stretch={STRETCH[stretch]} style="width: 100px; height: 100px" />
		{#snippet options()}
			<RadioButtons header="Image stretch mode">
				<RadioButton name="image-stretch" value="None" bind:group={stretch}>None</RadioButton>
				<RadioButton name="image-stretch" value="Fill" bind:group={stretch}>Fill</RadioButton>
				<RadioButton name="image-stretch" value="Uniform" bind:group={stretch}>Uniform</RadioButton>
				<RadioButton name="image-stretch" value="UniformToFill" bind:group={stretch}
					>UniformToFill</RadioButton
				>
			</RadioButtons>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={nineGridSample.header ?? undefined}
		xaml={nineGridSample.xaml ?? undefined}
	>
		<!-- ImagePage.xaml:65-82 — the StackPanel has no Spacing, so this flex column has no gap. -->
		<div class="nine-grid-images">
			<p class="winui-BodyTextBlockStyle">The normal image</p>
			<Image source="/ninegrid.gif" style="height: 82px" />
			<p class="winui-BodyTextBlockStyle">Image stretched evenly</p>
			<Image source="/ninegrid.gif" nineGrid="3,3,3,3" style="height: 164px" />
			<p class="winui-BodyTextBlockStyle">Image stretched using nine grid</p>
			<Image source="/ninegrid.gif" nineGrid="30,20,30,20" style="height: 164px" />
		</div>
	</ControlExample>

	<ControlExample headerText={svgSample.header ?? undefined} xaml={svgSample.xaml ?? undefined}>
		<!-- ImagePage.xaml:84-88 — Image Height="100" with an SVG source. -->
		<Image source="/MirrorPCConsent.svg" style="height: 100px" />
	</ControlExample>

	<ControlExample
		headerText={animatedGifSample.header ?? undefined}
		xaml={animatedGifSample.xaml ?? undefined}
	>
		<!-- ImagePage.xaml:90-125 is present in the 2.10.0.0 pin but not Gallery 2.9.3.0 on the
		     reference guest, whose Image page ends at the SVG example. The pin is this
		     reproduction's source of truth, so there is nothing to compare this example against.

		     HorizontalAlignment="Left" on the three Images (:94, :97, :104) is transcribed below. It
		     is not the example pane's alignment — that positions this StackPanel — but each image's
		     own, and a StackPanel otherwise stretches its children across its width the way example
		     4's unaligned images are stretched. Stretched, an Image draws its picture centred in the
		     slot; these three say Left instead. -->
		<div class="animated-gif-images">
			<p class="winui-BodyTextBlockStyle">
				An Image element automatically plays an animated GIF source.
			</p>
			<Image source="/animated.gif" style="height: 40px; align-self: flex-start" />
			<p class="winui-BodyTextBlockStyle">
				Set AutoPlay to False to prevent the GIF from playing automatically.
			</p>
			<Image source="/animated.gif" style="height: 40px; align-self: flex-start" />
			<p class="winui-BodyTextBlockStyle">
				Control playback manually using BitmapImage.Play() and Stop().
			</p>
			<Image source="/animated.gif" style="height: 40px; align-self: flex-start" />
		</div>
		{#snippet options()}
			<!-- WD-053: HTMLImageElement cannot pause a GIF, so all three play and these original
			     controls are rendered disabled. -->
			<div class="playback-buttons">
				<Button disabled>Play</Button>
				<Button disabled>Stop</Button>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.nine-grid-images,
	.animated-gif-images,
	.playback-buttons {
		display: flex;
		flex-direction: column;
	}

	/* A XAML TextBlock carries no margin and the browser's paragraph does, so the labels would
	   arrive with 14px above and below each. Measured on the reference guest: example 4's
	   StackPanel has no Spacing and its labels sit directly on the images. Flex items' margins
	   do not collapse either, so the two would add rather than merge. */
	.nine-grid-images p,
	.animated-gif-images p {
		margin: 0;
	}

	/* ImagePage.xaml:92-113 sets the animated source StackPanel's Spacing="12". */
	.animated-gif-images {
		gap: 12px;
	}

	/* ImagePage.xaml:116-122 sets PlaybackButtons' Spacing="8". */
	.playback-buttons {
		gap: 8px;
	}
</style>
