<script lang="ts">
	import { Button, Image, ToolTip } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/statusandinfo/tooltip');
	if (item === null) throw new Error('ToolTip page has no Gallery item');
	const buttonSample = sampleOf('ToolTip/ButtonSimpleTooltip.txt');
	const offsetSample = sampleOf('ToolTip/TextblockOffsetTooltip.txt');
	const placementSample = sampleOf('ToolTip/ImageTooltipPlacementrect.txt');

	// The trigger's props make what they land on a tab stop and give it a button's `type`. A
	// TextBlock and an Image are no tab stops upstream, so both are taken back off; the spread
	// copy keeps the symbol-keyed attachment the primitive anchors to.
	function notTabStop(props: Record<string, unknown>) {
		const rest = { ...props };
		delete rest.tabindex;
		delete rest.type;
		return rest;
	}
</script>

<ItemPage {item}>
	<ControlExample
		headerText={buttonSample.header ?? undefined}
		xaml={buttonSample.xaml ?? undefined}
	>
		<!-- ToolTipPage.xaml:24. -->
		<ToolTip content="Simple ToolTip">
			{#snippet children(props)}
				<Button {...props}>Button with a simple ToolTip.</Button>
			{/snippet}
		</ToolTip>
	</ControlExample>

	<ControlExample
		headerText={offsetSample.header ?? undefined}
		xaml={offsetSample.xaml ?? undefined}
	>
		<!-- ToolTipPage.xaml:30-34, its VerticalOffset="-80" not drawn. On the reference guest
		     the popup's top sits 48 below the pointer, where the default puts it above: the
		     offset inflates the pointer's point by -80 and turns it inside out
		     (ToolTip_Partial.cpp:1768). The library's `offset` at -80 puts it at the pointer
		     instead, measured, so this draws the default; the offset is owed in
		     docs/library-gate.md's ToolTip row. -->
		<ToolTip content="Offset ToolTip.">
			{#snippet children(props)}
				<span {...notTabStop(props)} class="winui-BodyTextBlockStyle"
					>TextBlock with an offset ToolTip.</span
				>
			{/snippet}
		</ToolTip>
	</ControlExample>

	<ControlExample
		headerText={placementSample.header ?? undefined}
		xaml={placementSample.xaml ?? undefined}
	>
		<!-- ToolTipPage.xaml:40-52. PlacementRect="0,0,400,266" is the Image's own box and
		     Placement="Right" puts the tooltip on its right. Upstream moves a pointer inside
		     the rectangle to its right edge and docks there (ToolTip_Partial.cpp:1791-1820),
		     then inflates that point by the default 20 (:1768), so on the reference guest the
		     tooltip stands 20 clear of the Image, as here, and its vertical position follows
		     the pointer, where here it is centred on the Image.
		     The rectangle is owed in docs/library-gate.md's ToolTip row. FullDescription is
		     the popup's aria-description. -->
		<ToolTip
			content="Non-occluding ToolTip."
			placement="right"
			aria-description="Non-occluding tooltip"
		>
			{#snippet children(props)}
				<!-- Width="400" Height="266". -->
				<Image {...notTabStop(props)} source="/cliff.jpg" style="width: 400px; height: 266px" />
			{/snippet}
		</ToolTip>
	</ControlExample>
</ItemPage>
