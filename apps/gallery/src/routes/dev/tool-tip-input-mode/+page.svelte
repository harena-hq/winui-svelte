<script lang="ts">
	import { Button, ToolTip } from 'winui-svelte/preview';

	/** The fifth row's `IsEnabled`, flipped from outside so that a test can flip it mid-delay. */
	let latentDisabled = $state(false);

	/*
	 * The component's own harness for the input mode, not part of the Gallery reproduction.
	 * `/dev/` is where each control gets a page to be driven on, and nothing links to it.
	 *
	 * **No snapshot is taken of this page and none should be.** What it holds is three
	 * triggers that differ only in what the input mode has to decide between, and every
	 * claim about them is a measurement — a delay in milliseconds, a gap in pixels — which a
	 * photograph cannot separate. `/dev/tool-tip` is the page with the tracked baseline, and
	 * adding these rows to it would have moved that baseline for nothing.
	 *
	 * The button above the rows exists to be Tabbed off: a press is what grants
	 * `:focus-visible`, and a scripted `focus()` grants it only while nothing has been
	 * clicked. One test needs the real thing.
	 */
</script>

<svelte:head><title>ToolTip input mode — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ToolTip — input mode</h1>
<p class="winui-BodyTextBlockStyle">
	Five triggers. The first takes the system default for whichever mode opened it, the second fixes
	the offset itself, the third is anchored to its element in every mode, the fourth is `IsEnabled`
	false and opens for nothing, and the fifth starts enabled and can be disabled while an open is
	already owed. The sixth is a text input, the one element Chromium hands `:focus-visible` to
	however it was focused.
</p>

<button id="before" type="button">Tab from here</button>

<h2 class="winui-SubtitleTextBlockStyle">system default offset</h2>
<div class="row">
	<ToolTip content="Default offset">
		{#snippet children(props)}
			<Button {...props} id="default-trigger">Default</Button>
		{/snippet}
	</ToolTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">offset fixed by the consumer</h2>
<div class="row">
	<ToolTip content="Explicit offset" offset={4}>
		{#snippet children(props)}
			<Button {...props} id="explicit-trigger">Explicit</Button>
		{/snippet}
	</ToolTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">named placement, element-anchored in every mode</h2>
<div class="row">
	<ToolTip content="Named placement" placement="top">
		{#snippet children(props)}
			<Button {...props} id="named-trigger">Named</Button>
		{/snippet}
	</ToolTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<ToolTip content="Disabled tooltip" disabled>
		{#snippet children(props)}
			<Button {...props} id="disabled-trigger">Disabled</Button>
		{/snippet}
	</ToolTip>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled while an open is owed</h2>
<div class="row">
	<ToolTip content="Latent tooltip" disabled={latentDisabled}>
		{#snippet children(props)}
			<Button {...props} id="latent-trigger">Latent</Button>
		{/snippet}
	</ToolTip>
	<!-- Dispatched at rather than clicked by a test, so that flipping the prop does not also move
	     focus off the trigger and cancel the open by the other path. -->
	<button id="make-latent-disabled" type="button" onclick={() => (latentDisabled = true)}>
		Disable it
	</button>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a text-entry trigger</h2>
<div class="row">
	<ToolTip content="Text tooltip">
		{#snippet children(props)}
			<!-- Not a `TextBox`: what this row is for is the element type Chromium treats
			     specially, and the plain input is that element with nothing else in the way. -->
			<input {...props} id="text-trigger" type="text" value="Text" autocomplete="off" />
		{/snippet}
	</ToolTip>
</div>

<style>
	/* Each row is given room above it so that a `top` placement has somewhere to go: Floating
	   UI flips a popup that does not fit, and a flipped popup measures the wrong gap. */
	.row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 96px;
		max-width: 580px;
	}

	h2 {
		margin-top: 96px;
	}

	#before {
		margin-bottom: 24px;
	}
</style>
