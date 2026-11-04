<script lang="ts">
	import { Button, Image, TextBox, ToggleSwitch } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/system/clipboard');
	if (item === null) throw new Error('Clipboard page has no Gallery item');

	const copyTextSample = sampleOf('Clipboard/CopyTextClipboard.txt');
	const pasteTextSample = sampleOf('Clipboard/PasteTextClipboard.txt');
	const copyPasteImageSample = sampleOf('Clipboard/ClipboardCopyPasteImage.txt');
	const copyPasteFilesSample = sampleOf('Clipboard/ClipboardCopyPasteFiles.txt');
	const historyRoamingSample = sampleOf('Clipboard/ClipboardHistoryRoamingOptions.txt');
	const otherOperationsSample = sampleOf('Clipboard/OtherClipboardOperations.txt');

	// ClipboardPage.xaml.cs:26 — the constructor supplies this TextBox's resting text.
	let editorText = $state('This text will be copied to the clipboard.');
	let optionsText = $state('Text with clipboard options');
	let allowHistory = $state(true);
	let allowRoaming = $state(true);
	let monitorContentChanged = $state(false);
</script>

<ItemPage {item}>
	<!-- Every example's StackPanel sets VerticalAlignment="Top" — ClipboardPage.xaml:25, :49,
	     :75, :112, :131 and :168 — which opts out of the example pane's default centring.
	     ControlExample reads that as `data-vertical-alignment` on the sample's own root. -->
	<!-- WD-067: CopyText_Click (:30), PasteText_Click (:59), CopyImage_Click (:77), PasteImage_Click
	     (:101), CopyFiles_Click (:139), PasteFiles_Click (:174), CopyWithOptions_Click (:219),
	     ShowFormats_Click (:271), and ClearClipboard_Click (:292) cannot use Clipboard at this origin. -->
	<ControlExample
		headerText={copyTextSample.header ?? undefined}
		xaml={copyTextSample.xaml ?? undefined}
		csharp={copyTextSample.csharp ?? undefined}
	>
		<!-- ClipboardPage.xaml:21, :25 — neither StackPanel sets Spacing, so the only gap above
		     the editor is the Button's own Margin="0,0,0,10" at :28. -->
		<div class="column no-gap" data-vertical-alignment="top">
			<Button style="margin-bottom: 10px">Copy Text to the Clipboard</Button>
			<!-- WD-069: RichEditBox's and TextBox's default styles have the same resting visible
			     setters; the only visible template difference is TextBox's DeleteButton, collapsed
			     unless focused and non-empty. This TextBox therefore matches this resting editor. -->
			<TextBox bind:value={editorText} acceptsReturn style="width: 800px; height: 100px" />
			<!-- ClipboardPage.xaml:31-35, :188-201 — ConfirmationTextBlock is Collapsed until CopyText_Click. -->
		</div>
	</ControlExample>

	<ControlExample
		headerText={pasteTextSample.header ?? undefined}
		xaml={pasteTextSample.xaml ?? undefined}
		csharp={pasteTextSample.csharp ?? undefined}
	>
		<!-- ClipboardPage.xaml:49 — again no Spacing; the gap is the Button's Margin at :51. -->
		<div class="column no-gap" data-vertical-alignment="top">
			<Button style="margin-bottom: 10px">Paste Text from the Clipboard</Button>
			<!-- ClipboardPage.xaml:58 — Underline is an inline; roadmap item 17 owns its model. -->
			<p class="padded-paragraph winui-BodyTextBlockStyle"><u>Clipboard:</u></p>
			<p class="padded-paragraph winui-BodyTextBlockStyle">Click the button!</p>
		</div>
	</ControlExample>

	<ControlExample
		headerText={copyPasteImageSample.header ?? undefined}
		xaml={copyPasteImageSample.xaml ?? undefined}
		csharp={copyPasteImageSample.csharp ?? undefined}
	>
		<div class="column" data-vertical-alignment="top">
			<Image source="/rainier.jpg" stretch="uniformToFill" style="width: 200px; height: 150px" />
			<div class="row tight">
				<Button>Copy Image to Clipboard</Button><Button>Paste Image from Clipboard</Button>
			</div>
			<!-- ClipboardPage.xaml:92-104 — ImageStatusText and PastedImage are initially Collapsed. -->
		</div>
	</ControlExample>

	<ControlExample
		headerText={copyPasteFilesSample.header ?? undefined}
		xaml={copyPasteFilesSample.xaml ?? undefined}
		csharp={copyPasteFilesSample.csharp ?? undefined}
	>
		<div class="column" data-vertical-alignment="top">
			<div class="row tight">
				<Button>Copy Files to Clipboard</Button><Button>Paste Files from Clipboard</Button>
			</div>
			<span class="empty-line winui-BodyTextBlockStyle"></span>
		</div>
	</ControlExample>

	<ControlExample
		headerText={historyRoamingSample.header ?? undefined}
		xaml={historyRoamingSample.xaml ?? undefined}
		csharp={historyRoamingSample.csharp ?? undefined}
	>
		<div class="column" data-vertical-alignment="top">
			<TextBox
				bind:value={optionsText}
				placeholder="Enter text to copy with options"
				style="width: 400px"
			/>
			<div class="row switches">
				<ToggleSwitch header="Allow in History" bind:checked={allowHistory} /><ToggleSwitch
					header="Allow Roaming"
					bind:checked={allowRoaming}
				/>
			</div>
			<Button>Copy with Options</Button>
			<span class="empty-line winui-BodyTextBlockStyle"></span>
			<!-- WD-068: UpdateHistoryRoamingStatus (ClipboardPage.xaml.cs:256-269) leaves both
			     TextBlocks empty when its unavailable-API catch runs. The guest has the API and
			     shows disabled strings; this origin cannot take that reading, so its empty boxes remain. -->
			<div class="row switches">
				<span class="empty-line winui-BodyTextBlockStyle"></span><span
					class="empty-line winui-BodyTextBlockStyle"
				></span>
			</div>
		</div>
	</ControlExample>

	<ControlExample
		headerText={otherOperationsSample.header ?? undefined}
		xaml={otherOperationsSample.xaml ?? undefined}
		csharp={otherOperationsSample.csharp ?? undefined}
	>
		<div class="column" data-vertical-alignment="top">
			<div class="row tight">
				<Button>Show Clipboard Formats</Button><Button>Clear Clipboard</Button>
			</div>
			<!-- WD-068: ContentChangedToggle_Toggled (ClipboardPage.xaml.cs:305) has no web analogue. -->
			<ToggleSwitch header="Monitor ContentChanged" bind:checked={monitorContentChanged} />
			<span class="empty-line winui-BodyTextBlockStyle"></span>
		</div>
	</ControlExample>
</ItemPage>

<style>
	.column {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
	}
	.no-gap {
		gap: 0;
	}
	.row {
		display: flex;
		align-items: flex-start;
	}
	.tight {
		gap: 8px;
	}
	.switches {
		gap: 16px;
	}
	/* ClipboardPage.xaml:58, :64 — XAML is left, top, right, bottom; CSS is top, right, bottom, left. */
	.padded-paragraph {
		margin: 0;
		padding: 5px 0 0 5px;
	}
	/* ClipboardPage.xaml:121-123, :154-159, :182-184 — an empty XAML TextBlock still occupies a
	   line box, and an empty HTML element does not, so the five empty status lines on this page
	   would each collapse to nothing and pull everything below them up. The inline-block after
	   is what generates the line box; it takes its height from the ramp, which is the point.

	   It takes no `line-height` of its own. `BaseTextBlockStyle`
	   (microsoft-ui-xaml/controls/dev/CommonStyles/TextBlock_themeresources.xaml:10-18) sets
	   none either — it sets `LineStackingStrategy="MaxHeight"` and `TextLineBounds="Full"`,
	   which is "take the line height from the font" — so the generated ramp's `normal` is the
	   faithful value and any number written here would be one this library invented. Measured
	   on the reference guest at the reference width: a filled body paragraph is 19px tall and
	   so is each of these, which is the equality XAML has and a hardcoded 20 would break. */
	.empty-line::after {
		content: '';
		display: inline-block;
	}
</style>
