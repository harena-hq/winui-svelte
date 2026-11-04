<script lang="ts">
	import {
		AutoSuggestBox,
		Button,
		CheckBox,
		ContentDialog,
		TextBox
	} from '@harena-hq/winui-svelte/preview';

	/*
	 * Enter and Escape in a `ContentDialog` — `ProcessLayoutRootKey`
	 * (`ContentDialog_Partial.cpp:1736`).
	 *
	 * **Nothing photographs this page.** `content-dialog-keys.spec.ts` opens each dialog, presses
	 * a key and reads `#log`, which records every callback in the order it ran. The first two are
	 * the Gallery's own pair (`ContentDialogPage.xaml.cs`): three buttons and a CheckBox, with and
	 * without a default button. The last holds two text fields, for what takes Enter before the
	 * dialog does: an IME composition, and an `AutoSuggestBox`'s query.
	 */
	let which = $state<string | null>(null);
	let log = $state<string[]>([]);
	const note = (entry: string) => () => (log = [...log, entry]);
	const opener = (name: string) => () => {
		log = [];
		which = name;
	};
	const bind = (name: string) => ({
		open: which === name,
		onOpenChange: (open: boolean) => {
			log = [...log, `open:${open}`];
			if (!open) which = null;
		},
		onPrimaryButtonClick: note('primary'),
		onSecondaryButtonClick: note('secondary'),
		onCloseButtonClick: note('close')
	});
</script>

<svelte:head><title>ContentDialog keys — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">ContentDialog — Enter and Escape</h1>

<div class="actions">
	<Button id="open-default" onclick={opener('default')}>Default</Button>
	<Button id="open-no-default" onclick={opener('no-default')}>No default</Button>
	<Button id="open-disabled-default" onclick={opener('disabled-default')}>Disabled default</Button>
	<Button id="open-no-close" onclick={opener('no-close')}>No close button</Button>
	<Button id="open-fields" onclick={opener('fields')}>Text fields</Button>
</div>
<pre class="log" id="log">{log.join(' ')}</pre>

<ContentDialog
	{...bind('default')}
	title="Save your work?"
	primaryButtonText="Save"
	secondaryButtonText="Don't Save"
	closeButtonText="Cancel"
	defaultButton="primary"
>
	<CheckBox>Upload your content to the cloud.</CheckBox>
</ContentDialog>

<ContentDialog
	{...bind('no-default')}
	title="Replace file?"
	primaryButtonText="Replace"
	secondaryButtonText="Keep"
	closeButtonText="Cancel"
>
	<CheckBox>Upload your content to the cloud.</CheckBox>
</ContentDialog>

<ContentDialog
	{...bind('disabled-default')}
	title="Disabled default"
	primaryButtonText="Save"
	closeButtonText="Cancel"
	defaultButton="primary"
	primaryButtonEnabled={false}
>
	<CheckBox>Upload your content to the cloud.</CheckBox>
</ContentDialog>

<ContentDialog {...bind('no-close')} title="No close button" primaryButtonText="OK">
	<CheckBox>Upload your content to the cloud.</CheckBox>
</ContentDialog>

<ContentDialog
	{...bind('fields')}
	title="Text fields"
	primaryButtonText="Save"
	closeButtonText="Cancel"
	defaultButton="primary"
>
	<TextBox id="field-text" placeholder="Name" />
	<AutoSuggestBox id="field-query" placeholder="Search" onQuerySubmitted={note('query')} />
</ContentDialog>

<style>
	.actions {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}

	.log {
		min-height: 2em;
		padding: 12px;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		color: var(--winui-TextFillColorSecondaryBrush);
		white-space: pre-wrap;
		/* c1-allow: a code face is categorical, not a themed value */
		font-family: monospace;
	}
</style>
