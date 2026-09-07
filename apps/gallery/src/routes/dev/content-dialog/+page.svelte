<!--
	This page is the ContentDialog component's harness, not part of the Gallery reproduction.
	Exactly one dialog is open at a time because a ContentDialog is centred and covers the window;
	a second open dialog would cover the first and its smoke layer would hide the page.
-->
<script lang="ts">
	import { Button, CheckBox, ContentDialog } from 'winui-svelte';

	let basicOpen = $state(true);
	let noDefaultOpen = $state(false);
	let twoOpen = $state(false);
	let oneOpen = $state(false);
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
