<script lang="ts">
	import { ToggleSwitch } from 'winui-svelte/preview';

	/*
	 * A `ToggleSwitch`'s accessible name — `ToggleSwitchAutomationPeer::GetNameCore`.
	 *
	 * Absent an explicit name, the peer takes the header's string and the content of the
	 * current state only — `OnContent` when on, `OffContent` when off — and that content only
	 * when the property has been set. The default "On" adds nothing, since the toggle state
	 * already says it; an explicit "On" still counts. Both present are joined by one space,
	 * header first; one alone is the name; neither leaves the switch unnamed.
	 *
	 * **Nothing photographs this page.** `toggle-switch-name.spec.ts` reads each switch's name
	 * off and on, from Playwright and from the browser's own tree.
	 */
</script>

{#snippet snippetHeader()}<strong>Bold</strong> header{/snippet}

<svelte:head><title>ToggleSwitch name — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ToggleSwitch — name</h1>

<div class="row">
	<ToggleSwitch id="neither" />
</div>
<div class="row">
	<ToggleSwitch id="header-only" header="Header only" />
</div>
<div class="row">
	<ToggleSwitch id="content-only" onContent="Enabled" offContent="Disabled" />
</div>
<div class="row">
	<ToggleSwitch id="both" header="Toggle work" onContent="Working" offContent="Do work" />
</div>
<div class="row">
	<ToggleSwitch id="explicit-default" onContent="On" offContent="Off" />
</div>
<div class="row">
	<ToggleSwitch id="on-only" onContent="Working" />
</div>
<div class="row">
	<ToggleSwitch id="snippet-header" header={snippetHeader} />
</div>

<style>
	.row {
		margin-bottom: 24px;
	}
</style>
