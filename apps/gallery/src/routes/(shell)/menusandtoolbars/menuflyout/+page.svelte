<script lang="ts">
	import {
		AppBarButton,
		Button,
		MenuFlyout,
		ToolTip,
		type MenuFlyoutEntry
	} from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/menusandtoolbars/menuflyout');
	if (item === null) throw new Error('MenuFlyout page has no Gallery item');
	const appBarSample = sampleOf('MenuFlyout/AppbarbuttonMenuflyout.txt');
	const toggleSample = sampleOf(
		'MenuFlyout/MenuflyoutTogglemenuflyoutitemsMenuflyoutseparator.txt'
	);
	const cascadingSample = sampleOf('MenuFlyout/MenuflyoutCascadingMenus.txt');
	const splitSample = sampleOf('MenuFlyout/MenuflyoutSplitmenuflyoutitems.txt');
	const iconsSample = sampleOf('MenuFlyout/MenuflyoutIcons.txt');
	const acceleratorsSample = sampleOf('MenuFlyout/MenuflyoutIconsKeyboardAccelerators.txt');
	const radioSample = sampleOf('MenuFlyout/MenuflyoutRadiomenuflyoutitems.txt');

	// MenuFlyoutPage.xaml:30-41. MenuFlyoutItem_Click writes the row's Tag
	// (MenuFlyoutPage.xaml.cs:16-35).
	const sortItems: MenuFlyoutEntry[] = [
		{ id: 'rating', text: 'By rating' },
		{ id: 'match', text: 'By match' },
		{ id: 'distance', text: 'By distance' }
	];
	let sortOutput = $state('');

	// MenuFlyoutPage.xaml:52-61, both toggles checked.
	const toggleItems: MenuFlyoutEntry[] = [
		{ id: 'reset', text: 'Reset' },
		{ separator: true },
		{ id: 'repeat', text: 'Repeat', toggle: true },
		{ id: 'shuffle', text: 'Shuffle', toggle: true }
	];
	let checked = $state(['repeat', 'shuffle']);

	// MenuFlyoutPage.xaml:74-83.
	const cascadingItems: MenuFlyoutEntry[] = [
		{ id: 'open', text: 'Open' },
		{
			id: 'send-to',
			text: 'Send to',
			items: [
				{ id: 'bluetooth', text: 'Bluetooth' },
				{ id: 'desktop', text: 'Desktop (shortcut)' },
				{
					id: 'compressed',
					text: 'Compressed file',
					items: [
						{ id: 'compress-email', text: 'Compress and email' },
						{ id: 'compress-7z', text: 'Compress to .7z' },
						{ id: 'compress-zip', text: 'Compress to .zip' }
					]
				}
			]
		}
	];

	// MenuFlyoutPage.xaml:93-110: the Save glyph E74E, and Symbol.Share's code point, E72D.
	// SplitMenuFlyoutItem_Click writes the invoked row's Text (MenuFlyoutPage.xaml.cs:42-48),
	// for a split row's own half as for the rows under it, as the reference guest showed.
	const splitItems: MenuFlyoutEntry[] = [
		{
			id: 'save',
			text: 'Save',
			split: true,
			glyph: 'E74E',
			items: [
				{ id: 'save-docx', text: 'Save as .docx' },
				{ id: 'save-pdf', text: 'Save as .pdf' },
				{ id: 'save-txt', text: 'Save as .txt' }
			]
		},
		{
			id: 'share',
			text: 'Share',
			split: true,
			glyph: 'E72D',
			items: [
				{ id: 'share-email', text: 'Share via email' },
				{ id: 'share-link', text: 'Share via link' }
			]
		}
	];
	let splitOutput = $state('');

	/** Every row's text by id, nested rows included. */
	function texts(entries: MenuFlyoutEntry[], into: Record<string, string> = {}) {
		for (const entry of entries) {
			if ('separator' in entry) continue;
			into[entry.id] = entry.text;
			if ('items' in entry) texts(entry.items, into);
		}
		return into;
	}
	const splitTexts = texts(splitItems);

	// MenuFlyoutPage.xaml:121-130: the Share glyph E72D, then Symbol.Copy and Symbol.Delete's
	// code points, E8C8 and E74D.
	const iconItems: MenuFlyoutEntry[] = [
		{ id: 'share', text: 'Share', glyph: 'E72D' },
		{ id: 'copy', text: 'Copy', glyph: 'E8C8' },
		{ id: 'delete', text: 'Delete', glyph: 'E74D' },
		{ separator: true },
		{ id: 'rename', text: 'Rename' },
		{ id: 'select', text: 'Select' }
	];

	// MenuFlyoutPage.xaml:143-169. Each KeyboardAccelerator is drawn as the text upstream
	// generates for it, and binds no key: the rows have no Click to raise. The Copy row's
	// FontFamily="Consolas" and the Delete row's "Segoe UI" are not carried, as a row takes no
	// font of its own here; library-gate.md's MenuFlyout row owes it. The example's own
	// FontFamily="Segoe UI" (:137) changes nothing on its button on the reference guest, whose
	// ink is the previous example's to the pixel. Its Loaded handler is empty
	// (MenuFlyoutPage.xaml.cs:37-40).
	const acceleratorItems: MenuFlyoutEntry[] = [
		{ id: 'share', text: 'Share', glyph: 'E72D', keyboardAcceleratorTextOverride: 'Ctrl+S' },
		{ id: 'copy', text: 'Copy', glyph: 'E8C8', keyboardAcceleratorTextOverride: 'Ctrl+C' },
		{ id: 'delete', text: 'Delete', glyph: 'E74D', keyboardAcceleratorTextOverride: 'Delete' },
		{ separator: true },
		{ id: 'rename', text: 'Rename' },
		{ id: 'select', text: 'Select' }
	];

	// MenuFlyoutPage.xaml:179-190, Portrait and Medium icons checked.
	const radioItems: MenuFlyoutEntry[] = [
		{ id: 'landscape', text: 'Landscape', groupName: 'OrientationGroup' },
		{ id: 'portrait', text: 'Portrait', groupName: 'OrientationGroup' },
		{ separator: true },
		{ id: 'small', text: 'Small icons', groupName: 'SizeGroup' },
		{ id: 'medium', text: 'Medium icons', groupName: 'SizeGroup' },
		{ id: 'large', text: 'Large icons', groupName: 'SizeGroup' }
	];
	let selected = $state<Record<string, string>>({
		OrientationGroup: 'portrait',
		SizeGroup: 'medium'
	});

	/**
	 * The Sort button is both a tooltip's trigger and a menu's, so it takes both sets of props.
	 * A handler both carry runs both, the tooltip's first; for anything else the menu's wins.
	 */
	function both(tip: Record<string, unknown>, menu: Record<string, unknown>) {
		const result: Record<string, unknown> = { ...tip, ...menu };
		for (const key of Object.keys(tip)) {
			const a = tip[key];
			const b = menu[key];
			if (key.startsWith('on') && typeof a === 'function' && typeof b === 'function') {
				result[key] = (...args: unknown[]) => {
					a(...args);
					b(...args);
				};
			}
		}
		return result;
	}
</script>

<ItemPage {item}>
	<ControlExample
		headerText={appBarSample.header ?? undefined}
		xaml={appBarSample.xaml ?? undefined}
	>
		<!-- MenuFlyoutPage.xaml:22-46: a horizontal StackPanel of the compact Sort button,
		     Symbol.Sort's code point E8CB, and the output TextBlock. -->
		<div class="row">
			<ToolTip content="Sort">
				{#snippet children(tip)}
					<MenuFlyout items={sortItems} onItemInvoked={(id) => (sortOutput = `Sort by: ${id}`)}>
						{#snippet children(menu)}
							<AppBarButton {...both(tip, menu)} glyph="E8CB" compact flyout aria-label="Sort" />
						{/snippet}
					</MenuFlyout>
				{/snippet}
			</ToolTip>
			<span class="output winui-BodyTextBlockStyle" data-output>{sortOutput}</span>
		</div>
	</ControlExample>

	<ControlExample
		headerText={toggleSample.header ?? undefined}
		xaml={toggleSample.xaml ?? undefined}
		substitutions={{
			// MenuFlyoutPage.xaml:65-68: each toggle's IsChecked, bound one way.
			RepeatToggle: checked.includes('repeat') ? 'True' : 'False',
			ShuffleToggle: checked.includes('shuffle') ? 'True' : 'False'
		}}
	>
		<MenuFlyout items={toggleItems} bind:checked>
			{#snippet children(props)}
				<Button {...props}>Options</Button>
			{/snippet}
		</MenuFlyout>
	</ControlExample>

	<ControlExample
		headerText={cascadingSample.header ?? undefined}
		xaml={cascadingSample.xaml ?? undefined}
	>
		<MenuFlyout items={cascadingItems}>
			{#snippet children(props)}
				<Button {...props}>File Options</Button>
			{/snippet}
		</MenuFlyout>
	</ControlExample>

	<ControlExample headerText={splitSample.header ?? undefined} xaml={splitSample.xaml ?? undefined}>
		<!-- MenuFlyoutPage.xaml:89-115: a horizontal StackPanel of the button and the output
		     TextBlock. -->
		<div class="row">
			<MenuFlyout
				items={splitItems}
				onItemInvoked={(id) => (splitOutput = `Clicked: ${splitTexts[id]}`)}
			>
				{#snippet children(props)}
					<Button {...props} class="launch">File Options</Button>
				{/snippet}
			</MenuFlyout>
			<span class="output winui-BodyTextBlockStyle" data-output>{splitOutput}</span>
		</div>
	</ControlExample>

	<ControlExample headerText={iconsSample.header ?? undefined} xaml={iconsSample.xaml ?? undefined}>
		<MenuFlyout items={iconItems}>
			{#snippet children(props)}
				<Button {...props}>Edit Options</Button>
			{/snippet}
		</MenuFlyout>
	</ControlExample>

	<ControlExample
		headerText={acceleratorsSample.header ?? undefined}
		xaml={acceleratorsSample.xaml ?? undefined}
	>
		<MenuFlyout items={acceleratorItems}>
			{#snippet children(props)}
				<Button {...props}>Edit Options</Button>
			{/snippet}
		</MenuFlyout>
	</ControlExample>

	<ControlExample headerText={radioSample.header ?? undefined} xaml={radioSample.xaml ?? undefined}>
		<MenuFlyout items={radioItems} bind:selected>
			{#snippet children(props)}
				<Button {...props}>Options</Button>
			{/snippet}
		</MenuFlyout>
	</ControlExample>
</ItemPage>

<style>
	/* A StackPanel with Orientation="Horizontal" and no Spacing. */
	.row {
		display: flex;
		align-items: stretch;
	}

	/* A Button's style centres it vertically (Button_themeresources.xaml:162); the TextBlock
	   stretches to the row and keeps its top margin. */
	.row > :global(.launch) {
		align-self: center;
	}

	/* The Gallery's OutputTextBlockStyle (Styles/TextBlock.xaml:3-8): BodyTextBlockStyle with
	   Margin="8,8,0,0". */
	.output {
		/* c1-allow: Styles/TextBlock.xaml:7, OutputTextBlockStyle's Margin="8,8,0,0". */
		margin: 8px 0 0 8px;
	}
</style>
