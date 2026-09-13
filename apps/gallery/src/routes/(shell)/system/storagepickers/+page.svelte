<script lang="ts">
	import {
		Border,
		Button,
		CheckBox,
		ComboBox,
		Image,
		InfoBar,
		NumberBox,
		TextBox,
		type ComboBoxItemData
	} from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/system/storagepickers');
	if (item === null) throw new Error('Storage pickers page has no Gallery item');

	const singleFileSample = sampleOf('StoragePickers/StoragePickersPickSingleFile.txt');
	const multipleFilesSample = sampleOf('StoragePickers/StoragePickersPickMultipleFiles.txt');
	const saveFileSample = sampleOf('StoragePickers/StoragePickersSaveFile.txt');
	const folderSample = sampleOf('StoragePickers/StoragePickersPickFolder.txt');
	const thumbnailSample = sampleOf('StoragePickers/StoragePickersFileThumbnail.txt');

	// StoragePickersPage.xaml.cs:18. Microsoft.Windows.Storage.Pickers.PickerLocationId, read
	// off the reference guest's own dropdown — no pinned checkout carries the enum. The Windows
	// App SDK's list is not the UWP one: it has no HomeGroup.
	const PICKER_LOCATION_IDS = [
		'DocumentsLibrary',
		'ComputerFolder',
		'Desktop',
		'Downloads',
		'MusicLibrary',
		'PicturesLibrary',
		'VideosLibrary',
		'Objects3D',
		'Unspecified'
	];
	// StoragePickersPage.xaml.cs:19. Microsoft.Windows.Storage.Pickers.PickerViewMode, same reading.
	const PICKER_VIEW_MODES = ['List', 'Thumbnail'];
	// StoragePickersPage.xaml.cs:20. Windows.Storage.FileProperties.ThumbnailMode, read from the
	// guest's own projection of Windows.Storage.winmd in value order 0..5.
	const THUMBNAIL_MODES = [
		'PicturesView',
		'VideosView',
		'MusicView',
		'DocumentsView',
		'ListView',
		'SingleItem'
	];
	const asItems = (values: string[]): ComboBoxItemData[] =>
		values.map((value) => ({ value, label: value }));
	const FILE_TYPES = [
		{ value: '*', label: 'All Files (*)' },
		{ value: '.txt', label: 'Text Files (*.txt)' },
		{ value: 'images', label: 'Images (*.jpg, *.png)' }
	];
	const LOCATION_ITEMS = asItems(PICKER_LOCATION_IDS);
	const VIEW_ITEMS = asItems(PICKER_VIEW_MODES);
	const THUMBNAIL_ITEMS = asItems(THUMBNAIL_MODES);
	const EXTENSION_ITEMS = asItems(['.txt', '.json', '.xml']);

	// StoragePickersPage.xaml.cs:137-145 — the converter behind the FileType substitution. The
	// XAML's `\r\n` is written here as `\n`: the sample panes join on newlines, and a carriage
	// return would show as one.
	function fileFilterFor(tag: string): string {
		if (tag === '.txt') return '\n\n        picker.FileTypeFilter.Add(".txt");';
		if (tag === 'images')
			return '\n\n        picker.FileTypeFilter.Add(".jpg");\n        picker.FileTypeFilter.Add(".png");';
		return '';
	}

	// StoragePickersPage.xaml.cs:196-212 — one converter per file-type checkbox.
	const fileTypeChoice = (checked: boolean, label: string, extension: string) =>
		checked
			? `\n        picker.FileTypeChoices.Add("${label}", new List<string>() { "${extension}" });\n`
			: '';

	let singleFileType = $state('*');
	let singleCommit = $state('Pick File');
	let singleLocation = $state(PICKER_LOCATION_IDS[0]);
	let singleView = $state(PICKER_VIEW_MODES[0]);
	let multipleFileType = $state('*');
	let multipleCommit = $state('Pick Files');
	let multipleLocation = $state(PICKER_LOCATION_IDS[0]);
	let multipleView = $state(PICKER_VIEW_MODES[0]);
	let fileContent = $state('Hello, WinUI!');
	let textFiles = $state(false);
	let jsonFiles = $state(false);
	let xmlFiles = $state(false);
	let defaultExtension = $state('.txt');
	let suggestedName = $state('NewDocument');
	let saveCommit = $state('Save File');
	let saveLocation = $state(PICKER_LOCATION_IDS[0]);
	let suggestedFolder = $state('');
	let folderCommit = $state('Pick Folder');
	let folderLocation = $state(PICKER_LOCATION_IDS[0]);
	let folderView = $state(PICKER_VIEW_MODES[0]);
	let thumbnailMode = $state(THUMBNAIL_MODES[0]);
	let requestedSize = $state(200);
	const FOLDER_GLYPH = String.fromCodePoint(0xf89a);
</script>

<ItemPage {item}>
	<!-- None of the five example panels sets VerticalAlignment — StoragePickersPage.xaml:26,
	     :56, :87, :138 and :164 — so XAML's default Stretch applies and the panel fills the
	     pane, stacking its children from the top. That is not the example pane's own default,
	     which centres a content-sized sample, so each root says Stretch through the attribute
	     ControlExample reads. Measured against the original: its buttons sit at the top of a
	     card the options pane makes tall, and centred ones sat 139px lower. -->
	<!-- WD-070: PickSingleFileButton_Click (:27), PickMultipleFilesButton_Click (:76), SaveFileButton_Click (:147), PickFolderButton_Click (:214), and SelectSuggestedFolderButton_Click (:313) cannot open pickers at this origin. -->
	<InfoBar open closable={false} style="margin-top: 8px">
		<p class="info-copy winui-BodyTextBlockStyle">
			The picker reopens in the <strong>last selected location and view</strong>. The
			<strong class="code-run">SuggestedStartLocation</strong>
			and <strong class="code-run">ViewMode</strong> are only applied the
			<strong>first time</strong> the picker is opened (for example, right after app installation or when
			no previous selection exists).
		</p>
	</InfoBar>

	<ControlExample
		headerText={singleFileSample.header ?? undefined}
		xaml={singleFileSample.xaml ?? undefined}
		csharp={singleFileSample.csharp ?? undefined}
		substitutions={{
			FileType: fileFilterFor(singleFileType),
			CommitButtonText: singleCommit,
			SuggestedStartLocation: singleLocation,
			ViewMode: singleView
		}}
	>
		<div class="column" data-vertical-alignment="stretch">
			<Button>Pick a single file</Button>
			<p class="plain winui-BodyTextBlockStyle">No file picked</p>
		</div>
		{#snippet options()}<div class="column">
				<ComboBox
					header="File type"
					items={FILE_TYPES}
					bind:value={singleFileType}
					style="width: 200px"
				/><TextBox
					header="Commit button text"
					placeholder="Open"
					bind:value={singleCommit}
				/><ComboBox
					header="Suggested start location"
					items={LOCATION_ITEMS}
					bind:value={singleLocation}
					style="width: 200px"
				/><ComboBox
					header="View mode"
					items={VIEW_ITEMS}
					bind:value={singleView}
					style="width: 200px"
				/>
			</div>{/snippet}
	</ControlExample>

	<ControlExample
		headerText={multipleFilesSample.header ?? undefined}
		xaml={multipleFilesSample.xaml ?? undefined}
		csharp={multipleFilesSample.csharp ?? undefined}
		substitutions={{
			FileType: fileFilterFor(multipleFileType),
			CommitButtonText: multipleCommit,
			SuggestedStartLocation: multipleLocation,
			ViewMode: multipleView
		}}
	>
		<div class="column" data-vertical-alignment="stretch">
			<Button>Pick multiple files</Button>
			<p class="plain winui-BodyTextBlockStyle">No files picked</p>
		</div>
		{#snippet options()}<div class="column">
				<ComboBox
					header="File type"
					items={FILE_TYPES}
					bind:value={multipleFileType}
					style="width: 200px"
				/><TextBox
					header="Commit button text"
					placeholder="Open"
					bind:value={multipleCommit}
				/><ComboBox
					header="Suggested start location"
					items={LOCATION_ITEMS}
					bind:value={multipleLocation}
					style="width: 200px"
				/><ComboBox
					header="View mode"
					items={VIEW_ITEMS}
					bind:value={multipleView}
					style="width: 200px"
				/>
			</div>{/snippet}
	</ControlExample>

	<ControlExample
		headerText={saveFileSample.header ?? undefined}
		xaml={saveFileSample.xaml ?? undefined}
		csharp={saveFileSample.csharp ?? undefined}
		substitutions={{
			TxtFileType: fileTypeChoice(textFiles, 'Text Files', '.txt'),
			JsonFileType: fileTypeChoice(jsonFiles, 'JSON Files', '.json'),
			XmlFileType: fileTypeChoice(xmlFiles, 'XML Files', '.xml'),
			DefaultFileExtension: defaultExtension,
			SuggestedFileName: suggestedName,
			CommitButtonText: saveCommit,
			SuggestedStartLocation: saveLocation,
			SuggestedFolder: suggestedFolder
		}}
	>
		<div class="column" data-vertical-alignment="stretch">
			<!-- StoragePickersPage.xaml:89 — spellcheck must be off so "WinUI" has no red underline. --><TextBox
				header="File content"
				acceptsReturn
				spellcheck={false}
				bind:value={fileContent}
				style="width: 500px; height: 200px"
			/><Button>Save a file</Button>
			<p class="plain winui-BodyTextBlockStyle">No file saved</p>
		</div>
		{#snippet options()}<div class="column">
				<p class="plain winui-BodyTextBlockStyle">File types:</p>
				<CheckBox bind:checked={textFiles}>Text Files (*.txt)</CheckBox><CheckBox
					bind:checked={jsonFiles}>JSON Files (*.json)</CheckBox
				><CheckBox bind:checked={xmlFiles}>XML Files (*.xml)</CheckBox><ComboBox
					header="Default extension"
					items={EXTENSION_ITEMS}
					bind:value={defaultExtension}
					style="width: 200px"
				/><TextBox header="Suggested file name" bind:value={suggestedName} /><TextBox
					header="Commit button text"
					placeholder="Save"
					bind:value={saveCommit}
				/><ComboBox
					header="Suggested start location"
					items={LOCATION_ITEMS}
					bind:value={saveLocation}
					style="width: 200px"
				/>
				<div class="folder-row">
					<!-- StoragePickersPage.xaml:114 — Foreground is the accent brush. A `color` on
					     the component's root does not reach the text: TextBox paints `.box` from
					     `TextControlForeground` and the input inherits from there, so the root's
					     value is overridden rather than inherited. The class is reached through
					     :global below because a class handed to a component carries no caller
					     scope hash. Only the resting rule is overridden — hover and focus keep
					     their own foregrounds, which is what upstream's VisualStates do too. -->
					<TextBox
						class="suggested-folder"
						header="Suggested folder "
						placeholder="Optional"
						readonly
						bind:value={suggestedFolder}
						style="width: 148px"
					/><Button aria-label="Select folder" title="Select folder" style="margin-left: 8px"
						><span class="folder-icon">{FOLDER_GLYPH}</span></Button
					>
				</div>
			</div>{/snippet}
	</ControlExample>

	<ControlExample
		headerText={folderSample.header ?? undefined}
		xaml={folderSample.xaml ?? undefined}
		csharp={folderSample.csharp ?? undefined}
		substitutions={{
			CommitButtonText: folderCommit,
			SuggestedStartLocation: folderLocation,
			ViewMode: folderView
		}}
	>
		<div class="column" data-vertical-alignment="stretch">
			<Button>Pick a folder</Button>
			<p class="plain winui-BodyTextBlockStyle">No folder picked</p>
		</div>
		{#snippet options()}<div class="column">
				<TextBox
					header="Commit button text"
					placeholder="Select Folder"
					bind:value={folderCommit}
				/><ComboBox
					header="Suggested start location"
					items={LOCATION_ITEMS}
					bind:value={folderLocation}
					style="width: 200px"
				/><ComboBox
					header="View mode"
					items={VIEW_ITEMS}
					bind:value={folderView}
					style="width: 200px"
				/>
			</div>{/snippet}
	</ControlExample>

	<ControlExample
		headerText={thumbnailSample.header ?? undefined}
		xaml={thumbnailSample.xaml ?? undefined}
		csharp={thumbnailSample.csharp ?? undefined}
	>
		<!-- WD-071: PickFileForThumbnailButton_Click (:243) and GetThumbnailAsync (:276) request a Windows shell thumbnail, which has no web analogue. -->
		<div class="thumbnail-example" data-vertical-alignment="stretch">
			<div class="column">
				<Button>Pick a file</Button>
				<p class="plain winui-BodyTextBlockStyle">No file picked</p>
			</div>
			<Border
				background="var(--winui-SubtleFillColorTertiaryBrush)"
				cornerRadius={4}
				style="width: 160px; height: 160px"
				><!-- StoragePickersPage.xaml:171 — source-less Image paints nothing; its automation name describes an image never loaded. --><Image
					stretch="uniform"
				/></Border
			>
		</div>
		{#snippet options()}<div class="column">
				<ComboBox
					header="Thumbnail mode"
					items={THUMBNAIL_ITEMS}
					bind:value={thumbnailMode}
					style="width: 200px"
				/><NumberBox
					header="Requested size (px)"
					bind:value={requestedSize}
					min={16}
					max={1024}
					spinButtonPlacementMode="inline"
					style="width: 200px"
				/>
			</div>{/snippet}
	</ControlExample>
</ItemPage>

<style>
	/* StoragePickersPage.xaml:12-22 — InfoBar's RichTextBlock has reversed XAML thickness. */
	.info-copy {
		margin: 12px 12px 12px 0;
		user-select: none;
	}
	.info-copy strong {
		/* c1-allow: StoragePickersPage.xaml:16 and :19 set FontWeight="SemiBold" on these Runs. */
		font-weight: 600;
	}
	.info-copy .code-run {
		/* c1-allow: StoragePickersPage.xaml:17-18 set FontFamily="Consolas" on these SemiBold Runs. */
		font-family: Consolas, monospace;
	}
	.column {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
	.plain {
		margin: 0;
	}
	.folder-row {
		display: flex;
		align-items: flex-end;
	}
	/* StoragePickersPage.xaml:116 — FontIcon Glyph="&#xF89A;" with no FontFamily, so it takes
	   SymbolThemeFontFamily, which is a token. */
	.folder-icon {
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: IconElement's own size, g_ClientCoreFontSize = 20.f at
		   dxaml/xcp/core/core/elements/icon.cpp:13, applied to FontIcon at :738. Measured on the
		   reference guest, the glyph's ink is 20 wide and 19 tall, which is that size. */
		font-size: 20px;
	}

	/* The resting foreground only; `.box` is TextBox's own painted surface and the input
	   inherits from it. */
	.folder-row :global(.suggested-folder .box) {
		color: var(--winui-AccentTextFillColorPrimaryBrush);
	}
	.thumbnail-example {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}
</style>
