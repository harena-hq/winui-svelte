<script lang="ts">
	import { ToggleSwitch } from 'winui-svelte/preview';

	/*
	 * Dragging a `ToggleSwitch` — `SwitchThumb` and `ToggleSwitch::MoveCompleted`
	 * (`ToggleSwitch_Partial.cpp:592`).
	 *
	 * **Nothing photographs this page.** `toggle-switch-drag.spec.ts` drags each switch with the
	 * mouse and reads `#log`, which records every `onCheckedChange` in the order it ran. The two
	 * rows are the Gallery's pair (`ToggleSwitchPage.xaml`): one that starts off, and one that
	 * starts on with its own content.
	 */
	let log = $state<string[]>([]);
	const note = (name: string) => (checked: boolean) => (log = [...log, `${name}:${checked}`]);
</script>

<svelte:head><title>ToggleSwitch drag — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ToggleSwitch — drag</h1>

<div class="row">
	<ToggleSwitch id="starts-off" onCheckedChange={note('off')} />
</div>
<div class="row">
	<ToggleSwitch
		id="starts-on"
		checked
		header="Toggle work"
		onContent="Working"
		offContent="Do work"
		onCheckedChange={note('on')}
	/>
</div>
<pre class="log" id="log">{log.join(' ')}</pre>

<style>
	.row {
		margin-bottom: 24px;
	}

	.log {
		min-height: 2em;
		padding: 12px;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		color: var(--winui-TextFillColorSecondaryBrush);
		white-space: pre-wrap;
		/* c1-allow: a code face is categorical, not a themed value */
		font-family: monospace;
	}
</style>
