<script lang="ts">
	import { Button, CheckBox, ContentDialog } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/dialogsandflyouts/contentdialog');
	if (item === null) throw new Error('ContentDialog page has no Gallery item');
	const basicSample = sampleOf('ContentDialog/BasicContentDialogContent.txt');
	const noDefaultSample = sampleOf('ContentDialog/ContentDialogWithoutDefault.txt');

	/**
	 * One example's dialog and the line it writes when the dialog closes
	 * (ContentDialogPage.xaml.cs:26-60 and :62-96). `ShowAsync` resolves to the button that
	 * closed the dialog, and to `None` for the close button and for Escape alike, which is the
	 * third line; here the button callbacks record which one ran, and a close with none recorded
	 * is that third case.
	 *
	 * Two of the code-behind's lines are not carried. `dialog.Style` (:32, :68) names the default
	 * style, which is the library's own. `dialog.RequestedTheme` (:40-44, :76-80) follows the
	 * example's theme, which here is always the app's, because the page header has no theme
	 * button (PageHeader.svelte says why).
	 */
	function example(primary: string, secondary: string, cancelled: string) {
		let open = $state(false);
		let result = $state('');
		let closedBy: 'primary' | 'secondary' | null = null;
		return {
			get open() {
				return open;
			},
			set open(next: boolean) {
				open = next;
			},
			get result() {
				return result;
			},
			show() {
				closedBy = null;
				open = true;
			},
			primary() {
				closedBy = 'primary';
			},
			secondary() {
				closedBy = 'secondary';
			},
			closed(next: boolean) {
				if (next) return;
				result =
					closedBy === 'primary' ? primary : closedBy === 'secondary' ? secondary : cancelled;
			}
		};
	}

	const basic = example(
		'User saved their work',
		'User did not save their work',
		'User cancelled the dialog'
	);
	const noDefault = example(
		'User replaced the file',
		'User kept the file',
		'User cancelled the dialog'
	);
</script>

<ItemPage {item}>
	<ControlExample
		headerText={basicSample.header ?? undefined}
		xaml={basicSample.xaml ?? undefined}
		csharp={basicSample.csharp ?? undefined}
	>
		<!-- ContentDialogPage.xaml:14-20: a horizontal StackPanel of the button and an output
		     TextBlock the code-behind writes the result into. -->
		<div class="row">
			<Button class="dialog-launch" onclick={basic.show}>Show dialog</Button>
			<!-- SetDialogResultText raises LiveRegionChanged on the TextBlock on every write
			     (ContentDialogPage.xaml.cs:19-24). A polite live region approximates it, and does not
			     announce a line written twice running, which the original does. -->
			<span class="output winui-BodyTextBlockStyle" aria-live="polite" data-dialog-result
				>{basic.result}</span
			>
		</div>
	</ControlExample>

	<ControlExample
		headerText={noDefaultSample.header ?? undefined}
		xaml={noDefaultSample.xaml ?? undefined}
		csharp={noDefaultSample.csharp ?? undefined}
	>
		<!-- ContentDialogPage.xaml:28-34. -->
		<div class="row">
			<Button class="dialog-launch" onclick={noDefault.show}
				>Show dialog without default button</Button
			>
			<span class="output winui-BodyTextBlockStyle" aria-live="polite" data-dialog-result
				>{noDefault.result}</span
			>
		</div>
	</ControlExample>
</ItemPage>

<!-- ContentDialogPage.xaml.cs:26-60. The dialog is a ContentDialogExample, whose content the
     code-behind replaces with a new ContentDialogContent on every show (ContentDialogPage.xaml.cs:38):
     a TextBlock and a CheckBox in a StackPanel (ContentDialogContent.xaml:6-10). -->
<ContentDialog
	bind:open={basic.open}
	onOpenChange={basic.closed}
	onPrimaryButtonClick={basic.primary}
	onSecondaryButtonClick={basic.secondary}
	title="Save your work?"
	primaryButtonText="Save"
	secondaryButtonText="Don't Save"
	closeButtonText="Cancel"
	defaultButton="primary"
>
	<p>Lorem ipsum dolor sit amet, adipisicing elit.</p>
	<CheckBox>Upload your content to the cloud.</CheckBox>
</ContentDialog>

<!-- ContentDialogPage.xaml.cs:62-96, the same class and content (:74). -->
<ContentDialog
	bind:open={noDefault.open}
	onOpenChange={noDefault.closed}
	onPrimaryButtonClick={noDefault.primary}
	onSecondaryButtonClick={noDefault.secondary}
	title="Replace file?"
	primaryButtonText="Replace"
	secondaryButtonText="Keep"
	closeButtonText="Cancel"
	defaultButton="none"
>
	<p>Lorem ipsum dolor sit amet, adipisicing elit.</p>
	<CheckBox>Upload your content to the cloud.</CheckBox>
</ContentDialog>

<style>
	/* A StackPanel with Orientation="Horizontal" and no Spacing. */
	.row {
		display: flex;
		align-items: stretch;
	}

	/* The Button's style centres it vertically (Button_themeresources.xaml:162); the TextBlock
	   stretches to the row and keeps its top margin. */
	.row > :global(.dialog-launch) {
		align-self: center;
	}

	/* The Gallery's OutputTextBlockStyle (Styles/TextBlock.xaml:3-8): BodyTextBlockStyle with
	   Margin="8,8,0,0". */
	.output {
		/* c1-allow: Styles/TextBlock.xaml:7, OutputTextBlockStyle's Margin="8,8,0,0". */
		margin: 8px 0 0 8px;
	}

	/* ContentDialogContent.xaml:6-10's StackPanel reserves no paragraph margins. */
	p {
		margin: 0;
	}
</style>
