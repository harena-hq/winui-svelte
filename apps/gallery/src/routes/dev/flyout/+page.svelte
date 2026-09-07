<script lang="ts">
	import { Button, Flyout } from 'winui-svelte';

	/*
	 * The component's own harness, not part of the Gallery reproduction. Three flyouts are
	 * open so the surface reaches a snapshot at all, and each of those three gets a row with
	 * enough clearance for the side it opens on: a flyout is portalled and absolutely
	 * positioned, so it pushes nothing out of the way and two open ones a row apart will sit
	 * on top of each other. The closed triggers are here for the placements a still image
	 * cannot show more than one of at a time.
	 */
</script>

<svelte:head><title>Flyout — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Flyout</h1>
<p class="winui-BodyTextBlockStyle">
	The Gallery's own example, one flyout per named side, and the four edge-aligned placements.
</p>

<h2 class="winui-SubtitleTextBlockStyle">the Gallery example</h2>
<div class="row clear-above indent">
	<Flyout open>
		{#snippet children(props)}
			<Button {...props}>Empty cart</Button>
		{/snippet}
		{#snippet content()}
			<div class="gallery-content">
				<!-- `Style="{ThemeResource BaseTextBlockStyle}"` at
					     WinUI-Gallery Samples/Flyout/FlyoutPage.xaml:35 — the sample's own
					     ramp, and the reason the original's flyout measures 366 wide where a
					     plain paragraph gives 355. -->
				<p class="message winui-BaseTextBlockStyle">
					All items will be removed. Do you want to continue?
				</p>
				<Button>Yes, empty my cart</Button>
			</div>
		{/snippet}
	</Flyout>
</div>

<h2 class="winui-SubtitleTextBlockStyle">placement</h2>
<div class="row clear-below">
	<Flyout open placement="bottom">
		{#snippet children(props)}
			<Button {...props}>bottom, open</Button>
		{/snippet}
		{#snippet content()}Bottom flyout{/snippet}
	</Flyout>
	<Flyout open={false} placement="top">
		{#snippet children(props)}
			<Button {...props}>top</Button>
		{/snippet}
		{#snippet content()}Top flyout{/snippet}
	</Flyout>
	<Flyout open={false} placement="left">
		{#snippet children(props)}
			<Button {...props}>left</Button>
		{/snippet}
		{#snippet content()}Left flyout{/snippet}
	</Flyout>
	<Flyout open={false} placement="right">
		{#snippet children(props)}
			<Button {...props}>right</Button>
		{/snippet}
		{#snippet content()}Right flyout{/snippet}
	</Flyout>
</div>

<h2 class="winui-SubtitleTextBlockStyle">edge alignment</h2>
<div class="row clear-above">
	<Flyout open placement="topEdgeAlignedLeft">
		{#snippet children(props)}
			<Button {...props}>topEdgeAlignedLeft, open</Button>
		{/snippet}
		{#snippet content()}Top edge aligned left{/snippet}
	</Flyout>
	<Flyout open={false} placement="topEdgeAlignedRight">
		{#snippet children(props)}
			<Button {...props}>topEdgeAlignedRight</Button>
		{/snippet}
		{#snippet content()}Top edge aligned right{/snippet}
	</Flyout>
	<Flyout open={false} placement="bottomEdgeAlignedLeft">
		{#snippet children(props)}
			<Button {...props}>bottomEdgeAlignedLeft</Button>
		{/snippet}
		{#snippet content()}Bottom edge aligned left{/snippet}
	</Flyout>
	<Flyout open={false} placement="bottomEdgeAlignedRight">
		{#snippet children(props)}
			<Button {...props}>bottomEdgeAlignedRight</Button>
		{/snippet}
		{#snippet content()}Bottom edge aligned right{/snippet}
	</Flyout>
</div>

<style>
	.row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 24px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}

	/* A flyout is out of flow, so the room it needs has to be reserved by the row it belongs
	   to. 160px clears the tallest content on this page in either direction. */
	.clear-above {
		margin-top: 160px;
	}

	.clear-below {
		margin-bottom: 160px;
	}

	/* The Gallery's flyout is 355 wide and centred on its trigger, so a trigger at the page's
	   own left inset would put half of it outside the viewport — and collision avoidance would
	   then shift it flush to the edge, photographing a shifted flyout instead of a centred one.
	   The indent is what makes the shot show the placement rather than the correction. */
	.indent {
		padding-left: 200px;
	}

	.gallery-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		/* c1-allow: WinUI-Gallery Samples/Flyout/FlyoutPage.xaml:35, the sample's TextBlock
		   carries `Margin="0,0,0,12"` and that 12 is the whole gap between it and the button */
		gap: 12px;
	}

	.message {
		margin: 0;
	}
</style>
