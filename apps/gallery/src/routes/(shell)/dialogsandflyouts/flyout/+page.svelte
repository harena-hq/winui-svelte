<script lang="ts">
	import { Button, Flyout } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/dialogsandflyouts/flyout');
	if (item === null) throw new Error('Flyout page has no Gallery item');
	const sample = sampleOf('Flyout/ButtonFlyout.txt');

	// The page's `SharedFlyout` resource (FlyoutPage.xaml:20-26) is referenced nowhere, so
	// nothing draws it.

	// DeleteConfirmation_Click hides the button's flyout (FlyoutPage.xaml.cs:16-22).
	let open = $state(false);
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		csharp={sample.csharp ?? undefined}
	>
		<!-- FlyoutPage.xaml:30-42. Placement="Top" is FlyoutBase's default and the component's. -->
		<Flyout bind:open>
			{#snippet children(props)}
				<Button {...props}>Empty cart</Button>
			{/snippet}
			{#snippet content()}
				<div class="content">
					<p class="message winui-BaseTextBlockStyle">
						All items will be removed. Do you want to continue?
					</p>
					<Button onclick={() => (open = false)}>Yes, empty my cart</Button>
				</div>
			{/snippet}
		</Flyout>
	</ControlExample>
</ItemPage>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		/* c1-allow: the TextBlock's Margin="0,0,0,12" (FlyoutPage.xaml:35), the whole gap between
		   it and the button */
		gap: 12px;
	}

	.message {
		margin: 0;
	}
</style>
