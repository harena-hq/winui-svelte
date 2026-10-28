<script lang="ts">
	import InterimPage from '$lib/frame/InterimPage.svelte';
	import { THEMES, theme } from '$lib/theme.svelte';
</script>

<InterimPage scrollView>
	<h1 class="winui-TitleTextBlockStyle">Settings</h1>
	<p class="winui-BodyTextBlockStyle">
		The rest of the Settings page arrives with the panes that own it — radio groups, an about row, a
		theme picker as a radio group rather than a select. This control sits here because it has
		nowhere else to live and the shell has to reach a theme somehow.
	</p>

	<!--
	The Gallery's real Settings page offers the theme as a radio group and omits a
	High-contrast option, because that is a Windows OS setting rather than an app one.
	This `<select>` is the harness's control for a page that has no other way to reach a
	theme; it is not a divergence entry because it is not a control this project is
	reproducing.
-->
	<label class="winui-BodyTextBlockStyle">
		App theme
		<select bind:value={theme.value}>
			{#each THEMES as t (t.value)}<option value={t.value}>{t.label}</option>{/each}
		</select>
	</label>
</InterimPage>
