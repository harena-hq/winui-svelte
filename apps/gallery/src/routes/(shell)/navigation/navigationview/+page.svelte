<script lang="ts">
	import type { Component } from 'svelte';
	import {
		CheckBox,
		NavigationView,
		NavigationViewItem,
		RadioButton,
		RadioButtons,
		TextBox,
		type NavigationViewEntry
	} from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import {
		SamplePage1,
		SamplePage2,
		SamplePage3,
		SamplePage4,
		SamplePage5,
		SamplePage6,
		SampleSettingsPage
	} from '$lib/sample-pages';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/navigation/navigationview');
	if (item === null) throw new Error('NavigationView page has no Gallery item');
	const defaultSample = sampleOf('NavigationView/NavigationviewDefaultPanedisplaymode.txt');
	const topSample = sampleOf('NavigationView/NavigationviewPanedisplaymodeTop.txt');
	const switchesSample = sampleOf('NavigationView/NavigationviewSwitchesPaneOrientation.txt');
	const tabsSample = sampleOf('NavigationView/NavigationViewTyingSelectionFocusTabs.txt');
	const bindingSample = sampleOf('NavigationView/NavigationViewDataBinding.txt');
	const footerSample = sampleOf('NavigationView/NavigationviewFooterMenuItems.txt');
	const hierarchySample = sampleOf('NavigationView/HierarchicalNavigationview.txt');
	const apiSample = sampleOf('NavigationView/NavigationViewApiAction.txt');

	// Each item's Tag names the page its Frame navigates to (NavigationViewPage.xaml.cs:65-204,
	// through SamplesNavigationPageMappings.PageDictionary at Helpers/SamplesNavigationPageMappings.cs
	// :14-19), and the settings item the settings page.
	const PAGES: Record<string, Component> = {
		SamplePage1,
		SamplePage2,
		SamplePage3,
		SamplePage4,
		SamplePage5,
		SamplePage6,
		settings: SampleSettingsPage
	};
	// The headers the code-behind writes: "Sample Page " and the Tag's last character.
	const headerOf = (tag: string) => `Sample Page ${tag.slice(-1)}`;

	// A Symbol's code point in Segoe Fluent Icons.
	const SYMBOL = {
		Play: 'E768',
		Save: 'E74E',
		Refresh: 'E72C',
		Download: 'E896',
		Library: 'E8F1',
		Map: 'E707',
		Tag: 'E8EC',
		Home: 'E80F',
		Keyboard: 'E765',
		Mail: 'E715',
		Contact: 'E77B',
		Calendar: 'E787',
		Page2: 'E7C3',
		NewFolder: 'E8F4',
		OpenLocal: 'E8DA',
		Shop: 'E719',
		Help: 'E897'
	} as const;

	// Example 1 (NavigationViewPage.xaml:54-99, nvSample5): its first item selected from the
	// constructor (NavigationViewPage.xaml.cs:33), which raises SelectionChanged and sets the
	// header (:126-141). An item's id is its Tag.
	const items1: NavigationViewEntry[] = [
		{ id: 'SamplePage1', content: 'Menu Item1', glyph: SYMBOL.Play },
		{ id: 'SamplePage2', content: 'Menu Item2', glyph: SYMBOL.Save },
		{ id: 'SamplePage3', content: 'Menu Item3', glyph: SYMBOL.Refresh },
		{ id: 'SamplePage4', content: 'Menu Item4', glyph: SYMBOL.Download }
	];
	let selected1 = $state('SamplePage1');
	let header1 = $state(headerOf('SamplePage1'));
	function invoke1(id: string) {
		selected1 = id;
		if (id !== 'settings') header1 = headerOf(id);
	}

	// Example 2 (:101-135, nvSample6): its header stays the XAML's
	// (NavigationViewPage.xaml.cs:142-155 writes none). Menu Item4's Tag is SamplePage3 (:129),
	// the same as Menu Item3's, so each is its own id here and the page is looked up by the Tag.
	const items2: NavigationViewEntry[] = [
		{ id: 'item1', content: 'Menu Item1' },
		{ id: 'item2', content: 'Menu Item2' },
		{ id: 'item3', content: 'Menu Item3' },
		{ id: 'item4', content: 'Menu Item4' }
	];
	const TAGS2: Record<string, string> = {
		item1: 'SamplePage1',
		item2: 'SamplePage2',
		item3: 'SamplePage3',
		item4: 'SamplePage3',
		settings: 'settings'
	};
	let selected2 = $state('item1');

	// Example 3 (:137-172, nvSample2): Auto, and the page's AdaptiveTrigger (:582-594) sets it
	// to Top once the window is CompactModeThresholdWidth wide, 641 by default; the threshold is
	// held, not a member here (docs/library-gate.md's NavigationView paragraph).
	const items3: NavigationViewEntry[] = [
		{ id: 'SamplePage1', content: 'Menu Item1' },
		{ id: 'SamplePage2', content: 'Menu Item2' },
		{ id: 'SamplePage3', content: 'Menu Item3' },
		{ id: 'SamplePage4', content: 'Menu Item4' }
	];
	let selected3 = $state('SamplePage1');
	// Zero until the window binding reports it, so the first frame is Auto and the trigger applies
	// once the page is mounted. Seeding it from window.innerWidth would draw Top a frame sooner on
	// a client navigation, but a prerendered load would then hydrate Top over the Auto the server
	// drew, a mismatch Svelte repairs by redrawing the view.
	let windowWidth = $state(0);

	// Example 4 (:174-208, nvSample7): Top with no back button. SelectionFollowsFocus="Enabled"
	// is not drawn: docs/library-gate.md's NavigationView paragraph owes it.
	const items4: NavigationViewEntry[] = [
		{ id: 'SamplePage1', content: 'Item1' },
		{ id: 'SamplePage2', content: 'Item2' },
		{ id: 'SamplePage3', content: 'Item3' },
		{ id: 'SamplePage4', content: 'Item4' }
	];
	let selected4 = $state('SamplePage1');

	// Example 5 (:210-239, nvSample4): MenuItemsSource is the page's Categories
	// (NavigationViewPage.xaml.cs:39-45), each drawn by the MenuItemTemplateSelector's template
	// as a NavigationViewItem with its Name and its Glyph (NavigationViewPage.xaml:13-23), here
	// menuItemTemplate drawing the same; every category shows SamplePage1 and the header names
	// its number, and settings shows the settings page under the header it had
	// (NavigationViewPage.xaml.cs:106-123). Each item's ToolTip is not drawn:
	// docs/library-gate.md's NavigationView paragraph owes an item's own tooltip.
	const categories: NavigationViewEntry[] = [
		{ id: 'Category 1', content: 'Category 1', glyph: SYMBOL.Home },
		{ id: 'Category 2', content: 'Category 2', glyph: SYMBOL.Keyboard },
		{ id: 'Category 3', content: 'Category 3', glyph: SYMBOL.Library },
		{ id: 'Category 4', content: 'Category 4', glyph: SYMBOL.Mail }
	];
	let selected5 = $state('Category 1');
	let header5 = $state(headerOf('Category 1'));
	function invoke5(id: string) {
		selected5 = id;
		if (id !== 'settings') header5 = headerOf(id);
	}

	// Example 6 (:241-313, nvSample9): Left with no settings item, and three FooterMenuItems
	// (:293-306), drawn as footerItems. Its header stays the XAML's. Help's Tag is SamplePage5
	// (:305), the same as Your Cart's (:301), and an id is unique across both lists here, so Help
	// is its own id and the page is looked up by the Tag, as in example 2.
	const items6: NavigationViewEntry[] = [
		{ id: 'SamplePage1', content: 'Browse', glyph: SYMBOL.Library },
		{ id: 'SamplePage2', content: 'Track an Order', glyph: SYMBOL.Map },
		{ id: 'SamplePage3', content: 'Order History', glyph: SYMBOL.Tag }
	];
	const footerItems6: NavigationViewEntry[] = [
		{ id: 'SamplePage4', content: 'Account', glyph: SYMBOL.Contact },
		{ id: 'SamplePage5', content: 'Your Cart', glyph: SYMBOL.Shop },
		{ id: 'help', content: 'Help', glyph: SYMBOL.Help }
	];
	const TAGS6: Record<string, string> = { help: 'SamplePage5' };
	let selected6 = $state('SamplePage1');
	let mode6 = $state<'left' | 'top'>('left');
	let paneOpen6 = $state(true);

	// Example 7 (:315-420, nvSample8): hierarchy. "Document options" has SelectsOnInvoked
	// False (:398), which the library's item does not carry (docs/library-gate.md's
	// NavigationView paragraph); invoking it here expands it and leaves the selection alone, as
	// the member would. Top mode draws no children (WD-025), and each item's ToolTip is owed as
	// in example 5.
	const items7: NavigationViewEntry[] = [
		{ id: 'SamplePage1', content: 'Home', glyph: SYMBOL.Home },
		{
			id: 'SamplePage2',
			content: 'Account',
			glyph: SYMBOL.Contact,
			children: [
				{ id: 'SamplePage3', content: 'Mail', glyph: SYMBOL.Mail },
				{ id: 'SamplePage4', content: 'Calendar', glyph: SYMBOL.Calendar }
			]
		},
		{
			id: 'document-options',
			content: 'Document options',
			glyph: SYMBOL.Page2,
			children: [
				{ id: 'SamplePage5', content: 'Create new', glyph: SYMBOL.NewFolder },
				{ id: 'SamplePage6', content: 'Upload file', glyph: SYMBOL.OpenLocal }
			]
		}
	];
	let selected7 = $state('SamplePage1');
	let header7 = $state(headerOf('SamplePage1'));
	let mode7 = $state<'left' | 'top' | 'leftCompact'>('left');
	let paneOpen7 = $state(true);
	let expanded7 = $state<string[]>([]);
	function invoke7(id: string) {
		if (id === 'document-options') return;
		selected7 = id;
		if (id !== 'settings') header7 = headerOf(id);
	}

	// Example 8 (:422-580, nvSample): nothing selected at first, so its Frame is empty and its
	// header is the TextBox's "Header".
	const items8: NavigationViewEntry[] = [
		{ id: 'SamplePage1', content: 'Menu Item1', glyph: SYMBOL.Play },
		{ header: 'Actions' },
		{ id: 'SamplePage2', content: 'Menu Item2', glyph: SYMBOL.Save },
		{ id: 'SamplePage3', content: 'Menu Item3', glyph: SYMBOL.Refresh }
	];
	let selected8 = $state<string | null>(null);
	let settingsVisible8 = $state(true);
	// IsBackButtonVisible is Auto until its box is clicked (NavigationViewPage.xaml.cs:216-226).
	let backVisible8 = $state<'auto' | 'visible' | 'collapsed'>('auto');
	let backVisibleChecked8 = $state(true);
	let backEnabled8 = $state(false);
	let autoSuggestVisible8 = $state(true);
	let headerText8 = $state('Header');
	let alwaysShowHeader8 = $state(true);
	let paneTitle8 = $state('Pane Title');
	let paneCustomContentVisible8 = $state(false);
	let paneFooterVisible8 = $state(false);
	let mode8 = $state<'left' | 'top'>('left');
	let paneOpen8 = $state(true);
	let selectionFollowsFocus8 = $state(false);
	let suppressItem2 = $state(false);
	function invoke8(id: string) {
		// SelectsOnInvoked False on Menu Item2 when its box is checked
		// (NavigationViewPage.xaml.cs:350-353), reproduced as example 7's is: the item does not
		// carry the member (docs/library-gate.md's NavigationView paragraph).
		if (id === 'SamplePage2' && suppressItem2) return;
		selected8 = id;
		if (id !== 'settings') headerText8 = headerOf(id);
	}

	const bool = (value: boolean) => (value ? 'True' : 'False');
	const visibility = (value: boolean) => (value ? 'Visible' : 'Collapsed');
	const MODE: Record<string, string> = { left: 'Left', top: 'Top', leftCompact: 'LeftCompact' };
	// setASBSubstitutionString (NavigationViewPage.xaml.cs:250-253), its CRLFs as LFs and the
	// spaces before them kept.
	const ASB =
		'\n    <NavigationView.AutoSuggestBox> \n        <AutoSuggestBox QueryIcon="Find" AutomationProperties.Name="Search" /> \n    </NavigationView.AutoSuggestBox> \n';
</script>

<svelte:window bind:innerWidth={windowWidth} />

<ItemPage {item}>
	<ControlExample
		headerText={defaultSample.header ?? undefined}
		xaml={defaultSample.xaml ?? undefined}
		horizontalContentAlignment="stretch"
	>
		<div class="sample">
			<!-- NavigationViewPage.xaml:65-68. -->
			<p class="intro winui-BodyTextBlockStyle">
				If you have five or more equally important navigation categories that should prominently
				appear on larger window widths, consider using a left navigation pane.
			</p>
			<!-- :70-97, Height="460". -->
			<NavigationView
				items={items1}
				selected={selected1}
				onItemInvoked={invoke1}
				paneDisplayMode="auto"
				class="nv-page-view"
			>
				{#snippet header()}{header1}{/snippet}
				{@const Page = PAGES[selected1]}
				<Page />
			</NavigationView>
		</div>
	</ControlExample>

	<ControlExample
		headerText={topSample.header ?? undefined}
		xaml={topSample.xaml ?? undefined}
		horizontalContentAlignment="stretch"
	>
		<div class="sample">
			<!-- :112-115. -->
			<p class="intro winui-BodyTextBlockStyle">
				If you have equally important navigation categories that should be de-emphasized relative to
				the content of your app, consider using a top navigation pane.
			</p>
			<!-- :117-133. -->
			<NavigationView
				items={items2}
				selected={selected2}
				onItemInvoked={(id) => (selected2 = id)}
				paneDisplayMode="top"
				class="nv-page-view"
			>
				{#snippet header()}This is Header Text{/snippet}
				{@const Page = PAGES[TAGS2[selected2]]}
				<Page />
			</NavigationView>
		</div>
	</ControlExample>

	<ControlExample
		headerText={switchesSample.header ?? undefined}
		xaml={switchesSample.xaml ?? undefined}
		horizontalContentAlignment="stretch"
	>
		<div class="sample">
			<!-- :148-151. -->
			<p class="intro winui-BodyTextBlockStyle">
				If you have equally important navigation categories and limited app content space, consider
				using a top navigation pane on larger window widths and a minimal left navigation pane on
				smaller window widths.
			</p>
			<!-- :153-170, with the AdaptiveTrigger at :582-594. -->
			<NavigationView
				items={items3}
				selected={selected3}
				onItemInvoked={(id) => (selected3 = id)}
				paneDisplayMode={windowWidth >= 641 ? 'top' : 'auto'}
				class="nv-page-view"
			>
				{@const Page = PAGES[selected3]}
				<Page />
			</NavigationView>
		</div>
	</ControlExample>

	<ControlExample
		headerText={tabsSample.header ?? undefined}
		xaml={tabsSample.xaml ?? undefined}
		csharp={tabsSample.csharp ?? undefined}
		horizontalContentAlignment="stretch"
	>
		<div class="sample">
			<!-- :185-188. -->
			<p class="intro winui-BodyTextBlockStyle">
				For the tabs pattern, ensure that you unify selection and focus by setting the
				SelectionFollowsFocus property to Enabled. If using a Frame to swap out content, then
				navigating between items shouldn't be recorded into the Frame's navigation stack. Please see
				the C# in the sample below to understand how to do this.
			</p>
			<!-- :190-206. -->
			<NavigationView
				items={items4}
				selected={selected4}
				onItemInvoked={(id) => (selected4 = id)}
				paneDisplayMode="top"
				backButtonVisible="collapsed"
				class="nv-page-view"
			>
				{@const Page = PAGES[selected4]}
				<Page />
			</NavigationView>
		</div>
	</ControlExample>

	<ControlExample
		headerText={bindingSample.header ?? undefined}
		xaml={bindingSample.xaml ?? undefined}
		csharp={bindingSample.csharp ?? undefined}
		horizontalContentAlignment="stretch"
	>
		<div class="sample">
			<!-- :221-224. -->
			<p class="intro winui-BodyTextBlockStyle">
				When data binding, use the MenuItemsSource property to bind to an observable collection of
				items, and do not set the MenuItems property. In addition, set the MenuItemTemplate property
				and use a NavigationViewItem as the data template. If you wish to bind to the header content
				as well, use data template selectors via the MenuItemTemplateSelector property.
			</p>
			<!-- :226-237. -->
			<NavigationView
				items={categories}
				selected={selected5}
				onItemInvoked={invoke5}
				class="nv-page-view"
			>
				{#snippet header()}{header5}{/snippet}
				{#snippet menuItemTemplate(entry)}
					{#if !('header' in entry)}
						<NavigationViewItem tag={entry.id} content={entry.content} glyph={entry.glyph} />
					{/if}
				{/snippet}
				{@const Page = selected5 === 'settings' ? SampleSettingsPage : SamplePage1}
				<Page />
			</NavigationView>
		</div>
	</ControlExample>

	<ControlExample
		headerText={footerSample.header ?? undefined}
		xaml={footerSample.xaml ?? undefined}
		horizontalContentAlignment="stretch"
		substitutions={{ PaneDisplay: MODE[mode6] }}
	>
		<div class="sample">
			<!-- :265-268. -->
			<p class="intro winui-BodyTextBlockStyle">
				You can add clickable menu items to the footer of your NavigationView that participate in
				the same selection model as items in the main menu. In Top PaneDisplayMode, these items will
				appear aligned to the right of the NavigationView. In Left PaneDisplayMode, these items will
				appear aligned to the bottom of the NavigationView.
			</p>
			<!-- :270-308. -->
			<NavigationView
				items={items6}
				footerItems={footerItems6}
				selected={selected6}
				onItemInvoked={(id) => (selected6 = id)}
				paneDisplayMode={mode6}
				bind:paneOpen={paneOpen6}
				settingsVisible={false}
				class="nv-page-view"
			>
				{#snippet header()}This is Header Text{/snippet}
				{@const Page = PAGES[TAGS6[selected6] ?? selected6]}
				<Page />
			</NavigationView>
		</div>
		{#snippet options()}
			<!-- :246-257, each selection setting the mode and the pane (NavigationViewPage.xaml.cs
			     :294-298 and :318-322). -->
			<RadioButtons header="Pane position:">
				<RadioButton
					name="footer-pane"
					value="left"
					group={mode6}
					onGroupChange={(value) => ((mode6 = value as typeof mode6), (paneOpen6 = true))}
					>Left mode</RadioButton
				>
				<RadioButton
					name="footer-pane"
					value="top"
					group={mode6}
					onGroupChange={(value) => ((mode6 = value as typeof mode6), (paneOpen6 = false))}
					>Top mode</RadioButton
				>
			</RadioButtons>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={hierarchySample.header ?? undefined}
		xaml={hierarchySample.xaml ?? undefined}
		horizontalContentAlignment="stretch"
		substitutions={{ PaneDisplay: MODE[mode7] }}
	>
		<div class="sample">
			<!-- :350-363, a RichTextBlock whose first three paragraphs end in a LineBreak, Margin
			     "0,0,0,15"; the empty TextBlock at :346-349 shares its row and is shorter. -->
			<div class="rich winui-BodyTextBlockStyle">
				<p class="broken">
					NavigationView supports hierarchy in Left, LeftCompact, and Top display modes.
				</p>
				<p class="broken">
					In the example below, the "Account" tab navigates to its own page while "Document options"
					only opens up its subtree of items. This is done by setting the SelectsOnInvoked property
					to false on the Document options NavigationView Item.
				</p>
				<p class="broken">
					In both Top and Left modes, clicking the arrows on NavigationViewItems will expand or
					collapse the subtree. Clicking or tapping elsewhere on the NavigationViewItem will
					collapse or expand the subtree.
				</p>
				<p>Switch between the three pane display modes on the right.</p>
			</div>
			<!-- :364-415. -->
			<NavigationView
				items={items7}
				selected={selected7}
				onItemInvoked={invoke7}
				paneDisplayMode={mode7}
				bind:paneOpen={paneOpen7}
				bind:expandedItems={expanded7}
				class="nv-page-view"
			>
				{#snippet header()}{header7}{/snippet}
				{@const Page = PAGES[selected7]}
				<Page />
			</NavigationView>
		</div>
		{#snippet options()}
			<!-- :320-338 and NavigationViewPage.xaml.cs:289-293, :313-317, :326-336. -->
			<div class="options-stack">
				<p class="options-label winui-BodyTextBlockStyle">PanePosition:</p>
				<RadioButton
					name="hierarchy-pane"
					value="left"
					group={mode7}
					onGroupChange={(value) => ((mode7 = value as typeof mode7), (paneOpen7 = true))}
					>Left mode</RadioButton
				>
				<RadioButton
					name="hierarchy-pane"
					value="top"
					group={mode7}
					onGroupChange={(value) => ((mode7 = value as typeof mode7), (paneOpen7 = false))}
					>Top mode</RadioButton
				>
				<RadioButton
					name="hierarchy-pane"
					value="leftCompact"
					group={mode7}
					onGroupChange={(value) => ((mode7 = value as typeof mode7), (paneOpen7 = false))}
					>LeftCompact mode</RadioButton
				>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={apiSample.header ?? undefined}
		xaml={apiSample.xaml ?? undefined}
		horizontalContentAlignment="stretch"
		substitutions={{
			SettingsVis: bool(settingsVisible8),
			BackButtonVis: backVisible8 === 'auto' ? 'Auto' : visibility(backVisible8 === 'visible'),
			BackButtonEn: bool(backEnabled8),
			HeaderText: headerText8,
			ShowHeader: bool(alwaysShowHeader8),
			PaneTitleText: paneTitle8,
			PaneCustomContentVis: visibility(paneCustomContentVisible8),
			PaneFooterVis: visibility(paneFooterVisible8),
			PaneDisplayMode: MODE[mode8],
			SelectionFollowsFocus: selectionFollowsFocus8 ? 'Enabled' : 'Disabled',
			SelectsOnInvoked: bool(!suppressItem2),
			NavViewASB: autoSuggestVisible8 ? ASB : ''
		}}
	>
		<!-- :502-564, Height="540" Margin="0,12,0,0". PaneTitle, PaneCustomContent, the
		     AutoSuggestBox slot, AlwaysShowHeader, SelectionFollowsFocus and
		     ExpandedModeThresholdWidth are not drawn: the library has none of them, and
		     docs/plan.md's rows and docs/library-gate.md's NavigationView paragraph owe
		     each. Their boxes still write the source, as the original's do. -->
		<NavigationView
			items={items8}
			selected={selected8}
			onItemInvoked={invoke8}
			paneDisplayMode={mode8}
			bind:paneOpen={paneOpen8}
			settingsVisible={settingsVisible8}
			backButtonVisible={backVisible8}
			backEnabled={backEnabled8}
			class="nv-page-view nv-page-api"
		>
			{#snippet header()}{headerText8}{/snippet}
			{#snippet paneFooter()}
				{#if paneFooterVisible8}
					<!-- :553-561, two icon-only NavigationViewItems, a row in Top mode
					     (NavigationViewPage.xaml.cs:287, :311). Drawn as their icons: the library's
					     item would claim a top-level tree row's role and place there and takes no name
					     of its own; docs/library-gate.md's NavigationView paragraph records it. -->
					<div class="pane-footer" data-orientation={mode8 === 'top' ? 'horizontal' : 'vertical'}>
						<span class="footer-icon" role="img" aria-label="download"
							>{String.fromCodePoint(parseInt(SYMBOL.Download, 16))}</span
						>
						<span class="footer-icon" role="img" aria-label="favorite"
							>{String.fromCodePoint(parseInt('E734', 16))}</span
						>
					</div>
				{/if}
			{/snippet}
			{#if selected8 !== null}
				{@const Page = PAGES[selected8]}
				<Page />
			{/if}
		</NavigationView>
		{#snippet options()}
			<!-- :427-501. -->
			<div class="options-stack">
				<CheckBox bind:checked={settingsVisible8}>Settings item visible</CheckBox>
				<CheckBox
					bind:checked={backVisibleChecked8}
					onCheckedChange={(on) => (backVisible8 = on ? 'visible' : 'collapsed')}
					>Back button visible</CheckBox
				>
				<CheckBox bind:checked={backEnabled8}>Back button enabled</CheckBox>
				<CheckBox bind:checked={autoSuggestVisible8}>AutoSuggestBox visible</CheckBox>
				<p class="options-label winui-BodyTextBlockStyle">Header:</p>
				<TextBox aria-label="Header property" bind:value={headerText8} />
				<CheckBox bind:checked={alwaysShowHeader8}>Always show header</CheckBox>
				<p class="options-label winui-BodyTextBlockStyle">PaneTitle:</p>
				<TextBox aria-label="PaneTitle property" bind:value={paneTitle8} />
				<CheckBox bind:checked={paneCustomContentVisible8}>PaneCustomContent visible</CheckBox>
				<CheckBox bind:checked={paneFooterVisible8}>PaneFooter visible</CheckBox>
				<p class="options-label winui-BodyTextBlockStyle">PanePosition:</p>
				<RadioButton
					name="api-pane"
					value="left"
					group={mode8}
					onGroupChange={(value) => ((mode8 = value as typeof mode8), (paneOpen8 = true))}
					>Left</RadioButton
				>
				<RadioButton
					name="api-pane"
					value="top"
					group={mode8}
					onGroupChange={(value) => ((mode8 = value as typeof mode8), (paneOpen8 = false))}
					class="last-radio">Top</RadioButton
				>
				<CheckBox bind:checked={selectionFollowsFocus8}>Keyboard SelectionFollowsFocus</CheckBox>
				<CheckBox bind:checked={suppressItem2}>Selection of Menu Item2 suppressed</CheckBox>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.sample {
		display: flex;
		flex-direction: column;
	}
	/* Each example's TextBlock, Margin="0,0,0,12". */
	.intro {
		/* c1-allow: NavigationViewPage.xaml:66, :113, :149, :186, :222 and :266, Margin="0,0,0,12". */
		margin: 0 0 12px;
	}
	/* Height="460" on the first seven views, "540" with Margin "0,12,0,0" on the last. */
	:global(.nv-page-view) {
		/* c1-allow: NavigationViewPage.xaml:73, :120, :156, :193, :229, :273 and :367, Height="460". */
		height: 460px;
	}
	:global(.nv-page-view.nv-page-api) {
		/* c1-allow: NavigationViewPage.xaml:504, Height="540". */
		height: 540px;
		/* c1-allow: NavigationViewPage.xaml:505, Margin="0,12,0,0". */
		margin-top: 12px;
	}
	/* The RichTextBlock (:350-363): a LineBreak ends each of the first three paragraphs, a
	   blank line under each. */
	.rich {
		/* c1-allow: NavigationViewPage.xaml:350, Margin="0,0,0,15". */
		margin: 0 0 15px;
	}
	.rich p {
		margin: 0;
	}
	/* XAML advances a TextBlock's lines by the font's own ascent and descent, 18.621 at Body
	   (WD-018; ADR 0011's 1.330078125 of the 14px size), where CSS's normal line is 19; over
	   this paragraph's seven lines that drift reached three rows, past the point WD-018 names
	   for a local line height on the one element that needs it. The LineBreaks' blank lines are
	   one such line each. */
	.rich {
		/* c1-allow: WD-018's 18.621, XAML's line advance at the Body size. */
		line-height: 18.621px;
	}
	.rich p.broken {
		margin-bottom: 1lh;
	}
	.options-stack {
		display: flex;
		flex-direction: column;
	}
	/* "PanePosition:", "Header:" and "PaneTitle:", Margin="0,12,0,0" (:321, :450, :460, :476). */
	.options-label {
		/* c1-allow: NavigationViewPage.xaml:321, :450, :460 and :476, Margin="0,12,0,0". */
		margin: 12px 0 0;
	}
	/* The Top RadioButton's Margin="0,0,0,12" (:484). */
	.options-stack :global(.last-radio) {
		/* c1-allow: NavigationViewPage.xaml:484, Margin="0,0,0,12". */
		margin-bottom: 12px;
	}
	.pane-footer {
		display: flex;
		flex-direction: column;
	}
	.pane-footer[data-orientation='horizontal'] {
		flex-direction: row;
	}
	.footer-icon {
		font-family: var(--winui-SymbolThemeFontFamily);
	}

	/* The page's own NavigationViewExpandedPaneBackground (NavigationViewPage.xaml:27-52), an
	   AcrylicBrush drawn as its FallbackColor (WD-039, a brush a page declares): #F2F2F2 in
	   light and #1F1F1F in dark, and no override in high contrast, whose dictionary does not
	   set it. */
	:global(:root:not([data-theme='high-contrast'])) :global(.nv-page-view) {
		/* c1-allow: NavigationViewPage.xaml:35, FallbackColor="#F2F2F2". */
		--winui-NavigationViewExpandedPaneBackground: #f2f2f2;
	}
	:global(:root[data-theme='dark']) :global(.nv-page-view) {
		/* c1-allow: NavigationViewPage.xaml:43, FallbackColor="#1F1F1F". */
		--winui-NavigationViewExpandedPaneBackground: #1f1f1f;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light']):not([data-theme='high-contrast']))
			:global(.nv-page-view) {
			/* c1-allow: NavigationViewPage.xaml:43, FallbackColor="#1F1F1F". */
			--winui-NavigationViewExpandedPaneBackground: #1f1f1f;
		}
	}
</style>
