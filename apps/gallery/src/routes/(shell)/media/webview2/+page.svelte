<script lang="ts">
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import NotApplicablePanel from '$lib/frame/NotApplicablePanel.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/media/webview2');
	if (item === null) throw new Error('WebView2 page has no Gallery item');
	const sample = sampleOf('WebView2/SimpleWebview2.txt');
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		horizontalContentAlignment="stretch"
	>
		<div class="example">
			<!-- WebView2Page.xaml:31-33 — Margin="0,0,0,12" is bottom 12 in CSS order. -->
			<p class="winui-BodyTextBlockStyle intro">WebView2 is powered by the Chromium engine.</p>
			<!-- WD-062. WebView2Page.xaml:34-41 hosts https://learn.microsoft.com/windows/apps/winui/winui3/,
			     which answers `x-frame-options: SAMEORIGIN` and a `frame-ancestors` list this origin is not on.
			     Measured on the reference guest: the frame's `load` fires and what it paints is the browser's
			     refusal page. `MinHeight="200"` at :37-38 is the slot's height here because upstream's `*` row
			     stretches to the frame and this reproduction's page scrolls. -->
			<NotApplicablePanel
				element="WebView2"
				reason="The page this example hosts refuses to be framed by this origin, so nothing is hosted here"
				row="WD-062"
				height={200}
			/>
		</div>
	</ControlExample>
</ItemPage>

<style>
	.example {
		/* WebView2Page.xaml:26-30 — a Grid of an Auto row and a star row, stretched. */
		display: grid;
		grid-template-rows: auto 1fr;
		width: 100%;
	}
	.intro {
		margin: 0 0 12px;
	}
</style>
