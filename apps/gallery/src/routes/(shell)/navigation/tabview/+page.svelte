<script lang="ts">
	import {
		Button,
		ComboBox,
		MenuFlyout,
		TabView,
		type MenuFlyoutEntry,
		type TabViewItemData,
		type TabViewTabContextRequestedEventArgs
	} from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { SamplePage1, SamplePage2, SamplePage3 } from '$lib/sample-pages';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/navigation/tabview');
	if (item === null) throw new Error('TabView page has no Gallery item');
	const addingSample = sampleOf('TabView/TabviewSupportAddingClosing.txt');
	const markupSample = sampleOf('TabView/TabviewTabviewitemsDefinedMarkup.txt');
	const boundSample = sampleOf('TabView/TabviewBoundCollectionMydata.txt');
	const keyboardSample = sampleOf('TabView/TabviewKeyboardingSupport.txt');
	const customSample = sampleOf('TabView/TabViewYouPutCustomContent.txt');
	const widthsSample = sampleOf('TabView/TabViewTabWidthsEitherBe.txt');
	const overlaySample = sampleOf('TabView/TabViewCloseButtonBePersistent.txt');
	const iconsSample = sampleOf('TabView/TabviewColorTabIcons.txt');
	const accentSample = sampleOf('TabView/TabviewAccentColoredTabstrip.txt');
	const windowingSample = sampleOf('TabView/CompleteTabviewWindowingSample.txt');

	// A Symbol's code point in Segoe Fluent Icons (`data/winui-symbol.json`).
	const SYMBOL = { Document: 'E8A5', Placeholder: 'E18A', Home: 'E80F', MusicInfo: 'E90B' };

	// Each new tab's content is a Frame on SamplePage1, 2 or 3 by its index modulo three
	// (TabViewPage.xaml.cs:73-84, and :107-118 for the bound sample's).
	const pageOf = (index: number) => [page1, page2, page3][index % 3];

	// Every tab gets an id of its own: the header comes from the count of tabs when it was
	// added, so after a close two tabs can share one, as they do in the original.
	let nextId = 0;
	const id = () => `tab-${nextId++}`;

	// CreateNewTab (TabViewPage.xaml.cs:61-89): "Document " and the index, the Document symbol.
	// It also sets the page's ContextFlyout (:67), as the markup tabs do; `contextMenu` below
	// is what the TabViews it reaches take.
	const newTab = (index: number): TabViewItemData => ({
		id: id(),
		header: `Document ${index}`,
		glyph: SYMBOL.Document,
		content: pageOf(index)
	});
	// TabView_Loaded (TabViewPage.xaml.cs:36-42) adds three tabs to an empty TabView.
	const loaded = () => [0, 1, 2].map(newTab);
	const without = (items: TabViewItemData[], tab: string) => items.filter((t) => t.id !== tab);

	// Example 1 (TabViewPage.xaml:16-27). Its heading promises rearranging, which a TabView's
	// CanReorderTabs gives every view there by dragging and none here: WD-023.
	let items1 = $state(loaded());

	// Example 2 (:29-58): three tabs in markup, the Placeholder symbol, SamplePage1 to 3. Its add
	// button runs the same handler, which appends a Document tab.
	let items2 = $state<TabViewItemData[]>(
		[0, 1, 2].map((index) => ({
			id: id(),
			header: `Document ${index}`,
			glyph: SYMBOL.Placeholder,
			content: pageOf(index)
		}))
	);

	// Example 3 (:61-81): the MyData collection (TabViewPage.xaml.cs:93-145), each item drawn
	// by the TabItemTemplate as a tab with its header, icon and content.
	const newData = (index: number): TabViewItemData => ({
		id: id(),
		header: `MyData Doc ${index}`,
		glyph: SYMBOL.Placeholder,
		content: pageOf(index)
	});
	let items3 = $state([0, 1, 2].map(newData));

	// Example 4 (:83-160).
	let items4 = $state(loaded());
	let selected4 = $state<string | null>(null);

	// The KeyboardAccelerators (:111-156, TabViewPage.xaml.cs:149-221), which no component here
	// carries (docs/library-gate.md, the TabView paragraph of 2026-10-14), drawn on the window.
	// An accelerator on an element is the window's to invoke wherever the focus is: pressed on
	// the reference guest, Control+T with the focus on the first example's tab added a tab to
	// this one. The handler marks each handled, so the key goes no further: a browser's own
	// Control+1 to Control+9 included, and Control+T and Control+W would be too, were the browser
	// to pass them on, which a Chromium-based one does not (WD-102). T and W are the layout's
	// letters, as a VirtualKey is, or the keys in their place where the layout's are not Latin
	// letters.
	function accelerate(event: KeyboardEvent) {
		if (!event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;
		const key = /^[a-z]$/i.test(event.key)
			? event.key.toLowerCase()
			: (/^Key([A-Z])$/.exec(event.code)?.[1].toLowerCase() ?? '');
		if (key === 't') {
			items4 = [...items4, newTab(items4.length)];
		} else if (key === 'w') {
			// Only a closable tab is closed (TabViewPage.xaml.cs:165); every tab here is.
			const current = selected4 ?? items4[0]?.id;
			if (current !== undefined) items4 = without(items4, current);
		} else if (/^Digit[1-9]$/.test(event.code)) {
			// Number1 to Number8 select that tab, Number9 the last (TabViewPage.xaml.cs:182-212),
			// and only a tab that is there (:215-218). The keys are the number row's, not the keypad's.
			const digit = Number(event.code.slice(5));
			const index = digit === 9 ? items4.length - 1 : digit - 1;
			if (index >= 0 && index < items4.length) selected4 = items4[index].id;
		} else {
			return;
		}
		event.preventDefault();
	}

	// Example 5 (:162-205).
	let items5 = $state(loaded());

	// Examples 6 and 7 (:207-299): three fixed tabs, closable in the seventh.
	const fixedTabs = (closable: boolean): TabViewItemData[] => [
		{ id: 'home', header: 'Home', glyph: SYMBOL.Home, closable, content: page1 },
		{
			id: 'longer',
			header: 'Tab 2 Has Longer Text',
			glyph: SYMBOL.MusicInfo,
			closable,
			content: page2
		},
		{ id: 'third', header: 'Third Tab', glyph: SYMBOL.Placeholder, closable, content: page3 }
	];
	let items6 = $state(fixedTabs(false));
	// TabWidthBehaviorComboBox_SelectionChanged (TabViewPage.xaml.cs:224-241).
	const WIDTH_MODES = [
		{ value: 'sizeToContent', label: 'SizeToContent' },
		{ value: 'equal', label: 'Equal' },
		{ value: 'compact', label: 'Compact' }
	];
	let widthMode6 = $state<'sizeToContent' | 'equal' | 'compact'>('sizeToContent');
	const WIDTH_MODE_NAMES = { sizeToContent: 'SizeToContent', equal: 'Equal', compact: 'Compact' };

	// The seventh sets no TabCloseRequested, so a close button closes nothing.
	let items7 = $state(fixedTabs(true));
	// TabCloseButtonOverlayModeComboBox_SelectionChanged (TabViewPage.xaml.cs:243-260): the
	// item "OnHover" sets OnPointerOver. SelectedIndex="1" (TabViewPage.xaml:289) starts it on Always,
	// as the original's source pane shows at load.
	const OVERLAY_MODES = [
		{ value: 'auto', label: 'Auto' },
		{ value: 'always', label: 'Always' },
		{ value: 'onPointerOver', label: 'OnHover' }
	];
	let overlayMode7 = $state<'auto' | 'always' | 'onPointerOver'>('always');
	const OVERLAY_MODE_NAMES = { auto: 'Auto', always: 'Always', onPointerOver: 'OnPointerOver' };

	// Example 8 (:301-336): full-colour bitmaps, no content.
	let items8 = $state<TabViewItemData[]>([
		{ id: 'cmd', header: 'CMD Prompt', closable: false, icon: cmdIcon },
		{ id: 'powershell', header: 'PowerShell', closable: false, icon: powershellIcon },
		{ id: 'linux', header: 'Windows Subsystem for Linux', closable: false, icon: linuxIcon }
	]);

	// Example 9 (:338-361).
	let items9 = $state(loaded());

	// TabView_AddButtonClick (TabViewPage.xaml.cs:51-54) appends at the count, without
	// selecting, and TabView_TabCloseRequested (:56-59) removes the tab asked for.
	const add = (items: TabViewItemData[]) => [...items, newTab(items.length)];

	// The page's one MenuFlyout, `TabViewContextMenu` (TabViewPage.xaml:12), is the ContextFlyout
	// of every tab but the third example's, whose items take none: the markup tabs' (:38-50,
	// :218-230, :264-276, :316-326) and every tab CreateNewTab makes. Its Opening fills it with
	// "Move tab left", "Move tab right" or both as the tab's place allows, and hides it when it
	// holds neither (TabViewPage.xaml.cs:275-284, TabViewHelper.cs:61-101). It opens at the
	// pointer, or against the tab from the keyboard, as the library's tab reports.
	let menuOpen = $state(false);
	let menuAnchor = $state<HTMLElement | null>(null);
	let menuPosition = $state<{ x: number; y: number } | null>(null);
	let menuRows = $state<MenuFlyoutEntry[]>([]);
	let moveTab: (row: string) => void = () => {};

	function contextMenu(get: () => TabViewItemData[], set: (items: TabViewItemData[]) => void) {
		return (tab: string, args: TabViewTabContextRequestedEventArgs) => {
			const count = get().length;
			const index = get().findIndex((t) => t.id === tab);
			if (index < 0) return;
			const rows: MenuFlyoutEntry[] = [];
			if (index > 0) rows.push({ id: 'left', text: 'Move tab left' });
			if (index < count - 1) rows.push({ id: 'right', text: 'Move tab right' });
			menuRows = rows;
			menuAnchor = args.originalSource;
			menuPosition = args.position;
			// The tab is moved in its collection: removed, then inserted one place over. It is
			// found again by its id when the row is invoked, where upstream keeps the index the menu
			// opened at; the two differ only if the view changed while the menu was open.
			moveTab = (row) => {
				const next = [...get()];
				const from = next.findIndex((t) => t.id === tab);
				const to = row === 'left' ? from - 1 : from + 1;
				if (from < 0 || to < 0 || to >= next.length) return;
				const [moved] = next.splice(from, 1);
				next.splice(to, 0, moved);
				set(next);
			};
			menuOpen = rows.length > 0;
		};
	}
</script>

{#snippet page1()}<SamplePage1 />{/snippet}
{#snippet page2()}<SamplePage2 />{/snippet}
{#snippet page3()}<SamplePage3 />{/snippet}
{#snippet bitmap(source: string)}<img class="bitmap-icon" src={source} alt="" />{/snippet}
{#snippet cmdIcon()}{@render bitmap('/cmd.png')}{/snippet}
{#snippet powershellIcon()}{@render bitmap('/powershell.png')}{/snippet}
{#snippet linuxIcon()}{@render bitmap('/linux.png')}{/snippet}

<svelte:window onkeydown={accelerate} />

<MenuFlyout
	items={menuRows}
	anchor={menuAnchor}
	position={menuPosition}
	bind:open={menuOpen}
	onItemInvoked={(row) => moveTab(row)}
/>

<ItemPage {item}>
	<ControlExample
		headerText={addingSample.header ?? undefined}
		xaml={addingSample.xaml ?? undefined}
		csharp={addingSample.csharp ?? undefined}
	>
		<TabView
			items={items1}
			onAddTabButtonClick={() => (items1 = add(items1))}
			onTabCloseRequested={(tab) => (items1 = without(items1, tab))}
			onTabContextRequested={contextMenu(
				() => items1,
				(next) => (items1 = next)
			)}
			class="tv-page-view"
		/>
	</ControlExample>

	<ControlExample
		headerText={markupSample.header ?? undefined}
		xaml={markupSample.xaml ?? undefined}
		csharp={markupSample.csharp ?? undefined}
	>
		<TabView
			items={items2}
			onAddTabButtonClick={() => (items2 = add(items2))}
			onTabCloseRequested={(tab) => (items2 = without(items2, tab))}
			onTabContextRequested={contextMenu(
				() => items2,
				(next) => (items2 = next)
			)}
			class="tv-page-view"
		/>
	</ControlExample>

	<ControlExample
		headerText={boundSample.header ?? undefined}
		xaml={boundSample.xaml ?? undefined}
		csharp={boundSample.csharp ?? undefined}
	>
		<TabView
			items={items3}
			onAddTabButtonClick={() => (items3 = [...items3, newData(items3.length)])}
			onTabCloseRequested={(tab) => (items3 = without(items3, tab))}
			class="tv-page-view"
		/>
	</ControlExample>

	<ControlExample
		headerText={keyboardSample.header ?? undefined}
		xaml={keyboardSample.xaml ?? undefined}
		csharp={keyboardSample.csharp ?? undefined}
	>
		<div class="sample">
			<!-- :86-101, WrapWholeWords, the last with Margin="0,0,0,24". -->
			<p class="winui-BodyTextBlockStyle">- Ctrl+T opens a new tab</p>
			<p class="winui-BodyTextBlockStyle">- Ctrl+W closes the selected tab</p>
			<p class="winui-BodyTextBlockStyle">- Ctrl+1 to Ctrl+8 selects that number tab</p>
			<p class="winui-BodyTextBlockStyle last-line">
				- Ctrl+9 selects the last tab (regardless of the number of tabs)
			</p>
			<TabView
				items={items4}
				bind:selected={selected4}
				onAddTabButtonClick={() => (items4 = add(items4))}
				onTabCloseRequested={(tab) => (items4 = without(items4, tab))}
				onTabContextRequested={contextMenu(
					() => items4,
					(next) => (items4 = next)
				)}
				class="tv-page-view"
			/>
		</div>
	</ControlExample>

	<ControlExample
		headerText={customSample.header ?? undefined}
		xaml={customSample.xaml ?? undefined}
		csharp={customSample.csharp ?? undefined}
	>
		<div class="sample">
			<!-- :165-176, the first two with Margin="0,0,0,12", the third "0,0,0,24". -->
			<p class="winui-BodyTextBlockStyle line">
				You can put any content in the TabStripHeader and TabStripFooter areas
			</p>
			<p class="winui-BodyTextBlockStyle line">
				If your TabView is used inside the app's titlebar area, use the TabStripFooter to specify a
				custom drag region
			</p>
			<p class="winui-BodyTextBlockStyle last-line">
				See TabViewWindowingSamplePage.xaml and *.cs files to see the complete code
			</p>
			<TabView
				items={items5}
				tabWidthMode="sizeToContent"
				onAddTabButtonClick={() => (items5 = add(items5))}
				onTabCloseRequested={(tab) => (items5 = without(items5, tab))}
				onTabContextRequested={contextMenu(
					() => items5,
					(next) => (items5 = next)
				)}
				class="tv-page-view"
			>
				{#snippet tabStripHeader()}
					<!-- :188-193, Margin="8,6", BaseTextBlockStyle. -->
					<span class="strip-header-text winui-BaseTextBlockStyle">TabStripHeader Content</span>
				{/snippet}
				{#snippet tabStripFooter()}
					<!-- :195-201, Margin="6", HorizontalAlignment="Right". -->
					<span class="strip-footer-text winui-BaseTextBlockStyle">TabStripFooter Content</span>
				{/snippet}
			</TabView>
		</div>
	</ControlExample>

	<ControlExample
		headerText={widthsSample.header ?? undefined}
		xaml={widthsSample.xaml ?? undefined}
		csharp={widthsSample.csharp ?? undefined}
		substitutions={{ TabWidthMode: WIDTH_MODE_NAMES[widthMode6] }}
	>
		<TabView
			items={items6}
			onTabContextRequested={contextMenu(
				() => items6,
				(next) => (items6 = next)
			)}
			tabWidthMode={widthMode6}
			addTabButtonVisible={false}
			class="tv-page-view"
		/>
		{#snippet options()}
			<!-- :240-248, Width="150". -->
			<ComboBox
				items={WIDTH_MODES}
				bind:value={widthMode6}
				header="TabWidthBehavior"
				style="width: 150px"
			/>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={overlaySample.header ?? undefined}
		xaml={overlaySample.xaml ?? undefined}
		csharp={overlaySample.csharp ?? undefined}
		substitutions={{ CloseButtonOverlayMode: OVERLAY_MODE_NAMES[overlayMode7] }}
	>
		<TabView
			items={items7}
			onTabContextRequested={contextMenu(
				() => items7,
				(next) => (items7 = next)
			)}
			closeButtonOverlayMode={overlayMode7}
			addTabButtonVisible={false}
			class="tv-page-view"
		/>
		{#snippet options()}
			<!-- :286-294, Width="150". -->
			<ComboBox
				items={OVERLAY_MODES}
				bind:value={overlayMode7}
				header="TabViewItem CloseButtonOverlayMode"
				style="width: 150px"
			/>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={iconsSample.header ?? undefined}
		xaml={iconsSample.xaml ?? undefined}
		csharp={iconsSample.csharp ?? undefined}
	>
		<div class="sample">
			<!-- :304-307, Margin="0,0,0,12". -->
			<p class="winui-BodyTextBlockStyle line">
				Use BitmapIcon.ShowAsMonochrome="False" to display full color icons in the TabViewItem
			</p>
			<!-- :309-314, MinWidth="490", and neither the MinHeight nor the negative Margin the
			     others take. -->
			<TabView
				items={items8}
				onTabContextRequested={contextMenu(
					() => items8,
					(next) => (items8 = next)
				)}
				tabWidthMode="sizeToContent"
				addTabButtonVisible={false}
				class="tv-page-icons"
			/>
		</div>
	</ControlExample>

	<ControlExample
		headerText={accentSample.header ?? undefined}
		xaml={accentSample.xaml ?? undefined}
		csharp={accentSample.csharp ?? undefined}
	>
		<TabView
			items={items9}
			onAddTabButtonClick={() => (items9 = add(items9))}
			onTabCloseRequested={(tab) => (items9 = without(items9, tab))}
			onTabContextRequested={contextMenu(
				() => items9,
				(next) => (items9 = next)
			)}
			class="tv-page-view tv-page-accent"
		/>
	</ControlExample>

	<ControlExample
		headerText={windowingSample.header ?? undefined}
		xaml={windowingSample.xaml ?? undefined}
		csharp={windowingSample.csharp ?? undefined}
	>
		<!-- WD-065: TabViewWindowingButton_Click (TabViewPage.xaml.cs:262-273) opens a Window that
		     extends its content into the title bar, with the TabView in it; `window.open` works
		     here, but it would show browser chrome with none of that, so the demonstration is
		     declined and the button does nothing. -->
		<Button>Click here to launch the sample</Button>
	</ControlExample>
</ItemPage>

<style>
	.sample {
		display: flex;
		flex-direction: column;
	}
	.sample p {
		margin: 0;
	}
	.sample p.line {
		/* c1-allow: TabViewPage.xaml:166, :170 and :305, Margin="0,0,0,12". */
		margin-bottom: 12px;
	}
	.sample p.last-line {
		/* c1-allow: TabViewPage.xaml:99 and :174, Margin="0,0,0,24". */
		margin-bottom: 24px;
	}
	/* MinHeight="475" and Margin="-12" on every TabView but the eighth, which fills the card
	   to its edges. */
	:global(.tv-page-view) {
		/* c1-allow: TabViewPage.xaml:20, :32, :65, :105, :180, :212, :259 and :341,
		   MinHeight="475". */
		min-height: 475px;
		/* c1-allow: TabViewPage.xaml:21, :33, :66, :106, :181, :213, :260 and :342, Margin="-12". */
		margin: -12px;
	}
	:global(.tv-page-icons) {
		/* c1-allow: TabViewPage.xaml:311, MinWidth="490". */
		min-width: 490px;
	}
	.strip-header-text {
		/* c1-allow: TabViewPage.xaml:189, Margin="8,6", horizontal then vertical. */
		margin: 6px 8px;
		/* VerticalAlignment="Center" (:190). */
		align-self: center;
	}
	.strip-footer-text {
		/* c1-allow: TabViewPage.xaml:196, Margin="6". */
		margin: 6px;
		/* HorizontalAlignment="Right" in the footer's own column, and VerticalAlignment="Center"
		   (:197-198). */
		margin-left: auto;
		align-self: center;
	}
	.bitmap-icon {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* The ninth's own TabViewBackground (TabViewPage.xaml:347-358): SystemAccentColorLight2 in
	   light and SystemAccentColorDark2 in dark; its dictionaries name no high-contrast brush, so
	   high contrast keeps the control's. */
	:global(:root:not([data-theme='high-contrast'])) :global(.tv-page-accent) {
		--winui-TabViewBackground: var(--winui-SystemAccentColorLight2);
	}
	:global(:root[data-theme='dark']) :global(.tv-page-accent) {
		--winui-TabViewBackground: var(--winui-SystemAccentColorDark2);
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light']):not([data-theme='high-contrast']))
			:global(.tv-page-accent) {
			--winui-TabViewBackground: var(--winui-SystemAccentColorDark2);
		}
	}
</style>
