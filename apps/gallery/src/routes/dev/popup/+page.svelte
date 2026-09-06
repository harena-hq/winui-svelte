<script lang="ts">
	import { Popup } from 'winui-svelte';
</script>

<svelte:head><title>Popup — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Popup</h1>
<p class="winui-BodyTextBlockStyle">Positioned, portalled popup hosts.</p>

<h2 class="winui-SubtitleTextBlockStyle">offsets</h2>
<div class="row">
	<div class="positioner">
		<Popup open horizontalOffset={0}><div class="sample">Simple Popup</div></Popup>
	</div>
	<div class="positioner">
		<Popup open horizontalOffset={120}><div class="sample">Simple Popup</div></Popup>
	</div>
	<div class="positioner">
		<Popup open horizontalOffset={240}><div class="sample">Simple Popup</div></Popup>
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">vertical offset</h2>
<div class="positioner">
	<Popup open verticalOffset={48}><div class="sample">Simple Popup</div></Popup>
</div>

<h2 class="winui-SubtitleTextBlockStyle">light dismiss</h2>
<!--
	The enabled one is declared last on purpose, and the order is the only thing that makes
	this section drivable. Every open popup is a dismissible layer, the layers form a stack in
	declaration order, and `interactOutsideBehavior: 'ignore'` — which is what
	`lightDismissEnabled` false compiles to — does not merely decline to close its own layer,
	it blocks every layer under it as well. Declared the other way round, the disabled popup
	sits on top and nothing on the page can be dismissed at all: measured here, six open popups
	with a disabled one topmost survived both an outside click and Escape, and the section that
	exists to show light dismiss showed nothing. With the enabled one on top, one click closes
	it and a second is stopped by the disabled one, which is both behaviours in two clicks.
-->
<div class="row">
	<div class="positioner"><Popup open><div class="sample">Light dismiss disabled</div></Popup></div>
	<div class="positioner">
		<Popup open lightDismissEnabled><div class="sample">Light dismiss enabled</div></Popup>
	</div>
</div>

<style>
	.row {
		display: flex;
		gap: 24px;
	}

	.positioner {
		position: relative;
		width: 260px;
		height: 140px;
	}

	.sample {
		min-width: 240px;
		padding: 16px;
		background: var(--winui-AcrylicBackgroundFillColorDefaultBrush);
		/* c1-allow: WinUI-Gallery Samples/Popup/PopupPage.xaml:30, `BorderThickness="1"` on the Grid the sample puts inside the Popup — the control draws nothing, so the chrome is the harness's */
		border: 1px solid var(--winui-SurfaceStrokeColorDefaultBrush);
		border-radius: var(--winui-OverlayCornerRadius);
	}
</style>
