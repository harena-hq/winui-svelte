<script lang="ts">
	import { Button, MediaPlayerElement } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/media/mediaplayerelement');
	if (item === null) throw new Error('MediaPlayerElement page has no Gallery item');
	const transportSample = sampleOf('MediaPlayerElement/MediaplayerelementTransportControls.txt');
	const autoPlaySample = sampleOf('MediaPlayerElement/MediaplayerelementAutoplaysVideo.txt');

	let fileInput = $state<HTMLInputElement>();
	let objectUrl = $state<string | null>(null);

	function openFile() {
		fileInput?.click();
	}

	// MediaPlayerElementPage.xaml.cs:35-47 — FileOpenPicker plus MediaSource.CreateFromStorageFile
	// becomes a file input plus an object URL on the web.
	function selectFile(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		if (objectUrl) URL.revokeObjectURL(objectUrl);
		objectUrl = URL.createObjectURL(file);
	}
</script>

<ItemPage {item}>
	<ControlExample
		headerText={transportSample.header ?? undefined}
		xaml={transportSample.xaml ?? undefined}
		csharp={transportSample.csharp ?? undefined}
	>
		<!-- WD-059 — this is ladybug.wmv's same 512x288 frames, browser-decodable H.264/AAC MP4. -->
		<MediaPlayerElement
			source={objectUrl ?? '/ladybug.mp4'}
			autoPlay={false}
			transportControlsEnabled
			style="max-width: 400px"
		/>
		{#snippet options()}
			<Button aria-label="Open file button" onclick={openFile}>Open a file</Button>
			<input bind:this={fileInput} type="file" accept="video/*" hidden onchange={selectFile} />
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={autoPlaySample.header ?? undefined}
		xaml={autoPlaySample.xaml ?? undefined}
		csharp={autoPlaySample.csharp ?? undefined}
	>
		<!-- MediaPlayerElementPage.xaml:30-38 — MaxWidth 400. WD-059 — fishes.wmv's same
		     512x288 frames are served in browser-decodable H.264/AAC MP4. -->
		<MediaPlayerElement source="/fishes.mp4" autoPlay style="max-width: 400px" />
	</ControlExample>
	<!-- MediaPlayerElementPage.xaml.cs:27-33 pauses both players on navigation. Route unmounting
	     removes the videos here, so playback stops without a separate navigation handler. -->
</ItemPage>
