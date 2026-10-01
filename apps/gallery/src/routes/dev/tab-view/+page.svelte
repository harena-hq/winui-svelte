<script lang="ts">
	import { TabView } from 'winui-svelte/preview';

	const documents = [
		{ id: 'Document 0', header: 'Document 0', glyph: 'E8A5', content: document0 },
		{ id: 'Document 1', header: 'Document 1', glyph: 'E8A5', content: document1 },
		{ id: 'Document 2', header: 'Document 2', glyph: 'E8A5', content: document2 }
	];
	const textDocuments = documents.map((item) => ({
		id: item.id,
		header: item.header,
		content: item.content
	}));
	const firstFixed = documents.map((item, index) => ({ ...item, closable: index !== 0 }));
	const withDisabledSecond = documents.map((item, index) => ({ ...item, disabled: index === 1 }));
	// `SymbolIconSource Symbol="…"` is the framework's icon *enum*, not a code point.
	// `data/winui-gallery-design.json` carries Home as E80F and MusicInfo as E90B; it has no
	// entry for Placeholder, and E18A is the Segoe Fluent code point the original draws as the
	// rhombus outline photographed on the third tab.
	const widthModeItems = [
		{ id: 'home', header: 'Home', glyph: 'E80F', closable: false, content: homeContent },
		{
			id: 'longer',
			header: 'Tab 2 Has Longer Text',
			glyph: 'E90B',
			closable: false,
			content: longerContent
		},
		{ id: 'third', header: 'Third Tab', glyph: 'E18A', closable: false, content: thirdContent }
	];
	const overlayItems = widthModeItems.map((item) => ({ ...item, closable: true }));
	const narrowItems = Array.from({ length: 8 }, (_, index) => ({
		// No space in the id: it reaches `aria-labelledby`, which is a space-separated id list.
		id: `narrow-${index}`,
		header: `Document ${index}`,
		glyph: 'E8A5',
		content: narrowContent
	}));
	let galleryItems = $state([...documents]);
</script>

{#snippet document0()}<p class="winui-BodyTextBlockStyle">Document 0 content.</p>{/snippet}
{#snippet document1()}<p class="winui-BodyTextBlockStyle">Document 1 content.</p>{/snippet}
{#snippet document2()}<p class="winui-BodyTextBlockStyle">Document 2 content.</p>{/snippet}
{#snippet homeContent()}<p class="winui-BodyTextBlockStyle">Home content.</p>{/snippet}
{#snippet longerContent()}<p class="winui-BodyTextBlockStyle">Longer tab content.</p>{/snippet}
{#snippet thirdContent()}<p class="winui-BodyTextBlockStyle">Third tab content.</p>{/snippet}
{#snippet narrowContent()}<p class="winui-BodyTextBlockStyle">Narrow strip content.</p>{/snippet}
<!-- `TabViewPage.xaml:188-200`: both are TextBlocks in `BaseTextBlockStyle`, the header
     `Margin="8,6"` and the footer `Margin="6"` with `HorizontalAlignment="Right"`. The right
     alignment is the sample's own — the control gives the footer the Grid's `*` column and
     leaves what sits in it to the app — so it is set here, not in TabView. -->
{#snippet stripHeader()}<span class="strip-header-text winui-BaseTextBlockStyle"
		>TabStripHeader Content</span
	>{/snippet}
{#snippet stripFooter()}<span class="strip-footer-text winui-BaseTextBlockStyle"
		>TabStripFooter Content</span
	>{/snippet}

<svelte:head><title>TabView — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TabView</h1>
<p class="winui-BodyTextBlockStyle">A tab strip with one visible item panel.</p>

<h2 class="winui-SubtitleTextBlockStyle">the Gallery's own</h2>
<div class="row">
	<TabView
		items={galleryItems}
		onTabCloseRequested={(id) => {
			galleryItems = galleryItems.filter((item) => item.id !== id);
		}}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a later selection</h2>
<div class="row"><TabView items={documents} selected="Document 2" /></div>

<h2 class="winui-SubtitleTextBlockStyle">without icons</h2>
<div class="row"><TabView items={textDocuments} /></div>

<h2 class="winui-SubtitleTextBlockStyle">a tab that cannot be closed</h2>
<div class="row"><TabView items={firstFixed} /></div>

<h2 class="winui-SubtitleTextBlockStyle">a disabled tab</h2>
<div class="row"><TabView items={withDisabledSecond} /></div>

<h2 class="winui-SubtitleTextBlockStyle">the strip's own header and footer</h2>
<div class="row">
	<TabView
		items={documents}
		tabWidthMode="sizeToContent"
		tabStripHeader={stripHeader}
		tabStripFooter={stripFooter}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">tabs sized to their content</h2>
<div class="row">
	<TabView items={widthModeItems} tabWidthMode="sizeToContent" addTabButtonVisible={false} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">tabs of equal width</h2>
<div class="row">
	<TabView items={widthModeItems} tabWidthMode="equal" addTabButtonVisible={false} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">only the selected tab keeps its label</h2>
<div class="row">
	<TabView items={widthModeItems} tabWidthMode="compact" addTabButtonVisible={false} />
</div>

<h2 class="winui-SubtitleTextBlockStyle">a close button only where the pointer is</h2>
<div class="row">
	<TabView
		items={overlayItems}
		closeButtonOverlayMode="onPointerOver"
		addTabButtonVisible={false}
	/>
</div>

<h2 class="winui-SubtitleTextBlockStyle">a strip too narrow for its tabs</h2>
<div class="row"><div class="narrow"><TabView items={narrowItems} /></div></div>

<style>
	.row {
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
	.narrow {
		max-width: 520px;
	}
	.strip-header-text {
		/* `Margin="8,6"` — a XAML Thickness of two is horizontal then vertical. */
		margin: 6px 8px;
	}
	.strip-footer-text {
		margin: 6px;
		/* `HorizontalAlignment="Right"` inside the footer's own box. */
		margin-left: auto;
	}
</style>
