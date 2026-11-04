<script lang="ts">
	import {
		Button,
		ComboBox,
		MediaPlayerElement,
		ScrollViewer,
		ToggleSwitch,
		ToolTip
	} from '@harena-hq/winui-svelte/preview';
	import type { ComboBoxItemData } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/media/captureelementpreview');
	if (item === null) throw new Error('CaptureElementPreview page has no Gallery item');
	const sample = sampleOf(
		'CaptureElementPreview/CaptureElementPreviewMediacapturePreviewDisplayedVia.txt'
	);

	let cameras = $state<ComboBoxItemData[]>([]);
	let selectedCamera = $state<string | undefined>(undefined);
	let frameSourceName = $state('');
	let mirrored = $state(false);
	let snapshots = $state<string[]>([]);
	let player = $state<HTMLVideoElement | null>(null);
	let stream: MediaStream | null = null;

	$effect(() => {
		let cancelled = false;
		// CaptureElementPreviewPage.xaml.cs:88-98 — FindAllAsync, and the empty case writes its own
		// message rather than raising. WD-064: `navigator.mediaDevices` is gated on a secure
		// context and this reproduction is served over plain HTTP, so on the reference guest the
		// enumeration is not empty — it is unavailable, and lands in the same branch the original
		// lands in there for its own reason, which is that the machine has no camera.
		void (async () => {
			if (!navigator.mediaDevices?.enumerateDevices) {
				frameSourceName = 'No camera devices found.';
				return;
			}
			const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
				(device) => device.kind === 'videoinput'
			);
			if (cancelled) return;
			if (devices.length === 0) {
				frameSourceName = 'No camera devices found.';
				return;
			}
			cameras = devices.map((device, index) => ({
				value: device.deviceId,
				// A label is empty until the user has granted access to that device, which is the
				// web's own rule rather than this reproduction's.
				label: device.label || `Camera ${index + 1}`
			}));
			selectedCamera = cameras[0].value;
		})();
		return () => {
			cancelled = true;
		};
	});

	async function startCapture(deviceId: string) {
		// CaptureElementPreviewPage.xaml.cs:102-107 — the previous capture is released before the
		// next one starts.
		if (stream) {
			for (const track of stream.getTracks()) track.stop();
			stream = null;
		}
		const label = cameras.find((camera) => camera.value === deviceId)?.label ?? '';
		frameSourceName = `Viewing: ${label}`;
		try {
			// :112-119 — MediaCaptureInitializationSettings over one source group, video only.
			stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId } });
		} catch (error) {
			// :134-137 — the selection handler writes the failure into the same TextBlock.
			frameSourceName = `Error: ${error instanceof Error ? error.message : String(error)}`;
			return;
		}
		if (!player) return;
		// :121-123 — MediaSource.CreateFromMediaFrameSource onto the element's Source. A live
		// MediaStream reaches a video element through `srcObject`, never through `src`, so the
		// MediaPlayerElement's `source` prop stays unset and its bound element takes the stream.
		player.srcObject = stream;
		await player.play().catch(() => {});
	}

	$effect(() => {
		if (selectedCamera) void startCapture(selectedCamera);
	});

	$effect(() => () => {
		if (stream) for (const track of stream.getTracks()) track.stop();
	});

	function capturePhoto() {
		// CaptureElementPreviewPage.xaml.cs:172-175 — the pinned code returns when there is no
		// capture rather than raising.
		if (!player || !stream) return;
		const canvas = document.createElement('canvas');
		canvas.width = player.videoWidth;
		canvas.height = player.videoHeight;
		canvas.getContext('2d')?.drawImage(player, 0, 0);
		// :178-181 — ImageEncodingProperties.CreateJpeg into an in-memory stream, which on the web
		// is a data URL an <img> reads directly.
		snapshots = [canvas.toDataURL('image/jpeg'), ...snapshots];
	}

	const MIRROR_SUBSTITUTION = `
        // Mirror the preview
        captureElement.RenderTransform = new ScaleTransform() { ScaleX = -1 };
        captureElement.RenderTransformOrigin = new Point(0.5, 0.5);
`;
	const substitutions = $derived({ MirrorPreview: mirrored ? MIRROR_SUBSTITUTION : '' });
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		csharp={sample.csharp ?? undefined}
		{substitutions}
	>
		<!-- CaptureElementPreviewPage.xaml:12-18 — MinWidth 400, MinHeight 300, columns *,100
		     with ColumnSpacing 4, rows Auto,* with RowSpacing 10. Measured on the reference guest:
		     the example area is 324 tall, which is MinHeight plus the card's 12 of padding on each
		     side, so the grid rests at its minimum. -->
		<div class="example">
			<span class="source-name winui-BodyTextBlockStyle">{frameSourceName}</span>
			<!-- :24-29 — AutoPlay and Stretch="Uniform". The stream is written onto the bound element
			     rather than through `source`, so `autoPlay` has no URL to act on and the page calls
			     play() itself. -->
			<MediaPlayerElement
				bind:mediaPlayer={player}
				autoPlay={false}
				class="preview"
				style={mirrored ? 'transform: scaleX(-1)' : undefined}
			/>
			{#if snapshots.length > 0}
				<!-- :30-36 — Visibility="Collapsed" until the first photo is captured. -->
				<span class="captured winui-BodyTextBlockStyle">Captured:</span>
			{/if}
			<div class="snapshots">
				<!-- :41 — VerticalScrollMode="Enabled". -->
				<ScrollViewer verticalScrollMode="enabled">
					<div class="snapshot-stack">
						{#each snapshots as snapshot, index (snapshot)}
							<img src={snapshot} alt="Captured photo {snapshots.length - index}" />
						{/each}
					</div>
				</ScrollViewer>
			</div>
		</div>
		{#snippet options()}
			<div class="options">
				<!-- :49-53. Present in the pinned source and not in the Gallery build the reference guest
				     runs: it arrives in WinUI-Gallery 53976aa, after the v2.9.3 tag. The pin is what this
				     reproduction follows. -->
				<ComboBox
					items={cameras}
					value={selectedCamera ?? ''}
					onValueChange={(value) => (selectedCamera = value || undefined)}
					header="Camera source"
				/>
				<!-- :54-59 — ToolTipService.ToolTip on the switch. -->
				<ToolTip content="Mirrors only the preview, not captured photos">
					{#snippet children(props)}
						<ToggleSwitch {...props} bind:checked={mirrored} header="Mirror preview" />
					{/snippet}
				</ToolTip>
				<!-- :60-63 -->
				<Button onclick={capturePhoto}>Capture Photo</Button>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.example {
		/* CaptureElementPreviewPage.xaml:12-18.

		   No `width: 100%`, and that is the whole of this rule's difficulty. This page sets no
		   `HorizontalContentAlignment`, and `ControlExample.xaml.cs:170` registers that property
		   with `HorizontalAlignment.Left`, which `ControlExample.xaml:118` binds onto the example
		   presenter — so upstream hands this Grid its *desired* width, not the pane's. An
		   unstretched Grid's star column is content-sized, so `ColumnDefinitions="*,100"` resolves
		   against `MinWidth="400"`: the Grid is 400 wide, its star column 296, and the snapshots
		   column starts 300 in. Stretched to the pane it would be 674 here, and nothing would
		   catch it, because at rest every cell this grid holds is empty. */
		display: grid;
		grid-template-columns: 1fr 100px;
		grid-template-rows: auto 1fr;
		column-gap: 4px;
		row-gap: 10px;
		min-width: 400px;
		min-height: 300px;
	}
	.source-name {
		/* :19-23 — row 0, column 0, VerticalAlignment="Center". */
		grid-area: 1 / 1;
		align-self: center;
	}
	.example :global(.preview) {
		/* :24-29 — row 1, column 0. The class crosses a component boundary and carries no scope
		   hash, so the rule reaches it from a local ancestor.

		   `width: 0` with `min-width: 100%` is one declaration doing two jobs, and both are
		   needed. A `<video>` with no source carries HTML's default intrinsic size, 300x150, and
		   that 300 is what this element contributes to the star column when the grid is sized by
		   its content — which measured a 404-wide grid over a 300-wide column, where upstream's
		   presenter desires nothing without a Source and the grid clamps to `MinWidth="400"` with
		   a 296 column. A definite `width` is the contribution, so `0` withdraws the video from
		   the column's arithmetic; a percentage `min-width` is not, so `100%` puts it back at the
		   column's full width once that column has been sized. Measured after: 400 and 296. */
		grid-area: 2 / 1;
		width: 0;
		min-width: 100%;
		min-height: 0;
	}
	.captured {
		/* :30-36 — row 0, column 1, VerticalAlignment="Center". */
		grid-area: 1 / 2;
		align-self: center;
	}
	.snapshots {
		/* :37-44, and the ExpandToFillContainer at :195-203 that the code-behind re-parents the
		   ScrollViewer into. That container measures its child at height 100 so the snapshots
		   column takes whatever height is available without contributing any of its own; a grid item
		   with `min-height: 0` and a scrolling child is the same arrangement, because a scroll
		   container does not report its content's height to the track. */
		grid-area: 2 / 2;
		min-height: 0;
		overflow: hidden;
	}
	.snapshot-stack {
		/* :42 — Spacing 2. */
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.snapshot-stack img {
		display: block;
		width: 100%;
	}
	.options {
		/* :48 — Spacing 16. */
		display: flex;
		flex-direction: column;
		gap: 16px;
		align-items: flex-start;
	}
</style>
