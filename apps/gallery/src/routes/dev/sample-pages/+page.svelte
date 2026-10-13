<script lang="ts">
	/*
	 * The Gallery's sample pages, each in a frame the size of the content area a
	 * NavigationView example gives one on the reference guest: 860 wide. Not part of the
	 * Gallery reproduction; nothing links here.
	 */
	import {
		SamplePage1,
		SamplePage2,
		SamplePage3,
		SamplePage4,
		SamplePage5,
		SamplePage6,
		SampleSettingsPage
	} from '$lib/sample-pages';

	const pages = [
		['SamplePage1', SamplePage1],
		['SamplePage2', SamplePage2],
		['SamplePage3', SamplePage3],
		['SamplePage4', SamplePage4],
		['SamplePage5', SamplePage5],
		['SamplePage6', SamplePage6],
		['SampleSettingsPage', SampleSettingsPage]
	] as const;
</script>

<svelte:head><title>Sample pages — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Sample pages</h1>
{#each pages as [name, Page] (name)}
	<h2 class="winui-SubtitleTextBlockStyle">{name}</h2>
	<div class="frame" data-sample-page={name}>
		<Page />
	</div>
{/each}

<style>
	.frame {
		/* c1-allow: the content area a NavigationView example offers on the reference guest. */
		width: 860px;
		/* c1-allow: enough to show each page whole, as the example's 460-high view does not. */
		height: 700px;
		margin-bottom: 24px;
	}
</style>
