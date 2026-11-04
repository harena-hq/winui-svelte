<script lang="ts">
	import { Button, Image, TeachingTip } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/dialogsandflyouts/teachingtip');
	if (item === null) throw new Error('TeachingTip page has no Gallery item');
	const buttonSample = sampleOf('TeachingTip/ShowTargetedTeachingtipButton.txt');
	const nonTargetedSample = sampleOf('TeachingTip/ShowNonTargetedTeachingtip.txt');
	const heroSample = sampleOf('TeachingTip/ShowTargetedTeachingtipHero.txt');

	// Each button's Click sets its tip's IsOpen to true (TeachingTipPage.xaml.cs:16-29), so a
	// click on an open tip's button leaves it open rather than toggling it.
	let open1 = $state(false);
	let open2 = $state(false);
	let open3 = $state(false);
</script>

<!-- A targeted tip's button is its Target, so it spreads the props that anchor the tip to it.
     Their click and Enter/Space handlers toggle the tip, which the code-behind never does; the
     button's own click replaces the one, and the other is dropped, the button's native
     activation raising that same click. -->
{#snippet target(props: Record<string, unknown>, show: () => void)}
	<Button {...props} onclick={show} onkeydown={undefined}>Show TeachingTip</Button>
{/snippet}

<ItemPage {item}>
	<ControlExample
		headerText={buttonSample.header ?? undefined}
		xaml={buttonSample.xaml ?? undefined}
		csharp={buttonSample.csharp ?? undefined}
	>
		<!-- TeachingTipPage.xaml:24-38, the Refresh symbol's code point (Symbol.Refresh, E72C). -->
		<TeachingTip
			bind:open={open1}
			glyph="E72C"
			title="This is the title"
			subtitle="And this is the subtitle"
		>
			{#snippet children(props)}
				{@render target(props, () => (open1 = true))}
			{/snippet}
		</TeachingTip>
	</ControlExample>

	<ControlExample
		headerText={nonTargetedSample.header ?? undefined}
		xaml={nonTargetedSample.xaml ?? undefined}
		csharp={nonTargetedSample.csharp ?? undefined}
	>
		<!-- TeachingTipPage.xaml:45-56. Untargeted, so the tip is placed against the window
		     rather than the button; PreferredPlacement="Auto" is the default. -->
		<Button onclick={() => (open2 = true)}>Show TeachingTip</Button>
		<TeachingTip
			bind:open={open2}
			title="This is the title"
			subtitle="And this is the subtitle"
			actionButtonContent="Action button"
			closeButtonContent="Close button"
			lightDismissEnabled
			placementMargin={20}
		/>
	</ControlExample>

	<ControlExample
		headerText={heroSample.header ?? undefined}
		xaml={heroSample.xaml ?? undefined}
		csharp={heroSample.csharp ?? undefined}
	>
		<!-- TeachingTipPage.xaml:63-84. -->
		<TeachingTip
			bind:open={open3}
			preferredPlacement="bottom"
			title="This is the title"
			subtitle="And this is the subtitle"
		>
			{#snippet heroContent()}
				<!-- An Image's default Stretch is Uniform, and the hero band stretches it across
				     the card. -->
				<Image source="/sunset.jpg" alt="Sunset" style="width: 100%" />
			{/snippet}
			{#snippet content()}
				<p class="description">Description can go here</p>
			{/snippet}
			{#snippet children(props)}
				{@render target(props, () => (open3 = true))}
			{/snippet}
		</TeachingTip>
	</ControlExample>
</ItemPage>

<style>
	/* The TextBlock's Margin="0,16,0,0" (TeachingTipPage.xaml:79); its WrapWholeWords is CSS's
	   own wrapping. */
	.description {
		margin: 16px 0 0;
	}
</style>
