<script lang="ts">
	import { Button, Hyperlink, Image, PasswordBox } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import NotApplicablePanel from '$lib/frame/NotApplicablePanel.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/media/mapcontrol');
	if (item === null) throw new Error('MapControl page has no Gallery item');
	const sample = sampleOf('MapControl/MapControlShowingPinMap.txt');

	let token = $state('');

	// MapControlPage.xaml.cs:48-51 and :53-59 — Click and Enter both write the token onto the
	// map. WD-063: there is no map, so both are the same no-op, and the value is read here only
	// so that a reader can see the control take it.
	function setToken() {
		void token;
	}
</script>

<ItemPage {item}>
	<!-- MapControlPage.xaml:21-24. The XAML <Hyperlink> is reproduced by Hyperlink.
	     The doubled space before the link is not a typo: `xml:space="preserve"` on the Span
	     keeps both the space ending the Run and the one between the tags, and the gap measures
	     8px on the reference guest against 5-6px for an ordinary word gap. -->
	<p class="prose winui-BodyTextBlockStyle">
		Follow instructions&nbsp;
		<Hyperlink navigateUri="https://learn.microsoft.com/azure/azure-maps/how-to-manage-account-keys"
			>here</Hyperlink
		> to obtain your MapServiceToken.
	</p>

	<!-- MapControlPage.xaml:25-29 — Height 320, left-aligned, AccessibilityView="Raw", which is
	     the empty `alt` the Image component already writes. 995x742 at height 320 is 429 wide,
	     measured. -->
	<Image source="/MapExample.png" style="height: 320px" />

	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		csharp={sample.csharp ?? undefined}
		horizontalContentAlignment="stretch"
	>
		<div class="example">
			<!-- MapControlPage.xaml:36-44 — a horizontal StackPanel of Spacing 8. -->
			<div class="token-row">
				<!-- WD-042. MapControlPage.xaml:37-42 gives the box `MinWidth="200"` and the original
				     renders exactly that — measured, x 370..570 on the reference guest. This one
				     renders 318, because PasswordBox.svelte's `.box` rule floors the box at a
				     number that is this library's own rather than the pin's, and a floor on an
				     inner element is not reachable from a `style` a consumer passes to the root.
				     The 200 is written anyway: it is the source's number, and it becomes the
				     rendered one the day that floor goes. The button that follows sits 118px right
				     of the original's. -->
				<PasswordBox
					bind:value={token}
					placeholder="Map service token"
					aria-label="Map service token"
					style="min-width: 200px"
				/>
				<!-- WD-063. MapControlPage.xaml.cs:48-51 writes MapToken.Password onto map1.MapServiceToken;
				     there is no map here for it to reach, so the button is inert and the row says so. -->
				<Button onclick={setToken}>Set token</Button>
			</div>
			<!-- WD-063. MapControlPage.xaml:45-49 — Height 400, stretched. With no service token the
			     original draws a plain white rectangle carrying the Azure wordmark and nothing else,
			     photographed on the reference guest. -->
			<NotApplicablePanel
				element="MapControl"
				reason="An Azure Maps service token and its tile service are what draw a map, and neither is part of this reproduction"
				row="WD-063"
				height={400}
			/>
		</div>
	</ControlExample>
</ItemPage>

<style>
	.prose {
		margin: 0 0 12px;
	}
	.example {
		/* MapControlPage.xaml:35 — a StackPanel of Spacing 12. */
		display: flex;
		flex-direction: column;
		gap: 12px;
		width: 100%;
	}
	.token-row {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}
</style>
