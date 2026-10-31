<!--
	This page is the ContentDialog component's harness, not part of the Gallery reproduction.
	Exactly one dialog is open at a time because a ContentDialog is centred and covers the window;
	a second open dialog would cover the first and its smoke layer would hide the page.
-->
<script lang="ts">
	import { Button, CheckBox, ContentDialog } from 'winui-svelte/preview';

	let basicOpen = $state(true);
	let noDefaultOpen = $state(false);
	let twoOpen = $state(false);
	let oneOpen = $state(false);
	let textOnlyOpen = $state(false);
	let textNoDefaultOpen = $state(false);
	let textNoButtonsOpen = $state(false);
	let textDisabledDefaultOpen = $state(false);
	let tabOrderOpen = $state(false);
	let editableOpen = $state(false);
</script>

<h2 class="winui-SubtitleTextBlockStyle">basic</h2>
<ContentDialog
	bind:open={basicOpen}
	title="Save your work?"
	primaryButtonText="Save"
	secondaryButtonText="Don't Save"
	closeButtonText="Cancel"
	defaultButton="primary"
>
	<p>Lorem ipsum dolor sit amet, adipisicing elit.</p>
	<CheckBox>Upload your content to the cloud.</CheckBox>
</ContentDialog>

<div class="row">
	<Button onclick={() => (noDefaultOpen = true)}>Open no default</Button>
	<Button onclick={() => (twoOpen = true)}>Open two buttons</Button>
	<Button onclick={() => (oneOpen = true)}>Open one button</Button>
	<Button onclick={() => (textOnlyOpen = true)}>Open text only</Button>
	<Button onclick={() => (textNoDefaultOpen = true)}>Open text no default</Button>
	<Button onclick={() => (textNoButtonsOpen = true)}>Open text no buttons</Button>
	<Button onclick={() => (textDisabledDefaultOpen = true)}>Open text disabled default</Button>
	<Button onclick={() => (tabOrderOpen = true)}>Open tab order</Button>
	<Button onclick={() => (editableOpen = true)}>Open editable</Button>
</div>

<ContentDialog
	bind:open={noDefaultOpen}
	title="Replace file?"
	primaryButtonText="Replace"
	secondaryButtonText="Keep"
	closeButtonText="Cancel"
	defaultButton="none"
>
	<p>Lorem ipsum dolor sit amet, adipisicing elit.</p>
	<CheckBox>Upload your content to the cloud.</CheckBox>
</ContentDialog>

<ContentDialog
	bind:open={twoOpen}
	title="Two buttons"
	primaryButtonText="OK"
	closeButtonText="Cancel"
	defaultButton="primary"
>
	<p>Lorem ipsum dolor sit amet, adipisicing elit.</p>
	<CheckBox>Upload your content to the cloud.</CheckBox>
</ContentDialog>

<ContentDialog bind:open={oneOpen} title="One button" closeButtonText="Close" defaultButton="close">
	<p>Lorem ipsum dolor sit amet, adipisicing elit.</p>
	<CheckBox>Upload your content to the cloud.</CheckBox>
</ContentDialog>

<!-- The four dialogs above all put a CheckBox in the content, which is the only step of
     `SetInitialFocusElement` they can reach — the same blind spot as the Gallery's own two
     examples. These three are the other three branches: content that takes no focus and a
     default button, the same with `defaultButton="none"` so the first command button answers,
     and a dialog with neither, where this library focuses the card and WinUI focuses nothing. -->
<ContentDialog
	bind:open={textOnlyOpen}
	title="Text only"
	primaryButtonText="Replace"
	secondaryButtonText="Keep"
	closeButtonText="Cancel"
	defaultButton="secondary"
>
	<p>Lorem ipsum dolor sit amet, adipisicing elit.</p>
</ContentDialog>

<ContentDialog
	bind:open={textNoDefaultOpen}
	title="Text no default"
	primaryButtonText="Replace"
	secondaryButtonText="Keep"
	closeButtonText="Cancel"
	defaultButton="none"
>
	<p>Lorem ipsum dolor sit amet, adipisicing elit.</p>
</ContentDialog>

<ContentDialog bind:open={textNoButtonsOpen} title="Text no buttons">
	<p>Lorem ipsum dolor sit amet, adipisicing elit.</p>
</ContentDialog>

<!-- An editable region is a tab stop that says so through no attribute at all, and Chromium
     reports `tabIndex` −1 for it. It is the one element the property test gets wrong, so it is the
     one that needs a specimen: with nothing else focusable in the content, this dialog reaches the
     command row unless the editable is recognised. -->
<ContentDialog bind:open={editableOpen} title="Editable" closeButtonText="Close">
	<p contenteditable="true">Lorem ipsum dolor sit amet, adipisicing elit.</p>
</ContentDialog>

<!-- The content slot is the consumer's, and a positive `tabindex` in it reorders focus without
     moving the element. XAML orders by `TabIndex` too, so the first focusable element of this
     content is the button below the CheckBox and not the CheckBox. Nothing in the library emits a
     positive index, which is why the specimen has to be written by hand here. -->
<ContentDialog bind:open={tabOrderOpen} title="Tab order" closeButtonText="Close">
	<p>Lorem ipsum dolor sit amet, adipisicing elit.</p>
	<CheckBox>Upload your content to the cloud.</CheckBox>
	<!-- svelte-ignore a11y_positive_tabindex -->
	<button type="button" tabindex="1">Later in the document, first in the order</button>
</ContentDialog>

<!-- The default button is the one step that can be refused rather than absent: WinUI asks it for
     focus and a disabled button declines, which is what sends the search on to the command row.
     Nothing else on this route makes that happen. -->
<ContentDialog
	bind:open={textDisabledDefaultOpen}
	title="Text disabled default"
	primaryButtonText="Replace"
	primaryButtonEnabled={false}
	secondaryButtonText="Keep"
	closeButtonText="Cancel"
	defaultButton="primary"
>
	<p>Lorem ipsum dolor sit amet, adipisicing elit.</p>
</ContentDialog>

<style>
	.row {
		display: flex;
		gap: 12px;
		align-items: center;
		flex-wrap: wrap;
	}

	/* ContentDialogContent.xaml's StackPanel does not reserve paragraph margins. Scoped, not
	   `:global`: a `:global(p)` here is a rule on every page in the app, and these paragraphs
	   are written in this component's own markup, so the scoping class reaches them. */
	p {
		margin: 0;
	}
</style>
