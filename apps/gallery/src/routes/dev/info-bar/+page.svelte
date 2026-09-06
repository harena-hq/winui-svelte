<script lang="ts">
	import { Button, InfoBar } from 'winui-svelte';

	const SHORT_MESSAGE =
		'Essential app message for your users to be informed of, acknowledge, or take action on.';
	const LONG_MESSAGE =
		'A long essential app message for your users to be informed of, acknowledge, or take action on. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin dapibus dolor vitae justo rutrum, ut lobortis nibh mattis. Aenean id elit commodo, semper felis nec.';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. InfoBar is
	 * full-width here, and the fixed 1000px row makes the panel's horizontal/vertical choice
	 * deterministic while the sections below exercise the severity, orientation, and parts
	 * states named by the unit.
	 */
</script>

<svelte:head><title>InfoBar — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">InfoBar</h1>
<p class="winui-BodyTextBlockStyle">
	The rows exercise all four severities, both panel orientations, and the visible parts of the
	control.
</p>

<h2 class="winui-SubtitleTextBlockStyle">severity</h2>
<div class="row">
	<InfoBar severity="informational" title="Title" message={SHORT_MESSAGE} />
	<InfoBar severity="success" title="Title" message={SHORT_MESSAGE} />
	<InfoBar severity="warning" title="Title" message={SHORT_MESSAGE} />
	<InfoBar severity="error" title="Title" message={SHORT_MESSAGE} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">orientation</h2>
<div class="row">
	<InfoBar title="Title" message={SHORT_MESSAGE} closable />
	<InfoBar title="Title" message={LONG_MESSAGE} closable />
	<InfoBar title="Title" message={SHORT_MESSAGE} closable>
		{#snippet actionButton()}
			<Button>Action</Button>
		{/snippet}
	</InfoBar>
</div>

<h2 class="winui-SubtitleTextBlockStyle">parts</h2>
<div class="row">
	<InfoBar title="Title" message={SHORT_MESSAGE} closable={false} />
	<InfoBar title="Title" message={SHORT_MESSAGE} iconVisible={false} />
	<InfoBar title="Title" message={SHORT_MESSAGE} iconSource="E946" />
	<InfoBar title="Title" message={SHORT_MESSAGE} open={false} />
	<InfoBar>
		<span>Content only</span>
	</InfoBar>
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 24px;
		margin-bottom: 24px;
		width: 1000px;
	}
</style>
