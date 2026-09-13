<script lang="ts">
	import { Button } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/multiplewindows/createmultiplewindows');
	if (item === null) throw new Error('CreateMultipleWindows page has no Gallery item');
	const sample = sampleOf(
		'CreateMultipleWindows/CreateMultipleWindowsCreateSingleThreadedMultiple.txt'
	);
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		csharp={sample.csharp ?? undefined}
	>
		<!-- WD-065: CreateMultipleWindowsPage.xaml.cs:19-44 opens a Window with extended title-bar
		     content, MicaBackdrop, and a 500 × 500 client area; `window.open` works here, but it
		     would show browser chrome with none of those, so the demonstration is declined. -->
		<Button>Create new Window</Button>
	</ControlExample>
</ItemPage>
