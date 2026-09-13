<script lang="ts">
	import {
		AutoSuggestBox,
		Button,
		PersonPicture,
		TextBox,
		TitleBar,
		ToggleSwitch
	} from 'winui-svelte';
	import { resolve } from '$app/paths';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { QUERY_GLYPH, itemOf } from '$lib/shell';

	const item = itemOf('/multiplewindows/titlebar');
	if (item === null) throw new Error('TitleBar page has no Gallery item');

	const configurationSample = sampleOf('TitleBar/TitlebarConfiguration.txt');
	const dragRegionsSample = sampleOf('TitleBar/TitlebarDragRegions.txt');
	const endToEndSample = sampleOf('TitleBar/EndEndTitlebarSample.txt');

	let titleText = $state('WinUI Gallery');
	let subtitleText = $state('Preview');
	let backButton = $state(false);
	let paneToggle = $state(false);
</script>

<ItemPage {item}>
	<div class="page-content">
		<!-- TitleBarPage.xaml:23-29. WinUI's inline Hyperlink has no control in this library;
		     item 17 supplies it, so the anchor carries the accent text token directly. -->
		<p class="lead winui-BodyTextBlockStyle">
			For full title bar customization without using the TitleBar control, see the
			<a href={resolve('/multiplewindows/appwindowtitlebar')}>AppWindowTitleBar</a> sample
		</p>

		<ControlExample
			headerText={configurationSample.header ?? undefined}
			xaml={configurationSample.xaml ?? undefined}
			csharp={configurationSample.csharp ?? undefined}
			horizontalContentAlignment="stretch"
			substitutions={{
				Title: titleText,
				Subtitle: subtitleText,
				BackButtonVisibility: String(backButton),
				PaneToggleVisibility: String(paneToggle)
			}}
		>
			<!-- TitleBarPage.xaml:33-39 — the stretched card vertically centres the control and
			     clips its contents to OverlayCornerRadius. -->
			<div class="title-bar-card">
				<!-- WD-007. TitleBarPage.xaml:52-54 supplies GalleryIcon.ico, but this TitleBar
				     accepts a glyph code point and has no image slot, so no icon is drawn. -->
				<!-- TitleBarPage.xaml:45 and TitleBarPage.xaml.cs:31-34 apply the app window's
				     system theme to caption buttons after layout; this card has no caption buttons. -->
				<TitleBar
					title={titleText}
					subtitle={subtitleText}
					backButtonVisible={backButton}
					paneToggleButtonVisible={paneToggle}
				>
					{#snippet content()}
						<!-- TitleBarPage.xaml:47-51 overrides the instance resource
						     TitleBarContentHorizontalAlignment from its TitleBar_themeresources.xaml:97
						     default of Center to Stretch. The local wrapper takes all available width and
						     the page's MaxWidth="580" ceiling; a TitleBar prop was rejected because a
						     one-page resource override is not control API. The passed class is reached
						     through :global below because component classes carry no caller scope hash. -->
						<div class="search">
							<AutoSuggestBox class="search-box" placeholder="Search..." queryIcon={QUERY_GLYPH} />
						</div>
					{/snippet}
					{#snippet rightHeader()}
						<PersonPicture initials="JD" size={30} />
					{/snippet}
				</TitleBar>
			</div>
			{#snippet options()}
				<!-- TitleBarPage.xaml:73-95 — Width="240" and StackPanel Spacing="12". -->
				<div class="configuration-options">
					<TextBox header="Title" bind:value={titleText} />
					<TextBox header="Subtitle" bind:value={subtitleText} />
					<ToggleSwitch header="IsBackButtonVisible" bind:checked={backButton} />
					<ToggleSwitch header="IsPaneToggleButtonVisible" bind:checked={paneToggle} />
				</div>
			{/snippet}
		</ControlExample>

		<!-- TitleBarPage.xaml:104-122. This example arrived in the pin after the v2.9.3 tag
		     used by the reference guest; this reproduction follows the pin. -->
		<ControlExample
			headerText={dragRegionsSample.header ?? undefined}
			xaml={dragRegionsSample.xaml ?? undefined}
			csharp={dragRegionsSample.csharp ?? undefined}
			horizontalContentAlignment="stretch"
		>
			<div class="window-example">
				<p>
					Drag regions can only be observed on a real window. Click the button below to open a
					sample window where you can toggle TitleBar.IsDragRegion on a status badge and call
					RecomputeDragRegions() after dynamic content changes.
				</p>
				<!-- WD-065. TitleBarPage.xaml.cs:25-29 creates and activates a
				     TitleBarDragRegionsWindow; this button is inert. -->
				<Button variant="accent">Show window</Button>
			</div>
		</ControlExample>

		<ControlExample
			headerText={endToEndSample.header ?? undefined}
			xaml={endToEndSample.xaml ?? undefined}
			csharp={endToEndSample.csharp ?? undefined}
			horizontalContentAlignment="stretch"
		>
			<div class="window-example">
				<p>
					Click the button below to see an end to end sample of a TitleBar in an new window, binding
					some of its properties to the NavigationView and navigation frame.
				</p>
				<!-- WD-065. TitleBarPage.xaml.cs:19-23 creates and activates a TitleBarWindow;
				     this button is inert. -->
				<Button variant="accent">Show window</Button>
			</div>
		</ControlExample>
	</div>
</ItemPage>

<style>
	.page-content {
		/* TitleBarPage.xaml:22 — StackPanel Margin="0,12,0,0". */
		margin-top: 12px;
	}
	.lead {
		margin: 0;
	}
	.lead a {
		color: var(--winui-AccentTextFillColorPrimaryBrush);
	}
	.title-bar-card {
		display: grid;
		align-items: center;
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		border-color: var(--winui-SurfaceStrokeColorDefaultBrush);
		border-style: solid;
		/* c1-allow: TitleBarPage.xaml:38, BorderThickness="1" */
		border-width: 1px;
		border-radius: var(--winui-OverlayCornerRadius);
		overflow: hidden;
	}
	.search {
		display: flex;
		width: 100%;
		max-width: 580px;
	}
	.search :global(.search-box) {
		width: 100%;
	}
	.configuration-options {
		display: flex;
		flex-direction: column;
		width: 240px;
		gap: 12px;
	}
	.window-example {
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 560px;
		gap: 12px;
	}
	.window-example p {
		margin: 0;
		text-align: center;
	}
</style>
