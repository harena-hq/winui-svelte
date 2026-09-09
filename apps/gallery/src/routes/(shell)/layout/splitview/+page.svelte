<script lang="ts">
	import { ComboBox, ListView, Slider, SplitView, ToggleButton, ToggleSwitch } from 'winui-svelte';
	import type { ComboBoxProps, SplitViewProps } from 'winui-svelte';
	import { icons, type Icon } from '$lib/design';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	type DisplayModeName = 'Inline' | 'CompactInline' | 'Overlay' | 'CompactOverlay';
	type PaneBackgroundName =
		'SystemControlBackgroundChromeMediumLowBrush' | 'Red' | 'Blue' | 'Green';
	interface NavLink {
		label: string;
		glyph: string;
	}
	interface PaneBackground {
		label: PaneBackgroundName;
		tag: string;
		css: string;
	}

	const item = itemOf('/layout/splitview');
	if (item === null) throw new Error('SplitView page has no Gallery item');
	const sample = sampleOf('SplitView/BasicSplitview.txt');
	const DISPLAY_MODES: Record<DisplayModeName, NonNullable<SplitViewProps['displayMode']>> = {
		Inline: 'inline',
		CompactInline: 'compactInline',
		Overlay: 'overlay',
		CompactOverlay: 'compactOverlay'
	};
	const DISPLAY_MODE_ITEMS: ComboBoxProps['items'] = Object.keys(DISPLAY_MODES).map((value) => ({
		value,
		label: value
	}));
	const PANE_BACKGROUNDS: PaneBackground[] = [
		{
			label: 'SystemControlBackgroundChromeMediumLowBrush',
			tag: '{ThemeResource SystemControlBackgroundChromeMediumLowBrush}',
			css: 'var(--winui-SystemControlBackgroundChromeMediumLowBrush)'
		},
		{ label: 'Red', tag: 'Red', css: '#FF0000' },
		{ label: 'Blue', tag: 'Blue', css: '#0000FF' },
		{ label: 'Green', tag: 'Green', css: '#008000' }
	];
	const PANE_BACKGROUND_ITEMS: ComboBoxProps['items'] = PANE_BACKGROUNDS.map(({ label }) => ({
		value: label,
		label
	}));
	const iconFor = (name: string): Icon => {
		const icon = icons.find((candidate) => candidate.Name === name);
		if (!icon) throw new Error(`SplitView page is missing the ${name} icon`);
		return icon;
	};
	const NAV_LINKS: NavLink[] = ['People', 'Globe', 'Message', 'Mail'].map((label) => ({
		label,
		glyph: String.fromCodePoint(parseInt(iconFor(label).Code, 16))
	}));

	let paneOpen = $state(true);
	let placementRight = $state(false);
	// The XAML initializes CompactOverlay, but SelectedIndex="0" fires at load and sets Inline.
	let displayMode = $state<DisplayModeName>('Inline');
	let paneBackground = $state<PaneBackgroundName>('SystemControlBackgroundChromeMediumLowBrush');
	let openPaneLength = $state(256);
	let compactPaneLength = $state(48);
	let contentText = $state('');
	const background = $derived.by(() => {
		const found = PANE_BACKGROUNDS.find((candidate) => candidate.label === paneBackground);
		if (!found) throw new Error(`SplitView page is missing the ${paneBackground} background`);
		return found;
	});
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		substitutions={{
			PaneBackground: background.tag,
			IsPaneOpen: paneOpen ? 'True' : 'False',
			OpenPaneLength: String(openPaneLength),
			CompactPaneLength: String(compactPaneLength),
			DisplayMode: displayMode
		}}
	>
		<!-- Grid Height="300" Width="400" VerticalAlignment="Top", SplitViewPage.xaml:53 -->
		<div class="frame" data-vertical-alignment="top">
			<SplitView
				bind:paneOpen
				displayMode={DISPLAY_MODES[displayMode]}
				panePlacement={placementRight ? 'right' : 'left'}
				{openPaneLength}
				{compactPaneLength}
				paneBackground={background.css}
				style="max-width: 400px; height: 100%"
			>
				{#snippet pane()}
					<div class="pane-layout">
						<span class="pane-header winui-BaseTextBlockStyle">PANE CONTENT</span>
						<ListView
							items={NAV_LINKS}
							selectionMode="single"
							isItemClickEnabled
							onItemClick={(link) => (contentText = `${link.label} Page`)}
							itemTemplate={placementRight ? rightIconItem : leftIconItem}
							style="margin-top: 12px"
						/>
					</div>
				{/snippet}
				<div class="content-layout">
					<span class="content-header winui-BaseTextBlockStyle">SPLITVIEW CONTENT</span><span
						class="content-text winui-BodyTextBlockStyle">{contentText}</span
					>
				</div>
			</SplitView>
		</div>
		{#snippet options()}
			<!-- SplitViewPage.xaml:98 — options StackPanel has no Spacing. -->
			<div class="options">
				<ToggleButton bind:checked={paneOpen}>IsPaneOpen</ToggleButton>
				<!-- SplitViewPage.xaml:106-111. -->
				<ToggleSwitch
					header="Placement"
					offContent="Left"
					onContent="Right"
					bind:checked={placementRight}
					style="min-width: 120px; margin-top: 12px"
				/>
				<!-- SplitViewPage.xaml:118-128. -->
				<ComboBox
					header="DisplayMode"
					items={DISPLAY_MODE_ITEMS}
					bind:value={displayMode}
					style="width: 196px; margin-top: 4px"
				/>
				<!-- SplitViewPage.xaml:136-146. -->
				<ComboBox
					header="PaneBackground"
					items={PANE_BACKGROUND_ITEMS}
					bind:value={paneBackground}
					style="width: 196px; margin-top: 12px"
				/>
				<!-- SplitViewPage.xaml:148-157. -->
				<Slider
					header="OpenPaneLength"
					min={128}
					max={500}
					step={8}
					bind:value={openPaneLength}
					style="width: 196px; margin-top: 12px"
				/>
				<!-- SplitViewPage.xaml:159-166. -->
				<Slider
					header="CompactPaneLength"
					min={24}
					max={128}
					step={8}
					bind:value={compactPaneLength}
					style="width: 196px"
				/>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

{#snippet leftIconItem(link: NavLink)}
	<div class="nav-link nav-link-left">
		<span class="symbol">{link.glyph}</span><span class="nav-label">{link.label}</span>
	</div>
{/snippet}
{#snippet rightIconItem(link: NavLink)}
	<div class="nav-link nav-link-right">
		<span class="nav-label">{link.label}</span><span class="symbol">{link.glyph}</span>
	</div>
{/snippet}

<style>
	.frame {
		width: 400px;
		height: 300px; /* c1-allow: SplitViewPage.xaml:53. */
	}
	.pane-layout {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto; /* c1-allow: SplitViewPage.xaml:66-72. */
	}
	.pane-header {
		margin: 12px 0 0 60px; /* c1-allow: SplitViewPage.xaml:72 — Margin="60,12,0,0". */
	}
	.content-layout {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr); /* c1-allow: SplitViewPage.xaml:85-89. */
	}
	.content-header,
	.content-text {
		margin: 12px 0 0 12px; /* c1-allow: SplitViewPage.xaml:92 and :97. */
	}
	.nav-link {
		display: grid;
		align-items: center; /* c1-allow: SplitViewPage.xaml:11-44. */
	}
	.nav-link-left {
		grid-template-columns: auto minmax(0, 1fr);
		margin-left: 2px; /* c1-allow: SplitViewPage.xaml:12. */
	}
	.nav-link-left .nav-label {
		margin-left: 24px; /* c1-allow: SplitViewPage.xaml:23. */
	}
	.nav-link-right {
		grid-template-columns: minmax(0, 1fr) auto;
		margin-right: 2px; /* c1-allow: SplitViewPage.xaml:31. */
	}
	.nav-link-right .nav-label {
		margin-right: 24px; /* c1-allow: SplitViewPage.xaml:39. */
	}
	.symbol {
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: SymbolIcon — glyph measures 20 wide on the reference. */
		font-size: 20px;
		/* c1-allow: SymbolIcon — line-height: 1 makes the glyph box its 20px size. */
		line-height: 1;
	}
	.options {
		display: flex;
		flex-direction: column; /* c1-allow: SplitViewPage.xaml:98 — StackPanel. */
	}
</style>
