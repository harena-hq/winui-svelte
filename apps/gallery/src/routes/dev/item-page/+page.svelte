<script lang="ts">
	import { Button } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import type { GalleryItem } from '$lib/shell';

	const everything: GalleryItem = {
		uniqueId: 'Everything',
		title: 'Everything',
		subtitle: 'A complete item-page fixture.',
		description: 'An item with every page-header field.',
		apiNamespace: 'Microsoft.UI.Xaml.Controls',
		baseClasses: ['Object', 'DependencyObject', 'Control'],
		docs: [
			{ title: 'API', uri: 'https://learn.microsoft.com/' },
			{ title: 'Guidelines', uri: 'https://learn.microsoft.com/windows/apps/design/' }
		],
		sourcePath: '/Controls/Everything.xaml',
		samplePagePath: 'WinUIGallery/Samples/Everything/EverythingPage.xaml'
	};
	const noApiDetails: GalleryItem = {
		...everything,
		uniqueId: 'NoApiDetails',
		title: 'No API details',
		apiNamespace: null,
		baseClasses: []
	};
	const noDocsAndSource: GalleryItem = {
		...everything,
		uniqueId: 'NoDocsAndSource',
		title: 'No docs and no source',
		docs: [],
		sourcePath: null,
		samplePagePath: null
	};
	const noDescription: GalleryItem = {
		...everything,
		uniqueId: 'NoDescription',
		title: 'No description',
		description: null
	};
</script>

<svelte:head><title>ItemPage — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ItemPage</h1>

<h2 class="winui-SubtitleTextBlockStyle">everything</h2>
<ItemPage item={everything}>
	<ControlExample headerText="Sample"><Button>Sample button</Button></ControlExample>
</ItemPage>

<h2 class="winui-SubtitleTextBlockStyle">no api details</h2>
<ItemPage item={noApiDetails} />

<h2 class="winui-SubtitleTextBlockStyle">no docs and no source</h2>
<ItemPage item={noDocsAndSource} />

<h2 class="winui-SubtitleTextBlockStyle">no description</h2>
<ItemPage item={noDescription}>
	<ControlExample headerText="Sample"><Button>Sample button</Button></ControlExample>
</ItemPage>
