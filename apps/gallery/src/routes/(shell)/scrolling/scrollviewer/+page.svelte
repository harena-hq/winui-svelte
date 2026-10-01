<script lang="ts">
	import {
		ComboBox,
		ScrollViewer,
		Slider,
		type ComboBoxProps,
		type ScrollViewerProps
	} from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	type ZoomModeName = 'Disabled' | 'Enabled';
	type ScrollModeName = 'Disabled' | 'Enabled' | 'Auto';
	type ScrollBarVisibilityName = 'Disabled' | 'Auto' | 'Hidden' | 'Visible';

	const item = itemOf('/scrolling/scrollviewer');
	if (item === null) throw new Error('ScrollViewer page has no Gallery item');
	const sample = sampleOf('ScrollViewer/ContentInsideScrollviewer.txt');
	const ZOOM_MODES: Record<ZoomModeName, NonNullable<ScrollViewerProps['zoomMode']>> = {
		Disabled: 'disabled',
		Enabled: 'enabled'
	};
	const SCROLL_MODES: Record<
		ScrollModeName,
		NonNullable<ScrollViewerProps['horizontalScrollMode']>
	> = {
		Disabled: 'disabled',
		Enabled: 'enabled',
		Auto: 'auto'
	};
	const SCROLL_BAR_VISIBILITIES: Record<
		ScrollBarVisibilityName,
		NonNullable<ScrollViewerProps['horizontalScrollBarVisibility']>
	> = {
		Disabled: 'disabled',
		Auto: 'auto',
		Hidden: 'hidden',
		Visible: 'visible'
	};
	const zoomModeItems: ComboBoxProps['items'] = Object.keys(ZOOM_MODES).map((value) => ({
		value,
		label: value
	}));
	const scrollModeItems: ComboBoxProps['items'] = Object.keys(SCROLL_MODES).map((value) => ({
		value,
		label: value
	}));
	const scrollBarVisibilityItems: ComboBoxProps['items'] = Object.keys(SCROLL_BAR_VISIBILITIES).map(
		(value) => ({ value, label: value })
	);

	let zoomMode = $state<ZoomModeName>('Enabled');
	let zoomFactor = $state(4);
	let horizontalScrollMode = $state<ScrollModeName>('Enabled');
	let verticalScrollMode = $state<ScrollModeName>('Enabled');
	let horizontalScrollBarVisibility = $state<ScrollBarVisibilityName>('Auto');
	let verticalScrollBarVisibility = $state<ScrollBarVisibilityName>('Auto');
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		substitutions={{
			ZoomMode: zoomMode,
			HorizontalScrollMode: horizontalScrollMode,
			HorizontalScrollBarVisibility: horizontalScrollBarVisibility,
			VerticalScrollMode: verticalScrollMode,
			VerticalScrollBarVisibility: verticalScrollBarVisibility
		}}
	>
		<!-- ScrollViewerPage.xaml:18-180. -->
		<ScrollViewer
			data-vertical-alignment="top"
			horizontalScrollMode={SCROLL_MODES[horizontalScrollMode]}
			horizontalScrollBarVisibility={SCROLL_BAR_VISIBILITIES[horizontalScrollBarVisibility]}
			verticalScrollMode={SCROLL_MODES[verticalScrollMode]}
			verticalScrollBarVisibility={SCROLL_BAR_VISIBILITIES[verticalScrollBarVisibility]}
			zoomMode={ZOOM_MODES[zoomMode]}
			bind:zoomFactor
			style="width: 400px; height: 266px"
		>
			<img class="cliff" src="/cliff.jpg" alt="cliff" />
		</ScrollViewer>
		{#snippet options()}
			<div class="options-grid">
				<!-- ScrollViewerPage.xaml:44-163. -->
				<span class="option-label">ZoomMode</span>
				<ComboBox items={zoomModeItems} bind:value={zoomMode} />
				<Slider class="zoom-slider" header="Zoom" min={0.1} max={10} bind:value={zoomFactor} />
				<span class="option-section scroll-mode">ScrollMode</span>
				<span class="option-label">Horizontal</span>
				<ComboBox items={scrollModeItems} bind:value={horizontalScrollMode} />
				<span class="option-label vertical-label">Vertical</span>
				<ComboBox
					class="vertical-control"
					items={scrollModeItems}
					bind:value={verticalScrollMode}
				/>
				<span class="option-section scroll-bar-visibility">ScrollbarVisibility</span>
				<span class="option-label">Horizontal</span>
				<ComboBox items={scrollBarVisibilityItems} bind:value={horizontalScrollBarVisibility} />
				<span class="option-label vertical-label">Vertical</span>
				<ComboBox
					class="vertical-control"
					items={scrollBarVisibilityItems}
					bind:value={verticalScrollBarVisibility}
				/>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.cliff {
		display: block;
	}

	.options-grid {
		display: grid;
		min-width: 200px;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
	}

	.option-label {
		margin-right: 10px; /* c1-allow: ScrollViewerPage.xaml:50, :82, :105, :137, :156. */
	}

	:global(.zoom-slider),
	.option-section {
		grid-column: 1 / -1;
	}

	:global(.zoom-slider) {
		margin-top: 10px; /* c1-allow: ScrollViewerPage.xaml:66 — Margin="0,10,0,0". */
	}

	.option-section {
		justify-self: center;
	}

	.scroll-mode {
		margin: 12px 0; /* c1-allow: ScrollViewerPage.xaml:77 — Margin="0,12". */
	}

	.vertical-label,
	:global(.vertical-control) {
		margin-top: 8px; /* c1-allow: ScrollViewerPage.xaml:104, :112 — Margin="0,8,...". */
	}

	.scroll-bar-visibility {
		margin: 20px 0 12px; /* c1-allow: ScrollViewerPage.xaml:125 — Margin="0,20,0,12". */
	}
</style>
