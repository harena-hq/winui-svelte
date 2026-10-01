<script lang="ts">
	import { PasswordBox } from 'winui-svelte/preview';
	import type { PasswordBoxProps } from 'winui-svelte/preview';

	/*
	 * The component's own harness, not part of the Gallery reproduction: `/dev/` is where
	 * each control gets a page to be photographed on, and nothing links to it. The five
	 * rows below exercise the surface the unit names: empty, with a password (so the
	 * reveal button is in the snapshot), a header and a description, the reveal state
	 * itself, and disabled.
	 */

	let empty: PasswordBoxProps['value'] = $state('');
	let withPassword: PasswordBoxProps['value'] = $state('hunter2');
	let withHeaderDescription: PasswordBoxProps['value'] = $state('');
	let withHeaderDescriptionDisabled: PasswordBoxProps['value'] = $state('Prefilled');
	let disabled: PasswordBoxProps['value'] = $state('Disabled');
</script>

<svelte:head><title>PasswordBox — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">PasswordBox</h1>
<p class="winui-BodyTextBlockStyle">
	Five rows, in the order the unit names them: empty with a placeholder, with a password, with a
	header and a description, revealed (the held-pointer state cannot be photographed — the box is
	rendered here with content and the snapshot will show it as such), and disabled.
</p>

<h2 class="winui-SubtitleTextBlockStyle">empty</h2>
<div class="row">
	<PasswordBox bind:value={empty} placeholder="Type a password" />
</div>

<h2 class="winui-SubtitleTextBlockStyle">with a password</h2>
<div class="row">
	<PasswordBox bind:value={withPassword} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a header and a description</h2>
<div class="row">
	<PasswordBox
		header="Password"
		description="At least eight characters."
		bind:value={withHeaderDescription}
	/>
	<PasswordBox
		header="Password"
		description="At least eight characters."
		bind:value={withHeaderDescriptionDisabled}
		disabled
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">revealed</h2>
<div class="row">
	<!-- The reveal state requires a held pointer and cannot be photographed; the snapshot
	     shows the box with content and the reveal button at rest. -->
	<p class="winui-CaptionTextBlockStyle">
		The reveal state requires a held pointer and cannot be captured in a static snapshot. The box
		below renders with content so the reveal button is in the frame.
	</p>
	<PasswordBox bind:value={withPassword} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<PasswordBox bind:value={disabled} disabled />
</div>

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 24px;
		max-width: 580px;
	}
</style>
